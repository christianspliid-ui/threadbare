# Palette Theme System — Feature-Flagged Color Schemes

**Date:** 2026-03-27
**Backlog:** TB-066
**Status:** Design complete, ready for implementation

## Motivation

The current "Golden Hour" palette uses saturated greens and earth tones on a near-black background. The user wants to explore a "Dark Parchment" alternative — aged/browned terrain colors in the 15–45% brightness range that feel like a burnt medieval map, while preserving the dark-world-bright-magic contrast from STYLE.md.

This design introduces a **palette theme system** so color schemes can be swapped at runtime via the Settings panel, without touching any rendering code.

## Architecture: PaletteTheme Object

All color constants that vary between themes are collected into a single `PaletteTheme` interface. Consumers never import raw palette constants directly — they read from the active theme.

### PaletteTheme interface

```typescript
// src/components/HexMapV2/palette/paletteTheme.ts

export interface PaletteTheme {
  /** Human-readable name for Settings panel */
  readonly name: string;
  /** Unique key for serialization / URL params */
  readonly key: string;

  // ── Terrain ──
  readonly terrain: Record<string, string>;       // 30 terrain type → hex color
  readonly terrainFallback: string;                // Unknown terrain fallback

  // ── Water ──
  readonly water: Record<string, string>;          // shallows, ocean, deep_ocean, lake, river

  // ── Scene ──
  readonly sceneBackground: number;                // THREE.js 0xRRGGBB
  readonly gridLineColor: number;                  // THREE.js 0xRRGGBB
  readonly fogUnexploredColor: string;             // Hex string, matches sceneBackground

  // ── Roads ──
  readonly roadMajorColor: string;                 // Hex string
  readonly roadTrailColor: string;                 // Hex string

  // ── Borders & markers ──
  readonly borderColor: number;                    // THREE.js 0xRRGGBB
  readonly capitalColor: number;                   // THREE.js 0xRRGGBB

  // ── Selection / interaction ──
  readonly selectedHexRing: number;                // THREE.js 0xRRGGBB (accent gold)
  readonly hoverOverlay: number;                   // THREE.js 0xRRGGBB
}
```

### Constants table (NFP #1)

| Constant | Golden Hour (current) | Dark Parchment | Purpose |
|---|---|---|---|
| `terrain.grassland` | `#9CA85C` | `#605840` | Base lowland |
| `terrain.savanna` | `#B4A654` | `#685830` | Dry lowland |
| `terrain.steppe` | `#BCC272` | `#6A6048` | Semi-arid lowland |
| `terrain.floodplain` | `#88945A` | `#585040` | Wet lowland |
| `terrain.light_forest` | `#849A52` | `#50482E` | Sparse tree cover |
| `terrain.woodland` | `#748C48` | `#484028` | Moderate tree cover |
| `terrain.temperate_forest` | `#5C783E` | `#3E3820` | Standard forest |
| `terrain.dense_forest` | `#4C6436` | `#342E20` | Heavy canopy |
| `terrain.boreal_forest` | `#5C783E` | `#3C3620` | Northern forest |
| `terrain.tropical_forest` | `#426440` | `#303020` | Equatorial forest |
| `terrain.marsh` | `#8E905A` | `#4A4838` | Wet lowland |
| `terrain.swamp` | `#748046` | `#3E3E28` | Flooded forest |
| `terrain.moor_bog` | `#80B488` | `#485040` | Soggy heath |
| `terrain.hills` | `#C0A05A` | `#6E5A34` | Elevated terrain |
| `terrain.forested_hills` | `#687844` | `#484028` | Hilly forest |
| `terrain.mountains` | `#A47A3C` | `#504028` | Major elevation |
| `terrain.high_mountains` | `#908680` | `#484440` | Alpine / snow line |
| `terrain.plateau` | `#B69450` | `#5E4C2E` | Flat elevated |
| `terrain.mountain_pass` | `#A68C58` | `#585038` | Traversable gap |
| `terrain.sand_desert` | `#CEAE72` | `#7A6838` | Sandy waste |
| `terrain.sand_dunes` | `#C8A460` | `#705C30` | Dune fields |
| `terrain.rocky_desert` | `#B88C50` | `#5C4828` | Rocky waste |
| `terrain.hardened_clay` | `#C69A84` | `#685040` | Clay flats |
| `terrain.badlands` | `#B4764A` | `#5A3E28` | Eroded terrain |
| `terrain.tundra` | `#E2DCD0` | `#787060` | Frozen plain |
| `terrain.snow_fields` | `#DAD4C8` | `#706858` | Snow cover |
| `terrain.glacier` | `#C6CCD2` | `#606060` | Ice mass |
| `terrain.volcanic` | `#8A8480` | `#3E3838` | Volcanic terrain |
| `terrain.volcano` | `#884C38` | `#3E2820` | Active volcano |
| `terrain.lava` | `#C46C3C` | `#6A3820` | Lava flow |
| `terrain.broken_lands` | `#9C9284` | `#484040` | Shattered terrain |
| `terrain.dead_forest` | `#929080` | `#404038` | Dead trees |
| `terrainFallback` | `#888888` | `#484038` | Unknown terrain |
| `water.deep_ocean` | `#366A98` | `#1E2E3A` | Deepest water |
| `water.ocean` | `#4886B0` | `#2A3E4C` | Mid ocean |
| `water.shallows` | `#6AA2C0` | `#3A5060` | Coastal water |
| `water.lake` | `#4280A8` | `#2A3E50` | Inland lake |
| `water.river` | `#6AA2C0` | `#3A5060` | River course |
| `sceneBackground` | `0x0a0a0c` | `0x0E0C08` | Canvas clear color |
| `gridLineColor` | `0x5D5E66` | `0x302A20` | Hex edge lines |
| `fogUnexploredColor` | `#0a0a0c` | `#0E0C08` | Fog = background |
| `roadMajorColor` | `#6b5a40` | `#4A3C24` | Major roads |
| `roadTrailColor` | `#4a3d2c` | `#302418` | Minor trails |
| `borderColor` | `0xC83030` | `0x8A3030` | Political borders (desaturated red) |
| `capitalColor` | `0xC83030` | `0x8A3030` | Capital marker |
| `selectedHexRing` | `0xd4a040` | `0xd4a040` | Selection ring (same — gold accent unifies) |
| `hoverOverlay` | `0xffffff` | `0xffffff` | Hover highlight (same) |

