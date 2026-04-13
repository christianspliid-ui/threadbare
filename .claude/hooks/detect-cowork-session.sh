#!/usr/bin/env bash
# SessionStart hook: detect Cowork VM and write a marker file.
# Other hooks read this marker for fast Cowork detection.
# Runs once per session.

MARKER="/tmp/.cowork-session-marker"

# Cowork VM detection heuristics (any match = Cowork):
# 1. cwd contains /sessions/ (Cowork sandbox mount path)
# 2. /sessions/ directory exists (Cowork VM filesystem)
IS_COWORK=false

if [[ "$PWD" == */sessions/* ]]; then
  IS_COWORK=true
elif [[ -d "/sessions" ]]; then
  IS_COWORK=true
fi

if [[ "$IS_COWORK" == "true" ]]; then
  echo "COWORK_SESSION=1" > "$MARKER"
else
  echo "COWORK_SESSION=0" > "$MARKER"
fi

exit 0
