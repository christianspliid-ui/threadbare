# Phase 16: Expand Retinue Sidebar to Threads Area - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Transform the right sidebar's RetinuePanel from an agent-only list into a comprehensive **Threads panel** that shows every graph node the Ascendant has a thread edge to — agents, armies, factions, artifacts, locations, anything being invested in. Includes engine support to create thread edges to new node types via divine actions, a compact grouped sidebar layout, a repositioned quick detail view, and stub profile modals for each node type.

</domain>

<decisions>
## Implementation Decisions

### Thread creation scope
- **Engine + display** — this phase adds both engine support for creating thread edges to new node types AND the UI to display them
- **Threadable node types:** actors (existing), locations, factions, artifacts, armies — all selected
- **Creation mechanism:** Action-driven — player uses divine actions (ActionDrawer cards) targeting a location/faction/artifact/army to establish a thread. Fits existing Generalized Action Targeting system
- **Edge properties:** Reuse the same `ThreadEdgeProperties` schema for all thread types (tier, devotion, courtPosition, attentionMode). courtPosition and attentionMode may be null/unused for non-agent types. Uniform model
- **Deferred:** Divine court expansion to cover all thread types — future phase. For now, courtPosition semantics only fully apply to agents

### Node type grouping & layout
- **Grouped sections** — collapsible sections by node type: Agents, Locations, Factions, Artifacts, Armies. Each section has its own header and count
- **All entries compact** — every entry (agents included) becomes a compact row, roughly 25% of current agent card height. No portraits in the sidebar list. Portraits/detail show on click into detail view
- **Agent row format:** name (eye icon to zoom), location (eye icon to zoom), activity (clickable link). Tier indicated by colored left border stripe (existing pattern)
- **Non-agent row format:** name (eye icon to zoom to location), type-appropriate secondary info (e.g., faction territory count, army strength). Claude's discretion on exact per-type secondary line

### Quick detail view (repositioned)
- **Position:** Floats next to the right sidebar, top-right corner, under the top bar. Never overlaps the sidebar — appears to the LEFT of it
- **Scope:** Opens for ALL thread types, not just agents. Different info layout per node type
- **Content philosophy:** Decision-useful data only — what helps you choose which actions to play. Narrative info belongs in the full profile modal
- **Adaptive display:** Only show fields that are populated and actionable. Empty fields are hidden, not shown as "none"
- **Per-type decision data:**
  - **Agent:** domain capabilities, sphere alignment, thread tier, quintessence health, current activity/encounter
  - **Location:** sphere character, prosperity, agents present, controlling faction, active threats
  - **Faction:** sphere alignment, territory extent, threaded members within, relations to other threaded factions
  - **Army:** strength/composition, current location/heading, commander (is threaded?), faction
  - **Artifact:** bearer/location, properties, sphere resonance
- Replaces current AgentInfoCard overlay behavior (which currently replaces the sidebar content)

### Interaction on click
- **Click entry** → opens quick detail view next to sidebar. Does NOT center the map
- **Eye icon** → centers/zooms map to entity's hex location (same as current pattern)
- **"View Profile" link** in detail view → opens full modal (AgentProfileModal for agents, stub modals for other types)
- Stub profile modals created for each non-agent type: LocationProfileModal, FactionSheet, ArmySheet, ArtifactSheet — minimal shell with placeholder content, wired up for navigation. Content filled in future phases

### Claude's Discretion
- Exact compact row heights and spacing
- Section collapse/expand default states
- Detail view width and exact positioning math
- Non-agent row secondary info selection per type
- Animation/transition for detail view appearance
- Stub modal internal layout and placeholder content

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Thread system
- `src/types/influence.ts` — ThreadEdgeProperties, CourtPosition, InfluenceTier, AttentionMode definitions
- `src/types/graph.ts` — EdgeType 'thread', NodeType definitions (actor, location, artifact, artifact_legendary, resource)
- `src/engine/retinue.ts` — getRetinueAgents() — current thread→agent extraction logic, RetinueAgent interface
- `src/engine/graphQueries.ts` — getAscendantThreadEdges(), getAscendantForAgent() helper functions
- `src/engine/influence.ts` — Thread tier management, devotion mechanics

