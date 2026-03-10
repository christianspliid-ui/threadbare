---
name: gamedocumenter
description: Use after completing any implementation work on The Fantasy World Simulator to update all three documentation layers (Docs/changelog.md + Docs/project-status.md, Obsidian vault system notes, Notion backlog). Trigger whenever you finish a phase, task, or group of commits — even small ones. Also trigger when someone says "update docs", "document this", "update the backlog", or "update obsidian". This skill encodes critical workarounds for Obsidian MCP API quirks and Notion editing patterns that will save you from wasting time on failed API calls.
---

# Game Documenter

## Overview

A rigid post-implementation checklist for updating The Fantasy World Simulator's three documentation layers. Every step includes the exact tool calls, known API workarounds, and expected output format. Follow this start-to-finish after completing implementation work — no steps are optional.

The three layers serve different purposes and must stay in sync:
- **`Docs/changelog.md`** + **`Docs/project-status.md`** (in repo) — changelog + project status. Says "what changed and where we are." CLAUDE.md has compact pointers to these files.
- **Obsidian vault** (via MCP) — system specs and graph relationships. Says "what the system IS."
- **Notion backlog** — sprint progress and task tracking. Says "what to build next."

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
- "Where" uses short labels: `Repo: src/engine/`, `Obsidian: Systems/`, `Notion: Backlog`
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
1. Add a new line for the completed phase/task with ✅ status
2. Update the "Current phase" line to reflect what's next
3. Update "Engine stats" (module count, line count, test count)
4. Update "Content stats" if content packages changed

**Changes needed in `CLAUDE.md` `## Project Status`:**
1. Update the current in-progress bullet to reflect the new phase/task
2. Update the "Current phase" line
3. Update "Engine stats" and "Content stats" summary lines

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

**System note template:**
```markdown
---
tags: [system, <category>]
aliases: [<AliasOne>, <AliasTwo>]
---
# System Name

> One-line summary of what this system does.

*(added YYYY-MM-DD — Phase X description)*

## Overview

2-3 paragraphs explaining the system. What does it do? Why does it exist? What's the key insight?

## [Domain-Specific Sections]

The meat of the note. Tables, mechanics, rules — whatever describes THIS system.

## Implementation

| File | Role |
|------|------|
| `src/types/foo.ts` | Types and constants |
| `src/engine/foo.ts` | Core logic |
| `src/components/Game/Foo.tsx` | UI component |

## Connections

- [[Related System]] — how it connects
- [[Another System]] — how it connects
```

**Tag categories:** `system`, `ui`, `engine`, `player`, `spatial`, `content`, `narrative`, `adversarial`, `meta`

**Naming conventions:**
- Use title case with spaces: `Fog of War.md`, not `fog-of-war.md`
- Put all system notes in the `Systems/` subfolder (path: `TheFantasyWorldSimulator/Systems/`)
- Aliases should include the code-level name (e.g., `AvatarHUD`, `MandateTracker`)

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

### Step 5: Update Notion Backlog

**What:** Mark completed work in the Notion backlog and add reference docs.

**CRITICAL: Notion API Command Changes (as of 2026-03-08)**

The Notion MCP `notion-update-page` tool accepts ONLY these commands:
- `update_properties` — update page properties
- `replace_content` — replace content (full page or targeted via `selection_with_ellipsis`)
- `apply_template` — apply a template
- `update_verification` — verify/unverify a page

The old commands `replace_content_range` and `insert_content_after` NO LONGER WORK. They will return an `invalid_enum_value` error. Do not use them.

**CRITICAL PATTERNS:**
- **Always fetch before editing.** Use `notion-fetch` with the backlog page ID (`3182b241dfb081b9af78c279eef405cf`) to see current content before making changes.
- **Use `replace_content` with `selection_with_ellipsis` + `new_str` for targeted edits.** This replaces the matched text with new text. Provide ~10 chars from start + ellipsis + ~10 chars from end. The selection must be UNIQUE in the page.
- **To insert new content before an existing section,** include the existing section header in your `selection_with_ellipsis` match and put it back at the end of your `new_str`. This effectively "inserts before" by replacing the header with new-content + header.

