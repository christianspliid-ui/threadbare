# Culture Content Package Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create `src/data/culture-content.ts` — the content data package that provides all modifier sets, trait seeds, insider beat definitions, sub-location templates, and artifact lore patterns for the culture bounded context.

**Architecture:** Pure data file following the established `*-content.ts` pattern (no engine logic, no side effects). Exports typed constants and lookup functions. Types are defined inline (interfaces exported from this file) or imported from existing type files. Tests validate structural integrity, content quality, and lookup functions.

**Tech Stack:** TypeScript, Vitest. Imports `SphereName` from `types/index`, `TerrainType` from `types/index`, `ReachDomain` from `types/traits`.

**Design doc:** `Docs/plans/2026-03-06-culture-bounded-context-design.md` (Sections 2, 5, 6, 7)

---

### Task 1: Foundation Sphere Modifiers (4 sets)

**Files:**
- Create: `src/data/culture-content.ts`
- Create: `src/data/__tests__/culture-content.test.ts`

**Step 1: Write the failing test**

```typescript
// src/data/__tests__/culture-content.test.ts
import { describe, it, expect } from 'vitest';
import {
  FOUNDATION_MODIFIERS,
  type FoundationModifier,
} from '../culture-content';

const VALID_FOUNDATIONS = ['chaos', 'order', 'light', 'darkness'];

describe('culture-content — foundation modifiers', () => {
  it('exports exactly 4 foundation modifiers', () => {
    expect(FOUNDATION_MODIFIERS).toHaveLength(4);
  });

  it('covers all 4 foundation spheres', () => {
    const ids = FOUNDATION_MODIFIERS.map(m => m.id);
    for (const f of VALID_FOUNDATIONS) {
      expect(ids).toContain(f);
    }
  });

  it('each modifier has required fields', () => {
    for (const mod of FOUNDATION_MODIFIERS) {
      expect(mod.id).toBeTruthy();
      expect(mod.socialStructure).toBeTruthy();
      expect(mod.accountability).toBeTruthy();
      expect(mod.behavioralKeywords.length).toBeGreaterThanOrEqual(3);
      expect(mod.metaphorSeeds.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('all modifier ids are unique', () => {
    const ids = FOUNDATION_MODIFIERS.map(m => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/__tests__/culture-content.test.ts`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

Create `src/data/culture-content.ts` with:
- File header comment (same style as archetype-content.ts)
- `FoundationModifier` interface: `{ id: string; socialStructure: string; accountability: string; behavioralKeywords: string[]; metaphorSeeds: string[] }`
- `FOUNDATION_MODIFIERS` constant array with 4 entries from design doc §6 Foundation Sphere Modifiers table:
  - `chaos`: fluid hierarchy, personal honor, keywords: shifting, storm-born, untamed, rebellious, spontaneous
  - `order`: rigid social roles, institutional justice, keywords: stone-set, the old way, by the book, codified, precedent
  - `light`: communal decision, shame-based accountability, keywords: sun-sworn, nothing hidden, in the open, transparent, witnessed
  - `darkness`: initiation rites, secret tribunals, keywords: veiled, shadow-kept, the inner circle, whispered, oath-bound

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/data/__tests__/culture-content.test.ts`
Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add src/data/culture-content.ts src/data/__tests__/culture-content.test.ts
git commit -m "feat(culture): add foundation sphere modifiers — 4 sets with social structure, accountability, keywords, metaphors"
```

---

### Task 2: Creation Sphere Modifiers (8 sets)

**Files:**
- Modify: `src/data/culture-content.ts`
- Modify: `src/data/__tests__/culture-content.test.ts`

**Step 1: Write the failing test**

```typescript
import {
  FOUNDATION_MODIFIERS,
  CREATION_SPHERE_MODIFIERS,
  type CreationSphereModifier,
} from '../culture-content';
import { SPHERE_NAMES } from '../../types/index';

describe('culture-content — creation sphere modifiers', () => {
  it('exports exactly 8 creation sphere modifiers', () => {
    expect(CREATION_SPHERE_MODIFIERS).toHaveLength(8);
  });

  it('covers all 8 creation spheres', () => {
    const ids = CREATION_SPHERE_MODIFIERS.map(m => m.sphere);
    for (const s of SPHERE_NAMES) {
      expect(ids).toContain(s);
    }
  });

  it('each modifier has required fields', () => {
    for (const mod of CREATION_SPHERE_MODIFIERS) {
      expect(mod.sphere).toBeTruthy();
      expect(mod.behavioralColoring).toBeTruthy();
      expect(mod.behavioralKeywords.length).toBeGreaterThanOrEqual(4);
      expect(mod.materialVocabulary.length).toBeGreaterThanOrEqual(4);
      expect(mod.formativeTraitSeeds.length).toBeGreaterThanOrEqual(1);
      expect(mod.behavioralTraitSeeds.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('all sphere ids are unique', () => {
    const spheres = CREATION_SPHERE_MODIFIERS.map(m => m.sphere);
    expect(new Set(spheres).size).toBe(spheres.length);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/__tests__/culture-content.test.ts`
