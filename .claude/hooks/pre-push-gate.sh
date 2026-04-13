#!/usr/bin/env bash
set -euo pipefail

# Gate 2: Pre-Push Gate
# Blocks pushes that haven't updated required documentation (Definition of Done).

# User-requested bypass
if [[ "${SKIP_DOD_DOCS:-}" == "1" ]]; then
  exit 0
fi

# Read and discard stdin (hooks always pipe JSON input)
cat > /dev/null

ERRORS=""
PUSH_BASE="@{push}"

# If no upstream tracking, compare against origin/main
if ! git rev-parse "$PUSH_BASE" > /dev/null 2>&1; then
  PUSH_BASE="origin/main"
fi

# Check each required doc file for new additions
check_doc_updated() {
  local FILE="$1"
  local LABEL="$2"
  if ! git diff "$PUSH_BASE"..HEAD -- "$FILE" 2>/dev/null | grep -q '^+'; then
    ERRORS="${ERRORS}
${LABEL} has no new entries since last push"
  fi
}

check_doc_updated "Docs/changelog.md" "changelog.md"
check_doc_updated "Docs/project-status.md" "project-status.md"
check_doc_updated "Docs/project-history.md" "project-history.md"

# Production build check
BUILD_OUTPUT=$(npx vite build 2>&1) || {
  ERRORS="${ERRORS}
Production build failed:
$(echo "$BUILD_OUTPUT" | tail -10)"
}

if [[ -n "$ERRORS" ]]; then
  printf "Pre-push gate FAILED (Definition of Done incomplete):%s\n\nFix all issues above before pushing.\n" "$ERRORS" >&2
  exit 2
fi

exit 0
