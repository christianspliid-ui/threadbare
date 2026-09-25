---
lane: tb-design-lane
run: 2026-09-25a
promoted: 0
filed: 1
resolved: 0
newFindings: 0
needsChristian: true
---
# Design lane — 2026-09-25 (run a, ~19:40Z)

## Needs Christian

- **[A world with a past](https://linear.app/threadbare/issue/THR-1591): how much history should a new world start with?** The sample to react to is ready: [seed 42](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1591-world-with-a-past/Docs/audits/2026-09-25-living-world-data/proto-thr-1591/sample-seed-42.md) and [seed 99](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1591-world-with-a-past/Docs/audits/2026-09-25-living-world-data/proto-thr-1591/sample-seed-99.md). Each has a "Before you woke" chronicle page, two place-sheet lines and the dead. There are three options:
  - **A (recommended), explain the map.** The world already hides three dead empires and 103 ruins that nothing explains. Give every town a founding, add one ancient war and 2–3 recent wars, and 5–10 named dead. The player sees it in the chronicle and on place sheets.
  - **B, flavor text only.**
  - **C, a deep simulated history.**
  - Two smaller calls also need you. Is the past shown on the first screen or found by visiting? (Lean: outline shown, details found.) Did the rival gods have a hand in it? (Lean: no.)
- **[Faith and politics at game start](https://linear.app/threadbare/issue/THR-1596)** is now listed as yours on [the living-world map](https://linear.app/threadbare/issue/THR-1589). Nothing is new on it; the analysis you agreed already called it your creative fork.

## Decided for you

Nothing decided this run. The only ticket worked is a creative fork, so it is reserved for you, not decided.

## Work

- **Claimed, prototyped and reserved** [A world with a past](https://linear.app/threadbare/issue/THR-1591).
  - Wrote a throwaway generator that adds a history to a real seed-42 and seed-99 world, and pushed it to branch `proto/thr-1591-world-with-a-past` (never merged; [README](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1591-world-with-a-past/Docs/audits/2026-09-25-living-world-data/proto-thr-1591/README.md)). It runs in 9–10 ms at world creation and adds nothing per tick.
  - Measured four engine facts that shape the real pass:
    - Pre-start events feed no ambition unless the pass mints one explicitly.
    - Chronicle entries are wiped every cycle.
    - Two per-tick scanners walk every event, so the pass should write about 6, not 100.
    - A "descent from a dead empire" field is read by clue scoring but written by nothing.
  - The decision comment with options and file:line evidence is [on the ticket](https://linear.app/threadbare/issue/THR-1591). The ticket is back in Todo, unassigned.
- **Filed** [Culture names leak raw biome ids](https://linear.app/threadbare/issue/THR-1622): "The Open Earth of the mountain_pass" on seed 42, "…light_forest" on seed 99. It is in Ready for Dev with its coordination block.
- **Map** [a world that starts alive](https://linear.app/threadbare/issue/THR-1589) gained a *Reserved for Christian* section listing both creative forks. One frontier ticket is left for the lane: [Culture and spheres showing through](https://linear.app/threadbare/issue/THR-1599), a prototype that is not a named fork.

## Escalations

None.
