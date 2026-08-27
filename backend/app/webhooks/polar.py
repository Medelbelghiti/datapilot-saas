from fastapi import APIRouter, Request, HTTPException
from app.core.config import settings
from app.core.analytics import track_event
from supabase import create_client
from standardwebhooks.webhooks import Webhook, WebhookVerificationError
import json
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])


def get_supabase():
    return create_client(settings.supabase_url, settings.supabase_service_key)


def _determine_plan(product_id: str) -> str:
    if product_id == settings.polar_business_id:
        return "business"
    if product_id in (settings.polar_pro_monthly_id, settings.polar_pro_yearly_id):
        return "pro"
    return "pro"


@router.post("/polar")
async def polar_webhook(request: Request):
    body = await request.body()

    try:
        raw_payload = json.loads(body)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    raw_headers = {k.lower(): v for k, v in request.headers.items()}
    required_headers = ("webhook-id", "webhook-timestamp", "webhook-signature")
    headers = {k: raw_headers[k] for k in required_headers if k in raw_headers}

    crypto_secret = settings.polar_webhook_secret or ""

    webhook = Webhook(crypto_secret)

    try:
        data = webhook.verify(body, headers)
    except WebhookVerificationError:
        logger.warning("Invalid webhook signature")
        raise HTTPException(status_code=403, detail="Invalid signature")

    event_type = (data or {}).get("type", "")
    event_id = raw_payload.get("id", headers.get("webhook-id", ""))
    polar_data = (data or {}).get("data")

    logger.info(f"Polar webhook received: {event_type} (event_id={event_id})")

    sb = get_supabase()

    existing = sb.table("webhook_events").select("id").eq(
        "provider", "polar"
    ).eq("event_id", event_id).execute()

    if existing.data:
        logger.info(f"Duplicate event {event_id}, skipping")
        return {"status": "already_processed"}

    sb.table("webhook_events").insert({
        "provider": "polar",
        "event_id": event_id,
        "event_type": event_type,
        "payload": raw_payload,
        "processed": True,
    }).execute()

    try:
        from types import SimpleNamespace as _NS
        ns = _NS(**polar_data) if isinstance(polar_data, dict) else polar_data
        _process_event(sb, event_type, ns)
    except Exception as e:
        logger.error(f"Error processing webhook {event_type}: {e}")
        sb.table("webhook_events").update({
            "processed": False,
        }).eq("provider", "polar").eq("event_id", event_id).execute()
        raise

    return {"status": "ok"}


def _process_event(sb, event_type: str, data):
    if event_type in (
        "subscription.created",
        "subscription.updated",
        "subscription.active",
        "subscription.renewed",
    ):
        _handle_subscription_active(sb, data)

    elif event_type == "subscription.canceled":
        _handle_subscription_canceled(sb, data)

    elif event_type == "subscription.uncanceled":
        _handle_subscription_uncanceled(sb, data)

    elif event_type == "subscription.expired":
        _handle_subscription_expired(sb, data)

    elif event_type == "subscription.revoked":
        _handle_subscription_revoked(sb, data)

    elif event_type == "customer.created":
        _handle_customer_created(sb, data)

    else:
        logger.info(f"Unhandled event type: {event_type}")


def _resolve_user_id(sb, sub) -> str | None:
    metadata = getattr(sub, "metadata", None) or {}
    user_id = metadata.get("user_id") if isinstance(metadata, dict) else None

    if user_id:
        existing = sb.table("subscriptions").select("user_id").eq(
            "user_id", user_id
        ).execute()
        if existing.data:
            return user_id

    polar_customer_id = getattr(sub, "customer_id", None)
    if polar_customer_id:
        existing = sb.table("subscriptions").select("user_id").eq(
            "polar_customer_id", polar_customer_id
        ).execute()
        rows = existing.data or []
        if rows:
            return rows[0]["user_id"]

    return None


