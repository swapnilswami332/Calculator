from typing import Any, Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class ErrorDetail(BaseModel):
    message: str
    code: str


class ApiResponse(BaseModel, Generic[T]):
    success: bool
    data: T | None = None
    error: ErrorDetail | None = None


def success_response(data: Any) -> dict:
    return {"success": True, "data": data, "error": None}


def error_response(message: str, code: str) -> dict:
    return {
        "success": False,
        "data": None,
        "error": {"message": message, "code": code},
    }
