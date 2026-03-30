# Region Labels on Hex Map — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Show region names (e.g. "The Iron Crags") as cartographic SVG text labels on the hex map that fade out as the player zooms in.

**Architecture:** New `RegionLabels` component renders `<text>` elements at region centroids inside the existing SVG zoom group. Opacity is driven by D3 zoom scale — visible at 1x, fading 1.5x–2.5x, gone at 2.5x+. Fog-of-war filtering hides labels for unexplored regions.

**Tech Stack:** React, SVG, D3 zoom (existing), vitest

**Design doc:** `Docs/plans/2026-03-16-region-labels-on-hex-map-design.md`

---

### Task 1: Track zoom scale as React state in HexMap

Currently `AgentDots` receives a hardcoded `DEFAULT_ZOOM_SCALE = 3.0` instead of the actual zoom level. We need real-time zoom scale available as a value we can pass to child components.

**Files:**
- Modify: `src/components/HexMap/HexMap.tsx`

**Step 1: Add zoom scale state**

Inside `HexMapComponent`, add a `useState` for the current zoom scale:

```tsx
const [currentZoomScale, setCurrentZoomScale] = useState(DEFAULT_ZOOM_SCALE);
```

**Step 2: Update zoom scale in the D3 zoom handler**

In the existing `zoom.on('zoom', ...)` callback (~line 96), add:

```tsx
setCurrentZoomScale(event.transform.k);
```

**Step 3: Pass real zoom scale to AgentDots**

Change the `AgentDots` usage (~line 317) from:

```tsx
zoomScale={DEFAULT_ZOOM_SCALE}
```

to:

```tsx
zoomScale={currentZoomScale}
```

**Step 4: Verify existing behavior unchanged**

Run: `npx vitest run src/components/HexMap/__tests__/ --reporter=verbose`
Expected: All existing HexMap tests pass.

**Step 5: Commit**

```bash
git add src/components/HexMap/HexMap.tsx
git commit -m "refactor(hex-map): track live zoom scale as React state"
```

---

### Task 2: Create RegionLabels component with tests

**Files:**
- Create: `src/components/HexMap/RegionLabels.tsx`
- Create: `src/components/HexMap/__tests__/RegionLabels.test.tsx`

**Step 1: Write the failing tests**

Create `src/components/HexMap/__tests__/RegionLabels.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { RegionLabels } from '../RegionLabels';
import { WorldGraph } from '../../../engine/graph';
import type { VisibilityMap } from '../../../types/visibility';

function makeGraphWithRegion(opts: {
  name?: string;
  featureType?: string;
  centerCol?: number;
  centerRow?: number;
} = {}): WorldGraph {
  const g = new WorldGraph();
  g.addNode({
    id: 'region_0',
    type: 'region',
    name: opts.name ?? 'The Iron Crags',
    properties: {
      featureType: opts.featureType ?? 'mountain_range',
      hexCount: 5,
      centerCol: opts.centerCol ?? 3,
      centerRow: opts.centerRow ?? 4,
    },
  });
  return g;
}

function renderInSvg(ui: React.ReactElement) {
  return render(<svg>{ui}</svg>);
}

describe('RegionLabels', () => {
  it('renders a text element for each region node', () => {
    const graph = makeGraphWithRegion();
    const { container } = renderInSvg(
      <RegionLabels graph={graph} hexSize={30} zoomScale={1.0} />
    );
    const texts = container.querySelectorAll('text');
    expect(texts.length).toBe(1);
    expect(texts[0].textContent).toBe('The Iron Crags');
  });

  it('skips regions with empty names', () => {
    const graph = makeGraphWithRegion({ name: '' });
    const { container } = renderInSvg(
      <RegionLabels graph={graph} hexSize={30} zoomScale={1.0} />
    );
    expect(container.querySelectorAll('text').length).toBe(0);
  });

  it('sets opacity to 1 when zoomScale <= FADE_START', () => {
    const graph = makeGraphWithRegion();
    const { container } = renderInSvg(
      <RegionLabels graph={graph} hexSize={30} zoomScale={1.0} />
    );
    const g = container.querySelector('.region-labels-layer');
    expect(g?.getAttribute('opacity')).toBe('1');
  });

  it('sets opacity to 0 when zoomScale >= FADE_END', () => {
    const graph = makeGraphWithRegion();
    const { container } = renderInSvg(
      <RegionLabels graph={graph} hexSize={30} zoomScale={3.0} />
    );
    const g = container.querySelector('.region-labels-layer');
    expect(g?.getAttribute('opacity')).toBe('0');
  });

  it('sets intermediate opacity during fade range', () => {
    const graph = makeGraphWithRegion();
    const { container } = renderInSvg(
      <RegionLabels graph={graph} hexSize={30} zoomScale={2.0} />
    );
    const g = container.querySelector('.region-labels-layer');
    const opacity = Number(g?.getAttribute('opacity'));
    expect(opacity).toBeGreaterThan(0);
    expect(opacity).toBeLessThan(1);
  });

  it('hides labels for fully unexplored regions', () => {
    const graph = makeGraphWithRegion({ centerCol: 3, centerRow: 4 });
    // Add a hex tile node so we can check visibility
    // The component should check if ANY hex in the region is visible
    // For simplicity, we check that with an empty visibility map (all unexplored), nothing renders
    const visMap: VisibilityMap = new Map(); // empty = all unexplored
    const { container } = renderInSvg(
      <RegionLabels graph={graph} hexSize={30} zoomScale={1.0} visibilityMap={visMap} />
    );
    expect(container.querySelectorAll('text').length).toBe(0);
  });

  it('shows labels when visibilityMap is undefined (no fog)', () => {
    const graph = makeGraphWithRegion();
    const { container } = renderInSvg(
      <RegionLabels graph={graph} hexSize={30} zoomScale={1.0} />
    );
    expect(container.querySelectorAll('text').length).toBe(1);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/HexMap/__tests__/RegionLabels.test.tsx --reporter=verbose`
