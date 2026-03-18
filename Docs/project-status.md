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
- ✅ Phase 5: Divine Intervention & Vignettes (5 new engine modules, 57 tests, divine intervention modifier wired)
- ✅ Phase 6: Visibility & Debug Tools (3 new debug components, Social tab in DebugPanel, 8 social TickEvent types, 17 tests)

**Up next:**
- Phase 7+ as determined by backlog priorities

**Latest implementation:** Phase 6 Visibility & Debug Tools (2026-03-18) — 3 new debug components: DecisionBreakdown (filter pipeline, top candidates, awareness per reach), RelationshipGraph (relates_to edges with trust/sentiment/strength, bond classification, faction memberships), BondOverlay (SVG map overlay for bond lines and decision vectors). DebugPanel gains Social tab with collapsible sections and map overlay toggles. TickEvent type union extended with 8 social fabric event types. AlertIcon extended with social/faction/trust icons. 17 new tests across 3 test files, 5,409 total tests pass.

## Full Backlog
Notion: https://www.notion.so/Development-Backlog-3182b241dfb081b9af78c279eef405cf

## Completed Work
See: Docs/project-history.md
