# Phase 1 Plan: Balance Eval Foundation

> **Date:** 2026-04-02
> **Status:** Detailed implementation plan
> **Phase:** 1 of the agent success redesign roadmap
> **Goal:** Make balance measurable, cheap to inspect, and easy for both humans and agents to evaluate continuously

## Why This Phase Comes First

The redesign touches resolution, rewards, quintessence, agent decision-making, and content tuning. If we rewrite those systems before building a proper evaluation layer, we will spend the next several weeks reading logs, guessing at feel, and retuning blind.

The game already has useful pieces:

- trace logging
- a per-agent encounter timeline
- reward history
- a debug bridge
- a CLI
- a headless playtest runner
- a tick health monitor

Those are strong foundations, but they are not yet a balance-eval system. They are fragmented, mostly human-oriented, and do not encode the target design contract.

Phase 1 turns those pieces into a real tuning platform.

---

## Phase 1 Outcomes

By the end of this phase we should be able to:

- define target bands for the new design in code
- collect the right metrics during simulation without scraping prose logs
- summarize runs and cohorts by seed, pack, band, and tracked hero
- compare current behavior to target bands automatically
- expose those results through CLI, scripts, and `window.__DEBUG`
- run cheap eval suites repeatedly while balance is changing

This phase does **not** need to finish the redesign. It needs to make the redesign observable.

---

## Scope

### In scope

- balance target definitions
- runtime telemetry schema
- telemetry capture hooks in the current runtime
- balance summaries and report generation
- CLI/debug/script access to summaries
- reusable seed suites and eval profiles
- minimal tests for the eval pipeline itself

### Out of scope

- final resolution math redesign
- final quintessence rules redesign
- full encounter migration
- full reward economy redesign

Those come next. This phase should be compatible with current runtime behavior while making it easier to measure the effect of later changes.

---

## First Principle

Do not overload `traceBuffer` into the balance system.

`traceBuffer` is intentionally small, debug-shaped, and session-noisy. Balance evaluation needs:

- stable schemas
- longer retention
- aggregated summaries
- target comparison
- machine-readable exports

The right place for ownership is `SimulationRuntime`, not new module-global buffers.

---

## Target Architecture

### New concepts

- `balance targets`
- `balance telemetry`
- `balance summaries`
- `eval profiles`
- `hero journey reports`

### New runtime flow

1. Runtime emits structured balance events during play.
2. Events land in runtime-owned telemetry buffers.
3. Summary builders aggregate them into compact metrics.
4. Evaluators compare metrics against versioned target bands.
5. CLI, scripts, and debug bridge expose the results.

---

## Proposed Deliverables

### 1. Versioned balance target definitions

Create a new source of truth for the numbers we are trying to hit.

Suggested files:

- `src/types/balanceEval.ts`
- `src/engine/balanceTargets.ts`

Suggested shape:

- target bands by encounter tier
- target bands by run phase
- target bands for hero-journey milestones
- green/yellow/red thresholds
- version tag so future changes can be compared meaningfully

Initial target families:

- step success rate by threat band
- encounter completion rate by threat band
- fail-forward rate
- break rate / exhaustion rate
- quintessence spend, loss, and recovery cadence
- reward cadence by category and durability
- condition burden and recovery
- early/mid/late milestone timings

### 2. Runtime-owned balance telemetry

Create dedicated telemetry owned by `SimulationRuntime`.

Suggested files:

- `src/engine/balanceTelemetry.ts`

Suggested `SimulationRuntime` additions:

- `balanceTelemetry`
- `balanceTelemetryVersion`
- maybe a lightweight retention policy for raw event slices

Suggested event families:

- action/encounter lifecycle
- step resolution
- resource spend
- reward grant
- condition/blessing/curse applied or removed
- movement/travel cost where it materially affects cadence
- break / retreat / dissolve / ascension gate attempt
- direct growth / tier-up / quintessenceMax growth