Expected: FAIL — CREATION_SPHERE_MODIFIERS not exported

**Step 3: Write implementation**

Add `CreationSphereModifier` interface:
```typescript
export interface CreationSphereModifier {
  sphere: SphereName;
  behavioralColoring: string;
  behavioralKeywords: string[];
  materialVocabulary: string[];
  formativeTraitSeeds: string[];
  behavioralTraitSeeds: string[];
}
```

Add `CREATION_SPHERE_MODIFIERS` with 8 entries from design doc §6 Creation Sphere Modifiers table:
- force: martial honor codes, heavy metals/war trophies, weapon mastery, challenge compulsion
- matter: craft guilds, stone/worked metal, craft expertise, material obsession
- energy: kinetic culture, light materials/flame imagery, endurance training, restlessness
- life: fertility rites, living materials/garden cities, herbalism, birth/death reverence
- mind: scholarly castes, paper/ink/glass, literacy, knowledge hoarding
- spirit: meditation/communion, incense/crystal, meditation, spirit sensitivity
- time: elder councils, astronomical instruments, calendar mastery, patience/fatalism
- entropy: death cults, bone/ash/corroded metal, decay-reading, death acceptance

Each entry should have 4-6 behavioral keywords, 4-6 material terms, 1-2 formative seeds, 1-2 behavioral seeds.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/data/__tests__/culture-content.test.ts`
Expected: PASS (8 tests total)

**Step 5: Commit**

```bash
git add src/data/culture-content.ts src/data/__tests__/culture-content.test.ts
git commit -m "feat(culture): add creation sphere modifiers — 8 sets with behavioral, material, trait seeds"
```

---

### Task 3: Biome Modifiers (~20 sets)

**Files:**
- Modify: `src/data/culture-content.ts`
- Modify: `src/data/__tests__/culture-content.test.ts`

**Step 1: Write the failing test**

```typescript
import { BIOME_MODIFIERS, type BiomeModifier } from '../culture-content';

// All 22 TerrainType values from types/index.ts
const ALL_TERRAIN_TYPES = [
  'ocean', 'coastal_shallows', 'lake', 'river',
  'grassland', 'farmland', 'savanna', 'steppe',
  'deciduous_forest', 'dense_forest', 'taiga', 'jungle',
  'swamp', 'bog',
  'hills', 'mountains', 'plateau', 'badlands',
  'desert', 'tundra', 'glacier', 'volcanic',
];

