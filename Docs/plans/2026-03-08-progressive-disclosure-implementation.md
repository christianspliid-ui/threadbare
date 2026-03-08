# Progressive Disclosure Info System — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a three-tier progressive disclosure system (tooltip → sidebar card → full-screen modal) with knowledge fog of war gating information reveal based on familiarity scores.

**Architecture:** Familiarity stored as `Map<string, number>` on GameState. Five knowledge levels (Stranger→Transparent) gate what data is visible. All numeric stats converted to verbal descriptors via domain word scales. Generated flavor content (quotes, backstory, portrait prompts) produced by a profile generator. Existing AgentDetailPanel replaced by AgentInfoCard (Tier 2) + AgentProfileModal (Tier 3).

**Tech Stack:** React + TypeScript + Vitest. Existing world graph, tooltip system, narrative engine, archetype content.

**Design doc:** `Docs/plans/2026-03-08-progressive-disclosure-design.md`

---

### Task 1: Familiarity Types & Constants

**Files:**
- Create: `src/types/familiarity.ts`
- Test: `src/types/__tests__/familiarity.test.ts`

**Step 1: Write the failing test**

```typescript
// src/types/__tests__/familiarity.test.ts
import { describe, it, expect } from 'vitest';
import {
  KNOWLEDGE_LEVELS,
  FAMILIARITY_THRESHOLDS,
  FAMILIARITY_GAINS,
  SPHERE_FAMILIARITY_BONUSES,
  type KnowledgeLevel,
  type FamiliarityGainSource,
} from '../familiarity';

describe('familiarity types', () => {
  it('defines 5 knowledge levels in order', () => {
    expect(KNOWLEDGE_LEVELS).toEqual([
      'stranger', 'recognised', 'known', 'intimate', 'transparent',
    ]);
  });

  it('defines thresholds for each level', () => {
    expect(FAMILIARITY_THRESHOLDS.stranger).toBe(0.0);
    expect(FAMILIARITY_THRESHOLDS.recognised).toBe(0.2);
    expect(FAMILIARITY_THRESHOLDS.known).toBe(0.4);
    expect(FAMILIARITY_THRESHOLDS.intimate).toBe(0.6);
    expect(FAMILIARITY_THRESHOLDS.transparent).toBe(0.8);
  });

  it('defines gain amounts for each source', () => {
    expect(FAMILIARITY_GAINS.worship_tier_1).toBe(0.3);
    expect(FAMILIARITY_GAINS.worship_tier_2).toBe(0.5);
    expect(FAMILIARITY_GAINS.worship_tier_3).toBe(0.7);
    expect(FAMILIARITY_GAINS.proximity).toBe(0.01);
    expect(FAMILIARITY_GAINS.scry).toBe(0.15);
    expect(FAMILIARITY_GAINS.narrative_contact).toBe(0.05);
    expect(FAMILIARITY_GAINS.dilemma).toBe(0.10);
  });

  it('defines sphere bonuses', () => {
    expect(SPHERE_FAMILIARITY_BONUSES.eye.multiplier).toBe(1.5);
    expect(SPHERE_FAMILIARITY_BONUSES.shadow.revealTraitsEarly).toBe(1);
    expect(SPHERE_FAMILIARITY_BONUSES.heart.revealBondsEarly).toBe(1);
  });

  it('FamiliarityGainSource covers all sources', () => {
    const sources: FamiliarityGainSource[] = [
      'worship_tier_1', 'worship_tier_2', 'worship_tier_3',
      'proximity', 'scry', 'narrative_contact', 'dilemma',
    ];
    expect(sources.length).toBe(7);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/types/__tests__/familiarity.test.ts`
Expected: FAIL — module not found

**Step 3: Write implementation**

```typescript
// src/types/familiarity.ts
/**
 * Familiarity / Knowledge Fog of War type definitions.
 *
 * Familiarity measures how much the player's Ascendant knows about a
 * game object. Higher familiarity reveals more information across all
 * three disclosure tiers (tooltip → card → modal).
 */

// ─── Knowledge Levels ────────────────────────────────────────────

export type KnowledgeLevel =
  | 'stranger'
  | 'recognised'
  | 'known'
  | 'intimate'
  | 'transparent';

export const KNOWLEDGE_LEVELS: KnowledgeLevel[] = [
  'stranger', 'recognised', 'known', 'intimate', 'transparent',
];

/** Minimum familiarity (0.0–1.0) to reach each knowledge level. */
export const FAMILIARITY_THRESHOLDS: Record<KnowledgeLevel, number> = {
  stranger: 0.0,
  recognised: 0.2,
  known: 0.4,
  intimate: 0.6,
  transparent: 0.8,
};

// ─── Familiarity Gain Sources ────────────────────────────────────

export type FamiliarityGainSource =
  | 'worship_tier_1'
  | 'worship_tier_2'
  | 'worship_tier_3'
  | 'proximity'
  | 'scry'
  | 'narrative_contact'
  | 'dilemma';

export const FAMILIARITY_GAINS: Record<FamiliarityGainSource, number> = {
  worship_tier_1: 0.3,
  worship_tier_2: 0.5,
  worship_tier_3: 0.7,
  proximity: 0.01,
  scry: 0.15,
  narrative_contact: 0.05,
  dilemma: 0.10,
};

// ─── Sphere Bonuses ──────────────────────────────────────────────

export interface SphereFamiliarityBonus {
  /** Multiplier on all familiarity gains (Eye sphere = 1.5x). */
  multiplier?: number;
  /** Reveal traits N levels earlier (Shadow sphere). */
  revealTraitsEarly?: number;
  /** Reveal bonds N levels earlier (Heart sphere). */
  revealBondsEarly?: number;
}

export const SPHERE_FAMILIARITY_BONUSES: Record<string, SphereFamiliarityBonus> = {
  eye: { multiplier: 1.5 },
  shadow: { revealTraitsEarly: 1 },
  heart: { revealBondsEarly: 1 },
};

// ─── Familiarity Map Type ────────────────────────────────────────

/** Maps object IDs to familiarity scores (0.0–1.0). */
export type FamiliarityMap = Map<string, number>;
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/types/__tests__/familiarity.test.ts`
Expected: PASS (all 5 tests)

