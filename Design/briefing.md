# Briefing
**Generated:** 2026-10-05 16:56 local (14:56 UTC) · keep-work-flowing-cc

## The one thing

**Were you away, or was the app closed, last week?** On two weekday stretches no lane ran at all, and nothing recorded a pause. The longer one: **"The scheduled lanes went silent for 25h (2026-09-29T17:38:06.000Z → 2026-09-30T18:36:30.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time."** *— from the lane-silence check* In your time that was Tuesday ~19:30 to Wednesday ~20:20. The other stretch ran from Thursday 1 October ~17:00 to Friday 2 October ~13:45.

One reply covers both, for example "away both times" or "app was closed". If either one wasn't you, say so and it becomes a fault to chase. Details: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Also waiting (2)

- **Were you away from the app on Monday 14 and Tuesday 15 September?** *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md)*
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

## Decided for you

- [A minimised encounter step plays out on its own](https://linear.app/threadbare/issue/THR-1730/a-minimised-encounter-step-plays-out-on-its-own-once-time-runs-should): **a moment you set down now waits for you, however long the world runs.** The mortal's badge reads "waiting for you", and switching their thread to **Lives on** lets it go. *The call to veto:* say so if you meant "let it play out if I don't come back". [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-04-thr-1730-minimised-step-waits.md). Veto window closes ~20:40 today. *— from the design lane*
- [The player can't read what they spend or risk](https://linear.app/threadbare/issue/THR-1713/recurs-after-fix-the-player-cant-read-what-they-spend-or-risk-round-2): **every number and mark the round-2 testers pointed at now answers on hover**: essence rows, card price and odds marks, forecast words like "Doomed" and "Fated", the Reaches. Red and green lines gain a small **helps** / **hinders** word, and Quintessence leaves the top bar until it moves. *The calls to veto:* **"no tooltips in the meeting"** or **"labels, not hovers"**. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-05-thr-1713-readable-on-hover.md). Veto window closes ~02:41 Tuesday. *— from the design lane*
- [A lead that reaches "knows where it lies" on a wonder can never become a delve](https://linear.app/threadbare/issue/THR-1702/a-lead-that-reaches-located-on-a-wonder-can-never-become-a-delve-and): **once a mortal has found a wonder, or a plain ruin no delve can enter, the search is over.** The place goes on their sheet as **"found it"** and they stop walking back to survey it. *The calls to veto:* **"drop wonders from the visit"** or **"finding a wonder should give something"**. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-05-thr-1702-found-leads-end-the-climb.md). Veto window closes ~08:45 Tuesday. *— from the design lane*
- [Mortals pick sure things over a fair fight](https://linear.app/threadbare/issue/THR-1740/forecast-window-re-plan-branching-quests-win-at-near-certain-odds-the): **mortals now take on work they'd win about half the time, instead of padding their record with things they can't lose.** Every skill band ends up succeeding at a similar rate (about 54–63%), and the gauge judges each mortal against its own comfort zone, asking for "most" choices inside it (0.50, down from 0.60). Your threaded mortals keep their quests exactly as today. *The calls to veto:* **"keep 0.60"** or **"quests stay exempt"**. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-05-thr-1740-forecast-window-replan.md). Veto window closes ~14:50 Tuesday. *— from the design lane*

Say "veto set-down waits", "veto readable hovers", "veto found it" or "veto fair fights" to reverse any of these.

## Queue

**4 jobs ready** (healthy), **none being built right now.** All four ready jobs are the design-lane decisions above, each waiting out its veto window. The first to open is the set-down-waits fix at ~20:40 tonight, so the builder has nothing it may start before then. That pause is by design, not a stall.

- Nothing new shipped this hour. The last two merges, [#2239](https://github.com/christianspliid-ui/threadbare/pull/2239) (encounter summaries now read as player prose) and [#2242](https://github.com/christianspliid-ui/threadbare/pull/2242) (the commit button stays on screen), are both live.

## Health

- **The heavy simulation tests are still red on main**, including on the newest commit `2fe01185` ([run](https://github.com/christianspliid-ui/threadbare/actions/runs/37320333766)). Two tests fail: one hits a 5-second time limit (`debugTickBatch`) and one is a doom-milestone check (`doomIdentityMilestones`). It has been red on every run since ~06:40 your time. A builder owes the follow-up, not you.
- **The worktree reaper has 6 worktrees waiting for a decision** (476 worktrees, 319 local branches on disk). Noted for visibility.
- Everything else is green. The live site serves the newest main (`2fe01185`), no pull requests are waiting, scheduled tasks are on time, and the reaper last ran at 16:40. Simulation speed is healthy (105 ms per tick, 1% below its weekly median of 106).
