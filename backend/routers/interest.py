from fastapi import APIRouter

from schemas.requests import InterestRequest
from schemas.response import error_response, success_response

router = APIRouter(prefix="/api/interest", tags=["interest"])


@router.post("")
async def calculate_interest(body: InterestRequest):
    p = body.principal
    r = body.rate / 100.0
    t = body.time_years

    if body.type == "simple":
        interest = p * r * t
        total = p + interest
    else:
        n = body.compound_per_year
        total = p * (1 + r / n) ** (n * t)
        interest = total - p

    return success_response(
        {
            "principal": round(p, 2),
            "interest": round(interest, 2),
            "total": round(total, 2),
            "type": body.type,
            "rate": body.rate,
            "time_years": t,
        }
    )
