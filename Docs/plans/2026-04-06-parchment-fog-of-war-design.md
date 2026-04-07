# Parchment Fog of War — Visual Treatment Design

**Date:** 2026-04-06
**Status:** Approved
**Scope:** Visual treatment only — the existing fog engine (visibility.ts, LOS sources, state transitions) is unchanged. We're replacing how the three states *look*, not how they're computed.

---

## Summary

Replace the current near-black hex darkening for fog of war with a **parchment/cartographic texture** for unexplored hexes and **sepia-tinted terrain** for remembered hexes. Make fog of war **on by default**. Add a debug console command for toggling.

The visual metaphor: the player is an ascendant god looking down at an ancient cartographer's map. As agents explore, the parchment peels away to reveal the living world beneath. Areas the player has seen but lost sight of fade to sepia — like the cartographer's sketch of what was once observed.

---

## Three-State Visual Model

| State | Visual Treatment | Detail Layers | Grid Lines |
|-------|-----------------|---------------|------------|
| **Unexplored** | Parchment texture (pre-baked 512×512 PNG) | Terrain shape only (hex fill = parchment) | Hidden — unbroken parchment surface |
| **Remembered** | Terrain visible, sepia-tinted | Terrain, signifiers, locations, labels visible. Agents, events hidden. | Visible |
| **Visible** | Full color terrain | All layers visible | Visible |

**Boundary style:** Hard per-hex. Each hex is clearly one state. No soft/feathered edges between states.

**Transition direction:** unexplored → visible (when LOS gained) → remembered (when LOS lost) → visible (when LOS regained). Unexplored → remembered never happens directly.

---

## Parchment Texture Asset

A single pre-baked static PNG asset. **Not generated at runtime** (NFP: all art is pre-baked).

### Specification

| Property | Value |
|----------|-------|
| Resolution | 512×512 px |
| Format | PNG (RGB, no alpha needed) |
| Tiling | Seamless — must tile without visible seams |
| Color range | Dark parchment: `#3d3025` to `#4a3d2e` (within STYLE.md world color range for terrain/soil) |
| Content | Aged paper grain, subtle fiber texture, faint ink stains. Optional: very subtle cartographic marks (compass rose fragments, faint line work). Must read as "blank old map" at game zoom levels. |
| Aesthetic | Threadbare: dark, worn, textured surfaces. NOT bright/clean parchment — this is ancient, weathered paper in dim twilight lighting. |

### Art Direction Notes

- The parchment must sit within the 10–40% brightness range per STYLE.md
- It should feel like the margins of an ancient fantasy map where the cartographer hasn't explored
- At normal game zoom, the texture reads as "dark textured surface, clearly not terrain"
- At close zoom, paper grain and subtle cartographic details reward inspection
- No magic threads, no sphere colors on the parchment

---

## Sepia Tint (Remembered State)

When a hex transitions from visible → remembered, the terrain color is shifted to sepia tones. This is computed CPU-side using a standard RGB → sepia color matrix applied to the original terrain color.

### Sepia Matrix

```
R' = R × 0.393 + G × 0.769 + B × 0.189
G' = R × 0.349 + G × 0.686 + B × 0.168
B' = R × 0.272 + G × 0.534 + B × 0.131
```

Clamped to [0, 1]. This is the standard photographic sepia transform.

### Constants

| Constant | Value | Purpose |
|----------|-------|---------|
| `SEPIA_STRENGTH` | `0.7` | Blend factor: 0 = original color, 1 = full sepia. 0.7 gives recognizable terrain with clear sepia wash. |
| `SEPIA_BRIGHTNESS_SCALE` | `0.85` | Slight dimming to differentiate from full-brightness visible terrain. |

The final remembered color = `lerp(originalColor, sepiaColor, SEPIA_STRENGTH) × SEPIA_BRIGHTNESS_SCALE`.

---

## Technical Implementation

### Current State

- Hex fill uses `MeshBasicMaterial` with per-instance colors via `setColorAt()`
- No UV coordinates on hex geometry
- No textures on hex fill
- Fog state communicated purely through color swaps (unexplored = near-black, else = original)
- SignifierMesh.ts proves custom `ShaderMaterial` works in this codebase

### Changes Required

#### 1. Add UVs to Hex Geometry (`HexFillMesh.ts → buildHexGeometry`)

Map hex vertices to 0–1 UV space. The hex center maps to (0.5, 0.5). Each vertex maps based on its angle:

