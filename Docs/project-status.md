# Project Status

> Updated 2026-03-20. Split from monolithic status file — see Docs/project-history.md for completed milestone archive.

## Current Focus
**Hex Map V2** — Three.js-based hex map renderer (8-phase milestone).

**Recent completions:**
- ✅ Phase 2 Plan 03: Hydrology + validation (2026-03-21) — Depression filling, river generation, lake promotion, lake outflows, canyon carving, validation pass. generateWorld() now uses full pipeline. 26 TDD tests. Phase 2 complete.
- ✅ Phase 2 Plan 02: Climate fields + biome classification (2026-03-21) — Temperature/moisture with latitude gradient, rain shadow, maritime moderation; Whittaker biome classification. 25 TDD tests.
- ✅ Phase 2 Plan 01: WorldGen pipeline scaffold (2026-03-21) — Province seeding, elevation heightmap, ridge overlays, coastline pass.

**Up next:**
- Phase 3: Coastline and water rendering using rivers/lakes from pipeline

**Latest implementation:** Phase 2 Plan 03 (2026-03-21) — Full 9-pass worldgen pipeline operational. Rivers flow from mountains to sea. Lakes form in depressions. generateWorld() returns HexTile[] with rivers and full biome classification.

## Full Backlog
Notion: https://www.notion.so/Development-Backlog-3182b241dfb081b9af78c279eef405cf

## Completed Work
See: Docs/project-history.md