Expected: FAIL — module `../RegionLabels` not found.

**Step 3: Write the RegionLabels component**

Create `src/components/HexMap/RegionLabels.tsx`:

```tsx
import React, { useMemo } from 'react';
import type { WorldGraph } from '../../engine/graph';
import type { VisibilityMap } from '../../types/visibility';
import { hexToPixel } from '../../lib/hexMath';
import { visKey } from '../../types/visibility';

// Tunable constants (NFP #1: Tunability)
export const REGION_LABEL_FADE_START = 1.5;
export const REGION_LABEL_FADE_END = 2.5;
const REGION_LABEL_FONT_SCALE = 0.6; // font size relative to hexSize

interface RegionLabel {
  regionId: string;
  name: string;
  featureType: string;
  cx: number;
  cy: number;
  memberHexes: Array<{ col: number; row: number }>;
}

interface RegionLabelsProps {
  graph: WorldGraph;
  hexSize: number;
  zoomScale: number;
  visibilityMap?: VisibilityMap;
}

function computeOpacity(zoomScale: number): number {
  if (zoomScale <= REGION_LABEL_FADE_START) return 1;
  if (zoomScale >= REGION_LABEL_FADE_END) return 0;
  return (REGION_LABEL_FADE_END - zoomScale) / (REGION_LABEL_FADE_END - REGION_LABEL_FADE_START);
}

/**
 * Check if at least one hex in the region is visible or remembered.
 * If visibilityMap is undefined (no fog system), all regions are visible.
 */
function isRegionVisible(
  memberHexes: Array<{ col: number; row: number }>,
  visibilityMap?: VisibilityMap,
): boolean {
  if (!visibilityMap) return true;
  if (visibilityMap.size === 0) return false; // empty map = nothing explored
  for (const hex of memberHexes) {
    const entry = visibilityMap.get(visKey(hex.col, hex.row));
    if (entry && entry.state !== 'unexplored') return true;
  }
  return false;
}

export const RegionLabels: React.FC<RegionLabelsProps> = ({
  graph,
  hexSize,
  zoomScale,
  visibilityMap,
}) => {
  const labels: RegionLabel[] = useMemo(() => {
    const regionNodes = graph.getNodesByType('region');
    const result: RegionLabel[] = [];
    for (const node of regionNodes) {
      if (!node.name) continue;
      const centerCol = node.properties?.centerCol as number | undefined;
      const centerRow = node.properties?.centerRow as number | undefined;
      if (centerCol == null || centerRow == null) continue;
      const { x, y } = hexToPixel({ col: centerCol, row: centerRow }, hexSize);

      // Collect member hexes for visibility check
      // Region nodes don't store hex lists directly — we use the regionId on tiles
      // For efficiency, we pass through tiles that reference this region
      // But since we don't have tiles here, we'll use the centroid as a proxy
      // and check a single hex. A more thorough approach would iterate all tiles.
      const memberHexes = [{ col: centerCol, row: centerRow }];

      result.push({
        regionId: node.id,
        name: node.name,
        featureType: (node.properties?.featureType as string) ?? 'plains',
        cx: x,
        cy: y,
        memberHexes,
      });
    }
    return result;
  }, [graph, hexSize]);

  const opacity = computeOpacity(zoomScale);
  const fontSize = hexSize * REGION_LABEL_FONT_SCALE;

  return (
    <g
      className="region-labels-layer"
      opacity={String(opacity)}
      style={{ pointerEvents: opacity === 0 ? 'none' : 'auto' }}
    >
      {labels
        .filter(l => isRegionVisible(l.memberHexes, visibilityMap))
        .map(l => (
          <text
            key={l.regionId}
            x={l.cx}
            y={l.cy}
            textAnchor="middle"
            dominantBaseline="central"
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: `${fontSize}px`,
              fontWeight: 400,
              letterSpacing: '0.2em',
              textTransform: 'uppercase' as const,
              fill: 'rgba(45, 35, 25, 0.7)',
              pointerEvents: 'none',
            }}
          >
            <tspan filter="url(#region-label-halo)">{l.name}</tspan>
          </text>
        ))}
    </g>
  );
};
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/HexMap/__tests__/RegionLabels.test.tsx --reporter=verbose`
Expected: All 7 tests PASS.

