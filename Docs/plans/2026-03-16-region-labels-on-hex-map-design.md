# Region Labels on Hex Map — Design

**Date:** 2026-03-16
**Status:** Approved

## Problem

Region detection and naming are fully implemented in the engine, but region names are invisible on the hex map. The player has no way to see "The Iron Crags" or "The Emerald Wood" while exploring.

## Approach: SVG Text Layer (Approach A)

Add SVG `<text>` elements inside the existing zoom-transformed `<g>` group. Labels show when zoomed out and fade away as the player zooms in — mirroring how real-world maps print geographic names across mountain ranges and forests.

Rejected alternatives:
- **HTML overlay** — requires manual sync with D3 zoom transforms, fragile positioning, click interception issues.
- **Canvas text layer** — entirely different rendering pipeline, overkill for current map size.

## Data Flow

No new engine work. Existing data:

1. Region detection produces clusters with centroids (`centerCol`, `centerRow`)
2. Region naming creates graph nodes with `name` and `featureType`
3. Each hex carries an optional `regionId`

The component reads region nodes from the graph and maps them to pixel positions via `hexToPixel(centroid, hexSize)`.

Derived array:
```ts
{ regionId: string; name: string; featureType: string; cx: number; cy: number }
```

## SVG Layer & Zoom Behavior

**Layer placement:** New `<g>` group (`RegionLabels`) between terrain layers and agent dots. Inside the zoom-transformed parent `<g>`, so panning/scaling is automatic.

**Zoom-driven opacity:**

| Zoom scale (k) | Opacity |
|-----------------|---------|
| k ≤ 1.5 | 1.0 (fully visible) |
| 1.5 < k < 2.5 | linear fade |
| k ≥ 2.5 | 0.0 (hidden) + `pointer-events: none` |

Formula: `opacity = clamp((2.5 - k) / 1.0, 0, 1)`

Tunable constants:
```ts
const REGION_LABEL_FADE_START = 1.5;
const REGION_LABEL_FADE_END = 2.5;
```

**Fog of war:** Labels only render for regions where at least one hex is visible or remembered. Fully unexplored regions get no label.

## Visual Styling (v1)

Cartographic baseline fitting the Threadbare aesthetic:

- **Font:** Serif (project-loaded or `Georgia` fallback)
- **Letter-spacing:** Wide (`0.15–0.25em`)
- **Text transform:** Uppercase
- **Color:** Muted warm tone — `rgba(45, 35, 25, 0.7)`
- **Text shadow:** Light halo — `0 0 4px rgba(255,250,240,0.6)` for terrain readability
- **Font size:** `hexSize * 0.6`, proportional to map scale
- **Orientation:** Straight horizontal at centroid (curved `<textPath>` is a future enhancement)

All styling via CSS — easy to swap between cartographic, clean, and etched looks.

## Component Structure

**New file:** `src/components/HexMap/RegionLabels.tsx`

Props:
```ts
{
  graph: WorldGraph;
  hexSize: number;
  visibilityMap?: VisibilityMap;
  zoomScale: number;  // from D3 transform.k
}
```

Responsibilities:
1. Derive `RegionLabel[]` from graph region nodes (memoized on `graph`)
2. Filter out labels for fully unexplored regions
3. Compute opacity from `zoomScale`
4. Render `<text>` elements at centroid pixel positions

**Integration:** HexMap threads `transform.k` as a prop. `<RegionLabels>` placed inside the zoom `<g>` between terrain and agent layers.

## Future Enhancements

- Curved text along region shape via `<textPath>`
- Per-terrain color tinting
- Size scaling based on region `hexCount`
- Collision avoidance between overlapping labels
