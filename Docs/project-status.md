# Project Status

> Updated 2026-04-03.

## Current Focus

**Agent Success Redesign Phase 3** — Complete. Unified action outcome expansion shipped 2026-04-03. Rich 5-tier outcomes, push/resist quintessence spend, differentiated consequences proving slice.

## Milestone Status

- **v1.0 Foundation:** Shipped 2026-03-30 — Phases 1-18 + M2.5 (81 plans, 1533 commits)
- **v1.1 Optimization:** In progress — Phases 19-22 (determinism, wiring, performance, hygiene)
- **v1.2 Social Systems Expansion:** Designed — 5 expansions. Design doc: `Docs/plans/2026-03-31-social-systems-expansion-design.md`
- **Agent Success Redesign:** Phase 1 ✅, Phase 2 ✅, Phase 3 ✅
- **Next:** Phase 4 (agent decision and forecast rewrite), or v1.2 Social Systems

## Recent Completions (2026-04-03)

- **Agent Success Redesign Phase 3 — Unified Action Outcome Expansion:**
  - Expanded `StepOutcome` to 5 tiers: `critical_success | success | success_at_cost | failure | critical_failure`
  - Near-miss successes (margin ≤ 5) become `success_at_cost`; `critical_failure` always terminates action
  - `computeFinalActionOutcome`: failed-but-continued steps produce `success_at_cost` at action level
  - Created `outcomeConsequences.ts` proving slice with 3 action families (social, information, risky)
  - Wired push (Q spend for +0.10 modifier on risky actions) and resist (Q spend for 60% outcome downgrade on social actions)
  - New telemetry: `outcomeDistribution`, `actionOutcomeDistribution`, `quintessence_push/resist` events, `pushResist` in run summaries
  - 29 new Phase 3 tests, 0 regressions

## Recent Completions (2026-04-02)

- **Agent Success Redesign Phase 2:** Shared resolution service, quintessence current/max, doubles-based crits, encounter failure erosion, enriched telemetry. 169 tests.
- **Balance-Eval Phase 1:** Session-owned telemetry, summaries, evaluator, CLI runner. 79 tests.

## Recent Completions (2026-04-01)

- **NPC sublocation placement + HexChronicle filter + rarity visuals in LocationView:** Ambient NPCs now seed into role-appropriate sublocations (NPC_ROLE_SUBLOCATION_MAP, 21 roles). Souls Present in HexChronicle shows only direct-city agents. LocationView AgentRow and Inhabitants list now show 3px rarity-tier left border.
- **TB-100 Unified Rarity Model Phase E — Action template rarityTier:** Tagged all 200+ action templates with rarity tiers 1–4 (distribution ~60%/~30%/~8%/~2%, 2 Legendary max). Made rarityTier required on UnifiedActionTemplate. Threaded through WheelSlot and getTargetActionSlots. Wired RarityBadge into ActionCard (both hand and focused layouts), suppressed for tier 1. Tests: all templates valid, badge show/hide by tier.

## Recent Completions (2026-03-31)

- **Attachments tab in agent full profile:** Added dedicated Attachments tab to AgentProfileModal showing all four categories (possessions, conditions, powers, agreements). Fixes agreements being silently dropped (giftsAndBurdens was filtered to bestowed_power only) and attachments being invisible due to knowledge-gating in Prowess tab.


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
