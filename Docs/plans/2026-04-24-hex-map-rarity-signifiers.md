# Hex Map Rarity Signifiers for Legendary/Mythic Locations

**Date:** 2026-04-24
**Linear issue:** THR-26
**Project:** Rarity Model
**Status:** Ready for Codex

## Purpose

Legendary (tier 4) and Mythic (tier 3) locations currently render identically to Mundane and Storied locations on the hex map — no visual signal tells the player that a location is world-shaping or legend-tier. This issue wires the rarity tier property (already stored on every location node's `properties.rarityTier`) into a new HexMapV2 scene layer that draws a rarity-tinted halo beneath the location icon for tier ≥ 3 locations, mirroring the pattern of `AnomalyShimmerMesh`.

This is the Phase-D-Deferred hook marked at `src/components/HexMapV2/scene/LocationIconMesh.ts:69`.

## Context / load-bearing facts already in the codebase

1. **Data is already there.** `src/engine/agentDetail.ts`, `src/engine/encounterScoring.ts`, `src/engine/narrative.ts`, `src/components/Game/HexSidebar.tsx`, and the Codex registry already read `node.properties.rarityTier`. Tier is populated on location nodes by world-model initialization. The GameView `locationNodes` memo (line 789) maps graph location nodes to `LocationNode[]` but does **not** currently forward `rarityTier` — this issue adds that forwarding.
2. **Constants are already defined** in `src/data/rarity-constants.ts`:
   - `RARITY_NOTIFICATION_THRESHOLD = 3` — the same threshold we use here: only tier ≥ 3 gets a signifier, matching the notification-worthy-to-player bar.
   - `RARITY_LEGENDARY_PULSE_ANIMATION = 'pulse-gold'` — a CSS class string, unsuitable for Three.js; Three.js pulse is driven by elapsed time (see `tickAnomalyShimmers` pattern).
   - `RARITY_TIER_COLORS` from `src/types/rarity.ts`: tier 3 = `#4b0082` (deep violet), tier 4 = `#d4a017` (gold/ember).
3. **Pattern to mirror:** `src/components/HexMapV2/scene/AnomalyShimmerMesh.ts` — factory returns a layer group with shimmer + halo sprite groups, a tick function drives opacity pulse, a dispose function frees GPU resources. HexMapV2 hooks it in at creation (line 1010–1018), ticks it (line 1196–1199), syncs zoom visibility (line 1495–1503), and disposes it (line 1394–1397).
4. **Render order:** `src/components/HexMapV2/scene/RenderLayers.ts` defines `ANOMALY_HALO = 8.5` and `LOCATIONS = 9`. The new layer slots at `LOCATION_RARITY_SIGNIFIER = 8.7` — above anomaly halo, below location icons. Corresponding `LAYER_Z.LOCATION_RARITY_SIGNIFIER = 0.077` (between `ANOMALY_HALO = 0.075` and `LOCATIONS = 0.080`).
5. **Zoom gating:** `LOCATION_ICON_THRESHOLD = 5` gates the location icon layer (regional+ zoom). The new rarity signifier layer tracks the same visibility — it should appear and disappear with the location icons.

## Locked visual decisions (do not revisit during implementation)

| Tier | Name      | Behavior                                                                                 |
|------|-----------|------------------------------------------------------------------------------------------|
| 1    | Mundane   | No signifier (falls below `RARITY_NOTIFICATION_THRESHOLD`).                              |
| 2    | Storied   | No signifier (falls below `RARITY_NOTIFICATION_THRESHOLD`).                              |
| 3    | Mythic    | Static halo ring in `#4b0082` (RARITY_TIER_COLORS[3]). No pulse. Sprite scale 1.0×.     |
| 4    | Legendary | Pulsing halo ring in `#d4a017` (RARITY_TIER_COLORS[4]). Pulse period identical to existing anomaly halo. Sprite scale 1.15×. |

Rationale for the threshold choice (tier 3+): `RARITY_NOTIFICATION_THRESHOLD` already encodes the "notable enough to notify the player" line. Matching it here keeps the rarity-as-narrative-signal story consistent across notification toasts and world-map signifiers.

Rationale for pulse-only-on-Legendary: two moving layers on the same hex compete for attention; static ring + pulsing ring at two tiers gives a clear visual hierarchy (Mythic = always present, Legendary = alive). Tier 4 is rare by distribution (`RARITY_DISTRIBUTION_LOCATIONS[4] = 0.02`) so pulse-layer cost is bounded.

**Anomaly interaction:** Anomaly halos (sphere-tinted, from `AnomalyShimmerMesh`) and rarity signifier halos (rarity-tinted, from this module) may stack on the same hex. They are at different render orders (`ANOMALY_HALO = 8.5` below `LOCATION_RARITY_SIGNIFIER = 8.7`), different colors, and different ring radii, so they read as distinct layers. No skip logic — render both unconditionally.

**Sublocation interaction:** `locationNodes` in GameView already filters `!n.properties.sublocationTypeId`, so sublocations never appear in the input. Rarity signifier is location-level only for v1; sublocation rarity is out of scope.

## Three-pillar check

### Engine pillar — N/A (pass-through only)

No new graph nodes, no new edges, no new tick phases, no new PRNG use, no new traces. `node.properties.rarityTier` already exists and is populated. The only engine-adjacent change is extending the GameView `locationNodes` memo (UI data adapter, not engine).

### Content pillar — N/A (no new content)

No new data tables, no new encounter templates, no new prose. The rarity tier numbers and color constants are already defined. No player-facing copy changes.

### UI pillar — full scope of this issue

1. **New scene module** — `src/components/HexMapV2/scene/LocationRaritySignifierMesh.ts`, mirroring `AnomalyShimmerMesh.ts`.
2. **Extended data interface** — add `rarityTier?: number` to the existing `LocationNode` interface in `LocationIconMesh.ts` (same interface is shared across scene modules; extending in-place keeps the data adapter simple).
3. **GameView adapter extension** — the `locationNodes` memo at `src/components/Game/GameView.tsx:789` gains one line: `rarityTier: n.properties.rarityTier as number | undefined`.
4. **HexMapV2 wiring** — new `locationRaritySignifierLayerRef`, factory call alongside `createLocationIconMesh`, tick call alongside `tickAnomalyShimmers`, zoom-visibility sync sibling to the anomaly one, dispose call in cleanup.
5. **Render order + z constants** — two new entries in `RenderLayers.ts`.
6. **Tests** — new `LocationRaritySignifierMesh.test.ts` matching the existing `LocationIconMesh.test.ts` jsdom + THREE.CanvasTexture mock pattern.

## Constants table

All tunables are named constants. New constants live in a new `src/components/HexMapV2/scene/rarityVisualConstants.ts` (keeps them colocated with the other hexmap visual constants like `anomalyConstants.ts`).

| Constant                               | Default | Purpose                                                                                       |
|----------------------------------------|---------|-----------------------------------------------------------------------------------------------|
| `RARITY_SIGNIFIER_MIN_TIER`            | `3`     | Minimum rarity tier that shows a signifier. Imported from `RARITY_NOTIFICATION_THRESHOLD`.    |
| `RARITY_SIGNIFIER_SPRITE_SCALE_MYTHIC` | `1.0`   | Sprite scale (× `HEX_CONSTANTS.HEX_SIZE`) for tier-3 halo.                                    |
| `RARITY_SIGNIFIER_SPRITE_SCALE_LEGENDARY` | `1.15` | Sprite scale (× `HEX_CONSTANTS.HEX_SIZE`) for tier-4 halo.                                   |
| `RARITY_SIGNIFIER_TEXTURE_SIZE`        | `128`   | Canvas texture size in px. Matches `HALO_TEXTURE_SIZE`.                                       |
| `RARITY_SIGNIFIER_RING_INNER_RADIUS_FRAC` | `0.32` | Inner ring radius as fraction of texture half-size. Slightly wider than anomaly halo so the two concentric rings are distinguishable when stacked. |
| `RARITY_SIGNIFIER_RING_OUTER_RADIUS_FRAC` | `0.46` | Outer ring radius as fraction of texture half-size.                                          |
| `RARITY_SIGNIFIER_STATIC_OPACITY`      | `0.55`  | Tier-3 (Mythic) fixed opacity (no pulse).                                                     |
| `RARITY_SIGNIFIER_PULSE_MIN_OPACITY`   | `0.35`  | Tier-4 (Legendary) min opacity.                                                               |
| `RARITY_SIGNIFIER_PULSE_MAX_OPACITY`   | `0.75`  | Tier-4 (Legendary) max opacity.                                                               |
| `RARITY_SIGNIFIER_PULSE_PERIOD_S`      | `3.5`   | Tier-4 pulse period in seconds. Matches `HALO_PULSE_PERIOD_S` for visual cohesion.            |

Render-layer additions in `src/components/HexMapV2/scene/RenderLayers.ts`:

| Constant                             | Value   | Purpose                                             |
|--------------------------------------|---------|-----------------------------------------------------|
| `RENDER_ORDER.LOCATION_RARITY_SIGNIFIER` | `8.7` | Above anomaly halo (8.5), below location icon (9). |
| `LAYER_Z.LOCATION_RARITY_SIGNIFIER`  | `0.077` | Between `ANOMALY_HALO (0.075)` and `LOCATIONS (0.080)`. |

## Fail-soft table

| Failure case                                           | Fallback behavior                                                   |
|--------------------------------------------------------|----------------------------------------------------------------------|
| `rarityTier` missing / undefined on a location         | Treated as tier 1 (below threshold) — no signifier rendered.        |
| `rarityTier` out of range (0, 5+, NaN, non-number)     | Treated as tier 1 — no signifier rendered. `console.warn` once per bad id. |
| Canvas 2D context unavailable (jsdom etc.)             | Return empty texture via same mock-friendly pattern as `buildCapitalRingTexture` and `getHaloTexture`. No throw. |
| `locations` array empty or undefined                   | Factory returns empty layer group with empty arrays. No throw.      |
| `RARITY_TIER_COLORS[tier]` missing (impossible, but defensive) | Fallback to tier-3 color `#4b0082`.                              |

No trace emission is required — this is visual-only. The existing rarity trace categories (`rarity_graduation`, `rarity_importance_accumulation`) are untouched.

## Wiring section

Against `Docs/plans/wiring-checklist.md`:

- **Orchestrator phase:** none (no engine-side work).
- **GameState field:** none new. Existing `properties.rarityTier` is already read via `gameState.graph`.
- **UI components:** new scene module consumed by `HexMapV2.tsx` only. No React component changes outside GameView's one-line memo extension.
- **Traces:** none new.
- **Player controls:** none new. The signifier is passive visual feedback.
- **Debug inspection:** `window.__DEBUG` already exposes `gameState.graph` — an engineer can inspect `rarityTier` on a node directly. No new debug hook needed. If visual verification fails, the terrain lab already renders locations; add a rarity-tier example to the seeded dev world via existing dev flags if needed for manual QA — **not required for this issue**.
- **Prose pipeline:** N/A.

## Files to touch

**Create:**
1. `src/components/HexMapV2/scene/rarityVisualConstants.ts` — constants table above.
2. `src/components/HexMapV2/scene/LocationRaritySignifierMesh.ts` — factory, tick, dispose, exported `LocationRaritySignifierLayerGroup` type.
3. `src/components/HexMapV2/scene/__tests__/LocationRaritySignifierMesh.test.ts` — unit tests matching the `LocationIconMesh.test.ts` mocking pattern.

**Edit:**
4. `src/components/HexMapV2/scene/RenderLayers.ts` — add `LOCATION_RARITY_SIGNIFIER = 8.7` to `RENDER_ORDER` and `0.077` to `LAYER_Z`. Remove the word "Phase 1 activates layers 0 (HEX_FILL) and 2 (GRID)" is out of date but NOT in scope for this issue — leave unchanged.
5. `src/components/HexMapV2/scene/LocationIconMesh.ts`:
   - Remove the `PHASE-D-DEFERRED` comment block (lines 69–74).
   - Add `rarityTier?: number` to the `LocationNode` interface.
6. `src/components/HexMapV2/HexMapV2.tsx`:
   - Import `createLocationRaritySignifierLayer`, `tickLocationRaritySignifiers`, `LocationRaritySignifierLayerGroup`.
   - Add `locationRaritySignifierLayerRef` next to `anomalyShimmerLayerRef` (line 509).
   - In the scene-build block (near line 1010 where anomaly layer is created), add an analogous `createLocationRaritySignifierLayer(locations)` call, add both of its groups to the scene (`signifierGroup` only — v1 is one group), set `visible = false`, store in ref.
   - In the animation loop (near line 1196), add a `tickLocationRaritySignifiers(layer, clock.getElapsedTime())` call immediately after `tickAnomalyShimmers`.
   - In the zoom visibility effect (near line 1495), add a parallel block syncing the rarity signifier group's visibility to the location group's visibility.
   - In the dispose block (near line 1394), add `locationRaritySignifierLayerRef.current?.dispose(); locationRaritySignifierLayerRef.current = null;`.
7. `src/components/Game/GameView.tsx`:
   - In the `locationNodes` memo (line 789), add `rarityTier: n.properties.rarityTier as number | undefined` to the mapped object.

**No changes to:** engine files, content data tables, types outside `LocationNode`, tests outside the new one, `Docs/plans/wiring-checklist.md` (no new surfaces added — reusing existing orchestration patterns), rarity-constants.ts (constants already present).

## Done when (binary acceptance checklist)

Each item is pass/fail, no judgment calls.

- [ ] `src/components/HexMapV2/scene/rarityVisualConstants.ts` exists and exports all 10 constants listed in the Constants table above with the default values shown.
- [ ] `src/components/HexMapV2/scene/LocationRaritySignifierMesh.ts` exists and exports:
   - `LocationRaritySignifierLayerGroup` interface with fields `signifierGroup: THREE.Group`, `materials: THREE.SpriteMaterial[]`, `pulsingMaterials: THREE.SpriteMaterial[]`, `dispose: () => void`.
   - `createLocationRaritySignifierLayer(locations: LocationNode[]): LocationRaritySignifierLayerGroup`.
   - `tickLocationRaritySignifiers(layer: LocationRaritySignifierLayerGroup, elapsedS: number): void`.
- [ ] `RenderLayers.ts` exports `RENDER_ORDER.LOCATION_RARITY_SIGNIFIER === 8.7` and `LAYER_Z.LOCATION_RARITY_SIGNIFIER === 0.077`.
- [ ] `LocationIconMesh.ts` `LocationNode` interface includes `rarityTier?: number`. The `PHASE-D-DEFERRED` comment (lines 69–74 in current HEAD) is removed.
- [ ] `HexMapV2.tsx` contains:
   - An import of `createLocationRaritySignifierLayer` and `tickLocationRaritySignifiers`.
   - A `locationRaritySignifierLayerRef` declared with `useRef<LocationRaritySignifierLayerGroup | null>(null)`.
   - A call to `createLocationRaritySignifierLayer(locations)` inside the `if (locations && locations.length > 0)` block that currently creates `createLocationIconMesh`. The returned layer's `signifierGroup` is added to the scene with `visible = false`.
   - A `tickLocationRaritySignifiers(...)` call in the animation loop immediately after `tickAnomalyShimmers`.
   - A zoom-visibility effect that sets `layer.signifierGroup.visible = locationGroup.visible` alongside the existing anomaly-zoom effect.
   - A dispose call in the cleanup block that calls `layer.dispose()` and nulls the ref.
- [ ] `GameView.tsx` `locationNodes` memo includes `rarityTier: n.properties.rarityTier as number | undefined` in the mapped object.
- [ ] `src/components/HexMapV2/scene/__tests__/LocationRaritySignifierMesh.test.ts` exists and has these tests (all passing):
   1. `createLocationRaritySignifierLayer([])` returns a layer with a `THREE.Group` whose `renderOrder === RENDER_ORDER.LOCATION_RARITY_SIGNIFIER` and no children.
   2. Locations with `rarityTier` undefined produce zero sprites.
   3. Locations with `rarityTier = 1` or `rarityTier = 2` produce zero sprites.
   4. A location with `rarityTier = 3` produces exactly one sprite with opacity `RARITY_SIGNIFIER_STATIC_OPACITY`.
   5. A location with `rarityTier = 4` produces exactly one sprite registered in `pulsingMaterials`.
   6. After `tickLocationRaritySignifiers(layer, 0)`, every material in `pulsingMaterials` has opacity in `[RARITY_SIGNIFIER_PULSE_MIN_OPACITY, RARITY_SIGNIFIER_PULSE_MAX_OPACITY]`.
   7. A location with `rarityTier = NaN`, `rarityTier = 99`, or `rarityTier = 0` produces zero sprites and does not throw.
   8. `dispose()` empties `signifierGroup.children` and does not throw when called twice.
- [ ] `npm test -- src/components/HexMapV2/scene/__tests__/LocationRaritySignifierMesh.test.ts` passes.
- [ ] `npx tsc --noEmit` clean.
- [ ] `npx vite build` succeeds.
- [ ] `npm test` — full-suite pass. (If the pre-existing `unifiedActionPhases.test.ts` tick-event-count mismatch from THR-255 is still red, record that it was red before the branch started and confirm no *new* failures were introduced.)
- [ ] The commit body includes `Fixes THR-26`.

## NFP compliance

| NFP                               | Status | Notes                                                                                                       |
|-----------------------------------|--------|-------------------------------------------------------------------------------------------------------------|
| #1 Tunability                     | PASS   | All 10 visual constants are named and centralised in `rarityVisualConstants.ts`.                            |
| #2 Inspectability                 | PASS   | Rarity tier is already readable via `gameState.graph`. No new opaque state introduced.                      |
| #3 Determinism                    | PASS   | No new PRNG. Pulse is time-driven. Sprite sort is by input order (locations come from a deterministic memo). |
| #4 Fail-soft                      | PASS   | Fail-soft table above covers missing/invalid tier, missing canvas context, empty input, missing color map.  |
| #5 Narrative over mechanical      | PASS   | Tier 3 "feels legendary" (static), tier 4 "feels alive" (pulse) — a visual narrative hierarchy, not a number readout. |
| #6 Additive                       | PASS   | New module, new constants, one-line interface extension, one-line memo extension, additive HexMapV2 wiring. No existing code removed except the PHASE-D-DEFERRED comment. |
| #7 Performance budget             | PASS   | Tier 4 distribution weight is 0.02 (≈1–3 legendary locations per medium map). Tier 3 is 0.10 (≈10–30 Mythic). At most a few dozen sprites; pulse cost is `O(pulsingMaterials.length)` per frame — negligible vs existing anomaly shimmer which uses the same pattern. |

## Rejected alternatives

- ❌ **CSS pulse animation via HTML overlay.** `RARITY_LEGENDARY_PULSE_ANIMATION = 'pulse-gold'` is a CSS class string, but location signifiers render as Three.js sprites in WebGL, not DOM elements. CSS animations would require a parallel DOM overlay with hex-to-screen coordinate projection — more complex and prone to drift under camera zoom/pan. Three.js time-driven opacity (existing anomaly pattern) is simpler and correct-by-construction.
- ❌ **Signifier on every tier (including Mundane and Storied).** Would drown out the legible-at-a-glance goal. The `RARITY_NOTIFICATION_THRESHOLD = 3` constant already encodes the "notable" line.
- ❌ **Skip rarity signifier on anomaly locations.** Rejected in favor of stacking — the two layers have different colors, radii, and render orders, so they read as complementary rather than conflicting signals. Simpler rule = simpler implementation.
- ❌ **Sublocation rarity signifiers.** Out of scope; `locationNodes` already filters sublocations. Revisit if sublocation rarity ever becomes player-facing.

## Codex coordination block

- **Parallel-safe with:** THR-251, THR-245, THR-256, THR-234, THR-243 — none share any of the files listed in "Files to touch". All five existing Codex-queue items are engine/doc/test-infra only and do not touch HexMapV2 or GameView's `locationNodes` memo.
- **Mutex with:** none.
- **Files to touch:** see "Files to touch" section above (3 creates, 4 edits).
- **Codex review:** no — scope is small, fully bounded, and the acceptance checklist is mechanical.
