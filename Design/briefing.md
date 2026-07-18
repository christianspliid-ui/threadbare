# Briefing

**Generated:** 2026-07-18 21:29 local (19:29 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task — the replacement for the old Cowork "keep-work-flowing" chat brief. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Nothing needs a decision from you right now.** No creative or design-vision call is waiting this cycle. The queue is draining on its own, the manual pages are being written, and the only housekeeping note (this machine carrying a pile of uncommitted local edits) is technical clean-up work — not a call only you can make. It's tracked as item #3 in [`Design/user-actions.md`](user-actions.md). Nothing lost, nothing urgent.

## Queue

**Healthy** — 12 items ready for the executor (down one from last hour; the "Stealth, Detection & Rival Gods" manual page shipped). Nothing urgent or high-priority among them — all medium/low: the last game-manual page (twilight & world-soul), a batch of small motive-receipt clean-ups, the six "no-op" ascendant actions that still need real effects, and a few infrastructure tidy-ups. Most have sat since 2026-07-05 — backlog sediment waiting its turn, not stuck work. One economy ticket (THR-616) still *reads* "blocked," but that's stale text: its blocker (THR-615) shipped on 2026-07-05, so it's free to pull.

## Freshness

Home tree is on `main` but has **drifted 3 commits behind** the shared line since last hour, when it was level. That's under the alarm threshold, so it's not a problem yet — but the *reason* it keeps drifting is the same standing one: this copy carries a **large set of uncommitted local edits** (~85 files), which is too dirty for the automatic hourly sync to catch it up. So every hour it falls a little further behind until the mess is cleared. Those local copies are almost certainly stale echoes of already-merged work (the war system and card-inspector both shipped cleanly through the shared line), but with ~85 of them they deserve a *careful* look before anything is discarded, not a blind wipe. That triage is tracked as item #3 in [`Design/user-actions.md`](user-actions.md) and is executor/design-session work, not a Christian-only task. THR-660 (in the queue) attacks the recurring cause.

## What's moving

- **A game-manual page shipped this hour.** "Stealth, Detection & Rival Gods" (THR-600) merged (PR #590) — it was flagged as in-progress in the last brief.
- **The next manual page is being written now.** "Attention, the Digest & the Chronicle" (THR-601) moved into active work; "Twilight, Echoes & the World-Soul" (THR-602) is queued right behind it. Those are the last two pages of the manual.
- **A ticket targets the chronic dirt.** THR-660 (ready for the executor) stops the auto-generated `.codesight/` files from keeping this machine's copy perpetually "dirty" — the direct cause of the drift above. When it lands, this section should quiet down on its own.
- **Player-action progression (THR-613)** is the active feature thread — multi-session, ships a slice at a time and stays "in dev" between slices; expected, not stuck.
- **The Pure Claude Code migration gate (THR-652, urgent)** is in progress. Its go/no-go check includes this briefing updating hourly for two straight days — which is happening as you read this.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; if the timestamp at the top looks old, check the task's `lastRunAt` in the scheduled-task list to tell "nothing new to report" from "task stopped running."*
