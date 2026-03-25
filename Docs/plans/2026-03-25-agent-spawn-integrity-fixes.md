# Agent Spawn Integrity Fixes — Implementation Plan

**Date:** 2026-03-25
**Status:** Plan complete, ready for Claude Code
**Assessment doc:** `Docs/agent-spawn-assessment.md`
**Backlog:** TB-030

---

## Summary

The agent spawn assessment identified five risks, and a follow-up code audit found two additional critical bugs. This plan addresses all six code-level defects and adds a validation utility for ongoing protection.

---

## Task 0: Fix Birth Edge-Type Bug (CRITICAL)

**Problem:** `agentLifecycle.ts` line 135 queries `graph.getIncomingEdges(locId, 'contains')` to find agents at a location, but `contains` edges connect *regions* → *locations*, not locations → agents. The canonical edge type for agent-location is `located_at` (agent → location). **Births are effectively disabled — the density check always returns 0 agents.**

**Evidence:**
- `worldSeed.ts` creates `contains` edges only at line 474: `region → location`
- Agents get `located_at` edges (agent → location) at lines 611, 181
- Every other file in the engine uses `getIncomingEdges(locId, 'located_at')` to find agents at a location (e.g., `contextBuilder.ts:129`, `hexZoom.ts:38`)

**Fix:** In `agentLifecycle.ts` line 135, replace:
```typescript
const agentsHere = graph.getIncomingEdges(locId, 'contains')
  .map(e => graph.getNode(e.source))
  .filter(n => n && n.properties.actorType === 'individual');
```
with:
```typescript
const agentsHere = graph.getIncomingEdges(locId, 'located_at')
  .map(e => graph.getNode(e.source))
  .filter(n => n && n.properties.actorType === 'individual');
```

**Tests:**
- Unit test: birth triggers when 3+ agents share a location (was impossible before this fix)
- Verify existing agentLifecycle tests still pass — some may need updated expectations since births will now actually occur

**Files:** `src/engine/agentLifecycle.ts`

---

## Task 1: Fix Born Agent Axiological Profiles

**Problem:** `agentLifecycle.ts` birth function sets `axiologicalProfile: {}` — an empty object. All downstream systems that read specific value pairs (decision scoring, disposition evaluation, cultural tension) get `undefined`.

**Fix:**

In the birth function (around line 200 of `agentLifecycle.ts`), replace:
```typescript
axiologicalProfile: {},
```
with a call to `generateAxiologicalProfile(rng, cosmology)`, matching the worldSeed pattern. The cosmology is available from `state.cosmology` (verify this is on `GameState` — if not, it can be pulled from the World-Soul node in the graph).

**Fallback option:** If cosmology is unavailable in the lifecycle phase, generate a blended profile from the agents at the birth location:
```typescript
const neighbors = getAgentsAtLocation(graph, locId);
const blendedProfile = blendAxiologicalProfiles(neighbors.map(n => n.properties.axiologicalProfile));
// Apply some random jitter so the newborn isn't a clone
```

**Tests:**
- Unit test: born agent has all 10 axiological pairs with values in [-1, 1]
- Contract test: born agent's profile is accepted by `applyDispositionModifier` without fallback

**Files:** `src/engine/agentLifecycle.ts`

---

## Task 2: Add `validateAgentIntegrity()` Utility

**Purpose:** A single function that checks whether an agent node has all required data for the tick loop to process it correctly. Called after world seed and after each birth event. Returns structured results for tracing.

**Interface:**
```typescript
interface AgentValidationResult {
  agentId: string;
  valid: boolean;
  checks: {
    nodeIntegrity: boolean;
    axiologicalProfile: boolean;
    domainCapabilities: boolean;
    locationBinding: boolean;    // individuals only
    identityProperties: boolean; // individuals only
    edgeRelationships: boolean;
    movementState: boolean;      // only if movementState present
  };
  warnings: string[];  // non-fatal issues
  errors: string[];    // fatal issues
}

function validateAgentIntegrity(
  graph: GameGraph,
  agentId: string
): AgentValidationResult;
```

**Checks (from assessment doc):**
1. Node exists with `type: 'actor'`, valid `actorType`, non-empty `name`
2. `axiologicalProfile` has all 10 pairs, each in [-1, 1]
3. `domainCapabilities` has all 9 reaches, each ≥ 0
4. (Individuals) Exactly one `located_at` edge to a valid location node
5. (Individuals) Valid `narrativeArchetype`, `cooperationStrategy`, `reputationScore`
6. Edge targets (member_of, pursues, worships, belongs_to) point to valid nodes
7. (If movementState present) `destinationId` valid, `movementQueue` non-empty, costs > 0

**Integration points:**
- Call in `seedWorld()` after all agents are created — log warnings to console, emit trace
- Call in `agentLifecycle.ts` after birth — emit `agent_validation` trace on failure
- Optionally callable from debug console for runtime roster dump

**Constants:**
```typescript
const CANONICAL_VALUE_PAIRS = [
  'mercy_ruthlessness', 'asceticism_extravagance', 'honesty_cunning',
  'loyalty_ambition', 'tradition_innovation', 'order_freedom',
  'pride_humility', 'patience_wrath', 'courage_caution', 'idealism_pragmatism'
] as const;

const CANONICAL_REACHES = [
  'iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star', 'flesh'
] as const;

const VALID_COOPERATION_STRATEGIES = [
  'tit-for-tat', 'grudger', 'pavlov', 'always-cooperate', 'always-defect'
] as const;
```

