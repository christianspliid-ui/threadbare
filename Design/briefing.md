# Briefing
**Generated:** 2026-09-25 02:57 local (00:57 UTC) · keep-work-flowing-cc

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

**Healthy: eleven jobs ready, none in progress, no parked jobs.** One merge since the last brief: **monsters are now named and counted right on the fight screen** ([THR-1550](https://linear.app/threadbare/issue/THR-1550/fight-on-screen-f1-monsters-named-and-counted-right), fight on screen F1, [#2025](https://github.com/christianspliid-ui/threadbare/pull/2025)), merged 02:36 local and live on the site. Not a review ask yet: [how a fight ends](https://linear.app/threadbare/issue/THR-1548/fight-endings-d1-endings-and-the-death-gate) and [what felling a monster does](https://linear.app/threadbare/issue/THR-1546/monsters-m3-what-felling-it-does) are still to come — both were queued for the builder this hour.

- **The dice re-fit is waiting for a design session. You don't need to decide anything** ([S3](https://linear.app/threadbare/issue/THR-1581/forecast-window-s3-re-fit-the-dice-skill-separates-an-even-match-is-a)). It ships together with [S4](https://linear.app/threadbare/issue/THR-1582/forecast-window-s4-mortals-take-on-challenges-they-can-win-about-half). The work is safe on a pushed branch ([`thr-1581-dice-refit`](https://github.com/christianspliid-ui/threadbare/tree/thr-1581-dice-refit)).
- Medium: [fight endings](https://linear.app/threadbare/issue/THR-1548/fight-endings-d1-endings-and-the-death-gate), [felling a monster](https://linear.app/threadbare/issue/THR-1546/monsters-m3-what-felling-it-does), [Monster as a world object](https://linear.app/threadbare/issue/THR-1559/hunts-h1-monster-in-the-world-objects-registry), [commander deleted, not marked dead](https://linear.app/threadbare/issue/THR-1566/a-commander-killed-in-battle-is-deleted-not-marked-dead-no-body-no), [item bursts](https://linear.app/threadbare/issue/THR-1568/items-that-promise-a-burst-when-struck-never-give-it-a-reactions-timed), [wards](https://linear.app/threadbare/issue/THR-1569/fear-wards-wound-cures-and-curse-wards-miss-the-real-conditions), [wayside encounters](https://linear.app/threadbare/issue/THR-1567/three-wayside-only-slice-encounters-almost-never-fire-the-unsafe).
- Low: [colocation chance](https://linear.app/threadbare/issue/THR-1576/colocation-chance-pins-at-its-bounds-reach-weights-multiply-the-raw), [blood-soaked ground](https://linear.app/threadbare/issue/THR-1528/battle-history-record-the-substrate-blood-soaked-needs-a-per-location), [seed targets](https://linear.app/threadbare/issue/THR-1565/three-seed-targets-tell-the-wrong-story-the-healers-grateful-kin-the), [the Follow button's wording](https://linear.app/threadbare/issue/THR-1573/the-follow-button-doesnt-say-it-keeps-a-mortal-in-the-spotlight).

## Health

- **Heavy simulation tests are red on the latest `main`** ([run](https://github.com/christianspliid-ui/threadbare/actions/runs/36078340872)): two generated-world tests hit the 5-second time limit (5.0 s and 5.1 s), no assertion failed. It reads as a slow runner, not a defect; the builder's job, not yours. The previous run on `main` was green.
- **Lane silence:** the worst recent gap was 25 hours, from Saturday 19 into Sunday 20. It falls on a weekend, so your 11 September ruling declines it.
- **Worktree reaper:** 5 worktrees are waiting to be sorted. Routine.
- Everything else is green. Tick cost is 62 ms per tick, 9% below the 7-day median of 69. The live site serves the latest `main` (631439af), no pull requests are waiting, all nine scheduled lanes are on time, and the home tree is current on `main`.
