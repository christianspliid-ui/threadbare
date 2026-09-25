# Briefing
**Generated:** 2026-09-25 17:58 local (15:58 UTC) · keep-work-flowing-cc

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

**Backed up: 22 jobs are ready and none are in progress. None are parked.** Most are bug tickets from this morning's research and the cold playtest, not a stall. The builder picks up hourly; its next run is about 18:11 local.

- Merged since the last brief: **the cold playtest loop** ([THR-1610](https://linear.app/threadbare/issue/THR-1610), [#2049](https://github.com/christianspliid-ui/threadbare/pull/2049)). Fresh testers who have never seen the game now play it through a harness and report back, once a day. Round 2 runs on its own when every round-1 fix has shipped. It is live on the site.
- **Decided for you earlier today, veto welcome** *(from tb-orchestrator)*: gap-filling in the ten most-drawn encounters ([THR-1598](https://linear.app/threadbare/issue/THR-1598)) is checked by a reviewer agent instead of your "sample 2 of 6". Brand-new encounters still get your sample.
- [Heroes' starting faction membership carries no standing](https://linear.app/threadbare/issue/THR-1620). It still has no priority set.
- Fight system: still not ready for your review. [The fight chips](https://linear.app/threadbare/issue/THR-1553) and [the duel winner's choice](https://linear.app/threadbare/issue/THR-1557) are still to come.
- Cold-playtest fixes still queued: [five small interface faults](https://linear.app/threadbare/issue/THR-1604), [the cast receipt with no subject](https://linear.app/threadbare/issue/THR-1603), [hex lore repeats one sentence](https://linear.app/threadbare/issue/THR-1621).
- Also queued: [chronicle headline id](https://linear.app/threadbare/issue/THR-1585), [dead trade route still claimable](https://linear.app/threadbare/issue/THR-1615), [non-casters try to learn spells](https://linear.app/threadbare/issue/THR-1617), [Builder's Legacy complete at start](https://linear.app/threadbare/issue/THR-1618), [route-building aims at home](https://linear.app/threadbare/issue/THR-1619), [waypoint clutter](https://linear.app/threadbare/issue/THR-1616), [Monster as a world object](https://linear.app/threadbare/issue/THR-1559), [commander deleted, not marked dead](https://linear.app/threadbare/issue/THR-1566), [item bursts](https://linear.app/threadbare/issue/THR-1568), [wards](https://linear.app/threadbare/issue/THR-1569), [wayside encounters](https://linear.app/threadbare/issue/THR-1567), [monster portraits](https://linear.app/threadbare/issue/THR-1554), [colocation chance](https://linear.app/threadbare/issue/THR-1576), [blood-soaked ground](https://linear.app/threadbare/issue/THR-1528), [seed targets](https://linear.app/threadbare/issue/THR-1565), [the Follow button's wording](https://linear.app/threadbare/issue/THR-1573).

## Health

- **Heavy simulation tests are red again** on the latest `main` (a79155fd, [run](https://github.com/christianspliid-ui/threadbare/actions/runs/36155658854)). Two world-simulation tests hit the 5-second time limit (`yieldBandCells`, `peopleThingsCells`); nothing asserted wrong. It looks like the slow-runner flake seen earlier today, not a defect. Builder's job to confirm; not yours.
- **Lane silence:** the worst recent gap was 25 hours, from Saturday 19 into Sunday 20. It falls on a weekend, so your 11 September ruling declines it.
- **Worktree reaper:** 5 worktrees are waiting to be sorted (last run 17:40). That is routine.
- **Everything else is green.** The live site is serving the latest build (a79155fd). CI is green, and no pull requests are waiting. All ten scheduled lanes are on time. The design lane has left no report today, so it had nothing to decide. Tick cost is normal (79 ms/tick). The home tree is on `main` and current.
