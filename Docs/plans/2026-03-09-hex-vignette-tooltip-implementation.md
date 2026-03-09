# Hex Vignette Tooltip — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a narrative vignette tooltip for hex tiles that composes tiered prose from world graph data, with word-by-word reveal animation and click-to-enter navigation.

**Architecture:** Pure function pipeline (`buildHexVignette`) harvests graph data through 7 stages, producing 3 tiers of prose. Content lives in a separate `hex-vignette-content.ts` package. A new `HexTooltipContent` component handles word-by-word reveal with per-word letter fade animation. Tier 1+2 show in the world map tooltip; tier 3 renders inline in HexZoomView.

**Tech Stack:** React + TypeScript, seeded PRNG (existing `src/engine/prng.ts`), CSS animations for letter fade, existing Tooltip portal pattern, existing hexZoom query functions.

**Design doc:** `Docs/plans/2026-03-09-hex-vignette-tooltip-design.md`

---

### Task 1: Types & Constants

**Files:**
- Create: `src/types/hexVignette.ts`
- Test: `src/types/__tests__/hexVignette.test.ts`

**Step 1: Write the types and constants file**

```typescript
// src/types/hexVignette.ts

import type { HexCoord } from './index';
import type { HexVisibilityState } from './visibility';

// ─── Animation Constants ────────────────────────────────────────────
export const WORD_REVEAL_INTERVAL_MS = 80;    // Time between each new word appearing
export const LETTER_STAGGER_MS = 25;           // Delay between letters within a word
export const LETTER_FADE_DURATION_MS = 150;    // Duration of each letter's fade-in
export const MAX_TIER2_SENTENCES = 3;          // Cap on tier 2 sentence count
export const MAX_TIER3_SENTENCES = 4;          // Cap on tier 3 sentence count

// ─── Pipeline Constants ─────────────────────────────────────────────
export const SPHERE_AURA_THRESHOLD = 0.3;      // Minimum sphere influence to trigger aura text
export const MAX_LOCATION_SPOTLIGHTS = 2;      // Max locations mentioned in tier 2

// ─── Temperature/Moisture Bands ─────────────────────────────────────
export type TemperatureBand = 'frigid' | 'cold' | 'temperate' | 'warm' | 'scorching';
export type MoistureBand = 'arid' | 'dry' | 'moderate' | 'damp' | 'saturated';
export type PopulationBand = 'empty' | 'sparse' | 'moderate' | 'bustling';
export type CompassDirection = 'north' | 'northeast' | 'east' | 'southeast' | 'south' | 'southwest' | 'west' | 'northwest';

/** Band breakpoints for GeoParams (0.0–1.0) → 5 bands */
export const TEMPERATURE_THRESHOLDS: number[] = [0.2, 0.4, 0.6, 0.8]; // <0.2=frigid, etc.
export const MOISTURE_THRESHOLDS: number[] = [0.2, 0.4, 0.6, 0.8];

/** Population count → band */
export const POPULATION_THRESHOLDS = { sparse: 1, moderate: 3, bustling: 6 };

// ─── Output Types ───────────────────────────────────────────────────

/** The complete vignette output for a hex. */
export interface HexVignette {
  tier1: string;           // Always-shown sentence (terrain + climate)
  tier2: string[];         // Word-revealed sentences (population + locations)
  tier3: string[];         // Hex zoom only (culture, spheres, factions, encounters)
  clickTarget: HexCoord;   // The hex to navigate to on click
}

/** Visibility voice transforms applied after stage generation. */
export interface VisibilityTransforms {
  wrapTier1: (sentence: string) => string;
  wrapTier2: (sentence: string) => string;
  wrapTier3: (sentence: string) => string;
}
```

**Step 2: Write a basic structural test**

```typescript
// src/types/__tests__/hexVignette.test.ts
import { describe, it, expect } from 'vitest';
import {
  WORD_REVEAL_INTERVAL_MS,
  LETTER_STAGGER_MS,
  LETTER_FADE_DURATION_MS,
  MAX_TIER2_SENTENCES,
  MAX_TIER3_SENTENCES,
  SPHERE_AURA_THRESHOLD,
  MAX_LOCATION_SPOTLIGHTS,
  TEMPERATURE_THRESHOLDS,
  MOISTURE_THRESHOLDS,
  POPULATION_THRESHOLDS,
} from '../hexVignette';

describe('hexVignette types', () => {
  it('animation constants are positive numbers', () => {
    expect(WORD_REVEAL_INTERVAL_MS).toBeGreaterThan(0);
    expect(LETTER_STAGGER_MS).toBeGreaterThan(0);
    expect(LETTER_FADE_DURATION_MS).toBeGreaterThan(0);
  });

  it('tier caps are reasonable', () => {
    expect(MAX_TIER2_SENTENCES).toBeGreaterThanOrEqual(1);
    expect(MAX_TIER2_SENTENCES).toBeLessThanOrEqual(5);
    expect(MAX_TIER3_SENTENCES).toBeGreaterThanOrEqual(1);
    expect(MAX_TIER3_SENTENCES).toBeLessThanOrEqual(6);
  });

  it('temperature thresholds divide 0-1 into 5 bands', () => {
    expect(TEMPERATURE_THRESHOLDS).toHaveLength(4);
    for (let i = 1; i < TEMPERATURE_THRESHOLDS.length; i++) {
      expect(TEMPERATURE_THRESHOLDS[i]).toBeGreaterThan(TEMPERATURE_THRESHOLDS[i - 1]);
    }
  });

  it('moisture thresholds divide 0-1 into 5 bands', () => {
    expect(MOISTURE_THRESHOLDS).toHaveLength(4);
  });

  it('population thresholds are monotonically increasing', () => {
    expect(POPULATION_THRESHOLDS.sparse).toBeLessThan(POPULATION_THRESHOLDS.moderate);
    expect(POPULATION_THRESHOLDS.moderate).toBeLessThan(POPULATION_THRESHOLDS.bustling);
  });

  it('sphere aura threshold is between 0 and 1', () => {
    expect(SPHERE_AURA_THRESHOLD).toBeGreaterThan(0);
    expect(SPHERE_AURA_THRESHOLD).toBeLessThan(1);
  });

  it('max location spotlights is positive', () => {
    expect(MAX_LOCATION_SPOTLIGHTS).toBeGreaterThanOrEqual(1);
  });
});
```

**Step 3: Run tests to verify they pass**

Run: `npx vitest run src/types/__tests__/hexVignette.test.ts`
Expected: PASS — all 7 structural tests pass

**Step 4: Commit**

```bash
git add src/types/hexVignette.ts src/types/__tests__/hexVignette.test.ts
git commit -m "feat(vignette): add hex vignette types and constants"
```

---

### Task 2: Content Package — Terrain Openings & Climate Matrix

**Files:**
- Create: `src/data/hex-vignette-content.ts`
- Test: `src/data/__tests__/hex-vignette-content.test.ts`

**Context:** This is the extensible content package. All prose vocabulary lives here. The engine never contains hardcoded prose strings. Follow the pattern in `src/data/narrative-content.ts` and `src/data/doom-content.ts`.

**Step 1: Create the content package with terrain openings and climate matrix**

