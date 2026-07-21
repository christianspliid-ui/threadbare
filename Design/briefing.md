# Briefing

**Generated:** 2026-07-21 12:54 local (10:54 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task — the replacement for the old Cowork "keep-work-flowing" chat brief. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**A quiet hour. Nothing new has gone wrong; one small thing needs your hand, and the open question is unchanged.**

> **1. Flip one switch in the Cowork app: disable `keep-work-flowing`.**

Carried, unchanged. This is the only Cowork job safe to turn off right now — its replacement is the task writing this file. The other three stay on until each one's replacement passes a trial you approve, exactly as you decided this morning.

Nothing breaks if you leave it. You just get two copies of this brief until you do.

> **2. New: a leftover file is stopping your working copy from updating itself.**

Small and harmless, but it won't clear on its own. Your working copy has a modified `Design/user-actions.md` sitting in it — left behind by a run two hours ago that couldn't finish saving. **The content is not at risk**: last hour's run committed it properly, so what's on your disk is now an outdated duplicate of what's already saved.

The automatic catch-up only runs on a perfectly clean copy, so it has stopped. Your copy is four commits behind as a result — harmless today, but it will drift further each hour until the file is cleared:

```
git -C "C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator" checkout -- Design/user-actions.md
```

Scheduled runs are deliberately barred from touching your working copy this way — that rule is what stopped the recurring damage last week — so this one genuinely needs your session.

> **3. Still open: what should the next stretch be for the game itself?**

Unchanged from last hour, and still not urgent. The lane is fed, but **everything in it is the machine repairing itself** — build tooling, board hygiene, workflow rules. Nothing queued adds a system, a piece of content, or anything you'd see in the game.

The two nearest directions remain **war, deepened** (battles with turning points and last stands, sieges that tighten as they drag, the mark a war leaves on a region) and **the economy, made visible** (banditry, embargoes and tolls surfacing as encounters; the map showing what's actually travelling a road).

"Spend today finishing the plumbing" is a perfectly good answer too — say that and this stops being asked.

## Queue

**Healthy — eight ready, nothing in development, nothing blocked or stale.**

- **One shipped in the last hour:** the honest-gates job (THR-686), which was the single high-priority item and the top of the queue. It retired a pre-commit check that always passed regardless of what it was given — the kind of false green that teaches agents to skip gates.
- **Eight remain ready**, all medium priority, all self-maintenance: the headless tick bridge, the board-integrity audit, the union merge driver, generated files folded into the build, ticket-authoring rules, the Cowork port, the git surface cleanup, and a one-line cross-link to finish the upstream report.
- **Nothing in development right now** — expected between hourly pickups, not a stall.

## Freshness

**One leftover file, covered in item 2 above. Otherwise fine.**

Your copy is on the main line and four commits behind — normal drift, except that the automatic catch-up can't run while that file sits there. Nothing is parked off to the side and nothing is stranded, so there's no risk of losing anything; it just stops getting newer.

The stale-branch cleanup is healthy — last run 12:40, fourteen minutes ago, tracking 28 work folders, 33 branches and 38 stashes. Six folders are flagged as needing a human decision; that's a known job already written up, not an alarm.

## What's moving

**A steady hour after a busy morning.**

- **The honest-gates fix shipped** about half an hour ago — filed at 09:12 this morning, done by 12:28. That's the fastest turnaround on the board today.
- **The two-tree editing guard shipped** just before it, closing a trap that had silently misfired in four of the last twelve runs.
- Everything you unblocked in chat this morning has now landed or is queued: the upstream report is filed publicly, and the Cowork port carries your staged-trial decision as its scope.

**Unchanged:** fourteen older pull requests are still open, oldest from 12 June. Nine are documentation batches from the job demolished yesterday — orphans of a process that no longer exists, needing one cleanup decision that isn't yours. One is a real feature branch from 5 July that needs a call on whether it's still wanted.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; if the timestamp at the top looks old, check the task's `lastRunAt` in the scheduled-task list to tell "nothing new to report" from "task stopped running."*
