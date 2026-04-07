---
name: hexmap-layers
description: >
  Feature-level reference for building, modifying, testing, and debugging
  individual visual layers in HexMapV2. Covers directory structure, signifier
  system, agent rendering, fog-of-war, testing strategy, visual verification,
  debugging toolkit, and integration points. Load alongside hexmap-core when
  doing hands-on layer work. Triggers on "signifier", "terrain art",
  "agent sprite", "portrait", "fog of war", "hex test", "WebGL debug",
  "visual verification", "hex click", "hex hover", "hex tooltip",
  "movement trail", "location icon", "border mesh", "river mesh",
  "road mesh", "label overlay".
---

# HexMap Layers — Visual Layer Reference

Feature-level guide for working on individual visual layers in HexMapV2. Load this alongside `hexmap-core` (which covers architecture, coordinates, render layers, zoom, and color system).

---

## 1. Directory Structure

Read **`directory-structure.md`** (in this skill directory) for the complete module listing — all files in `src/components/HexMapV2/` by subdirectory, test file locations, and related files outside the HexMapV2 folder.

Key entry points:

| File | Role |
|------|------|
| `src/components/HexMapV2/HexMapV2.tsx` | Main component — scene setup, d3-zoom, render loop, layer orchestration |
| `src/components/HexMapV2/HexV2View.tsx` | Standalone debug view (seed 42, no game state) |
| `src/components/Game/GameView.tsx` | Primary game view — imports HexMapV2 with full game chrome |

---

## 2. Signifier System (Terrain Art)

### How It Works

Each land hex gets one terrain signifier sprite — a multi-layer SVG composition rendered to a CanvasTexture.

### Registry (`signifierRegistry.ts`)

- Maps TerrainType → `SignifierVariant[]` (29 direct entries + 6 fallback mappings = all 34 land types covered)
- Variants have SVG path data, layer definitions, per-path opacity

### Deterministic Selection

Per-hex parameters are seeded by hex coordinates (via `mulberry32` PRNG):
- **Variant**: hash of `(col, row)` → consistent for same seed
- **Jitter**: ±10% of hex size (disabled for hand-drawn types)
- **Rotation**: Currently locked at 0 (upright)

### Adding New Signifier Art

1. Create SVG path data (hand-drawn or generated) in a `*PathData.ts` file
2. Register variants in `signifierRegistry.ts` with terrain type mapping
3. Define layer composition (fills, opacities) in the variant definition
4. Test: `signifierRegistry.test.ts` for coverage, visual check via Chrome

---

## 3. Agent Rendering

### 3-Tier Sprite System

| Zoom Tier | Agent Display | Visual |
|-----------|--------------|--------|
| hero-local (k >= 15) | Portrait thumbnails | Circular crops with faction heraldic ring + retinue marker |
| regional (k >= 5) | Faction dots | Colored circles |
| continental (k >= 1.5) | Retinue dots | Tiny dots |

### Multi-Agent Layout

Multiple agents on the same hex use **RING layout** (from `src/lib/movementPath.ts`). Agents sorted by ID for deterministic slot assignment.

### Portrait Textures

Built from agent portrait images via CanvasTexture. `onerror` fallback renders a faction-colored placeholder. The `Image` global is not available in jsdom — tests must use `vi.stubGlobal('Image', ...)` mock.

---

## 4. Fog-of-War

### Three Visibility States

| State | Hex Fill | Details (signifiers, agents, events) |
|-------|----------|------|
| `unexplored` | Dark fill | Hidden |
| `remembered` | Terrain visible (dimmed) | Signifiers visible, no agents/events |
| `visible` | Full brightness | Everything visible |

### Implementation

- `computeVisibilityFromSources()`: Computes LOS range from agent positions
- Per-frame color override on InstancedMesh land/water colors
- Enabled via `?fog` URL parameter (off by default)

---

## 5. Testing Strategy

### Test Environment: Vitest + jsdom

Tests run in **jsdom** — no real WebGL context. This means:
- Three.js objects can be instantiated and inspected (geometry, materials, positions)
- No actual rendering or pixel output
- Canvas operations (texture building) need mocking for browser-only APIs

### What to Test for Each Scene Module

| Aspect | How to Test | Example |
|--------|------------|---------|
| Mesh creation | Assert correct geometry/material types, instance counts | `expect(group.children[0]).toBeInstanceOf(THREE.InstancedMesh)` |
| Position accuracy | Check matrix transforms match `hexToPixel()` output | Extract position from `getMatrixAt()`, compare to expected |
| Color accuracy | Inspect material color or instance color buffer | `expect(color.getHexString()).toBe('3a7ab8')` |
| Fail-soft behavior | Pass empty/null/undefined inputs, assert no throws | `expect(() => createMesh([])).not.toThrow()` |
| Zoom visibility | Call `getZoomTier(k)` and check matrix lookup | `expect(matrix.signifiers['continental']).toBe(false)` |
| Determinism | Same seed + input → same output | Two calls with seed 42 produce identical results |

### Common jsdom Gotchas