**Step 5: Commit**

```bash
git add src/types/familiarity.ts src/types/__tests__/familiarity.test.ts
git commit -m "feat: familiarity types and constants for knowledge fog of war"
```

---

### Task 2: Domain Word Scales Content Package

**Files:**
- Create: `src/data/domain-words.ts`
- Test: `src/data/__tests__/domain-words.test.ts`

**Step 1: Write the failing test**

```typescript
// src/data/__tests__/domain-words.test.ts
import { describe, it, expect } from 'vitest';
import {
  DOMAIN_WORD_SCALES,
  getDomainWord,
  getValueWord,
  getReputationWord,
  getBondStrengthWord,
  VALUE_WORD_MAP,
  REPUTATION_WORDS,
  BOND_STRENGTH_WORDS,
} from '../domain-words';

describe('domain word scales', () => {
  it('defines 5-tier scales for all 9 reaches', () => {
    const reaches = ['iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star', 'flesh'];
    for (const reach of reaches) {
      const scale = DOMAIN_WORD_SCALES[reach];
      expect(scale).toHaveLength(5);
      for (const word of scale) {
        expect(typeof word).toBe('string');
        expect(word.length).toBeGreaterThan(0);
      }
    }
  });

  it('getDomainWord returns correct tier for numeric values', () => {
    expect(getDomainWord('iron', 0)).toBe('Meek');
    expect(getDomainWord('iron', 1.5)).toBe('Meek');
    expect(getDomainWord('iron', 3)).toBe('Trained');
    expect(getDomainWord('iron', 5)).toBe('Formidable');
    expect(getDomainWord('iron', 7)).toBe('Fearsome');
    expect(getDomainWord('iron', 9)).toBe('Legendary');
    expect(getDomainWord('iron', 10)).toBe('Legendary');
  });

  it('getDomainWord works for all reaches', () => {
    expect(getDomainWord('gold', 5)).toBe('Shrewd');
    expect(getDomainWord('shadow', 7)).toBe('Unseen');
    expect(getDomainWord('veil', 9)).toBe('Transcendent');
    expect(getDomainWord('heart', 3)).toBe('Tolerated');
    expect(getDomainWord('eye', 7)).toBe('Seer');
    expect(getDomainWord('stone', 5)).toBe('Skilled');
    expect(getDomainWord('star', 3)).toBe('Guided');
    expect(getDomainWord('flesh', 9)).toBe('Undying');
  });

  it('getValueWord returns intensified value labels', () => {
    expect(getValueWord('ambition_contentment', 0.9)).toBe('Deeply Ambitious');
    expect(getValueWord('ambition_contentment', -0.6)).toBe('Content');
    expect(getValueWord('courage_prudence', 0.4)).toBe('Somewhat Courageous');
    expect(getValueWord('cruelty_compassion', -0.9)).toBe('Deeply Compassionate');
  });

  it('getReputationWord returns verbal reputation', () => {
    expect(getReputationWord(0.1)).toBe('Distrusted');
    expect(getReputationWord(0.3)).toBe('Unknown');
    expect(getReputationWord(0.5)).toBe('Accepted');
    expect(getReputationWord(0.7)).toBe('Respected');
    expect(getReputationWord(0.9)).toBe('Revered');
  });

  it('getBondStrengthWord returns verbal bond strength', () => {
    expect(getBondStrengthWord(0.1)).toBe('Fragile');
    expect(getBondStrengthWord(0.3)).toBe('Growing');
    expect(getBondStrengthWord(0.5)).toBe('Strong');
    expect(getBondStrengthWord(0.7)).toBe('Deep');
    expect(getBondStrengthWord(0.9)).toBe('Unbreakable');
  });

  it('all domain words are unique within their scale', () => {
    for (const [, scale] of Object.entries(DOMAIN_WORD_SCALES)) {
      const unique = new Set(scale);
      expect(unique.size).toBe(scale.length);
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/__tests__/domain-words.test.ts`
Expected: FAIL — module not found

**Step 3: Write implementation**

