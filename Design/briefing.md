# Briefing
**Generated:** 2026-09-25 21:54 local (19:54 UTC) · keep-work-flowing-cc

## The one thing

**Finish the playthrough. Two encounters are left, and nothing on screen is broken** ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with)).

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

The one question: **are the encounters good enough together?** A pass unlocks the next stage, where encounters reach into factions, war, economy and divine actions. When you are done, say **"work the map"** in a chat.

**Why now:** it is still the ask that unblocks the most work. The links above open both encounters directly.

## Also waiting (4)

- **New — how much history should a new world start with?** ([THR-1591](https://linear.app/threadbare/issue/THR-1591)) Samples to react to: [seed 42](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1591-world-with-a-past/Docs/audits/2026-09-25-living-world-data/proto-thr-1591/sample-seed-42.md), [seed 99](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1591-world-with-a-past/Docs/audits/2026-09-25-living-world-data/proto-thr-1591/sample-seed-99.md). Recommended: **A, explain the map** (town foundings, one ancient war, 2–3 recent wars, 5–10 named dead). *— from tb-design-lane*
- **Turn off Linear's auto-complete for sub-issues** at [Team settings → General](https://linear.app/threadbare/settings/teams/THR/general). On Sunday it closed five jobs that nobody had built. *— from tb-orchestrator*
- **Were you away from the app on Monday 14 and Tuesday 15 September?** *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md)*
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

## Queue

**Backed up: 21 jobs are ready and none are in progress. None are parked.** Most are bug tickets from today's research and the cold playtest, not a stall. The builder's next hourly run is about 22:11 local.

- **Merged since the last brief:** [Monster as a world object](https://linear.app/threadbare/issue/THR-1559) ([#2052](https://github.com/christianspliid-ui/threadbare/pull/2052)) and [grudges boil over into duels](https://linear.app/threadbare/issue/THR-1558) ([#2053](https://github.com/christianspliid-ui/threadbare/pull/2053)). Both are live on the site.
- Fight system: still not ready for your review. Two pieces are left: [the hunt itself](https://linear.app/threadbare/issue/THR-1560) (now queued for building) and [chips for a duel's loser](https://linear.app/threadbare/issue/THR-1561) (not yet queued).
- New: [culture names show raw map words](https://linear.app/threadbare/issue/THR-1622) ("The Open Earth of the mountain_pass").
- [Heroes' starting faction membership carries no standing](https://linear.app/threadbare/issue/THR-1620). It still has no priority set.
- Cold-playtest fixes still queued: [five small interface faults](https://linear.app/threadbare/issue/THR-1604), [the cast receipt with no subject](https://linear.app/threadbare/issue/THR-1603), [hex lore repeats one sentence](https://linear.app/threadbare/issue/THR-1621).
- Also queued: [chronicle headline id](https://linear.app/threadbare/issue/THR-1585), [dead trade route still claimable](https://linear.app/threadbare/issue/THR-1615), [non-casters try to learn spells](https://linear.app/threadbare/issue/THR-1617), [Builder's Legacy complete at start](https://linear.app/threadbare/issue/THR-1618), [route-building aims at home](https://linear.app/threadbare/issue/THR-1619), [waypoint clutter](https://linear.app/threadbare/issue/THR-1616), [commander deleted, not marked dead](https://linear.app/threadbare/issue/THR-1566), [item bursts](https://linear.app/threadbare/issue/THR-1568), [wards](https://linear.app/threadbare/issue/THR-1569), [wayside encounters](https://linear.app/threadbare/issue/THR-1567), [monster portraits](https://linear.app/threadbare/issue/THR-1554), [colocation chance](https://linear.app/threadbare/issue/THR-1576), [blood-soaked ground](https://linear.app/threadbare/issue/THR-1528), [seed targets](https://linear.app/threadbare/issue/THR-1565), [the Follow button's wording](https://linear.app/threadbare/issue/THR-1573).

## Health

- **Tick cost has crossed the alarm line (builder's job, not yours):** tick cost 87 ms/tick steady, 27% above the 7-day median (68, 107 rows since 38edc797); top phase agent_decision, 498 agents. Name the merges between 38edc797 and 3e27003a: `git log --oneline --merges 38edc797..3e27003a`
- **Heavy simulation tests are red three runs in a row on main (builder's job, not yours):** [latest run](https://github.com/christianspliid-ui/threadbare/actions/runs/36181417921). Three tests in `peopleThingsCells` and `yieldBandCells` hit the 5-second limit. That matches the slower ticks above, so the game is slower, not broken. This check does not block merges.
- **Lane silence:** the worst recent gap was 25 hours, from Saturday 19 into Sunday 20. It falls on a weekend, so your 11 September ruling declines it.
- **Worktree reaper:** 5 worktrees are waiting to be sorted. That is routine.
- **Everything else is green.** The live site is serving the latest build (3e27003a). All ten scheduled lanes are on time. No pull requests are waiting. The home tree is on `main` and current.
