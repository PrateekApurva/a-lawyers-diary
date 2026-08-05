from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.auth import get_current_advocate
from app.crud import current_hearing
from app.database import get_db

router = APIRouter(prefix="/cases", tags=["cases"])


def _to_list_item(case: models.Case) -> schemas.CaseListItem:
    return schemas.CaseListItem(
        id=case.id,
        case_id=case.case_id,
        name=case.name,
        status=case.status,
        created_at=case.created_at,
        current_hearing=current_hearing(case),
    )


@router.get("", response_model=list[schemas.CaseListItem])
def list_cases(
    db: Session = Depends(get_db),
    advocate: models.Advocate = Depends(get_current_advocate),
):
    cases = crud.list_cases(db, advocate.id)
    return [_to_list_item(c) for c in cases]


@router.post("", response_model=schemas.CaseDetail, status_code=status.HTTP_201_CREATED)
def create_case(
    payload: schemas.CaseCreate,
    db: Session = Depends(get_db),
    advocate: models.Advocate = Depends(get_current_advocate),
):
    return crud.create_case(db, payload, advocate.id)


@router.get("/{case_id}", response_model=schemas.CaseDetail)
def get_case(
    case_id: int,
    db: Session = Depends(get_db),
    advocate: models.Advocate = Depends(get_current_advocate),
):
    return crud.get_case(db, case_id, advocate.id)


@router.patch("/{case_id}", response_model=schemas.CaseDetail)
def update_case(
    case_id: int,
    payload: schemas.CaseUpdate,
    db: Session = Depends(get_db),
    advocate: models.Advocate = Depends(get_current_advocate),
):
    case = crud.get_case(db, case_id, advocate.id)
    return crud.update_case(db, case, payload)


@router.delete("/{case_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_case(
    case_id: int,
    db: Session = Depends(get_db),
    advocate: models.Advocate = Depends(get_current_advocate),
):
    case = crud.get_case(db, case_id, advocate.id)
    crud.delete_case(db, case)
