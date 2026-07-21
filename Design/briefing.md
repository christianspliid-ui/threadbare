# Briefing

**Generated:** 2026-07-21 19:54 local (17:54 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task — the replacement for the old Cowork "keep-work-flowing" chat brief. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Nothing is broken. Same three as the last two hours — one ten-second command, one batch of trial runs, one creative steer.**

> **1. One command to unstick your working copy — eighth hour, now 41 behind.**

```
git -C "C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator" checkout -- Design/user-actions.md
```

The number keeps climbing (4 → 14 → 18 → 20 → 22 → 31 → 36 → **41**). One leftover file blocks the automatic sync. It is a stale duplicate — verified again this run — and discarding it loses nothing. Detail under **Freshness**.

> **2. Three replacement jobs are built and switched off, waiting on you to watch each run once.**

Re-checked against the live scheduler this run: all three present, all three still **off**, exactly per the staged cutover you settled this morning. Nothing has changed since 17:54 and nothing will until you run the trials.

| Job | When it would run | State |
|---|---|---|
| Daily queue grooming | 09:16 daily | built, **off** |
| Wednesday workflow review | 11:13 Wednesdays | built, **off** |
| Sunday tidy-up | 10:10 Sundays | built, **off** |

What they need is the trial you asked for: **run each once in a normal chat session, read what it produces, say yes.** Then it goes live and its Cowork twin gets switched off in the same step. Start with the daily queue grooming — it's the load-bearing one, and item 3 below is exactly the kind of thing it exists to catch.

Separately and still yours: **switch off `keep-work-flowing` in the Cowork app.** That one needs no trial — its replacement is live and wrote this brief.

> **3. The next creative stretch — the case is stronger this hour.**

Three jobs are queued, down from four: the headless testing bridge shipped at 19:01. All three that remain are still plumbing — build-system honesty, a merge fix for stale pull requests, a lint-scope tidy. **The queue has now spent a full day without a single job that changes what the game does**, and it is draining about one per hour.

The question is unchanged: **war or economy?**

- **War, deepened.** The war system came alive on the 18th. Designed but unbuilt: battles with real texture (turning points, commanders in peril, last stands), sieges that tighten as they drag instead of resolving flat, and the mark a war leaves on a region once it ends.
- **The economy, made visible.** Goods move, but the player can't see it. Missing: things going wrong on trade routes — banditry, embargoes, tolls surfacing as encounters — and the map showing what's actually travelling a road when you look at it.

A one-word steer is enough. A design session does the rest.

## Queue

**Healthy but thinning — three ready to start, down from four.**

- **Three ready for pickup**, all Continuous Improvement, all filed this morning: generated files into the build (THR-690), a merge driver to stop idle pull requests rotting into conflicts (THR-691), and a lint-scope fix (THR-692).
- **Nothing blocked, nothing stale.** All three were filed today and none waits on another.
- **One in development** — the Cowork job ports (THR-677), **unassigned on purpose**. Its code landed at 17:28 and three of its four goals are met; the fourth is your trial approval, so the executor released the work slot rather than hold it open across an overnight wait. Correct call, not a stall.
- **At one job an hour, the queue is empty by late evening.** That is what makes item 3 above worth answering today rather than tomorrow.

## Freshness

**Same command as the last seven hours. The drift is now 41 commits, up from 36.**

Nothing is at risk and nothing is stranded — the tree sits on `main`, not parked off it, and holds no commits that exist nowhere else. One leftover file blocks the automatic sync, which refuses to update a tree carrying local edits. **That file is strictly the older text:** the on-disk copy is a mid-morning version of a file the repository has since republished several times, including in this run. Discarding the local copy is loss-free by construction.

An agent cannot run the command for you — scheduled sessions are barred from touching your working copy, and that rule is what keeps it stable.

**The permanent fix is agent work and is still unfiled after six runs.** Teaching the automatic repair to discard a local edit it can prove is already published would end this item for good. Flagging it here has not worked; it needs one sentence in a chat session — *"file the autosync self-heal ticket"* — and then a design session picks it up. There is a related ticket for the untracked-file variant (THR-678, sitting in Idea), but nothing covering this one.

The automatic stale-branch cleanup is healthy — last run 19:40, fourteen minutes ago, tracking 24 work folders and 31 branches, with no stashes and nothing flagged for your decision.

## What's moving

- **The headless testing bridge shipped at 19:01** (THR-689). Automated browser sessions can now advance the simulation directly instead of being throttled to one tick per click — which unblocks any future test that needs to watch the world run for a while.
- **The executor ran on schedule at 19:01** and is due again at 20:00.
- **Nothing regressed.**

**One correction to last hour's brief:** it reported six older pull requests needing conflict resolution. Re-checking this run, GitHub confirms conflicts on **two** (#327 and #553) and had not recomputed the rest at query time — so the "six" was reading uncomputed states as conflicts. The count of open PRs is unchanged at fourteen, oldest from 12 June, and the underlying rot is real; the sharper figure is just less alarming than stated. THR-691 in the queue is the fix.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; if the timestamp at the top looks old, check the task's `lastRunAt` in the scheduled-task list to tell "nothing new to report" from "task stopped running."*
