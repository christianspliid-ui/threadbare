# Phase 7: Fog, Zoom & Grid - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Fog of war culling (per-hex state-driven render filtering), 4-tier zoom LOD with a unified visibility matrix controlling which layers appear at each tier, and road network rendering connecting settlements. This phase does NOT wire the map into GameView (Phase 8) or change game state systems.

</domain>

<decisions>
## Implementation Decisions

### Fog reveal behavior
- Instant flip — hex immediately shows terrain when agent LOS reaches it. No fade animation, no radial wave.
- Remembered hexes (explored, no agent nearby) render at full color with all static layers — terrain, signifiers, locations, labels — but NO agents or events. No desaturation, no sepia tint.
- Hard boundary between explored and unexplored — no soft fringe, no gradient. Matches the hard-edge terrain style (TERR-04).
- Fog stays off by default (`?fog` enables). No change to the default in this phase — Phase 8 integration decides final default.
- Unexplored hexes render as solid dark fill (`#0a0a0c` from V1) with NO terrain detail leaking through.

### Zoom tier transitions
- Claude's discretion on smooth vs discrete tier transitions. Requirements say 4 tiers (hero-local ~300px/hex, regional ~100px, continental ~30px, full-world ~10px) with ~20% overlap fade range.
- Visibility matrix controls which render layers appear at each tier. Elements below threshold are not rendered (performance skip, not just transparency).

### Road network
- Claude's discretion on road styling. Requirements say solid for major roads, dotted for trails, bridge icons where roads cross rivers.
- Road generation needs pathfinding between settlements — no existing road generation code, but `hexMovementPath.ts` has path infrastructure.

### Follow mode
- Claude's discretion on follow-mode UX. Requirements say camera auto-follows selected agent during movement, toggleable. `centerOn` API already exists.

### Claude's Discretion
- Zoom tier transition feel (smooth continuous vs snap-to-tier)
- Fade timing and easing for layer visibility changes
- Road rendering style details (color, width, dash patterns)
- Follow mode break-out gesture (click to stop? toggle button?)
- Bridge icon design
- Unexplored hex fill implementation (InstancedMesh color override vs overlay mesh)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Fog of war
- `src/types/visibility.ts` — HexVisibilityState (`unexplored | remembered | visible`), VisibilityMap, LOSSource, sight range constants
- `src/components/Game/GameView.tsx` — V1 fog toggle implementation, `effectiveVisibilityMap` proxy pattern, `?fog` URL param
- `src/components/HexMap/HexTile.tsx` — V1 per-hex fog rendering (UNEXPLORED_HEX_COLOR `#0a0a0c`, StaleSnapshot display)

### Zoom and camera
- `src/components/HexMapV2/HexMapV2.tsx` — d3-zoom setup, `zoomLevel` state, `centerOn` API, signifier/location visibility thresholds
- `src/components/HexMapV2/scene/RenderLayers.ts` — 13-layer render order (ROADS=5, FOG=12)

### Road network
- `src/engine/hexMovementPath.ts` — Path infrastructure between hexes
- `src/components/HexMapV2/scene/RiverMesh.ts` — Line rendering pattern (can inform road mesh approach)

### Agent rendering (affected by fog)
- `src/components/HexMapV2/scene/AgentSpriteMesh.ts` — Agent sprite rendering that fog must filter
- `src/components/HexMapV2/agents/agentAnimationState.ts` — Animation state that follow-mode interacts with

### Design reference
- `Design/brainstorm-hexmap-v2.md` — 15-layer design, fog and zoom tier specifications
- `.planning/REQUIREMENTS.md` §FOG, §ZOOM, §GRID — Full requirement definitions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `VisibilityMap` + `HexVisibility` types already define the 3-state fog model with stale snapshots
- `RENDER_ORDER` already reserves ROADS (5) and FOG (12) slots
- d3-zoom already tracks continuous scale level; signifiers and locations already toggle at thresholds
- `centerOn()` API exists for camera jumps — extend for follow mode
- `RiverMesh.ts` pattern (line geometry from hex-to-hex paths) directly applicable to road rendering
- V1 `GameView.tsx` has working `effectiveVisibilityMap` proxy pattern for fog-disabled mode

### Established Patterns
- InstancedMesh with per-instance color for hex fills — fog can override color per instance
- Scene group visibility toggling (signifierGroup.visible, locationGroup.visible) — extend to zoom matrix
- `HEX_CONSTANTS.HEX_SIZE` for consistent coordinate math across all meshes
- TDD (RED→GREEN) pattern established in all prior phases

### Integration Points
- `HexMapV2.tsx` receives `visibilityMap` or equivalent fog state as prop
- Scene setup function in `HexSceneSetup.ts` creates all mesh groups — fog mesh and road mesh added here
- d3-zoom transform callback is where zoom tier changes are detected and layer visibility updated
- Agent sprite mesh needs fog-aware filtering (skip sprites on non-visible hexes)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. User chose recommended defaults for all fog decisions:
- Instant reveal (no animation)
- Full-color remembered hexes (no visual dimming)
- Hard fog boundary (matching hard-edge terrain style)
- Fog off by default (keep current `?fog` param behavior)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-fog-zoom-grid*
*Context gathered: 2026-03-22*