```typescript
// src/data/domain-words.ts
/**
 * Domain Word Scales — verbal descriptors for all numeric stats.
 *
 * Follows the Architecture of Fate spec §3.1: every stat has a unique
 * 5-tier word vocabulary. No numbers in the UI — only flavored words.
 *
 * Source: Docs/plans/2026-03-08-progressive-disclosure-design.md
 */

import type { ReachDomain } from '../types/traits';
import type { ValuePair } from '../types/agent';

// ─── Nine Reaches — 5-Tier Word Scales ──────────────────────────

/** [Tier1 (0-2), Tier2 (2-4), Tier3 (4-6), Tier4 (6-8), Tier5 (8-10)] */
export const DOMAIN_WORD_SCALES: Record<ReachDomain, [string, string, string, string, string]> = {
  iron:   ['Meek',     'Trained',    'Formidable',  'Fearsome',    'Legendary'],
  gold:   ['Naive',    'Bartering',  'Shrewd',      'Masterful',   'Magnate'],
  shadow: ['Exposed',  'Cautious',   'Subtle',      'Unseen',      'Phantom'],
  veil:   ['Blind',    'Sensitive',  'Attuned',     'Channeler',   'Transcendent'],
  heart:  ['Shunned',  'Tolerated',  'Liked',       'Beloved',     'Revered'],
  eye:    ['Oblivious','Observant',  'Perceptive',  'Seer',        'Oracle'],
  stone:  ['Clumsy',   'Handy',      'Skilled',     'Masterwork',  'Monumental'],
  star:   ['Lost',     'Guided',     'Fated',       'Destined',    'Cosmic'],
  flesh:  ['Frail',    'Hardy',      'Resilient',   'Enduring',    'Undying'],
};

/** Convert numeric domain value (0-10) to verbal descriptor. */
export function getDomainWord(domain: ReachDomain, value: number): string {
  const scale = DOMAIN_WORD_SCALES[domain];
  const clamped = Math.max(0, Math.min(10, value));
  const tier = Math.min(4, Math.floor(clamped / 2));
  return scale[tier];
}

// ─── Axiological Values — Word Map ──────────────────────────────

export const VALUE_WORD_MAP: Record<ValuePair, [string, string]> = {
  ambition_contentment: ['Ambitious', 'Content'],
  courage_prudence: ['Courageous', 'Prudent'],
  cruelty_compassion: ['Cruel', 'Compassionate'],
  cunning_honesty: ['Cunning', 'Honest'],
  devotion_independence: ['Devoted', 'Independent'],
  loyalty_treachery: ['Loyal', 'Treacherous'],
  tradition_innovation: ['Traditional', 'Innovative'],
  dominance_humility: ['Dominant', 'Humble'],
  wrath_patience: ['Wrathful', 'Patient'],
  greed_generosity: ['Greedy', 'Generous'],
};

/** Convert axiological value (-1 to +1) to verbal descriptor with intensity. */
export function getValueWord(pair: ValuePair, value: number): string {
  const [positive, negative] = VALUE_WORD_MAP[pair];
  const absVal = Math.abs(value);
  const prefix = absVal >= 0.8 ? 'Deeply ' : absVal >= 0.5 ? '' : 'Somewhat ';
  return value >= 0 ? `${prefix}${positive}` : `${prefix}${negative}`;
}

// ─── Reputation — Verbal Tiers ──────────────────────────────────

export const REPUTATION_WORDS: [string, string, string, string, string] =
  ['Distrusted', 'Unknown', 'Accepted', 'Respected', 'Revered'];

/** Convert reputation score (0-1) to verbal descriptor. */
export function getReputationWord(value: number): string {
  const clamped = Math.max(0, Math.min(1, value));
  const tier = Math.min(4, Math.floor(clamped * 5));
  return REPUTATION_WORDS[tier];
}

// ─── Bond Strength — Verbal Tiers ───────────────────────────────

export const BOND_STRENGTH_WORDS: [string, string, string, string, string] =
  ['Fragile', 'Growing', 'Strong', 'Deep', 'Unbreakable'];

/** Convert bond strength (0-1) to verbal descriptor. */
export function getBondStrengthWord(value: number): string {
  const clamped = Math.max(0, Math.min(1, value));
  const tier = Math.min(4, Math.floor(clamped * 5));
  return BOND_STRENGTH_WORDS[tier];
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/data/__tests__/domain-words.test.ts`
Expected: PASS (all 7 tests)

**Step 5: Commit**

```bash
git add src/data/domain-words.ts src/data/__tests__/domain-words.test.ts
git commit -m "feat: domain word scales — verbal descriptors for all 9 reaches + values/reputation/bonds"
```

---

### Task 3: Familiarity Engine

**Files:**
- Create: `src/engine/familiarity.ts`
- Test: `src/engine/__tests__/familiarity.test.ts`

**Step 1: Write the failing test**

```typescript
// src/engine/__tests__/familiarity.test.ts
import { describe, it, expect } from 'vitest';
import {
  getFamiliarity,
  addFamiliarity,
  getKnowledgeLevel,
  checkThresholdCrossed,
  getEffectiveKnowledgeLevel,
} from '../familiarity';
import type { KnowledgeLevel, FamiliarityMap } from '../../types/familiarity';

describe('familiarity engine', () => {
  describe('getFamiliarity', () => {
    it('returns 0 for unknown objects', () => {
      const map: FamiliarityMap = new Map();
      expect(getFamiliarity(map, 'unknown-id')).toBe(0);
    });

    it('returns stored value for known objects', () => {
      const map: FamiliarityMap = new Map([['agent-1', 0.45]]);
      expect(getFamiliarity(map, 'agent-1')).toBe(0.45);
    });
  });

  describe('addFamiliarity', () => {
    it('adds to existing familiarity', () => {
      const map: FamiliarityMap = new Map([['agent-1', 0.3]]);
      const result = addFamiliarity(map, 'agent-1', 0.15);
      expect(result.get('agent-1')).toBeCloseTo(0.45);
    });

    it('creates entry for new objects', () => {
      const map: FamiliarityMap = new Map();
      const result = addFamiliarity(map, 'agent-1', 0.3);
      expect(result.get('agent-1')).toBe(0.3);
    });

    it('clamps to 1.0', () => {
      const map: FamiliarityMap = new Map([['agent-1', 0.9]]);
      const result = addFamiliarity(map, 'agent-1', 0.5);
      expect(result.get('agent-1')).toBe(1.0);
    });

    it('applies sphere multiplier', () => {
      const map: FamiliarityMap = new Map();
      const result = addFamiliarity(map, 'agent-1', 0.1, 1.5);
      expect(result.get('agent-1')).toBeCloseTo(0.15);
    });

    it('does not mutate original map', () => {
      const map: FamiliarityMap = new Map([['agent-1', 0.3]]);
      addFamiliarity(map, 'agent-1', 0.15);
      expect(map.get('agent-1')).toBe(0.3);
    });
  });

  describe('getKnowledgeLevel', () => {
    it('returns stranger for 0.0', () => {
      expect(getKnowledgeLevel(0.0)).toBe('stranger');
    });

    it('returns recognised for 0.2', () => {
      expect(getKnowledgeLevel(0.2)).toBe('recognised');
    });

    it('returns known for 0.4', () => {
      expect(getKnowledgeLevel(0.4)).toBe('known');
    });

    it('returns intimate for 0.6', () => {
      expect(getKnowledgeLevel(0.6)).toBe('intimate');
    });

    it('returns transparent for 0.8', () => {
      expect(getKnowledgeLevel(0.8)).toBe('transparent');
    });

    it('returns correct level for in-between values', () => {
      expect(getKnowledgeLevel(0.19)).toBe('stranger');
      expect(getKnowledgeLevel(0.39)).toBe('recognised');
      expect(getKnowledgeLevel(0.59)).toBe('known');
      expect(getKnowledgeLevel(0.79)).toBe('intimate');
      expect(getKnowledgeLevel(1.0)).toBe('transparent');
    });
  });

  describe('checkThresholdCrossed', () => {
    it('returns new level when threshold crossed', () => {
      expect(checkThresholdCrossed(0.15, 0.25)).toBe('recognised');
    });

    it('returns null when no threshold crossed', () => {
      expect(checkThresholdCrossed(0.21, 0.35)).toBeNull();
    });

    it('returns highest level when multiple crossed', () => {
      expect(checkThresholdCrossed(0.1, 0.5)).toBe('known');
    });
  });

  describe('getEffectiveKnowledgeLevel', () => {
    it('returns base level with no sphere bonus', () => {
      expect(getEffectiveKnowledgeLevel('known', undefined)).toBe('known');
    });

    it('sphere bonus does not change base level', () => {
      // Sphere bonuses affect specific content, not the overall level
      expect(getEffectiveKnowledgeLevel('known', 'eye')).toBe('known');
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/familiarity.test.ts`
Expected: FAIL — module not found

