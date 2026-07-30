---
name: vault-enrich
description: Improve existing vault pages — add missing cross-references, expand thin sections, flag contradictions, improve summaries. Run with /kb-enrich. Can target specific pages or auto-select from lint results.
last_validated_against: 2026-07-30
---

# Vault Enrich — Knowledge Base Improvement

## Overview

Incrementally improves the quality of existing vault pages by adding cross-references, expanding content, and fixing issues. This is the "maintenance" workflow from the LLM Knowledge Base pattern.

**Trigger:** `/kb-enrich [page name]` or "enrich this page" or "improve vault quality"

## Modes

### Targeted Mode
User specifies a page: `/kb-enrich Resolution System`
1. Read the target page
2. Read all pages it links to (outbound wikilinks)
3. Read all pages that link to it (search for its name in vault)
4. Identify improvements (see checklist below)
5. Apply improvements
6. Log the enrichment

### Auto Mode
No page specified: `/kb-enrich`
1. Read the latest vault health report from `output/audits/`
2. Pick the highest-priority pages to enrich (orphans, thin content, missing links)
3. Run targeted enrichment on each
4. Log all enrichments

## Enrichment Checklist

For each page, check and fix:

- [ ] **Summary exists** — First line after heading should be a `>` blockquote summary
- [ ] **Cross-references** — Mentions of other wiki concepts should be `[[wikilinked]]`
- [ ] **Inbound links** — If this page is important but rarely linked, add links FROM related pages TO this page
- [ ] **See Also section** — Add `## See Also` with links to related pages not already referenced
- [ ] **Frontmatter complete** — tags, aliases, status, created, updated all present
- [ ] **Content depth** — For system pages: does it explain what, why, how? Are there implementation details?
- [ ] **Consistency** — Does this page contradict other pages? Flag contradictions for user review.
- [ ] **Updated date** — Set `updated` to today's date after any changes

## How to Add Cross-References

When enriching a page, DON'T just add links to the target page. Also update the LINKED pages:
- If [[Resolution System]] mentions "sigmoid" and there's a page about it → add the wikilink
- If [[Agent Action Selection]] references the Resolution System but doesn't link → add `[[Resolution System]]`
- Bidirectional: if you add a link A → B, check if B → A exists too

## Logging

After each enrichment, append to `TheFantasyWorldSimulator/log.md` following the **vault-log** skill procedure (direct filesystem write via `OBSIDIAN_VAULT_PATH`, loud failure if that variable is unset).

```
- **enrichment** | Enriched [[Page Name]] — added N cross-references, expanded N sections, fixed N issues
```

## Tool Reference

| Tool | Use For |
|------|---------|
| `Read` | Read pages |
| `Grep` | Find mentions of a concept across the vault |
| `Edit` | Edit existing content, add See Also |
| `Write` | Create a new page |
| `Glob` | Discover related pages |

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
5. **Verify** — After enriching, `Read` the page back and confirm the change landed.
