# Project Status

> Updated 2026-03-18. Split from monolithic status file — see Docs/project-history.md for completed milestone archive.

## Current Focus
**Agent Decision System & Connected Designs** (design complete, pending implementation). Five interconnected design docs + one UI spec produced 2026-03-18:

1. **Agent Decision & Encounter Awareness** (`Docs/plans/2026-03-18-agent-decision-and-encounter-awareness-design.md`) — Unified decision phase, per-reach awareness (primary+secondary), rank-gated faction intelligence, remote encounters, encounter cache with event-based invalidation, five-stage filter pipeline, value-per-tick scoring. Replaces P0 movement heuristic.
2. **Encounter Resolution & Divine Intervention** (`Docs/plans/2026-03-18-encounter-resolution-and-divine-intervention-design.md`) — Real modifier pipeline (sphere/equipment/terrain/traits/divine), significance-gated vignettes with divine attention actions (Attune/Scry/Focus), exponential essence cost with bond efficiency scaling, ascendant sphere lens prose, Meet The First integration.
3. **Tier Promotion & Capability Growth** (`Docs/plans/2026-03-18-tier-promotion-and-capability-growth-design.md`) — Encounter-driven trait accumulation, tier crossing narrative events + visible signifiers, growth-aware payoff estimation.
4. **Social Fabric & Faction Formation** (`Docs/plans/2026-03-18-social-fabric-and-faction-formation-design.md`) — Social encounter templates (CRUD applied to agents), graph-walked reputation (Shadow distortion + Heart resistance + faction rank credibility), trust as separate edge property, faction formation as agent-initiated encounter, social awareness with bond-bypass.
5. **Social Fabric Visibility Spec** (`Docs/plans/2026-03-18-social-fabric-visibility-spec.md`) — Player layer (knowledge-gated relationships, chronicle social events, 8 social notification types, map faction presence) + Dev layer (relationship graph, reputation walk inspector, decision breakdown, faction inspector, 5 map overlays, constants tuning panel).

**Phase 0 prerequisites:** ✅ Complete (2026-03-18) — step duration backfill (220 steps), EncounterStep.duration/EncounterTemplate.remoteAttempt/EncounterProgress.occupiedUntilTick types, SPHERE_OPPOSITIONS lookup, RelatesToEdgeProperties with trust, MemberOfEdgeProperties with rank/joinedTick, faction reachPreferences, findAllPaths graph utility.

**Remaining implementation prerequisites:**
- ~~Axiological vocabulary alignment~~ — ✅ Done
- Attachment `reachBonus` and trait `resolutionBonus` backfill (Priority: Medium)
- 14 social encounter templates authoring (Priority: High — blocks Phase 4)
- Deprecated global `reputationScore` migration (Priority: Medium)

**Previous focus:** Hex Actions & Control Mechanic (design phase). Design docs: `Docs/plans/2026-03-17-generalized-action-targeting-design.md`, `Docs/plans/2026-03-17-world-state-and-hex-actions-design.md`, `brainstorm-hex-actions-and-control-mechanic.md`. Previous milestone: PROD-01 Vertical Slice Contract complete.

**Latest implementation:** Axiological Vocabulary Alignment (2026-03-18) — 93 files migrated to canonical 10 pairs, +1=virtue/-1=flaw convention, REACH_VALUE_PAIR mapping, 2 new pairs (frankness_propriety, stoicism_passion), 5,111 tests pass. Previous: Attachment Detail Card, UI Primitive Migration.

**Recent completions (2026-03-17):** Topbar Redesign (6 phases: hotkeys, time controls, essence chips, identity merge, icon-ified right group, polish), Hex Detail Chronicle Redesign (4-layer narrative, collapsible sidebar, inline cards), Resources System (8 types, terrain seeding, prose resolver), Region Labels, Agent Portraits, Intent Visibility, UI Primitives (7 components), Generalized Action Targeting, Mutable World State + Hex Actions, Gold Reach (Phases 1–4), Economic Traits/Chronicle/Wealth/Trade Route prose, Responsive Design, Backstory content enrichment, Organic Movement Trails. Full details: `Docs/project-history.md`.

## Up Next
Triage candidate tasks from the PROD-01 contract against the 10 polish criteria. Then STRUCT-01 Repo Boundary Cleanup.

## Full Backlog
Notion: https://www.notion.so/Development-Backlog-3182b241dfb081b9af78c279eef405cf
Remediation plan: https://www.notion.so/2026-03-12-Remediation-Plan-Prioritized-Audit-Follow-up-3212b241dfb08136a6b6c58670a764b9

## Completed Work
See: Docs/project-history.md
