---
name: vault-enrich
description: Improve existing vault pages — add missing cross-references, expand thin sections, flag contradictions, improve summaries. Run with /kb-enrich. Can target specific pages or auto-select from lint results.
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

After each enrichment, append to `TheFantasyWorldSimulator/log.md` via `obsidian_append_content`. If the MCP call fails, apply the **Filesystem Fallback Protocol** below.

```
- **enrichment** | Enriched [[Page Name]] — added N cross-references, expanded N sections, fixed N issues
```

## Tool Reference

| Tool | Use For |
|------|---------|
| `obsidian_get_file_contents` | Read pages |
| `obsidian_simple_search` | Find mentions of a concept |
| `obsidian_patch_content` | Edit existing content (simple targets) |
| `obsidian_append_content` | Add new sections, create See Also |
| `obsidian_list_files_in_dir` | Discover related pages |

## Important: Obsidian MCP Quirks

- **Always prefer `obsidian_append_content`** for adding new sections
- `obsidian_patch_content` fails on complex targets — use simple, unique heading text
- For Index.md edits, ONLY use `obsidian_append_content`
- After enriching, verify with `obsidian_get_file_contents` that changes took effect

## Filesystem Fallback Protocol

When any `obsidian_*` MCP call fails (unreachable, connection refused, timeout):

1. **Resolve vault path** — Run `Bash: echo $OBSIDIAN_VAULT_PATH`. This must be the absolute path to the Obsidian vault root folder (the folder *containing* `TheFantasyWorldSimulator/`).
2. **Fail loud if missing** — If `OBSIDIAN_VAULT_PATH` is empty and the MCP is also unavailable, stop immediately and report: `"Obsidian MCP is unreachable and OBSIDIAN_VAULT_PATH is not configured. Vault write failed."` Do not silently skip.
3. **Filesystem write** — If `OBSIDIAN_VAULT_PATH` is set, construct the full path by joining: `$OBSIDIAN_VAULT_PATH/<vault-relative-path>` (e.g., `$OBSIDIAN_VAULT_PATH/TheFantasyWorldSimulator/log.md`). Use `Read` then `Edit` to append, or `Write` to create new files. Write the exact same content the MCP path would have written.
4. **Note the fallback** — Mention in your response that the filesystem fallback was used and which files were written, so the user knows the MCP was unavailable.
