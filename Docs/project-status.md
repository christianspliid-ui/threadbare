# Project Status

> Updated 2026-03-22. Split from monolithic status file — see Docs/project-history.md for completed milestone archive.

## Current Focus
**Phase 9: Start Screen** — in progress (1/3 plans complete).

**Recent completions:**
- ✅ Fixed-slot hex layout (2026-03-25) — Agents on edge-midpoint slots, locations on vertex slots. 30° angular separation eliminates icon overlap structurally. Balanced distribution lookup for fewer than 6 entities.
- ✅ Organic trail rendering (2026-03-25) — Trails now use terrain-aware wobble + Catmull-Rom spline at 60% intensity, matching roads' organic feel.
- ✅ Restore V1 agent dot behavior (2026-03-24) — Small dots at regional zoom, portraits only at hero-local; ring slot offsets in hop animations; settle tweens for ring rearrangement.
- ✅ Phase 9 Plan 01: Start screen core (2026-03-23) — useThemeMusic hook, StartPage component, App.tsx 'start' phase.
- ✅ Phase 8 Integration COMPLETE (2026-03-23) — HexMapV2 is sole renderer, all 5,798 tests pass.

**Latest implementation:** Fixed-slot hex layout (2026-03-25) — Replaced continuous ring distribution with hex-geometry-aligned fixed slots. Agents lock to 6 edge-midpoint angles, locations to 6 vertex angles. 14 new tests.

## Full Backlog
See: `.planning/BACKLOG.md`

## Completed Work
See: Docs/project-history.md
