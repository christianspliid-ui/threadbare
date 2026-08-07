---
name: gamedocumenter
description: Use after completing any implementation work on The Fantasy World Simulator to update all documentation layers (Docs/changelog.md + Docs/project-status.md + Docs/project-history.md, Linear closeout, and Obsidian vault system notes). Trigger whenever you finish a phase, task, or group of commits — even small ones. Also trigger when someone says "update docs", "document this", "update Linear", or "update obsidian". Linear (Threadbare team) is the single source of truth for backlog and issue state; `.planning/BACKLOG.md` was retired 2026-04-13. Vault work is filesystem-only via OBSIDIAN_VAULT_PATH — there is no Obsidian MCP (THR-654).
last_validated_against: 2026-08-07
---

# Game Documenter

## Overview

A rigid post-implementation checklist for updating The Fantasy World Simulator's three documentation layers. Every step includes the exact tool calls, known API workarounds, and expected output format. Follow this start-to-finish after completing implementation work — no steps are optional.

The documentation layers serve different purposes and must stay in sync:
- **`Docs/changelog.md`** + **`Docs/project-status.md`** + **`Docs/project-history.md`** (in repo) — changelog + project status. Says "what changed and where we are."
- **Linear (Threadbare team)** — backlog, implementation state, and handoffs. Says "what to build next."
- **Obsidian vault** (filesystem, `$OBSIDIAN_VAULT_PATH`) — system specs and graph relationships. Says "what the system IS."

## When to Run This Checklist

Run the full checklist after:
- Completing a phase (e.g., Phase 6F)
- Completing a named task or group of related commits
- Any implementation session, before signing off

Run the lightweight subset (Steps 1-2 only) for:
- Single bug fixes
- Minor tweaks (< 3 files changed)

## The Checklist

### Step 1: Update Changelog

**What:** Append rows to the table in `Docs/changelog.md`.

**Format:** Each row is `| date | where | what changed | why |`

**Rules:**
- One row per logical change (not per file — group related files)
- "Where" uses short labels: `Repo: src/engine/`, `Obsidian: Systems/`, `Backlog: .planning/`
- "What changed" is specific: file names, line counts, test counts
- "Why" references the phase/task that motivated it
- Date is ISO format (YYYY-MM-DD)

**Example rows:**
```
| 2026-03-06 | Repo: src/engine/ | Created visibility.ts — recalcVisibility, collectLOSSources (232 lines, 10 tests) | Phase 6F Task 2: fog of war engine |
| 2026-03-06 | Repo: src/components/Game/ | Created AvatarHUD.tsx — top-left panel with Move/Wheel/Scry buttons (9 tests) | Phase 6F Task 7: avatar HUD |
```

**Tool:** Use `Edit` tool on `Docs/changelog.md`. This is a normal filesystem file — no API quirks.

### Step 2: Update Project Status

**What:** Add a Current-Focus entry for the shipped work. `Docs/project-status.md` is **generated** — you write a fragment, not the page.

**Changes needed (THR-1016):**
1. Create a **new** file `Docs/status/YYYY-MM-DD-thr-XXXX.md` (ship date, then ticket id) holding the entry body — normally one bolded-lede paragraph ending in a `(THR-XXXX, YYYY-MM-DD)` attribution.
2. Run `npm run generate-project-status` and commit both the fragment and the regenerated page.
3. **Never hand-edit `Docs/project-status.md`, and never move or trim another entry to make room.** The generator holds the ≤60-line cap by rendering only the newest fragments that fit; everything older stays in `Docs/status/`, uncapped and readable. The old "move Previous: entries out" discipline is retired — it was a second write to a shared anchor and is exactly what made any two open closeout PRs conflict by construction.

**Changes needed in `Docs/project-history.md`:**
1. Append a one-line `✅ Complete` entry for each completed feature/system with date, key details, and design doc reference
2. Update the engine/content stats at the bottom

**Note:** CLAUDE.md no longer has a `## Project Status` section — project status lives entirely in `Docs/project-status.md`. Do not add status content to CLAUDE.md.

**How to get accurate stats:**
```bash
# Module count (approximate)
find src -name "*.ts" -o -name "*.tsx" | grep -v __tests__ | grep -v test | wc -l

# Line count (approximate)
find src -name "*.ts" -o -name "*.tsx" | grep -v __tests__ | grep -v test | xargs wc -l | tail -1

# Test count
npm test -- --reporter=verbose 2>&1 | tail -5
# Or count test files:
find src -name "*.test.*" | wc -l
```

### Step 3: Create Obsidian System Notes

**What:** Create new system notes in the Obsidian vault for any new systems introduced.

