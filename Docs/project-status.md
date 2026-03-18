# Project Status

> Updated 2026-03-18. Split from monolithic status file — see Docs/project-history.md for completed milestone archive.

## Current Focus
**Agent Behavior Systems** — implementing the five interconnected design docs from 2026-03-18.

**Completed:**
- ✅ Phase 0: Prerequisites (type extensions, duration backfill, sphere oppositions, graph utilities)
- ✅ Phase 1: Encounter Cache + Unified Decision Pipeline (8 new engine modules, 126 tests)
- ✅ Phase 2: Resolution Modifier Pipeline (1 new engine module, 30 tests, wired into encounter resolution)
- ✅ Phase 3: Tier Promotion & Capability Growth (2 new engine modules, 19 tests, wired into both pipelines)
- ✅ Phase 4: Social Fabric & Faction Formation (4 new modules, 14 social encounter templates, 38 tests)

**Up next:**
- Phase 5: Divine Intervention
- Then Phase 6: Visibility + Debug Tools

**Latest implementation:** Phase 4 Social Fabric & Faction Formation (2026-03-18) — 4 new modules: trustMechanics.ts (edge-level trust tracking with cooperative/defective deltas and per-tick decay), reputationWalk.ts (graph-walked reputation perception with Shadow distortion, Heart resistance, faction rank bonuses), social-encounter-content.ts (14 social encounter templates: alliances, espionage, trade, intimidation, faction formation), socialEncounterGeneration.ts (visible-agent scanning and social candidate generation). disposition.ts wired with trust updates on dilemma resolution. 38 new tests across 3 test files, 5,334 total tests pass.

## Full Backlog
Notion: https://www.notion.so/Development-Backlog-3182b241dfb081b9af78c279eef405cf

## Completed Work
See: Docs/project-history.md
