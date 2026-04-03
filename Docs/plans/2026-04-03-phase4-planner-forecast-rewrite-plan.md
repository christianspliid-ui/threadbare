# Phase 4: Agent Decision and Forecast Rewrite — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the agent planner reason with the same outcome ladder and resource model that the live runtime now uses, closing the planner/live drift.

**Architecture:** Add a thin planner adapter (`plannerForecast.ts`) over the shared resolution service that produces expected-utility scores from the 5-tier outcome ladder. Wire it into `encounterScoring.ts` to replace the binary `completionProb * reward` model. Add quintessence-aware push/resist utility for the proving slice. Add forecast drift telemetry to `balanceTelemetry.ts`.

**Tech Stack:** TypeScript, vitest

---

## Audit Summary

### What already works (Phase 2-3 achievements)
- `resolutionService.ts` — shared resolution math with `computeOutcomeProbabilities()` producing per-tier probabilities
- `encounterScoring.ts` — `estimateStepProbability()` already delegates to `computeResolutionThreshold()`
- `unifiedActionResolution.ts` — full outcome ladder with push/resist for proving slice families
- `outcomeConsequences.ts` — per-tier Q costs/rewards for proving slice templates

### What needs to change (Phase 4 gaps)
1. **`estimateCompletionProb()`** — Binary: multiplies per-step pass probabilities. Does not consider outcome tiers.
2. **`scoreAndSelect()`** — `expectedReward = completionProb * successRewardEstimate`. All success is equal, all failure is zero. No Q cost accounting.
3. **No push/resist awareness** — Planner cannot estimate whether spending Q is worthwhile.
4. **No forecast drift telemetry** — No way to compare what the planner predicted vs what actually happened.

### What stays the same (not Phase 4)
- `agentSelection.ts` (Maslow pipeline) — Different scoring path for unified action templates (axiological). Not encounter scoring. Leave as-is.
- Encounter content — Phase 5 retuning work.
- `outcomeConsequences.ts` — Already correct, just consumed by planner now.

---

## File Plan

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `src/engine/plannerForecast.ts` | Planner adapter: per-step outcome distributions, expected utility, push/resist utility |
| Modify | `src/engine/encounterScoring.ts` | Wire `plannerForecast` into scoring; replace binary completion model |
| Modify | `src/engine/balanceTelemetry.ts` | Add forecast drift event recording |
| Modify | `src/engine/balanceSummary.ts` | Add forecast drift summary |
| Modify | `src/types/balanceEval.ts` | Add `forecast_recorded` event kind and drift fields |
| Create | `src/engine/__tests__/plannerForecast.test.ts` | Tests for planner forecast adapter |
| Modify | `src/engine/__tests__/encounterScoring.test.ts` | Tests for rich scoring integration |

---

## Task 1: Create Planner Forecast Adapter

**Files:**
- Create: `src/engine/plannerForecast.ts`
- Create: `src/engine/__tests__/plannerForecast.test.ts`

The core new module. Thin adapter over `resolutionService.computeOutcomeProbabilities()` that produces expected-utility scores for the planner.

### Step 1.1: Write failing tests for `forecastStepExpectedUtility`

### Step 1.2: Implement `plannerForecast.ts` with:
- `forecastStepExpectedUtility(capability, difficulty, modifiers?)` — returns weighted expected value across 5 outcome tiers
- `forecastEncounterExpectedUtility(entry, agentId, graph)` — multi-step encounter utility
- `estimatePushBenefit(capability, difficulty, currentQ, qMax)` — whether pushing is rational
- `estimateResistValue(capability, difficulty, currentQ, qMax)` — expected value of resist option
- Named constants for outcome tier utility weights

### Step 1.3: Run tests, verify, commit

---

## Task 2: Wire Rich Scoring into encounterScoring.ts

**Files:**
- Modify: `src/engine/encounterScoring.ts`
- Modify: `src/engine/__tests__/encounterScoring.test.ts`

### Step 2.1: Replace `estimateCompletionProb` usage with `forecastEncounterExpectedUtility`
- The `expectedReward` calculation in `scoreAndSelect()` currently does `completionProb * (successRewardEstimate + growthValue)`
- Replace with: `expectedUtility` from `forecastEncounterExpectedUtility` which accounts for all 5 tiers
- Keep `completionProb` for trace/debug output (backward compat)
- Add `expectedUtility` and `pushBenefit` fields to `ScoredCandidate`

### Step 2.2: Add quintessence-aware scoring for push/resist
- For proving slice templates, add push benefit to expected utility when affordable
- For resist-eligible templates, factor in resist value (reduces downside)
- Read actor's current Q state from graph

### Step 2.3: Update trace output to include new fields

### Step 2.4: Run tests, verify, commit

---

## Task 3: Add Forecast Drift Telemetry

**Files:**
- Modify: `src/types/balanceEval.ts`
- Modify: `src/engine/balanceTelemetry.ts`
- Modify: `src/engine/balanceSummary.ts`
- Modify: `src/engine/unifiedActionResolution.ts`

### Step 3.1: Add `forecast_recorded` event kind to BalanceEvent
- Fields: `forecastedUtility`, `forecastedCompletionProb`, `forecastedPushBenefit`, `templateId`, `agentId`

### Step 3.2: Record forecast at decision time in `phaseAgentDecision.ts`
- When an agent selects an encounter, record what the planner predicted

### Step 3.3: Add drift summary to `balanceSummary.ts`
- Compare forecasted vs actual outcomes per template family
- Add `forecastDrift` section to `BalanceRunSummary`

### Step 3.4: Run tests, verify, commit

---

## Task 4: Verification and Bounded Cleanup

### Step 4.1: Run full test suite
### Step 4.2: Type check (`npx tsc --noEmit`)
### Step 4.3: Production build (`npx vite build`)
### Step 4.4: Commit and push

---

## Guardrails

- Do NOT retune encounter content (Phase 5)
- Do NOT modify `outcomeConsequences.ts` (already correct)
- Do NOT change `agentSelection.ts` (different pipeline, not encounter scoring)
- Do NOT invent a generic utility framework — keep it narrow and explicit
- Proving slice families for push/resist awareness match existing Phase 3 sets
