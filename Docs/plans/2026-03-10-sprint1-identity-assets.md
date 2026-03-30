# Sprint 1: Identity Assets — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace emoji/Unicode sphere icons with generated art, fill terrain tile gaps, and create the first key screen painting — transforming the game's visual identity from placeholder to Threadbare.

**Architecture:** Generate images via MCP `generate_image` tool using STYLE.md prompts. Sphere icons get a new `<img>`-based rendering path in `SphereIcon.tsx` with Unicode glyph fallback. Hex tiles run through Python hex-mask pipeline. Title screen is a standalone 16:9 painting placed in `/public/screens/`.

**Tech Stack:** MCP image generation (Google Imagen), Python/Pillow hex masking, React/TypeScript component updates, Vitest tests.

**Reference files:**
- `STYLE.md` — Visual bible (sphere colors, form language, prompt templates)
- `src/data/sphereIcons.ts` — Sphere icon definitions (colors, symbols, form language)
- `src/components/shared/SphereIcon.tsx` — Sphere icon React component
- `src/data/hex-tile-assets.ts` — Hex tile asset registry
- `scripts/generate-hex-tile.py` — Hex mask functions (`make_hex_mask`, `apply_hex_mask`)

---

## Task 1: Create Directory Structure

**Files:**
- Create: `public/icons/spheres/` directory
- Create: `public/screens/` directory

**Step 1: Create directories**

```bash
mkdir -p public/icons/spheres public/screens
```

**Step 2: Verify**

```bash
ls -la public/icons/spheres/ public/screens/
```

Expected: Empty directories exist.

**Step 3: Commit**

```bash
git add public/icons/spheres/.gitkeep public/screens/.gitkeep
git commit -m "chore: add directories for sphere icons and screen paintings"
```

---

## Task 2: Generate 8 Creation Sphere Icons

Generate one 1:1 icon per creation sphere using MCP `generate_image`. Each icon depicts the sphere's form language as a glowing thread pattern on a dark background.

**Files:**
- Create: `public/icons/spheres/force.png`
- Create: `public/icons/spheres/matter.png`
- Create: `public/icons/spheres/energy.png`
- Create: `public/icons/spheres/life.png`
- Create: `public/icons/spheres/mind.png`
- Create: `public/icons/spheres/spirit.png`
- Create: `public/icons/spheres/time.png`
- Create: `public/icons/spheres/entropy.png`

**Prompt template for all sphere icons:**

```
A single abstract magical symbol on a dark charcoal background (#1a1a2e).
[SPHERE] sphere magic: [COLOR] threads forming [FORM LANGUAGE DESCRIPTION].
The symbol is centered, intensely bright and saturated against the darkness.
Painterly oil style with visible brushstrokes. The threads glow with narrow
light halos on the immediately adjacent dark surface.
No text, no UI elements, no border, no frame. Pure abstract magical symbol.
```

**Step 1: Generate Force icon**

MCP `generate_image`:
- prompt: `A single abstract magical symbol on a dark charcoal background (#1a1a2e). Force sphere magic: crimson #ff4444 threads forming sharp directional streaks and impact radiants — lightning-bolt angles, shockwave arcs, explosive lines radiating from a central impact point. The symbol is centered, intensely bright and saturated against the darkness. Painterly oil style with visible brushstrokes. The threads glow with narrow crimson halos on the immediately adjacent dark surface. No text, no UI elements, no border, no frame. Pure abstract magical symbol.`
- aspectRatio: `1:1`
- fileName: `force.png`
- quality: `quality`

Then copy output to `public/icons/spheres/force.png`.

**Step 2: Generate Matter icon**

MCP `generate_image`:
- prompt: `A single abstract magical symbol on a dark charcoal background (#1a1a2e). Matter sphere magic: deep umber-brown #8b6b4a threads forming crystalline lattices and hexagonal facets — hard-edged tessellating crystal formations, angular geometric nodes, mineral-like structures growing outward. The symbol is centered, intensely bright and saturated against the darkness. Painterly oil style with visible brushstrokes. The threads glow with narrow warm brown halos on the immediately adjacent dark surface. No text, no UI elements, no border, no frame. Pure abstract magical symbol.`
- aspectRatio: `1:1`
- fileName: `matter.png`
- quality: `quality`

