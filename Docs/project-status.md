# Project Status

> Updated 2026-03-25. Split from monolithic status file — see Docs/project-history.md for completed milestone archive.

## Current Focus
**Road-aware agent movement** — complete.

**Recent completions:**
- ✅ Agent spawn integrity fixes (2026-03-25) — Birth edge-type bug fixed (births were disabled), born agents get real axiological profiles, variant edge types cleaned up, fail-soft phaseMovement, validateAgentIntegrity() utility
- ✅ Dynamic kanban board (2026-03-25) — kanban.html parses BACKLOG.md at load time via fetch(), zero manual sync
- ✅ Agent sprite scale bug + zoom threshold unification (2026-03-25) — Settle animation preserves base scale; deleted AGENT_ZOOM_THRESHOLDS; continental retinue group shown
- ✅ Road-aware agent movement (2026-03-25) — Roads affect pathfinding cost, hex-by-hex traversal, gated re-evaluation, road animation mode
- ✅ Cross-boundary testing infrastructure (2026-03-25) — Contract tests, MovementTrailMesh tests, orchestrator movement tests
- ✅ HexMapV2 quick wins — consistency & type safety (2026-03-25)

## Full Backlog
See: `.planning/BACKLOG.md`

## Completed Work
See: Docs/project-history.md
