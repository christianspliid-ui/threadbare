---
name: gamedocumenter
description: Post-implementation documentation updates — Notion backlogs, Obsidian vault, changelog, project-status/project-history, and Content Creator Cheat Sheet. Use after completing any code or content work. Non-negotiable same-session task.
---

# Game Documenter Skill

Run this checklist **in the same session** that produced the code/content change. Do not defer to "later."

## When to Use

After completing **any** implementation work: new features, bug fixes, content additions, engine changes, config changes, or content-file schema changes.

## Documentation Checklist

Work through each item. Skip only if genuinely not applicable (state why).

### 1. Changelog (`Docs/changelog.md`)

Append a row: `| YYYY-MM-DD | where | what changed | why |`

- "where" = file path(s) or system name
- Keep entries atomic — one row per logical change

### 2. Project Status & History

**On milestone completion → append to `Docs/project-history.md`:**
- Add one bullet at the bottom: `- Phase/feature name: ✅ Complete (YYYY-MM-DD) — one-line summary. Key files: X, Y. ~N new tests.`
- Never edit existing entries — append only.

**When starting a new focus area → update `Docs/project-status.md`:**
- Set `## Current Focus` to the new work item
- Set `## Up Next` to what follows
- Keep the file ≤ 20 lines total

### 3. Obsidian Vault (via MCP)

- If the change touches a system documented in Obsidian, update the corresponding note
- Add/update "Code Tunables" sections when constants or config values change
- Cross-reference new files or modules in the relevant system page
- Follow wikilink conventions: `[[System Name]]`, `[[Concept]]`

### 4. Notion Backlog

- Mark completed tasks as Done
- Add new tasks discovered during implementation
- Update phase status if a phase is now complete
- Backlog URL: https://www.notion.so/Development-Backlog-3182b241dfb081b9af78c279eef405cf

### 5. Content Creator Cheat Sheet (Notion)

**This is mandatory whenever you add, rename, remove, or change the schema of any content-facing file.**

Page ID: `3202b241-dfb0-81e0-a00e-fe83b0426256`

The cheat sheet is the single reference document content creators use to know what files they can edit and how. It must stay accurate. Specifically:

- **New content file added** → Add an entry in the correct category section with: file path, what it controls, constant names / data shape, legal values, and default values.
- **Content file renamed or moved** → Update the file path and any folder references.
- **Content file removed** → Remove its entry from the cheat sheet.
- **Schema change** (new fields, renamed fields, changed legal values, changed defaults) → Update the relevant entry to reflect the new shape.
- **New tunable constant added to `src/data/game-config.ts`** → Add it to the "Game Pacing & Economy" section with its name, default, and effect description.
- **Validation command changed** → Update the validation commands section.

When in doubt, update the cheat sheet. A stale cheat sheet is worse than no cheat sheet because content creators will trust it and make mistakes.

### 6. Skill Files (if applicable)

If the change affects how a domain skill should work (e.g., new file patterns, new content categories, changed workflows), update the relevant `.skills/*/SKILL.md` file. Key skills that reference content files:

- `.skills/prose-resolver/SKILL.md` — prose content file table
- `.skills/content-authoring/SKILL.md` — attachment content authoring workflow

## Output

After completing updates, summarize what you documented in a brief list so the user can verify.