**Step 5: Commit**

```bash
git add src/components/HexMap/RegionLabels.tsx src/components/HexMap/__tests__/RegionLabels.test.tsx
git commit -m "feat(hex-map): add RegionLabels component with zoom fade and fog filtering"
```

---

### Task 3: Integrate RegionLabels into HexMap

**Files:**
- Modify: `src/components/HexMap/HexMap.tsx`

**Step 1: Import RegionLabels**

Add to imports at top of `HexMap.tsx`:

```tsx
import { RegionLabels } from './RegionLabels';
```

**Step 2: Add SVG filter definition for text halo**

Inside the `<svg>` element, after `<HexDefs>` (~line 214), add:

```tsx
<defs>
  <filter id="region-label-halo" x="-10%" y="-10%" width="120%" height="120%">
    <feFlood floodColor="rgba(255,250,240,0.6)" result="bg" />
    <feComposite in="bg" in2="SourceGraphic" operator="in" result="mask" />
    <feGaussianBlur in="mask" stdDeviation="2" result="blur" />
    <feMerge>
      <feMergeNode in="blur" />
      <feMergeNode in="SourceGraphic" />
    </feMerge>
  </filter>
</defs>
```

**Step 3: Insert RegionLabels layer between fog-recover and movement trails**

Insert the `<RegionLabels>` component after the water fog layer (~after line 307, before Layer 3.8 MovementTrails comment):

```tsx
{/* Layer 3.7: Region name labels — visible when zoomed out, fade on zoom in */}
{graph && (
  <RegionLabels
    graph={graph}
    hexSize={hexSize}
    zoomScale={currentZoomScale}
    visibilityMap={visibilityMap}
  />
)}
```

**Step 4: Run all HexMap tests**

Run: `npx vitest run src/components/HexMap/__tests__/ --reporter=verbose`
Expected: All tests pass, including existing HexMap and new RegionLabels tests.

**Step 5: Commit**

```bash
git add src/components/HexMap/HexMap.tsx
git commit -m "feat(hex-map): integrate region labels layer with halo filter"
```

---

### Task 4: Visual verification and tuning

**Files:**
- Possibly tweak: `src/components/HexMap/RegionLabels.tsx` (constants)

**Step 1: Run the dev server and visually inspect**

Run: `npm run dev`

Check:
- Region labels appear on the map when zoomed out
- Labels fade as you zoom in past ~1.5x
- Labels are fully gone by ~2.5x
- Labels don't appear over unexplored (fogged) regions
- Labels are readable against all terrain types (halo working)
- Text is centered on region centroids
- No hex click/hover interference from labels

**Step 2: Tune constants if needed**

Adjust in `RegionLabels.tsx`:
- `REGION_LABEL_FADE_START` / `REGION_LABEL_FADE_END` — if fade feels too early/late
- `REGION_LABEL_FONT_SCALE` — if text is too large/small
- `letterSpacing` — if text feels too spread or cramped
- `fill` color opacity — if text is too bold or too faint

**Step 3: Run full test suite**

Run: `npm test`
Expected: All tests pass.

**Step 4: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 5: Commit any tuning changes**

```bash
git add src/components/HexMap/RegionLabels.tsx
git commit -m "style(hex-map): tune region label appearance"
```

---

### Task 5: Build verification and final commit

**Step 1: Production build**

Run: `npx vite build`
Expected: Clean build, no errors.

**Step 2: Final commit if anything remains unstaged**

```bash
git status
# Stage and commit any remaining changes
```
