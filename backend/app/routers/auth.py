from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app import crud, schemas
from app.auth import create_access_token, verify_password
from app.database import get_db

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=schemas.AdvocateOut, status_code=status.HTTP_201_CREATED)
def signup(payload: schemas.AdvocateCreate, db: Session = Depends(get_db)):
    return crud.create_advocate(db, payload)


@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    advocate = crud.get_advocate_by_email(db, form_data.username)
    if not advocate or not verify_password(form_data.password, advocate.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token(subject=advocate.email)
    return schemas.Token(access_token=token)
