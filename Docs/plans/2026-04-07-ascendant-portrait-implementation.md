# Ascendant Portrait System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace sphere-keyed energy-being avatars with origin-based mortal portraits framed by sphere-specific ornate borders, composited at runtime.

**Architecture:** 12 origin portrait assets + 8 sphere frame assets. A canvas compositing utility combines them at runtime and caches results per session. The hex map gets origin portraits (circular crop), the character sheet gets the full framed composite, and the IdentityChip gets a small portrait thumbnail.

**Tech Stack:** TypeScript, Canvas 2D API, React, Three.js (existing agent sprite pipeline)

**Spec:** `Docs/plans/2026-04-07-ascendant-portrait-system-design.md`

---

### Task 1: Asset Registry — Origin Portraits + Sphere Frames

**Files:**
- Modify: `src/data/avatar-portrait-assets.ts`
- Create: `src/data/__tests__/avatar-portrait-assets.test.ts`

This task adds the new lookup functions while keeping the old ones for backward compatibility until all consumers migrate.

- [ ] **Step 1: Write failing tests for the new registry functions**

```typescript
// src/data/__tests__/avatar-portrait-assets.test.ts
import { describe, it, expect } from 'vitest';
import {
  getOriginPortraitUrl,
  getSphereFrameUrl,
  ORIGIN_PORTRAITS,
  SPHERE_FRAMES,
} from '../avatar-portrait-assets';

describe('avatar-portrait-assets', () => {
  describe('ORIGIN_PORTRAITS', () => {
    it('has all 12 origin entries', () => {
      expect(Object.keys(ORIGIN_PORTRAITS)).toHaveLength(12);
    });

    it('maps origin.recent-shepherd to correct path', () => {
      expect(ORIGIN_PORTRAITS['origin.recent-shepherd']).toBe('/portraits/origin-recent-shepherd.png');
    });

    it('maps origin.ancient-scholar to correct path', () => {
      expect(ORIGIN_PORTRAITS['origin.ancient-scholar']).toBe('/portraits/origin-ancient-scholar.png');
    });
  });

  describe('SPHERE_FRAMES', () => {
    it('has all 8 sphere entries', () => {
      expect(Object.keys(SPHERE_FRAMES)).toHaveLength(8);
    });

    it('maps mind to correct path', () => {
      expect(SPHERE_FRAMES.mind).toBe('/portraits/frame-mind.png');
    });
  });

  describe('getOriginPortraitUrl', () => {
    it('returns portrait URL for known origin', () => {
      expect(getOriginPortraitUrl('origin.recent-shepherd')).toBe('/portraits/origin-recent-shepherd.png');
    });

    it('returns fallback for unknown origin (fail-soft)', () => {
      expect(getOriginPortraitUrl('origin.dev')).toBe('/portraits/origin-ancient-scholar.png');
    });

    it('returns fallback for empty string', () => {
      expect(getOriginPortraitUrl('')).toBe('/portraits/origin-ancient-scholar.png');
    });
  });

  describe('getSphereFrameUrl', () => {
    it('returns frame URL for each sphere', () => {
      expect(getSphereFrameUrl('force')).toBe('/portraits/frame-force.png');
      expect(getSphereFrameUrl('entropy')).toBe('/portraits/frame-entropy.png');
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/data/__tests__/avatar-portrait-assets.test.ts`
Expected: FAIL — `getOriginPortraitUrl`, `getSphereFrameUrl`, `ORIGIN_PORTRAITS`, `SPHERE_FRAMES` not exported

- [ ] **Step 3: Implement the new registry**

Replace the full contents of `src/data/avatar-portrait-assets.ts`:

