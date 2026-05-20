import logging

from fastapi import APIRouter, Query

from schemas.requests import CurrencyConvertRequest
from schemas.response import error_response, success_response
from services.currency_service import CurrencyServiceError, currency_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/currency", tags=["currency"])


@router.get("/currencies")
async def list_currencies():
    currencies = currency_service.list_currencies()
    return success_response({"currencies": currencies})


@router.get("/rates")
async def get_rates(base: str = Query(default="USD", min_length=3, max_length=3)):
    try:
        data = await currency_service.get_rates(base.upper())
        return success_response(
            {
                "base": data["base"],
                "rates": data["rates"],
                "source": data.get("source", "unknown"),
                "stale": data.get("stale", False),
            }
        )
    except CurrencyServiceError as e:
        logger.error("Rates unavailable: %s", e)
        return error_response(str(e), "CURRENCY_UNAVAILABLE")


@router.post("/convert")
async def convert_currency(body: CurrencyConvertRequest):
    try:
        result = await currency_service.convert(
            body.amount, body.from_currency, body.to_currency
        )
        return success_response(result)
    except CurrencyServiceError as e:
        return error_response(str(e), "CURRENCY_UNAVAILABLE")
