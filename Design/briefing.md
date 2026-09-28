# Briefing
**Generated:** 2026-09-28 02:58 local (00:58 UTC) · keep-work-flowing-cc

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

- [A world with a past](https://linear.app/threadbare/issue/THR-1631): **the plan is written and ready to build.** It follows your "a is fine" choice. New worlds get a founding age for every settlement, one ancient war, two or three remembered wars, five to ten of the dead, and descent from a dead empire for some people. You meet it in a "Before you woke" section at the top of the chronicle, and in one line on each settlement, ruin and dead person's page. Calls made:
  - Ages are words, not numbers ("about four centuries ago").
  - Only capitals get a named founder.
  - The outline is known from the start; the details are found by seeing a place or using Find or Perceive.
  - Only heroes who already make their own choices get wants from the past.
  - "Win back the old homeland" is not handed out at game start yet.
  - The past is stored in the world itself, so saved games carry it.

  Plan: [a world with a past](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-28-thr-1631-world-with-a-past.md). *— from tb-design-lane* (say "veto world with a past")
- [Someone who wants something in every settlement, and people tied to each other](https://linear.app/threadbare/issue/THR-1630): **being built.** The first step (every named hero starts with kin, a friend and a rival) is merged. Calls made: newcomers no longer climb into the deciding tier past your attention limit (measured before it ships, can be switched off); family is called "kin" everywhere; a hero's starting Realm is the one that holds their home; a local figure's ambitions stay local; masters and apprentices are left for later. Plan: [notables and ties](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-27-thr-1630-notables-and-ties.md). *— from tb-design-lane* (say "veto notables and ties")
- [Let written encounters land](https://linear.app/threadbare/issue/THR-1633): **being built.** About 400 of the 514 written encounters never reach a mortal, so the plan makes existing writing reachable before anyone writes more. Calls made: each mortal's 40-option shortlist is filled fairly; mortals who choose for themselves can join guilds that suit them; The First gets no special rule; place-trait bonuses use tags encounters already carry. Plan: [let written encounters land](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-27-thr-1633-written-encounters-land.md). *— from tb-design-lane* (say "veto written encounters land")
- [Culture and spheres showing through](https://linear.app/threadbare/issue/THR-1635): **being built.** Each encounter opening gets one plain sentence about how the town handles this kind of trouble, or what a place's ruling sphere does to it. Words only. Your five playthrough encounters stay untouched until you finish. Plan: [culture and spheres in encounter openings](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-27-thr-1635-culture-sphere-openings.md). *— from tb-design-lane* (say "veto culture openings"; this one drops off in about six hours)

Say "veto <title>" to reverse any of these.

## Queue

**Healthy: 3 jobs ready to build, 1 being built.**

- **Ready:**
  - [People only step into the spotlight when there is room](https://linear.app/threadbare/issue/THR-1653) — next step of notables and ties.
  - [A journey keeps its goal](https://linear.app/threadbare/issue/THR-1639) — second step of let written encounters land.
  - [A world with a past](https://linear.app/threadbare/issue/THR-1631) — the plan above, just handed off.
- **Being built:** [Culture and spheres showing through](https://linear.app/threadbare/issue/THR-1635), [#2091](https://github.com/christianspliid-ui/threadbare/pull/2091). No new push since 19:17 UTC yesterday. Its local copy holds no unsaved changes, so nothing is at risk.
- **Merged this hour:** [#2106](https://github.com/christianspliid-ui/threadbare/pull/2106), heroes start tied to kin, friends and rivals.
- **The fight system is live but not ready for you to review.** No one-click link opens a fight the way the encounter links above open an encounter. Until a builder adds one, a review would mean hunting for a fight.

## Health

- **One build is stuck until a builder picks it back up.** [#2091](https://github.com/christianspliid-ui/threadbare/pull/2091) (culture and spheres) conflicts with `main`, and its [required check](https://github.com/christianspliid-ui/threadbare/actions/runs/36343752679) fails. It has been stuck about 17 hours. Auto-merge is on, but it will not fire until someone fixes both. This is for a builder, not you.
- **The slow simulation tests are red on the latest `main`** ("Heavy simulation tests", 3 h old). A builder owes a follow-up fix. It does not block merges or the live site.
- **Game speed is still above normal, but easing:** tick cost 100 ms/tick steady, 29% above the 7-day median (77, 137 rows since df1cf66c); top phase agent_decision, 489 agents. Name the merges between df1cf66c and 931dbc98: `git log --oneline --merges df1cf66c..931dbc98`. It was 104 an hour ago and 106 before that.
- **Lane silence:** the worst recent gap was 13.6 hours, from Tuesday evening 22 September into Wednesday morning. Overnight quiet is normal, so you don't need to do anything.
- **Everything else is green:**
  - The live site is up to date; the newest commits only touched notes and docs.
  - Automated checks and the three background jobs are running normally.
  - All ten scheduled lanes are on time. The worktree cleaner ran at 02:40.
