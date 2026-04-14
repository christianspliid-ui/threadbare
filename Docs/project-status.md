# Project Status
> Updated 2026-04-15.
## Current Focus
**THR-73 shipped.** `choice_set` player resolution now executes consequences: `onResolve` in `GameView.tsx` calls `executeEffect` per consequence, emits `ChoiceSetPlayerResolvedTrace`, bumps `touchWorld`, and adds a narrative log event. Content Architecture project (choice_set deferral) fully closed.
## Milestone Status
- **v1.0 Foundation:** Shipped 2026-03-30 — Phases 1-18 + M2.5 (81 plans, 1533 commits)
- **v1.1 Optimization:** In progress — Phases 19-22 (determinism, wiring, performance, hygiene)
- **v1.2 Social Systems Expansion:** Designed — 5 expansions. Design doc: `Docs/plans/2026-03-31-social-systems-expansion-design.md`
- **Agent Success Redesign:** Phase 1 ✅, Phase 2 ✅, Phase 3 ✅, Phase 4 ✅ corrected (2026-04-03)
- **Next:** Phase 5 (encounter migration and early-game retune), or v1.2 Social Systems
## Recent Completions (2026-04-15)
- **THR-73 choice_set consequence execution:** `onResolve` now runs `executeEffect` per consequence with per-effect try/catch, nested `pendingChoice` guard, `touchWorld` bump, `TickEvent` to narrative log, and `emitTrace` for debug panel. New trace types: `ChoiceSetPlayerResolvedTrace`, `ChoiceSetPlayerDismissedTrace`. Commit: `3666c7cd`.

## Recent Completions (2026-04-14)
- **THR-14 choice_set primitive (TB-128):** Type 40 in effects.ts, `executeChoiceSet` executor (predicate filtering, ai_auto/weighted_random/player modes, PRNG determinism, PendingChoiceData), 14 unit tests, 6 proof-pack effects (loot fork, dialogue branch, sacrifice/save, path fork, faction alignment, mercy test), `ChoiceSetModal` with countdown bar, `pendingChoice` state in `useAgentInteraction`, `AnimateMount`-wrapped modal in `GameView`. Commit: `a46c680e`.
- **THR-50 DebugPanel & Lodash Audit:** `DebugPanel.tsx` 204 → 194 lines (TABS moved to DebugTabContent). Lodash audit: no direct usage, no duplicate bundles. Commit: `3ba90d17`.
- **THR-60 Untrack vault:** All 11 vault directories removed from git tracking; `.gitignore` guards them. Local vault preserved on disk. Commit: `8ee0a966`.
- **THR-61 vercel.json:** Drop `npm test &&` from buildCommand, add `ignoreCommand` (doc-only skip), add `/assets/*` immutable cache headers. Commit: `18cc6579`.
- **THR-23 Encounter Packets (3 templates):** `enc.courtyard_duel` (shaping, Iron/Gold), `enc.brink_rescue` (shaping, Star/Iron), `enc.letters_of_introduction` (background, Gold/Heart). Full support bundles, authored choices, BranchAwareAftermathConfig. Also fixed `fireDoomThresholdEffects` Math.random leak (determinism regression). Commit: `8ee0a966`.
- **THR-17 Wound Detection:** `appliesWound?: boolean` on `EncounterOutcome`. `resolveEncounter` returns `woundApplied`. Orchestrator uses it instead of `!result.success` proxy. 4 tests. Commit: `d722f924`.
- **THR-8 Attention Tier Model — Phase 6 UI (complete):** All 10 slices. 70 unit tests. Dormant/reactivate actions, `set_thread_courtposition` GraphOp, `StoryBeatModal` auto-pause. Commits: `ed2da1f9`, `918eac56`, `678925da`.

## Recent Completions (2026-04-13)
- **THR-44 Determinism Fix:** Restored byte-identical determinism. 8 ID counters reset in `resetDecisionCache()`; `Date.now()` in spellActivation → seeded counter. Commit: `48767613`.
- **UI/UX Design Infrastructure (THR-45/46/47/48/49):** `frontend-ui` skill, `component-selection.md`, `layout-zones.md`, `?view=styleguide`, `ui-patterns.md` (+6 patterns).
- **TB-129 DoD Hook Enforcement:** Claude Code hooks hard-gate commits (tsc + tests), pushes (doc updates + build), session stops.
- **TB-104 Phase 1B — `resource_delta` + `action_trigger` Primitives:** 16 unit tests.
- **TB-121 CI/CD Pipeline:** GitHub Actions CI on every push/PR.
- **TB-120 Test Suite Repair Sprint:** 31 failing test files fixed. 599 files / 9015 tests green.
- **Encounter Actor Test Suite:** Three-tier test suite, 33 tests across 8 files.

## Earlier (see project-history.md)

Ambition-Driven Strategic Actions, Encounter Activity Visibility, THR-8 earlier slices, Faction Network Visibility, Objective Triangle Sync, Terrain Texture Lab, Ascendant Portrait System, Encounter Veil, Content Catalog Pipeline, and more — `Docs/project-history.md`.

## Active Backlog Ideas

- **TB-105–108 Thematic Pressure & Living World Pass** (new design cluster: omen agendas, cool failure, doom identity, intent/activity visibility)
- **TB-095–099 Social Systems Expansion** (v1.2 — designed, ready to sequence into phases)
- TB-071 Economy Second Pass · TB-069 Location NPCs · TB-051 Monster Encounters residual scope · TB-037 Onboarding · TB-032 Agent Seeding Pre-Existing Relationships · TB-017 Chain Reactions · TB-018 Cosmological Manipulation

Full backlog: `.planning/BACKLOG.md` · Completed work: `Docs/project-history.md`