```typescript
// src/data/hex-vignette-content.ts
/**
 * Hex Vignette Content Package — All prose vocabulary for hex tooltips.
 *
 * ═══════════════════════════════════════════════════════════════════
 * CONTENT MANAGER: This is the file you edit to add variety to hex tooltips.
 * Adding entries to these arrays requires NO engine or component changes.
 * ═══════════════════════════════════════════════════════════════════
 */

import type { TerrainType } from '../types';
import type { HexVisibilityState } from '../types/visibility';
import type {
  TemperatureBand,
  MoistureBand,
  PopulationBand,
  CompassDirection,
  VisibilityTransforms,
} from '../types/hexVignette';
import type { AllSphereName } from './hex-tile-assets';

// ═══════════════════════════════════════════════════════════════════
// 1. TERRAIN OPENINGS — Tier 1 first clause
// ═══════════════════════════════════════════════════════════════════

/**
 * 3-5 opening sentence variants per terrain type.
 * These form the first part of the tier 1 sentence.
 * The climate clause (from CLIMATE_MATRIX) is appended after.
 */
export const TERRAIN_OPENINGS: Record<TerrainType, string[]> = {
  // Water
  ocean: [
    'Deep waters stretch endlessly here.',
    'The open sea dominates this expanse.',
    'Dark ocean currents churn beneath the surface.',
  ],
  coastal_shallows: [
    'Shallow waters lap against the shore.',
    'The coastline breaks into sandy shallows.',
    'Turquoise waters reveal the sea floor below.',
  ],
  lake: [
    'A still lake mirrors the sky.',
    'Calm waters fill this lowland basin.',
    'A lake of dark water rests here.',
  ],
  river: [
    'A river cuts through the landscape.',
    'Flowing water carves its path onward.',
    'The river bends and widens here.',
  ],
  // Lowlands
  grassland: [
    'Open grasslands roll toward the horizon.',
    'Tall grasses sway across the plain.',
    'The land stretches flat and green.',
  ],
  farmland: [
    'Tended fields pattern the landscape.',
    'Rows of crops mark cultivated earth.',
    'Farmland spreads in ordered parcels.',
  ],
  savanna: [
    'Scattered trees dot the dry grassland.',
    'The savanna shimmers under an open sky.',
    'Golden grass stretches between sparse acacias.',
  ],
  steppe: [
    'Wind-swept steppe extends in every direction.',
    'Short grass covers the dry plain.',
    'The open steppe offers no shelter.',
  ],
  // Forest
  deciduous_forest: [
    'These ancient forests shade the land.',
    'Dense woodland stretches across the hex.',
    'Broad-leafed trees form a canopy overhead.',
  ],
  dense_forest: [
    'Impenetrable forest fills every hollow.',
    'Old-growth trees crowd together in darkness.',
    'The forest is thick and primordial.',
  ],
  taiga: [
    'Evergreen forest blankets the cold earth.',
    'Spruce and pine stand in silent ranks.',
    'The taiga stretches northward without end.',
  ],
  jungle: [
    'Lush jungle teems with hidden life.',
    'Vines and broadleaves fight for light.',
    'The jungle canopy blocks out the sky.',
  ],
  // Wet
  swamp: [
    'Murky water pools beneath twisted roots.',
    'The swamp breathes mist and decay.',
    'Boggy ground sinks underfoot here.',
  ],
  bog: [
    'Peat moss covers the waterlogged ground.',
    'The bog stretches, treacherous and silent.',
    'Stagnant water hides beneath a skin of moss.',
  ],
  // Elevated
  hills: [
    'Rolling hills define the landscape.',
    'The land rises and falls in gentle crests.',
    'Grass-covered hills catch the wind.',
  ],
  mountains: [
    'Jagged peaks pierce the clouds.',
    'The mountains rise, immovable and ancient.',
    'Rock and snow dominate the heights.',
  ],
  plateau: [
    'A flat-topped plateau commands the view.',
    'The plateau rises abruptly from the lowlands.',
    'High tableland stretches above the valleys.',
  ],
  badlands: [
    'Eroded pillars and ravines scar the earth.',
    'The badlands crack and crumble underfoot.',
    'Wind-carved stone forms alien shapes.',
  ],
  // Elevated + forested
  forested_hills_evergreen: [
    'Pine-clad hills roll into the distance.',
    'Evergreen forests climb the hillsides.',
    'Dark conifers blanket the rising ground.',
  ],
  forested_hills_deciduous: [
    'Wooded hills shelter hidden valleys.',
    'Deciduous forest covers the undulating land.',
    'Leafy canopies drape over rolling hills.',
  ],
  forested_hills_jungle: [
    'Tropical forest clings to steep hillsides.',
    'Jungle growth spills over the ridgelines.',
    'Dense vegetation swallows the hilly terrain.',
  ],
  // Special
  great_home_trees: [
    'Colossal trees tower above the canopy.',
    'The great home trees are monuments to life.',
    'Ancient trunks wider than towers rise here.',
  ],
  broken_lands: [
    'The earth itself is shattered and wrong.',
    'Reality fractures across the broken lands.',
    'Twisted terrain defies natural order.',
  ],
  // Extreme
  desert: [
    'Sun-blasted dunes stretch to the horizon.',
    'The desert offers nothing but sand and silence.',
    'Parched earth cracks beneath a merciless sun.',
  ],
  tundra: [
    'Frozen tundra extends beneath a pale sky.',
    'Lichens and moss cling to the permafrost.',
    'The tundra lies still, locked in cold.',
  ],
  glacier: [
    'Blue ice groans and shifts underfoot.',
    'The glacier crawls forward, ancient and patient.',
    'A frozen river of ice dominates the land.',
  ],
  volcanic: [
    'Volcanic rock radiates lingering heat.',
    'The ground smokes near vents and fissures.',
    'Lava once flowed here — the scars remain.',
  ],
};

// ═══════════════════════════════════════════════════════════════════
// 2. CLIMATE MATRIX — Tier 1 second clause
// ═══════════════════════════════════════════════════════════════════

/**
 * 5×5 matrix mapping temperature band × moisture band to descriptive clauses.
 * Each cell has 2-3 variants. Appended to terrain opening to complete tier 1.
 */
export const CLIMATE_MATRIX: Record<TemperatureBand, Record<MoistureBand, string[]>> = {
  frigid: {
    arid: ['A biting, dry cold clings to everything.', 'The air is brittle and bone-dry.'],
    dry: ['Frost coats the sparse ground.', 'Cold and dry, the land barely sustains life.'],
    moderate: ['Snow falls softly on the frozen ground.', 'The cold is sharp but not without moisture.'],
    damp: ['Icy fog drifts across the landscape.', 'Damp cold seeps into everything.'],
    saturated: ['Freezing mist hangs in the still air.', 'Everything drips and freezes in turn.'],
  },
  cold: {
    arid: ['The cold air is crisp and clear.', 'A dry chill settles over the land.'],
    dry: ['Cool winds carry no hint of rain.', 'The dry cold is bracing.'],
    moderate: ['The air is cool and fresh.', 'A pleasant chill accompanies the breeze.'],
    damp: ['Cold dampness clings to skin and cloth.', 'Mist rolls through at dawn and dusk.'],
    saturated: ['Rain and cold conspire without end.', 'The ground never dries under grey skies.'],
  },
  temperate: {
    arid: ['Warm and dry, the land thirsts quietly.', 'The temperate climate lacks only rain.'],
    dry: ['Mild air and low moisture define this place.', 'The weather is pleasant but parched.'],
    moderate: ['The climate is mild and balanced.', 'Neither too hot nor too cold, neither parched nor flooded.'],
    damp: ['Gentle rains keep the land green.', 'The air carries the scent of damp earth.'],
    saturated: ['Persistent rain feeds every hollow.', 'Water is never far from the surface.'],
  },
  warm: {
    arid: ['Heat shimmers off the dry ground.', 'The warm air is painfully dry.'],
    dry: ['Warmth radiates from sun-baked earth.', 'The land is warm and thirsty.'],
    moderate: ['Warm breezes carry a hint of moisture.', 'The climate is warm and livable.'],
    damp: ['Humid warmth hangs beneath the canopy.', 'Damp heat clings to everything.'],
    saturated: ['Tropical moisture saturates the thick air.', 'Water and warmth conspire endlessly.'],
  },
  scorching: {
    arid: ['The sun punishes all beneath it.', 'Scorching heat and no water — death walks here.'],
    dry: ['Blistering heat dries the earth to dust.', 'The heat is relentless and dry.'],
    moderate: ['Hot winds carry a hint of distant rain.', 'The scorching air holds some moisture.'],
    damp: ['Sweltering humidity makes the air heavy.', 'Oppressive heat and damp refuse to relent.'],
    saturated: ['Steam rises from the soaked, baking earth.', 'The air is a furnace of wet heat.'],
  },
};

// ═══════════════════════════════════════════════════════════════════
// 3. POPULATION PHRASES — Tier 2 first sentence
// ═══════════════════════════════════════════════════════════════════

export const POPULATION_PHRASES: Record<PopulationBand, string[]> = {
  empty: [
    'The land lies empty.',
    'No souls linger here.',
    'This place stands abandoned to the wild.',
  ],
  sparse: [
    'A few souls linger here.',
    'Sparse signs of habitation mark the land.',
    'Life here is thin and scattered.',
  ],
  moderate: [
    'A settled presence marks this hex.',
    'Communities have taken root here.',
    'The land supports a modest population.',
  ],
  bustling: [
    'The land teems with activity.',
    'Civilization thrives here.',
    'A bustling presence fills the hex.',
  ],
};

// ═══════════════════════════════════════════════════════════════════
// 4. LOCATION TEMPLATES — Tier 2 spotlight sentences
// ═══════════════════════════════════════════════════════════════════

/**
 * Templates with {name}, {subtype}, {sphere}, {direction} slots.
 * One sentence per notable location, max MAX_LOCATION_SPOTLIGHTS.
 */
export const LOCATION_TEMPLATES: string[] = [
  '{direction}, {name} — a {subtype} touched by {sphere}.',
  'A {subtype} called {name} stands {direction}, resonating with {sphere}.',
  '{name}, a {subtype}, rises {direction}.',
  '{direction} lies {name}, a {subtype} steeped in {sphere}.',
  'The {subtype} of {name} watches {direction}, marked by {sphere}.',
];

// ═══════════════════════════════════════════════════════════════════
// 5. CULTURE PHRASES — Tier 3
// ═══════════════════════════════════════════════════════════════════

/**
 * Templates with {cultureName}, {foundationBias}, {spheres} slots.
 */
export const CULTURE_PHRASES: string[] = [
  'The people follow the ways of the {cultureName}, drawn to {foundationBias}.',
  'The {cultureName} hold sway here, their ways shaped by {foundationBias}.',
  '{cultureName} traditions mark the culture, rooted in {foundationBias}.',
  'The influence of the {cultureName} is felt — their bond to {foundationBias} runs deep.',
];

// ═══════════════════════════════════════════════════════════════════
// 6. SPHERE AURA PHRASES — Tier 3
// ═══════════════════════════════════════════════════════════════════

/**
 * 2-3 atmospheric sentences per sphere for when influence exceeds SPHERE_AURA_THRESHOLD.
 */
export const SPHERE_AURA_PHRASES: Record<AllSphereName, string[]> = {
  force: [
    'Threads of Force pulse through this place.',
    'A tension hangs in the air — raw power, barely contained.',
  ],
  matter: [
    'The earth here feels dense, almost alive with Matter.',
    'Stone and soil resonate with an unnatural solidity.',
  ],
  energy: [
    'Sparks of Energy crackle at the edges of perception.',
    'The air hums with latent Energy.',
  ],
  life: [
    'Life surges abundantly — every surface teems with growth.',
    'The pulse of Life beats strong in this place.',
  ],
  mind: [
    'Thoughts sharpen near this place — Mind touches everything.',
    'A clarity hangs in the air, sharp and demanding.',
  ],
  spirit: [
    'The veil between worlds thins here — Spirit seeps through.',
    'Whispers of Spirit drift on unseen currents.',
  ],
  time: [
    'Time moves strangely here — moments stretch and compress.',
    'The weight of ages presses down on this place.',
  ],
  entropy: [
    'Threads of Entropy weave through this place.',
    'Something unravels quietly — the touch of Entropy.',
  ],
  chaos: [
    'The air shimmers with unpredictability — Chaos reigns.',
    'Nothing stays fixed for long in this place.',
  ],
  order: [
    'An invisible structure holds everything in place — Order prevails.',
    'Patterns repeat with uncanny precision here.',
  ],
  light: [
    'A radiance suffuses this place, sourceless and warm.',
    'Light touches even the deepest shadows here.',
  ],
  darkness: [
    'Shadows pool thickly, even in daylight.',
    'Darkness clings to every surface, reluctant to release.',
  ],
};

// ═══════════════════════════════════════════════════════════════════
// 7. FACTION PHRASES — Tier 3
// ═══════════════════════════════════════════════════════════════════

/**
 * Templates with {factionName} slot.
 */
export const FACTION_PHRASES: string[] = [
  'The {factionName} hold this ground.',
  '{factionName} banners mark the territory.',
  'This land answers to the {factionName}.',
  'The grip of the {factionName} is felt here.',
];

// ═══════════════════════════════════════════════════════════════════
// 8. ENCOUNTER PHRASES — Tier 3
// ═══════════════════════════════════════════════════════════════════

/**
 * Templates with {encounterType}, {locationName} slots.
 */
export const ENCOUNTER_PHRASES: string[] = [
  'A trial of {encounterType} unfolds at {locationName}.',
  'Something stirs at {locationName} — a matter of {encounterType}.',
  'Events at {locationName} demand attention — {encounterType} is afoot.',
];

// ═══════════════════════════════════════════════════════════════════
// 9. COMPASS WORDS — Direction vocabulary
// ═══════════════════════════════════════════════════════════════════

/**
 * Multiple phrasings per compass direction for variety.
 */
export const COMPASS_WORDS: Record<CompassDirection, string[]> = {
  north:     ['To the north', 'Northward', 'In the northern reaches'],
  northeast: ['To the northeast', 'Northeastward'],
  east:      ['To the east', 'Eastward', 'In the eastern quarter'],
  southeast: ['To the southeast', 'Southeastward'],
  south:     ['To the south', 'Southward', 'In the southern reaches'],
  southwest: ['To the southwest', 'Southwestward'],
  west:      ['To the west', 'Westward', 'In the western quarter'],
  northwest: ['To the northwest', 'Northwestward'],
};

// ═══════════════════════════════════════════════════════════════════
// 10. VISIBILITY WRAPPERS — Voice transformations
// ═══════════════════════════════════════════════════════════════════

/**
 * Per-visibility-state transformation functions.
 * 'visible' = passthrough (confident present tense).
 * 'partial' = hedged for tier 2+3 only.
 * 'remembered' = past tense memory voice.
 * 'unexplored' = should never be called (no tooltip).
 */
export const VISIBILITY_WRAPPERS: Record<HexVisibilityState, VisibilityTransforms> = {
  visible: {
    wrapTier1: (s) => s,
    wrapTier2: (s) => s,
    wrapTier3: (s) => s,
  },
  remembered: {
    wrapTier1: (s) => `You recall: ${s.charAt(0).toLowerCase()}${s.slice(1)}`,
    wrapTier2: (s) => `You recall ${s.charAt(0).toLowerCase()}${s.slice(1)}`,
    wrapTier3: (s) => `${s.replace(/\.$/, '')} — as you last saw it.`,
  },
  unexplored: {
    wrapTier1: (s) => s,
    wrapTier2: (s) => s,
    wrapTier3: (s) => s,
  },
};

// ═══════════════════════════════════════════════════════════════════
// 11. SUBTYPE DISPLAY NAMES — Human-readable location subtype labels
// ═══════════════════════════════════════════════════════════════════

import type { LocationSubtype } from '../types';

export const SUBTYPE_DISPLAY_NAMES: Record<LocationSubtype, string> = {
  hamlet: 'hamlet',
  town: 'town',
  city: 'city',
  capital: 'capital',
  camp: 'camp',
  farmland: 'farmstead',
  castle: 'castle',
  fort: 'fort',
  tower: 'tower',
  shrine: 'shrine',
  temple: 'temple',
  mining: 'mining outpost',
  ruins: 'ruins',
  ruined_tower: 'ruined tower',
  ruined_city: 'ruined city',
  ruined_village: 'ruined village',
  battleground: 'battleground',
  oasis: 'oasis',
  unexplored_poi: 'unknown site',
  wilderness: 'wilderness',
};
```

