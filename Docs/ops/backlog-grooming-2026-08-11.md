---
lane: daily-backlog-grooming
run: 2026-08-11
promoted: 0
filed: 0
resolved: 0
newFindings: 1
needsChristian: true
---
# Backlog Grooming — 2026-08-11

## Needs Christian

- **The Linear connector is signed out, and grooming did no board work today.** Every Linear tool (`list_issues`, `get_issue`, `save_issue`) is gone from this session — the server `plugin:productivity:linear` reports as needing authorization, and a scheduled run has no way to complete a sign-in prompt. So this run could not read the queue, could not check in-flight work, and could not fix anything. It is not a board problem and no agent can clear it. **Recommendation: re-authorize Linear from an interactive session** (`/mcp` in a `claude` terminal, or the claude.ai connector settings). One sign-in restores the lane. Until then grooming, and any other lane that reads the board, is reporting on nothing — the hourly briefing's queue section is at risk of going stale without looking stale.

## Work in flight

Not verifiable this run — the In Dev query is a Linear query. The most recent trustworthy read is the 21:56 local briefing on `ops` (~10h ago), which had **36 Ready for Dev, 0 In Dev, no parked issues, nothing stale past 7 days**. Treat that as context, not as today's state: nothing below was re-checked against the board.

## Technical gates resolved this run

None. No board writes were possible, so nothing was promoted, demoted, closed, or re-routed.

## Counts by state

Unavailable — see above. No state-filtered query could run.

## Problems found and fixed

- **Orphan-deferral audit ran clean** (the one grooming step that needs no board access). All 32 `TODO` / `DEFERRED` / `FIXME` occurrences across 26 files under `src/` carry a `(THR-…)` id; zero bare markers. Note this proves the *format* holds, not that each referenced issue exists — that half needs Linear.
- **Impediment #535 is allocated but NOT yet written to `Docs/impediments.md`** — that file is tracked on `main`, and this lane may not commit to `main` from the home tree (THR-672); reaching it needs a worktree and a PR, which is disproportionate to one row. Carried here verbatim for the next run or the weekly retro to land: *#535 · 2026-08-11 · tooling · **The Linear MCP server was unauthenticated in a scheduled run, so the whole grooming lane no-opped.** Every board query and write is gone; the failure is invisible from inside the session except that the tools are absent, and a scheduled run cannot complete an OAuth prompt. Cost: one full lane run (~15 min), plus the silent risk that the hourly briefing keeps reprinting a stale queue read without it looking stale. Preventable: Yes — a lane whose entire input is one connector should probe that connector first and say so loudly, rather than reporting a clean board it never saw.*
- **No ticket filed**, per the 2026-08-10 process-work throttle: scheduled lanes log and move on, and the weekly retro is the single promotion point. First occurrence, below the materiality bar.

## Pipeline status

Cannot recommend a next pickup without the queue. The standing upstream finding is unchanged and does not depend on Linear: as of last night the board held **zero feature or content work**, and the fix is Christian's slice verdict ([THR-907](https://linear.app/threadbare/issue/THR-907)), not another promotion. If the connector stays down, the executor lane (`tb-opus-pickup`) is blocked the same way this lane is — it claims through the same API.
