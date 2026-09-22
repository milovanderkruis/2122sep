#!/bin/sh
# Draait de Python-tests van de MCP-server. Gebruikt mcp/.venv als die er is, zodat ook
# de test met de echte server meedoet.
cd "$(dirname "$0")" || exit 1
PY=python3
[ -x .venv/bin/python ] && PY=.venv/bin/python
exec "$PY" -m unittest discover -s . -p "test_*.py"
