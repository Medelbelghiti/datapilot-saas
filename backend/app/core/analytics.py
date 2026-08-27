from fastapi import Request
from pydantic import BaseModel
from typing import Optional
import json
import time
from supabase import create_client
from app.core.config import settings


class AnalyticsEvent(BaseModel):
    event: str
    properties: Optional[dict] = None


async def track_event(event: str, user_id: Optional[str] = None, properties: Optional[dict] = None):
    """
    Track analytics events. In production, send to your analytics provider.
    Events tracked:
    - signup
    - login
    - analysis_created
    - analysis_completed
    - analysis_failed
    - upgrade_started
    - subscription_started
    - report_generated
    - ai_insights_generated
    """
    payload = {
        "event": event,
        "user_id": user_id,
        "properties": properties or {},
        "timestamp": time.time(),
    }

    # In production, send to analytics service (PostHog, Mixpanel, etc.)
    # For now, log to console
    print(f"[ANALYTICS] {json.dumps(payload)}")

    # Optionally store in database
    try:
        sb = create_client(settings.supabase_url, settings.supabase_service_key)
        sb.table("analytics_events").insert({
            "event": event,
            "user_id": user_id,
            "properties": properties,
        }).execute()
    except Exception:
        pass  # Don't fail if analytics storage fails
