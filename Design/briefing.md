# Briefing
**Generated:** 2026-09-26 01:56 local (23:56 UTC) · keep-work-flowing-cc

## The one thing

**Finish the playthrough. Two encounters are left, and nothing on screen is broken** ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with)).

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

The one question: **are the encounters good enough together?** A pass unlocks the next stage, where encounters reach into factions, war, economy and divine actions. When you are done, say **"work the map"** in a chat.

**New this hour:** both of these encounters can now also happen out in the countryside, not only near towns ([THR-1567](https://linear.app/threadbare/issue/THR-1567), live). The links above still open them directly.

## Also waiting (4)

- **How much history should a new world start with?** ([THR-1591](https://linear.app/threadbare/issue/THR-1591)) Samples to react to: [seed 42](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1591-world-with-a-past/Docs/audits/2026-09-25-living-world-data/proto-thr-1591/sample-seed-42.md), [seed 99](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1591-world-with-a-past/Docs/audits/2026-09-25-living-world-data/proto-thr-1591/sample-seed-99.md). Recommended: **A, explain the map** (town foundings, one ancient war, 2–3 recent wars, 5–10 named dead). *— from tb-design-lane*
- **Turn off Linear's auto-complete for sub-issues** at [Team settings → General](https://linear.app/threadbare/settings/teams/THR/general). On Sunday it closed five jobs that nobody had built. *— from tb-orchestrator*
- **Were you away from the app on Monday 14 and Tuesday 15 September?** *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md)*
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

## Decided for you

- [Culture and spheres showing through](https://linear.app/threadbare/issue/THR-1599): culture and a place's sphere show in an encounter as **one extra sentence stating a local fact that bears on the test** (e.g. "half the town has turned out to watch"). Nothing is rewritten per culture; the sphere line appears only where one sphere clearly dominates (about 1 place in 4); card colours stay. Samples: [seed 42](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1599-culture-sphere-layer/Docs/audits/2026-09-25-living-world-data/proto-thr-1599/sample-seed-42.md) · [seed 99](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1599-culture-sphere-layer/Docs/audits/2026-09-25-living-world-data/proto-thr-1599/sample-seed-99.md). *— from tb-design-lane*

Say "veto <title>" to reverse any of these.

## Queue

**Backed up: 19 jobs are ready and nothing is being built right now. None are parked.** Most are bug tickets from yesterday's research and the cold playtest; the pickup lane takes the next one at its next hourly slot. Since last hour, [wayside encounters reach the countryside](https://linear.app/threadbare/issue/THR-1567) (merged via [#2057](https://github.com/christianspliid-ui/threadbare/pull/2057), live).

- **Fight system: nearly level, not yet a review ask.** Everything is live except [the lair elites' portraits](https://linear.app/threadbare/issue/THR-1554) (queued).
- [Heroes' starting faction membership carries no standing](https://linear.app/threadbare/issue/THR-1620). It still has no priority set.
- Also queued: [place pages and mortal cards never describe culture](https://linear.app/threadbare/issue/THR-1623), [culture names show raw map words](https://linear.app/threadbare/issue/THR-1622), [five small interface faults](https://linear.app/threadbare/issue/THR-1604), [the cast receipt with no subject](https://linear.app/threadbare/issue/THR-1603), [hex lore repeats one sentence](https://linear.app/threadbare/issue/THR-1621), [chronicle headline id](https://linear.app/threadbare/issue/THR-1585), [dead trade route still claimable](https://linear.app/threadbare/issue/THR-1615), [non-casters try to learn spells](https://linear.app/threadbare/issue/THR-1617), [Builder's Legacy complete at start](https://linear.app/threadbare/issue/THR-1618), [route-building aims at home](https://linear.app/threadbare/issue/THR-1619), [waypoint clutter](https://linear.app/threadbare/issue/THR-1616), [item bursts](https://linear.app/threadbare/issue/THR-1568), [wards](https://linear.app/threadbare/issue/THR-1569), [colocation chance](https://linear.app/threadbare/issue/THR-1576), [blood-soaked ground](https://linear.app/threadbare/issue/THR-1528), [seed targets](https://linear.app/threadbare/issue/THR-1565), [the Follow button's wording](https://linear.app/threadbare/issue/THR-1573).

## Health

- **Heavy simulation tests are still red on main (builder's job, not yours):** the slow tests hit their time limit. This check does not block merges.
- **Lane silence:** the worst recent gap was 25 hours, from Saturday 19 into Sunday 20. It falls on a weekend, so your 11 September ruling declines it.
- **Worktree reaper:** ran 01:40 local; 5 worktrees are waiting to be sorted. That is routine.
- **Everything else is green.** The live site is serving the latest build (6a7374ae). All ten scheduled lanes are on time. No pull requests are waiting. Tick cost is 80 ms/tick, 15% above the weekly median, under the alarm line. The home tree is on `main` and current.