**Step 3: Write implementation**

```typescript
// src/engine/familiarity.ts
/**
 * Familiarity Engine — Knowledge Fog of War.
 *
 * Tracks how much the player knows about each game object.
 * Pure functions operating on FamiliarityMap (immutable updates).
 */

import {
  KNOWLEDGE_LEVELS,
  FAMILIARITY_THRESHOLDS,
  type KnowledgeLevel,
  type FamiliarityMap,
} from '../types/familiarity';

/** Get familiarity score for an object. Returns 0 if unknown. */
export function getFamiliarity(map: FamiliarityMap, objectId: string): number {
  return map.get(objectId) ?? 0;
}

/**
 * Add familiarity for an object. Returns new map (immutable).
 * @param multiplier Optional sphere multiplier (Eye = 1.5x)
 */
export function addFamiliarity(
  map: FamiliarityMap,
  objectId: string,
  amount: number,
  multiplier: number = 1.0,
): FamiliarityMap {
  const current = map.get(objectId) ?? 0;
  const newVal = Math.min(1.0, current + amount * multiplier);
  const newMap = new Map(map);
  newMap.set(objectId, newVal);
  return newMap;
}

/** Derive knowledge level from familiarity score. */
export function getKnowledgeLevel(familiarity: number): KnowledgeLevel {
  // Walk thresholds in reverse to find highest qualifying level
  for (let i = KNOWLEDGE_LEVELS.length - 1; i >= 0; i--) {
    if (familiarity >= FAMILIARITY_THRESHOLDS[KNOWLEDGE_LEVELS[i]]) {
      return KNOWLEDGE_LEVELS[i];
    }
  }
  return 'stranger';
}

/**
 * Check if a familiarity change crossed a threshold.
 * Returns the new knowledge level if crossed, null if not.
 */
export function checkThresholdCrossed(
  oldFamiliarity: number,
  newFamiliarity: number,
): KnowledgeLevel | null {
  const oldLevel = getKnowledgeLevel(oldFamiliarity);
  const newLevel = getKnowledgeLevel(newFamiliarity);
  if (oldLevel !== newLevel) return newLevel;
  return null;
}

/**
 * Get effective knowledge level considering sphere bonuses.
 * Sphere bonuses affect specific content categories (traits, bonds),
 * not the overall knowledge level — so this returns the base level.
 * Use SPHERE_FAMILIARITY_BONUSES directly for per-category overrides.
 */
export function getEffectiveKnowledgeLevel(
  baseLevel: KnowledgeLevel,
  _primarySphere: string | undefined,
): KnowledgeLevel {
  return baseLevel;
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/familiarity.test.ts`
Expected: PASS (all 16 tests)

**Step 5: Commit**

```bash
git add src/engine/familiarity.ts src/engine/__tests__/familiarity.test.ts
git commit -m "feat: familiarity engine — get, add, threshold detection, knowledge level derivation"
```

---

### Task 4: Profile Generator

**Files:**
- Create: `src/engine/profileGenerator.ts`
- Test: `src/engine/__tests__/profileGenerator.test.ts`

**Step 1: Write the failing test**

```typescript
// src/engine/__tests__/profileGenerator.test.ts
import { describe, it, expect } from 'vitest';
import {
  generateQuotes,
  generateBackstory,
  generatePortraitPrompt,
  type AgentGeneratedContent,
} from '../profileGenerator';

// Simple seeded PRNG for deterministic tests
function testPrng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('profileGenerator', () => {
  describe('generateQuotes', () => {
    it('returns 2-3 quotes', () => {
      const prng = testPrng(42);
      const quotes = generateQuotes({
        archetypeId: 'tragic_hero',
        dominantValues: ['Deeply Ambitious', 'Courageous'],
        primarySphere: 'force',
        name: 'Kael',
      }, prng);
      expect(quotes.length).toBeGreaterThanOrEqual(2);
      expect(quotes.length).toBeLessThanOrEqual(3);
      for (const q of quotes) {
        expect(typeof q).toBe('string');
        expect(q.length).toBeGreaterThan(10);
      }
    });

    it('produces deterministic output with same seed', () => {
      const params = {
        archetypeId: 'tragic_hero',
        dominantValues: ['Deeply Ambitious'],
        primarySphere: 'force',
        name: 'Kael',
      };
      const q1 = generateQuotes(params, testPrng(42));
      const q2 = generateQuotes(params, testPrng(42));
      expect(q1).toEqual(q2);
    });

    it('produces different output with different seeds', () => {
      const params = {
        archetypeId: 'tragic_hero',
        dominantValues: ['Deeply Ambitious'],
        primarySphere: 'force',
        name: 'Kael',
      };
      const q1 = generateQuotes(params, testPrng(42));
      const q2 = generateQuotes(params, testPrng(99));
      expect(q1).not.toEqual(q2);
    });
  });

  describe('generateBackstory', () => {
    it('returns 2-3 paragraph backstory string', () => {
      const prng = testPrng(42);
      const story = generateBackstory({
        archetypeId: 'tragic_hero',
        cultureName: 'The Thornwall',
        traitNames: ['Fearless', 'Proud'],
        bondNames: ['Mirael', 'Dren'],
        name: 'Kael',
        primarySphere: 'force',
      }, prng);
      expect(typeof story).toBe('string');
      expect(story.length).toBeGreaterThan(100);
      // Should contain agent name
      expect(story).toContain('Kael');
    });

    it('is deterministic', () => {
      const params = {
        archetypeId: 'tragic_hero',
        cultureName: 'The Thornwall',
        traitNames: ['Fearless'],
        bondNames: ['Mirael'],
        name: 'Kael',
        primarySphere: 'force',
      };
      const s1 = generateBackstory(params, testPrng(42));
      const s2 = generateBackstory(params, testPrng(42));
      expect(s1).toBe(s2);
    });
  });

  describe('generatePortraitPrompt', () => {
    it('returns a prompt string referencing archetype and sphere', () => {
      const prompt = generatePortraitPrompt({
        archetypeId: 'tragic_hero',
        cultureName: 'The Thornwall',
        primarySphere: 'force',
        name: 'Kael',
      });
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(20);
    });
  });
});
```

