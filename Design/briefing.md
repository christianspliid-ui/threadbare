# Briefing

**Generated:** 2026-07-21 21:54 local (19:54 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task — the replacement for the old Cowork "keep-work-flowing" chat brief. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Nothing is broken. Two things want you — down from three; one of the three turns out never to have been yours.**

> **1. Your working copy needs three commands. Still loss-free.**

```
git -C "C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator" stash push -m home-tree-recovery
git -C "C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator" switch main
git -C "C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator" pull --ff-only origin main
```

Unchanged since last hour: the copy is sitting **beside** the main line rather than on it, and carries one leftover file. This is the known app-level fault, already reported upstream — not anything you or an agent did.

**Nothing is at risk.** Verified again this run: **no work exists only on that copy.** The leftover file is this morning's version of the standing-asks list; the published version has been rewritten about eleven times since, including by this run. The stash keeps it anyway, so nothing is discarded even by accident.

> **2. Three replacement jobs are built, switched off, waiting on you to watch each run once.**

Re-checked against the live scheduler this run — all three present, all three still **off**, unchanged since 17:54.

| Job | When it would run | State |
|---|---|---|
| Daily queue grooming | 09:16 daily | built, **off** |
| Wednesday workflow review | 11:13 Wednesdays | built, **off** |
| Sunday tidy-up | 10:10 Sundays | built, **off** |

What they need: **run each once in a normal chat session, read what it produces, say yes.** Then it goes live and its Cowork twin gets switched off in the same step. Start with the daily queue grooming — it's the load-bearing one.

Separately and still yours: **switch off `keep-work-flowing` in the Cowork app.** No trial needed — its replacement is live and wrote this brief.

> **3. The next creative stretch — second day of the same pattern.**

The merge-rot fix shipped at 21:11. **Two jobs are queued and both are still plumbing** — a lint-scope tidy and a gap where the build's type check does nothing at all.

Nothing queued changes what the game does. The queue is not starving; it is **feeding itself on its own maintenance** — each shipped repair reveals the next. That loop stops when something game-facing is put in front of it.

The question is unchanged: **war or economy?**

- **War, deepened.** The war system came alive on the 18th. Designed but unbuilt: battles with real texture (turning points, commanders in peril, last stands), sieges that tighten as they drag instead of resolving flat, and the mark a war leaves on a region once it ends.
- **The economy, made visible.** Goods move, but the player can't see it. Missing: things going wrong on trade routes — banditry, embargoes, tolls surfacing as encounters — and the map showing what's actually travelling a road when you look at it.

A one-word steer is enough. A design session does the rest.

**Dropped from this list:** the "file the autosync self-heal ticket" ask that ran here for seven hours. That was misrouted — filing a ticket is agent work, not a decision only you can make. It is recorded under Freshness below as agent-side and should not have been costing you attention.

## Queue

**Healthy but thin — two ready to start, down from three.**

- **Two ready for pickup**, both Continuous Improvement: a plan-doc lint scope fix (THR-692) and the newly-filed gap where the build's type check does nothing (THR-693).
- **Nothing blocked, nothing stale.** Both filed today; neither waits on the other.
- **One in development** — the Cowork job ports (THR-677), **unassigned on purpose**. Three of its four goals are met and the fourth is your trial approval, so the executor released the work slot rather than hold it open. Correct call, not a stall.
- **Twenty jobs sit in planning.** Not blocked in any technical sense — none has been through the design pass that makes it handable. That is the shortage item 3 describes.

## Freshness

**One thing to fix, and the commands are in item 1 above.**

- **The copy is parked off the main line and carries one leftover file** — tenth consecutive hour. The leftover file is what blocks the automatic sync, which refuses to update a copy carrying local edits. Nothing unique is stranded: zero commits exist only there, so re-attaching is safe by construction. The main line is 5 commits ahead of your copy's, well inside normal range.

An agent cannot run these for you — scheduled sessions are barred from touching your working copy, and that rule is what keeps it stable.

**The permanent fix is agent work and is still unfiled.** Teaching the automatic repair to discard a local edit it can prove is already published would end this item for good. It has been flagged to you seven times; that was a routing error on this task's part, not your inattention. **No action needed from you** — the next design or execution session should file it.

The automatic stale-branch cleanup is healthy — last run 21:40, fourteen minutes ago, tracking 24 work folders and 31 branches, with no stashes and nothing flagged for your decision.

## What's moving

- **The merge-rot fix shipped at 21:11** (THR-691) — idle pull requests should stop rotting into conflicts as new work lands around them.
- **The executor ran on schedule at 21:01** and is due again at 22:00.
- **Nothing regressed.**

The older pull-request backlog is unchanged at fourteen, oldest from 12 June, with two genuinely conflicting (#327 and #553). Whether THR-691 visibly drains it should be readable by tomorrow; the two conflicting ones need hands either way.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; if the timestamp at the top looks old, check the task's `lastRunAt` in the scheduled-task list to tell "nothing new to report" from "task stopped running."*
