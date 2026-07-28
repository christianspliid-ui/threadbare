# Briefing

**Generated:** 2026-07-28 11:56 local (2026-07-28 09:56 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## From Christian

**You wrote at 11:05: *"I did not manually change anything anywhere. Feel free to investigate and do the stuff you need to do."*** You were right, and the last brief was wrong to tell you otherwise. Investigated and corrected below.

**Nobody edited anything by hand.** All three leftover files in your project folder were written by the crew, not by you:

- Two are tool-permission files, updated automatically each time a crew member is granted a new permission.
- The third is yesterday's *decides-what-to-work-on-next* report — and **that one is the whole problem.** The crew member that writes it is supposed to work in its own scratch copy of the project and deliver through the normal review route. At 10:29 this morning it did deliver properly *and* accidentally wrote a second copy straight into your folder. That stray copy is the file the update routine keeps colliding with.

**The one command still needs you, but it is now a smaller and safer command** — see below. **The underlying crew bug is not yours** and is written up for the next crew member; it is a known trap that already has a note against it (a scratch-copy command quietly resolving file paths against your folder instead of its own).

## Needs Christian

**One command, in a terminal, about a second.** It restarts your folder's self-updating:

```
cd C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator
git stash push -m home-tree-recovery -- Docs/ops/orchestrator-2026-07-28.md
git pull --ff-only origin main
```

**What changed since last hour's version of this ask.** The old one parked *all three* leftover files. This one touches only the single file that actually blocks anything — your tool-permission tweaks stay exactly where they are. I checked which files the incoming updates and your folder both write, and it is exactly one.

**Nothing can be lost.** That stray report's contents were *already* delivered properly through the review route this morning and are safely in the shared copy — I compared them line by line. The command parks the duplicate rather than deleting it, so `git stash pop` brings it back regardless.

**Why it still can't be a crew member.** Every crew member is barred from running repair commands in your folder — a rule earned the hard way in July, when a session that started moving things around in there stalled this same routine for days. The routine that would normally self-heal is the one that's blocked. So it's you or nothing, and it's ten updates behind now.

## Queue

**23 jobs ready — two top-priority, three middling, eighteen minor. One in flight.** Nothing stale, nothing blocked.

**The first batch of the encounter rewrite is still on the shelf, and that is currently correct rather than concerning.** Forty-eight encounters, about nine in every ten a player actually meets. The single work slot is occupied by the overnight-outage investigation, which outranks it, so the encounter batch is waiting its turn for the reason the queue is meant to make things wait.

**One thing for the crew, not for you:** the retro job promoted at 11:29 went onto the shelf with someone's name already on it, and the crew member that picks up work only looks at *unassigned* jobs. It will be stepped over silently until that's cleared. Noted for the next crew session.

## Freshness

**Your folder: still stalled, now ten updates behind — see above.** Everything else is healthy: **the cleanup routine ran at 11:40, clean, nothing awaiting a decision.** **The live site is current** — everything published since it last built was notes and reports, so the game itself didn't need rebuilding.

**All ten scheduled crew jobs checked in on time**, including the two that were missing overnight. (The automatic version of this check is still being built — it's the job currently in flight — so I ran it by hand and am saying so rather than reporting silence as good news.)

## What's moving

**The crew member that decides what to work on next is fully back** — three on-time check-ins in a row now (09:19, 10:27, 11:27). In those slots it cut the encounter work into a startable first batch and freed two older jobs whose blockers had long since finished.

**The overnight-outage investigation is being worked right now.** It's building the missing alarm — the thing that should have noticed that crew member going quiet for eleven hours, instead of a human spotting it the next morning.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
