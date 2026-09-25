# Briefing
**Generated:** 2026-09-25 16:56 local (14:56 UTC) · keep-work-flowing-cc

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

**Backed up: 23 jobs are ready and none are in progress. None are parked.** Most are bug tickets from this morning's research, not a stall. The builder picks up hourly; its next run is about 17:11 local.

- Merged since the last brief: **social, tavern and secret encounters fire again** — they now get their own reserved places when the game trims the list of possible encounters ([THR-1614](https://linear.app/threadbare/issue/THR-1614), [#2047](https://github.com/christianspliid-ui/threadbare/pull/2047)). It is live on the site.
- **The living-world map has no research left** (no ask — *from tb-orchestrator*). Next comes filling the missing "success, but at a cost" text and card hands in the ten most-drawn encounters ([THR-1598](https://linear.app/threadbare/issue/THR-1598)). Decided for you, veto welcome: gap-filling in existing encounters is checked by a reviewer agent instead of your "sample 2 of 6"; brand-new encounters still get your sample.
- Still High: [the cold playtest loop](https://linear.app/threadbare/issue/THR-1610).
- [Heroes' starting faction membership carries no standing](https://linear.app/threadbare/issue/THR-1620). It still has no priority set.
- Fight system: still not ready for your review. [The fight chips](https://linear.app/threadbare/issue/THR-1553) and [the duel winner's choice](https://linear.app/threadbare/issue/THR-1557) are still to come.
- Also queued: [five small interface faults](https://linear.app/threadbare/issue/THR-1604), [the cast receipt with no subject](https://linear.app/threadbare/issue/THR-1603), [chronicle headline id](https://linear.app/threadbare/issue/THR-1585), [hex lore repeats one sentence](https://linear.app/threadbare/issue/THR-1621), [dead trade route still claimable](https://linear.app/threadbare/issue/THR-1615), [non-casters try to learn spells](https://linear.app/threadbare/issue/THR-1617), [Builder's Legacy complete at start](https://linear.app/threadbare/issue/THR-1618), [route-building aims at home](https://linear.app/threadbare/issue/THR-1619), [waypoint clutter](https://linear.app/threadbare/issue/THR-1616), [Monster as a world object](https://linear.app/threadbare/issue/THR-1559), [commander deleted, not marked dead](https://linear.app/threadbare/issue/THR-1566), [item bursts](https://linear.app/threadbare/issue/THR-1568), [wards](https://linear.app/threadbare/issue/THR-1569), [wayside encounters](https://linear.app/threadbare/issue/THR-1567), [monster portraits](https://linear.app/threadbare/issue/THR-1554), [colocation chance](https://linear.app/threadbare/issue/THR-1576), [blood-soaked ground](https://linear.app/threadbare/issue/THR-1528), [seed targets](https://linear.app/threadbare/issue/THR-1565), [the Follow button's wording](https://linear.app/threadbare/issue/THR-1573).

## Health

- **Heavy simulation tests are green again** on the latest `main` ([run](https://github.com/christianspliid-ui/threadbare/actions/runs/36147970763)), after about four hours red.
- **Tick cost is normal:** 76 ms/tick, 11% above the weekly median. That is inside the 25% line.
- **Lane silence:** the worst recent gap was 25 hours, from Saturday 19 into Sunday 20. It falls on a weekend, so your 11 September ruling declines it.
- **Worktree reaper:** 5 worktrees are waiting to be sorted. That is routine.
- **Everything else is green.** The live site is serving the latest build (1a0d803e). CI is green, and no pull requests are waiting. All ten scheduled lanes are on time. The design lane left no report since its 14:18 run, so it had nothing to decide. The weekly retro runs at about 17:04 today. The home tree is on `main` and current.
