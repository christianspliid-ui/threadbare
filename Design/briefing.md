# Briefing

**Generated:** 2026-07-28 11:00 local (2026-07-28 09:00 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Your own copy of the project has stopped updating itself, and only you can restart it.** One command, in a terminal:

```
cd C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator
git stash push -m home-tree-recovery
git pull --ff-only origin main
```

**Why it needs you and not a crew member:** the routine that keeps that folder current refuses to touch it while any tracked file in it has been edited by hand — deliberately, so it can never overwrite your work. One file in there is in exactly that state, and it is *also* one of the files arriving in the updates, so the routine now aborts every hour without doing anything. The crew members are all forbidden from running repair commands in that folder, for a reason that has bitten hard before: a session that starts moving branches around in there is what stalled this same routine for days in July.

**What it costs if left:** the gap was two updates behind an hour ago and is six now, and it grows every hour. When you next open a session there, you'll be reading yesterday's version of files that have since changed — including this briefing. Nothing is lost or at risk; the command above parks your edits safely (`git stash pop` brings them back) and takes about a second.

## Queue

**22 jobs ready — one top-priority, three middling, eighteen minor. One in flight.** Nothing stale, nothing blocked.

**The first batch of the encounter rewrite is on the shelf and startable** — forty-eight encounters, about nine in every ten a player actually meets, rebuilt into the new nudge shape. This is the work you named first priority, and as of last hour it is finally a job rather than a folder. Nobody has claimed it yet; the next crew member clocks in shortly.

**The top-priority slot refilled within the hour, which is the healthy version of this.** The overnight-outage job was claimed at 10:21 and is being worked now; twenty minutes earlier a different crew member had promoted a replacement top-priority job into the gap — a fix for the project's own friction log, whose two automatic readers between them cannot see two-thirds of what has been written into it this month.

## Freshness

**Home tree: stalled, six updates behind — see above.** This is the same "two harmless leftovers in the tool config" that this file has reported as inert for days, plus a third file that is *not* inert, because the incoming updates touch it too. That combination is what turns a cosmetic leftover into a stopped process, and it is the first time it has actually bitten.

**Cleanup reaper: alive, ran at 10:40, clean, nothing awaiting a human decision.** **The live site is up to date** — everything published since it last built was notes and docs, so the game itself did not need rebuilding. **Discord: nothing new from you**, so no reply was owed and none was sent.

## What's moving

**The crew member that decides what to work on next is properly back.** It missed eleven check-ins overnight; it has now made two in a row on time, at 09:19 and 10:27. One missed slot returning could have been luck — two consecutive on-time slots is the outage being over. In those two slots it did the work the outage had been holding up: it cut the first encounter batch out of the folder, and it freed a six-day-old job whose stated blockers had both been finished for weeks.

**A hazard worth knowing about, because it will make correct work look broken.** Every change has to pass one safety check before it can go in, and that check now takes 16–18 minutes against its own 20-minute limit. It is not that anything is wrong — the test suite has simply grown from 737 files to 909 since the limit was set, and nobody was watching the ratio. When a machine happens to run slow, a perfectly good change goes red and looks like a defect; that is exactly what happened yesterday and cost an extra hour to diagnose. **It is written up with the measurements and four candidate fixes.** No action from you — flagging it so that when you see a red check on something obviously fine, the first suspicion is the clock rather than the work.

**A small bookkeeping collision, noted rather than fixed:** two different crew members wrote up two entirely different problems yesterday and both numbered them 267. Harmless today, folded at the next review — the same disposition as a duplicate pair already waiting there.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
