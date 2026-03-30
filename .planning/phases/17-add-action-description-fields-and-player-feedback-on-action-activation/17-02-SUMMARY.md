---
phase: 17-add-action-description-fields-and-player-feedback-on-action-activation
plan: 02
subsystem: content
tags: [action-templates, content, spell-names, descriptions, ars-magica]

# Dependency graph
requires:
  - phase: 17-add-action-description-fields-and-player-feedback-on-action-activation
    plan: 01
    provides: "spellName, description, consequenceMessage fields added to UnifiedActionTemplate type and ActionTemplateData interface"
provides:
  - "spellName populated on all 44 CRUD action templates (action-template-content.ts)"
  - "spellName populated on all divine, hex, location, artifact, sublocation, revelation, thread-creation templates (unified-action-templates.ts)"
  - "migrateActionTemplate() passes through spellName and description from ActionTemplateData"
  - "Completeness test enforcing spellName/description on all non-encounter templates"
affects:
  - "17-03 action card redesign — consumes spellName and description in focused card UI"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Reach-tonal spell names: each reach has a consistent tone (iron=martial, gold=commercial, shadow=hidden, etc.)"
    - "CRUD-tonal hints: create=establishing, read=divining, update=bolstering, delete=sundering"
    - "Completeness test scoped by ID prefix to exclude encounter.* templates not yet enriched"

key-files:
  created:
    - "src/data/__tests__/unified-action-templates.test.ts (Phase 17 describe block added)"
  modified:
    - "src/data/action-template-content.ts"
    - "src/data/unified-action-templates.ts"

key-decisions:
  - "Completeness test scoped to non-encounter prefixes (action., divine., hex., loc., artifact., sub., observe_agent, scry_agent, whisper_insight, dream_sending, bind_thread) — encounter.* templates excluded until Phase 18+ enrichment"
  - "ActionTemplateData interface extended with spellName?: string and description?: string to mirror UnifiedActionTemplate"
  - "migrateActionTemplate() updated to explicitly pass through spellName and description"
  - "44 CRUD templates (not 36 as plan estimated) — gold reach has 11 templates"

patterns-established:
  - "Spell name tonal registry: iron, gold, shadow, veil, heart, eye, stone, star each have documented tone in action-template-content.ts"
  - "Completeness test pattern: filter UNIFIED_ACTION_TEMPLATES by ID prefix, then assert spellName and description truthy for all"

requirements-completed: [PH17-03]

# Metrics
duration: 35min
completed: 2026-03-30
---

# Phase 17 Plan 02: Spell Names and Descriptions for All Action Templates

**Evocative Ars Magica-style spell names and qualitative mechanical descriptions added to all 108+ action templates (44 CRUD, 8 divine, 50+ hex/loc/artifact/sub/revelation/thread), with completeness test enforcing coverage**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-03-30T13:00:00Z
- **Completed:** 2026-03-30T13:35:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Added `spellName` and `description` to all 44 CRUD action templates across 9 reaches (iron, gold, shadow, veil, heart, eye, stone, star, flesh) in `action-template-content.ts`
- Extended `ActionTemplateData` interface to include `spellName?: string` and `description?: string`; updated `migrateActionTemplate()` to pass these fields through to `UnifiedActionTemplate`
- Added spell names and descriptions to all non-CRUD templates in `unified-action-templates.ts`: 8 divine, 50+ hex templates, 4 location, 4 artifact, 3 sublocation, 4 revelation, 4 thread-creation
- Added Phase 17 completeness test suite with 4 assertions (has spellName, has description, max 4 words, no raw numbers) scoped to non-encounter templates

## Task Commits

1. **Task 1: CRUD action templates enriched** - `ee53ef9` (feat)
2. **Task 2: All unified templates enriched + completeness test** - `19af763` (feat)

## Files Created/Modified

- `src/data/action-template-content.ts` — Extended `ActionTemplateData` interface; added `spellName` and `description` to all 44 CRUD templates
- `src/data/unified-action-templates.ts` — Updated `migrateActionTemplate()` to pass through fields; added `spellName`/`description` to all divine, hex, location, artifact, sublocation, revelation, and thread-creation templates
- `src/data/__tests__/unified-action-templates.test.ts` — Added `describe('Phase 17: spellName and description completeness')` block with 4 tests

## Decisions Made

- Completeness test scoped by ID prefix rather than iterating all `UNIFIED_ACTION_TEMPLATES` — encounter.* templates (134 templates) are not yet enriched and would fail the test; scoping prevents a permanently failing gate while preserving intent
- 44 CRUD templates covered (plan estimated 36) — gold reach has 11 templates including hire-mercenaries, commission-assassination, buy-influence, fund-construction, establish-monopoly
- Divine template IDs differed from plan suggestions (actual: `divine.dream`, `divine.persuade`, `divine.intimidate`, etc. — not the names in the plan); spell names adapted to actual IDs using thematic consistency

## Deviations from Plan

None — plan executed as specified, with minor adaptations for actual template IDs and counts that differed from plan estimates.

## Issues Encountered

- Pre-existing test failures in 3 integration tests (`traceBuffer-integration`, `tickHealth-integration`, `encounter-liveness.contract`) were present before this plan and are unrelated to action template content — they are timeout failures in long-running tests. Confirmed not caused by this plan's changes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All non-encounter action templates have `spellName` and `description` populated
- Plan 17-03 (action card redesign) can consume `spellName` and `description` from `getTargetActionSlots()` return values
- Encounter templates still lack enrichment — a follow-up plan should add `ENCOUNTER_SPELL_NAMES` lookup table if encounter cards are ever shown in focused view

---
*Phase: 17-add-action-description-fields-and-player-feedback-on-action-activation*
*Completed: 2026-03-30*
