# Hex Asset Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace flat-color + emoji hex tiles with painted terrain art from `Assets/biomes/`, darken the map background, and add CSS-only magic overlays per the three-component hex visual system.

**Architecture:** Three changes layered onto the existing HexMap. (1) A build-time script resizes the 1024px hex PNGs to 256px web-optimized versions in `public/hex-tiles/`. (2) HexTile.tsx switches from `<polygon fill={color}>` + `<text>emoji</text>` to `<image>` clipped by a `<clipPath>` hex polygon, with the flat biome color as a loading fallback. (3) A CSS-only magic overlay `<polygon>` adds sphere-colored glow when a hex has active magic. Map background darkens from `#f4e8c1` to `#0a0a0e`.

**Tech Stack:** Vite (static assets from `public/`), React SVG, sharp (image resize script), vitest + @testing-library/react

---

## Pre-Implementation Context

### Asset Inventory

24 hex-masked PNGs exist in `Assets/biomes/` at 1024×1024px (~2MB each). Every base TerrainType has coverage, but filenames use hyphens while TerrainType uses underscores.

**Name mapping (TerrainType → filename):**

| TerrainType | Filename | Notes |
|-------------|----------|-------|
| `ocean` | `ocean.png` | Direct |
| `coastal_shallows` | `coastal-shallows.png` | Underscore → hyphen |
| `lake` | `lake.png` | Direct |
| `river` | `river.png` | Direct |
| `grassland` | `open-grassland.png` | Name mismatch |
| `farmland` | `farmland.png` | Direct |
| `savanna` | `savanna.png` | Direct |
| `steppe` | `steppe.png` | Direct |
| `deciduous_forest` | `deciduous-forest.png` | Underscore → hyphen |
| `dense_forest` | `dense-forest.png` | Underscore → hyphen |
| `taiga` | `taiga.png` | Direct |
| `jungle` | `jungle.png` | Direct |
| `swamp` | `swamp.png` | Direct |
| `bog` | `bog.png` | Direct |
| `hills` | `hills.png` | Direct |
| `mountains` | `mountain.png` | Plural → singular |
| `plateau` | `plateau.png` | Direct |
| `badlands` | `badlands.png` | Direct |
| `desert` | `desert.png` | Direct |
| `tundra` | `tundra.png` | Direct |
| `glacier` | `glacier.png` | Direct |
| `volcanic` | `volcanic.png` | Direct |

Extra assets with no TerrainType: `coast.png`, `tropical-ocean.png` — ignore for now.

### Key Files

- `src/components/HexMap/HexTile.tsx` — main target, currently renders `<polygon>` + `<text>`
- `src/components/HexMap/HexMap.tsx` — map container, owns SVG + d3-zoom, background color
- `src/engine/color.ts` — `BIOME_COLORS` (bright cartography palette, becomes fallback)
- `src/lib/hexMath.ts` — `hexPolygonPoints()` (pointy-top polygon, reuse for clipPath)
- `src/components/HexMap/__tests__/HexTile.test.tsx` — existing 8 tests
- `Assets/biomes/*.png` — 1024px source art
- `scripts/generate-hex-tile.py` — existing generation pipeline

### Design Reference

See `Docs/plans/2026-03-05-hex-system-design.md` for the three-component visual system:
- **Component A:** Terrain tile (base) — painted, no magic
- **Component B:** Terrain variant tile (sphere-transformed) — future, not in this plan
- **Component C:** Magic overlay (effect layer) — CSS-only glow in this plan, full art overlays later

---

## Task 1: Tile Resize Script

Create a Node.js script that resizes the 1024px source art to 256px web-optimized PNGs in `public/hex-tiles/`.

**Files:**
- Create: `scripts/resize-hex-tiles.ts`
- Output directory: `public/hex-tiles/`

**Step 1: Write the script**