Important rule:

- capture machine-readable facts, not formatted strings

### 3. Summary builders

Create deterministic summary functions that can turn a run into:

- overall run summary
- per-agent hero-journey summary
- per-threat-band summary
- per-content-pack summary
- per-reach summary

Suggested files:

- `src/engine/balanceSummary.ts`
- `src/engine/heroJourneySummary.ts`

Suggested outputs:

- `BalanceRunSummary`
- `BalanceAgentJourneySummary`
- `BalanceCohortSummary`

### 4. Evaluator against targets

Build an evaluator that compares summaries to the target bands.

Suggested file:

- `src/engine/balanceEvaluator.ts`

Suggested result shape:

- `pass`
- `warning`
- `fail`
- finding list with metric name, actual value, target band, and severity

This should feel more like `tickHealthMonitor` for balance than like raw logging.

### 5. Scriptable eval runner

Extend or complement `scripts/playtest.ts` so it can run proper balance sweeps.

Suggested options:

- extend `scripts/playtest.ts`
- or add `scripts/balance-eval.ts`

Recommendation:

- keep `playtest.ts` for narrative/debug playtests
- add a separate `balance-eval.ts` for structured output and target comparison

Suggested npm scripts:

- `npm run balance:smoke`
- `npm run balance:cadence`
- `npm run balance:journey`
- `npm run balance:seed -- --seed 42`

### 6. CLI support

Add CLI commands that make live inspection easier without needing the browser UI.

Suggested additions to `scripts/cli.ts`:

- `balance`
- `balance agent <id>`
- `balance recent`
- `balance targets`
- `balance eval [profile]`

The CLI should surface compact summaries, not giant raw dumps.

### 7. Debug bridge support

Expose balance summaries and raw exports through `window.__DEBUG`.

Suggested additions:

- `getBalanceSummary()`
- `getBalanceAgentSummary(agentIdOrName)`
- `getBalanceTargets()`
- `runBalanceEvaluation()`
- `exportBalanceTelemetry()`

This matters because agent-driven and Playwright-style tooling will need direct access to structured data, and the user already noted that future agents may not have easy access to all the right state otherwise.

### 8. Seed suites and eval profiles

Define standard evaluation profiles so every tuning pass is not hand-assembled.

Suggested profiles:

- `smoke`
  - very cheap
  - many seeds
  - short runs
  - catches crashes, wild regressions, impossible distributions
- `cadence`
  - medium cost
  - focuses on early and mid pacing
  - checks reward rhythm, failure shape, and strain recovery
- `journey`
  - longer run
  - checks hero arc pacing
  - milestone timing
  - durable reward saturation
  - break/retreat burden

---

## Detailed Build Plan

## Step 1. Define the target contract in code

### Why

Without explicit targets, every report becomes descriptive instead of evaluative.

### Build

- Add target types in `src/types/balanceEval.ts`
- Add initial target bands in `src/engine/balanceTargets.ts`

### Initial metrics to codify

- `stepSuccessRateByThreat`
- `completionRateByThreat`
- `failForwardShare`
- `criticalFailureShareByThreat`
- `quintessenceSpendPerEncounter`
- `quintessenceRecoveryPerMinute`
- `breakRatePerHour`
- `conditionsPer100Encounters`
- `durableRewardsPer100Encounters`
- `consumableRewardsPer100Encounters`
- `timeToFirstMeaningfulReward`
- `timeToFirstMajorSetback`
- `timeToFirstPromotionOrEquivalentGrowthBeat`

### Important design choice

Targets should be grouped by context, not only globally.

Examples:

- early run vs mid run vs late run
- trivial/easy/moderate/hard/deadly content
- tracked "hero" vs population-wide averages

---

## Step 2. Create the telemetry event schema

### Why

If we start instrumenting before agreeing on event shape, we will create incompatible data islands.

### Build

