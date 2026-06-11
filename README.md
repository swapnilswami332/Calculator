# NexusCalc — Premium Multi-Tool Calculator

[![Python](https://img.shields.io/badge/Python-3.11%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**NexusCalc** is a full-stack calculator web application with a **FastAPI** backend and a premium **JavaScript / HTML / CSS** frontend. It combines everyday utilities (currency, age, interest, time, date) with a scientific **engineering calculator** in a single polished interface.

**Repository:** [github.com/swapnilswami332/Calculator](https://github.com/swapnilswami332/Calculator)
---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & run](#installation--run)
- [Docker](#docker)
- [API reference](#api-reference)
- [Environment variables](#environment-variables)
- [UI guide](#ui-guide)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Features

### Standard mode

| Tool | Description |
|------|-------------|
| **Basic calculator** | Addition, subtraction, multiplication, division, modulo, expression history |
| **Age counter** | Years, months, days lived; total days; next birthday countdown |
| **Currency converter** | **150+ ISO 4217 currencies** on both From/To sides; search by country or code; live rates with cache fallback |
| **Interest calculator** | Simple and compound interest; compact display for large amounts |
| **Time calculator** | Add, subtract, or find the difference between two times (24h) |
| **Date counter** | Days between two dates; add or subtract days from a date |

### Advanced (engineering) mode

Toggle **Advanced Mode** for a scientific keypad with:

- Trigonometry: `sin`, `cos`, `tan`, inverse functions (DEG / RAD)
- Logarithms: `log`, `ln`
- Powers: `xʸ`, `x²`, `√`, `n!`
- Symbols: `π`, `e`, `|x|`, `mod`, `%`, `(`, `)`
- Memory: `MC`, `MR`, `M+`, `M-`
- Scientific: `×10ⁿ`, `1/x`
- Keyboard shortcuts (see [UI guide](#ui-guide))

---

## Tech stack

| Layer | Technology |
|-------|------------|
| **Backend** | Python 3.11+, [FastAPI](https://fastapi.tiangolo.com/), Uvicorn |
| **Math** | Controlled engine — Tokenize → Normalize → Evaluate (no raw `eval()`) |
| **Currency API** | [Frankfurter](https://www.frankfurter.app/) (free, no API key) |
| **Frontend** | Vanilla JavaScript (ES modules), HTML5, CSS3 |
| **Deploy** | Docker, docker-compose, `.env` configuration |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Frontend)                       │
│  state.js · dom.js · api.js · tool modules (modular UI)     │
└──────────────────────────┬──────────────────────────────────┘
                           │ JSON { success, data, error }
┌──────────────────────────▼──────────────────────────────────┐
│                   FastAPI (Backend)                          │
│  Routers → Services (math_engine, currency_service, cache)  │
└──────────────────────────┬──────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
      Frankfurter API            Local cache + static JSON
      (live FX rates)            (fallback rates)
```

### Math engine pipeline

1. **Tokenize** — numbers, operators, functions, parentheses  
2. **Normalize** — Unicode symbols → ASCII; DEG/RAD angle handling  
3. **Evaluate** — safe function registry (`math` module + wrappers)

### Currency fallback chain

1. Live API (Frankfurter)  
2. In-memory + file cache (`backend/data/rates_cache.json`)  
3. Static JSON (`backend/data/fallback_rates.json`)  
4. EUR pivot for cross-rates when a direct quote is missing  

### API response envelope

All endpoints return a consistent shape:

```json
{
  "success": true,
  "data": { },
  "error": null
}
```

On failure:

```json
{
  "success": false,
  "data": null,
  "error": {
    "message": "Human-readable message",
    "code": "INVALID_INPUT"
  }
}
```

**Error codes:** `INVALID_INPUT`, `INVALID_EXPRESSION`, `CURRENCY_UNAVAILABLE`, `INTERNAL_ERROR`

---

## Project structure

```
Calculator/
├── backend/
│   ├── main.py                 # FastAPI app, CORS, static files, logging
│   ├── config.py               # Settings from .env
│   ├── logging_config.py
│   ├── requirements.txt
│   ├── routers/
│   │   ├── calculator.py       # Basic & engineering calc
│   │   ├── currency.py
│   │   ├── interest.py
│   │   ├── age.py
│   │   ├── time_calc.py
│   │   └── date_calc.py
│   ├── schemas/
│   │   ├── requests.py
│   │   └── response.py
│   ├── services/
│   │   ├── math_engine.py      # Tokenize → Normalize → Evaluate
│   │   ├── currency_service.py
│   │   └── rate_cache.py
│   └── data/
│       ├── iso4217_currencies.json
│       ├── fallback_rates.json
│       └── rates_cache.json    # generated at runtime (gitignored)
├── frontend/
│   ├── index.html
│   ├── css/                    # variables, layout, components, animations
│   └── js/
│       ├── app.js              # Shell, routing, mode toggle
│       ├── state.js            # Central state
│       ├── dom.js              # DOM updates, toast, loading
│       ├── api.js              # API client
│       ├── format.js           # Money / large number formatting
│       └── tools/              # One module per calculator tool
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Prerequisites

- **Python 3.11+**
- **pip**
- Optional: **Docker** & **Docker Compose**
- A modern browser (Chrome, Edge, Firefox)

---

## Installation & run

### 1. Clone the repository

```bash
git clone https://github.com/swapnilswami332/Calculator.git
cd Calculator
```

### 2. Backend setup

**Windows (PowerShell):**

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy ..\.env.example ..\.env
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

**macOS / Linux:**

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example ../.env
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### 3. Open the app

| URL | Purpose |
|-----|---------|
| [http://127.0.0.1:8000](http://127.0.0.1:8000) | Calculator UI |
| [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) | Swagger API docs |
| [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health) | Health check |

> **Note:** Run `uvicorn` from the `backend/` directory so Python imports resolve correctly.

---

## Docker

From the project root:

```bash
cp .env.example .env
docker compose up --build
```

The app is available at **http://localhost:8000**.

---

## API reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/calc/basic` | Basic arithmetic `{ "expression": "2+2*3" }` |
| `POST` | `/api/calc/engineering` | Scientific calc `{ "expression": "sin(30)", "angle_mode": "deg" }` |
| `GET` | `/api/currency/currencies` | List all currencies (code, name, label) |
| `GET` | `/api/currency/rates?base=USD` | Exchange rates for a base currency |
| `POST` | `/api/currency/convert` | Convert `{ "amount": 100, "from": "USD", "to": "INR" }` |
| `POST` | `/api/interest` | Interest `{ "principal": 10000, "rate": 5, "time_years": 3, "type": "compound" }` |
| `POST` | `/api/age` | Age `{ "birth_date": "1990-05-15" }` |
| `POST` | `/api/time` | Time `{ "operation": "add", "hours1": 2, "minutes1": 30, ... }` |
| `POST` | `/api/date` | Date `{ "operation": "between", "date1": "2024-01-01", "date2": "2025-01-01" }` |

### Example: basic calculation

```bash
curl -X POST http://127.0.0.1:8000/api/calc/basic \
  -H "Content-Type: application/json" \
  -d "{\"expression\": \"2+2*3\"}"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "expression": "2+2*3",
    "result": 8.0,
    "formatted": "8"
  },
  "error": null
}
```

---

## Environment variables

Copy `.env.example` to `.env` in the project root:

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_ENV` | `development` | Environment name |
| `LOG_LEVEL` | `INFO` | Logging level (`DEBUG`, `INFO`, `WARNING`, `ERROR`) |
| `CORS_ORIGINS` | localhost URLs | Comma-separated allowed origins |
| `RATES_CACHE_TTL_HOURS` | `3` | FX cache TTL (1–6 hours) |
| `FRANKFURTER_BASE_URL` | `https://api.frankfurter.app` | Currency API base URL |
| `FX_REQUEST_TIMEOUT_SEC` | `5` | HTTP timeout for FX requests |
| `HOST` | `0.0.0.0` | Server bind host (Docker) |
| `PORT` | `8000` | Server port |

---

## UI guide

### Navigation

- Use the **left sidebar** to switch tools (Basic, Age, FX, Interest, Time, Date, Eng).
- Click **Advanced Mode** (top right) for the engineering calculator.
- **Sound** toggle enables optional key-click feedback.

### Engineering keyboard shortcuts

| Key | Action |
|-----|--------|
| `0`–`9`, `.` | Digits / decimal |
| `+`, `-`, `*`, `/`, `(`, `)` | Operators |
| `Enter` | Calculate (`=`) |
| `Backspace` | Delete last character |
| `Escape` | Clear |
| `D` | Toggle DEG / RAD |

### Currency search

Type a country name or currency code (e.g. `India`, `INR`) in the search box to filter both **From** and **To** dropdowns.

---

## Troubleshooting

### Port 8000 already in use (Windows)

```powershell
netstat -ano | findstr ":8000"
taskkill /PID <PID> /F
```

Or use another port:

```powershell
uvicorn main:app --reload --host 127.0.0.1 --port 8765
```

Then open `http://127.0.0.1:8765`.

### `WinError 10013` — socket access forbidden

Another process is bound to the port, or Windows reserved it. Stop conflicting apps or pick a different port (see above).

### UI shows sidebar but no calculator / buttons do nothing

Hard refresh the browser: **Ctrl+F5**. Ensure the backend is running and JS modules load without console errors (**F12** → Console).

### Currency shows `*` next to a code

That currency may use a **EUR cross-rate** when a direct live quote is unavailable.

### Import errors when starting the server

Always start Uvicorn from the `backend/` folder:

```bash
cd backend
uvicorn main:app --reload
```

---

## Frontend module pattern

Each tool in `frontend/js/tools/` exports:

```javascript
export const myTool = {
  id: "my-tool",
  init() {},
  render(state) { return `<div>...</div>`; },
  bindEvents(root, { setState, getState, api, dom }) {},
};
```

The app shell (`app.js`) calls `render()` and `bindEvents()` when the active tool or mode changes.

---

## Contributing

1. Fork the repository  
2. Create a feature branch (`git checkout -b feature/my-feature`)  
3. Commit your changes (`git commit -m "Add my feature"`)  
4. Push to the branch (`git push origin feature/my-feature`)  
5. Open a Pull Request  

---

## License

This project is licensed under the **MIT License** — see the repository for details.

---

## Author

**Swapnil Swami** — [swapnilswami332/Calculator](https://github.com/swapnilswami332/Calculator)

If this project helps you, consider starring the repository on GitHub.
