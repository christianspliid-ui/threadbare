# Mandate & Doom Clock Content Pipeline Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extract mandate templates and doom clock archetypes from TypeScript into JSON content files with validated loaders, preserving all existing export shapes.

**Architecture:** Each mandate/doom archetype becomes a standalone `.json` file under `src/data/mandates/` and `src/data/doom/`. Thin loader modules import, validate, and re-export the same shapes (`MANDATE_TEMPLATES`, `MANDATE_MILESTONE_PROSE`, `ARCHETYPE_STAGE_NAMES`). Existing consumers import from the same paths — zero breaking changes.

**Tech Stack:** Vite (native JSON imports), vitest, TypeScript

**Design doc:** `Docs/plans/2026-03-10-mandate-doom-content-pipeline-design.md`

---

### Task 1: Fix MandateType Union

The `MandateType` in `src/types/mandate.ts` is missing `simulation_achievable` — 3 mandates already use it but the type doesn't include it.

**Files:**
- Modify: `src/types/mandate.ts:6-9`

**Step 1: Add simulation_achievable to the union**

In `src/types/mandate.ts`, change:

```typescript
export type MandateType =
  | 'graph_state'
  | 'narrative'
  | 'sphere_dominance';
```

To:

```typescript
export type MandateType =
  | 'graph_state'
  | 'narrative'
  | 'sphere_dominance'
  | 'simulation_achievable';
```

**Step 2: Run existing tests**

