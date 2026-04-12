# Encounter & Actor Systems — Test Strategy

**Date:** 2026-04-12
**Approach:** Pipeline-Out (Approach A) — system-level regression tests first, then contract seams, then unit gap fill
**Assertion style:** Statistical bounds across multiple seeds (not pinned deterministic)

## Problem Statement

The encounter/actor system has ~800 unit tests across ~72 files covering individual functions well, but:

1. **No multi-tick regression tests** — nothing catches "agents stopped encountering" or "resolution drifted to 100% success" after a change.
2. **No tuning confidence tests** — changing a constant requires manual CLI inspection to verify the behavioral shift.
3. **~85 engine modules have zero test coverage**, including agent lifecycle, effects system, pacing governor, and encounter aftermath (only 1 test).
4. **`phaseAgentDecision` is thin** — only ~21 tests for the most complex orchestrator phase (8-stage filter/score pipeline).

## Test Taxonomy

Three tiers, two run commands:

| Tier | Runs in | Ticks | Seeds | Runtime target | Purpose |
|------|---------|-------|-------|----------------|---------|
| **Smoke** | `npm test` | 10 | 1 (seed 42) | < 3s | "Did I break the pipeline?" |
| **Regression** | `npm run test:regression` | 50–100 | 3–5 | < 30s | "Is the system behaviorally healthy?" |
| **Tuning** | `npm run test:regression` | 50–100 | 3–5 (×2 runs) | < 60s | "Did my constant change work?" |

### New npm script

```json
"test:regression": "vitest run --testPathPattern='regression|contract'"
```

### File locations

```
src/engine/__tests__/
  encounter-smoke.test.ts                              # Tier 1: smoke
  regression/
    encounter-health.regression.test.ts                # Tier 2: behavioral health
    encounter-tuning.regression.test.ts                # Tier 3: tuning confidence
  contracts/
    agent-decision-pipeline.contract.test.ts           # New contract
    resolution-to-growth.contract.test.ts              # New contract
    encounter-lifecycle.contract.test.ts               # New contract
```

## Shared Test Harness

A `runSimulation(opts)` helper that:

1. Calls `initializeGameState()` with a seed and map size
2. Runs `runTick()` N times, collecting metrics per tick
3. Returns a `SimulationMetrics` object

```typescript
interface SimulationOpts {
  seed: number;
  ticks: number;
  map: 'small' | 'medium' | 'large';
  overrides?: Partial<AgentBehaviorConstants>;  // for tuning tests
}

interface SimulationMetrics {
  // Encounter activity
  encounterStarts: number;
  encounterCompletions: number;
  encounterAbandons: number;
  uniqueEncounterTypes: Set<string>;
  templateRepetitions: Map<string, Map<string, number>>;  // agentId → templateId → count

  // Resolution
  totalResolutions: number;
  successCount: number;
  failureCount: number;
  critSuccessCount: number;
  critFailureCount: number;

  // Movement
  movementEvents: number;
  distinctHexesPerAgent: Map<string, number>;

  // Agent behavior
  idleTicksPerAgent: Map<string, number>;
  maxConsecutiveIdlePerAgent: Map<string, number>;

  // Growth
  rawScoreDeltaPerAgent: Map<string, number>;

  // Traces
  decisionTraceCount: number;

  // Per-agent convenience
  agentCount: number;
  totalAgentTicks: number;  // agentCount × ticks
}

function runSimulation(opts: SimulationOpts): SimulationMetrics;
function runMultiSeed(opts: { seeds: number[]; ticks: number; map: string; overrides?: ... }): SimulationMetrics[];
```

The harness reuses the real engine — same code path as the CLI's `tick N` command. No mocks. Metrics are collected by reading `tickEvents` and `GameState` after each tick.

Constant overrides work by importing from `agent-behavior-constants.ts` (which exports mutable `let` bindings or an object), patching values before `initializeGameState`, and restoring originals in an `afterEach`. This matches the existing test pattern in `encounterScoring.test.ts` where constants are imported and compared. If constants are currently `const`, a thin wrapper (e.g., `getConstants()` / `setTestOverrides()`) may be needed — evaluate during implementation.

