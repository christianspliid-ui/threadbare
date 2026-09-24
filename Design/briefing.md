# Briefing
**Generated:** 2026-09-24 10:56 local (08:56 UTC) · keep-work-flowing-cc

## The one thing

**Finish the sitting: two encounters are left, and nothing on screen is broken** ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with)).

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

The one question: **is the integrated encounter experience good enough?** A pass unlocks the next stage, where encounters reach into factions, war, economy and divine actions. Say **"work the map"** in a chat when you are done.

**Why now:** the first of your three morning designs has already shipped. [The spotlight pull](https://linear.app/threadbare/issue/THR-1523/spotlight-pull-the-swap-pool-is-the-handful-of-ambition-less-seeded) merged at 10:43 via [#2007](https://github.com/christianspliid-ui/threadbare/pull/2007). The other two are queued for the builder. This sitting unblocks the most work after them. These two encounters rarely turn up in normal play ([THR-1567](https://linear.app/threadbare/issue/THR-1567/three-wayside-only-slice-encounters-almost-never-fire-the-unsafe) is fixing that), but the links above open them directly.

## Also waiting (5)

- **Turn off Linear's auto-complete for sub-issues** at [Team settings → General](https://linear.app/threadbare/settings/teams/THR/general). On Sunday it closed five jobs that nobody had built. *— from tb-orchestrator*
- **The odds shown are not the odds rolled ([THR-1535](https://linear.app/threadbare/issue/THR-1535/the-odds-shown-are-not-the-odds-rolled-the-unified-road-never-reads-a)).** Are you OK with that balance shift landing unattended, after the fight block? *— from tb-orchestrator*
- **May the planning lane write first-draft designs itself?** Three design jobs are waiting for a design session: [items](https://linear.app/threadbare/issue/THR-1570), [power runtime](https://linear.app/threadbare/issue/THR-1571), [spells](https://linear.app/threadbare/issue/THR-1572). *— from tb-orchestrator*
- **Were you away from the app on Monday 14 and Tuesday 15 September?** *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md)*
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

## Queue

**Healthy: nine jobs ready, none in progress, no parked jobs.** The builder's next run is at about 11:11.
- **Top of the queue is [FB4: the forks](https://linear.app/threadbare/issue/THR-1540/fight-block-fb4-the-forks)** (High). Mid-fight, a fighter decides whether to yield or fight on.
- New since last hour: [a commander killed in battle is deleted, not marked dead](https://linear.app/threadbare/issue/THR-1566/a-commander-killed-in-battle-is-deleted-not-marked-dead-no-body-no) (Medium). There is no body, no grief and no culprit.
- Still waiting: two of your morning designs, [sequel-only encounters](https://linear.app/threadbare/issue/THR-1526/sequel-only-encounter-templates-are-reachable-from-the-live-board-the) and [blood-soaked ground](https://linear.app/threadbare/issue/THR-1528/battle-history-record-the-substrate-blood-soaked-needs-a-per-location). Also queued: [M1: the monster card](https://linear.app/threadbare/issue/THR-1544/monsters-m1-the-monster-card) and four bug fixes. The fixes cover [item bursts](https://linear.app/threadbare/issue/THR-1568/items-that-promise-a-burst-when-struck-never-give-it-a-reactions-timed), [wards](https://linear.app/threadbare/issue/THR-1569/fear-wards-wound-cures-and-curse-wards-miss-the-real-conditions), [wayside encounters](https://linear.app/threadbare/issue/THR-1567/three-wayside-only-slice-encounters-almost-never-fire-the-unsafe) and [seed targets](https://linear.app/threadbare/issue/THR-1565/three-seed-targets-tell-the-wrong-story-the-healers-grateful-kin-the).

## Health

- **Heavy simulation tests are still red on main** (FB2, [#2000](https://github.com/christianspliid-ui/threadbare/pull/2000), FB3 [#2006](https://github.com/christianspliid-ui/threadbare/pull/2006)). Last hour's cause was one test running out of time. It took 5.3 s against a 5 s limit, and nothing was actually wrong. Fixing it is the builder's job, and no job has been filed for it yet.
- **Lane silence:** the worst recent gap was 25 hours, Saturday 19 into Sunday 20. It falls on a weekend, so your 11 September ruling declines it.
- **Worktree reaper:** 5 worktrees are waiting to be sorted. This is routine.
- Everything else is green:
  - Engine speed is 82 ms/tick, 19% over its weekly median of 69. That is inside the normal range, but it has risen three hours running (65 → 75 → 82).
  - The live site is serving the spotlight-pull merge.
  - CI is healthy, and no pull requests are waiting.
  - All nine scheduled lanes are on time.