**Step 2:** Run test → FAIL

**Step 3: Write implementation**

The profile generator uses template-based generation with seeded PRNG selection from content pools. This is hybrid-layer generation (template → enhanced) from the content strategy — no LLM calls.

```typescript
// src/engine/profileGenerator.ts
/**
 * Profile Generator — generates quotes, backstory, and portrait prompts
 * for agents using template-based generation with seeded PRNG.
 *
 * This is the hybrid layer (template → enhanced) from the content strategy.
 * No LLM calls — all generation uses content pools + PRNG selection.
 */

import { getArchetype } from '../data/archetype-content';
import { SPHERE_VOCABULARY } from '../data/narrative-content';
import type { SphereName } from '../types/index';

// ─── Types ───────────────────────────────────────────────────────

export interface AgentGeneratedContent {
  quotes: string[];
  backstory: string;
  portraitPrompt: string;
}

interface QuoteParams {
  archetypeId: string;
  dominantValues: string[];
  primarySphere: string;
  name: string;
}

interface BackstoryParams {
  archetypeId: string;
  cultureName: string;
  traitNames: string[];
  bondNames: string[];
  name: string;
  primarySphere: string;
}

interface PortraitParams {
  archetypeId: string;
  cultureName: string;
  primarySphere: string;
  name: string;
}

// ─── Quote Templates ─────────────────────────────────────────────

const QUOTE_TEMPLATES = [
  // Ambition / power
  '{name} once said: "Power is not taken — it is woven, thread by thread, from the silence between words."',
  '"The {sphere} teaches patience," {name} was known to say. "Even the longest night ends."',
  '"I did not choose this path," {name} once confessed. "The path chose me, and I was too {value} to refuse."',
  '"Let them call me {value}. Better that than forgotten."',
  '"In the {sphere}, I found what others seek in temples — a truth that does not flinch."',
  '"They will remember what I built, not what I destroyed."',
  '"Do not mistake my silence for weakness. I am simply deciding."',
  '"The threads of fate are thinner than you think. Pull too hard and they snap."',
  '"I have seen what lies beyond the veil. It is not darkness — it is patience."',
  '"Every bond I forge is a thread in the great weave. Every betrayal, a thread cut."',
  '"What is a kingdom but a story that enough people believe?"',
  '"The {sphere} does not care for your ambitions. But it rewards those who listen."',
];

const SPHERE_FLAVOR: Record<string, string> = {
  force: 'clash of arms',
  matter: 'weight of stone',
  energy: 'crackling light',
  life: 'pulse of growing things',
  mind: 'whisper of thought',
  spirit: 'echo of the divine',
  time: 'slow turn of ages',
  entropy: 'quiet unraveling',
  chaos: 'wild surge',
  order: 'perfect symmetry',
  light: 'radiance',
  darkness: 'deep shadow',
};

// ─── Backstory Templates ─────────────────────────────────────────

const ORIGIN_TEMPLATES = [
  '{name} was born among the {culture}, in a time when the world still remembered what it had lost.',
  'The {culture} tell stories of {name} — how even as a child, the threads of {sphere} clung to them.',
  'No one remembers when {name} first appeared among the {culture}. Some say they were always there, waiting.',
  'Before {name} earned their name, they were simply another soul of the {culture}, shaped by the land and its demands.',
];

const MIDDLE_TEMPLATES = [
  'Those who knew {name} spoke of their {trait} nature — a quality that set them apart from their peers. Their bond with {bond} defined much of what came next.',
  'It was {name}\'s {trait} character that first drew attention, and their connection to {bond} that sealed their fate.',
  'The {sphere} marked {name} early. Their {trait} ways made them both feared and admired, and {bond} became the axis around which their story turned.',
];

const CLOSING_TEMPLATES = [
  'Now {name} stands at a crossroads, their choices rippling through the weave of the world.',
  'What {name} will become is not yet written. But the threads are gathering, and the pattern grows clearer with each passing day.',
  'The world watches {name}, though it does not yet know why. The threads know. They always do.',
];

// ─── Quote Generation ────────────────────────────────────────────

function pick<T>(arr: T[], prng: () => number): T {
  return arr[Math.floor(prng() * arr.length)];
}

export function generateQuotes(params: QuoteParams, prng: () => number): string[] {
  const count = prng() < 0.5 ? 2 : 3;
  const sphereWord = SPHERE_FLAVOR[params.primarySphere] ?? params.primarySphere;
  const valueWord = params.dominantValues[0] ?? 'determined';

  // Shuffle templates via Fisher-Yates using PRNG
  const shuffled = [...QUOTE_TEMPLATES];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count).map(template =>
    template
      .replace(/\{name\}/g, params.name)
      .replace(/\{sphere\}/g, sphereWord)
      .replace(/\{value\}/g, valueWord.toLowerCase())
  );
}

// ─── Backstory Generation ────────────────────────────────────────

export function generateBackstory(params: BackstoryParams, prng: () => number): string {
  const sphereWord = SPHERE_FLAVOR[params.primarySphere] ?? params.primarySphere;
  const trait = params.traitNames[0] ?? 'resolute';
  const bond = params.bondNames[0] ?? 'those they trusted';

  const origin = pick(ORIGIN_TEMPLATES, prng);
  const middle = pick(MIDDLE_TEMPLATES, prng);
  const closing = pick(CLOSING_TEMPLATES, prng);

  const replacer = (text: string) =>
    text
      .replace(/\{name\}/g, params.name)
      .replace(/\{culture\}/g, params.cultureName)
      .replace(/\{sphere\}/g, sphereWord)
      .replace(/\{trait\}/g, trait.toLowerCase())
      .replace(/\{bond\}/g, bond);

  return [replacer(origin), replacer(middle), replacer(closing)].join('\n\n');
}

// ─── Portrait Prompt Generation ──────────────────────────────────

export function generatePortraitPrompt(params: PortraitParams): string {
  const archetype = getArchetype(params.archetypeId);
  const archetypeName = archetype?.name ?? 'mysterious figure';
  const sphereWord = SPHERE_FLAVOR[params.primarySphere] ?? params.primarySphere;

  return `Dark fantasy portrait, Threadbare style. A ${archetypeName.toLowerCase()} of the ${params.cultureName}. Sphere-colored thread accents in ${sphereWord} tones. Dark background, dramatic lighting from below. Painterly, muted palette with concentrated magical highlights.`;
}
```

