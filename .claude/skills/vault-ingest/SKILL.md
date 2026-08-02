---
name: vault-ingest
description: Compile raw source material into structured wiki pages in the Obsidian vault. Reads from raw/ or user-provided sources, creates/updates wiki pages, updates Index.md, and logs the ingest. Run with /kb-ingest.
last_validated_against: 2026-07-30
---

# Vault Ingest — Source Compilation

## Overview

Compiles raw source material into structured, interlinked wiki pages. This is the "data ingest" workflow from the LLM Knowledge Base pattern — raw sources go in, compiled wiki content comes out.

**Trigger:** `/kb-ingest` or "ingest this into the vault" or "compile this into the wiki"

## Input Sources

The user provides one of:
- A file path to a document in `raw/` (e.g., `raw/design-docs/encounter-redesign.md`)
- A file path in the repo (e.g., `Docs/plans/2026-04-02-encounter-redesign-guidelines.md`)
- A URL to fetch and process
- Pasted text content directly

## The Ingest Process

### Step 1: Read and Summarize

1. Read the source material completely
2. Present a brief summary to the user:
   - What the source covers
   - Key concepts, decisions, or facts
   - Which existing wiki pages it relates to
3. Ask: "Should I proceed to compile this into the wiki?"

### Step 2: Read Index.md

Read `TheFantasyWorldSimulator/Index.md` with `Read` to understand current vault structure and find related pages.

### Step 3: Read Related Pages

Read the 3-10 most related existing wiki pages to understand current state and avoid contradictions.

### Step 4: Compile Wiki Content

For each significant concept in the source:

**If a wiki page already exists:**
- Read the existing page
- Add new information, cite the source
- Add cross-references to related pages
- Update the `updated` date in frontmatter
- Use `Edit` for small edits and for new sections

**If a wiki page should be created:**
- Determine the correct folder (Systems/ for game systems, Cosmology/ for spheres, etc.)
- Write the page with proper frontmatter:
  ```yaml
  ---
  tags: [<category>, <subcategory>]
  aliases: [<alternative names>]
  status: draft
  created: YYYY-MM-DD
  updated: YYYY-MM-DD
  ---
  ```
- Include a blockquote summary as the first paragraph
- Add wikilinks to related existing pages
- Use `Write` to create the file

**Cross-references:**
- Add `[[wikilinks]]` from existing pages TO the new/updated pages
- Add `[[wikilinks]]` from new pages TO existing related pages
- Ensure bidirectional linking where appropriate

### Step 5: Update Index.md

Add any new pages to the appropriate category section in Index.md.
Use `Edit` on `TheFantasyWorldSimulator/Index.md`.

Format: `- [[Page Name]] — one-line summary`

### Step 6: Log the Ingest

Append to `TheFantasyWorldSimulator/log.md` following the **vault-log** skill procedure (direct filesystem write via `OBSIDIAN_VAULT_PATH`, loud failure if that variable is unset).

```
- **ingest** | Source: <source title/path> → Created: [[New Page 1]], [[New Page 2]]. Updated: [[Existing Page 1]], [[Existing Page 2]]
```

### Step 7: Report to User

Summarize what was done:
- Pages created (with links)
- Pages updated (with what changed)
- Cross-references added
- Any contradictions or questions found

## For Game Design Sources

When ingesting game design documents:
- System designs → Systems/ folder
- Cosmological content → Cosmology/ folder
- New mechanics → Systems/ with appropriate tags
- Brainstorm outputs → Brainstorms/ or compile into proper wiki pages
- Research/inspiration → summarize key takeaways, link to relevant systems

## Tool Reference

| Tool | Use For |
|------|---------|
| `Read` | Read existing vault pages, and repo files (Docs/plans/, raw source files) |
| `Write` | Create new pages |
| `Edit` | Edit existing content, add sections |
| `Glob` | Check what exists before creating |
| `Grep` | Find related content across vault |
| `WebFetch` | Fetch URL sources |

## Vault Access Protocol

> **Filesystem only (THR-654, 2026-07-21).** There is no Obsidian MCP server — `.mcp.json`
> configures `codesight` and nothing else, so `obsidian_get_file_contents`,
> `obsidian_append_content`, `obsidian_patch_content` and every other `obsidian_*` tool is
> simply absent. The former MCP-first ordering silently dropped ~12 `log.md` appends over
> 8 days (impediments #66, #71, #75, #86). Read and write vault files directly.

1. **Resolve vault path** — Run `Bash: echo $OBSIDIAN_VAULT_PATH`. This must be the absolute path to the Obsidian vault root folder (the folder *containing* `TheFantasyWorldSimulator/`).
2. **Fail loud if missing** — If `OBSIDIAN_VAULT_PATH` is empty, stop immediately and report: `"OBSIDIAN_VAULT_PATH is not configured. Vault write failed."` Do not silently skip.
3. **Read / write** — Join `$OBSIDIAN_VAULT_PATH/<vault-relative-path>` (e.g. `$OBSIDIAN_VAULT_PATH/TheFantasyWorldSimulator/log.md`). Use `Read` to read, `Edit` to append to an existing file, `Write` to create a new one.
4. **Report what was written** — Name the vault files you touched in your response.
