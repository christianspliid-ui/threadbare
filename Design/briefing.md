# Briefing
**Generated:** 2026-09-29 11:58 local (09:58 UTC) · keep-work-flowing-cc

## The one thing

**Finish the playthrough. Two encounters are left, and the screen is clean.** ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with))

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

Everything from your four feedback batches is live. The one question is: **played together, are the encounters good enough now?** If yes, the next stage opens: encounters that reach into factions, war, the economy and divine actions. Everyday rolls lost a hidden discount this morning, so steps now roll exactly as hard as their word says (see *Decided for you*). Your five encounters may feel a touch harder for it.

## Also waiting (3)

- **Turn off Linear's auto-complete for sub-issues** at [Team settings → General](https://linear.app/threadbare/settings/teams/THR/general). It marks unbuilt work as finished. *— from tb-orchestrator*
- **Were you away from the app on Monday 14 and Tuesday 15 September?** *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md)*
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

## Decided for you

- [Journeymen and experts have almost nothing to attempt](https://linear.app/threadbare/issue/THR-1627): **step one is built and live** ([#2143](https://github.com/christianspliid-ui/threadbare/pull/2143)). Calls made: the hidden discount on everyday rolls goes, so success falls from about 71% to about 62%, inside your 50–65% band; the new content is ordinary town life, not more ruins; three journeyman, two expert and one master encounter per Reach, journeymen first, stopping early if it already works; masters get no suitable monster yet. You are not asked to review it beyond the factory's usual 2-of-6 samples. Plan: [content above novice](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-29-thr-1627-content-above-novice.md). *— from tb-design-lane*
- [The power runtime: spells carried and cast](https://linear.app/threadbare/issue/THR-1571): **step one is built and live** ([#2136](https://github.com/christianspliid-ui/threadbare/pull/2136)); **step two is merging** ([#2145](https://github.com/christianspliid-ui/threadbare/pull/2145), set to merge once its checks pass). Calls made: the same roll decides the step and the spell, and your cards bend both; the mortal casts only when a step looks worse than they would normally take on; a spell's price bites by its kind (strain, gamble, transgression); lifting a curse lifts it from one person; monsters are born with one power of their kind. Plan: [the power runtime](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-29-thr-1571-power-runtime.md). *— from tb-design-lane*
- [Finish the encounters the player actually meets](https://linear.app/threadbare/issue/THR-1634): **both steps are live**: the everyday ten ([#2129](https://github.com/christianspliid-ui/threadbare/pull/2129)) and The First's own draws ([#2144](https://github.com/christianspliid-ui/threadbare/pull/2144)). The next ten most-played are queued ([THR-1667](https://linear.app/threadbare/issue/THR-1667)). Calls made: the list was re-drawn from today's game; background mortals' lines count too; no new rule to make encounters fire less often; no endings written from scratch. Plan: [finish the encounters the player meets](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-28-thr-1634-finish-the-encounters-the-player-meets.md). *— from tb-design-lane*
- [Seeded things that stay alive](https://linear.app/threadbare/issue/THR-1636): **both steps are live**: trade lanes ([#2125](https://github.com/christianspliid-ui/threadbare/pull/2125)) and a lead is a reason to look ([#2140](https://github.com/christianspliid-ui/threadbare/pull/2140)). Calls made: a lane lives while both its towns stand and nothing blocks it; no caravans walk the map; a blockade halts a lane but does not destroy it; finding a ruin works like a hunt. Plan: [seeded things that stay alive](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-28-thr-1636-seeded-things-stay-alive.md). *— from tb-design-lane*

Say "veto <title>" to reverse any of these.

## Queue

**Healthy: 5 jobs ready to build, 1 being built.**

- **Being built:** [a caster casts in the scene](https://linear.app/threadbare/issue/THR-1670). Its pull request [#2145](https://github.com/christianspliid-ui/threadbare/pull/2145) will merge by itself once its checks pass.
- **Bug next:** [on arrival The First turns round and walks back for the same encounter](https://linear.app/threadbare/issue/THR-1674). Its fix is expected to turn the slow background tests green again (see Health).
- **Harder content:** [six everyday encounters for journeymen](https://linear.app/threadbare/issue/THR-1676) and [two expert-level monsters](https://linear.app/threadbare/issue/THR-1682). You will be asked to sample 2 of the 6 when the first ships.
- **More finished encounters:** [the next ten most-played get their at-cost and crit lines](https://linear.app/threadbare/issue/THR-1667).
- **Spells:** [monsters born with a power](https://linear.app/threadbare/issue/THR-1671).
- **Spells are not ready for you to look at yet.** You only see a cast on the step once [THR-1670](https://linear.app/threadbare/issue/THR-1670) is live, and the spell generator ([THR-1572](https://linear.app/threadbare/issue/THR-1572)) has not filled the shelf.
- **The fight system is live but not ready for you to review.** No one-click link opens a fight the way the encounter links above open an encounter.

## Health

- **A third of the factions can no longer reach their senior and elite jobs in a long game.** The orchestrator's overnight check went from pass to fail. This is a builder's job. Detail: [orchestrator report](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-29c.md).
- **The slow background test run is red on `main`** (about 6 hours now). It blocks nothing; the queued bug fix [THR-1674](https://linear.app/threadbare/issue/THR-1674) is expected to clear it. Not yours.
- **The home checkout is 133 commits behind `main`**, stuck for about a day. A stray untracked copy of the faith-and-politics plan there probably blocks the update. This is a builder's job.
- **Lane silence:** the worst recent gap was 13.6 hours, Tuesday evening 22 September into Wednesday morning. Overnight quiet is normal, so you don't need to do anything.
- **Everything else is green:**
  - The live site is up to date (77b2b571).
  - Game speed: 87 ms per tick, 9% over the weekly median (79), which is within the normal range.
  - Automated checks are running; one pull request is set to merge once its checks pass.
  - All ten scheduled lanes are on time. The worktree cleaner reports five old worktrees awaiting its own decision.
