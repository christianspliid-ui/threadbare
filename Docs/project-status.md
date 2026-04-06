# Project Status

> Updated 2026-04-06.

## Current Focus

**Ascendant Remembrance Flow — V1 Shipped.** Replaced the 3-screen creation flow with a narrative remembrance experience. Players recover mortal memories (Stirring → Origin → Drive), then collide with divine power (Transformation → Reveal). Dual naming (mortal + divine). Cosmology derived from identity. Starter content: 4 stirring images, 6 origins, 6 drives, 4 hungers. Old flow available via "Advanced World Setup". Design: `Docs/plans/2026-04-06-ascendant-remembrance-flow-design.md`.

## Milestone Status

- **v1.0 Foundation:** Shipped 2026-03-30 — Phases 1-18 + M2.5 (81 plans, 1533 commits)
- **v1.1 Optimization:** In progress — Phases 19-22 (determinism, wiring, performance, hygiene)
- **v1.2 Social Systems Expansion:** Designed — 5 expansions. Design doc: `Docs/plans/2026-03-31-social-systems-expansion-design.md`
- **Agent Success Redesign:** Phase 1 ✅, Phase 2 ✅, Phase 3 ✅, Phase 4 ✅ corrected (2026-04-03)
- **Next:** Phase 5 (encounter migration and early-game retune), or v1.2 Social Systems

## Recent Completions (2026-04-06)

- **Ascendant Remembrance Flow V1:**
  - Narrative creation: Stirring (abstract images) → Origin (mortal memory + name) → Drive (obsession) → Transformation (hunger + court + sphere reveal) → Reveal (identity + divine name)
  - Filtering funnel engine with seeded PRNG, cosmology derivation, personality biasing
  - 6 new components, 3 data files, 1 engine module, 18 tests
  - Old cosmology-slider flow preserved as "Advanced World Setup"

## Previous Completions (2026-04-05)

- **Attention Tier Classification — Task 10:**
  - Added `intrinsicTier` field to every `UnifiedActionTemplate` and `EncounterTemplate` in data files and test factories
  - Classification rules: rarityTier 1→background, 2→shaping, 3/4→story_beat; CRUD override forces background on any single-step template
  - Fixed `unifiedToEncounterTemplate()` to pass through `intrinsicTier`, `reachPrimary`, `reachSecondary`, and `motivations`
  - Fixed `migrateActionTemplate()` and all 16 NPC action templates (added missing `rarityTier`/`intrinsicTier`)
  - 24 files changed; tsc clean, all modified-file tests pass

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
