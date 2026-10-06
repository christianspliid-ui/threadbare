# Briefing
**Generated:** 2026-10-06 11:56 local (09:56 UTC) · keep-work-flowing-cc

## The one thing

**Were you away, or was the app closed, last week?** On two weekday stretches no lane ran at all, and nothing recorded a pause. The longer one: **"The scheduled lanes went silent for 25h (2026-09-29T17:38:06.000Z → 2026-09-30T18:36:30.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time."** *— from the lane-silence check* In your time that was Tuesday ~19:30 to Wednesday ~20:20. The other stretch ran from Thursday 1 October ~17:00 to Friday 2 October ~13:45.

One reply covers both, for example "away both times" or "app was closed". If either one wasn't you, say so and it becomes a fault to chase. Details: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Also waiting (2)

- **Were you away from the app on Monday 14 and Tuesday 15 September?** *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md)*
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

## Decided for you

- [Buy your spheres](https://linear.app/threadbare/issue/THR-1749/buy-your-spheres-point-buy-across-the-eight-creation-spheres-at) — your point-buy ruling is now designed. After picking your hunger and court you pour **five measures into the spheres, at most three in one**, on **four rows, one per opposed pair**, so you never buy both poles. It opens pre-filled from your hunger, so one click keeps today's god; income follows what you poured. **Three hungers lose a sphere** to keep the elder-spheres-from-ruins rule: **Haunt loses Darkness**, **Illuminate loses Light**, **Reshape** becomes Force and Matter (their stories stay word for word). Elder cards (Whisper, Veil, Undertow, Order's Favor) leave the start until elder magic gets a ruin route ([filed](https://linear.app/threadbare/issue/THR-1753/foundation-signed-cards-lose-their-only-identity-route-once-spheres)). *The calls to veto:* **"keep Haunt dark"** (or Illuminate's light), **"ten points"** or **"no buy screen, hunger decides"**. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-06-thr-1749-buy-your-spheres.md). Building waits until ~08:45 Wednesday your time. *— from the design lane*
- [Keeping mortals no longer bankrupts your god](https://linear.app/threadbare/issue/THR-1747/divine-economy-shared-prerequisites-thread-upkeep-a-god-can-keep-the) — the first build step of your Dominion ruling. Your base income keeps one mortal all the way to Aspect, or two at Champion; a deeper following needs ground you hold. **The Wellspring arrives at a fixed moment** (about half a season after the bond, when the rivals wake), not by luck. Holding a wellspring costs a little each turn and pays back more; if you can't pay, it stops growing but is never lost. **Four holding cards nobody could get** (Tap the Source, Claim Resource, Claim Dominion, Place of Power) arrive together once two of your wellsprings flower. *The calls to veto:* **"orphans with the first wellspring"**, **"unpaid ground should wither"** or **"Wellspring later"**. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-06-thr-1747-divine-economy-shared-prerequisites.md). Building waits until ~02:45 Wednesday your time. *— from the design lane*
- [Mortals pick sure things over a fair fight](https://linear.app/threadbare/issue/THR-1740/forecast-window-re-plan-branching-quests-win-at-near-certain-odds-the) — **mortals now take on work they'd win about half the time, instead of padding their record with things they can't lose.** Every skill band ends up succeeding at a similar rate (about 54–63%); your threaded mortals keep their quests exactly as today. *The calls to veto:* **"keep 0.60"** or **"quests stay exempt"**. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-05-thr-1740-forecast-window-replan.md). Veto window closes ~14:57 today. *— from the design lane*
- [Warm playtest](https://linear.app/threadbare/issue/THR-1744/warm-playtest-no-knowledge-testers-start-a-few-hundred-ticks-into-a) — **new testers will also start about three seasons into a running world, with The First already bonded, so someone finally plays factions, long work and ambitions.** A tester who never opens a faction, a long work or an ambition counts as a coverage failure. *The calls to veto:* **"don't steer them"**, **"story counts"** or **"run both the same day"**. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-05-thr-1744-warm-playtest.md). Veto window closes ~21:15 today. *— from the design lane*

Say "veto buy your spheres", "veto divine economy", "veto fair fights" or "veto warm playtest" to reverse any of these.

## Queue

**4 jobs ready** (healthy), **none being built** right now. Nothing new merged this hour. The four ready jobs are the design-lane decisions above, each waiting out its veto window; the first ([fair fights](https://linear.app/threadbare/issue/THR-1740/forecast-window-re-plan-branching-quests-win-at-near-certain-odds-the)) opens ~14:57 today, so the builder idles until then. No parked or stale jobs.

## Health

- **The long simulation tests are red on main** ([latest run](https://github.com/christianspliid-ui/threadbare/actions/runs/37315731022), failing since 5 October ~11:00). The everyday checks are green and the live site is unaffected; a builder session owes the fix (pickup lane's unstick duty). Not yours.
- **The worktree reaper has 6 worktrees waiting for a decision** (480 worktrees, 315 local branches on disk). Noted for visibility; it ran at 11:43.
- Everything else is green. The live site is serving the latest main, scheduled tasks are on time, no pull requests are waiting. Simulation speed is normal (118 ms per tick, 9% over the weekly median of 108, inside the 25% drift line).
