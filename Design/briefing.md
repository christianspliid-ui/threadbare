# Briefing
**Generated:** 2026-09-25 12:58 local (10:58 UTC) · keep-work-flowing-cc

## The one thing

**Finish the playthrough. Two encounters are left, and nothing on screen is broken** ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with)).

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

The one question: **are the encounters good enough together?** A pass unlocks the next stage, where encounters reach into factions, war, economy and divine actions. When you are done, say **"work the map"** in a chat.

**Why now:** it is still the ask that unblocks the most work. The links above open both encounters directly.

## Also waiting (3)

- **Turn off Linear's auto-complete for sub-issues** at [Team settings → General](https://linear.app/threadbare/settings/teams/THR/general). On Sunday it closed five jobs that nobody had built. *— from tb-orchestrator*
- **Were you away from the app on Monday 14 and Tuesday 15 September?** *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md)*
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

## Queue

**Backed up: 26 jobs are ready, none in progress, and none parked.** Most are bug tickets from this morning's research, not a stall. The builder picks up hourly.

- Merged since the last brief: **the title menu no longer shows developer screens** ([THR-1601](https://linear.app/threadbare/issue/THR-1601), [#2043](https://github.com/christianspliid-ui/threadbare/pull/2043)). It is live on the site.
- **Living-world map, two more answers** (no ask — *from tb-orchestrator*): [each town raises one existing resident to a notable](https://linear.app/threadbare/issue/THR-1593) with property, a quarrel and a secret; [each hero starts with a relative, a friend and a rival](https://linear.app/threadbare/issue/THR-1594) plus standing in their realm. Both fit the speed budget.
- New from that research: [heroes' starting faction membership carries no standing](https://linear.app/threadbare/issue/THR-1620), so faction quests never reach them. It has no priority set yet.
- Still High: [social, tavern and secret encounters never fire](https://linear.app/threadbare/issue/THR-1614), [Mercenary Company encounters can never be drawn](https://linear.app/threadbare/issue/THR-1612), [six seed families wither on planting](https://linear.app/threadbare/issue/THR-1613), [internal ids in the chronicle](https://linear.app/threadbare/issue/THR-1602), [the cold playtest loop](https://linear.app/threadbare/issue/THR-1610).
- Medium and Low from the same research: [a dead trade route can still be claimed](https://linear.app/threadbare/issue/THR-1615), [non-casters try to learn spells and always fail](https://linear.app/threadbare/issue/THR-1617), [the Builder's Legacy mandate is complete at the start](https://linear.app/threadbare/issue/THR-1618), [route-building aims at the builder's own town](https://linear.app/threadbare/issue/THR-1619), [waypoints clutter the map's places](https://linear.app/threadbare/issue/THR-1616).
- Fight system: still not ready for your review. [The fight chips](https://linear.app/threadbare/issue/THR-1553) and [the duel winner's choice](https://linear.app/threadbare/issue/THR-1557) are still to come.
- Also queued: [five small interface faults](https://linear.app/threadbare/issue/THR-1604), [the cast receipt with no subject](https://linear.app/threadbare/issue/THR-1603), [chronicle headline id](https://linear.app/threadbare/issue/THR-1585), [Monster as a world object](https://linear.app/threadbare/issue/THR-1559), [commander deleted, not marked dead](https://linear.app/threadbare/issue/THR-1566), [item bursts](https://linear.app/threadbare/issue/THR-1568), [wards](https://linear.app/threadbare/issue/THR-1569), [wayside encounters](https://linear.app/threadbare/issue/THR-1567), [monster portraits](https://linear.app/threadbare/issue/THR-1554), [colocation chance](https://linear.app/threadbare/issue/THR-1576), [blood-soaked ground](https://linear.app/threadbare/issue/THR-1528), [seed targets](https://linear.app/threadbare/issue/THR-1565), [the Follow button's wording](https://linear.app/threadbare/issue/THR-1573).

## Health

- **Heavy simulation tests are still red on the latest `main`** (4 hours). The next builder owes a fix. Not yours.
- **Tick cost is normal: 77 ms per tick**, 13% over the 7-day median of 68 — inside the 25% band.
- **Lane silence:** the worst recent gap was 25 hours, from Saturday 19 into Sunday 20. It falls on a weekend, so your 11 September ruling declines it.
- **Worktree reaper:** ran at 12:40; 5 worktrees are waiting to be sorted. That is routine.
- **Everything else is green.** The live site is serving the latest build (13daf0f0). CI is green, and no pull requests are waiting. All nine scheduled lanes are on time. The design lane's first run is at 14:17 local today. The home tree is on `main` and current.