**File:** New file `src/engine/agentValidation.ts` + tests in `src/engine/__tests__/agentValidation.test.ts`

---

## Task 3: Add Fail-Soft Wrapping to `phaseMovement`

**Problem:** `phaseAgentDecision` wraps its agent loop in try-catch (good), but `phaseMovement` does not. A single malformed agent could crash the movement phase and halt the tick loop.

**Fix:** Wrap the per-agent processing in `phaseMovement` with the same try-catch pattern used in `phaseAgentDecision`:

```typescript
for (const agent of agents) {
  try {
    // existing movement logic
  } catch (err) {
    events.push({
      type: 'phase_error',
      tick: state.tick,
      message: `Movement phase failed for ${agent.id}: ${err}`,
      significance: 0.8,
    });
    // Continue to next agent — don't crash the loop
  }
}
```

**Tests:**
- Unit test: malformed `movementState` on one agent doesn't prevent other agents from moving
- Verify existing movement tests still pass

**File:** `src/engine/phaseMovement.ts`

---

## Task 4: Canonicalize Location Source of Truth

**Problem:** `properties.locationId` and the `located_at` edge can diverge. Different code paths read different sources, causing an agent to appear at different locations depending on who asks.

**Fix — phase 1 (this plan):**
- Add a consistency check to `validateAgentIntegrity()`: warn when `properties.locationId` and `located_at` edge target disagree
- In the movement phase arrival handler, ensure both are updated atomically (they likely already are — verify)

**Fix — phase 2 (future, if divergence is observed):**
- Deprecate `properties.locationId` entirely
- Add a helper `getAgentLocationId(graph, agentId)` that reads the `located_at` edge
- Migrate all callers

**Files:** `src/engine/agentValidation.ts` (check), `src/engine/phaseMovement.ts` (verify atomic update)

---

## Task 5: Fix `assignCooperationStrategy` Call with Empty Profile

**Problem:** `agentLifecycle.ts` line 162 calls `assignCooperationStrategy(archetype.id, {} as any, rng)`. The `{} as any` bypasses TypeScript but means all axiological nudges in `disposition.ts` lines 76–88 silently evaluate `undefined < -0.3` → `false`. Born agents get archetype-weighted strategies but with zero personality influence.

**Fix:** This is automatically fixed once Task 1 is done — the born agent will have a real profile before `assignCooperationStrategy` is called. Ensure the call order is: generate profile → assign strategy using that profile.

**Verify:** After Task 1 fix, check that `assignCooperationStrategy` receives a real AxiologicalProfile, not `{} as any`.

**Files:** `src/engine/agentLifecycle.ts`

---

## Task 6: Null-Guard Sublocation Lookup in `phaseMovement`

**Problem:** `phaseMovement.ts` line ~128 does `state.graph.getNode(sublocationId)` and then accesses properties on the result without a null check. If a sublocation was dissolved between the movement start and arrival, this throws and (without Task 3's try-catch) crashes the entire movement phase.

**Fix:** Add a null check:
```typescript
const sublocation = graph.getNode(sublocationId);
if (!sublocation) {
  // Sublocation was dissolved — fall back to parent location
  // (clear targetSublocationId from movementState)
}
```

**Files:** `src/engine/phaseMovement.ts`

---

## Task 7: Fix Variant Edge Types (Quick Wins from Graph Audit)

**Problem:** The graph audit (TB-033 design doc) found four variant edge type strings used in production that are either misspellings, duplicates, or undefined. These should be fixed alongside the birth bug since they're the same class of error.

| Bug | File | Fix |
|-----|------|-----|
| `located_in` instead of `located_at` | `src/engine/phaseEconomicChronicle.ts` | Replace `'located_in'` → `'located_at'` (2 occurrences) |
| `relationship` instead of `relates_to` | `src/engine/agentDetail.ts` | Replace `'relationship'` → `'relates_to'` |
| Dead edge types in union | `src/types/graph.ts` | Add `// RESERVED: not yet implemented` comment above `enchanted`, `warded`, `cursed`, `blessed` |

**Note:** `encounter_at` in `movementCandidates.ts` and `threatRating.ts` may be intentional — check whether it should be added to `EdgeType` union or replaced. Flag for review if unclear.

**Tests:**
- `npm test` — verify no tests break from the renames (if a test creates a `relationship` edge, update it to `relates_to`)
- `npx tsc --noEmit` — type-check clean

**Files:** `src/engine/phaseEconomicChronicle.ts`, `src/engine/agentDetail.ts`, `src/types/graph.ts`

---

## Execution Order

1. Task 0 first (birth edge-type bug) — births are completely broken without this
2. Task 1 (fix born profiles) — once births work, profiles must be correct
3. Task 5 (verify strategy call) — follows automatically from Task 1
4. Task 7 (variant edge fixes) — same class of bug, quick one-line fixes
5. Task 2 (validation utility) — gives us visibility into remaining issues
6. Task 3 (fail-soft movement) — safety net
7. Task 6 (sublocation null guard) — specific crash prevention
8. Task 4 phase 1 (consistency check) — add to validator

## Pre-Commit Verification

- `npm test` — all tests pass
- `npx tsc --noEmit` — type-check clean
- Run the game at `?view=game`, let 20+ ticks pass, check console for `agent_validation` warnings
- Verify born agents (if any spawn) have full axiological profiles
- Grep for `'located_in'` and `'relationship'` — should return zero hits in `src/`
