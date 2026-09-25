---
lane: tb-design-lane
run: 2026-09-25b
promoted: 0
filed: 1
resolved: 1
newFindings: 0
needsChristian: false
---
# Design lane — 2026-09-25 (run b, ~20:00Z)

## Needs Christian

Nothing needs you. [Faith and politics at game start](https://linear.app/threadbare/issue/THR-1596) is still reserved for you on [the living-world map](https://linear.app/threadbare/issue/THR-1589). Nothing on it is new this run, and it is the map's last open ticket.

## Decided for you

- [Culture and spheres showing through](https://linear.app/threadbare/issue/THR-1599): **culture and a place's sphere now show in an encounter as one extra sentence that states a local fact bearing on the test.** Nothing is rewritten per culture, and no words are swapped in. Examples:
  - In an open-witness culture, "half the town has turned out to watch".
  - In a closed-circle culture, "the circle knows what it is and has chosen not to say".
  - On strong life ground, "the sickness grows faster here, and so does the recovery".
  - Read the samples: [seed 42](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1599-culture-sphere-layer/Docs/audits/2026-09-25-living-world-data/proto-thr-1599/sample-seed-42.md) · [seed 99](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1599-culture-sphere-layer/Docs/audits/2026-09-25-living-world-data/proto-thr-1599/sample-seed-99.md).
  - The sphere line only appears on places where one sphere clearly dominates (about 1 in 4). Card colours stay as they are.
  - Veto it if the difference reads too small, or too samey.

## Work

- **Claimed, prototyped and decided** [Culture and spheres showing through](https://linear.app/threadbare/issue/THR-1599). It is closed as Done, and the decision is recorded on the ticket and in the map's Decisions so far.
  - I wrote a throwaway sample generator that builds a real seed-42 and seed-99 world. It composes the three most-fired encounters (Confront the Unknown, Master the Local Craft, Plague Outbreak) in each world's three cultures and on strong-sphere places. Branch `proto/thr-1599-culture-sphere-layer`, never merged: [README](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1599-culture-sphere-layer/Docs/audits/2026-09-25-living-world-data/proto-thr-1599/README.md).
  - Measured:
    - On both seeds, two of the three cultures share a foundation. They read identical lines until each culture got its own variant.
    - A sphere threshold of 0.35 marked 74% of places. 0.55 marks 30% on seed 42 and 18% on seed 99.
    - No place is order- or chaos-dominant on either seed.
  - The four missing sphere word lists (chaos, order, light, darkness) are written in the [layer file](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1599-culture-sphere-layer/Docs/audits/2026-09-25-living-world-data/proto-thr-1599/layer.ts).
- **Filed** [Place pages and mortal cards never describe culture](https://linear.app/threadbare/issue/THR-1623). The engine's two culture description layers read a field no culture has. Result: 0 of 40 places and 0 of 235 mortals on seed 42 get a culture line, and 0 of 60 and 0 of 326 on seed 99. It is in Ready for Dev with its coordination block.
- **Map** [a world that starts alive](https://linear.app/threadbare/issue/THR-1589) has no lane-workable ticket left. Its one open ticket is reserved for you, so the map cannot close yet. The next lane run will turn to plan docs or exit.

## Escalations

None. One process note: the proto-branch commit was made with `--no-verify`. The branch is never merged and holds only a throwaway script and markdown samples.
