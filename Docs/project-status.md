# Project Status

> Updated 2026-04-06.

## Current Focus

**Three-Tier Attention Model — Engine Foundation Shipped.** Background/shaping/story_beat encounter classification with full pipeline: tier resolution at encounter creation, effectiveTier-driven notification routing, digest buffer for background encounters, curator scoring (7 weighted factors), pacing governor for story beats, attention pool (regen/spend/visual states), dormant court position, 5 CLI debug commands, 42 tunable constants. ~500 templates classified. Code review fixes applied (phase ordering, notification routing, pacing wiring). **Next:** Phase 6 UI (thread tug visuals, story beat modal, Read the Threads panel, ambient activity icons, agent character sheet).

Design: `Docs/plans/2026-04-05-attention-tier-model-design.md`. Plan: `Docs/plans/2026-04-05-attention-tier-implementation-plan.md`.

## Milestone Status

- **v1.0 Foundation:** Shipped 2026-03-30 — Phases 1-18 + M2.5 (81 plans, 1533 commits)
- **v1.1 Optimization:** In progress — Phases 19-22 (determinism, wiring, performance, hygiene)
- **v1.2 Social Systems Expansion:** Designed — 5 expansions. Design doc: `Docs/plans/2026-03-31-social-systems-expansion-design.md`
- **Agent Success Redesign:** Phase 1 ✅, Phase 2 ✅, Phase 3 ✅, Phase 4 ✅ corrected (2026-04-03)
- **Next:** Phase 5 (encounter migration and early-game retune), or v1.2 Social Systems

## Recent Completions (2026-04-06)

- **Three-Tier Attention Model — Engine Foundation:**
  - 8 new engine modules, 4 new type files, ~500 templates classified
  - Tier resolution (resolveEffectiveTier matrix), mid-encounter promotion, notable detection
  - Digest buffer, attention pool, curator (7-factor scoring), pacing governor (priority queue)
  - phaseAttention wired into orchestrator, effectiveTier routing in notifications, dormant handling
  - Code review: all P1/P2/P3 findings fixed (phase ordering, notification routing, pacing wiring, rarity mapping, tug pipeline, trace types)
  - 93+ new tests (unit) + integration tests

- **Ascendant Remembrance Flow V1:**
  - Narrative creation: Stirring (abstract images) → Origin (mortal memory + name) → Drive (obsession) → Transformation (hunger + court + sphere reveal) → Reveal (identity + divine name)
  - Filtering funnel engine with seeded PRNG, cosmology derivation, personality biasing
  - 6 new components, 3 data files, 1 engine module, 18 tests
  - Old cosmology-slider flow preserved as "Advanced World Setup"

## Previous Completions (2026-04-05)

- **Effect Primitive Architecture — Phase 5:** All tick handlers + transform + modify_rules wired. See project-history.md.
- **Coat of Arms & Icon System:** Procedural SVG heraldry, SphereIcon, ReachIcon, 82 tests. See project-history.md.

## Earlier (see project-history.md)

TB-104 Content Primitives, Agent Success Redesign Phases 2-4, Balance-Eval Phase 1, Coat of Arms system, Effect Primitives — all in `Docs/project-history.md`.

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
