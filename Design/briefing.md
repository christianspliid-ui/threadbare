# Briefing
**Generated:** 2026-10-19 21:58 local (19:58 UTC) · keep-work-flowing-cc

## The one thing

**Set the Claude app to open when Windows starts.** No lane ran from 20:26 Sunday until about 19:42 tonight. That is all of Monday, with 25 jobs ready for the builder. Every recent silence has the same shape: the computer starts or wakes, and the app does not reopen. Only you can change that setting. Say "done" and the next silence check will confirm it. *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md)*

## Also waiting (5)

- **Sunday evening to Monday evening (18–19 Oct):** "The scheduled lanes went silent for 23.3h (2026-10-18T18:26:51.000Z → 2026-10-19T17:42:15.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time." Was the app closed, or was this a pause?
- **Should "Fated" be gold instead of grey?** If you say nothing, it stays grey. ([the plan's section](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-18-thr-1980-words-teach-themselves.md#needs-christian-reserved-not-decided)) *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-18d.md)*
- **Thursday 1 Oct afternoon and Friday 2 Oct morning:** the computer was on, but no lane ran. Was the Claude app closed?
- **Monday 14 and Tuesday 15 September:** the same thing happened. Was the app closed?
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

Detail for each: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Queue

**Backed up: 27 ready, 1 in progress.** The builder is now on [the Stage, slice 2: the Stage frame over the dimmed map](https://linear.app/threadbare/issue/THR-1892/the-stage-slice-2-the-stage-frame-over-the-dimmed-map-with-the-lit-hex) (High), in a run that started at 21:31 and is still working.

- High and waiting: [show what the pour and the odds do](https://linear.app/threadbare/issue/THR-1985/show-what-the-pour-and-the-odds-do-refill-words-on-the-essence-rows); [Inspector S6: card-first](https://linear.app/threadbare/issue/THR-1914/inspector-s6-card-first-arm-a-card-from-the-hand-and-its-targets-light); [cut per-PR paperwork to one line](https://linear.app/threadbare/issue/THR-1947/cut-per-pr-paperwork-to-one-status-line-drop-the-changelogproject).
- No ticket has sat in the queue for more than a week without being touched.

## Health

- The live site serves the latest commit on main (04ed4c85), which includes [Inspector S5: card counts on every row](https://linear.app/threadbare/issue/THR-1913/inspector-s5-card-counts-on-every-row-with-an-inline-tray-of-those). Main's checks and the scheduled background jobs pass. No PRs are waiting to merge.
- Engine speed: tick cost 307 ms/tick steady, 125% above the 7-day median (137, 110 rows since f3c397f3); top phase agent_decision, 624 agents. Name the merges between f3c397f3 and 04ed4c85: git log --oneline --merges f3c397f3..04ed4c85. The builder was running during this measurement, so much of this is machine load. Executor work, not yours.
- The tidy-up job (last run 21:40) reports 557 old worktrees, with 5 items waiting for a decision. Builder housekeeping. You sent no new Discord messages.
