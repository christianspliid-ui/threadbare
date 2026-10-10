# Briefing
**Generated:** 2026-10-10 23:56 local (21:56 UTC) · keep-work-flowing-cc

## The one thing

**Set the Claude app to open when Windows starts.** Every recent lane silence began when the computer started or woke and the app did not reopen. Only you can change that setting. Say "done" and the next silence check will confirm it. *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md)*

The silence check still reports the Tuesday-to-Thursday gap this setting is meant to close: *"The scheduled lanes went silent for 31.8h (2026-10-06T20:56:43.000Z → 2026-10-08T04:42:41.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time."*

## Also waiting (3)

- **Thursday 1 Oct afternoon and Friday 2 Oct morning:** the computer was on, but no lane ran. Was the Claude app closed?
- **Monday 14 and Tuesday 15 September:** the same thing happened. Was the app closed?
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

## Decided for you

- [How the god's own power grows](https://linear.app/threadbare/issue/THR-1765/how-the-gods-own-power-grows-what-raises-the-gods-sphere-score-across) — your god grows by spending through its spheres: essence drawn through a sphere it bought attunes it a little further, and the mandate's milestones lift it as today. About five growth steps a run, roughly one every two to four weeks. Growth firms up friendly ground and makes signature powers strike harder. Turf stops widening at double strength; past that, deeper ground is won place by place. Nothing fades if you stop spending; you simply stop growing. *To veto, say:* **"my god should keep growing its land"**, **"power should come from deeds, not spending"** or **"unspent power should fade"**. *— from the [design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-10b.md)*
- [Dominion of the secondary actors](https://linear.app/threadbare/issue/THR-1764/dominion-of-the-secondary-actors-how-a-faction-an-army-a-company-or-an) — factions, armies, companies and relics read the people or ground they are made of. A mortal you **bestow** a gift on spreads your spheres faster. A faction you **anoint** keeps its towns on your ground tended and shrugs off one rival raid, but does not grow your turf. Your faithful armies don't fight better on your land by themselves. *To veto, say:* **"my faithful should win on my land"**, **"a relic should hold ground on its own"** or **"anointing should spread my turf, not just defend it"**. *— from the [design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-10a.md)*

Say "veto <title>" to reverse any of these.

## Queue

**Starved: 0 jobs ready, 0 being built.** Nothing is blocked, stale or parked. The orchestrator (next run ~00:28) and the design lane (next run ~02:17) refill the shelf.

- **Now live:** a gift from the opening waits its turn instead of opening over what you just clicked ([THR-1809](https://linear.app/threadbare/issue/THR-1809/a-ready-opening-gift-waits-for-a-quiet-moment-never-opens-over-a)), merged via [#2313](https://github.com/christianspliid-ui/threadbare/pull/2313) and serving on the live site.

## Health

- **Heavy simulation tests are still red on the latest main** ([CI runs](https://github.com/christianspliid-ui/threadbare/actions/workflows/heavy-tests.yml)): *"\"Heavy simulation tests\" is red on the latest main (4 h) — a follow-up fix is owed; log it as an impediment row if no session has claimed it."* Four main commits in a row have failed since 17:33 UTC. The newest run fails a different test from the last one: "milestone triggered flag persists — no re-emission after first crossing" in `doomIdentityMilestones.test.ts`, which took 15.5 s and may be a timeout rather than a defect ([latest run](https://github.com/christianspliid-ui/threadbare/actions/runs/38086467350)). No session has claimed the fix, and the board is empty. This is executor work, not yours.
- Everything else is green. The live site is serving the latest main, no pull requests are open or stuck, automated checks are running normally, every scheduled lane is on time, and the engine's speed is flat (108 ms per tick, 10% under the weekly median).
