#!/usr/bin/env bash
# Sets up the backend cleanly. Safe to re-run — it starts fresh each time.
set -e  # stop on first error

echo "==> SHPE Portal backend setup"

# 1. Find a working Python 3
if command -v python3 >/dev/null 2>&1; then
  PY=python3
else
  echo "ERROR: python3 not found. Install Python 3 from https://www.python.org/downloads/"
  exit 1
fi
echo "Using: $($PY --version)"

# 2. Remove any old/broken virtual environment
if [ -d ".venv" ]; then
  echo "==> Removing old .venv (fixes broken installs)"
  rm -rf .venv
fi

# 3. Create a fresh virtual environment
echo "==> Creating virtual environment"
$PY -m venv .venv

# 4. Use the venv's python directly (no 'activate' / PATH guesswork)
VENV_PY=".venv/bin/python"

# 5. Upgrade pip inside the venv and install deps fresh (no cache = no corruption)
echo "==> Upgrading pip"
$VENV_PY -m pip install --upgrade pip --no-cache-dir

echo "==> Installing dependencies"
$VENV_PY -m pip install --no-cache-dir -r requirements.txt

# 6. Verify the key packages actually import
echo "==> Verifying install"
$VENV_PY -c "import fastapi, uvicorn, anyio; print('All packages import OK')"

echo ""
echo "==> Setup complete!"
echo "Start the server with:"
echo "    ./run.sh"
