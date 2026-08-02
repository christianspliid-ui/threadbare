#!/usr/bin/env bash
# Gate 5: Two-tree edit-path guard (THR-685)
#
# Blocks Write/Edit calls that target the HOME worktree while the session is
# running in a LINKED worktree. That combination is the "two-tree edit-path
# trap": both trees are usually byte-identical, so a repo-root-looking absolute
# path succeeds silently against the wrong tree and nothing surfaces until a
# symbol probe misses. Fired in 4 of 12 hourly runs on 2026-07-20/21
# (impediments #387, #417, #421).
#
# Gate on CWD, not on target alone: interactive sessions legitimately run IN the
# home tree and must never be blocked. Fail-soft everywhere — a guard that
# errors is a guard that stops real work.
#
# THR-880: ownership is resolved against the REGISTERED worktree list, never by
# a bare home-tree prefix test. The harness places .claude/worktrees/ inside the
# home tree's own working copy, so every linked worktree path begins with the
# home-tree path — a prefix test cannot tell a sibling-worktree write from a
# home-tree write, and blocked all of the former (impediment #317).

set -uo pipefail

HOOK_DIR="$(cd "$(dirname "$0")" && pwd)"
INPUT=$(cat)

TOOL=$(echo "$INPUT" | node "$HOOK_DIR/lib/json-get.js" tool_name 2>/dev/null || echo "")
[[ "$TOOL" == "Write" || "$TOOL" == "Edit" ]] || exit 0

FILE_PATH=$(echo "$INPUT" | node "$HOOK_DIR/lib/json-get.js" tool_input.file_path 2>/dev/null || echo "")
CWD=$(echo "$INPUT" | node "$HOOK_DIR/lib/json-get.js" cwd 2>/dev/null || echo "")

# Missing either field → nothing to reason about. Allow.
[[ -n "$FILE_PATH" && -n "$CWD" ]] || exit 0

# Normalize Windows separators; git reports forward slashes.
FILE_PATH="${FILE_PATH//\\//}"
CWD="${CWD//\\//}"

# Resolve the session's worktree root and the shared .git dir. In a linked
# worktree --git-common-dir points at the MAIN repo's .git, so its parent is
# the home tree. Derived, never hardcoded — works for .claude/worktrees/* and
# sibling tfws-pickup-* alike.
WT_ROOT=$(git -C "$CWD" rev-parse --show-toplevel 2>/dev/null) || exit 0
COMMON_DIR=$(git -C "$CWD" rev-parse --path-format=absolute --git-common-dir 2>/dev/null) || exit 0
[[ -n "$WT_ROOT" && -n "$COMMON_DIR" ]] || exit 0

HOME_TREE="$(dirname "$COMMON_DIR")"

# Case-insensitive compare: Windows paths vary in drive-letter and segment case.
lower() { echo "$1" | tr '[:upper:]' '[:lower:]'; }
FP_L=$(lower "$FILE_PATH")
WT_L=$(lower "$WT_ROOT")
HOME_L=$(lower "$HOME_TREE")

# Session is in the main tree (not a linked worktree) → allow everything.
[[ "$WT_L" == "$HOME_L" ]] && exit 0

# Target is inside the session worktree → correct tree, allow. Fast path for the
# overwhelmingly common case; also handled by the ownership resolution below.
[[ "$FP_L" == "$WT_L"/* ]] && exit 0

# --- Ownership resolution (THR-880) ---------------------------------------
# Which registered worktree does the target belong to? Every linked worktree
# under .claude/worktrees/ is lexically under the home tree, so the LONGEST
# matching registered root is the owner — never the first or the shortest.
# Lexical on purpose: a Write may target a path that does not exist yet, so
# resolving the target's own directory with git is not always available.
WORKTREE_ROOTS=$(git -C "$CWD" worktree list --porcelain 2>/dev/null | sed -n 's/^worktree //p')

# Cannot enumerate → cannot attribute ownership. Fail-soft: allow (consistent
# with every other unresolvable branch in this guard).
[[ -n "$WORKTREE_ROOTS" ]] || exit 0

OWNER_L=""
while IFS= read -r root; do
  [[ -n "$root" ]] || continue
  root_l=$(lower "${root//\\//}")
  [[ "$FP_L" == "$root_l"/* ]] || continue
  (( ${#root_l} > ${#OWNER_L} )) && OWNER_L="$root_l"
done <<< "$WORKTREE_ROOTS"

# Target sits outside every registered tree (scratchpad, ~/.claude, elsewhere)
# → not our concern, allow.
[[ -n "$OWNER_L" ]] || exit 0

# Owned by a worktree that is not the home tree — i.e. a SIBLING linked
# worktree. A legitimate cross-worktree edit (repairing another lane's branch),
# never the two-tree trap. Allow.
[[ "$OWNER_L" == "$HOME_L" ]] || exit 0

# Linked worktree writing into the home tree → the trap. Block with the fix.
SUFFIX="${FILE_PATH:${#HOME_TREE}}"
CORRECTED="${WT_ROOT}${SUFFIX}"

MKDIR_NOTE=""
[[ -d "$(dirname "$CORRECTED")" ]] || MKDIR_NOTE="
(That directory does not exist in the session worktree yet — create it first.)"

cat >&2 <<EOF
Two-tree edit-path guard (THR-685): blocked a write into the HOME worktree from a linked-worktree session.

  session worktree : $WT_ROOT
  home tree        : $HOME_TREE
  attempted path   : $FILE_PATH

The home tree is a read-only mirror of main (THR-672). This write would have
succeeded silently against the wrong tree — both trees are usually identical,
so nothing would surface until verification ran against unedited code.

Use the worktree-prefixed path instead:

  $CORRECTED$MKDIR_NOTE

If you genuinely meant the home tree, do it from a home-tree session. Recovery
for edits that already landed there: Docs/impediments.md #417 (diff → checkout
-- → git apply into the worktree).
EOF
exit 2
