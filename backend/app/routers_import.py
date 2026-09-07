import csv
import io
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Event, User, PointEntry
from app.schemas import ImportResult, UnmatchedRow
from app.auth import require_officer

router = APIRouter(prefix="/api/events", tags=["import"])

# Header cells (case-insensitive) that mark the real data table, seen in
# university attendance exports (e.g. Purdue Involvement/Presence).
NAME_MARKERS = {"first name", "last name"}
EMAIL_HEADERS = ["campus email", "preferred email", "email"]
STATUS_HEADERS = ["attendance status", "status"]

# Status values that mean the person did NOT attend, even though they're
# listed on the roster. Everything else (including a blank status) counts
# as attended, since many exports only list people who showed up.
ABSENT_KEYWORDS = ["no show", "noshow", "absent", "did not attend", "not attend", "excused", "cancel"]


def _find_header_row(rows: List[List[str]]) -> Optional[int]:
    """Scan the first ~15 rows for the real column-header row."""
    for i, row in enumerate(rows[:15]):
        lowered = {cell.strip().lower() for cell in row}
        if NAME_MARKERS.issubset(lowered):
            return i
    return None


def _col_index(header: List[str], candidates: List[str]) -> Optional[int]:
    lowered = [h.strip().lower() for h in header]
    for name in candidates:
        if name in lowered:
            return lowered.index(name)
    return None


@router.post("/{event_id}/import-attendance", response_model=ImportResult)
async def import_attendance(
    event_id: int,
    file: UploadFile = File(...),
    dry_run: bool = Form(True),
    db: Session = Depends(get_db),
    officer=Depends(require_officer),
):
    event = db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    raw = (await file.read()).decode("utf-8-sig", errors="ignore")
    reader = csv.reader(io.StringIO(raw))
    rows = [row for row in reader if any(cell.strip() for cell in row)]

    header_idx = _find_header_row(rows)
    if header_idx is None:
        raise HTTPException(
            status_code=400,
            detail="Could not find a header row with 'First Name' and 'Last Name' columns.",
        )

    header = rows[header_idx]
    data_rows = rows[header_idx + 1 :]

    first_i = _col_index(header, ["first name"])
    last_i = _col_index(header, ["last name"])
    email_i = _col_index(header, EMAIL_HEADERS)
    status_i = _col_index(header, STATUS_HEADERS)

    if email_i is None:
        raise HTTPException(
            status_code=400,
            detail="Could not find an email column (expected 'Campus Email' or similar).",
        )

    # Pre-load all users into an email -> User map for fast, case-insensitive matching.
    users_by_email = {u.email.strip().lower(): u for u in db.query(User).all()}

    # Existing point entries for this event, so we don't double-award
    # someone who already checked in with the code.
    already_awarded_ids = {
        pe.user_id
        for pe in db.query(PointEntry).filter(PointEntry.event_id == event_id).all()
    }

    total_rows = 0
    attended_rows = 0
    matched = 0
    awarded = 0
    already_had_points = 0
    unmatched: List[UnmatchedRow] = []
    to_award: List[User] = []

    for row in data_rows:
        if len(row) <= email_i or not row[email_i].strip():
            continue
        total_rows += 1

        status_val = row[status_i].strip() if status_i is not None and len(row) > status_i else ""
        if any(k in status_val.lower() for k in ABSENT_KEYWORDS):
            continue  # explicitly marked absent — skip entirely
        attended_rows += 1

        email = row[email_i].strip().lower()
        first = row[first_i].strip() if first_i is not None and len(row) > first_i else ""
        last = row[last_i].strip() if last_i is not None and len(row) > last_i else ""
        display_name = f"{first} {last}".strip() or email

        user = users_by_email.get(email)
        if not user:
            unmatched.append(UnmatchedRow(name=display_name, email=email, status=status_val or None))
            continue

        matched += 1
        if user.id in already_awarded_ids:
            already_had_points += 1
            continue

        to_award.append(user)

    if not dry_run:
        reason = f"Attended: {event.title}"
        for user in to_award:
            db.add(
                PointEntry(
                    user_id=user.id,
                    event_id=event.id,
                    points=event.points,
                    reason=reason,
                    awarded_by=officer.id,
                )
            )
        db.commit()
        awarded = len(to_award)

    return ImportResult(
        dry_run=dry_run,
        event_title=event.title,
        points_per_person=event.points,
        total_rows=total_rows,
        attended_rows=attended_rows,
        matched=matched,
        awarded=awarded,
        already_had_points=already_had_points,
        unmatched=unmatched,
    )
