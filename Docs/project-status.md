# Project Status

> Updated 2026-03-25. Split from monolithic status file — see Docs/project-history.md for completed milestone archive.

## Current Focus
**HexMapV2 medium-term improvements** — complete.

**Recent completions:**
- ✅ HexMapV2 medium-term improvements (2026-03-25) — Hook extraction (1256→1033 lines), signifier InstancedMesh with texture atlas (~4K→~20 draw calls), single sprite per agent with material swap (67% draw call reduction)
- ✅ Agent spawn integrity fixes (2026-03-25) — Birth edge-type bug fixed, born agents get real axiological profiles, variant edge types cleaned up
- ✅ Dynamic kanban board (2026-03-25) — kanban.html parses BACKLOG.md at load time via fetch()
- ✅ Agent sprite scale bug + zoom threshold unification (2026-03-25) — Settle animation preserves base scale; continental retinue group shown
- ✅ Road-aware agent movement (2026-03-25) — Roads affect pathfinding cost, hex-by-hex traversal, road animation mode

## Full Backlog
See: `.planning/BACKLOG.md`

## Completed Work
See: Docs/project-history.md
