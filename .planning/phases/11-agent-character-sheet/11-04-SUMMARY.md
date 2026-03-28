---
phase: 11-agent-character-sheet
plan: "04"
subsystem: revelation-action-cards
tags: [revelation, action-cards, agent-knowledge, divine-actions]
dependency_graph:
  requires: [11-01, 11-03]
  provides: [revelation-action-cards, resolveRevelationAction]
  affects: [agentKnowledge, actionDrawer, unifiedActionResolution]
tech_stack:
  added: []
  patterns: [tdd-red-green, revelation-hooks, unified-action-templates]
key_files:
  created:
    - src/engine/__tests__/revelationActionCards.test.ts
  modified:
    - src/data/unified-action-templates.ts
    - src/types/unifiedAction.ts
    - src/engine/revelationEmitter.ts
    - src/engine/unifiedActionResolution.ts
decisions:
  - "revelationAction field added to UnifiedActionTemplate type as optional string — extensible without schema change"
  - "REVELATION_ACTION_TEMPLATES array appended at end of UNIFIED_ACTION_TEMPLATES — no migration needed"
  - "whisper_insight reveals highest-weight unrevealed axiological pair (sorted by Math.abs) — surfaces most prominent values first"
  - "scry uses relates_to edges for bonds — consistent with existing bond revelation model"
  - "observe uses DOMAIN_ORDER canonical iteration order — deterministic (NFP #3)"
metrics:
  duration: "4 minutes"
  completed: "2026-03-28"
  tasks_completed: 2
  files_modified: 5
---

# Phase 11 Plan 04: Revelation Action Cards Summary

4 divine action cards (Observe, Scry, Whisper Insight, Dream Sending) that let the player deliberately discover agent information through the revelation system — `resolveRevelationAction` dispatches all 4 types via `agentKnowledge` hooks with trace emission and fail-soft wrapping.

## Tasks Completed

| # | Task | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Add 4 revelation action card templates | 3d47140 | unified-action-templates.ts, unifiedAction.ts |
| 2 | Wire action card resolution to revelation system | c302d79 | revelationEmitter.ts, unifiedActionResolution.ts |

## What Was Built

### Task 1: Four revelation action card templates

Added `REVELATION_ACTION_TEMPLATES` array with 4 new `UnifiedActionTemplate` entries:

- **observe_agent** — reach: eye, essenceCost: 5, targetCategories: ['actor'], revelationAction: 'observe'
- **scry_agent** — reach: eye, essenceCost: 15, targetCategories: ['actor'], revelationAction: 'scry'
- **whisper_insight** — reach: veil, essenceCost: 5, targetCategories: ['actor'], revelationAction: 'whisper_insight'
- **dream_sending** — reach: star, essenceCost: 15, targetCategories: ['actor'], revelationAction: 'dream_sending'

All templates: actorAffinities: ['ascendant'], scale: 'cosmic', difficulty: 0.0 (always succeed), appended to `UNIFIED_ACTION_TEMPLATES`.

Added optional `revelationAction?: string` field to `UnifiedActionTemplate` type.

### Task 2: resolveRevelationAction function

Added `export function resolveRevelationAction(actionType, state, targetAgentId)` to `revelationEmitter.ts`:

- **'observe'**: finds first domain in canonical order not yet in `revealedDomains`, calls `revealDomain()`, emits `domain_revealed` TickEvent + RevelationTrace, increments depth by `DEPTH_DIVINE_ACTION`
- **'scry'**: iterates all 9 domains calling `revealDomain()`, iterates `relates_to` edges calling `revealBond(..., 'divine')`, iterates `possesses` edges calling `revealPossession()`, emits scry_complete TickEvent + traces
- **'whisper_insight'**: sorts axiologicalProfile by Math.abs(weight), reveals first unrevealed pair via `revealValue()`, always calls `revealDisposition()`
- **'dream_sending'**: gets first `pursues` edge target, calls `revealAmbition()`, calls `revealThreat()`

Wired into `phaseUnifiedActionProgress` in `unifiedActionResolution.ts`: after successful uncontested action resolution, checks `template.revelationAction` and calls `resolveRevelationAction()` wrapped in try/catch.

## Test Results

39 tests in `src/engine/__tests__/revelationActionCards.test.ts` — all pass.

- 28 template existence + field correctness tests (Task 1)
- 11 resolveRevelationAction behavior tests (Task 2): domain reveal, depth increment, TickEvent emission, bond reveal, value reveal, disposition/threat reveals, idempotency, RevelationTrace emission

## Verification

- `npx tsc --noEmit` — clean
- `npx vite build` — success (7.55s)
- `npx vitest run src/engine/__tests__/revelation*` — 119/119 passed
- All pre-existing test failures (socialOutcome, AgentDetailPanel, AgentDots) are unrelated to this plan

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- src/engine/__tests__/revelationActionCards.test.ts — FOUND
- src/engine/revelationEmitter.ts — FOUND
- commit 3d47140 (feat: add 4 revelation action card templates) — FOUND
- commit c302d79 (feat: wire revelation action resolution) — FOUND
