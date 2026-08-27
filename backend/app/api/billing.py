from fastapi import APIRouter, Depends, HTTPException, Request
from app.core.auth import get_current_user, get_user_id
from app.core.config import settings
from app.core.analytics import track_event
from app.schemas.models import (
    CheckoutResponse,
    SubscriptionResponse,
    UsageResponse,
    CustomerPortalResponse,
)
from supabase import create_client
from polar_sdk import Polar
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["billing"])

PLAN_LIMITS = {"free": 2, "pro": 50, "business": 250}


def get_supabase():
    return create_client(settings.supabase_url, settings.supabase_service_key)


def get_polar_client() -> Polar:
    return Polar(
        access_token=settings.polar_access_token,
        server=settings.polar_env,
    )


def _determine_plan(product_id: str) -> str:
    if product_id == settings.polar_business_id:
        return "business"
    if product_id in (settings.polar_pro_monthly_id, settings.polar_pro_yearly_id):
        return "pro"
    return "pro"


@router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout(
    request: Request,
    user: dict = Depends(get_current_user),
):
    body = await request.json()
    product_id = body.get("product_id")
    no_email = body.get("no_email", False)

    if not product_id:
        raise HTTPException(status_code=400, detail="product_id is required")

    if product_id not in (
        settings.polar_pro_monthly_id,
        settings.polar_pro_yearly_id,
        settings.polar_business_id,
    ):
        raise HTTPException(status_code=400, detail="Invalid product_id")

    user_id = get_user_id(user)
    user_email = user.get("email", "")

    polar = get_polar_client()

    checkout_params = {
        "products": [product_id],
        "success_url": f"{settings.frontend_url}/dashboard/billing?checkout=success",
        "metadata": {"user_id": user_id},
    }
    if not no_email:
        checkout_params["customer_email"] = user_email
        checkout_params["external_customer_id"] = user_id

    try:
        checkout = polar.checkouts.create(request=checkout_params)

        await track_event("checkout_created", user_id, {
            "product_id": product_id,
            "checkout_id": checkout.id,
        })

        return {"url": checkout.url, "checkout_id": checkout.id}

    except Exception as e:
        logger.error(f"Checkout creation failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to create checkout session")


@router.get("/subscription", response_model=SubscriptionResponse)
async def get_subscription(user: dict = Depends(get_current_user)):
    user_id = get_user_id(user)
    sb = get_supabase()

    resp = sb.table("subscriptions").select("*").eq(
        "user_id", user_id
    ).execute()
    rows = resp.data or []

    if not rows:
        return {
            "plan": "free",
            "status": "active",
            "billing_interval": None,
            "current_period_end": None,
            "cancel_at_period_end": False,
        }

    data = rows[0]
    return {
        "plan": data.get("plan", "free"),
        "status": data.get("status", "active"),
        "billing_interval": data.get("billing_interval"),
        "current_period_end": data.get("current_period_end"),
        "cancel_at_period_end": data.get("cancel_at_period_end", False),
        "polar_subscription_id": data.get("polar_subscription_id"),
    }


@router.get("/usage", response_model=UsageResponse)
async def get_usage(user: dict = Depends(get_current_user)):
    user_id = get_user_id(user)
    sb = get_supabase()

    sub_resp = sb.table("subscriptions").select("plan").eq(
        "user_id", user_id
    ).execute()
    plan = ((sub_resp.data or [{}])[0]).get("plan", "free")

    from datetime import date
    today = date.today().replace(day=1).isoformat()

    usage_resp = sb.table("usage").select("analysis_count").eq(
        "user_id", user_id
    ).eq("period_start", today).execute()

    count = ((usage_resp.data or [{}])[0]).get("analysis_count", 0)
    limit = PLAN_LIMITS.get(plan, 2)

    return {
        "usage_count": count,
        "limit": limit,
        "plan": plan,
        "remaining": max(0, limit - count),
    }


@router.post("/customer-portal", response_model=CustomerPortalResponse)
async def create_customer_portal(
    user: dict = Depends(get_current_user),
):
    user_id = get_user_id(user)
    polar = get_polar_client()

    try:
        customer_session = polar.customer_sessions.create(request={
            "external_customer_id": user_id,
        })

        return {"url": customer_session.customer_portal_url}

    except Exception as e:
        logger.error(f"Customer portal creation failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to create portal session")


@router.post("/checkout/validate")
async def validate_checkout_status(
    request: Request,
    user: dict = Depends(get_current_user),
):
    body = await request.json()
    checkout_id = body.get("checkout_id")

    if not checkout_id:
        raise HTTPException(status_code=400, detail="checkout_id is required")

    polar = get_polar_client()

    try:
        checkout = polar.checkouts.get(id=checkout_id)

        if checkout.status == "succeeded":
            return {
                "status": "succeeded",
                "message": "Payment confirmed. Your plan will be updated shortly via webhook.",
            }
        elif checkout.status == "open":
            return {"status": "open", "message": "Payment is still pending."}
        else:
            return {"status": checkout.status, "message": f"Checkout status: {checkout.status}"}

    except Exception as e:
        logger.error(f"Checkout validation failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to validate checkout")
