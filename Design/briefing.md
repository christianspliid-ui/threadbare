# Briefing
**Generated:** 2026-09-30 20:57 local (18:57 UTC) · keep-work-flowing-cc

## The one thing

**Finish the playthrough. Two encounters are left, and the screen is clean.** ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with))

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

Everything from your four feedback batches is live. The one question is: **played together, are the encounters good enough now?** If yes, the next stage opens: encounters that reach into factions, war, the economy and divine actions. Everyday rolls lost a hidden discount yesterday, so your five encounters may feel a little harder than before.

## Also waiting (4)

- **New: were you away from yesterday evening until this evening?** No lane ran for about 25 hours, from Tuesday ~19:30 to Wednesday ~20:20 your time, and nothing recorded a pause. If you were away or the app was closed, just say so. *— from the lane-silence check*
- **Turn off Linear's auto-complete for sub-issues** at [Team settings → General](https://linear.app/threadbare/settings/teams/THR/general). It marks unbuilt work as finished. *— from tb-orchestrator*
- **Were you away from the app on Monday 14 and Tuesday 15 September?** *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md)*
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

## Decided for you

- [The seeded spell generator](https://linear.app/threadbare/issue/THR-1572/design-the-seeded-spell-generator-plan-doc-from-the-powers-and): **each school of magic gets its own book of about six spells, written fresh for every world from the ideas you judged in the twenty-spell sample.** Today all 109 casters on the test world carry the same spell. Calls made:
  - A caster's school comes from their work and the people they serve, not their sphere.
  - No mortal gets a spell of their own.
  - No spell speeds up the end of the world; a dark art costs the caster part of their soul, and leaves a hidden mark a later encounter can bring out.
  - A cast spell must change something you can see.
  - Elder magic (Order, Chaos, Light, Darkness) exists only in a school's two highest spells, so it stays something to find.

  Plan: [the seeded spell generator](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-30-thr-1572-seeded-spell-generator.md). Spells are still not ready for you to look at. *— from tb-design-lane* (veto window closes around 20:45 tomorrow)

Say "veto <title>" to reverse any of these.

## Queue

**Thin: 3 jobs ready to build, 1 being built.** The lanes were dark for 25 hours and have just come back; the builder's next run is around 21:10 tonight.

- **Ready:** [the seeded spell generator](https://linear.app/threadbare/issue/THR-1572/design-the-seeded-spell-generator-plan-doc-from-the-powers-and), [expert everyday encounters, batch 1](https://linear.app/threadbare/issue/THR-1678), and [a reputation chip that names the town instead of the person](https://linear.app/threadbare/issue/THR-1685).
- **Stuck, not almost done:** [the visit to the ruin](https://linear.app/threadbare/issue/THR-1664) is built in [pull request #2151](https://github.com/christianspliid-ui/threadbare/pull/2151), but it now clashes with newer code and its required check is red, so it cannot merge on its own. It has held the one build slot for 30 hours. The builder should resume it on its next run.

## Health

- **The builder lane has not run since yesterday ~19:10.** That is the same 25-hour outage every lane had, and its next slot is ~21:10 tonight. If that slot passes without a run, it is a real stall. This is a builder's job.
- **[Pull request #2151](https://github.com/christianspliid-ui/threadbare/pull/2151):** "A finished change has been stuck for 27 hours and cannot merge on its own: PR #2151 has a conflict that repeated automated attempts have not cleared. … #2151 also has a failing required check. Read the failing check before resolving." This is a builder's job.
- **Slow simulation tests:** "\"Heavy simulation tests\" has failed every one of its last 4 scheduled runs … failing on main for 30 hours and nobody has picked it up — the code on main has a problem the merge gate does not check." This is a builder's job.
- **A third of some factions' senior and elite jobs are still unreachable in a long game** (14 of 60 gated encounters blocked). The blocked families moved since yesterday, which points at world make-up, not one broken gate. Detail: [orchestrator report](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-30.md). This is a builder's job.
- **The home checkout is 172 commits behind `main`** and has been stuck since Monday morning. A stray untracked copy of the faith-and-politics plan there probably blocks the update. This is a builder's job.