### Dark Parchment design rationale

The Dark Parchment palette shifts every terrain color into a narrow sepia/umber hue range (hue 25–45°) with brightness compressed to 15–45%. This produces terrain differentiation primarily through **value** (light/dark) rather than **hue**, mimicking an old document where ink has browned uniformly. Key choices:

- **Water** stays as the only cool tone (steel-blue-grey) — ink wash on parchment. Desaturated heavily from the current bright blues.
- **Grid lines** warm from cool grey to a dark umber — they should feel like faint ruled lines on the parchment.
- **Scene background** shifts from cool black `#0a0a0c` to warm black `#0E0C08` — the void itself has a parchment quality.
- **Magic threads and gold accents are unchanged** — the whole point of dark parchment is that glowing magic pops even harder against the muted earth tones.
- **Borders** desaturate — bright red screams against parchment. A darker, more muted red integrates better.
- **Roads** darken to near-background — they should be subtle, like pencil marks.

## Implementation

### File changes

**New files:**

1. **`src/components/HexMapV2/palette/paletteTheme.ts`** — `PaletteTheme` interface + `GOLDEN_HOUR_THEME` + `DARK_PARCHMENT_THEME` constants + `PALETTE_THEMES` registry array + `DEFAULT_THEME_KEY` constant.

2. **`src/components/HexMapV2/palette/activePalette.ts`** — Module-level mutable reference holding the active `PaletteTheme`. Exports:
   - `getActivePalette(): PaletteTheme` — returns current theme (fail-soft: returns golden hour if undefined)
   - `setActivePalette(key: string): void` — looks up key in registry, updates module ref
   - Keeps it simple — no React context, no stores. The palette is consumed deep in Three.js mesh builders that don't have React access. A module singleton is the right call here.

**Modified files:**

3. **`src/components/HexMapV2/palette/colorUtils.ts`** — Replace all direct imports of `TERRAIN_PALETTE`, `WATER_PALETTE`, `FALLBACK_TERRAIN_COLOR` with calls to `getActivePalette()`. The `getHexColor()` function reads `palette.terrain[terrain]` instead of `TERRAIN_PALETTE[terrain]`.

4. **`src/components/HexMapV2/palette/waterPalette.ts`** — `getDepthBandColor()` and `getWaterColor()` read from `getActivePalette().water` instead of the module-level `WATER_PALETTE` constant. The constant itself stays as a re-export for backward compatibility but is no longer the source of truth. `WATER_TERRAIN_KEYS`, `SEA_LEVEL`, `DEPTH_BAND_THRESHOLDS` are palette-independent — they stay as-is.

5. **`src/components/HexMapV2/scene/HexSceneSetup.ts`** — `SCENE_CONSTANTS.BACKGROUND_COLOR` reads from active palette. Or: `createHexScene()` takes the background color from `getActivePalette().sceneBackground`.

6. **`src/components/HexMapV2/scene/HexGridLines.ts`** — `GRID_LINE_COLOR` reads from active palette.

7. **`src/components/HexMapV2/scene/RoadMesh.ts`** — `ROAD_CONSTANTS.MAJOR_COLOR` / `TRAIL_COLOR` read from active palette.

8. **`src/components/HexMapV2/scene/BorderMesh.ts`** — `BORDER_COLOR` reads from active palette.

