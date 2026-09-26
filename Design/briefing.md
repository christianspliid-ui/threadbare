# Briefing
**Generated:** 2026-09-27 01:56 local (23:56 UTC) · keep-work-flowing-cc

## The one thing

**Finish the playthrough. Two encounters are left, and the screen is clean.** ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with))

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

Everything from your four feedback batches is live. The one question: **are the encounters, played together, good enough now?** If yes, the next stage opens: encounters that reach into factions, war, the economy and divine actions.

## Also waiting (3)

- **Turn off Linear's auto-complete for sub-issues** at [Team settings → General](https://linear.app/threadbare/settings/teams/THR/general). It closes unbuilt work. *— from tb-orchestrator*
- **Were you away from the app on Monday 14 and Tuesday 15 September?** *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md)*
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

## Decided for you

- [Faith and politics at game start](https://linear.app/threadbare/issue/THR-1596/faith-and-politics-at-game-start-religious-orders-holy-places-towns): **faith and politics are now world settings you can tune**, as you asked. The first setting puts the most systems in contact. Every culture gets its own chapter of the Temple of the Spheres, devoted to its sphere. Every culture has at least two shrines or temples. About a third of towns stay unheld, as ground to fight over. One correction came with it: the "34–41 fake factions" were each town's unlabelled local guilds, not monster lairs. They will be labelled and stay factions. *— from tb-design-lane*
- [Re-fit the dice](https://linear.app/threadbare/issue/THR-1581/forecast-window-s3-re-fit-the-dice-skill-separates-an-even-match-is-a): **the new dice shipped before the harder content exists.** The world has almost nothing written for skilled mortals yet (234 beginner encounters, 41 journeyman, 1 expert, 1 master), so the journeyman-and-up checks only report for now. That content has its own job: [journeymen and experts have almost nothing to attempt](https://linear.app/threadbare/issue/THR-1627/journeymen-and-experts-have-almost-nothing-to-attempt-measure-the). Win rate at an even match starts at 40%. Fight ratings don't change. Plan: [forecast window § Amendment 2026-09-26 (second)](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-24-thr-1575-forecast-window.md). *— from tb-design-lane*
- [The seeded item generator](https://linear.app/threadbare/issue/THR-1570/design-the-seeded-item-generator-plan-doc-from-the-item-generator-map): all five decisions are in [one plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-26-thr-1570-seeded-item-generator.md). Masterworks come first. How the work went sets the rank: Mythic or Storied, never Legendary. "Storied" means "has a history". Half of Storied and Mythic loot will be generated ([later step](https://linear.app/threadbare/issue/THR-1626/item-generator-minting-point-2-reward-draws-carry-generated-items-at)). Art uses the picture for the item's kind. *— from tb-design-lane*
- [Re-fit the dice](https://linear.app/threadbare/issue/THR-1581) and [mortals take on challenges they can win about half the time](https://linear.app/threadbare/issue/THR-1582) **shipped together as one change**. Plan: [forecast window § Amendment 2026-09-26](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-24-thr-1575-forecast-window.md). This drops off the list at the next run. *— from tb-design-lane*

Say "veto <title>" to reverse any of these.

## Queue

**Healthy: 6 jobs are ready, none being built right now.** The builder lane picks the next one up at its next hourly run.

- **Shipped this hour:** [every monster family now has its own portrait](https://linear.app/threadbare/issue/THR-1554) on the lair card and in the fight header, via [#2083](https://github.com/christianspliid-ui/threadbare/pull/2083). It is live on the site.
- **Fight system: every planned piece is now live, but not yet ready for you to review.** There is no one-click link that opens a fight, the way the encounter links above open an encounter. A fight only starts when the world brings a mortal to a lair or a grudge boils over. Until a builder adds a direct link, a review would mean hunting for one. One small bug is still queued: [when two duellists kill each other, the second death leaves no grief behind](https://linear.app/threadbare/issue/THR-1629).
- [Heroes' starting faction membership carries no standing](https://linear.app/threadbare/issue/THR-1620) and [the item generator build](https://linear.app/threadbare/issue/THR-1570) have no priority set.

## Health

- **The long simulation tests are now red five runs in a row** on `main` ([latest run](https://github.com/christianspliid-ui/threadbare/actions/runs/36280090859)). The failures are all in one test file: who inherits a company or army when its commander dies. A builder needs to look at it. It is in the impediment log; it is not yours.
- **Lane silence:** the worst recent gap is still 21 hours, from Sunday 20 September evening into Monday 21 September afternoon. [The workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md) found the computer was asleep for that window, so it needs nothing from you.
- **Everything else is green:**
  - The live site is serving the latest `main` (with #2083).
  - Game speed is 78 ms per tick, 4% above the weekly median. That is within the normal range.
  - All ten scheduled lanes are on time.
  - The worktree reaper last ran at 01:40 local. 5 worktrees are waiting to be sorted, which is routine.
  - No pull requests are waiting to merge.
