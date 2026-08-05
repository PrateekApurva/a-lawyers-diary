# A Lawyer's Diary

A simple case/hearing tracker for advocates. Each advocate logs in, sees a
dashboard of their cases, and tracks each case's hearing history — filing
date, court, party, stage, previous date, and upcoming date. Recording a
result on the upcoming date rolls it into the previous date and opens a new
hearing for the next date, or closes the matter out entirely.

## Tech stack

- **Backend:** FastAPI + SQLAlchemy, JWT auth (python-jose + passlib/bcrypt)
- **Frontend:** Streamlit
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
  requirements.txt
  .env.example
frontend/
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

uvicorn app.main:app --reload
```

The API will be live at `http://localhost:8000`. Interactive docs at
`http://localhost:8000/docs`. Tables are created automatically on startup.

## 3. Frontend setup

In a second terminal:

```bash
cd frontend
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
- `CORS_ALLOW_ORIGINS` in the backend `.env` must include the deployed
  frontend's URL.
- The backend currently creates tables via `Base.metadata.create_all` on
  startup. Once the schema is deployed once, introduce Alembic migrations
  for any future schema changes instead of relying on this.
