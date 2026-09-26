# Briefing
**Generated:** 2026-09-26 18:02 local (16:02 UTC) · keep-work-flowing-cc

## The one thing

**Answer the last question on the "world that starts alive" map: faith and politics at game start.** ([THR-1596](https://linear.app/threadbare/issue/THR-1596), on [the map](https://linear.app/threadbare/issue/THR-1589))

It covers what the world believes and who rules it on day one: one religious order per world, rare holy places, many towns that answer to no one, and monster-lair bands counted as factions. The three options, (a) to (c), are in the ticket. Every other ticket on the map is decided. Once this one is answered, the design lane can turn the whole map into build work. Open a chat and say "work the map". *— from tb-design-lane and tb-orchestrator*

## Also waiting (4)

- **Finish the playthrough: two encounters are left, and the screen is clean** ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with)): [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge) and [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan).
- **Turn off Linear's auto-complete for sub-issues** at [Team settings → General](https://linear.app/threadbare/settings/teams/THR/general). It closes unbuilt work. *— from tb-orchestrator*
- **Were you away from the app on Monday 14 and Tuesday 15 September?** *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md)*
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

## Decided for you

- [Re-fit the dice](https://linear.app/threadbare/issue/THR-1581/forecast-window-s3-re-fit-the-dice-skill-separates-an-even-match-is-a): **the new dice shipped before the harder content exists.** Skill now matters a lot. The world has almost nothing written for skilled mortals yet (234 beginner encounters, 41 journeyman, 1 expert, 1 master), so the journeyman-and-up checks are reports until that content exists. The harder content has its own job: [journeymen and experts have almost nothing to attempt](https://linear.app/threadbare/issue/THR-1627/journeymen-and-experts-have-almost-nothing-to-attempt-measure-the). Win rate at an even match starts at 40%, a number to tune in play. Fight ratings don't change. Plan: [forecast window § Amendment 2026-09-26 (second)](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-24-thr-1575-forecast-window.md). *— from tb-design-lane*
- [The seeded item generator](https://linear.app/threadbare/issue/THR-1570/design-the-seeded-item-generator-plan-doc-from-the-item-generator-map): all five decisions are in [one plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-26-thr-1570-seeded-item-generator.md). Masterworks come first. How the work went sets the rank (Mythic or Storied, never Legendary). "Storied" means "has a history". Half of Storied and Mythic loot will be generated ([later step](https://linear.app/threadbare/issue/THR-1626/item-generator-minting-point-2-reward-draws-carry-generated-items-at)). Art uses the picture for the item's kind. *— from tb-design-lane*
- [Re-fit the dice](https://linear.app/threadbare/issue/THR-1581) and [mortals take on challenges they can win about half the time](https://linear.app/threadbare/issue/THR-1582) **shipped together as one change**. Plan: [forecast window § Amendment 2026-09-26](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-24-thr-1575-forecast-window.md). *— from tb-design-lane*
- [Culture and spheres showing through](https://linear.app/threadbare/issue/THR-1599): culture and a place's sphere show in an encounter as **one extra sentence stating a local fact that bears on the test**. Samples: [seed 42](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1599-culture-sphere-layer/Docs/audits/2026-09-25-living-world-data/proto-thr-1599/sample-seed-42.md) · [seed 99](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1599-culture-sphere-layer/Docs/audits/2026-09-25-living-world-data/proto-thr-1599/sample-seed-99.md). *— from tb-design-lane*

Say "veto <title>" to reverse any of these.

## Queue

**Healthy: 13 jobs are ready, none being built right now.** The builder lane picks the next one up at its next hourly run.

- **Two more pieces shipped this hour, both live on the site:**
  - [The ground remembers its battles](https://linear.app/threadbare/issue/THR-1528), via [#2074](https://github.com/christianspliid-ui/threadbare/pull/2074). Its next piece is queued: [a fight leaves a record on the ground, and three fights soak it](https://linear.app/threadbare/issue/THR-1574).
  - [The sheet and the skill line use the same word for a mortal's reach](https://linear.app/threadbare/issue/THR-1583), via [#2075](https://github.com/christianspliid-ui/threadbare/pull/2075). With it, the whole [dice-reading-everyone-as-a-master](https://linear.app/threadbare/issue/THR-1575) fix is done.
- **Fight system: nearly ready, not yet a review ask.** Everything is live except [the lair elites' portraits](https://linear.app/threadbare/issue/THR-1554), which are queued.
- [Heroes' starting faction membership carries no standing](https://linear.app/threadbare/issue/THR-1620) and [the item generator build](https://linear.app/threadbare/issue/THR-1570) have no priority set.

## Health

- **Lane silence:** the worst recent gap is still 21 hours, from Sunday 20 September evening into Monday 21 September afternoon. [The workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md) found the computer was asleep for that window, so it needs nothing from you.
- **Everything else is green:**
  - The live site is serving the latest `main` (with #2075).
  - Automated checks and the long simulation tests are green on the latest `main`.
  - Game speed is 76 ms per tick, 3% above the weekly median. Normal.
  - All ten scheduled lanes are on time.
  - The worktree reaper last ran at 17:42 local; 5 worktrees wait to be sorted, which is routine.
  - No pull requests are waiting to merge. `main` is current.
