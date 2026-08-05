from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, ConfigDict

from app.models import CaseStatus


# ---------- Auth / Advocate ----------

class AdvocateCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str


class AdvocateLogin(BaseModel):
    email: EmailStr
    password: str


class AdvocateOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: EmailStr
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------- Hearing ----------

class HearingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    case_id: int
    filing_date: Optional[date] = None
    court_name: str
    party_name: str
    position_stage: str
    previous_date: Optional[date] = None
    upcoming_date: Optional[date] = None
    result: Optional[str] = None
    is_current: bool
    created_at: datetime


class HearingUpdate(BaseModel):
    """Submitted when recording the outcome of the current hearing."""

    result: str
    position_stage: Optional[str] = None
    next_date: Optional[date] = None
    end_matter: bool = False


# ---------- Case ----------

class CaseCreate(BaseModel):
    case_id: str
    name: str
    filing_date: Optional[date] = None
    court_name: str
    party_name: str
    position_stage: str
    upcoming_date: Optional[date] = None


class CaseUpdate(BaseModel):
    case_id: Optional[str] = None
    name: Optional[str] = None


class CaseListItem(BaseModel):
    """Row shown on the dashboard - case plus its current hearing snapshot."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    case_id: str
    name: str
    status: CaseStatus
    created_at: datetime
    current_hearing: Optional[HearingOut] = None


class CaseDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    case_id: str
    name: str
    status: CaseStatus
    created_at: datetime
    updated_at: datetime
    hearings: list[HearingOut] = []
