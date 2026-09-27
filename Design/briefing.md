# Briefing
**Generated:** 2026-09-27 11:56 local (09:56 UTC) · keep-work-flowing-cc

## The one thing

**Finish the playthrough. Two encounters are left, and the screen is clean.** ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with))

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

Everything from your four feedback batches is live. The one question: **are the encounters, played together, good enough now?** If yes, the next stage opens: encounters that reach into factions, war, the economy and divine actions. The change to encounter openings now being built deliberately leaves these five alone until you are done, so nothing moves under you.

## Also waiting (3)

- **Turn off Linear's auto-complete for sub-issues** at [Team settings → General](https://linear.app/threadbare/settings/teams/THR/general). It closes unbuilt work. *— from tb-orchestrator*
- **Were you away from the app on Monday 14 and Tuesday 15 September?** *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md)*
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

## Decided for you

- [Culture and spheres showing through](https://linear.app/threadbare/issue/THR-1635): **the plan is written and ready to build.** Each encounter opening gets one plain sentence about how the town's people handle this kind of trouble, or, where one sphere holds a wild place, what that power does to the problem. It changes only the words, never which encounters happen or how they roll. Your five playthrough encounters stay untouched until you finish. Sphere sentences only for the seven spheres that ever dominate a place; the sentence has its own 28-word limit; [the rest of the sentences](https://linear.app/threadbare/issue/THR-1638) come in a second step. Plan: [culture and spheres in encounter openings](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-27-thr-1635-culture-sphere-openings.md). *— from tb-design-lane* (say "veto culture openings")
- [A world that starts alive](https://linear.app/threadbare/issue/THR-1589/map-a-world-that-starts-alive-people-ties-and-a-past-at-game-start-and): **the map is closed and split into seven design jobs**: [people who want things and ties between them](https://linear.app/threadbare/issue/THR-1630), [a world with a past](https://linear.app/threadbare/issue/THR-1631), [faith and politics as world settings](https://linear.app/threadbare/issue/THR-1632) (waits until 18:30 UTC today so you can veto first), [let the ~300 written encounters that never fire land](https://linear.app/threadbare/issue/THR-1633), [finish the encounters the player actually meets](https://linear.app/threadbare/issue/THR-1634), [culture and spheres showing through](https://linear.app/threadbare/issue/THR-1635), and [seeded things that stay alive](https://linear.app/threadbare/issue/THR-1636). Rumors as their own content, and location/encounter art, are left off. *— from tb-design-lane* (say "veto living-world carve-up")
- [Faith and politics at game start](https://linear.app/threadbare/issue/THR-1596/faith-and-politics-at-game-start-religious-orders-holy-places-towns): **faith and politics are now world settings you can tune**, as you asked. The first setting puts the most systems in contact: a Temple of the Spheres chapter per culture, at least two shrines or temples per culture, about a third of towns unheld. The "34–41 fake factions" were each town's unlabelled local guilds; they will be labelled and stay factions. *— from tb-design-lane* (say "veto faith defaults")
- [Re-fit the dice](https://linear.app/threadbare/issue/THR-1581/forecast-window-s3-re-fit-the-dice-skill-separates-an-even-match-is-a): **the new dice shipped before the harder content exists.** The world has almost nothing written for skilled mortals yet (234 beginner encounters, 41 journeyman, 1 expert, 1 master), so those checks only report for now; [that content has its own job](https://linear.app/threadbare/issue/THR-1627/journeymen-and-experts-have-almost-nothing-to-attempt-measure-the). Win rate at an even match starts at 40%. Fight ratings don't change. Plan: [forecast window § Amendment 2026-09-26 (second)](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-24-thr-1575-forecast-window.md). *— from tb-design-lane* (this one leaves the list around 12:40 UTC)

Say "veto <title>" to reverse any of these.

## Queue

**Empty shelf: nothing is waiting to be built, and 2 jobs are being built.** Expected on a Sunday morning; the design lane runs again at about 14:17 local with more design jobs from the living-world map.

- **Being built:** [the seeded item generator](https://linear.app/threadbare/issue/THR-1570). [#2088](https://github.com/christianspliid-ui/threadbare/pull/2088) passes its checks but clashes with newer `main` (see Health).
- **Being built:** [culture and spheres showing through](https://linear.app/threadbare/issue/THR-1635). [#2091](https://github.com/christianspliid-ui/threadbare/pull/2091) clashes with newer `main` and failed its required check (see Health).
- **Waiting behind the living-world plans:** the urgent finding that [a new player never meets The First](https://linear.app/threadbare/issue/THR-1605). *— from [the weekly hygiene sweep](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/weekly-hygiene-2026-09-27.md)*
- **Fight system: every planned piece is live, but not yet ready for you to review.** There is no one-click link that opens a fight, the way the encounter links above open an encounter. Until a builder adds one, a review would mean hunting for a fight.

## Health

- **Two builds can't merge until a builder brings them up to date by hand.** [#2088](https://github.com/christianspliid-ui/threadbare/pull/2088) is green but clashes with newer `main` (5 hours). [#2091](https://github.com/christianspliid-ui/threadbare/pull/2091) clashes too, and its required check failed, so the failure needs reading before the clash is fixed. It is not yours.
- **The long simulation tests are still red** on the latest `main` (8 hours). They fail by running past a time limit, not by giving wrong answers. The impediment log has it, so the weekly retro will promote the fix. It is not yours.
- **Lane silence:** the worst recent gap is still 21 hours, Sunday 20 September evening into Monday 21 September afternoon. [The workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md) found the computer was asleep for that window, so it needs nothing from you.
- **Everything else is green:**
  - The live site is serving the latest `main` (3abbba8a).
  - Game speed is 78 ms per tick, +3% against the weekly median of 76.
  - All ten scheduled lanes are on time.
  - The worktree reaper's latest run left 5 worktrees waiting to be sorted, which is routine.