```typescript
/**
 * Avatar Portrait Asset Registry — maps origins to portraits, spheres to frames.
 *
 * Two-layer portrait system:
 *   - Origin portraits: mortal-looking faces keyed by remembrance origin choice
 *   - Sphere frames: ornate picture frames keyed by primary Creation Sphere
 *
 * Composed at runtime by composePortrait() in src/utils/portraitCompositor.ts.
 *
 * NFP #1 (tunability): Registries are simple records — add/swap by changing paths.
 * NFP #4 (fail-soft): Lookup functions always return a valid string; unknown keys
 *   fall back to a default. Image load failure handled downstream.
 */

import type { SphereName } from '../types';

// ── Origin Portraits ────────────────────────────────────────────────────────

/** Default origin used when the identity's originFragmentId isn't in the registry (e.g. 'origin.dev') */
const DEFAULT_ORIGIN_ID = 'origin.ancient-scholar';

/** Map origin fragment ID → portrait path (relative to public/) */
export const ORIGIN_PORTRAITS: Record<string, string> = {
  'origin.recent-shepherd':   '/portraits/origin-recent-shepherd.png',
  'origin.recent-commander':  '/portraits/origin-recent-commander.png',
  'origin.recent-healer':     '/portraits/origin-recent-healer.png',
  'origin.recent-merchant':   '/portraits/origin-recent-merchant.png',
  'origin.recent-judge':      '/portraits/origin-recent-judge.png',
  'origin.recent-rebel':      '/portraits/origin-recent-rebel.png',
  'origin.ancient-scholar':   '/portraits/origin-ancient-scholar.png',
  'origin.ancient-ruler':     '/portraits/origin-ancient-ruler.png',
  'origin.ancient-wanderer':  '/portraits/origin-ancient-wanderer.png',
  'origin.ancient-priest':    '/portraits/origin-ancient-priest.png',
  'origin.ancient-dreamer':   '/portraits/origin-ancient-dreamer.png',
  'origin.ancient-artisan':   '/portraits/origin-ancient-artisan.png',
};

/** Get origin portrait URL. Falls back to ancient-scholar for unknown IDs (fail-soft). */
export function getOriginPortraitUrl(originFragmentId: string): string {
  return ORIGIN_PORTRAITS[originFragmentId] ?? ORIGIN_PORTRAITS[DEFAULT_ORIGIN_ID];
}

// ── Sphere Frames ───────────────────────────────────────────────────────────

/** Map primary sphere → ornate frame overlay path (relative to public/) */
export const SPHERE_FRAMES: Record<SphereName, string> = {
  force:   '/portraits/frame-force.png',
  matter:  '/portraits/frame-matter.png',
  energy:  '/portraits/frame-energy.png',
  life:    '/portraits/frame-life.png',
  mind:    '/portraits/frame-mind.png',
  spirit:  '/portraits/frame-spirit.png',
  time:    '/portraits/frame-time.png',
  entropy: '/portraits/frame-entropy.png',
};

/** Get sphere frame URL for the player's primary sphere. */
export function getSphereFrameUrl(primarySphere: SphereName): string {
  return SPHERE_FRAMES[primarySphere];
}

// ── Legacy Compat (deprecated — remove after full migration) ────────────────

/** @deprecated Use getOriginPortraitUrl + getSphereFrameUrl instead */
export const AVATAR_PORTRAITS: Record<SphereName, string> = {
  force:   '/portraits/avatar-force.png',
  matter:  '/portraits/avatar-matter.png',
  energy:  '/portraits/avatar-energy.png',
  life:    '/portraits/avatar-life.png',
  mind:    '/portraits/avatar-mind.png',
  spirit:  '/portraits/avatar-spirit.png',
  time:    '/portraits/avatar-time.png',
  entropy: '/portraits/avatar-entropy.png',
};

/** @deprecated Use getOriginPortraitUrl instead */
export function getAvatarPortraitUrl(primarySphere: SphereName): string {
  return AVATAR_PORTRAITS[primarySphere];
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/data/__tests__/avatar-portrait-assets.test.ts`
Expected: All 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/data/avatar-portrait-assets.ts src/data/__tests__/avatar-portrait-assets.test.ts
git commit -m "feat(portraits): add origin portrait + sphere frame asset registry

Adds ORIGIN_PORTRAITS (12 origins) and SPHERE_FRAMES (8 spheres) alongside
deprecated legacy AVATAR_PORTRAITS. Fail-soft fallback to ancient-scholar.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Portrait Compositor Utility

**Files:**
- Create: `src/utils/portraitCompositor.ts`
- Create: `src/utils/__tests__/portraitCompositor.test.ts`

Canvas-based compositing: loads origin portrait + sphere frame, draws them layered, caches result.

- [ ] **Step 1: Write failing tests**

