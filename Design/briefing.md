# Briefing

**Generated:** 2026-07-21 18:54 local (16:54 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task — the replacement for the old Cowork "keep-work-flowing" chat brief. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Nothing is broken. The same three things as last hour — one ten-second command, one batch of trial runs, one creative steer.**

> **1. One command to unstick your working copy — seventh hour, now 36 behind.**

```
git -C "C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator" checkout -- Design/user-actions.md
```

The number keeps climbing (4 → 14 → 18 → 20 → 22 → 31 → **36**). One leftover file blocks the automatic sync. It is a stale duplicate — verified again this run — and discarding it loses nothing. Detail under **Freshness**.

> **2. Three replacement jobs are built and switched off, waiting on you to watch each run once.**

Re-verified against the scheduler this run: all three exist and all three are **deliberately disabled**, exactly per the staged cutover you settled this morning.

| Job | When it would run | State |
|---|---|---|
| Daily queue grooming | 09:16 daily | built, **off** |
| Wednesday workflow review | 11:13 Wednesdays | built, **off** |
| Sunday tidy-up | 10:10 Sundays | built, **off** |

What they need is the trial you asked for: **run each once in a normal chat session, read what it produces, say yes.** Then it goes live and its Cowork twin gets switched off in the same step. Start with the daily queue grooming — it's the load-bearing one, and its trial is meant to show you the queue changes it *would* make before it's trusted to make them unattended.

Separately and still yours: **switch off `keep-work-flowing` in the Cowork app.** That one needs no trial — its replacement is live and wrote this brief.

> **3. The next creative stretch — still open, still not urgent.**

Four jobs are queued and one shipped this hour, so nothing idles. But all four are plumbing: build-system honesty, a merge fix for stale pull requests, a headless way to advance the simulation during testing, a lint-scope tidy. **None of them moves the game itself forward.**

The question is unchanged: **war or economy?**

- **War, deepened.** The war system came alive on the 18th. Designed but unbuilt: battles with real texture (turning points, commanders in peril, last stands), sieges that tighten as they drag instead of resolving flat, and the mark a war leaves on a region once it ends.
- **The economy, made visible.** Goods move, but the player can't see it. Missing: things going wrong on trade routes — banditry, embargoes, tolls surfacing as encounters — and the map showing what's actually travelling a road when you look at it.

A one-word steer is enough. A design session does the rest.

## Queue

**Healthy — four ready to start, one in development.**

- **Four ready for pickup**, all filed this morning, all in Continuous Improvement: a headless tick bridge for browser testing (THR-689), bringing generated files into the build (THR-690), a merge driver to stop idle pull requests rotting into conflicts (THR-691), and a lint-scope fix (THR-692).
- **Nothing is blocked and nothing is stale.** The four cross-reference each other but none waits on another; all were filed today.
- **One in development** — the Cowork job ports (THR-677). It is **unassigned on purpose**, not stalled: its code landed at 17:28 and three of its four goals are met, so the executor released it rather than holding the single work slot open across your trial approvals. That slot is free for the hour.

## Freshness

**Same command as the last six hours. The drift is now 36 commits behind, up from 31.**

Nothing is at risk and nothing is stranded — the tree sits on `main`, not parked off it, and holds no commits that exist nowhere else. One leftover file blocks the automatic sync, which refuses to update a tree carrying local edits. **That file is strictly the older text:** the on-disk copy is a mid-morning version of a file the repository has since republished twice, and this run republishes it again. Discarding the local copy is loss-free by construction.

An agent cannot run the command for you — scheduled sessions are barred from touching your working copy, and that rule is what keeps it stable.

**The narrow fix that would end this repetition is agent work, and it is still unfiled after five runs** — teaching the automatic repair to discard a local edit it can prove is already published. This is now the highest-value unfiled item on the board, and it wants a ticket from the next design session. It is the difference between this item never appearing again and it appearing every hour.

The automatic stale-branch cleanup is healthy — last run 18:40, fourteen minutes ago, tracking 24 work folders and 29 branches, with no stashes and nothing flagged for your decision.

## What's moving

- **The ticket-authoring rules shipped at 18:08** (THR-688) — how tickets get written from here on: testable membership rules instead of snapshot counts that go stale before pickup, stated reasons whenever two pieces of work can't run at once, and goals scoped to the pillar they actually belong to. That's why the queue drew down from five to four.
- **The executor ran on schedule at 18:01** and is due again at 19:00.
- **Nothing regressed.**

**Worth flagging:** fourteen older pull requests are still open, oldest from 12 June — and **six** now need conflict resolution rather than a refresh, up from two this morning. That is precisely the rot THR-691 sitting in the queue is meant to stop. Auto-merge only helps requests opened after it shipped, so this backlog still drains by hand.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; if the timestamp at the top looks old, check the task's `lastRunAt` in the scheduled-task list to tell "nothing new to report" from "task stopped running."*
