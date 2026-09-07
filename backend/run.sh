#!/usr/bin/env bash
# Starts the backend server using the venv's python directly.
set -e

if [ ! -d ".venv" ]; then
  echo "No .venv found. Run ./setup.sh first."
  exit 1
fi

echo "==> Starting server at http://localhost:8000"
echo "    Health check: http://localhost:8000/api/health"
echo "    API docs:     http://localhost:8000/docs"
echo "    Press CTRL+C to stop."
echo ""

.venv/bin/python -m uvicorn app.main:app --reload