```typescript
// src/utils/__tests__/portraitCompositor.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  composePortrait,
  composePortraitCircular,
  createPortraitCache,
  PORTRAIT_FULL_WIDTH,
  PORTRAIT_FULL_HEIGHT,
} from '../portraitCompositor';

// Mock Image and Canvas for Node test environment
class MockImage {
  width = 512;
  height = 640;
  crossOrigin = '';
  src = '';
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  set _src(url: string) {
    this.src = url;
    // Auto-trigger onload on next microtask
    if (this.onload) setTimeout(this.onload, 0);
  }
}

const mockCtx = {
  save: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  clip: vi.fn(),
  drawImage: vi.fn(),
  closePath: vi.fn(),
  canvas: { width: 512, height: 640, toDataURL: () => 'data:image/png;base64,mock' },
};

const mockCanvas = {
  width: 512,
  height: 640,
  getContext: () => mockCtx,
  toDataURL: () => 'data:image/png;base64,mock',
};

vi.stubGlobal('Image', class {
  width = 512;
  height = 640;
  crossOrigin = '';
  src = '';
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
});

vi.stubGlobal('document', {
  createElement: () => ({ ...mockCanvas, getContext: () => mockCtx }),
});

describe('portraitCompositor', () => {
  describe('constants', () => {
    it('exports default dimensions', () => {
      expect(PORTRAIT_FULL_WIDTH).toBe(512);
      expect(PORTRAIT_FULL_HEIGHT).toBe(640);
    });
  });

  describe('createPortraitCache', () => {
    it('returns an object with get and clear methods', () => {
      const cache = createPortraitCache();
      expect(typeof cache.getComposed).toBe('function');
      expect(typeof cache.getCircular).toBe('function');
      expect(typeof cache.clear).toBe('function');
    });

    it('clear empties the cache without error', () => {
      const cache = createPortraitCache();
      cache.clear();
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/utils/__tests__/portraitCompositor.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement the compositor**

```typescript
// src/utils/portraitCompositor.ts
/**
 * portraitCompositor.ts — Canvas compositing for ascendant portraits.
 *
 * Combines an origin portrait (mortal face) with a sphere frame (divine border)
 * into a single image. Results are cached per originId+sphere key.
 *
 * Two output modes:
 *   - Full: rectangular portrait with frame overlay (for character sheet)
 *   - Circular: head-region crop in a circle (for hex map / identity chip)
 *
 * Cache must be owned per session (SimulationRuntime), not module scope.
 * See architectural decision: "Engine caches must be owned per session."
 *
 * NFP #1: Dimensions and crop offsets are named constants.
 * NFP #4: Fails soft — returns null on load error, callers fall back.
 */

import { getOriginPortraitUrl, getSphereFrameUrl } from '../data/avatar-portrait-assets';
import type { SphereName } from '../types';

// ── Constants (NFP #1: tunability) ──────────────────────────────────────────

/** Full composed portrait width in pixels */
export const PORTRAIT_FULL_WIDTH = 512;
/** Full composed portrait height in pixels */
export const PORTRAIT_FULL_HEIGHT = 640;
/** Vertical offset for circular crop — shifts crop window up to center on head region (0 = top of image) */
const CIRCULAR_CROP_Y_OFFSET = 0.1;

// ── Image Loader ────────────────────────────────────────────────────────────

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

// ── Compositing Functions ───────────────────────────────────────────────────

/**
 * Compose a full rectangular portrait: origin portrait + sphere frame overlay.
 * Returns an HTMLCanvasElement or null on load failure.
 */
export async function composePortrait(
  originFragmentId: string,
  primarySphere: SphereName,
  width: number = PORTRAIT_FULL_WIDTH,
  height: number = PORTRAIT_FULL_HEIGHT,
): Promise<HTMLCanvasElement | null> {
  const portraitUrl = getOriginPortraitUrl(originFragmentId);
  const frameUrl = getSphereFrameUrl(primarySphere);

  try {
    const [portraitImg, frameImg] = await Promise.all([
      loadImage(portraitUrl),
      loadImage(frameUrl),
    ]);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Layer 1: origin portrait (fills canvas)
    ctx.drawImage(portraitImg, 0, 0, width, height);

    // Layer 2: sphere frame on top (transparent center lets portrait show through)
    ctx.drawImage(frameImg, 0, 0, width, height);

    return canvas;
  } catch {
    // NFP #4: fail-soft — return null, caller falls back to legacy portrait
    return null;
  }
}

/**
 * Compose a circular crop of the portrait, centered on the head region.
 * Used for hex map agent icons and identity chip thumbnails.
 * Returns an HTMLCanvasElement or null on load failure.
 */
export async function composePortraitCircular(
  originFragmentId: string,
  primarySphere: SphereName,
  diameter: number = 128,
): Promise<HTMLCanvasElement | null> {
  const full = await composePortrait(originFragmentId, primarySphere);
  if (!full) return null;

  const canvas = document.createElement('canvas');
  canvas.width = diameter;
  canvas.height = diameter;
  const ctx = canvas.getContext('2d')!;

  const radius = diameter / 2;

  // Circular clip
  ctx.beginPath();
  ctx.arc(radius, radius, radius, 0, Math.PI * 2);
  ctx.clip();

  // Cover crop from head region of the full portrait
  // Source: square region from top of portrait, offset slightly down to center on face
  const srcSize = full.width; // use width as square crop dimension (portrait is taller)
  const srcY = full.height * CIRCULAR_CROP_Y_OFFSET;
  ctx.drawImage(full, 0, srcY, srcSize, srcSize, 0, 0, diameter, diameter);

  return canvas;
}

