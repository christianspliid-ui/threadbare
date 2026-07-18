# Briefing

**Generated:** 2026-07-18 13:29 local (11:29 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task — the replacement for the old Cowork "keep-work-flowing" chat brief. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Nothing needs you right now.** No creative or design-vision call is waiting this cycle. The war-system decision you made earlier is settled and moving (see below). There's one small operational note — this machine's copy of the project has drifted a little behind the shared line — but it's a single git command, spelled out under **Freshness**, and your morning session's own freshness guard will catch it anyway. Nothing lost, nothing urgent.

## Queue

**Backed up** — 16 items ready for the executor. One clear high-priority leader now sits at the top: making already-built systems visible to design agents so they stop re-proposing things that already exist (THR-658, filed today, prompted by the war-system mix-up). The war-system reconciliation you green-lit has moved off the ready list and into active development, so it's no longer just queued. Below the leader, about 11 of the 16 haven't been touched since 2026-07-05 (roughly two weeks cold — mostly game-manual pages and small clean-up tickets). That's backlog sediment, not stuck work: the executor always pulls the freshest high-priority item first, so the older low-priority ones wait their turn. One economy ticket still reads "blocked" (THR-616), but its actual blocker already shipped — the label is stale text, not a real stall.

## Freshness

Home tree **needs a quick refresh** — it's on `main` but **12 commits behind** `origin/main`, and it has ~20 uncommitted working files (mostly draft plan docs). Before you start the morning session:

```
git fetch && git rebase origin/main
```

Then triage the untracked plan-doc drafts (tracked as item #3 in [`Design/user-actions.md`](user-actions.md)). No detached-HEAD or data-loss situation this hour — just ordinary catch-up.

## What's moving

- **Player-action progression (THR-613)** is the active executor work — a multi-session feature that ships in slices and stays "in dev" between them; expected, not stuck.
- **The war-system reconciliation (THR-614)** you approved is now in development — waking up the army/battle/siege system that was already built rather than building a new one. No longer needs you.
- **The Pure Claude Code migration gate (THR-652, urgent)** is in progress — its go/no-go check includes this briefing updating hourly for two straight days, which is happening as you read this.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; if the timestamp at the top looks old, check the task's `lastRunAt` in the scheduled-task list to tell "nothing new to report" from "task stopped running."*
