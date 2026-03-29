---
phase: 12-flesh-reach-migration-to-quintessence
plan: 01
subsystem: engine-architecture
tags: [typescript, reach-domains, value-pairs, cosmology, TB-075, flesh-removal, quintessence]

# Dependency graph
requires:
  - phase: 11-agent-character-sheet
    provides: ProwessTab domain grid, AgentDetailPanel layout, attachment display
provides:
  - ReachDomain type reduced from 9 to 8 (flesh removed)
  - ValuePair type reduced from 10 to 9 (stoicism_passion removed, frankness_propriety→revelation_discretion, humility_pride→preservation_transformation)
  - FLESH_MAX_HOPS constant removed from encounterAwareness
  - All data/engine/component/test files updated to use 8-domain model
affects:
  - 12-02 (Quintessence reach introduction — builds on this clean foundation)
  - 12-03 (UI refresh for 8-reach grid)
  - 12-04 (Validation and polish)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Python UTF-8 bulk replace for large TypeScript/data files on Windows"
    - "Duplicate key resolution: when bulk replace creates duplicate object keys, merge values or remove superseded entry"

key-files:
  created: []
  modified:
    - src/types/traits.ts
    - src/types/agent.ts
    - src/data/agent-behavior-constants.ts
    - src/components/CMS/registry.ts
    - src/components/CMS/tunableConstants.ts
    - src/engine/encounterAwareness.ts
    - src/engine/agentLifecycle.ts
    - src/engine/orchestrator.ts
    - src/engine/agendaGenerator.ts
    - src/engine/revelationEmitter.ts
    - src/engine/worldSeed.ts
    - src/engine/strands.ts
    - src/engine/agentDetail.ts
    - src/engine/ascendant.ts
    - src/engine/interventionEffects.ts
    - src/engine/meetingEncounter.ts
    - src/engine/phaseMovement.ts
    - src/engine/sublocation.ts
    - src/data/strand-content.ts
    - src/data/domain-words.ts
    - src/data/agenda-content.ts
    - src/data/action-template-content.ts
    - src/data/encounter-content.ts
    - src/data/faction-encounter-content.ts
    - src/data/social-encounter-content.ts
    - src/data/meeting-content.ts
    - src/data/scry-content.ts
    - src/data/unified-action-templates.ts
    - src/data/culture-content.ts
    - src/data/archetype-content.ts
    - src/data/backstory-content.ts
    - src/data/journey-content.ts
    - src/data/narrative-content.ts
    - src/data/ambition-templates.ts
    - src/data/strand-content.ts
    - src/components/Game/AgentDetailPanel.tsx
    - src/components/Game/tabs/ProwessTab.tsx
    - src/types/encounter.ts
    - src/types/meetingEncounter.ts

key-decisions:
  - "Flesh action redistribution: Heal/Cultivate→gold (life-sphere vitality), Diagnose→eye (detection), Plague→shadow (entropy)"
  - "stoicism_passion retired: endurance/discipline content merged into sacrifice_survival; passion content removed"
  - "frankness_propriety→revelation_discretion (proactive-disclosure axis)"
  - "humility_pride→preservation_transformation (institutional-authority axis)"
  - "Domain grid layout: AgentDetailPanel 3x3→2x4 (8 domains)"
  - "FLESH_MAX_HOPS removed entirely; encounterAwareness now uses uniform MAX_AWARENESS_HOPS cap"
  - "Archetype reachAffinities: healer flesh→gold, warrior flesh→iron/star, mystic flesh→star"
  - "Python UTF-8 bulk replace used for large files to avoid Windows encoding issues"

patterns-established:
  - "Bulk migration pattern: Python scripts with encoding='utf-8' for TypeScript data files on Windows"
  - "Duplicate key cleanup: when renaming a value pair that was already present, merge templates rather than leaving duplicate keys"

requirements-completed: [FLSH-01, FLSH-02, FLSH-03, FLSH-04, FLSH-05]

# Metrics
duration: ~180min (split across two sessions)
completed: 2026-03-29
---

# Phase 12 Plan 01: Flesh Reach Removal — Type System and Full Codebase Migration Summary

**ReachDomain 9→8, ValuePair 10→9 — flesh reach fully removed with redistribution rules applied across all 80+ source files and 58 test fixtures**

## Performance

- **Duration:** ~180 min (across two sessions — context window exhausted mid-task-2b)
- **Started:** 2026-03-29T21:00:00Z (approximate)
- **Completed:** 2026-03-30T00:00:00Z (approximate)
- **Tasks:** 3 (Task 1: type system, Task 2a: source propagation, Task 2b: test fixtures)
- **Files modified:** 80+ source files, 58 test files