**Step 2: Write the structural content tests**

```typescript
// src/data/__tests__/hex-vignette-content.test.ts
import { describe, it, expect } from 'vitest';
import {
  TERRAIN_OPENINGS,
  CLIMATE_MATRIX,
  POPULATION_PHRASES,
  LOCATION_TEMPLATES,
  CULTURE_PHRASES,
  SPHERE_AURA_PHRASES,
  FACTION_PHRASES,
  ENCOUNTER_PHRASES,
  COMPASS_WORDS,
  VISIBILITY_WRAPPERS,
  SUBTYPE_DISPLAY_NAMES,
} from '../hex-vignette-content';

const ALL_TERRAINS = [
  'ocean','coastal_shallows','lake','river',
  'grassland','farmland','savanna','steppe',
  'deciduous_forest','dense_forest','taiga','jungle',
  'swamp','bog',
  'hills','mountains','plateau','badlands',
  'forested_hills_evergreen','forested_hills_deciduous','forested_hills_jungle',
  'great_home_trees','broken_lands',
  'desert','tundra','glacier','volcanic',
] as const;

const TEMP_BANDS = ['frigid','cold','temperate','warm','scorching'] as const;
const MOISTURE_BANDS = ['arid','dry','moderate','damp','saturated'] as const;
const POP_BANDS = ['empty','sparse','moderate','bustling'] as const;
const COMPASS_DIRS = ['north','northeast','east','southeast','south','southwest','west','northwest'] as const;

describe('hex-vignette-content', () => {
  describe('TERRAIN_OPENINGS', () => {
    it('has entries for all 27 terrain types', () => {
      for (const t of ALL_TERRAINS) {
        expect(TERRAIN_OPENINGS[t], `missing terrain: ${t}`).toBeDefined();
        expect(TERRAIN_OPENINGS[t].length).toBeGreaterThanOrEqual(2);
      }
    });

    it('all entries are non-empty strings', () => {
      for (const variants of Object.values(TERRAIN_OPENINGS)) {
        for (const s of variants) {
          expect(typeof s).toBe('string');
          expect(s.length).toBeGreaterThan(10);
        }
      }
    });
  });

  describe('CLIMATE_MATRIX', () => {
    it('covers all 25 temperature×moisture combinations', () => {
      for (const t of TEMP_BANDS) {
        for (const m of MOISTURE_BANDS) {
          expect(CLIMATE_MATRIX[t][m], `missing ${t}×${m}`).toBeDefined();
          expect(CLIMATE_MATRIX[t][m].length).toBeGreaterThanOrEqual(2);
        }
      }
    });

    it('all entries are non-empty strings', () => {
      for (const tempMap of Object.values(CLIMATE_MATRIX)) {
        for (const variants of Object.values(tempMap)) {
          for (const s of variants) {
            expect(typeof s).toBe('string');
            expect(s.length).toBeGreaterThan(10);
          }
        }
      }
    });
  });

  describe('POPULATION_PHRASES', () => {
    it('covers all 4 bands', () => {
      for (const b of POP_BANDS) {
        expect(POPULATION_PHRASES[b], `missing band: ${b}`).toBeDefined();
        expect(POPULATION_PHRASES[b].length).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe('LOCATION_TEMPLATES', () => {
    it('has at least 3 templates', () => {
      expect(LOCATION_TEMPLATES.length).toBeGreaterThanOrEqual(3);
    });

    it('all templates contain required slots', () => {
      for (const t of LOCATION_TEMPLATES) {
        expect(t).toContain('{name}');
        expect(t).toContain('{subtype}');
      }
    });
  });

  describe('CULTURE_PHRASES', () => {
    it('has at least 3 variants', () => {
      expect(CULTURE_PHRASES.length).toBeGreaterThanOrEqual(3);
    });

    it('all contain {cultureName} slot', () => {
      for (const p of CULTURE_PHRASES) {
        expect(p).toContain('{cultureName}');
      }
    });
  });

  describe('SPHERE_AURA_PHRASES', () => {
    it('has entries for all 12 spheres', () => {
      const expected = ['force','matter','energy','life','mind','spirit','time','entropy','chaos','order','light','darkness'];
      for (const s of expected) {
        expect(SPHERE_AURA_PHRASES[s as keyof typeof SPHERE_AURA_PHRASES], `missing sphere: ${s}`).toBeDefined();
        expect(SPHERE_AURA_PHRASES[s as keyof typeof SPHERE_AURA_PHRASES].length).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe('FACTION_PHRASES', () => {
    it('has at least 3 variants with {factionName} slot', () => {
      expect(FACTION_PHRASES.length).toBeGreaterThanOrEqual(3);
      for (const p of FACTION_PHRASES) {
        expect(p).toContain('{factionName}');
      }
    });
  });

  describe('ENCOUNTER_PHRASES', () => {
    it('has at least 2 variants with required slots', () => {
      expect(ENCOUNTER_PHRASES.length).toBeGreaterThanOrEqual(2);
      for (const p of ENCOUNTER_PHRASES) {
        expect(p).toContain('{encounterType}');
        expect(p).toContain('{locationName}');
      }
    });
  });

  describe('COMPASS_WORDS', () => {
    it('covers all 8 directions', () => {
      for (const d of COMPASS_DIRS) {
        expect(COMPASS_WORDS[d], `missing direction: ${d}`).toBeDefined();
        expect(COMPASS_WORDS[d].length).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe('VISIBILITY_WRAPPERS', () => {
    it('visible wrapper is identity', () => {
      const w = VISIBILITY_WRAPPERS.visible;
      expect(w.wrapTier1('Test.')).toBe('Test.');
      expect(w.wrapTier2('Test.')).toBe('Test.');
      expect(w.wrapTier3('Test.')).toBe('Test.');
    });

    it('remembered wrapper transforms to memory voice', () => {
      const w = VISIBILITY_WRAPPERS.remembered;
      const result = w.wrapTier1('Dense forest covers the land.');
      expect(result).toContain('recall');
    });
  });

  describe('SUBTYPE_DISPLAY_NAMES', () => {
    it('has entries for all 20 location subtypes', () => {
      const subtypes = [
        'hamlet','town','city','capital','camp','farmland',
        'castle','fort','tower','shrine','temple','mining',
        'ruins','ruined_tower','ruined_city','ruined_village',
        'battleground','oasis','unexplored_poi','wilderness',
      ];
      for (const s of subtypes) {
        expect(SUBTYPE_DISPLAY_NAMES[s as keyof typeof SUBTYPE_DISPLAY_NAMES], `missing subtype: ${s}`).toBeDefined();
      }
    });
  });
});
```

