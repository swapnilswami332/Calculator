from typing import Literal

from pydantic import BaseModel, Field


class CalcRequest(BaseModel):
    expression: str = Field(..., min_length=1, max_length=500)
    angle_mode: Literal["deg", "rad"] = "deg"


class CurrencyConvertRequest(BaseModel):
    amount: float = Field(..., gt=0)
    from_currency: str = Field(..., alias="from", min_length=3, max_length=3)
    to_currency: str = Field(..., alias="to", min_length=3, max_length=3)

    model_config = {"populate_by_name": True}


class InterestRequest(BaseModel):
    principal: float = Field(..., gt=0)
    rate: float = Field(..., ge=0, description="Annual rate in percent")
    time_years: float = Field(..., gt=0)
    type: Literal["simple", "compound"] = "simple"
    compound_per_year: int = Field(default=12, ge=1, le=365)


class AgeRequest(BaseModel):
    birth_date: str = Field(..., description="ISO date YYYY-MM-DD")


class TimeRequest(BaseModel):
    operation: Literal["add", "subtract", "diff"]
    hours1: int = Field(default=0, ge=0, le=23)
    minutes1: int = Field(default=0, ge=0, le=59)
    hours2: int = Field(default=0, ge=0, le=23)
    minutes2: int = Field(default=0, ge=0, le=59)


class DateRequest(BaseModel):
    operation: Literal["between", "add", "subtract"]
    date1: str
    date2: str | None = None
    days: int | None = Field(default=None, ge=0)
