# Project Status

> Updated 2026-03-25. Split from monolithic status file — see Docs/project-history.md for completed milestone archive.

## Current Focus
**Graph schema enforcement (TB-033)** — planned, ready for dev.

**Recent completions:**
- ✅ Rendering module resilience refactor (2026-03-25) — Shared primitives (hexKey, worldPosition, hexGrouping), AgentAnimationTarget sprite abstraction, isLayerVisible zoom convenience. 31 files, 50+ inline patterns replaced.
- ✅ HexMapV2 medium-term improvements (2026-03-25) — Hook extraction (1256→1033 lines), signifier InstancedMesh with texture atlas (~4K→~20 draw calls), single sprite per agent with material swap (67% draw call reduction)
- ✅ Agent spawn integrity fixes (2026-03-25) — Birth edge-type bug fixed, born agents get real axiological profiles, variant edge types cleaned up

## Full Backlog
See: `.planning/BACKLOG.md`

## Completed Work
See: Docs/project-history.md
