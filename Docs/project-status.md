# Project Status

> Updated 2026-03-18. Split from monolithic status file — see Docs/project-history.md for completed milestone archive.

## Current Focus
**Agent Behavior Systems** — implementing the five interconnected design docs from 2026-03-18.

**Completed:**
- ✅ Phase 0: Prerequisites (type extensions, duration backfill, sphere oppositions, graph utilities)
- ✅ Phase 1: Encounter Cache + Unified Decision Pipeline (8 new engine modules, 126 tests)

**Up next:** Phases 2-4 can run in parallel:
- Phase 2: Resolution Modifier Pipeline (sphere/equipment/terrain/traits modifiers)
- Phase 3: Tier Promotion & Capability Growth (encounter-driven trait accumulation)
- Phase 4: Social Fabric (trust, reputation walks, social encounters, faction formation)
- Then Phase 5 (Divine Intervention) and Phase 6 (Visibility + Debug Tools)

**Remaining prerequisites:**
- Attachment `reachBonus` and trait `resolutionBonus` backfill (blocks Phase 2)
- 14 social encounter templates authoring (blocks Phase 4)
- Deprecated global `reputationScore` migration (blocks Phase 4)

**Latest implementation:** Phase 1 Unified Decision Pipeline (2026-03-18) — 8 new modules: distanceMatrix, encounterCache, encounterAwareness, factionAwareness, encounterFilterPipeline, encounterScoring, idleBehavior, phaseAgentDecision. Replaces flat P0 movement heuristic with encounter-driven strategic decisions. 5,248 tests pass.

## Full Backlog
Notion: https://www.notion.so/Development-Backlog-3182b241dfb081b9af78c279eef405cf

## Completed Work
See: Docs/project-history.md
