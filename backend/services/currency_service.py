import json
import logging
from pathlib import Path

import httpx

from config import DATA_DIR, settings
from services.rate_cache import rate_cache

logger = logging.getLogger(__name__)

ISO_CATALOG_PATH = DATA_DIR / "iso4217_currencies.json"
PIVOT = "EUR"

_live_supported: set[str] | None = None


class CurrencyServiceError(Exception):
    pass


def _load_iso_catalog() -> list[dict]:
    if not ISO_CATALOG_PATH.exists():
        return [{"code": "USD", "name": "US Dollar"}, {"code": "EUR", "name": "Euro"}]
    data = json.loads(ISO_CATALOG_PATH.read_text(encoding="utf-8"))
    return sorted(data, key=lambda x: x["code"])


class CurrencyService:
    async def fetch_frankfurter_currencies(self) -> dict[str, str]:
        url = f"{settings.frankfurter_base_url}/currencies"
        async with httpx.AsyncClient(
            timeout=settings.fx_request_timeout_sec
        ) as client:
            response = await client.get(url)
            response.raise_for_status()
            return response.json()

    async def get_supported_live(self) -> set[str]:
        global _live_supported
        if _live_supported is not None:
            return _live_supported
        try:
            data = await self.fetch_frankfurter_currencies()
            _live_supported = set(data.keys()) | {PIVOT, "USD"}
        except Exception as e:
            logger.warning("Could not fetch Frankfurter currencies: %s", e)
            _live_supported = set(rate_cache.get_static_fallback("USD")["rates"].keys())
        return _live_supported

    async def fetch_live_rates(self, base: str) -> dict:
        base = base.upper()
        url = f"{settings.frankfurter_base_url}/latest"
        async with httpx.AsyncClient(
            timeout=settings.fx_request_timeout_sec
        ) as client:
            response = await client.get(url, params={"from": base})
            response.raise_for_status()
            data = response.json()
            rates = data.get("rates", {})
            rates[base] = 1.0
            return rates

    async def get_rates(self, base: str) -> dict:
        base = base.upper()
        cached = rate_cache.get(base)
        if cached and rate_cache.is_fresh(cached):
            return {**cached, "stale": False}

        try:
            rates = await self.fetch_live_rates(base)
            rate_cache.set(base, rates, source="live")
            return {
                "base": base,
                "rates": rates,
                "source": "live",
                "stale": False,
                "fetched_at": rate_cache.get(base)["fetched_at"],
            }
        except Exception as e:
            logger.warning("Live rates failed for %s: %s", base, e)

        if cached:
            return {**cached, "source": "cache", "stale": True}

        static = rate_cache.get_static_fallback(base)
        if static:
            return static

        raise CurrencyServiceError("All currency rate sources failed")

    async def _rate_via_pivot(self, from_c: str, to_c: str) -> float:
        """Cross-rate using EUR when direct quote unavailable."""
        eur_rates = await self.get_rates(PIVOT)
        rates = eur_rates["rates"]
        rates[PIVOT] = 1.0
        if from_c not in rates or to_c not in rates:
            raise CurrencyServiceError(
                f"Rate unavailable for {from_c} → {to_c}. Try a major currency pair."
            )
        # 1 FROM = (1/rates[from]) EUR = (1/rates[from])*rates[to] TO
        return rates[to_c] / rates[from_c]

    async def convert(
        self, amount: float, from_currency: str, to_currency: str
    ) -> dict:
        from_c = from_currency.upper()
        to_c = to_currency.upper()
        if from_c == to_c:
            return {
                "amount": amount,
                "from": from_c,
                "to": to_c,
                "rate": 1.0,
                "result": round(amount, 4),
                "source": "identity",
            }

        rate_data = await self.get_rates(from_c)
        rates = rate_data["rates"]
        source = rate_data.get("source", "unknown")
        stale = rate_data.get("stale", False)

        if to_c in rates:
            rate = rates[to_c]
        else:
            rate = await self._rate_via_pivot(from_c, to_c)
            source = f"{source}+pivot"

        result = amount * rate
        return {
            "amount": amount,
            "from": from_c,
            "to": to_c,
            "rate": round(rate, 6),
            "result": round(result, 4),
            "source": source,
            "stale": stale,
        }

    async def list_currencies(self) -> list[dict]:
        catalog = _load_iso_catalog()
        supported = await self.get_supported_live()
        return [
            {
                "code": c["code"],
                "name": c["name"],
                "label": f"{c['code']} — {c['name']}",
                "live": c["code"] in supported,
            }
            for c in catalog
        ]


currency_service = CurrencyService()
