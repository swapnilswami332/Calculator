import logging
import time
import uuid
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from config import settings
from logging_config import setup_logging
from routers import age, calculator, currency, date_calc, interest, time_calc
from schemas.response import error_response

setup_logging(settings.log_level)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Premium Calculator API",
    version="1.0.0",
    description="Multi-tool calculator with controlled math engine",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    request_id = str(uuid.uuid4())[:8]
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start) * 1000
    logger.info(
        "%s %s | %s | %.1fms",
        request_id,
        request.method,
        request.url.path,
        duration_ms,
    )
    response.headers["X-Request-ID"] = request_id
    return response


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    msg = errors[0].get("msg", "Validation error") if errors else "Validation error"
    return JSONResponse(
        status_code=422,
        content=error_response(msg, "INVALID_INPUT"),
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error: %s", exc)
    return JSONResponse(
        status_code=500,
        content=error_response("An internal error occurred", "INTERNAL_ERROR"),
    )


app.include_router(calculator.router)
app.include_router(currency.router)
app.include_router(interest.router)
app.include_router(age.router)
app.include_router(time_calc.router)
app.include_router(date_calc.router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"
if FRONTEND_DIR.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")