**Step 3: Run tests to verify they pass**

Run: `npx vitest run src/data/__tests__/hex-vignette-content.test.ts`
Expected: PASS — all structural validation tests pass

**Step 4: Commit**

```bash
git add src/data/hex-vignette-content.ts src/data/__tests__/hex-vignette-content.test.ts
git commit -m "feat(vignette): add hex vignette content package with structural tests"
```

---

### Task 3: Vignette Builder Engine — Helper Functions

**Files:**
- Create: `src/engine/hexVignette.ts`
- Test: `src/engine/__tests__/hexVignette.test.ts`

**Context:** Pure functions that map GeoParams → bands and polygon positions → compass directions. These are small helpers needed by the main pipeline.

**Step 1: Write failing tests for helper functions**

```typescript
// src/engine/__tests__/hexVignette.test.ts
import { describe, it, expect } from 'vitest';
import {
  getTemperatureBand,
  getMoistureBand,
  getPopulationBand,
  getCompassDirection,
} from '../hexVignette';

describe('hexVignette helpers', () => {
  describe('getTemperatureBand', () => {
    it('returns frigid for 0.0', () => expect(getTemperatureBand(0.0)).toBe('frigid'));
    it('returns frigid for 0.19', () => expect(getTemperatureBand(0.19)).toBe('frigid'));
    it('returns cold for 0.2', () => expect(getTemperatureBand(0.2)).toBe('cold'));
    it('returns temperate for 0.5', () => expect(getTemperatureBand(0.5)).toBe('temperate'));
    it('returns scorching for 0.9', () => expect(getTemperatureBand(0.9)).toBe('scorching'));
  });

  describe('getMoistureBand', () => {
    it('returns arid for 0.0', () => expect(getMoistureBand(0.0)).toBe('arid'));
    it('returns saturated for 1.0', () => expect(getMoistureBand(1.0)).toBe('saturated'));
  });

  describe('getPopulationBand', () => {
    it('returns empty for 0', () => expect(getPopulationBand(0)).toBe('empty'));
    it('returns sparse for 1', () => expect(getPopulationBand(1)).toBe('sparse'));
    it('returns moderate for 3', () => expect(getPopulationBand(3)).toBe('moderate'));
    it('returns bustling for 7', () => expect(getPopulationBand(7)).toBe('bustling'));
  });

  describe('getCompassDirection', () => {
    it('returns north for angle near 90°', () => expect(getCompassDirection(85)).toBe('north'));
    it('returns east for angle near 0°', () => expect(getCompassDirection(5)).toBe('east'));
    it('returns south for angle near 270°', () => expect(getCompassDirection(265)).toBe('south'));
    it('returns west for angle near 180°', () => expect(getCompassDirection(175)).toBe('west'));
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/engine/__tests__/hexVignette.test.ts`
Expected: FAIL — functions not defined

**Step 3: Implement helper functions**