Then copy output to `public/icons/spheres/matter.png`.

**Step 3: Generate Energy icon**

MCP `generate_image`:
- prompt: `A single abstract magical symbol on a dark charcoal background (#1a1a2e). Energy sphere magic: brilliant gold #ffd700 threads forming radiating spikes and star-burst coronas — flickering flame tongues, electric arcs, solar flare shapes pulsing outward from a bright center like a tiny sun. The symbol is centered, intensely bright and saturated against the darkness. Painterly oil style with visible brushstrokes. The threads glow with narrow golden halos on the immediately adjacent dark surface. No text, no UI elements, no border, no frame. Pure abstract magical symbol.`
- aspectRatio: `1:1`
- fileName: `energy.png`
- quality: `quality`

Then copy output to `public/icons/spheres/energy.png`.

**Step 4: Generate Life icon**

MCP `generate_image`:
- prompt: `A single abstract magical symbol on a dark charcoal background (#1a1a2e). Life sphere magic: vivid emerald #00cc55 threads forming organic branching patterns — veins, roots, mycelium networks, Fibonacci spirals, tendril curls, capillary networks branching like a living thing. The symbol is centered, intensely bright and saturated against the darkness. Painterly oil style with visible brushstrokes. The threads glow with narrow green halos on the immediately adjacent dark surface. No text, no UI elements, no border, no frame. Pure abstract magical symbol.`
- aspectRatio: `1:1`
- fileName: `life.png`
- quality: `quality`

Then copy output to `public/icons/spheres/life.png`.

**Step 5: Generate Mind icon**

MCP `generate_image`:
- prompt: `A single abstract magical symbol on a dark charcoal background (#1a1a2e). Mind sphere magic: electric blue #2288ff threads forming neural dendrite networks and concentric rings — branching like neurons, eye-like nodes at intersections, mandala patterns, clean and precise but complexly branching. The symbol is centered, intensely bright and saturated against the darkness. Painterly oil style with visible brushstrokes. The threads glow with narrow blue halos on the immediately adjacent dark surface. No text, no UI elements, no border, no frame. Pure abstract magical symbol.`
- aspectRatio: `1:1`
- fileName: `mind.png`
- quality: `quality`

Then copy output to `public/icons/spheres/mind.png`.

**Step 6: Generate Spirit icon**

MCP `generate_image`:
- prompt: `A single abstract magical symbol on a dark charcoal background (#1a1a2e). Spirit sphere magic: violet #aa44dd threads forming ascending wisps and ethereal ribbons — smoke-like trails rising upward, ghostly flame shapes, dissolving transparent edges, ethereal ribbons that partially fade into nothing. The symbol is centered, intensely bright and saturated against the darkness. Painterly oil style with visible brushstrokes. The threads glow with narrow violet halos on the immediately adjacent dark surface. No text, no UI elements, no border, no frame. Pure abstract magical symbol.`
- aspectRatio: `1:1`
- fileName: `spirit.png`
- quality: `quality`

Then copy output to `public/icons/spheres/spirit.png`.

**Step 7: Generate Time icon**

MCP `generate_image`:
- prompt: `A single abstract magical symbol on a dark charcoal background (#1a1a2e). Time sphere magic: radiant orange #ff9933 threads forming concentric ripples and overlapping echoes — clock-arc shapes, time-wave rings expanding from a central node, overlapping afterimages of the same thread visible in multiple moments at once, temporal distortion. The symbol is centered, intensely bright and saturated against the darkness. Painterly oil style with visible brushstrokes. The threads glow with narrow orange halos on the immediately adjacent dark surface. No text, no UI elements, no border, no frame. Pure abstract magical symbol.`
- aspectRatio: `1:1`
- fileName: `time.png`
- quality: `quality`

