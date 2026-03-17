# Project Status

> Updated 2026-03-17. Split from monolithic status file — see Docs/project-history.md for completed milestone archive.

## Current Focus
PROD-01 Vertical Slice Contract complete. Next milestone: **Playtest-Ready Polish** — 10 measurable success criteria defined in `Docs/plans/2026-03-16-prod-01-vertical-slice-contract.md`.

**Latest:** Tiered Backstory Generation Phases 1-2 complete (2026-03-17) — infrastructure + resolver layer for the tiered backstory system gated by Influence Tier (not Knowledge Level). Phase 1: BackstoryLayer/BackstoryResult/BackstoryStratum types, BACKSTORY_CONSTANTS, 'revelation' AlertIcon, readBackstoryTier on worships edge, backstory-content.ts (12 tables, 200+ Threadbare-tone prose templates). Phase 2: 10 backstory resolvers across 4 strata (surfaceOriginResolver, surfaceSphereResolver, bondHistoryResolver, traitOriginResolver, turningPointResolver, contradictionResolver, fearResolver, hiddenMotiveResolver, storyArcResolver, divineTransformationResolver) — all fail-soft, seeded PRNG, graph-walking. 139 new tests, 4597 total pass. Design doc: Docs/plans/2026-03-17-tiered-backstory-generation-design.md.

**Previous:** Intent visibility complete (2026-03-17) — agent ambitions surface in character sheet modal (Intent section between Nature and Prowess), AgentDetailPanel sidebar (above Character), and AgentInfoCard compact card (primary intent line). Notification tap-through: ambition events now carry actorId; clicking an alert/toast navigates to the agent. ambition_abandoned promoted to alert/dilemma. 5 new test files, 8764 total tests passing.

## Up Next
Triage candidate tasks from the PROD-01 contract against the 10 polish criteria. Then STRUCT-01 Repo Boundary Cleanup.

## Full Backlog
Notion: https://www.notion.so/Development-Backlog-3182b241dfb081b9af78c279eef405cf
Remediation plan: https://www.notion.so/2026-03-12-Remediation-Plan-Prioritized-Audit-Follow-up-3212b241dfb08136a6b6c58670a764b9

## Completed Work
See: Docs/project-history.md
