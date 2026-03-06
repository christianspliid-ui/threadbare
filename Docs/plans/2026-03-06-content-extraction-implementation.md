# Content Package Extraction — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extract ~350 lines of embedded content data from engine/type files into 5 new `*-content.ts` packages, establishing canonical data containers for content writers.

**Architecture:** Pure move-and-reexport refactor. Each new package in `src/data/` exports the same constants that engine/type files currently export. Engine files switch to importing from the new packages. No logic changes, all existing tests pass.

**Tech Stack:** TypeScript, Vitest

---

### Task 1: Create `narrative-content.ts` — sphere vocabulary

**Files:**
- Create: `src/data/narrative-content.ts`
- Modify: `src/types/narrative.ts` (remove `SPHERE_VOCABULARY` const, keep interface)
- Modify: `src/engine/narrative.ts` (update import)
- Test: `src/data/__tests__/narrative-content.test.ts`

**Step 1: Write the failing test**

```typescript
// src/data/__tests__/narrative-content.test.ts
import { describe, it, expect } from 'vitest';
import {
  SPHERE_VOCABULARY,
  ROUTINE_TEMPLATES,
  NOTABLE_TEMPLATES,
  VALUE_FLAVORS,
} from '../narrative-content';

describe('narrative-content', () => {
  it('exports sphere vocabulary for all 8 spheres', () => {
    const spheres = Object.keys(SPHERE_VOCABULARY);
    expect(spheres).toHaveLength(8);
    for (const sphere of spheres) {
      const vocab = SPHERE_VOCABULARY[sphere as keyof typeof SPHERE_VOCABULARY];
      expect(vocab.adjectives.length).toBeGreaterThanOrEqual(3);
      expect(vocab.verbs.length).toBeGreaterThanOrEqual(3);
      expect(vocab.nouns.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('exports routine templates for all 11 event types', () => {
    const eventTypes = Object.keys(ROUTINE_TEMPLATES);
    expect(eventTypes).toHaveLength(11);
    for (const templates of Object.values(ROUTINE_TEMPLATES)) {
      expect(templates.length).toBeGreaterThanOrEqual(1);
      for (const t of templates) {
        expect(typeof t).toBe('string');
        expect(t.length).toBeGreaterThan(10);
      }
    }
  });

  it('exports notable templates for 5 event types', () => {
    const eventTypes = Object.keys(NOTABLE_TEMPLATES);
    expect(eventTypes).toHaveLength(5);
  });

  it('exports value flavors for 10 value pairs', () => {
    const pairs = Object.keys(VALUE_FLAVORS);
    expect(pairs).toHaveLength(10);
    for (const flavors of Object.values(VALUE_FLAVORS)) {
      expect(flavors!.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('routine templates contain placeholder tokens', () => {
    for (const templates of Object.values(ROUTINE_TEMPLATES)) {
      for (const t of templates) {
        // Every template should have at least one placeholder
        expect(t).toMatch(/\{(actor|target|adj|verb|noun)\}/);
      }
    }
  });

  it('notable templates contain personality placeholder', () => {
    for (const templates of Object.values(NOTABLE_TEMPLATES)) {
      for (const t of templates) {
        expect(t).toContain('{personality}');
      }
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/__tests__/narrative-content.test.ts`
Expected: FAIL — module not found

**Step 3: Create `narrative-content.ts`**

Move these data blocks from their current locations into `src/data/narrative-content.ts`:

1. `SPHERE_VOCABULARY` — cut from `src/types/narrative.ts` lines 89–130, paste into new file
2. `ROUTINE_TEMPLATES` — cut from `src/engine/narrative.ts` lines 56–96, paste into new file
3. `NOTABLE_TEMPLATES` — cut from `src/engine/narrative.ts` lines 154–173, paste into new file
4. `VALUE_FLAVORS` — cut from `src/engine/narrative.ts` lines 130–141, paste into new file

The new file imports `SphereName` from `../types/index` and `ValuePair` from `../types/agent`, and re-exports the `SphereVocabulary` interface (keep the interface definition in `types/narrative.ts` too — both can export it, or the content file can re-export from types).

