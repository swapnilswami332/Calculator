import logging

from fastapi import APIRouter

from schemas.requests import CalcRequest
from schemas.response import error_response, success_response
from services.math_engine import MathEngineError, get_engine

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/calc", tags=["calculator"])
engine = get_engine()


def _format_result(value: float) -> str:
    if value == int(value) and abs(value) < 1e15:
        return str(int(value))
    return f"{value:g}"


@router.post("/basic")
async def calc_basic(body: CalcRequest):
    try:
        result = engine.evaluate(body.expression, angle_mode="rad")
        return success_response(
            {
                "expression": body.expression,
                "result": result,
                "formatted": _format_result(result),
            }
        )
    except MathEngineError as e:
        logger.warning("Basic calc error: %s", e)
        return error_response(str(e), "INVALID_EXPRESSION")


@router.post("/engineering")
async def calc_engineering(body: CalcRequest):
    try:
        result = engine.evaluate(body.expression, angle_mode=body.angle_mode)
        return success_response(
            {
                "expression": body.expression,
                "result": result,
                "formatted": _format_result(result),
                "angle_mode": body.angle_mode,
            }
        )
    except MathEngineError as e:
        logger.warning("Engineering calc error: %s", e)
        return error_response(str(e), "INVALID_EXPRESSION")
