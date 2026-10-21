# Briefing
**Generated:** 2026-10-21 15:56 local (13:56 UTC) · keep-work-flowing-cc

## The one thing

**Set the Claude app to open when Windows starts.** No lane ran from 20:26 Sunday until about 19:42 Monday. That is all of Monday, with 25 jobs ready for the builder. Every recent silence has the same shape: the computer starts or wakes, and the app does not reopen. Only you can change that setting. Say "done" and the next silence check will confirm it. *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md)*

## Also waiting (5)

- **Sunday evening to Monday evening (18–19 Oct):** "The scheduled lanes went silent for 23.3h (2026-10-18T18:26:51.000Z → 2026-10-19T17:42:15.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time." Was the app closed, or was this a pause?
- **Should "Fated" be gold instead of grey?** If you say nothing, it stays grey. ([the plan's section](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-18-thr-1980-words-teach-themselves.md#needs-christian-reserved-not-decided))
- **Thursday 1 Oct afternoon and Friday 2 Oct morning:** the computer was on, but no lane ran. Was the Claude app closed?
- **Monday 14 and Tuesday 15 September:** the same thing happened. Was the app closed?
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

Detail for each: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Queue

**Backed up: 28 ready, 2 in progress.**

- [Undertakings in the economy S3: a trade run pays the trader](https://linear.app/threadbare/issue/THR-1967/undertakings-in-the-economy-s3-a-trade-run-pays-the-trader-and-the) is built: [PR #2515](https://github.com/christianspliid-ui/threadbare/pull/2515) passed the review gate and is set to merge itself once its checks finish.
- [Cut per-PR paperwork to one line](https://linear.app/threadbare/issue/THR-1947/cut-per-pr-paperwork-to-one-status-line-drop-the-changelogproject) is still parked and unassigned, about 6 days since it was first claimed. No pushed branch and no local worktree for it (checked this run). Your go-ahead this morning cleared it; the builder is free to take it now that THR-1967 is waiting on checks.
- No ticket has sat in the queue for more than a week without being touched.

## Health

All green. The live site serves the latest main (f466a9ed), main's checks and the three background jobs are healthy, the one open pull request will merge on green, and all 13 scheduled lanes are on time. The engine is back to normal speed (125 ms per tick, below the week's median of 142), so last hour's slowdown was the builder loading the machine.
