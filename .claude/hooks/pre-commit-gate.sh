#!/usr/bin/env bash
set -euo pipefail

# Gate 1: Pre-Commit Gate
# Blocks commits that haven't passed the pre-commit minimum (tsc + tests).

HOOK_DIR="$(cd "$(dirname "$0")" && pwd)"

# Read hook input from stdin
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | node "$HOOK_DIR/lib/json-get.js" tool_input.command)

# Allow --amend and --no-verify commits through
if [[ "$COMMAND" == *"--amend"* ]] || [[ "$COMMAND" == *"--no-verify"* ]]; then
  exit 0
fi

# User-requested bypass
if [[ "${SKIP_DOD_TESTS:-}" == "1" ]]; then
  exit 0
fi

ERRORS=""

# 1. TypeScript check
TSC_OUTPUT=$(npx tsc --noEmit 2>&1) || {
  ERRORS="${ERRORS}
TypeScript errors:
$(echo "$TSC_OUTPUT" | head -20)"
}

# 2. Test suite
TEST_OUTPUT=$(npm test 2>&1) || {
  ERRORS="${ERRORS}
Tests failed:
$(echo "$TEST_OUTPUT" | tail -20)"
}

# 3. Untracked imports — files imported by tracked files but not git-tracked
UNTRACKED=$(git ls-files --others --exclude-standard -- 'src/**/*.ts' 'src/**/*.tsx' 2>/dev/null | head -20)
if [[ -n "$UNTRACKED" ]]; then
  while IFS= read -r F; do
    BASENAME=$(basename "$F" | sed 's/\.[^.]*$//')
    if git grep -l "from.*['\"].*${BASENAME}['\"]" -- '*.ts' '*.tsx' > /dev/null 2>&1; then
      ERRORS="${ERRORS}
Untracked file imported by tracked code: $F"
    fi
  done <<< "$UNTRACKED"
fi

if [[ -n "$ERRORS" ]]; then
  printf "Pre-commit gate FAILED:%s\n" "$ERRORS" >&2
  exit 2
fi

exit 0
