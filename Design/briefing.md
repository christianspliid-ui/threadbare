# Briefing
**Generated:** 2026-10-19 19:57 local (17:57 UTC) · keep-work-flowing-cc

## The one thing

**Set the Claude app to open when Windows starts.** It happened again, and this was the longest gap yet: no lane ran from 20:26 Sunday until about 19:28 tonight. That is all of Monday, with 25 jobs ready for the builder. Every recent silence has the same shape: the computer starts or wakes, and the app does not reopen. Only you can change that setting. Say "done" and the next silence check will confirm it. *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md)*

## Also waiting (5)

- **Sunday evening to Monday evening (18–19 Oct):** "No scheduled Claude Code lane has written to origin/main or origin/ops since 2026-10-18T18:26:51.000Z — 23.5h of fleet-wide silence, past the 6h threshold, and no pause marker is set. Either the lanes are broken, or this is a deliberate pause that was never declared." The lanes are running again since about 19:28 tonight. Was the app closed, or was this a pause?
- **Should "Fated" be gold instead of grey?** If you say nothing, it stays grey. ([the plan's section](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-18-thr-1980-words-teach-themselves.md#needs-christian-reserved-not-decided)) *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-18d.md)*
- **Thursday 1 Oct afternoon and Friday 2 Oct morning:** the computer was on, but no lane ran. Was the Claude app closed?
- **Monday 14 and Tuesday 15 September:** the same thing happened. Was the app closed?
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

Detail for each: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Queue

**Backed up: 25 ready, 1 in progress.** The builder is working on [Inspector S5: card counts on every row](https://linear.app/threadbare/issue/THR-1913/inspector-s5-card-counts-on-every-row-with-an-inline-tray-of-those) (High); its run has been active since 19:31 tonight. Since the last brief, [the top bar with "Needs you"](https://linear.app/threadbare/issue/THR-1875/plan-doc-the-screen-frame-top-bar-with-needs-you-the-god-rail-with-the) ([#2484](https://github.com/christianspliid-ui/threadbare/pull/2484)) and [Inspector S4: the old detail screens are deleted](https://linear.app/threadbare/issue/THR-1912/inspector-s4-delete-the-retired-detail-surfaces-once-their-fields-have) ([#2485](https://github.com/christianspliid-ui/threadbare/pull/2485)) merged and are live.

- All veto windows have closed, so every design-lane build is free to build. No decision is waiting on a veto.
- High and waiting: [show what the pour and the odds do](https://linear.app/threadbare/issue/THR-1985/show-what-the-pour-and-the-odds-do-refill-words-on-the-essence-rows); [Inspector S6: card-first](https://linear.app/threadbare/issue/THR-1914/inspector-s6-card-first-arm-a-card-from-the-hand-and-its-targets-light); [cut per-PR paperwork to one line](https://linear.app/threadbare/issue/THR-1947/cut-per-pr-paperwork-to-one-status-line-drop-the-changelogproject).
- No ticket has sat in the queue for more than a week without being touched.

## Health

- The live site serves the latest commit on main (de68cb60). Main's checks and the scheduled background jobs pass. No PR is waiting to merge. All 12 scheduled lanes are within two slots of schedule now that the app is back.
- Engine speed: tick cost 194 ms/tick steady, 44% above the 7-day median (134, 110 rows since 594be706); top phase agent_decision, 624 agents. Name the merges between 594be706 and de68cb60: git log --oneline --merges 594be706..de68cb60. The builder was running during this measurement, so part of this is machine load. Executor work, not yours.
- The tidy-up job (last run 19:40) reports 554 old worktrees, with 5 items waiting for a decision. Builder housekeeping. You sent no new Discord messages.
