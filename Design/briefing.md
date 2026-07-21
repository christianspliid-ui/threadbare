# Briefing

**Generated:** 2026-07-21 17:54 local (15:54 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task — the replacement for the old Cowork "keep-work-flowing" chat brief. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Nothing is broken. Two things want ten minutes of an ordinary session, and one is still the same ten-second command.**

> **1. One command to unstick your working copy — sixth hour, now 31 behind.**

```
git -C "C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator" checkout -- Design/user-actions.md
```

Unchanged since lunchtime except the number, which keeps climbing (4 → 14 → 18 → 20 → 22 → **31**). One leftover file blocks the automatic sync. It is a stale duplicate — verified again this run — and discarding it loses nothing. Detail under **Freshness**.

> **2. The three replacement jobs are built and switched off, waiting on you to watch them run once.**

This changed since the last brief, and it is the useful thing to do next. All three Cowork replacements — the daily queue grooming, the Wednesday workflow review, the Sunday tidy-up — are **written, registered, and deliberately left disabled**, exactly per the staged cutover you settled this morning.

What they need is the trial you asked for: **run each once in a normal chat session, read what it produces, say yes.** Then it goes live and its Cowork twin gets switched off. Start with the daily queue grooming — it's the load-bearing one, and its trial is meant to show you the queue changes it would make before it's trusted to make them unattended.

Worth knowing: rewriting them rather than copying them turned out to be the right call. The old daily grooming job had been querying a work state that was retired back in June — every day, finding nothing, silently. And the Sunday tidy-up spent its time auditing machinery that was demolished yesterday morning. A faithful copy would have carried both forward.

Separately and still yours: **switch off `keep-work-flowing` in the Cowork app.** That one needs no trial — its replacement is live and wrote this brief.

> **3. The next creative stretch — still open, still not urgent.**

Five jobs are queued and the executor has hours of work, so nothing idles. But all five are plumbing: build-system honesty, ticket-writing rules, a headless way to advance the simulation during testing. **None of them moves the game itself forward.**

The question is unchanged: **war or economy?**

- **War, deepened.** The war system came alive on the 18th. Designed but unbuilt: battles with real texture (turning points, commanders in peril, last stands), sieges that tighten as they drag instead of resolving flat, and the mark a war leaves on a region once it ends.
- **The economy, made visible.** Goods move, but the player can't see it. Missing: things going wrong on trade routes — banditry, embargoes, tolls surfacing as encounters — and the map showing what's actually travelling a road when you look at it.

A one-word steer is enough. A design session does the rest.

## Queue

**Healthy — five ready to start, one in development.**

- **Five ready for pickup**, all filed this morning, all in Continuous Improvement: a headless tick bridge for browser testing (THR-689), a merge driver to stop idle pull requests rotting into conflicts (THR-691), bringing generated files into the build (THR-690), ticket-authoring rules (THR-688), and a lint-scope fix (THR-692).
- **Nothing is blocked and nothing is stale.** The five cross-reference each other but none waits on another; all were filed today.
- **One in development** — the Cowork job ports (THR-677). It is **unassigned on purpose**, not stalled: three of its four goals are met and its pull request is queued to merge itself, so the executor released it rather than holding the single work slot open across your trial approvals. That slot is free for the hour.

## Freshness

**Same command as the last five hours. The drift is now 31 commits behind, up from 22.**

Nothing is at risk and nothing is stranded — the tree sits on `main`, not parked off it, and holds no commits that exist nowhere else. One leftover file blocks the automatic sync, which refuses to update a tree carrying local edits. **That file is strictly the older text:** its on-disk copy predates the published one by several hours, and the content it once held reached the repository long ago. This run republishes a newer version of the same file, so discarding the local copy is loss-free by construction.

An agent cannot run the command for you — scheduled sessions are barred from touching your working copy, and that rule is what keeps it stable.

**The narrow fix that would end this repetition is agent work, and it is still unfiled after four runs** — teaching the automatic repair to discard a local edit it can prove is already published. Worth a ticket from the next design session; it is the difference between this item never appearing again and it appearing every hour.

The automatic stale-branch cleanup is healthy — last run 17:40, fourteen minutes ago, tracking 23 work folders and 28 branches, with no stashes and nothing flagged for your decision.

## What's moving

- **The board-integrity audit shipped at 15:41** (THR-687) — a sweep for jobs marked finished that never actually had work land behind them, closing the failure mode where an unrelated pull request's title silently closed the wrong ticket.
- **The three Cowork replacements were written and registered** this afternoon, with their prompts mirrored into the repository so they can never again exist only inside an app nobody can read. That was the whole reason the originals were lost.
- **Nothing regressed.** The queue drew down by one and refilled nothing, which is the normal shape of an afternoon.

**Unchanged:** fourteen older pull requests are still open, oldest from 12 June, two needing conflict resolution rather than a refresh — including the one feature branch (#553, the essence-source milestone beat, sitting since 5 July). Auto-merge only helps requests opened after it shipped, so this backlog still drains by hand.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; if the timestamp at the top looks old, check the task's `lastRunAt` in the scheduled-task list to tell "nothing new to report" from "task stopped running."*
