from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Announcement, User
from app.schemas import AnnouncementCreate, AnnouncementOut
from app.auth import get_current_user, require_officer

router = APIRouter(prefix="/api/announcements", tags=["announcements"])


@router.get("", response_model=List[AnnouncementOut])
def list_announcements(
    db: Session = Depends(get_db), _: User = Depends(get_current_user)
):
    rows = (
        db.query(Announcement, User)
        .join(User, User.id == Announcement.created_by)
        .order_by(Announcement.created_at.desc())
        .all()
    )
    return [
        AnnouncementOut(
            id=a.id,
            title=a.title,
            body=a.body,
            author_name=u.full_name,
            created_at=a.created_at,
        )
        for a, u in rows
    ]


@router.post("", response_model=AnnouncementOut, status_code=201)
def create_announcement(
    payload: AnnouncementCreate,
    db: Session = Depends(get_db),
    officer: User = Depends(require_officer),
):
    a = Announcement(title=payload.title, body=payload.body, created_by=officer.id)
    db.add(a)
    db.commit()
    db.refresh(a)
    return AnnouncementOut(
        id=a.id,
        title=a.title,
        body=a.body,
        author_name=officer.full_name,
        created_at=a.created_at,
    )


@router.delete("/{announcement_id}", status_code=204)
def delete_announcement(
    announcement_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_officer),
):
    a = db.get(Announcement, announcement_id)
    if not a:
        raise HTTPException(status_code=404, detail="Announcement not found")
    db.delete(a)
    db.commit()
