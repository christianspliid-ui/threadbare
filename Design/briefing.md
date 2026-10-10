# Briefing
**Generated:** 2026-10-10 13:30 local (11:30 UTC) · keep-work-flowing-cc

## The one thing

**Set the Claude app to open when Windows starts.** Every recent lane silence began when the computer started or woke and the app did not reopen. Only you can change that setting. Say "done" and the next silence check will confirm it. *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md)*

Last night shows the pattern again: nothing ran from 22:34 Friday until 13:25 Saturday. That is overnight and weekend quiet, so it is not a separate ask. It is the gap this setting would shorten.

## Also waiting (4)

- **The orchestrator lane has not caught up after the overnight gap.** The check says: *"tb-orchestrator has not run since 2026-10-09T20:28:43.431Z — 14+ hourly slots behind, while tb-opus-pickup kept firing. The lane is stalled, not idle."* The other lanes restarted at 13:25; this one is due at 14:28. If it runs then, this line goes away by itself.
- **Thursday 1 Oct afternoon and Friday 2 Oct morning:** the computer was on, but no lane ran. Was the Claude app closed?
- **Monday 14 and Tuesday 15 September:** the same thing happened. Was the app closed?
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

## Decided for you

- [The opposing dominion as a force](https://linear.app/threadbare/issue/THR-1763/the-opposing-dominion-as-a-force-who-pushes-back-how-fast-turf-erodes) — how your god's turf is lost. Three things push back: **neglect** (a place nobody tends drops a band in about three weeks), **rival gods** (they raid your untended ground with the spheres opposite yours, more often the more you hold), and **doom** (it scorches everyone's ground, as today). One Claim or one threaded mortal in a place keeps it. You can lose everything you took, but never your seat; a lost band is a chronicle line and a map mark, never a pause. *To veto, say:* **"losing ground should be able to drive me from my home"**, **"untended turf shouldn't fade on its own"** or **"doom should aim at my turf"**. *— from the [design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-09d.md)*
- [How the frontier moves](https://linear.app/threadbare/issue/THR-1762/how-the-frontier-moves-which-verbs-push-dominion-outward-what-they) — how your god's turf grows. You take ground in two moves: **Shift Dominion** breaks a place's resistance, then **Claim Dominion** tends it as a hold you keep paying for. With steady attention a place becomes Touched in about 5 days, Held in about 2 weeks and Sovereign in about 6 weeks, faster as your god grows stronger. Your seat tends itself for free; threaded mortals slowly spread your spheres where they stand. *To veto, say:* **"turf should spread on its own around what I hold"**, **"taking a place should be quicker than six weeks"** or **"my mortals shouldn't spread my turf until they're truly mine"**. *— from the [design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-09c.md)*

Say "veto <title>" to reverse any of these.

## Queue

**Healthy: 6 jobs ready, 1 being built.** Nothing in the ready queue is older than 4 days or blocked; no parked jobs.

- **The god's seat is named and findable** ([THR-1792](https://linear.app/threadbare/issue/THR-1792/the-gods-seat-is-named-and-findable-a-seat-line-on-the-gods-bar-that)) was picked up at 13:25 and is being built.
- Merged and live since the last brief: **one reputation row per mortal, named** ([THR-1789](https://linear.app/threadbare/issue/THR-1789/an-ending-shows-one-reputation-row-per-mortal-named-fold-the-per-step), [#2294](https://github.com/christianspliid-ui/threadbare/pull/2294)) and **Star's third skill word is now "Charted"**, so no skill word reads as an odds word (THR-1790, [#2295](https://github.com/christianspliid-ui/threadbare/pull/2295)).

## Health

- **Heavy simulation tests are red again on the latest main** (d372e413): both the [merge run](https://github.com/christianspliid-ui/threadbare/actions/runs/37987930906) and this morning's [scheduled run](https://github.com/christianspliid-ui/threadbare/actions/runs/38042772829) failed, though the commit before it ([40593b8c](https://github.com/christianspliid-ui/threadbare/actions/runs/37984723547)) passed. Red on and off since 312f0cbf. Tick cost is normal (125 ms/tick, 4% over the weekly median), so the tests are failing, not the game slowing down. No session has claimed it. This is executor work, not yours.
- Last night's 15-hour lane silence (22:34 Friday → 13:25 Saturday) was overnight and weekend quiet. It is declined under your 08-08 and 09-11 ruling and noted here only so you can see it.
- Everything else is green. The live site is current (d372e413), no pull requests are stuck, automated checks run normally, and the worktree cleaner last ran at 22:40 Friday (the computer was off after that).
