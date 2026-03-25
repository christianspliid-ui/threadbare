# Project Status

> Updated 2026-03-25. Split from monolithic status file — see Docs/project-history.md for completed milestone archive.

## Current Focus
**Road-aware agent movement** — complete.

**Recent completions:**
- ✅ Road-aware agent movement (2026-03-25) — Roads now affect pathfinding cost (major 0.4×, trail 0.7×), agents traverse hex-by-hex along road paths, moving agents get gated re-evaluation (5-guard system), animation system gains road hop mode (300ms/500ms). 6 design decisions, 2 new trace types, full NFP compliance.
- ✅ Cross-boundary testing infrastructure (2026-03-25) — Contract tests (pathfinding→movement, 8 tests), MovementTrailMesh tests (24 tests), orchestrator movement tests (2 tests), rewritten movement-integration tests (6 tests). New testing-patterns skill.
- ✅ HexMapV2 quick wins — consistency & type safety (2026-03-25)
- ✅ Fixed-slot hex layout (2026-03-25)

**Latest implementation:** Road-aware agent movement (2026-03-25) — Roads mechanically affect gameplay: Dijkstra considers road edges with discount multipliers, agents walk hex-by-hex along road paths with per-hex tick accumulation, moving agents can reroute mid-journey via 5-guard re-evaluation, animation system chains road hops with reduced wobble and shorter durations.

## Full Backlog
See: `.planning/BACKLOG.md`

## Completed Work
See: Docs/project-history.md
