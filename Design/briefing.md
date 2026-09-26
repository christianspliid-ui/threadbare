# Briefing
**Generated:** 2026-09-26 18:58 local (16:58 UTC) · keep-work-flowing-cc

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

- [Re-fit the dice](https://linear.app/threadbare/issue/THR-1581/forecast-window-s3-re-fit-the-dice-skill-separates-an-even-match-is-a): **the new dice shipped before the harder content exists.** Skill now matters a lot. The world has almost nothing written for skilled mortals yet (234 beginner encounters, 41 journeyman, 1 expert, 1 master). Until that content exists, the checks for journeyman and above only report. The harder content has its own job: [journeymen and experts have almost nothing to attempt](https://linear.app/threadbare/issue/THR-1627/journeymen-and-experts-have-almost-nothing-to-attempt-measure-the). Win rate at an even match starts at 40%, a number to tune in play. Fight ratings don't change. Plan: [forecast window § Amendment 2026-09-26 (second)](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-24-thr-1575-forecast-window.md). *— from tb-design-lane*
- [The seeded item generator](https://linear.app/threadbare/issue/THR-1570/design-the-seeded-item-generator-plan-doc-from-the-item-generator-map): all five decisions are in [one plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-26-thr-1570-seeded-item-generator.md). Masterworks come first. How the work went sets the rank: Mythic or Storied, never Legendary. "Storied" means "has a history". Half of Storied and Mythic loot will be generated ([later step](https://linear.app/threadbare/issue/THR-1626/item-generator-minting-point-2-reward-draws-carry-generated-items-at)). Art uses the picture for the item's kind. *— from tb-design-lane*
- [Re-fit the dice](https://linear.app/threadbare/issue/THR-1581) and [mortals take on challenges they can win about half the time](https://linear.app/threadbare/issue/THR-1582) **shipped together as one change**. Plan: [forecast window § Amendment 2026-09-26](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-24-thr-1575-forecast-window.md). *— from tb-design-lane*
- [Culture and spheres showing through](https://linear.app/threadbare/issue/THR-1599): culture and a place's sphere show in an encounter as **one extra sentence stating a local fact that bears on the test**. Samples: [seed 42](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1599-culture-sphere-layer/Docs/audits/2026-09-25-living-world-data/proto-thr-1599/sample-seed-42.md) · [seed 99](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1599-culture-sphere-layer/Docs/audits/2026-09-25-living-world-data/proto-thr-1599/sample-seed-99.md). *— from tb-design-lane*

Say "veto <title>" to reverse any of these.

## From Christian

- **16:25 UTC, on faith and politics at game start** ([THR-1596](https://linear.app/threadbare/issue/THR-1596)): *"This should be tunable for different scenarios. To begin let's go with something that allows us to test and see balance and interaction"*. Your words are now [on the ticket](https://linear.app/threadbare/issue/THR-1596). The design lane builds it as a world setting you can tune. It picks the first test setup and shows it under "Decided for you". You don't need to open a session for it. This was the last open question on [the living-world map](https://linear.app/threadbare/issue/THR-1589). Once the setup is picked, the map becomes build work.

## Queue

**Healthy: 12 jobs are ready, none being built right now.** The builder lane picks the next one up at its next hourly run.

- **Shipped this hour:** [a mortal's mastery is now permanent, and a graduate's mastery moves the dice](https://linear.app/threadbare/issue/THR-1584), via [#2076](https://github.com/christianspliid-ui/threadbare/pull/2076). It is live on the site.
- **Fight system: nearly ready, but not yet ready for you to review.** Everything is live except [the lair elites' portraits](https://linear.app/threadbare/issue/THR-1554), which are queued.
- [Heroes' starting faction membership carries no standing](https://linear.app/threadbare/issue/THR-1620) and [the item generator build](https://linear.app/threadbare/issue/THR-1570) have no priority set.

## Health

- **The long simulation tests are red on the latest `main`** ([run](https://github.com/christianspliid-ui/threadbare/actions/runs/36255812895)). The failures are three army and company hand-over checks in `peopleThingsCells.test.ts`, after [#2076](https://github.com/christianspliid-ui/threadbare/pull/2076). These checks also went red at 14:58 UTC and then green again, so they may be flaky. This is builder work, not yours.
- **Lane silence:** the worst recent gap is still 21 hours, from Sunday 20 September evening into Monday 21 September afternoon. [The workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md) found the computer was asleep for that window, so it needs nothing from you.
- **Everything else is green:**
  - The live site is serving the latest `main` (with #2076).
  - Game speed is 76 ms per tick, 3% above the weekly median. That is normal.
  - All ten scheduled lanes are on time.
  - The worktree reaper last ran at 18:40 local. 5 worktrees are waiting to be sorted, which is routine.
  - No pull requests are waiting to merge. `main` is current.