```typescript
// scripts/resize-hex-tiles.ts
/**
 * Resizes 1024px hex tile PNGs from Assets/biomes/ to 256px web-optimized
 * versions in public/hex-tiles/.
 *
 * Usage: npx tsx scripts/resize-hex-tiles.ts
 */
import sharp from 'sharp';
import { readdirSync, mkdirSync, existsSync } from 'fs';
import { join, basename } from 'path';

const SOURCE_DIR = join(__dirname, '..', 'Assets', 'biomes');
const OUTPUT_DIR = join(__dirname, '..', 'public', 'hex-tiles');
const TARGET_SIZE = 256;

async function main() {
  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Find all non-raw PNGs
  const files = readdirSync(SOURCE_DIR)
    .filter(f => f.endsWith('.png') && !f.includes('-raw'));

  console.log(`Resizing ${files.length} hex tiles to ${TARGET_SIZE}px...`);

  let success = 0;
  let failed = 0;

  for (const file of files) {
    const inputPath = join(SOURCE_DIR, file);
    const outputPath = join(OUTPUT_DIR, file);

    try {
      await sharp(inputPath)
        .resize(TARGET_SIZE, TARGET_SIZE, { fit: 'fill' })
        .png({ quality: 80, compressionLevel: 9 })
        .toFile(outputPath);

      const stats = await sharp(outputPath).metadata();
      console.log(`  OK ${file} → ${TARGET_SIZE}px (${Math.round((await import('fs')).statSync(outputPath).size / 1024)}KB)`);
      success++;
    } catch (err) {
      console.error(`  FAIL ${file}: ${err}`);
      failed++;
    }
  }

  console.log(`\nDone: ${success} resized, ${failed} failed`);
}

main().catch(console.error);
```

**Step 2: Install sharp and run**

Run:
```bash
npm install -D sharp
npx tsx scripts/resize-hex-tiles.ts
```

Expected: 24 PNGs in `public/hex-tiles/` at 256px, ~15-40KB each.

**Step 3: Add npm script**

Add to `package.json` scripts:
```json
"resize-tiles": "tsx scripts/resize-hex-tiles.ts"
```

**Step 4: Commit**

```bash
git add scripts/resize-hex-tiles.ts public/hex-tiles/ package.json package-lock.json
git commit -m "build: add hex tile resize script, generate 256px web tiles"
```

---

## Task 2: Terrain-to-Filename Mapping

Create the canonical mapping from `TerrainType` to hex tile filename. This is the single source of truth for which image file serves which biome.

**Files:**
- Create: `src/data/hex-tile-assets.ts`
- Test: `src/data/__tests__/hex-tile-assets.test.ts`

**Step 1: Write the failing test**

```typescript
// src/data/__tests__/hex-tile-assets.test.ts
import { describe, it, expect } from 'vitest';
import { getHexTileUrl, TERRAIN_TILE_MAP } from '../hex-tile-assets';
import type { TerrainType } from '../../types';

const ALL_TERRAIN_TYPES: TerrainType[] = [
  'ocean', 'coastal_shallows', 'lake', 'river',
  'grassland', 'farmland', 'savanna', 'steppe',
  'deciduous_forest', 'dense_forest', 'taiga', 'jungle',
  'swamp', 'bog',
  'hills', 'mountains', 'plateau', 'badlands',
  'desert', 'tundra', 'glacier', 'volcanic',
];

describe('hex-tile-assets', () => {
  it('has a mapping for every TerrainType', () => {
    for (const terrain of ALL_TERRAIN_TYPES) {
      expect(TERRAIN_TILE_MAP[terrain], `Missing mapping for ${terrain}`).toBeDefined();
    }
  });

  it('getHexTileUrl returns a path under /hex-tiles/', () => {
    const url = getHexTileUrl('dense_forest');
    expect(url).toBe('/hex-tiles/dense-forest.png');
  });

  it('getHexTileUrl handles grassland → open-grassland', () => {
    expect(getHexTileUrl('grassland')).toBe('/hex-tiles/open-grassland.png');
  });

  it('getHexTileUrl handles mountains → mountain', () => {
    expect(getHexTileUrl('mountains')).toBe('/hex-tiles/mountain.png');
  });

  it('all mapped filenames end with .png', () => {
    for (const terrain of ALL_TERRAIN_TYPES) {
      expect(getHexTileUrl(terrain)).toMatch(/\.png$/);
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/__tests__/hex-tile-assets.test.ts`
Expected: FAIL — module not found

