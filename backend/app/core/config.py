import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    # Supabase
    supabase_url: str = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
    supabase_anon_key: str = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
    supabase_service_key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    supabase_jwt_secret: str = os.getenv("SUPABASE_JWT_SECRET", "")

    # OpenAI
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")

    # Polar
    polar_access_token: str = os.getenv("POLAR_ACCESS_TOKEN", "")
    polar_organization_id: str = os.getenv("POLAR_ORGANIZATION_ID", "")
    polar_pro_monthly_id: str = os.getenv("POLAR_PRO_MONTHLY_PRODUCT_ID", "")
    polar_pro_yearly_id: str = os.getenv("POLAR_PRO_YEARLY_PRODUCT_ID", "")
    polar_business_id: str = os.getenv("POLAR_BUSINESS_PRODUCT_ID", "")
    polar_webhook_secret: str = os.getenv("POLAR_WEBHOOK_SECRET", "")
    polar_env: str = os.getenv("POLAR_ENV", "sandbox")

    # Database
    database_url: str = os.getenv("DATABASE_URL", "")

    # CORS
    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

    # Admin
    admin_emails: list[str] = [
        e.strip() for e in os.getenv("NEXT_PUBLIC_ADMIN_EMAILS", "").split(",") if e.strip()
    ]

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()
