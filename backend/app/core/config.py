from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration, read from environment variables or `backend/.env`."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./orbit.db"
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_ttl_minutes: int = 60 * 24 * 7
    # Comma-separated list, plus an optional regex (e.g. for Vercel preview deployments).
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    cors_origin_regex: str | None = None
    demo_enabled: bool = True
    # Closed (ERP-style) access: when false only admins create accounts.
    registration_enabled: bool = True
    # Bootstraps the platform operator on start-up (set in the hosting dashboard, never in git).
    superadmin_email: str | None = None
    superadmin_password: str | None = None
    demo_email: str = "demo@orbit.dev"
    # Public frontend URL used in emailed links (invites, password reset, verification).
    frontend_url: str = "http://localhost:5173"
    # Optional SMTP; without it links are logged and admins copy them from the UI.
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_user: str | None = None
    smtp_password: str | None = None
    smtp_from: str = "Orbit CRM <no-reply@orbit.dev>"
    invite_ttl_days: int = 7
    reset_ttl_minutes: int = 60
    verify_ttl_hours: int = 72

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def sqlalchemy_url(self) -> str:
        """Hosting providers hand out `postgres://…`; SQLAlchemy needs the psycopg 3 dialect."""
        for prefix in ("postgres://", "postgresql://"):
            if self.database_url.startswith(prefix):
                return "postgresql+psycopg://" + self.database_url[len(prefix):]
        return self.database_url


@lru_cache
def get_settings() -> Settings:
    return Settings()