```
u = 0.5 + (x / (2 × HEX_SIZE))
v = 0.5 + (y / (2 × HEX_SIZE))
```

This gives each hex instance the same UV mapping — they all sample the full texture. Per-hex variation comes from the texture itself being a tiling parchment.

#### 2. Add Per-Instance Fog State Attribute

New `InstancedBufferAttribute` on both land and water meshes:

| Attribute | Type | Values |
|-----------|------|--------|
| `aFogState` | `Float32`, 1 component per instance | `0.0` = unexplored, `0.5` = remembered, `1.0` = visible |

Updated in `useFogCulling` alongside instance colors. Same update pattern: write values, set `needsUpdate = true`.

#### 3. Replace MeshBasicMaterial with ShaderMaterial

Custom vertex + fragment shaders for the hex fill:

**Vertex shader:**
- Pass through instance color (`vColor`)
- Pass through UV (`vUv`)
- Pass through fog state (`vFogState`)
- Apply instance matrix transform (standard InstancedMesh pattern)

**Fragment shader:**
```glsl
uniform sampler2D uParchmentTex;

varying vec3 vColor;
varying vec2 vUv;
varying float vFogState;

void main() {
    if (vFogState < 0.25) {
        // Unexplored: sample parchment texture
        gl_FragColor = texture2D(uParchmentTex, vUv);
    } else {
        // Remembered (0.5) or Visible (1.0): use instance color
        // (sepia tint already applied CPU-side for remembered)
        gl_FragColor = vec4(vColor, 1.0);
    }
}
```

**Uniforms:**
- `uParchmentTex`: `THREE.Texture` — the parchment PNG, loaded once at scene init

#### 4. Update FogCulling Color Logic

`updateFogColors()` changes:

- **Unexplored:** Set `aFogState = 0.0`. Instance color doesn't matter (shader ignores it), but set to parchment base color as fallback.
- **Remembered:** Set `aFogState = 0.5`. Compute sepia-tinted color from `originalColors` cache and write to instance color.
- **Visible:** Set `aFogState = 1.0`. Restore original terrain color from cache (unchanged from current behavior).

#### 5. Parchment Texture Loading

Load the parchment texture at scene initialization in HexMapV2:

```typescript
const parchmentTex = new THREE.TextureLoader().load('/textures/parchment-512.png');
parchmentTex.wrapS = THREE.RepeatWrapping;
parchmentTex.wrapT = THREE.RepeatWrapping;
parchmentTex.colorSpace = THREE.SRGBColorSpace;
```

Pass as uniform to the ShaderMaterial.

---

## Toggle System

### Default State Change

Fog of war is **ON by default**. This is a flip from the current opt-in behavior.

| Mechanism | Before | After |
|-----------|--------|-------|
| URL param | `?fog` enables fog | `?nofog` disables fog |
| Default (no param) | Fog OFF | Fog ON |

### Debug Console Command

Add `fog` command to the in-game debug CLI:

```
fws> fog           # toggle fog on/off
fws> fog on        # explicitly enable
fws> fog off       # explicitly disable
```

Outputs current state: `Fog of war: ON` / `Fog of war: OFF`.

### Debug Bridge

Add to `window.__DEBUG`:

```typescript
window.__DEBUG.toggleFog()        // toggle, returns new state
window.__DEBUG.setFog(enabled)    // explicit set
```

### CLAUDE.md Update

Add `fog` to the CLI command list in the "Headless CLI" section and add `toggleFog()` / `setFog()` to the Debug Bridge section.

---

## Layer Gating (Unchanged)

The existing `isLayerVisibleForHex()` rules remain identical:

| State | terrain | signifier | location | label | agent | event | grid |
|-------|---------|-----------|----------|-------|-------|-------|------|
| unexplored | yes (parchment) | no | no | no | no | no | **no** |
| remembered | yes (sepia) | yes | yes | yes | no | no | yes |
| visible | yes (full) | yes | yes | yes | yes | yes | yes |

The only change to `isLayerVisibleForHex` is that `'grid'` for `'unexplored'` already returns `false` — confirmed in current code. No changes needed.

**UI overlay rule:** Fog of war operates exclusively on the Three.js hex fill mesh layer. React DOM UI elements rendered on top of the canvas — ActionDrawer cards, modals, tooltips, the debug panel — are never affected by fog. The parchment texture and sepia tint are per-instance shader effects on the InstancedMesh, not a screen-space post-process. This is inherent to the architecture (WebGL canvas vs DOM overlay) but stated explicitly to prevent future confusion.