1. **`Image` global missing**: Use `vi.stubGlobal('Image', class { ... })` — trigger `onerror` via microtask on `src` setter
2. **No `OffscreenCanvas`**: Three.js texture builders that use OffscreenCanvas need stubs
3. **No `requestAnimationFrame`**: Already polyfilled by vitest/jsdom, but be aware for timing tests
4. **Canvas 2D context**: jsdom provides a limited `getContext('2d')` — drawing operations are no-ops but don't throw

### Test File Locations

All tests live alongside their source in `__tests__/` directories:
```
scene/__tests__/          # ~12 test files for mesh factories
camera/__tests__/         # D3ZoomCamera.test.ts
interaction/__tests__/    # HexRaycaster.test.ts
palette/__tests__/        # terrainPalette.test.ts, waterPalette.test.ts
signifiers/__tests__/     # signifierRegistry.test.ts, compositionResolver.test.ts
agents/__tests__/         # agentSpriteTypes, agentAnimationState, agentPortraitTextures
locations/__tests__/      # locationIconRegistry.test.ts
overlay/__tests__/        # labelCollision.test.ts, LocationLabelOverlay.test.ts
```

### Running Tests

```bash
npm test                           # All tests
npm test -- --testPathPattern HexMap  # HexMapV2 tests only
npm run test:watch                  # Watch mode
```

---

## 6. Visual Verification (Critical)

### Playwright/Preview Tools CANNOT See WebGL

Playwright `preview_snapshot` and `preview_inspect` see only a blank `<canvas>` element — they cannot read WebGL canvas content. Use this two-tier approach:

| What to Verify | Tool |
|---------------|------|
| Console errors, network requests, DOM UI | Playwright: `preview_console_logs`, `preview_network`, `preview_snapshot` |
| Actual rendered hex map visuals | **Codex in Chrome**: `tabs_context_mcp` → `navigate` to `localhost:5173/?view=game&seeded` → `computer` with `action: "screenshot"` or `action: "zoom"` |

### Dev URLs for Testing

| URL | Purpose |
|-----|---------|
| `?view=game&seeded` | **Primary.** Full game with HexMapV2, pre-seeded identity + The First agent. Use for all testing. |
| `?view=game&seeded&nofog` | Game view with fog-of-war disabled |
| `?view=game` | Quick-start without identity/First — only for testing MeetTheFirst flow or identity-less paths. |

### Screenshot Tips

- Always `preview_resize` to **1920x1080** before screenshots — default viewport varies
- `preview_screenshot` times out on WebGL content (headless compositing too slow) — use Codex in Chrome or Playwright MCP instead
- For detail inspection, use `action: "zoom"` with a region parameter in Codex in Chrome

---

## 7. Debugging Toolkit

### WebGL Diagnostics (In-App)

The debug panel exposes `getDiagnostics()` via the handle:
- FPS (60-frame rolling average)
- Draw calls, triangles, points, lines per frame
- GPU vendor/renderer identification
- Texture/geometry/program counts
- Context loss/restore events
- Scene object count

### Browser DevTools

- **Three.js Inspector** (Chrome extension): Inspect scene graph, materials, textures
- **Spector.js**: Capture and replay WebGL calls frame-by-frame
- **Performance tab**: Profile render loop, identify jank sources

### Common Debug Scenarios

| Symptom | Likely Cause | Where to Look |
|---------|-------------|---------------|
| Map appears blank (canvas exists) | Scene not initialized, camera at wrong position, or stencil misconfiguration | `HexSceneSetup.ts`, `D3ZoomCamera.ts` |
| All terrain same color | Tone mapping on, or opaque layer occluding HexFillMesh | Check `renderer.toneMapping`, check z-order of layers |
| Zoom doesn't converge on cursor | Using d3-zoom default wheel handler | `D3ZoomCamera.ts` — must use custom handler |
| Grid snaps to corner on resize | `resizeHexScene` touching camera frustum | Ensure resize only calls `renderer.setSize()`, then re-sync d3-zoom |
| Signifiers missing for terrain type | No registry entry or fallback mapping | `signifierRegistry.ts` — check coverage |
| Agents not visible | Wrong zoom tier, or visibility matrix off | `ZoomVisibilityMatrix.ts`, current `k` value |
| Labels overlapping | Collision detection not running or stale data | `labelCollision.ts`, check label update trigger |
| Context lost on low-end GPU | Too many textures or draw calls | `WebGLDiagnostics.ts` — check texture/geometry count |

---

## 8. Integration Points

### Data Flow: Engine → Renderer

```
World Generation (engine/)
  └── generateWorld(seed, cols, rows)
        ├── tiles: HexTile[]         → HexFillMesh, SignifierMesh
        ├── riverPaths: RiverPath[]  → RiverMesh
        ├── lakeIds: Int16Array      → CoastlineMesh, waterPalette
        ├── regionData: RegionData   → BorderMesh, RegionLabelOverlay
        └── locations: LocationNode[] → LocationIconMesh, LocationLabelOverlay

Game State (game loop)
  ├── agents: AgentRenderData[]      → AgentSpriteMesh
  ├── visibilityMap: VisibilityMap   → FogCulling
  └── hoveredHex / selectedHex       → HexTooltip, highlight effects
```

### Events Out: Renderer → Game

```
onHexClick(coord: HexCoord)   → Opens hex action drawer, selects hex
onHexHover(coord: HexCoord)   → Updates tooltip, highlight state
```