Run: `npx vitest run src/engine/__tests__/mandate-content.test.ts`
Expected: All tests PASS (this is additive, doesn't break anything)

**Step 3: Commit**

```bash
git add src/types/mandate.ts
git commit -m "fix: add simulation_achievable to MandateType union"
```

---

### Task 2: Create Mandate JSON Files

Extract all 12 mandate constants from `src/data/mandate-content.ts` into individual JSON files. Each file includes the mandate definition AND its prose (co-located).

**Files:**
- Create: `src/data/mandates/dominion-of-stone.json`
- Create: `src/data/mandates/builders-legacy.json`
- Create: `src/data/mandates/web-of-allegiance.json`
- Create: `src/data/mandates/tide-of-life.json`
- Create: `src/data/mandates/entropic-cascade.json`
- Create: `src/data/mandates/illumination.json`
- Create: `src/data/mandates/ascendants-champion.json`
- Create: `src/data/mandates/devoted-circle.json`
- Create: `src/data/mandates/shadow-sovereign.json`
- Create: `src/data/mandates/threads-of-fate.json`
- Create: `src/data/mandates/the-gathering.json`
- Create: `src/data/mandates/cultural-convergence.json`

**Step 1: Create mandates directory**

Run: `mkdir -p src/data/mandates`

**Step 2: Create all 12 JSON files**

For each mandate, extract from `mandate-content.ts`:
- The constant's fields (`id`, `type`, `name`, `description`, `sphereAffinities`, `targetSphere` if present, `stages`)
- The matching entries from `MANDATE_MILESTONE_PROSE` → co-locate as a `prose` object

Each JSON file follows this shape:

```json
{
  "id": "mandate.<kebab_id>",
  "type": "<graph_state|narrative|sphere_dominance|simulation_achievable>",
  "name": "<Display Name>",
  "description": "<player-facing description>",
  "sphereAffinities": ["<sphere1>", "<sphere2>"],
  "stages": [
    {
      "stage": "setup",
      "description": "<stage description>",
      "conditions": [
        {
          "type": "<node_count|edge_count|sphere_weight|actor_tier>",
          "description": "<human readable>",
          "params": { ... }
        }
      ]
    },
    { "stage": "escalation", ... },
    { "stage": "culmination", ... }
  ],
  "prose": {
    "setup_to_escalation": "<transition prose>",
    "escalation_to_culmination": "<transition prose>",
    "completed": "<victory prose>",
    "failed": "<failure prose>"
  }
}
```

For sphere_dominance mandates, also include `"targetSphere": "<sphere>"`.

Source data: copy values directly from the constants in `src/data/mandate-content.ts` (lines 48-799) and the corresponding keys in `MANDATE_MILESTONE_PROSE` (lines 853-1033).

The prose key mapping is: `MANDATE_MILESTONE_PROSE["<id_without_mandate_prefix>.<transition>"]` → `prose.<transition>` in the JSON.

**Step 3: Verify files created**

Run: `ls src/data/mandates/*.json | wc -l`
Expected: 12

**Step 4: Commit**

```bash
git add src/data/mandates/
git commit -m "content: extract 12 mandate templates to individual JSON files"
```

---

### Task 3: Create Mandate Loader with Validation

**Files:**
- Create: `src/data/mandate-loader.ts`
- Test: `src/data/__tests__/mandate-loader.test.ts`

**Step 1: Write the failing test for the loader**

Create `src/data/__tests__/mandate-loader.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { loadMandateTemplates, loadMandateMilestoneProse, validateMandateJson } from '../mandate-loader';
import type { SphereName } from '../../types/index';

const VALID_CONDITION_TYPES = ['node_count', 'edge_count', 'sphere_weight', 'actor_tier'];
const VALID_STAGES = ['setup', 'escalation', 'culmination'];
const VALID_TYPES = ['graph_state', 'narrative', 'sphere_dominance', 'simulation_achievable'];
const VALID_SPHERES: SphereName[] = ['force', 'matter', 'energy', 'life', 'mind', 'spirit', 'time', 'entropy'];
const VALID_PROSE_KEYS = ['setup_to_escalation', 'escalation_to_culmination', 'completed', 'failed'];

describe('mandate-loader', () => {
  describe('loadMandateTemplates', () => {
    const templates = loadMandateTemplates();

    it('loads exactly 12 templates', () => {
      expect(templates).toHaveLength(12);
    });

    it('every template has required fields', () => {
      templates.forEach((t) => {
        expect(t.id).toBeTruthy();
        expect(t.type).toBeTruthy();
        expect(t.name).toBeTruthy();
        expect(t.description).toBeTruthy();
        expect(t.sphereAffinities.length).toBeGreaterThan(0);
        expect(t.stages).toHaveLength(3);
      });
    });

    it('every template has valid type', () => {
      templates.forEach((t) => {
        expect(VALID_TYPES).toContain(t.type);
      });
    });

    it('every template has valid sphere affinities', () => {
      templates.forEach((t) => {
        t.sphereAffinities.forEach((s) => {
          expect(VALID_SPHERES).toContain(s);
        });
      });
    });

    it('every stage has correct order', () => {
      templates.forEach((t) => {
        t.stages.forEach((s, i) => {
          expect(s.stage).toBe(VALID_STAGES[i]);
        });
      });
    });

    it('every condition has valid type', () => {
      templates.forEach((t) => {
        t.stages.forEach((s) => {
          s.conditions.forEach((c) => {
            expect(VALID_CONDITION_TYPES).toContain(c.type);
          });
        });
      });
    });

    it('all templates have unique IDs', () => {
      const ids = templates.map((t) => t.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('loadMandateMilestoneProse', () => {
    const prose = loadMandateMilestoneProse();

    it('has at least 48 entries (12 mandates × 4 transitions)', () => {
      expect(Object.keys(prose).length).toBeGreaterThanOrEqual(48);
    });

    it('every prose entry is a non-empty string', () => {
      for (const [key, text] of Object.entries(prose)) {
        expect(typeof text).toBe('string');
        expect(text.length, `${key} prose too short`).toBeGreaterThan(10);
      }
    });

    it('keys follow mandateId.transition pattern', () => {
      const templates = loadMandateTemplates();
      const mandateIds = new Set(templates.map((t) => t.id.replace('mandate.', '')));
      for (const key of Object.keys(prose)) {
        const parts = key.split('.');
        expect(parts.length).toBe(2);
        expect(mandateIds.has(parts[0])).toBe(true);
        expect(VALID_PROSE_KEYS).toContain(parts[1]);
      }
    });
  });

  describe('validateMandateJson', () => {
    it('rejects JSON missing id', () => {
      expect(() => validateMandateJson({ type: 'graph_state', name: 'X', description: 'X', sphereAffinities: ['life'], stages: [], prose: {} }, 'test.json')).toThrow();
    });

    it('rejects JSON with wrong number of stages', () => {
      expect(() => validateMandateJson({
        id: 'mandate.test', type: 'graph_state', name: 'X', description: 'X',
        sphereAffinities: ['life'],
        stages: [{ stage: 'setup', description: 'x', conditions: [] }],
        prose: { setup_to_escalation: 'x', escalation_to_culmination: 'x', completed: 'x', failed: 'x' },
      }, 'test.json')).toThrow(/3 stages/);
    });

    it('rejects JSON with invalid condition type', () => {
      expect(() => validateMandateJson({
        id: 'mandate.test', type: 'graph_state', name: 'X', description: 'X',
        sphereAffinities: ['life'],
        stages: [
          { stage: 'setup', description: 'x', conditions: [{ type: 'custom', description: 'x', params: {} }] },
          { stage: 'escalation', description: 'x', conditions: [] },
          { stage: 'culmination', description: 'x', conditions: [] },
        ],
        prose: { setup_to_escalation: 'x', escalation_to_culmination: 'x', completed: 'x', failed: 'x' },
      }, 'test.json')).toThrow(/condition type/i);
    });

    it('rejects JSON with invalid sphere affinity', () => {
      expect(() => validateMandateJson({
        id: 'mandate.test', type: 'graph_state', name: 'X', description: 'X',
        sphereAffinities: ['water'],
        stages: [
          { stage: 'setup', description: 'x', conditions: [] },
          { stage: 'escalation', description: 'x', conditions: [] },
          { stage: 'culmination', description: 'x', conditions: [] },
        ],
        prose: { setup_to_escalation: 'x', escalation_to_culmination: 'x', completed: 'x', failed: 'x' },
      }, 'test.json')).toThrow(/sphere/i);
    });

    it('rejects JSON with missing prose keys', () => {
      expect(() => validateMandateJson({
        id: 'mandate.test', type: 'graph_state', name: 'X', description: 'X',
        sphereAffinities: ['life'],
        stages: [
          { stage: 'setup', description: 'x', conditions: [] },
          { stage: 'escalation', description: 'x', conditions: [] },
          { stage: 'culmination', description: 'x', conditions: [] },
        ],
        prose: { setup_to_escalation: 'x', completed: 'x', failed: 'x' },
      }, 'test.json')).toThrow(/prose/i);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/__tests__/mandate-loader.test.ts`
Expected: FAIL — module `mandate-loader` not found

**Step 3: Implement the loader**

Create `src/data/mandate-loader.ts`:

```typescript
/**
 * Mandate Loader — imports, validates, and re-exports mandate templates from JSON files.
 *
 * Consumers import MANDATE_TEMPLATES and MANDATE_MILESTONE_PROSE from mandate-content.ts,
 * which delegates to this loader. This file is infrastructure, not content.
 */

import type { MandateDefinition, MandateCondition, MandateStage } from '../types/mandate';
import type { SphereName } from '../types/index';

// ─── JSON Imports ───────────────────────────────────────────────────
import dominionOfStone from './mandates/dominion-of-stone.json';
import buildersLegacy from './mandates/builders-legacy.json';
import webOfAllegiance from './mandates/web-of-allegiance.json';
import tideOfLife from './mandates/tide-of-life.json';
import entropicCascade from './mandates/entropic-cascade.json';
import illumination from './mandates/illumination.json';
import ascendantsChampion from './mandates/ascendants-champion.json';
import devotedCircle from './mandates/devoted-circle.json';
import shadowSovereign from './mandates/shadow-sovereign.json';
import threadsOfFate from './mandates/threads-of-fate.json';
import theGathering from './mandates/the-gathering.json';
import culturalConvergence from './mandates/cultural-convergence.json';

// ─── Types ──────────────────────────────────────────────────────────

/** JSON shape: mandate definition + co-located prose */
export interface MandateJsonShape {
  id: string;
  type: string;
  name: string;
  description: string;
  sphereAffinities: string[];
  targetSphere?: string;
  stages: Array<{
    stage: string;
    description: string;
    conditions: Array<{
      type: string;
      description: string;
      params: Record<string, unknown>;
    }>;
  }>;
  prose: Record<string, string>;
}

/** MandateTemplate = MandateDefinition + sphereAffinities (same shape as before) */
export interface MandateTemplate extends MandateDefinition {
  sphereAffinities: SphereName[];
}

// ─── Constants ──────────────────────────────────────────────────────

const VALID_CONDITION_TYPES = new Set(['node_count', 'edge_count', 'sphere_weight', 'actor_tier']);
const VALID_STAGES: MandateStage[] = ['setup', 'escalation', 'culmination'];
const VALID_TYPES = new Set(['graph_state', 'narrative', 'sphere_dominance', 'simulation_achievable']);
const VALID_SPHERES = new Set<string>(['force', 'matter', 'energy', 'life', 'mind', 'spirit', 'time', 'entropy']);
const REQUIRED_PROSE_KEYS = ['setup_to_escalation', 'escalation_to_culmination', 'completed', 'failed'];

// ─── Validation ─────────────────────────────────────────────────────

export function validateMandateJson(raw: unknown, filename: string): MandateTemplate {
  const data = raw as MandateJsonShape;

  // Required string fields
  if (!data.id || typeof data.id !== 'string') throw new Error(`${filename}: missing or invalid 'id'`);
  if (!data.type || !VALID_TYPES.has(data.type)) throw new Error(`${filename}: invalid mandate type '${data.type}'`);
  if (!data.name || typeof data.name !== 'string') throw new Error(`${filename}: missing 'name'`);
  if (!data.description || typeof data.description !== 'string') throw new Error(`${filename}: missing 'description'`);

  // Sphere affinities
  if (!Array.isArray(data.sphereAffinities) || data.sphereAffinities.length === 0) {
    throw new Error(`${filename}: sphereAffinities must be a non-empty array`);
  }
  for (const s of data.sphereAffinities) {
    if (!VALID_SPHERES.has(s)) throw new Error(`${filename}: invalid sphere affinity '${s}'`);
  }

  // Stages
  if (!Array.isArray(data.stages) || data.stages.length !== 3) {
    throw new Error(`${filename}: must have exactly 3 stages, got ${data.stages?.length ?? 0}`);
  }
  for (let i = 0; i < 3; i++) {
    const stage = data.stages[i];
    if (stage.stage !== VALID_STAGES[i]) {
      throw new Error(`${filename}: stage ${i} must be '${VALID_STAGES[i]}', got '${stage.stage}'`);
    }
    if (!stage.description) throw new Error(`${filename}: stage '${stage.stage}' missing description`);
    if (!Array.isArray(stage.conditions)) throw new Error(`${filename}: stage '${stage.stage}' missing conditions array`);
    for (const cond of stage.conditions) {
      if (!VALID_CONDITION_TYPES.has(cond.type)) {
        throw new Error(`${filename}: invalid condition type '${cond.type}' in stage '${stage.stage}'`);
      }
      if (!cond.description) throw new Error(`${filename}: condition in '${stage.stage}' missing description`);
      if (!cond.params || typeof cond.params !== 'object') {
        throw new Error(`${filename}: condition in '${stage.stage}' missing params`);
      }
    }
  }

  // Prose
  if (!data.prose || typeof data.prose !== 'object') throw new Error(`${filename}: missing prose object`);
  for (const key of REQUIRED_PROSE_KEYS) {
    if (!data.prose[key] || typeof data.prose[key] !== 'string') {
      throw new Error(`${filename}: missing prose key '${key}'`);
    }
  }

  // Cast to typed shape
  return {
    id: data.id,
    type: data.type as MandateTemplate['type'],
    name: data.name,
    description: data.description,
    sphereAffinities: data.sphereAffinities as SphereName[],
    targetSphere: data.targetSphere as SphereName | undefined,
    stages: data.stages.map((s) => ({
      stage: s.stage as MandateStage,
      description: s.description,
      conditions: s.conditions.map((c) => ({
        type: c.type as MandateCondition['type'],
        description: c.description,
        params: c.params,
      })),
    })) as [typeof data.stages[0] extends infer S ? { stage: MandateStage; description: string; conditions: MandateCondition[] } : never, any, any],
  } as MandateTemplate;
}

// ─── Loaders ────────────────────────────────────────────────────────

const RAW_MANDATES: Array<{ data: unknown; filename: string }> = [
  { data: dominionOfStone, filename: 'dominion-of-stone.json' },
  { data: buildersLegacy, filename: 'builders-legacy.json' },
  { data: webOfAllegiance, filename: 'web-of-allegiance.json' },
  { data: tideOfLife, filename: 'tide-of-life.json' },
  { data: entropicCascade, filename: 'entropic-cascade.json' },
  { data: illumination, filename: 'illumination.json' },
  { data: ascendantsChampion, filename: 'ascendants-champion.json' },
  { data: devotedCircle, filename: 'devoted-circle.json' },
  { data: shadowSovereign, filename: 'shadow-sovereign.json' },
  { data: threadsOfFate, filename: 'threads-of-fate.json' },
  { data: theGathering, filename: 'the-gathering.json' },
  { data: culturalConvergence, filename: 'cultural-convergence.json' },
];

export function loadMandateTemplates(): MandateTemplate[] {
  return RAW_MANDATES.map(({ data, filename }) => validateMandateJson(data, filename));
}

export function loadMandateMilestoneProse(): Record<string, string> {
  const templates = loadMandateTemplates();
  const prose: Record<string, string> = {};
  for (const t of templates) {
    const rawData = t as unknown as MandateJsonShape;
    // Re-read prose from original JSON (the validated template strips it)
    const jsonEntry = RAW_MANDATES.find(r => (r.data as MandateJsonShape).id === t.id);
    if (jsonEntry) {
      const rawJson = jsonEntry.data as MandateJsonShape;
      const mandateKey = t.id.replace('mandate.', '');
      for (const [transition, text] of Object.entries(rawJson.prose)) {
        prose[`${mandateKey}.${transition}`] = text;
      }
    }
  }
  return prose;
}
```

**Step 4: Run tests**

Run: `npx vitest run src/data/__tests__/mandate-loader.test.ts`
Expected: All PASS

**Step 5: Commit**

```bash
git add src/data/mandate-loader.ts src/data/__tests__/mandate-loader.test.ts
git commit -m "feat: add mandate JSON loader with validation"
```

---

### Task 4: Rewire mandate-content.ts to Delegate to Loader

Replace the body of `mandate-content.ts` with a thin re-export from the loader. All existing consumers import from `mandate-content` so this is the backward-compatibility bridge.

**Files:**
- Modify: `src/data/mandate-content.ts` (full rewrite — becomes ~20 lines)

**Step 1: Replace mandate-content.ts**

Replace the entire file with:

```typescript
/**
 * Mandate Content Package — re-exports from JSON-backed loader.
 *
 * ═══════════════════════════════════════════════════════════════════
 * CONTENT MANAGER: Mandate content now lives in individual JSON files
 * under src/data/mandates/. Edit those files to add or modify mandates.
 * This file exists for backward compatibility with existing imports.
 * ═══════════════════════════════════════════════════════════════════
 */

export type { MandateTemplate } from './mandate-loader';
export { loadMandateTemplates, loadMandateMilestoneProse } from './mandate-loader';

import { loadMandateTemplates, loadMandateMilestoneProse } from './mandate-loader';

/** All mandate templates loaded from JSON */
export const MANDATE_TEMPLATES = loadMandateTemplates();

/** Milestone prose keyed by mandateId.transition */
export const MANDATE_MILESTONE_PROSE = loadMandateMilestoneProse();
```

**Step 2: Run ALL existing mandate tests**

Run: `npx vitest run src/engine/__tests__/mandate-content.test.ts src/engine/__tests__/mandate-integration.test.ts src/engine/__tests__/mandateGenerator.test.ts`
Expected: All PASS — same shapes, same data, loaded from JSON instead of TS constants

**Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/data/mandate-content.ts
git commit -m "refactor: mandate-content.ts delegates to JSON-backed loader"
```

---

### Task 5: Create Doom Archetype JSON Files

Extract `ARCHETYPE_STAGE_NAMES` entries into individual JSON files.

**Files:**
- Create: `src/data/doom/breach.json`
- Create: `src/data/doom/convergence.json`
- Create: `src/data/doom/changing.json`
- Create: `src/data/doom/sundering.json`
- Create: `src/data/doom/failing.json`
- Create: `src/data/doom/ascension.json`
- Create: `src/data/doom/reckoning.json`

**Step 1: Create doom directory**

Run: `mkdir -p src/data/doom`

**Step 2: Create all 7 JSON files**

Each file follows this shape (values from `ARCHETYPE_STAGE_NAMES` in `doom-content.ts` lines 15-23):

```json
{
  "archetype": "breach",
  "stageNames": ["Strange Whispers", "Reality Cracks", "The Thinning", "Barriers Fail", "The Breach"],
  "thresholds": [0.20, 0.40, 0.60, 0.80, 1.0]
}
```

Repeat for all 7 archetypes using values from `doom-content.ts`.

**Step 3: Verify**

Run: `ls src/data/doom/*.json | wc -l`
Expected: 7

**Step 4: Commit**

```bash
git add src/data/doom/
git commit -m "content: extract 7 doom archetypes to individual JSON files"
```

---

### Task 6: Create Doom Loader with Validation

**Files:**
- Create: `src/data/doom-loader.ts`
- Test: `src/data/__tests__/doom-loader.test.ts`

**Step 1: Write the failing test**

Create `src/data/__tests__/doom-loader.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { loadDoomArchetypes, validateDoomJson } from '../doom-loader';
import { DOOM_CLOCK_ARCHETYPES } from '../../types/doomClock';

describe('doom-loader', () => {
  describe('loadDoomArchetypes', () => {
    const archetypes = loadDoomArchetypes();

    it('loads all 7 archetypes', () => {
      expect(Object.keys(archetypes)).toHaveLength(7);
    });

    it('every archetype from the type is present', () => {
      for (const arch of DOOM_CLOCK_ARCHETYPES) {
        expect(archetypes[arch]).toBeDefined();
      }
    });

    it('every archetype has exactly 5 stage names', () => {
      for (const [key, data] of Object.entries(archetypes)) {
        expect(data).toHaveLength(5);
        for (const name of data) {
          expect(typeof name).toBe('string');
          expect(name.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('validateDoomJson', () => {
    it('rejects JSON with wrong number of stage names', () => {
      expect(() => validateDoomJson({
        archetype: 'breach',
        stageNames: ['A', 'B', 'C'],
        thresholds: [0.2, 0.4, 0.6, 0.8, 1.0],
      }, 'test.json')).toThrow(/5 stage names/);
    });

    it('rejects JSON with invalid archetype', () => {
      expect(() => validateDoomJson({
        archetype: 'invalid',
        stageNames: ['A', 'B', 'C', 'D', 'E'],
        thresholds: [0.2, 0.4, 0.6, 0.8, 1.0],
      }, 'test.json')).toThrow(/archetype/i);
    });

    it('rejects JSON with non-ascending thresholds', () => {
      expect(() => validateDoomJson({
        archetype: 'breach',
        stageNames: ['A', 'B', 'C', 'D', 'E'],
        thresholds: [0.2, 0.1, 0.6, 0.8, 1.0],
      }, 'test.json')).toThrow(/ascending/i);
    });

    it('rejects JSON with last threshold not 1.0', () => {
      expect(() => validateDoomJson({
        archetype: 'breach',
        stageNames: ['A', 'B', 'C', 'D', 'E'],
        thresholds: [0.2, 0.4, 0.6, 0.8, 0.9],
      }, 'test.json')).toThrow(/1\.0/);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/__tests__/doom-loader.test.ts`
Expected: FAIL — module not found

**Step 3: Implement the loader**

Create `src/data/doom-loader.ts`:

```typescript
/**
 * Doom Loader — imports, validates, and re-exports doom archetype data from JSON files.
 */

import type { DoomClockArchetype } from '../types/doomClock';
import { DOOM_CLOCK_ARCHETYPES } from '../types/doomClock';

// ─── JSON Imports ───────────────────────────────────────────────────
import breach from './doom/breach.json';
import convergence from './doom/convergence.json';
import changing from './doom/changing.json';
import sundering from './doom/sundering.json';
import failing from './doom/failing.json';
import ascension from './doom/ascension.json';
import reckoning from './doom/reckoning.json';

// ─── Types ──────────────────────────────────────────────────────────

export interface DoomArchetypeJson {
  archetype: string;
  stageNames: string[];
  thresholds: number[];
}

// ─── Validation ─────────────────────────────────────────────────────

const VALID_ARCHETYPES = new Set<string>(DOOM_CLOCK_ARCHETYPES);

export function validateDoomJson(raw: unknown, filename: string): { archetype: DoomClockArchetype; stageNames: [string, string, string, string, string]; thresholds: number[] } {
  const data = raw as DoomArchetypeJson;

  if (!data.archetype || !VALID_ARCHETYPES.has(data.archetype)) {
    throw new Error(`${filename}: invalid archetype '${data.archetype}'`);
  }

  if (!Array.isArray(data.stageNames) || data.stageNames.length !== 5) {
    throw new Error(`${filename}: must have exactly 5 stage names, got ${data.stageNames?.length ?? 0}`);
  }

  if (!Array.isArray(data.thresholds) || data.thresholds.length !== 5) {
    throw new Error(`${filename}: must have exactly 5 thresholds`);
  }

  for (let i = 1; i < data.thresholds.length; i++) {
    if (data.thresholds[i] <= data.thresholds[i - 1]) {
      throw new Error(`${filename}: thresholds must be strictly ascending`);
    }
  }

  if (data.thresholds[4] !== 1.0) {
    throw new Error(`${filename}: last threshold must be 1.0, got ${data.thresholds[4]}`);
  }

  return {
    archetype: data.archetype as DoomClockArchetype,
    stageNames: data.stageNames as [string, string, string, string, string],
    thresholds: data.thresholds,
  };
}

// ─── Loader ─────────────────────────────────────────────────────────

const RAW_ARCHETYPES: Array<{ data: unknown; filename: string }> = [
  { data: breach, filename: 'breach.json' },
  { data: convergence, filename: 'convergence.json' },
  { data: changing, filename: 'changing.json' },
  { data: sundering, filename: 'sundering.json' },
  { data: failing, filename: 'failing.json' },
  { data: ascension, filename: 'ascension.json' },
  { data: reckoning, filename: 'reckoning.json' },
];

export function loadDoomArchetypes(): Record<DoomClockArchetype, [string, string, string, string, string]> {
  const result = {} as Record<DoomClockArchetype, [string, string, string, string, string]>;
  for (const { data, filename } of RAW_ARCHETYPES) {
    const validated = validateDoomJson(data, filename);
    result[validated.archetype] = validated.stageNames;
  }
  return result;
}
```

**Step 4: Run tests**

Run: `npx vitest run src/data/__tests__/doom-loader.test.ts`
Expected: All PASS

**Step 5: Commit**

```bash
git add src/data/doom-loader.ts src/data/__tests__/doom-loader.test.ts
git commit -m "feat: add doom archetype JSON loader with validation"
```

---

### Task 7: Rewire doom-content.ts to Delegate to Loader

Update `doom-content.ts` so `ARCHETYPE_STAGE_NAMES` is loaded from JSON. Keep `DOOM_VOCABULARY` and `DEFAULT_THRESHOLDS` in-place (shared data).

**Files:**
- Modify: `src/data/doom-content.ts`

**Step 1: Replace ARCHETYPE_STAGE_NAMES**

In `doom-content.ts`, replace the `ARCHETYPE_STAGE_NAMES` constant with:

```typescript
import { loadDoomArchetypes } from './doom-loader';

/** Archetype-specific stage names — loaded from JSON */
export const ARCHETYPE_STAGE_NAMES: Record<DoomClockArchetype, [string, string, string, string, string]> = loadDoomArchetypes();
```

Remove the hardcoded `ARCHETYPE_STAGE_NAMES` object (lines 15-23 of original).

Keep `DEFAULT_THRESHOLDS` and `DOOM_VOCABULARY` exactly as-is.

**Step 2: Run ALL existing doom tests**

Run: `npx vitest run src/data/__tests__/doom-content.test.ts src/engine/__tests__/content-full-integration.test.ts src/engine/__tests__/content-layer1-integration.test.ts`
Expected: All PASS

**Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/data/doom-content.ts
git commit -m "refactor: doom-content.ts delegates archetype data to JSON-backed loader"
```

---

### Task 8: Run Full Test Suite and Type Check

**Step 1: Run all tests**

Run: `npx vitest run`
Expected: All tests PASS, including all existing mandate and doom tests

**Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Run build**

Run: `npx vite build`
Expected: Build succeeds

**Step 4: Commit (if any fixes needed)**

Only commit if fixes were required. Otherwise, proceed.

---

### Task 9: Final Commit — Remove Dead Code

After confirming everything works, clean up any leftover dead code in `mandate-content.ts` (the old constants and prose record should have been fully replaced in Task 4).

**Step 1: Verify mandate-content.ts is clean**

Ensure it contains only the re-export, not the old 1000+ lines of constants.

**Step 2: Run full suite one more time**

Run: `npx vitest run && npx tsc --noEmit`
Expected: All pass

**Step 3: Final commit**

```bash
git add -A
git commit -m "chore: clean up after mandate/doom content pipeline migration"
```
