# NexusCalc — Premium Multi-Tool Calculator

A full-stack calculator suite with a **FastAPI** backend and a premium **JavaScript / HTML / CSS** frontend.

## Features

- **Basic calculator** — arithmetic with history
- **Engineering calculator** (Advanced mode) — trig, log, powers, factorial, memory, DEG/RAD, keyboard shortcuts
- **Age counter** — years, months, days lived
- **Currency converter** — 150+ ISO currencies, live rates with cache + static fallback
- **Interest calculator** — simple and compound
- **Time calculator** — add, subtract, difference
- **Date counter** — days between dates, add/subtract days

## Architecture

- **Math engine** (`backend/services/math_engine.py`): Tokenize → Normalize → Evaluate (no raw `eval`)
- **API envelope**: `{ success, data, error }` on all endpoints
- **Currency cache**: Live API → file/memory cache → static JSON
- **Frontend modules**: each tool implements `init()`, `render()`, `bindEvents()`

## Quick start

### Local (Python)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
copy ..\.env.example ..\.env    # optional
uvicorn main:app --reload
```

Open [http://127.0.0.1:8000](http://127.0.0.1:8000)

API docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### Docker

```bash
copy .env.example .env
docker compose up --build
```

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `INFO` | Logging level |
| `CORS_ORIGINS` | localhost URLs | Allowed origins |
| `RATES_CACHE_TTL_HOURS` | `3` | FX cache TTL (1–6) |
| `FRANKFURTER_BASE_URL` | Frankfurter API | Live rates source |

## Keyboard (Engineering mode)

| Key | Action |
|-----|--------|
| `0-9`, `+`, `-`, `*`, `/`, `(`, `)` | Input |
| `Enter` | Calculate |
| `Backspace` | Delete |
| `Escape` | Clear |
| `D` | Toggle DEG/RAD |

## Project structure

```
Calculator/
├── backend/          # FastAPI API + math engine
├── frontend/         # SPA (served by FastAPI)
├── Dockerfile
└── docker-compose.yml
```

## License

MIT
