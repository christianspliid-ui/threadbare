# Project Status

> Updated 2026-03-31.

## Current Focus

**v1.1 Low-Hanging Fruit Optimization** — Phases 19-22 in progress (separate agent). Determinism, wiring, performance, code hygiene.

**Culture Seeding Phase 1** (TB-031) — Territory-aware culture placement via province system. Shipped 2026-03-31.

## Milestone Status

- **v1.0 Foundation:** Shipped 2026-03-30 — Phases 1-18 + M2.5 (81 plans, 1533 commits)
- **v1.1 Optimization:** In progress — Phases 19-22 (determinism, wiring, performance, hygiene)
- **Next:** Agent seeding (TB-032), Chain reactions (TB-017), NPCs (TB-069), Economy second pass (TB-071)

## Recent Completions (2026-03-31)

- **Generic Effect System:** 29 composable effect primitives, spell framework (cost/backlash/prerequisites), effect resolver with legacy fallback, effect tick engine (duration/cooldown/decay/stacking), aura proximity + reactive triggers, executors for teleport/spawn/dispel/terrain/compel/structures/rules/factions, scoped targeting (hex/radius/region/faction/biome/global). 5 spell templates, 3 god-tier artifacts, 10 terrain overlays. 52 tests, 18 CMS constants. Orchestrator phase 2a.4.
- **Phase 21-03 Vite manualChunks bundle split:** Main bundle reduced from 3,277 kB to 2,695 kB (-582 kB, -17.8%). Three new parallel-loadable data chunks.
- **Reach-polarity reputation trait system:** 17 traits, tally accumulation, 3-layer polarity, encounter gating + scoring, phase 6.64. 16 tests.
- **TB-031 Culture Seeding Phase 1:** Territory-aware culture placement via province system. Homeland/border/diaspora mechanics.
- **Location variety + anomaly discovery system:** 29 location subtypes, shimmer visuals, 10 rare resources, 10 discovery encounters, full engine wiring.
- TB-086/087/088: Mutation observability, per-session SimulationRuntime, distance matrix cap 500→1200. 9 tests.

## Active Backlog Ideas

- TB-071 Economy Second Pass (brainstormed, needs design)
- TB-069 Location NPCs (idea)
- TB-051 Monster Encounters residual scope (roaming, threat scaling — core delivered in M2.5)
- TB-037 Onboarding (idea)
- TB-031/032 Culture & Agent Seeding (preliminary designs exist)
- TB-017 Chain Reactions (idea, blocked on TB-045 graph ops — now wiring)
- TB-018 Cosmological Manipulation (idea)

## Full Backlog
See: `.planning/BACKLOG.md`

## Completed Work
See: `Docs/project-history.md`
