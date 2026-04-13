# Definition of Done — Hook Enforcement Design

> **Date:** 2026-04-13
> **Type:** Process infrastructure
> **Status:** Partially implemented — Gates 4 + SessionStart live; Gates 1-3 awaiting implementation. Updated 2026-04-13 for Linear migration (BACKLOG.md/HANDOVER.md retired).
> **Problem:** The Definition of Done in CLAUDE.md is convention-enforced (agents are told to follow it) rather than mechanism-enforced (agents are blocked from proceeding if they skip steps). Agents drift, especially across long sessions or after context compression.

---

## Current Definition of Done (from CLAUDE.md)

These are the steps agents are *supposed* to do after completing work:

1. **Commit** all changes
2. **Push** to GitHub
3. **Merge** feature branches into main immediately
4. **Deploy** — Vercel auto-deploys from push to main
5. **Update docs** — project-status.md (≤60 lines), project-history.md (one-line ✅ entry), changelog.md (append rows). Move Linear issue to "Done" with completion comment.
6. **Verify wiring** — check new modules against wiring-checklist.md
7. **Log impediments** — any blockers or workarounds → Docs/impediments.md
8. **Close out** — tell user "Session ready to archive"

Plus the **pre-commit minimum:**
- `npm test` — all tests pass
- `npx tsc --noEmit` — type check clean
- `npx vite build` — production build succeeds

**What goes wrong today:** Steps 5-7 are frequently skipped or partially completed. The pre-commit minimum is sometimes skipped when agents are deep in a multi-commit session. Linear issue states don't get updated. No mechanism detects these omissions — only human review.

---

## Design: Three Hook Gates

### Gate 1: Pre-Commit Gate (`PreToolUse` → `Bash(git commit*)`)

**Purpose:** Block commits that haven't passed the pre-commit minimum.

