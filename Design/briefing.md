# Briefing
**Generated:** 2026-10-05 20:56 local (18:56 UTC) · keep-work-flowing-cc

## The one thing

**Were you away, or was the app closed, last week?** On two weekday stretches no lane ran at all, and nothing recorded a pause. The longer one: **"The scheduled lanes went silent for 25h (2026-09-29T17:38:06.000Z → 2026-09-30T18:36:30.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time."** *— from the lane-silence check* In your time that was Tuesday ~19:30 to Wednesday ~20:20. The other stretch ran from Thursday 1 October ~17:00 to Friday 2 October ~13:45.

One reply covers both, for example "away both times" or "app was closed". If either one wasn't you, say so and it becomes a fault to chase. Details: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Also waiting (2)

- **Were you away from the app on Monday 14 and Tuesday 15 September?** *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md)*
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

## Decided for you

- [The player can't read what they spend or risk](https://linear.app/threadbare/issue/THR-1713/recurs-after-fix-the-player-cant-read-what-they-spend-or-risk-round-2): **every number and mark the round-2 testers pointed at now answers on hover**: essence rows, card price and odds marks, forecast words like "Doomed" and "Fated", the Reaches. Red and green lines gain a small **helps** / **hinders** word, and Quintessence leaves the top bar until it moves. *The calls to veto:* **"no tooltips in the meeting"** or **"labels, not hovers"**. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-05-thr-1713-readable-on-hover.md). Veto window closes ~02:41 Tuesday. *— from the design lane*
- [A lead that reaches "knows where it lies" on a wonder can never become a delve](https://linear.app/threadbare/issue/THR-1702/a-lead-that-reaches-located-on-a-wonder-can-never-become-a-delve-and): **once a mortal has found a wonder, or a plain ruin no delve can enter, the search is over.** The place goes on their sheet as **"found it"** and they stop walking back to survey it. *The calls to veto:* **"drop wonders from the visit"** or **"finding a wonder should give something"**. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-05-thr-1702-found-leads-end-the-climb.md). Veto window closes ~08:45 Tuesday. *— from the design lane*
- [Mortals pick sure things over a fair fight](https://linear.app/threadbare/issue/THR-1740/forecast-window-re-plan-branching-quests-win-at-near-certain-odds-the): **mortals now take on work they'd win about half the time, instead of padding their record with things they can't lose.** Every skill band ends up succeeding at a similar rate (about 54–63%), and the gauge judges each mortal against its own comfort zone, asking for "most" choices inside it (0.50, down from 0.60). Your threaded mortals keep their quests exactly as today. *The calls to veto:* **"keep 0.60"** or **"quests stay exempt"**. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-05-thr-1740-forecast-window-replan.md). Veto window closes ~14:50 Tuesday. *— from the design lane*

Say "veto readable hovers", "veto found it" or "veto fair fights" to reverse any of these.

## Queue

**3 jobs ready** (healthy), **1 being built.** The three ready jobs are the design-lane decisions above, each waiting out its veto window; the next one opens at ~02:41 Tuesday (readable hovers). That pause is by design, not a stall.

- **Being built:** [a set-down encounter now waits for you](https://linear.app/threadbare/issue/THR-1730/a-minimised-encounter-step-plays-out-on-its-own-once-time-runs-should). Its veto window closed at ~20:40 with no veto, and the builder picked it up minutes later; the work is in progress in a local worktree, not yet pushed.
- The design doc on three ways a player's power could grow over a run merged via [#2246](https://github.com/christianspliid-ui/threadbare/pull/2246). No pull requests are open.
- The [warm playtest](https://linear.app/threadbare/issue/THR-1744/warm-playtest-no-knowledge-testers-start-a-few-hundred-ticks-into-a) is with the design lane now; a draft plan is being written.

## Health

- **The heavy simulation tests are still red on main**, on the newest game commit `2fe01185` ([runs](https://github.com/christianspliid-ui/threadbare/actions/workflows/heavy-tests.yml)), red on the last four runs today. No builder has claimed the fix yet. A builder owes it, not you.
- **The worktree reaper has 6 worktrees waiting for a decision** (479 worktrees, 317 local branches on disk). Noted for visibility.
- Everything else is green. The live site serves the newest game build (`2fe01185`; later commits were notes only), scheduled tasks are on time, and the reaper last ran at 20:40. Simulation speed is normal (120 ms per tick, 13% over the weekly median).
