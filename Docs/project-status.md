# Project Status

> Updated 2026-03-25. Split from monolithic status file — see Docs/project-history.md for completed milestone archive.

## Current Focus
**Phase 9: Start Screen** — in progress (1/3 plans complete).

**Recent completions:**
- ✅ HexMapV2 quick wins — consistency & type safety (2026-03-25) — Centralized LAYER_Z constants, typed ZoomVisibilityMatrix keys, named D3ZoomCamera magic numbers, removed dead WATER_TYPES.
- ✅ Agent zoom tiers & ring token overhaul (2026-03-25) — HERO_LOCAL threshold 15→5, MAX_ZOOM 10→15, ring tokens radius 3→1.5, unified ring-offset across tiers, LOCATION_RING_RADIUS 12→6, debug panel shows live zoom k + tier name.
- ✅ Fixed-slot hex layout (2026-03-25) — Agents on edge-midpoint slots, locations on vertex slots. 30° angular separation eliminates icon overlap structurally.
- ✅ Organic trail rendering (2026-03-25) — Trails now use terrain-aware wobble + Catmull-Rom spline at 60% intensity.
- ✅ Restore V1 agent dot behavior (2026-03-24) — Small dots at regional zoom, portraits only at hero-local; ring slot offsets in hop animations.
- ✅ Phase 9 Plan 01: Start screen core (2026-03-23) — useThemeMusic hook, StartPage component, App.tsx 'start' phase.

**Latest implementation:** HexMapV2 quick wins — consistency & type safety (2026-03-25) — Restructured zoom tier thresholds (HERO_LOCAL k=5, MAX_ZOOM k=15), shrunk ring tokens to radius 1.5, unified sprite positions across tiers to eliminate position-jump, fixed location ring radius, added live zoom debug info.

## Full Backlog
See: `.planning/BACKLOG.md`

## Completed Work
See: Docs/project-history.md
