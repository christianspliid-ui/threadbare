# Phase 1: Balance Eval Foundation — Implementation Plan

> **Status:** Ready for implementation
>
> **For the coding agent:** Implement this plan in order. Prefer additive, low-risk changes. The purpose of phase 1 is to make the redesign observable, not to rebalance the game yet.

**Goal:** Build a first-class balance instrumentation and evaluation layer so the team can cheaply and repeatedly measure whether agent success/failure, reward cadence, quintessence pressure, and hero-journey pacing are inside target bands.

**Design docs:**

- `Docs/plans/2026-04-02-agent-success-redesign-roadmap.md`
- `Docs/plans/2026-04-02-phase1-balance-eval-foundation-plan.md`
- `Docs/plans/2026-04-02-encounter-redesign-guidelines.md`

**Current code to build on:**

- `src/engine/simulationRuntime.ts` — proper owner for session-scoped telemetry
- `src/engine/orchestrator.ts` — tick orchestration, reward resolution, legacy encounter progression
- `src/engine/unifiedActionResolution.ts` — unified step resolution surface
- `src/engine/encounterTimeline.ts` — per-agent session timeline
- `src/engine/rewardHistory.ts` — reward event ring buffer
- `src/engine/tickHealthMonitor.ts` — good pattern for pass/warn/fail style reporting
- `src/debug-bridge.ts` and `src/debug-bridge.d.ts` — structured dev surface
- `scripts/cli.ts` — headless inspection surface
- `scripts/playtest.ts` — headless multi-seed execution surface
- `src/components/Game/hooks/useSimulation.ts` — owns the live `SimulationRuntime`

**Hard constraints:**

1. Phase 1 must not intentionally change simulation balance or runtime behavior.
2. New instrumentation must be fail-soft and must never crash the tick loop.
3. Do not add more module-global balance state. Session-owned telemetry belongs in `SimulationRuntime`.
4. Do not overload `traceBuffer` into the balance system.
5. Outputs must be machine-readable first and human-readable second.

---

## Architecture

Phase 1 should produce four layers:

1. **Targets**
   - Versioned numeric expectations for the redesign.
2. **Telemetry**
   - Structured events and counters captured during simulation.
3. **Summaries + Evaluator**
   - Deterministic reducers that turn telemetry into metrics and compare them to target bands.
4. **Surfaces**
   - CLI, debug bridge, and file-based eval runner outputs for humans and agents.

The intended data flow is:

`runtime activity -> telemetry capture -> summaries -> evaluator -> CLI/debug/export`

---

## Dependency Order

Follow this exact order:

1. Add shared balance types.
2. Add target definitions.
3. Extend `SimulationRuntime` with telemetry ownership.
4. Implement telemetry recorders and bounded storage.
5. Hook telemetry into current runtime seams.
6. Implement summary builders.
7. Implement evaluator.
8. Expose summaries through debug bridge and CLI.
9. Add `balance-eval` script and standard profiles.
10. Add tests and capture a baseline report.

Do not start broad runtime hook-up before the event schema and storage model are stable.

---

## Sprint Overview

| Sprint | Focus | Deliverable |
|---|---|---|
| 1 | Types, targets, runtime ownership | New balance types and targets compile; runtime owns telemetry |
| 2 | Telemetry capture | Current simulation emits structured balance data without changing behavior |
| 3 | Summaries, evaluator, and exports | Run summaries and pass/warn/fail findings exist and are scriptable |
| 4 | CLI/debug/runner polish + baseline | Cheap repeatable eval workflow exists for humans and agents |

---

## Sprint 1: Types, Targets, Runtime Ownership

**Goal:** Establish the type foundation and session-owned storage without touching balance behavior.

### Task 1.1: Add shared balance types

**Files:**

- Create: `src/types/balanceEval.ts`
- Test: `src/engine/__tests__/balanceTargets.test.ts`

**Define:**

