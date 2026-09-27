# Briefing
**Generated:** 2026-09-27 21:58 local (19:58 UTC) · keep-work-flowing-cc

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

- [Someone who wants something in every settlement, and people tied to each other](https://linear.app/threadbare/issue/THR-1630): **the plan is written and ready to build.** Every settlement gets one local figure with property, an old quarrel, and a secret or a favour tied to a nearby hero. Every named hero starts with a relative, a friend and a rival among their neighbours. Calls made along the way: newcomers no longer climb into the deciding tier past your attention limit (measured before it ships, and switchable off); family is called "kin" everywhere; a hero's starting Realm is the one holding their home; a local figure's ambitions stay local; masters and apprentices are left for later. Plan: [notables and ties](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-27-thr-1630-notables-and-ties.md). *— from tb-design-lane* (say "veto notables and ties")
- [Let written encounters land](https://linear.app/threadbare/issue/THR-1633): **the plan is written and ready to build.** About 400 of the 514 written encounters never reach a mortal; the plan makes existing writing reachable before anyone writes more. Calls made: each mortal's 40-option shortlist is filled fairly; mortals who choose for themselves can join guilds that suit them; The First gets no special rule (the fix for its quiet stretches helps every mortal); place-trait bonuses use tags encounters already carry. Plan: [let written encounters land](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-27-thr-1633-written-encounters-land.md). *— from tb-design-lane* (say "veto written encounters land")
- [Culture and spheres showing through](https://linear.app/threadbare/issue/THR-1635): **the plan is written and being built.** Each encounter opening gets one plain sentence about how the town handles this kind of trouble, or what a place's ruling sphere does to it. Words only. Your five playthrough encounters stay untouched until you finish. Plan: [culture and spheres in encounter openings](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-27-thr-1635-culture-sphere-openings.md). *— from tb-design-lane* (say "veto culture openings")
- [A world that starts alive](https://linear.app/threadbare/issue/THR-1589/map-a-world-that-starts-alive-people-ties-and-a-past-at-game-start-and): **the map is closed and split into seven design jobs**: [people who want things and ties between them](https://linear.app/threadbare/issue/THR-1630), [a world with a past](https://linear.app/threadbare/issue/THR-1631), [faith and politics as world settings](https://linear.app/threadbare/issue/THR-1632), [let written encounters land](https://linear.app/threadbare/issue/THR-1633), [finish the encounters the player actually meets](https://linear.app/threadbare/issue/THR-1634), [culture and spheres showing through](https://linear.app/threadbare/issue/THR-1635), and [seeded things that stay alive](https://linear.app/threadbare/issue/THR-1636). *— from tb-design-lane* (say "veto living-world carve-up")

Say "veto <title>" to reverse any of these.

## Queue

**Healthy: 5 jobs ready to build, 1 being built.** Nothing merged to the game this hour; the only change to `main` was a docs note.

- **Ready, top first:**
  - [Dreams and compulsions change someone](https://linear.app/threadbare/issue/THR-1651): Oneiric Sending and Divine Compulsion shift the mortal's values.
  - [The world reads bigger](https://linear.app/threadbare/issue/THR-1649): the avatar sees two hexes, and you can zoom out to the whole map.
  - [Thread upkeep is actually charged](https://linear.app/threadbare/issue/THR-1652), or dropped from the readout (veto on the ticket).
  - [Heroes start with kin, friends and rivals](https://linear.app/threadbare/issue/THR-1630), the plan above.
  - [Let written encounters land](https://linear.app/threadbare/issue/THR-1633), the plan above.
- **Being built:** [culture and spheres showing through](https://linear.app/threadbare/issue/THR-1635). A builder picked it back up this hour: the clash with newer `main` is fixed and pushed ([#2091](https://github.com/christianspliid-ui/threadbare/pull/2091), 19:13 UTC). But the required check failed again, now on the encounter writing check. No file in its local copy has changed since that push (about 45 minutes).
- **Fight system: every planned piece is live, but not yet ready for you to review.** There is no one-click link that opens a fight, the way the encounter links above open an encounter. Until a builder adds one, a review would mean hunting for a fight.

## Health

- **One build is stuck until a builder picks it back up.** [#2091](https://github.com/christianspliid-ui/threadbare/pull/2091) (culture and spheres) now merges cleanly but fails its [required check](https://github.com/christianspliid-ui/threadbare/actions/runs/36343752679): the encounter composition gate reports 26 failing encounters. Auto-merge is armed but will never fire until someone reads that gate and pushes a fix. Not yours.
- **Game speed dipped for the third hour running:** tick cost 120 ms/tick steady, 57% above the 7-day median (77, 132 rows since df1cf66c); top phase agent_decision, 486 agents. The game code did not change since last hour's reading (106 ms), so this looks like machine load rather than a code regression. A builder should confirm: `git log --oneline --merges df1cf66c..20e73f8b`.
- **Lane silence:** the worst recent gap is 13.6 hours, Tuesday 22 September evening into Wednesday morning. Overnight quiet is normal, so it needs nothing from you.
- **Everything else is green:**
  - The live site is serving the latest game code (fe5cef82); later commits were docs only.
  - Automated checks and the three background jobs are running normally.
  - All ten scheduled lanes are on time.
