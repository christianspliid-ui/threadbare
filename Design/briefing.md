# Briefing
**Generated:** 2026-09-24 09:56 local (07:56 UTC) · keep-work-flowing-cc

## The one thing

**Finish the sitting: two encounters are left, and nothing on screen is broken** ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with)).

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

The one question: **is the integrated encounter experience good enough?** A pass unlocks the next stage, where encounters reach into factions, war, economy and divine actions. Say **"work the map"** in a chat when you are done.

**Why now:** your three morning designs are all handed to the builder ([THR-1523](https://linear.app/threadbare/issue/THR-1523/spotlight-pull-the-swap-pool-is-the-handful-of-ambition-less-seeded), [THR-1526](https://linear.app/threadbare/issue/THR-1526/sequel-only-encounter-templates-are-reachable-from-the-live-board-the), [THR-1528](https://linear.app/threadbare/issue/THR-1528/battle-history-record-the-substrate-blood-soaked-needs-a-per-location)). This sitting unblocks the most work after them. Note: these two encounters rarely turn up in normal play ([THR-1567](https://linear.app/threadbare/issue/THR-1567/three-wayside-only-slice-encounters-almost-never-fire-the-unsafe) is fixing that). The links above open them directly, so that does not affect the sitting.

## Also waiting (5)

- **Turn off Linear's auto-complete for sub-issues** at [Team settings → General](https://linear.app/threadbare/settings/teams/THR/general). On Sunday it closed five jobs that nobody had built. *— from tb-orchestrator*
- **The odds shown are not the odds rolled ([THR-1535](https://linear.app/threadbare/issue/THR-1535/the-odds-shown-are-not-the-odds-rolled-the-unified-road-never-reads-a)).** Are you OK with that balance shift landing unattended, after the fight block? *— from tb-orchestrator*
- **May the planning lane write first-draft designs itself?** Three design jobs are waiting for a design session now: [items](https://linear.app/threadbare/issue/THR-1570), [power runtime](https://linear.app/threadbare/issue/THR-1571), [spells](https://linear.app/threadbare/issue/THR-1572). *— from tb-orchestrator*
- **Were you away from the app on Monday 14 and Tuesday 15 September?** *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md)*
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

## Queue

**Healthy: eight jobs ready, none in progress, no parked jobs.** The builder's next run is at about 10:11.
- Your three morning designs are ready to build: [the spotlight pull](https://linear.app/threadbare/issue/THR-1523/spotlight-pull-the-swap-pool-is-the-handful-of-ambition-less-seeded) and [sequel-only encounters](https://linear.app/threadbare/issue/THR-1526/sequel-only-encounter-templates-are-reachable-from-the-live-board-the) (Medium), and [blood-soaked ground](https://linear.app/threadbare/issue/THR-1528/battle-history-record-the-substrate-blood-soaked-needs-a-per-location) (Low).
- [M1: the monster card](https://linear.app/threadbare/issue/THR-1544/monsters-m1-the-monster-card), plus four bug fixes from this morning: [item bursts when struck](https://linear.app/threadbare/issue/THR-1568/items-that-promise-a-burst-when-struck-never-give-it-a-reactions-timed), [fear, wound and curse wards](https://linear.app/threadbare/issue/THR-1569/fear-wards-wound-cures-and-curse-wards-miss-the-real-conditions), [wayside encounters](https://linear.app/threadbare/issue/THR-1567/three-wayside-only-slice-encounters-almost-never-fire-the-unsafe) and [wrong seed targets](https://linear.app/threadbare/issue/THR-1565/three-seed-targets-tell-the-wrong-story-the-healers-grateful-kin-the).
- [FB3: harm, conditions and momentum](https://linear.app/threadbare/issue/THR-1539/fight-block-fb3-harm-conditions-momentum) merged at 09:33 via [#2006](https://github.com/christianspliid-ui/threadbare/pull/2006). FB4 is not in the build queue yet. The orchestrator's hourly unblock sweep is what moves it there.

## Health

- **Heavy simulation tests are red on the last three merges** (FB2, [#2000](https://github.com/christianspliid-ui/threadbare/pull/2000), FB3 [#2006](https://github.com/christianspliid-ui/threadbare/pull/2006); [latest run](https://github.com/christianspliid-ui/threadbare/actions/runs/35970287516)). This time one test ran out of time: `yieldBandCells`, at 5.3 s against a 5 s limit. Nothing asserted wrong. It is the builder's job to fix, and no job has been filed for it yet.
- **Lane silence:** the worst recent gap was 25 hours, Saturday 19 into Sunday 20. It falls on a weekend, so your 11 September ruling declines it.
- **Worktree reaper:** 5 worktrees are waiting to be sorted. This is routine.
- Everything else is green:
  - Engine speed is 75 ms/tick, 9% over its weekly median of 68, which is inside the normal range.
  - The live site is serving the FB3 merge.
  - CI is healthy, and no pull requests are waiting.
  - All nine scheduled lanes are on time.