- `BalanceThreatBand`
- `BalanceRunSegment` such as `opening`, `early`, `mid`, `late`
- `BalanceMetricSeverity` as `pass | warning | fail`
- `BalanceEventKind`
- `BalanceEvent`
- `BalanceMetricBand`
- `BalanceTargets`
- `BalanceRunSummary`
- `BalanceAgentJourneySummary`
- `BalanceCohortSummary`
- `BalanceEvaluationFinding`
- `BalanceEvaluationResult`
- `BalanceEvalProfile`

**Minimum event kinds for phase 1:**

- `step_resolved`
- `action_resolved`
- `encounter_resolved`
- `quintessence_changed`
- `reward_granted`
- `attachment_changed`
- `growth_applied`
- `state_transition`

**Requirements:**

- Keep the schema additive and future-proof.
- Include explicit fields for `tick`, `agentId`, `sourceSystem`, `reach`, `threatBand`, and `result` where relevant.
- Include optional fields instead of overloading one giant union payload.

**Tests:**

- Add a test that `DEFAULT_BALANCE_TARGETS` is structurally valid once task 1.2 exists.

### Task 1.2: Add versioned target definitions

**Files:**

- Create: `src/engine/balanceTargets.ts`
- Test: `src/engine/__tests__/balanceTargets.test.ts`

**Implement:**

- `BALANCE_TARGETS_VERSION`
- `DEFAULT_BALANCE_TARGETS`
- helper accessors such as:
  - `getDefaultBalanceTargets()`
  - `getTargetBand(metricId, scope)`

**Minimum metric targets to include now:**

- step success rate by threat band
- encounter completion rate by threat band
- fail-forward share
- critical failure share by threat band
- average quintessence loss per encounter by threat band
- average quintessence recovery per minute
- durable rewards per 100 encounters
- consumable rewards per 100 encounters
- conditions per 100 encounters
- time to first meaningful reward
- time to first major setback
- time to first growth beat

**Important:**

- Do not pretend the current game already hits these targets.
- These are redesign targets, not baseline assertions.
- Store them in a way the evaluator can report against clearly.

### Task 1.3: Extend `SimulationRuntime` to own telemetry

**Files:**

- Modify: `src/engine/simulationRuntime.ts`
- Test: `src/engine/__tests__/simulationRuntime.test.ts` or new focused test

**Add fields to `SimulationRuntime`:**

- `balanceTelemetry`
- `balanceTelemetryVersion`

**Add helpers:**

- `resetBalanceTelemetry(runtime)`
- ensure `resetRuntimeCaches(runtime)` also resets telemetry-owned transient buffers where appropriate

**Requirements:**

- Telemetry must reset on new session and new cycle where appropriate.
- Version counters should allow UI/tooling memoization later if needed.

**Acceptance criteria:**

- `createSimulationRuntime()` returns a runtime with initialized telemetry.
- `resetRuntimeCaches()` does not leave stale telemetry from a previous run.

---

## Sprint 2: Telemetry Capture

**Goal:** Capture balance-relevant facts from the current runtime with minimal churn and zero intentional behavior changes.

### Task 2.1: Implement telemetry storage and record helpers

**Files:**

- Create: `src/engine/balanceTelemetry.ts`
- Test: `src/engine/__tests__/balanceTelemetry.test.ts`

**Implement:**

- `createBalanceTelemetry()`
- `recordBalanceEvent(runtime, event)`
- `getBalanceEvents(runtime, options?)`
- `getTrackedAgentIds(runtime)`
- `setTrackedAgents(runtime, ids)`
- `clearBalanceTelemetry(runtime)`

**Storage strategy:**

- Keep aggregate counters for the full run.
- Keep a bounded raw event buffer for recent diagnostics.
- Keep a separate per-agent bounded journey buffer for tracked heroes.

**Recommended shape:**

- `meta`
- `counters`
- `recentEvents`
- `trackedAgentIds`
- `trackedAgentEvents`
- `firstSeen` / `milestones`

**Do not:**

- Store unbounded raw events for every actor forever.
- Reuse `traceBuffer` internals.

### Task 2.2: Add run metadata and tracked-hero selection

**Files:**

- Modify: `src/engine/balanceTelemetry.ts`
- Modify: `scripts/playtest.ts` later in sprint 4

**Implement:**

- run metadata fields:
  - seed
  - start tick
  - target version
  - map size if available
