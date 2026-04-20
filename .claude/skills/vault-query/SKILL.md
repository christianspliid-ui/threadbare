---
name: vault-query
description: Ask questions against the Obsidian vault knowledge base. Three depth tiers (quick/standard/deep). Synthesizes answers with wikilink citations and optionally files results. Run with /kb-query.
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
3. Read each relevant page via `obsidian_get_file_contents`
4. Synthesize answer with `[[wikilink]]` citations
5. Optionally file answer in `output/queries/`

### Deep (for research questions)
1. Read Index.md
2. Read 15-30+ pages, following wikilink chains
3. Use `obsidian_simple_search` to find mentions across vault
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

If yes, write to `TheFantasyWorldSimulator/output/queries/query-YYYY-MM-DD-<slug>.md`:
```yaml
---
tags: [kb-infrastructure, output, query]
query: "<the original question>"
depth: standard|deep
created: YYYY-MM-DD
---
```

Log to `log.md`:
```
- **query** | Question: <question> → Filed answer as [[query-YYYY-MM-DD-slug]]
```

## Tool Reference

| Tool | Use For |
|------|---------|
| `obsidian_get_file_contents` | Read vault pages |
| `obsidian_simple_search` | Full-text search across vault |
| `obsidian_list_files_in_dir` | Discover pages in a category |
| `obsidian_append_content` | File answers, log queries |
| `WebSearch` | Fill gaps (Deep tier only) |
