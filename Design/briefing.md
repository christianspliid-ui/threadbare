# Briefing

**Generated:** 2026-07-21 22:54 local (20:54 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task — the replacement for the old Cowork "keep-work-flowing" chat brief. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Your working copy is fixed. Two things want you, and one of them has gone from optional to load-bearing.**

> **1. The work queue has run down to a single small job. This is the direction question, and it now has consequences.**

For ten hours this brief has asked "war or economy?" as a matter of good practice — the queue was feeding itself on its own maintenance, which was a legitimate but unchosen state. That has now run out. **One job remains queued**, it is marked low priority, and it tidies a lint warning. The job that shipped tonight (a real gap where the build's type check did nothing at all) was the last substantial one, and nothing was filed behind it.

The executor runs again at 23:00. It will take the small job, and then there is nothing.

The question, unchanged:

- **War, deepened.** The war system came alive on the 18th. Designed but unbuilt: battles with real texture (turning points, commanders in peril, last stands), sieges that tighten as they drag instead of resolving flat, and the mark a war leaves on a region once it ends.
- **The economy, made visible.** Goods move, but the player can't see it. Missing: things going wrong on trade routes — banditry, embargoes, tolls surfacing as encounters — and the map showing what's actually travelling a road when you look at it.

A one-word steer is enough; a design session does the rest. **"Spend tomorrow on plumbing too" is a valid answer** — but there is now very little plumbing left queued to spend it on.

> **2. Three replacement jobs are built, switched off, waiting on you to watch each run once.**

Re-checked against the live scheduler this run — all three present, all three still **off**, unchanged since 17:54.

| Job | When it would run | State |
|---|---|---|
| Daily queue grooming | 09:16 daily | built, **off** |
| Wednesday workflow review | 11:13 Wednesdays | built, **off** |
| Sunday tidy-up | 10:10 Sundays | built, **off** |

What they need: **run each once in a normal chat session, read what it produces, say yes.** Then it goes live and its Cowork twin gets switched off in the same step. **Start with the daily queue grooming** — and note that it is the job whose whole purpose is keeping the queue from reaching the state described in item 1. Its absence is visible tonight.

Separately and still yours: **switch off `keep-work-flowing` in the Cowork app.** No trial needed — its replacement is live and wrote this brief.

**Dropped from this list: your working copy needs nothing.** It was parked off the main line with a leftover file for ten consecutive hours; it is now on `main`, clean, and fully caught up. No commands to run. Details under Freshness.

## Queue

**Starved — one job ready, and it is a low-priority lint tidy.**

- **One ready for pickup:** THR-692, scoping a plan-doc lint so it stops emitting false warnings on design handoffs. Continuous Improvement, low priority, filed today. Not blocked, not stale.
- **Nothing else is ready.** THR-693 — the gap where the build's type check passed unconditionally — shipped tonight and was not replaced.
- **One in development:** the Cowork job ports (THR-677), **unassigned on purpose**. Three of its four goals are met and the fourth is your trial approval, so the executor released the work slot rather than hold it open. Correct call, not a stall.
- **Twenty jobs sit in planning.** None is blocked in a technical sense; none has been through the design pass that makes it handable. That gap is item 1 above.

## Freshness

**Home tree current — the ten-hour item is closed.**

- On `main`, **0 commits behind**, **no local modifications**, nothing untracked, nothing stranded. The automatic sync has resumed. Whether it was your three commands or the self-heal guard catching a now-clean tree, the result is the same and it is verified, not assumed.
- The stale-branch cleanup is healthy — last run 22:40, fourteen minutes ago, tracking 23 work folders and 31 branches, with no stashes and nothing flagged for a human decision.

The known gap behind the ten-hour item still stands and is **agent work, not yours**: the self-heal guard needs a strictly clean tree, so a park landing on an already-dirty tree still needs hands. It cost ten hours of your attention this time. The next design or execution session should file it.

## What's moving

- **The type-check gap shipped** (THR-693) — the build's type step ran a command that passed no matter how broken the code was; it now counts errors against a committed baseline and fails on an increase.
- **The executor ran on schedule at 22:01** and is due again at 23:00.
- **Nothing regressed.**

The older pull-request backlog is unchanged at fourteen, oldest from 12 June. GitHub had not recomputed mergeability for any of them at query time this run, so the conflicting subset could not be re-measured — last known good reading was two (#327 and #553).

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; if the timestamp at the top looks old, check the task's `lastRunAt` in the scheduled-task list to tell "nothing new to report" from "task stopped running."*
