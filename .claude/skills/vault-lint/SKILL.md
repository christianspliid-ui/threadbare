---
name: vault-lint
description: Audit Obsidian vault health — orphan pages, broken links, stale content, missing frontmatter, cross-link gaps, index drift. Run with /kb-lint. Produces a health report in output/audits/ and logs to log.md.
last_validated_against: 2026-05-08
---

# Vault Lint — Knowledge Base Health Check

## Overview

Systematic health audit of the Obsidian vault. Checks for structural issues, content gaps, and maintenance needs. Produces an actionable report and logs the lint pass.

**Trigger:** `/kb-lint` or "audit the vault" or "vault health check"

## Prerequisites

Load the `state-of-game-design` router first if you need cosmology/system context for cross-link analysis; pull in `reference/cosmology.md` for cosmology or `reference/architectural-decisions.md` for system architecture.

## The Audit Process

### Step 1: Inventory

Build a complete file inventory using Obsidian MCP:

1. `obsidian_list_files_in_dir` recursively through `TheFantasyWorldSimulator/` and all subdirectories
2. For each `.md` file, read its content with `obsidian_get_file_contents`
3. Parse:
   - YAML frontmatter (tags, status, updated, created, aliases)
   - First blockquote line (summary)
   - All `[[wikilinks]]` in the body (outbound links)
   - The full filename (for inbound link matching)

Store this as an in-memory map: `filename → { frontmatter, summary, outboundLinks, folder, content }`

### Step 2: Run Health Checks

Run ALL of these checks:

#### 2a. Orphan Pages
Pages with ZERO inbound wikilinks (no other page links to them).

**How:** For each file, check if its name (without .md, without path) appears as a `[[wikilink]]` target in ANY other file's outbound links. Pages only linked from Index.md should be flagged as "index-only" (not true orphans but worth noting).

**Exclude:** Index.md, CLAUDE.md, log.md, README.md files (infrastructure files are expected to have few inbound links).

#### 2b. Broken Links
Wikilinks that point to non-existent pages.

**How:** For each outbound `[[link]]`, check if a file with that name exists in the vault. Account for aliases (check frontmatter aliases of all files).

#### 2c. Missing Frontmatter
Files missing required fields: `tags`, `status`, `updated`.

**How:** Check each file's parsed frontmatter for these required fields.

#### 2d. Stale Content
Pages with `status: deprecated` or `updated` date older than 90 days.

**How:** Parse the `updated` field and compare to today. Also flag pages with `status: deprecated` that are still linked from active pages.

#### 2e. Missing Summaries
Pages without a blockquote (`>`) summary line near the top.

**How:** Check if there's a line starting with `> ` within the first 10 lines of content (after frontmatter).

#### 2f. Cross-Link Gaps
Pages that mention concepts from other categories without wikilinks.

**How:** Build a list of all page names. For each page's body text, search for mentions of other page names that aren't wrapped in `[[...]]`. Flag the top 20 most common gaps.

**Important:** Match whole words only, case-insensitive. Skip common English words that happen to be page names (e.g., "Force", "Time", "Mind" should be checked in context).

#### 2g. Index Drift
Pages that exist in the vault but are NOT listed in Index.md.

**How:** Compare the file inventory against all `[[wikilinks]]` in Index.md. Pages not in the index are "drifted."

### Step 3: Generate Report

Write the health report to `TheFantasyWorldSimulator/output/audits/vault-health-YYYY-MM-DD.md` via `obsidian_append_content`. If the MCP call fails, apply the **Filesystem Fallback Protocol** below — construct the full path as `$OBSIDIAN_VAULT_PATH/TheFantasyWorldSimulator/output/audits/vault-health-YYYY-MM-DD.md` and use the `Write` tool.

```markdown
---
tags: [kb-infrastructure, audit, output]
---
# Vault Health Report — YYYY-MM-DD

## Summary
- **Total pages:** N
- **Orphan pages:** N
- **Broken links:** N
- **Missing frontmatter:** N files
- **Stale content:** N pages
- **Missing summaries:** N pages
- **Cross-link gaps:** N suggestions
- **Index drift:** N pages not in index

## Grade: A/B/C/D/F
(A = <5 issues total, B = <15, C = <30, D = <50, F = 50+)

## Orphan Pages
(list each with its folder)

## Broken Links
(list each broken link and the file containing it)

## Missing Frontmatter
(list each file and which fields are missing)

## Stale Content
(list each with last updated date)

## Missing Summaries
(list each file)

## Cross-Link Gaps (Top 20)
(list: "[[Page A]] mentions 'Concept B' but doesn't link to [[Concept B]]")

## Index Drift
(list pages not in Index.md)

## Recommended Actions
1. (prioritized list of fixes)
```

### Step 4: Log the Lint Pass

Append to `TheFantasyWorldSimulator/log.md` following the **vault-log** skill procedure (MCP first, filesystem fallback if MCP is unreachable, loud failure if neither path is available).

```
- **lint** | Health check: found N orphans, N broken links, N stale pages, N missing frontmatter. Grade: X. Report: [[vault-health-YYYY-MM-DD]]
```

## Filesystem Fallback Protocol

When any `obsidian_*` MCP call fails (unreachable, connection refused, timeout):

1. **Resolve vault path** — Run `Bash: echo $OBSIDIAN_VAULT_PATH`. This must be the absolute path to the Obsidian vault root folder (the folder *containing* `TheFantasyWorldSimulator/`).
2. **Fail loud if missing** — If `OBSIDIAN_VAULT_PATH` is empty and the MCP is also unavailable, stop immediately and report: `"Obsidian MCP is unreachable and OBSIDIAN_VAULT_PATH is not configured. Vault write failed."` Do not silently skip.
3. **Filesystem write** — If `OBSIDIAN_VAULT_PATH` is set, construct the full path by joining: `$OBSIDIAN_VAULT_PATH/<vault-relative-path>`. Use `Write` to create new files, `Read` then `Edit` to append. Write the exact same content the MCP path would have written.
4. **Note the fallback** — Mention in your response that the filesystem fallback was used and which files were written.

## Tool Reference

| Tool | Use For |
|------|---------|
| `obsidian_list_files_in_dir` | Recursive directory listing |
| `obsidian_get_file_contents` | Read file content + frontmatter |
| `obsidian_append_content` | Create report file, append to log |
| `obsidian_simple_search` | Find text across vault |

## Limitations

- Cross-link gap detection is heuristic (keyword matching, not semantic)
- For very large audits, batch file reads in groups of 10-20 to avoid API timeouts
- The audit reads ALL files — expect it to take several minutes for ~295 files
