#!/usr/bin/env bash
set -e

# Resolve repository root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

echo "=== Starting Ham Radio Exam Prep Development Servers ==="
echo "Repository root: $REPO_ROOT"

# Ensure venv exists
VENV_PYTHON="$REPO_ROOT/.venv/bin/python"
if [ ! -f "$VENV_PYTHON" ]; then
    echo "Error: Python virtualenv not found at $REPO_ROOT/.venv"
    exit 1
fi

# Trap SIGINT and SIGTERM to kill background children cleanly
trap 'echo -e "\nStopping all development servers..."; kill $(jobs -p) 2>/dev/null || true; exit 0' SIGINT SIGTERM

# Start Django backend
echo "-> Starting Django API Server on http://127.0.0.1:8000..."
(cd "$REPO_ROOT/backend" && "$VENV_PYTHON" manage.py runserver 127.0.0.1:8000) &
DJANGO_PID=$!

# Start Vite React frontend
echo "-> Starting Vite Dev Server on http://localhost:5173..."
(cd "$REPO_ROOT/frontend" && npm run dev -- --host 0.0.0.0) &
VITE_PID=$!

echo "=========================================================="
echo "Backend:  http://127.0.0.1:8000/api/docs (OpenAPI Swagger)"
echo "Frontend: http://localhost:5173"
echo "Press Ctrl+C to terminate both servers."
echo "=========================================================="

wait
