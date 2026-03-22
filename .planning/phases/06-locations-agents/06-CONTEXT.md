# Phase 6: Locations & Agents - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Settlements, POIs, and agents become visible on the Three.js hex map with faction colors, status indicators, and movement animation. This phase delivers:

1. **Location signifier rendering** — 17 SVG location icons (LIART-01 through LIART-17), name labels with white halo, capital red markers
2. **Location composition** — Icons placed via existing composition system slots, suppressing terrain signifiers (COMP-04 already built)
3. **Agent rendering** — Portrait thumbnails at hero-local zoom, colored faction dots at regional zoom, RING layout (COMP-05)
4. **Agent animation** — Bezier hop movement, movement trails, activity indicator icons, event indicator sprites

Fog of war, zoom LOD visibility matrix, and road network are Phase 7. Game system wiring (click events, encounters) is Phase 8.

</domain>

<decisions>
## Implementation Decisions

### Location icon art style
- Same hand-drawn silhouette treatment as terrain signifiers: black (#1a1a1a), sun-from-right shadow baked into SVG paths, multi-layer opacity depth, organic hand-drawn paths
- All 17 distinct icons per the LIART catalog — including broken variants for each ruin type (ruined_city, ruined_tower, ruined_village are distinct crumbled versions of their base icons, not a single generic ruins icon)
- One icon per location type (no variants — locations are specific places, not repeated terrain)
- Icon size scaled by importance: capital/city icons at ~80% hex size, town/castle at ~60%, hamlet/shrine/camp/other at ~40%

### Movement & animation
- Render-loop integrated animation — animation state managed in the Three.js render loop, sprite positions interpolated each frame (no external tween library)
- Activity indicators rendered as SVG silhouette sprites (same pipeline as location icons) — boot, swords, hourglass, coin, hammer, bandage positioned below agent portrait
- Event indicators as simple sprite with fade-in/out — static sprite appears when event starts, fades out when it ends. Divine intervention gets a brief flash. No continuous pulse animations.
- Movement trails included — port existing SVG MovementTrails logic to Three.js (thin faction-color line fading over ~2s behind moving agents)

### Agent rendering approach
- Claude's discretion for Three.js implementation details: portrait-as-texture approach, faction color ring rendering, zoom-tier switching logic
- Must follow the tiered rendering from design doc: portrait thumbnails at hero-local, colored dots at regional, hidden at continental/full-world (retinue-only at continental as tiny dots)
- Retinue agents distinguished by gold/white border (AGNT-05)
- Faction heraldic colors: saturated/bright, distinct from terrain palette (red, blue, purple, magenta, cyan, orange per AGNT-04)

### Label readability
- Claude's discretion for Three.js text rendering approach
- Must follow design doc: black text with white halo, font size scales by importance (capital > city > town > hamlet)
- Labels visible at hero-local and regional zoom per design doc rules

### Claude's Discretion
- Three.js text rendering approach for location labels (HTML overlay vs canvas texture vs SDF text)
- Portrait-to-texture pipeline for agent sprites
- RING layout geometry and agent distribution math (COMP-05)
- Performance optimization for many agents on screen
- Exact zoom thresholds for agent rendering tier switching
- How to handle agent count overflow (>4 per hex → count badge)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Hex map design (master reference)
- `Design/brainstorm-hexmap-v2.md` — Layer 11 (Location Signifiers: icon catalog, label rules, special markers), Layer 13 (Agents and Icons: tiered rendering, sprite anatomy, faction identification, RING layout, movement animation, activity/event indicators), Hex Content Composition System (slot assignment, suppression, RING layout)

### Requirements
- `.planning/REQUIREMENTS.md` — LOCI-01 through LOCI-05 (location rendering), LIART-01 through LIART-17 (location icon SVGs), COMP-05 (agent RING layout), AGNT-01 through AGNT-08 (agent rendering and animation)

### Art style references
- `Design/deepforest-hand-drawn.svg` — STYLE STANDARD for silhouette treatment
- `Design/hills-hand-drawn.svg` — STYLE STANDARD for multi-layer opacity
- `Design/mountain-hand-drawn.svg` — STYLE STANDARD for baked shadow
- `Design/steppes-hand-drawn.svg` — STYLE STANDARD for organic paths
- `Design/hex-icon-preview.html` — Existing SVG symbol library with location icons (need rework for sun-from-right treatment)

### Prior phase decisions
- `.planning/phases/05-hex-composition-landscape-signifiers/05-CONTEXT.md` — Signifier color treatment (#1a1a1a black, multi-layer opacity), sun-from-right convention, art style standard, rendering pipeline (SVG→CanvasTexture→Sprite)
- `.planning/phases/01-renderer-foundation/01-CONTEXT.md` — 13-layer render order (LOCATIONS=8, AGENTS=9, EVENTS=10), zoom tier thresholds

### Existing agent rendering (SVG version, port reference)
- `src/components/HexMap/AgentDots.tsx` — SVG bezier hop animation, RING layout, portrait rendering, faction colors
- `src/components/HexMap/MovementTrails.tsx` — SVG movement trail rendering
- `src/data/agent-visual-content.ts` — Agent visual constants (dot radius, ring radius, domain colors, animation durations)
- `src/data/portrait-assets.ts` — Portrait URL lookup

### Composition system (already built)
- `src/components/HexMapV2/signifiers/compositionTypes.ts` — HexVisualManifest, CompositionResult, SuppressRule interfaces
- `src/components/HexMapV2/signifiers/compositionResolver.ts` — Slot assignment and suppression logic

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `compositionTypes.ts` + `compositionResolver.ts`: Slot-based composition system already built (Phase 5). Location icons use CENTER slot with 'always' suppression of terrain-signifiers. Agent RING layout (COMP-05) needs to be added.
- `SignifierMesh.ts`: SVG→CanvasTexture→Sprite pipeline for terrain signifiers. Same pattern can be extended for location icons (render order 8 vs signifiers at 7).
- `signifierTextures.ts` + `signifierRegistry.ts`: Texture cache and registry pattern. Location icons need their own registry and texture cache.
- `AgentDots.tsx` (old SVG map): Full bezier hop animation, RING layout math, portrait rendering, faction dot coloring. Port logic to Three.js sprites.
- `MovementTrails.tsx` (old SVG map): Trail rendering with fade. Port to Three.js line segments.
- `agent-visual-content.ts`: All tunable constants already defined (AGENT_DOT_RADIUS, AGENT_RING_RADIUS, DOMAIN_COLORS, animation durations).
- `RenderLayers.ts`: LOCATIONS=8, AGENTS=9, EVENTS=10 render order slots already reserved.

### Established Patterns
- SVG→CanvasTexture→Sprite for terrain signifiers (Phase 5) — extend for location icons
- InstancedMesh for hex fills (Phase 1) — agents are NOT instanced (too few, need individual animation)
- d3-zoom with syncCameraToZoom (Phase 1) — zoom level drives visibility
- Seeded PRNG for deterministic placement (mulberry32)
- HTML overlay for labels (RegionLabelOverlay pattern from Phase 4)

### Integration Points
- Location icons render at RENDER_ORDER.LOCATIONS (8), above signifiers (7), below agents (9)
- Agent sprites render at RENDER_ORDER.AGENTS (9), below events (10)
- Event indicators render at RENDER_ORDER.EVENTS (10)
- COMP-05 (RING layout) extends the existing composition resolver
- Location labels may share or parallel the RegionLabelOverlay HTML overlay system from Phase 4

</code_context>

<specifics>
## Specific Ideas

- Location icons must follow the exact same style as the 4 hand-drawn SVG references (deepforest, hills, mountain, steppes) — sun-from-right shadow, multi-layer opacity, organic irregular paths
- Ruin variants should look like broken/crumbled versions of their intact counterparts (not generic rubble)
- Importance-based sizing (capital ~80%, hamlet ~40%) gives immediate visual hierarchy without needing labels

</specifics>

<deferred>
## Deferred Ideas

- **Palette contrast tuning** — Terrain colors (forested_hills, boreal_forest, temperate_forest) are too visually similar at zoomed-out view. Needs a palette contrast pass. Not Phase 6 scope — log in impediments/backlog.

</deferred>

---

*Phase: 06-locations-agents*
*Context gathered: 2026-03-22*
