# Briefing
**Generated:** 2026-09-27 18:56 local (16:56 UTC) · keep-work-flowing-cc

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

- [Let written encounters land](https://linear.app/threadbare/issue/THR-1633): **the plan is written and ready to build.** About 400 of the 514 written encounters never reach a mortal; the plan makes existing writing reachable before anyone writes more. Mortals' 40-option shortlist gets filled fairly, mortals who make their own choices can join guilds when it suits their strengths, and The First gets no special rule because its quiet stretches come from a general fault that the fix repairs for everyone. Plan: [let written encounters land](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-27-thr-1633-written-encounters-land.md). *— from tb-design-lane* (say "veto written encounters land")
- [Culture and spheres showing through](https://linear.app/threadbare/issue/THR-1635): **the plan is written and being built.** Each encounter opening gets one plain sentence about how the town's people handle this kind of trouble, or what a place's ruling sphere does to the problem. Words only, never which encounters happen or how they roll. Your five playthrough encounters stay untouched until you finish. Plan: [culture and spheres in encounter openings](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-27-thr-1635-culture-sphere-openings.md). *— from tb-design-lane* (say "veto culture openings")
- [A world that starts alive](https://linear.app/threadbare/issue/THR-1589/map-a-world-that-starts-alive-people-ties-and-a-past-at-game-start-and): **the map is closed and split into seven design jobs**: [people who want things and ties between them](https://linear.app/threadbare/issue/THR-1630), [a world with a past](https://linear.app/threadbare/issue/THR-1631), [faith and politics as world settings](https://linear.app/threadbare/issue/THR-1632) (waits until 18:30 UTC today so you can veto first), [let written encounters land](https://linear.app/threadbare/issue/THR-1633), [finish the encounters the player actually meets](https://linear.app/threadbare/issue/THR-1634), [culture and spheres showing through](https://linear.app/threadbare/issue/THR-1635), and [seeded things that stay alive](https://linear.app/threadbare/issue/THR-1636). Rumors as their own content, and location/encounter art, are left off. *— from tb-design-lane* (say "veto living-world carve-up")
- [Faith and politics at game start](https://linear.app/threadbare/issue/THR-1596/faith-and-politics-at-game-start-religious-orders-holy-places-towns): **faith and politics are now world settings you can tune**, as you asked. The first setting: a Temple of the Spheres chapter per culture, at least two shrines or temples per culture, about a third of towns unheld. The "34–41 fake factions" were each town's unlabelled local guilds; they will be labelled and stay factions. *— from tb-design-lane* (say "veto faith defaults"; leaves this list around 18:30 UTC)

Say "veto <title>" to reverse any of these.

## Queue

**Healthy again: 4 jobs ready to build, 1 being built.** Since last hour, the ascendant's essence lives in one place, so the essence bar reads the right number ([THR-1645](https://linear.app/threadbare/issue/THR-1645), merged via [#2099](https://github.com/christianspliid-ui/threadbare/pull/2099), live). Three fixes from your first cold playtest are now queued, from [the opening plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-27-thr-1605-the-opening.md). The rest of the opening waits on "the meeting comes to the player", still being designed.

- **Ready, top first:**
  - [A Vision plays its scene](https://linear.app/threadbare/issue/THR-1650): it opens the encounter on The First instead of resolving silently.
  - [Dreams and compulsions change someone](https://linear.app/threadbare/issue/THR-1651): Oneiric Sending and Divine Compulsion shift the mortal's values.
  - [The world reads bigger](https://linear.app/threadbare/issue/THR-1649): the avatar sees two hexes, and you can zoom out to the whole map.
  - [Let written encounters land](https://linear.app/threadbare/issue/THR-1633), the plan above.
- **Being built:** [culture and spheres showing through](https://linear.app/threadbare/issue/THR-1635). Its build [#2091](https://github.com/christianspliid-ui/threadbare/pull/2091) has not moved for about 5 hours (see Health).
- **Fight system: every planned piece is live, but not yet ready for you to review.** There is no one-click link that opens a fight, the way the encounter links above open an encounter. Until a builder adds one, a review would mean hunting for a fight.

## Health

- **One build is stuck until a builder picks it back up.** [#2091](https://github.com/christianspliid-ui/threadbare/pull/2091) (culture and spheres) clashes with newer `main` in three docs files and failed its required check; its last change was 12:12 UTC. Builders have shipped two other jobs since, so nobody is on it. Not yours.
- **The long simulation tests are still red on the latest `main`** (about 2 hours now; 4 of the last 5 runs failed). Earlier readings were checks running out of time, not wrong answers, so it looks like a slow test rather than broken game logic. A builder should raise its time limit or speed it up.
- **Game speed is back to normal:** 76 ms/tick, right on the 7-day median (77). Last hour's slowdown did not repeat.
- **Lane silence:** the worst recent gap is still 21 hours, Sunday 20 September evening into Monday 21 September afternoon. [The workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md) found the computer was asleep for that window, so it needs nothing from you.
- **Everything else is green:**
  - The live site is serving the latest `main` (2bebc045), which includes the essence fix.
  - All ten scheduled lanes are on time.
  - The worktree reaper left 5 worktrees waiting to be sorted, which is routine.
