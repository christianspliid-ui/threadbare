# Phase 1: Renderer Foundation - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Three.js orthographic renderer displays a 200x300 hex grid (60K hexes) at 60fps with correct Tait-derived terrain colors, thin grid lines, and smooth camera controls (pan, zoom, jump-to). Hex click/hover events bridge to React. Tooltips show hex info. This phase establishes the rendering scaffold that all subsequent phases build on.

</domain>

<decisions>
## Implementation Decisions

### Development workflow
- New renderer lives at `?view=hexv2` as a separate route alongside the existing SVG map
- Uses real game state (same worldgen seed, agents, locations) — not synthetic test data
- Full game chrome from start (topbar, sidebar panels, hex chronicle) — not bare canvas
- Compare by switching between `?view=game` (SVG) and `?view=hexv2` (Three.js) via URL
- No split-screen comparison tool needed
- Phase 8 swaps the Three.js map into `?view=game` and removes the old SVG map

### Camera & interaction
- d3-zoom drives the Three.js orthographic camera (familiar gesture handling, proven pinch-to-zoom)
- Free continuous zoom (no snapping to tier centers) — the 4 tiers are LOD thresholds only
- Click to select hex (same as current behavior) — no double-click zoom
- Drag-only panning, no edge-of-screen pan (avoids conflict with sidebar panels)
- Jump-to: smooth fly-to animation (~500ms) when clicking notifications/agents in sidebar
- Zoom speed: Claude's discretion — tune to feel natural across the 30x zoom range (hero-local ~300px to full-world ~10px per hex)

### Hex grid appearance
- Background color: #0a0a0c (same near-black as current, Threadbare dark aesthetic)
- Grid lines visible from Phase 1 — thin lines at ~12% opacity black on hex edges
- Full Tait palette from day one (all 27 terrain type colors from Design/hex-terrain-palette-v2.html)
- Flat-top hex orientation (same as current SVG map, matches hexMath.ts)
- Selected hex: bright white or gold outline ring (2-3px). Hovered hex: subtler highlight.

### Three.js + React integration
- Raw canvas ref in React component — direct Three.js, no React Three Fiber (per CLAUDE.md constraint)
- Event bridge: raycasting on click/hover → callback props (onHexClick, onHexHover) — Claude's discretion on implementation
- HexMapV2 component exposes same interface as current HexMap (HexMapProps + HexMapHandle) for drop-in swap in Phase 8

### Claude's Discretion
- Zoom speed tuning across 30x range
- Three.js scene setup details (renderer config, pixel ratio, resize handling)
- Event bridge implementation (raycasting approach)
- Exact hover highlight treatment (color, opacity)
- InstancedMesh buffer setup and update strategy

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design specification
- `Design/brainstorm-hexmap-v2.md` — Layer 1 (Core Rendering Technology), Layer 2 (Zoom Contract), Layer 15 (Zoom-Level Rendering). Full 15-layer hex map v2 design.
- `Design/hex-terrain-palette-v2.html` — Interactive palette reference with all 27 terrain type colors + 5 water overlay colors. Contains the PALETTE JavaScript object.

### Existing hex map (to match interface)
- `src/components/HexMap/HexMap.tsx` — Current SVG hex map. HexMapProps interface and HexMapHandle ref handle that V2 must match.
- `src/lib/hexMath.ts` — Hex coordinate math (offsetToCube, hexToPixel, hexNeighbors, hexDistance). Flat-top odd-q offset coordinates. Reuse in V2.

### Existing game layout (to embed within)
- `src/components/Game/GameView.tsx` — Game view layout with topbar, left panel, center map, right panel. V2 map slots into the center.

### Project constraints
- `CLAUDE.md` — Viewport contract (1920x1080, nothing scrolls), NFP priorities, rejected approaches (no R3F), definition of done.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/hexMath.ts`: All hex coordinate math (offset↔cube, pixel conversion, neighbors, distance, line-of-sight). Fully reusable — Three.js world coordinates will use the same hexToPixel mapping.
- `src/components/HexMap/HexMap.tsx`: d3-zoom setup pattern, HexMapProps interface, HexMapHandle ref pattern. Can port the zoom gesture handling.
- `src/engine/color.ts`: Current BIOME_COLORS — will be replaced by TERRAIN_PALETTE but useful as reference for the color record pattern.

### Established Patterns
- d3-zoom for map pan/zoom with React refs (current HexMap)
- forwardRef + useImperativeHandle for exposing centerOn() to parent
- Hex coordinate system: flat-top, odd-q offset, throughout entire engine
- State management: React state + props, no external state library

### Integration Points
- `GameView.tsx` renders `<HexMapComponent>` in the center panel — V2 needs to slot in here (or at ?view=hexv2 initially)
- Click events → `onHexClick` → triggers hex chronicle, location view, agent interaction in GameView
- `useAvatarData` hook provides avatar hex position for camera centering
- `VisibilityMap` type from `src/types/visibility.ts` — fog of war data structure

</code_context>

<specifics>
## Specific Ideas

- The map should feel like a bright window into the world contrasting with the dark UI chrome around it (Tait bright palette + Threadbare dark panels)
- Camera jump-to should be a smooth ~500ms fly-to animation, not an instant snap
- The ?view=hexv2 route should be fully functional with real game state from day one, not a stripped-down test harness

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-renderer-foundation*
*Context gathered: 2026-03-21*