```typescript
// src/engine/hexVignette.ts
/**
 * Hex Vignette Builder — Pure functions composing narrative vignettes from graph data.
 *
 * Each pipeline stage reads graph data and picks from content templates
 * using a seeded PRNG. The same hex + seed always produces the same phrasing.
 */

import type { HexCoord, HexTile, TerrainType, LocationSubtype } from '../types';
import type { HexVisibilityState, StaleSnapshot } from '../types/visibility';
import type {
  TemperatureBand,
  MoistureBand,
  PopulationBand,
  CompassDirection,
  HexVignette,
} from '../types/hexVignette';
import {
  TEMPERATURE_THRESHOLDS,
  MOISTURE_THRESHOLDS,
  POPULATION_THRESHOLDS,
  SPHERE_AURA_THRESHOLD,
  MAX_TIER2_SENTENCES,
  MAX_TIER3_SENTENCES,
  MAX_LOCATION_SPOTLIGHTS,
} from '../types/hexVignette';
import type { WorldGraph } from './graph';
import type { FamiliarityMap } from '../types/familiarity';
import {
  TERRAIN_OPENINGS,
  CLIMATE_MATRIX,
  POPULATION_PHRASES,
  LOCATION_TEMPLATES,
  CULTURE_PHRASES,
  SPHERE_AURA_PHRASES,
  FACTION_PHRASES,
  ENCOUNTER_PHRASES,
  COMPASS_WORDS,
  VISIBILITY_WRAPPERS,
  SUBTYPE_DISPLAY_NAMES,
} from '../data/hex-vignette-content';
import {
  getLocationsInHex,
  getAgentsAtLocation,
  getHexSphereInfluence,
  getHexCultures,
  getHexFactions,
} from './hexZoom';
import { SPHERE_NAMES } from '../types';

// ─── Band Helpers ───────────────────────────────────────────────────

const TEMP_BANDS: TemperatureBand[] = ['frigid', 'cold', 'temperate', 'warm', 'scorching'];
const MOISTURE_BANDS: MoistureBand[] = ['arid', 'dry', 'moderate', 'damp', 'saturated'];

export function getTemperatureBand(temperature: number): TemperatureBand {
  for (let i = 0; i < TEMPERATURE_THRESHOLDS.length; i++) {
    if (temperature < TEMPERATURE_THRESHOLDS[i]) return TEMP_BANDS[i];
  }
  return TEMP_BANDS[TEMP_BANDS.length - 1];
}

export function getMoistureBand(moisture: number): MoistureBand {
  for (let i = 0; i < MOISTURE_THRESHOLDS.length; i++) {
    if (moisture < MOISTURE_THRESHOLDS[i]) return MOISTURE_BANDS[i];
  }
  return MOISTURE_BANDS[MOISTURE_BANDS.length - 1];
}

export function getPopulationBand(count: number): PopulationBand {
  if (count <= 0) return 'empty';
  if (count < POPULATION_THRESHOLDS.moderate) return 'sparse';
  if (count < POPULATION_THRESHOLDS.bustling) return 'moderate';
  return 'bustling';
}

/**
 * Map an angle (degrees, 0=east, counter-clockwise) to a compass direction.
 * Used to describe where a location sits within the hex polygon layout.
 */
export function getCompassDirection(angleDeg: number): CompassDirection {
  // Normalize to 0-360
  const a = ((angleDeg % 360) + 360) % 360;
  if (a < 22.5 || a >= 337.5) return 'east';
  if (a < 67.5) return 'northeast';
  if (a < 112.5) return 'north';
  if (a < 157.5) return 'northwest';
  if (a < 202.5) return 'west';
  if (a < 247.5) return 'southwest';
  if (a < 292.5) return 'south';
  return 'southeast';
}

// ─── Seeded PRNG Pick ───────────────────────────────────────────────

/** Simple seeded hash for deterministic picks. */
function hashSeed(seed: number, ...extra: number[]): number {
  let h = seed;
  for (const x of extra) {
    h = ((h << 5) - h + x) | 0;
  }
  return Math.abs(h);
}

function pick<T>(arr: readonly T[], seed: number, ...extra: number[]): T {
  const idx = hashSeed(seed, ...extra) % arr.length;
  return arr[idx];
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/engine/__tests__/hexVignette.test.ts`
Expected: PASS — all 11 helper tests pass

**Step 5: Commit**

```bash
git add src/engine/hexVignette.ts src/engine/__tests__/hexVignette.test.ts
git commit -m "feat(vignette): add vignette builder helper functions with tests"
```

---

### Task 4: Vignette Builder Engine — Full Pipeline

**Files:**
- Modify: `src/engine/hexVignette.ts` (append `buildHexVignette`)
- Test: `src/engine/__tests__/hexVignette.test.ts` (extend)

**Step 1: Write failing tests for the full pipeline**

Add to `src/engine/__tests__/hexVignette.test.ts`:

```typescript
import { buildHexVignette } from '../hexVignette';
import { createWorldGraph } from '../graph';
import type { HexTile } from '../../types';

describe('buildHexVignette', () => {
  function makeGraph() {
    const graph = createWorldGraph();
    // Add a location in hex 3,2
    graph.addNode({
      id: 'loc-1', type: 'location', name: 'Ardenmor Keep',
      properties: { hexCol: 3, hexRow: 2, locationSubtype: 'ruined_tower', terrain: 'hills',
        sphereBiases: { force: 0.5, matter: 0.1, energy: 0, life: 0, mind: 0, spirit: 0, time: 0, entropy: 0 },
        sphereInfluence: { force: 0.4 },
      },
    });
    // Add an agent at that location
    graph.addNode({ id: 'agent-1', type: 'actor', name: 'Kael', properties: { actorType: 'individual' } });
    graph.addEdge({ id: 'e-1', source: 'agent-1', target: 'loc-1', type: 'located_at', properties: {} });
    return graph;
  }

  const tile: HexTile = {
    coord: { col: 3, row: 2 },
    geoParams: { elevation: 0.5, temperature: 0.7, moisture: 0.3 },
    terrain: 'hills',
  };

  it('returns a HexVignette with all tiers', () => {
    const graph = makeGraph();
    const result = buildHexVignette(graph, [tile], { col: 3, row: 2 }, 'visible', null, new Map(), 42);
    expect(result.tier1).toBeTruthy();
    expect(result.tier1.length).toBeGreaterThan(10);
    expect(result.tier2.length).toBeGreaterThanOrEqual(1);
    expect(result.clickTarget).toEqual({ col: 3, row: 2 });
  });

  it('is deterministic — same seed, same output', () => {
    const graph = makeGraph();
    const a = buildHexVignette(graph, [tile], { col: 3, row: 2 }, 'visible', null, new Map(), 42);
    const b = buildHexVignette(graph, [tile], { col: 3, row: 2 }, 'visible', null, new Map(), 42);
    expect(a.tier1).toBe(b.tier1);
    expect(a.tier2).toEqual(b.tier2);
    expect(a.tier3).toEqual(b.tier3);
  });

  it('different seeds produce different outputs (probabilistic)', () => {
    const graph = makeGraph();
    const a = buildHexVignette(graph, [tile], { col: 3, row: 2 }, 'visible', null, new Map(), 42);
    const b = buildHexVignette(graph, [tile], { col: 3, row: 2 }, 'visible', null, new Map(), 999);
    // At least one tier should differ (probabilistic but very likely with different seeds)
    const differs = a.tier1 !== b.tier1 || JSON.stringify(a.tier2) !== JSON.stringify(b.tier2);
    expect(differs).toBe(true);
  });

  it('remembered visibility wraps in memory voice', () => {
    const graph = makeGraph();
    const result = buildHexVignette(graph, [tile], { col: 3, row: 2 }, 'remembered', null, new Map(), 42);
    expect(result.tier1.toLowerCase()).toContain('recall');
  });

  it('returns empty vignette for unexplored', () => {
    const graph = makeGraph();
    const result = buildHexVignette(graph, [tile], { col: 3, row: 2 }, 'unexplored', null, new Map(), 42);
    expect(result.tier1).toBe('');
    expect(result.tier2).toHaveLength(0);
    expect(result.tier3).toHaveLength(0);
  });

  it('caps tier2 sentences at MAX_TIER2_SENTENCES', () => {
    const graph = makeGraph();
    const result = buildHexVignette(graph, [tile], { col: 3, row: 2 }, 'visible', null, new Map(), 42);
    expect(result.tier2.length).toBeLessThanOrEqual(3); // MAX_TIER2_SENTENCES
  });

  it('caps tier3 sentences at MAX_TIER3_SENTENCES', () => {
    const graph = makeGraph();
    const result = buildHexVignette(graph, [tile], { col: 3, row: 2 }, 'visible', null, new Map(), 42);
    expect(result.tier3.length).toBeLessThanOrEqual(4); // MAX_TIER3_SENTENCES
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/engine/__tests__/hexVignette.test.ts`
Expected: FAIL — buildHexVignette not defined

**Step 3: Implement the full pipeline**

Append to `src/engine/hexVignette.ts`:

```typescript
// ─── Full Pipeline ──────────────────────────────────────────────────

/**
 * Build the complete hex vignette from world graph data.
 *
 * Seven pipeline stages, each pure:
 * 1. Terrain Opening → tier1
 * 2. Climate Feel → tier1 (appended)
 * 3. Population Sense → tier2[0]
 * 4. Location Spotlights → tier2[1..N]
 * 5. Cultural Color → tier3
 * 6. Sphere Aura → tier3
 * 7. Strategic Layer (factions, encounters) → tier3
 *
 * After all stages, applyVisibilityVoice transforms the voice.
 */
export function buildHexVignette(
  graph: WorldGraph,
  tiles: HexTile[],
  hexCoord: HexCoord,
  visibility: HexVisibilityState,
  avatarHex: HexCoord | null,
  familiarityMap: FamiliarityMap,
  seed: number,
): HexVignette {
  // No tooltip for unexplored hexes
  if (visibility === 'unexplored') {
    return { tier1: '', tier2: [], tier3: [], clickTarget: hexCoord };
  }

  const { col, row } = hexCoord;
  const tile = tiles.find(t => t.coord.col === col && t.coord.row === row);
  const baseSeed = hashSeed(seed, col * 1000 + row);

  // Stage 1: Terrain Opening
  const terrainType = tile?.terrain ?? 'grassland';
  const openings = TERRAIN_OPENINGS[terrainType] ?? TERRAIN_OPENINGS.grassland;
  const terrainOpening = pick(openings, baseSeed, 1);

  // Stage 2: Climate Feel
  const temp = tile?.geoParams?.temperature ?? 0.5;
  const moist = tile?.geoParams?.moisture ?? 0.5;
  const tempBand = getTemperatureBand(temp);
  const moistBand = getMoistureBand(moist);
  const climateVariants = CLIMATE_MATRIX[tempBand][moistBand];
  const climateFeel = pick(climateVariants, baseSeed, 2);

  const rawTier1 = `${terrainOpening} ${climateFeel}`;

  // Stage 3: Population Sense
  const locations = getLocationsInHex(graph, col, row);
  let totalPopulation = 0;
  for (const loc of locations) {
    totalPopulation += getAgentsAtLocation(graph, loc.id).length;
  }
  const popBand = getPopulationBand(locations.length + totalPopulation);
  const popPhrases = POPULATION_PHRASES[popBand];
  const populationSentence = pick(popPhrases, baseSeed, 3);

  // Stage 4: Location Spotlights
  const spotlights: string[] = [];
  const spotlightLocations = locations.slice(0, MAX_LOCATION_SPOTLIGHTS);
  for (let i = 0; i < spotlightLocations.length; i++) {
    const loc = spotlightLocations[i];
    const props = loc.properties as Record<string, unknown>;
    const subtype = (props.locationSubtype as LocationSubtype) ?? 'wilderness';
    const subtypeDisplay = SUBTYPE_DISPLAY_NAMES[subtype] ?? subtype;

    // Get dominant sphere for this location
    const biases = (props.sphereBiases as Record<string, number>) ?? {};
    let topSphere = 'unknown forces';
    let topVal = 0;
    for (const [s, v] of Object.entries(biases)) {
      if (v > topVal) { topVal = v; topSphere = s.charAt(0).toUpperCase() + s.slice(1); }
    }

    // Compass direction: use location index to simulate polygon position
    // In a real hex layout, locations are placed at polygon vertices.
    // We approximate compass from the index (evenly spaced around the hex).
    const angleDeg = (360 / Math.max(locations.length, 1)) * i + 90; // start from top
    const dir = getCompassDirection(angleDeg);
    const dirPhrase = pick(COMPASS_WORDS[dir], baseSeed, 4 + i);

    const template = pick(LOCATION_TEMPLATES, baseSeed, 5 + i);
    const filled = template
      .replace('{direction}', dirPhrase)
      .replace('{name}', loc.name)
      .replace('{subtype}', subtypeDisplay)
      .replace('{sphere}', topSphere);
    spotlights.push(filled);
  }

  const rawTier2 = [populationSentence, ...spotlights].slice(0, MAX_TIER2_SENTENCES);

  // Stage 5: Cultural Color
  const rawTier3: string[] = [];
  const cultures = getHexCultures(graph, col, row);
  if (cultures.length > 0) {
    const culture = cultures[0]; // dominant culture
    const template = pick(CULTURE_PHRASES, baseSeed, 10);
    const filled = template
      .replace('{cultureName}', culture.cultureName)
      .replace('{foundationBias}', culture.foundationBias);
    rawTier3.push(filled);
  }

  // Stage 6: Sphere Aura
  const sphereInfluence = getHexSphereInfluence(graph, col, row);
  for (const s of SPHERE_NAMES) {
    if (sphereInfluence[s] >= SPHERE_AURA_THRESHOLD) {
      const phrases = SPHERE_AURA_PHRASES[s];
      if (phrases && phrases.length > 0) {
        rawTier3.push(pick(phrases, baseSeed, 20 + SPHERE_NAMES.indexOf(s)));
      }
    }
  }

  // Stage 7: Strategic Layer (factions + encounters)
  const factions = getHexFactions(graph, col, row);
  if (factions.length > 0) {
    const template = pick(FACTION_PHRASES, baseSeed, 30);
    rawTier3.push(template.replace('{factionName}', factions[0].factionName));
  }

  // Check for active encounters at locations
  for (const loc of locations) {
    const props = loc.properties as Record<string, unknown>;
    const encounter = props.activeEncounter as { type?: string } | undefined;
    if (encounter?.type) {
      const template = pick(ENCOUNTER_PHRASES, baseSeed, 40);
      rawTier3.push(
        template
          .replace('{encounterType}', encounter.type)
          .replace('{locationName}', loc.name)
      );
      break; // One encounter mention is enough
    }
  }

  const cappedTier3 = rawTier3.slice(0, MAX_TIER3_SENTENCES);

  // Visibility Voice Wrapping
  const wrappers = VISIBILITY_WRAPPERS[visibility] ?? VISIBILITY_WRAPPERS.visible;
  const tier1 = wrappers.wrapTier1(rawTier1);
  const tier2 = rawTier2.map(s => wrappers.wrapTier2(s));
  const tier3 = cappedTier3.map(s => wrappers.wrapTier3(s));

  return { tier1, tier2, tier3, clickTarget: hexCoord };
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/engine/__tests__/hexVignette.test.ts`
Expected: PASS — all 18 tests pass (11 helpers + 7 pipeline)

**Step 5: Commit**

```bash
git add src/engine/hexVignette.ts src/engine/__tests__/hexVignette.test.ts
git commit -m "feat(vignette): implement full buildHexVignette pipeline with 7 stages"
```

---

### Task 5: HexTooltipContent Component

**Files:**
- Create: `src/components/HexMap/HexTooltipContent.tsx`
- Create: `src/components/HexMap/useHexVignetteCache.ts`
- Test: `src/components/HexMap/__tests__/HexTooltipContent.test.tsx`

**Context:** This component renders inside the existing tooltip portal pattern. It manages word-by-word reveal with per-word letter-fade animation. The `useHexVignetteCache` hook tracks reveal progress per hex coordinate.

**Step 1: Create the vignette cache hook**

```typescript
// src/components/HexMap/useHexVignetteCache.ts
import { useRef, useCallback } from 'react';
import type { HexVignette } from '../../types/hexVignette';

interface VignetteCache {
  vignette: HexVignette;
  revealedWordCount: number;
  fullyRevealed: boolean;
}

/**
 * Caches vignettes and reveal progress per hex coordinate.
 * Progress persists across hover cycles within the session.
 */
export function useHexVignetteCache() {
  const cacheRef = useRef<Map<string, VignetteCache>>(new Map());

  const getOrCreate = useCallback(
    (key: string, vignette: HexVignette): VignetteCache => {
      const existing = cacheRef.current.get(key);
      if (existing && existing.vignette === vignette) return existing;
      // If vignette changed (shouldn't normally), reset progress
      if (existing && existing.vignette.tier1 === vignette.tier1) return existing;
      const entry: VignetteCache = { vignette, revealedWordCount: 0, fullyRevealed: false };
      cacheRef.current.set(key, entry);
      return entry;
    },
    []
  );

  const advanceReveal = useCallback((key: string): number => {
    const entry = cacheRef.current.get(key);
    if (!entry || entry.fullyRevealed) return entry?.revealedWordCount ?? 0;
    entry.revealedWordCount++;
    // Count total words in all tier2 sentences
    const totalWords = entry.vignette.tier2.join(' ').split(/\s+/).filter(Boolean).length;
    if (entry.revealedWordCount >= totalWords) {
      entry.fullyRevealed = true;
    }
    return entry.revealedWordCount;
  }, []);

  const isFullyRevealed = useCallback((key: string): boolean => {
    return cacheRef.current.get(key)?.fullyRevealed ?? false;
  }, []);

  const getRevealedCount = useCallback((key: string): number => {
    return cacheRef.current.get(key)?.revealedWordCount ?? 0;
  }, []);

  return { getOrCreate, advanceReveal, isFullyRevealed, getRevealedCount };
}
```

**Step 2: Create the HexTooltipContent component**