Then copy output to `public/icons/spheres/time.png`.

**Step 8: Generate Entropy icon**

MCP `generate_image`:
- prompt: `A single abstract magical symbol on a dark charcoal background (#1a1a2e). Entropy sphere magic: ghostly sea-green #5a8a7a threads forming fracturing patterns and scattering particles — cracking and fragmenting at their edges, dissolving into scattered motes, erosion lines, visibly breaking apart and dissipating. The symbol is centered, intensely bright and saturated against the darkness. Painterly oil style with visible brushstrokes. The threads glow with narrow sea-green halos on the immediately adjacent dark surface. No text, no UI elements, no border, no frame. Pure abstract magical symbol.`
- aspectRatio: `1:1`
- fileName: `entropy.png`
- quality: `quality`

Then copy output to `public/icons/spheres/entropy.png`.

**Step 9: Verify all 8 icons exist**

```bash
ls -la public/icons/spheres/
```

Expected: 8 PNG files (force, matter, energy, life, mind, spirit, time, entropy), each >10KB.

---

## Task 3: Generate 4 Foundation Sphere Icons

Same process as Task 2 but for the four Foundation spheres.

**Files:**
- Create: `public/icons/spheres/chaos.png`
- Create: `public/icons/spheres/order.png`
- Create: `public/icons/spheres/light.png`
- Create: `public/icons/spheres/darkness.png`

**Step 1: Generate Chaos icon**

MCP `generate_image`:
- prompt: `A single abstract magical symbol on a dark charcoal background (#1a1a2e). Chaos sphere magic: neutral grey #8a8a8e energy forming fractals and turbulent swirls — every tendril branches unpredictably in a different direction, no repeating pattern, like fractal lightning or turbulent fluid dynamics. The symbol is centered, intensely bright against the darkness. Painterly oil style with visible brushstrokes. No text, no UI elements, no border, no frame. Pure abstract magical symbol.`
- aspectRatio: `1:1`
- fileName: `chaos.png`
- quality: `quality`

**Step 2: Generate Order icon**

MCP `generate_image`:
- prompt: `A single abstract magical symbol on a dark charcoal background (#1a1a2e). Order sphere magic: golden #d4af37 light forming geometric grids and tessellations — clean straight lines in repeating symmetrical patterns, sacred geometry, crystalline lattice structures, precise and harmonious. The symbol is centered, intensely bright against the darkness. Painterly oil style with visible brushstrokes. No text, no UI elements, no border, no frame. Pure abstract magical symbol.`
- aspectRatio: `1:1`
- fileName: `order.png`
- quality: `quality`

**Step 3: Generate Light icon**

MCP `generate_image`:
- prompt: `A single abstract magical symbol on a dark charcoal background (#1a1a2e). Light sphere magic: warm pale gold #ffeb99 radiance forming expanding aureoles and radiant beams — concentric circles of illumination spreading outward from a bright center point, dawn-like reveal, warm and inviting. The symbol is centered, intensely bright against the darkness. Painterly oil style with visible brushstrokes. No text, no UI elements, no border, no frame. Pure abstract magical symbol.`
- aspectRatio: `1:1`
- fileName: `light.png`
- quality: `quality`

**Step 4: Generate Darkness icon**

MCP `generate_image`:
- prompt: `A single abstract magical symbol on a dark charcoal background (#1a1a2e). Darkness sphere magic: deep indigo #4a3a8a forming absorbing voids with rim-glow — the inverse of light, void-like depths that pull light inward, dark holes edged with faint luminous indigo rims, darkness that consumes. The symbol is centered against the dark background. Painterly oil style with visible brushstrokes. No text, no UI elements, no border, no frame. Pure abstract magical symbol.`
- aspectRatio: `1:1`
- fileName: `darkness.png`
- quality: `quality`

**Step 5: Verify all 12 sphere icons exist**

```bash
ls -la public/icons/spheres/
```