**Step 4:** Run test → PASS

**Step 5: Commit**

```bash
git add src/engine/profileGenerator.ts src/engine/__tests__/profileGenerator.test.ts
git commit -m "feat: profile generator — quotes, backstory, portrait prompts from templates + PRNG"
```

---

### Task 5: Gated Agent Detail Aggregators

**Files:**
- Modify: `src/engine/agentDetail.ts`
- Test: `src/engine/__tests__/agentDetail.test.ts` (extend)

This task adds `getAgentInfoCard()` (Tier 2) and `getAgentFullProfile()` (Tier 3) functions that return familiarity-gated data. The existing `getAgentDetail()` is preserved for internal engine use.

**Step 1: Write failing tests**

Add to `src/engine/__tests__/agentDetail.test.ts`:

```typescript
describe('getAgentInfoCard (familiarity-gated)', () => {
  it('at stranger level: returns only name, location, sphere', () => {
    // ... build test graph with agent
    const card = getAgentInfoCard(graph, agentId, ascendantId, 'stranger');
    expect(card).not.toBeNull();
    expect(card!.name).toBeTruthy();
    expect(card!.domains).toBeUndefined(); // gated
    expect(card!.topValues).toBeUndefined(); // gated
    expect(card!.topBonds).toBeUndefined(); // gated
  });

  it('at known level: returns top 3 domains + values + key bonds', () => {
    const card = getAgentInfoCard(graph, agentId, ascendantId, 'known');
    expect(card!.domains).toHaveLength(3);
    expect(card!.topValues).toBeTruthy();
    expect(card!.topBonds).toBeTruthy();
  });
});

describe('getAgentFullProfile (familiarity-gated)', () => {
  it('at intimate level: includes quotes + backstory paragraph 1', () => {
    const profile = getAgentFullProfile(graph, agentId, ascendantId, 'intimate');
    expect(profile!.quotes).toBeTruthy();
    expect(profile!.backstoryParagraph1).toBeTruthy();
    expect(profile!.fullBackstory).toBeUndefined(); // not until transparent
  });

  it('at transparent level: includes full backstory + history', () => {
    const profile = getAgentFullProfile(graph, agentId, ascendantId, 'transparent');
    expect(profile!.fullBackstory).toBeTruthy();
    expect(profile!.historyTimeline).toBeTruthy();
  });
});
```

**Step 2:** Run → FAIL

**Step 3:** Implement `getAgentInfoCard` and `getAgentFullProfile` in `agentDetail.ts`, importing `KnowledgeLevel` and gating fields per the design doc's knowledge level table. Use `getDomainWord` for verbal domain descriptors. Return `undefined` for gated fields.

**Step 4:** Run → PASS

**Step 5: Commit**

```bash
git add src/engine/agentDetail.ts src/engine/__tests__/agentDetail.test.ts
git commit -m "feat: gated agent detail aggregators — InfoCard + FullProfile with knowledge level filtering"
```

---

### Task 6: Familiarity Integration in GameState & Orchestrator

**Files:**
- Modify: `src/engine/gameInit.ts` — add `familiarityMap` to initial GameState
- Modify: `src/engine/orchestrator.ts` — wire familiarity gains into tick phases
- Test: `src/engine/__tests__/familiarity-integration.test.ts` (CREATE)

**Step 1: Write failing integration test**

```typescript
describe('familiarity integration', () => {
  it('initial worshippers start at recognised (0.3)', () => {
    const state = initializeGameState();
    // Find a worshipper
    const worshippers = state.graph.getEdgesOfType('worships');
    expect(worshippers.length).toBeGreaterThan(0);
    const worshipperId = worshippers[0].source;
    expect(state.familiarityMap.get(worshipperId)).toBe(0.3);
  });

  it('proximity tick increases familiarity for agents in avatar hex', () => {
    // ... setup state with avatar and agent in same hex, run 1 tick
    // ... expect familiarity increased by ~0.01
  });

  it('familiarity gain emits trace', () => {
    // ... verify familiarity_change trace entry exists after gain
  });
});
```

**Step 2:** Run → FAIL

