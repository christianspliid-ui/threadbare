# Briefing
**Generated:** 2026-09-24 13:58 local (11:58 UTC) · keep-work-flowing-cc

## The one thing

**Finish the sitting: two encounters are left, and nothing on screen is broken** ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with)).

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

The one question: **is the integrated encounter experience good enough?** A pass unlocks the next stage, where encounters reach into factions, war, economy and divine actions. Say **"work the map"** in a chat when you are done.

**Why now:** it is still the ask that unblocks the most work. These two encounters rarely turn up in normal play ([THR-1567](https://linear.app/threadbare/issue/THR-1567/three-wayside-only-slice-encounters-almost-never-fire-the-unsafe) is fixing that), but the links above open them directly.

## Also waiting (6)

- **How much should who a mortal is weigh against the situation? ([THR-1575](https://linear.app/threadbare/issue/THR-1575/the-dice-read-every-protagonist-as-a-master-capabilitys-curve))** Right now the dice read nearly every hero as a master of nearly everything. It pairs with THR-1535 below.
- **Turn off Linear's auto-complete for sub-issues** at [Team settings → General](https://linear.app/threadbare/settings/teams/THR/general). On Sunday it closed five jobs that nobody had built. *— from tb-orchestrator*
- **The odds shown are not the odds rolled ([THR-1535](https://linear.app/threadbare/issue/THR-1535/the-odds-shown-are-not-the-odds-rolled-the-unified-road-never-reads-a)).** Are you OK with that balance shift landing unattended, after the fight block? *— from tb-orchestrator*
- **May the planning lane write first-draft designs itself?** Three design jobs are waiting for a design session: [items](https://linear.app/threadbare/issue/THR-1570), [power runtime](https://linear.app/threadbare/issue/THR-1571), [spells](https://linear.app/threadbare/issue/THR-1572). *— from tb-orchestrator*
- **Were you away from the app on Monday 14 and Tuesday 15 September?** *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md)*
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

## Queue

**Healthy: ten jobs ready, none in progress, no parked jobs.** The builder's next run is at about 14:11.
- **Shipped since last hour: [FB5: fight events](https://linear.app/threadbare/issue/THR-1541/fight-block-fb5-fight-events)** merged at 13:38 via [#2012](https://github.com/christianspliid-ui/threadbare/pull/2012) and is live. Traits and items can now react when a fighter is struck, lands a blow or wins. The next fight slice should reach the build queue on the planning lane's next run (about 14:28).
- High: [war news from what really happened](https://linear.app/threadbare/issue/THR-1564/war-news-never-reaches-the-player-in-normal-play-armies-battles-and) and [reach on one scale](https://linear.app/threadbare/issue/THR-1562/ambition-reach-floors-and-reach-milestones-compare-raw-capability-10).
- Medium: [commander deleted, not marked dead](https://linear.app/threadbare/issue/THR-1566/a-commander-killed-in-battle-is-deleted-not-marked-dead-no-body-no), [M1: the monster card](https://linear.app/threadbare/issue/THR-1544/monsters-m1-the-monster-card), [item bursts](https://linear.app/threadbare/issue/THR-1568/items-that-promise-a-burst-when-struck-never-give-it-a-reactions-timed), [wards](https://linear.app/threadbare/issue/THR-1569/fear-wards-wound-cures-and-curse-wards-miss-the-real-conditions), [wayside encounters](https://linear.app/threadbare/issue/THR-1567/three-wayside-only-slice-encounters-almost-never-fire-the-unsafe).
- Low: [blood-soaked ground](https://linear.app/threadbare/issue/THR-1528/battle-history-record-the-substrate-blood-soaked-needs-a-per-location), [seed targets](https://linear.app/threadbare/issue/THR-1565/three-seed-targets-tell-the-wrong-story-the-healers-grateful-kin-the), [the Follow button's wording](https://linear.app/threadbare/issue/THR-1573/the-follow-button-doesnt-say-it-keeps-a-mortal-in-the-spotlight).

## Health

- **Heavy simulation tests are still red on main** (about 4 hours, five runs in a row). Last diagnosed as one test running out of time, not a defect. Fixing it is the builder's job; no job is filed yet.
- **Lane silence:** the worst recent gap was 25 hours, Saturday 19 into Sunday 20. It falls on a weekend, so your 11 September ruling declines it.
- **Worktree reaper:** 5 worktrees are waiting to be sorted. Routine.
- Everything else is green. The engine is back to 79 ms/tick, 12% over its weekly median, which is inside normal. The live site serves the #2012 merge, CI is healthy, no pull requests are waiting, all nine scheduled lanes are on time, and the home tree is current on `main`.
