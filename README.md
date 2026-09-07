# SHPE Purdue Portal

Member portal for SHPE at Purdue. Members RSVP and check in at events with a
time-limited code to earn points; points drive the conference-eligibility
leaderboard. Officers create events, run check-in, award points, and post news.

## Stack
- Backend: Python + FastAPI, SQLAlchemy, JWT auth (SQLite locally)
- Frontend: React + Vite

## Run the backend
```bash
cd backend
./setup.sh                                   # one-time install
.venv/bin/python seed.py you@purdue.edu pass "Your Name"   # first admin
./run.sh                                     # http://localhost:8000
```

## Run the frontend (separate terminal)
```bash
cd frontend
npm install      # one-time
npm run dev      # http://localhost:5173
```
Open http://localhost:5173. The frontend proxies /api to the backend automatically.

## Roles
- member: RSVP, check in, see points + leaderboard + news
- officer: + create events, open/close check-in, post announcements
- admin: + award points manually, change roles

Promote someone to officer/admin from the backend for now (role management UI TBD).

## Deploying later
- Set a strong SECRET_KEY (env var): `openssl rand -hex 32`
- Point DATABASE_URL at Azure SQL / Postgres
- Lock CORS allow_origins to your real domain in app/main.py
- Use migrations instead of create_all
