from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, ConfigDict
from app.models import Role


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    major: Optional[str] = None
    grad_year: Optional[int] = None


class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    major: Optional[str] = None
    grad_year: Optional[int] = None
    role: Role
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---- Events ----
class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    starts_at: datetime
    ends_at: Optional[datetime] = None
    points: int = 1


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    points: Optional[int] = None


class EventOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    starts_at: datetime
    ends_at: Optional[datetime] = None
    points: int
    created_by: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ---- Check-in ----
class CheckinWindowOut(BaseModel):
    id: int
    event_id: int
    code: str
    is_open: bool
    model_config = ConfigDict(from_attributes=True)


class CheckinSubmit(BaseModel):
    code: str


class CheckinResult(BaseModel):
    success: bool
    points_awarded: int
    message: str


class AttendanceRow(BaseModel):
    user_id: int
    full_name: str
    points_awarded: int


# ---- Points ----
class PointHistoryItem(BaseModel):
    points: int
    reason: str
    event_id: Optional[int] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class MyPoints(BaseModel):
    total: int
    history: list[PointHistoryItem]


class LeaderboardRow(BaseModel):
    rank: int
    user_id: int
    full_name: str
    total: int
    is_me: bool = False


class AwardPoints(BaseModel):
    user_id: int
    points: int
    reason: str


# ---- Announcements ----
class AnnouncementCreate(BaseModel):
    title: str
    body: str


class AnnouncementOut(BaseModel):
    id: int
    title: str
    body: str
    author_name: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
