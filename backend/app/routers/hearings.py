from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.auth import get_current_advocate
from app.database import get_db

router = APIRouter(prefix="/cases/{case_id}/hearings", tags=["hearings"])


@router.get("", response_model=list[schemas.HearingOut])
def list_hearings(
    case_id: int,
    db: Session = Depends(get_db),
    advocate: models.Advocate = Depends(get_current_advocate),
):
    case = crud.get_case(db, case_id, advocate.id)
    return case.hearings


@router.post("/update", response_model=schemas.CaseDetail)
def update_hearing(
    case_id: int,
    payload: schemas.HearingUpdate,
    db: Session = Depends(get_db),
    advocate: models.Advocate = Depends(get_current_advocate),
):
    case = crud.get_case(db, case_id, advocate.id)
    return crud.record_hearing_result(db, case, payload)


@router.post("/rollback", response_model=schemas.CaseDetail)
def rollback_hearing(
    case_id: int,
    db: Session = Depends(get_db),
    advocate: models.Advocate = Depends(get_current_advocate),
):
    case = crud.get_case(db, case_id, advocate.id)
    return crud.rollback_last_hearing(db, case)
