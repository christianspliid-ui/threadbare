# Project Status
> Updated 2026-05-07.
## Current Focus
**THR-343 complete — Encounter UI Phase G1 engine unit + integration tests for Phase B modules.** Filled unit test gaps across 5 files: fail-soft undefined reach/moralAxisPole in choiceResolution; trace shape (agentId, axisId) + 200-tick decay-to-zero in driftAccumulator; atomic removal ordering in itemConsumption; beatIndex/outcomeBand/rolledD100 in phaseChoiceResolution traces; regionId/fromPressure/toPressure in phaseDetectionPressure traces. 10942 tests pass. PR #180.

**THR-327 complete — Encounter Engine Phase B5: encounter template graph, candidate generation, relationship resolver (Encounter Experience).** Added `encounter_template` + `relationship` NodeTypes and `gates_to`/`spawns_from`/`enables` EdgeTypes to graph schema + edgeSchema. Added `encounterTemplateGraph.ts` (6 traversal helpers: gatedDownstream, prerequisites, enabledTemplates, spawnSources, spawnedFrom, isUnlocked), `generateEncounterCandidates.ts` (graph-aware candidate generation; backward-compat empty-array fast-path when no graph nodes exist), and `relationshipResolver.ts` (discriminated-union lookup: relationship node → relates_to edge sentiment → none). DebugPanel encounter inspector surfaces graph-node counts + template list. 24 new tests; 10,887 total green. PR #162.

**THR-325 complete — Encounter UI B3 Ascendant hand filtering (Encounter Experience).** Added `phaseAscendantHandFilter` immediately after encounter visibility, with deterministic per-tick partitions (`eligible`, `dimmed`, `hidden`) from a 5-stage cascade (target, cost, sphere, bond, place) plus `rare_pulse` tagging. Added dedicated unit + phase tests and wiring checklist entries.

**THR-324 complete (2026-05-06) — Encounter UI B2 outcome forecast computation (Encounter Experience).** New `outcomeForecast` module, phase wiring in `phaseAscendantHandFilter`, `forecast_computed` traces, boundary/fallback coverage tests.

## Milestone Status
- **v1.0 Foundation:** Shipped 2026-03-30 — Phases 1-18 + M2.5 (81 plans, 1533 commits)
- **v1.1 Optimization:** Shipped — Phases 19-22 (determinism, wiring, performance, hygiene)
- **Encounter Format Migration (Now):** ✅ Phases 0-9 complete. All guilds migrated.
- **Content Architecture (Now):** ✅ THR-86/88/239 shipped.
- **UI Visual Overhaul — Design System v1 (Now):** ✅ Project complete.
- **Continuous Improvement (Now):** THR-303/305/306/307/309/311/312/313/314/315/316/356 ✅. THR-304 In Implementation Planning (Phase 5b/UL children pending).
- **Social Systems Expansion (Now):** THR-28/27/30/51/29/41/34/31/35 shipped. ✅ THR-254/253. THR-78 queued.
- **Thematic Pressure & Living World (Next):** ✅ THR-19/122/125/126/80/128/127. THR-87 blocked by THR-116.

## Archived to project-history.md
- THR-322/321/320/315/309/307/308/306/302/305/301/299/298/297/296/294/282/238/109/79/108/107/104/103/106/290/102/280/285/286/283/287/276/284/277/281/211/243/272/212/210/247/253/26/101/254/259/257/36/134/100/182/252/225/164/99/10/246/95/233/188/153/187/96/165/88/185/186/180/34/125/80/128/127/184/94/174/162/152/167/126/122/81/172/183/170/181/156/18/155/151/29/154/166/150/35/31/173 and earlier — see project-history.md
- 2026-05-06 batch: THR-311, THR-312, THR-313, THR-314, THR-315, THR-316, THR-317, THR-320, THR-321, THR-322, THR-323, THR-336
- 2026-05-07 batch: THR-324, THR-325, THR-327, THR-343, THR-356

## Active Backlog Ideas
- **TB-105–108 Thematic Pressure & Living World Pass** (omen agendas, cool failure, doom identity, intent/activity visibility)
- **TB-095–099 Social Systems Expansion** (v1.2 — designed, ready to sequence)
- TB-071 Economy Second Pass · TB-069 Location NPCs · TB-051 Monster Encounters residual · TB-037 Onboarding

Full backlog: [Linear (Threadbare team)](https://linear.app/threadbare) · Completed work: `Docs/project-history.md` + Linear "Done" state · Pre-Linear history: `.planning/BACKLOG_HISTORY.md`
