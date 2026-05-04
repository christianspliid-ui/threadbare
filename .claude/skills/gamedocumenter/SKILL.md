---
name: gamedocumenter
description: Use after completing any implementation work on The Fantasy World Simulator to update all documentation layers (Docs/changelog.md + Docs/project-status.md + Docs/project-history.md, Linear closeout, and Obsidian vault system notes). Trigger whenever you finish a phase, task, or group of commits — even small ones. Also trigger when someone says "update docs", "document this", "update Linear", or "update obsidian". Linear (Threadbare team) is the single source of truth for backlog and issue state; `.planning/BACKLOG.md` was retired 2026-04-13. This skill encodes critical workarounds for Obsidian MCP API quirks that will save you from wasting time on failed API calls.
---

# Game Documenter

## Overview

A rigid post-implementation checklist for updating The Fantasy World Simulator's three documentation layers. Every step includes the exact tool calls, known API workarounds, and expected output format. Follow this start-to-finish after completing implementation work — no steps are optional.

The documentation layers serve different purposes and must stay in sync:
- **`Docs/changelog.md`** + **`Docs/project-status.md`** + **`Docs/project-history.md`** (in repo) — changelog + project status. Says "what changed and where we are."
- **Linear (Threadbare team)** — backlog, implementation state, and handoffs. Says "what to build next."
- **Obsidian vault** (via MCP) — system specs and graph relationships. Says "what the system IS."

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

**What:** Update `Docs/project-status.md` (full phase-by-phase status) AND the compact summary in `CLAUDE.md` `## Project Status`.

**Changes needed in `Docs/project-status.md`:**
1. Add the completed feature to the "Latest implementation" or "Recent completions" summary
2. Update the "Current phase" line to reflect what's next
3. Update "Engine stats" (module count, line count, test count)
4. Update "Content stats" if content packages changed
5. **CRITICAL: Keep this file compact (<60 lines).** Move any "Previous:" entries from prior sessions into `Docs/project-history.md`. This file is a snapshot of *current state*, not a log.

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

**CRITICAL WORKAROUND — Obsidian API:**
- The vault is served via MCP, NOT the filesystem. You CANNOT use `Read`/`Edit`/`Write` tools on vault files.
- Use `obsidian_get_file_contents` to read, `obsidian_append_content` to create/write.
- `obsidian_patch_content` is UNRELIABLE — it frequently returns `invalid-target` errors, especially when:
  - Headings contain special characters like `*(added 2026-03-06)*`
  - Block targets contain wikilinks `[[like this]]`
  - Block targets span multiple lines
- **Always prefer `obsidian_append_content` over `obsidian_patch_content`** for new content.
- For edits to existing content, try `obsidian_patch_content` with simple single-line targets first. If it fails, fall back to `obsidian_append_content` to add an updated section at the end.

Read **`obsidian-system-note-template.md`** (in this skill directory) for the full frontmatter template, tag categories, and naming conventions. Use it as the starting scaffold for any new system note.

### Step 4: Update Obsidian Index.md

**What:** Add links to new system notes in the vault's Index.md.

**CRITICAL WORKAROUND:**
- Index.md headings contain inline styling like `## UI Components *(added 2026-03-06)*` which makes `obsidian_patch_content` with heading targets FAIL every time.
- **Do NOT attempt `obsidian_patch_content` with heading targets on Index.md.** It will waste time.
- **Instead, use one of these approaches:**
  1. **`obsidian_append_content`** — Add a new section at the end of the file. This always works.
  2. If the links belong in an existing section, append a small new heading that groups them logically (e.g., `## Spatial & Map Systems *(added 2026-03-06)*`).

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
git add CLAUDE.md Docs/changelog.md Docs/project-status.md Docs/project-history.md
git commit -m "docs: update project status for Phase 6X completion

<brief summary of what was documented>

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

Commit all repo-level docs: CLAUDE.md, `Docs/changelog.md`, `Docs/project-status.md`, `Docs/project-history.md`, and files in `Docs/plans/`. Obsidian changes are made via MCP API.

## Quick Reference: Tool → Purpose

| Tool | Use For | Notes |
|------|---------|-------|
| `Edit` | CLAUDE.md, Docs/changelog.md, Docs/project-status.md, Docs/project-history.md | Normal filesystem files |
| `obsidian_get_file_contents` | Read vault notes | Via MCP, not filesystem |
| `obsidian_append_content` | Create new notes / add content | ALWAYS works |
| `obsidian_patch_content` | Edit existing note content | UNRELIABLE — use with caution, simple targets only |
| `obsidian_list_files_in_dir` | Check what notes exist | Use before creating to avoid duplicates |
| `git commit` | Commit doc changes | CLAUDE.md + Docs/ |

> **Note:** Notion content migrated to Obsidian on 2026-04-04. Dilemma templates remain in Notion pending TypeScript import; active tracking stays in Linear + repo docs.

## Common Mistakes

**Forgetting a layer.** The most common failure is updating the changelog but skipping Obsidian or Linear closeout. The checklist exists to prevent this — follow all 6 steps.

**Using `obsidian_patch_content` on Index.md headings.** This WILL fail because headings contain `*(added ...)` suffixes. Use `obsidian_append_content` instead.

**Trying to Read/Edit vault files via filesystem.** The Obsidian vault is served through the MCP plugin from the user's machine. The files at the filesystem path may be generated content (from `generate-vault`), not the hand-curated vault notes. Always use the Obsidian MCP tools.

**Committing before API updates.** Do the Obsidian MCP updates BEFORE the git commit. That way if an API call fails, you can fix it before the commit message says "documentation complete."