### Current UI
- `src/components/Game/RetinuePanel.tsx` — Current agent-only sidebar panel (being replaced/expanded)
- `src/components/Game/AgentInfoCard.tsx` — Current quick detail overlay (being repositioned)
- `src/components/Game/GameView.tsx:1200-1236` — Right sidebar rendering, RetinuePanel/AgentInfoCard conditional logic
- `src/components/Game/AgentProfileModal.tsx` — Full agent modal (pattern to follow for stub modals)

### Action system
- `src/engine/unifiedActionResolution.ts` — Action resolution pipeline (new thread-creation actions will plug in here)
- `src/data/actionTemplates.ts` — UNIFIED_ACTION_TEMPLATES array (new thread-creating action cards added here)

### Design system
- `src/data/uiColorPalette.ts` — TIER_COLORS, design tokens
- `src/components/shared/` — Reusable components (Tooltip, SectionHeading, IconButton, StepDots)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `RetinuePanel` component: Has the full agent card rendering with tier colors, encounter badges, attention mode — can be refactored into compact rows
- `AgentInfoCard` component: Current detail view with domain capabilities, sphere, faction, quintessence — reposition and generalize per node type
- `SectionHeading` shared component: Already supports count badge — use for group headers
- `IconButton` + eye icon pattern: Already used for map centering — reuse across all node types
- `Tooltip` shared component: For hover info on compact rows
- `TIER_COLORS` and `TIER_COLOR_DEFAULT`: Existing tier→color mapping, reuse for left border stripe

### Established Patterns
- `getRetinueAgents()` queries thread edges from graph, extracts properties, sorts by tier — extend to query ALL thread edges and categorize by target node type
- `ThreadEdgeProperties` stores tier, devotion, courtPosition, attentionMode — reuse for all node types
- GameView right sidebar uses conditional rendering: AgentInfoCard takes priority over RetinuePanel — restructure so detail view floats alongside instead of replacing
- Agent activity labels derived from `getAgentActivityLabel()` in agentActivity.ts — non-agent types need equivalent status derivation

### Integration Points
- `GameView.tsx` line ~1200: Right sidebar div — restructure to allow detail view floating next to it
- `getRetinueAgents()` in retinue.ts — generalize to `getThreadedNodes()` or similar, returning typed union of agent/location/faction/etc entries
- `UNIFIED_ACTION_TEMPLATES` — add new action templates for thread-creation targeting locations/factions/artifacts/armies
- `unifiedActionResolution.ts` — wire up thread-creation action effects (addEdge with type 'thread')

</code_context>

<specifics>
## Specific Ideas

- Current agent cards are too tall — new compact rows should be roughly 25% the height
- Detail view must never overlap the sidebar — positioned to its left, anchored to top-right under the top bar
- Agent compact row: name (eye icon), location (eye icon), activity (link) — three pieces of info per row
- The detail view is about making decisions, not reading lore — "what actions should I play?" not "what's the backstory?"
- Don't show useless/empty information — adaptive display that hides unpopulated fields

</specifics>

<deferred>
## Deferred Ideas

- **Divine court expansion** — reiterate the court system to cover all thread types (not just agents with courtPosition). Noted by user as a future phase
- **Full profile modals for non-agent types** — this phase creates stub shells; content-rich modals (FactionSheet, LocationProfile, etc.) are separate phases
- **Automatic thread formation** — threads forming automatically from agent presence/investment patterns. This phase is action-driven only

</deferred>

---

*Phase: 16-expand-retinue-sidebar-threads-area*
*Context gathered: 2026-03-30*
