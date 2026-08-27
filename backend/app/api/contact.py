from fastapi import APIRouter, Depends, HTTPException, Request
from app.core.auth import get_current_user, get_user_id
from app.schemas.models import ContactFormRequest
from supabase import create_client
from app.core.config import settings

router = APIRouter(prefix="/api", tags=["contact"])


def get_supabase():
    return create_client(settings.supabase_url, settings.supabase_service_key)


@router.post("/contact")
async def submit_contact(data: ContactFormRequest):
    sb = get_supabase()

    sb.table("contact_submissions").insert({
        "name": data.name,
        "email": data.email,
        "message": data.message,
    }).execute()

    return {"status": "submitted"}
