# Project Status

> Updated 2026-03-22. Split from monolithic status file — see Docs/project-history.md for completed milestone archive.

## Current Focus
**Phase 9: Start Screen** — in progress (1/3 plans complete).

**Recent completions:**
- ✅ Organic trail rendering (2026-03-25) — Trails now use terrain-aware wobble + Catmull-Rom spline at 60% intensity, matching roads' organic feel.
- ✅ Restore V1 agent dot behavior (2026-03-24) — Small dots at regional zoom, portraits only at hero-local; ring slot offsets in hop animations; settle tweens for ring rearrangement; eye icon Y-flip fix; located_at edge resolution for retinue/agentDetail.
- ✅ Trail endpoints target location icons (2026-03-23) — Movement trails converge on settlement/POI icons instead of hex centers.
- ✅ Kokoro TTS narration prototype (2026-03-23) — Client-side TTS via kokoro-js (82M params, WASM). Web Worker isolation, narrate button in HexChronicle header. Feature-flagged off by default.
- ✅ Phase 9 Plan 01: Start screen core (2026-03-23) — useThemeMusic hook, StartPage component, App.tsx 'start' phase.
- ✅ Phase 8 Integration COMPLETE (2026-03-23) — HexMapV2 is sole renderer, all 5,798 tests pass.

**Latest implementation:** Organic trail rendering (2026-03-25) — Trail roads now use wobble + Catmull-Rom spline smoothing like major roads, at 60% intensity via tunable TRAIL_WOBBLE_SCALE.

## Full Backlog
See: `.planning/BACKLOG.md`

## Completed Work
See: Docs/project-history.md
