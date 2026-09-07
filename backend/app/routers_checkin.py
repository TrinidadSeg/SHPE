import random
import string
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Event, CheckinWindow, PointEntry, User
from app.schemas import (
    CheckinWindowOut,
    CheckinSubmit,
    CheckinResult,
    AttendanceRow,
)
from app.auth import get_current_user, require_officer

router = APIRouter(prefix="/api/events", tags=["checkin"])

# Avoid confusing characters (no O/0, I/1) so codes are easy to read aloud.
CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def generate_code(length: int = 5) -> str:
    return "".join(random.choices(CODE_CHARS, k=length))


@router.post("/{event_id}/checkin/open", response_model=CheckinWindowOut)
def open_checkin(
    event_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_officer),
):
    event = db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # If a window is already open, return it instead of making a second one.
    existing = (
        db.query(CheckinWindow)
        .filter(CheckinWindow.event_id == event_id, CheckinWindow.is_open == True)  # noqa: E712
        .first()
    )
    if existing:
        return existing

    window = CheckinWindow(event_id=event_id, code=generate_code(), is_open=True)
    db.add(window)
    db.commit()
    db.refresh(window)
    return window


@router.post("/{event_id}/checkin/close", response_model=CheckinWindowOut)
def close_checkin(
    event_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_officer),
):
    window = (
        db.query(CheckinWindow)
        .filter(CheckinWindow.event_id == event_id, CheckinWindow.is_open == True)  # noqa: E712
        .first()
    )
    if not window:
        raise HTTPException(status_code=404, detail="No open check-in for this event")
    window.is_open = False
    window.closed_at = datetime.utcnow()
    db.commit()
    db.refresh(window)
    return window


@router.post("/{event_id}/checkin", response_model=CheckinResult)
def submit_checkin(
    event_id: int,
    payload: CheckinSubmit,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    event = db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    window = (
        db.query(CheckinWindow)
        .filter(CheckinWindow.event_id == event_id, CheckinWindow.is_open == True)  # noqa: E712
        .first()
    )
    if not window:
        raise HTTPException(status_code=400, detail="Check-in is not open for this event")

    # Codes compared case-insensitively so "abc23" == "ABC23".
    if payload.code.strip().upper() != window.code.upper():
        raise HTTPException(status_code=400, detail="Incorrect code")

    # Prevent double check-in: has this user already earned points for this event?
    already = (
        db.query(PointEntry)
        .filter(PointEntry.user_id == user.id, PointEntry.event_id == event_id)
        .first()
    )
    if already:
        return CheckinResult(
            success=False,
            points_awarded=0,
            message="You've already checked in for this event.",
        )

    entry = PointEntry(
        user_id=user.id,
        event_id=event_id,
        points=event.points,
        reason=f"Attended: {event.title}",
        awarded_by=None,  # automatic
    )
    db.add(entry)
    db.commit()

    return CheckinResult(
        success=True,
        points_awarded=event.points,
        message=f"Checked in! You earned {event.points} point(s).",
    )


@router.get("/{event_id}/attendance", response_model=List[AttendanceRow])
def event_attendance(
    event_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_officer),
):
    event = db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    rows = (
        db.query(PointEntry, User)
        .join(User, User.id == PointEntry.user_id)
        .filter(PointEntry.event_id == event_id)
        .all()
    )
    return [
        AttendanceRow(
            user_id=u.id, full_name=u.full_name, points_awarded=entry.points
        )
        for entry, u in rows
    ]
