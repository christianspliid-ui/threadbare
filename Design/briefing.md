# Briefing
**Generated:** 2026-09-28 00:55 local (22:55 UTC) · keep-work-flowing-cc

## The one thing

**Finish the playthrough. Two encounters are left, and the screen is clean.** ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with))

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

Everything from your four feedback batches is live. The one question is: **played together, are the encounters good enough now?** If yes, the next stage opens: encounters that reach into factions, war, the economy and divine actions. The change to encounter openings now being built deliberately leaves these five alone until you're done, so nothing changes while you play.

## Also waiting (3)

- **Turn off Linear's auto-complete for sub-issues** at [Team settings → General](https://linear.app/threadbare/settings/teams/THR/general). It marks unbuilt work as finished. *— from tb-orchestrator*
- **Were you away from the app on Monday 14 and Tuesday 15 September?** *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md)*
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

## Decided for you

- [Someone who wants something in every settlement, and people tied to each other](https://linear.app/threadbare/issue/THR-1630): **the plan is written and ready to build.** Every settlement gets one local figure. That figure owns property, has an old quarrel, and holds a secret or a favour tied to a nearby hero. Every named hero starts with a relative, a friend and a rival among their neighbours. Other calls made:
  - Newcomers no longer climb into the deciding tier past your attention limit. This is measured before it ships and can be switched off.
  - Family is called "kin" everywhere.
  - A hero's starting Realm is the one that holds their home.
  - A local figure's ambitions stay local.
  - Masters and apprentices are left for later.

  Plan: [notables and ties](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-27-thr-1630-notables-and-ties.md). *— from tb-design-lane* (say "veto notables and ties")
- [Let written encounters land](https://linear.app/threadbare/issue/THR-1633): **the plan is written and ready to build.** About 400 of the 514 written encounters never reach a mortal, so the plan makes existing writing reachable before anyone writes more. Calls made:
  - Each mortal's 40-option shortlist is filled fairly.
  - Mortals who choose for themselves can join guilds that suit them.
  - The First gets no special rule. The fix for its quiet stretches helps every mortal.
  - Place-trait bonuses use tags encounters already carry.

  Plan: [let written encounters land](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-27-thr-1633-written-encounters-land.md). *— from tb-design-lane* (say "veto written encounters land")
- [Culture and spheres showing through](https://linear.app/threadbare/issue/THR-1635): **the plan is written and being built.** Each encounter opening gets one plain sentence about how the town handles this kind of trouble, or what a place's ruling sphere does to it. It changes words only. Your five playthrough encounters stay untouched until you finish. Plan: [culture and spheres in encounter openings](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-27-thr-1635-culture-sphere-openings.md). *— from tb-design-lane* (say "veto culture openings")
- [A world that starts alive](https://linear.app/threadbare/issue/THR-1589/map-a-world-that-starts-alive-people-ties-and-a-past-at-game-start-and): **the map is closed and split into seven design jobs**:
  - [people who want things, and ties between them](https://linear.app/threadbare/issue/THR-1630)
  - [a world with a past](https://linear.app/threadbare/issue/THR-1631)
  - [faith and politics as world settings](https://linear.app/threadbare/issue/THR-1632)
  - [let written encounters land](https://linear.app/threadbare/issue/THR-1633)
  - [finish the encounters the player actually meets](https://linear.app/threadbare/issue/THR-1634)
  - [culture and spheres showing through](https://linear.app/threadbare/issue/THR-1635)
  - [seeded things that stay alive](https://linear.app/threadbare/issue/THR-1636)

  *— from tb-design-lane* (say "veto living-world carve-up")

Say "veto <title>" to reverse any of these.

## Queue

**Thin: 2 jobs ready to build, 1 being built.** One job shipped this hour: [the world reads bigger](https://linear.app/threadbare/issue/THR-1649). Your avatar now sees two hexes, and the camera can zoom out to the whole map. Merged via [#2105](https://github.com/christianspliid-ui/threadbare/pull/2105) and live on the site.

- **Ready, top first:**
  - [Heroes start with kin, friends and rivals](https://linear.app/threadbare/issue/THR-1630), the plan above.
  - [Let written encounters land](https://linear.app/threadbare/issue/THR-1633), the plan above.
- **Being built:** [culture and spheres showing through](https://linear.app/threadbare/issue/THR-1635), [#2091](https://github.com/christianspliid-ui/threadbare/pull/2091). There has been no new push since 19:17 UTC. It still conflicts with newer `main`, and its required check still fails. Its local copy holds no unsaved changes, so nothing is at risk.
- **The fight system is live but not ready for you to review.** No one-click link opens a fight the way the encounter links above open an encounter. Until a builder adds one, a review would mean hunting for a fight.

## Health

- **One build is stuck until a builder picks it back up.** [#2091](https://github.com/christianspliid-ui/threadbare/pull/2091) (culture and spheres) conflicts with `main`, and its [required check](https://github.com/christianspliid-ui/threadbare/actions/runs/36343752679) fails. It has been stuck about 15 hours. Auto-merge is on, but it will not fire until someone fixes both. This is for a builder, not you.
- **The slow simulation tests are red on the latest `main`** ("Heavy simulation tests", 1 h old). A builder owes a follow-up fix. It does not block merges or the live site.
- **Game speed is still above normal, but improving:** tick cost 106 ms/tick steady, 37% above the 7-day median (77, 135 rows since df1cf66c); top phase agent_decision, 486 agents. Name the merges between df1cf66c and 2ba9db47: `git log --oneline --merges df1cf66c..2ba9db47`. It was 118 an hour ago. The earlier same-commit comparison (76 vs 114) still points at machine load, not a code regression.
- **Lane silence:** the worst recent gap was 13.6 hours, from Tuesday evening 22 September into Wednesday morning. Overnight quiet is normal, so you don't need to do anything.
- **Everything else is green:**
  - The live site is serving the latest commit on main (2ba9db47).
  - Automated checks and the three background jobs are running normally.
  - All ten scheduled lanes are on time. The worktree cleaner ran at 00:40.
