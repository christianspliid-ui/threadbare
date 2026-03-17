# Project Status

> Updated 2026-03-17. Split from monolithic status file — see Docs/project-history.md for completed milestone archive.

## Current Focus
PROD-01 Vertical Slice Contract complete. Next milestone: **Playtest-Ready Polish** — 10 measurable success criteria defined in `Docs/plans/2026-03-16-prod-01-vertical-slice-contract.md`.

**Latest:** Gold Reach Phase 3 complete (2026-03-17) — System 3: guild factions seeded at town+ settlements (guildSeeding.ts); guild type from dominant resource (ore→miners, timber→artisans, fish→traders, tie→PRNG, prosperity→bankers, fallback→merchants); Gold-heavy domain caps (60-80); axiological bias (greed+0.5, cunning+0.3, ambition+0.3; miners: tradition-0.4); Guild Hall sublocation on creation. System 2: 3 new Gold action templates (negotiate-agreement, tax-trade-route, break-agreement). System 4: 4 wealth-spending actions (hire-mercenaries, commission-assassination, buy-influence, fund-construction) with crossover tracing. 43 action templates total. 4604 tests pass. Design doc: Docs/plans/2026-03-17-gold-reach-economic-systems-design.md.

**Previous:** Gold Reach Phase 2 complete (2026-03-17) — trade route decay (routes lose volume when unused, edge removed at 0, emits `trade_route_dissolved` traces); conditional sublocation predicate evaluator fully implemented (prosperity, resource, coastal, guild wealth, trade route presence, OR support); 7 Gold sublocation types (Market District, Mine, Harbor, Warehouse, Counting House, Smuggler's Den, Caravan Rest) with spawn/dissolve hysteresis; 12 economic encounter templates across Gold sublocations; TradeRouteDissolvedTrace added (TRACE_CATEGORIES 13→14). 18,204 tests passing across 1,290 test files.

## Up Next
Triage candidate tasks from the PROD-01 contract against the 10 polish criteria. Then STRUCT-01 Repo Boundary Cleanup.

## Full Backlog
Notion: https://www.notion.so/Development-Backlog-3182b241dfb081b9af78c279eef405cf
Remediation plan: https://www.notion.so/2026-03-12-Remediation-Plan-Prioritized-Audit-Follow-up-3212b241dfb08136a6b6c58670a764b9

## Completed Work
See: Docs/project-history.md