## Phase 1: Smoke Tests

**File:** `encounter-smoke.test.ts`
**Runs in:** `npm test`
**Config:** seed 42, 10 ticks, medium map

| # | Assertion | Catches |
|---|-----------|---------|
| 1 | At least 1 agent started an encounter | Dead pipeline, broken cache |
| 2 | At least 1 encounter step resolved | Resolution service disconnected |
| 3 | At least 1 movement event occurred | Movement phase broken |
| 4 | Not all agents idle every tick | Filter pipeline too aggressive |
| 5 | All 10 ticks complete without exceptions | Fail-soft NFP violation |
| 6 | Decision traces emitted | Inspectability NFP violation |
| 7 | Resolution success rate between 20%–80% | Difficulty zeroed (100% success), capability broken (100% failure), clamping removed |

Intentionally loose bounds — confirming the pipeline isn't dead, not asserting balance.

## Phase 2: Regression Tests (Behavioral Health)

**File:** `regression/encounter-health.regression.test.ts`
**Runs in:** `npm run test:regression`
**Config:** 3–5 seeds × 100 ticks, medium map

All bounds checked as: compute metric per seed, average across seeds, assert average within bounds.

```typescript
const results = seeds.map(seed => runSimulation({ seed, ticks: 100, map: 'medium' }));
const avgIdleRate = mean(results.map(r => r.idleRate));
expect(avgIdleRate).toBeLessThan(0.40);
```

| # | Metric | Bound | Catches |
|---|--------|-------|---------|
| 1 | Idle rate per agent | < 40% | Filters too aggressive, awareness too narrow, content gaps |
| 2 | Distinct encounter types seen | ≥ 5 per 100 ticks | Scoring collapse, desire miscalibration |
| 3 | Encounter completion rate | > 50% of started | Durations too long, movement interrupting, cooldown broken |
| 4 | Resolution success rate | 30%–70% | Difficulty scaling broken, modifier caps removed |
| 5 | Critical rate (success + failure) | 5%–15% | Doubles logic changed |
| 6 | Distinct hexes visited per agent | ≥ 2 per 100 ticks | Movement broken, travel cost too high |
| 7 | Agents with capability growth | ≥ 50% of agents | Growth function broken, diminishing returns too aggressive |
| 8 | Max consecutive idle ticks | ≤ 20 for any agent | Forced travel broken, starvation counter bug |
| 9 | Max same-template repetitions per agent | ≤ 3 per 100 ticks | Familiarity decay broken |

### Bound Calibration

Before finalizing bounds, run the harness against 10+ seeds and measure the actual distribution. Set bounds at ~2× the observed range to avoid flaky tests. The numbers above are starting estimates — calibrate after the harness is built.

## Phase 3: Tuning Confidence Tests

**File:** `regression/encounter-tuning.regression.test.ts`
**Runs in:** `npm run test:regression`
**Config:** 3 seeds × 100 ticks, baseline + tuned run per test

Pattern: run baseline → override constant → run again → assert metric shifted in the expected **direction** (not by a specific amount).

| # | Constant changed | Direction | Metric measured |
|---|-----------------|-----------|-----------------|
| 1 | `FAMILIARITY_DECAY_PER_ATTEMPT` × 2 | ↓ | Max same-template repetitions per agent |
| 2 | `BASE_AWARENESS_HOPS` + 2 | ↓ | Idle rate |
| 3 | `IDLE_SCORE_THRESHOLD` × 10 | ↑ | Idle rate |
| 4 | `TRAVEL_COST_WEIGHT` × 3 | ↓ | Distinct hexes visited per agent |
| 5 | `BASE_ENCOUNTER_GROWTH` × 2 | ↑ | Mean raw score delta per agent |
| 6 | `EXPLORATION_NOVELTY_BONUS` × 3 | ↑ | Distinct hexes visited |
| 7 | `OUTGROWTH_FILTER_ENABLED` = false | ↑ | Encounter starts for high-cap agents |

