---
phase: 17-add-action-description-fields-and-player-feedback-on-action-activation
plan: "01"
subsystem: action-data-layer
tags: [types, action-templates, wheel-slot, data-layer]
dependency_graph:
  requires: []
  provides: [spellName-on-UnifiedActionTemplate, description-on-UnifiedActionTemplate, consequenceMessage-on-UnifiedActionTemplate, spellName-on-WheelSlot, technicalDescription-on-WheelSlot]
  affects: [ActionCard, toast-system, Plans-02-04]
tech_stack:
  added: []
  patterns: [optional-readonly-field-extension, backward-compatible-type-widening]
key_files:
  created: []
  modified:
    - src/types/unifiedAction.ts
    - src/engine/wheel.ts
    - src/engine/targetActions.ts
    - src/engine/__tests__/targetActions.test.ts
decisions:
  - "Fields placed after narrativeTemplates block for logical grouping — display metadata lives near narrative metadata"
  - "slot.description continues to carry narrativeTemplates.initiation as flavor; technicalDescription is the new separate field — avoids breaking ActionCard consumers"
  - "consequenceMessage typed as object with success+failure strings matching narrativeTemplates shape — Plans 02-04 can selectively override per-template"
metrics:
  duration: "6 minutes"
  completed: "2026-03-30T12:46:46Z"
  tasks: 2
  files: 4
---

# Phase 17 Plan 01: Data Layer — spellName, description, consequenceMessage

Data layer foundation for Phase 17 player-feedback feature: UnifiedActionTemplate and WheelSlot extended with optional display metadata fields (spellName, description, consequenceMessage) that Plans 02-04 consume for ActionCard UI and toast output.

## What Was Built

### UnifiedActionTemplate — 3 new optional readonly fields

`src/types/unifiedAction.ts` now carries:

- `spellName?: string` — Ars Magica-style evocative display name (max 3 words). Replaces `name` in ActionCard focused spell-name zone; `name` kept for engine/debug use.
- `description?: string` — Qualitative game-mechanical description (2-3 sentences, no numbers). Shown in ActionCard description text box. Falls back to `narrativeTemplates.initiation` when absent.
- `consequenceMessage?: { success: string; failure: string }` — Optional custom toast/feed output. Falls back to `narrativeTemplates.success/failure` when absent.

### WheelSlot — 2 new optional fields

`src/engine/wheel.ts` now carries:

- `spellName?: string` — passed through from template for ActionCard to read directly.
- `technicalDescription?: string` — carries `template.description`; keeps `slot.description` as flavor text (narrativeTemplates.initiation) unchanged.

### getTargetActionSlots wiring

`src/engine/targetActions.ts` `slots.push({...})` extended with:
```
spellName: template.spellName,
technicalDescription: template.description,
```

### Tests (5 new)

`src/engine/__tests__/targetActions.test.ts` — "Phase 17: spellName and technicalDescription population" describe block:
1. Populates spellName when template has it
2. Leaves spellName undefined when absent
3. Populates technicalDescription when template.description present
4. Leaves technicalDescription undefined when absent
5. Flavor description (slot.description) remains narrativeTemplates.initiation even when technicalDescription is also set

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- `npx tsc --noEmit` exits 0
- `npm test src/engine/__tests__/targetActions.test.ts` — 31/31 pass (26 pre-existing + 5 new)
- Full suite: 3 pre-existing failures in tickHealth-integration, traceBuffer-integration, encounter-liveness.contract — unrelated to this plan's changes

## Self-Check: PASSED

Files confirmed present:
- src/types/unifiedAction.ts — contains `readonly spellName?: string`
- src/engine/wheel.ts — contains `spellName?: string` and `technicalDescription?: string`
- src/engine/targetActions.ts — contains `spellName: template.spellName` and `technicalDescription: template.description`

Commits confirmed:
- beef2d2 feat(17-01): add spellName, description, consequenceMessage to UnifiedActionTemplate and WheelSlot
- 79cad34 feat(17-01): wire spellName and technicalDescription through getTargetActionSlots + tests
