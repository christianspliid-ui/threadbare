---
phase: 05-hex-composition-landscape-signifiers
plan: 02
subsystem: ui
tags: [three.js, webgl, sprites, canvas, textures, hex-map, signifiers]

# Dependency graph
requires:
  - phase: 05-01
    provides: signifierRegistry.ts with SIGNIFIER_REGISTRY, TERRAIN_SIGNIFIER_FALLBACK, getSignifierParams
  - phase: 04-regions-borders
    provides: HexMapV2.tsx scene wiring pattern, RENDER_ORDER, HEX_CONSTANTS

provides:
  - signifierTextures.ts: buildSignifierTexture and buildSignifierTextureCache functions
  - SignifierMesh.ts: createSignifierMesh scene module following CoastlineMesh pattern
  - HexMapV2.tsx: SignifierMesh wired into scene with zoom-based visibility at k >= 5

affects:
  - 05-03
  - 05-04

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CanvasTexture rasterization: SVG path data via Path2D API rendered onto HTMLCanvasElement"
    - "Texture cache pattern: buildSignifierTextureCache builds all textures once at startup"
    - "THREE.Sprite per land hex: one sprite per tile with seeded jitter/rotation"
    - "Zoom-based visibility toggle: SIGNIFIER_ZOOM_THRESHOLD constant drives show/hide"

key-files:
  created:
    - src/components/HexMapV2/signifiers/signifierTextures.ts
    - src/components/HexMapV2/scene/SignifierMesh.ts
    - src/components/HexMapV2/scene/__tests__/SignifierMesh.test.ts
  modified:
    - src/components/HexMapV2/HexMapV2.tsx

key-decisions:
  - "SIGNIFIER_ZOOM_THRESHOLD = 5: signifiers show at regional+ zoom (k >= 5), hidden at continental/full-world"
  - "tile.coord.col/row used in getSignifierParams: HexTile has coord field, not direct col/row"
  - "Sprite materials and textures disposed in cleanup to prevent memory leaks"
  - "signifierGroup.visible = false on init: hidden until first zoom event fires"

patterns-established:
  - "Texture cache: buildSignifierTextureCache returns Map<string, CanvasTexture> keyed as terrain:variantIndex"
  - "Fail-soft chain: water type check -> registry key lookup -> fallback -> texture cache lookup, each step silently skips on miss"
  - "Zoom listener extension: add SIGNIFIER_ZOOM_THRESHOLD visibility control inside zoom.on('zoom.labels')"

requirements-completed:
  - LSIG-01
  - LSIG-04

# Metrics
duration: 8min
completed: 2026-03-22
---

# Phase 05 Plan 02: Signifier Rendering Pipeline Summary

**SVG-to-Three.js sprite rendering pipeline: CanvasTexture rasterization, one Sprite per land hex with seeded jitter/rotation, zoom-gated visibility at regional+ zoom (k >= 5)**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-22T12:38:00Z
- **Completed:** 2026-03-22T12:46:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- buildSignifierTexture rasterizes SignifierVariant SVG paths to THREE.CanvasTexture via Path2D API
- buildSignifierTextureCache builds all registry textures once at startup (no per-frame CPU cost)
- createSignifierMesh places one THREE.Sprite per land hex with seeded jitter and rotation from getSignifierParams
- HexMapV2.tsx wired with SIGNIFIER_ZOOM_THRESHOLD=5 — signifiers show at regional+ zoom, hidden at continental/full-world
- 9 unit tests covering all acceptance criteria (constants, renderOrder, water exclusion, land inclusion, fail-soft)

## Task Commits

Each task was committed atomically:

1. **Task 1: Signifier texture builder and SignifierMesh scene module** - `e350d60` (feat)
2. **Task 2: Wire SignifierMesh into HexMapV2 with zoom-based visibility** - `3897986` (feat)

**Plan metadata:** (created next)

## Files Created/Modified
- `src/components/HexMapV2/signifiers/signifierTextures.ts` - buildSignifierTexture and buildSignifierTextureCache
- `src/components/HexMapV2/scene/SignifierMesh.ts` - createSignifierMesh scene module, SIGNIFIER_SPRITE_SCALE=0.7, SIGNIFIER_Z=0.07
- `src/components/HexMapV2/scene/__tests__/SignifierMesh.test.ts` - 9 unit tests with canvas/Path2D/CanvasTexture mocks
- `src/components/HexMapV2/HexMapV2.tsx` - import, create, add to scene, zoom-based visibility, disposal

## Decisions Made
- SIGNIFIER_ZOOM_THRESHOLD = 5: matches regional tier lower bound from zoom tier thresholds established in Phase 04-03
- tile.coord.col/row used (not tile.col/tile.row): HexTile shape has coord field; plan code had bug corrected via Rule 1
- Texture disposal in cleanup: each Sprite's SpriteMaterial.map and material disposed to prevent GPU memory leaks
- signifierGroup.visible = false on init: prevents flash of signifiers at default zoom before first zoom event

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected HexTile field access in plan code**
- **Found during:** Task 1 (SignifierMesh scene module)
- **Issue:** Plan's code used `tile.col`, `tile.row`, and `hexToPixel(tile, ...)` but HexTile has `tile.coord.col`, `tile.coord.row`, and hexToPixel takes HexCoord
- **Fix:** Used `tile.coord.col`, `tile.coord.row`, and `hexToPixel(tile.coord, HEX_CONSTANTS.HEX_SIZE)` to match actual HexTile interface
- **Files modified:** src/components/HexMapV2/scene/SignifierMesh.ts
- **Verification:** TypeScript compiles clean, tests pass
- **Committed in:** e350d60 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Necessary correctness fix — the HexTile shape is established by Phase 1 and all other scene modules use tile.coord. No scope creep.

## Issues Encountered
None beyond the HexTile field access correction above.

## Next Phase Readiness
- Signifier rendering pipeline is complete — any SVG data added to SIGNIFIER_REGISTRY (Plans 03-04) will automatically appear on map
- Plans 03 and 04 can now add production hand-drawn SVG paths to the registry placeholders
- Zoom visibility at k >= 5 matches regional tier, consistent with label tier thresholds from Phase 04

---
*Phase: 05-hex-composition-landscape-signifiers*
*Completed: 2026-03-22*
