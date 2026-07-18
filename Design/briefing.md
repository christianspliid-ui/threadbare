# Briefing

**Generated:** 2026-07-18 12:29 local (10:29 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task — the replacement for the old Cowork "keep-work-flowing" chat brief. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Nothing needs you right now.** No creative or design-vision call is waiting this cycle. There's one operational note — this machine's copy of the project has drifted behind the shared line over the past hour — but it's a single git command, spelled out under **Freshness** below, and your morning session's own freshness guard will flag it for you anyway. Nothing lost, nothing urgent.

## Queue

**Backed up** — 17 items ready for the executor. The top of the queue is fresh and pullable: two high-priority items lead it — making already-built systems visible to design agents so they stop re-proposing what exists (THR-658, new today), and the war-system reconciliation you already green-lit (THR-614). Below them, 11 of the 17 haven't been touched since 2026-07-05 (13 days cold — mostly game-manual pages and small deferrals). That's backlog sediment, not stuck work: the executor always pulls the freshest high-priority item first, so the old low-priority ones just wait their turn. The one economy ticket that reads "blocked" (THR-616) is carrying stale text — its actual blocker already shipped.

## Freshness

Home tree **needs a quick refresh** — it's on `main` but **10 commits behind** `origin/main` (the shared line moved on while this copy sat), and it has uncommitted working files. Before you start the morning session:

```
git fetch && git rebase origin/main
```

Then triage the untracked plan-doc drafts (tracked as item #3 in [`Design/user-actions.md`](user-actions.md)). No detached-HEAD or data-loss situation this hour — just ordinary catch-up.

## What's moving

- **Player-action progression (THR-613)** is the active executor work — a multi-session feature that ships in slices and stays "in dev" between them; expected, not stuck.
- **The Pure Claude Code migration gate (THR-652, urgent)** is now in progress — its go/no-go check includes this briefing updating hourly for two straight days, which is happening as you read this.
- **The war-system verdict is settled** — you approved re-scoping "build a war system" to "wake up the one that's already built"; it's queued (THR-614), no longer needs you.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; if the timestamp at the top looks old, check the task's `lastRunAt` in the scheduled-task list to tell "nothing new to report" from "task stopped running."*
