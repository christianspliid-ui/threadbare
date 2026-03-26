# Avatar Portrait & Hex Map Visibility

> **Date:** 2026-03-26
> **Status:** Ready for implementation
> **Backlog:** TB-054
> **Problem:** The player's avatar is invisible on HexMapV2 — it renders as an indistinguishable faction dot because (a) it has no `narrativeArchetype` so no portrait loads, and (b) HexMapV2 has no avatar-specific visual treatment (the old V1 SVG map had a pulsing sphere-colored ring, but that was never ported).

---

## Root Cause Analysis

Three missing pieces:

1. **No portrait for the avatar.** The avatar actor node (created in `ascendant.ts:148-157`) has no `narrativeArchetype` property. The portrait pipeline (`portrait-assets.ts → getPortraitUrl()`) returns `null`, so `AgentSpriteMesh` falls back to a tiny faction-colored dot.

2. **No `isAvatar` flag in AgentRenderData.** `GameView.tsx:201-249` builds `AgentRenderData[]` from all actors but doesn't mark the avatar. HexMapV2 has zero avatar awareness — no `isAvatar`, no `sphereColor`, nothing (confirmed: grep of `src/components/HexMapV2/` for avatar/sphere returns zero results).

3. **No visual distinction in the renderer.** Even if the avatar had a portrait, it would look identical to every other agent. The V1 SVG map had `isAvatarHex` + `sphereColor` pulsing ring treatment (still visible in the deleted `HexMap.tsx` / `HexTile.tsx`). HexMapV2 has `isRetinue` (gold border) but nothing for the avatar itself.

---

## Design

### Part A: Sphere-Specific Avatar Portraits (Art Asset Generation)

Generate 8 avatar portrait images, one per Creation Sphere, using the `mcp-image` MCP tool. These are generic divine avatar portraits — not archetype-specific (the player hasn't chosen a mortal archetype, they've chosen a sphere).

**Art direction** (from STYLE.md § "The Ascendant"):

> A divine figure forming from converging magic threads. Not fully solid — partially translucent, luminous, woven from light. The specific sphere colors in the threads reflect the player's chosen spheres.

**Prompt template** (follows STYLE.md Actor game-asset pattern):

```
A divine figure emerging from converging [sphere color name] threads of magic.
The figure is partially translucent, woven from luminous [form language] —
not fully solid, a being of light taking shape. [Sphere-specific detail:
2 sentences describing how this sphere's form language shapes the figure's
appearance]. The figure's silhouette is humanoid but abstracted, made of
concentrated [sphere color hex] threads against near-black darkness.

Waist-up portrait, 85mm lens equivalent, f/2.8. Subject fills the frame
against a dark neutral background. Slight low angle conveys divine authority.

The magic threads ARE the figure — they provide all illumination. Narrow
[sphere color name] glow on immediately adjacent space only. Deep darkness
everywhere the threads don't reach.

Dark fantasy oil painting in the style of Brom and Adrian Smith —
visible brushstrokes, textural impasto, atmospheric depth.
The background is near-black with subtle smoky atmosphere.

No text, no UI, no modern elements.
```

**Sphere-specific details per portrait:**

| Sphere | Color | Form Language Detail | Filename |
|--------|-------|---------------------|----------|
| Force | `#ff6b6b` crimson | Sharp directional streaks radiate from the figure like impact lines; the silhouette is angular, aggressive, leaning forward as if mid-strike | `avatar-force.png` |
| Matter | `#d4a87a` deep umber | Crystalline lattice structures form the figure's frame like mineral growth; faceted, hard-edged joints and tessellating crystal armor | `avatar-matter.png` |
| Energy | `#ffe44d` brilliant gold | Star-burst coronas pulse from the figure's core outward; flickering flame-tongue threads and solar flare shapes wreath the silhouette | `avatar-energy.png` |
| Life | `#33ff77` vivid emerald | Organic branching veins and mycelium networks form the figure; Fibonacci spiral patterns in the torso, tendril-curl fingers, capillary detail | `avatar-life.png` |
| Mind | `#44aaff` electric blue | Neural dendrite networks branch from the figure's head; eye-like mandala nodes at intersections, clean precise branching patterns | `avatar-mind.png` |
| Spirit | `#cc66ff` violet | Ascending wisps and ethereal ribbons form the figure, always drifting upward; smoke-like trails rising from shoulders, dissolving transparent edges | `avatar-spirit.png` |
| Time | `#ffb355` radiant orange | Concentric ripple rings emanate from the figure; overlapping afterimage echoes show the same form in multiple moments at once, clock-arc shapes | `avatar-time.png` |
| Entropy | `#8fd4c0` ghostly sea-green | The figure is visibly fragmenting at its edges; threads crack and scatter into drifting motes, erosion lines trace the silhouette, dissolving but reforming | `avatar-entropy.png` |