9. **`src/components/HexMapV2/scene/CapitalMarkers.ts`** — `CAPITAL_COLOR` reads from active palette.

10. **`src/components/HexMapV2/scene/FogCulling.ts`** — `FOG_CONSTANTS.UNEXPLORED_COLOR` reads from active palette.

11. **`src/components/HexMapV2/HexMapV2.tsx`** — Selected hex ring + hover overlay read from active palette.

12. **`src/components/Game/SettingsPanel.tsx`** — New "Color Theme" section with a dropdown/toggle: "Golden Hour" vs "Dark Parchment". On change: calls `setActivePalette(key)`, then triggers a full hex map rebuild (same pattern as toggling organic shoreline).

13. **URL parameter:** `?palette=dark-parchment` sets the initial palette before first render. Added alongside existing `?fog` param parsing in GameView.

### Rebuild trigger

When the palette changes, the hex map must rebuild all meshes (fill colors, grid lines, roads, borders). This is the same rebuild path already used by the organic shoreline toggle — `setActivePalette()` should trigger a `rebuildKey` increment that causes HexMapV2 to remount its Three.js scene.

### Tracing (NFP #2)

```typescript
interface PaletteChangeTrace {
  type: 'palette_change';
  fromTheme: string;
  toTheme: string;
  tick: number;
}
```

Emitted by `setActivePalette()` — visible in DebugPanel trace log.

### Fail-soft table (NFP #4)

| Failure case | Fallback behavior |
|---|---|
| Unknown palette key passed to `setActivePalette()` | Log warning, keep current palette unchanged |
| `getActivePalette()` called before initialization | Return `GOLDEN_HOUR_THEME` (default) |
| Terrain key missing from active theme | Return `theme.terrainFallback` |
| `?palette=` URL param has invalid value | Ignore, use default theme |
| Theme object missing a required field | TypeScript catches at compile time; runtime: fall through to golden hour |

### PRNG callout (NFP #3)

No new randomness. Brightness noise in `getHexColor()` is palette-independent — the noise seed stays the same regardless of theme. Same seed + same terrain + same theme = same output.

## Wiring

| Surface | How this system connects |
|---|---|
| **Orchestrator** | Not a tick phase — palette is purely visual. No orchestrator changes. |
| **UI rendering** | SettingsPanel dropdown triggers `setActivePalette()` → `rebuildKey` increment → HexMapV2 remounts with new colors. |
| **GameState flow** | No GameState fields. Palette selection is a display preference, persisted only in URL param. |
| **Traces** | `palette_change` trace emitted on theme switch. |
| **Debug visibility** | Current palette name shown in DebugPanel info bar. |
| **Prose pipeline** | No prose impact. |
| **Player controls** | SettingsPanel → Color Theme dropdown. URL param `?palette=dark-parchment`. |

## Testing

### Unit tests

- `paletteTheme.test.ts` — Verify both themes have all 30 terrain keys, all 5 water keys, all scene constants. Verify `PALETTE_THEMES` registry is complete.
- `activePalette.test.ts` — Verify get/set cycle, unknown key rejection, default fallback.
- `colorUtils.test.ts` — Existing tests still pass. Add: verify `getHexColor()` returns different RGB values when active palette is switched.

### Contract tests

- `colorUtils → HexFillMesh` — Feed real `getHexColor()` output with each palette into the fill mesh color buffer. Verify all values are valid floats in [0, 1].
- `activePalette → HexSceneSetup` — After `setActivePalette('dark-parchment')`, verify `getActivePalette().sceneBackground` is `0x0E0C08`.

### Visual verification

After implementation, verify at `?view=game&palette=dark-parchment`:
1. All terrain types have distinct (but muted) colors at all three zoom levels
2. Water reads as cool steel-blue against warm terrain
3. Magic threads (gold, green) pop clearly against dark parchment terrain
4. Roads are visible but subtle
5. Grid lines are warm, not cool grey
6. Political borders are visible but not garish
7. Fog of war blends seamlessly with scene background

## NFP Compliance Summary

| Priority | Verdict |
|---|---|
| 1. Tunability | PASS — Every color is a named entry in the `PaletteTheme` constant. Adding a new theme = adding one new object. |
| 2. Inspectability | PASS — Active palette name in debug bar. `palette_change` trace on switch. |
| 3. Determinism | PASS — No new randomness. Same palette + same seed = same render. |
| 4. Fail-soft | PASS — Full fallback table above. Unknown keys, missing fields, early access all handled. |
| 5. Narrative > mechanical | N/A — Visual system, no narrative impact. |
| 6. Additive > destructive | PASS — Existing `TERRAIN_PALETTE` / `WATER_PALETTE` constants remain as the golden hour theme definition. No deletions. Imports redirected through `getActivePalette()`. |
| 7. Performance | PASS — No per-frame cost. Palette read once during mesh build. Theme switch = one-time rebuild (same as organic shoreline toggle). |
