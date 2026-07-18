# Briefing

**Generated:** 2026-07-18 22:29 local (20:29 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task — the replacement for the old Cowork "keep-work-flowing" chat brief. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Nothing needs a decision from you right now.** No creative or design-vision call is waiting this cycle. The manual is one page from finished, the queue is draining on its own, and the only recurring note (this machine's pile of uncommitted local edits) is technical clean-up — tracked as item #3 in [`Design/user-actions.md`](user-actions.md) and doable by an executor/design session, not a call only you can make. Nothing lost, nothing urgent.

## Queue

**Healthy** — 11 items ready for the executor (down one from last hour; the "Attention, the Digest & the Chronicle" manual page shipped). Nothing urgent or high-priority among them — all medium/low: the six "no-op" ascendant actions that still need real effects, a batch of small motive-receipt clean-ups, a UL proposal, and a few infrastructure tidy-ups (untrack `.codesight/`, a plans index, retiring Codex remnants). Most have sat since 2026-07-05 — backlog sediment waiting its turn, not stuck work. One economy ticket (THR-616) still *reads* "blocked," but that text is stale: its blocker (THR-615) shipped on 2026-07-05, so it's free to pull.

## Freshness

Home tree is on `main` but has **drifted 8 commits behind** the shared line (it was 3 behind last hour). Still under the alarm threshold of 10, so not a problem yet — but it's climbing, and the reason is the same standing one: this copy carries a **large set of uncommitted local edits** (~85 files), which is too dirty for the automatic hourly sync to fast-forward, so it slips a little further behind each cycle. Those local copies are almost certainly stale echoes of already-merged work (the war system and card-inspector both shipped cleanly through the shared line), but at ~85 files they deserve a *careful* look before anything is discarded, not a blind wipe. That triage is tracked as item #3 in [`Design/user-actions.md`](user-actions.md) and is executor/design-session work, not a Christian-only task. THR-660 (in the queue) attacks the recurring cause.

## What's moving

- **A game-manual page shipped this hour.** "Attention, the Digest & the Chronicle" (THR-601) merged (PR #592) — it was flagged as in-progress in the last brief.
- **The final manual page is being written now.** "Twilight, Echoes & the World-Soul" (THR-602) moved into active work — the last page of the manual.
- **A ticket targets the chronic dirt.** THR-660 (ready for the executor) stops the auto-generated `.codesight/` files from keeping this machine's copy perpetually "dirty" — the direct cause of the drift above. When it lands, this section should quiet down on its own.
- **Player-action progression (THR-613)** is the active feature thread — multi-session, ships a slice at a time and stays "in dev" between slices; expected, not stuck.
- **The Pure Claude Code migration gate (THR-652, urgent)** is in progress. Its go/no-go check includes this briefing updating hourly for two straight days — which is happening as you read this.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; if the timestamp at the top looks old, check the task's `lastRunAt` in the scheduled-task list to tell "nothing new to report" from "task stopped running."*