- tracked hero selection policy

**Default tracked hero policy:**

- If the runner explicitly passes an agent id, use that.
- Otherwise deterministically select the first individual actor by stable sorted ID from the initial state.

**Why:**

- We need a stable "hero journey" lens for repeated evals.

### Task 2.3: Instrument unified action resolution

**Files:**

- Modify: `src/engine/unifiedActionResolution.ts`
- Modify: `src/engine/orchestrator.ts`
- Test: `src/engine/__tests__/balanceTelemetry-unified-actions.test.ts`

**Implement:**

- Pass `runtime` into `phaseUnifiedActionProgress(...)` as an additive parameter.
- When a unified step resolves, emit `step_resolved`.
- When an action resolves, emit `action_resolved`.

**Capture at minimum:**

- actor id
- template id
- current step
- reach
- difficulty
- capability
- probability
- roll
- result
- resolved status
- target id
- tick

**Important:**

- Preserve current action behavior.
- This sprint is about observing current semantics, even if they are not the final semantics.

### Task 2.4: Instrument legacy encounter resolution

**Files:**

- Modify: `src/engine/encounter.ts`
- Modify: `src/engine/orchestrator.ts`
- Test: `src/engine/__tests__/balanceTelemetry-encounters.test.ts`

**Implement:**

- Record `step_resolved` for legacy encounter steps.
- Record `encounter_resolved` when the encounter completes or is abandoned.

**Capture at minimum:**

- actor id
- encounter id
- step index
- reach
- difficulty
- capability
- probability
- roll
- success/failure
- final status
- reward pool presence

**Note:**

- We need this because the current game still runs real agent content through the legacy encounter pipeline.

### Task 2.5: Instrument quintessence changes

**Files:**

- Modify: `src/engine/phaseQuintessence.ts`
- Test: `src/engine/__tests__/balanceTelemetry-quintessence.test.ts`

**Implement:**

- Add optional runtime parameter to `phaseQuintessence(...)`, threaded from `orchestrator`.
- Emit `quintessence_changed` for:
  - applied delta from pending events
  - passive regen if you want it visible in telemetry
  - zero-state / dissolution transition

**Minimum fields:**

- node id
- node type
- before
- after
- delta
- reason/source if known
- tick

**Guideline:**

- Passive regen can be aggregated coarsely if per-node raw spam becomes too noisy.

### Task 2.6: Instrument rewards and attachments

**Files:**

- Modify: `src/engine/orchestrator.ts`
- Modify: reward/attachment application sites as needed
- Test: `src/engine/__tests__/balanceTelemetry-rewards.test.ts`

**Implement:**

- Emit `reward_granted` whenever reward resolution already records a reward event.
- Emit `attachment_changed` when conditions, blessings, curses, allies, items, or equivalent attachments are added or removed through encounter/action resolution.

**Capture at minimum for rewards:**

- actor id
- encounter/action source
- template id/name
- category
- tier
- bad outcome flag
- tick

**Capture at minimum for attachments:**

- actor id
- attachment id or template id
- category
- operation `added | removed`
- source system
- tick

**Important:**

- If attachment plumbing is too distributed, phase 1 can instrument the highest-value common paths first and leave a short TODO list in the doc/tests.

### Task 2.7: Instrument growth beats and breaking points

**Files:**

- Modify: `src/engine/unifiedActionResolution.ts`
- Modify: `src/engine/encounter.ts`
- Modify: `src/engine/phaseQuintessence.ts`
- Test: focused reducer tests

**Implement:**

- Emit `growth_applied` when reach/tier growth is granted.
- Emit `state_transition` when an actor:
  - is dissolved
  - becomes broken/retreated if current systems already represent it
  - hits a notable tracked threshold if already available

**Why:**

- The evaluator needs milestone timing and setback timing.

---

## Sprint 3: Summaries, Evaluator, and Structured Exports

**Goal:** Turn raw telemetry into compact metrics and actionable findings.

### Task 3.1: Build run summary reducers

**Files:**

- Create: `src/engine/balanceSummary.ts`
- Test: `src/engine/__tests__/balanceSummary.test.ts`

**Implement:**

