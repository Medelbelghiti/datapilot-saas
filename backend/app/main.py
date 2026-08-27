from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from app.api import analyses, billing, notifications, contact
from app.webhooks import polar
from app.core.config import settings
from app.core.rate_limit import check_rate_limit
import time

app = FastAPI(
    title="DataPilot AI API",
    description="AI-powered data analysis backend",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Process-Time"],
)

RATE_LIMIT_EXEMPT_PATHS = {"/api/health", "/api/webhooks/polar"}


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    if request.url.path in RATE_LIMIT_EXEMPT_PATHS:
        return await call_next(request)

    if request.url.path.startswith("/api/"):
        check_rate_limit(request)

    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(round(process_time, 4))
    return response


app.include_router(analyses.router)
app.include_router(billing.router)
app.include_router(notifications.router)
app.include_router(contact.router)
app.include_router(polar.router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "DataPilot AI"}
