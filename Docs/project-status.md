# Project Status

> Updated 2026-04-03.

## Current Focus

**Agent Success Redesign Phase 4** — Complete. Planner now reasons with the same 5-tier outcome model as live resolution. Push/resist Q-aware scoring for proving-slice action families. Forecast drift telemetry wired.

## Milestone Status

- **v1.0 Foundation:** Shipped 2026-03-30 — Phases 1-18 + M2.5 (81 plans, 1533 commits)
- **v1.1 Optimization:** In progress — Phases 19-22 (determinism, wiring, performance, hygiene)
- **v1.2 Social Systems Expansion:** Designed — 5 expansions. Design doc: `Docs/plans/2026-03-31-social-systems-expansion-design.md`
- **Agent Success Redesign:** Phase 1 ✅, Phase 2 ✅, Phase 3 ✅, Phase 4 ✅ (2026-04-03)
- **Next:** Phase 5 (encounter migration and early-game retune), or v1.2 Social Systems

## Recent Completions (2026-04-03)

- **Agent Success Redesign Phase 4 — Planner Forecast Rewrite:**
  - Created `plannerForecast.ts` — adapter over shared resolution service producing expected utility from 5-tier outcome ladder
  - `forecastStepExpectedUtility`: weighted EU across critical_success, success, success_at_cost, failure, critical_failure
  - `forecastEncounterExpectedUtility`: multi-step encounter utility with push/resist analysis
  - Wired into `encounterScoring.ts`: push/resist benefit additive to encounter scoring; `expectedUtility` tracked on `ScoredCandidate`
  - Push-aware planner: risky/coercive templates (assassinate, conquer, commission-assassination) — Q-cost/benefit analysis, suppressed when Q low
  - Resist-aware planner: social/influence templates (heart.*, shadow.recruit) — expected downgrade value factored in
  - Forecast drift telemetry: `forecast_recorded` balance events at decision time, counters in `BalanceCounters`, `forecastDrift` section in run summaries (MAE, push/resist recommendation counts)
  - 29 new tests in `plannerForecast.test.ts`, 0 regressions across 179 Phase 4-related tests

- **Agent Success Redesign Phase 3 — Unified Action Outcome Expansion (fully wired):**
  5-tier outcome ladder, push/resist Q spend seams, proving-slice consequences, 35 tests.

## Recent Completions (2026-04-02)

- **Agent Success Redesign Phase 2:** Shared resolution service, quintessence current/max, doubles-based crits, 169 tests.
- **Balance-Eval Phase 1:** Session-owned telemetry, summaries, evaluator, CLI runner. 79 tests.

## Active Backlog Ideas

- **TB-095–099 Social Systems Expansion** (v1.2 — designed, ready to sequence into phases)
- TB-071 Economy Second Pass (brainstormed, needs design)
- TB-069 Location NPCs (idea)
- TB-051 Monster Encounters residual scope (roaming, threat scaling — core delivered in M2.5)
- TB-037 Onboarding (idea)
- TB-032 Agent Seeding — Pre-Existing Relationships (preliminary design exists)
- TB-017 Chain Reactions (idea)
- TB-018 Cosmological Manipulation (idea)

## Full Backlog
See: `.planning/BACKLOG.md`

## Completed Work
See: `Docs/project-history.md`
