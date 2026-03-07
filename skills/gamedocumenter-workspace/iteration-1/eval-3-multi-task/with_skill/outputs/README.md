# Documentation Update Plan — Culture Content & Narrative Context

## Overview

This directory contains a comprehensive plan for updating all three documentation layers of The Fantasy World Simulator following completion of two implementation tasks:

1. **Culture Content Data** (`culture-content.ts` — 950 lines, 45 tests)
2. **Narrative Context Builder** (`narrativeContext.ts` — 200 lines, 12 tests)

The plan strictly follows the **gamedocumenter skill** checklist (6 steps) and includes all critical API workarounds discovered through testing.

---

## Files in This Directory

### 1. `plan.md` — Main Implementation Plan
**Purpose:** Complete step-by-step implementation guide for all 6 documentation update steps.

**Contents:**
- Step 1: Update CLAUDE.md changelog (2 new rows)
- Step 2: Update CLAUDE.md project status (4 edits)
- Step 3: Create Obsidian system notes (2 new notes)
- Step 4: Update Obsidian Index.md (append new section)
- Step 5: Update Notion backlog (fetch + 2 updates)
- Step 6: Git commit CLAUDE.md changes

**Use this when:** You need the complete picture of what needs to change, in narrative form.

---

### 2. `tool-calls-detailed.md` — Exact Tool Parameters
**Purpose:** Copy-paste ready tool call parameters for each of the 13 tool invocations.

**Contents:**
- Tool 1-5: Edit tool calls on CLAUDE.md (with exact old_string/new_string)
- Tool 6-7: Obsidian append calls (with full markdown content for 2 system notes)
- Tool 8-9: Obsidian read + append for Index.md
- Tool 10-12: Notion fetch + 2 update calls
- Tool 13: Bash git commit command

**Use this when:** You're ready to execute and need the exact parameters (copy old_string/new_string verbatim).

---

### 3. `summary.md` — Executive Summary
**Purpose:** High-level overview for understanding the changes at a glance.

**Contents:**
- Overview of both tasks
- Tools used and execution flow by documentation layer
- Key API workarounds applied (Obsidian patch avoidance, Notion fetch-first)
- Data included in each layer update
- Execution sequence with dependencies
- Validation checklist

**Use this when:** You need a quick reference or to explain the approach to someone else.

---

## Key API Workarounds Documented

### Obsidian Patch Failures
❌ Problem: `obsidian_patch_content` fails on Index.md headings with inline styling `*(added 2026-03-07)*`
✅ Solution: Use `obsidian_append_content` to add new section at end of file

### Notion Selection Targeting
❌ Problem: `selection_with_ellipsis` becomes stale between sessions
✅ Solution: Always fetch current backlog content first, then extract ~10 char anchors from actual response

### Filesystem First
✅ Pattern: Update CLAUDE.md (filesystem) before API calls, so if APIs fail, changelog is safe

---

## Execution Flow Summary

```
Step 1-2: Edit CLAUDE.md (4 operations: 1 append rows, 3 replace lines)
    ↓
Step 3: Obsidian — Create Culture Content Data.md
Step 4: Obsidian — Create Narrative Context Pipeline.md
    ↓ (parallel with above)
Step 5: Obsidian — Read Index.md → Append new section
    ↓ (depends on read)
Step 6: Notion — Fetch backlog (get current state)
    ↓ (depends on fetch)
Step 6a: Notion — Replace Content Strategy section
Step 6b: Notion — Insert reference docs
    ↓ (both depend on fetch result)
Step 7: Git — Commit CLAUDE.md
    ↓ (all must complete first)
```

---

## Data Summary

### Files Modified
- **CLAUDE.md** — 1 file (changelog + project status)
- **Obsidian vault** — 3 files (Culture Content Data.md + Narrative Context Pipeline.md + Index.md)
- **Notion backlog** — 1 page (Content Strategy & Architecture section)

### Lines of Code Documented
- culture-content.ts: 950 lines
- narrativeContext.ts: 200 lines
- **Total: 1,150 new lines**

### Tests Documented
- culture-content.test.ts: 45 tests
- narrativeContext.test.ts: 12 tests
- **Total: 57 new tests**

### Project Status Updates
- Engine modules: 67 → 69
- Engine lines: ~10,500 → ~10,850
- Engine tests: ~1,027 → ~1,084
- Test files: 79 → 81
- Content packages: 8 → 9 (culture-content.ts now implemented, was scoped)

---

## Quality Checks

Before executing, verify:

✓ Both design docs exist in `Docs/plans/`:
  - `2026-03-07-culture-content-design.md`
  - `2026-03-07-narrative-context-design.md`

✓ Both implementation files exist in repo:
  - `src/data/culture-content.ts` (950 lines)
  - `src/engine/narrativeContext.ts` (200 lines)

✓ Both test files exist:
  - `src/data/__tests__/culture-content.test.ts` (45 tests)
  - `src/engine/__tests__/narrativeContext.test.ts` (12 tests)

✓ CLAUDE.md is current (as of 2026-03-06, Phase 6F complete)

✓ Notion backlog page ID is correct: `3182b241dfb081b9af78c279eef405cf`

---

## Using These Files

### For Understanding the Approach
1. Read `summary.md` first (5 min overview)
2. Skim `plan.md` to see narrative flow (10 min review)

### For Execution
1. Read `tool-calls-detailed.md` — Tool 1 through 5
2. Execute Edit calls on CLAUDE.md (5 calls, verify each)
3. Read `tool-calls-detailed.md` — Tool 6 through 7
4. Execute Obsidian appends (2 calls)
5. Read `tool-calls-detailed.md` — Tool 8 through 9
6. Execute Obsidian read + append (2 calls)
7. Read `tool-calls-detailed.md` — Tool 10 through 12
8. **Execute Notion fetch FIRST**, then use response to fill in `selection_with_ellipsis` values
9. Execute Notion update calls (2 calls, filling in ellipsis values from step 8)
10. Read `tool-calls-detailed.md` — Tool 13
11. Execute git commit

### For Verification
Run the checklist in `summary.md` after all tools complete to confirm:
- All 3 documentation layers updated
- All API calls succeeded
- All files have expected content

---

## References

**Skill:** `/sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator/skills/gamedocumenter/SKILL.md`

**Project Instructions:** `CLAUDE.md` in the TheFantasyWorldSimulator repo

**Design Docs (assumed to exist):**
- `Docs/plans/2026-03-07-culture-content-design.md`
- `Docs/plans/2026-03-07-narrative-context-design.md`

**Backlog URL:** https://www.notion.so/Development-Backlog-3182b241dfb081b9af78c279eef405cf

**Current Date:** 2026-03-07

---

## Notes

- This plan was generated **without executing any tool calls**. It is a dry-run plan that shows exactly what should be executed.
- All 13 tool calls are documented with exact parameters.
- The critical fetch-first pattern for Notion is built in (Tool 10 must run before Tools 11-12).
- No changes have been made to the actual repository, Obsidian vault, or Notion backlog.
- To execute, follow the tool calls in order as documented in `tool-calls-detailed.md`.
