#!/usr/bin/env bash
# Stop hook: session-end auto-retro
#
# Phase 1 (stop_hook_active=false): Block session close; prompt agent to write
#   friction entries to .retro-pending.txt.
# Phase 2 (stop_hook_active=true): Run session-end-retro.ts to parse the
#   pending file, append rows to Docs/impediments.md, and draft a retro stub
#   when friction is significant. Delete the pending file either way.
#
# Fail-soft contract: exits 0 in all error paths — session must always close.
# See .claude/hooks/README.md for per-session disable instructions.

set -uo pipefail

HOOK_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$HOOK_DIR/../.." && pwd)"
LOG_FILE="$HOOK_DIR/stop-retro.log"
PENDING_FILE="$HOOK_DIR/.retro-pending.txt"

log() {
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*" >> "$LOG_FILE" 2>/dev/null || true
}

# Read hook input (may be empty in some CC versions)
INPUT=$(cat 2>/dev/null || echo '{}')

SESSION_ID=$(echo "$INPUT" | node "$HOOK_DIR/lib/json-get.js" session_id 2>/dev/null || echo "unknown")
STOP_ACTIVE=$(echo "$INPUT" | node "$HOOK_DIR/lib/json-get.js" stop_hook_active 2>/dev/null || echo "false")

# Per-session opt-out: set STOP_HOOK_RETRO_SKIP=1 before launching claude
if [[ "${STOP_HOOK_RETRO_SKIP:-}" == "1" ]]; then
  log "STOP_HOOK_RETRO_SKIP=1 — skipping retro hook (session=$SESSION_ID)"
  echo '{"hookSpecificOutput":{"continue":false}}'
  exit 0
fi

if [[ "$STOP_ACTIVE" == "true" ]]; then
  # ----- Phase 2: process the pending file -----
  log "Phase 2 (stop_hook_active=true) session=$SESSION_ID — processing pending file"

  if [[ -f "$PENDING_FILE" ]]; then
    node --experimental-strip-types "$REPO_ROOT/scripts/session-end-retro.ts" \
      >> "$LOG_FILE" 2>&1 \
      || log "session-end-retro.ts exited non-zero (non-blocking)"

    rm -f "$PENDING_FILE" || true
    log "Pending file consumed and deleted"
  else
    log "No pending file found — agent may have responded 'none' or hook errored in Phase 1"
  fi

  echo '{"hookSpecificOutput":{"continue":false}}'
  exit 0
fi

# ----- Phase 1: prompt agent for friction summary -----
log "Phase 1 (first stop) session=$SESSION_ID — prompting for reflection"

# Write an empty pending file so Phase 2 knows Phase 1 ran.
# The agent will overwrite it with actual entries (or leave it empty = none).
printf '' > "$PENDING_FILE" 2>/dev/null || true

PROMPT='Session-end auto-retro: write your friction entries to .claude/hooks/.retro-pending.txt (use the Write tool), then confirm done.

Format — one entry per line:
  category: one-sentence description

Categories: tool-failure | api-quirk | permission | environment | skill-gap | process-friction | dependency | unclear-requirements | flaky-test | code-bug | other

Or write a single line: none

Example file contents:
  api-quirk: Linear save_issue silently dropped state write — had to verify with get_issue after every call
  environment: npm test timed out at default limit — needed explicit longer timeout flag

Keep descriptions to one sentence. Entries go into Docs/impediments.md automatically.'

# JSON-encode the prompt string
PROMPT_JSON=$(printf '%s' "$PROMPT" | node -e "
  const chunks = [];
  process.stdin.on('data', c => chunks.push(c));
  process.stdin.on('end', () => process.stdout.write(JSON.stringify(chunks.join(''))));
" 2>/dev/null || echo '"[retro prompt encoding failed — skip]"')

printf '{"hookSpecificOutput":{"continue":true,"additionalContext":%s}}\n' "$PROMPT_JSON"
exit 0
