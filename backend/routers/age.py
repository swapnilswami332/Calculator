from datetime import date

from dateutil.relativedelta import relativedelta
from fastapi import APIRouter

from schemas.requests import AgeRequest
from schemas.response import error_response, success_response

router = APIRouter(prefix="/api/age", tags=["age"])


@router.post("")
async def calculate_age(body: AgeRequest):
    try:
        birth = date.fromisoformat(body.birth_date)
    except ValueError:
        return error_response("Invalid date format. Use YYYY-MM-DD", "INVALID_INPUT")

    today = date.today()
    if birth > today:
        return error_response("Birth date cannot be in the future", "INVALID_INPUT")

    delta = relativedelta(today, birth)
    total_days = (today - birth).days

    next_bday = date(today.year, birth.month, birth.day)
    if next_bday < today:
        next_bday = date(today.year + 1, birth.month, birth.day)
    days_until = (next_bday - today).days

    return success_response(
        {
            "years": delta.years,
            "months": delta.months,
            "days": delta.days,
            "total_days": total_days,
            "next_birthday": next_bday.isoformat(),
            "days_until_birthday": days_until,
        }
    )
