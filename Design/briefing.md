# Briefing

**Generated:** 2026-07-26 10:54 local (2026-07-26 08:54 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Nothing needs you right now — fifteenth hour running with a genuinely empty list.**

Last hour's one FYI — the hosting bill — is unchanged and still not a request. No new information arrived about it, so it is not being restated at length. The recommendation stands: do nothing until an invoice actually reads wrong.

Nothing else on the board this hour is yours. The busiest hour in days produced eight new pieces of work and every one of them is a technical call the crew owns.

## Queue

**Backed up — 20 items ready, one in flight.** That is a jump from 13, and the jump is the story of the hour.

**Nothing was dropped and nothing regressed — two automated reviews simply ran at once.** The weekly tidy-up sweep filed six findings in three minutes, and a design session finished drawing up the traits rework and handed off two pieces. Eight arrivals, one departure into active work. A queue that grows because two review passes did their job is a different animal from a queue that grows because nobody is shipping.

**Three of them are high-priority and one is genuinely uncomfortable.** The hourly cleanup robot that tidies abandoned workspaces can, in a specific timing window, delete a workspace a session is *still using* — and the session then silently starts writing to the main copy of the project instead. Nothing has been damaged; this was found by reading the logs, not by cleaning up after it. It is the same family as the git problem that cost several days last week, and it is filed as high priority for exactly that reason. Agents' problem, not yours.

**The other two highs are the traits rework you blessed** — the buildable foundation, plus a defect it uncovered along the way: agents earn reputations, and the *title* that reputation is supposed to give them has never once appeared in the writing. It has been silently dropping on the floor since it was built, because two parts of the code disagree about what the field is called.

**One thing at the top of the queue is gated, and it is being watched rather than escalated.** The traits foundation says plainly: don't start until its design document is on the main branch. That document's pull request is finished and approved but has drifted one merge behind, which parks it in the known stall we have now seen three times. Every previous instance cleared itself within the hour once the owning session refreshed it. If it is still parked next hour, this file will say so and it becomes a real blocker rather than a footnote.

Nothing is stale — the oldest thing waiting has been waiting two days.

## Freshness

**Home tree: level with the server, nothing stranded.** The same two familiar leftovers persist and neither blocks anything — one tracked settings edit and Friday's weekly-retro write-up, still untracked and still the only copy anywhere. Both are agent work to land, not yours.

**Cleanup reaper: alive** — ran fourteen minutes ago, nothing awaiting a human decision. Which is worth stating alongside the high-priority finding above: the robot is running correctly *and* has a latent hazard in it. Both are true.

**Live-site publishing: checked, and the answer is "nothing to publish."** The last few merges were documentation only, so the build was deliberately skipped rather than run and failed. The last code-bearing publish was green. This is the ad-hoc version of the permanent check that got filed yesterday — still ad hoc, still green.

**The dead twice-daily job is unchanged: still 87 runs, still 87 failures, still unfiled.** It has not fired since just after midnight, so a flat count is expected rather than reassuring. One-line import bug, no live consequence, **the agents' call, not yours.**

## What's moving

**The traits rework got drawn up and handed off.** This is the one you blessed this morning — the idea that a trait should be a universal hook that anything in the world can carry and anything in the world can react to, rather than a label only a few systems bother reading. The foundation is designed and waiting for hands, and the design pass found the reputation-titles defect described above while checking whether the existing code actually did what it claimed.

**The encounter rebuild's engine foundation is being built right now** — picked up two hours ago, code is written, and its pull request is sitting in the test queue as this brief is generated. It is the first piece of the Nudge Model to move past paper.

**The weekly tidy-up sweep did what it exists to do.** Six findings, all small, all written down instead of shrugged at: two missing entries in the list of scheduled jobs, a dozen stray files at the top level of the project that have been sitting there since March while the sweep kept reporting "all clear", a wrong claim in one of the automation prompts, a browser-screenshot limitation with no clean workaround, and — the sharpest one — last Friday's retrospective filed real, useful tickets while citing a report file that was never actually saved anywhere. That last one is the sweep catching the same class of problem the crew has been chasing all week: work that looks complete and leaves nothing behind to check.

**In your terms:** the traits idea is now buildable, the encounter rebuild's foundation is in the workshop rather than on paper, and two automated reviews found eight things in one hour and wrote every one of them down. None of it needs you.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