**Important:** Keep the `SphereVocabulary` interface in `types/narrative.ts` (it's a type shape, not content). The content file imports it from types.

```typescript
// src/data/narrative-content.ts
import type { SphereName } from '../types/index';
import type { SphereVocabulary } from '../types/narrative';
import type { ValuePair } from '../types/agent';

// ─── Sphere Vocabulary ──────────────────────────────────────────
// (moved from src/types/narrative.ts)

export const SPHERE_VOCABULARY: Record<SphereName, SphereVocabulary> = {
  // ... exact content from types/narrative.ts lines 89-130
};

// ─── Routine Prose Templates ────────────────────────────────────
// (moved from src/engine/narrative.ts lines 56-96)

export const ROUTINE_TEMPLATES: Record<string, string[]> = {
  // ... exact content
};

// ─── Notable Enhanced Templates ─────────────────────────────────
// (moved from src/engine/narrative.ts lines 154-173)

export const NOTABLE_TEMPLATES: Record<string, string[]> = {
  // ... exact content
};

// ─── Value Flavor Clauses ───────────────────────────────────────
// (moved from src/engine/narrative.ts lines 130-141)

export const VALUE_FLAVORS: Partial<Record<ValuePair, string[]>> = {
  // ... exact content
};
```

**Step 4: Update imports in source files**

In `src/types/narrative.ts`:
- Remove the `SPHERE_VOCABULARY` const (lines 89–130) — keep the `SphereVocabulary` interface
- Add a re-export so existing consumers don't break: `export { SPHERE_VOCABULARY } from '../data/narrative-content';`

In `src/engine/narrative.ts`:
- Change `import { SPHERE_VOCABULARY } from '../types/narrative';` → `import { SPHERE_VOCABULARY } from '../data/narrative-content';`
- Remove the `ROUTINE_TEMPLATES` const (lines 56–96), import from `'../data/narrative-content'`
- Remove the `NOTABLE_TEMPLATES` const (lines 154–173), import from `'../data/narrative-content'`
- Remove the `VALUE_FLAVORS` const (lines 130–141), import from `'../data/narrative-content'`

**Step 5: Run all narrative tests to verify nothing broke**

Run: `npx vitest run src/engine/__tests__/narrative.test.ts src/engine/__tests__/narrative-integration.test.ts src/data/__tests__/narrative-content.test.ts`
Expected: ALL PASS — same data, different import path

**Step 6: Commit**

```bash
git add src/data/narrative-content.ts src/data/__tests__/narrative-content.test.ts src/types/narrative.ts src/engine/narrative.ts
git commit -m "refactor: extract narrative content into narrative-content.ts"
```

---

### Task 2: Create `dream-content.ts` — manipulation & intervention definitions

**Files:**
- Create: `src/data/dream-content.ts`
- Modify: `src/types/dream.ts` (remove const blocks, keep interfaces/types)
- Test: `src/data/__tests__/dream-content.test.ts`

**Step 1: Write the failing test**

```typescript
// src/data/__tests__/dream-content.test.ts
import { describe, it, expect } from 'vitest';
import {
  MANIPULATION_DEFINITIONS,
  INTERVENTION_DEFINITIONS,
  TIER_MODIFIERS,
  DELIVERY_RANGE,
  LOCAL_ENCOUNTER,
} from '../dream-content';

describe('dream-content', () => {
  it('exports 6 manipulation definitions', () => {
    expect(Object.keys(MANIPULATION_DEFINITIONS)).toHaveLength(6);
  });

  it('each manipulation has required fields', () => {
    for (const def of Object.values(MANIPULATION_DEFINITIONS)) {
      expect(def.type).toBeTruthy();
      expect(typeof def.baseCost).toBe('number');
      expect(typeof def.riskLevel).toBe('number');
      expect(def.description).toBeTruthy();
    }
  });

  it('exports 8 intervention definitions', () => {
    expect(Object.keys(INTERVENTION_DEFINITIONS)).toHaveLength(8);
  });

  it('each intervention has required fields', () => {
    for (const def of Object.values(INTERVENTION_DEFINITIONS)) {
      expect(def.type).toBeTruthy();
      expect(def.sphereAffinities.length).toBeGreaterThanOrEqual(1);
      expect(typeof def.baseCost).toBe('number');
      expect(typeof def.detectionRisk).toBe('number');
      expect(def.description).toBeTruthy();
      expect(def.deliveryMode).toBeTruthy();
    }
  });

  it('exports tier modifiers for all actor types', () => {
    expect(TIER_MODIFIERS.individual).toBe(1.0);
    expect(TIER_MODIFIERS.god).toBe(10.0);
  });

  it('exports delivery range constants', () => {
    expect(DELIVERY_RANGE.deceive).toBe(3);
    expect(DELIVERY_RANGE.intimidate).toBe(3);
    expect(DELIVERY_RANGE.inspire).toBe(5);
  });

  it('exports local encounter constants', () => {
    expect(LOCAL_ENCOUNTER.visitImpactBonus).toBe(1.15);
    expect(LOCAL_ENCOUNTER.summonEssenceCost).toBe(1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/__tests__/dream-content.test.ts`
Expected: FAIL — module not found

**Step 3: Create `dream-content.ts`**

Move from `src/types/dream.ts`:
- `MANIPULATION_DEFINITIONS` (lines 112–161)
- `INTERVENTION_DEFINITIONS` (lines 163–244)
- `TIER_MODIFIERS` (lines 246–252)
- `DELIVERY_RANGE` (lines 255–259)
- `LOCAL_ENCOUNTER` (lines 262–267)

```typescript
// src/data/dream-content.ts
import type { ManipulationType, ManipulationDefinition, InterventionType, InterventionDefinition, TierModifier } from '../types/dream';

export const MANIPULATION_DEFINITIONS: Record<ManipulationType, ManipulationDefinition> = {
  // ... exact content from types/dream.ts
};

export const INTERVENTION_DEFINITIONS: Record<InterventionType, InterventionDefinition> = {
  // ... exact content
};

export const TIER_MODIFIERS: TierModifier = {
  // ... exact content
};

export const DELIVERY_RANGE = { /* ... */ } as const;
export const LOCAL_ENCOUNTER = { /* ... */ } as const;
```

**Step 4: Update imports**

In `src/types/dream.ts`:
- Remove the 5 const blocks
- Add re-exports: `export { MANIPULATION_DEFINITIONS, INTERVENTION_DEFINITIONS, TIER_MODIFIERS, DELIVERY_RANGE, LOCAL_ENCOUNTER } from '../data/dream-content';`

This re-export strategy means existing consumers that import from `types/dream` continue to work without changes. New consumers can import from `data/dream-content` directly.

**Step 5: Run dream tests**

Run: `npx vitest run src/engine/__tests__/dream.test.ts src/engine/__tests__/dream-integration.test.ts src/data/__tests__/dream-content.test.ts`
Expected: ALL PASS

**Step 6: Commit**

```bash
git add src/data/dream-content.ts src/data/__tests__/dream-content.test.ts src/types/dream.ts
git commit -m "refactor: extract dream content into dream-content.ts"
```

---

### Task 3: Create `doom-content.ts` — archetype stage names

**Files:**
- Create: `src/data/doom-content.ts`
- Modify: `src/engine/doomClock.ts` (import from content package)
- Test: `src/data/__tests__/doom-content.test.ts`

**Step 1: Write the failing test**

```typescript
// src/data/__tests__/doom-content.test.ts
import { describe, it, expect } from 'vitest';
import { ARCHETYPE_STAGE_NAMES, DEFAULT_THRESHOLDS } from '../doom-content';

describe('doom-content', () => {
  it('exports stage names for all 7 archetypes', () => {
    expect(Object.keys(ARCHETYPE_STAGE_NAMES)).toHaveLength(7);
  });

  it('each archetype has exactly 5 stage names', () => {
    for (const names of Object.values(ARCHETYPE_STAGE_NAMES)) {
      expect(names).toHaveLength(5);
      for (const name of names) {
        expect(typeof name).toBe('string');
        expect(name.length).toBeGreaterThan(0);
      }
    }
  });

  it('exports 5 default thresholds summing to progression', () => {
    expect(DEFAULT_THRESHOLDS).toHaveLength(5);
    expect(DEFAULT_THRESHOLDS[0]).toBe(0.20);
    expect(DEFAULT_THRESHOLDS[4]).toBe(1.0);
  });

  it('thresholds are monotonically increasing', () => {
    for (let i = 1; i < DEFAULT_THRESHOLDS.length; i++) {
      expect(DEFAULT_THRESHOLDS[i]).toBeGreaterThan(DEFAULT_THRESHOLDS[i - 1]);
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/__tests__/doom-content.test.ts`

**Step 3: Create `doom-content.ts`**

Move from `src/engine/doomClock.ts`:
- `DEFAULT_THRESHOLDS` (line 18)
- `ARCHETYPE_STAGE_NAMES` (lines 21–29)

```typescript
// src/data/doom-content.ts
import type { DoomClockArchetype } from '../types/doomClock';

export const DEFAULT_THRESHOLDS = [0.20, 0.40, 0.60, 0.80, 1.0];

export const ARCHETYPE_STAGE_NAMES: Record<DoomClockArchetype, [string, string, string, string, string]> = {
  // ... exact content from doomClock.ts
};
```

**Step 4: Update imports in `doomClock.ts`**

```typescript
import { DEFAULT_THRESHOLDS, ARCHETYPE_STAGE_NAMES } from '../data/doom-content';
```

Remove the two const blocks from `doomClock.ts`.

**Step 5: Run doom tests**

Run: `npx vitest run src/engine/__tests__/doomClock.test.ts src/engine/__tests__/rival-doom-integration.test.ts src/data/__tests__/doom-content.test.ts`
Expected: ALL PASS

**Step 6: Commit**

```bash
git add src/data/doom-content.ts src/data/__tests__/doom-content.test.ts src/engine/doomClock.ts
git commit -m "refactor: extract doom content into doom-content.ts"
```

---

### Task 4: Create `rival-content.ts` — name fragments & behavior weights

**Files:**
- Create: `src/data/rival-content.ts`
- Modify: `src/types/rival.ts` (remove const blocks, keep interfaces/types)
- Modify: `src/engine/rival.ts` (import from content package)
- Test: `src/data/__tests__/rival-content.test.ts`

**Step 1: Write the failing test**

```typescript
// src/data/__tests__/rival-content.test.ts
import { describe, it, expect } from 'vitest';
import {
  RIVAL_NAME_PREFIXES,
  RIVAL_NAME_SUFFIXES,
  BEHAVIORS,
  BEHAVIOR_WEIGHTS,
} from '../rival-content';

describe('rival-content', () => {
  it('exports 12 name prefixes', () => {
    expect(RIVAL_NAME_PREFIXES).toHaveLength(12);
  });

  it('exports 12 name suffixes', () => {
    expect(RIVAL_NAME_SUFFIXES).toHaveLength(12);
  });

  it('all prefixes are unique', () => {
    expect(new Set(RIVAL_NAME_PREFIXES).size).toBe(RIVAL_NAME_PREFIXES.length);
  });

  it('all suffixes are unique', () => {
    expect(new Set(RIVAL_NAME_SUFFIXES).size).toBe(RIVAL_NAME_SUFFIXES.length);
  });

  it('exports 4 behaviors', () => {
    expect(BEHAVIORS).toHaveLength(4);
  });

  it('exports behavior weights for all 4 behaviors', () => {
    expect(Object.keys(BEHAVIOR_WEIGHTS)).toHaveLength(4);
    for (const weights of Object.values(BEHAVIOR_WEIGHTS)) {
      const sum = Object.values(weights).reduce((s, v) => s + v, 0);
      expect(sum).toBeCloseTo(1.0, 1);
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/__tests__/rival-content.test.ts`

**Step 3: Create `rival-content.ts`**

Move from:
- `src/types/rival.ts`: `RIVAL_NAME_PREFIXES` (lines 44–48), `RIVAL_NAME_SUFFIXES` (lines 50–54)
- `src/engine/rival.ts`: `BEHAVIORS` (line 25), `BEHAVIOR_WEIGHTS` (lines 130–135), `ACTION_TYPES` (line 137)

```typescript
// src/data/rival-content.ts
import type { RivalBehavior } from '../types/rival';
import type { RivalAction } from '../engine/rival';

export const RIVAL_NAME_PREFIXES = [ /* ... */ ] as const;
export const RIVAL_NAME_SUFFIXES = [ /* ... */ ] as const;
export const BEHAVIORS: RivalBehavior[] = ['aggressive', 'subtle', 'territorial', 'expansionist'];
export const BEHAVIOR_WEIGHTS: Record<RivalBehavior, Record<RivalAction['type'], number>> = { /* ... */ };
export const ACTION_TYPES: RivalAction['type'][] = ['recruit', 'intervene', 'expand', 'attack', 'wait'];
```

**Note on circular imports:** `RivalAction` is defined in `engine/rival.ts`. To avoid circular imports, either:
- Move the `RivalAction` interface to `types/rival.ts` (preferred — it's a type shape), OR
- Inline the action type in `rival-content.ts` as `Record<RivalBehavior, Record<string, number>>`

The preferred approach: move `RivalAction` interface to `types/rival.ts` before creating `rival-content.ts`.

**Step 4: Update imports**

In `src/types/rival.ts`:
- Remove `RIVAL_NAME_PREFIXES` and `RIVAL_NAME_SUFFIXES` consts
- Add re-exports: `export { RIVAL_NAME_PREFIXES, RIVAL_NAME_SUFFIXES } from '../data/rival-content';`

In `src/engine/rival.ts`:
- Import from content: `import { RIVAL_NAME_PREFIXES, RIVAL_NAME_SUFFIXES, BEHAVIORS, BEHAVIOR_WEIGHTS, ACTION_TYPES } from '../data/rival-content';`
- Remove the local `BEHAVIORS`, `BEHAVIOR_WEIGHTS`, `ACTION_TYPES` consts

**Step 5: Run rival tests**

Run: `npx vitest run src/engine/__tests__/rival.test.ts src/engine/__tests__/rival-doom-integration.test.ts src/data/__tests__/rival-content.test.ts`
Expected: ALL PASS

**Step 6: Commit**

```bash
git add src/data/rival-content.ts src/data/__tests__/rival-content.test.ts src/types/rival.ts src/engine/rival.ts
git commit -m "refactor: extract rival content into rival-content.ts"
```

---

### Task 5: Create `influence-content.ts` — tier names & constants

**Files:**
- Create: `src/data/influence-content.ts`
- Modify: `src/types/influence.ts` (remove const blocks, keep interfaces/types)
- Test: `src/data/__tests__/influence-content.test.ts`

**Step 1: Write the failing test**

```typescript
// src/data/__tests__/influence-content.test.ts
import { describe, it, expect } from 'vitest';
import {
  TIER_NAMES,
  TIER_MAINTENANCE,
  TIER_PROMOTION_THRESHOLDS,
  BASE_ESSENCE_PER_TICK,
  ESSENCE_PER_WORSHIPPER,
  ESSENCE_PER_PLACE_OF_POWER,
  BASE_MAX_ESSENCE,
  MAX_ESSENCE_PER_WORSHIPPER,
  RECRUIT_COST,
  DISCOVER_COST,
  OBSERVE_COST,
} from '../influence-content';

describe('influence-content', () => {
  it('exports tier names for tiers 0-4', () => {
    expect(Object.keys(TIER_NAMES)).toHaveLength(5);
    expect(TIER_NAMES[0]).toBe('Unaware');
    expect(TIER_NAMES[4]).toBe('Aspect');
  });

  it('exports tier maintenance costs', () => {
    expect(TIER_MAINTENANCE[0]).toBe(0);
    expect(TIER_MAINTENANCE[4]).toBe(4.0);
  });

  it('exports promotion thresholds', () => {
    expect(TIER_PROMOTION_THRESHOLDS[0]).toBe(0);
    expect(TIER_PROMOTION_THRESHOLDS[4]).toBe(180);
  });

  it('exports economy constants', () => {
    expect(BASE_ESSENCE_PER_TICK).toBe(1.0);
    expect(ESSENCE_PER_WORSHIPPER).toBe(0.1);
    expect(ESSENCE_PER_PLACE_OF_POWER).toBe(0.5);
    expect(BASE_MAX_ESSENCE).toBe(50);
    expect(MAX_ESSENCE_PER_WORSHIPPER).toBe(5);
    expect(RECRUIT_COST).toBe(5);
    expect(DISCOVER_COST).toBe(1);
    expect(OBSERVE_COST).toBe(0.5);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/__tests__/influence-content.test.ts`

**Step 3: Create `influence-content.ts`**

Move from `src/types/influence.ts`:
- `BASE_ESSENCE_PER_TICK`, `ESSENCE_PER_WORSHIPPER`, `ESSENCE_PER_PLACE_OF_POWER` (lines 30–36)
- `BASE_MAX_ESSENCE`, `MAX_ESSENCE_PER_WORSHIPPER` (lines 39–40)
- `TIER_NAMES` (lines 48–54)
- `TIER_MAINTENANCE` (lines 57–63)
- `TIER_PROMOTION_THRESHOLDS` (lines 66–72)
- `RECRUIT_COST`, `DISCOVER_COST`, `OBSERVE_COST` (lines 75–81)

```typescript
// src/data/influence-content.ts
import type { InfluenceTier } from '../types/influence';

export const BASE_ESSENCE_PER_TICK = 1.0;
export const ESSENCE_PER_WORSHIPPER = 0.1;
export const ESSENCE_PER_PLACE_OF_POWER = 0.5;
export const BASE_MAX_ESSENCE = 50;
export const MAX_ESSENCE_PER_WORSHIPPER = 5;

export const TIER_NAMES: Record<InfluenceTier, string> = { /* ... */ };
export const TIER_MAINTENANCE: Record<InfluenceTier, number> = { /* ... */ };
export const TIER_PROMOTION_THRESHOLDS: Record<InfluenceTier, number> = { /* ... */ };

export const RECRUIT_COST = 5;
export const DISCOVER_COST = 1;
export const OBSERVE_COST = 0.5;
```

**Step 4: Update imports**

In `src/types/influence.ts`:
- Remove all const blocks (keep interfaces and types)
- Add re-exports of all constants from `'../data/influence-content'`

**Step 5: Run influence tests**

Run: `npx vitest run src/engine/__tests__/influence.test.ts src/engine/__tests__/influence-integration.test.ts src/data/__tests__/influence-content.test.ts`
Expected: ALL PASS

**Step 6: Commit**

```bash
git add src/data/influence-content.ts src/data/__tests__/influence-content.test.ts src/types/influence.ts
git commit -m "refactor: extract influence content into influence-content.ts"
```

---

### Task 6: Full test suite verification

**Step 1: Run TypeScript compiler**

Run: `npx tsc --noEmit`
Expected: Clean — no type errors

**Step 2: Run Vite build**

Run: `npx vite build`
Expected: Clean build

**Step 3: Run all content package tests**

Run: `npx vitest run src/data/__tests__/`
Expected: All content tests pass (narrative, dream, doom, rival, influence + existing scry, mandate, archetype)

**Step 4: Run all engine tests that touch extracted data**

Run: `npx vitest run src/engine/__tests__/narrative.test.ts src/engine/__tests__/narrative-integration.test.ts src/engine/__tests__/dream.test.ts src/engine/__tests__/dream-integration.test.ts src/engine/__tests__/doomClock.test.ts src/engine/__tests__/rival.test.ts src/engine/__tests__/rival-doom-integration.test.ts src/engine/__tests__/influence.test.ts src/engine/__tests__/influence-integration.test.ts`
Expected: ALL PASS — extraction is import-path-only change

**Step 5: Spot-check additional tests**

Run: `npx vitest run src/engine/__tests__/orchestrator.test.ts src/engine/__tests__/delivery.test.ts src/engine/__tests__/wheel.test.ts`
Expected: ALL PASS — these consume extracted modules transitively

---

### Task 7: Documentation updates

**Step 1: Update Obsidian vault**

Create `Systems/Content Packages.md` if it doesn't exist, or update existing note with the 8 package inventory (3 existing + 5 new). Add wikilinks to connected systems.

**Step 2: Update Notion backlog**

- Mark content package extraction tasks as complete
- Note the `archetype-content.ts` enrichment item from the Content Strategy section is partially done (shape exists, needs enrichment)

**Step 3: Update CLAUDE.md**

- Add changelog entries for all 5 new packages
- Update engine stats (module count increases by 5)

**Step 4: Commit documentation**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for content extraction completion"
```
