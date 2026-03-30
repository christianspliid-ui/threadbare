# Hex Vignette Tooltip — Design Document

**Date:** 2026-03-09
**Status:** Approved
**Related systems:** Tooltip System, HexTile, HexMap, HexZoomView, Visibility, Progressive Disclosure

## Problem

Hex tooltips currently show just the terrain type name ("deciduous_forest") via the `terrain.*` prefix in the tooltip resolver. This wastes a rich opportunity — the world graph contains terrain, climate, population, locations, cultures, sphere influence, and faction data per hex that could compose a layered narrative vignette, making every hex hover feel like discovering a story.

## Decision Summary

1. **Sentence Fragment Pipeline** — a pure function `buildHexVignette()` that harvests graph data and composes tiered prose from content templates
2. **Three rendering tiers** — tier 1+2 in world map tooltip, tier 3 only in hex zoom view
3. **Word-by-word reveal** for tier 2 with per-word left-to-right letter fade animation
4. **Click-to-enter** — clicking the tooltip navigates to hex zoom (same as clicking the hex tile)
5. **Content-package driven** — all vocabulary in `hex-vignette-content.ts`, extensible without engine changes
6. **Visibility-gated voice** — prose tone shifts with fog of war state (confident / hedged / past-tense / none)

## 1. Rendering Tiers

| Tier | Where it shows | Appears how | Content |
|------|---------------|-------------|---------|
| **1** | World map tooltip | Instantly on hover | Terrain opening + climate feel (1 sentence) |
| **2** | World map tooltip | Word-by-word reveal after tier 1 | Population sense + location spotlights (1-3 sentences) |
| **3** | HexZoomView only | Static prose block in breadcrumb/header area | Cultural color, sphere aura, faction control, encounter hints |

Tier 1+2 together form the hover tooltip (2-4 sentences max). Tier 3 is rendered inline in the hex zoom view as a text block — not a tooltip.

## 2. Word-by-Word Reveal Animation

### Behavior

- Tier 1 text renders immediately (after the standard `TOOLTIP_SHOW_DELAY`)
- After tier 1 is visible, tier 2 words appear one at a time
- **Word interval:** `WORD_REVEAL_INTERVAL_MS = 80` (tunable)
- If the user moves their mouse off mid-reveal, the tooltip fades out normally
- If they hover back, the reveal **resumes from where it left off** — progress is cached per hex coordinate key (`"col,row"`) for the session
- Once all tier 2 words have revealed for a hex, subsequent hovers show full text instantly (no re-animation)

### Letter Fade Effect

Each new word fades in with a **left-to-right letter opacity sweep:**

- Each letter in the word is wrapped in a `<span>` with staggered `animation-delay`
- First letter starts fading in immediately, each subsequent letter is delayed by `LETTER_STAGGER_MS = 25`
- Each letter's opacity transitions from 0 → 1 over `LETTER_FADE_DURATION_MS = 150`
- CSS: `opacity: 0; animation: letterFadeIn LETTER_FADE_DURATION_MS ease-out forwards; animation-delay: (index × LETTER_STAGGER_MS)ms`

### Constants

```typescript
// src/types/hexVignette.ts
export const WORD_REVEAL_INTERVAL_MS = 80;    // Time between each new word appearing
export const LETTER_STAGGER_MS = 25;           // Delay between letters within a word
export const LETTER_FADE_DURATION_MS = 150;    // Duration of each letter's fade-in
export const MAX_TIER2_SENTENCES = 3;          // Cap on tier 2 sentence count
export const MAX_TIER3_SENTENCES = 4;          // Cap on tier 3 sentence count
```

## 3. Click-to-Enter

Clicking anywhere on the hex tooltip triggers `onHexClick(coord)`, which transitions to hex zoom view. This makes the tooltip a navigation shortcut — read the vignette preview, then click to dive in.

- Cursor shows `pointer` on the tooltip container
- The tooltip's `clickAction` field carries the `HexCoord` to navigate to
- This reuses the existing view state machine in GameView (`useViewNavigation`)

## 4. Visibility Gating & Prose Voice

The vignette builder changes its vocabulary based on the hex's visibility state:

| Visibility | Tier 1 | Tier 2 | Tier 3 |
|---|---|---|---|
| **visible** | Present tense, confident: *"Dense forest covers the land."* | Full detail, direct: *"A ruined tower stands to the north."* | Full prose block |
| **partial** | Present tense, confident | Hedged: *"You sense something to the north — perhaps ruins."* | Hedged phrasing |
| **remembered** | Past tense, memory: *"You recall dense forest here."* | Stale snapshot data: *"You recall a tower to the north."* | Stale + *"as you last saw it"* |
| **unexplored** | None — no tooltip | None | None |

"Remembered" hexes use `StaleSnapshot` data (locationNames, agentNames, lastSeenTick) from the visibility system. The world may have changed since — this is intentional. The player sees outdated information until they return.

"Partial" sight (adjacent hexes) uses hedged language for tier 2+3 but confident for tier 1 (terrain is always visible if the hex isn't unexplored).

## 5. Vignette Builder Pipeline

### Function Signature

```typescript
// src/engine/hexVignette.ts
export function buildHexVignette(
  graph: WorldGraph,
  tiles: HexTile[],
  hexCoord: HexCoord,
  visibility: HexVisibilityState,
  avatarHex: HexCoord | null,
  familiarityMap: FamiliarityMap,
  seed: number,
): HexVignette;
```

### Output Shape

```typescript
export interface HexVignette {
  tier1: string;           // Always-shown sentence (terrain + climate)
  tier2: string[];         // Word-revealed sentences (population + locations)
  tier3: string[];         // Hex zoom only (culture, spheres, factions, encounters)
  clickTarget: HexCoord;   // The hex to navigate to on click
}
```

### Pipeline Stages

Each stage is a **pure function** that reads graph data and picks from content templates using a seeded PRNG (deterministic per hex + world seed, so the same hex always gets the same phrasing).

**Stage 1 — Terrain Opening** → tier 1
- Input: `tile.terrain`
- Content: `TERRAIN_OPENINGS[terrain]` — 3-5 variants per terrain type
- Output: *"These ancient forests…"* or *"Dense woodland stretches across the hex…"*

**Stage 2 — Climate Feel** → tier 1 (appended to opening)
- Input: `tile.geoParams.temperature`, `tile.geoParams.moisture`
- Content: `CLIMATE_MATRIX[tempBand][moistureBand]` — 5×5 matrix of descriptive clauses
- Output: *"…where damp heat hangs beneath the canopy."*

**Stage 3 — Population Sense** → tier 2 (first sentence)
- Input: count of locations + agents in hex
- Content: `POPULATION_PHRASES[band]` — 3-4 variants per band (empty/sparse/moderate/bustling)
- Output: *"The land lies empty."* or *"A few souls linger here."*

**Stage 4 — Location Spotlights** → tier 2 (one sentence per notable location, max 2)
- Input: locations in hex with subtype, position within hex, strongest sphere influence
- Content: `LOCATION_TEMPLATES` — templates with `{name}`, `{subtype}`, `{sphere}`, `{direction}` slots
- Compass direction derived from hex-internal polygon layout position
- Output: *"To the north, Ardenmor Keep — a ruined tower touched by Order."*

**Stage 5 — Cultural Color** → tier 3
- Input: `getHexCultures()` — dominant culture name, foundation bias, venerated spheres
- Content: `CULTURE_PHRASES` — templates with `{cultureName}`, `{foundationBias}`, `{spheres}` slots
- Output: *"The people follow the ways of the Ashweavers, drawn to Chaos."*

**Stage 6 — Sphere Aura** → tier 3
- Input: `getHexSphereInfluence()` — any sphere exceeding `SPHERE_AURA_THRESHOLD` (0.3)
- Content: `SPHERE_AURA_PHRASES[sphere]` — 2-3 atmospheric sentences per sphere
- Output: *"Threads of Entropy weave through this place."*

**Stage 7 — Strategic Layer** → tier 3
- Input: `getHexFactions()`, active encounters at locations
- Content: `FACTION_PHRASES`, `ENCOUNTER_PHRASES` — templates with slots
- Output: *"The Iron Covenant holds this ground."* or *"A trial of endurance unfolds at the Shattered Sanctum."*

### Visibility Wrapping

After all stages produce their raw sentences, a final `applyVisibilityVoice()` pass wraps them in the appropriate tense/hedging based on visibility state. This keeps the stage functions clean — they produce neutral present-tense prose, and the voice layer transforms it.

```typescript
// Confident (visible): "A ruined tower stands to the north."
// Hedged (partial):    "You sense something to the north — perhaps ruins."
// Memory (remembered): "You recall a ruined tower to the north."
```

Content: `VISIBILITY_WRAPPERS` — per-visibility-state transformation templates.

## 6. Content Package: `hex-vignette-content.ts`

All prose vocabulary lives here. The engine never contains hardcoded prose strings.

```typescript
// All exports are plain data — arrays of strings or template objects.
// Adding variety means adding entries to these arrays, nothing else.

export const TERRAIN_OPENINGS: Record<TerrainType, string[]>;
export const CLIMATE_MATRIX: Record<TemperatureBand, Record<MoistureBand, string[]>>;
export const POPULATION_PHRASES: Record<PopulationBand, string[]>;
export const LOCATION_TEMPLATES: string[];        // with {name}, {subtype}, {sphere}, {direction} slots
export const CULTURE_PHRASES: string[];            // with {cultureName}, {foundationBias} slots
export const SPHERE_AURA_PHRASES: Record<AllSphereName, string[]>;
export const FACTION_PHRASES: string[];            // with {factionName} slot
export const ENCOUNTER_PHRASES: string[];          // with {encounterType}, {locationName} slots
export const VISIBILITY_WRAPPERS: Record<HexVisibilityState, VisibilityTransforms>;
export const COMPASS_WORDS: Record<CompassDirection, string[]>;  // "to the north", "northward", etc.
```

**Extensibility:** Adding variety to the game's hex tooltips means adding strings to these arrays. No engine code, no component code, no tests to update (content tests validate structural integrity, not specific string values). This is the same pattern used by all other content packages in the project.

## 7. Component Architecture

### `HexTooltipContent.tsx` (new)

A specialized tooltip content component for hexes. Does NOT replace the shared `Tooltip` component — it renders *inside* a tooltip portal.

Responsibilities:
- Receives `HexVignette` data
- Renders tier 1 immediately
- Manages word-by-word reveal timer for tier 2 (via `useEffect` interval)
- Wraps each word in letter-fade `<span>`s
- Tracks reveal progress per hex coordinate in a `useRef` Map (persists across hover cycles)
- Handles click → `onHexClick(vignette.clickTarget)`

### `HexTile.tsx` (modified)

Replace the current `<Tooltip as="g" label={tile.terrain} id={`terrain.${tile.terrain}`}>` wrapper with a custom hex tooltip that:
- Calls `buildHexVignette()` on hover (memoized by hex coordinate)
- Renders `HexTooltipContent` in the tooltip portal
- Passes `onHexClick` through for click-to-enter

### `HexZoomView.tsx` (modified)

Add a tier 3 prose block — a `<p>` element in the HexBreadcrumb header area or below it — that calls `buildHexVignette()` and renders `tier3` sentences as static text. No animation needed here.

### `useHexVignetteCache.ts` (new hook)

Caches built vignettes and reveal progress per hex coordinate for the session. Prevents rebuilding on every hover and preserves word-reveal state across hover cycles.

```typescript
interface VignetteCache {
  vignette: HexVignette;
  revealedWordCount: number;  // how many tier2 words have been revealed
  fullyRevealed: boolean;     // skip animation on re-hover
}
```

## 8. Rejected Alternatives

- **Extending resolveTooltip with hex.* prefix:** Would overload the resolver with graph query logic; untestable in isolation; no clean way to do tiered disclosure or animation from a single `TooltipContent` return.
- **Custom React component replacing Tooltip entirely:** Breaks the shared tooltip convention; too heavy for a hover interaction. We want enhancement, not replacement.
- **LLM-generated vignettes:** Violates the "generated-within-constraints" principle. Templates + content arrays are deterministic, testable, and tunable.
- **Per-letter typing animation (typewriter):** The user specifically wanted word-at-a-time reveal (not letter-at-a-time typing). The letter fade is an *opacity effect within each word*, not a typewriter.

## 9. Testing Strategy

- **Unit tests for each pipeline stage:** Feed known graph state, assert output sentences match expected templates
- **Content validation tests:** Structural integrity of all template arrays (no empty strings, slot names valid, every terrain type has entries, etc.)
- **Visibility gating tests:** Same hex with different visibility states produces different voice
- **Determinism test:** Same seed + same hex → same vignette (PRNG determinism)
- **Integration test:** Full `buildHexVignette` call with a seeded world graph, verify all tiers populated
- **Component tests:** HexTooltipContent renders tier 1 immediately, tier 2 words appear over time, click fires navigation callback
