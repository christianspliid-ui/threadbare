---
name: vault-log
description: Append an entry to TheFantasyWorldSimulator/log.md. Tries Obsidian MCP first; falls back to direct filesystem write using OBSIDIAN_VAULT_PATH if MCP is unreachable. Fails loud if neither path is available. Used by vault-ingest, vault-enrich, vault-lint, and vault-query.
last_validated_against: 2026-05-08
---

# Vault Log — Append with Fallback

## Purpose

Single-responsibility skill for appending log entries to `TheFantasyWorldSimulator/log.md`. Always call this (or follow this procedure inline) when logging vault activity — never skip the log silently.

## Inputs

- **entry** — The formatted line to append (see formats table below).

## Procedure

### Step 1: Try Obsidian MCP

Call `obsidian_append_content`:
- `filepath`: `TheFantasyWorldSimulator/log.md`
- `content`: the entry text

**If it succeeds → done. Stop here.**

### Step 2: Filesystem fallback

If `obsidian_append_content` throws a tool error, times out, or returns an MCP-unreachable error:

**2a. Resolve vault path**

```bash
echo "$OBSIDIAN_VAULT_PATH"
```

If the output is empty or unset → **fail loud** and stop with this message:

```
VAULT-LOG ERROR: Obsidian MCP is unreachable AND OBSIDIAN_VAULT_PATH is not configured.
Cannot write to log.md. Set OBSIDIAN_VAULT_PATH to the vault root and retry.
Example: add to .claude/settings.local.json:
  { "env": { "OBSIDIAN_VAULT_PATH": "C:\\Users\\chris\\Dev\\Obsidian" } }
```

Do NOT silently drop the log entry.

**2b. Verify log.md exists**

```bash
LOG_PATH="$OBSIDIAN_VAULT_PATH/TheFantasyWorldSimulator/log.md"
test -f "$LOG_PATH" && echo "OK: $LOG_PATH" || echo "MISSING: $LOG_PATH"
```

If missing → fail loud: vault path is misconfigured or vault is not on this machine.

**2c. Append the entry**

Read the current tail to confirm the file position, then append:

```bash
echo "" >> "$LOG_PATH"     # ensure file ends with newline
echo "<entry>" >> "$LOG_PATH"
```

Or use the `Edit` tool: read the last few lines of the file via `Read`, then use `Edit` to append the new line at the end. Content must be **identical** to what the MCP path would have written.

**2d. Confirm**

```bash
tail -3 "$LOG_PATH"
```

Verify the entry appears in the output.

## Log Entry Formats

| Calling skill | Format |
|---------------|--------|
| vault-ingest  | `- **ingest** \| Source: <title/path> → Created: [[Page]]. Updated: [[Page]]` |
| vault-enrich  | `- **enrichment** \| Enriched [[Page Name]] — added N cross-references, expanded N sections` |
| vault-lint    | `- **lint** \| Health check: N orphans, N broken links. Grade: X. Report: [[vault-health-YYYY-MM-DD]]` |
| vault-query   | `- **query** \| Question: <question> → Filed answer as [[query-YYYY-MM-DD-slug]]` |

## Configuration

Set `OBSIDIAN_VAULT_PATH` to the vault root — the directory that contains `.obsidian/` and the `TheFantasyWorldSimulator/` subfolder.

**Project-level** (`.claude/settings.local.json`, gitignored — preferred):
```json
{
  "env": {
    "OBSIDIAN_VAULT_PATH": "C:\\Users\\chris\\Dev\\Obsidian"
  }
}
```

**User-level** (`~/.claude/settings.json`, applies to all projects):
```json
{
  "env": {
    "OBSIDIAN_VAULT_PATH": "C:\\Users\\chris\\Dev\\Obsidian"
  }
}
```

The path is the vault root, not the project subfolder. `TheFantasyWorldSimulator/log.md` is resolved by appending to this root.

## Parity Guarantee

The filesystem fallback must produce content identical to the MCP path:
- Same line text, no extra trailing whitespace
- Append-only — never overwrite existing lines
- `log.md` has no frontmatter; do not add any
