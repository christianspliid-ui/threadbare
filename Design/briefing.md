# Briefing
**Generated:** 2026-09-29 05:57 local (03:57 UTC) · keep-work-flowing-cc

## The one thing

**Finish the playthrough. Two encounters are left, and the screen is clean.** ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with))

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

Everything from your four feedback batches is live. The one question is: **played together, are the encounters good enough now?** If yes, the next stage opens: encounters that reach into factions, war, the economy and divine actions. None of the work queued below touches these five encounters, so nothing changes while you play.

## Also waiting (3)

- **Turn off Linear's auto-complete for sub-issues** at [Team settings → General](https://linear.app/threadbare/settings/teams/THR/general). It marks unbuilt work as finished. *— from tb-orchestrator*
- **Were you away from the app on Monday 14 and Tuesday 15 September?** *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md)*
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

## Decided for you

- [The power runtime: spells carried and cast](https://linear.app/threadbare/issue/THR-1571): **step one is built and live** ([#2136](https://github.com/christianspliid-ui/threadbare/pull/2136)). Every priest, healer, scholar and other caster (104 on a medium world) starts with one spell of their tradition, and a cast spell does what it says. Calls made: the same roll decides the step and the spell, and your cards bend both; the mortal decides to cast, only when a step looks worse than they would normally take on; a spell's price bites by its kind (strain, gamble, transgression); lifting a curse lifts it from one person; monsters are born with one power of their kind. You are not asked to try it yet. Plan: [the power runtime](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-29-thr-1571-power-runtime.md). *— from tb-design-lane* (say "veto the power runtime")
- [Finish the encounters the player actually meets](https://linear.app/threadbare/issue/THR-1634): step one is live ([#2129](https://github.com/christianspliid-ui/threadbare/pull/2129)); step two is queued as [THR-1666](https://linear.app/threadbare/issue/THR-1666), covering the ten scenes The First draws that step one did not reach. Calls made: the list was re-drawn from today's game; background mortals' lines count too; no new rule to make encounters fire less often; no endings written from scratch; you are not asked to sample this work. Plan: [finish the encounters the player meets](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-28-thr-1634-finish-the-encounters-the-player-meets.md). *— from tb-design-lane* (say "veto finish the encounters")
- [Seeded things that stay alive](https://linear.app/threadbare/issue/THR-1636): step one (trade lanes) is live ([#2125](https://github.com/christianspliid-ui/threadbare/pull/2125)); [a lead is a reason to look](https://linear.app/threadbare/issue/THR-1663) is queued next. Calls made: a lane lives while both its towns stand and nothing blocks it, whatever it carries; no caravans walk the map; a blockade halts a lane but does not destroy it; finding a ruin works like a hunt; rumours lean toward mortals who can act on them. Plan: [seeded things that stay alive](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-28-thr-1636-seeded-things-stay-alive.md). *— from tb-design-lane* (say "veto seeded things")
- [Faith and politics as world settings](https://linear.app/threadbare/issue/THR-1632): step one is live ([#2124](https://github.com/christianspliid-ui/threadbare/pull/2124)); [the player sees faith and fringe](https://linear.app/threadbare/issue/THR-1659) is queued. Calls made: "congregation", not "chapter"; each congregation sits in its culture's capital and never takes a wild town; the venerated sphere colours its page but does not decide who may join; towns within 8 hexes of a culture's lands read as its "fringe"; one pilgrim route per congregation; the six world-wide guilds stay. Plan: [faith and politics as world settings](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-28-thr-1632-faith-and-politics-settings.md). *— from tb-design-lane* (say "veto faith and politics")

Say "veto <title>" to reverse any of these.

## Queue

**Healthy: 6 jobs ready to build, 1 being built.** [The past feeds ambitions](https://linear.app/threadbare/issue/THR-1657) is finished and waiting on its checks ([#2138](https://github.com/christianspliid-ui/threadbare/pull/2138)); it merges itself when they go green.

- **The living world, next up:** [the player sees faith and fringe](https://linear.app/threadbare/issue/THR-1659), [a lead is a reason to look](https://linear.app/threadbare/issue/THR-1663), and [finish the encounters, step two](https://linear.app/threadbare/issue/THR-1666).
- **Spells, next up:** [a caster casts in the scene](https://linear.app/threadbare/issue/THR-1670) and [monsters born with a power](https://linear.app/threadbare/issue/THR-1671). The glossary words "lead" and "delve" ([THR-1662](https://linear.app/threadbare/issue/THR-1662)) are queued under your standing delegation.
- **Faith and politics is not ready for you to look at yet.** The world has it, but nothing on screen shows it until [THR-1659](https://linear.app/threadbare/issue/THR-1659) ships.
- **Spells are not ready for you to look at yet.** Casters carry and cast them, but you only see a cast on the step once [THR-1670](https://linear.app/threadbare/issue/THR-1670) ships, and the spell generator ([THR-1572](https://linear.app/threadbare/issue/THR-1572)) has not filled the shelf.
- **The fight system is live but not ready for you to review.** No one-click link opens a fight the way the encounter links above open an encounter. Until a builder adds one, a review would mean hunting for a fight.

## Health

- **The slow background test run failed on the latest `main`** (about an hour ago). It runs after merges and does not block anything, but a builder owes a fix. Not yours.
- **The game is still slower than usual: 102 ms per tick, 29% above the weekly median (79)**, past the 25% line. The busiest part is mortals deciding what to do (516 on the test world); the merges since the baseline are listed by `git log --oneline --merges 20ee315a..cac08e12`. A builder's job, not yours.
- **The home checkout is 104 commits behind `main`**, stuck for about 22 hours. The stray untracked copy of `Docs/plans/2026-09-28-thr-1632-faith-and-politics-settings.md` there has the same name as a merged plan, which probably blocks the update. A builder's job, not yours.
- **Lane silence:** the worst recent gap was 13.6 hours, from Tuesday evening 22 September into Wednesday morning. Overnight quiet is normal, so you don't need to do anything.
- **Everything else is green:**
  - The live site is up to date (cac08e12, who matters here).
  - Automated checks are running; one pull request is waiting on its checks and will merge on green.
  - All ten scheduled lanes are on time. The worktree cleaner reports five old worktrees awaiting its own decision.