---

## Performance

| Metric | Before | After | Impact |
|--------|--------|-------|--------|
| Draw calls | 2 (land + water) | 2 (land + water) | None |
| Material type | MeshBasicMaterial | ShaderMaterial | Negligible — custom shader is simpler than MeshStandard |
| Per-fragment cost | Color lookup | Color lookup + branch + texture sample (unexplored only) | ~1 texture sample for unexplored hexes |
| CPU update cost | setColorAt per changed hex | setColorAt + setFogState per changed hex | One extra float write per hex |
| Memory | Instance colors only | + 512×512 texture (~1MB) + fog state buffer (~240KB for 60K hexes) | ~1.2MB additional |
| Texture uploads | 0 | 1 (parchment, loaded once) | One-time at scene init |

**Verdict:** Well within performance budget. The shader is simpler than MeshStandardMaterial (no lighting calc), and the texture sample only happens for unexplored hexes.

---

## Constants Table (NFP #1)

| Constant | Default | Location | Purpose |
|----------|---------|----------|---------|
| `PARCHMENT_TEXTURE_PATH` | `'/textures/parchment-512.png'` | FogCulling.ts | Path to parchment texture asset |
| `PARCHMENT_TEXTURE_SIZE` | `512` | Asset spec | Texture resolution |
| `SEPIA_STRENGTH` | `0.7` | FogCulling.ts | Blend factor for sepia tint (0–1) |
| `SEPIA_BRIGHTNESS_SCALE` | `0.85` | FogCulling.ts | Brightness multiplier for remembered hexes |
| `FOG_STATE_UNEXPLORED` | `0.0` | FogCulling.ts | Shader fog state value for unexplored |
| `FOG_STATE_REMEMBERED` | `0.5` | FogCulling.ts | Shader fog state value for remembered |
| `FOG_STATE_VISIBLE` | `1.0` | FogCulling.ts | Shader fog state value for visible |
| `FOG_ENABLED_DEFAULT` | `true` | GameView.tsx / HexV2View.tsx | Whether fog is on by default |

---

## Tracing (NFP #2)

No new trace types needed. The existing visibility system already emits traces for state transitions. The visual treatment is purely a rendering concern.

---

## PRNG (NFP #3)

No PRNG usage. The parchment texture is a static asset. Sepia tint is a deterministic color matrix. No randomness involved.

---

## Fail-Soft (NFP #4)

| Failure | Fallback |
|---------|----------|
| Parchment texture fails to load | Fall back to solid parchment color (`#3d3025`) — shader checks `texture2D` result or uses color uniform fallback |
| `aFogState` attribute missing | Shader defaults to `1.0` (visible) — all hexes render normally |
| Fog disabled | All hexes get `aFogState = 1.0`, shader always uses instance color — equivalent to current no-fog behavior |

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/HexMapV2/scene/HexFillMesh.ts` | Add UVs to geometry, replace MeshBasicMaterial with ShaderMaterial, add aFogState attribute |
| `src/components/HexMapV2/scene/FogCulling.ts` | Add sepia tint logic, update fog state attribute alongside colors, add constants |
| `src/components/HexMapV2/hooks/useFogCulling.ts` | Update to write fog state attribute, handle sepia color computation |
| `src/components/HexMapV2/HexV2View.tsx` | Flip fog default to ON, load parchment texture, pass to material |
| `src/components/Game/GameView.tsx` | Flip fog default to ON, `?nofog` param |
| `src/debug-bridge.ts` | Add `toggleFog()`, `setFog()` |
| `src/components/DebugPanel/` | Add `fog` CLI command |
| `public/textures/parchment-512.png` | New asset — parchment texture |
| `CLAUDE.md` | Document `fog` command and debug bridge methods |
| `src/components/HexMapV2/scene/__tests__/FogCulling.test.ts` | Update tests for sepia tint, fog state attribute |

---

## Out of Scope

- Fog engine logic changes (LOS computation, sight ranges, state transitions)
- Animated transitions between states (the `VISIBLE_TO_EXPLORED_DIMOUT_MS` constant exists but is not used — remains deferred)
- Parchment texture generation pipeline (texture is created once as a static asset)
- "Here be dragons" decorative elements on parchment (potential future enhancement)
