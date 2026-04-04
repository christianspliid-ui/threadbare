# Coat of Arms & Icon System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Procedural SVG coat of arms for every faction, plus canonical sphere and reach icons, rendered on the hex map and throughout the UI.

**Architecture:** Pure-function SVG generators that compose shield shape + field division + tinctures + charges from faction properties. Three React components (`<CoatOfArms>`, `<SphereIcon>`, `<ReachIcon>`) plus raw SVG string generators for Three.js hex map integration. All colors from the canonical cosmology palette.

**Tech Stack:** React, SVG, TypeScript, Three.js (CanvasTexture for hex map rasterization)

**Spec:** `Docs/plans/2026-04-04-coat-of-arms-and-icon-system-design.md`

---

## File Structure

```
src/components/icons/
  constants.ts            — All named constants (SPHERE_COLORS, REACH_TO_SPHERE, etc.)
  heraldry/
    shields.ts            — Shield outline SVG path
    divisions.ts          — Field division patterns (per_pale, per_fess, etc.)
    charges.ts            — Charge symbol SVG paths (sword, anvil, eye, etc.)
    tinctures.ts          — Color derivation from sphere/foundation
    borders.ts            — Border ornamentation by prominence level
  CoatOfArms.tsx          — React component + SVG string generator
  SphereIcon.tsx          — Sphere icon component + generator
  ReachIcon.tsx           — Reach icon component + generator
  index.ts                — Public exports
```

**Modified files:**
- `src/components/Game/FactionSheet.tsx` — replace iconGlyph with `<CoatOfArms>`
- `src/components/Game/chronicle/FactionEntry.tsx` — replace `⬡` with `<CoatOfArms>`
- `src/components/HexMapV2/scene/ArmyLayer.ts` — replace colored circles with coat of arms textures

---

### Task 1: Constants & Color Mappings

**Files:**
- Create: `src/components/icons/constants.ts`
- Test: `src/components/icons/__tests__/constants.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/components/icons/__tests__/constants.test.ts
import { describe, it, expect } from 'vitest';
import {
  SPHERE_COLORS,
  REACH_TO_SPHERE,
  SPHERE_TO_FOUNDATION,
  DIVISION_BY_FACTION_TYPE,
} from '../constants';
import { REACH_DOMAINS } from '../../../types/traits';
import { SPHERE_NAMES, CREATION_SPHERE_NAMES, FOUNDATION_SPHERE_NAMES } from '../../../types/index';

describe('constants', () => {
  it('SPHERE_COLORS covers all 12 spheres', () => {
    for (const sphere of SPHERE_NAMES) {
      expect(SPHERE_COLORS[sphere]).toBeDefined();
      expect(SPHERE_COLORS[sphere]).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('REACH_TO_SPHERE covers all 8 reaches', () => {
    for (const reach of REACH_DOMAINS) {
      expect(REACH_TO_SPHERE[reach]).toBeDefined();
      expect(CREATION_SPHERE_NAMES).toContain(REACH_TO_SPHERE[reach]);
    }
  });

  it('SPHERE_TO_FOUNDATION covers all 8 creation spheres', () => {
    for (const sphere of CREATION_SPHERE_NAMES) {
      expect(SPHERE_TO_FOUNDATION[sphere]).toBeDefined();
      expect(FOUNDATION_SPHERE_NAMES).toContain(SPHERE_TO_FOUNDATION[sphere]);
    }
  });

  it('DIVISION_BY_FACTION_TYPE covers all 6 faction types', () => {
    const types = ['military', 'guild', 'religious', 'political', 'criminal', 'monster'] as const;
    for (const t of types) {
      expect(DIVISION_BY_FACTION_TYPE[t]).toBeDefined();
    }
  });

  it('each foundation sphere governs exactly 2 creation spheres', () => {
    for (const foundation of FOUNDATION_SPHERE_NAMES) {
      const governed = CREATION_SPHERE_NAMES.filter(s => SPHERE_TO_FOUNDATION[s] === foundation);
      expect(governed).toHaveLength(2);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/icons/__tests__/constants.test.ts`
Expected: FAIL — module `../constants` not found

- [ ] **Step 3: Write the constants module**

```typescript
// src/components/icons/constants.ts
import type { FactionType } from '../../types/faction';
import type { ReachDomain } from '../../types/traits';
import type { SphereName, CreationSphereName, FoundationSphereName } from '../../types/index';

// ── Cosmology Colors (from cosmology-symmetry.html) ──

export const SPHERE_COLORS: Record<SphereName, string> = {
  force: '#ff6b6b',
  matter: '#d4a87a',
  energy: '#ffe44d',
  life: '#33ff77',
  mind: '#44aaff',
  spirit: '#cc66ff',
  time: '#ffb355',
  entropy: '#8fd4c0',
  chaos: '#d4d4d8',
  order: '#fbbf24',
  light: '#fef3c7',
  darkness: '#8b7fbf',
};

// ── Reach ↔ Sphere 1:1 mapping ──

export const REACH_TO_SPHERE: Record<ReachDomain, CreationSphereName> = {
  iron: 'force',
  stone: 'matter',
  eye: 'energy',
  gold: 'life',
  veil: 'mind',
  heart: 'spirit',
  star: 'time',
  shadow: 'entropy',
};

// ── Creation Sphere → Foundation Sphere ──

export const SPHERE_TO_FOUNDATION: Record<CreationSphereName, FoundationSphereName> = {
  force: 'chaos',
  entropy: 'chaos',
  matter: 'light',
  energy: 'light',
  life: 'order',
  mind: 'order',
  spirit: 'darkness',
  time: 'darkness',
};

// ── Shield division by faction type ──

export type DivisionType =
  | 'per_pale'
  | 'per_fess'
  | 'per_chevron'
  | 'quarterly'
  | 'per_bend_sinister'
  | 'plain';

export const DIVISION_BY_FACTION_TYPE: Record<FactionType, DivisionType> = {
  military: 'per_pale',
  guild: 'per_fess',
  religious: 'per_chevron',
  political: 'quarterly',
  criminal: 'per_bend_sinister',
  monster: 'plain',
};

// ── Border prominence thresholds ──

export const BORDER_THRESHOLDS = {
  established: { members: 5, territories: 2 },
  dominant: { members: 10, territories: 4 },
} as const;

export type ProminenceLevel = 'base' | 'established' | 'dominant';

// ── Detail cutoff for small sizes ──

export const SMALL_SIZE_THRESHOLD = 32;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/icons/__tests__/constants.test.ts`
Expected: PASS — all 5 tests

- [ ] **Step 5: Commit**

```bash
git add src/components/icons/constants.ts src/components/icons/__tests__/constants.test.ts
git commit -m "feat(icons): add cosmology color constants and mapping tables"
```

---

### Task 2: Tincture Derivation

