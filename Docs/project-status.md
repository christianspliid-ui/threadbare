# Project Status

> Updated 2026-03-22. Split from monolithic status file — see Docs/project-history.md for completed milestone archive.

## Current Focus
**Phase 9: Start Screen** — in progress (1/3 plans complete).

**Recent completions:**
- ✅ Kokoro TTS narration prototype (2026-03-23) — Client-side TTS via kokoro-js (82M params, WASM). Web Worker isolation, narrate button in HexChronicle header. Feature-flagged off by default.
- ✅ Phase 9 Plan 01: Start screen core (2026-03-23) — useThemeMusic hook, StartPage component, App.tsx 'start' phase.
- ✅ Phase 8 Integration COMPLETE (2026-03-23) — HexMapV2 is sole renderer, all 5,798 tests pass.

**Latest implementation:** Kokoro TTS prototype (2026-03-23) — Flip `NARRATION_ENABLED = true` in `src/services/narration/narrationConstants.ts` to enable. Narrate button appears in HexChronicle hero section.

## Full Backlog
See: `.planning/BACKLOG.md`

## Completed Work
See: Docs/project-history.md
