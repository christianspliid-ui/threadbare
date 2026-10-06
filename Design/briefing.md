# Briefing
**Generated:** 2026-10-06 22:54 local (20:54 UTC) · keep-work-flowing-cc

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
- [Keeping mortals no longer bankrupts your god](https://linear.app/threadbare/issue/THR-1747/divine-economy-shared-prerequisites-thread-upkeep-a-god-can-keep-the): base income keeps one mortal at Aspect or two at Champion. **The Wellspring arrives at a fixed moment**, not by luck. Ground you can't pay for stops growing but is never lost. *Veto calls:* **"orphans with the first wellspring"**, **"unpaid ground should wither"** or **"Wellspring later"**. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-06-thr-1747-divine-economy-shared-prerequisites.md). Building waits until ~02:45 Wednesday, about four hours from now. *— from the design lane*

Say "veto sphere seeding", "veto threading rite", "veto buy your spheres" or "veto divine economy" to reverse any of these.

## Queue

**Healthy: 5 jobs ready, 1 being built.** Four of the ready jobs are the design-lane decisions above, each waiting out its veto window. The fifth can be built now: [a fresh god's casting odds were judged on the old dice](https://linear.app/threadbare/issue/THR-1775/the-gods-cast-odds-verdict-thr-766-was-measured-on-the-retired-dice) — on today's dice a new god rarely lands a spell, so the builder re-measures and retunes two numbers. Promoted by the orchestrator at 22:30.

- **Being built:** [Warm playtest](https://linear.app/threadbare/issue/THR-1744/warm-playtest-no-knowledge-testers-start-a-few-hundred-ticks-into-a). Part 1 (the "start a few seasons in" switch) merged via [PR #2264](https://github.com/christianspliid-ui/threadbare/pull/2264) and is live. Part 2 — checking it on the live site, then the first warm playtest round — is next for the builder; nothing is stranded (its work folder is clean).
- **Optional, no reply needed:** the [Dominion map](https://linear.app/threadbare/issue/THR-1758/wayfinder-map-dominion-how-the-gods-power-grows-across-a-run) still offers two questions you could keep for yourself: [what you see of your turf on the map and cards](https://linear.app/threadbare/issue/THR-1766/what-the-player-sees-a-mock-of-the-dominion-overlay-on-the-map-the-band) and [how harsh losing ground to the opposing dominion feels](https://linear.app/threadbare/issue/THR-1763/the-opposing-dominion-as-a-force-who-pushes-back-how-fast-turf-erodes). If you say nothing, the design lane decides both and invites your veto. *— from the orchestrator*

## Health

- **Heavy simulation tests are still red on the latest main** ([workflow runs](https://github.com/christianspliid-ui/threadbare/actions/workflows/heavy-tests.yml)), now for about 3 hours, with 4 of the last 5 nightly-style runs failing. Earlier runs showed one slow test timing out under CI load; it has passed elsewhere. A known class of slow test, not a game defect — the builder lane owns the fix. Nothing is blocked by it.
- **The worktree reaper has 6 worktrees waiting for a decision.** There are 485 worktrees and 318 local branches on disk; the last sweep ran at 22:40. Noted for visibility.
- Everything else is green. The live site serves the latest build (a43dc356, which includes the warm-playtest switch), no pull requests are stuck, and scheduled tasks are on time. The simulation speed probe reads 124 ms per tick, 9% above its weekly median of 114 and within normal.
