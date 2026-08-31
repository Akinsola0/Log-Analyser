#!/usr/bin/env bash
# Launcher for macOS and Linux. Sets up a virtual environment on first run.
set -euo pipefail
cd "$(dirname "$0")"

if ! command -v python3 >/dev/null 2>&1; then
  echo "Python 3 was not found. Install it, then run this again." >&2
  exit 1
fi

if [ ! -x ".venv/bin/python" ]; then
  echo "Setting up for first use. This takes a minute..."
  python3 -m venv .venv
fi

if ! .venv/bin/python -c "import flask, yaml" >/dev/null 2>&1; then
  echo "Installing dependencies..."
  .venv/bin/python -m pip install --quiet --disable-pip-version-check -r requirements.txt
fi

PORT="${1:-5000}"
echo
echo "  Starting Log Analyser at http://127.0.0.1:${PORT}"
echo "  Press Ctrl+C to stop."
echo
exec .venv/bin/python run.py --port "$PORT"