**File locations:**
- Generated to: `public/portraits/avatar-{sphere}.png`
- Aspect ratio: 3:4 (portrait, per STYLE.md Actor game-asset)
- Quality: "quality" (final deliverable)

### Part B: Avatar Portrait Registry

**New file:** `src/data/avatar-portrait-assets.ts`

```typescript
import type { SphereName } from '../types';

/** Map primary sphere → avatar portrait path (relative to public/) */
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

/** Get avatar portrait URL for the player's primary sphere */
export function getAvatarPortraitUrl(primarySphere: SphereName): string {
  return AVATAR_PORTRAITS[primarySphere];
}
```

### Part C: Wire Avatar Portrait into Render Data

**Modify:** `src/components/Game/GameView.tsx` — `agentRenderData` builder (lines 201-249)

The avatar actor's ID is already known via `useAvatarData().avatarNodeId`. When building `AgentRenderData[]`, check if the current actor is the avatar. If so:

1. Use `getAvatarPortraitUrl(archetype.sphereAlignment.primary)` instead of `getPortraitUrl(narrativeArchetype)`
2. Set a new `isAvatar: true` flag

**Changes to `AgentRenderData` interface** (`agentSpriteTypes.ts`):

```typescript
export interface AgentRenderData {
  // ... existing fields ...
  /** true = this is the player's avatar. Renders with sphere-colored highlight. */
  isAvatar?: boolean;
  /** Sphere color hex for avatar highlight ring (only set when isAvatar) */
  avatarSphereColor?: string;
}
```

**Changes to `GameView.tsx` `agentRenderData` builder:**

```typescript
// Inside the actor loop, after resolving hexCol/hexRow:
const isAvatar = n.id === avatarNodeId;
const archetypeId = n.properties.narrativeArchetype as string | undefined;

result.push({
  id: n.id,
  hexCol,
  hexRow,
  portraitUrl: isAvatar
    ? getAvatarPortraitUrl(archetype.sphereAlignment.primary)
    : (getPortraitUrl(archetypeId) ?? undefined),
  factionIndex: i % 6,
  isRetinue: retinueIds.has(n.id),
  isAvatar,
  avatarSphereColor: isAvatar ? sphereColor : undefined,
  name: n.name,
  currentRoadType: movState?.currentRoadType as 'major' | 'trail' | undefined,
  roadHexQueueLength: Array.isArray(movState?.roadHexQueue) ? movState.roadHexQueue.length : undefined,
});
```

`avatarNodeId` and `sphereColor` are already available from `useAvatarData()` which is called earlier in GameView.

### Part D: Avatar Visual Treatment in AgentSpriteMesh

**Modify:** `src/components/HexMapV2/scene/AgentSpriteMesh.ts`

When rendering an agent where `isAvatar === true`:

1. **Sphere-colored pulsing ring** — Draw an additional ring around the portrait circle using `avatarSphereColor`, with a slow pulse animation (opacity oscillates 0.6–1.0 over ~2s cycle). This mirrors the V1 SVG treatment.

2. **Slightly larger sprite** — Avatar portrait renders at 1.3× the normal agent sprite size so it's always visually prominent.

3. **Always on top** — Avatar sprite gets a small z-offset bump (+0.01) within the agent layer so it renders above overlapping agents.

**Constants** (in `agentSpriteTypes.ts`):

```typescript
/** Scale multiplier for the avatar sprite relative to normal agents */
export const AVATAR_SCALE_MULTIPLIER = 1.3;

/** Pulsing ring animation period in seconds */
export const AVATAR_PULSE_PERIOD_S = 2.0;

/** Pulsing ring opacity range [min, max] */
export const AVATAR_PULSE_OPACITY: [number, number] = [0.6, 1.0];

/** Z-offset bump for avatar to render above other agents */
export const AVATAR_Z_BUMP = 0.01;

/** Width of the avatar sphere-colored ring as fraction of sprite radius */
export const AVATAR_RING_WIDTH_FRACTION = 0.12;
```