Expected: 12 PNG files total.

**Step 6: Commit**

```bash
git add public/icons/spheres/
git commit -m "art: generate 12 sphere icons (8 creation + 4 foundation)"
```

---

## Task 4: Wire Sphere Icon Images Into Code

Update `sphereIcons.ts` to export image paths. Update `SphereIcon.tsx` to render `<img>` when available with Unicode glyph fallback.

**Files:**
- Modify: `src/data/sphereIcons.ts` — add `imagePath` field to `SphereIconDef`, populate for all 12 spheres
- Modify: `src/components/shared/SphereIcon.tsx` — add `<img>` rendering with fallback
- Test: `src/data/__tests__/sphereIcons.test.ts` — verify image paths
- Test: `src/components/shared/__tests__/SphereIcon.test.tsx` — verify image rendering

**Step 1: Write the failing test for image paths**

In `src/data/__tests__/sphereIcons.test.ts`, add:

```typescript
describe('sphere icon image paths', () => {
  it('every creation sphere has an imagePath', () => {
    for (const [name, def] of Object.entries(SPHERE_ICONS)) {
      expect(def.imagePath, `${name} missing imagePath`).toBeDefined();
      expect(def.imagePath).toMatch(/^\/icons\/spheres\/.*\.png$/);
    }
  });

  it('every foundation sphere has an imagePath', () => {
    for (const [name, def] of Object.entries(FOUNDATION_SPHERE_ICONS)) {
      expect(def.imagePath, `${name} missing imagePath`).toBeDefined();
      expect(def.imagePath).toMatch(/^\/icons\/spheres\/.*\.png$/);
    }
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/data/__tests__/sphereIcons.test.ts
```

Expected: FAIL — `imagePath` does not exist on type `SphereIconDef`.

**Step 3: Add imagePath to SphereIconDef and populate**

In `src/data/sphereIcons.ts`:

Add `imagePath` to the interface:

```typescript
export interface SphereIconDef {
  /** Bright sphere color from STYLE.md (70-100% brightness) */
  color: string;
  /** Unicode geometric symbol (non-emoji) suggesting form language */
  symbol: string;
  /** Form language description for reference */
  formLanguage: string;
  /** Path to generated icon image (relative to public/) */
  imagePath: string;
}
```

Add `imagePath` to every sphere entry:

```typescript
// SPHERE_ICONS entries:
force: { ..., imagePath: '/icons/spheres/force.png' },
matter: { ..., imagePath: '/icons/spheres/matter.png' },
energy: { ..., imagePath: '/icons/spheres/energy.png' },
life: { ..., imagePath: '/icons/spheres/life.png' },
mind: { ..., imagePath: '/icons/spheres/mind.png' },
spirit: { ..., imagePath: '/icons/spheres/spirit.png' },
time: { ..., imagePath: '/icons/spheres/time.png' },
entropy: { ..., imagePath: '/icons/spheres/entropy.png' },

// FOUNDATION_SPHERE_ICONS entries:
chaos: { ..., imagePath: '/icons/spheres/chaos.png' },
order: { ..., imagePath: '/icons/spheres/order.png' },
light: { ..., imagePath: '/icons/spheres/light.png' },
darkness: { ..., imagePath: '/icons/spheres/darkness.png' },
```

Add a new getter function:

```typescript
/**
 * Get the image path for a sphere icon
 */
export function getSphereImagePath(sphereName: string): string | undefined {
  const creation = SPHERE_ICONS[sphereName as SphereName];
  if (creation) return creation.imagePath;

  const foundation = FOUNDATION_SPHERE_ICONS[sphereName as keyof typeof FOUNDATION_SPHERE_ICONS];
  if (foundation) return foundation.imagePath;

  return undefined;
}
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/data/__tests__/sphereIcons.test.ts
```

Expected: PASS

**Step 5: Write failing test for SphereIcon image rendering**

In `src/components/shared/__tests__/SphereIcon.test.tsx`, add:

