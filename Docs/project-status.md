# Project Status

> Updated 2026-03-17. Split from monolithic status file — see Docs/project-history.md for completed milestone archive.

## Current Focus
PROD-01 Vertical Slice Contract complete. Next milestone: **Playtest-Ready Polish** — 10 measurable success criteria defined in `Docs/plans/2026-03-16-prod-01-vertical-slice-contract.md`.

**Latest:** Mutable World State + Hex Actions complete (2026-03-17) — Per-hex mutable state (`divineInfluence`, `corruption` 0.0–1.0 floats on `HexTile`). Three new tick phases: `phaseHexState` (applies `HexMutation[]` buffer, decays both fields, checks terrain-transformation thresholds — 11 corruption + 7 restoration rules); `phaseUnrest` (decays location unrest with prosperity damper); `phaseMagicalSaturation` (decays magical saturation). `hexActionBridge` routes resolved hex_COL_ROW target actions into `HexMutation[]`. Relative GraphOp delta syntax (`'+20'`, `'-5'`, `'+0.15'`) on `update_node`. 4 hex action templates (hex.bless_land, hex.corrupt_land, hex.survey, hex.seed_life). TRACE_CATEGORIES 16→19. 39 new tests. 4,941 tests pass. Design doc: `Docs/plans/2026-03-17-world-state-and-hex-actions-design.md`.

**Previous:** Wealth resolver complete (2026-03-17) — `wealthResolver` reads actor wealth property, maps to WealthTier, emits Threadbare-aesthetic prose fragments via WEALTH_PROSE table (3–4 fragments × 5 tiers: Magnate/Wealthy/Comfortable/Getting by/Destitute). New `'economic'` ProseCategory (PROSE_CATEGORIES 5→6) gives wealth its own composition slot. Priority 65 (after identity/culture, before faction/disposition). Fail-soft: missing wealth → skip. 4,651 tests pass.

**Previous:** Generalized Action Targeting Phases 1–5 complete (2026-03-17) — ActionDrawer is now target-agnostic. Any focused world node (hex, location, sublocation, artifact, legendary artifact) can surface a set of divine actions via the same drawer used for agent interventions. Core: `TargetContext` universal descriptor, `TargetCategory` union, 6-step filter cascade (`getTargetActionSlots`), `WheelSlot.type: 'target_action'`, `TargetActionFilterTrace`, 6 `targetContextBuilders` factories, `useTargetActions` hook. 11 new action templates across location/artifact/sublocation categories. `ActionDrawer` props generalized (`agentName→targetName`, `agentTier→targetLabel`). TRACE_CATEGORIES 15→16. Design doc: `Docs/plans/2026-03-17-generalized-action-targeting-design.md`.

**Previous:** UI Primitives library complete (2026-03-17) — 7 shared components built with 73 tests: SectionHeading, Button, IconButton, ListRow, Card, Modal, Dropdown. Full spec in `Docs/design-system/primitives.md`. `frontend-ui` skill updated. Ready for adoption across existing components.

**Previous:** Tiered Backstory Generation Phase 6 complete (2026-03-17) — content enrichment: expanded all 9 sparse tables from 2→3-4 entries per key, 127 new templates, total ~385. Tables expanded: SURFACE_ORIGIN_PROSE (19 archetypes → 3/key), SURFACE_SPHERE_PROSE (8 spheres → 4/key), BOND_HISTORY/NEGATIVE (8 bases → 4/key each), CONTRADICTION_PROSE (10 pairs → 3/key), FEAR_PROSE (20 keys → 3/key), HIDDEN_MOTIVE_PROSE (5 strategies → 4/key), STORY_ARC_PROSE (19 archetypes → 3/key), DECISIVE_NATURE_PROSE (flat → 5). All prose follows per-stratum voice: tavern gossip (Stratum 1), intimate biographer (Stratum 2), confessor/psychologist (Stratum 3), oracular thread-reader (Stratum 4). 4,614 tests pass. Tiered Backstory Generation system fully complete across all 6 phases.

**Previous:** Gold Reach Phase 4 complete (2026-03-17) — settlement promotion/demotion (hamlet↔town↔city via sustained prosperity, SettlementTierChangeTrace, chronicle events); `action.gold.establish-monopoly` (create, difficulty 0.65, minWealth=25, narrative-first prose); economic AI wealth gate (`minWealthRequired` on ActionTemplateData, `generateActionCandidates` filters by actor wealth — only wealthy agents can initiate expensive crossover actions). TRACE_CATEGORIES 14→15. 44 action templates. 4640 tests pass. Design doc: Docs/plans/2026-03-17-gold-reach-economic-systems-design.md.

**Previous:** Gold Reach Phase 3 complete (2026-03-17) — System 3: guild factions seeded at town+ settlements (guildSeeding.ts); guild type from dominant resource (ore→miners, timber→artisans, fish→traders, tie→PRNG, prosperity→bankers, fallback→merchants); Gold-heavy domain caps (60-80); axiological bias (greed+0.5, cunning+0.3, ambition+0.3; miners: tradition-0.4); Guild Hall sublocation on creation. System 2: 3 new Gold action templates (negotiate-agreement, tax-trade-route, break-agreement). System 4: 4 wealth-spending actions (hire-mercenaries, commission-assassination, buy-influence, fund-construction) with crossover tracing. 43 action templates total. 4604 tests pass. Design doc: Docs/plans/2026-03-17-gold-reach-economic-systems-design.md.

**Previous:** Tiered Backstory Generation Phase 5 complete (2026-03-17) — full UI layer for the backstory system. "Their Story" section added to AgentProfileModal: 4 stratum blocks (sphere-colored divider titles, ✦ New badge with 3 s fade, locked placeholders for unavailable tiers, auto-scroll to new strata on open). Backstory teaser in AgentInfoCard sidebar: first sentence of stratum 1, ✦ indicator if new, "Read more →" link. `readBackstoryTier` updated on worships edge when modal opens to clear New badges. `revelation` alert icon (📖) wired into AlertBar. 18,204 tests pass. Design doc: Docs/plans/2026-03-17-tiered-backstory-generation-design.md.

**Previous:** Intent visibility complete (2026-03-17) — agent ambitions surface in character sheet modal (Intent section between Nature and Prowess), AgentDetailPanel sidebar (above Character), and AgentInfoCard compact card (primary intent line). Notification tap-through: ambition events now carry actorId; clicking an alert/toast navigates to the agent. ambition_abandoned promoted to alert/dilemma. 5 new test files, 8764 total tests passing.

## Up Next
Triage candidate tasks from the PROD-01 contract against the 10 polish criteria. Then STRUCT-01 Repo Boundary Cleanup.

## Full Backlog
Notion: https://www.notion.so/Development-Backlog-3182b241dfb081b9af78c279eef405cf
Remediation plan: https://www.notion.so/2026-03-12-Remediation-Plan-Prioritized-Audit-Follow-up-3212b241dfb08136a6b6c58670a764b9

## Completed Work
See: Docs/project-history.md