- `buildBalanceRunSummary(runtime, state?)`
- `buildBalanceAgentJourneySummary(runtime, agentId)`
- `buildBalanceCohortSummary(runSummaries)`

**Run summary sections:**

- totals
  - ticks
  - encounters attempted
  - actions attempted
  - rewards granted
- rates by threat band
  - step success
  - completion
  - crit failure
- resilience
  - quintessence loss
  - quintessence recovery
  - dissolution / break counts
- rewards
  - by category
  - by durability class if derivable
- burden
  - conditions / curses / negative attachments
- pacing
  - time to first reward
  - time to first setback
  - time to first growth beat

### Task 3.2: Build hero-journey summary

**Files:**

- Create: `src/engine/heroJourneySummary.ts` or keep inside `balanceSummary.ts`
- Test: `src/engine/__tests__/heroJourneySummary.test.ts`

**Implement:**

- one tracked-agent summary optimized for the "first hero full journey" use case

**Minimum fields:**

- tracked agent id and name
- first seen tick
- first encounter tick
- first reward tick
- first major setback tick
- first growth beat tick
- total reward counts
- total setback counts
- longest setback streak
- notable durable attachment counts

**Requirement:**

- The journey summary must be stable enough for agents to compare across seeds.

### Task 3.3: Build evaluator against target bands

**Files:**

- Create: `src/engine/balanceEvaluator.ts`
- Test: `src/engine/__tests__/balanceEvaluator.test.ts`

**Implement:**

- `evaluateBalanceSummary(summary, targets)`
- `evaluateAgentJourney(summary, targets)`
- optional `evaluateCohortSummary(summary, targets)`

**Output shape:**

- overall status
- findings array
- per-metric status map

**Each finding should include:**

- metric id
- scope
- actual
- expected
- severity
- short explanation

**Use `tickHealthMonitor` as the style model:**

- structured
- deterministic
- no prose-only judgments

### Task 3.4: Add export helpers

**Files:**

- Modify: `src/engine/balanceTelemetry.ts`
- Modify: `src/engine/balanceSummary.ts`
- Test: reducer/export tests

**Implement:**

- JSON-serializable export methods for:
  - raw recent events
  - run summary
  - agent journey summary
  - evaluation result

**Requirement:**

- Exports must not include giant circular `GameState` blobs.

---

## Sprint 4: CLI, Debug Bridge, Eval Runner, and Baseline

**Goal:** Make the system easy to use repeatedly.

### Task 4.1: Expose runtime and balance surfaces to the debug bridge

**Files:**

- Modify: `src/debug-bridge.d.ts`
- Modify: `src/debug-bridge.ts`
- Modify: `src/components/Game/hooks/useSimulation.ts` and/or registration surface if needed
- Test: `src/engine/__tests__/debug-bridge-balance.test.ts`

**Implement:**

- add a runtime provider registration if needed:
  - `_registerRuntimeProvider`
- expose:
  - `getBalanceTargets()`
  - `getBalanceSummary()`
  - `getBalanceAgentSummary(agentIdOrName)`
  - `getBalanceEvaluation()`
  - `exportBalanceTelemetry()`

**Important:**

- `useSimulation.ts` owns the live `SimulationRuntime`, so the bridge needs a clean way to access it.

### Task 4.2: Add CLI commands

**Files:**

- Modify: `scripts/cli.ts`
- Test: lightweight snapshot/format tests if practical

**Add commands:**

- `balance`
- `balance agent <idOrName>`
- `balance targets`
- `balance recent [N]`
- `balance eval`

**CLI behavior:**

- print concise summaries
- avoid massive raw dumps by default
- point to export paths when needed

### Task 4.3: Add a dedicated balance eval runner

**Files:**

- Create: `scripts/balance-eval.ts`
- Modify: `package.json`

**Do not overload `scripts/playtest.ts`.**

Keep `playtest.ts` for human-readable narrative/debug reports and create a dedicated runner for structured balance output.

**Implement CLI flags:**

- `--seed`
- `--seeds`
- `--ticks`
- `--profile`
- `--track-agent`
- `--out-dir`

**Profiles to support now:**