```typescript
describe('SphereIcon image rendering', () => {
  it('renders an img element when useImage is true', () => {
    const { container } = render(
      <SphereIcon sphereName="force" useImage={true} size="32px" />
    );
    const img = container.querySelector('img');
    expect(img).toBeTruthy();
    expect(img?.src).toContain('/icons/spheres/force.png');
  });

  it('falls back to glyph when useImage is false', () => {
    const { container } = render(
      <SphereIcon sphereName="force" useImage={false} />
    );
    const img = container.querySelector('img');
    expect(img).toBeNull();
    expect(container.textContent).toContain('✦');
  });

  it('defaults to glyph rendering (backward compatible)', () => {
    const { container } = render(<SphereIcon sphereName="force" />);
    const img = container.querySelector('img');
    expect(img).toBeNull();
  });
});
```

**Step 6: Run test to verify it fails**

```bash
npx vitest run src/components/shared/__tests__/SphereIcon.test.tsx
```

Expected: FAIL — `useImage` prop doesn't exist yet.

**Step 7: Update SphereIcon.tsx to support image rendering**

```typescript
import React from 'react';
import { getSphereColor, getSphereSymbol, getSphereImagePath } from '../../data/sphereIcons';

export interface SphereIconProps {
  sphereName: string;
  size?: string | number;
  className?: string;
  style?: React.CSSProperties;
  monochrome?: boolean;
  title?: string;
  /** When true, render the generated image instead of the Unicode glyph */
  useImage?: boolean;
}

export const SphereIcon = React.memo(function SphereIcon({
  sphereName,
  size = '1rem',
  className,
  style,
  monochrome = false,
  title,
  useImage = false,
}: SphereIconProps) {
  const color = getSphereColor(sphereName);
  const symbol = getSphereSymbol(sphereName);
  const imagePath = useImage ? getSphereImagePath(sphereName) : undefined;
  const fontSize = typeof size === 'number' ? `${size}px` : size;

  // Image rendering path
  if (useImage && imagePath) {
    const imgSize = typeof size === 'number' ? size : parseInt(size, 10) || 24;
    return (
      <img
        src={imagePath}
        alt={title || sphereName}
        className={className}
        width={imgSize}
        height={imgSize}
        style={{
          display: 'inline-block',
          objectFit: 'contain',
          ...style,
        }}
      />
    );
  }

  // Glyph fallback (existing behavior)
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize,
        color: monochrome ? 'currentColor' : color,
        lineHeight: 1,
        ...style,
      }}
      title={title}
      aria-label={title || sphereName}
    >
      {symbol}
    </span>
  );
});
```

**Step 8: Run all sphere icon tests**

```bash
npx vitest run src/data/__tests__/sphereIcons.test.ts src/components/shared/__tests__/SphereIcon.test.tsx
```

Expected: ALL PASS

**Step 9: Run full type check**

```bash
npx tsc --noEmit
```

Expected: No errors. Every file importing `SphereIconDef` now gets `imagePath`.

**Step 10: Commit**

```bash
git add src/data/sphereIcons.ts src/components/shared/SphereIcon.tsx src/data/__tests__/sphereIcons.test.ts src/components/shared/__tests__/SphereIcon.test.tsx
git commit -m "feat: add image rendering path to SphereIcon with useImage prop"
```

---

## Task 5: Generate 7 Clear-Tile Replacements

The 7 `clear-*.png` files in `/public/hex-tiles/` are 8KB placeholders. Generate proper painterly terrain tiles and apply hex masking.

**Files:**
- Replace: `public/hex-tiles/clear-desert.png`
- Replace: `public/hex-tiles/clear-forest.png`
- Replace: `public/hex-tiles/clear-grassland.png`
- Replace: `public/hex-tiles/clear-hills.png`
- Replace: `public/hex-tiles/clear-mountains.png`
- Replace: `public/hex-tiles/clear-snow.png`
- Replace: `public/hex-tiles/clear-volcanic.png`

