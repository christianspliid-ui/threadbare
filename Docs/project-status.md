# Project Status

> Updated 2026-04-04.

## Current Focus

**Coat of Arms & Icon System** — Complete. Procedural SVG heraldry for all factions (shield + divisions + charges derived from faction type, sphere alignment, reach weights). SphereIcon (12) and ReachIcon (8) with canonical cosmology colors. Integrated into FactionSheet, FactionEntry chronicle, and ArmyLayer hex map. 82 tests.

## Milestone Status

- **v1.0 Foundation:** Shipped 2026-03-30 — Phases 1-18 + M2.5 (81 plans, 1533 commits)
- **v1.1 Optimization:** In progress — Phases 19-22 (determinism, wiring, performance, hygiene)
- **v1.2 Social Systems Expansion:** Designed — 5 expansions. Design doc: `Docs/plans/2026-03-31-social-systems-expansion-design.md`
- **Agent Success Redesign:** Phase 1 ✅, Phase 2 ✅, Phase 3 ✅, Phase 4 ✅ corrected (2026-04-03)
- **Next:** Phase 5 (encounter migration and early-game retune), or v1.2 Social Systems

## Recent Completions (2026-04-04)

- **Coat of Arms & Icon System:**
  - Procedural SVG generator: shield shape + 6 heraldic divisions (per faction type) + 8 charge symbols (per reach) + tinctures from cosmology palette
  - SphereIcon: 12 unique geometric symbols for all foundation + creation spheres
  - ReachIcon: 8 domain icons reusing heraldic charges in rounded-rect frames
  - Integrated into FactionSheet (48px), FactionEntry chronicle (24px), ArmyLayer hex map sprites
  - 82 new tests, design doc: `Docs/plans/2026-04-04-coat-of-arms-and-icon-system-design.md`

## Previous Completions (2026-04-03)

- **TB-104 Procedural Content Component Library Foundation — Slice 1:**
  - Added reusable effect primitives: `test_shaper`, `prevent_loss`, `content_grant`
  - Wired `test_shaper` into encounter and unified-action resolution via the shared resolution service
  - Wired quintessence rescue through `prevent_loss` in `phaseQuintessence`
  - Added immediate `service` reward-shell resolution and proof content: Duelist's Luck Token, Hearthglass Ward, Letters of Introduction, Patron's Backing
  - Focused verification green: 158 targeted tests + `npx tsc --noEmit` + `npm run build`

- **Agent Success Redesign Phase 4 — Planner Forecast Rewrite (corrected 2026-04-03):**
  - Created `plannerForecast.ts` — adapter over shared resolution service producing expected utility from 5-tier outcome ladder
  - `forecastStepExpectedUtility`: weighted EU with exact `success_at_cost` derivation — `min(NEAR_MISS_MARGIN, threshold) / 100`
  - `forecastEncounterExpectedUtility`: multi-step encounter utility with push/resist analysis
  - Wired into `encounterScoring.ts`: EU drives `valuePerTick` when positive; binary `expectedReward` fallback for incapable agents
  - Push-aware planner: risky/coercive templates (assassinate, conquer, commission-assassination) — Q-cost/benefit analysis, suppressed when Q low
  - Resist-aware planner: social/influence templates (heart.*, shadow.recruit) — expected downgrade value factored in
  - Forecast drift telemetry: `forecast_recorded` balance events, `forecastDrift.completionRateGap` (renamed from mislabeled MAE) in run summaries
  - 29 new tests in `plannerForecast.test.ts`, 87/87 pass post-correction

- **Agent Success Redesign Phase 3 — Unified Action Outcome Expansion (fully wired):**
  5-tier outcome ladder, push/resist Q spend seams, proving-slice consequences, 35 tests.

## Recent Completions (2026-04-02)

- **Agent Success Redesign Phase 2:** Shared resolution service, quintessence current/max, doubles-based crits, 169 tests.
- **Balance-Eval Phase 1:** Session-owned telemetry, summaries, evaluator, CLI runner. 79 tests.

## Active Backlog Ideas

- **TB-105–108 Thematic Pressure & Living World Pass** (new design cluster: omen agendas, cool failure, doom identity, intent/activity visibility)
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
