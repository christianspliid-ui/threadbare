# Briefing
**Generated:** 2026-10-06 21:58 local (19:58 UTC) · keep-work-flowing-cc

## The one thing

**Were you away last week, or was the app closed?** On two weekday stretches no lane ran at all, and nothing recorded a pause. The newer one: **"The scheduled lanes went silent for 20.9h (2026-10-01T14:55:14.000Z → 2026-10-02T11:48:32.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time."** *— from the lane-silence check* In your time that was Thursday 1 October ~17:00 to Friday 2 October ~13:45. The other stretch ran from Tuesday 29 September ~19:30 to Wednesday 30 September ~20:20.

One reply covers both, for example "away both times" or "app was closed". If either one wasn't you, say so and we treat it as a fault to chase. Details: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Also waiting (2)

- **Were you away from the app on Monday 14 and Tuesday 15 September?** *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md)*
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

## Decided for you

- [Sphere scores land where Dominion reads them](https://linear.app/threadbare/issue/THR-1768/sphere-scores-never-land-where-dominion-must-read-them-the-god-has-no) is the groundwork your Dominion map has been stuck on. **A mortal takes their people's faith**, **lairs and elder ruins carry their own sphere**, **a faction's sphere is the average of its members**, and **your god starts from its hunger's two spheres**. *Veto calls:* **"a mortal is of their land"**, **"a mortal is what they do"** or **"factions add up their members"**. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-06-thr-1768-sphere-score-seeding.md). Building waits until ~20:40 Wednesday. *— from the design lane*
- [Threading as character creation](https://linear.app/threadbare/issue/THR-1644/threading-as-character-creation-every-thread-plays-a-ceremony-the): **every time you thread a mortal, a short rite plays**, and it gets shorter as your court grows. **Whoever you thread first becomes The First**, and **your First carries your mark**. *Veto calls:* **"every thread gets the full rite"**, **"the meeting is the only way to get a First"**, **"pick the First from real people"** or **"no mark"**. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-06-thr-1644-threading-ceremony.md). Building waits until ~14:40 Wednesday. *— from the design lane*
- [Buy your spheres](https://linear.app/threadbare/issue/THR-1749/buy-your-spheres-point-buy-across-the-eight-creation-spheres-at): you spend **five measures, at most three in one sphere**, across **four rows, one per opposed pair**, and the rows start pre-filled from your hunger. **Haunt loses Darkness**, **Illuminate loses Light**, and **Reshape** becomes Force and Matter. *Veto calls:* **"keep Haunt dark"** (or Illuminate's light), **"ten points"** or **"no buy screen, hunger decides"**. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-06-thr-1749-buy-your-spheres.md). Building waits until ~08:45 Wednesday. *— from the design lane*
- [Keeping mortals no longer bankrupts your god](https://linear.app/threadbare/issue/THR-1747/divine-economy-shared-prerequisites-thread-upkeep-a-god-can-keep-the): base income keeps one mortal at Aspect or two at Champion. **The Wellspring arrives at a fixed moment**, not by luck. Ground you can't pay for stops growing but is never lost. *Veto calls:* **"orphans with the first wellspring"**, **"unpaid ground should wither"** or **"Wellspring later"**. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-06-thr-1747-divine-economy-shared-prerequisites.md). Building waits until ~02:45 Wednesday. *— from the design lane*

Say "veto sphere seeding", "veto threading rite", "veto buy your spheres" or "veto divine economy" to reverse any of these. The warm-playtest veto window closed at 21:15 with no veto, so it is being built now.

## Queue

**Healthy: 4 jobs ready, 1 being built.** All four ready jobs are the design-lane decisions above, each waiting out its veto window. The first opens ~02:45 Wednesday ([divine economy](https://linear.app/threadbare/issue/THR-1747/divine-economy-shared-prerequisites-thread-upkeep-a-god-can-keep-the)).

- **Being built:** [Warm playtest](https://linear.app/threadbare/issue/THR-1744/warm-playtest-no-knowledge-testers-start-a-few-hundred-ticks-into-a). Phase 1 is open as [PR #2264](https://github.com/christianspliid-ui/threadbare/pull/2264) (opened 19:55 UTC) and still going through code review.
- **Optional, no reply needed:** the [Dominion map](https://linear.app/threadbare/issue/THR-1758/wayfinder-map-dominion-how-the-gods-power-grows-across-a-run) still offers two questions you could keep for yourself. They are [what you see of your turf on the map and cards](https://linear.app/threadbare/issue/THR-1766/what-the-player-sees-a-mock-of-the-dominion-overlay-on-the-map-the-band) and [how harsh losing ground to the opposing dominion feels](https://linear.app/threadbare/issue/THR-1763/the-opposing-dominion-as-a-force-who-pushes-back-how-fast-turf-erodes). If you say nothing, the design lane decides both and invites your veto. *— from the orchestrator*

## Health

- **Heavy simulation tests are still red on the latest main** ([run](https://github.com/christianspliid-ui/threadbare/actions/runs/37507733242)), now for about 2 hours. One slow test timed out under CI load and has passed on other runs. That is a known class of slow test, not a game defect, and the fix belongs to the builder lane. Nothing is blocked by it.
- **The worktree reaper has 6 worktrees waiting for a decision.** There are 485 worktrees and 321 local branches on disk; the last sweep ran at 21:40. Noted for visibility.
- Everything else is green. The live site serves the latest build (only notes and tools have changed since), and scheduled tasks are on time. The simulation speed probe reads 126 ms per tick, 11% above its weekly median of 114 and within normal.