**Files:**
- Create: `src/components/icons/heraldry/tinctures.ts`
- Test: `src/components/icons/__tests__/tinctures.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/components/icons/__tests__/tinctures.test.ts
import { describe, it, expect } from 'vitest';
import { deriveTinctures } from '../heraldry/tinctures';

describe('deriveTinctures', () => {
  it('derives colors from iron reach (Force/Chaos quadrant)', () => {
    const result = deriveTinctures('iron');
    expect(result.primary).toBe('#ff6b6b');      // Force red
    expect(result.foundation).toBe('#d4d4d8');    // Chaos silver
    expect(result.charge).toBeDefined();
    expect(result.secondary).toBeDefined();
  });

  it('derives colors from heart reach (Spirit/Darkness quadrant)', () => {
    const result = deriveTinctures('heart');
    expect(result.primary).toBe('#cc66ff');       // Spirit purple
    expect(result.foundation).toBe('#8b7fbf');    // Darkness violet
  });

  it('secondary tincture is darker than primary', () => {
    const result = deriveTinctures('gold');
    // Secondary should be primary at 30% brightness
    expect(result.secondary).not.toBe(result.primary);
  });

  it('charge color contrasts with primary (light charge on dark primary)', () => {
    const result = deriveTinctures('shadow');
    // Entropy teal #8fd4c0 is light → charge should be dark
    expect(result.charge).toBeDefined();
  });

  it('works for all 8 reaches', () => {
    const reaches = ['iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star'] as const;
    for (const reach of reaches) {
      const result = deriveTinctures(reach);
      expect(result.primary).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(result.secondary).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(result.foundation).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(result.charge).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/icons/__tests__/tinctures.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the tinctures module**

```typescript
// src/components/icons/heraldry/tinctures.ts
import type { ReachDomain } from '../../../types/traits';
import { SPHERE_COLORS, REACH_TO_SPHERE, SPHERE_TO_FOUNDATION } from '../constants';

export interface TinctureSet {
  /** Sphere canonical color */
  primary: string;
  /** Primary at 30% brightness for division contrast */
  secondary: string;
  /** Foundation quadrant color for border/accent */
  foundation: string;
  /** Contrasting color for charge visibility */
  charge: string;
}

/** Parse hex color to RGB */
function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

/** RGB to hex string */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(c => Math.round(c).toString(16).padStart(2, '0')).join('');
}

/** Compute relative luminance (0–1) */
function luminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/** Darken a hex color to 30% brightness */
function darken(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r * 0.3, g * 0.3, b * 0.3);
}

