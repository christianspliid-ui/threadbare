# Briefing
**Generated:** 2026-09-26 13:56 local (11:56 UTC) · keep-work-flowing-cc

## The one thing

**Finish the "world that starts alive" map. Two questions are left, and both are yours.** ([the map](https://linear.app/threadbare/issue/THR-1589))

1. **How much history should a new world start with?** ([THR-1591](https://linear.app/threadbare/issue/THR-1591)) Read the samples: [seed 42](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1591-world-with-a-past/Docs/audits/2026-09-25-living-world-data/proto-thr-1591/sample-seed-42.md) and [seed 99](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1591-world-with-a-past/Docs/audits/2026-09-25-living-world-data/proto-thr-1591/sample-seed-99.md). The recommendation is **A, explain the map**: every town gets a founding, plus one ancient war, 2–3 recent wars and 5–10 named dead.
2. **Faith and politics at game start** ([THR-1596](https://linear.app/threadbare/issue/THR-1596)): what the world believes and who rules it on day one. Three options are in the ticket.

Once both are answered, the design lane can turn the map into build work. Open a chat and say "work the map". *— from tb-design-lane and tb-orchestrator*

## Also waiting (4)

- **Finish the playthrough: two encounters are left, and the screen is clean** ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with)): [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge) and [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan).
- **Turn off Linear's auto-complete for sub-issues** at [Team settings → General](https://linear.app/threadbare/settings/teams/THR/general). It closes unbuilt work. *— from tb-orchestrator*
- **Were you away from the app on Monday 14 and Tuesday 15 September?** *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md)*
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

## Decided for you

- [The seeded item generator](https://linear.app/threadbare/issue/THR-1570/design-the-seeded-item-generator-plan-doc-from-the-item-generator-map). All five decisions are in [one plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-26-thr-1570-seeded-item-generator.md):
  - **Masterworks come first.** Each one is born with an idea, a real power and often a real price.
  - **How the work went sets the rank.** A brilliant final day makes it *Mythic*, and anything else makes it *Storied*. A workshop never makes a *Legendary*.
  - **"Storied" means "has a history".** Every generated item of Storied rank or higher carries the history trait.
  - **Half of Storied and Mythic loot will be generated**, once loot draws use the generator ([later step](https://linear.app/threadbare/issue/THR-1626/item-generator-minting-point-2-reward-draws-carry-generated-items-at)).
  - **Art** uses the picture for the item's kind.

  *— from tb-design-lane*
- [Culture and spheres showing through](https://linear.app/threadbare/issue/THR-1599): culture and a place's sphere show in an encounter as **one extra sentence stating a local fact that bears on the test**. Read the samples: [seed 42](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1599-culture-sphere-layer/Docs/audits/2026-09-25-living-world-data/proto-thr-1599/sample-seed-42.md) · [seed 99](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1599-culture-sphere-layer/Docs/audits/2026-09-25-living-world-data/proto-thr-1599/sample-seed-99.md). *— from tb-design-lane*
- [Re-fit the dice](https://linear.app/threadbare/issue/THR-1581) and [mortals take on challenges they can win about half the time](https://linear.app/threadbare/issue/THR-1582) **ship together as one change**. Plan: [forecast window § Amendment 2026-09-26](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-24-thr-1575-forecast-window.md). *— from tb-design-lane*

Say "veto <title>" to reverse any of these.

## Queue

**Healthy: 12 jobs are ready.** Nothing is in progress right now. [Culture and Realm names never show a raw terrain code](https://linear.app/threadbare/issue/THR-1622) merged via [#2070](https://github.com/christianspliid-ui/threadbare/pull/2070) and is live.

- **The dice change is back with the design lane, and you don't need to decide anything** ([THR-1581](https://linear.app/threadbare/issue/THR-1581), High). The dice work, but the world has almost nothing written for skilled mortals. The builder recommends shipping the dice now and writing that content as its own job. The design lane decides at its next run (about 14:15 local), and you can veto in chat. The work is saved on [its branch](https://github.com/christianspliid-ui/threadbare/tree/thr-1581-dice-refit).
- **Fight system: nearly ready, not yet a review ask.** Everything is live except [the lair elites' portraits](https://linear.app/threadbare/issue/THR-1554), which are queued.
- [Heroes' starting faction membership carries no standing](https://linear.app/threadbare/issue/THR-1620) and [the item generator build](https://linear.app/threadbare/issue/THR-1570) have no priority set.

## Health

- **The long simulation tests went red with the trade-route fix** ([#2069](https://github.com/christianspliid-ui/threadbare/pull/2069), [failing run](https://github.com/christianspliid-ui/threadbare/actions/runs/36236191804)). Two checks in `yieldBandCells.test.ts` fail: a mortal who holds a town is no longer offered its harvest, and a mortal who holds a lane is no longer offered its widening. They are still red on the newest `main`. No builder has claimed the follow-up fix yet. The live game is unaffected, and the required checks are green.
- **Lane silence:** the worst recent gap is still 21 hours, Sunday 20 evening into Monday 21 September afternoon. [The workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md) found the computer asleep for exactly that window, so it is explained and needs nothing from you.
- **Worktree reaper:** it last ran at 13:40 local. 5 worktrees are waiting to be sorted, which is routine.
- **Everything else is green:**
  - The live site is up to date.
  - Game speed is 59 ms per tick, 20% under the weekly median.
  - All ten scheduled lanes are on time.
  - No pull requests are waiting.
  - `main` is current.
