# Briefing

**Generated:** 2026-07-27 11:54 local (2026-07-27 09:54 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Nothing needs you right now.** No decision is waiting, no switch needs flipping, and nothing arrived for you this hour.

**Last hour I promised to name it if your top-priority work — the new encounter experience — was still unstarted at this brief. It is still unstarted, so I am naming it.** What I will not do is dress it up as a fault, because the reason is now specific and about to expire: the job that was blocking the only work slot **finished and merged 26 minutes ago**, and the crew picks up new work once an hour, on the hour. Its first opportunity is **six minutes after this brief**. Nothing needs you; I am reporting it because I said I would, and a promise kept only when the answer is unflattering is not a promise.

## Queue

**23 jobs ready — two urgent, eight middling, thirteen minor. Nothing in hand.**

**The stuck job cleared.** Last hour's brief described a small correctness fix jammed for an hour and forty minutes behind a safety check that guards the game's manual pages against drifting away from the game. It was updated and merged at 11:28. The workshop slot is now empty for the first time in nearly five hours, and nothing has gone stale — the longest-waiting job has been on the shelf three days, well inside the limit.

**The fix also left behind something better than itself.** In working out why it stayed stuck, the crew found that the manual-drift check *passes on your own machine even when it should fail* — it silently compares against a stale copy of the project, so an author gets a clean bill of health and is then surprised by the real check minutes later. That is exactly what happened here, and it is now written up as its own job. The two hours were not wasted; they bought a detector for the trap that caused them.

**So both halves of the new encounter experience are ready, unblocked, and unclaimed, with an empty slot in front of them.** The design work merged onto the main branch at 09:18 and I have verified it is genuinely there rather than inferring it from a merge notice.

**Restating last hour's test properly, with no escape clause:** at the 12:53 brief, one of the two encounter-experience jobs is in hand, or I name that it is not — whatever the crew turns out to have been doing, and regardless of whether anything else was claimed. Last hour both my tests were worded so they could pass while the thing I cared about kept failing; this one cannot. The slot is free, the design is landed, both jobs are top-priority, and nothing blocks them, so the only way they do not start is a real choice about what to work on.

## Freshness

**Home tree: clean and current.** Right branch, nothing stranded, nothing behind the server. The same two small leftovers as the last twenty-one hours — a permissions edit to the tool config, and Friday's retro write-up. Both are the crew's to land; neither blocks anything.

**Cleanup reaper: alive, ran fourteen minutes ago, clean, nothing awaiting a human decision.**

**The live site is serving the very latest version of the game** — not merely "nothing needed publishing", as the last several hours reported, but the current build actually published and live.

**Discord: nothing new this hour.** Genuinely empty rather than unread.

## What's moving

**One job shipped and one was filed — the ordinary rhythm, resumed.** The shipped job teaches one of the measurement tools to recognise the marks the game puts on people: it previously matched them by exact name only, so four of the five ways a mark can be written were invisible to it, and any readout about who a piece of content excludes was wrong in a direction that would have misled tuning. It affected no live gameplay — no shipped content uses those marks yet — which is precisely why it was worth fixing before the encounter work starts authoring them.

**The still hour is over.** Last hour was the first completely static hour in days; this one closed a job, filed a finding, cleared the blocker, and emptied the bench. That is the lane working, not a lull ending by luck.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
