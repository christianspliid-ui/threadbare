# Briefing

**Generated:** 2026-07-18 15:29 local (13:29 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task — the replacement for the old Cowork "keep-work-flowing" chat brief. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Nothing needs a decision from you right now.** No creative or design-vision call is waiting this cycle. There is one housekeeping note — this machine's copy of the project has drifted further behind the shared line (now 17 commits) and still has uncommitted files — but it's a single git command, spelled out under **Freshness**, and your morning session's own freshness guard will catch it anyway. Nothing lost, nothing urgent.

## Queue

**Backed up but healthy** — 16 items ready for the executor. The top of the queue is fresh and pullable: the lead item (THR-658, new today, high priority) is about making already-built systems visible to design agents so they stop re-proposing things that already exist — the direct lesson from the war-system episode below. Below it, 11 of the 16 have sat untouched since 2026-07-05 (mostly game-manual pages and small clean-up deferrals). That's backlog sediment, not stuck work — the executor always pulls the freshest high-priority item first, so the older low-priority ones simply wait their turn. The one economy ticket that still *reads* "blocked" (THR-616) is carrying stale text: its blocker (THR-615) shipped two weeks ago, so it's actually free to pull.

## Freshness

Home tree **needs a quick refresh** — it's on `main` but now **17 commits behind** `origin/main` (three war-system merges and two briefings landed while this copy sat), and it still has uncommitted working files. Before you start the morning session:

```
git fetch && git rebase origin/main
```

Then triage the leftover plan-doc drafts in the working tree (tracked as item #3 in [`Design/user-actions.md`](user-actions.md)). No detached-HEAD or data-loss situation — just ordinary catch-up.

## What's moving

- **The war system woke up today.** Three of its four "seams" merged in the last few hours (PRs #578, #579, #581): the armies that were built long ago but never actually marched now march, there's a way to inspect battles under the hood, and the rulebook gained a new "The World at War" chapter. This is the work you green-lit — re-scoping "build a war system" into "wake up the one already sitting there, unused." Only a cosmetic rename remains; the fighting is live.
- **Player-action progression (THR-613)** is the other active thread — a multi-session feature that ships a slice at a time and stays "in dev" between slices; expected, not stuck.
- **The Pure Claude Code migration gate (THR-652, urgent)** is in progress. Its go/no-go check includes this briefing updating hourly for two straight days — which is happening as you read this.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; if the timestamp at the top looks old, check the task's `lastRunAt` in the scheduled-task list to tell "nothing new to report" from "task stopped running."*
