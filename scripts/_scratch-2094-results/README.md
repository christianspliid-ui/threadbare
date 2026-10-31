# THR-2094 census arms (design lane, 2026-10-31d) — proto, never merge

Bundle: `npx esbuild scripts/_scratch-2094.ts --bundle --platform=node --format=esm --outfile=.cache/s2094.mjs --external:fs --external:path`
Run: `[ENV] node .cache/s2094.mjs sweep seeded <hunger>` (or `godloc seeded` for Witness).

Switches (proto, in `src/engine/unifiedActionResolution.ts` and the scratch census):
- `WIDE=1` — cheap cards drop `targetSubtypes` (any place).
- `SUBLOC=1` — first-sphere card targets any sublocation.
- `PERESSENCE=1 PECAP=2` — the god's push = 3 x min(essenceCost, 2).
- `DISTRICT=1` — a god push aimed at a town-card target lands on that town's district with the lowest score in the sphere (the town if none).

Files (.txt; *.log is gitignored): r-*/p-*/b-* today (r-wide/r-sub breadth arms), pe-* per-essence uncapped, pc-* per-essence cap 2, d-* district, dp-* district + cap-2 push, *-witness Witness reference.
