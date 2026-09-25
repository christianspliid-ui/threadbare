# Briefing
**Generated:** 2026-09-25 09:58 local (07:58 UTC) · keep-work-flowing-cc

## The one thing

**Finish the playthrough. Two encounters are left, and nothing on screen is broken** ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with)).

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

The one question: **are the encounters good enough together?** A pass unlocks the next stage, where encounters reach into factions, war, economy and divine actions. When you are done, say **"work the map"** in a chat.

**Why now:** it is still the ask that unblocks the most work. These two encounters rarely turn up in normal play ([THR-1567](https://linear.app/threadbare/issue/THR-1567/three-wayside-only-slice-encounters-almost-never-fire-the-unsafe) will fix that), but the links above open them directly.

## Also waiting (4)

- **Turn off Linear's auto-complete for sub-issues** at [Team settings → General](https://linear.app/threadbare/settings/teams/THR/general). On Sunday it closed five jobs that nobody had built. *— from tb-orchestrator*
- **May the planning lane write first-draft designs itself?** Three design jobs are waiting for a design session: [items](https://linear.app/threadbare/issue/THR-1570), [power runtime](https://linear.app/threadbare/issue/THR-1571), [spells](https://linear.app/threadbare/issue/THR-1572). *— from tb-orchestrator*
- **Were you away from the app on Monday 14 and Tuesday 15 September?** *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md)*
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

## Queue

**Backed up: twenty jobs are ready, none in progress, and no jobs are parked.** The jump from fourteen is this morning's work, not a stall: your cold playtest filed its bugs, plus the loop that reruns it and a living-world check. The builder picks up hourly.

- Merged since the last brief: **mortals who walk into a lair now have to fight its monster** ([THR-1547](https://linear.app/threadbare/issue/THR-1547/monsters-m4-walking-into-the-lair), [#2033](https://github.com/christianspliid-ui/threadbare/pull/2033)). It merged at 09:39 local and is live on the site. The fight system is still not ready for your review: [the fight chips](https://linear.app/threadbare/issue/THR-1553/fight-on-screen-f3-fight-chips) and [the duel winner's choice](https://linear.app/threadbare/issue/THR-1557/duels-e2-the-victor-decides) are still to come.
- New, High, from the cold playtest: [dev screens leak into the title menu](https://linear.app/threadbare/issue/THR-1601), [internal ids in the chronicle](https://linear.app/threadbare/issue/THR-1602), [a raw `{name}` in "Story so far"](https://linear.app/threadbare/issue/THR-1600), and [the cold playtest loop](https://linear.app/threadbare/issue/THR-1610) itself. Medium: [five small interface faults](https://linear.app/threadbare/issue/THR-1604) and [the cast receipt with no subject](https://linear.app/threadbare/issue/THR-1603).
- New, High: [living-world seeding has drifted since it shipped](https://linear.app/threadbare/issue/THR-1588) — the builder diagnoses, then restores or re-baselines.
- Medium: [Chronicle headline showing an internal id](https://linear.app/threadbare/issue/THR-1585), [Monster as a world object](https://linear.app/threadbare/issue/THR-1559), [commander deleted, not marked dead](https://linear.app/threadbare/issue/THR-1566), [item bursts](https://linear.app/threadbare/issue/THR-1568), [wards](https://linear.app/threadbare/issue/THR-1569), [wayside encounters](https://linear.app/threadbare/issue/THR-1567).
- Low: [monster portraits](https://linear.app/threadbare/issue/THR-1554), [colocation chance](https://linear.app/threadbare/issue/THR-1576), [blood-soaked ground](https://linear.app/threadbare/issue/THR-1528), [seed targets](https://linear.app/threadbare/issue/THR-1565), [the Follow button's wording](https://linear.app/threadbare/issue/THR-1573).

## Health

- **Heavy simulation tests are still red on the latest `main`** (about 2 hours now). It is the slow `yieldBandCells.test.ts` running just over its 5-second limit — a timeout, not a defect. No session has claimed it; the next builder owes a fix. Not yours.
- **Lane silence:** the worst recent gap was 25 hours, from Saturday 19 into Sunday 20. It falls on a weekend, so your 11 September ruling declines it.
- **Worktree reaper:** 5 worktrees are waiting to be sorted. That is routine.
- **Everything else is green.** Tick cost is 63 ms per tick, 8% below the 7-day median of 68. The live site is current (only docs have merged since the last build). CI is green and no pull requests are waiting. All nine scheduled lanes are on time, and the home tree is current on `main`.
