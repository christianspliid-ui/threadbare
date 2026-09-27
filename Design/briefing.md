# Briefing
**Generated:** 2026-09-27 06:59 local (04:59 UTC) · keep-work-flowing-cc

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

- [A world that starts alive](https://linear.app/threadbare/issue/THR-1589/map-a-world-that-starts-alive-people-ties-and-a-past-at-game-start-and): **the map is closed and split into seven design jobs**: [people who want things and ties between them](https://linear.app/threadbare/issue/THR-1630), [a world with a past](https://linear.app/threadbare/issue/THR-1631), [faith and politics as world settings](https://linear.app/threadbare/issue/THR-1632) (waits until 18:30 UTC today so you can veto first), [let the ~300 written encounters that never fire land](https://linear.app/threadbare/issue/THR-1633), [finish the encounters the player actually meets](https://linear.app/threadbare/issue/THR-1634), [culture and spheres showing through](https://linear.app/threadbare/issue/THR-1635), and [seeded things that stay alive](https://linear.app/threadbare/issue/THR-1636). Rumors as their own content, and location/encounter art, are left off. *— from tb-design-lane*
- [Faith and politics at game start](https://linear.app/threadbare/issue/THR-1596/faith-and-politics-at-game-start-religious-orders-holy-places-towns): **faith and politics are now world settings you can tune**, as you asked. The first setting puts the most systems in contact: a Temple of the Spheres chapter per culture, at least two shrines or temples per culture, about a third of towns unheld. The "34–41 fake factions" were each town's unlabelled local guilds; they will be labelled and stay factions. *— from tb-design-lane*
- [Re-fit the dice](https://linear.app/threadbare/issue/THR-1581/forecast-window-s3-re-fit-the-dice-skill-separates-an-even-match-is-a): **the new dice shipped before the harder content exists.** The world has almost nothing written for skilled mortals yet (234 beginner encounters, 41 journeyman, 1 expert, 1 master), so those checks only report for now; [that content has its own job](https://linear.app/threadbare/issue/THR-1627/journeymen-and-experts-have-almost-nothing-to-attempt-measure-the). Win rate at an even match starts at 40%. Fight ratings don't change. Plan: [forecast window § Amendment 2026-09-26 (second)](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-24-thr-1575-forecast-window.md). *— from tb-design-lane*
- [The seeded item generator](https://linear.app/threadbare/issue/THR-1570/design-the-seeded-item-generator-plan-doc-from-the-item-generator-map): all five decisions are in [one plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-26-thr-1570-seeded-item-generator.md). Masterworks come first. How the work went sets the rank: Mythic or Storied, never Legendary. "Storied" means "has a history". Half of Storied and Mythic loot will be generated ([later step](https://linear.app/threadbare/issue/THR-1626/item-generator-minting-point-2-reward-draws-carry-generated-items-at)). Art uses the picture for the item's kind. *— from tb-design-lane*

Say "veto <title>" to reverse any of these.

## Queue

**Running thin: 1 job is ready and 2 are being built.** The design lane runs next at about 06:17 UTC and has seven design jobs to turn into buildable work.

- **Being built:** [the seeded item generator](https://linear.app/threadbare/issue/THR-1570). A builder saved a checkpoint to [its branch](https://github.com/christianspliid-ui/threadbare/tree/thr-1570-item-generator) at 06:47 local; work is in progress.
- **Being built:** [when two duellists kill each other, the second death leaves no grief behind](https://linear.app/threadbare/issue/THR-1629). The fix is up for merge as [#2087](https://github.com/christianspliid-ui/threadbare/pull/2087), but one of its automatic checks failed (see Health).
- **Ready:** [heroes' starting faction membership carries no standing](https://linear.app/threadbare/issue/THR-1620) (no priority set).
- **Fight system: every planned piece is live, but not yet ready for you to review.** There is no one-click link that opens a fight, the way the encounter links above open an encounter. Until a builder adds one, a review would mean hunting for a fight.

## Health

- **The duel fix ([#2087](https://github.com/christianspliid-ui/threadbare/pull/2087)) is armed to merge but stuck**, unchanged for 1.5 hours. Its required check [failed](https://github.com/christianspliid-ui/threadbare/actions/runs/36291016816) because a fight-calibration test ran past its 10-second setup limit. That is the same slow-test problem as below, not a wrong answer. A builder needs to re-run or fix it. It is not yours.
- **The long simulation tests are still red** on the latest `main`. They fail by running just past a time limit, not by giving wrong answers. The impediment log has it, so the weekly retro will promote the fix. It is not yours.
- **Lane silence:** the worst recent gap is still 21 hours, Sunday 20 September evening into Monday 21 September afternoon. [The workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md) found the computer was asleep for that window, so it needs nothing from you.
- **Everything else is green:**
  - The live site is serving the latest `main` (with [#2086](https://github.com/christianspliid-ui/threadbare/pull/2086)).
  - Game speed is 88 ms per tick, 15% above the weekly median of 76. That is within the normal range (the alarm is at 25%).
  - All ten scheduled lanes are on time.
  - The worktree reaper last ran at 06:42 local. 5 worktrees are waiting to be sorted, which is routine.
