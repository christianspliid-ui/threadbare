# Test Failure Triage — 12 April 2026

**Status:** Implementation plan (Cowork-authored, for Claude Code)
**Scope:** 29 test files failing, ~85 individual test failures

## Diagnosis Summary

Run `npm test 2>&1 | Select-String "failed"` to reproduce. Three root causes cover the majority of failures; the remainder need verbose test output to pinpoint.

---

## Root Cause 1: CosmologyProfile Shape Mismatch

**Impact:** ~15+ tests across 6-8 files (all 100%-failure files)
**Type:** Tests pass old nested structures; source expects flat `Record<SphereName, number>`

### What happened

`CosmologyProfile` in `src/types/index.ts:28` is defined as:
```ts
export type CosmologyProfile = Record<SphereName, number>;
// SphereName = 'chaos'|'order'|'light'|'darkness'|'force'|'matter'|'energy'|'life'|'mind'|'spirit'|'time'|'entropy'
```

Tests were written when the type had a nested shape and never updated. Two patterns exist:

**Pattern A** — `foundationChaos` / `creationSpheres`:
```ts
// WRONG (used in familiarity-integration, progressive-disclosure-integration)
{
  foundationChaos: 0.5,
  foundationLight: 0.5,
  creationSpheres: { force: 0.3, matter: 0.3, ... },
}
```

**Pattern B** — nested `foundation`:
```ts
// WRONG (used in interventionEffects-integration, actionNarrative-integration)
{
  foundation: { chaos: 0.4, order: 0.6, light: 0.5, darkness: 0.5 },
}
```

**Correct shape:**
```ts
{
  chaos: 0.5, order: 0.5, light: 0.5, darkness: 0.5,
  force: 0.3, matter: 0.3, energy: 0.15, life: 0.15,
  mind: 0, spirit: 0, time: 0, entropy: 0,
}
```

### Files to fix

Search tests for `foundationChaos` and `foundation:` within `initializeGameState` calls:
- `src/engine/__tests__/familiarity-integration.test.ts` (lines 33-44, 108+)
- `src/engine/__tests__/progressive-disclosure-integration.test.ts` (lines 41-52)
- `src/engine/__tests__/interventionEffects-integration.test.ts` (lines 25-32)
- `src/engine/__tests__/actionNarrative-integration.test.ts` (lines 25-32)
- Any other file using `initializeGameState` — grep for the call and verify the cosmology arg shape

### Fix

Replace nested cosmology objects with flat `Record<SphereName, number>`. Consider extracting a `testCosmology()` helper to avoid repetition:
```ts
function testCosmology(overrides?: Partial<CosmologyProfile>): CosmologyProfile {
  return {
    chaos: 0.5, order: 0.5, light: 0.5, darkness: 0.5,
    force: 0.3, matter: 0.3, energy: 0.15, life: 0.15,
    mind: 0, spirit: 0, time: 0, entropy: 0,
    ...overrides,
  };
}
```

---

## Root Cause 2: Missing `tier` Field on Domain Data in Test Mocks

**Impact:** ~8 tests in AgentInfoCard, possibly AgentProfileModal
**Type:** Test mock data missing required field

### What happened

`AgentInfoCardData.domains` at `src/engine/agentDetail.ts:201` requires:
```ts
domains?: { domain: ReachDomain; word: string; tier: number }[];
```

Test mocks in `AgentInfoCard.test.tsx` only provide `{ domain, word }` without `tier`. The component likely renders tier-dependent UI (tier badges, tier-gated sections) that fails when `tier` is undefined.

### Files to fix

- `src/components/Game/__tests__/AgentInfoCard.test.tsx` — add `tier: 1` (or appropriate values) to all domain entries in mock data
- `src/components/Game/__tests__/AgentProfileModal.test.tsx` — check for same pattern

---

## Root Cause 3: Content Data Drift (Single-Failure Tests)

**Impact:** ~5-8 individual test failures across data/content test files
**Type:** Source-of-truth content objects out of sync with type definitions

These tests fail 1 out of many, suggesting a specific terrain type, location subtype, or template was added/renamed without updating the content data (or vice versa):

- `src/data/__tests__/movement-content.test.ts` (1/77) — likely a terrain or location subtype mismatch in `TERRAIN_TAXES` or `LOCATION_ENTRY_TAXES`
- `src/audio/__tests__/terrainSoundKey.test.ts` (1/7) — missing terrain key in sound mapping
- `src/data/__tests__/influence-content.test.ts` (1/5) — influence content missing a sphere or reach
- `src/data/__tests__/unified-action-templates.test.ts` (1/68) — one template with a bad field or missing reference

### Fix approach

Run each test with `--reporter=verbose` to see the exact assertion that fails. The fix is mechanical: add the missing key or update the changed value.

---

## Root Cause 4: Unknown — Needs Verbose Output

The remaining failures need `npx vitest run <file> --reporter=verbose` to diagnose. They may cascade from Root Cause 1 or have independent issues:

- `src/engine/__tests__/revelationGate.test.ts` (8/10) — `getTargetActionSlots` signature or param change
- `src/utils/__tests__/portraitCompositor.test.ts` (7/14) — canvas/image mock issues
- `src/components/Remembrance/__tests__/RemembranceFlow.test.tsx` (2/4) — long test (5s), may be async timing
- `src/components/Game/__tests__/useAgentInteraction-effects.test.tsx` (3/11)
- `src/components/Game/__tests__/GameView-interaction.test.tsx` (3/6)
- `src/engine/__tests__/traceBuffer-integration.test.ts` (2/10) — 14s runtime, heavy integration
- `src/engine/__tests__/tickHealth-integration.test.ts` (1/3) — 15s runtime
- `src/engine/__tests__/contracts/encounter-liveness.contract.test.ts` (2/3) — 19s runtime

### Recommended triage order

1. Fix Root Cause 1 first (cosmology shape) — this will likely resolve 15+ failures and may cascade-fix some integration tests
2. Fix Root Cause 2 (tier field) — quick, fixes 8+ component tests
3. Re-run `npm test` and count remaining failures
4. For each remaining failure, run verbose and fix individually

---

## Pre-Commit Checklist (per CLAUDE.md)

After all fixes:
1. `npm test` — all tests pass
2. `npx tsc --noEmit` — type check clean
3. `npx vite build` — production build succeeds
