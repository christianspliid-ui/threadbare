#!/usr/bin/env bash
set -euo pipefail

# Gate 3: Session Stop Gate
# Checks for loose ends before allowing session to close.

HOOK_DIR="$(cd "$(dirname "$0")" && pwd)"
INPUT=$(cat)

# Loop guard — don't force continuation if we're already in one
STOP_ACTIVE=$(echo "$INPUT" | node "$HOOK_DIR/lib/json-get.js" stop_hook_active)
if [[ "$STOP_ACTIVE" == "true" ]]; then
  echo '{"hookSpecificOutput":{"continue":false}}'
  exit 0
fi

ISSUES=""

# 1. Uncommitted changes (tracked files only, exclude untracked ??)
DIRTY=$(git status --porcelain 2>/dev/null | grep -v '^\?\?' | head -5 || true)
if [[ -n "$DIRTY" ]]; then
  ISSUES="${ISSUES}Uncommitted changes detected. "
fi

# 2. Unpushed commits
UNPUSHED=$(git log @{push}..HEAD --oneline 2>/dev/null | head -5 || true)
if [[ -n "$UNPUSHED" ]]; then
  ISSUES="${ISSUES}Unpushed commits detected. "
fi

if [[ -n "$ISSUES" ]]; then
  # Output JSON for the Stop hook to force continuation
  ESCAPED=$(echo "$ISSUES" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.stringify(d.trim())))")
  echo "{\"hookSpecificOutput\":{\"continue\":true,\"additionalContext\":\"Session stop gate: ${ESCAPED}\"}}"
  exit 0
fi

echo '{"hookSpecificOutput":{"continue":false,"stopReason":"All DoD checks passed — clean session."}}'
exit 0