### Part E: Exclude Ascendant Actor from Render Data

The ascendant node itself (actorType: 'ascendant') has no location and should never appear in the agent render loop. Currently it's filtered out by the `hexCol == null` check (line 224), but this is incidental, not intentional. Add an explicit skip:

```typescript
// Skip ascendant nodes — they are divine entities, not map actors
if (n.properties.actorType === 'ascendant') continue;
```

---

## Constants Table (NFP #1)

| Constant | Default | Purpose |
|----------|---------|---------|
| `AVATAR_SCALE_MULTIPLIER` | 1.3 | Avatar sprite size relative to normal agents |
| `AVATAR_PULSE_PERIOD_S` | 2.0 | Ring pulse animation cycle (seconds) |
| `AVATAR_PULSE_OPACITY` | [0.6, 1.0] | Ring opacity oscillation range |
| `AVATAR_Z_BUMP` | 0.01 | Z-offset to ensure avatar renders above other agents |
| `AVATAR_RING_WIDTH_FRACTION` | 0.12 | Ring thickness as fraction of sprite radius |

## Tracing (NFP #2)

No new trace types needed. Avatar identification is already deterministic from the graph (ascendant ← avatar_of ← avatar). Portrait resolution is a pure function of `SphereName`.

## Fail-Soft (NFP #4)

| Failure Case | Fallback |
|-------------|----------|
| Avatar portrait image fails to load | Falls through to existing gradient silhouette fallback in AgentSpriteMesh |
| `avatarNodeId` is null (no avatar in graph) | No agent gets `isAvatar: true`; all render as normal — no crash |
| `avatarSphereColor` undefined | Ring not drawn; avatar still gets portrait and size boost |
| Avatar has no hex position | Filtered out by existing `hexCol == null` guard — no crash |

## PRNG (NFP #3)

No randomness involved. Sphere → portrait is a deterministic lookup.

---

## Wiring

| Surface | Status |
|---------|--------|
| **Orchestrator** | N/A — no engine phase changes |
| **UI rendering** | `AgentSpriteMesh` already rendered in HexMapV2. Changes are to its internal rendering logic, not JSX tree. |
| **GameState flow** | `AgentRenderData` gains `isAvatar` + `avatarSphereColor`. Written in GameView adapter, consumed by AgentSpriteMesh. |
| **Traces** | None new |
| **Debug visibility** | Avatar is already identifiable in agent render data by ID match |
| **Prose pipeline** | N/A |
| **Player controls** | N/A — avatar visibility is automatic |

---

## Implementation Order

1. **Generate 8 avatar portraits** using `mcp-image generate_image` with the prompts above. Save to `public/portraits/avatar-{sphere}.png`.
2. **Create `avatar-portrait-assets.ts`** — sphere → portrait URL registry.
3. **Extend `AgentRenderData`** — add `isAvatar` and `avatarSphereColor` fields.
4. **Update `GameView.tsx` agent adapter** — detect avatar, set portrait and flags.
5. **Update `AgentSpriteMesh`** — sphere-colored pulsing ring, scale boost, z-bump.
6. **Add explicit ascendant skip** in the render loop.
7. **Tests:**
   - Unit: `getAvatarPortraitUrl` returns correct path for each sphere
   - Contract: avatar actor in graph → `agentRenderData` has `isAvatar: true` + correct portrait URL
   - Visual: verify at `?view=game` — avatar visible with sphere ring at all three zoom tiers

---

## NFP Compliance Summary

| # | Priority | Verdict |
|---|----------|---------|
| 1 | Tunability | PASS — all visual constants named in `agentSpriteTypes.ts` |
| 2 | Inspectability | PASS — avatar identity traceable via graph edges; render data contains all flags |
| 3 | Determinism | PASS — no randomness; sphere → portrait is a pure lookup |
| 4 | Fail-soft | PASS — all failure cases fall back gracefully, no crashes |
| 5 | Narrative > mechanical | PASS — divine avatar gets sphere-themed art, not a generic portrait |
| 6 | Additive | PASS — new fields on AgentRenderData, new file, no destructive changes |
| 7 | Performance | PASS — one additional texture load (avatar portrait); pulsing ring is a uniform update, not per-frame geometry |
