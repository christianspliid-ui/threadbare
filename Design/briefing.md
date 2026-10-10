# Briefing
**Generated:** 2026-10-10 18:55 local (16:55 UTC) · keep-work-flowing-cc

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
- [The opposing dominion as a force](https://linear.app/threadbare/issue/THR-1763/the-opposing-dominion-as-a-force-who-pushes-back-how-fast-turf-erodes) — turf is lost to **neglect** (an untended place drops a band in about three weeks), **rival gods** (they raid your untended ground with your opposite spheres) and **doom** (as today). One Claim or one threaded mortal keeps a place. You can lose everything you took, but never your seat. *To veto, say:* **"losing ground should be able to drive me from my home"**, **"untended turf shouldn't fade on its own"** or **"doom should aim at my turf"**. *— from the [design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-09d.md)* (its veto window closes about 20:30 tonight)

Say "veto <title>" to reverse any of these.

## Queue

**Healthy: 5 jobs ready, 1 being built.** Nothing ready is older than 4 days or blocked; no parked jobs.

- **Being built now:** the five small faults from [cold playtest round 3](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/cold-playtest-round-3.md) ([THR-1804](https://linear.app/threadbare/issue/THR-1804/five-small-faults-from-cold-playtest-round-3-setup-cards-take-clicks)) — the fix is up for review as [#2306](https://github.com/christianspliid-ui/threadbare/pull/2306), not yet set to merge. Nothing here needs a decision from you.
- **Now live:** the choice screen states only the paying sphere's essence, not all twelve summed ([THR-1803](https://linear.app/threadbare/issue/THR-1803/recurs-after-fix-essence-tells-three-stories-the-authored-choice), via [#2305](https://github.com/christianspliid-ui/threadbare/pull/2305)).

## Health

- **Heavy simulation tests are still red on the latest main** (about 4 hours now) ([CI runs](https://github.com/christianspliid-ui/threadbare/actions/workflows/heavy-tests.yml)). No session has claimed it. This is executor work, not yours.
- Speed check flagged again: *"tick cost 261 ms/tick steady, 118% above the 7-day median (120, 121 rows since 39fed17e); top phase agent_decision, 609 agents. Name the merges between 39fed17e and 57da1b5b: git log --oneline --merges 39fed17e..57da1b5b"* — the same code read 126 last hour, so this is most likely the machine being busy (a build session is running), not a slowdown. Executor work if it repeats.
- Everything else is green. The live site serves the newest merge, no pull requests are stuck, automated checks run normally, every scheduled lane is on time, and the worktree cleaner ran at 18:40.
