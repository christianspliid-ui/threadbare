# Project Status

> Updated 2026-03-22. Split from monolithic status file — see Docs/project-history.md for completed milestone archive.

## Current Focus
**Phase 9: Start Screen** — in progress (1/3 plans complete).

**Recent completions:**
- ✅ Phase 9 Plan 01: Start screen core (2026-03-23) — useThemeMusic hook (HTMLAudioElement, fade in/out via setInterval, localStorage mute), StartPage component (full-bleed bg, gradient, THREADBARE title, lore, menu), App.tsx 'start' phase as default entry, dev shortcuts still bypass.
- ✅ High mountain ridgeline fix (2026-03-23) — Ridge overlay switched from additive to max()-blend, RIDGE_PEAK_ELEVATION 0.90→0.97. high_mountains now form narrow linear peak lines along mountain range spines instead of wide blobs.
- ✅ Phase 8 Integration COMPLETE (2026-03-23) — HexMapV2 is sole renderer, all 5,793 tests pass.

**Latest implementation:** Phase 9 Plan 01 (2026-03-23) — Atmospheric start screen live at localhost:5173 (no URL params). New World transitions to worldgen. Theme music fades in on first user interaction.

## Full Backlog
See: `.planning/BACKLOG.md`

## Completed Work
See: Docs/project-history.md