describe('culture-content — biome modifiers', () => {
  it('exports at least 20 biome modifiers', () => {
    expect(BIOME_MODIFIERS.length).toBeGreaterThanOrEqual(20);
  });

  it('covers all 22 terrain types', () => {
    const terrains = BIOME_MODIFIERS.map(m => m.terrain);
    for (const t of ALL_TERRAIN_TYPES) {
      expect(terrains).toContain(t);
    }
  });

  it('each modifier has required fields', () => {
    for (const mod of BIOME_MODIFIERS) {
      expect(mod.terrain).toBeTruthy();
      expect(mod.survivalTraitKeywords.length).toBeGreaterThanOrEqual(3);
      expect(mod.materialCulture.length).toBeGreaterThanOrEqual(4);
      expect(mod.metaphorPalette.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('all terrain ids are unique', () => {
    const terrains = BIOME_MODIFIERS.map(m => m.terrain);
    expect(new Set(terrains).size).toBe(terrains.length);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/__tests__/culture-content.test.ts`
Expected: FAIL — BIOME_MODIFIERS not exported

**Step 3: Write implementation**

Add `BiomeModifier` interface:
```typescript
export interface BiomeModifier {
  terrain: TerrainType;
  survivalTraitKeywords: string[];
  materialCulture: string[];
  metaphorPalette: string[];
}
```

Add `BIOME_MODIFIERS` with 22 entries (one per TerrainType). Design doc §6 provides 7 detailed examples; the remaining 15 follow the same pattern. Key guidance:
- Water terrains (ocean, coastal_shallows, lake, river): nautical/aquatic vocabulary
- Forest terrains: wood/resin/bark materials, growth metaphors
- Elevated terrains: stone/crystal materials, altitude metaphors
- Each entry: 3-5 survival keywords, 4-6 material culture terms, 3-4 metaphor templates

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/data/__tests__/culture-content.test.ts`
Expected: PASS (12 tests total)

**Step 5: Commit**

```bash
git add src/data/culture-content.ts src/data/__tests__/culture-content.test.ts
git commit -m "feat(culture): add biome modifiers — 22 terrain sets with survival traits, materials, metaphors"
```

---

### Task 4: Formative Trait Seeds (~35 definitions)

**Files:**
- Modify: `src/data/culture-content.ts`
- Modify: `src/data/__tests__/culture-content.test.ts`

**Step 1: Write the failing test**

```typescript
import {
  FORMATIVE_TRAIT_SEEDS,
  type FormativeTraitSeed,
} from '../culture-content';
import { REACH_DOMAINS } from '../../types/traits';

describe('culture-content — formative trait seeds', () => {
  it('exports at least 30 formative trait seeds', () => {
    expect(FORMATIVE_TRAIT_SEEDS.length).toBeGreaterThanOrEqual(30);
  });

  it('each seed has required fields', () => {
    for (const seed of FORMATIVE_TRAIT_SEEDS) {
      expect(seed.id).toBeTruthy();
      expect(seed.name).toBeTruthy();
      expect(seed.description).toBeTruthy();
      expect(seed.sourceTags.length).toBeGreaterThanOrEqual(1);
      expect(Object.keys(seed.domainContributions).length).toBeGreaterThanOrEqual(1);
      // Domain contributions must use valid reach domains
      for (const domain of Object.keys(seed.domainContributions)) {
        expect(REACH_DOMAINS).toContain(domain);
      }
    }
  });

  it('all seed ids are unique', () => {
    const ids = FORMATIVE_TRAIT_SEEDS.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every creation sphere modifier formative seed is represented', () => {
    // Each creation sphere has 1-2 formative trait seeds referenced in CREATION_SPHERE_MODIFIERS
    // All of those seed names should have corresponding entries in FORMATIVE_TRAIT_SEEDS
    const seedIds = new Set(FORMATIVE_TRAIT_SEEDS.map(s => s.id));
    for (const mod of CREATION_SPHERE_MODIFIERS) {
      for (const seedRef of mod.formativeTraitSeeds) {
        // The seed ref in the modifier should match a seed id
        expect(seedIds.has(seedRef)).toBe(true);
      }
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/__tests__/culture-content.test.ts`
Expected: FAIL — FORMATIVE_TRAIT_SEEDS not exported

**Step 3: Write implementation**

Add `FormativeTraitSeed` interface:
```typescript
export interface FormativeTraitSeed {
  id: string;
  name: string;
  description: string;
  sourceTags: string[];  // e.g., ['force', 'desert'] — which sphere/biome combos grant this
  domainContributions: Partial<Record<ReachDomain, number>>;
  tags: string[];
}
```

Add `FORMATIVE_TRAIT_SEEDS` array with ~35 entries. These are the permanent, innate cultural skills. Source from:
- 8 creation sphere formative seeds (1-2 per sphere = 8-16)
- ~15-20 biome-specific formative seeds (navigation, survival, craft)
- Ensure the `id` matches what's referenced in `CREATION_SPHERE_MODIFIERS.formativeTraitSeeds`

Example entries:
- `weapon_mastery` (force): iron +2, flesh +1
- `craft_expertise` (matter): stone +2, gold +1
- `herbalism` (life): flesh +2, eye +1
- `desert_navigation` (desert biome): star +2, eye +1
- `tidal_reading` (coastal biome): star +1, eye +1

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/data/__tests__/culture-content.test.ts`
Expected: PASS (16 tests total)

**Step 5: Commit**

```bash
git add src/data/culture-content.ts src/data/__tests__/culture-content.test.ts
git commit -m "feat(culture): add formative trait seeds — ~35 permanent innate cultural skills"
```

---

### Task 5: Behavioral Trait Seeds (~45 definitions)

**Files:**
- Modify: `src/data/culture-content.ts`
- Modify: `src/data/__tests__/culture-content.test.ts`

**Step 1: Write the failing test**

```typescript
import {
  BEHAVIORAL_TRAIT_SEEDS,
  type BehavioralTraitSeed,
} from '../culture-content';

const VALID_STRENGTH_RANGES = ['fanatical', 'strong', 'fading', 'silent'];

describe('culture-content — behavioral trait seeds', () => {
  it('exports at least 40 behavioral trait seeds', () => {
    expect(BEHAVIORAL_TRAIT_SEEDS.length).toBeGreaterThanOrEqual(40);
  });

  it('each seed has required fields', () => {
    for (const seed of BEHAVIORAL_TRAIT_SEEDS) {
      expect(seed.id).toBeTruthy();
      expect(seed.name).toBeTruthy();
      expect(seed.description).toBeTruthy();
      expect(seed.sourceTags.length).toBeGreaterThanOrEqual(1);
      expect(Object.keys(seed.strengthThresholds).length).toBeGreaterThanOrEqual(2);
      // strength thresholds should use valid range labels
      for (const range of Object.keys(seed.strengthThresholds)) {
        expect(VALID_STRENGTH_RANGES).toContain(range);
      }
    }
  });

  it('all seed ids are unique', () => {
    const ids = BEHAVIORAL_TRAIT_SEEDS.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every creation sphere modifier behavioral seed is represented', () => {
    const seedIds = new Set(BEHAVIORAL_TRAIT_SEEDS.map(s => s.id));
    for (const mod of CREATION_SPHERE_MODIFIERS) {
      for (const seedRef of mod.behavioralTraitSeeds) {
        expect(seedIds.has(seedRef)).toBe(true);
      }
    }
  });

  it('fanatical threshold always has more intense effect than strong', () => {
    for (const seed of BEHAVIORAL_TRAIT_SEEDS) {
      if (seed.strengthThresholds.fanatical && seed.strengthThresholds.strong) {
        // Both should be strings — fanatical should be different (more intense)
        expect(seed.strengthThresholds.fanatical).not.toBe(seed.strengthThresholds.strong);
      }
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/__tests__/culture-content.test.ts`
Expected: FAIL — BEHAVIORAL_TRAIT_SEEDS not exported

**Step 3: Write implementation**

Add `BehavioralTraitSeed` interface:
```typescript
export type CulturalStrengthRange = 'fanatical' | 'strong' | 'fading' | 'silent';

export interface BehavioralTraitSeed {
  id: string;
  name: string;
  description: string;
  sourceTags: string[];
  strengthThresholds: Partial<Record<CulturalStrengthRange, string>>;
  domainContributions: Partial<Record<ReachDomain, number>>;
  tags: string[];
}
```

Add `BEHAVIORAL_TRAIT_SEEDS` array with ~45 entries. These scale with cultural strength. Source from:
- 8 creation sphere behavioral seeds (1-2 per sphere = 8-16)
- ~10 foundation-influenced behavioral traits (honor codes, secrecy, communalism)
- ~15-20 biome-influenced behavioral traits (water discipline, communal warmth)

Example:
```typescript
{
  id: 'challenge_compulsion',
  name: 'Challenge Compulsion',
  description: 'Cannot let a slight go unanswered; must respond to challenges',
  sourceTags: ['force'],
  strengthThresholds: {
    fanatical: 'Compelled to duel to the death for any perceived insult',
    strong: 'Issues formal challenges to resolve disputes',
    fading: 'Occasional urge to respond physically to insults',
    // silent: absent — dormant below 0.3
  },
  domainContributions: { iron: 1, heart: -1 },
  tags: ['combat', 'social', 'honor'],
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/data/__tests__/culture-content.test.ts`
Expected: PASS (21 tests total)

**Step 5: Commit**

```bash
git add src/data/culture-content.ts src/data/__tests__/culture-content.test.ts
git commit -m "feat(culture): add behavioral trait seeds — ~45 strength-gated cultural behaviors"
```

---

### Task 6: Culture-Gated Insider Beats (~25 definitions)

**Files:**
- Modify: `src/data/culture-content.ts`
- Modify: `src/data/__tests__/culture-content.test.ts`

**Step 1: Write the failing test**

```typescript
import {
  INSIDER_BEATS,
  type InsiderBeat,
} from '../culture-content';

describe('culture-content — insider beats', () => {
  it('exports at least 20 insider beats', () => {
    expect(INSIDER_BEATS.length).toBeGreaterThanOrEqual(20);
  });

  it('each beat has required fields', () => {
    for (const beat of INSIDER_BEATS) {
      expect(beat.id).toBeTruthy();
      expect(beat.name).toBeTruthy();
      expect(beat.requiredCultureTags.length).toBeGreaterThanOrEqual(1);
      expect(beat.minStrength).toBeGreaterThanOrEqual(0.3);
      expect(beat.minStrength).toBeLessThanOrEqual(1.0);
      expect(beat.trigger).toBeTruthy();
      expect(beat.proseSeeds.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('all beat ids are unique', () => {
    const ids = INSIDER_BEATS.map(b => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('no beat requires strength below 0.3 (silent range never fires)', () => {
    for (const beat of INSIDER_BEATS) {
      expect(beat.minStrength).toBeGreaterThanOrEqual(0.3);
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/__tests__/culture-content.test.ts`
Expected: FAIL — INSIDER_BEATS not exported

**Step 3: Write implementation**

Add `InsiderBeat` interface:
```typescript
export interface InsiderBeat {
  id: string;
  name: string;
  requiredCultureTags: string[];  // sphere/biome tags that must be in the culture
  minStrength: number;            // 0.3–1.0 — minimum cultural strength to trigger
  trigger: string;                // human-readable trigger condition
  proseSeeds: string[];           // template sentences for narrative generation
  archetypeAffinity?: string[];   // archetype ids that amplify this beat
}
```

Add `INSIDER_BEATS` array with ~25 entries from design doc §5. Include the 8 examples from the design doc table plus ~17 more:
- Blood Oath Challenge (force, 0.5)
- Trial by Element (any elemental sphere, 0.6)
- Ritual of Exile (any culture, 0.7)
- Ancestor Communion (spirit, 0.5)
- Name-Day Tournament (force+order, 0.4)
- Shadow Market (darkness, 0.6)
- Dream Walk (spirit+mind, 0.8)
- Cultural Reclamation (any conquered, 0.4)
- Plus ~17 more covering: harvest festivals, initiation rites, truth duels, mercy pleas, craft competitions, storytelling circles, etc.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/data/__tests__/culture-content.test.ts`
Expected: PASS (25 tests total)

**Step 5: Commit**

```bash
git add src/data/culture-content.ts src/data/__tests__/culture-content.test.ts
git commit -m "feat(culture): add insider beats — ~25 culture-gated narrative events"
```

---

### Task 7: Sub-Location Templates & Artifact Lore Patterns

**Files:**
- Modify: `src/data/culture-content.ts`
- Modify: `src/data/__tests__/culture-content.test.ts`

**Step 1: Write the failing test**

```typescript
import {
  SUB_LOCATION_TEMPLATES,
  ARTIFACT_LORE_PATTERNS,
  type SubLocationTemplate,
  type ArtifactLorePattern,
} from '../culture-content';

describe('culture-content — sub-location templates', () => {
  it('exports at least 15 sub-location templates', () => {
    expect(SUB_LOCATION_TEMPLATES.length).toBeGreaterThanOrEqual(15);
  });

  it('each template has required fields', () => {
    for (const tmpl of SUB_LOCATION_TEMPLATES) {
      expect(tmpl.id).toBeTruthy();
      expect(tmpl.name).toBeTruthy();
      expect(tmpl.culturalVariantDescriptors.length).toBeGreaterThanOrEqual(2);
      expect(tmpl.grantedByTags.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('all template ids are unique', () => {
    const ids = SUB_LOCATION_TEMPLATES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('culture-content — artifact lore patterns', () => {
  it('exports at least 5 artifact lore patterns', () => {
    expect(ARTIFACT_LORE_PATTERNS.length).toBeGreaterThanOrEqual(5);
  });

  it('each pattern has a template with {culture} placeholder', () => {
    for (const pattern of ARTIFACT_LORE_PATTERNS) {
      expect(pattern.template).toContain('{culture}');
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/__tests__/culture-content.test.ts`
Expected: FAIL — exports not found

**Step 3: Write implementation**

Add interfaces and data:

```typescript
export interface SubLocationTemplate {
  id: string;
  name: string;
  grantedByTags: string[];  // cultural trait tags that unlock this building type
  culturalVariantDescriptors: string[];  // e.g., "bone-and-fur fortress" for Tundra+Force
  description: string;
}

export interface ArtifactLorePattern {
  id: string;
  template: string;  // sentence pattern with {culture}, {material}, {sphere} placeholders
  toneCategory: 'reverent' | 'martial' | 'mystical' | 'practical' | 'ominous';
}
```

Sub-location templates (~18): bazaar, shrine, arena, library, forge, temple, guild hall, watchtower, garden, tomb, observatory, barracks, market square, council chamber, ritual ground, archive, harbor, underground passage.

Artifact lore patterns (6): one per tone category plus an extra.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/data/__tests__/culture-content.test.ts`
Expected: PASS (31 tests total)

**Step 5: Commit**

```bash
git add src/data/culture-content.ts src/data/__tests__/culture-content.test.ts
git commit -m "feat(culture): add sub-location templates and artifact lore patterns"
```

---

### Task 8: Lookup Functions & Cross-Validation

**Files:**
- Modify: `src/data/culture-content.ts`
- Modify: `src/data/__tests__/culture-content.test.ts`

**Step 1: Write the failing test**

```typescript
import {
  getFoundationModifier,
  getCreationSphereModifier,
  getBiomeModifier,
  getFormativeTraitSeed,
  getBehavioralTraitSeed,
  getInsiderBeat,
  getSubLocationTemplate,
  getBeatsForCultureTags,
  getTraitSeedsForTags,
} from '../culture-content';

describe('culture-content — lookup functions', () => {
  it('getFoundationModifier returns correct modifier', () => {
    const chaos = getFoundationModifier('chaos');
    expect(chaos).toBeDefined();
    expect(chaos!.id).toBe('chaos');
  });

  it('getFoundationModifier returns undefined for invalid id', () => {
    expect(getFoundationModifier('invalid')).toBeUndefined();
  });

  it('getCreationSphereModifier returns correct modifier', () => {
    const force = getCreationSphereModifier('force');
    expect(force).toBeDefined();
    expect(force!.sphere).toBe('force');
  });

  it('getBiomeModifier returns correct modifier', () => {
    const desert = getBiomeModifier('desert');
    expect(desert).toBeDefined();
    expect(desert!.terrain).toBe('desert');
  });

  it('getFormativeTraitSeed returns correct seed', () => {
    const wm = getFormativeTraitSeed('weapon_mastery');
    expect(wm).toBeDefined();
    expect(wm!.name).toBe('Weapon Mastery');
  });

  it('getBehavioralTraitSeed returns correct seed', () => {
    const cc = getBehavioralTraitSeed('challenge_compulsion');
    expect(cc).toBeDefined();
    expect(cc!.name).toBe('Challenge Compulsion');
  });

  it('getInsiderBeat returns correct beat', () => {
    const blood = getInsiderBeat('blood_oath_challenge');
    expect(blood).toBeDefined();
    expect(blood!.name).toBe('Blood Oath Challenge');
  });

  it('getSubLocationTemplate returns correct template', () => {
    const forge = getSubLocationTemplate('forge');
    expect(forge).toBeDefined();
    expect(forge!.name).toBe('Forge');
  });

  it('getBeatsForCultureTags filters by tag', () => {
    const forceBeats = getBeatsForCultureTags(['force']);
    expect(forceBeats.length).toBeGreaterThanOrEqual(1);
    for (const beat of forceBeats) {
      expect(beat.requiredCultureTags.some(t => t === 'force')).toBe(true);
    }
  });

  it('getTraitSeedsForTags returns formative and behavioral seeds', () => {
    const result = getTraitSeedsForTags(['force']);
    expect(result.formative.length).toBeGreaterThanOrEqual(1);
    expect(result.behavioral.length).toBeGreaterThanOrEqual(1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/__tests__/culture-content.test.ts`
Expected: FAIL — functions not exported

**Step 3: Write implementation**

Add 9 lookup functions at the bottom of culture-content.ts:

```typescript
export function getFoundationModifier(id: string): FoundationModifier | undefined {
  return FOUNDATION_MODIFIERS.find(m => m.id === id);
}

export function getCreationSphereModifier(sphere: SphereName): CreationSphereModifier | undefined {
  return CREATION_SPHERE_MODIFIERS.find(m => m.sphere === sphere);
}

export function getBiomeModifier(terrain: TerrainType): BiomeModifier | undefined {
  return BIOME_MODIFIERS.find(m => m.terrain === terrain);
}

export function getFormativeTraitSeed(id: string): FormativeTraitSeed | undefined {
  return FORMATIVE_TRAIT_SEEDS.find(s => s.id === id);
}

export function getBehavioralTraitSeed(id: string): BehavioralTraitSeed | undefined {
  return BEHAVIORAL_TRAIT_SEEDS.find(s => s.id === id);
}

export function getInsiderBeat(id: string): InsiderBeat | undefined {
  return INSIDER_BEATS.find(b => b.id === id);
}

export function getSubLocationTemplate(id: string): SubLocationTemplate | undefined {
  return SUB_LOCATION_TEMPLATES.find(t => t.id === id);
}

export function getBeatsForCultureTags(tags: string[]): InsiderBeat[] {
  return INSIDER_BEATS.filter(b =>
    b.requiredCultureTags.some(t => tags.includes(t))
  );
}

export function getTraitSeedsForTags(tags: string[]): {
  formative: FormativeTraitSeed[];
  behavioral: BehavioralTraitSeed[];
} {
  return {
    formative: FORMATIVE_TRAIT_SEEDS.filter(s =>
      s.sourceTags.some(t => tags.includes(t))
    ),
    behavioral: BEHAVIORAL_TRAIT_SEEDS.filter(s =>
      s.sourceTags.some(t => tags.includes(t))
    ),
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/data/__tests__/culture-content.test.ts`
Expected: PASS (all tests, ~42 total)

**Step 5: Commit**

```bash
git add src/data/culture-content.ts src/data/__tests__/culture-content.test.ts
git commit -m "feat(culture): add 9 lookup functions + cross-validation tests"
```

---

### Task 9: Per-Entry Quality Validation & Final Review

**Files:**
- Modify: `src/data/__tests__/culture-content.test.ts`

**Step 1: Write validation tests**

```typescript
describe('culture-content — per-entry quality validation', () => {
  describe('formative trait seeds', () => {
    for (const seed of FORMATIVE_TRAIT_SEEDS) {
      it(`"${seed.name}" has valid domain contributions`, () => {
        const values = Object.values(seed.domainContributions);
        expect(values.length).toBeGreaterThanOrEqual(1);
        for (const v of values) {
          expect(Math.abs(v)).toBeLessThanOrEqual(5);
        }
      });
    }
  });

  describe('behavioral trait seeds', () => {
    for (const seed of BEHAVIORAL_TRAIT_SEEDS) {
      it(`"${seed.name}" has at least 2 strength threshold descriptions`, () => {
        const entries = Object.entries(seed.strengthThresholds);
        expect(entries.length).toBeGreaterThanOrEqual(2);
        for (const [, desc] of entries) {
          expect(desc.length).toBeGreaterThanOrEqual(10);
        }
      });
    }
  });

  describe('insider beats', () => {
    for (const beat of INSIDER_BEATS) {
      it(`"${beat.name}" has at least 1 prose seed of reasonable length`, () => {
        expect(beat.proseSeeds.length).toBeGreaterThanOrEqual(1);
        for (const seed of beat.proseSeeds) {
          expect(seed.length).toBeGreaterThanOrEqual(15);
        }
      });
    }
  });
});
```

**Step 2: Run full test suite**

Run: `npx vitest run src/data/__tests__/culture-content.test.ts --reporter=verbose`
Expected: ALL PASS

**Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: Clean pass

**Step 4: Check file size and content stats**

```bash
wc -l src/data/culture-content.ts
echo "---"
grep -c 'id:' src/data/culture-content.ts  # rough entry count
```

Expected: 800–1200 lines, ~125+ entries

**Step 5: Commit**

```bash
git add src/data/__tests__/culture-content.test.ts
git commit -m "test(culture): add per-entry quality validation for all content sections"
```

---

### Task 10: Documentation Updates

**Files:**
- Modify: `CLAUDE.md` (changelog + project status)
- Obsidian vault updates (via MCP)
- Notion backlog updates (via MCP)

Follow the `gamedocumenter` skill checklist:

1. Append changelog rows to CLAUDE.md Recent Changes table
2. Update CLAUDE.md Project Status section (content stats)
3. Update Obsidian: `Systems/Content Packages.md` to mark culture-content.ts complete
4. Update Notion backlog: mark Culture Content Data implementation complete
5. Commit CLAUDE.md changes

```bash
git add CLAUDE.md
git commit -m "docs: update project status for culture content package completion"
```