- Define event types in `src/types/balanceEval.ts`
- Implement buffer and record helpers in `src/engine/balanceTelemetry.ts`

### Suggested event model

- `step_resolved`
- `action_completed`
- `quintessence_changed`
- `resource_spent`
- `attachment_changed`
- `reward_granted`
- `growth_applied`
- `state_transition`

Suggested common fields:

- `tick`
- `agentId`
- `agentName` when available
- `sourceSystem`
- `templateId` or `encounterId`
- `threatBand`
- `reach`
- `result`
- `quintessenceBefore`
- `quintessenceAfter`

### Retention strategy

Use a hybrid approach:

- retain summary counters for the full run
- retain a bounded raw sample stream for recent/focused inspection
- retain a per-agent journey timeline for explicitly tracked heroes

This keeps evals cheap even when runs are long.

---

## Step 3. Add capture hooks in the current runtime

### Why

We need useful coverage before the redesign lands.

### Initial hook points

- unified action step resolution
- unified action completion
- legacy encounter step resolution
- legacy encounter completion/abandonment
- reward grant / empty reward
- condition/blessing/curse attachment changes
- quintessence change points
- agent growth / tier movement / power shifts

### Likely file touches

- `src/engine/unifiedActionResolution.ts`
- `src/engine/unifiedActionLifecycle.ts`
- `src/engine/encounter.ts`
- `src/engine/orchestrator.ts`
- `src/engine/phaseQuintessence.ts`
- reward and attachment plumbing where grants/removals already occur
- `src/engine/simulationRuntime.ts`

### Important constraint

Instrumentation should not require content rewrites yet.

Phase 1 should tell us what the current system does, even before phase 2 changes the rules.

---

## Step 4. Build summary builders

### Why

Raw events are useful for debugging but expensive for tuning.

### Build

- per-run aggregation
- per-agent journey aggregation
- cohort aggregation across seeds

### Suggested summary sections

#### Run summary

- ticks simulated
- encounters/actions attempted
- average step success by threat
- fail-forward share
- abandon rate
- break/exhaustion counts
- reward totals by category
- durable vs consumable share
- average quintessence profile

#### Agent journey summary

- first tracked appearance
- first encounter
- first reward
- first major setback
- first promotion/growth beat
- number of strain episodes
- number of recoveries
- total durable attachments gained
- longest setback streak

#### Content summary

- encounter/template attempts
- completion by template
- high-risk / low-reward outliers
- over-performing reward pools

---

## Step 5. Build the evaluator

### Why

A report that says "moderate step success rate = 0.41" is still work. The evaluator should tell us whether that is healthy for the target model.

### Build

- compare summaries to target bands
- produce findings grouped by severity
- emit both human-readable and machine-readable output

### Suggested severity model

- `pass`
- `warn`
- `fail`

### Suggested finding fields

- `metric`
- `scope`
- `actual`
- `expected`
- `delta`
- `severity`
- `note`

---

## Step 6. Build the eval runner workflow

### Why

Balance checks must be easy enough that the team actually uses them.

### Build

- add `scripts/balance-eval.ts`
- add profile presets
- write JSON output under `Docs/playtests/balance/`
- optionally write markdown summaries for humans

### Suggested outputs

- `summary.json`
- `evaluation.json`
- `report.md`
- optional `agent-journeys.json`

### Suggested profile defaults

#### Smoke

- `20-50` seeds
- `300-600` ticks
- tiny output

#### Cadence

- `8-16` seeds
- `1,800-3,600` ticks
- stronger reporting

#### Journey

- `3-8` seeds
- `7,200-10,800` ticks
- hero-journey focus

---

## Step 7. Expose balance data to agents and tooling

### Why

The user explicitly called out that future agents may not have direct access to all relevant data. We should fix that deliberately instead of treating it as a future annoyance.

### Build

