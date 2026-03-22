# Phase 6: Locations & Agents - Research

**Researched:** 2026-03-22
**Domain:** Three.js sprite rendering, SVG icon art, HTML overlay labels, bezier animation, agent portrait textures
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Location icon art style:** Black (#1a1a1a) silhouettes, sun-from-right shadow baked into SVG paths, multi-layer opacity depth (0.2–0.7), organic hand-drawn paths. Same pipeline as terrain signifiers.
- **17 distinct location icon types:** All per LIART catalog. Ruin variants (ruined_city, ruined_tower, ruined_village) are crumbled versions of intact counterparts, not a generic rubble icon.
- **One icon per location type:** No per-location variants — locations are specific places.
- **Importance-based sizing:** Capital/city ~80% hex size, town/castle ~60%, hamlet/shrine/camp/other ~40%.
- **Animation: render-loop integrated only.** No external tween library (GSAP, Tween.js etc). Animation state in Three.js render loop, positions interpolated each frame.
- **Activity indicators:** SVG silhouette sprites (same pipeline as location icons) — boot, swords, hourglass, coin, hammer, bandage. Positioned below agent portrait.
- **Event indicators:** Simple sprite with fade-in/out. Divine intervention gets brief flash. No continuous pulse animations.
- **Movement trails:** Port existing SVG MovementTrails logic to Three.js (thin faction-color line fading over ~2s).
- **Agent tiers:** Portrait thumbnails at hero-local, colored dots at regional, hidden at continental/full-world (retinue-only as tiny dots at continental).
- **Retinue agents:** Gold/white border (AGNT-05).
- **Faction heraldic colors:** Saturated/bright, distinct from terrain palette (red, blue, purple, magenta, cyan, orange).

### Claude's Discretion

- Three.js text rendering approach for location labels (HTML overlay vs canvas texture vs SDF text)
- Portrait-to-texture pipeline for agent sprites
- RING layout geometry and agent distribution math (COMP-05)
- Performance optimization for many agents on screen
- Exact zoom thresholds for agent rendering tier switching
- How to handle agent count overflow (>4 per hex → count badge)

### Deferred Ideas (OUT OF SCOPE)

- **Palette contrast tuning:** Terrain color similarity at zoomed-out view (forested_hills, boreal_forest, temperate_forest). Log in impediments/backlog — not Phase 6 scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LOCI-01 | Location icons rendered as black silhouettes via composition system slots | SVG→CanvasTexture→Sprite pattern (same as SignifierMesh); CENTER slot with 'always' suppression of terrain-signifiers (COMP-04 already enforces this) |
| LOCI-02 | Location icon catalog covers capital, city, town, hamlet, castle, fort, tower, temple, shrine, ruins variants, mining, camp, battleground, unexplored_poi | 17 SVG icons needed; see LIART-01 through LIART-17 |
| LOCI-03 | Location name labels rendered below icons with font size scaling by importance | HTML overlay approach (same as RegionLabelOverlay) using camera.project() for world→screen; absolute-positioned divs |
| LOCI-04 | Black text with white halo for readability | text-shadow halo pattern already established in RegionLabelOverlay; reuse LAND_HALO CSS |
| LOCI-05 | Capital markers with red ring/dot per political hierarchy | Extend CapitalMarkers.ts or create LocationMarkers.ts for red ring overlay on capital icons |
| LIART-01 | SVG icon: capital (large castle with banner) | Full-size class (~80% hex); bake sun-from-right shadow; multi-layer paths |
| LIART-02 | SVG icon: city (castle/walled town silhouette) | Large size class (~80% hex) |
| LIART-03 | SVG icon: town (building cluster with spire) | Medium size class (~60% hex) |
| LIART-04 | SVG icon: hamlet (small house cluster) | Small size class (~40% hex) |
| LIART-05 | SVG icon: castle (fortified tower with crenellations) | Medium size class (~60% hex) |
| LIART-06 | SVG icon: fort (square fortification) | Medium size class (~60% hex) |
| LIART-07 | SVG icon: tower (single tall tower) | Small size class (~40% hex) |
| LIART-08 | SVG icon: temple (domed/spired building) | Medium size class (~60% hex) |
| LIART-09 | SVG icon: shrine (small arch or standing stone) | Small size class (~40% hex) |
| LIART-10 | SVG icon: ruins (broken building) | Small size class (~40% hex) |
| LIART-11 | SVG icon: ruined_city (broken castle) | Medium size class; broken/crumbled version of capital/city |
| LIART-12 | SVG icon: ruined_tower (broken tower) | Small size class; broken version of tower |
| LIART-13 | SVG icon: ruined_village (broken houses) | Small size class; broken version of hamlet |
| LIART-14 | SVG icon: mining (pick/mine entrance) | Small size class (~40% hex) |
| LIART-15 | SVG icon: camp (tent silhouette) | Small size class (~40% hex) |
| LIART-16 | SVG icon: battleground (crossed swords) | Small size class (~40% hex) |
| LIART-17 | SVG icon: unexplored_poi (question mark / generic marker) | Tiny size class |
| COMP-05 | Agent RING layout distributes agents around hex edge, sorted by ID for stable positions | getRingSlotOffset() already exists in movementPath.ts; extend compositionResolver to handle RING slot type |
| AGNT-01 | Agent portraits as circular thumbnails with colored status ring at hero-local zoom | THREE.Sprite with CanvasTexture: draw portrait image + colored ring; circular clip via canvas arc |
| AGNT-02 | Colored faction-color dots at regional zoom with count badge if >4 per hex | Small THREE.Sprite with solid color disc; count badge as HTML overlay element |
| AGNT-03 | Agents hidden at continental and full-world zoom (retinue only at continental) | Zoom-tier visibility switch in render loop; agent sprites .visible toggle based on zoom level |
| AGNT-04 | Faction heraldic colors: saturated/bright, distinct from terrain palette | Existing DOMAIN_COLORS in agent-visual-content.ts; extend/replace with faction-level colors |
| AGNT-05 | Retinue agents use gold/white border | Detect retinue membership from graph edges; render gold ring instead of faction color ring |
| AGNT-06 | Movement animation: bezier hop ~800ms + 150ms settle | Port getSegmentBezier + evalBezierAtArcLength from movementPath.ts to Three.js render loop; no rAF — use delta time in render loop |
| AGNT-07 | Activity indicator icons below agent | SVG sprites same pipeline; position offset BELOW agent ring position |
| AGNT-08 | Event indicators on hexes | Sprite placed at hex center, RENDER_ORDER.EVENTS (10); fade controlled by animation state |
</phase_requirements>

---

## Summary

Phase 6 builds on the SVG→CanvasTexture→Sprite pipeline established in Phase 5 (SignifierMesh) and extends it in two directions: location icons (static, one per location type, suppressing terrain signifiers) and agent rendering (animated, tiered by zoom, ported from the existing SVG AgentDots and MovementTrails components).

The most important insight is that **almost nothing needs to be invented from scratch**. The location icon pipeline is structurally identical to SignifierMesh — create a LocationIconMesh module that uses a new location icon registry with the same CanvasTexture rasterization. The agent rendering ports battle-tested logic from `AgentDots.tsx` (bezier hop, RING layout, portrait rendering) and `MovementTrails.tsx` (trail fade), but replaces React+SVG+rAF with Three.js sprites + render-loop delta-time animation.

The primary novel work is: (1) creating 17 hand-drawn SVG location icons matching the art style standard, (2) choosing and implementing the label approach for location names (HTML overlay is strongly recommended — same pattern as RegionLabelOverlay, zero new tech), and (3) adapting the rAF animation model from AgentDots to work inside the Three.js render loop using delta-time instead of requestAnimationFrame callbacks.

**Primary recommendation:** Follow the SignifierMesh → LocationIconMesh extension path. Use HTML overlay for labels (same as RegionLabelOverlay). Port bezier + ring math directly from movementPath.ts. The only genuinely new problem is portrait-as-CanvasTexture — load image via HTMLImageElement and draw onto canvas before creating CanvasTexture.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Three.js | Already in project | Sprite rendering, CanvasTexture, render loop | Project constraint — all HexMapV2 uses raw Three.js |
| Canvas 2D API (browser) | Native | SVG path rasterization, portrait compositing | Same approach as signifierTextures.ts (Path2D) |
| Path2D (browser) | Native | Render SVG `d` strings to canvas | Used in buildSignifierTexture; identical approach for location icons |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `src/lib/movementPath.ts` | Project | getSegmentBezier, evalBezierAtArcLength, getRingSlotOffset | Agent animation and RING layout math — reuse directly |
| `src/data/agent-visual-content.ts` | Project | AGENT_MOVE_TRANSITION_MS, AGENT_RING_RADIUS, MAX_RING_AGENTS, faction colors | All agent tunable constants already defined |
| `src/data/portrait-assets.ts` | Project | Portrait URL lookup per archetype | Existing portrait registry |
| HTML overlay (React divs) | React | Location name labels | Same approach as RegionLabelOverlay; camera.project() for world→screen |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| HTML overlay for labels | Canvas texture labels (baked text into sprite texture) | Canvas textures require regeneration when camera moves; HTML overlay is simpler, already proven in Phase 4 |
| HTML overlay for labels | SDF (Signed Distance Field) text in Three.js | SDF requires troika-three-text or shader work; overkill given HTML overlay already works |
| Individual THREE.Sprite per agent | InstancedMesh for agents | Agents need individual animation state; Sprites allow per-object position updates without index math |

**No new npm installs required.** All tooling is already present.

---

## Architecture Patterns

### Recommended Project Structure

```
src/components/HexMapV2/
├── scene/
│   ├── LocationIconMesh.ts        # new — location icon sprites (Plan 06-01)
│   ├── AgentSpriteMesh.ts         # new — agent rendering, bezier animation (Plan 06-03/04)
│   └── MovementTrailMesh.ts       # new — Three.js port of SVG MovementTrails (Plan 06-04)
├── locations/
│   ├── locationIconRegistry.ts    # new — 17 SVG icons, size classes, suppression manifests
│   └── locationIconTextures.ts    # new — CanvasTexture builder for location icons
├── agents/
│   ├── agentAnimationState.ts     # new — per-agent animation state (bezier params, trail history)
│   └── agentPortraitTextures.ts   # new — async portrait image → CanvasTexture loader
├── overlay/
│   ├── LocationLabelOverlay.tsx   # new — HTML overlay for location names (Plan 06-01)
│   └── RegionLabelOverlay.tsx     # existing — unchanged
└── signifiers/
    └── compositionResolver.ts     # modified — extend RING slot handling for COMP-05
```

### Pattern 1: Location Icon Registry and Texture Cache

Identical structure to `signifierRegistry.ts` + `signifierTextures.ts`. The key differences are:
- No variant selection (one icon per location type, not per-hex random selection)
- Size class determines sprite scale, not a uniform SIGNIFIER_SPRITE_SCALE
- Icons are placed at exact hex center (CENTER slot), no jitter or rotation

```typescript
// locationIconRegistry.ts
export type LocationType =
  | 'capital' | 'city' | 'town' | 'hamlet'
  | 'castle' | 'fort' | 'tower'
  | 'temple' | 'shrine'
  | 'ruins' | 'ruined_city' | 'ruined_tower' | 'ruined_village'
  | 'mining' | 'camp' | 'battleground' | 'unexplored_poi';

export type LocationSizeClass = 'full' | 'large' | 'medium' | 'small' | 'tiny';

export interface LocationIconDef {
  paths: Array<{ d: string; opacity: number }>;
  viewBox: string;
  sizeClass: LocationSizeClass;
}

export const LOCATION_ICON_REGISTRY: Record<LocationType, LocationIconDef> = { ... };

// Size class → fraction of HEX_SIZE
export const LOCATION_SIZE_SCALE: Record<LocationSizeClass, number> = {
  full:   0.80,  // capital, city
  large:  0.70,  // (reserved)
  medium: 0.60,  // town, castle, fort, temple, ruined_city
  small:  0.40,  // hamlet, tower, shrine, ruins, ruined_tower, ruined_village, mining, camp, battleground
  tiny:   0.25,  // unexplored_poi
};
```

### Pattern 2: LocationIconMesh (follows SignifierMesh)

```typescript
// Source: src/components/HexMapV2/scene/SignifierMesh.ts pattern
export function createLocationIconMesh(
  tiles: HexTile[],
  locations: LocationNode[],  // from worldGraph
): THREE.Group {
  const group = new THREE.Group();
  group.renderOrder = RENDER_ORDER.LOCATIONS; // 8 — above signifiers (7)

  const textureCache = buildLocationIconTextureCache(LOCATION_ICON_REGISTRY);

  for (const loc of locations) {
    const iconDef = LOCATION_ICON_REGISTRY[loc.locationType];
    if (!iconDef) continue;  // NFP #4 fail-soft

    const texture = textureCache.get(loc.locationType);
    if (!texture) continue;

    const spriteSize = HEX_CONSTANTS.HEX_SIZE * LOCATION_SIZE_SCALE[iconDef.sizeClass];
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
    const sprite = new THREE.Sprite(material);

    const { x, y } = hexToPixel({ col: loc.hexCol, row: loc.hexRow }, HEX_CONSTANTS.HEX_SIZE);
    sprite.position.set(x, -y, LOCATION_ICON_Z);  // Y-flip: SVG y-down → Three.js y-up
    sprite.scale.set(spriteSize, spriteSize, 1);
    group.add(sprite);
  }
  return group;
}
```

### Pattern 3: Agent Sprite Rendering (Two-Tier)

Agents need two rendering modes (portrait at hero-local, dot at regional) controlled by zoom level. One clean approach: maintain two separate Groups and toggle visibility, rather than rebuilding sprites on every zoom change.

```typescript
// Portrait sprites group (visible at hero-local zoom >= 15)
// Dot sprites group (visible at regional zoom 5 <= k < 15)
// Both hidden at k < 5
```

Each agent has one sprite in each group; they swap visibility on zoom tier change. The portrait sprite uses a CanvasTexture with the portrait image composited onto a circle with a colored ring. The dot sprite uses a solid-color circle CanvasTexture.

### Pattern 4: Agent Animation in Render Loop

The SVG version uses `requestAnimationFrame` callbacks (standard React pattern). In Three.js, animation belongs in the render loop. The render loop receives delta time from Three.js Clock. Animation state is stored in a plain Map outside React.

```typescript
// agentAnimationState.ts
export interface AgentAnimState {
  agentId: string;
  bezier: SegmentBezier;
  startTime: number;        // performance.now() when animation started
  duration: number;         // AGENT_MOVE_DURATION_MS
  phase: 'moving' | 'settling' | 'idle';
  fromPos: THREE.Vector3;
  toPos: THREE.Vector3;
}

// In render loop (called each frame):
function updateAgentAnimations(
  animStates: Map<string, AgentAnimState>,
  agentSprites: Map<string, THREE.Sprite>,
  now: number,
): void {
  for (const [id, state] of animStates) {
    const t = Math.min(1, (now - state.startTime) / state.duration);
    const pos = evalBezierAtArcLength(state.bezier.p0, state.bezier.ctrl, state.bezier.p2, t);
    const sprite = agentSprites.get(id);
    if (sprite) sprite.position.set(pos.x, pos.y, AGENT_Z);
    if (t >= 1) animStates.delete(id);
  }
}
```

**Key difference from SVG version:** No per-agent `cancelAnimationFrame`. The render loop processes all active states each frame naturally; completed animations are removed from the map.

### Pattern 5: Portrait Image → CanvasTexture

Portrait images are PNGs stored in `public/portraits/`. Loading them requires an async step before texture creation.

```typescript
// Source: standard browser pattern
export async function loadPortraitTexture(url: string): Promise<THREE.CanvasTexture> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });

  const canvas = document.createElement('canvas');
  canvas.width = PORTRAIT_TEXTURE_SIZE;
  canvas.height = PORTRAIT_TEXTURE_SIZE;
  const ctx = canvas.getContext('2d')!;

  // Circular clip
  ctx.beginPath();
  ctx.arc(PORTRAIT_TEXTURE_SIZE / 2, PORTRAIT_TEXTURE_SIZE / 2, PORTRAIT_TEXTURE_SIZE / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(img, 0, 0, PORTRAIT_TEXTURE_SIZE, PORTRAIT_TEXTURE_SIZE);

  // Colored ring (drawn AFTER image — appears on top)
  ctx.globalAlpha = 1;
  ctx.strokeStyle = factionColor;
  ctx.lineWidth = PORTRAIT_RING_WIDTH;
  ctx.beginPath();
  ctx.arc(PORTRAIT_TEXTURE_SIZE / 2, PORTRAIT_TEXTURE_SIZE / 2, PORTRAIT_TEXTURE_SIZE / 2 - PORTRAIT_RING_WIDTH / 2, 0, Math.PI * 2);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}
```

Portrait textures must be loaded asynchronously at startup, before the agent sprites are created. A loading queue pattern (similar to how Phase 5 built the texture cache) handles this. Agents without a loaded portrait fall back to a solid color dot texture.

### Pattern 6: Location Labels (HTML Overlay)

Reuse RegionLabelOverlay pattern. LocationLabelOverlay uses the same camera.project() world→screen mapping, same text-shadow halo, same pointer-events: none. The key additions:
- Filter labels by location importance at each zoom tier
- Four font sizes: capital (18px bold), city (15px bold), town (12px), hamlet (10px)
- Labels appear at hero-local and regional zoom; only capitals at continental

```typescript
// Identical halo CSS from RegionLabelOverlay.tsx:
const LAND_HALO = [
  '1px 0 0 rgba(240,235,220,0.9)',
  '-1px 0 0 rgba(240,235,220,0.9)',
  // ... (copy from RegionLabelOverlay.tsx)
].join(', ');
```

### Pattern 7: COMP-05 RING Layout Extension

`getRingSlotOffset` in `movementPath.ts` already computes RING positions correctly. COMP-05 requires extending the composition resolver to handle the RING slot type: RING is not a single slot but distributes N entities at evenly-spaced positions around the hex edge.

The resolver already has `HexSlot = 'RING'` defined in `compositionTypes.ts`. The extension needed:
- When an entity requests RING, it gets assigned a specific ring index (0..N-1)
- The LocationIconMesh doesn't use RING — agents use RING
- The resolver tracks "how many RING occupants" rather than treating RING as a single slot

### Anti-Patterns to Avoid

- **Building a new animation loop:** Do not create a separate `setInterval` or `requestAnimationFrame` for agent animation. All frame updates belong in the Three.js render loop that HexMapV2.tsx already manages.
- **Regenerating all textures on zoom change:** Texture cache is built once at startup. Zoom changes only toggle `group.visible` — they never rebuild sprites.
- **Blocking on portrait load:** Portrait images are async. Never `await` inside the render loop. Build textures asynchronously before adding agent sprites; use a placeholder dot sprite while portraits load.
- **Adding jitter/rotation to location icons:** Terrain signifiers have jitter because there are thousands and it looks organic. Location icons are specific named places — they must be centered exactly on the hex with no rotation.
- **Using linewidth > 1 for trails:** WebGL clamps linewidth to 1px on most hardware. Use quad-strip geometry for thick lines (RiverMesh pattern), or thin 1px lines for trails (acceptable visual quality at these scales).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bezier interpolation | Custom cubic/quadratic math | `getSegmentBezier` + `evalBezierAtArcLength` in `movementPath.ts` | Already handles arc-length reparametrization, deterministic wobble seeding, ring offset endpoints |
| Ring slot positions | Custom trigonometry | `getRingSlotOffset` in `movementPath.ts` | Already handles arbitrary N agents, stable deterministic ordering |
| SVG path rasterization | Custom SVG parser | `Path2D` browser API + Canvas 2D | `buildSignifierTexture` in signifierTextures.ts already does this pattern |
| Label collision detection | Custom overlap algorithm | `removeOverlaps` in `labelCollision.ts` | AABB sweep already implemented; extend for location labels if needed |
| World→screen projection | Custom math | `camera.project()` + DOM offset | RegionLabelOverlay already uses this correctly |
| Faction color lookup | Inline hex strings | `DOMAIN_COLORS` in `agent-visual-content.ts` | Already maps domain → color; extend with faction-level colors if game state has faction nodes |

**Key insight:** Phase 6 is almost entirely a **port and extension** phase. Every major algorithm (bezier hop, ring layout, texture rasterization, label overlay, render order) is already present and working. The primary work is creating SVG art assets (the 17 location icons and 6 activity indicators) and wiring them into the established patterns.

---

## Common Pitfalls

### Pitfall 1: Y-Axis Flip for Portrait and Icon Positions

**What goes wrong:** Sprites render in the wrong vertical position or appear mirrored vertically.
**Why it happens:** SVG coordinates are y-down; Three.js world coordinates are y-up. HexMapV2 applies `y = -y` for all sprite placements, established in Phase 5 SignifierMesh.
**How to avoid:** Always use `sprite.position.set(x, -y, z)` where `(x, y)` comes from `hexToPixel()`. This is consistent with every existing scene module (CoastlineMesh, RiverMesh, SignifierMesh).
**Warning signs:** Icons appear at the correct horizontal position but wrong vertical position, or the map looks correct at y=0 but wrong elsewhere.

### Pitfall 2: Portrait Texture Race Condition

**What goes wrong:** Agent sprites appear with broken/missing textures on first render, or some portraits never load.
**Why it happens:** Portrait images are loaded asynchronously. If agent sprites are created before portrait images load, the CanvasTexture has no image data.
**How to avoid:** Use a two-phase initialization. Phase 1: create all agents with solid-color dot textures (instant). Phase 2: load portraits in parallel, swap textures when each resolves. Store the portrait texture map keyed by agentId; sprite materials update via `material.map = newTexture; material.needsUpdate = true`.
**Warning signs:** Console errors like "Image load failed" or blank white circles for some agents.

### Pitfall 3: Stale Animation State After Tick

**What goes wrong:** Agents snap to wrong positions, or animation doesn't start when an agent moves.
**Why it happens:** The animation state map must be updated atomically when a tick fires. If `currentTick` prop changes but `animStates` isn't updated in the same render pass, agents teleport.
**How to avoid:** Expose a method on AgentSpriteMesh (or accept a function prop in HexMapV2.tsx) that receives the new agent positions from the game graph. Diff old vs new positions, create new `AgentAnimState` entries for moved agents. This is the exact pattern in `AgentDots.tsx` Step 5 — the `useEffect` on `allAgents` fires when positions change.
**Warning signs:** Agents teleport instead of animating, or animations continue after agents have stopped moving.

### Pitfall 4: Composition Resolver RING Slot Handling

**What goes wrong:** Multiple agents assigned to RING all get the same slot index, causing them to overlap.
**Why it happens:** The existing `resolveHexComposition` in `compositionResolver.ts` treats RING as a single slot (`occupiedSlots.has('RING')` blocks the second agent). RING needs to support multiple occupants at different angular positions.
**How to avoid:** Modify `resolveHexComposition` to track RING occupants separately: `ringOccupantCount: number`. When an entity requests RING, assign it `ringIndex = ringOccupantCount++` instead of blocking. The renderer uses this index in `getRingSlotOffset(ringIndex, totalRingAgents, AGENT_RING_RADIUS)`.
**Warning signs:** All agents at a location stack at the same position, or only one agent renders per hex.

### Pitfall 5: Location Icons Suppressing Before Agents Render

**What goes wrong:** Agents are suppressed by location icons (not just terrain signifiers).
**Why it happens:** The composition manifests for location icons use `suppresses: [{ target: 'terrain-signifier', when: 'always' }]`. If this is accidentally broadened to `target: 'agent'`, agents disappear.
**How to avoid:** Location icon manifests must ONLY suppress `terrain-signifier`. Agents use RING slot, which is outside CENTER slot, so footprint overlap with the icon does not occur by design.
**Warning signs:** Agents visible in game state but not rendered on hexes with locations.

### Pitfall 6: Three.js LineSegments Ignoring linewidth

**What goes wrong:** Movement trails appear as 1px hairlines regardless of `linewidth` setting.
**Why it happens:** WebGL spec clamps `gl.lineWidth` to 1px on most hardware (confirmed Windows/Chrome/GPU behavior). THREE.LineBasicMaterial `linewidth` only works on platforms that expose `ANGLE_extended_blend_minmax`.
**How to avoid:** For trails, 1px hairlines are acceptable (they're subtle background elements). For the movement trail the existing SVG version uses 0.75px width — at Three.js world scale this is fine as a thin line. If wider lines are needed later, use a custom quad-strip mesh (see RiverMesh.ts pattern).
**Warning signs:** Trail `linewidth: 3` set but trails appear as 1px lines.

---

## Code Examples

### Building a Location Icon Texture

```typescript
// Source: src/components/HexMapV2/signifiers/signifierTextures.ts (adapted)
export function buildLocationIconTexture(
  def: LocationIconDef,
  size: number = LOCATION_TEXTURE_SIZE,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const parts = def.viewBox.split(' ').map(Number);
  const vbW = parts[2] || 100;
  const vbH = parts[3] || 100;
  ctx.save();
  ctx.scale(size / vbW, size / vbH);
  for (const path of def.paths) {
    ctx.globalAlpha = path.opacity;
    ctx.fillStyle = '#1a1a1a';  // SIGNIFIER_FILL_COLOR — same as terrain signifiers
    ctx.fill(new Path2D(path.d));
  }
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}
```

### Agent Bezier Hop in Render Loop

```typescript
// Source: adapted from src/lib/movementPath.ts + src/components/HexMap/AgentDots.tsx
// Called each frame from HexMapV2 render loop:
function tickAgentAnimations(
  animStates: Map<string, AgentAnimState>,
  agentSprites: Map<string, THREE.Sprite>,
): void {
  const now = performance.now();
  for (const [id, state] of animStates) {
    const t = Math.min(1, (now - state.startTime) / state.duration);
    const pos = evalBezierAtArcLength(state.bezier.p0, state.bezier.ctrl, state.bezier.p2, t);
    const sprite = agentSprites.get(id);
    if (sprite) {
      sprite.position.set(pos.x, pos.y, AGENT_Z);
    }
    if (t >= 1) {
      animStates.delete(id);
    }
  }
}
```

### RING Slot Position Calculation

```typescript
// Source: src/lib/movementPath.ts — getRingSlotOffset (already exists, reuse as-is)
import { getRingSlotOffset } from '../../../lib/movementPath';

// For N agents at a hex, place agent[i] at:
const offset = getRingSlotOffset(i, N, AGENT_RING_RADIUS);
// Returns { x: cos(angle) * AGENT_RING_RADIUS, y: sin(angle) * AGENT_RING_RADIUS }

// Convert to Three.js world position:
const hexCenter = hexToPixel(hexCoord, HEX_CONSTANTS.HEX_SIZE);
sprite.position.set(
  hexCenter.x + offset.x,
  -(hexCenter.y + offset.y),  // Y-flip
  AGENT_Z,
);
```

### Location Label Overlay (React)

```typescript
// Source: adapted from src/components/HexMapV2/overlay/RegionLabelOverlay.tsx
// Labels are absolutely-positioned divs over the canvas:
const IMPORTANCE_FONT_SIZE: Record<LocationImportance, string> = {
  capital: '18px',
  city:    '15px',
  town:    '12px',
  hamlet:  '10px',
  other:   '9px',
};

// Visibility rules matching design doc:
// hero-local (k >= 15): all locations show labels
// regional (5 <= k < 15): capital, city, town
// continental (1.5 <= k < 5): capital, city only
// full-world (k < 1.5): no labels
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Agents rendered in SVG (AgentDots.tsx) | Agents as Three.js Sprites in WebGL canvas | Phase 6 — now | Eliminates DOM node count for agents; all rendering in single canvas context |
| rAF-driven animation in React component | Render-loop delta-time animation in Three.js scene module | Phase 6 — now | Removes React re-render churn; animation is 100% in GPU pipeline |
| Location icons as SVG elements in DOM | Location icons as Three.js Sprites (CanvasTexture) | Phase 6 — now | Consistent with Phase 5 signifier approach; all map content in WebGL |

**Deprecated/outdated:**
- `src/components/HexMap/AgentDots.tsx` — SVG implementation. Phase 6 creates the Three.js port. Original SVG version remains active until Phase 8 swaps the map.
- `src/components/HexMap/MovementTrails.tsx` — SVG implementation. Phase 6 ports to Three.js alongside AgentDots.

---

## Open Questions

1. **Are location data nodes available in the worldGraph at `?view=hexv2`?**
   - What we know: HexMapV2 already receives `tiles`, `regionData`, etc. as props from HexV2View.
   - What's unclear: Whether `WorldGraph` (with location nodes and agent nodes) is threaded through to the HexMapV2 props yet, or whether Phase 6 needs to add it.
   - Recommendation: Plan 06-01 should audit HexV2View.tsx and HexMapV2Props. If `graph` prop is missing, add it (same pattern as GameView.tsx passing graph to the current SVG HexMap).

2. **Agent faction membership vs domain color**
   - What we know: Current AgentDots uses `DOMAIN_COLORS` (domain capability key → color). Phase 6 requires "faction heraldic colors" (AGNT-04). The game may have faction nodes in the graph, or agents may just have a `factionId` property.
   - What's unclear: Whether faction-level colors are already computed in the worldgen pipeline.
   - Recommendation: Plan 06-03 should check `agent.properties.factionId` and look for faction nodes in the graph. If faction color is not available, fall back to domain color (same as current behavior) — fail-soft.

3. **Retinue membership detection**
   - What we know: Retinue agents get a gold/white border (AGNT-05). The SVG AgentDots distinguishes by `agent.id === avatarId`.
   - What's unclear: Is "retinue" broader than just the avatar? Are there multiple retinue members?
   - Recommendation: Check for a `retinue` or `player_retinue` edge type in the graph. If unavailable, treat `avatarId` as the sole retinue agent (same as current SVG map).

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (existing project config) |
| Config file | vitest.config.ts (root) |
| Quick run command | `npm test -- --run src/components/HexMapV2` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LOCI-01 | createLocationIconMesh returns Group at renderOrder 8 | unit | `npm test -- --run src/components/HexMapV2/scene/__tests__/LocationIconMesh.test.ts` | ❌ Wave 0 |
| LOCI-01 | Location icons suppressed when composition resolver marks suppress | unit | `npm test -- --run src/components/HexMapV2/signifiers/__tests__/compositionResolver.test.ts` | ✅ (extend) |
| LOCI-03 | LocationLabelOverlay renders div per visible location | unit | `npm test -- --run src/components/HexMapV2/overlay/__tests__/LocationLabelOverlay.test.ts` | ❌ Wave 0 |
| COMP-05 | RING slot distributes agents at correct angular offsets | unit | `npm test -- --run src/components/HexMapV2/signifiers/__tests__/compositionResolver.test.ts` | ✅ (extend) |
| AGNT-01 | Portrait CanvasTexture draws circular image with ring | unit | `npm test -- --run src/components/HexMapV2/agents/__tests__/agentPortraitTextures.test.ts` | ❌ Wave 0 |
| AGNT-06 | Bezier animation state advances correctly per frame | unit | `npm test -- --run src/components/HexMapV2/agents/__tests__/agentAnimationState.test.ts` | ❌ Wave 0 |
| LIART-01–17 | All 17 location types present in LOCATION_ICON_REGISTRY | unit | `npm test -- --run src/components/HexMapV2/locations/__tests__/locationIconRegistry.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --run src/components/HexMapV2`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/components/HexMapV2/scene/__tests__/LocationIconMesh.test.ts` — covers LOCI-01, render order, water exclusion, fail-soft
- [ ] `src/components/HexMapV2/overlay/__tests__/LocationLabelOverlay.test.ts` — covers LOCI-03 label rendering
- [ ] `src/components/HexMapV2/agents/__tests__/agentPortraitTextures.test.ts` — covers AGNT-01 canvas compositing
- [ ] `src/components/HexMapV2/agents/__tests__/agentAnimationState.test.ts` — covers AGNT-06 bezier tick math
- [ ] `src/components/HexMapV2/locations/__tests__/locationIconRegistry.test.ts` — covers LIART-01–17 registry completeness

---

## Sources

### Primary (HIGH confidence)
- Source code: `src/components/HexMapV2/scene/SignifierMesh.ts` — SVG→CanvasTexture→Sprite pipeline
- Source code: `src/components/HexMapV2/signifiers/signifierTextures.ts` — buildSignifierTexture pattern
- Source code: `src/components/HexMapV2/signifiers/compositionTypes.ts` + `compositionResolver.ts` — slot system
- Source code: `src/components/HexMapV2/scene/RenderLayers.ts` — confirmed render order slots
- Source code: `src/components/HexMap/AgentDots.tsx` — full bezier hop + RING layout + portrait rendering logic
- Source code: `src/components/HexMap/MovementTrails.tsx` — trail rendering pattern to port
- Source code: `src/lib/movementPath.ts` — getSegmentBezier, evalBezierAtArcLength, getRingSlotOffset
- Source code: `src/data/agent-visual-content.ts` — all agent tunable constants
- Source code: `src/components/HexMapV2/overlay/RegionLabelOverlay.tsx` — HTML label overlay pattern
- Design doc: `Design/brainstorm-hexmap-v2.md` lines 878–1116 — Layer 11 (Location Signifiers) and Layer 13 (Agents and Icons) specifications

### Secondary (MEDIUM confidence)
- Context: `.planning/phases/06-locations-agents/06-CONTEXT.md` — locked decisions and canonical refs
- Context: `.planning/phases/05-hex-composition-landscape-signifiers/05-CONTEXT.md` — art style decisions carried forward
- Context: `.planning/phases/01-renderer-foundation/01-CONTEXT.md` — zoom tier thresholds, render order

### Tertiary (LOW confidence)
- None. All findings are directly verified against project source code and locked context decisions.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies, all tooling verified in source code
- Architecture: HIGH — all patterns are direct extensions of Phase 5 code
- Pitfalls: HIGH — identified from existing code (Y-flip, linewidth, async textures) and direct inspection of compositionResolver
- SVG art: MEDIUM — 17 icons must be created; art quality is a craft judgment call, not a technical uncertainty

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (30 days — stable tech stack, no fast-moving dependencies)
