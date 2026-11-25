from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


DEFAULT_SECRET = "change-me-in-production"


class Settings(BaseSettings):
    """Runtime configuration, read from environment variables or `backend/.env`."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./orbit.db"
    jwt_secret: str = DEFAULT_SECRET
    jwt_algorithm: str = "HS256"
    jwt_ttl_minutes: int = 60 * 24 * 7
    # Comma-separated list, plus an optional regex (e.g. for Vercel preview deployments).
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    cors_origin_regex: str | None = None
    demo_enabled: bool = True
    # Closed (ERP-style) access: when false only admins create accounts.
    registration_enabled: bool = True
    # Subscription end dates are calendar dates in this zone (a company is never cut off at UTC midnight).
    billing_timezone: str = "Asia/Tashkent"
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
    # Per-IP limits on the sign-in / recovery endpoints (tests switch them off).
    rate_limit_enabled: bool = True

    @property
    def is_production(self) -> bool:
        """Anything not on the local SQLite file is a deployment (Render + Supabase today)."""
        return not self.database_url.startswith("sqlite")

    def check_production(self) -> None:
        """Refuse to serve a deployment that would sign tokens with a guessable key."""
        if self.is_production and (self.jwt_secret == DEFAULT_SECRET or len(self.jwt_secret) < 32):
            raise RuntimeError("JWT_SECRET must be set to a random value of at least 32 characters in production")

    # Preview deployments on a shared host (*.vercel.app) can be created by anyone; off unless explicitly wanted.
    cors_allow_previews: bool = False

    @property
    def cors_origin_list(self) -> list[str]:
        """The web app's own origin is always allowed; in production the localhost defaults are not."""
        listed = [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]
        if self.is_production:
            listed = [o for o in listed if "localhost" not in o and "127.0.0.1" not in o]
        frontend = self.frontend_url.rstrip("/")
        return listed if frontend in listed else [*listed, frontend]

    @property
    def cors_regex(self) -> str | None:
        return self.cors_origin_regex if (not self.is_production or self.cors_allow_previews) else None

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