**Step 3:**
- In `gameInit.ts`: Add `familiarityMap: new Map<string, number>()` to initial GameState, then populate initial worshipper familiarity after worshipper seeding.
- In `orchestrator.ts`: Add `phaseFamiliarityGain` after existing phases. Proximity check: iterate agents in avatar hex, add +0.01. Emit `familiarity_change` trace.
- In `types/trace.ts`: Add `familiarity_change` to TraceEntry union.

**Step 4:** Run → PASS

**Step 5: Commit**

```bash
git add src/engine/gameInit.ts src/engine/orchestrator.ts src/types/trace.ts src/engine/__tests__/familiarity-integration.test.ts
git commit -m "feat: familiarity in GameState — init with worship tiers, proximity gain in tick, trace emission"
```

---

### Task 7: AgentInfoCard Component (Tier 2)

**Files:**
- Create: `src/components/Game/AgentInfoCard.tsx`
- Test: `src/components/Game/__tests__/AgentInfoCard.test.tsx`

This replaces AgentDetailPanel in the right sidebar. Compact card with familiarity-gated content. Shows verbal stats, no numbers.

**Step 1: Write failing test**

```typescript
describe('AgentInfoCard', () => {
  it('renders agent name at all knowledge levels', () => {
    render(<AgentInfoCard card={strangerCard} onViewProfile={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('Kael')).toBeInTheDocument();
  });

  it('shows ??? for hidden domains at stranger level', () => {
    render(<AgentInfoCard card={strangerCard} onViewProfile={vi.fn()} onBack={vi.fn()} />);
    expect(screen.queryByText('Fearsome')).not.toBeInTheDocument();
  });

  it('shows domain words at known level', () => {
    render(<AgentInfoCard card={knownCard} onViewProfile={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('Fearsome in Iron')).toBeInTheDocument();
  });

  it('shows View Profile button', () => {
    render(<AgentInfoCard card={knownCard} onViewProfile={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByRole('button', { name: /view profile/i })).toBeInTheDocument();
  });

  it('shows knowledge level indicator', () => {
    render(<AgentInfoCard card={knownCard} onViewProfile={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('Known')).toBeInTheDocument();
  });
});
```

**Step 2:** Run → FAIL

**Step 3:** Build the AgentInfoCard component with Threadbare styling. Sections conditionally rendered based on `card.knowledgeLevel`. Hidden domains show as "??? in Iron" (muted color). "View Profile" button at bottom opens Tier 3.

**Step 4:** Run → PASS

**Step 5: Commit**

```bash
git add src/components/Game/AgentInfoCard.tsx src/components/Game/__tests__/AgentInfoCard.test.tsx
git commit -m "feat: AgentInfoCard component — Tier 2 sidebar card with familiarity gating"
```

---

### Task 8: AgentProfileModal Component (Tier 3)

**Files:**
- Create: `src/components/Game/AgentProfileModal.tsx`
- Test: `src/components/Game/__tests__/AgentProfileModal.test.tsx`

Full-screen modal with all sections from the design: header zone (portrait placeholder, name, archetype, faction/culture), quotes, nature, prowess, bonds, traits, backstory, history, disposition. All sections familiarity-gated.

**Step 1: Write failing test**

```typescript
describe('AgentProfileModal', () => {
  it('renders as full-screen overlay', () => {
    render(<AgentProfileModal profile={fullProfile} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows portrait placeholder at stranger level', () => {
    render(<AgentProfileModal profile={strangerProfile} onClose={vi.fn()} />);
    expect(screen.getByTestId('portrait-silhouette')).toBeInTheDocument();
  });

  it('shows quotes section at known level', () => {
    render(<AgentProfileModal profile={knownProfile} onClose={vi.fn()} />);
    expect(screen.getByText(/once said/i)).toBeInTheDocument();
  });

  it('shows backstory at intimate level', () => {
    render(<AgentProfileModal profile={intimateProfile} onClose={vi.fn()} />);
    expect(screen.getByText(/was born among/i)).toBeInTheDocument();
  });

  it('shows all 9 domain words at intimate level', () => {
    render(<AgentProfileModal profile={intimateProfile} onClose={vi.fn()} />);
    expect(screen.getByText('Fearsome in Iron')).toBeInTheDocument();
    // all 9 domains visible
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    render(<AgentProfileModal profile={fullProfile} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('uses verbal descriptors — no raw numbers anywhere', () => {
    const { container } = render(<AgentProfileModal profile={fullProfile} onClose={vi.fn()} />);
    // Verify no numeric stat display (check for decimal patterns)
    const text = container.textContent ?? '';
    expect(text).not.toMatch(/\b\d+\.\d+\b/); // no "7.2" style numbers
  });
});
```

**Step 2:** Run → FAIL

**Step 3:** Build the modal with all sections per design doc. Single scroll layout. Portrait area shows dark silhouette (CSS gradient) at stranger, placeholder at recognised+. Quotes styled as pull-quotes with sphere accent. Nine Reaches shown as flowing verbal descriptors. Bonds as narrative phrases. Backstory as paragraphs. History as timeline list.

**Step 4:** Run → PASS

**Step 5: Commit**

```bash
git add src/components/Game/AgentProfileModal.tsx src/components/Game/__tests__/AgentProfileModal.test.tsx
git commit -m "feat: AgentProfileModal — Tier 3 full-screen modal with generated flavor + familiarity gating"
```

---

### Task 9: GameView Wiring — Replace AgentDetailPanel

**Files:**
- Modify: `src/components/Game/GameView.tsx`
- Modify: `src/components/Game/hooks/useAgentInteraction.ts`

**Step 1: Write failing test**

Extend existing GameView tests to verify new components render.

**Step 2:** Run → FAIL

**Step 3:**
- In `useAgentInteraction.ts`: Add `profileModalAgentId` state. Add `handleViewProfile` and `handleCloseProfile` handlers. Compute `agentInfoCard` using `getAgentInfoCard` with familiarity-derived knowledge level. Compute `agentFullProfile` when modal is open using `getAgentFullProfile`.
- In `GameView.tsx`: Replace `AgentDetailPanel` import/usage with `AgentInfoCard`. Add `AgentProfileModal` overlay (rendered when `profileModalAgentId` is set). Wire handlers.