// ── Per-Session Cache ───────────────────────────────────────────────────────

export interface PortraitCache {
  /** Get or compose a full rectangular portrait. Returns cached canvas or null on failure. */
  getComposed(originFragmentId: string, primarySphere: SphereName): Promise<HTMLCanvasElement | null>;
  /** Get or compose a circular crop. Returns cached canvas or null on failure. */
  getCircular(originFragmentId: string, primarySphere: SphereName, diameter?: number): Promise<HTMLCanvasElement | null>;
  /** Clear all cached canvases (call on session end). */
  clear(): void;
}

/**
 * Creates a per-session portrait cache.
 * Attach to SimulationRuntime so it's scoped to the current playthrough.
 */
export function createPortraitCache(): PortraitCache {
  const composedCache = new Map<string, HTMLCanvasElement | null>();
  const circularCache = new Map<string, HTMLCanvasElement | null>();

  return {
    async getComposed(originFragmentId, primarySphere) {
      const key = `${originFragmentId}-${primarySphere}`;
      if (composedCache.has(key)) return composedCache.get(key)!;
      const result = await composePortrait(originFragmentId, primarySphere);
      composedCache.set(key, result);
      return result;
    },

    async getCircular(originFragmentId, primarySphere, diameter = 128) {
      const key = `${originFragmentId}-${primarySphere}-${diameter}`;
      if (circularCache.has(key)) return circularCache.get(key)!;
      const result = await composePortraitCircular(originFragmentId, primarySphere, diameter);
      circularCache.set(key, result);
      return result;
    },

    clear() {
      composedCache.clear();
      circularCache.clear();
    },
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/utils/__tests__/portraitCompositor.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: Clean (no type errors)

- [ ] **Step 6: Commit**

```bash
git add src/utils/portraitCompositor.ts src/utils/__tests__/portraitCompositor.test.ts
git commit -m "feat(portraits): add canvas portrait compositor with per-session cache

Composes origin portrait + sphere frame at runtime. Supports full rectangular
(character sheet) and circular crop (hex map / identity chip) modes.
Cache scoped per session via createPortraitCache().

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Generate Placeholder Assets

**Files:**
- Create: 12 placeholder PNGs in `public/portraits/origin-*.png`
- Create: 8 placeholder PNGs in `public/portraits/frame-*.png`
- Create: `scripts/generate-portrait-placeholders.ts`

Generates solid-color placeholder images so the compositing pipeline can be tested end-to-end before real art is generated. Each origin gets a distinct muted color; each frame gets a sphere-colored border with transparent center.

- [ ] **Step 1: Create the placeholder generator script**

```typescript
// scripts/generate-portrait-placeholders.ts
/**
 * Generates placeholder portrait and frame PNGs for development.
 *
 * Run: npx tsx scripts/generate-portrait-placeholders.ts
 *
 * Outputs:
 *   public/portraits/origin-{id}.png — 512×640 solid color with origin label
 *   public/portraits/frame-{sphere}.png — 512×640 sphere-colored border, transparent center
 *
 * These are temporary dev placeholders — replace with AI-generated art.
 */

import { createCanvas } from 'canvas';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const WIDTH = 512;
const HEIGHT = 640;
const OUT_DIR = join(__dirname, '..', 'public', 'portraits');

mkdirSync(OUT_DIR, { recursive: true });

// ── Origin placeholders ─────────────────────────────────────────────────────

const ORIGINS: Array<{ id: string; color: string; label: string }> = [
  { id: 'recent-shepherd',   color: '#5a6b4a', label: 'Shepherd' },
  { id: 'recent-commander',  color: '#6b4a4a', label: 'Commander' },
  { id: 'recent-healer',     color: '#4a6b5a', label: 'Healer' },
  { id: 'recent-merchant',   color: '#6b5a4a', label: 'Merchant' },
  { id: 'recent-judge',      color: '#4a4a6b', label: 'Judge' },
  { id: 'recent-rebel',      color: '#6b4a5a', label: 'Rebel' },
  { id: 'ancient-scholar',   color: '#4a5a6b', label: 'Scholar' },
  { id: 'ancient-ruler',     color: '#6b6b4a', label: 'Ruler' },
  { id: 'ancient-wanderer',  color: '#5a5a5a', label: 'Wanderer' },
  { id: 'ancient-priest',    color: '#5a4a6b', label: 'Priest' },
  { id: 'ancient-dreamer',   color: '#4a6b6b', label: 'Dreamer' },
  { id: 'ancient-artisan',   color: '#6b5a5a', label: 'Artisan' },
];

for (const { id, color, label } of ORIGINS) {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // Dark background with tint
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Simple head circle placeholder
  ctx.beginPath();
  ctx.arc(WIDTH / 2, HEIGHT * 0.3, 80, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fill();

  // Shoulder rectangle
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fillRect(WIDTH / 2 - 100, HEIGHT * 0.5, 200, 150);

  // Label
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, WIDTH / 2, HEIGHT * 0.85);

  ctx.font = '16px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillText('placeholder', WIDTH / 2, HEIGHT * 0.9);

  writeFileSync(join(OUT_DIR, `origin-${id}.png`), canvas.toBuffer('image/png'));
  console.log(`  ✓ origin-${id}.png`);
}

// ── Sphere frame placeholders ───────────────────────────────────────────────

const SPHERES: Array<{ name: string; color: string }> = [
  { name: 'force',   color: '#ff4444' },
  { name: 'matter',  color: '#8b6b4a' },
  { name: 'energy',  color: '#ffd700' },
  { name: 'life',    color: '#00cc55' },
  { name: 'mind',    color: '#2288ff' },
  { name: 'spirit',  color: '#aa44dd' },
  { name: 'time',    color: '#ff9933' },
  { name: 'entropy', color: '#5a8a7a' },
];

const BORDER_WIDTH = 40; // ~8% of width on each side

for (const { name, color } of SPHERES) {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // Transparent center (canvas starts transparent)

  // Draw frame border
  ctx.strokeStyle = color;
  ctx.lineWidth = BORDER_WIDTH;
  ctx.strokeRect(BORDER_WIDTH / 2, BORDER_WIDTH / 2, WIDTH - BORDER_WIDTH, HEIGHT - BORDER_WIDTH);

  // Inner border line
  ctx.strokeStyle = `${color}80`;
  ctx.lineWidth = 2;
  ctx.strokeRect(BORDER_WIDTH + 8, BORDER_WIDTH + 8, WIDTH - BORDER_WIDTH * 2 - 16, HEIGHT - BORDER_WIDTH * 2 - 16);

  // Corner accents
  const cornerSize = 30;
  for (const [cx, cy] of [
    [BORDER_WIDTH, BORDER_WIDTH],
    [WIDTH - BORDER_WIDTH, BORDER_WIDTH],
    [BORDER_WIDTH, HEIGHT - BORDER_WIDTH],
    [WIDTH - BORDER_WIDTH, HEIGHT - BORDER_WIDTH],
  ] as [number, number][]) {
    ctx.beginPath();
    ctx.arc(cx, cy, cornerSize, 0, Math.PI * 2);
    ctx.fillStyle = `${color}40`;
    ctx.fill();
  }

  // Sphere label
  ctx.fillStyle = `${color}90`;
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(name.toUpperCase(), WIDTH / 2, HEIGHT - 10);

  writeFileSync(join(OUT_DIR, `frame-${name}.png`), canvas.toBuffer('image/png'));
  console.log(`  ✓ frame-${name}.png`);
}

console.log('\nDone — 20 placeholder assets generated.');
```

- [ ] **Step 2: Install `canvas` as a dev dependency (for Node-based image generation)**

Run: `npm install --save-dev canvas`

If `canvas` fails to install (native dependency), use a simpler approach — create tiny 1×1 placeholder PNGs with a shell command:

```bash
# Alternative if canvas npm package fails:
cd public/portraits
for origin in recent-shepherd recent-commander recent-healer recent-merchant recent-judge recent-rebel ancient-scholar ancient-ruler ancient-wanderer ancient-priest ancient-dreamer ancient-artisan; do
  cp avatar-mind.png "origin-${origin}.png"
done
for sphere in force matter energy life mind spirit time entropy; do
  cp avatar-${sphere}.png "frame-${sphere}.png"
done
```

This copies existing avatar PNGs as stand-ins until real art is generated.

- [ ] **Step 3: Generate placeholders**

Run: `npx tsx scripts/generate-portrait-placeholders.ts` (or the shell fallback above)
Expected: 20 new files in `public/portraits/`

- [ ] **Step 4: Verify files exist**

Run: `ls public/portraits/origin-*.png public/portraits/frame-*.png | wc -l`
Expected: `20`

- [ ] **Step 5: Commit**

```bash
git add public/portraits/origin-*.png public/portraits/frame-*.png scripts/generate-portrait-placeholders.ts
git commit -m "feat(portraits): add 20 placeholder portrait + frame assets

Temporary dev placeholders for 12 origin portraits and 8 sphere frames.
Replace with AI-generated art when available.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 4: Wire Hex Map to Use Origin Portraits

**Files:**
- Modify: `src/components/Game/GameView.tsx:470-478`

The hex map already circular-crops the portrait and adds a sphere ring — it just needs to receive the origin portrait URL instead of the sphere avatar URL. No changes to `agentPortraitTextures.ts` itself.

- [ ] **Step 1: Update the avatar portraitUrl in agentRenderData**

In `src/components/Game/GameView.tsx`, find the `agentRenderData` memo (around line 470). Change the avatar portrait URL from sphere-keyed to origin-keyed.

Find this code (around line 476):

```typescript
        portraitUrl: isAvatar
          ? getAvatarPortraitUrl(archetype.sphereAlignment.primary)
          : (getPortraitUrl(archetypeId) ?? undefined),
```

Replace with:

```typescript
        portraitUrl: isAvatar
          ? getOriginPortraitUrl(ascendantIdentity?.originFragmentId ?? '')
          : (getPortraitUrl(archetypeId) ?? undefined),
```

- [ ] **Step 2: Update the import at the top of GameView.tsx**

Find:

```typescript
import { getAvatarPortraitUrl } from '../../data/avatar-portrait-assets';
```

Replace with:

```typescript
import { getOriginPortraitUrl } from '../../data/avatar-portrait-assets';
```

If `getAvatarPortraitUrl` is used elsewhere in the file, keep both imports. Search the file first to confirm this is the only call site.

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: Clean. `ascendantIdentity` is already available as a prop on `GameView` (line 168). If it's `undefined` (pre-seeded path), the empty string fallback triggers the fail-soft default in `getOriginPortraitUrl`.

- [ ] **Step 4: Build check**

Run: `npx vite build`
Expected: Succeeds (confirms Vercel deploy will work)

- [ ] **Step 5: Commit**

```bash
git add src/components/Game/GameView.tsx
git commit -m "feat(portraits): wire hex map avatar to use origin portrait

Avatar's hex map icon now shows the origin-based mortal portrait instead of
the sphere-keyed energy being. Circular crop + sphere ring unchanged.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 5: Add Composed Portrait to AscendantSheet

**Files:**
- Modify: `src/components/Game/AscendantSheet.tsx`
- Modify: `src/components/Game/GameView.tsx` (pass `originFragmentId` prop)

Replace the sphere sigil placeholder with the full composed portrait (origin + sphere frame).

- [ ] **Step 1: Add `originFragmentId` prop to AscendantSheet**

In `src/components/Game/AscendantSheet.tsx`, update the props interface (line 30-37):

```typescript
interface AscendantSheetProps {
  open: boolean;
  onClose: () => void;
  gameState: GameState;
  archetype: AscendantArchetype;
  avatarName: string;
  sphereColor: string;
  originFragmentId: string;
}
```

Update the destructuring (line 147):

```typescript
export function AscendantSheet({
  open,
  onClose,
  gameState,
  archetype,
  avatarName,
  sphereColor,
  originFragmentId,
}: AscendantSheetProps) {
```

- [ ] **Step 2: Add portrait compositing state and effect**

Add imports at the top of `AscendantSheet.tsx`:

```typescript
import { useMemo, useEffect, useRef, useState } from 'react';
```

(Replace the existing `import { useMemo } from 'react';`)

Add the compositing hook inside the component, after the existing `useMemo` declarations (after line 191):

```typescript
  // ── Composed portrait (origin + sphere frame) ──
  const portraitRef = useRef<HTMLDivElement>(null);
  const [portraitReady, setPortraitReady] = useState(false);

  useEffect(() => {
    if (!open || !portraitRef.current) return;
    setPortraitReady(false);

    const portraitUrl = getOriginPortraitUrl(originFragmentId);
    const frameUrl = getSphereFrameUrl(primarySphere);

    const portraitImg = new Image();
    portraitImg.crossOrigin = 'anonymous';
    const frameImg = new Image();
    frameImg.crossOrigin = 'anonymous';

    let cancelled = false;

    Promise.all([
      new Promise<HTMLImageElement>((res, rej) => { portraitImg.onload = () => res(portraitImg); portraitImg.onerror = rej; portraitImg.src = portraitUrl; }),
      new Promise<HTMLImageElement>((res, rej) => { frameImg.onload = () => res(frameImg); frameImg.onerror = rej; frameImg.src = frameUrl; }),
    ]).then(([pImg, fImg]) => {
      if (cancelled || !portraitRef.current) return;
      const canvas = document.createElement('canvas');
      canvas.width = 120;
      canvas.height = 160;
      const ctx = canvas.getContext('2d')!;
      // Draw origin portrait, cover-crop to 120×160
      const scale = Math.max(120 / pImg.width, 160 / pImg.height);
      const sw = 120 / scale, sh = 160 / scale;
      const sx = (pImg.width - sw) / 2, sy = (pImg.height - sh) / 2;
      ctx.drawImage(pImg, sx, sy, sw, sh, 0, 0, 120, 160);
      // Draw sphere frame on top
      ctx.drawImage(fImg, 0, 0, 120, 160);
      // Replace container content with canvas
      portraitRef.current.innerHTML = '';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.borderRadius = 'var(--radius-md, 0.375rem)';
      portraitRef.current.appendChild(canvas);
      setPortraitReady(true);
    }).catch(() => {
      // fail-soft: leave the fallback sphere sigil visible
    });

    return () => { cancelled = true; };
  }, [open, originFragmentId, primarySphere]);
```

Add import for asset functions:

```typescript
import { getOriginPortraitUrl, getSphereFrameUrl } from '../../data/avatar-portrait-assets';
```

- [ ] **Step 3: Replace the sphere sigil with the portrait container**

In `AscendantSheet.tsx`, find the portrait slot (lines 208-219):

```typescript
          {/* Sphere sigil — occupies the portrait slot */}
          <div
            className="rounded overflow-hidden flex-shrink-0 flex items-center justify-center"
            style={{
              width: '120px',
              minWidth: '120px',
              height: '160px',
              background: `linear-gradient(135deg, ${sphereColor}30 0%, rgba(30,27,46,0.8) 100%)`,
            }}
          >
            <SphereIcon sphereName={primarySphere} size="3rem" />
          </div>
```

Replace with:

```typescript
          {/* Composed portrait (origin + sphere frame), falls back to sphere sigil */}
          <div
            ref={portraitRef}
            className="rounded overflow-hidden flex-shrink-0 flex items-center justify-center"
            style={{
              width: '120px',
              minWidth: '120px',
              height: '160px',
              background: `linear-gradient(135deg, ${sphereColor}30 0%, rgba(30,27,46,0.8) 100%)`,
            }}
          >
            {/* Fallback while portrait loads or on failure */}
            {!portraitReady && <SphereIcon sphereName={primarySphere} size="3rem" />}
          </div>
```

- [ ] **Step 4: Pass originFragmentId from GameView to AscendantSheet**

In `src/components/Game/GameView.tsx`, find the `<AscendantSheet>` JSX (around line 2904):

```typescript
      <AscendantSheet
        open={ascendantSheetOpen}
        onClose={() => setAscendantSheetOpen(false)}
        gameState={gameState}
        archetype={archetype}
        avatarName={avatarName}
        sphereColor={sphereColor}
      />
```

Add the `originFragmentId` prop:

```typescript
      <AscendantSheet
        open={ascendantSheetOpen}
        onClose={() => setAscendantSheetOpen(false)}
        gameState={gameState}
        archetype={archetype}
        avatarName={avatarName}
        sphereColor={sphereColor}
        originFragmentId={ascendantIdentity?.originFragmentId ?? ''}
      />
```

- [ ] **Step 5: Type-check and build**

Run: `npx tsc --noEmit && npx vite build`
Expected: Both clean

- [ ] **Step 6: Commit**

```bash
git add src/components/Game/AscendantSheet.tsx src/components/Game/GameView.tsx
git commit -m "feat(portraits): show composed origin+frame portrait in AscendantSheet

Character sheet now displays the origin portrait with sphere frame overlay
instead of the sphere sigil placeholder. Falls back to sigil on load failure.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 6: Add Portrait Thumbnail to IdentityChip

**Files:**
- Modify: `src/components/Game/IdentityChip.tsx`
- Modify: `src/components/Game/GameView.tsx` (pass `originFragmentId` + `primarySphere`)

Add a small circular portrait thumbnail to the IdentityChip, replacing or supplementing the sphere icon.

- [ ] **Step 1: Add `originFragmentId` prop to IdentityChip**

In `src/components/Game/IdentityChip.tsx`, update the interface:

```typescript
interface IdentityChipProps {
  avatarName: string;
  archetypeTitle: string;
  cycle: number;
  sphereColor: string;
  primarySphere: SphereName;
  originFragmentId: string;
  onClick: () => void;
}
```

Update the destructuring:

```typescript
export function IdentityChip({
  avatarName, archetypeTitle, cycle, sphereColor, primarySphere, originFragmentId, onClick,
}: IdentityChipProps) {
```

- [ ] **Step 2: Add portrait thumbnail rendering**

Add imports:

```typescript
import { useMemo, useEffect, useRef, useState } from 'react';
import { getOriginPortraitUrl } from '../../data/avatar-portrait-assets';
```

(Replace the existing `import { useMemo } from 'react';`)

Add the thumbnail hook inside the component, after `accentStyle`:

```typescript
  const thumbRef = useRef<HTMLDivElement>(null);
  const [thumbReady, setThumbReady] = useState(false);

  useEffect(() => {
    if (!thumbRef.current || !originFragmentId) return;
    setThumbReady(false);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (!thumbRef.current) return;
      const size = 28;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      // Circular clip
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();

      // Cover crop from head region
      const minDim = Math.min(img.width, img.height);
      const sx = (img.width - minDim) / 2;
      const sy = img.height * 0.1; // offset down to center on face
      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

      thumbRef.current.innerHTML = '';
      canvas.style.borderRadius = '50%';
      canvas.style.border = `2px solid ${sphereColor}`;
      canvas.style.width = '28px';
      canvas.style.height = '28px';
      thumbRef.current.appendChild(canvas);
      setThumbReady(true);
    };
    // fail-soft: on error, sphere icon remains visible
    img.onerror = () => {};
    img.src = getOriginPortraitUrl(originFragmentId);
  }, [originFragmentId, sphereColor]);
```

- [ ] **Step 3: Replace SphereIcon with portrait thumbnail**

Find the sphere icon + name line (lines 39-52):

```typescript
          <div className="flex items-center gap-1">
            <SphereIcon sphereName={primarySphere} size="0.75rem" />
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-base)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '0.04em',
              }}
            >
              {avatarName}
            </span>
          </div>
```

Replace with:

```typescript
          <div className="flex items-center gap-1.5">
            <div ref={thumbRef} className="flex-shrink-0" style={{ width: '28px', height: '28px' }}>
              {/* Fallback: sphere icon while portrait loads */}
              {!thumbReady && <SphereIcon sphereName={primarySphere} size="1.25rem" />}
            </div>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-base)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '0.04em',
              }}
            >
              {avatarName}
            </span>
          </div>
```

- [ ] **Step 4: Pass originFragmentId from GameView to IdentityChip**

In `src/components/Game/GameView.tsx`, find `<IdentityChip>` (around line 2220):

```typescript
          <IdentityChip
            avatarName={avatarName}
            archetypeTitle={archetype.title}
            cycle={gameState.cycle}
            sphereColor={sphereColor}
            primarySphere={archetype.sphereAlignment.primary}
            onClick={() => setAscendantSheetOpen(true)}
          />
```

Add `originFragmentId`:

```typescript
          <IdentityChip
            avatarName={avatarName}
            archetypeTitle={archetype.title}
            cycle={gameState.cycle}
            sphereColor={sphereColor}
            primarySphere={archetype.sphereAlignment.primary}
            originFragmentId={ascendantIdentity?.originFragmentId ?? ''}
            onClick={() => setAscendantSheetOpen(true)}
          />
```

- [ ] **Step 5: Type-check and build**

Run: `npx tsc --noEmit && npx vite build`
Expected: Both clean

- [ ] **Step 6: Commit**

```bash
git add src/components/Game/IdentityChip.tsx src/components/Game/GameView.tsx
git commit -m "feat(portraits): add portrait thumbnail to IdentityChip

Shows a small circular crop of the origin portrait with sphere-colored
border, replacing the sphere glyph icon. Falls back to SphereIcon on failure.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 7: Final Verification

**Files:** None — verification only.

- [ ] **Step 1: Run all tests**

Run: `npm test`
Expected: All tests pass

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: Clean

- [ ] **Step 3: Production build**

Run: `npx vite build`
Expected: Succeeds

- [ ] **Step 4: Visual verification**

Start the dev server (`npm run dev`) and load `?view=game&seeded` at 1920×1080.

Check all three portrait surfaces:
1. **Hex map** — avatar icon should show the origin placeholder portrait (colored rectangle with label) instead of the energy-being avatar. Sphere-colored ring should still be present.
2. **Identity chip** (top-left) — should show a small circular portrait thumbnail with sphere-colored border instead of the sphere glyph icon.
3. **Character sheet** (click identity chip) — should show the composed portrait (origin + frame overlay) in the portrait slot instead of the large sphere sigil.

- [ ] **Step 5: Commit any fixes, then push**

```bash
git push
```
