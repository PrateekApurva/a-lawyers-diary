from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app import models, schemas
from app.auth import hash_password


# ---------- Advocate ----------

def get_advocate_by_email(db: Session, email: str) -> models.Advocate | None:
    return db.query(models.Advocate).filter(models.Advocate.email == email).first()


def create_advocate(db: Session, payload: schemas.AdvocateCreate) -> models.Advocate:
    if get_advocate_by_email(db, payload.email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    advocate = models.Advocate(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
    )
    db.add(advocate)
    db.commit()
    db.refresh(advocate)
    return advocate


# ---------- Case ----------

def list_cases(db: Session, advocate_id: int) -> list[models.Case]:
    return (
        db.query(models.Case)
        .options(joinedload(models.Case.hearings))
        .filter(models.Case.advocate_id == advocate_id)
        .order_by(models.Case.created_at.desc())
        .all()
    )


def get_case(db: Session, case_id: int, advocate_id: int) -> models.Case:
    case = (
        db.query(models.Case)
        .options(joinedload(models.Case.hearings))
        .filter(models.Case.id == case_id, models.Case.advocate_id == advocate_id)
        .first()
    )
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    return case


def current_hearing(case: models.Case) -> models.Hearing | None:
    for hearing in case.hearings:
        if hearing.is_current:
            return hearing
    return None


def create_case(db: Session, payload: schemas.CaseCreate, advocate_id: int) -> models.Case:
    case = models.Case(case_id=payload.case_id, name=payload.name, advocate_id=advocate_id)
    db.add(case)
    db.flush()  # obtain case.id before creating the hearing row

    hearing = models.Hearing(
        case_id=case.id,
        filing_date=payload.filing_date,
        court_name=payload.court_name,
        party_name=payload.party_name,
        position_stage=payload.position_stage,
        previous_date=None,
        upcoming_date=payload.upcoming_date,
        is_current=True,
    )
    db.add(hearing)
    db.commit()
    db.refresh(case)
    return case


def update_case(db: Session, case: models.Case, payload: schemas.CaseUpdate) -> models.Case:
    if payload.case_id is not None:
        case.case_id = payload.case_id
    if payload.name is not None:
        case.name = payload.name
    db.commit()
    db.refresh(case)
    return case


def delete_case(db: Session, case: models.Case) -> None:
    db.delete(case)
    db.commit()


def record_hearing_result(
    db: Session, case: models.Case, payload: schemas.HearingUpdate
) -> models.Case:
    """
    Closes out the case's current hearing with a result. If a next date is
    given, the current upcoming_date rolls into previous_date and a new
    "current" hearing row is opened for the next date. If end_matter is
    set instead, no new hearing is created and the case is closed.
    """
    hearing = current_hearing(case)
    if hearing is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This case has no open hearing to update",
        )
    if case.status == models.CaseStatus.CLOSED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Case is already closed")
    if not payload.end_matter and payload.next_date is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide next_date, or set end_matter to true",
        )

    hearing.result = payload.result
    hearing.is_current = False

    if payload.end_matter:
        case.status = models.CaseStatus.CLOSED
    else:
        new_hearing = models.Hearing(
            case_id=case.id,
            filing_date=hearing.filing_date,
            court_name=hearing.court_name,
            party_name=hearing.party_name,
            position_stage=payload.position_stage or hearing.position_stage,
            previous_date=hearing.upcoming_date,
            upcoming_date=payload.next_date,
            is_current=True,
        )
        db.add(new_hearing)

    db.commit()
    db.refresh(case)
    return case
