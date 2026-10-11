# Briefing
**Generated:** 2026-10-11 06:55 local (04:55 UTC) · keep-work-flowing-cc

## The one thing

**Set the Claude app to open when Windows starts.** Every recent lane silence began when the computer started or woke and the app did not reopen. Only you can change that setting. Say "done" and the next silence check will confirm it. *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md)*

The silence check still reports the Tuesday-to-Thursday gap this setting is meant to close: *"The scheduled lanes went silent for 31.8h (2026-10-06T20:56:43.000Z → 2026-10-08T04:42:41.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time."*

## Also waiting (3)

- **Thursday 1 Oct afternoon and Friday 2 Oct morning:** the computer was on, but no lane ran. Was the Claude app closed?
- **Monday 14 and Tuesday 15 September:** the same thing happened. Was the app closed?
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

Detail for each: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Decided for you

- [How the god's own power grows](https://linear.app/threadbare/issue/THR-1765/how-the-gods-own-power-grows-what-raises-the-gods-sphere-score-across) — your god grows by spending through its spheres: essence drawn through a sphere it bought attunes it a little further, and the mandate's milestones lift it as today. About five growth steps a run, roughly one every two to four weeks. Growth firms up friendly ground and makes signature powers strike harder. Turf stops widening at double strength; past that, deeper ground is won place by place. Nothing fades if you stop spending; you simply stop growing. *To veto, say:* **"my god should keep growing its land"**, **"power should come from deeds, not spending"** or **"unspent power should fade"**. *— from the [design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-10b.md)*
- [Dominion of the secondary actors](https://linear.app/threadbare/issue/THR-1764/dominion-of-the-secondary-actors-how-a-faction-an-army-a-company-or-an) — factions, armies, companies and relics read the people or ground they are made of. A mortal you **bestow** a gift on spreads your spheres faster. A faction you **anoint** keeps its towns on your ground tended and shrugs off one rival raid, but does not grow your turf. Your faithful armies don't fight better on your land by themselves. *To veto, say:* **"my faithful should win on my land"**, **"a relic should hold ground on its own"** or **"anointing should spread my turf, not just defend it"**. *— from the [design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-10a.md)*

Say "veto <title>" to reverse any of these. Both windows close this afternoon (about 13:50 and 14:30).

## Queue

**Starved: 0 jobs ready, 1 being built.** The builder is working through [re-fit the skill readers off the old curve](https://linear.app/threadbare/issue/THR-1580/re-fit-the-non-dice-capability-readers-sight-tiers-growth-gates-one-at) one system at a time. Three pieces are merged and live: social leverage ([#2314](https://github.com/christianspliid-ui/threadbare/pull/2314)), the reputation walk ([#2315](https://github.com/christianspliid-ui/threadbare/pull/2315)) and power and renown ([#2316](https://github.com/christianspliid-ui/threadbare/pull/2316)). The fourth, army gates ([#2317](https://github.com/christianspliid-ui/threadbare/pull/2317)), is waiting on its checks and will merge on green. Nothing is blocked, stale or parked. The [gift waits its turn](https://linear.app/threadbare/issue/THR-1809/a-ready-opening-gift-waits-for-a-quiet-moment-never-opens-over-a) fix is already live. Still waiting in Todo: [chapter results out of sight](https://linear.app/threadbare/issue/THR-1806/on-the-main-map-the-firsts-chapters-end-out-of-sight-the-player), [can't read what they spend or risk](https://linear.app/threadbare/issue/THR-1807), [no direction after the bond](https://linear.app/threadbare/issue/THR-1808) and the [Dominion core](https://linear.app/threadbare/issue/THR-1748/dominion-core-one-graded-read-of-how-much-a-world-object-is-the-gods) build. Next design-lane run ~08:14.

## Health

- **Heavy simulation tests are still red on the latest main** ([CI runs](https://github.com/christianspliid-ui/threadbare/actions/workflows/heavy-tests.yml)): *"\"Heavy simulation tests\" is red on the latest main (9 h) — a follow-up fix is owed; log it as an impediment row if no session has claimed it."* Same timeout already logged as impediment #1167; still unclaimed. Executor work, not yours.
- Everything else is green. The live site is serving the latest main (be173b02), the one open pull request is waiting on its checks, automated checks are running normally, all 11 scheduled lanes are on time, the cleanup job ran at 06:40, and the engine's speed is flat (105 ms per tick, 11% under the weekly median).
