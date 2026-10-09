# Briefing
**Generated:** 2026-10-09 19:55 local (17:55 UTC) · keep-work-flowing-cc

## The one thing

**Set the Claude app to open when Windows starts.** Every recent lane silence began when the computer started or woke and the app did not reopen. Only you can change that setting. Say "done" and the next silence check will confirm it. *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md)*

The silence check still reports the most recent gap: *"The scheduled lanes went silent for 31.8h (2026-10-06T20:56:43.000Z → 2026-10-08T04:42:41.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time."* The retro traced it to the computer being asleep, so this setting is the fix.

## Also waiting (3)

- **Thursday 1 Oct afternoon and Friday 2 Oct morning:** the computer was on, but no lane ran. Was the Claude app closed?
- **Monday 14 and Tuesday 15 September:** the same thing happened. Was the app closed?
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

## Decided for you

- [How the frontier moves](https://linear.app/threadbare/issue/THR-1762/how-the-frontier-moves-which-verbs-push-dominion-outward-what-they) — how your god's turf grows. You take ground in two moves: **Shift Dominion** breaks a place's resistance, then **Claim Dominion** tends it as a hold you keep paying for. With steady attention a place becomes Touched in about 5 days, Held in about 2 weeks and Sovereign in about 6 weeks, faster as your god grows stronger. Your seat tends itself for free; threaded mortals slowly spread your spheres where they stand. *To veto, say:* **"turf should spread on its own around what I hold"**, **"taking a place should be quicker than six weeks"** or **"my mortals shouldn't spread my turf until they're truly mine"**. *— from the [design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-09c.md)*
- [What the band buys](https://linear.app/threadbare/issue/THR-1761/what-the-band-buys-cost-effect-strength-thread-yield-and-source-income) — what your turf is worth in play. Home turf is a bonus, never a requirement: neutral ground costs and pays as today. On your own ground cards cost up to a quarter less, casts land more often, and your mortals and wellsprings pay up to half again. On hostile ground cards cost half again as much, casts land less often, and a wellspring there pays nothing. *To veto, say:* **"a wellspring should only pay on ground I hold"** or **"turf should change the size of what I do, not just the odds"**. *— from the [design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-09b.md)*
- [The formula settled](https://linear.app/threadbare/issue/THR-1760/the-formula-settled-normalisation-the-gods-power-factor-and-the-five) — how much of the world is your god's turf. No world starts hostile: every god opens with a home turf, some places Touched, a few Held. Hostile ground arrives during the run. Sovereign is never given; you earn it. *To veto, say:* **"the world should be able to start against you"** or **"a stronger god should feel enemies push back harder"**. *— from the [design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-09a.md)*
- [Outcomes still can't be read](https://linear.app/threadbare/issue/THR-1784/recurs-after-fix-twice-outcomes-still-cant-be-read-six-identical-bond) — an ending shows one named reputation row per mortal instead of six identical "World Standing" rows; the ▲ scale gets a legend; Star's "Fated" becomes "Charted"; your god's seat always lands in a town. *To veto, say:* **"keep the word standing"**, **"let me choose where the seat goes"** or **"keep Fated for Star"**. *— from the [design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-08d.md)* (veto window closes about 20:30 tonight)

Say "veto <title>" to reverse any of these.

## Queue

**Healthy: 6 jobs ready, 1 being built.** Nothing in the ready queue is older than 2 days or blocked; no parked jobs.

- **A bonded First is asked to "Reach Down" again** ([THR-1786](https://linear.app/threadbare/issue/THR-1786/a-bonded-first-is-asked-to-reach-down-again-beat-0-should-settle-as)) is being built (claimed about 4½ hours ago).
- **Who holds power** ([THR-1780](https://linear.app/threadbare/issue/THR-1780/who-holds-power-is-a-dead-end-the-notables-badge-counts-active-agendas)) merged via [#2288](https://github.com/christianspliid-ui/threadbare/pull/2288), and **God's Will prices name the sphere they bill** ([THR-1783](https://linear.app/threadbare/issue/THR-1783)) merged via [#2289](https://github.com/christianspliid-ui/threadbare/pull/2289). Both are live.
- New in the queue: [a ruler's card reads "TRUE_BELIEVER" and repeats thread chips](https://linear.app/threadbare/issue/THR-1797/a-rulers-card-reads-true-believer-under-the-name-and-repeats-each), found in the Notables view that just shipped.

## Health

- **Heavy simulation tests are now red on three main commits in a row** ([latest run](https://github.com/christianspliid-ui/threadbare/actions/runs/37967284682), on c4e887ed). Two tests time out: `doomIdentityMilestones` ("milestone triggered flag persists", 19 s against a 15 s limit) and `debugTickBatch` ("one aggregate trace per call", over 5 s). Three in a row reads less like a slow runner and more like the simulation getting slower. No session has claimed it. Executor's job, not yours.
- **Simulation speed drifted:** tick cost 185 ms/tick steady, 47% above the 7-day median (126, 135 rows since 1b12cfd8); top phase agent_decision, 609 agents. Name the merges between 1b12cfd8 and c4e887ed: `git log --oneline --merges 1b12cfd8..c4e887ed`. One sample — the hour before read 134 ms — but it lines up with the timeouts above. Executor's job.
- Everything else is green. The live site is current (c4e887ed), no pull requests are stuck, all 11 lanes are on schedule, and the worktree cleaner last ran at 19:40.
