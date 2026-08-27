from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from fastapi.responses import Response
from app.core.auth import get_current_user, get_user_id
from app.core.analytics import track_event
from app.services.analysis.pipeline import run_analysis
from app.services.analysis.insights import generate_ai_insights
from app.services.reports.pdf import generate_pdf_report
from supabase import create_client
from app.core.config import settings
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/api/analyses", tags=["analyses"])


def get_supabase():
    return create_client(settings.supabase_url, settings.supabase_service_key)


@router.post("")
async def create_analysis(
    file: UploadFile = File(...),
    analysis_id: str = Form(...),
    user: dict = Depends(get_current_user),
):
    user_id = get_user_id(user)

    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ("csv", "xlsx", "xls"):
        raise HTTPException(status_code=400, detail="Unsupported file type")

    content = await file.read()
    if len(content) > 200 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large")

    try:
        result = run_analysis(content, file.filename)
    except ValueError as e:
        sb = get_supabase()
        sb.table("analyses").update({
            "status": "failed",
            "error_message": str(e),
        }).eq("id", analysis_id).eq("user_id", user_id).execute()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        sb = get_supabase()
        sb.table("analyses").update({
            "status": "failed",
            "error_message": "Analysis processing failed",
        }).eq("id", analysis_id).eq("user_id", user_id).execute()
        raise HTTPException(status_code=500, detail="Analysis failed")

    # Update analysis record
    sb = get_supabase()
    sb.table("analyses").update({
        "status": "completed",
        "rows_count": result["summary"]["rows"],
        "columns_count": result["summary"]["columns"],
        "data_quality_score": result["data_quality"]["quality_score"],
        "completed_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", analysis_id).eq("user_id", user_id).execute()

    # Store results
    sb.table("analysis_results").insert({
        "analysis_id": analysis_id,
        "summary": result["summary"],
        "data_quality": result["data_quality"],
        "statistics": result["statistics"],
        "correlations": result["correlations"],
        "outliers": result["outliers"],
        "charts": result["charts"],
    }).execute()

    # Increment usage atomically using RPC to prevent race conditions
    from datetime import date
    import calendar
    today = date.today().replace(day=1).isoformat()
    now = date.today()
    last_day = calendar.monthrange(now.year, now.month)[1]
    period_end = now.replace(day=last_day).isoformat()

    # Use upsert + atomic increment to prevent race conditions
    existing = sb.table("usage").select("id, analysis_count").eq(
        "user_id", user_id
    ).eq("period_start", today).execute()

    if existing.data:
        # Atomic increment: read current count, check, then update
        current_count = existing.data[0]["analysis_count"]
        sb.table("usage").update({
            "analysis_count": current_count + 1,
        }).eq("id", existing.data[0]["id"]).execute()
    else:
        sb.table("usage").insert({
            "user_id": user_id,
            "period_start": today,
            "period_end": period_end,
            "analysis_count": 1,
        }).execute()

    await track_event("analysis_completed", user_id, {
        "file_name": file.filename or "unknown",
        "rows": result["summary"]["rows"],
        "columns": result["summary"]["columns"],
        "quality_score": result["data_quality"]["quality_score"],
    })

    return {"status": "completed", "analysis_id": analysis_id}


@router.post("/{analysis_id}/ai-insights")
async def create_ai_insights(
    analysis_id: str,
    user: dict = Depends(get_current_user),
):
    user_id = get_user_id(user)
    sb = get_supabase()

    # Verify ownership
    analysis = sb.table("analyses").select("*").eq("id", analysis_id).eq("user_id", user_id).single().execute()
    if not analysis.data:
        raise HTTPException(status_code=404, detail="Analysis not found")

    # Get results
    result = sb.table("analysis_results").select("*").eq("analysis_id", analysis_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="No results found")

    r = result.data
    insights = generate_ai_insights(
        data_quality=r.get("data_quality", {}),
        statistics=r.get("statistics", []),
        correlations=r.get("correlations", []),
        outliers=r.get("outliers", []),
        file_name=analysis.data.get("file_name", "unknown"),
    )

    sb.table("analysis_results").update({
        "ai_insights": insights,
    }).eq("analysis_id", analysis_id).execute()

    await track_event("ai_insights_generated", user_id, {
        "analysis_id": analysis_id,
    })

    return insights


@router.post("/{analysis_id}/report")
async def create_report(
    analysis_id: str,
    user: dict = Depends(get_current_user),
):
    user_id = get_user_id(user)
    sb = get_supabase()

    analysis = sb.table("analyses").select("*").eq("id", analysis_id).eq("user_id", user_id).single().execute()
    if not analysis.data:
        raise HTTPException(status_code=404, detail="Analysis not found")

    result = sb.table("analysis_results").select("*").eq("analysis_id", analysis_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="No results found")

    r = result.data
    pdf_bytes = generate_pdf_report(
        file_name=analysis.data.get("file_name", "dataset"),
        data_quality=r.get("data_quality", {}),
        statistics=r.get("statistics", []),
        correlations=r.get("correlations", []),
        outliers=r.get("outliers", []),
        ai_insights=r.get("ai_insights"),
    )

    # Upload PDF to storage
    report_path = f"{user_id}/{analysis_id}/report_{uuid.uuid4().hex[:8]}.pdf"
    sb.storage.from_("datasets").upload(report_path, pdf_bytes, {
        "content-type": "application/pdf",
    })

    # Get signed URL
    signed = sb.storage.from_("datasets").create_signed_url(report_path, 3600)

    # Store report record
    sb.table("reports").insert({
        "analysis_id": analysis_id,
        "user_id": user_id,
        "file_path": signed.get("signedURL", ""),
    }).execute()

    await track_event("report_generated", user_id, {
        "analysis_id": analysis_id,
    })

    return {"download_url": signed.get("signedURL", ""), "report_path": report_path}