**Step 4:** Run → PASS (verify all 11+ existing GameView tests still pass)

**Step 5: Commit**

```bash
git add src/components/Game/GameView.tsx src/components/Game/hooks/useAgentInteraction.ts
git commit -m "feat: wire AgentInfoCard + AgentProfileModal into GameView, replace AgentDetailPanel"
```

---

### Task 10: Enhanced Agent Tooltips (Tier 1)

**Files:**
- Modify: `src/engine/tooltipResolver.ts`
- Test: `src/engine/__tests__/tooltipResolver.test.ts` (extend)

**Step 1: Write failing test**

```typescript
describe('agent tooltip resolution', () => {
  it('resolves agent.{id} with familiarity context', () => {
    const result = resolveTooltip('agent.test-id', { familiarityMap, graph });
    expect(result).not.toBeNull();
    expect(result!.label).toBe('Kael');
  });

  it('shows minimal info at stranger level', () => {
    const result = resolveTooltip('agent.stranger-id', { familiarityMap, graph });
    expect(result!.desc).not.toContain('Fearsome');
  });

  it('shows domain info at known level', () => {
    const result = resolveTooltip('agent.known-id', { familiarityMap, graph });
    expect(result!.desc).toContain('Fearsome in Iron');
  });
});
```

**Step 2:** Run → FAIL

**Step 3:** Extend `resolveTooltip` to accept optional context parameter. Add `agent.*` prefix routing that looks up agent in graph, checks familiarity, and returns appropriate content. At stranger: name + "A mysterious figure". At recognised: name + archetype. At known+: name + top domain word.

**Step 4:** Run → PASS

**Step 5: Commit**

```bash
git add src/engine/tooltipResolver.ts src/engine/__tests__/tooltipResolver.test.ts
git commit -m "feat: enhanced agent tooltips — familiarity-aware content at Tier 1"
```

---

### Task 11: Familiarity Trace in Debug Panel

**Files:**
- Modify: `src/components/Game/DebugPanel.tsx`

**Step 1:** Add `familiarity_change` renderer to the DebugPanel's category-specific renderers. Shows: agent name, old level → new level, gain source, amount.

**Step 2:** Verify in existing DebugPanel tests that new category renders without error.

**Step 3: Commit**

```bash
git add src/components/Game/DebugPanel.tsx
git commit -m "feat: familiarity_change trace renderer in debug panel"
```

---

### Task 12: Full Integration Test

**Files:**
- Create: `src/engine/__tests__/progressive-disclosure-integration.test.ts`

**Step 1: Write integration test**

```typescript
describe('progressive disclosure integration', () => {
  it('full flow: init → stranger → proximity gain → recognised → card shows archetype', () => {
    const state = initializeGameState();
    // Pick a non-worshipper agent
    // Verify starts at stranger (familiarity 0)
    // Move avatar to their hex
    // Run 20 ticks (proximity × 20 = 0.2)
    // Verify familiarity crossed to recognised
    // Verify getAgentInfoCard now shows archetype
  });

  it('scry action grants 0.15 familiarity', () => {
    // Verify scry interaction increases familiarity
  });

  it('word scales produce no numeric values in UI data', () => {
    // Get AgentInfoCard and AgentFullProfile at transparent level
    // Verify all domain values are strings (words), not numbers
  });

  it('all 9 reaches have valid word scales', () => {
    // For each reach, test values 0, 2, 4, 6, 8, 10
    // Verify all return non-empty strings
  });
});
```

**Step 2:** Run → PASS

**Step 3: Commit**

```bash
git add src/engine/__tests__/progressive-disclosure-integration.test.ts
git commit -m "test: progressive disclosure integration — full flow, scry gain, word scales validation"
```

---

### Task 13: Run Full Test Suite & Verify

**Step 1:** Run full test suite

```bash
npm test
```

Expected: All ~1,760+ existing tests pass + ~80-100 new tests pass.

**Step 2:** Run type check

```bash
npx tsc --noEmit
```

Expected: No type errors.

**Step 3:** Run production build

```bash
npx vite build
```

Expected: Build succeeds.

**Step 4: Commit (if any fixes needed)**

---

### Task 14: Documentation Updates

Use the `gamedocumenter` skill to update:

1. **CLAUDE.md** — Update project status, engine stats, changelog entries
2. **Obsidian vault** — Create `Progressive Disclosure.md`, `Knowledge Fog of War.md`, `Domain Word Scales.md` system notes; update `Index.md`
3. **Notion backlog** — Mark progressive disclosure tasks complete, add any discovered follow-up tasks

**Commit:**

```bash
git add -A
git commit -m "docs: progressive disclosure + knowledge fog of war documentation"
```

---

## Summary

| Task | New Files | Modified Files | Est. Tests |
|------|-----------|---------------|------------|
| 1. Familiarity types | 2 | 0 | 5 |
| 2. Domain word scales | 2 | 0 | 7 |
| 3. Familiarity engine | 2 | 0 | 16 |
| 4. Profile generator | 2 | 0 | 6 |
| 5. Gated aggregators | 0 | 2 | 8 |
| 6. GameState + orchestrator | 1 | 3 | 5 |
| 7. AgentInfoCard (Tier 2) | 2 | 0 | 8 |
| 8. AgentProfileModal (Tier 3) | 2 | 0 | 10 |
| 9. GameView wiring | 0 | 2 | 4 |
| 10. Enhanced tooltips | 0 | 2 | 5 |
| 11. Debug panel trace | 0 | 1 | 2 |
| 12. Integration test | 1 | 0 | 6 |
| 13. Full suite verify | 0 | 0 | 0 |
| 14. Documentation | 3+ | 2+ | 0 |
| **Total** | **~17** | **~12** | **~82** |
