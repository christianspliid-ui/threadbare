# Briefing
**Generated:** 2026-09-30 22:58 local (20:58 UTC) · keep-work-flowing-cc

## The one thing

**Finish the playthrough. Two encounters are left, and the screen is clean.** ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with))

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

Everything from your four feedback batches is live. The one question is: **played together, are the encounters good enough now?** If yes, the next stage opens: encounters that reach into factions, war, the economy and divine actions. Everyday rolls lost a hidden discount yesterday, so your five encounters may feel a little harder than before.

## Also waiting (4)

- **Were you away from yesterday evening until this evening?** No lane ran for about 25 hours, from Tuesday ~19:30 to Wednesday ~20:20 your time, and nothing recorded a pause. If you were away or the app was closed, just say so. *— from the lane-silence check*
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

**Thin but moving: 2 jobs ready to build, 1 being built.**

- **Being built:** [expert everyday encounters, batch 1](https://linear.app/threadbare/issue/THR-1678) was picked up at ~22:10. Its six encounters are drafted and saved on [its branch](https://github.com/christianspliid-ui/threadbare/tree/thr-1678-expert-everyday-1) (checkpoint at 22:48), and checking is under way.
- **Ready:** [the seeded spell generator](https://linear.app/threadbare/issue/THR-1572/design-the-seeded-spell-generator-plan-doc-from-the-powers-and) and [a reputation chip that names the town instead of the person](https://linear.app/threadbare/issue/THR-1685).

## Health

- **Slow simulation tests:** "\"Heavy simulation tests\" has failed every one of its last 4 scheduled runs … \"Heavy simulation tests\" has been failing on main for 32 hours and nobody has picked it up — the code on main has a problem the merge gate does not check." This is a builder's job.
- **The simulation got slower:** "tick cost 109 ms/tick steady, 33% above the 7-day median (82, 139 rows since 95999554); top phase agent_decision, 534 agents. Name the merges between 95999554 and 9ce5b0f3: git log --oneline --merges 95999554..9ce5b0f3" This is a builder's job.
- **A third of some factions' senior and elite jobs are still unreachable in a long game** (14 of 60 gated encounters blocked). Detail: [orchestrator report](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-30.md). This is a builder's job.
- **The home checkout is 182 commits behind `main`** and has been stuck since Monday morning. A stray untracked copy of the faith-and-politics plan there probably blocks the update. This is a builder's job.
