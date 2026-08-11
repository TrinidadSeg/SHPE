import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app import models  # noqa: F401 - registers models before create_all
from app.routers_auth import router as auth_router
from app.routers_events import router as events_router
from app.routers_checkin import router as checkin_router
from app.routers_points import router as points_router
from app.routers_announcements import router as announcements_router

# Create database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="SHPE Purdue Portal")

# Allowed frontend origins. Local dev is always allowed; in production,
# set FRONTEND_ORIGIN to your deployed site's URL (comma-separated if several).
default_origins = ["http://localhost:5173"]
extra = os.getenv("FRONTEND_ORIGIN", "")
allowed_origins = default_origins + [o.strip() for o in extra.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(events_router)
app.include_router(checkin_router)
app.include_router(points_router)
app.include_router(announcements_router)


@app.get("/api/health")
def health():
    return {"status": "ok", "message": "Backend is running"}
