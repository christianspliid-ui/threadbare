# Briefing

**Generated:** 2026-07-21 15:54 local (13:54 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task — the replacement for the old Cowork "keep-work-flowing" chat brief. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Same three as last hour. Nothing new landed on your plate.**

> **1. One click: switch off the old hourly `keep-work-flowing` in the Cowork app.**

You settled the sequencing this morning, and this is the part that's ready now. This task — the one writing what you're reading — is its replacement, and it has run cleanly all day. Until you flip the old one off, both run every hour and write the same brief twice.

The other three Cowork jobs stay switched **on**, exactly as you decided: each gets a fresh replacement written, and you approve a trial run before its old copy retires. **That work is now actively underway** — see "What's moving" below.

> **2. One command: clear a superseded leftover file, so your working copy starts updating again.**

**Fourth hour carrying this. The drift keeps widening: 4 behind → 14 → 18 → now 20.** It will not stop on its own.

Nothing is at risk and the cause is still small. One file on your copy — this task's own standing-asks file — has an outdated edit sitting on it from a run that failed to save properly this morning. **That content is not lost:** a later run carried it forward and banked it. What's on your disk is a stale duplicate of work already saved. I re-checked that this hour rather than assuming it: your copy differs from the saved version by 39 lines, and every one of those differences is *older* text.

The automatic sync deliberately refuses to touch a working copy that has edits on it, in case those edits matter. This one doesn't. Scheduled tasks aren't allowed to clear it either — that rule exists because a task doing so once parked your copy for days.

**Fix — one command, any time:**

```
git -C "C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator" checkout -- Design/user-actions.md
```

> **3. A steer, when you have one: what should the game itself be doing next?**

Not urgent — the work lane is fed and moving. But **every single thing in the queue right now is the game maintaining itself**: build tooling, board hygiene, merge plumbing. Nothing on the list adds a system, a piece of content, or anything you would see in the world.

That is a fair place to be for a day — the tooling genuinely was lying about passing its own checks, and that was worth fixing. But it should be a choice rather than a drift.

Two directions are nearest, and both are half-built rather than speculative:

- **War, deepened.** The war system came alive on the 18th — armies march, battles resolve. What is designed but not built: battles with real texture (a turning point, a commander in peril, a last stand), sieges that tighten as they drag instead of resolving flat, and the mark a region carries for years after a war ends.
- **The economy, made visible.** Goods move along trade routes, but you cannot see any of it. Missing: things going wrong out there — banditry, embargoes, a toll that becomes an incident — and a map that shows you what is actually travelling a road when you look at it.

**Say a direction in chat** — "war", "economy", or something else entirely. A rough steer is enough. **"Keep finishing the plumbing" is also a real answer** — say that and I will stop asking.

## Queue

**Healthy — 6 ready, 1 in development, none blocked, none stale.** Every ready item is unassigned and waiting; the executor is mid-flight on a seventh.

All six sit in Continuous Improvement: a plan-doc lint scope fix (THR-692), a headless tick bridge so automated browsers can advance the simulation (THR-689), a board-integrity audit for issues that closed themselves without a real commit (THR-687), a union merge driver so idle pull requests stop rotting (THR-691), generated artifacts brought into the build (THR-690), and ticket-authoring rules (THR-688).

## Freshness

**Your working copy — needs the one command above.** On `main`, nothing stranded or parked, but **20 commits behind** and blocked by that single leftover file (0 untracked). The gap grew by 2 this hour; it will keep growing until the file is cleared.

**Cleanup job — healthy.** Ran 14 minutes ago, on schedule. Tracking 21 work folders, 27 branches, 0 stashes, 0 needing a decision.

## What's moving

**THR-677 was picked up and is in development now** — the port of your three remaining Cowork jobs to Claude Code. That is the work that has to finish before the other three switches in item 1 become safe to flip, so it is the right thing to be building.

Pull-request backlog holds at 14 open, oldest still 2026-06-12 — re-counted this hour, not carried over. Not blocking anything; THR-691 in the queue targets the mechanism that causes it.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated timestamp above.*
