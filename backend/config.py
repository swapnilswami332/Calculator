import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
DATA_DIR = BASE_DIR / "data"

load_dotenv(PROJECT_ROOT / ".env")


class Settings:
    app_env: str = os.getenv("APP_ENV", "development")
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    cors_origins: list[str] = [
        o.strip()
        for o in os.getenv(
            "CORS_ORIGINS",
            "http://127.0.0.1:8000,http://localhost:8000,http://localhost:5500",
        ).split(",")
        if o.strip()
    ]
    rates_cache_ttl_hours: float = float(os.getenv("RATES_CACHE_TTL_HOURS", "3"))
    frankfurter_base_url: str = os.getenv(
        "FRANKFURTER_BASE_URL", "https://api.frankfurter.app"
    ).rstrip("/")
    fx_request_timeout_sec: float = float(os.getenv("FX_REQUEST_TIMEOUT_SEC", "5"))
    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", "8000"))


settings = Settings()