**Vault access is FILESYSTEM-ONLY (THR-654, 2026-07-21):**
- There is no Obsidian MCP server. `.mcp.json` configures `codesight` and nothing else, so
  `obsidian_get_file_contents`, `obsidian_append_content`, `obsidian_patch_content` and every
  other `obsidian_*` tool is simply absent — calling one fails outright.
- Use the ordinary `Read` / `Edit` / `Write` tools against `$OBSIDIAN_VAULT_PATH`.
- Resolve the root first: `echo "$OBSIDIAN_VAULT_PATH"`. If it is unset, **fail loud** —
  the MCP-first ordering this replaced silently dropped ~12 `log.md` appends over 8 days
  (impediments #66, #71, #75, #86). Never drop a vault write quietly.
- Full path is `$OBSIDIAN_VAULT_PATH/TheFantasyWorldSimulator/<page>.md`.

Read **`obsidian-system-note-template.md`** (in this skill directory) for the full frontmatter template, tag categories, and naming conventions. Use it as the starting scaffold for any new system note.

### Step 4: Update Obsidian Index.md

**What:** Add links to new system notes in the vault's Index.md.

`Read` the file, then `Edit` to insert links into the right category section. Index.md headings
carry inline styling like `## UI Components *(added 2026-03-06)*` — match that text exactly in
the `old_string` when editing near a heading.

**Link format:**
```markdown
- [[System Name]] — One-line description *(added YYYY-MM-DD)*
```

### Step 5: Update Linear Closeout

**What:** Complete the Linear executor closeout for the issue you shipped (never manual Done transition).

**Actions:**
1. Add a completion comment summarizing what shipped, commit SHA, and any deferrals created.
2. Ensure your merge-path commit body includes `Fixes THR-XX` so merge-to-main auto-close fires.
3. If any deferrals were introduced, create linked Linear issues and include `// TODO(THR-XX)` references in code.
4. Keep issue tracking in Linear only and do not recreate retired backlog files.

### Step 6: Commit Documentation Changes

**What:** Stage and commit any repo-level documentation changes.

```bash
git add CLAUDE.md Docs/changelog.md Docs/status/ Docs/project-status.md Docs/project-history.md
git commit -m "docs: update project status for Phase 6X completion

<brief summary of what was documented>

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

Commit all repo-level docs: CLAUDE.md, `Docs/changelog.md`, your new `Docs/status/` fragment plus the regenerated `Docs/project-status.md`, `Docs/project-history.md`, and files in `Docs/plans/`. Obsidian changes land in a separate tree under `$OBSIDIAN_VAULT_PATH` and are not part of this commit.

## Quick Reference: Tool → Purpose

| Tool | Use For | Notes |
|------|---------|-------|
| `Edit` | CLAUDE.md, Docs/changelog.md, Docs/project-history.md | Normal filesystem files |
| `Write` | `Docs/status/YYYY-MM-DD-thr-XXXX.md` | One new file per closeout; `Docs/project-status.md` is generated from these — never edit it (THR-1016) |
| `Read` | Read vault notes | Under `$OBSIDIAN_VAULT_PATH` |
| `Write` | Create new notes | Under `$OBSIDIAN_VAULT_PATH` |
| `Edit` | Edit existing note content | Under `$OBSIDIAN_VAULT_PATH` |
| `Glob` | Check what notes exist | Use before creating to avoid duplicates |
| `git commit` | Commit doc changes | CLAUDE.md + Docs/ (vault is a separate tree, not committed here) |

> **Note:** Notion content migrated to Obsidian on 2026-04-04. Dilemma templates remain in Notion pending TypeScript import; active tracking stays in Linear + repo docs.

## Common Mistakes

**Forgetting a layer.** The most common failure is updating the changelog but skipping Obsidian or Linear closeout. The checklist exists to prevent this — follow all 6 steps.

**Reaching for `obsidian_*` tools.** They do not exist — no Obsidian MCP server is configured
(THR-654). Vault work is `Read` / `Edit` / `Write` against `$OBSIDIAN_VAULT_PATH`.

**Silently skipping the vault write when `OBSIDIAN_VAULT_PATH` is unset.** Fail loud instead.
Dropping the write quietly is the exact failure THR-654 closed — ~12 lost `log.md` appends
over 8 days.

**Confusing the generated vault with the curated one.** `npm run generate-vault` regenerates
pages from `world-model.json`; hand-curated notes are edited in place. Check which kind of page
you are touching before overwriting it.

**Committing before the vault updates.** Do the vault writes BEFORE the git commit, so a
failure surfaces while you can still fix it rather than after the message says "documentation
complete."
