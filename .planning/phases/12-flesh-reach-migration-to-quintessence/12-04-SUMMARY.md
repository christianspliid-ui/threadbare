---
phase: 12-flesh-reach-migration-to-quintessence
plan: "04"
subsystem: ui
tags: [react, typescript, archetype, epithet, quintessence, ipk, reach-grid]

# Dependency graph
requires:
  - phase: 12-01
    provides: ReachDomain 9→8 type system, AxiologicalProfile, VALUE_PAIRS, ARCHETYPE_NAMES, REACH_VALUE_PAIR
  - phase: 12-02
    provides: quintessence-content.ts with QUINTESSENCE_LEXICON and QUINTESSENCE_TOOLTIPS
  - phase: 12-03
    provides: quintessenceToWord() helper, phaseQuintessence runtime system, quintessence property on entities
  - phase: 11-02
    provides: AgentProfileModal 5-tab layout, AgentKnowledge facet gating pattern
provides:
  - 2x4 reach grid layout in AgentDetailPanel and ProwessTab (8 reaches, no flesh)
  - Archetype epithet engine (deriveArchetypeEpithet) with knowledge-gated modal display
  - Quintessence IPK prose display in AgentDetailPanel (no meter, prose-only)
  - Meeting encounter modal cleaned of flesh references
  - agentDetail.ts quintessence + axiologicalProfile fields at intimate+ knowledge level
affects: [Phase 13+, any UI consuming AgentDetailPanel or ProwessTab, reach grid consumers]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Knowledge-gated UI: check knowledge?.revealedFacets or axiologicalProfile presence before rendering derived data"
    - "Archetype epithets: strongest-lean ValuePair over ARCHETYPE_THRESHOLD (0.6) + domain word from ARCHETYPE_DOMAIN_WORDS"
    - "IPK prose display: quintessenceToWord() returns word like 'Radiant', rendered as ProseKeyword with QUINTESSENCE_TOOLTIPS"

key-files:
  created:
    - src/engine/archetypeEpithet.ts
    - src/engine/__tests__/archetypeEpithet.test.ts
  modified:
    - src/components/Game/AgentDetailPanel.tsx
    - src/components/Game/tabs/ProwessTab.tsx
    - src/components/Game/AgentProfileModal.tsx
    - src/components/Game/MeetingEncounterModal.tsx
    - src/engine/agentDetail.ts

key-decisions:
  - "deriveArchetypeEpithet returns null for all-zero profiles, below-threshold leans, and courage_prudence meta-axis"
  - "Quintessence displayed prose-only via IPK (no explicit meter) — locked decision from CONTEXT.md"
  - "agentDetail.ts populates quintessence and axiologicalProfile at intimate+ knowledge level for safe epithet computation"
  - "ARCHETYPE_THRESHOLD = 0.6 as named constant (NFP #1 tunability)"
  - "Grid layout exception per UI-SPEC: 2x4 uses gap: 12px (wider than default 8px) for visual breathing room at 8 reaches"

patterns-established:
  - "Epithet derivation: strongest lean wins; ties deterministic via VALUE_PAIRS order"
  - "Knowledge gate pattern: check axiologicalProfile presence (only populated at intimate+) rather than checking revealedFacets set directly"

requirements-completed: [FLSH-13, FLSH-14, FLSH-15, FLSH-16]

# Metrics
duration: 15min
completed: 2026-03-30
---

# Phase 12 Plan 04: UI Polish — Archetype Epithets, 2x4 Grid, Quintessence IPK Summary

**Archetype epithet engine with knowledge-gated modal display, 2x4 reach grid replacing 3x3+flesh, and Quintessence IPK prose display wired into AgentDetailPanel**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-30T00:10:00Z
- **Completed:** 2026-03-30T00:25:27Z
- **Tasks:** 2 (Task 1 implementation + Task 2 human verification)
- **Files modified:** 7

## Accomplishments
- Created `src/engine/archetypeEpithet.ts` with `deriveArchetypeEpithet()` + `ARCHETYPE_DOMAIN_WORDS` constant (12 test cases, all passing)
- Updated AgentDetailPanel and ProwessTab from 3x3 grid (with flesh) to 2x4 grid (8 reaches: iron, gold, shadow, veil / heart, eye, stone, star)
- Wired archetype epithet into AgentProfileModal header with knowledge gate (only renders at intimate+ knowledge level when axiologicalProfile is populated)
- Added Quintessence IPK prose display in AgentDetailPanel — calls `quintessenceToWord()`, renders as ProseKeyword with tooltip from QUINTESSENCE_TOOLTIPS
- Removed flesh emoji from MeetingEncounterModal REACH_ICONS
- Extended `agentDetail.ts` to populate `quintessence` and `axiologicalProfile` fields at intimate+ knowledge level

## Task Commits

Each task was committed atomically:

1. **Task 1: Archetype epithet engine + 2x4 grid + modal + IPK** - `03bbda2` (feat)
2. **Task 2: Human visual verification** — approved by user (no commit)

## Files Created/Modified
- `src/engine/archetypeEpithet.ts` — deriveArchetypeEpithet function + ARCHETYPE_DOMAIN_WORDS constant
- `src/engine/__tests__/archetypeEpithet.test.ts` — 12 test cases covering all edge cases
- `src/components/Game/AgentDetailPanel.tsx` — 3x3→2x4 grid, remove flesh, add Quintessence IPK prose display
- `src/components/Game/tabs/ProwessTab.tsx` — 3x3→2x4 grid (grid-template-columns: repeat(4, 1fr), gap 12px)
- `src/components/Game/AgentProfileModal.tsx` — import deriveArchetypeEpithet, render in header (knowledge-gated)
- `src/engine/agentDetail.ts` — add quintessence and axiologicalProfile fields at intimate+ knowledge level
- `src/components/Game/MeetingEncounterModal.tsx` — remove flesh emoji from REACH_ICONS

## Decisions Made
- Knowledge gate uses axiologicalProfile presence check (only populated at intimate+ by agentDetail.ts) rather than revealedFacets set — simpler and consistent with the data population pattern
- Quintessence displayed prose-only per CONTEXT.md locked decision — no meter, no number, just the IPK word with tooltip
- ARCHETYPE_THRESHOLD = 0.6 as named constant for NFP #1 tunability
- Epithet picks strongest-lean ValuePair when multiple exceed threshold; ties are deterministic via VALUE_PAIRS order (first in array wins)
- courage_prudence (meta-axis) explicitly excluded from epithet derivation — it tracks existential orientation, not archetype expression

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
Phase 12 (Flesh Reach Migration to Quintessence) is now complete across all 4 plans:
- Type system migration (12-01) ✅
- Content rewrite — Stone/Eye prose, quintessence lexicon (12-02) ✅
- Quintessence runtime system — phaseQuintessence, erosion, regen, dissolution (12-03) ✅
- UI polish — 2x4 grid, archetype epithets, Quintessence IPK (12-04) ✅

Ready for next milestone work. Outstanding gap items from earlier phases (10-08 HexChronicle Soul bridge, 11-06 TS2353 fix) remain in backlog.

---
*Phase: 12-flesh-reach-migration-to-quintessence*
*Completed: 2026-03-30*
