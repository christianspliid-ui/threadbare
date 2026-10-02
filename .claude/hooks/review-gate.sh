#!/usr/bin/env bash
# THR-1691 — the automatic code-review gate (PreToolUse, Bash|PowerShell).
#
# Denies `gh pr merge` (arming auto-merge included) on a code diff unless a clean
# review receipt exists for the PR head. The logic lives in scripts/review-gate.ts
# (pure, unit-tested); this wrapper only keeps the hot path cheap: the matcher fires
# on every shell call, so anything that is not a merge exits here without spawning node.
#
# Exit 0 = allow, exit 2 = deny (stderr is shown to the agent). The node side is
# fail-soft: an error in the gate itself allows with a loud warning and a log line.

PAYLOAD="$(cat)"

# Fast path: neither a merge nor a push → allow, no node spawn. (A push is judged
# only when its PR already has auto-merge armed — that push merges with no further
# `gh pr merge`. The node side tokenises, so quoted mentions never match.)
if ! printf '%s' "$PAYLOAD" | grep -Eq 'gh[[:space:]]+pr[[:space:]]+merge|git[[:space:]]+push'; then
  exit 0
fi

HOOK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT="$HOOK_DIR/../../scripts/review-gate.ts"

if [[ ! -f "$SCRIPT" ]] || ! command -v node > /dev/null 2>&1; then
  echo "review-gate: WARNING — cannot run the gate (script or node missing); ALLOWING fail-soft." >&2
  exit 0
fi

printf '%s' "$PAYLOAD" | node --no-warnings --experimental-strip-types "$SCRIPT" hook
STATUS=$?
if [[ $STATUS -eq 2 ]]; then
  exit 2
fi
if [[ $STATUS -ne 0 ]]; then
  echo "review-gate: WARNING — gate exited $STATUS; ALLOWING fail-soft." >&2
fi
exit 0
