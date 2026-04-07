# Meet The First Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the stat-preview meeting encounter with a vignette-only, emotionally resonant experience that consumes the ascendant's Hunger/Drive/mortal-echo identity to create a deeply personal first divine bond.

**Architecture:** Content-first upgrade of the existing 4-step meeting encounter. New dilemma selection engine with multi-axis resonance scoring replaces the current single-axis picker. Ascendant lens system wraps all prose through the god's perception. New types and content library, rewritten UI, preserved mechanical infrastructure (thread edges, agent creation, journey engine).

**Tech Stack:** React + TypeScript, Vitest, existing engine infrastructure (seeded PRNG, WorldGraph, enrichProse)

**Spec:** `Docs/plans/2026-04-06-meet-the-first-redesign.md`

---

## Phase Overview

| Phase | Tasks | What It Delivers |
|-------|-------|-----------------|
| **1: Foundation** | 1-3 | New types, Hunger stub interface, codebase cleanup |
| **2: Dilemma Engine** | 4-6 | Resonance selection engine, Notion import pipeline, lens overlay system |
| **3: UI Rewrite** | 7-10 | All 4 steps rewritten as vignette-only with art placeholders |
| **4: Proof of Concept Content** | 11-12 | One Hunger (Gather) works end-to-end with real prose |

---

### Task 1: Codebase Cleanup — Remove Stale Flesh Artifacts

**Files:**
- Modify: `src/data/meeting-content.ts`
- Modify: `src/engine/__tests__/meetingEncounter.test.ts`

- [ ] **Step 1: Delete flesh archetype entries from ARCHETYPE_NAME_MAP**

Remove all 17 entries containing `flesh` (both `*_flesh` and `flesh_*` keys) from the `ARCHETYPE_NAME_MAP` object in `src/data/meeting-content.ts`. The map should go from 81 entries to 64 entries (8×8 reach combinations).

Keys to remove: `iron_flesh`, `gold_flesh`, `shadow_flesh`, `veil_flesh`, `heart_flesh`, `eye_flesh`, `stone_flesh`, `star_flesh`, `flesh_iron`, `flesh_gold`, `flesh_shadow`, `flesh_veil`, `flesh_heart`, `flesh_eye`, `flesh_stone`, `flesh_star`, `flesh_flesh`.

- [ ] **Step 2: Remove flesh entry from REACH_INVESTMENT_TEXT**

In `getSparkInvestmentOptions()`, find the `REACH_INVESTMENT_TEXT` object and remove the `'flesh'` key if present.

- [ ] **Step 3: Delete broken flesh dilemma drafts**

Remove any dilemma objects in `DILEMMA_TEMPLATES` or loose objects near the end of the file that reference the `flesh` reach or use the old schema (`reach`, `title`, `sceneProse`, `tensionProse` fields instead of `category`, `setup`, `godVoice`).

- [ ] **Step 4: Fix duplicate god-given trait**

In the `GOD_GIVEN_TRAITS` array, check for a duplicate `gold` reach entry (`vital_surge`). If it was meant to be the `flesh` trait, remove it entirely. The array should have exactly 8 traits, one per canonical reach.

- [ ] **Step 5: Update test expectations**

In `src/engine/__tests__/meetingEncounter.test.ts`, update the ARCHETYPE_NAME_MAP entry count assertion from 81 to 64.

- [ ] **Step 6: Run tests and type check**

```bash
npm test -- --run && npx tsc --noEmit
```

Expected: All tests pass, no type errors.

- [ ] **Step 7: Commit**

```bash
git add src/data/meeting-content.ts src/engine/__tests__/meetingEncounter.test.ts
git commit -m "chore: remove stale flesh reach artifacts from meeting content"
```

---

### Task 2: Define Ascendant Lens and Hunger Types

**Files:**
- Create: `src/types/hunger.ts`
- Modify: `src/types/meetingEncounter.ts`

- [ ] **Step 1: Create the Hunger and AscendantLens types**

Create `src/types/hunger.ts`:

```typescript
/**
 * Hunger & Ascendant Lens Types — output contract from the Remembrance Flow.
 *
 * The Remembrance Flow (ascendant character creation) produces an identity
 * that the meeting encounter consumes. This file defines the interface
 * contract. Until the Remembrance Flow is implemented, a stub builder
 * provides defaults from the current archetype system.
 */

// ─── Hunger ──────────────────────────────────────────────────────

/** The 10 core Hungers — gameplay archetypes from the Remembrance Flow */
export type HungerId =
  | 'gather' | 'witness' | 'preserve' | 'reshape' | 'reclaim'
  | 'consume' | 'sever' | 'kindle' | 'bind' | 'wander';

export interface HungerDefinition {
  id: HungerId;
  name: string;
  /** How this god perceives mortals — woven into all encounter prose */
  perceptionStyle: string;
  /** Emotional coloring of all prose */
  emotionalTone: string;
  /** Reach domains this Hunger draws toward when filtering candidates */
  candidateReachBias: readonly string[];
  /** Emotional registers this Hunger resonates with in dilemmas */
  dilemmaResonanceTags: readonly string[];
}

// ─── Ascendant Lens ──────────────────────────────────────────────

/**
 * The complete ascendant identity consumed by Meet The First.
 * Produced by the Remembrance Flow; stubbed from archetypes until then.
 */
export interface AscendantLens {
  /** The Hunger that drives this god */
  hunger: HungerDefinition;
  /** The mortal role before ascension (shepherd, scholar, ruler, etc.) */
  mortalOrigin: string;
  /** The obsession that survived ascension */
  drive: string;
  /** Tags describing the Drive's emotional core (for resonance matching) */
  driveTags: readonly string[];
  /** How long ago the ascension happened */
  timeSinceAscension: 'recent' | 'ancient';
  /** The mortal name (for rare intimate surfacing) */
  mortalName: string;
}

// ─── Hunger Catalog ──────────────────────────────────────────────

export const HUNGER_CATALOG: readonly HungerDefinition[] = [
  {
    id: 'gather',
    name: 'Gather',
    perceptionStyle: 'reads the threads of belonging — who protects, who needs shelter, who holds a community together without being seen',
    emotionalTone: 'warmth edged with possessiveness',
    candidateReachBias: ['heart', 'stone', 'gold'],
    dilemmaResonanceTags: ['belonging', 'protection', 'community', 'sacrifice', 'loyalty', 'shelter'],
  },
  {
    id: 'witness',
    name: 'Witness',
    perceptionStyle: 'sees what is hidden — lies behind smiles, patterns beneath chaos, the secret architecture of every situation',
    emotionalTone: 'detached curiosity sharpening into hunger',
    candidateReachBias: ['eye', 'shadow', 'veil'],
    dilemmaResonanceTags: ['secrets', 'knowledge', 'observation', 'truth', 'patterns', 'investigation'],
  },
  {
    id: 'preserve',
    name: 'Preserve',
    perceptionStyle: 'feels the weight of what has been lost — every crack in a wall, every forgotten name, every story fading into silence',
    emotionalTone: 'grief transmuted into iron determination',
    candidateReachBias: ['stone', 'star', 'veil'],
    dilemmaResonanceTags: ['loss', 'memory', 'restoration', 'tradition', 'endurance', 'legacy'],
  },
  {
    id: 'reshape',
    name: 'Reshape',
    perceptionStyle: 'sees potential — not what is, but what could be, if the right pressure were applied at the right moment',
    emotionalTone: 'visionary impatience',
    candidateReachBias: ['iron', 'heart', 'eye'],
    dilemmaResonanceTags: ['transformation', 'ambition', 'vision', 'power', 'revolution', 'creation'],
  },
  {
    id: 'reclaim',
    name: 'Reclaim',
    perceptionStyle: 'perceives injustice like a wound — stolen things, broken oaths, debts unpaid, the gap between what is and what should have been',
    emotionalTone: 'cold fury beneath careful patience',
    candidateReachBias: ['iron', 'shadow', 'star'],
    dilemmaResonanceTags: ['justice', 'vengeance', 'restoration', 'duty', 'oath', 'debt'],
  },
  {
    id: 'consume',
    name: 'Consume',
    perceptionStyle: 'senses vitality — strength waiting to be absorbed, territory waiting to be claimed, power waiting to be gathered',
    emotionalTone: 'appetite wearing the mask of purpose',
    candidateReachBias: ['iron', 'gold', 'shadow'],
    dilemmaResonanceTags: ['power', 'conquest', 'growth', 'hunger', 'domination', 'territory'],
  },
  {
    id: 'sever',
    name: 'Sever',
    perceptionStyle: 'sees chains — obligations, debts, loyalties, traditions, every invisible thread binding a person to something they did not choose',
    emotionalTone: 'fierce tenderness for the trapped',
    candidateReachBias: ['shadow', 'veil', 'star'],
    dilemmaResonanceTags: ['freedom', 'rebellion', 'independence', 'chains', 'escape', 'solitude'],
  },
  {
    id: 'kindle',
    name: 'Kindle',
    perceptionStyle: 'perceives the spark in others — dormant talent, suppressed passion, the ember of something extraordinary waiting for a breath of air',
    emotionalTone: 'infectious enthusiasm verging on recklessness',
    candidateReachBias: ['heart', 'star', 'eye'],
    dilemmaResonanceTags: ['creation', 'inspiration', 'passion', 'art', 'movement', 'spark'],
  },
  {
    id: 'bind',
    name: 'Bind',
    perceptionStyle: 'sees the architecture of obligation — who owes what to whom, where promises are kept and where they fray, the invisible scaffolding of civilization',
    emotionalTone: 'the serenity of someone who believes order is love',
    candidateReachBias: ['gold', 'eye', 'heart'],
    dilemmaResonanceTags: ['order', 'law', 'covenant', 'structure', 'loyalty', 'obligation'],
  },
  {
    id: 'wander',
    name: 'Wander',
    perceptionStyle: 'notices what others walk past — the path nobody takes, the sound from behind the locked door, the horizon line that promises something uncharted',
    emotionalTone: 'restless joy in the unknown',
    candidateReachBias: ['veil', 'eye', 'star'],
    dilemmaResonanceTags: ['journey', 'discovery', 'curiosity', 'exploration', 'wonder', 'horizon'],
  },
] as const;

// ─── Stub Builder ────────────────────────────────────────────────

/**
 * Build a stub AscendantLens from the current archetype system.
 * Used until the Remembrance Flow is implemented.
 * Falls back to 'gather' Hunger with generic mortal echo.
 */
export function buildStubAscendantLens(
  primarySphere: string,
  _secondarySphere: string,
): AscendantLens {
  // Map sphere to a reasonable default Hunger
  const SPHERE_HUNGER_MAP: Record<string, HungerId> = {
    force: 'reshape', matter: 'bind', energy: 'kindle', life: 'gather',
    mind: 'witness', spirit: 'preserve', time: 'preserve', entropy: 'consume',
  };
  const hungerId = SPHERE_HUNGER_MAP[primarySphere] ?? 'gather';
  const hunger = HUNGER_CATALOG.find(h => h.id === hungerId) ?? HUNGER_CATALOG[0];

  return {
    hunger,
    mortalOrigin: 'a life half-remembered',
    drive: 'something that could not be released',
    driveTags: hunger.dilemmaResonanceTags.slice(0, 3),
    timeSinceAscension: 'ancient',
    mortalName: '',
  };
}
```

- [ ] **Step 2: Add resonance and lens types to meetingEncounter.ts**

Add to the bottom of `src/types/meetingEncounter.ts`:

```typescript
// ─── Resonance Tags (for dilemma selection engine) ───────────────

/**
 * Emotional register tags for art matching and resonance scoring.
 * Added to DilemmaTemplate during content import.
 */
export interface DilemmaResonanceTags {
  /** Emotional register of this dilemma (violence, loss, loyalty, etc.) */
  emotionalRegister: readonly string[];
  /** Which Hungers this dilemma echoes */
  hungerResonance: readonly string[];
  /** Which Drive themes this dilemma connects to */
  driveResonance: readonly string[];
  /** IDs of templates this is incompatible with */
  incompatibleWith: readonly string[];
}

/**
 * Lens overlay for a specific Hunger on a specific dilemma or vignette.
 */
export interface LensOverlay {
  /** Which Hunger this overlay is for */
  hungerId: string;
  /** 1-2 sentences woven into the scene — how the god perceives this moment */
  perceptionProse: string;
  /** Drive resonance score above which the mortal echo fires */
  echoThreshold?: number;
  /** The mortal echo line (e.g. "You did this once.") */
  echoProse?: string;
}

/**
 * Extended dilemma template with resonance tags and lens overlays.
 * Superset of DilemmaTemplate — all existing fields preserved.
 */
export interface EnrichedDilemmaTemplate extends DilemmaTemplate {
  /** Resonance tags for selection engine scoring */
  resonance: DilemmaResonanceTags;
  /** Per-Hunger lens overlays */
  lensOverlays: readonly LensOverlay[];
  /** Art mood tags for image library matching */
  artTags: readonly string[];
}
```

- [ ] **Step 3: Run type check**

```bash
npx tsc --noEmit
```

Expected: Clean — no errors.

- [ ] **Step 4: Commit**

```bash
git add src/types/hunger.ts src/types/meetingEncounter.ts
git commit -m "feat(meeting): add Hunger catalog, AscendantLens interface, and enriched dilemma types"
```

---

### Task 3: Art Library Infrastructure

**Files:**
- Create: `src/data/meeting-art-library.ts`
- Create: `src/engine/artSelection.ts`
- Create: `src/engine/__tests__/artSelection.test.ts`

- [ ] **Step 1: Write failing test for art selection**

Create `src/engine/__tests__/artSelection.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { selectArt, type ArtAsset } from '../artSelection';

const LIBRARY: ArtAsset[] = [
  { id: 'art-001', path: '/art/meeting/warmth-tangled.webp', tags: ['warmth', 'care', 'coastal'] },
  { id: 'art-002', path: '/art/meeting/tension-blade.webp', tags: ['violence', 'combat', 'fear'] },
  { id: 'art-003', path: '/art/meeting/solitude-horizon.webp', tags: ['solitude', 'journey', 'wonder'] },
  { id: 'art-004', path: '/art/meeting/loss-ashes.webp', tags: ['loss', 'grief', 'memory'] },
];

describe('selectArt', () => {
  it('selects the best-matching image by tag overlap', () => {
    const result = selectArt(LIBRARY, ['warmth', 'care'], 42);
    expect(result.id).toBe('art-001');
  });

  it('breaks ties deterministically via seed', () => {
    const lib: ArtAsset[] = [
      { id: 'a', path: '/a.webp', tags: ['combat'] },
      { id: 'b', path: '/b.webp', tags: ['combat'] },
    ];
    const r1 = selectArt(lib, ['combat'], 42);
    const r2 = selectArt(lib, ['combat'], 42);
    expect(r1.id).toBe(r2.id);
  });

  it('returns first item when no tags match', () => {
    const result = selectArt(LIBRARY, ['nonexistent'], 42);
    expect(result).toBeDefined();
  });

  it('returns fallback when library is empty', () => {
    const result = selectArt([], ['warmth'], 42);
    expect(result.id).toBe('fallback');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/engine/__tests__/artSelection.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement art selection engine**

Create `src/engine/artSelection.ts`:

```typescript
/**
 * Art Selection Engine — tag-matched image selection from pre-baked library.
 *
 * Scores library images against request tags by overlap count.
 * Ties broken by seeded PRNG for determinism.
 */

