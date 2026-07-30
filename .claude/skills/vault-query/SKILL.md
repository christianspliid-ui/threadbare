---
name: vault-query
description: Ask questions against the Obsidian vault knowledge base. Three depth tiers (quick/standard/deep). Synthesizes answers with wikilink citations and optionally files results. Run with /kb-query.
last_validated_against: 2026-07-30
---

# Vault Query — Knowledge Base Q&A

## Overview

Ask questions against the compiled knowledge base and get synthesized answers with citations. Answers can optionally be filed back into the vault as reference pages.

**Trigger:** `/kb-query <question>` or "ask the vault" or "what does the wiki say about..."

## Query Depth Tiers

### Quick (default for simple questions)
1. Read `TheFantasyWorldSimulator/Index.md`
2. Scan summaries for relevant pages
3. Answer from index summaries alone
4. No file writes

### Standard (default for most questions)
1. Read `TheFantasyWorldSimulator/Index.md`
2. Identify 5-15 relevant pages from summaries
3. Read each relevant page with `Read`
4. Synthesize answer with `[[wikilink]]` citations
5. Optionally file answer in `output/queries/`

### Deep (for research questions)
1. Read Index.md
2. Read 15-30+ pages, following wikilink chains
3. Use `Grep` to find mentions across vault
4. Cross-reference between pages, note contradictions
5. Use `WebSearch` if vault has gaps
6. File comprehensive answer in `output/queries/`
7. Log the query in `log.md`

## Choosing Depth

- **Quick:** "What is the Resolution System?" → answer from Index summary
- **Standard:** "How does encounter awareness interact with fog of war?" → read both system pages + related pages
- **Deep:** "What are all the ways an agent's position affects their available actions?" → requires reading movement, action selection, encounter, fog of war, location, sublocation, awareness, and cross-referencing

The user can specify depth: `/kb-query deep: What are all...`
Default to Standard if not specified.

## Answer Format

Always include:
- Direct answer to the question
- `[[Wikilink]]` citations to source pages
- Confidence level (high/medium/low based on how much vault coverage exists)
- Gaps identified (topics the vault doesn't cover well)

## Filing Answers

For Standard and Deep queries, ask the user: "Should I file this answer in the vault?"

If yes, write to `TheFantasyWorldSimulator/output/queries/query-YYYY-MM-DD-<slug>.md` with `Write`, per the **Vault Access Protocol** below — construct the full path as `$OBSIDIAN_VAULT_PATH/TheFantasyWorldSimulator/output/queries/query-YYYY-MM-DD-<slug>.md` and use the `Write` tool.

```yaml
---
tags: [kb-infrastructure, output, query]
query: "<the original question>"
depth: standard|deep
created: YYYY-MM-DD
---
```

Log to `log.md` following the **vault-log** skill procedure (direct filesystem write via `OBSIDIAN_VAULT_PATH`, loud failure if that variable is unset):
```
- **query** | Question: <question> → Filed answer as [[query-YYYY-MM-DD-slug]]
```

## Vault Access Protocol

> **Filesystem only (THR-654, 2026-07-21).** There is no Obsidian MCP server — `.mcp.json`
> configures `codesight` and nothing else, so `obsidian_get_file_contents`,
> `obsidian_append_content`, `obsidian_patch_content` and every other `obsidian_*` tool is
> simply absent. The former MCP-first ordering silently dropped ~12 `log.md` appends over
> 8 days (impediments #66, #71, #75, #86). Read and write vault files directly.

1. **Resolve vault path** — Run `Bash: echo $OBSIDIAN_VAULT_PATH`. This must be the absolute path to the Obsidian vault root folder (the folder *containing* `TheFantasyWorldSimulator/`).
2. **Fail loud if missing** — If `OBSIDIAN_VAULT_PATH` is empty, stop immediately and report: `"OBSIDIAN_VAULT_PATH is not configured. Vault write failed."` Do not silently skip.
3. **Read / write** — Join `$OBSIDIAN_VAULT_PATH/<vault-relative-path>`. Use `Read` to read, `Edit` to append to an existing file, `Write` to create a new one.
4. **Report what was written** — Name the vault files you touched in your response.

## Tool Reference

| Tool | Use For |
|------|---------|
| `Read` | Read vault pages |
| `Grep` | Full-text search across vault |
| `Glob` | Discover pages in a category |
| `Write` / `Edit` | File answers, log queries |
| `WebSearch` | Fill gaps (Deep tier only) |