**Clear tiles** are simplified/sparse variants of their biome — same terrain type but with less detail and a more uniform feel. They represent hexes at the edge of the player's vision or recently cleared territory.

**Step 1: Generate raw square tiles via MCP**

For each biome, generate a 1:1 square using the canonical hex prompt template from STYLE.md, but with sparser features ("scattered", "sparse", "few"):

**clear-desert:**
```
Aerial view looking almost straight down at a vast expanse of sandy desert that fills the entire image. Sparse scattered dunes of pale sand with patches of exposed rocky ground between them. Minimal features — mostly flat dry terrain with subtle wind-carved ripples. The sand extends to all edges of the image — no bare ground, no clearings, just continuous desert from edge to edge.

Camera very far above, nearly directly overhead, about 80 degrees from horizontal. Wide shot — individual dunes are small. Dark fantasy oil painting style. Rich impasto brushwork. Dark moody atmosphere, dim overcast lighting. Muted desaturated palette.

No sky. No horizon. No bare ground. No magic, no glowing elements. No text, no UI, no hexagonal shapes. No rivers, no streams. No paths.
```

Repeat pattern for each: **clear-forest** (sparse scattered trees on dark soil), **clear-grassland** (flat dry grass with minimal features), **clear-hills** (gentle low rolling terrain), **clear-mountains** (rocky sparse highland), **clear-snow** (flat snow plain with minimal features), **clear-volcanic** (dark cooled lava with sparse ash).

fileName: `clear-desert-raw.png`, etc. aspectRatio: `1:1`, quality: `quality`

**Step 2: Apply hex masking to all 7 tiles**

Use the `make_hex_mask` and `apply_hex_mask` functions from `scripts/generate-hex-tile.py`:

```python
import sys
sys.path.insert(0, 'scripts')
from PIL import Image

# Import hex masking from generate script
exec(open('scripts/generate-hex-tile.py').read())  # gets make_hex_mask, apply_hex_mask

tiles = ['desert', 'forest', 'grassland', 'hills', 'mountains', 'snow', 'volcanic']
for tile in tiles:
    raw = Image.open(f'/tmp/clear-{tile}-raw.png')
    # Center crop to square if needed, resize to 1024x1024
    size = min(raw.width, raw.height)
    left = (raw.width - size) // 2
    top = (raw.height - size) // 2
    cropped = raw.crop((left, top, left + size, top + size)).resize((1024, 1024))
    mask = make_hex_mask(1024)
    result = apply_hex_mask(cropped, mask)
    result.save(f'public/hex-tiles/clear-{tile}.png', 'PNG')
    print(f'Saved clear-{tile}.png ({result.width}x{result.height})')
```

**Step 3: Verify file sizes are >10KB (not placeholder)**

```bash
ls -la public/hex-tiles/clear-*.png
```

Expected: Each file >50KB (real painted tiles), not 8KB placeholders.

**Step 4: Commit**

```bash
git add public/hex-tiles/clear-*.png
git commit -m "art: replace 7 placeholder clear-tiles with proper painterly terrain"
```

---

## Task 6: Generate Title Screen Painting

Create the first key screen painting establishing the Threadbare visual identity.

**Files:**
- Create: `public/screens/title-screen.png`

**Step 1: Generate via MCP**

MCP `generate_image`:
- prompt: `A dark ancient world seen from high above — crumbling stone ruins, weathered towers, and vast shadowed landscapes stretching to a dim horizon under a deep twilight sky. Through the darkness, thin luminous magic threads of multiple colors pierce the surface — crimson streaks, golden grids, emerald veins, blue dendrites, violet wisps — breaking through at concentrated points and fractures, connecting in a vast invisible web. The threads are intensely bright and thin against the overwhelming darkness, like bioluminescent mycelium through cracks in dark soil. At the center, a faint luminous sphere pulses with all eight colors interwoven — the World-Soul, distant and cosmic. Dark fantasy oil painting in the style of Marc Simonetti and Wayne Barlowe — visible brushstrokes, textural impasto, atmospheric depth. The world exists in perpetual deep twilight; environmental colors sit at 10-40% brightness. Only the magic threads break above 70% brightness. No text, no UI elements, no modern elements.`
- aspectRatio: `16:9`
- fileName: `title-screen.png`
- quality: `quality`

