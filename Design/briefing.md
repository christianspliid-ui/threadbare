# Briefing
**Generated:** 2026-09-26 09:58 local (07:58 UTC) · keep-work-flowing-cc

## The one thing

**Finish the "world that starts alive" map: two questions are left, both yours.** ([the map](https://linear.app/threadbare/issue/THR-1589))

1. **How much history should a new world start with?** ([THR-1591](https://linear.app/threadbare/issue/THR-1591)) Read the samples: [seed 42](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1591-world-with-a-past/Docs/audits/2026-09-25-living-world-data/proto-thr-1591/sample-seed-42.md) and [seed 99](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1591-world-with-a-past/Docs/audits/2026-09-25-living-world-data/proto-thr-1591/sample-seed-99.md). The recommendation is **A, explain the map**: every town gets a founding, plus one ancient war, 2–3 recent wars and 5–10 named dead.
2. **Faith and politics at game start** ([THR-1596](https://linear.app/threadbare/issue/THR-1596)): what the world believes and who rules it on day one. Three options are in the ticket.

Once both are answered, the design lane can turn the map into build work. Open a chat and say "work the map". *— from tb-design-lane and tb-orchestrator*

## Also waiting (4)

- **Finish the playthrough: two encounters left, and the screen is clean** ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with)): [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge) and [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan).
- **Turn off Linear's auto-complete for sub-issues** at [Team settings → General](https://linear.app/threadbare/settings/teams/THR/general). It closes unbuilt work. *— from tb-orchestrator*
- **Were you away from the app on Monday 14 and Tuesday 15 September?** *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md)*
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

## Decided for you

- [The seeded item generator](https://linear.app/threadbare/issue/THR-1570/design-the-seeded-item-generator-plan-doc-from-the-item-generator-map) — five decisions in [one plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-26-thr-1570-seeded-item-generator.md):
  - **Masterworks come first.** Each is born with an idea, a real power and often a real price.
  - **How the work went sets the rank.** A brilliant final day makes it *Mythic*, anything else *Storied*. A workshop never makes a *Legendary*.
  - **"Storied" means "has a history".** Every generated item of Storied rank or higher carries the history trait.
  - **Half of Storied and Mythic loot will be generated**, once loot draws use the generator ([later step](https://linear.app/threadbare/issue/THR-1626/item-generator-minting-point-2-reward-draws-carry-generated-items-at)).
  - **Art** uses the picture for the item's kind.

  *— from tb-design-lane*
- [Culture and spheres showing through](https://linear.app/threadbare/issue/THR-1599): culture and a place's sphere show in an encounter as **one extra sentence stating a local fact that bears on the test**. Read the samples: [seed 42](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1599-culture-sphere-layer/Docs/audits/2026-09-25-living-world-data/proto-thr-1599/sample-seed-42.md) · [seed 99](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1599-culture-sphere-layer/Docs/audits/2026-09-25-living-world-data/proto-thr-1599/sample-seed-99.md). *— from tb-design-lane*
- [Re-fit the dice](https://linear.app/threadbare/issue/THR-1581) and [mortals take on challenges they can win about half the time](https://linear.app/threadbare/issue/THR-1582) **ship together as one change**. Plan: [forecast window § Amendment 2026-09-26](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-24-thr-1575-forecast-window.md). *— from tb-design-lane*

Say "veto <title>" to reverse any of these.

## From Christian

- **07:05 UTC, on the dice change:** *"follow the newer decisions, we learn and grow and evolve. 1 in 6 is fine."* and *"it doesnt have to be a rule, it is a constant we tweak as we search for a good game."*
  - The July "at a cost" band is now a constant to tune, not a stop.
  - I recorded the ruling on [THR-1581](https://linear.app/threadbare/issue/THR-1581), so the builder can finish and ship the change at its next slot.

## Queue

**Healthy: 15 jobs are ready.** The only job in progress is the dice change.

- **The dice change is unblocked by your answer** ([THR-1581](https://linear.app/threadbare/issue/THR-1581), High). It is built on [its branch](https://github.com/christianspliid-ui/threadbare/tree/thr-1581-dice-refit), and its tests are still owed. Nobody is building it yet. The next pickup run, around 10:11 local, should resume it.
- **Shipped since last hour:** [non-casters are no longer offered "create a power"](https://linear.app/threadbare/issue/THR-1617) (via [#2066](https://github.com/christianspliid-ui/threadbare/pull/2066)). It is live on the site.
- **Fight system: nearly ready, not yet a review ask.** Everything is live except [the lair elites' portraits](https://linear.app/threadbare/issue/THR-1554), which are queued.
- [Heroes' starting faction membership carries no standing](https://linear.app/threadbare/issue/THR-1620) and [the item generator build](https://linear.app/threadbare/issue/THR-1570) have no priority set.

## Health

- **Lane silence:** the worst recent gap was 25 hours, from Saturday 19 into Sunday 20 September. It fell on a weekend, so your 11 September ruling declines it.
- **Worktree reaper:** last ran at 09:40 local. 5 worktrees are waiting to be sorted, which is routine.
- **Everything else is green:**
  - The live site is up to date.
  - Game speed is 73 ms per tick, 3% under the weekly median.
  - All ten scheduled lanes are on time.
  - No pull requests are waiting.
  - The home tree is on `main` and current.