**Step 3: Write the implementation**

```typescript
// src/data/hex-tile-assets.ts
/**
 * CONTENT MANAGER — Hex Tile Asset Mapping
 *
 * Maps TerrainType → filename for hex tile art in public/hex-tiles/.
 * This is the single source of truth for biome-to-image mapping.
 */
import type { TerrainType } from '../types';

/**
 * Maps each TerrainType to its hex tile PNG filename (without path prefix).
 * Most are derived by replacing underscores with hyphens, but some have
 * special mappings where the asset name differs from the type name.
 */
export const TERRAIN_TILE_MAP: Record<TerrainType, string> = {
  // Water
  ocean: 'ocean.png',
  coastal_shallows: 'coastal-shallows.png',
  lake: 'lake.png',
  river: 'river.png',
  // Lowlands
  grassland: 'open-grassland.png',       // special: asset named "open-grassland"
  farmland: 'farmland.png',
  savanna: 'savanna.png',
  steppe: 'steppe.png',
  // Forest
  deciduous_forest: 'deciduous-forest.png',
  dense_forest: 'dense-forest.png',
  taiga: 'taiga.png',
  jungle: 'jungle.png',
  // Wet
  swamp: 'swamp.png',
  bog: 'bog.png',
  // Elevated
  hills: 'hills.png',
  mountains: 'mountain.png',             // special: asset uses singular
  plateau: 'plateau.png',
  badlands: 'badlands.png',
  // Extreme
  desert: 'desert.png',
  tundra: 'tundra.png',
  glacier: 'glacier.png',
  volcanic: 'volcanic.png',
};

/** Returns the public URL for a terrain type's hex tile image. */
export function getHexTileUrl(terrain: TerrainType): string {
  return `/hex-tiles/${TERRAIN_TILE_MAP[terrain]}`;
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/data/__tests__/hex-tile-assets.test.ts`
Expected: 5 tests PASS

**Step 5: Commit**

```bash
git add src/data/hex-tile-assets.ts src/data/__tests__/hex-tile-assets.test.ts
git commit -m "feat: add terrain-to-filename mapping for hex tile assets"
```

---

## Task 3: SVG Hex Clip Path Definition

Add a reusable SVG `<defs>` block with a hexagonal `<clipPath>` that HexTile can reference for image clipping. The hex tiles are pre-masked (transparent outside hex), but the SVG `<image>` element renders a rectangular bounding box — we need the clip path to prevent overpaint onto neighbors.

**Files:**
- Create: `src/components/HexMap/HexDefs.tsx`
- Test: `src/components/HexMap/__tests__/HexDefs.test.tsx`

**Step 1: Write the failing test**

```typescript
// src/components/HexMap/__tests__/HexDefs.test.tsx
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { HexDefs } from '../HexDefs';

describe('HexDefs', () => {
  it('renders a clipPath with id hex-clip-{size}', () => {
    const { container } = render(
      <svg><HexDefs size={30} /></svg>
    );
    const clipPath = container.querySelector('#hex-clip-30');
    expect(clipPath).toBeTruthy();
    expect(clipPath?.tagName).toBe('clipPath');
  });

  it('clipPath contains a polygon with 6 vertices', () => {
    const { container } = render(
      <svg><HexDefs size={30} /></svg>
    );
    const polygon = container.querySelector('#hex-clip-30 polygon');
    expect(polygon).toBeTruthy();
    const points = polygon!.getAttribute('points')!.split(' ');
    expect(points.length).toBe(6);
  });

  it('polygon is centered at origin (0,0)', () => {
    const { container } = render(
      <svg><HexDefs size={30} /></svg>
    );
    const polygon = container.querySelector('#hex-clip-30 polygon');
    const points = polygon!.getAttribute('points')!.split(' ').map(p => {
      const [x, y] = p.split(',').map(Number);
      return { x, y };
    });
    // Average of all vertices should be ~0,0
    const avgX = points.reduce((s, p) => s + p.x, 0) / points.length;
    const avgY = points.reduce((s, p) => s + p.y, 0) / points.length;
    expect(Math.abs(avgX)).toBeLessThan(0.01);
    expect(Math.abs(avgY)).toBeLessThan(0.01);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/HexMap/__tests__/HexDefs.test.tsx`
