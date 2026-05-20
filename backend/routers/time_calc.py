from fastapi import APIRouter

from schemas.requests import TimeRequest
from schemas.response import error_response, success_response

router = APIRouter(prefix="/api/time", tags=["time"])


def _to_minutes(h: int, m: int) -> int:
    return h * 60 + m


def _from_minutes(total: int) -> dict:
    total = total % (24 * 60)
    if total < 0:
        total += 24 * 60
    h, m = divmod(total, 60)
    return {"hours": h, "minutes": m, "formatted": f"{h:02d}:{m:02d}"}


@router.post("")
async def calculate_time(body: TimeRequest):
    m1 = _to_minutes(body.hours1, body.minutes1)
    m2 = _to_minutes(body.hours2, body.minutes2)

    if body.operation == "add":
        result = _from_minutes(m1 + m2)
    elif body.operation == "subtract":
        result = _from_minutes(m1 - m2)
    elif body.operation == "diff":
        diff = abs(m1 - m2)
        if diff > 12 * 60:
            diff = 24 * 60 - diff
        result = _from_minutes(diff)
        result["note"] = "Shortest difference within 24h"
    else:
        return error_response("Invalid operation", "INVALID_INPUT")

    return success_response({"operation": body.operation, "result": result})
