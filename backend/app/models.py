import enum

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Date,
    DateTime,
    ForeignKey,
    Enum,
    Boolean,
    func,
)
from sqlalchemy.orm import relationship

from app.database import Base


class CaseStatus(str, enum.Enum):
    ACTIVE = "active"
    CLOSED = "closed"


class Advocate(Base):
    __tablename__ = "advocates"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    cases = relationship("Case", back_populates="advocate", cascade="all, delete-orphan")


class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(String(100), nullable=False)
    name = Column(String(255), nullable=False)
    status = Column(Enum(CaseStatus), nullable=False, default=CaseStatus.ACTIVE)
    advocate_id = Column(Integer, ForeignKey("advocates.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    advocate = relationship("Advocate", back_populates="cases")
    hearings = relationship(
        "Hearing",
        back_populates="case",
        cascade="all, delete-orphan",
        order_by="Hearing.created_at",
    )


class Hearing(Base):
    __tablename__ = "hearings"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)

    filing_date = Column(Date, nullable=True)
    court_name = Column(String(255), nullable=False)
    party_name = Column(String(255), nullable=False)
    position_stage = Column(String(255), nullable=False)

    previous_date = Column(Date, nullable=True)
    upcoming_date = Column(Date, nullable=True)

    result = Column(Text, nullable=True)
    is_current = Column(Boolean, nullable=False, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    case = relationship("Case", back_populates="hearings")