/** Derive the full tincture set from a reach domain */
export function deriveTinctures(reach: ReachDomain): TinctureSet {
  const sphere = REACH_TO_SPHERE[reach];
  const foundationSphere = SPHERE_TO_FOUNDATION[sphere];

  const primary = SPHERE_COLORS[sphere];
  const secondary = darken(primary);
  const foundation = SPHERE_COLORS[foundationSphere];

  const [r, g, b] = hexToRgb(primary);
  const lum = luminance(r, g, b);
  // Light primary → dark charge, dark primary → light charge
  const charge = lum > 0.25 ? '#1a1a2e' : '#e0ddd4';

  return { primary, secondary, foundation, charge };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/icons/__tests__/tinctures.test.ts`
Expected: PASS — all 5 tests

- [ ] **Step 5: Commit**

```bash
git add src/components/icons/heraldry/tinctures.ts src/components/icons/__tests__/tinctures.test.ts
git commit -m "feat(icons): add tincture derivation from reach → sphere → foundation"
```

---

### Task 3: Shield Path & Division Patterns

**Files:**
- Create: `src/components/icons/heraldry/shields.ts`
- Create: `src/components/icons/heraldry/divisions.ts`
- Test: `src/components/icons/__tests__/divisions.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/components/icons/__tests__/divisions.test.ts
import { describe, it, expect } from 'vitest';
import { SHIELD_PATH, SHIELD_VIEWBOX } from '../heraldry/shields';
import { renderDivision } from '../heraldry/divisions';
import type { DivisionType } from '../constants';

describe('shields', () => {
  it('exports a valid SVG path string', () => {
    expect(SHIELD_PATH).toContain('M');
    expect(SHIELD_PATH).toContain('Q');
  });

  it('exports viewBox dimensions', () => {
    expect(SHIELD_VIEWBOX).toEqual({ width: 120, height: 150 });
  });
});

describe('renderDivision', () => {
  const colors = { primary: '#ff0000', secondary: '#330000' };

  it('renders per_pale as two vertical halves', () => {
    const svg = renderDivision('per_pale', colors);
    expect(svg).toContain('clip-path');
    expect(svg).toContain(colors.primary);
    expect(svg).toContain(colors.secondary);
  });

  it('renders per_fess as two horizontal halves', () => {
    const svg = renderDivision('per_fess', colors);
    expect(svg).toContain(colors.primary);
    expect(svg).toContain(colors.secondary);
  });

  it('renders plain as a single field', () => {
    const svg = renderDivision('plain', colors);
    expect(svg).toContain(colors.primary);
    // Plain has no secondary region
    expect(svg).not.toContain(colors.secondary);
  });

  it('renders all 6 division types without error', () => {
    const types: DivisionType[] = [
      'per_pale', 'per_fess', 'per_chevron',
      'quarterly', 'per_bend_sinister', 'plain',
    ];
    for (const type of types) {
      const svg = renderDivision(type, colors);
      expect(svg).toBeTruthy();
      expect(svg).toContain(colors.primary);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/icons/__tests__/divisions.test.ts`
Expected: FAIL — modules not found

- [ ] **Step 3: Write the shields module**

```typescript
// src/components/icons/heraldry/shields.ts

/** Standard shield viewBox dimensions */
export const SHIELD_VIEWBOX = { width: 120, height: 150 } as const;

/** SVG path for the shield outline (pointed base, rounded shoulders) */
export const SHIELD_PATH = 'M10,8 L110,8 L110,95 Q110,138 60,145 Q10,138 10,95 Z';

/** Clip path ID used for field divisions */
export const SHIELD_CLIP_ID = 'shield-clip';

/** Returns the <clipPath> and <path> elements for the shield base */
export function renderShieldBase(
  fillColor: string,
  strokeColor: string,
  strokeWidth: number,
  clipId: string,
): string {
  return [
    `<defs><clipPath id="${clipId}"><path d="${SHIELD_PATH}"/></clipPath></defs>`,
    `<path d="${SHIELD_PATH}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>`,
  ].join('');
}

/** Returns the shield outline (drawn on top of everything) */
export function renderShieldOutline(strokeColor: string, strokeWidth: number): string {
  return `<path d="${SHIELD_PATH}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>`;
}
```

- [ ] **Step 4: Write the divisions module**

```typescript
// src/components/icons/heraldry/divisions.ts
import type { DivisionType } from '../constants';

interface DivisionColors {
  primary: string;
  secondary: string;
}

/**
 * Renders the field division as SVG elements.
 * All rects/polygons are clipped to the shield shape via clip-path.
 * The clipId should match the <clipPath> from renderShieldBase.
 */
export function renderDivision(
  type: DivisionType,
  colors: DivisionColors,
  clipId: string = 'shield-clip',
): string {
  const clip = `clip-path="url(#${clipId})"`;

  switch (type) {
    case 'per_pale':
      // Vertical split — left primary, right secondary
      return [
        `<rect x="10" y="8" width="50" height="142" fill="${colors.primary}" ${clip}/>`,
        `<rect x="60" y="8" width="50" height="142" fill="${colors.secondary}" ${clip}/>`,
      ].join('');

    case 'per_fess':
      // Horizontal split — top primary, bottom secondary
      return [
        `<rect x="10" y="8" width="100" height="68" fill="${colors.primary}" ${clip}/>`,
        `<rect x="10" y="76" width="100" height="80" fill="${colors.secondary}" ${clip}/>`,
      ].join('');

    case 'per_chevron':
      // V-shaped — top primary, bottom secondary
      return [
        `<polygon points="10,8 110,8 110,70 60,100 10,70" fill="${colors.primary}" ${clip}/>`,
        `<polygon points="10,70 60,100 110,70 110,150 10,150" fill="${colors.secondary}" ${clip}/>`,
      ].join('');

    case 'quarterly':
      // Four quadrants — primary in 1st & 4th, secondary in 2nd & 3rd
      return [
        `<rect x="10" y="8" width="50" height="68" fill="${colors.primary}" ${clip}/>`,
        `<rect x="60" y="8" width="50" height="68" fill="${colors.secondary}" ${clip}/>`,
        `<rect x="10" y="76" width="50" height="80" fill="${colors.secondary}" ${clip}/>`,
        `<rect x="60" y="76" width="50" height="80" fill="${colors.primary}" ${clip}/>`,
      ].join('');

    case 'per_bend_sinister':
      // Diagonal split top-right to bottom-left
      return [
        `<polygon points="10,8 110,8 10,150" fill="${colors.primary}" ${clip}/>`,
        `<polygon points="110,8 110,150 10,150" fill="${colors.secondary}" ${clip}/>`,
      ].join('');

    case 'plain':
      // Solid field — primary only
      return `<rect x="10" y="8" width="100" height="142" fill="${colors.primary}" ${clip}/>`;
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/icons/__tests__/divisions.test.ts`
Expected: PASS — all 4 tests

- [ ] **Step 6: Commit**

```bash
git add src/components/icons/heraldry/shields.ts src/components/icons/heraldry/divisions.ts src/components/icons/__tests__/divisions.test.ts
git commit -m "feat(icons): add shield path and 6 heraldic division patterns"
```

---

### Task 4: Charge Symbols

**Files:**
- Create: `src/components/icons/heraldry/charges.ts`
- Test: `src/components/icons/__tests__/charges.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/components/icons/__tests__/charges.test.ts
import { describe, it, expect } from 'vitest';
import { renderCharge } from '../heraldry/charges';
import { REACH_DOMAINS } from '../../../types/traits';

describe('renderCharge', () => {
  it('renders an SVG group for each reach domain', () => {
    for (const reach of REACH_DOMAINS) {
      const svg = renderCharge(reach, '#ffffff', 1.0);
      expect(svg).toContain('<g');
      expect(svg).toContain('#ffffff');
    }
  });

  it('scales charge size with the scale parameter', () => {
    const full = renderCharge('iron', '#fff', 1.0);
    const half = renderCharge('iron', '#fff', 0.5);
    // Both should be valid SVG but with different transforms
    expect(full).toContain('scale(1');
    expect(half).toContain('scale(0.5');
  });

  it('centers charge at shield midpoint by default', () => {
    const svg = renderCharge('iron', '#fff', 1.0);
    expect(svg).toContain('translate(60');
  });

  it('accepts custom center position', () => {
    const svg = renderCharge('iron', '#fff', 1.0, 30, 40);
    expect(svg).toContain('translate(30');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/icons/__tests__/charges.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the charges module**

```typescript
// src/components/icons/heraldry/charges.ts
import type { ReachDomain } from '../../../types/traits';

/**
 * Renders a heraldic charge (central symbol) for a reach domain.
 * Returns an SVG <g> element centered at (cx, cy) with the given scale.
 * Default center is shield midpoint (60, 75).
 */
export function renderCharge(
  reach: ReachDomain,
  color: string,
  scale: number,
  cx: number = 60,
  cy: number = 75,
): string {
  const inner = CHARGE_PATHS[reach](color);
  return `<g transform="translate(${cx},${cy}) scale(${scale})">${inner}</g>`;
}

type ChargeFn = (color: string) => string;

const CHARGE_PATHS: Record<ReachDomain, ChargeFn> = {
  // Iron — crossed swords
  iron: (c) => [
    `<line x1="-18" y1="-24" x2="18" y2="24" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`,
    `<line x1="18" y1="-24" x2="-18" y2="24" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`,
    `<line x1="-22" y1="-18" x2="-14" y2="-22" stroke="${c}" stroke-width="2" stroke-linecap="round"/>`,
    `<line x1="22" y1="-18" x2="14" y2="-22" stroke="${c}" stroke-width="2" stroke-linecap="round"/>`,
    `<circle cx="0" cy="0" r="3" fill="${c}"/>`,
  ].join(''),

  // Stone — anvil
  stone: (c) => [
    `<rect x="-16" y="-8" width="32" height="7" rx="2" fill="${c}"/>`,
    `<rect x="-10" y="-1" width="20" height="14" rx="1" fill="${c}"/>`,
    `<rect x="-20" y="13" width="40" height="5" rx="2" fill="${c}"/>`,
  ].join(''),

  // Eye — radiant eye
  eye: (c) => [
    `<ellipse cx="0" cy="0" rx="16" ry="10" fill="none" stroke="${c}" stroke-width="2.5"/>`,
    `<circle cx="0" cy="0" r="5" fill="${c}"/>`,
    `<line x1="0" y1="-14" x2="0" y2="-22" stroke="${c}" stroke-width="1.5"/>`,
    `<line x1="12" y1="-8" x2="18" y2="-14" stroke="${c}" stroke-width="1.5"/>`,
    `<line x1="-12" y1="-8" x2="-18" y2="-14" stroke="${c}" stroke-width="1.5"/>`,
    `<line x1="16" y1="2" x2="22" y2="4" stroke="${c}" stroke-width="1.5"/>`,
    `<line x1="-16" y1="2" x2="-22" y2="4" stroke="${c}" stroke-width="1.5"/>`,
  ].join(''),

  // Gold — coin
  gold: (c) => [
    `<circle cx="0" cy="-4" r="12" fill="none" stroke="${c}" stroke-width="2.5"/>`,
    `<circle cx="0" cy="-4" r="6" fill="${c}" opacity="0.4"/>`,
    `<rect x="-14" y="10" width="28" height="4" rx="2" fill="${c}"/>`,
  ].join(''),

  // Veil — crescent with wisps
  veil: (c) => [
    `<path d="M6,-16 A14,14 0 1,0 6,16 A10,10 0 1,1 6,-16" fill="${c}" opacity="0.8"/>`,
    `<path d="M-8,12 Q-16,18 -20,14" fill="none" stroke="${c}" stroke-width="1.5" opacity="0.5"/>`,
    `<path d="M-4,16 Q-10,24 -16,20" fill="none" stroke="${c}" stroke-width="1.5" opacity="0.4"/>`,
  ].join(''),

  // Heart — classic heart
  heart: (c) => [
    `<path d="M0,-8 C-4,-18 -20,-18 -20,-6 C-20,4 -8,14 0,22 C8,14 20,4 20,-6 C20,-18 4,-18 0,-8Z" fill="${c}"/>`,
  ].join(''),

  // Star — six-pointed star
  star: (c) => {
    const points: string[] = [];
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI / 6) * i - Math.PI / 2;
      const r = i % 2 === 0 ? 18 : 9;
      points.push(`${(Math.cos(angle) * r).toFixed(1)},${(Math.sin(angle) * r).toFixed(1)}`);
    }
    return `<polygon points="${points.join(' ')}" fill="${c}"/>`;
  },

  // Shadow — dagger
  shadow: (c) => [
    `<polygon points="0,-22 5,-4 3,16 0,20 -3,16 -5,-4" fill="${c}"/>`,
    `<line x1="-10" y1="-4" x2="10" y2="-4" stroke="${c}" stroke-width="2.5" stroke-linecap="round"/>`,
  ].join(''),
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/icons/__tests__/charges.test.ts`
Expected: PASS — all 4 tests

- [ ] **Step 5: Commit**

```bash
git add src/components/icons/heraldry/charges.ts src/components/icons/__tests__/charges.test.ts
git commit -m "feat(icons): add 8 heraldic charge symbols for reach domains"
```

---

### Task 5: Border Ornamentation

**Files:**
- Create: `src/components/icons/heraldry/borders.ts`
- Test: `src/components/icons/__tests__/borders.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/components/icons/__tests__/borders.test.ts
import { describe, it, expect } from 'vitest';
import { renderBorder } from '../heraldry/borders';

describe('renderBorder', () => {
  it('renders base border as single stroke', () => {
    const svg = renderBorder('base', '#aa8866');
    expect(svg).toContain('stroke="#aa8866"');
    // Base = single path
    expect(svg.match(/<path/g)?.length).toBe(1);
  });

  it('renders established border as double line', () => {
    const svg = renderBorder('established', '#aa8866');
    // Double line = 2 paths
    expect(svg.match(/<path/g)?.length).toBe(2);
  });

  it('renders dominant border with ornaments', () => {
    const svg = renderBorder('dominant', '#aa8866');
    // Double line + corner ornaments
    expect(svg.match(/<path/g)!.length).toBeGreaterThanOrEqual(2);
    expect(svg).toContain('circle'); // corner ornaments
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/icons/__tests__/borders.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the borders module**

```typescript
// src/components/icons/heraldry/borders.ts
import type { ProminenceLevel } from '../constants';
import { SHIELD_PATH } from './shields';

/**
 * Renders border ornamentation based on faction prominence.
 * Returns SVG elements to draw on top of the shield.
 */
export function renderBorder(level: ProminenceLevel, color: string): string {
  switch (level) {
    case 'base':
      return `<path d="${SHIELD_PATH}" fill="none" stroke="${color}" stroke-width="2.5"/>`;

    case 'established':
      return [
        `<path d="${SHIELD_PATH}" fill="none" stroke="${color}" stroke-width="3"/>`,
        `<path d="${SHIELD_PATH}" fill="none" stroke="${color}" stroke-width="1" stroke-dasharray="4 3" opacity="0.5"/>`,
      ].join('');

    case 'dominant':
      return [
        `<path d="${SHIELD_PATH}" fill="none" stroke="${color}" stroke-width="3.5"/>`,
        `<path d="${SHIELD_PATH}" fill="none" stroke="${color}" stroke-width="1" stroke-dasharray="4 3" opacity="0.5"/>`,
        // Corner ornaments at shield shoulders and base
        `<circle cx="18" cy="14" r="3" fill="${color}"/>`,
        `<circle cx="102" cy="14" r="3" fill="${color}"/>`,
        `<circle cx="60" cy="140" r="3" fill="${color}"/>`,
      ].join('');
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/icons/__tests__/borders.test.ts`
Expected: PASS — all 3 tests

- [ ] **Step 5: Commit**

```bash
git add src/components/icons/heraldry/borders.ts src/components/icons/__tests__/borders.test.ts
git commit -m "feat(icons): add border ornamentation by prominence level"
```

---

### Task 6: CoatOfArms Component & Generator

**Files:**
- Create: `src/components/icons/CoatOfArms.tsx`
- Test: `src/components/icons/__tests__/CoatOfArms.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// src/components/icons/__tests__/CoatOfArms.test.tsx
import { describe, it, expect } from 'vitest';
import {
  generateCoatOfArmsSvg,
  buildCoatOfArmsConfig,
} from '../CoatOfArms';
import type { FactionDefinition } from '../../../types/faction';
import type { ReachDomain } from '../../../types/traits';

// Minimal faction definition for testing
const mockFaction: FactionDefinition = {
  id: 'test_military',
  nameTemplate: 'Test Legion',
  description: 'Test',
  iconGlyph: '⚔',
  themeColor: '#ff0000',
  factionType: 'military',
  reachWeights: { iron: 0.8, eye: 0.5, stone: 0.3 } as Partial<Record<ReachDomain, number>>,
  locationTypes: [],
  rankTiers: [],
  reputationDecayPerTick: 0,
  joinEncounterTemplateId: '',
  promotionEncounterTemplateId: '',
  questTemplateIds: [],
  socialTemplateIds: [],
  expulsionConsequences: [],
};

describe('buildCoatOfArmsConfig', () => {
  it('derives config from faction definition', () => {
    const config = buildCoatOfArmsConfig(mockFaction);
    expect(config.factionType).toBe('military');
    expect(config.dominantReach).toBe('iron');
    expect(config.dominantSphere).toBe('force');
    expect(config.foundationSphere).toBe('chaos');
    expect(config.prominenceLevel).toBe('base');
  });

  it('identifies secondary reach within 20% of dominant', () => {
    const faction = {
      ...mockFaction,
      reachWeights: { iron: 0.8, eye: 0.7 }, // eye is within 20% of iron
    };
    const config = buildCoatOfArmsConfig(faction);
    expect(config.dominantReach).toBe('iron');
    expect(config.secondaryReach).toBe('eye');
  });

  it('omits secondary reach when gap exceeds 20%', () => {
    const faction = {
      ...mockFaction,
      reachWeights: { iron: 0.8, eye: 0.3 }, // eye is NOT within 20%
    };
    const config = buildCoatOfArmsConfig(faction);
    expect(config.secondaryReach).toBeUndefined();
  });
});

describe('generateCoatOfArmsSvg', () => {
  it('returns valid SVG string', () => {
    const config = buildCoatOfArmsConfig(mockFaction);
    const svg = generateCoatOfArmsSvg(config, 128);
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('viewBox="0 0 120 150"');
  });

  it('includes shield path', () => {
    const config = buildCoatOfArmsConfig(mockFaction);
    const svg = generateCoatOfArmsSvg(config, 128);
    expect(svg).toContain('Q110,138 60,145');
  });

  it('uses military division (per_pale)', () => {
    const config = buildCoatOfArmsConfig(mockFaction);
    const svg = generateCoatOfArmsSvg(config, 128);
    // per_pale = two vertical rects
    expect(svg).toContain('width="50"');
  });

  it('includes charge for iron (crossed swords)', () => {
    const config = buildCoatOfArmsConfig(mockFaction);
    const svg = generateCoatOfArmsSvg(config, 128);
    // Iron charge has crossing lines
    expect(svg).toContain('stroke-linecap="round"');
  });

  it('omits secondary charge at small sizes', () => {
    const faction = {
      ...mockFaction,
      reachWeights: { iron: 0.8, eye: 0.7 },
    };
    const config = buildCoatOfArmsConfig(faction);
    const smallSvg = generateCoatOfArmsSvg(config, 24);
    const largeSvg = generateCoatOfArmsSvg(config, 128);
    // Small should have fewer elements
    expect(smallSvg.length).toBeLessThan(largeSvg.length);
  });

  it('falls back to iconGlyph on plain shield when no reachWeights', () => {
    const faction = {
      ...mockFaction,
      reachWeights: {} as Partial<Record<ReachDomain, number>>,
    };
    const config = buildCoatOfArmsConfig(faction, '⚔');
    const svg = generateCoatOfArmsSvg(config, 128);
    // Should still produce valid SVG
    expect(svg).toContain('<svg');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/icons/__tests__/CoatOfArms.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Write the CoatOfArms module**

```typescript
// src/components/icons/CoatOfArms.tsx
import React, { useMemo } from 'react';
import type { FactionType, FactionDefinition } from '../../types/faction';
import type { ReachDomain } from '../../types/traits';
import type { CreationSphereName, FoundationSphereName } from '../../types/index';
import {
  DIVISION_BY_FACTION_TYPE,
  REACH_TO_SPHERE,
  SPHERE_TO_FOUNDATION,
  SMALL_SIZE_THRESHOLD,
} from './constants';
import type { ProminenceLevel } from './constants';
import { SHIELD_VIEWBOX, renderShieldBase } from './heraldry/shields';
import { renderDivision } from './heraldry/divisions';
import { renderCharge } from './heraldry/charges';
import { renderBorder } from './heraldry/borders';
import { deriveTinctures } from './heraldry/tinctures';

// ── Config ──

export interface CoatOfArmsConfig {
  factionType: FactionType;
  dominantReach: ReachDomain | null;
  secondaryReach?: ReachDomain;
  dominantSphere: CreationSphereName | null;
  foundationSphere: FoundationSphereName | null;
  prominenceLevel: ProminenceLevel;
  fallbackGlyph?: string;
  fallbackColor?: string;
}

/** 20% threshold for secondary reach inclusion */
const SECONDARY_REACH_THRESHOLD = 0.2;

/**
 * Build a CoatOfArmsConfig from a FactionDefinition.
 * Pure function — same inputs = same config.
 */
export function buildCoatOfArmsConfig(
  def: FactionDefinition,
  fallbackGlyph?: string,
  prominenceLevel: ProminenceLevel = 'base',
): CoatOfArmsConfig {
  // Find dominant and secondary reaches from reachWeights
  const entries = Object.entries(def.reachWeights) as [ReachDomain, number][];
  entries.sort((a, b) => b[1] - a[1]);

  const dominantReach = entries.length > 0 ? entries[0][0] : null;
  const dominantWeight = entries.length > 0 ? entries[0][1] : 0;

  let secondaryReach: ReachDomain | undefined;
  if (entries.length > 1) {
    const secondaryWeight = entries[1][1];
    if (dominantWeight > 0 && (dominantWeight - secondaryWeight) / dominantWeight <= SECONDARY_REACH_THRESHOLD) {
      secondaryReach = entries[1][0];
    }
  }

  const dominantSphere = dominantReach ? REACH_TO_SPHERE[dominantReach] : null;
  const foundationSphere = dominantSphere ? SPHERE_TO_FOUNDATION[dominantSphere] : null;

  return {
    factionType: def.factionType,
    dominantReach,
    secondaryReach,
    dominantSphere,
    foundationSphere,
    prominenceLevel,
    fallbackGlyph: fallbackGlyph ?? def.iconGlyph,
    fallbackColor: def.themeColor,
  };
}

// ── SVG Generator ──

/**
 * Generate a complete coat of arms SVG string.
 * Pure function — same config + size = same output.
 */
export function generateCoatOfArmsSvg(config: CoatOfArmsConfig, size: number): string {
  const { width, height } = SHIELD_VIEWBOX;
  const clipId = `coa-clip-${config.factionType}`;
  const isSmall = size < SMALL_SIZE_THRESHOLD;

  // Fallback: no dominant reach → plain shield with glyph
  if (!config.dominantReach || !config.dominantSphere || !config.foundationSphere) {
    const fill = config.fallbackColor ?? '#555555';
    return [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${Math.round(size * height / width)}" viewBox="0 0 ${width} ${height}">`,
      renderShieldBase(fill, '#8a6050', 2.5, clipId),
      config.fallbackGlyph
        ? `<text x="60" y="85" text-anchor="middle" fill="#e0ddd4" font-size="36">${config.fallbackGlyph}</text>`
        : '',
      `</svg>`,
    ].join('');
  }

  const tinctures = deriveTinctures(config.dominantReach);
  const division = DIVISION_BY_FACTION_TYPE[config.factionType];

  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${Math.round(size * height / width)}" viewBox="0 0 ${width} ${height}">`,
    // Shield base with clip path
    renderShieldBase(tinctures.secondary, tinctures.foundation, 2.5, clipId),
    // Field division
    renderDivision(division, { primary: tinctures.primary, secondary: tinctures.secondary }, clipId),
    // Primary charge
    renderCharge(config.dominantReach, tinctures.charge, isSmall ? 0.7 : 1.0),
  ];

  // Secondary charge (only at larger sizes)
  if (!isSmall && config.secondaryReach) {
    // Place secondary charge in chief (upper area)
    parts.push(renderCharge(config.secondaryReach, tinctures.charge, 0.4, 85, 30));
  }

  // Border ornamentation (only at larger sizes)
  if (isSmall) {
    parts.push(`<path d="M10,8 L110,8 L110,95 Q110,138 60,145 Q10,138 10,95 Z" fill="none" stroke="${tinctures.foundation}" stroke-width="2.5"/>`);
  } else {
    parts.push(renderBorder(config.prominenceLevel, tinctures.foundation));
  }

  parts.push('</svg>');
  return parts.join('');
}

// ── React Component ──

interface CoatOfArmsProps {
  /** Faction definition to derive the coat of arms from */
  definition: FactionDefinition;
  /** Display size in pixels (width) */
  size: number;
  /** Prominence level override (default: 'base') */
  prominenceLevel?: ProminenceLevel;
  /** Additional CSS class */
  className?: string;
}

export const CoatOfArms = React.memo(function CoatOfArms({
  definition,
  size,
  prominenceLevel = 'base',
  className,
}: CoatOfArmsProps) {
  const svgString = useMemo(() => {
    const config = buildCoatOfArmsConfig(definition, undefined, prominenceLevel);
    return generateCoatOfArmsSvg(config, size);
  }, [definition, size, prominenceLevel]);

  return (
    <span
      className={className}
      style={{ display: 'inline-block', width: size, height: Math.round(size * SHIELD_VIEWBOX.height / SHIELD_VIEWBOX.width) }}
      dangerouslySetInnerHTML={{ __html: svgString }}
    />
  );
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/icons/__tests__/CoatOfArms.test.tsx`
Expected: PASS — all 8 tests

- [ ] **Step 5: Commit**

```bash
git add src/components/icons/CoatOfArms.tsx src/components/icons/__tests__/CoatOfArms.test.tsx
git commit -m "feat(icons): add CoatOfArms SVG generator and React component"
```

---

### Task 7: SphereIcon Component

**Files:**
- Create: `src/components/icons/SphereIcon.tsx`
- Test: `src/components/icons/__tests__/SphereIcon.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// src/components/icons/__tests__/SphereIcon.test.tsx
import { describe, it, expect } from 'vitest';
import { generateSphereIconSvg } from '../SphereIcon';
import { SPHERE_NAMES } from '../../../types/index';
import { SPHERE_COLORS } from '../constants';

describe('generateSphereIconSvg', () => {
  it('returns valid SVG for all 12 spheres', () => {
    for (const sphere of SPHERE_NAMES) {
      const svg = generateSphereIconSvg(sphere, 36);
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      expect(svg).toContain('circle'); // outer circle shape
    }
  });

  it('uses canonical sphere color', () => {
    const svg = generateSphereIconSvg('force', 36);
    expect(svg).toContain(SPHERE_COLORS.force); // #ff6b6b
  });

  it('sets width and height from size param', () => {
    const svg = generateSphereIconSvg('mind', 48);
    expect(svg).toContain('width="48"');
    expect(svg).toContain('height="48"');
  });

  it('contains a unique symbol per sphere', () => {
    const svgs = SPHERE_NAMES.map(s => generateSphereIconSvg(s, 36));
    // Each should have distinct inner content (at minimum, different colors)
    const uniqueSvgs = new Set(svgs);
    expect(uniqueSvgs.size).toBe(12);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/icons/__tests__/SphereIcon.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Write the SphereIcon module**

```typescript
// src/components/icons/SphereIcon.tsx
import React, { useMemo } from 'react';
import type { SphereName } from '../../types/index';
import { SPHERE_COLORS } from './constants';

/** Darken a hex color for background tint */
function tintBg(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 0xff) * 0.15);
  const g = Math.round(((n >> 8) & 0xff) * 0.15);
  const b = Math.round((n & 0xff) * 0.15);
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}

type SymbolFn = (c: string) => string;

const SPHERE_SYMBOLS: Record<SphereName, SymbolFn> = {
  // Creation spheres
  force: (c) => [
    `<line x1="-6" y1="-8" x2="6" y2="8" stroke="${c}" stroke-width="2.5" stroke-linecap="round"/>`,
    `<line x1="6" y1="-8" x2="-6" y2="8" stroke="${c}" stroke-width="2.5" stroke-linecap="round"/>`,
    `<line x1="0" y1="-10" x2="0" y2="10" stroke="${c}" stroke-width="2.5" stroke-linecap="round"/>`,
  ].join(''),

  matter: (c) => {
    const pts: string[] = [];
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      pts.push(`${(Math.cos(a) * 10).toFixed(1)},${(Math.sin(a) * 10).toFixed(1)}`);
    }
    return `<polygon points="${pts.join(' ')}" fill="none" stroke="${c}" stroke-width="2"/>`;
  },

  energy: (c) => [
    `<circle cx="0" cy="0" r="5" fill="${c}" opacity="0.5"/>`,
    ...Array.from({ length: 8 }, (_, i) => {
      const a = (Math.PI / 4) * i;
      const x1 = Math.cos(a) * 7, y1 = Math.sin(a) * 7;
      const x2 = Math.cos(a) * 12, y2 = Math.sin(a) * 12;
      return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${c}" stroke-width="1.5"/>`;
    }),
  ].join(''),

  life: (c) => [
    `<path d="M0,-10 Q8,-4 0,2 Q-8,-4 0,-10" fill="${c}" opacity="0.6"/>`,
    `<path d="M0,10 Q-8,4 0,-2 Q8,4 0,10" fill="${c}" opacity="0.6"/>`,
    `<circle cx="0" cy="0" r="3" fill="${c}"/>`,
  ].join(''),

  mind: (c) => [
    `<circle cx="0" cy="0" r="10" fill="none" stroke="${c}" stroke-width="1.5"/>`,
    `<circle cx="0" cy="0" r="6" fill="none" stroke="${c}" stroke-width="1.5"/>`,
    `<circle cx="0" cy="0" r="2.5" fill="${c}"/>`,
  ].join(''),

  spirit: (c) => {
    const pts: string[] = [];
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      const r = i % 2 === 0 ? 12 : 6;
      pts.push(`${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`);
    }
    return `<polygon points="${pts.join(' ')}" fill="none" stroke="${c}" stroke-width="2"/>` +
      `<circle cx="0" cy="0" r="3" fill="${c}" opacity="0.5"/>`;
  },

  time: (c) => [
    `<path d="M-6,-10 L6,-10 L2,-1 L6,1 L-6,1 L-2,-1 Z" fill="none" stroke="${c}" stroke-width="1.5"/>`,
    `<path d="M-6,10 L6,10 L2,1 L-2,1 Z" fill="none" stroke="${c}" stroke-width="1.5"/>`,
  ].join(''),

  entropy: (c) => [
    `<rect x="-3" y="-10" width="4" height="4" fill="${c}" opacity="0.8" transform="rotate(15)"/>`,
    `<rect x="4" y="-4" width="3" height="3" fill="${c}" opacity="0.6" transform="rotate(-10)"/>`,
    `<rect x="-8" y="2" width="5" height="5" fill="${c}" opacity="0.7" transform="rotate(25)"/>`,
    `<rect x="2" y="5" width="4" height="4" fill="${c}" opacity="0.5" transform="rotate(-20)"/>`,
    `<rect x="-4" y="-3" width="3" height="3" fill="${c}" opacity="0.4" transform="rotate(8)"/>`,
  ].join(''),

  // Foundation spheres
  chaos: (c) => {
    const lines = Array.from({ length: 7 }, (_, i) => {
      const a = (Math.PI * 2 / 7) * i + 0.3;
      const r = 8 + (i % 3) * 3;
      return `<line x1="0" y1="0" x2="${(Math.cos(a) * r).toFixed(1)}" y2="${(Math.sin(a) * r).toFixed(1)}" stroke="${c}" stroke-width="1.5"/>`;
    });
    return lines.join('') + `<circle cx="0" cy="0" r="2" fill="${c}"/>`;
  },

  order: (c) => [
    `<rect x="-8" y="-8" width="16" height="16" fill="none" stroke="${c}" stroke-width="1.5" transform="rotate(0)"/>`,
    `<rect x="-6" y="-6" width="12" height="12" fill="none" stroke="${c}" stroke-width="1.5" transform="rotate(45)"/>`,
  ].join(''),

  light: (c) => [
    `<circle cx="0" cy="0" r="6" fill="${c}" opacity="0.6"/>`,
    ...Array.from({ length: 12 }, (_, i) => {
      const a = (Math.PI / 6) * i;
      const r1 = 8, r2 = i % 2 === 0 ? 13 : 10;
      return `<line x1="${(Math.cos(a) * r1).toFixed(1)}" y1="${(Math.sin(a) * r1).toFixed(1)}" x2="${(Math.cos(a) * r2).toFixed(1)}" y2="${(Math.sin(a) * r2).toFixed(1)}" stroke="${c}" stroke-width="1.5"/>`;
    }),
  ].join(''),

  darkness: (c) => [
    `<circle cx="0" cy="0" r="10" fill="${c}" opacity="0.5"/>`,
    `<circle cx="4" cy="-2" r="9" fill="${tintBg(c)}"/>`,
  ].join(''),
};

/** Generate raw SVG string for a sphere icon */
export function generateSphereIconSvg(sphere: SphereName, size: number): string {
  const color = SPHERE_COLORS[sphere];
  const bg = tintBg(color);
  const half = size / 2;
  const r = half - 1;

  const symbolFn = SPHERE_SYMBOLS[sphere];
  const symbol = symbolFn(color);

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
    `<circle cx="${half}" cy="${half}" r="${r}" fill="${bg}" stroke="${color}" stroke-width="1.5"/>`,
    `<g transform="translate(${half},${half})">${symbol}</g>`,
    `</svg>`,
  ].join('');
}

/** React component wrapper */
interface SphereIconProps {
  sphere: SphereName;
  size: number;
  className?: string;
}

export const SphereIcon = React.memo(function SphereIcon({ sphere, size, className }: SphereIconProps) {
  const svgString = useMemo(() => generateSphereIconSvg(sphere, size), [sphere, size]);

  return (
    <span
      className={className}
      style={{ display: 'inline-block', width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svgString }}
    />
  );
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/icons/__tests__/SphereIcon.test.tsx`
Expected: PASS — all 4 tests

- [ ] **Step 5: Commit**

```bash
git add src/components/icons/SphereIcon.tsx src/components/icons/__tests__/SphereIcon.test.tsx
git commit -m "feat(icons): add SphereIcon SVG generator for all 12 spheres"
```

---

### Task 8: ReachIcon Component

**Files:**
- Create: `src/components/icons/ReachIcon.tsx`
- Test: `src/components/icons/__tests__/ReachIcon.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// src/components/icons/__tests__/ReachIcon.test.tsx
import { describe, it, expect } from 'vitest';
import { generateReachIconSvg } from '../ReachIcon';
import { REACH_DOMAINS } from '../../../types/traits';
import { SPHERE_COLORS, REACH_TO_SPHERE } from '../constants';

describe('generateReachIconSvg', () => {
  it('returns valid SVG for all 8 reaches', () => {
    for (const reach of REACH_DOMAINS) {
      const svg = generateReachIconSvg(reach, 36);
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      expect(svg).toContain('rect'); // rounded-rect shape
    }
  });

  it('uses canonical sphere color for the reach', () => {
    const svg = generateReachIconSvg('iron', 36);
    const sphereColor = SPHERE_COLORS[REACH_TO_SPHERE.iron]; // #ff6b6b
    expect(svg).toContain(sphereColor);
  });

  it('sets correct dimensions', () => {
    const svg = generateReachIconSvg('heart', 48);
    expect(svg).toContain('width="48"');
    expect(svg).toContain('height="48"');
  });

  it('produces unique SVG per reach', () => {
    const svgs = REACH_DOMAINS.map(r => generateReachIconSvg(r, 36));
    const uniqueSvgs = new Set(svgs);
    expect(uniqueSvgs.size).toBe(8);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/icons/__tests__/ReachIcon.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Write the ReachIcon module**

```typescript
// src/components/icons/ReachIcon.tsx
import React, { useMemo } from 'react';
import type { ReachDomain } from '../../types/traits';
import { SPHERE_COLORS, REACH_TO_SPHERE } from './constants';
import { renderCharge } from './heraldry/charges';

/** Darken a hex color for background tint */
function tintBg(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 0xff) * 0.15);
  const g = Math.round(((n >> 8) & 0xff) * 0.15);
  const b = Math.round((n & 0xff) * 0.15);
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}

/** Generate raw SVG string for a reach icon */
export function generateReachIconSvg(reach: ReachDomain, size: number): string {
  const sphere = REACH_TO_SPHERE[reach];
  const color = SPHERE_COLORS[sphere];
  const bg = tintBg(color);
  const half = size / 2;
  const rx = Math.round(size * 0.11); // ~4px at 36px

  // Charge scaled to fit inside the rounded rect
  const chargeScale = size / 72; // charges designed at ~72px
  const charge = renderCharge(reach, color, chargeScale, half, half);

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
    `<rect x="1" y="1" width="${size - 2}" height="${size - 2}" rx="${rx}" fill="${bg}" stroke="${color}" stroke-width="1.5"/>`,
    charge,
    `</svg>`,
  ].join('');
}

/** React component wrapper */
interface ReachIconProps {
  reach: ReachDomain;
  size: number;
  className?: string;
}

export const ReachIcon = React.memo(function ReachIcon({ reach, size, className }: ReachIconProps) {
  const svgString = useMemo(() => generateReachIconSvg(reach, size), [reach, size]);

  return (
    <span
      className={className}
      style={{ display: 'inline-block', width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svgString }}
    />
  );
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/icons/__tests__/ReachIcon.test.tsx`
Expected: PASS — all 4 tests

- [ ] **Step 5: Commit**

```bash
git add src/components/icons/ReachIcon.tsx src/components/icons/__tests__/ReachIcon.test.tsx
git commit -m "feat(icons): add ReachIcon SVG generator for all 8 reaches"
```

---

### Task 9: Public Exports

**Files:**
- Create: `src/components/icons/index.ts`

- [ ] **Step 1: Create the barrel export**

```typescript
// src/components/icons/index.ts
export { CoatOfArms, generateCoatOfArmsSvg, buildCoatOfArmsConfig } from './CoatOfArms';
export type { CoatOfArmsConfig } from './CoatOfArms';

export { SphereIcon, generateSphereIconSvg } from './SphereIcon';
export { ReachIcon, generateReachIconSvg } from './ReachIcon';

export {
  SPHERE_COLORS,
  REACH_TO_SPHERE,
  SPHERE_TO_FOUNDATION,
  DIVISION_BY_FACTION_TYPE,
  BORDER_THRESHOLDS,
  SMALL_SIZE_THRESHOLD,
} from './constants';
export type { DivisionType, ProminenceLevel } from './constants';
```

- [ ] **Step 2: Verify all tests still pass**

Run: `npx vitest run src/components/icons/`
Expected: PASS — all tests across all icon modules

- [ ] **Step 3: Type check**

Run: `npx tsc --noEmit`
Expected: Clean — no type errors

- [ ] **Step 4: Commit**

```bash
git add src/components/icons/index.ts
git commit -m "feat(icons): add barrel exports for coat of arms and icon system"
```

---

### Task 10: Integrate CoatOfArms into FactionSheet

**Files:**
- Modify: `src/components/Game/FactionSheet.tsx`

- [ ] **Step 1: Read the current FactionSheet to confirm exact lines**

Run: Read `src/components/Game/FactionSheet.tsx` and note the exact `iconGlyph` usage (around line 37) and imports.

- [ ] **Step 2: Add import for CoatOfArms**

At the top of `FactionSheet.tsx`, add:

```typescript
import { CoatOfArms } from '../icons';
```

- [ ] **Step 3: Replace iconGlyph with CoatOfArms component**

Find the line that renders the icon glyph (approximately line 37):

```typescript
<span style={{ color: definition.themeColor }}>{definition.iconGlyph}</span>
```

Replace with:

```typescript
<CoatOfArms definition={definition} size={48} />
```

Keep `themeColor` usage for badges and bars — only replace the glyph display.

- [ ] **Step 4: Verify the build compiles**

Run: `npx tsc --noEmit`
Expected: Clean

- [ ] **Step 5: Commit**

```bash
git add src/components/Game/FactionSheet.tsx
git commit -m "feat(icons): replace iconGlyph with CoatOfArms in FactionSheet"
```

---

### Task 11: Integrate CoatOfArms into FactionEntry (Chronicle)

**Files:**
- Modify: `src/components/Game/chronicle/FactionEntry.tsx`

- [ ] **Step 1: Read the current FactionEntry to confirm exact lines**

Run: Read `src/components/Game/chronicle/FactionEntry.tsx` and note the hardcoded `⬡` (around line 58) and props.

- [ ] **Step 2: Add factionId prop and CoatOfArms import**

The FactionEntry currently doesn't receive the faction definition. Add a `factionDef` prop (optional, for backwards compatibility):

```typescript
import { CoatOfArms } from '../../icons';
import type { FactionDefinition } from '../../../types/faction';

interface FactionEntryProps {
  name: string;
  guildType: string;
  locationName: string;
  onClick?: () => void;
  factionDef?: FactionDefinition;  // NEW — optional for backwards compat
}
```

- [ ] **Step 3: Replace hardcoded hexagon with CoatOfArms**

Replace the `⬡` span with:

```typescript
{factionDef ? (
  <CoatOfArms definition={factionDef} size={24} />
) : (
  <span style={{ /* existing styles */ }}>⬡</span>
)}
```

- [ ] **Step 4: Update call sites to pass factionDef**

Find where `FactionEntry` is rendered and pass the `factionDef` prop. This is likely in a chronicle or event list component. Search for `<FactionEntry` usage and add the prop where the definition is available.

- [ ] **Step 5: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: Clean

- [ ] **Step 6: Commit**

```bash
git add src/components/Game/chronicle/FactionEntry.tsx
git commit -m "feat(icons): replace hardcoded hexagon with CoatOfArms in chronicle"
```

---

### Task 12: Integrate CoatOfArms into ArmyLayer (Hex Map)

**Files:**
- Modify: `src/components/HexMapV2/scene/ArmyLayer.ts`

- [ ] **Step 1: Read current ArmyLayer texture generation**

Run: Read `src/components/HexMapV2/scene/ArmyLayer.ts` and understand the `getArmyTexture` function and how `ArmyRenderData.factionColor` is used.

- [ ] **Step 2: Add coat of arms texture cache**

At the top of ArmyLayer.ts, add a texture cache and SVG-to-canvas rasterizer:

```typescript
import { generateCoatOfArmsSvg, buildCoatOfArmsConfig } from '../../icons';
import { FACTION_DEFINITIONS } from '../../../data/faction-definitions';

const coaTextureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Rasterize an SVG string to a Three.js CanvasTexture.
 * Returns a cached texture if available.
 */
function getCoatOfArmsTexture(factionId: string, size: number): THREE.CanvasTexture | null {
  const cacheKey = `${factionId}-${size}`;
  const cached = coaTextureCache.get(cacheKey);
  if (cached) return cached;

  const definition = FACTION_DEFINITIONS.get(factionId);
  if (!definition) return null;

  const config = buildCoatOfArmsConfig(definition);
  const svgString = generateCoatOfArmsSvg(config, size);

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = Math.round(size * 150 / 120); // shield aspect ratio
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const img = new Image();
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);

  // Note: Image loading is async. For the initial frame, return null
  // and update on next frame when loaded.
  img.onload = () => {
    ctx.drawImage(img, 0, 0, size, canvas.height);
    URL.revokeObjectURL(url);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    coaTextureCache.set(cacheKey, texture);
  };
  img.src = url;

  return null; // Async — will be available on next query
}
```

- [ ] **Step 3: Update army rendering to use coat of arms texture**

In the army sprite creation, attempt to use coat of arms texture first, fall back to existing colored circle:

```typescript
// In the army render loop, where sprites are created:
const coaTexture = getCoatOfArmsTexture(army.factionId, ARMY_TEXTURE_SIZE);
const texture = coaTexture ?? getArmyTexture(army.factionColor, army.size);
```

This requires `ArmyRenderData` to include `factionId`. Add it:

```typescript
export interface ArmyRenderData {
  id: string;
  factionId: string;  // NEW
  hexCol: number;
  hexRow: number;
  size: 'warband' | 'regiment' | 'host';
  factionColor: string;
}
```

- [ ] **Step 4: Update army data extraction to include factionId**

Find where `ArmyRenderData` is populated (likely in the hook or data extraction that feeds ArmyLayer) and ensure `factionId` is passed through from the army's `member_of` edge.

- [ ] **Step 5: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: Clean

- [ ] **Step 6: Run all tests**

Run: `npm test`
Expected: PASS — no regressions

- [ ] **Step 7: Commit**

```bash
git add src/components/HexMapV2/scene/ArmyLayer.ts
git commit -m "feat(icons): integrate coat of arms textures into hex map army markers"
```

---

### Task 13: Full Build Verification & Final Commit

**Files:** None new — verification only

- [ ] **Step 1: Run all tests**

Run: `npm test`
Expected: PASS — all tests green

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: Clean — no type errors

- [ ] **Step 3: Production build**

Run: `npx vite build`
Expected: Build succeeds — confirms Vercel will deploy

- [ ] **Step 4: Visual verification**

Start dev server and verify in browser at `?view=game`:
- Open a faction sheet → coat of arms renders at 128px
- Check chronicle entries → small coat of arms at 24px
- Look at army markers on hex map → coat of arms shields instead of colored circles

- [ ] **Step 5: Push to GitHub**

```bash
git push
```

Expected: Vercel auto-deploys from main.