Expected: FAIL — module not found

**Step 3: Write the implementation**

```typescript
// src/components/HexMap/HexDefs.tsx
import { hexPolygonPoints } from '../../lib/hexMath';

interface HexDefsProps {
  size: number;
}

/**
 * SVG <defs> block containing a hexagonal clipPath centered at origin.
 * HexTile uses this via clipPath="url(#hex-clip-{size})" with a
 * transform to position the clip at each tile's center.
 */
export function HexDefs({ size }: HexDefsProps) {
  // Generate hex polygon centered at (0, 0)
  const points = hexPolygonPoints(0, 0, size);

  return (
    <defs>
      <clipPath id={`hex-clip-${size}`}>
        <polygon points={points} />
      </clipPath>
    </defs>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/HexMap/__tests__/HexDefs.test.tsx`
Expected: 3 tests PASS

**Step 5: Commit**

```bash
git add src/components/HexMap/HexDefs.tsx src/components/HexMap/__tests__/HexDefs.test.tsx
git commit -m "feat: add HexDefs SVG clipPath for hex tile images"
```

---

## Task 4: Replace HexTile Rendering with Images

The core change: replace `<polygon fill={color}>` + `<text>emoji</text>` with `<image>` clipped to hex shape, keeping the flat biome color as a fallback that shows while the image loads (or if it fails to load).

**Files:**
- Modify: `src/components/HexMap/HexTile.tsx`
- Modify: `src/components/HexMap/__tests__/HexTile.test.tsx`

**Step 1: Write the failing tests**

Add to `src/components/HexMap/__tests__/HexTile.test.tsx`:

```typescript
describe('hex tile image rendering', () => {
  it('renders an <image> element for visible tiles', () => {
    const { container } = renderTile({ visibility: 'visible' });
    const image = container.querySelector('image');
    expect(image).toBeTruthy();
  });

  it('image href points to correct terrain tile', () => {
    const tile: HexTile = {
      coord: { col: 0, row: 0 },
      geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 },
      terrain: 'dense_forest',
    };
    const { container } = renderTile({ tile });
    const image = container.querySelector('image');
    expect(image?.getAttribute('href')).toBe('/hex-tiles/dense-forest.png');
  });

  it('still renders biome-colored polygon as fallback behind image', () => {
    const { container } = renderTile({ visibility: 'visible' });
    const polygons = container.querySelectorAll('polygon');
    // First polygon should still be the colored fill (fallback)
    expect(polygons[0].getAttribute('fill')).not.toBe('none');
    expect(polygons[0].getAttribute('fill')).not.toBe('#0a0a0e');
  });

  it('does not render emoji text anymore', () => {
    const { container } = renderTile({ visibility: 'visible' });
    const texts = container.querySelectorAll('text');
    expect(texts.length).toBe(0);
  });

  it('renders image with clipPath for hex clipping', () => {
    const { container } = renderTile({ visibility: 'visible' });
    const g = container.querySelector('g[clip-path]') || container.querySelector('[clip-path]');
    expect(g).toBeTruthy();
  });

  it('remembered tiles render dimmed image', () => {
    const { container } = renderTile({ visibility: 'remembered' });
    const image = container.querySelector('image');
    expect(image).toBeTruthy();
    // Should be inside a group with reduced opacity
    const dimmingGroup = container.querySelector('g[opacity="0.4"]');
    expect(dimmingGroup).toBeTruthy();
  });

  it('unexplored tiles do not render an image', () => {
    const { container } = renderTile({ visibility: 'unexplored' });
    const image = container.querySelector('image');
    expect(image).toBeNull();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/HexMap/__tests__/HexTile.test.tsx`
Expected: 7 new tests FAIL (no `<image>` element rendered)

**Step 3: Implement the changes**

Replace the full contents of `src/components/HexMap/HexTile.tsx`:

