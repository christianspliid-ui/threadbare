# Briefing
**Generated:** 2026-09-25 10:58 local (08:58 UTC) · keep-work-flowing-cc

## The one thing

**Finish the playthrough. Two encounters are left, and nothing on screen is broken** ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with)).

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

The one question: **are the encounters good enough together?** A pass unlocks the next stage, where encounters reach into factions, war, economy and divine actions. When you are done, say **"work the map"** in a chat.

**Why now:** it is still the ask that unblocks the most work. These two encounters rarely turn up in normal play ([THR-1567](https://linear.app/threadbare/issue/THR-1567/three-wayside-only-slice-encounters-almost-never-fire-the-unsafe) will fix that), but the links above open them directly.

## Also waiting (3)

- **Turn off Linear's auto-complete for sub-issues** at [Team settings → General](https://linear.app/threadbare/settings/teams/THR/general). On Sunday it closed five jobs that nobody had built. *— from tb-orchestrator*
- **Were you away from the app on Monday 14 and Tuesday 15 September?** *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md)*
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

## Queue

**Backed up: 21 jobs are ready, none in progress, and none parked.** That is this morning's cold-playtest bugs plus two new content bugs, not a stall. The builder picks up hourly.

- Merged since the last brief: **living-world seeding drift fixed**. Freeholds with no Realm nearby now attach to the nearest settlement, and the drift has been traced to its cause ([THR-1588](https://linear.app/threadbare/issue/THR-1588), [#2037](https://github.com/christianspliid-ui/threadbare/pull/2037), 10:46 local). It is live on the site.
- **Your design lane is live** ([THR-1611](https://linear.app/threadbare/issue/THR-1611)). Its first run is at 14:17 local today. Its decisions will appear here under "Decided for you", each with a veto window. That settles last hour's question about whether a lane may draft designs, so it is off your list.
- New, High: [Mercenary Company encounters can never be drawn](https://linear.app/threadbare/issue/THR-1612) (all 15 lack a reach). [Six seed families wither on planting](https://linear.app/threadbare/issue/THR-1613) (60 of 70 withered seeds).
- High, from the cold playtest: [dev screens in the title menu](https://linear.app/threadbare/issue/THR-1601), [internal ids in the chronicle](https://linear.app/threadbare/issue/THR-1602), [a raw `{name}` in "Story so far"](https://linear.app/threadbare/issue/THR-1600), and [the cold playtest loop](https://linear.app/threadbare/issue/THR-1610). Medium: [five small interface faults](https://linear.app/threadbare/issue/THR-1604), [the cast receipt with no subject](https://linear.app/threadbare/issue/THR-1603).
- Fight system: still not ready for your review. [The fight chips](https://linear.app/threadbare/issue/THR-1553) and [the duel winner's choice](https://linear.app/threadbare/issue/THR-1557) are still to come.
- Medium and Low: [chronicle headline id](https://linear.app/threadbare/issue/THR-1585), [Monster as a world object](https://linear.app/threadbare/issue/THR-1559), [commander deleted, not marked dead](https://linear.app/threadbare/issue/THR-1566), [item bursts](https://linear.app/threadbare/issue/THR-1568), [wards](https://linear.app/threadbare/issue/THR-1569), [wayside encounters](https://linear.app/threadbare/issue/THR-1567), [monster portraits](https://linear.app/threadbare/issue/THR-1554), [colocation chance](https://linear.app/threadbare/issue/THR-1576), [blood-soaked ground](https://linear.app/threadbare/issue/THR-1528), [seed targets](https://linear.app/threadbare/issue/THR-1565), [the Follow button's wording](https://linear.app/threadbare/issue/THR-1573).

## Health

- **Tick cost jumped: 88 ms per tick, 29% above the 7-day median of 68.** The previous hour measured 63. The jump lines up with the living-world fix ([#2037](https://github.com/christianspliid-ui/threadbare/pull/2037)), which is the only merge in between. One sample, so the next hour will confirm it. If it holds, the next builder should profile `agent_decision`. Not yours.
- **Heavy simulation tests were red on the previous three `main` merges.** The cause is the slow `yieldBandCells.test.ts` timing out, not a defect. A run on the latest merge is in progress. The next builder owes a fix. Not yours.
- **Lane silence:** the worst recent gap was 25 hours, from Saturday 19 into Sunday 20. It falls on a weekend, so your 11 September ruling declines it.
- **Worktree reaper:** 5 worktrees are waiting to be sorted. That is routine.
- **Everything else is green.** The live site is serving the latest commit. CI is green, and no pull requests are waiting. All nine scheduled lanes are on time. The design lane has not run yet because its first slot is this afternoon. The home tree is current on `main`.
