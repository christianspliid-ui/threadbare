# Briefing
**Generated:** 2026-09-28 05:58 local (03:58 UTC) · keep-work-flowing-cc

## The one thing

**Finish the playthrough. Two encounters are left, and the screen is clean.** ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with))

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

Everything from your four feedback batches is live. The one question is: **played together, are the encounters good enough now?** If yes, the next stage opens: encounters that reach into factions, war, the economy and divine actions. The new culture lines in encounter openings deliberately leave these five encounters alone, so nothing changes while you play.

## Also waiting (3)

- **Turn off Linear's auto-complete for sub-issues** at [Team settings → General](https://linear.app/threadbare/settings/teams/THR/general). It marks unbuilt work as finished. *— from tb-orchestrator*
- **Were you away from the app on Monday 14 and Tuesday 15 September?** *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md)*
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

## Decided for you

- [A world with a past](https://linear.app/threadbare/issue/THR-1631): **step one is merged and live** ([#2109](https://github.com/christianspliid-ui/threadbare/pull/2109)). New worlds now carry founding ages, old wars and the dead behind the scenes. Next: [the player meets the past](https://linear.app/threadbare/issue/THR-1656) (the "Before you woke" chronicle section) and [the past feeds ambitions](https://linear.app/threadbare/issue/THR-1657). Calls made: ages are words, not numbers; only capitals get a named founder; details are found by seeing a place or using Find or Perceive; only heroes who already choose for themselves get wants from the past; "win back the old homeland" waits for later; the past is stored in the world, so saved games carry it. Plan: [a world with a past](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-28-thr-1631-world-with-a-past.md). *— from tb-design-lane* (say "veto world with a past")
- [Someone who wants something in every settlement, and people tied to each other](https://linear.app/threadbare/issue/THR-1630): **being built.** Step one (every named hero starts with kin, a friend and a rival) is merged. Calls made: newcomers no longer climb into the deciding tier past your attention limit (measured before it ships, can be switched off); family is "kin" everywhere; a hero's starting Realm is the one that holds their home; a local figure's ambitions stay local; masters and apprentices wait. Plan: [notables and ties](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-27-thr-1630-notables-and-ties.md). *— from tb-design-lane* (say "veto notables and ties")
- [Let written encounters land](https://linear.app/threadbare/issue/THR-1633): **being built.** About 400 of the 514 written encounters never reach a mortal, so existing writing is made reachable before anyone writes more. Calls made: each mortal's 40-option shortlist is filled fairly; mortals who choose for themselves can join guilds that suit them; The First gets no special rule; place-trait bonuses use tags encounters already carry. Plan: [let written encounters land](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-27-thr-1633-written-encounters-land.md). *— from tb-design-lane* (say "veto written encounters land")
- [Culture and spheres showing through](https://linear.app/threadbare/issue/THR-1635): **complete and live.** The machinery ([#2091](https://github.com/christianspliid-ui/threadbare/pull/2091)) and the full set of culture and sphere lines ([#2110](https://github.com/christianspliid-ui/threadbare/pull/2110)) are both merged. Your five playthrough encounters stay untouched. Plan: [culture and spheres in encounter openings](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-27-thr-1635-culture-sphere-openings.md). *— from tb-design-lane* (say "veto culture openings"; this one drops off in about two hours)

Say "veto <title>" to reverse any of these.

## Queue

**Healthy: 4 jobs ready to build, none being built right now.** The builder finished two jobs this hour and picks up the next one at about 06:10.

- **Ready:**
  - [People only step into the spotlight when there is room](https://linear.app/threadbare/issue/THR-1653): next step of notables and ties.
  - [A journey keeps its goal](https://linear.app/threadbare/issue/THR-1639): second step of let written encounters land.
  - [The player meets the past](https://linear.app/threadbare/issue/THR-1656): the "Before you woke" chronicle section, and one line about the past on each settlement, ruin and dead person's page. Newly queued.
  - [The past feeds ambitions](https://linear.app/threadbare/issue/THR-1657): a hero sets out to avenge a fallen commander, another chases a wonder's legend. Newly queued.
- **The fight system is live but not ready for you to review.** No one-click link opens a fight the way the encounter links above open an encounter. Until a builder adds one, a review would mean hunting for a fight.

## Health

- **The slow simulation tests are red on the latest `main`** ("Heavy simulation tests", 4 h, five runs in a row). A builder owes a follow-up fix. It does not block merges or the live site.
- **Game speed got worse again, and it is not noise:** tick cost 132 ms/tick steady, 70% above the 7-day median (78, 140 rows since df1cf66c); top phase agent_decision, 509 agents. Name the merges between df1cf66c and a5c41a3f: `git log --oneline --merges df1cf66c..a5c41a3f`. Last hour read 118 on a44bb6f4; since then [#2109](https://github.com/christianspliid-ui/threadbare/pull/2109) (world with a past) and [#2110](https://github.com/christianspliid-ui/threadbare/pull/2110) (culture lines) merged, and the world ends with 20 more agents. A builder's job, not yours.
- **Lane silence:** the worst recent gap was 13.6 hours, from Tuesday evening 22 September into Wednesday morning. Overnight quiet is normal, so you don't need to do anything.
- **Everything else is green:**
  - The live site is serving the latest commit on `main` (a5c41a3f).
  - Automated checks and the three background jobs are running normally. No pull requests are waiting to merge.
  - All ten scheduled lanes are on time. The worktree cleaner ran at 05:40; five old worktrees await a decision by the cleaner itself.