```typescript
import type { HexTile, TerrainType } from '../../types';
import type { HexVisibilityState } from '../../types/visibility';
import { BIOME_COLORS } from '../../engine/color';
import { hexPolygonPoints } from '../../lib/hexMath';
import { getHexTileUrl } from '../../data/hex-tile-assets';

interface HexTileProps {
  tile: HexTile;
  cx: number;
  cy: number;
  size: number;
  hexClipId: string;
  isHovered?: boolean;
  isSelected?: boolean;
  visibility?: HexVisibilityState;
  isAvatarHex?: boolean;
  sphereColor?: string;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function HexTileComponent({
  tile, cx, cy, size, hexClipId,
  isHovered = false, isSelected = false,
  visibility = 'visible', isAvatarHex = false, sphereColor,
  onClick, onMouseEnter, onMouseLeave,
}: HexTileProps) {
  const fillColor = BIOME_COLORS[tile.terrain];
  const strokeColor = 'rgba(139, 105, 60, 0.3)';
  const points = hexPolygonPoints(cx, cy, size);
  const tileUrl = getHexTileUrl(tile.terrain);

  // Image dimensions — the image is square, sized to cover the hex bounding box
  const imgSize = size * 2;

  // Unexplored: only render black fill, no content
  if (visibility === 'unexplored') {
    return (
      <g onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={{ cursor: 'pointer' }}>
        <polygon
          points={points}
          fill="#0a0a0e"
          stroke={strokeColor}
          strokeWidth={0.6}
        />
      </g>
    );
  }

  // Shared tile content: fallback polygon + clipped image + selection ring
  const tileContent = (
    <>
      {/* Fallback biome color — shows while image loads or if it fails */}
      <polygon
        points={points}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={isSelected ? 2 : isHovered ? 1.2 : 0.6}
        opacity={isHovered ? 0.9 : 1}
      />
      {/* Hex-clipped terrain image */}
      <g clipPath={`url(#${hexClipId})`} transform={`translate(${cx}, ${cy})`}>
        <image
          href={tileUrl}
          x={-size}
          y={-size}
          width={imgSize}
          height={imgSize}
          preserveAspectRatio="xMidYMid slice"
        />
      </g>
      {/* Selection ring */}
      {isSelected && (
        <polygon
          points={hexPolygonPoints(cx, cy, size - 3)}
          fill="none"
          stroke="#5A3A1A"
          strokeWidth={1.5}
          strokeDasharray="4,2"
        />
      )}
    </>
  );

  // Remembered: wrap in dimmed group
  if (visibility === 'remembered') {
    return (
      <g onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={{ cursor: 'pointer' }}>
        <g opacity="0.4">
          {tileContent}
        </g>
      </g>
    );
  }

  // Visible: normal rendering
  return (
    <g onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={{ cursor: 'pointer' }}>
      {tileContent}
      {isAvatarHex && sphereColor && (
        <polygon
          points={points}
          fill="none"
          stroke={sphereColor}
          strokeWidth={3}
          className="avatar-pulse"
        />
      )}
    </g>
  );
}
```

**Key changes:**
- Removed `TERRAIN_ICONS` record and all emoji `<text>` elements
- Added `hexClipId` prop (passed from HexMap, references the `<clipPath>` in HexDefs)
- Added `<image>` element clipped to hex shape via `<g clipPath=...>`
- Kept fallback `<polygon fill={biomeColor}>` behind the image
- Extracted shared `tileContent` to DRY the visible/remembered branches

**Step 4: Update the test helper to pass hexClipId**

In the test file's `renderTile` helper, update defaults:

```typescript
const defaults = {
  tile: defaultTile,
  cx: 100,
  cy: 100,
  size: 30,
  hexClipId: 'hex-clip-30',
  isHovered: false,
  isSelected: false,
};
```

**Step 5: Run tests to verify they pass**

Run: `npx vitest run src/components/HexMap/__tests__/HexTile.test.tsx`
Expected: All 15 tests PASS (8 existing + 7 new)

**Step 6: Commit**

```bash
git add src/components/HexMap/HexTile.tsx src/components/HexMap/__tests__/HexTile.test.tsx
git commit -m "feat: replace emoji hex tiles with painted terrain art"
```

---

## Task 5: Wire HexDefs + hexClipId into HexMap

Update HexMap to render `<HexDefs>` in the SVG and pass `hexClipId` to each `<HexTileComponent>`. Also darken the map background.

**Files:**
- Modify: `src/components/HexMap/HexMap.tsx`
- Modify: `src/components/HexMap/__tests__/HexMap-zoom.test.tsx` (if it references background)

**Step 1: Write the failing test**

Add a new test file `src/components/HexMap/__tests__/HexMap-integration.test.tsx`:

```typescript
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { HexMap } from '../HexMap';
import type { HexTile } from '../../../types';