export interface ArtAsset {
  /** Unique asset ID */
  id: string;
  /** Path to the image file (relative to public/) */
  path: string;
  /** Mood/emotional tags for matching */
  tags: readonly string[];
}

const FALLBACK_ART: ArtAsset = {
  id: 'fallback',
  path: '/art/meeting/fallback.webp',
  tags: [],
};

/**
 * Select the best-matching art asset for the given mood tags.
 * Scores by tag overlap count. Ties broken deterministically via seed.
 */
export function selectArt(
  library: readonly ArtAsset[],
  requestTags: readonly string[],
  seed: number,
): ArtAsset {
  if (library.length === 0) return FALLBACK_ART;

  const tagSet = new Set(requestTags);
  let bestScore = -1;
  let bestIdx = 0;
  // Simple hash for tie-breaking
  let tieBreaker = seed;

  for (let i = 0; i < library.length; i++) {
    let score = 0;
    for (const tag of library[i].tags) {
      if (tagSet.has(tag)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
      tieBreaker = seed;
    } else if (score === bestScore) {
      // Deterministic tie-break: hash index with seed
      const h = ((seed * 2654435761) ^ (i * 2246822519)) >>> 0;
      const hBest = ((seed * 2654435761) ^ (bestIdx * 2246822519)) >>> 0;
      if (h > hBest) {
        bestIdx = i;
      }
    }
  }

  return library[bestIdx];
}
```

- [ ] **Step 4: Create stub art library**

Create `src/data/meeting-art-library.ts`:

```typescript
/**
 * Meeting Encounter Art Library — pre-baked abstract mood images.
 *
 * ═══════════════════════════════════════════════════════════════════
 * ART MANAGER: Add images to public/art/meeting/ and register them
 * here with emotional tags for the selection engine.
 * ═══════════════════════════════════════════════════════════════════
 */

import type { ArtAsset } from '../engine/artSelection';

/**
 * Candidate vignette mood images (Step 1).
 * Tagged by emotional tone + location atmosphere.
 */
export const CANDIDATE_ART: readonly ArtAsset[] = [
  // Stub — populated during art content pass
];

/**
 * Dilemma mood images (Step 2).
 * Tagged by emotional register.
 */
export const DILEMMA_ART: readonly ArtAsset[] = [
  // Stub — populated during art content pass
];

/**
 * Spark/bond images (Step 3).
 * One per Hunger — the moment of divine contact.
 */
export const SPARK_ART: readonly ArtAsset[] = [
  // Stub — populated during art content pass
];
```

- [ ] **Step 5: Run tests**

```bash
npx vitest run src/engine/__tests__/artSelection.test.ts && npx tsc --noEmit
```

Expected: All pass, clean type check.

- [ ] **Step 6: Commit**

```bash
git add src/engine/artSelection.ts src/engine/__tests__/artSelection.test.ts src/data/meeting-art-library.ts
git commit -m "feat(meeting): add art selection engine with tag-matching and stub library"
```

---

### Task 4: Dilemma Resonance Selection Engine

**Files:**
- Create: `src/engine/dilemmaSelection.ts`
- Create: `src/engine/__tests__/dilemmaSelection.test.ts`

- [ ] **Step 1: Write failing tests for the selection engine**

Create `src/engine/__tests__/dilemmaSelection.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { selectDilemmasV2, scoreDilemmaResonance } from '../dilemmaSelection';
import type { EnrichedDilemmaTemplate } from '../../types/meetingEncounter';
import type { AscendantLens } from '../../types/hunger';
import { HUNGER_CATALOG, buildStubAscendantLens } from '../../types/hunger';

// Minimal enriched template factory
function makeTemplate(
  overrides: Partial<EnrichedDilemmaTemplate> & { id: string; category: EnrichedDilemmaTemplate['category'] },
): EnrichedDilemmaTemplate {
  return {
    setup: 'Test setup',
    godVoice: 'Test voice',
    choices: [{
      id: 'c1', text: 'Choice A', godAction: 'Pull',
      axiologicalShifts: {}, gateTags: ['test'],
    }],
    resonance: {
      emotionalRegister: [],
      hungerResonance: [],
      driveResonance: [],
      incompatibleWith: [],
    },
    lensOverlays: [],
    artTags: [],
    ...overrides,
  };
}

const AXIOLOGICAL_MERCY = makeTemplate({
  id: 'ax-mercy-1', category: 'axiological', targetValuePair: 'mercy_ruthlessness',
  resonance: { emotionalRegister: ['violence', 'loss'], hungerResonance: ['gather', 'preserve'], driveResonance: ['protection'], incompatibleWith: ['ax-mercy-2'] },
});
const AXIOLOGICAL_MERCY_2 = makeTemplate({
  id: 'ax-mercy-2', category: 'axiological', targetValuePair: 'mercy_ruthlessness',
  resonance: { emotionalRegister: ['combat'], hungerResonance: ['consume', 'reclaim'], driveResonance: ['vengeance'], incompatibleWith: ['ax-mercy-1'] },
});
const REACH_IRON = makeTemplate({
  id: 'rc-iron-1', category: 'reach_specific', targetReach: 'iron',
  resonance: { emotionalRegister: ['combat'], hungerResonance: ['reshape', 'consume'], driveResonance: ['power'], incompatibleWith: [] },
});
const DOMAIN_LIFE = makeTemplate({
  id: 'ds-life-1', category: 'domain_specific', targetSphere: 'life',
  resonance: { emotionalRegister: ['belonging'], hungerResonance: ['gather', 'kindle'], driveResonance: ['protection'], incompatibleWith: [] },
});
const GENERAL_ALLY = makeTemplate({
  id: 'gen-ally-1', category: 'general',
  resonance: { emotionalRegister: ['loyalty'], hungerResonance: ['gather', 'bind'], driveResonance: ['belonging'], incompatibleWith: [] },
});

const ALL_TEMPLATES = [AXIOLOGICAL_MERCY, AXIOLOGICAL_MERCY_2, REACH_IRON, DOMAIN_LIFE, GENERAL_ALLY];

describe('scoreDilemmaResonance', () => {
  it('scores higher when Hunger tags overlap with template resonance', () => {
    const lens = buildStubAscendantLens('life', 'spirit');
    const score1 = scoreDilemmaResonance(AXIOLOGICAL_MERCY, lens);
    const score2 = scoreDilemmaResonance(AXIOLOGICAL_MERCY_2, lens);
    expect(score1).toBeGreaterThan(score2); // gather resonance matches mercy-1
  });

  it('returns zero for no overlap', () => {
    const lens: AscendantLens = {
      hunger: HUNGER_CATALOG.find(h => h.id === 'wander')!,
      mortalOrigin: 'wanderer', drive: 'horizon', driveTags: ['horizon'],
      timeSinceAscension: 'ancient', mortalName: '',
    };
    // wander has no overlap with combat/consume/vengeance
    const score = scoreDilemmaResonance(AXIOLOGICAL_MERCY_2, lens);
    expect(score).toBe(0);
  });
});

describe('selectDilemmasV2', () => {
  it('returns 2-3 dilemmas from different categories', () => {
    const lens = buildStubAscendantLens('life', 'spirit');
    const result = selectDilemmasV2(ALL_TEMPLATES, 'iron', 'life', lens, 42);
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result.length).toBeLessThanOrEqual(3);
    const categories = result.map(d => d.category);
    expect(new Set(categories).size).toBe(categories.length); // no duplicate categories
  });

  it('always includes an axiological dilemma for the primary reach value pair', () => {
    const lens = buildStubAscendantLens('life', 'spirit');
    const result = selectDilemmasV2(ALL_TEMPLATES, 'iron', 'life', lens, 42);
    const axio = result.find(d => d.category === 'axiological');
    expect(axio).toBeDefined();
    expect(axio!.targetValuePair).toBe('mercy_ruthlessness'); // iron's value pair
  });

  it('respects incompatibleWith constraints', () => {
    const lens = buildStubAscendantLens('life', 'spirit');
    const result = selectDilemmasV2(ALL_TEMPLATES, 'iron', 'life', lens, 42);
    const ids = result.map(d => d.id);
    // mercy-1 and mercy-2 are incompatible
    expect(ids.includes('ax-mercy-1') && ids.includes('ax-mercy-2')).toBe(false);
  });

  it('is deterministic with the same seed', () => {
    const lens = buildStubAscendantLens('life', 'spirit');
    const r1 = selectDilemmasV2(ALL_TEMPLATES, 'iron', 'life', lens, 42);
    const r2 = selectDilemmasV2(ALL_TEMPLATES, 'iron', 'life', lens, 42);
    expect(r1.map(d => d.id)).toEqual(r2.map(d => d.id));
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/engine/__tests__/dilemmaSelection.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the dilemma selection engine**

Create `src/engine/dilemmaSelection.ts`:

```typescript
/**
 * Dilemma Selection Engine V2 — multi-axis resonance scoring.
 *
 * Replaces the single-axis picker from meetingEncounter.selectDilemmas().
 * Selects 2-3 dilemmas per encounter from different categories, scored
 * by Hunger resonance, Drive resonance, and anti-resonance bonus.
 *
 * NFP #1: All weights are named constants.
 * NFP #3: All randomness uses seeded PRNG.
 */

import type { EnrichedDilemmaTemplate } from '../types/meetingEncounter';
import type { AscendantLens } from '../types/hunger';
import type { ReachDomain } from '../types/traits';
import type { SphereName } from '../types/index';
import type { ValuePair } from '../types/agent';
import { REACH_VALUE_PAIR } from '../types/agent';

// ─── Constants (NFP #1: Tunability) ──────────────────────────────

/** Weight for Hunger tag overlap in resonance scoring */
export const HUNGER_RESONANCE_WEIGHT = 2.0;

/** Weight for Drive tag overlap in resonance scoring */
export const DRIVE_RESONANCE_WEIGHT = 3.0;

/** Probability of the optional third dilemma slot */
export const THIRD_DILEMMA_PROBABILITY = 0.6;

/** Probability of anti-resonance selection (contradicts Hunger) */
export const ANTI_RESONANCE_PROBABILITY = 0.15;

// ─── Seeded PRNG (same algorithm as meetingEncounter.ts) ─────────

function createSeededRng(baseSeed: number, salt: string): () => number {
  let h = baseSeed;
  for (let i = 0; i < salt.length; i++) {
    h = ((h << 5) - h + salt.charCodeAt(i)) | 0;
  }
  let s = h;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Resonance Scoring ───────────────────────────────────────────

/**
 * Score how well a dilemma resonates with the ascendant's identity.
 * Higher = better match.
 */
export function scoreDilemmaResonance(
  template: EnrichedDilemmaTemplate,
  lens: AscendantLens,
): number {
  let score = 0;
  const hungerTags = new Set(lens.hunger.dilemmaResonanceTags);
  const driveTags = new Set(lens.driveTags);

  for (const tag of template.resonance.hungerResonance) {
    if (hungerTags.has(tag)) score += HUNGER_RESONANCE_WEIGHT;
  }
  for (const tag of template.resonance.driveResonance) {
    if (driveTags.has(tag)) score += DRIVE_RESONANCE_WEIGHT;
  }

  return score;
}

// ─── Selection Engine ────────────────────────────────────────────

/**
 * Select 2-3 dilemmas from the enriched library for a meeting encounter.
 *
 * Slot 1: Axiological — keyed to the primary reach's value pair
 * Slot 2: Reach-specific — keyed to the primary reach domain
 * Slot 3 (optional): Domain-specific or General — keyed to sphere or full pool
 *
 * Within each slot, templates are scored by resonance with the ascendant lens.
 * Anti-resonance bonus: ~15% chance of picking a low-resonance template.
 */
export function selectDilemmasV2(
  library: readonly EnrichedDilemmaTemplate[],
  primaryReach: ReachDomain,
  primarySphere: SphereName,
  lens: AscendantLens,
  seed: number,
  excludeIds: readonly string[] = [],
): EnrichedDilemmaTemplate[] {
  const rng = createSeededRng(seed, 'dilemma-selection-v2');
  const selected: EnrichedDilemmaTemplate[] = [];
  const usedIds = new Set(excludeIds);

  // Track incompatibilities
  const incompatible = new Set<string>();

  function markSelected(t: EnrichedDilemmaTemplate): void {
    selected.push(t);
    usedIds.add(t.id);
    for (const inc of t.resonance.incompatibleWith) {
      incompatible.add(inc);
    }
  }

  function isAvailable(t: EnrichedDilemmaTemplate): boolean {
    return !usedIds.has(t.id) && !incompatible.has(t.id);
  }

  function pickBest(candidates: readonly EnrichedDilemmaTemplate[]): EnrichedDilemmaTemplate | undefined {
    const available = candidates.filter(isAvailable);
    if (available.length === 0) return undefined;

    // Anti-resonance: small chance of picking lowest-scoring
    const useAntiResonance = rng() < ANTI_RESONANCE_PROBABILITY;

    const scored = available.map(t => ({
      template: t,
      score: scoreDilemmaResonance(t, lens) + rng() * 0.1, // tiny jitter for ties
    }));
    scored.sort((a, b) => b.score - a.score);

    if (useAntiResonance && scored.length > 1) {
      return scored[scored.length - 1].template;
    }
    return scored[0].template;
  }

  // Slot 1: Axiological — keyed to primary reach's value pair
  const targetPair = REACH_VALUE_PAIR[primaryReach] as ValuePair | undefined;
  if (targetPair) {
    const axioCandidates = library.filter(
      t => t.category === 'axiological' && t.targetValuePair === targetPair,
    );
    const pick = pickBest(axioCandidates);
    if (pick) markSelected(pick);
  }

  // Slot 2: Reach-specific — keyed to primary reach
  const reachCandidates = library.filter(
    t => t.category === 'reach_specific' && t.targetReach === primaryReach,
  );
  const reachPick = pickBest(reachCandidates);
  if (reachPick) markSelected(reachPick);

  // Slot 3 (optional): Domain-specific or General
  if (rng() < THIRD_DILEMMA_PROBABILITY) {
    // Try domain-specific first (keyed to ascendant's sphere)
    const domainCandidates = library.filter(
      t => t.category === 'domain_specific' && t.targetSphere === primarySphere,
    );
    let slot3Pick = pickBest(domainCandidates);

    // Fall back to general pool
    if (!slot3Pick) {
      const generalCandidates = library.filter(t => t.category === 'general');
      slot3Pick = pickBest(generalCandidates);
    }

    if (slot3Pick) markSelected(slot3Pick);
  }

  return selected;
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/engine/__tests__/dilemmaSelection.test.ts && npx tsc --noEmit
```

Expected: All pass, clean type check.

- [ ] **Step 5: Commit**

```bash
git add src/engine/dilemmaSelection.ts src/engine/__tests__/dilemmaSelection.test.ts
git commit -m "feat(meeting): add V2 dilemma selection engine with multi-axis resonance scoring"
```

---

### Task 5: Lens Overlay Resolution Engine

**Files:**
- Create: `src/engine/ascendantLens.ts`
- Create: `src/engine/__tests__/ascendantLens.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/engine/__tests__/ascendantLens.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { resolveLensOverlay, shouldFireMortalEcho, composeLensedProse } from '../ascendantLens';
import type { AscendantLens } from '../../types/hunger';
import type { LensOverlay } from '../../types/meetingEncounter';
import { HUNGER_CATALOG } from '../../types/hunger';

const GATHER_LENS: AscendantLens = {
  hunger: HUNGER_CATALOG.find(h => h.id === 'gather')!,
  mortalOrigin: 'shepherd',
  drive: 'protecting the flock',
  driveTags: ['protection', 'belonging', 'sacrifice'],
  timeSinceAscension: 'ancient',
  mortalName: 'Kael',
};

const OVERLAYS: readonly LensOverlay[] = [
  { hungerId: 'gather', perceptionProse: 'You feel the threads of care.', echoThreshold: 2, echoProse: 'You did this once.' },
  { hungerId: 'witness', perceptionProse: 'You see the hidden pattern.' },
];

describe('resolveLensOverlay', () => {
  it('returns the overlay matching the active Hunger', () => {
    const overlay = resolveLensOverlay(OVERLAYS, 'gather');
    expect(overlay).toBeDefined();
    expect(overlay!.perceptionProse).toContain('threads of care');
  });

  it('returns undefined when no matching overlay exists', () => {
    const overlay = resolveLensOverlay(OVERLAYS, 'consume');
    expect(overlay).toBeUndefined();
  });
});

describe('shouldFireMortalEcho', () => {
  it('fires when Drive resonance exceeds threshold', () => {
    // 'protection' and 'belonging' are in gather's dilemmaResonanceTags
    const result = shouldFireMortalEcho(GATHER_LENS, ['protection', 'belonging', 'sacrifice'], 2);
    expect(result).toBe(true);
  });

  it('does not fire when resonance is below threshold', () => {
    const result = shouldFireMortalEcho(GATHER_LENS, ['combat'], 2);
    expect(result).toBe(false);
  });

  it('does not fire when no threshold set', () => {
    const result = shouldFireMortalEcho(GATHER_LENS, ['protection'], undefined);
    expect(result).toBe(false);
  });
});

describe('composeLensedProse', () => {
  it('weaves lens overlay into base prose', () => {
    const result = composeLensedProse('She mends the net.', OVERLAYS, GATHER_LENS, ['protection']);
    expect(result).toContain('She mends the net.');
    expect(result).toContain('threads of care');
  });

  it('includes mortal echo when threshold is met', () => {
    const result = composeLensedProse('She mends the net.', OVERLAYS, GATHER_LENS, ['protection', 'belonging', 'sacrifice']);
    expect(result).toContain('You did this once.');
  });

  it('returns base prose when no overlay matches', () => {
    const noOverlays: LensOverlay[] = [];
    const result = composeLensedProse('She mends the net.', noOverlays, GATHER_LENS, []);
    expect(result).toBe('She mends the net.');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/engine/__tests__/ascendantLens.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the lens overlay engine**

Create `src/engine/ascendantLens.ts`:

```typescript
/**
 * Ascendant Lens — overlay resolution for meeting encounter prose.
 *
 * Weaves the god's perception (Hunger + Drive + mortal echo) into
 * base scene prose. The lens is additive — base prose stays universal,
 * the perception layer is appended.
 *
 * NFP #4: Missing overlay → base prose unchanged (fail-soft).
 */

import type { AscendantLens } from '../types/hunger';
import type { LensOverlay } from '../types/meetingEncounter';

/**
 * Find the lens overlay matching the active Hunger.
 */
export function resolveLensOverlay(
  overlays: readonly LensOverlay[],
  hungerId: string,
): LensOverlay | undefined {
  return overlays.find(o => o.hungerId === hungerId);
}

/**
 * Check if the mortal echo should fire for this dilemma.
 * Fires when the Drive tag overlap with the dilemma's emotional register
 * meets or exceeds the overlay's echo threshold.
 */
export function shouldFireMortalEcho(
  lens: AscendantLens,
  dilemmaEmotionalTags: readonly string[],
  echoThreshold: number | undefined,
): boolean {
  if (echoThreshold == null) return false;

  const driveTags = new Set(lens.driveTags);
  let overlap = 0;
  for (const tag of dilemmaEmotionalTags) {
    if (driveTags.has(tag)) overlap++;
  }
  return overlap >= echoThreshold;
}

/**
 * Compose the final prose from base scene + lens overlay + optional mortal echo.
 *
 * Structure:
 *   [base prose]
 *   [lens perception, if overlay exists]
 *   [mortal echo, if threshold met]
 */
export function composeLensedProse(
  baseProse: string,
  overlays: readonly LensOverlay[],
  lens: AscendantLens,
  dilemmaEmotionalTags: readonly string[],
): string {
  const overlay = resolveLensOverlay(overlays, lens.hunger.id);
  if (!overlay) return baseProse;

  const parts = [baseProse];

  if (overlay.perceptionProse) {
    parts.push(overlay.perceptionProse);
  }

  if (overlay.echoProse && shouldFireMortalEcho(lens, dilemmaEmotionalTags, overlay.echoThreshold)) {
    parts.push(overlay.echoProse);
  }

  return parts.join('\n\n');
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/engine/__tests__/ascendantLens.test.ts && npx tsc --noEmit
```

Expected: All pass, clean type check.

- [ ] **Step 5: Commit**

```bash
git add src/engine/ascendantLens.ts src/engine/__tests__/ascendantLens.test.ts
git commit -m "feat(meeting): add ascendant lens overlay resolution engine"
```

---

### Task 6: Notion Dilemma Import — Batch Export and Transform

**Files:**
- Create: `scripts/import-dilemmas.ts`
- Create: `src/data/meeting-dilemma-library.ts`

This task exports the 177 Notion dilemma templates, fixes nomenclature, and imports them as a TypeScript content file. The import script is run once and the output is committed.

- [ ] **Step 1: Create the import script**

Create `scripts/import-dilemmas.ts` — a Node script that reads the Notion dilemma library pages (already fetched to local cache files during the brainstorm session), parses the template structure, applies nomenclature fixes, and outputs a TypeScript file.

The script should:
1. Parse each category page (axiological, reach-specific, domain-specific, general)
2. Extract template ID, category, target keys, setup prose, choices with shifts/tags
3. Re-key deprecated pairs: `frankness_propriety` → `revelation_discretion`, `humility_pride` → `preservation_transformation`
4. Skip templates targeting flesh reach or stoicism_passion pair
5. Add empty `resonance`, `lensOverlays`, and `artTags` fields (populated later)
6. Output to `src/data/meeting-dilemma-library.ts`

**Note:** This is a one-time migration script. The Notion pages are large (100K+ chars). The script should be run manually and the output committed. Full implementation details are left to the executing agent — the input format is the Notion page markdown as shown in the brainstorm session (templates delimited by `---`, with `## ID: ...`, `**Setup:**`, `**Choice A/B:**`, backtick-delimited metadata).

- [ ] **Step 2: Run the import script**

```bash
npx tsx scripts/import-dilemmas.ts
```

Verify the output file has ~165+ templates (177 minus ~12 flesh/deprecated).

- [ ] **Step 3: Validate the import**

Write a quick validation test in `src/engine/__tests__/dilemmaLibrary.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { ENRICHED_DILEMMA_LIBRARY } from '../../data/meeting-dilemma-library';

describe('meeting-dilemma-library', () => {
  it('has at least 140 templates', () => {
    expect(ENRICHED_DILEMMA_LIBRARY.length).toBeGreaterThanOrEqual(140);
  });

  it('has all four categories', () => {
    const categories = new Set(ENRICHED_DILEMMA_LIBRARY.map(t => t.category));
    expect(categories).toContain('axiological');
    expect(categories).toContain('reach_specific');
    expect(categories).toContain('domain_specific');
    expect(categories).toContain('general');
  });

  it('has no references to deprecated reaches or pairs', () => {
    for (const t of ENRICHED_DILEMMA_LIBRARY) {
      expect(t.targetReach).not.toBe('flesh');
      expect(t.targetValuePair).not.toBe('frankness_propriety');
      expect(t.targetValuePair).not.toBe('humility_pride');
      expect(t.targetValuePair).not.toBe('stoicism_passion');
    }
  });

  it('every template has 2+ choices with gateTags', () => {
    for (const t of ENRICHED_DILEMMA_LIBRARY) {
      expect(t.choices.length).toBeGreaterThanOrEqual(2);
      for (const c of t.choices) {
        expect(c.gateTags).toBeDefined();
        expect(c.gateTags.length).toBeGreaterThan(0);
      }
    }
  });

  it('every template has a resonance field', () => {
    for (const t of ENRICHED_DILEMMA_LIBRARY) {
      expect(t.resonance).toBeDefined();
    }
  });
});
```

- [ ] **Step 4: Run validation tests**

```bash
npx vitest run src/engine/__tests__/dilemmaLibrary.test.ts && npx tsc --noEmit
```

Expected: All pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/import-dilemmas.ts src/data/meeting-dilemma-library.ts src/engine/__tests__/dilemmaLibrary.test.ts
git commit -m "feat(meeting): import 165+ dilemma templates from Notion library with nomenclature fixes"
```

---

### Task 7: UI Rewrite — Step 1 (Seeking Threads as Vignettes)

**Files:**
- Modify: `src/components/Game/MeetingEncounterModal.tsx`
- Modify: `src/engine/meetingEncounter.ts`

- [ ] **Step 1: Add AscendantLens prop and stub it into the modal**

In `MeetingEncounterModal.tsx`, add `ascendantLens: AscendantLens` to the props interface. Import `AscendantLens` from `../../types/hunger`. Update the parent component (`GameView.tsx`) to pass `buildStubAscendantLens(ascendantSphere, ascendantSecondSphere)` as the lens prop.

- [ ] **Step 2: Rewrite StepSeekingThreads as vignette-only**

Replace the current Step 1 content (reach pickers, sphere selector, stat preview cards) with:

1. **Header:** *"Something stirs in the web of fate. You look down."*
2. **Three candidate cards** — each showing only:
   - A placeholder art area (colored gradient based on candidate emotional tags, actual images from art library when available)
   - The vignette prose (3-5 sentences from `candidate.vignetteText`)
   - No name, no stats, no personality hints
3. **"Look again" button** — regenerates candidates
4. **Selection:** Click a vignette card to select. Highlight with a glow. Show transition text: *"You pull the thread."*

Remove: reach picker buttons, sphere selector, `INTENT_OPTIONS` iteration, personality hints display, cooperation strategy display, reach score display.

The intent (primary reach, secondary reach, sphere) is now derived from the Hunger's `candidateReachBias` rather than player-selected. In `meetingEncounter.ts`, add a new function:

```typescript
export function deriveIntentFromHunger(
  lens: AscendantLens,
  seed: number,
): { primaryReach: ReachDomain; secondaryReach: ReachDomain; sphere: SphereName } {
  // Use candidateReachBias[0] as primary, [1] as secondary
  // Sphere from the Hunger's definition (or ascendant's primary sphere)
  // Seeded randomness for variety within the bias
}
```

- [ ] **Step 3: Update candidate vignette generation**

In `meetingEncounter.ts`, update `generateCandidates()` to produce richer `vignetteText`. Currently it generates a minimal placeholder. The new vignette should be a template composed from:
- Location subtype + culture atmosphere
- Candidate's primary reach (determines what they're doing)
- Hunger lens (how the god perceives them)

For V1, use a template string system with ~20 vignette templates in a new section of `meeting-content.ts`:

```typescript
export const CANDIDATE_VIGNETTE_TEMPLATES: Record<string, string[]> = {
  'iron': [
    'A {gender} stands at the edge of the training ground, watching the others spar. {pronoun} hands are steady but {pronoun_pos} jaw is set — not eager for violence, but unwilling to flinch from it.',
    // ... more per reach
  ],
  // ... per reach
};
```

- [ ] **Step 4: Verify Step 1 renders correctly**

Run the dev server and navigate to a location with the Meet The First button. Verify:
- Three vignette cards render with prose, no stats
- Clicking a card highlights it
- "Look again" regenerates candidates
- Selecting and advancing transitions to Step 2

- [ ] **Step 5: Run tests and type check**

```bash
npm test -- --run && npx tsc --noEmit && npx vite build
```

- [ ] **Step 6: Commit**

```bash
git add src/components/Game/MeetingEncounterModal.tsx src/engine/meetingEncounter.ts src/data/meeting-content.ts
git commit -m "feat(meeting): rewrite Step 1 as vignette-only candidate selection with Hunger-derived intent"
```

---

### Task 8: UI Rewrite — Step 2 (Defining Moment with Enriched Dilemmas)

**Files:**
- Modify: `src/components/Game/MeetingEncounterModal.tsx`

- [ ] **Step 1: Wire the V2 selection engine into Step 2**

Replace the import of `selectDilemmas` with `selectDilemmasV2` from `../../engine/dilemmaSelection`. Use the `ENRICHED_DILEMMA_LIBRARY` from `../../data/meeting-dilemma-library` (falling back to old `DILEMMA_TEMPLATES` if the new library is empty). Pass the `ascendantLens` to the selection engine.

- [ ] **Step 2: Rewrite StepDefiningMoment presentation**

Replace the current dilemma display with:

1. **Scene header:** *"The name comes to you: {name}. And you see..."*
2. **Art area:** Placeholder gradient (or art library image when available)
3. **Setup prose:** Use `composeLensedProse()` to weave the lens overlay into the base setup. Show the enriched prose as a blockquote-style text block.
4. **Choices:** Two buttons, each showing only the narrative outcome text. Remove `godAction` display, remove axiological shift labels, remove trait labels.
5. **Outcome:** After choosing, show the outcome prose (also through the lens), then transition text: *"The thread pulls taut. You look closer."*

- [ ] **Step 3: Add transition pacing between dilemmas**

Add a brief state (`'dilemma_transition'`) between dilemmas — 1-2 seconds of the transition text before the next dilemma appears. Use a simple `setTimeout` in the state machine.

- [ ] **Step 4: Verify Step 2 flow**

Run dev server and advance through Step 1 → Step 2. Verify:
- Dilemmas show rich prose without stats
- Lens overlay appears in the prose (if overlays exist on the selected templates)
- Choosing advances through 2-3 dilemmas
- Transitions feel paced, not jarring

- [ ] **Step 5: Run tests and type check**

```bash
npm test -- --run && npx tsc --noEmit && npx vite build
```

- [ ] **Step 6: Commit**

```bash
git add src/components/Game/MeetingEncounterModal.tsx
git commit -m "feat(meeting): rewrite Step 2 with V2 selection engine, lens overlays, and vignette-only choices"
```

---

### Task 9: UI Rewrite — Step 3 (The Spark as Recognition)

**Files:**
- Modify: `src/components/Game/MeetingEncounterModal.tsx`
- Create: `src/data/spark-prose.ts`

- [ ] **Step 1: Author Spark prose variants**

Create `src/data/spark-prose.ts` with one prose passage per Hunger (10 total). Each is 4-6 sentences — the highest prose budget beat.

```typescript
/**
 * Spark prose — per-Hunger recognition passages for Step 3.
 *
 * These are the climactic narrative beat: the god recognizes something
 * in The First that echoes their own Drive. The bond crystallizes.
 */

import type { HungerId } from '../types/hunger';

export const SPARK_PROSE: Record<HungerId, string> = {
  gather: `She doesn't know you're watching. She's wrapping the boy's hand where the rope burned it, murmuring something you can't hear but somehow remember — the cadence of comfort, older than language. You had hands like hers once. Rough, warm, always reaching for something that needed holding.\n\nThe hunger stirs. Not for her — for what she could become under your attention. The thread tightens. She looks up, suddenly, at nothing. She felt it.`,

  witness: `He's still watching. The pattern is almost complete — he's three connections from seeing what you already see. You could show him. You could open his eyes right now and let the knowledge pour in. But that would break him. Better to pull the thread gently. Let him find it himself. Let the question burn the way yours burned.\n\nHe pauses. Looks at his hands. Something has changed, and he doesn't know what.`,

  preserve: `She holds the shard of pottery like it's a living thing. Her fingers trace the faded glaze — a colour that hasn't been mixed in centuries. She doesn't know that. But she knows it matters. She knows that if she sets it down, something irreplaceable will be one step closer to gone.\n\nThe thread settles around her like snowfall. She shivers. The shard feels warmer in her hand.`,

  reshape: `He's arguing with the council elder again. The same argument — the irrigation channels are wrong, the old design wastes water, he can see a better way. They don't listen. They never listen. But he keeps drawing his diagrams in the dirt, because the shape in his mind won't let him stop.\n\nYou see the shape too. You see what he could build, given the right push. The thread wraps around his drawing hand, and his next line is straighter than any he's ever drawn.`,

  reclaim: `The scar on her arm is from a chain. She doesn't show it. But when the tax collector comes through the village, her hand drifts to it, and something in her jaw sets like stone. She's counting. Not coins — debts. Every one of them remembered.\n\nYou feel the weight of every debt. Yours are older, bigger, carved into the foundations of the world. But hers burn the same way. The thread finds her anger and wraps around it like a fist.`,

  consume: `He takes the last apple from the barrel without hesitating. The others watch — they always watch — but none of them move to stop him. It's not cruelty. It's certainty. He needs it more. He'll always need it more, because he's the one who can turn it into something.\n\nThe hunger recognises itself. Not the fruit — the appetite. The absolute conviction that growth requires taking. The thread sinks into him like roots into soil.`,

  sever: `She cut her family's sigil off her cloak three days ago. The threads are still ragged where it was. Nobody has mentioned it. Nobody dares. She walks through the market without the name that would have opened every door, and she walks taller for it.\n\nYou feel the ghost of your own severing. The moment the last obligation fell away and the power rushed in to fill the space. The thread finds her, and it tastes like freedom.`,

  kindle: `He's singing. Not well — his voice cracks on the high notes and he doesn't know all the words. But the children have stopped playing to listen, and the old woman by the well has closed her eyes. Something in the melody reaches past craft into something raw and true.\n\nYou feel the spark. Not in his voice — in the space between the notes, where something wants to exist that doesn't yet. The thread wraps around that empty space and holds it open.`,

  bind: `She's mediating a dispute between two families over a well. She's not taking sides — she's drawing a line in the dirt, showing where the water table runs, making both parties see the geometry of the situation. When one man raises his voice, she doesn't flinch. She just points at the line.\n\nYou see the architecture of obligation forming around her. She doesn't know she's building a covenant. You do. The thread settles into the structure she's creating, and it holds.`,

  wander: `He's packed his bag three times this week. Each time, he unpacks it. But this time he's left it by the door, and he keeps looking at it while he eats. The road outside the window is empty. It won't be for long.\n\nYou feel the pull. The same pull that dragged you across the boundary between mortal and divine — not toward something, but away from everything that insists you stay. The thread finds him at the threshold, and it whispers: go.`,
};
```

- [ ] **Step 2: Rewrite StepSpark as narrative beat**

Replace the current Step 3 content (trait picker, investment selector, essence cost display) with:

1. **Transition text:** *"The thread is woven. You see them now — not as they are, but as they will become."*
2. **Spark prose:** Display the `SPARK_PROSE[lens.hunger.id]` passage, enriched with the agent's name via string replacement.
3. **Art area:** Spark art for this Hunger (from `SPARK_ART` library, or gradient placeholder)
4. **Optional mortal echo:** If the lens has a mortalName and Drive resonance was high across the dilemmas, append: *"You had a name once. Before the hunger. Before the power."*
5. **Auto-advance:** After a reading pause (~3 seconds), show a "Continue" button. No trait selection. No essence cost display.

Behind the scenes: derive the god-given trait from the dilemma choice history + Hunger alignment (pick the trait whose reach matches the highest-scoring reach from accumulated choices). Deduct essence silently.

- [ ] **Step 3: Run tests and type check**

```bash
npm test -- --run && npx tsc --noEmit && npx vite build
```

- [ ] **Step 4: Commit**

```bash
git add src/data/spark-prose.ts src/components/Game/MeetingEncounterModal.tsx
git commit -m "feat(meeting): rewrite Step 3 as narrative recognition beat with per-Hunger prose"
```

---

### Task 10: UI Rewrite — Step 4 (The Name They'll Carry)

**Files:**
- Modify: `src/components/Game/MeetingEncounterModal.tsx`
- Create: `src/data/closing-vignettes.ts`

- [ ] **Step 1: Author closing vignettes**

Create `src/data/closing-vignettes.ts` with one closing passage per Hunger (10 total). Each is 2-3 sentences — the moment after the divine touch.

```typescript
import type { HungerId } from '../types/hunger';

export const CLOSING_VIGNETTES: Record<HungerId, string> = {
  gather: `She goes back to mending the net. But her hands move differently now — faster, surer, as if the knots have become simpler. She won't understand why for a long time. You will watch her until she does.`,
  witness: `He folds the leather scrap and tucks it into his belt. Tomorrow he'll start a new map, and this one will be right. He doesn't know how he knows. But the certainty sits in him like a stone in still water.`,
  preserve: `She wraps the shard in cloth and places it in her pack with a care that borders on reverence. Something has shifted. The things she holds will last longer now. Not because she's more careful, but because the world seems willing to wait for her.`,
  reshape: `He wipes the diagram from the dirt and draws it again. This time, it's perfect. The elder passing by pauses, frowns, and for the first time doesn't dismiss it. Something in the lines demands to be taken seriously.`,
  reclaim: `She rolls her sleeve down over the scar. But her posture has changed — straighter, as if an invisible weight has been redistributed rather than removed. She's not carrying less. She's carrying it better.`,
  consume: `He finishes the apple and tosses the core aside. But he's already looking at the next thing, and the next thing after that. The world has become a series of opportunities, and he can see all of them at once.`,
  sever: `She touches the ragged threads on her cloak where the sigil was. For a moment, they feel warm. Then the warmth passes, and she keeps walking. She's lighter than she's ever been. She doesn't look back.`,
  kindle: `He hums the melody again as he walks home. But this time, the notes come easier. The spaces between them feel deliberate instead of accidental. He doesn't know he's composing. He just knows the song isn't finished.`,
  bind: `She stands up from the dispute and brushes the dirt from her knees. Both families are nodding. The line she drew is still there, and it looks more permanent than it should. She files it away: this is how you solve things. With geometry and patience.`,
  wander: `He picks up the bag by the door. This time, he doesn't put it down. The road is still empty, but it feels different now — not lonely, but waiting. He steps through the doorway and doesn't close it behind him.`,
};
```

- [ ] **Step 2: Rewrite StepConfirmation**

Replace the current Step 4 with:

1. **Header:** *"They have a name. You've always known it."*
2. **Name display + input:** Generated name from culture pool. Text input to change.
3. **Two buttons:** *"You remember more"* (shape path) and *"Let the thread settle"* (surprise path). Shape path shows the name input; surprise accepts immediately.
4. **Closing vignette:** `CLOSING_VIGNETTES[lens.hunger.id]` enriched with agent name.
5. **Transition:** *"The world takes shape around your hunger. Somewhere below, your First looks up."*

Remove: stat display, detailed editing controls, cooperation strategy preview.

- [ ] **Step 3: Run tests, type check, and build**

```bash
npm test -- --run && npx tsc --noEmit && npx vite build
```

- [ ] **Step 4: Commit**

```bash
git add src/data/closing-vignettes.ts src/components/Game/MeetingEncounterModal.tsx
git commit -m "feat(meeting): rewrite Step 4 with per-Hunger closing vignettes and vignette-only presentation"
```

---

### Task 11: Wire Everything Together — Integration Pass

**Files:**
- Modify: `src/components/Game/GameView.tsx`
- Modify: `src/engine/meetingEncounter.ts`
- Modify: `src/engine/__tests__/meetingEncounter.test.ts`

- [ ] **Step 1: Update GameView to pass AscendantLens**

In `GameView.tsx`, import `buildStubAscendantLens` from `../../types/hunger`. In the section that renders `MeetingEncounterModal`, compute the lens and pass it:

```typescript
const ascendantLens = useMemo(
  () => buildStubAscendantLens(ascendantSphere, ascendantSecondSphere),
  [ascendantSphere, ascendantSecondSphere],
);
```

Pass `ascendantLens={ascendantLens}` to the modal.

- [ ] **Step 2: Update MeetingEncounterState to remove intent fields from required flow**

The state machine still stores `intentPrimaryReach`, `intentSecondaryReach`, `intentSphere` — these are now derived from the Hunger, not player-selected. Update `createMeetingEncounterState()` in `meetingEncounter.ts` to accept an `AscendantLens` parameter and auto-populate the intent fields from `deriveIntentFromHunger()`.

- [ ] **Step 3: Update buildMeetingResult to work without player-selected intent**

`buildMeetingResult()` reads intent fields from state. Ensure it gracefully handles the case where they were derived rather than player-selected. The `MeetingChoiceRecord` should still store the derived intent values.

- [ ] **Step 4: Update and add integration tests**

Update existing tests that test the full flow to use the new `AscendantLens` parameter. Add an integration test that runs the complete 4-step state machine with a stub lens:

```typescript
it('completes a full meeting encounter with AscendantLens', () => {
  const lens = buildStubAscendantLens('life', 'spirit');
  const state = createMeetingEncounterState('loc.1', 'asc.1', 10, lens);
  expect(state.intentPrimaryReach).toBeDefined();
  expect(state.currentStep).toBe('seeking_threads');
  // ... advance through all steps
});
```

- [ ] **Step 5: Run full test suite, type check, and build**

```bash
npm test -- --run && npx tsc --noEmit && npx vite build
```

- [ ] **Step 6: Commit**

```bash
git add src/components/Game/GameView.tsx src/engine/meetingEncounter.ts src/engine/__tests__/meetingEncounter.test.ts
git commit -m "feat(meeting): wire AscendantLens through full meeting encounter pipeline"
```

---

### Task 12: Proof of Concept — Gather Hunger End-to-End

**Files:**
- Modify: `src/data/meeting-dilemma-library.ts`
- Modify: `src/data/meeting-content.ts`

- [ ] **Step 1: Add resonance tags to 10+ Gather-aligned dilemmas**

In the imported dilemma library, find 10+ templates that align with the Gather Hunger (themes: belonging, protection, community, sacrifice, loyalty, shelter). Add resonance tags:

```typescript
resonance: {
  emotionalRegister: ['belonging', 'sacrifice'],
  hungerResonance: ['gather', 'preserve'],
  driveResonance: ['protection', 'community'],
  incompatibleWith: [],
},
```

- [ ] **Step 2: Add lens overlays to those same templates**

Add a `gather` lens overlay to each of the 10+ tagged templates:

```typescript
lensOverlays: [
  {
    hungerId: 'gather',
    perceptionProse: 'You feel the invisible threads of care — the weight someone carries for others without being asked.',
    echoThreshold: 2,
    echoProse: 'Something ancient stirs. You held this weight once, before it became hunger.',
  },
],
```

- [ ] **Step 3: Add 3-5 Gather-flavored candidate vignette templates**

In `meeting-content.ts`, add candidate vignette templates that work for the Gather Hunger across common location subtypes (village, town, city).

- [ ] **Step 4: Smoke test the full Gather experience**

Run the dev server. Start a new game with a sphere alignment that maps to the Gather Hunger (life primary). Navigate to a location, trigger Meet The First. Walk through all 4 steps and verify:
- Candidate vignettes show Gather-flavored prose
- Dilemmas selected are thematically resonant (belonging, protection)
- Lens overlay prose appears in dilemma setup
- Spark shows the Gather prose
- Closing vignette shows the Gather text
- Agent is created with thread edge at courtPosition='the_first'

- [ ] **Step 5: Run full test suite and build**

```bash
npm test -- --run && npx tsc --noEmit && npx vite build
```

- [ ] **Step 6: Commit**

```bash
git add src/data/meeting-dilemma-library.ts src/data/meeting-content.ts
git commit -m "feat(meeting): proof of concept — Gather Hunger end-to-end with resonance tags and lens overlays"
```

---

## Post-Implementation: Content Expansion Roadmap

After this plan completes, the architecture supports incremental content authoring:

| Workstream | What | Estimated Scope |
|-----------|------|----------------|
| Resonance tagging | Add resonance tags to remaining ~155 dilemmas | ~3 sessions |
| Lens overlay authoring | Add overlays per emotional register (~20-30) across all 10 Hungers | ~5 sessions |
| Candidate vignettes | Author ~50-80 templates across reach × location subtype | ~3 sessions |
| Art pipeline | Generate 60-82 abstract mood images (Threadbare aesthetic) | ~5 sessions |
| Remembrance Flow integration | Replace stub lens with real Remembrance Flow output | After Remembrance Flow ships |
