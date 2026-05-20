import json
import logging
from datetime import datetime, timezone
from pathlib import Path

from config import DATA_DIR, settings

logger = logging.getLogger(__name__)

CACHE_FILE = DATA_DIR / "rates_cache.json"
FALLBACK_FILE = DATA_DIR / "fallback_rates.json"


class RateCache:
    def __init__(self) -> None:
        self._memory: dict | None = None

    @property
    def ttl_seconds(self) -> float:
        hours = max(1.0, min(6.0, settings.rates_cache_ttl_hours))
        return hours * 3600

    def get(self, base: str) -> dict | None:
        base = base.upper()
        entry = self._read_entry(base)
        if entry:
            return entry
        return None

    def set(self, base: str, rates: dict, source: str = "live") -> None:
        base = base.upper()
        entry = {
            "base": base,
            "rates": rates,
            "source": source,
            "fetched_at": datetime.now(timezone.utc).isoformat(),
        }
        self._memory = {"entries": {base: entry}}
        self._persist(entry)

    def is_fresh(self, entry: dict) -> bool:
        try:
            fetched = datetime.fromisoformat(entry["fetched_at"])
            if fetched.tzinfo is None:
                fetched = fetched.replace(tzinfo=timezone.utc)
            age = (datetime.now(timezone.utc) - fetched).total_seconds()
            return age < self.ttl_seconds
        except (KeyError, ValueError):
            return False

    def get_static_fallback(self, base: str) -> dict | None:
        base = base.upper()
        if not FALLBACK_FILE.exists():
            return None
        try:
            data = json.loads(FALLBACK_FILE.read_text(encoding="utf-8"))
            rates = data.get("rates", {}).get(base)
            if not rates:
                return None
            return {
                "base": base,
                "rates": rates,
                "source": "static",
                "fetched_at": data.get("updated", "1970-01-01T00:00:00+00:00"),
                "stale": True,
            }
        except (json.JSONDecodeError, OSError) as e:
            logger.error("Failed to load static fallback: %s", e)
            return None

    def _read_entry(self, base: str) -> dict | None:
        if self._memory:
            entries = self._memory.get("entries", {})
            if base in entries:
                return entries[base]
        if not CACHE_FILE.exists():
            return None
        try:
            data = json.loads(CACHE_FILE.read_text(encoding="utf-8"))
            entry = data.get("entries", {}).get(base)
            if entry:
                if not self._memory:
                    self._memory = data
                return entry
        except (json.JSONDecodeError, OSError) as e:
            logger.warning("Cache file read failed: %s", e)
        return None

    def _persist(self, entry: dict) -> None:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        base = entry["base"]
        existing: dict = {"entries": {}}
        if CACHE_FILE.exists():
            try:
                existing = json.loads(CACHE_FILE.read_text(encoding="utf-8"))
            except (json.JSONDecodeError, OSError):
                pass
        existing.setdefault("entries", {})[base] = entry
        CACHE_FILE.write_text(json.dumps(existing, indent=2), encoding="utf-8")


rate_cache = RateCache()