def _handle_subscription_active(sb, sub):
    customer_id = getattr(sub, "customer_id", "")
    subscription_id = getattr(sub, "id", "")
    product_id = getattr(sub, "product_id", "")
    status = getattr(sub, "status", "active")
    billing_interval = getattr(sub, "recurring_interval", None) or "monthly"
    period_start = getattr(sub, "current_period_start", None)
    period_end = getattr(sub, "current_period_end", None)
    cancel_at_period_end = getattr(sub, "cancel_at_period_end", False)

    plan = _determine_plan(product_id)

    user_id = _resolve_user_id(sb, sub)

    if not user_id:
        logger.warning(f"Could not resolve user_id for subscription {subscription_id}")
        return

    sb.table("subscriptions").upsert({
        "user_id": user_id,
        "polar_customer_id": customer_id,
        "polar_subscription_id": subscription_id,
        "polar_product_id": product_id,
        "plan": plan,
        "status": status,
        "billing_interval": billing_interval,
        "current_period_start": period_start,
        "current_period_end": period_end,
        "cancel_at_period_end": cancel_at_period_end,
    }, on_conflict="user_id").execute()

    track_event("subscription_activated", user_id, {
        "plan": plan,
        "subscription_id": subscription_id,
    })

    logger.info(f"Subscription activated for user {user_id}: plan={plan}")


def _handle_subscription_canceled(sb, sub):
    subscription_id = getattr(sub, "id", "")
    cancel_at_period_end = getattr(sub, "cancel_at_period_end", False)

    existing = sb.table("subscriptions").select("user_id").eq(
        "polar_subscription_id", subscription_id
    ).execute()
    rows = existing.data or []

    if not rows:
        logger.warning(f"No subscription found for polar_subscription_id={subscription_id}")
        return

    user_id = rows[0]["user_id"]

    if cancel_at_period_end:
        sb.table("subscriptions").update({
            "cancel_at_period_end": True,
        }).eq("polar_subscription_id", subscription_id).execute()

        logger.info(f"Subscription {subscription_id} will cancel at period end for user {user_id}")
    else:
        sb.table("subscriptions").update({
            "status": "canceled",
            "plan": "free",
            "cancel_at_period_end": False,
        }).eq("polar_subscription_id", subscription_id).execute()

        track_event("subscription_canceled", user_id, {
            "subscription_id": subscription_id,
        })

        logger.info(f"Subscription {subscription_id} canceled immediately for user {user_id}")


def _handle_subscription_uncanceled(sb, sub):
    subscription_id = getattr(sub, "id", "")

    existing = sb.table("subscriptions").select("user_id").eq(
        "polar_subscription_id", subscription_id
    ).execute()
    rows = existing.data or []

    if not rows:
        return

    user_id = rows[0]["user_id"]

    sb.table("subscriptions").update({
        "cancel_at_period_end": False,
    }).eq("polar_subscription_id", subscription_id).execute()

    track_event("subscription_uncanceled", user_id, {
        "subscription_id": subscription_id,
    })

    logger.info(f"Subscription {subscription_id} uncanceled for user {user_id}")


def _handle_subscription_expired(sb, sub):
    subscription_id = getattr(sub, "id", "")

    existing = sb.table("subscriptions").select("user_id").eq(
        "polar_subscription_id", subscription_id
    ).execute()
    rows = existing.data or []

    if not rows:
        return

    user_id = rows[0]["user_id"]

    sb.table("subscriptions").update({
        "status": "expired",
        "plan": "free",
        "cancel_at_period_end": False,
    }).eq("polar_subscription_id", subscription_id).execute()

    track_event("subscription_expired", user_id, {
        "subscription_id": subscription_id,
    })

    logger.info(f"Subscription {subscription_id} expired for user {user_id}")


def _handle_subscription_revoked(sb, sub):
    subscription_id = getattr(sub, "id", "")

    existing = sb.table("subscriptions").select("user_id").eq(
        "polar_subscription_id", subscription_id
    ).execute()
    rows = existing.data or []

    if not rows:
        return

    user_id = rows[0]["user_id"]

    sb.table("subscriptions").update({
        "status": "revoked",
        "plan": "free",
        "cancel_at_period_end": False,
    }).eq("polar_subscription_id", subscription_id).execute()

    track_event("subscription_revoked", user_id, {
        "subscription_id": subscription_id,
    })

    logger.info(f"Subscription {subscription_id} revoked for user {user_id}")


def _handle_customer_created(sb, customer):
    customer_id = getattr(customer, "id", "")
    email = getattr(customer, "email", "")

    logger.info(f"New Polar customer created: {customer_id} ({email})")
