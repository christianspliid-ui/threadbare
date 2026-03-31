# Project Status

> Updated 2026-03-31.

## Current Focus

**v1.1 Low-Hanging Fruit Optimization** — Phases 19-22 in progress (separate agent). Determinism, wiring, performance, code hygiene.

**Culture Seeding Phase 1** (TB-031) — Territory-aware culture placement via province system. Shipped 2026-03-31.

## Milestone Status

- **v1.0 Foundation:** Shipped 2026-03-30 — Phases 1-18 + M2.5 (81 plans, 1533 commits)
- **v1.1 Optimization:** In progress — Phases 19-22 (determinism, wiring, performance, hygiene)
- **v1.2 Social Systems Expansion:** Designed — 5 expansions (taverns/parties, deep social scenes, agent initiatives, faction agency, information economy). Design doc: `Docs/plans/2026-03-31-social-systems-expansion-design.md`
- **Next after v1.2:** Economy second pass (TB-071), Agent seeding (TB-032), NPCs (TB-069)

## Recent Completions (2026-03-31)

- **Province/Domain rename + cultural vocabulary:** barony→Province, kingdom→Domain across entire codebase. Culture-specific province name vocabulary (chaos/order/light/darkness). Culture count scaled by map size (small=2, medium=3, large=4, epic=5). Fixed "Cult Hold"/"Cult Duchy" naming bug. 76 tests updated.
- **Generic Effect System:** 29 composable effect primitives, spell framework (cost/backlash/prerequisites), effect resolver with legacy fallback, effect tick engine (duration/cooldown/decay/stacking), aura proximity + reactive triggers, executors for teleport/spawn/dispel/terrain/compel/structures/rules/factions, scoped targeting (hex/radius/region/faction/biome/global). 5 spell templates, 3 god-tier artifacts, 10 terrain overlays. 52 tests, 18 CMS constants. Orchestrator phase 2a.4.
- **Phase 21-03 Vite manualChunks bundle split:** Main bundle reduced from 3,277 kB to 2,695 kB (-582 kB, -17.8%). Three new parallel-loadable data chunks.
- **Reach-polarity reputation trait system:** 17 traits, tally accumulation, 3-layer polarity, encounter gating + scoring, phase 6.64. 16 tests.
- **TB-031 Culture Seeding Phase 1:** Territory-aware culture placement via province system. Homeland/border/diaspora mechanics.
- **Location variety + anomaly discovery system:** 29 location subtypes, shimmer visuals, 10 rare resources, 10 discovery encounters, full engine wiring.
- TB-086/087/088: Mutation observability, per-session SimulationRuntime, distance matrix cap 500→1200. 9 tests.

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