**What it checks:**
1. **TypeScript clean** — `npx tsc --noEmit` exits 0
2. **Tests pass** — `npm test` exits 0
3. **No untracked imports** — all files imported by tracked files are also tracked (addresses Impediment #4, which has 3 occurrences)

**What it does NOT check (and why):**
- `npx vite build` — too slow (~30s) for every commit. The push gate or CI catches this.
- Doc updates — those are gated at push time, not commit time, because multi-commit sessions may update docs at the end.

**Behavior:**
- Runs `npx tsc --noEmit` and `npm test` (can run in parallel)
- If either fails → exit 2, stderr contains the failure summary → Claude sees the block and must fix
- The untracked-import check is a fast `git ls-files` + grep, takes <1s

**Bypass:** The hook script accepts a `--skip-tests` flag via env var `SKIP_DOD_TESTS=1` for rare cases where the user explicitly wants a WIP commit. This is a conscious override, not a silent skip.

```json
{
  "matcher": "Bash(git commit*)",
  "hooks": [{
    "type": "command",
    "command": "bash .claude/hooks/pre-commit-gate.sh",
    "timeout": 120,
    "statusMessage": "Running pre-commit checks (tsc + tests)..."
  }]
}
```

### Gate 2: Pre-Push Gate (`PreToolUse` → `Bash(git push*)`)

**Purpose:** Block pushes that haven't updated the required documentation. This is the hard gate for the Definition of Done.

**What it checks (against the diff since last push):**

| Check | How | Failure message |
|-------|-----|-----------------|
| changelog.md updated | `git diff @{push}..HEAD -- Docs/changelog.md` has additions | "changelog.md has no new entries" |
| project-status.md updated | Same diff check | "project-status.md not updated" |
| project-history.md updated | Same diff check | "project-history.md not updated" |
| Build succeeds | `npx vite build` exits 0 | "Production build failed" |

**What it does NOT check (and why):**
- Linear issue state — issue tracking is via MCP, not file diffs; can't query from a shell hook
- wiring-checklist.md — too semantic for a shell script to verify; this stays as a convention check
- impediments.md — only required when impediments actually occurred; can't detect this programmatically

**Behavior:**
- Runs all diff checks (fast, <1s each)
- Runs `npx vite build` (slower, but only fires on push — not every commit)
- If any check fails → exit 2 with a summary listing ALL failures (not just the first), so Claude can fix everything in one pass

**Bypass:** `SKIP_DOD_DOCS=1` env var for edge cases (hotfixes, doc-only pushes that don't touch code).

```json
{
  "matcher": "Bash(git push*)",
  "hooks": [{
    "type": "command",
    "command": "bash .claude/hooks/pre-push-gate.sh",
    "timeout": 120,
    "statusMessage": "Verifying Definition of Done (docs + build)..."
  }]
}
```

### Gate 3: Session Stop Gate (`Stop` hook)

**Purpose:** Before an agent says "done," check for loose ends and force continuation if needed.

**What it checks:**
1. **Uncommitted changes** — `git status --porcelain` is non-empty
2. **Unpushed commits** — `git log @{push}..HEAD` has entries

**Behavior:**
- If loose ends detected → return `{ "hookSpecificOutput": { "continue": true, "additionalContext": "..." } }`
- The `additionalContext` lists exactly what's unfinished
- **Loop guard:** Check `stop_hook_active` — if already in a forced continuation, allow stop (prevent infinite loops)
- If everything is clean → return `{ "hookSpecificOutput": { "continue": false } }`

```json
{
  "matcher": null,
  "hooks": [{
    "type": "command",
    "command": "bash .claude/hooks/session-stop-gate.sh",
    "timeout": 15,
    "statusMessage": "Checking for loose ends..."
  }]
}
```

### Gate 4: Cowork Role Boundary Gate (`PreToolUse` → `Write|Edit` and `Bash`)

**Purpose:** Prevent Cowork sessions from writing production code. Cowork's role is design, planning, and documentation — never implementation. This is currently a convention in CLAUDE.md and `cowork-ways-of-working.md` that agents sometimes violate.

**Detection strategy — how to know we're in Cowork:**

The hook receives the session's `cwd` in the JSON stdin. Cowork runs in a sandboxed Linux VM where the project is mounted at a path like `/sessions/*/mnt/TheFantasyWorldSimulator/`. Claude Code running locally would have the real project path. The hook checks for the Cowork VM signature.

Additionally, the hook can check for `$COWORK_SESSION` — an env var we set via a `SessionStart` hook that detects the VM environment.

**What it blocks (when in Cowork):**

| Tool | Blocked pattern | Allowed |
|------|----------------|---------|
| Write/Edit | Any path containing `src/`, `scripts/`, `public/` (except `public/docs/`) | `.planning/`, `Docs/`, vault paths, outputs dir |
| Write/Edit | Any `.ts`, `.tsx`, `.js`, `.jsx`, `.css`, `.json` in project root or code dirs | `settings.json` in `.claude/`, `.json` in `.planning/` |
| Bash | `git add`, `git commit`, `git push`, `git merge`, `git checkout`, `git rebase` | `git log`, `git diff`, `git status`, `git show` (read-only) |
| Bash | `npm test`, `npm run build`, `npm run dev` | `npx tsc --noEmit` (read-only type check) |

**What it allows (Cowork's legitimate work):**

- Read any file (Read tool is never blocked — read-only analysis is core to Cowork's role)
- Write to `.planning/` (ROADMAP.md, coordination files)
- Write to `Docs/` and `Docs/plans/` (design docs, changelogs, ways of working)
- Write to the outputs directory (workspace artifacts for the user)
- Obsidian MCP operations (separate tool, not gated by file hooks)
- `git log`, `git diff`, `git status` (read-only git inspection)
- `npx tsc --noEmit` (read-only type checking for analysis)

**Behavior:**
- Exit 2 with a clear message: `"🚫 Cowork role boundary: [Write/Edit/Bash] to [path] is not allowed in Cowork sessions. Cowork does design, planning, and documentation — not implementation. Write a plan and hand off to Claude Code via Linear."`
- In Claude Code sessions → exit 0 immediately (no blocking)

**Important caveat:** It is **not confirmed** whether Claude Code hooks fire in Cowork sessions. Cowork is built on Claude Code infrastructure but may have its own tool dispatch that bypasses project hooks. This gate should be tested during burn-in. If hooks don't fire in Cowork, the fallback is the existing CLAUDE.md convention reinforced by the `SessionStart` hook (see below).

```json
{
  "matcher": "Write|Edit",
  "hooks": [{
    "type": "command",
    "command": "bash .claude/hooks/cowork-role-gate.sh",
    "timeout": 5,
    "statusMessage": "Checking Cowork role boundary..."
  }]
},
{
  "matcher": "Bash",
  "hooks": [{
    "type": "command",
    "command": "bash .claude/hooks/cowork-role-gate.sh",
    "timeout": 5,
    "statusMessage": "Checking Cowork role boundary..."
  }]
}
```

### SessionStart: Cowork Detection Beacon

A lightweight `SessionStart` hook that detects the Cowork VM environment and writes a marker. Other hooks read this marker for fast Cowork detection.

```json
{
  "hooks": [{
    "type": "command",
    "command": "bash .claude/hooks/detect-cowork-session.sh",
    "timeout": 5,
    "once": true
  }]
}
```

---

## File Structure

```
.claude/
  settings.json                  ← hook configuration added here
  hooks/
    detect-cowork-session.sh     ← SessionStart: detect Cowork VM, write marker
    cowork-role-gate.sh          ← Gate 4: block code writes in Cowork sessions
    pre-commit-gate.sh           ← Gate 1: tsc + tests + untracked imports
    pre-push-gate.sh             ← Gate 2: doc updates + vite build
    session-stop-gate.sh         ← Gate 3: uncommitted/unpushed/kanban state
    lib/
      json-get.js               ← shared: extract dot-path from JSON stdin (implemented)
      check-docs-updated.sh     ← shared: diff-based doc update checker
```

All scripts are committed to the repo, so both Claude Code agents and the user's local environment benefit.

---

## Hook Script Specifications

### detect-cowork-session.sh

```bash
#!/usr/bin/env bash
# SessionStart hook: detect Cowork VM and write a marker file.
# Other hooks read this marker for fast Cowork detection.
# Runs once per session.

MARKER="${CLAUDE_ENV_FILE:-/tmp/.cowork-session-marker}"

# Cowork VM detection heuristics (any match = Cowork):
# 1. cwd contains /sessions/ (Cowork sandbox mount path)
# 2. /sessions/ directory exists (Cowork VM filesystem)
# 3. Hostname pattern matches Cowork sandbox naming
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
```

### cowork-role-gate.sh

```bash
#!/usr/bin/env bash
# Gate 4: Cowork Role Boundary
# Blocks code writes and git mutations in Cowork sessions.
# In Claude Code sessions, exits immediately (no blocking).

set -euo pipefail

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // empty')

# --- Cowork detection ---
# First check the session marker from detect-cowork-session.sh
MARKER="${CLAUDE_ENV_FILE:-/tmp/.cowork-session-marker}"
IS_COWORK=false

if [[ -f "$MARKER" ]] && grep -q "COWORK_SESSION=1" "$MARKER" 2>/dev/null; then
  IS_COWORK=true
fi

# Fallback: check cwd heuristic
if [[ "$IS_COWORK" == "false" ]]; then
  CWD=$(echo "$INPUT" | jq -r '.cwd // empty')
  if [[ "$CWD" == */sessions/* ]]; then
    IS_COWORK=true
  fi
fi

# Not Cowork → allow everything
if [[ "$IS_COWORK" == "false" ]]; then
  exit 0
fi

# --- Cowork session: enforce role boundary ---

if [[ "$TOOL" == "Write" || "$TOOL" == "Edit" ]]; then
  FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

  # Normalize path separators
  FILE_PATH="${FILE_PATH//\\//}"

  # ALLOW: .planning/ coordination files
  if [[ "$FILE_PATH" == */.planning/* ]] || [[ "$FILE_PATH" == */.planning ]]; then
    exit 0
  fi

  # ALLOW: Docs/ directory (design docs, plans, changelog, ways of working)
  if [[ "$FILE_PATH" == */Docs/* ]] || [[ "$FILE_PATH" == */docs/* ]]; then
    exit 0
  fi

  # ALLOW: outputs directory (Cowork workspace artifacts)
  if [[ "$FILE_PATH" == */outputs/* ]]; then
    exit 0
  fi

  # ALLOW: Obsidian vault files (if written via file tool instead of MCP)
  if [[ "$FILE_PATH" == */TheFantasyWorldSimulator/*.md ]] && [[ "$FILE_PATH" != */src/* ]]; then
    # Vault .md files in the root vault directory — allow
    exit 0
  fi

  # ALLOW: .claude/settings.json (hook config itself)
  if [[ "$FILE_PATH" == */.claude/settings.json ]]; then
    exit 0
  fi

  # BLOCK: src/ directory (production code)
  if [[ "$FILE_PATH" == */src/* ]]; then
    echo "Cowork role boundary: Write/Edit to src/ is not allowed in Cowork sessions. Cowork does design, planning, and documentation — not implementation. Write a plan in Docs/plans/ and hand off to Claude Code via Linear." >&2
    exit 2
  fi

  # BLOCK: scripts/ directory
  if [[ "$FILE_PATH" == */scripts/* ]]; then
    echo "🚫 Cowork role boundary: Write/Edit to scripts/ is not allowed in Cowork sessions. Hand off to Claude Code via Linear." >&2
    exit 2
  fi

  # BLOCK: code file extensions in project root
  if [[ "$FILE_PATH" =~ \.(ts|tsx|js|jsx|css|scss)$ ]] && [[ "$FILE_PATH" != */Docs/* ]] && [[ "$FILE_PATH" != */.planning/* ]]; then
    echo "🚫 Cowork role boundary: Writing code files (${FILE_PATH##*.}) is not allowed in Cowork sessions. Write a plan and hand off to Claude Code." >&2
    exit 2
  fi

  # BLOCK: package.json, tsconfig, vite config, etc.
  if [[ "$FILE_PATH" == */package.json ]] || [[ "$FILE_PATH" == */tsconfig*.json ]] || [[ "$FILE_PATH" == */vite.config.* ]] || [[ "$FILE_PATH" == */vercel.json ]]; then
    echo "🚫 Cowork role boundary: Config file changes are not allowed in Cowork sessions. Hand off to Claude Code." >&2
    exit 2
  fi

  # Default: allow (unknown paths get through — better than false-blocking docs)
  exit 0
fi

if [[ "$TOOL" == "Bash" ]]; then
  COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

  # BLOCK: git mutation commands
  if [[ "$COMMAND" == git\ add* ]] || \
     [[ "$COMMAND" == git\ commit* ]] || \
     [[ "$COMMAND" == git\ push* ]] || \
     [[ "$COMMAND" == git\ merge* ]] || \
     [[ "$COMMAND" == git\ checkout* ]] || \
     [[ "$COMMAND" == git\ rebase* ]] || \
     [[ "$COMMAND" == git\ reset* ]] || \
     [[ "$COMMAND" == git\ stash* ]] || \
     [[ "$COMMAND" == git\ cherry-pick* ]]; then
    echo "🚫 Cowork role boundary: git mutation commands are not allowed in Cowork sessions. Cowork does not touch git. Hand off to Claude Code via Linear." >&2
    exit 2
  fi

  # ALLOW: read-only git commands
  if [[ "$COMMAND" == git\ log* ]] || \
     [[ "$COMMAND" == git\ diff* ]] || \
     [[ "$COMMAND" == git\ status* ]] || \
     [[ "$COMMAND" == git\ show* ]] || \
     [[ "$COMMAND" == git\ blame* ]] || \
     [[ "$COMMAND" == git\ ls-files* ]] || \
     [[ "$COMMAND" == git\ remote* ]]; then
    exit 0
  fi

  # BLOCK: build/test commands (Cowork VM can't run them reliably anyway)
  if [[ "$COMMAND" == npm\ test* ]] || \
     [[ "$COMMAND" == npm\ run\ build* ]] || \
     [[ "$COMMAND" == npm\ run\ dev* ]] || \
     [[ "$COMMAND" == npx\ vite* ]]; then
    echo "🚫 Cowork role boundary: Build/test commands are not allowed in Cowork sessions (VM lacks native modules). Use 'npx tsc --noEmit' for read-only type checking, or hand off to Claude Code." >&2
    exit 2
  fi

  # ALLOW: npx tsc --noEmit (read-only analysis)
  if [[ "$COMMAND" == *"tsc --noEmit"* ]]; then
    exit 0
  fi

  # Default: allow other bash commands (ls, cat, grep, find, etc.)
  exit 0
fi

# Other tools (Read, etc.) → always allow
exit 0
```

### pre-commit-gate.sh

```bash
#!/usr/bin/env bash
set -euo pipefail

# Read hook input from stdin
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Allow --amend and --no-verify commits through
if [[ "$COMMAND" == *"--amend"* ]] || [[ "$COMMAND" == *"--no-verify"* ]]; then
  exit 0
fi

# User-requested bypass
if [[ "${SKIP_DOD_TESTS:-}" == "1" ]]; then
  echo '{"decision":"approve","message":"⚠️ DoD tests bypassed via SKIP_DOD_TESTS=1"}' 
  exit 0
fi

ERRORS=""

# 1. TypeScript check
if ! npx tsc --noEmit 2>/tmp/tsc-errors.txt; then
  ERRORS="${ERRORS}\n❌ TypeScript errors:\n$(head -20 /tmp/tsc-errors.txt)"
fi

# 2. Test suite
if ! npm test 2>/tmp/test-errors.txt; then
  ERRORS="${ERRORS}\n❌ Tests failed:\n$(tail -20 /tmp/test-errors.txt)"
fi

# 3. Untracked imports — files imported by tracked files but not git-tracked
UNTRACKED=$(git ls-files --others --exclude-standard -- 'src/**/*.ts' 'src/**/*.tsx' | head -20)
if [[ -n "$UNTRACKED" ]]; then
  # Check if any tracked file imports these
  for F in $UNTRACKED; do
    BASENAME=$(basename "$F" | sed 's/\.[^.]*$//')
    if git grep -l "from.*['\"].*${BASENAME}['\"]" -- '*.ts' '*.tsx' > /dev/null 2>&1; then
      ERRORS="${ERRORS}\n❌ Untracked file imported by tracked code: $F"
    fi
  done
fi

if [[ -n "$ERRORS" ]]; then
  echo -e "🚫 Pre-commit gate FAILED:${ERRORS}" >&2
  exit 2
fi

exit 0
```

### pre-push-gate.sh

```bash
#!/usr/bin/env bash
set -euo pipefail

INPUT=$(cat)

# User-requested bypass
if [[ "${SKIP_DOD_DOCS:-}" == "1" ]]; then
  echo '{"decision":"approve","message":"⚠️ DoD doc checks bypassed via SKIP_DOD_DOCS=1"}'
  exit 0
fi

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
  if ! git diff "$PUSH_BASE"..HEAD -- "$FILE" | grep -q '^+'; then
    ERRORS="${ERRORS}\n❌ ${LABEL} has no new entries since last push"
  fi
}

check_doc_updated "Docs/changelog.md" "changelog.md"
check_doc_updated "Docs/project-status.md" "project-status.md"
check_doc_updated "Docs/project-history.md" "project-history.md"
# Note: BACKLOG.md check removed — Linear is the issue tracker now

# Production build check
if ! npx vite build > /dev/null 2>/tmp/build-errors.txt; then
  ERRORS="${ERRORS}\n❌ Production build failed:\n$(tail -10 /tmp/build-errors.txt)"
fi

if [[ -n "$ERRORS" ]]; then
  echo -e "🚫 Pre-push gate FAILED (Definition of Done incomplete):${ERRORS}\n\nFix all issues above before pushing." >&2
  exit 2
fi

exit 0
```

### session-stop-gate.sh

```bash
#!/usr/bin/env bash
set -euo pipefail

INPUT=$(cat)

# Loop guard — don't force continuation if we're already in one
STOP_ACTIVE=$(echo "$INPUT" | jq -r '.stop_hook_active // false')
if [[ "$STOP_ACTIVE" == "true" ]]; then
  echo '{"hookSpecificOutput":{"continue":false}}'
  exit 0
fi

ISSUES=""

# 1. Uncommitted changes
DIRTY=$(git status --porcelain 2>/dev/null | head -5)
if [[ -n "$DIRTY" ]]; then
  ISSUES="${ISSUES}• Uncommitted changes:\n${DIRTY}\n"
fi

# 2. Unpushed commits
UNPUSHED=$(git log @{push}..HEAD --oneline 2>/dev/null | head -5)
if [[ -n "$UNPUSHED" ]]; then
  ISSUES="${ISSUES}• Unpushed commits:\n${UNPUSHED}\n"
fi

# Note: Linear issue state checks removed — Linear is queried via MCP, not shell.
# The agent's Definition of Done convention covers moving issues to "Done" in Linear.

if [[ -n "$ISSUES" ]]; then
  # Escape for JSON
  ISSUES_JSON=$(echo -e "$ISSUES" | jq -Rs .)
  echo "{\"hookSpecificOutput\":{\"continue\":true,\"additionalContext\":\"Session stop gate: loose ends detected. Please resolve before closing:\\n${ISSUES_JSON}\"}}"
  exit 0
fi

echo '{"hookSpecificOutput":{"continue":false,"stopReason":"All DoD checks passed — clean session."}}'
exit 0
```

---

## settings.json Changes

The existing `.claude/settings.json` currently contains only:

```json
{
  "enabledPlugins": {
    "codex@openai-codex": true
  }
}
```

**New configuration:**

```json
{
  "enabledPlugins": {
    "codex@openai-codex": true
  },
  "hooks": {
    "SessionStart": [
      {
        "hooks": [{
          "type": "command",
          "command": "bash .claude/hooks/detect-cowork-session.sh",
          "timeout": 5,
          "once": true
        }]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [{
          "type": "command",
          "command": "bash .claude/hooks/cowork-role-gate.sh",
          "timeout": 5,
          "statusMessage": "Checking Cowork role boundary..."
        }]
      },
      {
        "matcher": "Bash",
        "hooks": [{
          "type": "command",
          "command": "bash .claude/hooks/cowork-role-gate.sh",
          "timeout": 5,
          "statusMessage": "Checking Cowork role boundary..."
        }]
      },
      {
        "matcher": "Bash(git commit*)",
        "hooks": [{
          "type": "command",
          "command": "bash .claude/hooks/pre-commit-gate.sh",
          "timeout": 120,
          "statusMessage": "Running pre-commit checks (tsc + tests)..."
        }]
      },
      {
        "matcher": "Bash(git push*)",
        "hooks": [{
          "type": "command",
          "command": "bash .claude/hooks/pre-push-gate.sh",
          "timeout": 120,
          "statusMessage": "Verifying Definition of Done (docs + build)..."
        }]
      }
    ],
    "Stop": [
      {
        "hooks": [{
          "type": "command",
          "command": "bash .claude/hooks/session-stop-gate.sh",
          "timeout": 15,
          "statusMessage": "Checking for loose ends..."
        }]
      }
    ]
  }
}
```

---

## What This Catches vs. What It Doesn't

### Hard-gated (mechanism-enforced)

| DoD Step | Gate | How |
|----------|------|-----|
| Tests pass | Pre-commit | `npm test` exit code |
| TypeScript clean | Pre-commit | `npx tsc --noEmit` exit code |
| No untracked imports | Pre-commit | `git ls-files` + import grep |
| Build succeeds | Pre-push | `npx vite build` exit code |
| changelog.md updated | Pre-push | `git diff` for additions |
| project-status.md updated | Pre-push | `git diff` for additions |
| project-history.md updated | Pre-push | `git diff` for additions |
| Uncommitted changes | Stop | `git status --porcelain` |
| Unpushed commits | Stop | `git log @{push}..HEAD` |
| Cowork can't write to src/ | Cowork role | Path check on Write/Edit |
| Cowork can't run git mutations | Cowork role | Command check on Bash |
| Cowork can't run build/test | Cowork role | Command check on Bash |
| Cowork can't edit config files | Cowork role | Path check on Write/Edit |

**Note:** Gate 4 (Cowork role boundary) depends on hooks firing in Cowork sessions. This is **unconfirmed** and must be tested during burn-in. If hooks don't fire in Cowork, these rows revert to convention-enforced.

### Convention-enforced (still soft — can't automate)

| DoD Step | Why it can't be gated |
|----------|----------------------|
| Linear issue → "Done" | Requires Linear MCP, not available from shell hooks |
| Verify wiring checklist | Requires semantic understanding of what was changed vs. what's connected |
| Log impediments | Only required when impediments occur — can't detect programmatically |
| Vault log update | Requires Obsidian MCP, not available from shell |
| Close-out message | The Stop hook nudges but can't force specific phrasing |

---

## Linear Issue State Enforcement (Future Enhancement)

Issue tracking now lives in Linear, not BACKLOG.md. Shell hooks can't query Linear directly (it requires the Linear MCP). A future enhancement could:

1. Add a lightweight Node script that calls the Linear API to verify the active issue is in the correct state
2. Validate that issues in "In Dev" have been moved to "Done" before push
3. Check that a completion comment was added

This requires Linear API access from the hook environment (API key or OAuth token) and is deferred until the basic gates prove their value.

---

## Rollout Plan

1. **Phase 1 — Ship the hooks:** Create `.claude/hooks/` directory and all scripts (5 gate scripts + 2 shared libs). Update `settings.json`. Claude Code implements this.
2. **Phase 1.5 — Test Cowork gate:** In a Cowork session, deliberately attempt `Write` to `src/test.ts` and `Bash git commit`. If the hook fires and blocks → Gate 4 works. If the write succeeds silently → hooks don't fire in Cowork and Gate 4 is convention-only (log as impediment).
3. **Phase 2 — Burn-in:** Run for 3-5 sessions. Expect some false positives (e.g., doc-only commits that don't need all four doc files updated). Tune thresholds.
4. **Phase 3 — Harden:** Based on burn-in, adjust which checks are commit-time vs. push-time. Add the kanban state parser if warranted. If Cowork hooks don't fire, explore alternative enforcement (custom MCP wrapper, folder-scoped permissions).

---

## Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| Hooks slow down every commit by ~60s (tsc + test) | Tests are fast (9015 tests run in <30s). tsc is ~5s. Acceptable. |
| False positives on doc checks for multi-commit work | Doc checks are push-time only, not commit-time. Agent can commit freely, just must update docs before push. |
| Stop hook infinite loop | `stop_hook_active` guard prevents re-triggering. |
| Scripts break on Windows (user's dev machine) | Scripts use `bash` — works in Git Bash / WSL. Claude Code runs in Linux anyway. User rarely runs these manually. |
| Agent works around hooks by using raw `Write` to .git/ | Extremely unlikely — Claude Code uses `git commit`, not raw git plumbing. |
| Cowork role gate doesn't fire (hooks not supported in Cowork) | Tested in Phase 1.5. Fallback: convention in CLAUDE.md + future MCP wrapper. |
| Cowork role gate false-positives on legitimate doc writes | Allow-list is generous (`.planning/`, `Docs/`, vault paths, outputs). Default is allow for unknown paths. |
| Write/Edit matcher fires on every file write in Claude Code too | Gate exits immediately (exit 0, <5ms) when not in Cowork — negligible overhead. |

---

## Relationship to Existing Process

This design **does not change** any of the existing process documents. It adds enforcement on top of what's already defined:

- CLAUDE.md Definition of Done → unchanged (hooks enforce it)
- Linear workflow states → issue state managed via MCP, not file hooks
- `Docs/plans/2026-04-13-linear-coordination-protocol.md` → the coordination protocol hooks complement
- Pre-commit minimum → unchanged (hooks automate it)

The only new files are the hook scripts and the settings.json update.
