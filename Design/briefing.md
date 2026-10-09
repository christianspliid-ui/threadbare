# Briefing
**Generated:** 2026-10-09 20:55 local (18:55 UTC) · keep-work-flowing-cc

## The one thing

**Set the Claude app to open when Windows starts.** Every recent lane silence began when the computer started or woke and the app did not reopen. Only you can change that setting. Say "done" and the next silence check will confirm it. *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md)*

The silence check still reports the most recent gap: *"The scheduled lanes went silent for 31.8h (2026-10-06T20:56:43.000Z → 2026-10-08T04:42:41.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time."* The retro traced it to the computer being asleep, so this setting is the fix.

## Also waiting (3)

- **Thursday 1 Oct afternoon and Friday 2 Oct morning:** the computer was on, but no lane ran. Was the Claude app closed?
- **Monday 14 and Tuesday 15 September:** the same thing happened. Was the app closed?
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

## Decided for you

- [The opposing dominion as a force](https://linear.app/threadbare/issue/THR-1763/the-opposing-dominion-as-a-force-who-pushes-back-how-fast-turf-erodes) — how your god's turf is lost. Three things push back: **neglect** (a place nobody tends drops a band in about three weeks), **rival gods** (they raid your untended ground with the spheres opposite yours, more often the more you hold), and **doom** (it scorches everyone's ground, as today). One Claim or one threaded mortal in a place keeps it. You can lose everything you took, but never your seat; a lost band is a chronicle line and a map mark, never a pause. *To veto, say:* **"losing ground should be able to drive me from my home"**, **"untended turf shouldn't fade on its own"** or **"doom should aim at my turf"**. *— from the [design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-09d.md)*
- [How the frontier moves](https://linear.app/threadbare/issue/THR-1762/how-the-frontier-moves-which-verbs-push-dominion-outward-what-they) — how your god's turf grows. You take ground in two moves: **Shift Dominion** breaks a place's resistance, then **Claim Dominion** tends it as a hold you keep paying for. With steady attention a place becomes Touched in about 5 days, Held in about 2 weeks and Sovereign in about 6 weeks, faster as your god grows stronger. Your seat tends itself for free; threaded mortals slowly spread your spheres where they stand. *To veto, say:* **"turf should spread on its own around what I hold"**, **"taking a place should be quicker than six weeks"** or **"my mortals shouldn't spread my turf until they're truly mine"**. *— from the [design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-09c.md)*
- [What the band buys](https://linear.app/threadbare/issue/THR-1761/what-the-band-buys-cost-effect-strength-thread-yield-and-source-income) — what your turf is worth in play. Home turf is a bonus, never a requirement: neutral ground costs and pays as today. On your own ground cards cost up to a quarter less, casts land more often, and your mortals and wellsprings pay up to half again. On hostile ground cards cost half again as much, casts land less often, and a wellspring there pays nothing. *To veto, say:* **"a wellspring should only pay on ground I hold"** or **"turf should change the size of what I do, not just the odds"**. *— from the [design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-09b.md)*
- [The formula settled](https://linear.app/threadbare/issue/THR-1760/the-formula-settled-normalisation-the-gods-power-factor-and-the-five) — how much of the world is your god's turf. No world starts hostile: every god opens with a home turf, some places Touched, a few Held. Hostile ground arrives during the run. Sovereign is never given; you earn it. *To veto, say:* **"the world should be able to start against you"** or **"a stronger god should feel enemies push back harder"**. *— from the [design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-09a.md)*

Say "veto <title>" to reverse any of these.

## Queue

**Healthy: 8 jobs ready, 1 being built.** Nothing in the ready queue is older than 4 days or blocked; no parked jobs.

- **The warm start arrives with the opening already played** ([THR-1787](https://linear.app/threadbare/issue/THR-1787/the-warm-start-should-arrive-with-the-opening-already-played-settle)) is being built (claimed 25 minutes ago); its fix [#2292](https://github.com/christianspliid-ui/threadbare/pull/2292) is waiting on checks and will merge on green.
- **A bonded First is no longer asked to "Reach Down" again** ([THR-1786](https://linear.app/threadbare/issue/THR-1786/a-bonded-first-is-asked-to-reach-down-again-beat-0-should-settle-as)) merged via [#2290](https://github.com/christianspliid-ui/threadbare/pull/2290) and is live.

## Health

- **Heavy simulation tests are red on four main commits in a row** ([latest run](https://github.com/christianspliid-ui/threadbare/actions/runs/37972597184), on 312f0cbf). Last hour's slow-simulation reading did not repeat — tick cost is back at the usual 126 ms/tick — so this looks like the tests themselves timing out, not the game getting slower. No session has claimed it. Executor's job, not yours.
- Everything else is green. The live site is current (312f0cbf; later commits were docs only), no pull requests are stuck, all 11 lanes are on schedule, and the worktree cleaner last ran at 20:40.
