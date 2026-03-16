# DOC-01 Design: Project Status Two-File Split

> Created 2026-03-12. Part of the DOC-01 Source-of-Truth Reset from the remediation plan.

## Problem

`Docs/project-status.md` is 64 lines of `✅ Complete` entries with no active marker. It serves two distinct use cases that have conflicting needs:

1. **Forward-looking orientation** — "where are we, what's next?" Used at the start of every session to orient a Claude agent or the developer. Needs to be short and current.
2. **Backward-looking reference** — "what was built and when?" Used during troubleshooting and reflection. Needs to be complete and stable.

One file cannot serve both well. As the project grows the file becomes less useful for orientation (too much noise) and less trustworthy as an archive (entries get edited rather than appended).

## Decision

Split into two files with a clear contract for each.

## File 1: `Docs/project-status.md` (now/next/later)

**Purpose:** Orientation. Answers "where are we right now?" in one glance.

**Contract:**
- Always ≤ 15 lines
- Contains: current focus, what's next, link to Notion for full backlog, link to project-history.md for completed work
- Updated at the *start* of a new focus area, not at completion
- Does not list completed work — that belongs in history

**Shape:**
```
# Project Status

> Updated YYYY-MM-DD

## Current Focus
[One line: what's actively being worked on right now]

## Up Next
[One line: what follows immediately after current focus]

## Full Backlog
Notion: https://www.notion.so/Development-Backlog-...

## Completed Work
See: Docs/project-history.md
```

## File 2: `Docs/project-history.md` (completed work archive)

**Purpose:** Reference. Answers "what was built and when?" during troubleshooting or reflection.

**Contract:**
- Append-only — entries are never edited after being written, only new ones added at the bottom
- One entry per completed milestone/phase/sprint
- Contains: completion date, what was built, key files, test count
- Populated by the `gamedocumenter` skill after completing work

**Shape:**
Existing content of `project-status.md` migrated verbatim as the seed. New entries appended below.

## Files to Update

| File | Change |
|------|--------|
| `Docs/project-status.md` | Replace content with thin now/next/later format |
| `Docs/project-history.md` | Create, seed with existing project-status.md content |
| `CLAUDE.md` | Update line referencing project-status; note both files |
| `.skills/gamedocumenter/SKILL.md` | Step 2: append to history.md on completion; update status.md only when focus changes |
| `Docs/changelog.md` | Log the change |

## What This Does NOT Change

- Notion backlog — still owns sprint tasks and forward planning detail
- Obsidian vault — still owns system/mechanic definitions
- The gamedocumenter skill workflow — just clarifies which file gets which update

## Success Criteria

- `project-status.md` is ≤ 15 lines and accurately reflects current focus
- `project-history.md` contains all existing completed phase entries
- `gamedocumenter` step 2 instructions unambiguously direct appends to history and current-focus updates to status
- CLAUDE.md references both files correctly
