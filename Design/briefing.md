# Briefing
**Generated:** 2026-09-28 08:58 local (06:58 UTC) · keep-work-flowing-cc

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

- [Faith and politics as world settings](https://linear.app/threadbare/issue/THR-1632): **new: the plan is written and ready to build.** It follows your "tunable, and start with something we can test" direction. By default, every living culture gets its own congregation of the Temple of the Spheres, each culture's land carries at least two shrines or temples, wild towns stay unheld, and town guilds are labelled as guilds. Calls made: "congregation", not "chapter", because "chapter" already means part of an encounter; each congregation sits in its culture's capital and never takes a wild town; the sphere it venerates colours its page and holy places but does not decide who may join; towns within 8 hexes of a culture's lands carry it weakly as a "fringe"; pilgrim routes stay, one per congregation, and mortals founding new ones gets its own design ([THR-1660](https://linear.app/threadbare/issue/THR-1660)); the six world-wide guilds stay as they are. Plan: [faith and politics as world settings](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-28-thr-1632-faith-and-politics-settings.md). *— from tb-design-lane* (say "veto faith and politics")
- [A world with a past](https://linear.app/threadbare/issue/THR-1631): **step one is merged and live** ([#2109](https://github.com/christianspliid-ui/threadbare/pull/2109)). Next, both ready to build: [the player meets the past](https://linear.app/threadbare/issue/THR-1656) and [the past feeds ambitions](https://linear.app/threadbare/issue/THR-1657). Calls made: ages are words, not numbers; only capitals get a named founder; details are found by seeing a place or using Find or Perceive; only heroes who already choose for themselves get wants from the past; "win back the old homeland" waits for later; the past is stored in the world, so saved games carry it. Plan: [a world with a past](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-28-thr-1631-world-with-a-past.md). *— from tb-design-lane* (say "veto world with a past")
- [Someone who wants something in every settlement, and people tied to each other](https://linear.app/threadbare/issue/THR-1630): **two steps merged and live** ([#2106](https://github.com/christianspliid-ui/threadbare/pull/2106), [#2112](https://github.com/christianspliid-ui/threadbare/pull/2112)); step three, [one notable in every settlement](https://linear.app/threadbare/issue/THR-1654), is ready to build. Calls made: family is "kin" everywhere; a hero's starting Realm is the one that holds their home; a local figure's ambitions stay local; masters and apprentices wait. Plan: [notables and ties](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-27-thr-1630-notables-and-ties.md). *— from tb-design-lane* (say "veto notables and ties")
- [Let written encounters land](https://linear.app/threadbare/issue/THR-1633): **being built.** The "fair shortlist" change is waiting on its checks ([#2114](https://github.com/christianspliid-ui/threadbare/pull/2114)). Calls made: each mortal's 40-option shortlist is filled fairly; mortals who choose for themselves can join guilds that suit them; The First gets no special rule; place-trait bonuses use tags encounters already carry. Plan: [let written encounters land](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-27-thr-1633-written-encounters-land.md). *— from tb-design-lane* (say "veto written encounters land"; this one drops off at about 14:50)

Say "veto <title>" to reverse any of these.

## Queue

**Healthy: 4 jobs ready to build, 1 being built.**

- Being built: [let written encounters land](https://linear.app/threadbare/issue/THR-1633). The fair-shortlist change is pushed and will merge when its checks pass ([#2114](https://github.com/christianspliid-ui/threadbare/pull/2114)).
- [One notable in every settlement](https://linear.app/threadbare/issue/THR-1654): each town gets someone with a holding, an old quarrel, a secret or a favour, and a local agenda.
- [The player meets the past](https://linear.app/threadbare/issue/THR-1656): the "Before you woke" chronicle section, and one line about the past on each settlement, ruin and dead person's page.
- [The past feeds ambitions](https://linear.app/threadbare/issue/THR-1657): a hero sets out to avenge a fallen commander, another chases a wonder's legend.
- [Faith and politics as world settings](https://linear.app/threadbare/issue/THR-1632): the plan just landed; the build tickets come next.
- **The fight system is live but not ready for you to review.** No one-click link opens a fight the way the encounter links above open an encounter. Until a builder adds one, a review would mean hunting for a fight.

## Health

- **Game speed has slowed again:** tick cost 110 ms/tick steady, 42% above the 7-day median (78, 143 rows since df1cf66c); top phase agent_decision, 493 agents. Name the merges between df1cf66c and 501bba92: git log --oneline --merges df1cf66c..501bba92. Last hour's reading was 93. This is a builder's job, not yours.
- **The slow simulation tests keep flipping between red and green on `main`** ("Heavy simulation tests": [red on the latest](https://github.com/christianspliid-ui/threadbare/actions/runs/36382963071), green one merge earlier, red before that). That pattern looks like a flaky test rather than a real break. A builder owes a look. It does not block merges or the live site.
- **The home checkout has a stray empty file** (`Docs/plans/2026-09-28-thr-1632-faith-and-politics-settings.md`, 0 bytes, untracked) with the same name as the plan that just merged. It may stop the home copy from updating to the latest `main` (it is 3 commits behind). The next builder run should clear it.
- **Lane silence:** the worst recent gap was 13.6 hours, from Tuesday evening 22 September into Wednesday morning. Overnight quiet is normal, so you don't need to do anything.
- **Everything else is green:**
  - The live site is up to date; the newest commits only touched plans and docs.
  - Automated checks and the three background jobs are running normally.
  - All ten scheduled lanes are on time. The worktree cleaner's latest run (08:40) reports five old worktrees awaiting its own decision.