- `smoke`
- `cadence`
- `journey`

**Outputs per run:**

- `summary.json`
- `evaluation.json`
- `agent-journey.json`
- optional `report.md`

**Suggested npm scripts:**

- `balance:smoke`
- `balance:cadence`
- `balance:journey`
- `balance:seed`

### Task 4.4: Add baseline capture workflow

**Files:**

- Modify: `Docs/plans/2026-04-02-phase1-balance-eval-foundation-plan.md` only if needed
- Output files under `Docs/playtests/balance/`

**Run:**

- at least one `smoke` baseline
- at least one `cadence` baseline
- optionally one long `journey` baseline if affordable

**Purpose:**

- establish a before-state for the current system
- prove the toolchain works before phase 2 changes begin

---

## Tests

Add or update the following focused tests.

### Unit tests

- `src/engine/__tests__/balanceTargets.test.ts`
- `src/engine/__tests__/balanceTelemetry.test.ts`
- `src/engine/__tests__/balanceSummary.test.ts`
- `src/engine/__tests__/balanceEvaluator.test.ts`
- `src/engine/__tests__/heroJourneySummary.test.ts`

### Integration-style tests

- `src/engine/__tests__/balanceTelemetry-unified-actions.test.ts`
- `src/engine/__tests__/balanceTelemetry-encounters.test.ts`
- `src/engine/__tests__/balanceTelemetry-quintessence.test.ts`
- `src/engine/__tests__/balanceTelemetry-rewards.test.ts`
- `src/engine/__tests__/debug-bridge-balance.test.ts`

### Contract expectations

- telemetry does not bleed between sessions
- telemetry resets correctly on cycle reset where intended
- summary reducers are deterministic
- evaluator thresholds flip at the right edges
- adding instrumentation does not break existing encounter or unified-action tests

---

## Verification Commands

Run these incrementally, not only at the end.

### During sprint 1

```powershell
npx vitest run src/engine/__tests__/balanceTargets.test.ts
npx tsc -b
```

### During sprint 2

```powershell
npx vitest run src/engine/__tests__/balanceTelemetry*.test.ts
npx vitest run src/engine/__tests__/encounter.test.ts src/engine/__tests__/rewardPool.test.ts
```

### During sprint 3

```powershell
npx vitest run src/engine/__tests__/balanceSummary.test.ts src/engine/__tests__/balanceEvaluator.test.ts
npx tsc -b
```

### During sprint 4

```powershell
npx vitest run src/engine/__tests__/debug-bridge-balance.test.ts
npx vitest run
npm run balance:smoke
```

If full `vitest` is too slow, still run all new balance tests plus the most relevant encounter/unified-action tests before finishing.

---

## Acceptance Criteria

Phase 1 is complete when all of the following are true:

1. The game emits structured balance telemetry during normal simulation.
2. Telemetry is owned by `SimulationRuntime`, not stray module globals.
3. A run summary and tracked-hero journey summary can be produced in JSON.
4. An evaluator compares those summaries against versioned targets and reports pass/warn/fail findings.
5. The debug bridge exposes structured balance summary access for tooling and future agents.
6. The CLI can inspect current balance state without requiring raw log reading.
7. A dedicated `balance-eval` runner exists with `smoke`, `cadence`, and `journey` profiles.
8. At least one baseline report has been generated for the current system.
9. Existing gameplay behavior is unchanged except for negligible instrumentation overhead.

---

## Non-Goals For This Phase

Do **not** do the following in this implementation:

- retune the sigmoid or reach values
- redesign crit logic
- redesign quintessence semantics
- migrate legacy encounters into unified actions
- rewrite planner utility logic
- change reward probabilities to hit targets

If you find obviously wrong balance code while instrumenting, note it in the final summary, but do not fold phase 2 work into phase 1.

---

## Suggested Final Deliverable Summary

When this phase is done, the coding agent should report:

- files created and modified
- what telemetry is captured
- what metrics are summarized
- what CLI/debug commands were added
- which eval profiles exist
- which baseline runs were executed
- any known telemetry gaps intentionally left for phase 2

That should give the next phase a stable, trustworthy platform to build on.
