---
phase: 06-locations-agents
plan: "03"
subsystem: hex-map-v2-agents
tags: [three-js, agents, sprites, textures, zoom-tiers, faction-colors, retinue]
dependency_graph:
  requires:
    - 05-hex-composition-landscape-signifiers (signifierTextures pattern)
    - src/lib/movementPath.ts (getRingSlotOffset)
    - src/data/agent-visual-content.ts (AGENT_RING_RADIUS, AGENT_TOKEN_RADIUS, etc.)
    - src/lib/hexMath.ts (hexToPixel)
    - src/components/HexMapV2/scene/RenderLayers.ts (RENDER_ORDER.AGENTS)
    - src/components/HexMapV2/scene/HexFillMesh.ts (HEX_CONSTANTS.HEX_SIZE)
  provides:
    - Agent rendering system with three zoom tiers
    - Faction dot and portrait texture builders
    - AgentSpriteGroup interface for scene integration
  affects:
    - HexSceneSetup (callers integrate portraitGroup, dotGroup, continentalGroup)
    - Zoom event handlers (call updateZoomVisibility)
tech_stack:
  added: []
  patterns:
    - TDD with jsdom canvas/THREE mocks
    - Factory function pattern (createAgentSpriteMesh) following SignifierMesh.ts convention
    - Texture cache pre-built at module load (no per-frame canvas ops)
    - Promise.allSettled for fail-soft async portrait loading
key_files:
  created:
    - src/components/HexMapV2/agents/agentSpriteTypes.ts
    - src/components/HexMapV2/agents/agentPortraitTextures.ts
    - src/components/HexMapV2/scene/AgentSpriteMesh.ts
    - src/components/HexMapV2/agents/__tests__/agentSpriteTypes.test.ts
    - src/components/HexMapV2/agents/__tests__/agentPortraitTextures.test.ts
    - src/components/HexMapV2/scene/__tests__/AgentSpriteMesh.test.ts
  modified: []
decisions:
  - Texture caches (dotTextureCache, retinueDotTextureCache) pre-built at module load for performance
  - Portrait sprites initially use faction dot texture as placeholder; loadAgentPortraits upgrades async
  - Retinue agents have both continental and dot/portrait sprites; non-retinue skip continental
  - RING layout uses getRingSlotOffset from movementPath.ts (shared with AgentDots SVG layer)
  - Agent sort by id in RING layout ensures deterministic slot assignment (NFP #3)
metrics:
  duration: "4 minutes"
  completed_date: "2026-03-22"
  tasks: 2
  files: 6
---

# Phase 6 Plan 03: Agent Rendering System Summary

**One-liner:** Three-tier agent sprite system with faction-color dots, retinue gold rings, circular portrait textures (async with fallback), and RING layout via getRingSlotOffset.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Agent types, portrait textures, and faction dot textures | 225dd11 | agentSpriteTypes.ts, agentPortraitTextures.ts, 2 test files |
| 2 | AgentSpriteMesh — two-tier rendering with RING layout and zoom visibility | 99da451 | AgentSpriteMesh.ts, AgentSpriteMesh.test.ts |

## What Was Built

### agentSpriteTypes.ts

Defines the `AgentRenderData` interface (the data contract between world-graph callers and the rendering layer) plus all tunable constants:

- `FACTION_HERALDIC_COLORS`: 6 distinct faction colors (red, blue, purple, magenta, cyan, orange)
- `RETINUE_BORDER_COLOR = '#d4a040'` (gold) + `RETINUE_BORDER_ALT_COLOR = 'rgba(255,255,255,0.9)'` (white highlight)
- `AGENT_ZOOM_THRESHOLDS`: `{ HERO_LOCAL: 15, REGIONAL: 5, CONTINENTAL: 1.5 }` matching existing RegionLabelOverlay thresholds
- `AGENT_SPRITE_Z = 0.09` (above LOCATION_ICON_Z=0.08)
- `PORTRAIT_TEXTURE_SIZE = 128`, `FACTION_DOT_TEXTURE_SIZE = 64`

### agentPortraitTextures.ts

Canvas-based texture builders:

- `buildFactionDotTexture(color, size?)` — solid filled circle in faction color
- `buildRetinueDotTexture(color, size?)` — same plus gold ring (lineWidth=4) and white inner highlight (lineWidth=1)
- `loadPortraitTexture(url, ringColor, isRetinue)` — async, loads image, clips to circle, draws faction or retinue ring. **Fail-soft:** onerror falls back to `buildFactionDotTexture`
- `buildFactionDotTextureCache(factionColors)` — pre-builds all 6 faction textures; returns `Map<factionIndex, CanvasTexture>`

### AgentSpriteMesh.ts

Scene module with:

- `createAgentSpriteMesh(agents)` → `AgentSpriteGroup` with three `THREE.Group` instances (all `renderOrder = AGENTS = 9`)
- Groups agents by hex key, sorts by id (deterministic), distributes via `getRingSlotOffset`
- Portrait sprites start with faction dot texture placeholder; upgraded by `loadAgentPortraits`
- Retinue agents get a third continental sprite (tiny dot for k >= 1.5)
- `updateZoomVisibility(group, k)`: hero-local ≥15, regional ≥5, continental ≥1.5, hidden <1.5
- `loadAgentPortraits(group, agents)`: async portrait loading via Promise.allSettled
- `updateAgentPositions(group, agents)`: position updater for movement
- `dispose()`: iterates all sprites and disposes materials

## Test Coverage

41 tests across 3 test files, all passing:

- agentSpriteTypes.test.ts: 13 tests (faction colors, zoom thresholds, AgentRenderData construction)
- agentPortraitTextures.test.ts: 10 tests (dot texture, retinue texture, cache, fail-soft portrait fallback)
- AgentSpriteMesh.test.ts: 18 tests (group structure, render orders, RING positions, zoom visibility, retinue handling)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Image not defined in jsdom test environment**
- **Found during:** Task 1 GREEN phase — loadPortraitTexture test failed with `ReferenceError: Image is not defined`
- **Issue:** jsdom does not provide `Image` global; portrait loading uses `new Image()`
- **Fix:** Added `vi.stubGlobal('Image', class {...})` mock to test file with setter on `src` that triggers `onerror` via microtask (simulating failed image load in test environment)
- **Files modified:** `agentPortraitTextures.test.ts`

## Self-Check: PASSED

- agentSpriteTypes.ts: FOUND
- agentPortraitTextures.ts: FOUND
- AgentSpriteMesh.ts: FOUND
- Commit 225dd11: FOUND
- Commit 99da451: FOUND
