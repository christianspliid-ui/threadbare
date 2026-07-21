# Briefing

**Generated:** 2026-07-21 16:54 local (14:54 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task — the replacement for the old Cowork "keep-work-flowing" chat brief. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Nothing urgent this hour.** Three things carried, none blocking — but the first is a ten-second command that has now waited five hours.

> **1. One command to unstick your working copy.**

```
git -C "C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator" checkout -- Design/user-actions.md
```

A leftover file is stopping your working copy from updating itself; it is now 22 commits behind. The file is a stale duplicate of something already saved — discarding it loses nothing, and it's verified fresh each hour. Full detail under **Freshness** below.

> **2. One switch left in the Cowork app: turn off `keep-work-flowing`.**

You settled the sequencing this morning — fresh versions get written and shown to you as a trial before each old job is switched off. That leaves exactly one you can flip **today**: the hourly `keep-work-flowing`. Its replacement is live and proven; it wrote this brief.

The other three (daily queue grooming, the Wednesday workflow review, the Sunday tidy-up) stay on until their replacements pass a trial you approve. That work is ticketed and currently in development.

> **3. The next creative stretch — no longer urgent, but still yours.**

Six jobs appeared in the queue this afternoon, so the executor has hours of work and the lane is not idling. But all six are **plumbing** — build-system honesty, ticket-writing rules, a headless way to advance the simulation during testing. None of them moves the game itself forward.

So the question stands, without the pressure it had at lunchtime: **war or economy?**

- **War, deepened.** The war system came alive on the 18th. Designed but unbuilt: battles with real texture (turning points, commanders in peril, last stands), sieges that tighten as they drag instead of resolving flat, and the mark a war leaves on a region once it ends.
- **The economy, made visible.** Goods move, but the player can't see it. Missing: things going wrong on trade routes — banditry, embargoes, tolls surfacing as encounters — and the map showing what's actually travelling a road when you look at it.

A one-word steer is enough. A design session does the rest.

## Queue

**Healthy — six jobs ready to start, one in development.** The empty queue reported at lunchtime is closed; it refilled around 11:15.

- **Six ready for pickup**, all from this morning's pattern assessment, all in Continuous Improvement: a headless tick bridge for browser testing (THR-689), a board-integrity audit (THR-687), a merge driver to stop idle pull requests rotting into conflicts (THR-691), bringing generated files into the build (THR-690), ticket-authoring rules (THR-688), and a lint-scope fix (THR-692).
- **Nothing is blocked.** Checked the dependency links directly — the six cross-reference each other but none waits on another.
- **Nothing is stale.** All six were filed today.
- **One job in development** — porting the three Cowork job prompts (THR-677), claimed and moving.

## Freshness

**Same one command as the last four hours — this is the fifth.** The drift is now **22 commits behind** (was 4 → 14 → 18 → 20).

```
git -C "C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator" checkout -- Design/user-actions.md
```

Nothing is at risk and nothing is stranded — the tree is on `main`, not parked off it, and holds no commits that exist nowhere else. One leftover file is blocking the automatic sync, which refuses to update a tree with local edits. **That file is a stale duplicate, re-verified again this run:** its on-disk copy differs from the published one by 39 lines in, 54 out, i.e. it is strictly the older text. The content it once held was saved to the repository hours ago. Discarding it loses nothing.

An agent cannot run this for you — scheduled sessions are barred from touching your working copy, which is the rule that keeps it stable. **The narrow fix that would end the repetition is agent work and is still unfiled** (teach the auto-repair to discard a local edit it can prove is already published); it has now been flagged across three runs without being picked up.

The automatic stale-branch cleanup is healthy — last run 16:40, fourteen minutes ago, tracking 21 work folders and 28 branches, with **no stashes and nothing flagged for your decision**, holding steady since yesterday's disposal pass.

## What's moving

- **The bug report is filed.** You said yes, and it went up as [issue #79713](https://github.com/anthropics/claude-code/issues/79713) on the Claude Code tracker. That question is closed and won't be asked again.
- **The queue went from empty to six** in about twenty minutes, off a systematic look at what has been going wrong in the pipeline — near-misses like a generated file that ships stale with no test failure, and browser tests that can't actually advance the simulation.
- **The git housekeeping has visibly settled.** The stash pile that read 38 deep this morning is at zero, and no work folders need a human call.

**Unchanged:** fourteen older pull requests are still open, oldest from 12 June. Three now need conflict resolution rather than a refresh, including the one feature branch (#553, the essence-source milestone beat, sitting since 5 July). Auto-merge only helps requests opened after it shipped, so this backlog still drains by hand.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; if the timestamp at the top looks old, check the task's `lastRunAt` in the scheduled-task list to tell "nothing new to report" from "task stopped running."*
