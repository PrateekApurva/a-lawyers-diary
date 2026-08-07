"""
One-off script to seed a demo advocate account with sample cases, so the
app can be explored manually without creating data by hand. Safe to re-run:
it wipes and recreates the demo advocate (and only that advocate) each time.

Usage (from backend/, with the venv active):
    python seed_demo.py
"""

from datetime import date, timedelta

from app.database import Base, SessionLocal, engine
from app.auth import hash_password
from app import models

DEMO_EMAIL = "demo@lawyersdiary.com"
DEMO_PASSWORD = "Demo@1234"

today = date.today()


def build_hearing(**kwargs) -> models.Hearing:
    return models.Hearing(**kwargs)


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing = db.query(models.Advocate).filter(models.Advocate.email == DEMO_EMAIL).first()
        if existing:
            db.delete(existing)  # cascades to their cases and hearings
            db.commit()

        advocate = models.Advocate(
            full_name="Demo Advocate",
            email=DEMO_EMAIL,
            hashed_password=hash_password(DEMO_PASSWORD),
        )
        db.add(advocate)
        db.flush()

        # Case 1: freshly filed, no history yet
        case1 = models.Case(case_id="CIV-2026-101", name="Sharma vs Verma", advocate_id=advocate.id)
        db.add(case1)
        db.flush()
        db.add(build_hearing(
            case_id=case1.id,
            filing_date=today - timedelta(days=53),
            court_name="District Court, Pune",
            party_name="Verma",
            position_stage="Framing of Charges",
            previous_date=None,
            upcoming_date=today + timedelta(days=18),
            is_current=True,
        ))

        # Case 2: two rounds of adjournment history, active, next date coming up soon
        case2 = models.Case(case_id="CRL-2026-045", name="State vs Iyer", advocate_id=advocate.id)
        db.add(case2)
        db.flush()
        d1 = today - timedelta(days=120)
        d2 = today - timedelta(days=55)
        d3 = today + timedelta(days=5)
        db.add(build_hearing(
            case_id=case2.id,
            filing_date=today - timedelta(days=178),
            court_name="Sessions Court, Chennai",
            party_name="Iyer",
            position_stage="Framing of Charges",
            previous_date=None,
            upcoming_date=d1,
            result="Charges framed; matter adjourned for prosecution evidence.",
            is_current=False,
        ))
        db.add(build_hearing(
            case_id=case2.id,
            filing_date=today - timedelta(days=178),
            court_name="Sessions Court, Chennai",
            party_name="Iyer",
            position_stage="Prosecution Evidence",
            previous_date=d1,
            upcoming_date=d2,
            result="Two prosecution witnesses examined; remaining evidence adjourned.",
            is_current=False,
        ))
        db.add(build_hearing(
            case_id=case2.id,
            filing_date=today - timedelta(days=178),
            court_name="Sessions Court, Chennai",
            party_name="Iyer",
            position_stage="Prosecution Evidence",
            previous_date=d2,
            upcoming_date=d3,
            is_current=True,
        ))

        # Case 3: concluded / closed matter
        case3 = models.Case(
            case_id="MAT-2026-012", name="Reddy vs Reddy", advocate_id=advocate.id,
            status=models.CaseStatus.CLOSED,
        )
        db.add(case3)
        db.flush()
        e1 = today - timedelta(days=200)
        e2 = today - timedelta(days=140)
        db.add(build_hearing(
            case_id=case3.id,
            filing_date=today - timedelta(days=270),
            court_name="Family Court, Hyderabad",
            party_name="Reddy (Respondent)",
            position_stage="Mediation",
            previous_date=None,
            upcoming_date=e1,
            result="Parties referred to mediation.",
            is_current=False,
        ))
        db.add(build_hearing(
            case_id=case3.id,
            filing_date=today - timedelta(days=270),
            court_name="Family Court, Hyderabad",
            party_name="Reddy (Respondent)",
            position_stage="Final Order",
            previous_date=e1,
            upcoming_date=e2,
            result="Mutual consent decree granted; matter disposed.",
            is_current=False,
        ))

        # Case 4: urgent — hearing in 2 days
        case4 = models.Case(case_id="WP-2026-078", name="Kapoor vs Union of India", advocate_id=advocate.id)
        db.add(case4)
        db.flush()
        db.add(build_hearing(
            case_id=case4.id,
            filing_date=today - timedelta(days=37),
            court_name="High Court, Delhi",
            party_name="Union of India",
            position_stage="Admission",
            previous_date=None,
            upcoming_date=today + timedelta(days=2),
            is_current=True,
        ))

        db.commit()
    finally:
        db.close()

    print("Demo account ready:")
    print(f"  Email:    {DEMO_EMAIL}")
    print(f"  Password: {DEMO_PASSWORD}")
    print("4 sample cases created: fresh filing, adjournment history, closed matter, urgent upcoming hearing.")


if __name__ == "__main__":
    seed()
