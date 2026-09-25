# Briefing
**Generated:** 2026-09-25 11:56 local (09:56 UTC) · keep-work-flowing-cc

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

**Backed up: 26 jobs are ready, none in progress, and none parked.** The rise is new bug tickets from this morning's research, not a stall. The builder picks up hourly.

- Merged since the last brief: **"Story so far" no longer shows a raw `{name}`** ([THR-1600](https://linear.app/threadbare/issue/THR-1600), [#2039](https://github.com/christianspliid-ui/threadbare/pull/2039)). It is live on the site. Two research write-ups also landed: [what the player actually meets](https://linear.app/threadbare/issue/THR-1590) and [seeded things that die](https://linear.app/threadbare/issue/THR-1595).
- **New, High: [social, tavern and secret encounters never fire](https://linear.app/threadbare/issue/THR-1614).** They are all written, but a filter cuts every one. This is the biggest thing between the player and a world that feels alive.
- New, Medium and Low, from the same research: [a dead trade route can still be claimed](https://linear.app/threadbare/issue/THR-1615), [non-casters try to learn spells and always fail](https://linear.app/threadbare/issue/THR-1617), [the Builder's Legacy mandate is complete at the start](https://linear.app/threadbare/issue/THR-1618), [route-building aims at the builder's own town](https://linear.app/threadbare/issue/THR-1619), [waypoints clutter the map's places](https://linear.app/threadbare/issue/THR-1616).
- Still High: [Mercenary Company encounters can never be drawn](https://linear.app/threadbare/issue/THR-1612), [six seed families wither on planting](https://linear.app/threadbare/issue/THR-1613), [dev screens in the title menu](https://linear.app/threadbare/issue/THR-1601), [internal ids in the chronicle](https://linear.app/threadbare/issue/THR-1602), [the cold playtest loop](https://linear.app/threadbare/issue/THR-1610).
- Fight system: still not ready for your review. [The fight chips](https://linear.app/threadbare/issue/THR-1553) and [the duel winner's choice](https://linear.app/threadbare/issue/THR-1557) are still to come.
- Also queued: [five small interface faults](https://linear.app/threadbare/issue/THR-1604), [the cast receipt with no subject](https://linear.app/threadbare/issue/THR-1603), [chronicle headline id](https://linear.app/threadbare/issue/THR-1585), [Monster as a world object](https://linear.app/threadbare/issue/THR-1559), [commander deleted, not marked dead](https://linear.app/threadbare/issue/THR-1566), [item bursts](https://linear.app/threadbare/issue/THR-1568), [wards](https://linear.app/threadbare/issue/THR-1569), [wayside encounters](https://linear.app/threadbare/issue/THR-1567), [monster portraits](https://linear.app/threadbare/issue/THR-1554), [colocation chance](https://linear.app/threadbare/issue/THR-1576), [blood-soaked ground](https://linear.app/threadbare/issue/THR-1528), [seed targets](https://linear.app/threadbare/issue/THR-1565), [the Follow button's wording](https://linear.app/threadbare/issue/THR-1573).

## Health

- **Heavy simulation tests are still red on the latest `main`** (4 hours). Last hour's reading was the slow `yieldBandCells.test.ts` timing out, not a defect. The next builder owes a fix. Not yours.
- **Tick cost is back to normal: 67 ms per tick**, 2% under the 7-day median. Last hour's 88 was a one-off sample.
- **Lane silence:** the worst recent gap was 25 hours, from Saturday 19 into Sunday 20. It falls on a weekend, so your 11 September ruling declines it.
- **Worktree reaper:** 5 worktrees are waiting to be sorted. That is routine.
- **Everything else is green.** The live site is serving the latest game build. CI is green, and no pull requests are waiting. All nine scheduled lanes are on time. The design lane's first run is at 14:17 local today. The home tree is on `main`, 3 docs-only commits behind, which autosync catches up.
