import enum
from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, Enum, Text, ForeignKey, Boolean
from app.database import Base


class Role(str, enum.Enum):
    member = "member"
    officer = "officer"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    major = Column(String, nullable=True)
    grad_year = Column(Integer, nullable=True)
    role = Column(Enum(Role), default=Role.member, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    location = Column(String, nullable=True)
    starts_at = Column(DateTime, nullable=False)
    ends_at = Column(DateTime, nullable=True)
    points = Column(Integer, default=1, nullable=False)  # points awarded for attending
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class CheckinWindow(Base):
    """A check-in period for an event. Holds the code; only valid while open."""
    __tablename__ = "checkin_windows"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    code = Column(String, nullable=False)
    is_open = Column(Boolean, default=True, nullable=False)
    opened_at = Column(DateTime, default=datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)


class PointEntry(Base):
    """The ledger. Every point a member has is one row here.

    Source of a member's total = SUM(points) of their entries.
    event_id is null for manual awards not tied to an event.
    awarded_by is null for automatic (check-in) awards.
    """
    __tablename__ = "point_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=True)
    points = Column(Integer, nullable=False)
    reason = Column(String, nullable=False)
    awarded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