Each test runs 2× the simulation (baseline + tuned). The override mechanism passes constants into the simulation runner, which applies them before `initializeGameState` and restores after.

## Phase 4: New Contract Tests

### `agent-decision-pipeline.contract.test.ts`

Full phaseAgentDecision pipeline with real state (6+ locations, 3+ agents, 20+ templates):

| # | Assertion |
|---|-----------|
| 1 | Cache → filter → score → select produces a valid encounter (exists in cache, passes filters, positive score, agent now occupied or moving) |
| 2 | Filter stages reduce candidates monotonically (each stage ≤ input count) |
| 3 | Scoring is deterministic (same state + seed → identical selection) |
| 4 | Occupied agents are skipped (no encounter selected, no traces) |

### `resolution-to-growth.contract.test.ts`

Resolution → capability growth → tier promotion chain:

| # | Assertion |
|---|-----------|
| 1 | Successful resolution increases raw score in the step's reach domain |
| 2 | Growth respects diminishing returns (high raw score agent grows less than low) |
| 3 | Tier crossing triggers promotion trace and faction rank update |

### `encounter-lifecycle.contract.test.ts`

Initiate → progress → resolve → aftermath:

| # | Assertion |
|---|-----------|
| 1 | Initiated encounter progresses to completion (each step resolves in order) |
| 2 | Aftermath applies rewards and trait changes to agent graph |
| 3 | Abandoned encounter triggers cooldown and frees agent |

## Phase 5: Unit Gap Fill

Ranked by impact on encounter system health:

| Priority | Module | Why | New tests |
|----------|--------|-----|-----------|
| P1 | `phaseAgentDecision` (deeper) | Most complex phase, only 10 tests. Edge cases: forced travel trigger, starvation counter, cadence re-evaluation for moving agents | ~8 |
| P2 | Effects system (`effectExecutors`, `effectScope`) | Effects modify resolution modifiers silently. Untested effects = untested resolution inputs | ~12 |
| P3 | `encounterAftermath` (deeper) | Only 1 test. Reward pool drawing, trait application, reputation delta, encounter seeding | ~8 |
| P4 | `agentLifecycle` | Birth/death affects population dynamics and encounter availability | ~6 |
| P5 | `pacingGovernor` / `balanceEvaluator` | Untested output can't be trusted for tuning decisions | ~6 |
| P6 | `encounterChains` | Broken chains = broken narrative arcs | ~4 |

**Total new tests across all phases: ~80-90**

## Implementation Order

| Step | What | Depends on | Estimate |
|------|------|-----------|----------|
| 1 | Build `runSimulation` harness + `SimulationMetrics` | Nothing | Foundation for everything else |
| 2 | Smoke tests (Phase 1) | Harness | Quick win, immediate value in `npm test` |
| 3 | Regression tests (Phase 2) | Harness | Calibrate bounds against 10+ seeds |
| 4 | Contract tests (Phase 4) | Nothing (independent of harness) | Can parallelize with step 3 |
| 5 | Tuning confidence tests (Phase 3) | Harness + constant override mechanism | Builds on step 3 |
| 6 | Unit gap fill (Phase 5) | Nothing (independent) | Can start anytime, P1–P2 first |

Steps 3+4 can run in parallel. Step 6 can start anytime but benefits from the regression safety net being in place first.

## Success Criteria

- `npm test` catches dead pipelines in < 3 seconds
- `npm run test:regression` catches behavioral drift and validates tuning changes in < 60 seconds
- Contract tests protect the three critical seams (decision pipeline, resolution→growth, encounter lifecycle)
- P1–P3 unit gaps filled, reducing untested encounter-adjacent modules from ~85 to ~55
- Bounds calibrated against real simulation data, not guesses — flaky test rate < 5%
