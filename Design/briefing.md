# Briefing

**Generated:** 2026-07-21 20:54 local (18:54 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task — the replacement for the old Cowork "keep-work-flowing" chat brief. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Nothing is broken. Same three as the last three hours — but item 1 has changed shape and now needs three commands instead of one.**

> **1. Your working copy drifted further out of place. Three commands, still loss-free.**

```
git -C "C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator" checkout -- Design/user-actions.md
git -C "C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator" switch main
git -C "C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator" pull --ff-only origin main
```

Last hour this was one command. Since then the copy has also come **unmoored from the main line** — it is now sitting beside it rather than on it. This is the known app-level fault, not anything you or an agent did, and it is the exact pattern already reported upstream.

**Nothing is at risk.** The copy holds **no work that exists nowhere else** — verified this run, as it has been every run. The one leftover file is strictly older text: the version on disk is this morning's, and the published version has been rewritten roughly ten times since, including by this run. Discarding it loses nothing that isn't already saved.

Ignore the drift number if you saw it last hour — it read 41, it now reads 5, and neither move means anything changed for the better. The measuring point shifted under the tree; that shift is the fault itself, not a recovery from it.

> **2. Three replacement jobs are built and switched off, waiting on you to watch each run once.**

Re-checked against the live scheduler this run: all three present, all three still **off**. Unchanged since 17:54 and nothing will change until you run the trials.

| Job | When it would run | State |
|---|---|---|
| Daily queue grooming | 09:16 daily | built, **off** |
| Wednesday workflow review | 11:13 Wednesdays | built, **off** |
| Sunday tidy-up | 10:10 Sundays | built, **off** |

What they need: **run each once in a normal chat session, read what it produces, say yes.** Then it goes live and its Cowork twin gets switched off in the same step. Start with the daily queue grooming — it's the load-bearing one.

Separately and still yours: **switch off `keep-work-flowing` in the Cowork app.** That one needs no trial — its replacement is live and wrote this brief.

> **3. The next creative stretch — the pattern is now unmistakable.**

The build-system job shipped at 20:32. A new one was filed nineteen minutes earlier to replace it. **Three jobs are queued and all three are still plumbing** — a merge fix for stale pull requests, a lint-scope tidy, and a gap in the build's safety checks.

This is the second day running with nothing queued that changes what the game does. The queue is not starving; it is **feeding itself on its own maintenance**. Each shipped repair reveals the next repair. That loop will not stop on its own — it stops when something game-facing is put in front of it.

The question is unchanged: **war or economy?**

- **War, deepened.** The war system came alive on the 18th. Designed but unbuilt: battles with real texture (turning points, commanders in peril, last stands), sieges that tighten as they drag instead of resolving flat, and the mark a war leaves on a region once it ends.
- **The economy, made visible.** Goods move, but the player can't see it. Missing: things going wrong on trade routes — banditry, embargoes, tolls surfacing as encounters — and the map showing what's actually travelling a road when you look at it.

A one-word steer is enough. A design session does the rest.

## Queue

**Healthy — three ready to start, holding steady at three.**

- **Three ready for pickup**, all Continuous Improvement: a union merge driver so idle pull requests stop rotting into conflicts (THR-691), a plan-doc lint scope fix (THR-692), and a newly-filed gap where the build's type check does nothing at all (THR-693).
- **Nothing blocked, nothing stale.** All three filed today; none waits on another.
- **One in development** — the Cowork job ports (THR-677), **unassigned on purpose**. Its code landed at 17:28; three of its four goals are met and the fourth is your trial approval, so the executor released the work slot rather than hold it open. Correct call, not a stall.
- **The queue replaced itself this hour**: one shipped out, one filed in. That is the loop described in item 3.

## Freshness

**Two things to fix now instead of one, and the commands are in item 1 above.**

- **The leftover file is still there** — ninth consecutive hour. It blocks the automatic sync, which refuses to update a copy carrying local edits. Verified loss-free again this run.
- **New this hour: the copy is also parked off the main line.** Nothing unique is stranded on it — zero commits exist only there — so re-attaching is safe by construction. The main line itself is 5 commits ahead of your copy's, well inside normal range.

An agent cannot run these for you — scheduled sessions are barred from touching your working copy, and that rule is what keeps it stable.

**The permanent fix is agent work and is still unfiled after seven runs.** Teaching the automatic repair to discard a local edit it can prove is already published would end this item for good. Flagging it here has visibly not worked; it needs one sentence in a chat session — *"file the autosync self-heal ticket"* — and a design session picks it up from there.

The automatic stale-branch cleanup is healthy — last run 20:40, fourteen minutes ago, tracking 24 work folders and 31 branches, with no stashes and nothing flagged for your decision.

## What's moving

- **The build-safety gate shipped at 20:32** (THR-690). Generated files are now rebuilt and checked as part of the build, so a commit can no longer carry a stale one silently.
- **A follow-on gap was filed at 20:19** (THR-693): the build's type-checking step has been running a command that always passes regardless of the code. Found while doing the above.
- **The executor ran on schedule at 20:01** and is due again at 21:00.
- **Nothing regressed.**

The older pull-request backlog is unchanged at fourteen, oldest from 12 June, with two genuinely conflicting (#327 and #553). THR-691 in the queue is the fix for the rot; the two conflicting ones need hands either way.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; if the timestamp at the top looks old, check the task's `lastRunAt` in the scheduled-task list to tell "nothing new to report" from "task stopped running."*
