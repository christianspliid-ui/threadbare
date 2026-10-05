# Briefing
**Generated:** 2026-10-06 01:56 local (23:56 UTC) · keep-work-flowing-cc

## The one thing

**Were you away, or was the app closed, last week?** On two weekday stretches no lane ran at all, and nothing recorded a pause. The longer one: **"The scheduled lanes went silent for 25h (2026-09-29T17:38:06.000Z → 2026-09-30T18:36:30.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time."** *— from the lane-silence check* In your time that was Tuesday ~19:30 to Wednesday ~20:20. The other stretch ran from Thursday 1 October ~17:00 to Friday 2 October ~13:45.

One reply covers both, for example "away both times" or "app was closed". If either one wasn't you, say so and it becomes a fault to chase. Details: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Also waiting (2)

- **Were you away from the app on Monday 14 and Tuesday 15 September?** *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md)*
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

## Decided for you

- [The player can't read what they spend or risk](https://linear.app/threadbare/issue/THR-1713/recurs-after-fix-the-player-cant-read-what-they-spend-or-risk-round-2): **every number and mark the round-2 testers pointed at now answers on hover**: essence rows, card price and odds marks, forecast words like "Doomed" and "Fated", the Reaches. Red and green lines gain a small **helps** / **hinders** word, and Quintessence leaves the top bar until it moves. *The calls to veto:* **"no tooltips in the meeting"** or **"labels, not hovers"**. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-05-thr-1713-readable-on-hover.md). Veto window closes ~02:45 today (Tuesday). *— from the design lane*
- [A lead that reaches "knows where it lies" on a wonder can never become a delve](https://linear.app/threadbare/issue/THR-1702/a-lead-that-reaches-located-on-a-wonder-can-never-become-a-delve-and): **once a mortal has found a wonder, or a plain ruin no delve can enter, the search is over.** The place goes on their sheet as **"found it"** and they stop walking back to survey it. *The calls to veto:* **"drop wonders from the visit"** or **"finding a wonder should give something"**. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-05-thr-1702-found-leads-end-the-climb.md). Veto window closes ~08:50 today. *— from the design lane*
- [Mortals pick sure things over a fair fight](https://linear.app/threadbare/issue/THR-1740/forecast-window-re-plan-branching-quests-win-at-near-certain-odds-the): **mortals now take on work they'd win about half the time, instead of padding their record with things they can't lose.** Every skill band ends up succeeding at a similar rate (about 54–63%), and the gauge judges each mortal against its own comfort zone, asking for "most" choices inside it (0.50, down from 0.60). Your threaded mortals keep their quests exactly as today. *The calls to veto:* **"keep 0.60"** or **"quests stay exempt"**. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-05-thr-1740-forecast-window-replan.md). Veto window closes ~14:57 today. *— from the design lane*
- [Warm playtest](https://linear.app/threadbare/issue/THR-1744/warm-playtest-no-knowledge-testers-start-a-few-hundred-ticks-into-a): **new testers will also start about three seasons into a running world, with The First already bonded, so someone finally plays factions, long work and ambitions.** A short "The world moves on" screen covers the ~1.5-minute catch-up; a tester who never opens a faction, a long work or an ambition counts as a coverage failure. It runs inside the daily playtest check, at most one round a day, cold first. *The calls to veto:* **"don't steer them"**, **"story counts"** or **"run both the same day"**. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-05-thr-1744-warm-playtest.md). Veto window closes ~21:15 today. *— from the design lane*

Say "veto readable hovers", "veto found it", "veto fair fights" or "veto warm playtest" to reverse any of these.

## Queue

**4 jobs ready** (healthy), **1 being built.** All four ready jobs are the design-lane decisions above, each waiting out its veto window; the first opens at ~02:45 (readable hovers). That pause is by design, not a stall. In the last hour the written record of your Dominion ruling merged ([#2249](https://github.com/christianspliid-ui/threadbare/pull/2249), 23:19 UTC).

- **Being built:** [naming "Dominion" in the glossary](https://linear.app/threadbare/issue/THR-1746/ul-proposal-dominion-the-graded-match-between-a-world-objects-sphere), the first piece of tonight's power-progression ruling. Its pull request [#2250](https://github.com/christianspliid-ui/threadbare/pull/2250) is open but clashes with newer main (see Health). The other four Dominion pieces wait for design docs (the design lane writes them) or for this one.

## Health

- **One pull request is stuck**: [#2250](https://github.com/christianspliid-ui/threadbare/pull/2250) (Dominion in the glossary) has a merge conflict, now ~3 h 15 min untouched. Nothing is wrong with the work; the builder's unstick duty owes it, not you.
- **The heavy simulation tests are still red on main**, about 16 hours now ([runs](https://github.com/christianspliid-ui/threadbare/actions/workflows/heavy-tests.yml)). No builder has claimed the fix yet. A builder owes it, not you.
- **The worktree reaper has 6 worktrees waiting for a decision** (482 worktrees, 319 local branches on disk). Noted for visibility.
- Everything else is green. The live site is current (commits since `df6bcd84` touched only docs), scheduled tasks are on time. Simulation speed is normal (108 ms per tick, 1% over the weekly median of 107).
