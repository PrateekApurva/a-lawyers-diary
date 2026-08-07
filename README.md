# A Lawyer's Diary

A simple case/hearing tracker for advocates. Each advocate logs in, sees a
dashboard of their cases, and tracks each case's hearing history — filing
date, court, party, stage, previous date, and upcoming date. Recording a
result on the upcoming date rolls it into the previous date and opens a new
hearing for the next date, or closes the matter out entirely.

## Tech stack

- **Backend:** FastAPI + SQLAlchemy, JWT auth (python-jose + bcrypt), Alembic migrations
- **Frontend:** React + TypeScript (Vite, Tailwind CSS, React Router) — the primary frontend.
  A Streamlit frontend also exists (`streamlit-frontend/`), kept for quick internal use.
- **Database:** PostgreSQL

## Project layout

```
backend/
  app/
    main.py          FastAPI app, CORS, router wiring
    config.py         Settings loaded from environment / .env
    database.py        SQLAlchemy engine/session
    models.py           Advocate, Case, Hearing tables
    schemas.py           Pydantic request/response models
    auth.py               Password hashing + JWT
    crud.py                DB operations, incl. hearing state transitions
    routers/
      auth.py               /auth/signup, /auth/login
      cases.py               /cases CRUD
      hearings.py             /cases/{id}/hearings, /cases/{id}/hearings/update
  alembic/            Migration environment (see "Database migrations" below)
  seed_demo.py        Re-runnable script that creates a demo account + sample cases
  requirements.txt
  .env.example
react-frontend/
  src/
    main.tsx           Entry point: router + Theme/Auth providers
    App.tsx              Route definitions
    api/client.ts          Thin fetch wrapper for the backend API
    context/                AuthContext (JWT in localStorage), ThemeContext (light/dark)
    components/               Shared UI: forms, tables, TopBar, ui/ primitives
    pages/                     LoginPage, SignupPage, DashboardPage, CaseDetailPage
  .env.example
streamlit-frontend/
  app.py              Streamlit UI (login/signup, dashboard, case detail)
  api_client.py         Thin HTTP client for the backend API
  requirements.txt
  .env.example
```

## 1. PostgreSQL setup

See the steps dictated separately — create the `lawyers_diary` database and
a dedicated `lawyers_diary_user`, then put the connection string in
`backend/.env` as `DATABASE_URL`.

## 2. Backend setup

Requires **Python 3.11–3.13**. Python 3.14 fails to build `pydantic-core`
from source (no prebuilt wheel yet as of this writing). If `python3 --version`
reports 3.14, install 3.11 via Homebrew first: `brew install python@3.11`,
then use `/opt/homebrew/bin/python3.11 -m venv .venv` below instead.

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# edit .env: set DATABASE_URL to match the DB you created, and SECRET_KEY
# (generate one with: openssl rand -hex 32)

alembic upgrade head    # creates all tables via migrations
uvicorn app.main:app --reload
```

The API will be live at `http://localhost:8000`. Interactive docs at
`http://localhost:8000/docs`.

Optionally, populate some sample data to explore:

```bash
python seed_demo.py
```

This creates a demo advocate (`demo@lawyersdiary.com` / `Demo@1234`) with 4
sample cases covering different states (fresh filing, adjournment history,
closed matter, upcoming hearing). Safe to re-run — it resets only that
account's data.

## 3. Database migrations

Schema is managed entirely through Alembic — there's no `create_all()` in
the app. Whenever you change a model in `app/models.py`:

```bash
cd backend
alembic revision --autogenerate -m "describe the change"
```

Then open the generated file in `alembic/versions/` and check it actually
matches what you intended (autogenerate is good but not infallible —
especially for column renames, which it sees as a drop + add). Apply it:

```bash
alembic upgrade head
```

To roll back the most recent migration: `alembic downgrade -1`.

## 4. React frontend setup (primary)

Requires Node.js 20+. In a second terminal:

```bash
cd react-frontend
npm install

cp .env.example .env
# edit .env if your API isn't on localhost:8000

npm run dev
```

Open the URL Vite prints (typically `http://localhost:5173`). `npm run build`
produces a static `dist/` folder for deployment (e.g. Vercel, Netlify,
Cloudflare Pages).

## 5. Streamlit frontend setup (optional, secondary)

Kept around for quick internal use — same backend, same data, simpler to run
without Node. In a second (or third) terminal:

```bash
cd streamlit-frontend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# edit .env if your API isn't on localhost:8000

streamlit run app.py
```

Open the URL Streamlit prints (typically `http://localhost:8501`).

## Notes for deployment

- Set real, secret values for `SECRET_KEY` and `DATABASE_URL` via your
  hosting platform's environment variable configuration — never commit `.env`.
- `CORS_ALLOW_ORIGINS` in the backend `.env` must include every deployed
  frontend URL you actually use (React's, and Streamlit's if you keep it live).
- The deploy start command should run migrations before starting the server,
  e.g. `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
  (already set up this way in `render.yaml`).
- The React frontend is a static build (`npm run build` → `dist/`), so it
  deploys differently than Streamlit did — a static host (Vercel, Netlify,
  Cloudflare Pages) rather than Streamlit Community Cloud. Set
  `VITE_API_BASE_URL` as a build-time environment variable on whichever
  platform you pick.
