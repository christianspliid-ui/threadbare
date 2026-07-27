# Briefing

**Generated:** 2026-07-27 10:53 local (2026-07-27 08:53 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Nothing needs you right now.** No decision is waiting, no switch needs flipping, and nothing arrived for you this hour.

One thing you should simply *know*, with no action attached: **the new encounter experience — the work you named first priority — has been ready to start for two and a half hours and has not started.** That is not a mistake anyone made, and it is not yours to unblock; the reason is spelled out under *Queue* below. I am telling you because you named it first priority, and "ready but not started" is the kind of thing that should never be discovered late.

## Queue

**22 jobs ready — two urgent, seven middling, thirteen minor. One job in hand.**

Exactly the same 22 as an hour ago, in exactly the same mix. Nothing shipped, nothing new was filed, nothing new was picked up. **This is the first completely still hour in days.** Nothing has gone stale — the longest-waiting job has been on the shelf three days, well inside the limit.

**The one job in hand is stuck, and it is holding up your top-priority work as a side effect.** The crew deliberately works one job at a time, so that single slot is the whole workshop. It is occupied by a small correctness fix that has been unable to finish for an hour and forty minutes.

What is stopping it is not the fix itself — the fix is done. It is a safety check that refuses to let the change merge: the change edits a game system that has a manual page, and the manual page was not updated to match. That check exists precisely so the game's documentation cannot quietly drift away from the game, and it is doing its job. The remedy is routine and takes minutes — update the page, or record why this change does not affect it.

**A crew member was on it forty minutes ago.** They pulled in the latest main branch at 10:02 and let the check re-run; it failed again at 10:16 on the identical complaint, because pulling in main does nothing about an un-updated manual page. It has been quiet since.

**So the two halves of the new encounter experience are unblocked, unclaimed, and waiting for that slot.** Last hour I promised that if the next pickup grabbed some other minor job while both of these sat free, I would call it a routing problem. **It is not a routing problem, and I should say so as plainly as I would have said the opposite.** The pickup at 10:01 did not choose a small job over yours — it found the slot already occupied and correctly carried on with what was in it. Your work starts when that fix lands.

**Both tests I set last hour came back badly worded, and that is worth one paragraph.** I promised to call a routing fault if the crew "claimed a minor job instead" — but no claim happened at all, so the question I actually cared about (*is the top-priority work starting?*) never got asked. And I promised to call a stall if the stuck job was "still red with no new commit" — there *was* a new commit, so by the letter it passes, yet that commit did nothing about the failure. **In both cases I measured activity when I meant to measure progress**: two easy things to see, standing in for the harder thing that mattered. Restated properly for next hour — **if the top-priority work is still unstarted at the 11:53 brief, I will name that, whatever the crew was busy with.**

## Freshness

**Home tree: clean and current.** Right branch, nothing stranded, nothing behind the server. The same two small leftovers as the last twenty hours — a permissions edit to the tool config, and Friday's retro write-up. Both are the crew's to land; neither blocks anything.

**Cleanup reaper: alive, ran fourteen minutes ago, clean, nothing awaiting a human decision.**

**The live site is current.** Everything that has landed since the last publish was notes and documents, so there was nothing for it to rebuild — the healthy version of "no deployment happened", not a stoppage.

**Discord: nothing new this hour.** Genuinely empty rather than unread.

## What's moving

**Almost nothing, and this is the honest version of that.** The only things that reached the main branch this hour were housekeeping: this brief, and the daily backlog-grooming report. No game code shipped.

**The one live job** is the small correctness fix described above — it teaches one of the measurement tools to recognise the marks the game puts on people. The tool currently reads them by exact name only, so four of the five ways a mark can be written are invisible to it. The work is finished; only the manual-page check stands between it and merging.

**Nothing has gone wrong.** A still hour after a fast morning — two guild fixes and a full design handoff before 08:30 — is a lull, not a stall. It becomes a stall if the same job is still stuck at the next brief, and I will say so in those words if it is.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
