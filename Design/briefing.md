# Briefing
**Generated:** 2026-10-06 06:58 local (04:58 UTC) · keep-work-flowing-cc

## The one thing

**Were you away, or was the app closed, last week?** On two weekday stretches no lane ran at all, and nothing recorded a pause. The longer one: **"The scheduled lanes went silent for 25h (2026-09-29T17:38:06.000Z → 2026-09-30T18:36:30.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time."** *— from the lane-silence check* In your time that was Tuesday ~19:30 to Wednesday ~20:20. The other stretch ran from Thursday 1 October ~17:00 to Friday 2 October ~13:45.

One reply covers both, for example "away both times" or "app was closed". If either one wasn't you, say so and it becomes a fault to chase. Details: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Also waiting (2)

- **Were you away from the app on Monday 14 and Tuesday 15 September?** *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md)*
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

## Decided for you

- [Keeping mortals no longer bankrupts your god](https://linear.app/threadbare/issue/THR-1747/divine-economy-shared-prerequisites-thread-upkeep-a-god-can-keep-the) — the first build step of your Dominion ruling. Your base income keeps one mortal all the way to Aspect, or two at Champion; a deeper following needs ground you hold. **The Wellspring arrives at a fixed moment** (about half a season after the bond, when the rivals wake), not by luck. Holding a wellspring costs a little each turn and pays back more; if you can't pay, it stops growing but is never lost. **Four holding cards nobody could get** (Tap the Source, Claim Resource, Claim Dominion, Place of Power) arrive together once two of your wellsprings flower. *The calls to veto:* **"orphans with the first wellspring"**, **"unpaid ground should wither"** or **"Wellspring later"**. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-06-thr-1747-divine-economy-shared-prerequisites.md). Building waits until ~02:45 Wednesday your time. *— from the design lane*
- [A lead that reaches "knows where it lies" on a wonder can never become a delve](https://linear.app/threadbare/issue/THR-1702/a-lead-that-reaches-located-on-a-wonder-can-never-become-a-delve-and): **once a mortal has found a wonder, or a plain ruin no delve can enter, the search is over.** The place goes on their sheet as **"found it"** and they stop walking back to survey it. *The calls to veto:* **"drop wonders from the visit"** or **"finding a wonder should give something"**. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-05-thr-1702-found-leads-end-the-climb.md). Veto window closes ~08:50 today. *— from the design lane*
- [Mortals pick sure things over a fair fight](https://linear.app/threadbare/issue/THR-1740/forecast-window-re-plan-branching-quests-win-at-near-certain-odds-the): **mortals now take on work they'd win about half the time, instead of padding their record with things they can't lose.** Every skill band ends up succeeding at a similar rate (about 54–63%); your threaded mortals keep their quests exactly as today. *The calls to veto:* **"keep 0.60"** or **"quests stay exempt"**. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-05-thr-1740-forecast-window-replan.md). Veto window closes ~14:57 today. *— from the design lane*
- [Warm playtest](https://linear.app/threadbare/issue/THR-1744/warm-playtest-no-knowledge-testers-start-a-few-hundred-ticks-into-a): **new testers will also start about three seasons into a running world, with The First already bonded, so someone finally plays factions, long work and ambitions.** A tester who never opens a faction, a long work or an ambition counts as a coverage failure. *The calls to veto:* **"don't steer them"**, **"story counts"** or **"run both the same day"**. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-05-thr-1744-warm-playtest.md). Veto window closes ~21:15 today. *— from the design lane*

Say "veto divine economy", "veto found it", "veto fair fights" or "veto warm playtest" to reverse any of these.

## Queue

**4 jobs ready** (healthy), **nothing being built.** All four ready jobs are the design-lane decisions above, each waiting out its veto window; the first ([found it](https://linear.app/threadbare/issue/THR-1702/a-lead-that-reaches-located-on-a-wonder-can-never-become-a-delve-and)) can be picked up from ~08:50 today. Until then the builder has nothing it may start, which is expected.

- **Just landed:** [essence a god earns through its own acts now counts toward attunement](https://linear.app/threadbare/issue/THR-1752/the-essence-earned-attunement-counter-misses-essence-a-god-act-moves) merged via [#2253](https://github.com/christianspliid-ui/threadbare/pull/2253) and is live.

## Health

- **The worktree reaper has 6 worktrees waiting for a decision** (481 worktrees, 314 local branches on disk). Noted for visibility; it ran at 06:40.
- Everything else is green. The live site is serving the latest commit (`5e0bcb60`, the essence fix), scheduled tasks are on time, no pull requests are waiting, CI and the heavy simulation tests are green on main. Simulation speed is normal (108 ms per tick, right on the weekly median).
