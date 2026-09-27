# Briefing
**Generated:** 2026-09-27 17:57 local (15:57 UTC) · keep-work-flowing-cc

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

**Thin but moving: 2 jobs ready to build, 1 being built.** Since last hour, threading a mortal with the Agent Thread card no longer makes them invisible ([THR-1643](https://linear.app/threadbare/issue/THR-1643), merged via [#2098](https://github.com/christianspliid-ui/threadbare/pull/2098), live). The two plans you shaped from the first cold playtest also landed ([#2097](https://github.com/christianspliid-ui/threadbare/pull/2097)): [the opening](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-27-thr-1605-the-opening.md) and [what your hand did](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-27-thr-1606-what-your-hand-did.md). The orchestrator can now queue their seven build tickets, which will refill the shelf.

- **Ready, top first:**
  - [The ascendant's essence is kept in two places, and the essence bar reads the wrong one](https://linear.app/threadbare/issue/THR-1645/two-essence-stores-stillness-and-influence-maintenance-write-the).
  - [Let written encounters land](https://linear.app/threadbare/issue/THR-1633), the plan above. It is also the fix path for [a new player never meeting The First](https://linear.app/threadbare/issue/THR-1605).
- **Being built:** [culture and spheres showing through](https://linear.app/threadbare/issue/THR-1635). [#2091](https://github.com/christianspliid-ui/threadbare/pull/2091) clashes with newer `main` and failed its required check (see Health).
- **Fight system: every planned piece is live, but not yet ready for you to review.** There is no one-click link that opens a fight, the way the encounter links above open an encounter. Until a builder adds one, a review would mean hunting for a fight.

## Health

- **One build can't merge until a builder brings it up to date by hand.** [#2091](https://github.com/christianspliid-ui/threadbare/pull/2091) (culture and spheres) clashes in three docs files and also failed its required check, so the failure needs reading first. Not yours.
- **The long simulation tests are still red on the latest `main`** (red for about an hour; 4 of the last 5 runs failed). Last hour's reading was three checks running out of time rather than giving a wrong answer, so it looks like a slow test, not broken game logic. A builder should raise its time limit or speed it up.
- **Game speed dropped, and it held:** tick cost 114 ms/tick steady, 47% above the 7-day median (77, 132 rows since da7f4398); top phase agent_decision, 486 agents. Name the merges between da7f4398 and 096eb7b5: `git log --oneline --merges da7f4398..096eb7b5`. This is the second slow reading in a row (106, then 114; 78 before), so it is not a busy machine. The jump lands exactly on [#2096](https://github.com/christianspliid-ui/threadbare/pull/2096) (the fresh Doom clock, [THR-1642](https://linear.app/threadbare/issue/THR-1642)), the only merge between the last fast reading and the first slow one. Only the steady phase slowed, not warm-up. A builder should look there.
- **Lane silence:** the worst recent gap is still 21 hours, Sunday 20 September evening into Monday 21 September afternoon. [The workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md) found the computer was asleep for that window, so it needs nothing from you.
- **Everything else is green:**
  - The live site is serving 7dd4accc, which includes the Agent Thread fix; only docs landed after it.
  - All ten scheduled lanes are on time.
  - The worktree reaper left 5 worktrees waiting to be sorted, which is routine.
