#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

echo "=== Ham Radio Exam Prep Bootstrap Setup ==="

# 1. Environment file
if [ ! -f "$REPO_ROOT/.env" ]; then
    echo "Creating .env from .env.example..."
    cp "$REPO_ROOT/.env.example" "$REPO_ROOT/.env"
fi

# 2. Python Virtual Environment
if [ ! -d "$REPO_ROOT/.venv" ]; then
    echo "Creating Python 3.12 virtual environment at $REPO_ROOT/.venv..."
    /home/ubuntu/miniforge3/bin/python3 -m venv "$REPO_ROOT/.venv"
fi

echo "Installing backend dependencies..."
"$REPO_ROOT/.venv/bin/pip" install --upgrade pip
"$REPO_ROOT/.venv/bin/pip" install -r "$REPO_ROOT/backend/requirements.txt"

echo "Running Django database migrations..."
"$REPO_ROOT/.venv/bin/python" "$REPO_ROOT/backend/manage.py" migrate

# 3. Frontend Dependencies
echo "Installing frontend npm dependencies..."
(cd "$REPO_ROOT/frontend" && npm install)

echo "Building frontend to verify bundle..."
(cd "$REPO_ROOT/frontend" && npm run build)

echo "=== Setup complete! Run ./scripts/dev.sh to start development servers. ==="
