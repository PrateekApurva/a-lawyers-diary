from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routers import auth, cases, hearings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Creates tables if they don't exist yet. For schema changes after the
    # first deploy, switch to Alembic migrations instead of relying on this.
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="A Lawyer's Diary API", lifespan=lifespan)

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