**Step 2: Copy to public**

```bash
cp /path/to/generated/title-screen.png public/screens/title-screen.png
```

**Step 3: Verify**

```bash
ls -la public/screens/title-screen.png
```

Expected: File exists, >100KB.

**Step 4: Commit**

```bash
git add public/screens/title-screen.png
git commit -m "art: add title screen painting — first Threadbare key screen"
```

---

## Task 7: Full Verification

**Files:**
- Run: all existing tests
- Run: type checker
- Verify: asset files present and correctly sized

**Step 1: Run full test suite**

```bash
npm test
```

Expected: ALL PASS (no regressions from icon wiring).

**Step 2: Run type check**

```bash
npx tsc --noEmit
```

Expected: No errors.

**Step 3: Verify asset inventory**

```bash
echo "=== Sphere Icons ==="
ls -la public/icons/spheres/ | wc -l
echo "=== Clear Tiles ==="
ls -la public/hex-tiles/clear-*.png
echo "=== Screens ==="
ls -la public/screens/
```

Expected: 12 sphere icons, 7 clear tiles (each >50KB), 1 title screen.

**Step 4: Final commit (if any cleanup needed)**

```bash
git status
# Only commit if there are remaining changes
```

---

## Task 8: Update Documentation

**Files:**
- Modify: `Docs/changelog.md`
- Update: Notion backlog (mark ART-01, ART-03, ART-05 as complete, note ART-06 was already done)

**Step 1: Update changelog**

Add entry:
```
| 2026-03-10 | public/icons/spheres/ | Generated 12 sphere icons (8 creation + 4 foundation) via MCP | ART-01: Replace emoji placeholders with proper Threadbare sphere art |
| 2026-03-10 | public/hex-tiles/clear-*.png | Replaced 7 placeholder clear-tiles with painterly terrain | ART-05: Fill terrain tile coverage gaps |
| 2026-03-10 | public/screens/title-screen.png | Generated first key screen painting | ART-03: Prove Threadbare visual identity |
| 2026-03-10 | src/data/sphereIcons.ts, src/components/shared/SphereIcon.tsx | Added imagePath field + useImage prop for img-based icon rendering | Code support for ART-01 icons |
```

**Step 2: Update Notion backlog**

Mark completed:
- [x] ART-01: Sphere icon set (12 icons, 64×64px)
- [x] ART-03: Title screen illustration (16:9)
- [x] ART-05: Terrain tile gap fill
- [x] ART-06: Hex map background color fix — **already done** (`#1e1b2e` in HexMap.tsx)

**Step 3: Commit docs**

```bash
git add Docs/changelog.md
git commit -m "docs: update changelog for Sprint 1 identity assets"
```

---

## Summary

| Task | What | Files | Type |
|------|------|-------|------|
| 1 | Create directories | `public/icons/spheres/`, `public/screens/` | Infra |
| 2 | Generate 8 creation sphere icons | 8 PNGs in `public/icons/spheres/` | Art gen |
| 3 | Generate 4 foundation sphere icons | 4 PNGs in `public/icons/spheres/` | Art gen |
| 4 | Wire image icons into code | `sphereIcons.ts`, `SphereIcon.tsx` + tests | Code (TDD) |
| 5 | Generate 7 clear-tile replacements | 7 PNGs in `public/hex-tiles/` | Art gen + pipeline |
| 6 | Generate title screen painting | 1 PNG in `public/screens/` | Art gen |
| 7 | Full verification | Tests + type check + asset inventory | QA |
| 8 | Update documentation | Changelog + Notion | Docs |

**Total new files:** 20 images + code changes to 4 source files
**Estimated time:** 30-45 minutes (most time is MCP image generation)