- add balance methods to `src/debug-bridge.d.ts`
- implement them in `src/debug-bridge.ts`
- make CLI print compact summaries
- make file outputs easy to discover and parse

### Design rule

Every key balance surface should have both:

- a live query path
- a file/export path

That makes the system usable for:

- humans in the browser
- humans in the terminal
- agents operating through tools
- future automation

---

## Step 8. Add tests around the eval infrastructure itself

### Why

We do not want the measurement system quietly lying.

### Suggested test layers

- unit tests for summary reducers
- unit tests for evaluator threshold handling
- contract tests for debug bridge accessors
- smoke tests for the CLI/script outputs

### Especially important tests

- summary counts are deterministic for a synthetic event stream
- evaluator severities flip at the right thresholds
- runtime reset clears telemetry correctly
- per-agent tracked journey summaries do not bleed between sessions

---

## What We Need To Build So Evals Run Smoothly For Agents

This is the part that matters most for continuous balance work.

### 1. Stable schemas

Agents should not have to infer balance meaning from free-text logs. Give them:

- typed JSON summaries
- typed evaluation findings
- typed target definitions

### 2. Bounded but rich exports

Agents should be able to ask for:

- whole-run summary
- one tracked hero summary
- cohort comparison
- recent raw events for diagnosis

They should not need the entire live game state blob.

### 3. Named profiles

Agents should not have to decide every time how many seeds or ticks to use.

Give them:

- `smoke`
- `cadence`
- `journey`

with versioned defaults.

### 4. One tracked-hero concept

For "first hero full journey" evaluation, add an explicit tracked-hero mechanism in the eval pipeline.

That could be:

- ascendant-adjacent hero
- first seeded controllable hero
- explicitly selected agent id

The important part is consistency.

### 5. Cheap report generation

Reports should be cheap enough to run constantly.

That means:

- summaries computed incrementally where possible
- no giant unbounded raw logs by default
- short profiles that still reveal drift quickly

### 6. Clear failure surfaces

Agents should be able to tell the difference between:

- simulation crash
- health-check failure
- balance-target miss
- suspicious but non-failing drift

These are different classes of problems and should produce different outputs.

---

## Recommended File Plan

### New files

- `src/types/balanceEval.ts`
- `src/engine/balanceTargets.ts`
- `src/engine/balanceTelemetry.ts`
- `src/engine/balanceSummary.ts`
- `src/engine/balanceEvaluator.ts`
- `scripts/balance-eval.ts`

### Likely modified files

- `src/engine/simulationRuntime.ts`
- `src/debug-bridge.d.ts`
- `src/debug-bridge.ts`
- `scripts/cli.ts`
- `package.json`
- runtime hook sites in encounter, unified action, reward, and quintessence flows

### Optional later-in-phase files

- `src/engine/heroJourneySummary.ts`
- `src/engine/balanceProfiles.ts`

---

## Concrete Phase 1 Milestones

### Milestone A: Targets and schema

- target definitions exist
- telemetry event schema exists
- no capture hooks yet

### Milestone B: Runtime capture and summaries

- telemetry is recorded in current runs
- run and agent summaries can be produced

### Milestone C: Evaluator and exports

- summaries compare against targets
- file outputs and debug bridge access work

### Milestone D: CLI and profile workflow

- standard profiles can be run easily
- outputs are stable enough for repeated tuning use

### Milestone E: Baseline capture

- record baseline results for the current system before phase 2 changes it

That baseline is important. It gives us a "before" picture and helps us prove the redesign is actually improving the game.

---

## Suggested Success Criteria For Phase 1

- A developer can run a short multi-seed eval in one command.
- The output clearly states which target bands passed, warned, or failed.
- A tracked hero journey can be summarized without scraping raw traces.
- Live debug tooling can expose balance summaries in structured form.
- The system is cheap enough to run repeatedly during tuning work.

If phase 1 lands well, phases 2-5 become dramatically safer and faster.
