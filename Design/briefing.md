# Briefing
**Generated:** 2026-09-29 14:56 local (12:56 UTC) · keep-work-flowing-cc

## The one thing

**Finish the playthrough. Two encounters are left, and the screen is clean.** ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with))

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

Everything from your four feedback batches is live. The one question is: **played together, are the encounters good enough now?** If yes, the next stage opens: encounters that reach into factions, war, the economy and divine actions. Everyday rolls lost a hidden discount this morning, so steps now roll exactly as hard as their word says (see *Decided for you*). Your five encounters may feel a little harder because of it.

## Also waiting (3)

- **Turn off Linear's auto-complete for sub-issues** at [Team settings → General](https://linear.app/threadbare/settings/teams/THR/general). It marks unbuilt work as finished. *— from tb-orchestrator*
- **Were you away from the app on Monday 14 and Tuesday 15 September?** *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md)*
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

## Decided for you

- [Journeymen and experts have almost nothing to attempt](https://linear.app/threadbare/issue/THR-1627): **step one is built and live** ([#2143](https://github.com/christianspliid-ui/threadbare/pull/2143)). Calls made: the hidden discount on everyday rolls goes, so success falls from about 71% to about 62%, inside your 50–65% band; the new content is ordinary town life, not more ruins; three journeyman, two expert and one master encounter per Reach, journeymen first, stopping early if it already works; masters get no suitable monster yet. You are not asked to review it beyond the factory's usual 2-of-6 samples. Plan: [content above novice](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-29-thr-1627-content-above-novice.md). *— from tb-design-lane* (veto window closes around 08:55 tomorrow)
- [The power runtime: spells carried and cast](https://linear.app/threadbare/issue/THR-1571): **all three steps are live** ([#2136](https://github.com/christianspliid-ui/threadbare/pull/2136), [#2145](https://github.com/christianspliid-ui/threadbare/pull/2145), [#2147](https://github.com/christianspliid-ui/threadbare/pull/2147)). Calls made: the same roll decides the step and the spell, and your cards bend both; the mortal casts only when a step looks worse than they would normally take on; a spell's price bites by its kind (strain, gamble, transgression); lifting a curse lifts it from one person; monsters are born with one power of their kind. Plan: [the power runtime](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-29-thr-1571-power-runtime.md). *— from tb-design-lane* (veto window closes around 02:50 tomorrow)
- [Finish the encounters the player actually meets](https://linear.app/threadbare/issue/THR-1634): **all three steps are live**: the everyday ten ([#2129](https://github.com/christianspliid-ui/threadbare/pull/2129)), The First's own draws ([#2144](https://github.com/christianspliid-ui/threadbare/pull/2144)) and the next ten most-played ([#2146](https://github.com/christianspliid-ui/threadbare/pull/2146)). Calls made: the list was re-drawn from today's game; background mortals' lines count too; no new rule to make encounters fire less often; no endings written from scratch. Plan: [finish the encounters the player meets](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-28-thr-1634-finish-the-encounters-the-player-meets.md). *— from tb-design-lane* (veto window closes around 20:40 tonight)

Say "veto <title>" to reverse any of these. The veto window on *seeded things that stay alive* ([THR-1636](https://linear.app/threadbare/issue/THR-1636)) has closed.

## Queue

**Healthy: 2 jobs ready to build, none being built right now.** One job finished this past hour: the bug where [The First turned round on arrival and walked back for the same encounter](https://linear.app/threadbare/issue/THR-1674) is fixed ([#2148](https://github.com/christianspliid-ui/threadbare/pull/2148)). A small plan update for [seeded things that stay alive](https://github.com/christianspliid-ui/threadbare/pull/2149) is merging on its own. The design lane runs again at about 20:15.

- **Harder content next:** [six everyday encounters for journeymen](https://linear.app/threadbare/issue/THR-1676) and [two expert-level monsters](https://linear.app/threadbare/issue/THR-1682). You will be asked to sample 2 of the 6 when the first ships.
- **Spells are not ready for you to look at yet.** All three steps of the power runtime are live, but the spell generator ([THR-1572](https://linear.app/threadbare/issue/THR-1572)) has not been designed, so each caster still holds only one starting spell. A landed curse also changes nothing but the step's odds yet ([THR-1683](https://linear.app/threadbare/issue/THR-1683)).
- **The fight system is live but not ready for you to review.** No one-click link opens a fight the way the encounter links above open an encounter.

## Health

- **A third of the factions can no longer reach their senior and elite jobs in a long game.** The orchestrator's overnight check went from pass to fail. This is a builder's job. Detail: [orchestrator report](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-29c.md).
- **The home checkout is 151 commits behind `main`**, stuck since Monday morning. A stray untracked copy of the faith-and-politics plan there probably blocks the update. This is a builder's job.
- **Lane silence:** the worst recent gap was 13.6 hours, Tuesday evening 22 September into Wednesday morning. Overnight quiet is normal, so you don't need to do anything.
- **Everything else is green:**
  - The live site is up to date (e9510efe).
  - Game speed: 90 ms per tick, 12% over the weekly median (80), which is within normal.
  - Automated checks are running; one plan-doc pull request is waiting on checks and will merge on green.
  - All ten scheduled lanes are on time. The worktree cleaner has five old worktrees waiting on its own decision.
