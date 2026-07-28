# Briefing

**Generated:** 2026-07-28 08:57 local (2026-07-28 06:57 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Nothing needs you right now.** Nothing is waiting on a decision only you can make. The one open switch — turning off the crew member that decides what to work on next — is still yours to flip on one word, and doesn't need a reply.

Two things went wrong this hour. Both are described below, both are mechanical, and both have someone to fix them. Neither is a call for you to make.

## Queue

**20 jobs ready — none top-priority, two middling, eighteen minor. One in flight. Nothing stale, nothing blocked.**

**The job that had never once worked got fixed this hour.** There is a small automatic tidy-up routine that is supposed to run every day and release jobs a crew member claimed and then abandoned. It has failed **every single time it has run since the 13th of June** — eighty-eight attempts, zero successes — because of two typos in how it loads its own code. It was claimed at 08:11 and fixed by 08:13.

**The fix is better than the bug deserved.** This was the *third* time this exact typo has broken something, and each previous time the lesson was written into a notes file that nothing reads. So rather than fix the two lines and write a fourth note, the crew member added an automatic check that now runs on every change and refuses anything carrying the same mistake. **For a fault whose whole nature is "nobody was looking", another note would have been the joke told twice.**

**But the finished work is stuck at the gate, and won't get in on its own.** Every change has to pass a safety check before it can go in. That check started, ran for twenty minutes, and was cut off partway through — not failed, *cut off*. So the work now sits in front of a gate that is neither open nor shut, set to go in automatically the moment the check passes, which it never will. **It needs someone to press start on the check again.** The next crew run is at 09:00, three minutes from now, and is the one positioned to do it — it picks up whatever it left in flight. If it is still stuck at the next brief, that stops being bad luck and becomes a fault to fix.

**Meanwhile the big encounter rewrite is still a folder, not a job** — unchanged from last hour. It is the work you named first priority: take the hundred-odd existing encounters and rebuild them into the new nudge shape. Nobody can start it because it was never broken into startable pieces, and the crew member whose job that is **has now missed ten check-ins in a row**. The two problems remain the same problem.

**Still no top-priority job on the board** — twelfth hour running.

## Freshness

**Home tree: fully current.** Right branch, nothing stranded, nothing behind. The same two harmless leftovers (permission entries a past session added to the tool config) and Friday's retro draft still sit outside version control, with an owner.

**Cleanup reaper: alive, ran at 08:40, clean, nothing awaiting a human decision.** **The live site is up to date** — everything published since it last built was notes and docs, so nothing needed rebuilding. **Discord: nothing new from you**, so no reply was owed and none was sent.

**The crew member that decides what to work on next has now missed ten check-ins.** Its last recorded run is still 22:27 two nights ago. The scheduler is still handing it a slot every hour, on time — so what fails is the run itself, before it records anything. Every other hourly routine clocked in normally, including the one writing this. **The deadline this file set itself is not moved, for the tenth time and on the same ground.** It falls at this morning's 10:53 run, two briefs from now. If the lane still hasn't fired by then, that is a scheduling fault to repair, not a judgement to revisit.

## What's moving

**A routine that had never worked now works — and cannot silently break the same way again.** The tidy-up job above is the repair; the guard shipped alongside it is the point. It walks every script the project runs directly and refuses any that loads its own code the broken way, so the fault that hid for six weeks here, and four weeks earlier in a different job, cannot hide a third time.

**Writing the guard immediately corrected its own rule.** The obvious version — *flag every import missing its file extension* — would have condemned a file that works perfectly well today, because those particular imports are type-only and get stripped out before anything runs. The rule was narrowed to the real condition on its first outing, against a live counter-example rather than in theory.

**One loose end was filed underneath it:** nothing anywhere watches whether these scheduled routines succeed or fail. That is exactly why eighty-eight failures stayed invisible — the only person a failure notifies is whoever started the run, and a scheduled run has nobody to notify. It is now written up as its own job.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
