from datetime import date, timedelta

from fastapi import APIRouter

from schemas.requests import DateRequest
from schemas.response import error_response, success_response

router = APIRouter(prefix="/api/date", tags=["date"])


@router.post("")
async def calculate_date(body: DateRequest):
    try:
        d1 = date.fromisoformat(body.date1)
    except ValueError:
        return error_response("Invalid date1 format. Use YYYY-MM-DD", "INVALID_INPUT")

    if body.operation == "between":
        if not body.date2:
            return error_response("date2 is required for between operation", "INVALID_INPUT")
        try:
            d2 = date.fromisoformat(body.date2)
        except ValueError:
            return error_response("Invalid date2 format", "INVALID_INPUT")
        days = abs((d2 - d1).days)
        return success_response(
            {
                "operation": "between",
                "days": days,
                "result": {"from": d1.isoformat(), "to": d2.isoformat()},
            }
        )

    if body.days is None:
        return error_response("days is required for add/subtract", "INVALID_INPUT")

    delta = timedelta(days=body.days)
    if body.operation == "add":
        result_date = d1 + delta
    elif body.operation == "subtract":
        result_date = d1 - delta
    else:
        return error_response("Invalid operation", "INVALID_INPUT")

    return success_response(
        {
            "operation": body.operation,
            "days": body.days,
            "result": {"date": result_date.isoformat()},
        }
    )