**Inserting a new completed section (the most common operation):**

To add a new completed section above `### Priority 4: Performance Benchmarking`, use:
```
command: "replace_content"
selection_with_ellipsis: "### Priority 4:...Benchmarking 🔴"
new_str: "<your new section content>\n### Priority 4: Performance Benchmarking 🔴"
```

This replaces the Priority 4 header with your new section + the header put back, effectively inserting above it.

**Phase completion pattern:**
```
### Phase 6X: Name ✅ Complete (YYYY-MM-DD)
Summary of what was built. N-task TDD implementation.
- [x] Task description — what was built
- [x] Another task — what was built
N new tests across M test files. P commits.
**Reference docs:**
- `Docs/plans/YYYY-MM-DD-feature-design.md` — Design doc
- `Docs/plans/YYYY-MM-DD-feature-implementation.md` — N-task TDD plan
```

**Common Notion errors:**
- `invalid_enum_value` — You used an old command name. Only `update_properties`, `replace_content`, `apply_template`, `update_verification` are valid.
- "could not find content" — Your `selection_with_ellipsis` wasn't unique enough or doesn't match current page content. Fetch the page again and use more characters from start/end.
- `content_updates parameter required` — You accidentally used the `update_content` command (which doesn't exist in the tool schema). Use `replace_content` instead.
- If you need to update task checkboxes, replace the ENTIRE phase section (header through last task), not individual lines.

### Step 6: Commit Documentation Changes

**What:** Stage and commit any repo-level documentation changes.

```bash
git add CLAUDE.md Docs/changelog.md Docs/project-status.md
git commit -m "docs: update project status for Phase 6X completion

<brief summary of what was documented>

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

Only CLAUDE.md, `Docs/changelog.md`, `Docs/project-status.md`, and files in `Docs/plans/` should be committed. Obsidian and Notion changes are made via their respective APIs.

## Quick Reference: Tool → Purpose

| Tool | Use For | Notes |
|------|---------|-------|
| `Edit` | CLAUDE.md, Docs/changelog.md, Docs/project-status.md | Normal filesystem files |
| `obsidian_get_file_contents` | Read vault notes | Via MCP, not filesystem |
| `obsidian_append_content` | Create new notes / add content | ALWAYS works |
| `obsidian_patch_content` | Edit existing note content | UNRELIABLE — use with caution, simple targets only |
| `obsidian_list_files_in_dir` | Check what notes exist | Use before creating to avoid duplicates |
| `notion-fetch` | Read Notion page before editing | ALWAYS do this first |
| `notion-update-page` | Edit Notion content | Use `replace_content` with `selection_with_ellipsis` + `new_str`. Old commands `replace_content_range`/`insert_content_after` no longer work |
| `git commit` | Commit doc changes | CLAUDE.md + Docs/changelog.md + Docs/project-status.md |

## Common Mistakes

**Forgetting a layer.** The most common failure is updating the changelog but skipping Obsidian or Notion. The checklist exists to prevent this — follow all 6 steps.

**Using `obsidian_patch_content` on Index.md headings.** This WILL fail because headings contain `*(added ...)` suffixes. Use `obsidian_append_content` instead.

**Editing Notion without fetching first.** Content shifts between sessions. Always fetch the current page content before attempting edits, or your `selection_with_ellipsis` targets will be stale.

**Trying to Read/Edit vault files via filesystem.** The Obsidian vault is served through the MCP plugin from the user's machine. The files at the filesystem path may be generated content (from `generate-vault`), not the hand-curated vault notes. Always use the Obsidian MCP tools.

**Committing before API updates.** Do the Obsidian and Notion updates BEFORE the git commit. That way if an API call fails, you can fix it before committing says "documentation complete."
