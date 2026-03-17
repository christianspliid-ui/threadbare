# Project Status

> Updated 2026-03-17. Split from monolithic status file — see Docs/project-history.md for completed milestone archive.

## Current Focus
PROD-01 Vertical Slice Contract complete. Next milestone: **Playtest-Ready Polish** — 10 measurable success criteria defined in `Docs/plans/2026-03-16-prod-01-vertical-slice-contract.md`.

**Latest:** Tiered Backstory Generation Phase 5 complete (2026-03-17) — full UI layer for the backstory system. "Their Story" section added to AgentProfileModal: 4 stratum blocks (sphere-colored divider titles, ✦ New badge with 3 s fade, locked placeholders for unavailable tiers, auto-scroll to new strata on open). Backstory teaser in AgentInfoCard sidebar: first sentence of stratum 1, ✦ indicator if new, "Read more →" link. `readBackstoryTier` updated on worships edge when modal opens to clear New badges. `revelation` alert icon (📖) wired into AlertBar. 18,204 tests pass. Design doc: Docs/plans/2026-03-17-tiered-backstory-generation-design.md.

**Previous:** Gold Reach Phase 2 complete (2026-03-17) — trade route decay, conditional sublocation predicates, 7 Gold sublocation types (Market District, Mine, Harbor, Warehouse, Counting House, Smuggler's Den, Caravan Rest), 12 economic encounter templates. phaseTradeRouteDecay (6.62) and phaseSublocations (6.65) wired into orchestrator. TradeRouteDissolvedTrace added (TRACE_CATEGORIES: 13→14). 18,204 tests pass. Design doc: Docs/plans/2026-03-17-gold-reach-economic-systems-design.md.

**Previous:** Tiered Backstory Generation Phases 3-4 complete (2026-03-17) — generator function and tick-loop integration. Phase 3: `generateTieredBackstory(agentId, graph, seed, influenceTier, readBackstoryTier?)` runs all 10 resolvers, filters by stratum <= influenceTier, returns BackstoryStratumBlocks with titles "What They Say"/"What They Lived"/"What They Hide"/"What They Are" and isNew flags. Phase 4: `phaseInfluenceTierPromotion` (Phase 6.64) wired into orchestrator; emits `backstory_unlock` TickEvent per promoted agent. 17 new tests, 4614 total pass. Design doc: Docs/plans/2026-03-17-tiered-backstory-generation-design.md.

**Previous:** Tiered Backstory Generation Phases 1-2 complete (2026-03-17) — infrastructure + resolver layer for the tiered backstory system gated by Influence Tier (not Knowledge Level). Phase 1: BackstoryLayer/BackstoryResult/BackstoryStratum types, BACKSTORY_CONSTANTS, 'revelation' AlertIcon, readBackstoryTier on worships edge, backstory-content.ts (12 tables, 200+ Threadbare-tone prose templates). Phase 2: 10 backstory resolvers across 4 strata — all fail-soft, seeded PRNG, graph-walking. 139 new tests. Design doc: Docs/plans/2026-03-17-tiered-backstory-generation-design.md.

**Previous:** Intent visibility complete (2026-03-17) — agent ambitions surface in character sheet modal (Intent section between Nature and Prowess), AgentDetailPanel sidebar (above Character), and AgentInfoCard compact card (primary intent line). Notification tap-through: ambition events now carry actorId; clicking an alert/toast navigates to the agent. ambition_abandoned promoted to alert/dilemma. 5 new test files, 8764 total tests passing.

## Up Next
Triage candidate tasks from the PROD-01 contract against the 10 polish criteria. Then STRUCT-01 Repo Boundary Cleanup.

## Full Backlog
Notion: https://www.notion.so/Development-Backlog-3182b241dfb081b9af78c279eef405cf
Remediation plan: https://www.notion.so/2026-03-12-Remediation-Plan-Prioritized-Audit-Follow-up-3212b241dfb08136a6b6c58670a764b9

## Completed Work
See: Docs/project-history.md
