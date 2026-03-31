from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from ..database import get_db
from ..models.fund_note import FundNote
from ..models.user import User
from ..schemas.fund_note import FundNoteCreate, FundNoteUpdate, FundNoteOut
from ..core.dependencies import require_staff_or_above, require_any_role

router = APIRouter(prefix="/fund-notes", tags=["fund-notes"])


def _enrich(n: FundNote) -> dict:
    d = {c.name: getattr(n, c.name) for c in n.__table__.columns}
    d["company_name"] = n.company.name if n.company else None
    d["account_display"] = (
        n.bank_account.display_name or n.bank_account.account_name
    ) if n.bank_account else None
    d["creator_name"] = n.creator.full_name or n.creator.username if n.creator else None
    return d


@router.get("/", response_model=List[FundNoteOut])
def list_notes(
    company_id: Optional[int] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(require_any_role),
):
    q = db.query(FundNote)
    if company_id:
        q = q.filter(FundNote.company_id == company_id)
    if date_from:
        q = q.filter(FundNote.period_date >= date_from)
    if date_to:
        q = q.filter(FundNote.period_date <= date_to)
    notes = q.order_by(FundNote.period_date.desc()).all()
    return [_enrich(n) for n in notes]


@router.post("/", response_model=FundNoteOut, status_code=status.HTTP_201_CREATED)
def create_note(
    data: FundNoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_above),
):
    note = FundNote(**data.model_dump(), created_by=current_user.id)
    db.add(note)
    db.commit()
    db.refresh(note)
    return _enrich(note)


@router.put("/{note_id}", response_model=FundNoteOut)
def update_note(
    note_id: int,
    data: FundNoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_above),
):
    note = db.query(FundNote).filter(FundNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Fund note not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(note, field, value)
    db.commit()
    db.refresh(note)
    return _enrich(note)


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_above),
):
    note = db.query(FundNote).filter(FundNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Fund note not found")
    db.delete(note)
    db.commit()
