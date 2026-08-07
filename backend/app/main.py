from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, cases, hearings

# Schema is managed by Alembic (see backend/alembic/), not created here.
# Run `alembic upgrade head` before starting the app.
app = FastAPI(title="A Lawyer's Diary API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allow_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(cases.router)
app.include_router(hearings.router)


@app.get("/health")
def health():
    return {"status": "ok"}