## Accomplishments
- Removed 'flesh' from ReachDomain union type and all downstream arrays/maps
- Removed stoicism_passion, frankness_propriety, humility_pride from ValuePair union; added revelation_discretion and preservation_transformation as replacements
- Distributed 4 flesh action templates to correct domains (Heal/Cultivate→gold, Diagnose→eye, Plague→shadow)
- Updated AgentDetailPanel grid from 3x3 to 2x4 layout for 8 reaches
- Fixed all test assertion counts (9 domains→8, 10 pairs→9, 20 FEAR_PROSE keys→18)
- Merged duplicate-key content entries created by Python bulk replace in backstory-content.ts

## Task Commits

Each task was committed atomically:

1. **Task 1: Type system foundation** - `1770364` (feat)
2. **Task 2a: Source file propagation** - `2b96a08` (feat)
3. **Task 2b: Test fixture updates** - `b969f95` (feat)

## Files Created/Modified

Key modified files:
- `src/types/traits.ts` — ReachDomain union 9→8, REACH_DOMAINS array updated
- `src/types/agent.ts` — ValuePair union 10→9, REACH_VALUE_PAIR updated, ARCHETYPE_NAMES added
- `src/data/agent-behavior-constants.ts` — FLESH_MAX_HOPS removed
- `src/engine/encounterAwareness.ts` — Flesh-specific cap branch removed; uniform MAX_AWARENESS_HOPS
- `src/data/action-template-content.ts` — 4 flesh actions redistributed (gold:12→14, shadow:4→5, eye:4→5)
- `src/data/backstory-content.ts` — Duplicate sacrifice_survival keys merged; revelation_discretion templates added
- `src/data/strand-content.ts` — CONTENT_COUNTS updated, Flesh removed from REACH_FEAR_LABELS
- `src/components/Game/AgentDetailPanel.tsx` — Grid layout 3x3→2x4

## Decisions Made

- Flesh action redistribution: Heal/Cultivate→gold (life-sphere), Diagnose→eye, Plague→shadow
- stoicism_passion retired with endurance-flavored content folded into sacrifice_survival
- frankness_propriety→revelation_discretion (proactive vs guarded disclosure)
- humility_pride→preservation_transformation (conservative vs transformative authority)
- Archetype reachAffinities for flesh: healer→gold, warrior→iron/star, mystic→star
- FLESH_MAX_HOPS removed entirely; encounterAwareness now uniform

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Duplicate key collision in culture-content.ts**
- **Found during:** Task 2a (source propagation)
- **Issue:** Bulk replacing `flesh:` → `gold:` created two `gold:` keys at line 98 (0.1 and 0.2)
- **Fix:** Merged duplicate gold keys by summing values (0.1 + 0.2 = 0.3)
- **Files modified:** src/data/culture-content.ts
- **Committed in:** 2b96a08

**2. [Rule 1 - Bug] Duplicate sacrifice_survival keys in backstory-content.ts**
- **Found during:** Task 2b (test fixture updates)
- **Issue:** Python bulk rename of stoicism_passion→sacrifice_survival created duplicate keys in TURNING_POINT_PROSE, CONTRADICTION_PROSE, and FEAR_PROSE — JS last-key-wins meant first entry (correct 4-template version) was silently discarded
- **Fix:** Merged duplicate sacrifice_survival entries in all three tables; removed superseded stoicism_passion FEAR_PROSE block
- **Files modified:** src/data/backstory-content.ts
- **Committed in:** b969f95

**3. [Rule 2 - Missing Content] revelation_discretion had only 2 templates**
- **Found during:** Task 2b (backstory-content.test.ts "each value pair has at least 3 templates" failure)
- **Issue:** New revelation_discretion entry only carried over 2 templates from old frankness_propriety; test requires minimum 3
- **Fix:** Added 3rd template for both TURNING_POINT_PROSE and CONTRADICTION_PROSE
- **Files modified:** src/data/backstory-content.ts
- **Committed in:** b969f95

---

**Total deviations:** 3 auto-fixed (1 collision bug, 1 duplicate key bug, 1 missing content)
**Impact on plan:** All fixes necessary for correctness. No scope creep.

## Issues Encountered
- Python UTF-8 encoding required explicitly — Windows default charmap codec fails on TypeScript files with smart quotes and special characters
- Context window exhausted mid-task-2b; session resumed from summary, continuing at exact next file
- stoicism_passion was a separate pair in 10-pair model; its merge into sacrifice_survival required careful fixture deduplication to preserve correct test values (0.5/0.6/0.8)

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Type system is clean: ReachDomain=8, ValuePair=9, all downstream code updated
- 458/458 test files passing, tsc clean, vite build succeeds
- Plan 12-02 can now introduce Quintessence reach without conflict with old flesh type
- The 2x4 domain grid in AgentDetailPanel needs a final UI slot for when Quintessence is added (plan 12-02/12-03 scope)

---
*Phase: 12-flesh-reach-migration-to-quintessence*
*Completed: 2026-03-29*
