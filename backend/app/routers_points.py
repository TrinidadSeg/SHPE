from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import PointEntry, User
from app.schemas import (
    MyPoints,
    PointHistoryItem,
    LeaderboardRow,
    AwardPoints,
)
from app.auth import get_current_user, require_officer

router = APIRouter(prefix="/api/points", tags=["points"])


def total_for(db: Session, user_id: int) -> int:
    result = (
        db.query(func.coalesce(func.sum(PointEntry.points), 0))
        .filter(PointEntry.user_id == user_id)
        .scalar()
    )
    return int(result)


@router.get("/me", response_model=MyPoints)
def my_points(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    entries = (
        db.query(PointEntry)
        .filter(PointEntry.user_id == user.id)
        .order_by(PointEntry.created_at.desc())
        .all()
    )
    return MyPoints(
        total=total_for(db, user.id),
        history=[PointHistoryItem.model_validate(e) for e in entries],
    )


@router.get("/leaderboard", response_model=List[LeaderboardRow])
def leaderboard(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    # Sum points per user, highest first. Users with zero entries still show (via outer join).
    rows = (
        db.query(
            User.id,
            User.full_name,
            func.coalesce(func.sum(PointEntry.points), 0).label("total"),
        )
        .outerjoin(PointEntry, PointEntry.user_id == User.id)
        .group_by(User.id, User.full_name)
        .order_by(func.coalesce(func.sum(PointEntry.points), 0).desc(), User.full_name)
        .all()
    )
    return [
        LeaderboardRow(
            rank=i + 1,
            user_id=r.id,
            full_name=r.full_name,
            total=int(r.total),
            is_me=(r.id == user.id),
        )
        for i, r in enumerate(rows)
    ]


@router.post("/award", response_model=MyPoints)
def award_points(
    payload: AwardPoints,
    db: Session = Depends(get_db),
    officer: User = Depends(require_officer),
):
    target = db.get(User, payload.user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    entry = PointEntry(
        user_id=payload.user_id,
        event_id=None,  # manual award, not tied to an event
        points=payload.points,
        reason=payload.reason,
        awarded_by=officer.id,
    )
    db.add(entry)
    db.commit()

    # Return the target's updated total + history.
    entries = (
        db.query(PointEntry)
        .filter(PointEntry.user_id == payload.user_id)
        .order_by(PointEntry.created_at.desc())
        .all()
    )
    return MyPoints(
        total=total_for(db, payload.user_id),
        history=[PointHistoryItem.model_validate(e) for e in entries],
    )