```typescript
// src/components/HexMap/HexTooltipContent.tsx
import React, { useEffect, useRef, useState, useMemo } from 'react';
import type { HexVignette } from '../../types/hexVignette';
import { WORD_REVEAL_INTERVAL_MS, LETTER_STAGGER_MS, LETTER_FADE_DURATION_MS } from '../../types/hexVignette';

// ─── Styling Constants ──────────────────────────────────────────────
const TOOLTIP_BG = 'var(--bg-surface, #1a1a1f)';
const TOOLTIP_BORDER = 'var(--border-medium, #2a2520)';
const TIER1_COLOR = 'var(--text-primary, #e8dcc8)';
const TIER2_COLOR = 'var(--text-secondary, #b8a890)';

// CSS animation keyframe for letter fade-in (injected once)
const LETTER_FADE_KEYFRAME = `
@keyframes vignetteLetterFade {
  from { opacity: 0; }
  to { opacity: 1; }
}
`;

let styleInjected = false;
function injectStyles() {
  if (styleInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = LETTER_FADE_KEYFRAME;
  document.head.appendChild(style);
  styleInjected = true;
}

/** Render a single word with per-letter staggered fade-in */
function AnimatedWord({ word, wordIndex }: { word: string; wordIndex: number }) {
  return (
    <span style={{ display: 'inline' }}>
      {word.split('').map((letter, li) => (
        <span
          key={`${wordIndex}-${li}`}
          style={{
            opacity: 0,
            animation: `vignetteLetterFade ${LETTER_FADE_DURATION_MS}ms ease-out forwards`,
            animationDelay: `${li * LETTER_STAGGER_MS}ms`,
          }}
        >
          {letter}
        </span>
      ))}
      {' '}
    </span>
  );
}

interface HexTooltipContentProps {
  vignette: HexVignette;
  hexKey: string;
  revealedWordCount: number;
  fullyRevealed: boolean;
  onAdvanceReveal: () => void;
  onClick: () => void;
}

export const HexTooltipContent = React.memo(function HexTooltipContent({
  vignette,
  hexKey,
  revealedWordCount,
  fullyRevealed,
  onAdvanceReveal,
  onClick,
}: HexTooltipContentProps) {
  injectStyles();

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // All tier2 words as a flat array
  const tier2Words = useMemo(
    () => vignette.tier2.join(' ').split(/\s+/).filter(Boolean),
    [vignette.tier2]
  );

  const totalTier2Words = tier2Words.length;

  // Start/resume word reveal interval
  useEffect(() => {
    if (fullyRevealed || revealedWordCount >= totalTier2Words) return;

    intervalRef.current = setInterval(() => {
      onAdvanceReveal();
    }, WORD_REVEAL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fullyRevealed, revealedWordCount, totalTier2Words, onAdvanceReveal]);

  // Words to show
  const visibleWords = fullyRevealed ? tier2Words : tier2Words.slice(0, revealedWordCount);
  // The latest word gets the animation; previously revealed words show static
  const latestWordIndex = fullyRevealed ? -1 : revealedWordCount - 1;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      style={{
        cursor: 'pointer',
        maxWidth: 320,
        padding: '0.625rem',
        backgroundColor: TOOLTIP_BG,
        border: `1px solid ${TOOLTIP_BORDER}`,
        borderRadius: '0.25rem',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
      }}
      data-testid="hex-tooltip-content"
    >
      {/* Tier 1 — Instant */}
      <div
        style={{
          fontSize: 'var(--text-sm, 0.875rem)',
          color: TIER1_COLOR,
          fontFamily: 'var(--font-body)',
          lineHeight: 1.5,
          marginBottom: vignette.tier2.length > 0 ? '0.375rem' : 0,
        }}
      >
        {vignette.tier1}
      </div>

      {/* Tier 2 — Word-by-word reveal */}
      {visibleWords.length > 0 && (
        <div
          style={{
            fontSize: 'var(--text-xs, 0.75rem)',
            color: TIER2_COLOR,
            fontFamily: 'var(--font-body)',
            lineHeight: 1.5,
          }}
        >
          {visibleWords.map((word, i) =>
            i === latestWordIndex && !fullyRevealed ? (
              <AnimatedWord key={`${hexKey}-w-${i}`} word={word} wordIndex={i} />
            ) : (
              <span key={`${hexKey}-w-${i}`}>{word} </span>
            )
          )}
        </div>
      )}
    </div>
  );
});

HexTooltipContent.displayName = 'HexTooltipContent';
```

**Step 3: Write component tests**

```typescript
// src/components/HexMap/__tests__/HexTooltipContent.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { HexTooltipContent } from '../HexTooltipContent';
import type { HexVignette } from '../../../types/hexVignette';
import { WORD_REVEAL_INTERVAL_MS } from '../../../types/hexVignette';

const mockVignette: HexVignette = {
  tier1: 'Rolling hills define the landscape. The climate is mild.',
  tier2: ['A few souls linger here.', 'To the north, Ardenmor Keep — a ruined tower.'],
  tier3: ['The people follow old ways.'],
  clickTarget: { col: 3, row: 2 },
};

describe('HexTooltipContent', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('renders tier1 text immediately', () => {
    render(
      <HexTooltipContent
        vignette={mockVignette}
        hexKey="3,2"
        revealedWordCount={0}
        fullyRevealed={false}
        onAdvanceReveal={() => {}}
        onClick={() => {}}
      />
    );
    expect(screen.getByText(/Rolling hills/)).toBeTruthy();
  });

  it('does not show tier2 words when revealedWordCount is 0', () => {
    render(
      <HexTooltipContent
        vignette={mockVignette}
        hexKey="3,2"
        revealedWordCount={0}
        fullyRevealed={false}
        onAdvanceReveal={() => {}}
        onClick={() => {}}
      />
    );
    expect(screen.queryByText(/souls/)).toBeNull();
  });

  it('shows tier2 words up to revealedWordCount', () => {
    render(
      <HexTooltipContent
        vignette={mockVignette}
        hexKey="3,2"
        revealedWordCount={3}
        fullyRevealed={false}
        onAdvanceReveal={() => {}}
        onClick={() => {}}
      />
    );
    // First 3 words of tier2: "A few souls"
    expect(screen.getByText(/A/)).toBeTruthy();
  });

  it('calls onAdvanceReveal at WORD_REVEAL_INTERVAL_MS intervals', () => {
    const onAdvance = vi.fn();
    render(
      <HexTooltipContent
        vignette={mockVignette}
        hexKey="3,2"
        revealedWordCount={0}
        fullyRevealed={false}
        onAdvanceReveal={onAdvance}
        onClick={() => {}}
      />
    );
    act(() => { vi.advanceTimersByTime(WORD_REVEAL_INTERVAL_MS * 3); });
    expect(onAdvance).toHaveBeenCalledTimes(3);
  });

  it('stops calling onAdvanceReveal when fullyRevealed', () => {
    const onAdvance = vi.fn();
    render(
      <HexTooltipContent
        vignette={mockVignette}
        hexKey="3,2"
        revealedWordCount={20}
        fullyRevealed={true}
        onAdvanceReveal={onAdvance}
        onClick={() => {}}
      />
    );
    act(() => { vi.advanceTimersByTime(WORD_REVEAL_INTERVAL_MS * 5); });
    expect(onAdvance).not.toHaveBeenCalled();
  });

  it('fires onClick when clicked', () => {
    const handleClick = vi.fn();
    render(
      <HexTooltipContent
        vignette={mockVignette}
        hexKey="3,2"
        revealedWordCount={0}
        fullyRevealed={false}
        onAdvanceReveal={() => {}}
        onClick={handleClick}
      />
    );
    fireEvent.click(screen.getByTestId('hex-tooltip-content'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('fires onClick on Enter key press', () => {
    const handleClick = vi.fn();
    render(
      <HexTooltipContent
        vignette={mockVignette}
        hexKey="3,2"
        revealedWordCount={0}
        fullyRevealed={false}
        onAdvanceReveal={() => {}}
        onClick={handleClick}
      />
    );
    fireEvent.keyDown(screen.getByTestId('hex-tooltip-content'), { key: 'Enter' });
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('shows all words when fullyRevealed', () => {
    const { container } = render(
      <HexTooltipContent
        vignette={mockVignette}
        hexKey="3,2"
        revealedWordCount={20}
        fullyRevealed={true}
        onAdvanceReveal={() => {}}
        onClick={() => {}}
      />
    );
    // All tier2 text should be present
    expect(container.textContent).toContain('souls');
    expect(container.textContent).toContain('Ardenmor');
  });
});
```

**Step 4: Run tests**

Run: `npx vitest run src/components/HexMap/__tests__/HexTooltipContent.test.tsx`
Expected: PASS — all 8 component tests pass

**Step 5: Commit**

```bash
git add src/components/HexMap/HexTooltipContent.tsx src/components/HexMap/useHexVignetteCache.ts src/components/HexMap/__tests__/HexTooltipContent.test.tsx
git commit -m "feat(vignette): add HexTooltipContent component with word-reveal animation"
```

