# THR-1591 prototype: a world with a past (throwaway, never merged)

This is the design lane's prototype for [A world with a past](https://linear.app/threadbare/issue/THR-1591). It lives on branch `proto/thr-1591-world-with-a-past` only.

- `past-sample.ts` sketches a worldgen history pass. It builds a CLI world (seed, medium map) and writes a sample "before you woke" chronicle page, two place-sheet lines, the dead, and a table giving every claim with its source. Each claim is tagged:
  - **FACT**: already true in the t0 graph.
  - **PASS**: a new fact the pass would write.
  - **FLAVOR**: prose only.
- `sample-seed-42.md` and `sample-seed-99.md` are its output.

Run it from the repo root:

```bash
npx esbuild Docs/audits/2026-09-25-living-world-data/proto-thr-1591/past-sample.ts --bundle --platform=node --format=esm --outfile=.cache/past-sample.mjs --external:fs --external:path && node .cache/past-sample.mjs 42 .cache/past-sample-42.md
```

## What it shows

1. **Worldgen already holds half a past.** It places 2–4 dead empires (`hist_culture_*`, from `historical-culture-content.ts`), each with territory. It also places 103 elder ruins, each tagged with its empire and an archetype (temple, vault or battlefield). Nothing tells the player any of this except `legacyFlavor` in HexChronicle. A history pass mostly **explains what is already on the map**; it does not invent a new past.
2. **It is cheap.** The sketch runs in 9–10 ms at worldgen and reads nothing per tick.
3. **Four substrate facts shape the real pass** (measured by the lane's research subagent; file:line in the THR-1591 decision comment):
   - Ambition minting reads events only inside a lookback window after tick 0 (`ambitionTick.ts:314-463`). A past written as events therefore feeds no ambition by itself; it needs an explicit worldgen mint.
   - `chronicleEntries` is emptied at every cycle end (`cycleEnd.ts:262`). The past belongs in the Great Chronicle, or in its own field, not in that list.
   - Two per-tick readers scan every event node (`factionNetwork.ts:663`, `phaseOmenAgenda.ts:450`). About 10 history events is noise against the ~500 that exist by t150, but the pass must not write one event per ruin.
   - `backstoryStrata[].cultureId` is read by clue scoring (`clueLifecycle.ts:114-121`) and **written by nothing**. A history pass that gives some mortals descent from a dead empire is its missing producer, and the natural source for `reclaim_homeland`.
4. **Two sketch-level lessons.**
   - Wonder legends need per-wonder variety: crystal caverns are 5 of 8 wonders on seed 42.
   - 45 of 47 · 57 of 67 settlements stand within three hexes of an elder ruin. "Built on old stones" is therefore true almost everywhere and too common to be special on its own.
5. **Defect found:** culture names leak raw biome ids ([THR-1622](https://linear.app/threadbare/issue/THR-1622)).
