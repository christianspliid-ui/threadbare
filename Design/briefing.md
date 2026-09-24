# Briefing
**Generated:** 2026-09-24 23:58 local (21:58 UTC) · keep-work-flowing-cc

## The one thing

**Finish the playthrough: two encounters are left, and nothing on screen is broken** ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with)).

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

The one question: **are the encounters good enough together?** A pass unlocks the next stage, where encounters reach into factions, war, economy and divine actions. Say **"work the map"** in a chat when you are done.

**Why now:** it is still the ask that unblocks the most work. These two encounters rarely turn up in normal play ([THR-1567](https://linear.app/threadbare/issue/THR-1567/three-wayside-only-slice-encounters-almost-never-fire-the-unsafe) will fix that), but the links above open them directly.

## Also waiting (4)

- **Turn off Linear's auto-complete for sub-issues** at [Team settings → General](https://linear.app/threadbare/settings/teams/THR/general). On Sunday it closed five jobs that nobody had built. *— from tb-orchestrator*
- **May the planning lane write first-draft designs itself?** Three design jobs are waiting for a design session: [items](https://linear.app/threadbare/issue/THR-1570), [power runtime](https://linear.app/threadbare/issue/THR-1571), [spells](https://linear.app/threadbare/issue/THR-1572). *— from tb-orchestrator*
- **Were you away from the app on Monday 14 and Tuesday 15 September?** *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md)*
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

## Queue

**Healthy: twelve jobs ready, none in progress, no parked jobs.** No merges since the last brief.

- **The dice re-fit is back in design. You don't need to decide anything** ([S3](https://linear.app/threadbare/issue/THR-1581/forecast-window-s3-re-fit-the-dice-skill-separates-an-even-match-is-a)). The builder finished it, then stopped at the safety check. The new dice separate skill as you asked, but mortals switched to easy work and success rose to about 80–87%, above the 45–72% target. The fix is to ship it together with [S4](https://linear.app/threadbare/issue/THR-1582/forecast-window-s4-mortals-take-on-challenges-they-can-win-about-half), which pushes mortals toward harder challenges. An agent makes that sequencing call in a design session. The work is safe on a pushed branch ([`thr-1581-dice-refit`](https://github.com/christianspliid-ui/threadbare/tree/thr-1581-dice-refit)), and the game is unchanged. *— from tb-orchestrator*
- Medium: [the odds shown vs rolled](https://linear.app/threadbare/issue/THR-1535/the-odds-shown-are-not-the-odds-rolled-the-unified-road-never-reads-a), [monsters in scenes](https://linear.app/threadbare/issue/THR-1545/monsters-m2-monsters-in-scenes), [monsters named and counted right](https://linear.app/threadbare/issue/THR-1550/fight-on-screen-f1-monsters-named-and-counted-right), [Monster as a world object](https://linear.app/threadbare/issue/THR-1559/hunts-h1-monster-in-the-world-objects-registry), [commander deleted, not marked dead](https://linear.app/threadbare/issue/THR-1566/a-commander-killed-in-battle-is-deleted-not-marked-dead-no-body-no), [item bursts](https://linear.app/threadbare/issue/THR-1568/items-that-promise-a-burst-when-struck-never-give-it-a-reactions-timed), [wards](https://linear.app/threadbare/issue/THR-1569/fear-wards-wound-cures-and-curse-wards-miss-the-real-conditions), [wayside encounters](https://linear.app/threadbare/issue/THR-1567/three-wayside-only-slice-encounters-almost-never-fire-the-unsafe).
- Low: [colocation chance](https://linear.app/threadbare/issue/THR-1576/colocation-chance-pins-at-its-bounds-reach-weights-multiply-the-raw), [blood-soaked ground](https://linear.app/threadbare/issue/THR-1528/battle-history-record-the-substrate-blood-soaked-needs-a-per-location), [seed targets](https://linear.app/threadbare/issue/THR-1565/three-seed-targets-tell-the-wrong-story-the-healers-grateful-kin-the), [the Follow button's wording](https://linear.app/threadbare/issue/THR-1573/the-follow-button-doesnt-say-it-keeps-a-mortal-in-the-spotlight).

## Health

- **Heavy simulation tests went red on the latest merge** ([run](https://github.com/christianspliid-ui/threadbare/actions/runs/36057431266), on the [#2022](https://github.com/christianspliid-ui/threadbare/pull/2022) merge; green on the one before). These tests run after merging and don't block anything. The next build session should fix it. Nobody has claimed it yet.
- **Lane silence:** the worst recent gap was 25 hours, from Saturday 19 into Sunday 20. It falls on a weekend, so your 11 September ruling declines it.
- **Worktree reaper:** 5 worktrees are waiting to be sorted. Routine.
- Everything else is green. Tick cost is 60 ms per tick, 16% below the 7-day median of 72. The live site serves the latest `main` (2242c7ff), no pull requests are waiting, all nine scheduled lanes are on time, and the home tree is current on `main`.
