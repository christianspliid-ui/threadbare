# Briefing

**Generated:** 2026-07-29 19:53 local (2026-07-29 17:53 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**One thing, and it is a switch only you can reach — but it is not urgent and nothing is broken.**

For the last several hours this brief has reported that your name keeps getting stamped on ready-to-do jobs, which hides them from the robot that picks work up. We have been blaming the filing robot. **This hour we caught it in the act, and the filing robot is innocent.**

Here is what happened, and it is clean enough to be worth the paragraph. At 19:28 the filing robot promoted a job and *deliberately* left the name field empty — then immediately checked its work and confirmed it was empty. Two minutes later, at 19:31, your name was on it anyway. Nothing ran in between except the robot attaching its pull request to the job.

So I checked five jobs. **Every job with a pull request attached has your name on it. Every job without one does not** — including a job a robot edited earlier this same hour, which stayed clean because no pull request was ever linked to it. Both directions agree, five out of five.

That points at a Linear setting rather than our code: **Linear is auto-assigning the pull request's author — you — whenever a pull request gets linked to a job.** Since every one of our robots pushes under your GitHub account, everything they touch gets your name.

**What I'd ask:** in Linear's settings, under the GitHub integration, look for an option along the lines of *"assign issues to the pull request author"* and turn it off. It is the same class of switch you already flipped for the auto-close behaviour a few weeks back. I can't see workspace settings myself, so I can't confirm the toggle exists or read its current state — that part is a well-supported guess, not a measurement.

**Why it's worth doing but not tonight:** work is still getting done — the queue is deep, the picker is working through the thirty-eight jobs it *can* see, and jobs with your name on them can still be finished by hand. The cost is that the one job we most want done next is invisible to the picker, and every hour adds one more to the pile.

**One thing I've routed onward, not to you:** the ticket describing this problem blames our filing robot's code, which we now have good reason to think is the wrong culprit. A crew session needs to correct that before someone builds a fix that cannot work — the filing robot already tried exactly that fix this hour and it failed. That is a note for them, not a decision for you.

## Queue

**Forty-six jobs ready, none in progress, nothing gone cold.** One important, twelve medium, thirty-three small. The longest-waiting job has sat five days and ten hours — still inside the week we allow before calling something stale.

**The sharpest way to see this hour's problem:** the filing robot did its job and promoted a new one onto the shelf, so the shelf grew from forty-five to forty-six. **The picker's visible list did not move — it was thirty-eight before and thirty-eight after.** The new arrival was stamped within three minutes. An hour of promotion work bought the picker nothing.

Eight of the forty-six now carry your name, up from seven. **The one important job left on the shelf is among the stamped eight** — and it is the job that fixes the stamping.

## Freshness

**Home tree healthy** — on the main line, nothing stranded, fully up to date. The only local edits are your own tool-permission settings, which we long ago established block nothing, plus Friday's retro draft sitting untracked.

**The live site is current**; everything published since the last real build has been notes and paperwork, so no rebuild was needed. **The merge safety net is healthy** with zero failed starts — a sixth independent confirmation that your billing fix is holding.

**The tidy-up robot ran thirteen minutes ago**, on schedule, with nothing awaiting a human call. **All eight scheduled robots are on time.**

## What's moving

**The stale-backlog triage sweep closed at 19:18** — that was the long-running job to go through thirty-four dormant ideas and decide, one by one, whether each was still wanted. Thirty-two were settled. That is real backlog debt cleared rather than deferred.

No new jobs were filed this hour beyond the one promotion. As with recent hours, the flow is still plumbing rather than game content — worth watching as a pattern, not a problem yet.

---
*Standing asks live in `Design/user-actions.md`. This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