---

### Task 6: HexTile Integration — Replace Terrain Tooltip with Vignette

**Files:**
- Modify: `src/components/HexMap/HexTile.tsx` — replace `<Tooltip>` wrapper with vignette-based tooltip
- Modify: `src/components/HexMap/HexMap.tsx` — pass graph + vignette data to tiles
- Modify: `src/components/Game/hooks/useHexZoomData.ts` or `src/components/Game/GameView.tsx` — wire vignette dependencies

**Context:** HexTile currently uses `<Tooltip as="g" label={tile.terrain} id={`terrain.${tile.terrain}`}>`. We need to replace this with a custom tooltip that renders `HexTooltipContent` with vignette data. The existing `Tooltip` component renders in a portal — we need a similar portal-based approach.

This is a component wiring task. The approach:
1. Add new props to HexTile for vignette data (HexVignette, reveal state callbacks)
2. Replace `<Tooltip>` wrapper with a custom hover handler that renders `HexTooltipContent` in a portal
3. Wire the vignette cache in the parent HexMap or GameView

**Step 1: Modify HexTile props to accept vignette**

Add to HexTileProps interface in `src/components/HexMap/HexTile.tsx`:

```typescript
import type { HexVignette } from '../../types/hexVignette';

// Add to HexTileProps:
  vignette?: HexVignette | null;
  vignetteRevealedCount?: number;
  vignetteFullyRevealed?: boolean;
  onVignetteAdvance?: () => void;
  onHexClick?: () => void;
```

Replace every `<Tooltip as="g" label={tile.terrain} id={`terrain.${tile.terrain}`}>` with a conditional: if `vignette` is provided, render a custom tooltip portal with `HexTooltipContent`; otherwise fall back to the simple terrain tooltip.

**Important:** Do NOT remove the existing `Tooltip` import or the fallback behavior — hex tiles that don't have vignette data (e.g., during initial loading) should still show the simple terrain name.

**Step 2: Wire vignette data through HexMap**

In `HexMap.tsx`, add a `buildVignetteForHex` callback prop that GameView provides. For each visible/remembered hex, call it on hover to get the vignette data. Use the `useHexVignetteCache` hook at the HexMap level.

**Step 3: Wire in GameView**

In GameView (or the appropriate hook), create a `buildVignetteForHex` callback that calls `buildHexVignette` with the current graph state, tiles, visibility map, etc. Memoize by hex coordinate.

**Step 4: Run existing tests + type check**

Run: `npx tsc --noEmit && npx vitest run src/components/HexMap/`
Expected: PASS — no regressions

**Step 5: Commit**

```bash
git add src/components/HexMap/HexTile.tsx src/components/HexMap/HexMap.tsx src/components/Game/GameView.tsx
git commit -m "feat(vignette): wire hex vignette tooltips into HexTile and HexMap"
```

---

### Task 7: HexZoomView — Tier 3 Prose Block

**Files:**
- Modify: `src/components/Game/HexZoomView.tsx` — add tier 3 prose block
- Modify: `src/components/Game/HexBreadcrumb.tsx` — optional tier 3 text below breadcrumb

**Context:** Tier 3 sentences render as a static prose block in the hex zoom view. No animation. This is the deep lore layer — cultural color, sphere aura, faction control, encounter hints.

**Step 1: Write a test for tier 3 rendering in HexZoomView**

Add to existing HexZoomView tests (or create new file):

```typescript
// Test that tier3 prose renders when vignette is provided
it('renders tier3 prose block when vignette has tier3 content', () => {
  // ... render HexZoomView with a vignette prop containing tier3 sentences
  // ... assert tier3 text appears in the DOM
});
```

**Step 2: Add tier 3 prose block**

In `HexZoomView.tsx`, after the HexBreadcrumb header, add a `<p>` element (or small `<div>`) that renders `vignette.tier3` sentences joined with spaces. Style it with `--text-secondary` color, `--font-body`, italic for atmospheric feel.

Call `buildHexVignette` inside the component (memoized) to get the tier 3 data, or receive it as a prop from GameView.

**Step 3: Run tests**

Run: `npx vitest run src/components/Game/`
Expected: PASS

**Step 4: Commit**

```bash
git add src/components/Game/HexZoomView.tsx src/components/Game/HexBreadcrumb.tsx
git commit -m "feat(vignette): add tier 3 prose block to hex zoom view"
```

---

### Task 8: Integration Tests

**Files:**
- Create: `src/engine/__tests__/hexVignette-integration.test.ts`

**Context:** Full pipeline test with a seeded world graph verifying all tiers are populated and visibility gating works correctly.

**Step 1: Write integration tests**

```typescript
// src/engine/__tests__/hexVignette-integration.test.ts
import { describe, it, expect } from 'vitest';
import { buildHexVignette } from '../hexVignette';
import { initializeGameState } from '../gameInit';

describe('hexVignette integration', () => {
  it('produces full vignettes from a seeded world', () => {
    const state = initializeGameState({ seed: 42 });
    const { graph, tiles, visibilityMap } = state;

    // Find a visible hex with locations
    let foundVignette = false;
    for (const tile of tiles) {
      const key = `${tile.coord.col},${tile.coord.row}`;
      const vis = visibilityMap.get(key);
      if (vis?.state === 'visible') {
        const vignette = buildHexVignette(
          graph, tiles, tile.coord, 'visible', null, new Map(), 42
        );
        expect(vignette.tier1.length).toBeGreaterThan(10);
        // tier2 may be empty for hexes with no locations — that's fine
        foundVignette = true;
        break;
      }
    }
    expect(foundVignette).toBe(true);
  });

  it('visibility states produce different voice', () => {
    const state = initializeGameState({ seed: 42 });
    const tile = state.tiles[0];
    const visible = buildHexVignette(
      state.graph, state.tiles, tile.coord, 'visible', null, new Map(), 42
    );
    const remembered = buildHexVignette(
      state.graph, state.tiles, tile.coord, 'remembered', null, new Map(), 42
    );
    // Remembered should contain "recall"
    expect(remembered.tier1.toLowerCase()).toContain('recall');
    // Visible should NOT contain "recall"
    expect(visible.tier1.toLowerCase()).not.toContain('recall');
  });

  it('unexplored returns empty vignette', () => {
    const state = initializeGameState({ seed: 42 });
    const tile = state.tiles[0];
    const result = buildHexVignette(
      state.graph, state.tiles, tile.coord, 'unexplored', null, new Map(), 42
    );
    expect(result.tier1).toBe('');
    expect(result.tier2).toHaveLength(0);
    expect(result.tier3).toHaveLength(0);
  });

  it('determinism: same seed produces identical vignettes', () => {
    const state = initializeGameState({ seed: 42 });
    const tile = state.tiles[5]; // arbitrary tile
    const a = buildHexVignette(state.graph, state.tiles, tile.coord, 'visible', null, new Map(), 42);
    const b = buildHexVignette(state.graph, state.tiles, tile.coord, 'visible', null, new Map(), 42);
    expect(a).toEqual(b);
  });
});
```

**Step 2: Run integration tests**

Run: `npx vitest run src/engine/__tests__/hexVignette-integration.test.ts`
Expected: PASS — all 4 integration tests pass

**Step 3: Commit**

```bash
git add src/engine/__tests__/hexVignette-integration.test.ts
git commit -m "test(vignette): add hex vignette integration tests with seeded world"
```

---

### Task 9: Full Verification

**Step 1: Run full test suite**

Run: `npm test`
Expected: All ~2,200+ tests pass with zero failures

**Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 3: Run production build**

Run: `npx vite build`
Expected: Build succeeds with no errors

**Step 4: Commit any fixes**

If any tests broke or types failed, fix and commit with descriptive messages.

---

### Task 10: Documentation Updates

**Context:** Use the `gamedocumenter` skill for Obsidian and Notion updates.

**Step 1: Update CLAUDE.md changelog**

Add entry: hex vignette tooltip system — types, content package, builder engine, HexTooltipContent component, word-by-word reveal animation, HexTile/HexZoomView integration.

**Step 2: Update Obsidian vault**

- Create `Hex Vignette Tooltip.md` system note
- Update `Index.md` with link
- Update `View Levels.md` or `Hex Zoom View.md` to reference tier 3 prose

**Step 3: Update Notion backlog**

- Mark hex vignette tooltip task as complete
- Add any follow-up tasks discovered

**Step 4: Commit documentation**

```bash
git add CLAUDE.md Docs/plans/
git commit -m "docs(vignette): update CLAUDE.md changelog and vault for hex vignette system"
```