const mockTile: HexTile = {
  coord: { col: 0, row: 0 },
  geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 },
  terrain: 'grassland',
};

describe('HexMap integration', () => {
  it('renders HexDefs clipPath in SVG', () => {
    const { container } = render(
      <HexMap
        tiles={[mockTile]}
        cols={1} rows={1}
        hoveredHex={null} selectedHex={null}
        overlayMode="none"
        onHexClick={() => {}} onHexHover={() => {}}
      />
    );
    const clipPath = container.querySelector('clipPath');
    expect(clipPath).toBeTruthy();
    expect(clipPath?.id).toMatch(/^hex-clip-/);
  });

  it('has dark background color', () => {
    const { container } = render(
      <HexMap
        tiles={[mockTile]}
        cols={1} rows={1}
        hoveredHex={null} selectedHex={null}
        overlayMode="none"
        onHexClick={() => {}} onHexHover={() => {}}
      />
    );
    const svg = container.querySelector('svg');
    expect(svg?.style.background).toBe('#0a0a0e');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/HexMap/__tests__/HexMap-integration.test.tsx`
Expected: FAIL — no clipPath, wrong background

**Step 3: Implement changes in HexMap.tsx**

Three changes:

1. Import and render `<HexDefs>`:
```typescript
import { HexDefs } from './HexDefs';
```

2. Add `<HexDefs size={hexSize} />` inside the `<svg>` before the `<g>` zoom group.

3. Pass `hexClipId={`hex-clip-${hexSize}`}` to each `<HexTileComponent>`.

4. Change background from `'#f4e8c1'` to `'#0a0a0e'`.

**Step 4: Run all HexMap tests**

Run: `npx vitest run src/components/HexMap/__tests__/`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/components/HexMap/HexMap.tsx src/components/HexMap/__tests__/HexMap-integration.test.tsx
git commit -m "feat: wire hex tile images into HexMap, darken background"
```

---

## Task 6: Darken BIOME_COLORS for Fallback

The current `BIOME_COLORS` are bright cartography colors (`#c8d87a` for grassland, `#d8e8f0` for glacier). These show as the fallback behind images and flash bright before images load. Darken them to match the Threadbare palette so the loading flash is subtle.

**Files:**
- Modify: `src/engine/color.ts`
- Test: `src/engine/__tests__/color.test.ts` (extend if exists, create if not)

**Step 1: Write the failing test**

```typescript
// src/engine/__tests__/color-fallback.test.ts
import { describe, it, expect } from 'vitest';
import { BIOME_COLORS, hexToRgb } from '../color';
import type { TerrainType } from '../../types';

describe('BIOME_COLORS (Threadbare dark fallback)', () => {
  const allTerrains: TerrainType[] = [
    'ocean', 'coastal_shallows', 'lake', 'river',
    'grassland', 'farmland', 'savanna', 'steppe',
    'deciduous_forest', 'dense_forest', 'taiga', 'jungle',
    'swamp', 'bog',
    'hills', 'mountains', 'plateau', 'badlands',
    'desert', 'tundra', 'glacier', 'volcanic',
  ];

  it('all biome colors have brightness under 120', () => {
    for (const terrain of allTerrains) {
      const hex = BIOME_COLORS[terrain];
      const rgb = hexToRgb(hex);
      const brightness = (rgb.r + rgb.g + rgb.b) / 3;
      expect(brightness, `${terrain} (${hex}) too bright: ${brightness}`).toBeLessThan(120);
    }
  });

  it('water biomes are darker than land biomes on average', () => {
    const waterBrightness = ['ocean', 'coastal_shallows', 'lake', 'river']
      .map(t => {
        const rgb = hexToRgb(BIOME_COLORS[t as TerrainType]);
        return (rgb.r + rgb.g + rgb.b) / 3;
      });
    const avgWater = waterBrightness.reduce((a, b) => a + b, 0) / waterBrightness.length;
    expect(avgWater).toBeLessThan(80);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/color-fallback.test.ts`
Expected: FAIL — current colors are too bright (grassland is `#c8d87a` = brightness ~160)

**Step 3: Replace BIOME_COLORS with dark Threadbare palette**

Update `src/engine/color.ts` — replace the `BIOME_COLORS` record values:

```typescript
export const BIOME_COLORS: Record<TerrainType, string> = {
  // Water — deep dark blues
  ocean: '#1a2a3a',
  coastal_shallows: '#2a3a4a',
  lake: '#1e3040',
  river: '#253545',
  // Lowlands — muted dark greens/browns
  grassland: '#3a3a20',
  farmland: '#3a3520',
  savanna: '#3a3520',
  steppe: '#35351e',
  // Forest — deep dark greens
  deciduous_forest: '#2a3a1a',
  dense_forest: '#1a2a10',
  taiga: '#1a2a1a',
  jungle: '#1a3a1a',
  // Wet — dark olive
  swamp: '#2a3a1a',
  bog: '#2a3020',
  // Elevated — dark browns/greys
  hills: '#3a3520',
  mountains: '#2a2a2a',
  plateau: '#3a3020',
  badlands: '#3a2520',
  // Extreme — dark themed
  desert: '#3a3020',
  tundra: '#2a3035',
  glacier: '#2a3a4a',
  volcanic: '#2a1515',
};
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/color-fallback.test.ts`
Expected: PASS

**Step 5: Run full test suite to check nothing broke**

Run: `npx vitest run`
Expected: All ~1030+ tests PASS (colors are only used for fill, no tests assert specific color values)

**Step 6: Commit**

```bash
git add src/engine/color.ts src/engine/__tests__/color-fallback.test.ts
git commit -m "style: darken BIOME_COLORS to Threadbare palette for fallback rendering"
```

---

## Task 7: Type-Check and Full Regression

Verify everything compiles and all tests pass after all changes.

**Step 1: Type-check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 2: Full test suite**

Run: `npx vitest run`
Expected: All tests PASS

**Step 3: Build**

Run: `npx vite build`
Expected: Build succeeds, `dist/` contains the hex tile images from `public/hex-tiles/`

**Step 4: Verify assets in build output**

Run: `ls dist/hex-tiles/ | head -5`
Expected: PNG files present (Vite copies `public/` contents to `dist/` at build time)

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: verify hex asset integration — types, tests, build all green"
```

---

## Summary

| Task | What | Tests |
|------|------|-------|
| 1 | Resize script (1024→256px) | Manual verification |
| 2 | TerrainType→filename mapping | 5 tests |
| 3 | HexDefs SVG clipPath | 3 tests |
| 4 | HexTile image rendering | 7 tests |
| 5 | HexMap wiring + dark bg | 2 tests |
| 6 | Darken BIOME_COLORS | 2 tests |
| 7 | Full regression | Type-check + full suite + build |

**Total new tests:** ~19
**Files created:** 4 (resize script, hex-tile-assets.ts, HexDefs.tsx, 3 test files)
**Files modified:** 3 (HexTile.tsx, HexMap.tsx, color.ts)

### Not in scope (future plans)

- **Component B (sphere-transformed variants):** Blightweald, Ghostwood, etc. — requires variant art + runtime terrain mutation. Separate plan.
- **Component C (magic overlay art):** Full painted magic overlays. This plan adds CSS-only glow as a placeholder; painted overlays are a separate plan.
- **Hover tooltip redesign:** Currently no tooltip; future UX work.
- **Image preloading/lazy loading:** Not needed at 256px (~30KB each, 22 tiles = ~660KB total). Revisit if tile count grows significantly.
