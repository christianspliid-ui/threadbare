# Briefing

**Generated:** 2026-07-18 20:28 local (18:28 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task — the replacement for the old Cowork "keep-work-flowing" chat brief. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Nothing needs a decision from you right now.** No creative or design-vision call is waiting this cycle. Last hour's one housekeeping note — "this machine is drifting behind the shared line" — has **resolved itself**: the project copy on this machine is now caught up to the shared line. There's still a pile of uncommitted local edits sitting here, but sorting those is a technical clean-up job (not a call only you can make), and it's tracked as item #3 in [`Design/user-actions.md`](user-actions.md). Nothing lost, nothing urgent.

## Queue

**Healthy** — 13 items ready for the executor, nothing urgent or high-priority among them. All medium/low: the last two game-manual pages (attention & story, twilight & world-soul), a batch of small motive-receipt clean-ups, the six "no-op" ascendant actions that still need real effects, and a few infrastructure tidy-ups. Most have sat since 2026-07-05 — backlog sediment waiting its turn, not stuck work. One economy ticket (THR-616) still *reads* "blocked," but that's stale text: its blocker (THR-615) shipped on 2026-07-05, so it's free to pull. New/near-top today: THR-660, which fixes the root cause of the recurring "this machine is out of sync" nags.

## Freshness

Home tree is **current** — on `main` and level with `origin/main` (last hour it was 29 commits behind; it's since caught up). The only thing left is the same standing housekeeping: this copy still carries a **large set of uncommitted local edits** — bigger than earlier briefings assumed. It's no longer just leftover plan-doc drafts; it now includes a stack of half-finished engine and screen files (the old war-system and card-inspector work that has since shipped cleanly through the shared line). Those local copies are almost certainly stale echoes of already-merged work, but because there are ~85 of them, they deserve a *careful* look before anything is discarded — not a blind wipe. That triage is tracked as item #3 in [`Design/user-actions.md`](user-actions.md) and is executor/design-session work, not a Christian-only task. No detached-HEAD or data-loss situation. THR-660 (below) attacks the recurring cause.

## What's moving

- **A game-manual page is being written right now.** "Stealth, Detection & Rival Gods" (THR-600, one of the last few manual pages the last brief flagged) moved into active work this hour.
- **The orphaned-action-card inspector shipped** (PR #586) — a debug tool that finds player action cards no unlock path can ever reach, so we can stop losing cards silently. That was a ready-line item last hour.
- **A ticket now targets the chronic dirt.** THR-660 (ready for the executor) stops the auto-generated `.codesight/` files from keeping this machine's copy perpetually "dirty" — the direct cause of the sync nags you keep seeing here. When it lands, this section should quiet down on its own.
- **Player-action progression (THR-613)** is the active feature thread — multi-session, ships a slice at a time and stays "in dev" between slices; expected, not stuck.
- **The Pure Claude Code migration gate (THR-652, urgent)** is in progress. Its go/no-go check includes this briefing updating hourly for two straight days — which is happening as you read this.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; if the timestamp at the top looks old, check the task's `lastRunAt` in the scheduled-task list to tell "nothing new to report" from "task stopped running."*
