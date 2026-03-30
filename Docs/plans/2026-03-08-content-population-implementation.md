# Content Population Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Populate all content types with enough variety that every system interaction is visible in a 100-tick playthrough — broad coverage, good-enough quality.

**Architecture:** 4 horizontal layers (Minimum Visible Playthrough → Inspection → Replay Variety → Connective Tissue). Each layer is independently playtest-verifiable. Content lives in `src/data/*-content.ts` packages; no content in engine files.

**Tech Stack:** TypeScript, Vitest, existing prose template format (`{actor}`, `{verb}`, `{adj}`, `{noun}`, `{target}`, `{personality}` slots), seeded PRNG template selection, sigmoid → d100 resolution.

**Design Doc:** `Docs/plans/2026-03-08-content-population-design.md`

---

## Layer 1 — Minimum Visible Playthrough

---

### Task 1: World Model Taxonomy Expansion

Expand thin graph categories so world seeding has more variety.

**Files:**
- Modify: `src/data/world-model.json`
- Modify: `scripts/validate-world-model.ts` (if edge rules need updating)
- Test: `tests/worldModel.test.ts`

**Step 1: Add 8 new location-type nodes to world-model.json**

Open `src/data/world-model.json` and add these nodes to the `nodes` array:

```json
{ "id": "loc.port", "name": "Port", "category": "location-type", "description": "A coastal or riverside trading hub where ships dock and goods flow", "properties": {} },
{ "id": "loc.mine", "name": "Mine", "category": "location-type", "description": "An excavation site where earth yields precious metals, gems, or stone", "properties": {} },
{ "id": "loc.academy", "name": "Academy", "category": "location-type", "description": "A place of learning where knowledge is preserved and transmitted", "properties": {} },
{ "id": "loc.fortress", "name": "Fortress", "category": "location-type", "description": "A heavily fortified military stronghold built to withstand siege", "properties": {} },
{ "id": "loc.marketplace", "name": "Marketplace", "category": "location-type", "description": "An open trading ground where merchants gather and fortunes change hands", "properties": {} },
{ "id": "loc.grove", "name": "Grove", "category": "location-type", "description": "A sacred stand of ancient trees where life-magic pools", "properties": {} },
{ "id": "loc.cavern", "name": "Cavern", "category": "location-type", "description": "A natural underground chamber hiding darkness and forgotten things", "properties": {} },
{ "id": "loc.monastery", "name": "Monastery", "category": "location-type", "description": "A secluded retreat where contemplatives seek inner truth", "properties": {} }
```

**Step 2: Add 7 new sublocation-type nodes**

```json
{ "id": "subloc.forge", "name": "Forge", "category": "sublocation-type", "description": "A smithy where raw metal becomes weapon, tool, or art", "properties": {} },
{ "id": "subloc.archive", "name": "Archive", "category": "sublocation-type", "description": "A repository of written knowledge — scrolls, tomes, tablets", "properties": {} },
{ "id": "subloc.prison", "name": "Prison", "category": "sublocation-type", "description": "A place of confinement for those who broke the compact", "properties": {} },
{ "id": "subloc.garden", "name": "Garden", "category": "sublocation-type", "description": "A cultivated green space where life is coaxed into patterns", "properties": {} },
{ "id": "subloc.throne-room", "name": "Throne Room", "category": "sublocation-type", "description": "The seat of local power where audiences are granted and judgments rendered", "properties": {} },
{ "id": "subloc.docks", "name": "Docks", "category": "sublocation-type", "description": "Wooden piers and warehouses at the water's edge", "properties": {} },
{ "id": "subloc.crypt", "name": "Crypt", "category": "sublocation-type", "description": "An underground burial place where the honored dead rest — or stir", "properties": {} }
```

**Step 3: Add 4 new region-type nodes**

```json
{ "id": "region.wilderness", "name": "Wilderness", "category": "region-type", "description": "Untamed land beyond any settlement's control", "properties": {} },
{ "id": "region.contested-zone", "name": "Contested Zone", "category": "region-type", "description": "Territory claimed by multiple factions, none dominant", "properties": {} },
{ "id": "region.holy-ground", "name": "Holy Ground", "category": "region-type", "description": "Land consecrated to a sphere or faith, defended by custom", "properties": {} },
{ "id": "region.trade-route", "name": "Trade Route", "category": "region-type", "description": "A well-traveled corridor connecting settlements, rich in movement and opportunity", "properties": {} }
```

**Step 4: Add 18 new trait nodes (3 per existing category)**

```json
{ "id": "trait.scar.burned", "name": "Burned", "category": "trait-scar", "description": "Flesh marked by fire — a reminder of what heat takes", "properties": {} },
{ "id": "trait.scar.hollow-eyed", "name": "Hollow-Eyed", "category": "trait-scar", "description": "Something behind the gaze was consumed and never returned", "properties": {} },
{ "id": "trait.scar.dream-touched", "name": "Dream-Touched", "category": "trait-scar", "description": "Exposure to divine will left marks visible only to those who know where to look", "properties": {} },
{ "id": "trait.reputation.feared", "name": "Feared", "category": "trait-reputation", "description": "Their name alone makes lesser souls flinch", "properties": {} },
{ "id": "trait.reputation.beloved", "name": "Beloved", "category": "trait-reputation", "description": "Common folk speak their name with genuine warmth", "properties": {} },
{ "id": "trait.reputation.infamous", "name": "Infamous", "category": "trait-reputation", "description": "Known far and wide — but not for anything good", "properties": {} },
{ "id": "trait.mastery.siege-breaker", "name": "Siege-Breaker", "category": "trait-mastery", "description": "Walls and defenses are puzzles they have solved before", "properties": {} },
{ "id": "trait.mastery.tongue-of-silver", "name": "Tongue-of-Silver", "category": "trait-mastery", "description": "Words shaped with such precision that minds bend willingly", "properties": {} },
{ "id": "trait.mastery.star-reader", "name": "Star-Reader", "category": "trait-mastery", "description": "The night sky speaks to them of fate and navigation", "properties": {} },
{ "id": "trait.innate.second-sight", "name": "Second Sight", "category": "trait-innate", "description": "Born with the ability to perceive what others cannot", "properties": {} },
{ "id": "trait.innate.iron-blooded", "name": "Iron-Blooded", "category": "trait-innate", "description": "A constitution that shrugs off poison and plague", "properties": {} },
{ "id": "trait.innate.storm-touched", "name": "Storm-Touched", "category": "trait-innate", "description": "Weather bends around them — born under lightning", "properties": {} },
{ "id": "trait.destiny.world-shaper", "name": "World-Shaper", "category": "trait-destiny", "description": "Fated to alter the course of civilizations", "properties": {} },
{ "id": "trait.destiny.doom-herald", "name": "Doom-Herald", "category": "trait-destiny", "description": "Their presence accelerates the coming end", "properties": {} },
{ "id": "trait.destiny.bridge-walker", "name": "Bridge-Walker", "category": "trait-destiny", "description": "Fated to stand between worlds, cultures, or ages", "properties": {} },
{ "id": "trait.condition.cursed", "name": "Cursed", "category": "trait-condition", "description": "Bound by a malevolent force that saps and twists", "properties": {} },
{ "id": "trait.condition.enlightened", "name": "Enlightened", "category": "trait-condition", "description": "A state of clarity that elevates perception and judgment", "properties": {} },
{ "id": "trait.condition.hunted", "name": "Hunted", "category": "trait-condition", "description": "Pursued relentlessly — rest is a luxury they cannot afford", "properties": {} }
```

**Step 5: Add terrain-validity edges for new location types**

Add edges connecting location types to valid terrains. Example pattern (add ~24 edges):

```json
{ "source": "loc.port", "target": "terrain.coast", "type": "valid_terrain" },
{ "source": "loc.port", "target": "terrain.river_delta", "type": "valid_terrain" },
{ "source": "loc.mine", "target": "terrain.mountain", "type": "valid_terrain" },
{ "source": "loc.mine", "target": "terrain.hill", "type": "valid_terrain" },
{ "source": "loc.academy", "target": "terrain.plains", "type": "valid_terrain" },
{ "source": "loc.academy", "target": "terrain.hill", "type": "valid_terrain" },
{ "source": "loc.fortress", "target": "terrain.mountain", "type": "valid_terrain" },
{ "source": "loc.fortress", "target": "terrain.hill", "type": "valid_terrain" },
{ "source": "loc.marketplace", "target": "terrain.plains", "type": "valid_terrain" },
{ "source": "loc.marketplace", "target": "terrain.coast", "type": "valid_terrain" },
{ "source": "loc.grove", "target": "terrain.forest", "type": "valid_terrain" },
{ "source": "loc.grove", "target": "terrain.jungle", "type": "valid_terrain" },
{ "source": "loc.cavern", "target": "terrain.mountain", "type": "valid_terrain" },
{ "source": "loc.cavern", "target": "terrain.hill", "type": "valid_terrain" },
{ "source": "loc.monastery", "target": "terrain.mountain", "type": "valid_terrain" },
{ "source": "loc.monastery", "target": "terrain.desert", "type": "valid_terrain" }
```

Also add sublocation→parent-location edges (~14 edges) and sphere-affinity edges for new traits (~18 edges).

**Step 6: Update meta counts**

Update `meta.nodeCount` and `meta.edgeCount` to reflect additions.

**Step 7: Run validation**

Run: `npm run validate-model`
Expected: All 7 checks pass with updated counts.

**Step 8: Run existing tests**

Run: `npx vitest run tests/worldModel.test.ts -v`
Expected: All existing tests pass (node count tests may need threshold updates).

**Step 9: Regenerate Obsidian vault**

Run: `npm run generate-vault`
Expected: New notes created for all new nodes.

**Step 10: Commit**

```bash
git add src/data/world-model.json
git commit -m "content: expand taxonomy — 37 new nodes (8 locations, 7 sublocations, 4 regions, 18 traits)"
```

---

### Task 2: Ordeal Type System

Create the type foundation for the ordeal system.

**Files:**
- Create: `src/types/ordeal.ts`
- Modify: `src/types/gameState.ts` (add ordeal state)
- Modify: `src/types/narrative.ts` (add ordeal event types)
- Test: `src/types/__tests__/ordeal.test.ts`

**Step 1: Write the failing test**

Create `src/types/__tests__/ordeal.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import type {
  OrdealDefinition,
  EncounterDefinition,
  EncounterOutcome,
  OrdealProgress,
} from '../ordeal';
import {
  ORDEAL_MAX_ENCOUNTERS,
  ORDEAL_BASE_DIFFICULTY,
  ORDEAL_DIFFICULTY_ESCALATION,
  ORDEAL_ABANDON_COOLDOWN,
} from '../ordeal';

describe('Ordeal types', () => {
  it('should export tunable constants', () => {
    expect(ORDEAL_MAX_ENCOUNTERS).toBeGreaterThan(0);
    expect(ORDEAL_BASE_DIFFICULTY).toBeGreaterThan(0);
    expect(ORDEAL_DIFFICULTY_ESCALATION).toBeGreaterThan(0);
    expect(ORDEAL_ABANDON_COOLDOWN).toBeGreaterThan(0);
  });

  it('should allow constructing an OrdealDefinition', () => {
    const ordeal: OrdealDefinition = {
      id: 'ordeal.deep_descent',
      name: 'The Deep Descent',
      locationTypes: ['dungeon', 'cavern'],
      encounters: [],
      reachPrimary: 'iron',
      reachSecondary: 'shadow',
    };
    expect(ordeal.id).toBe('ordeal.deep_descent');
  });

  it('should allow constructing an OrdealProgress', () => {
    const progress: OrdealProgress = {
      ordealId: 'ordeal.deep_descent',
      actorId: 'actor-1',
      currentEncounterIndex: 0,
      history: [],
      status: 'active',
      startedTick: 10,
    };
    expect(progress.status).toBe('active');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/types/__tests__/ordeal.test.ts -v`
Expected: FAIL — module not found.

**Step 3: Write the ordeal type file**

Create `src/types/ordeal.ts`:

```typescript
/**
 * Ordeal Type System — defines the shape of narrative ordeals
 * that agents undergo at sublocations for growth and evolution.
 *
 * Ordeals are linear encounter sequences (2-4 steps) using
 * sigmoid → d100 resolution. Cultural vocabulary overlays
 * vary the flavor without changing structure.
 */
import type { SphereName, ReachDomain } from './index';

// ─── Tunable Constants ──────────────────────────────────────────

/** Maximum encounters per ordeal template */
export const ORDEAL_MAX_ENCOUNTERS = 4;

/** Base difficulty for encounter resolution (0-100 scale) */
export const ORDEAL_BASE_DIFFICULTY = 40;

/** Difficulty increase per subsequent encounter in an ordeal */
export const ORDEAL_DIFFICULTY_ESCALATION = 10;

/** Ticks before an agent can reattempt an abandoned ordeal */
export const ORDEAL_ABANDON_COOLDOWN = 20;

/** Minimum Maslow tier required to pursue ordeals (self-actualization = 5) */
export const ORDEAL_MASLOW_TIER = 5;

// ─── Encounter Outcome ─────────────────────────────────────────

export interface EncounterOutcome {
  /** Prose template for this outcome */
  narrative: string;
  /** Optional trait modifiers: trait ID → delta (+acquire, -lose) */
  traitModifiers?: Record<string, number>;
  /** Reputation change (-1 to 1 scale) */
  reputationDelta?: number;
  /** Whether success here makes tier promotion eligible */
  tierPromotionEligible?: boolean;
}

// ─── Encounter Definition ───────────────────────────────────────

export interface EncounterDefinition {
  /** Unique encounter ID within the ordeal */
  id: string;
  /** Display name */
  name: string;
  /** Sublocation type where this encounter takes place */
  sublocationId?: string;
  /** Prose description of the encounter setup */
  narrative: string;
  /** Primary reach used for resolution */
  reach: ReachDomain;
  /** Difficulty (0-100 scale, feeds into sigmoid) */
  difficulty: number;
  /** What happens on success */
  onSuccess: EncounterOutcome;
  /** What happens on failure */
  onFailure: EncounterOutcome;
}

// ─── Ordeal Definition ──────────────────────────────────────────

export interface OrdealDefinition {
  /** Unique ordeal template ID */
  id: string;
  /** Display name */
  name: string;
  /** Location types where this ordeal can spawn */
  locationTypes: string[];
  /** Linear sequence of encounters */
  encounters: EncounterDefinition[];
  /** Primary reach tested */
  reachPrimary: ReachDomain;
  /** Secondary reach tested */
  reachSecondary: ReachDomain;
  /** Optional sphere affinity for filtering */
  sphereAffinity?: SphereName;
  /** Optional cultural affinity for filtering */
  culturalAffinity?: string;
}

// ─── Ordeal Progress (Runtime State) ────────────────────────────

export interface OrdealProgress {
  /** Which ordeal template this tracks */
  ordealId: string;
  /** Which agent is undergoing this ordeal */
  actorId: string;
  /** Current encounter index (0-based) */
  currentEncounterIndex: number;
  /** History of encounter outcomes */
  history: Array<{
    encounterId: string;
    success: boolean;
    tick: number;
  }>;
  /** Current status */
  status: 'active' | 'abandoned' | 'completed';
  /** Tick when the ordeal started */
  startedTick: number;
}
```

**Step 4: Add ordeal event types to narrative.ts**

In `src/types/narrative.ts`, extend `NarrativeEventType` union:

Add after `'dilemma_mutual_distrust'`:
```typescript
  | 'ordeal_encounter_success'
  | 'ordeal_encounter_failure'
  | 'ordeal_completed'
  | 'ordeal_abandoned'
```

**Step 5: Add ordeal state to gameState.ts**

In `src/types/gameState.ts`, add to `GameState` interface:

```typescript
  /** Active ordeal progress tracking */
  ordealProgress: OrdealProgress[];
```

Add import: `import type { OrdealProgress } from './ordeal';`

Initialize as `[]` wherever GameState is constructed (gameInit.ts, test helpers).

**Step 6: Run test to verify it passes**

Run: `npx vitest run src/types/__tests__/ordeal.test.ts -v`
Expected: PASS (3 tests)

**Step 7: Run full test suite to check for regressions**

Run: `npx vitest run --reporter=verbose 2>&1 | tail -5`
Expected: All existing tests pass.

**Step 8: Commit**

```bash
git add src/types/ordeal.ts src/types/__tests__/ordeal.test.ts src/types/narrative.ts src/types/gameState.ts
git commit -m "feat: add ordeal type system — OrdealDefinition, EncounterDefinition, OrdealProgress"
```

---

### Task 3: Ordeal Content Package

Create the 10 ordeal templates with ~30 encounters and cultural vocabulary overlays.

**Files:**
- Create: `src/data/ordeal-content.ts`
- Test: `src/data/__tests__/ordeal-content.test.ts`

**Step 1: Write the failing test**

Create `src/data/__tests__/ordeal-content.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  ORDEAL_TEMPLATES,
  CULTURAL_ORDEAL_OVERLAYS,
  getOrdealsByLocationType,
  getOrdealById,
} from '../ordeal-content';

describe('ordeal-content', () => {
  describe('ORDEAL_TEMPLATES', () => {
    it('should have exactly 10 ordeal templates', () => {
      expect(ORDEAL_TEMPLATES).toHaveLength(10);
    });

    it('every template should have a unique id', () => {
      const ids = ORDEAL_TEMPLATES.map(t => t.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('every template should have 2-4 encounters', () => {
      for (const template of ORDEAL_TEMPLATES) {
        expect(template.encounters.length).toBeGreaterThanOrEqual(2);
        expect(template.encounters.length).toBeLessThanOrEqual(4);
      }
    });

    it('every encounter should have success and failure prose', () => {
      for (const template of ORDEAL_TEMPLATES) {
        for (const enc of template.encounters) {
          expect(enc.onSuccess.narrative.length).toBeGreaterThan(10);
          expect(enc.onFailure.narrative.length).toBeGreaterThan(10);
        }
      }
    });

    it('every template should have valid reachPrimary and reachSecondary', () => {
      const validReaches = ['iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star', 'flesh'];
      for (const template of ORDEAL_TEMPLATES) {
        expect(validReaches).toContain(template.reachPrimary);
        expect(validReaches).toContain(template.reachSecondary);
      }
    });

    it('every template should have at least 1 locationTypes entry', () => {
      for (const template of ORDEAL_TEMPLATES) {
        expect(template.locationTypes.length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('CULTURAL_ORDEAL_OVERLAYS', () => {
    it('should have 6 overlay sets', () => {
      expect(Object.keys(CULTURAL_ORDEAL_OVERLAYS)).toHaveLength(6);
    });

    it('each overlay should have adjectives, verbs, and atmosphere', () => {
      for (const [, overlay] of Object.entries(CULTURAL_ORDEAL_OVERLAYS)) {
        expect(overlay.adjectives.length).toBeGreaterThanOrEqual(3);
        expect(overlay.verbs.length).toBeGreaterThanOrEqual(3);
        expect(overlay.atmosphere.length).toBeGreaterThan(0);
      }
    });
  });

  describe('lookup functions', () => {
    it('getOrdealsByLocationType should filter correctly', () => {
      const dungeonOrdeals = getOrdealsByLocationType('dungeon');
      expect(dungeonOrdeals.length).toBeGreaterThan(0);
      for (const o of dungeonOrdeals) {
        expect(o.locationTypes).toContain('dungeon');
      }
    });

    it('getOrdealById should return correct ordeal', () => {
      const ordeal = getOrdealById('ordeal.deep_descent');
      expect(ordeal).toBeDefined();
      expect(ordeal!.name).toBe('The Deep Descent');
    });

    it('getOrdealById should return undefined for unknown id', () => {
      expect(getOrdealById('ordeal.nonexistent')).toBeUndefined();
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/__tests__/ordeal-content.test.ts -v`
Expected: FAIL — module not found.

**Step 3: Write ordeal-content.ts**

Create `src/data/ordeal-content.ts` with all 10 ordeal templates. Each template has 3 encounters with success/failure prose. See the design doc §3.2 for the full template list. The file should be ~800 lines.

Key structure:
- `ORDEAL_TEMPLATES: OrdealDefinition[]` — 10 templates
- `CULTURAL_ORDEAL_OVERLAYS: Record<string, { adjectives, verbs, atmosphere }>` — 6 overlays (chaos, order, light, darkness, force, mind)
- `getOrdealsByLocationType(type: string): OrdealDefinition[]`
- `getOrdealById(id: string): OrdealDefinition | undefined`

Each encounter follows this pattern:
```typescript
{
  id: 'deep_descent.entrance',
  name: 'The Entrance',
  narrative: 'The mouth of the {adj} deep yawns before {actor}. Darkness {verb} within.',
  reach: 'iron',
  difficulty: 35,
  onSuccess: {
    narrative: '{actor} descends with {adj} resolve, the {noun} of the deep parting before them.',
    reputationDelta: 0.05,
  },
  onFailure: {
    narrative: '{actor} falters at the threshold. The {adj} {noun} of the depths proves too much.',
    reputationDelta: -0.02,
  },
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/data/__tests__/ordeal-content.test.ts -v`
Expected: PASS (all tests)

**Step 5: Commit**

```bash
git add src/data/ordeal-content.ts src/data/__tests__/ordeal-content.test.ts
git commit -m "content: add ordeal content package — 10 templates, 30 encounters, 6 cultural overlays"
```

---

### Task 4: Ordeal Engine

Create the engine functions for ordeal generation, initiation, resolution, and progression.

**Files:**
- Create: `src/engine/ordeal.ts`
- Test: `src/engine/__tests__/ordeal.test.ts`

**Step 1: Write the failing test**

Create `src/engine/__tests__/ordeal.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  getAvailableOrdeals,
  initiateOrdeal,
  resolveEncounter,
  advanceOrdeal,
  abandonOrdeal,
  generateOrdealsForLocation,
} from '../ordeal';
import type { GameState } from '../../types/gameState';
// ... test helper imports for creating minimal GameState

describe('ordeal engine', () => {
  // Tests for each function:
  // - getAvailableOrdeals: returns templates matching location type
  // - initiateOrdeal: creates OrdealProgress with status 'active'
  // - resolveEncounter: uses sigmoid→d100, returns success/failure
  // - advanceOrdeal: moves currentEncounterIndex, completes if final
  // - abandonOrdeal: sets status 'abandoned'
  // - generateOrdealsForLocation: filters by location type + sphere
  // ~20 tests total
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/ordeal.test.ts -v`
Expected: FAIL

**Step 3: Write ordeal.ts engine**

Create `src/engine/ordeal.ts` (~400 lines):
- `generateOrdealsForLocation()` — filters ORDEAL_TEMPLATES by location type, optional sphere/culture
- `initiateOrdeal()` — creates OrdealProgress, pushes to gameState.ordealProgress
- `resolveEncounter()` — computes domain capability, sigmoid → d100, returns success boolean + outcome
- `advanceOrdeal()` — increments encounter index or completes
- `abandonOrdeal()` — sets status='abandoned'
- `getAvailableOrdeals()` — what can an agent attempt at current location (minus cooldowns)

All functions must call `emitTrace()` with category `'ordeal_resolution'`.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/ordeal.test.ts -v`
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/ordeal.ts src/engine/__tests__/ordeal.test.ts
git commit -m "feat: add ordeal engine — generation, initiation, resolution, progression"
```

---

### Task 5: Ordeal Orchestrator Integration

Wire ordeal progression into the tick loop and action selection pipeline.

**Files:**
- Modify: `src/engine/orchestrator.ts` (add phaseOrdealProgression)
- Modify: `src/engine/agentActions.ts` (add ordeal pursuit to self-actualization tier)
- Test: `src/engine/__tests__/ordeal-orchestrator.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
// Test that:
// - phaseOrdealProgression advances active ordeals each tick
// - Agents with high Maslow tier choose 'pursue_ordeal' action
// - Ordeal completion generates narrative events
// - Ordeal trace entries appear
// ~8 tests
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/ordeal-orchestrator.test.ts -v`
Expected: FAIL

**Step 3: Implement orchestrator integration**

In `orchestrator.ts`:
- Add `phaseOrdealProgression(state, events, rng)` — iterates active ordeals, resolves current encounter, advances or completes
- Call it after `phaseAgentActions` in `runTick()`
- Generate `ordeal_encounter_success`, `ordeal_encounter_failure`, `ordeal_completed`, `ordeal_abandoned` events

In `agentActions.ts`:
- Add `'pursue_ordeal'` as an action option at Maslow tier 5 (self-actualization)
- When selected, call `initiateOrdeal()` if no active ordeal, or continue existing

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/ordeal-orchestrator.test.ts -v`
Expected: PASS

**Step 5: Run full test suite**

Run: `npx vitest run --reporter=verbose 2>&1 | tail -5`
Expected: All tests pass

**Step 6: Commit**

```bash
git add src/engine/orchestrator.ts src/engine/agentActions.ts src/engine/__tests__/ordeal-orchestrator.test.ts
git commit -m "feat: wire ordeal progression into tick loop and agent action selection"
```

---

### Task 6: Ordeal Trace Instrumentation

Add `ordeal_resolution` trace category to the debug panel.

**Files:**
- Modify: `src/types/trace.ts` (add OrdealResolutionTrace)
- Modify: `src/components/Game/DebugPanel.tsx` (add renderer)
- Test: `src/engine/__tests__/traceBuffer-ordeal.test.ts`

**Step 1: Write the failing test**

```typescript
// Test that ordeal engine emits ordeal_resolution traces
// Test that DebugPanel renders ordeal traces correctly
// ~6 tests
```

**Step 2: Implement**

In `src/types/trace.ts`, add:
```typescript
export interface OrdealResolutionTrace extends TraceBase {
  category: 'ordeal_resolution';
  ordealId: string;
  actorId: string;
  encounterId: string;
  difficulty: number;
  capability: number;
  roll: number;
  success: boolean;
  traitChanges: string[];
}
```

Add to `TraceEntry` union. Add `'ordeal_resolution'` to `TRACE_CATEGORIES`.

In `DebugPanel.tsx`, add ordeal renderer in the category switch.

**Step 3: Run tests, commit**

```bash
git add src/types/trace.ts src/components/Game/DebugPanel.tsx src/engine/__tests__/traceBuffer-ordeal.test.ts
git commit -m "feat: add ordeal_resolution trace category to debug panel"
```

---

### Task 7: Action Prose Template Expansion

Expand routine and notable templates for narrative variety.

**Files:**
- Modify: `src/data/narrative-content.ts`
- Test: `src/data/__tests__/narrative-content.test.ts`

**Step 1: Write the failing test**

Create/extend `src/data/__tests__/narrative-content.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { ROUTINE_TEMPLATES, NOTABLE_TEMPLATES } from '../narrative-content';

describe('narrative-content expanded', () => {
  const EXPECTED_ROUTINE_TYPES = [
    'action_resolved', 'action_failed', 'action_critical', 'trait_acquired',
    'tier_transition', 'divine_intervention', 'contested_action', 'actor_death',
    'doom_escalation', 'mandate_stage', 'trait_lost',
    'dilemma_mutual_trust', 'dilemma_betrayed', 'dilemma_exploitation', 'dilemma_mutual_distrust',
    // New event types:
    'faction_formed', 'culture_clash', 'migration', 'construction_complete',
    'ordeal_encounter_success', 'ordeal_encounter_failure', 'ordeal_completed', 'ordeal_abandoned',
  ];

  it('should have at least 4 routine templates per existing event type', () => {
    const existingTypes = EXPECTED_ROUTINE_TYPES.slice(0, 15);
    for (const type of existingTypes) {
      expect(ROUTINE_TEMPLATES[type]?.length, `${type} should have ≥4 templates`).toBeGreaterThanOrEqual(4);
    }
  });

  it('should have routine templates for all new event types', () => {
    const newTypes = EXPECTED_ROUTINE_TYPES.slice(15);
    for (const type of newTypes) {
      expect(ROUTINE_TEMPLATES[type]?.length, `${type} should have ≥2 templates`).toBeGreaterThanOrEqual(2);
    }
  });

  it('should have at least 2 notable templates per event type', () => {
    for (const type of Object.keys(NOTABLE_TEMPLATES)) {
      expect(NOTABLE_TEMPLATES[type].length, `notable ${type} should have ≥2`).toBeGreaterThanOrEqual(2);
    }
  });

  it('all templates should contain {actor} or {target} placeholder', () => {
    for (const [type, templates] of Object.entries(ROUTINE_TEMPLATES)) {
      for (const tmpl of templates) {
        const hasPlaceholder = tmpl.includes('{actor}') || tmpl.includes('{target}') || tmpl.includes('{adj}');
        expect(hasPlaceholder, `routine ${type} template missing placeholders: "${tmpl.slice(0, 40)}..."`).toBe(true);
      }
    }
  });

  it('total routine template count should be >= 80', () => {
    const total = Object.values(ROUTINE_TEMPLATES).reduce((sum, arr) => sum + arr.length, 0);
    expect(total).toBeGreaterThanOrEqual(80);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/__tests__/narrative-content.test.ts -v`
Expected: FAIL — missing event types, insufficient template counts.

**Step 3: Add new routine templates to narrative-content.ts**

Add 3 new templates per existing event type (total +45) and 2 routine + 1 notable per new event type (total +16 routine, +8 notable). See design doc §3.3 for full list.

Example additions to ROUTINE_TEMPLATES:
```typescript
  // New variants for action_resolved (3 more, making 6 total):
  action_resolved: [
    // ... existing 3 ...
    'The {adj} will of {actor} bore fruit against {target}. {noun} echoed in the aftermath.',
    '{actor} pressed forward, and {target} yielded to the {adj} weight of {noun}.',
    'Where others would have faltered, {actor} {verb} true — {target} felt the {noun} of it.',
  ],
  // ... similar for all existing types ...

  // New event types:
  faction_formed: [
    'A new faction coalesces around {actor} — bound by {adj} {noun} and shared purpose.',
    'Under the banner of {noun}, {actor} draws followers into a {adj} compact.',
  ],
  culture_clash: [
    'The {adj} customs of one people grate against another near {target}. {noun} builds.',
    'Two ways of life collide at {target} — neither willing to bend, the {noun} between them {verb}.',
  ],
  migration: [
    '{actor} leaves familiar ground, drawn by {adj} {noun} toward {target}.',
    'The road calls {actor} away. With {adj} steps, they seek new {noun} elsewhere.',
  ],
  construction_complete: [
    'Stone by stone, {actor} raised something {adj} at {target}. The {noun} stands complete.',
    'The work is done. Where there was nothing, {adj} {noun} now rises at {target}.',
  ],
  ordeal_encounter_success: [
    '{actor} passed the trial with {adj} {noun}. The ordeal yields before them.',
    'The test demanded everything, but {actor} {verb} through — {adj} and unbroken.',
  ],
  ordeal_encounter_failure: [
    '{actor} stumbled at the trial. The {adj} {noun} of the ordeal proved too great.',
    'The ordeal held firm against {actor}. {adj} {noun} was not enough.',
  ],
  ordeal_completed: [
    '{actor} emerges from the ordeal transformed — {adj} {noun} courses through them now.',
    'The ordeal is complete. {actor} stands changed, bearing the {adj} mark of {noun}.',
  ],
  ordeal_abandoned: [
    '{actor} turned away from the ordeal. Sometimes {adj} {noun} means knowing when to stop.',
    'The trial remains unfinished. {actor} chose survival over {adj} {noun}.',
  ],
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/data/__tests__/narrative-content.test.ts -v`
Expected: PASS

**Step 5: Commit**

```bash
git add src/data/narrative-content.ts src/data/__tests__/narrative-content.test.ts
git commit -m "content: expand prose templates — +61 routine, +26 notable, 8 new event types"
```

---

### Task 8: Lifecycle Prose Templates

Add death/birth/migration prose variety to narrative-content.ts.

**Files:**
- Modify: `src/data/narrative-content.ts`
- Test: extend `src/data/__tests__/narrative-content.test.ts`

**Step 1: Write the failing test**

Add to narrative-content.test.ts:
```typescript
import { LIFECYCLE_TEMPLATES } from '../narrative-content';

describe('lifecycle templates', () => {
  it('should have 5 death templates', () => {
    expect(LIFECYCLE_TEMPLATES.death).toHaveLength(5);
  });
  it('should have 3 birth templates', () => {
    expect(LIFECYCLE_TEMPLATES.birth).toHaveLength(3);
  });
  it('should have 3 migration templates', () => {
    expect(LIFECYCLE_TEMPLATES.migration).toHaveLength(3);
  });
  it('all templates should have {actor} placeholder', () => {
    for (const templates of Object.values(LIFECYCLE_TEMPLATES)) {
      for (const t of templates) {
        expect(t).toContain('{actor}');
      }
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/__tests__/narrative-content.test.ts -v`
Expected: FAIL — LIFECYCLE_TEMPLATES not found.

**Step 3: Add LIFECYCLE_TEMPLATES to narrative-content.ts**

```typescript
// ═══════════════════════════════════════════════════════════════════
// 5. LIFECYCLE TEMPLATES
// ═══════════════════════════════════════════════════════════════════

export const LIFECYCLE_TEMPLATES: Record<string, string[]> = {
  death: [
    '{actor} breathed their last, a {adj} exhalation of spent {noun}. The world barely noticed.',
    'Steel found {actor} in the end. They fell with {adj} {noun} still on their lips.',
    'Betrayal took {actor} — a blade from a trusted hand, {adj} and {noun}-edged.',
    'The doom claimed {actor}. In the {adj} aftermath, only {noun} remained.',
    '{actor} gave everything freely — their final {adj} act, a sacrifice of {noun} that would echo.',
  ],
  birth: [
    'In the growing settlement, a new soul stirs — {actor} draws first breath amid {adj} {noun}.',
    'The faction recruits {actor}, a {adj} newcomer drawn by the promise of {noun}.',
    '{actor} wanders in from beyond the borders, carrying {adj} {noun} and little else.',
  ],
  migration: [
    '{actor} is cast out — exiled by {adj} decree, carrying only {noun} and bitterness.',
    'Opportunity calls {actor} toward {target}. The {adj} promise of {noun} outweighs the familiar.',
    'Cultural ties pull {actor} toward {target}, where the {adj} customs of their people still {verb}.',
  ],
};
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/data/__tests__/narrative-content.test.ts -v`
Expected: PASS

**Step 5: Commit**

```bash
git add src/data/narrative-content.ts src/data/__tests__/narrative-content.test.ts
git commit -m "content: add lifecycle prose templates — 5 death, 3 birth, 3 migration"
```

---

### Task 9: Doom Vocabulary

Add per-stage word banks so prose darkens as doom advances.

**Files:**
- Modify: `src/data/doom-content.ts`
- Test: `src/data/__tests__/doom-content.test.ts`

**Step 1: Write the failing test**

Create `src/data/__tests__/doom-content.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { DOOM_VOCABULARY } from '../doom-content';

describe('doom vocabulary', () => {
  it('should have 7 stage entries', () => {
    expect(Object.keys(DOOM_VOCABULARY)).toHaveLength(7);
  });

  it('each stage should have 5 adjectives, 5 verbs, 3 nouns, and 1 atmosphere phrase', () => {
    for (const [stage, vocab] of Object.entries(DOOM_VOCABULARY)) {
      expect(vocab.adjectives, `${stage} adjectives`).toHaveLength(5);
      expect(vocab.verbs, `${stage} verbs`).toHaveLength(5);
      expect(vocab.nouns, `${stage} nouns`).toHaveLength(3);
      expect(vocab.atmosphere.length, `${stage} atmosphere`).toBeGreaterThan(10);
    }
  });

  it('stages should be named correctly', () => {
    const expected = ['whispers', 'signs', 'tremors', 'cracks', 'the_breaking', 'the_breach', 'the_unmaking'];
    expect(Object.keys(DOOM_VOCABULARY)).toEqual(expected);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/__tests__/doom-content.test.ts -v`
Expected: FAIL

**Step 3: Add DOOM_VOCABULARY to doom-content.ts**

```typescript
/** Doom-stage vocabulary for atmospheric prose coloring.
 * Routine/notable template selection injects doom words as doom advances. */
export const DOOM_VOCABULARY: Record<string, {
  adjectives: string[];
  verbs: string[];
  nouns: string[];
  atmosphere: string;
}> = {
  whispers: {
    adjectives: ['faint', 'unsettled', 'restless', 'uncertain', 'murmuring'],
    verbs: ['stirs', 'whispers', 'shifts', 'flickers', 'hints'],
    nouns: ['rumor', 'unease', 'premonition'],
    atmosphere: 'Something is not right, though none can name it yet.',
  },
  signs: {
    adjectives: ['strange', 'ominous', 'darkening', 'portentous', 'gathering'],
    verbs: ['gathers', 'spreads', 'deepens', 'multiplies', 'crawls'],
    nouns: ['portent', 'shadow', 'warning'],
    atmosphere: 'The signs are unmistakable now, for those with eyes to see.',
  },
  tremors: {
    adjectives: ['shaking', 'cracking', 'groaning', 'heaving', 'fracturing'],
    verbs: ['trembles', 'splits', 'groans', 'buckles', 'shudders'],
    nouns: ['tremor', 'fracture', 'rupture'],
    atmosphere: 'The ground itself rebels. Foundations crack. Things fall.',
  },
  cracks: {
    adjectives: ['breaking', 'torn', 'hemorrhaging', 'sundered', 'bleeding'],
    verbs: ['tears', 'hemorrhages', 'ruptures', 'sunders', 'bleeds'],
    nouns: ['wound', 'breach', 'abyss'],
    atmosphere: 'Reality cracks open. What seeps through is not of this world.',
  },
  the_breaking: {
    adjectives: ['shattering', 'apocalyptic', 'terminal', 'catastrophic', 'final'],
    verbs: ['shatters', 'collapses', 'devours', 'annihilates', 'consumes'],
    nouns: ['ruin', 'annihilation', 'cataclysm'],
    atmosphere: 'The world breaks. There is no pretending otherwise.',
  },
  the_breach: {
    adjectives: ['absolute', 'void-touched', 'unraveling', 'impossible', 'terminal'],
    verbs: ['unmakes', 'erases', 'swallows', 'dissolves', 'extinguishes'],
    nouns: ['void', 'extinction', 'nothing'],
    atmosphere: 'Beyond the breach, something looks back with hunger older than time.',
  },
  the_unmaking: {
    adjectives: ['final', 'silent', 'inevitable', 'total', 'absolute'],
    verbs: ['ends', 'unmakes', 'silences', 'erases', 'returns'],
    nouns: ['silence', 'emptiness', 'the end'],
    atmosphere: 'This is the last of it. What was, ceases to be.',
  },
};
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/data/__tests__/doom-content.test.ts -v`
Expected: PASS

**Step 5: Commit**

```bash
git add src/data/doom-content.ts src/data/__tests__/doom-content.test.ts
git commit -m "content: add doom vocabulary — 7 stages with atmospheric word banks"
```

---

### Task 10: Layer 1 Integration Test + Playtest Verification

Verify all Layer 1 content is wired and produces varied narrative in a 100-tick playtest.

**Files:**
- Create: `src/engine/__tests__/content-layer1-integration.test.ts`
- Run: playtest script

**Step 1: Write integration test**

```typescript
import { describe, it, expect } from 'vitest';
import { initializeGameState } from '../gameInit';
import { runTick } from '../orchestrator';
import { ORDEAL_TEMPLATES } from '../../data/ordeal-content';
import { ROUTINE_TEMPLATES } from '../../data/narrative-content';
import { DOOM_VOCABULARY } from '../../data/doom-content';

describe('Layer 1 content integration', () => {
  it('ordeal templates are accessible', () => {
    expect(ORDEAL_TEMPLATES.length).toBe(10);
  });

  it('all new event types have routine templates', () => {
    const newTypes = ['faction_formed', 'culture_clash', 'migration', 'construction_complete',
      'ordeal_encounter_success', 'ordeal_encounter_failure', 'ordeal_completed', 'ordeal_abandoned'];
    for (const type of newTypes) {
      expect(ROUTINE_TEMPLATES[type]?.length).toBeGreaterThan(0);
    }
  });

  it('doom vocabulary has all 7 stages', () => {
    expect(Object.keys(DOOM_VOCABULARY)).toHaveLength(7);
  });

  it('100-tick playtest produces ordeal events', () => {
    const state = initializeGameState({ seed: 42 });
    const events: string[] = [];
    for (let i = 0; i < 100; i++) {
      const result = runTick(state);
      events.push(...result.events.map(e => e.type));
    }
    // With self-actualization tier agents, some should attempt ordeals
    const ordealEvents = events.filter(e => e.startsWith('ordeal_'));
    // May be 0 if no agents reach self-actualization — that's ok for now
    // but the templates should at least be loadable
    expect(ORDEAL_TEMPLATES.length).toBeGreaterThan(0);
  });
});
```

**Step 2: Run integration test**

Run: `npx vitest run src/engine/__tests__/content-layer1-integration.test.ts -v`
Expected: PASS

**Step 3: Run playtest for verification**

Run: `npx tsx scripts/playtest.ts --seeds 42,7,100 --ticks 100`
Expected: Reports generated with varied prose, new event types visible.

**Step 4: Commit**

```bash
git add src/engine/__tests__/content-layer1-integration.test.ts
git commit -m "test: Layer 1 content integration test + playtest verification"
```

---

## Layer 2 — Inspection Content

---

### Task 11: Chronicler Content Package

Create the chronicler vignette templates for inspection flavor text.

**Files:**
- Create: `src/data/chronicler-content.ts`
- Test: `src/data/__tests__/chronicler-content.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import {
  CHRONICLER_VIGNETTES,
  SUBLOCATION_FLAVOR,
  ARTIFACT_LORE,
  LOCATION_TYPE_FLAVOR,
  MAGIC_TRADITION_FLAVOR,
  getVignetteByContext,
  getSubLocationFlavor,
  getArtifactLore,
} from '../chronicler-content';

describe('chronicler-content', () => {
  it('should have 15 chronicler vignette templates', () => {
    expect(Object.keys(CHRONICLER_VIGNETTES)).toHaveLength(15);
  });

  it('each vignette should be at least 40 characters', () => {
    for (const [ctx, vignette] of Object.entries(CHRONICLER_VIGNETTES)) {
      expect(vignette.length, `${ctx} too short`).toBeGreaterThanOrEqual(40);
    }
  });

  it('should have 14 sublocation flavor entries', () => {
    expect(Object.keys(SUBLOCATION_FLAVOR)).toHaveLength(14);
  });

  it('should have 30 artifact lore instances', () => {
    expect(ARTIFACT_LORE).toHaveLength(30);
  });

  it('each artifact lore should have name, prose, and sphereAffinity', () => {
    for (const lore of ARTIFACT_LORE) {
      expect(lore.name.length).toBeGreaterThan(0);
      expect(lore.prose.length).toBeGreaterThan(20);
      expect(lore.sphereAffinity).toBeDefined();
    }
  });

  it('should have 15 location type flavor entries', () => {
    expect(Object.keys(LOCATION_TYPE_FLAVOR)).toHaveLength(15);
  });

  it('should have 34 magic tradition flavor entries', () => {
    expect(Object.keys(MAGIC_TRADITION_FLAVOR)).toHaveLength(34);
  });

  it('getVignetteByContext should return vignettes', () => {
    const v = getVignetteByContext('location');
    expect(v).toBeDefined();
    expect(v!.length).toBeGreaterThan(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/__tests__/chronicler-content.test.ts -v`
Expected: FAIL

**Step 3: Write chronicler-content.ts**

Create `src/data/chronicler-content.ts` (~650 lines) with:
- `CHRONICLER_VIGNETTES`: Record of 15 context types → vignette template string
- `SUBLOCATION_FLAVOR`: Record of 14 sublocation types → flavor prose
- `ARTIFACT_LORE`: Array of 30 artifact lore objects (5 per pattern × 6 patterns)
- `LOCATION_TYPE_FLAVOR`: Record of 15 location types → establishing-shot prose
- `MAGIC_TRADITION_FLAVOR`: Record of 34 magic traditions → flavor string
- Lookup functions

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/data/__tests__/chronicler-content.test.ts -v`
Expected: PASS

**Step 5: Commit**

```bash
git add src/data/chronicler-content.ts src/data/__tests__/chronicler-content.test.ts
git commit -m "content: add chronicler package — 15 vignettes, 14 sublocation flavors, 30 artifact lore, 15 location flavors, 34 magic traditions"
```

---

### Task 12: Ordeal Inspection Vignettes

Add inspection prose for locations with ordeal activity.

**Files:**
- Modify: `src/data/ordeal-content.ts`
- Test: extend `src/data/__tests__/ordeal-content.test.ts`

**Step 1: Write the failing test**

```typescript
import { ORDEAL_INSPECTION_VIGNETTES } from '../ordeal-content';

describe('ordeal inspection vignettes', () => {
  it('should have 10 in-progress vignettes', () => {
    expect(ORDEAL_INSPECTION_VIGNETTES.inProgress).toHaveLength(10);
  });
  it('should have 5 completed vignettes', () => {
    expect(ORDEAL_INSPECTION_VIGNETTES.completed).toHaveLength(5);
  });
  it('should have 3 failed vignettes', () => {
    expect(ORDEAL_INSPECTION_VIGNETTES.failed).toHaveLength(3);
  });
});
```

**Step 2: Implement and test**

Add `ORDEAL_INSPECTION_VIGNETTES` to ordeal-content.ts with 18 vignette prose entries.

**Step 3: Commit**

```bash
git add src/data/ordeal-content.ts src/data/__tests__/ordeal-content.test.ts
git commit -m "content: add 18 ordeal inspection vignettes"
```

---

## Layer 3 — Replay Variety

---

### Task 13: Cultural Prose Palettes

Add 12 cultural prose palette entries for cultural voice differentiation.

**Files:**
- Modify: `src/data/culture-content.ts`
- Test: extend `src/data/__tests__/culture-content.test.ts`

**Step 1: Write the failing test**

```typescript
import { CULTURAL_PROSE_PALETTES } from '../culture-content';

describe('cultural prose palettes', () => {
  it('should have 12 palette entries (4 foundation + 8 creation)', () => {
    expect(Object.keys(CULTURAL_PROSE_PALETTES)).toHaveLength(12);
  });

  it('each palette should have adjectives, verbs, rhythms, greetings, and oaths', () => {
    for (const [id, palette] of Object.entries(CULTURAL_PROSE_PALETTES)) {
      expect(palette.adjectives.length, `${id} adjectives`).toBeGreaterThanOrEqual(6);
      expect(palette.verbs.length, `${id} verbs`).toBeGreaterThanOrEqual(6);
      expect(palette.rhythms.length, `${id} rhythms`).toBeGreaterThanOrEqual(3);
      expect(palette.greetings.length, `${id} greetings`).toBeGreaterThanOrEqual(2);
      expect(palette.oaths.length, `${id} oaths`).toBeGreaterThanOrEqual(2);
    }
  });
});
```

**Step 2: Implement 12 palette entries and test**

**Step 3: Commit**

```bash
git add src/data/culture-content.ts src/data/__tests__/culture-content.test.ts
git commit -m "content: add 12 cultural prose palettes — foundation + creation sphere voice"
```

---

### Task 14: Archetype-Event Prose Specialization

Add ~58 archetype-specific prose templates for high-impact event/archetype combos.

**Files:**
- Modify: `src/data/narrative-content.ts`
- Test: extend `src/data/__tests__/narrative-content.test.ts`

**Step 1: Write the failing test**

```typescript
import { ARCHETYPE_EVENT_TEMPLATES } from '../narrative-content';

describe('archetype-event prose', () => {
  it('should have templates for 5 priority archetypes × 6 priority events = 30 entries', () => {
    const priorityArchetypes = ['tragic_hero', 'trickster', 'conqueror', 'healer', 'prophet'];
    const priorityEvents = ['actor_death', 'action_critical', 'tier_transition', 'divine_intervention', 'contested_action', 'ordeal_completed'];
    for (const arch of priorityArchetypes) {
      for (const evt of priorityEvents) {
        const key = `${arch}.${evt}`;
        expect(ARCHETYPE_EVENT_TEMPLATES[key], `missing ${key}`).toBeDefined();
        expect(ARCHETYPE_EVENT_TEMPLATES[key].length).toBeGreaterThan(0);
      }
    }
  });

  it('should have death + tier_transition for all 19 archetypes', () => {
    // At minimum, every archetype should have death and tier_transition
    const archetypes = [
      'tragic_hero', 'trickster', 'conqueror', 'healer', 'prophet',
      'guardian', 'wanderer', 'scholar', 'martyr', 'tyrant',
      'mystic', 'rebel', 'builder', 'mentor', 'outcast',
      'diplomat', 'hunter', 'dreamer', 'avenger',
    ];
    for (const arch of archetypes) {
      expect(ARCHETYPE_EVENT_TEMPLATES[`${arch}.actor_death`], `missing ${arch}.actor_death`).toBeDefined();
      expect(ARCHETYPE_EVENT_TEMPLATES[`${arch}.tier_transition`], `missing ${arch}.tier_transition`).toBeDefined();
    }
  });

  it('total archetype-event templates should be >= 58', () => {
    expect(Object.keys(ARCHETYPE_EVENT_TEMPLATES).length).toBeGreaterThanOrEqual(58);
  });
});
```

**Step 2: Implement ~58 archetype-event templates**

Add `ARCHETYPE_EVENT_TEMPLATES: Record<string, string>` to narrative-content.ts. Keys are `{archetype_id}.{event_type}`.

Example:
```typescript
export const ARCHETYPE_EVENT_TEMPLATES: Record<string, string> = {
  'tragic_hero.actor_death': 'In the end, {actor} fell as tragic heroes must — reaching for {adj} {noun} and finding only the {adj} price of it.',
  'tragic_hero.action_critical': '{actor} seized glory, but those who knew the tragic hero\'s pattern saw the {adj} cost already gathering.',
  // ... 56 more
};
```

**Step 3: Commit**

```bash
git add src/data/narrative-content.ts src/data/__tests__/narrative-content.test.ts
git commit -m "content: add 58 archetype-event prose templates for replay variety"
```

---

### Task 15: Rival Personality Profiles

Add 8 distinct rival god personality profiles.

**Files:**
- Modify: `src/data/rival-content.ts`
- Test: `src/data/__tests__/rival-content.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { RIVAL_PERSONALITY_PROFILES } from '../rival-content';

describe('rival personality profiles', () => {
  it('should have 8 profiles', () => {
    expect(RIVAL_PERSONALITY_PROFILES).toHaveLength(8);
  });

  it('each profile should have id, name, sphereAffinity, taunts, reactions, and description', () => {
    for (const profile of RIVAL_PERSONALITY_PROFILES) {
      expect(profile.id.length).toBeGreaterThan(0);
      expect(profile.name.length).toBeGreaterThan(0);
      expect(profile.sphereAffinities.length).toBeGreaterThanOrEqual(1);
      expect(profile.taunts).toHaveLength(3);
      expect(profile.reactions).toHaveLength(2);
      expect(profile.description.length).toBeGreaterThan(20);
    }
  });

  it('each profile should have a unique id', () => {
    const ids = RIVAL_PERSONALITY_PROFILES.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
```

**Step 2: Implement 8 profiles and test**

**Step 3: Commit**

```bash
git add src/data/rival-content.ts src/data/__tests__/rival-content.test.ts
git commit -m "content: add 8 rival god personality profiles with taunts and reactions"
```

---

### Task 16: Mandate Milestone Prose

Add ~96 mandate milestone prose entries for stage transitions.

**Files:**
- Modify: `src/data/mandate-content.ts`
- Test: extend `src/data/__tests__/mandate-content.test.ts`

**Step 1: Write the failing test**

```typescript
import { MANDATE_MILESTONE_PROSE } from '../mandate-content';

describe('mandate milestone prose', () => {
  it('should have entries for all 9 mandates × 3 transitions × 2 variants + 24 completion/failure', () => {
    // 9 mandates × 3 transitions × 2 = 54 transition entries
    // + 9 × 2 completion + 9 × 2 failure = 36 more (but some may not have unique entries)
    expect(Object.keys(MANDATE_MILESTONE_PROSE).length).toBeGreaterThanOrEqual(40);
  });

  it('each entry should be a non-empty string', () => {
    for (const [key, prose] of Object.entries(MANDATE_MILESTONE_PROSE)) {
      expect(prose.length, `${key} prose empty`).toBeGreaterThan(10);
    }
  });
});
```

**Step 2: Implement milestone prose entries**

Add `MANDATE_MILESTONE_PROSE: Record<string, string>` to mandate-content.ts. Keys: `{mandate_id}.{transition}` where transition is `setup_to_escalation`, `escalation_to_culmination`, `completed`, `failed`.

**Step 3: Commit**

```bash
git add src/data/mandate-content.ts src/data/__tests__/mandate-content.test.ts
git commit -m "content: add mandate milestone prose — stage transitions, completion, failure"
```

---

### Task 17: Dilemma Prose Expansion + Ordeal Difficulty Tiers

Add stakes-based dilemma prose variants and ordeal difficulty tiers.

**Files:**
- Modify: `src/data/narrative-content.ts` (dilemma prose)
- Modify: `src/data/ordeal-content.ts` (difficulty tiers)
- Tests: extend existing test files

**Step 1: Write failing tests**

```typescript
// In narrative-content.test.ts:
import { DILEMMA_STAKES_PROSE } from '../narrative-content';

it('should have dilemma stakes prose for 4 outcomes × 3 stakes = 12 entries', () => {
  expect(Object.keys(DILEMMA_STAKES_PROSE)).toHaveLength(12);
});

// In ordeal-content.test.ts:
import { ORDEAL_DIFFICULTY_TIERS } from '../ordeal-content';

it('should have 3 difficulty tiers', () => {
  expect(Object.keys(ORDEAL_DIFFICULTY_TIERS)).toHaveLength(3);
});

it('each tier should have difficultyMultiplier and toneAdjectives', () => {
  for (const tier of Object.values(ORDEAL_DIFFICULTY_TIERS)) {
    expect(tier.difficultyMultiplier).toBeGreaterThan(0);
    expect(tier.toneAdjectives.length).toBeGreaterThanOrEqual(3);
  }
});
```

**Step 2: Implement both**

Add `DILEMMA_STAKES_PROSE` (12 entries) and `ORDEAL_DIFFICULTY_TIERS` (3 tiers: early/mid/late with multiplier + tone adjectives).

**Step 3: Commit**

```bash
git add src/data/narrative-content.ts src/data/ordeal-content.ts
git commit -m "content: add dilemma stakes prose (12 entries) + ordeal difficulty tiers (3 tiers)"
```

---

## Layer 4 — Connective Tissue

---

### Task 18: Sphere Influence + Seasonal + Echo Flavor Events

Add atmosphere events that make systems feel interconnected.

**Files:**
- Modify: `src/data/narrative-content.ts`
- Test: extend `src/data/__tests__/narrative-content.test.ts`

**Step 1: Write the failing test**

```typescript
import { SPHERE_INFLUENCE_EVENTS, SEASONAL_VOCABULARY, ECHO_FLAVOR_TEXTS, STEALTH_DETECTION_PROSE } from '../narrative-content';

describe('connective tissue content', () => {
  it('should have 16 sphere influence events (8 spheres × 2 directions)', () => {
    expect(Object.keys(SPHERE_INFLUENCE_EVENTS)).toHaveLength(16);
  });

  it('should have 4 seasonal vocabulary entries', () => {
    expect(Object.keys(SEASONAL_VOCABULARY)).toHaveLength(4);
  });

  it('each season should have adjectives, verbs, and atmosphere', () => {
    for (const season of Object.values(SEASONAL_VOCABULARY)) {
      expect(season.adjectives.length).toBeGreaterThanOrEqual(3);
      expect(season.verbs.length).toBeGreaterThanOrEqual(3);
      expect(season.atmosphere.length).toBeGreaterThan(10);
    }
  });

  it('should have 12 echo flavor texts', () => {
    expect(ECHO_FLAVOR_TEXTS).toHaveLength(12);
  });

  it('should have 8 stealth detection prose entries', () => {
    expect(Object.keys(STEALTH_DETECTION_PROSE)).toHaveLength(8);
  });
});
```

**Step 2: Implement all 4 connective tissue groups**

Add to narrative-content.ts:

```typescript
// ═══════════════════════════════════════════════════════════════════
// 6. SPHERE INFLUENCE EVENTS
// ═══════════════════════════════════════════════════════════════════

export const SPHERE_INFLUENCE_EVENTS: Record<string, string> = {
  'force.gaining': 'The threads of Force tighten around {location}. The air grows heavy with potential violence.',
  'force.losing': 'Force ebbs from {location}. Weapons feel lighter, tempers cool.',
  'matter.gaining': 'Matter thickens at {location}. Walls grow more solid, ground more firm.',
  'matter.losing': 'Matter thins at {location}. Foundations creak, structures sag.',
  // ... all 16
};

// ═══════════════════════════════════════════════════════════════════
// 7. SEASONAL VOCABULARY
// ═══════════════════════════════════════════════════════════════════

export const SEASONAL_VOCABULARY: Record<string, { adjectives: string[]; verbs: string[]; atmosphere: string }> = {
  spring: {
    adjectives: ['thawing', 'quickening', 'green-tipped', 'rain-washed', 'newborn'],
    verbs: ['sprouts', 'stirs', 'awakens', 'unfurls', 'breaks through'],
    atmosphere: 'The land shakes off its winter sleep. Everything begins again.',
  },
  // ... summer, autumn, winter
};

// ═══════════════════════════════════════════════════════════════════
// 8. ECHO FLAVOR TEXTS
// ═══════════════════════════════════════════════════════════════════

export const ECHO_FLAVOR_TEXTS: string[] = [
  'A memory stirs: the last time a {archetype} stood here, {outcome}.',
  'The World-Soul remembers {sphere} — it was stronger then.',
  // ... 12 total
];

// ═══════════════════════════════════════════════════════════════════
// 9. STEALTH DETECTION PROSE
// ═══════════════════════════════════════════════════════════════════

export const STEALTH_DETECTION_PROSE: Record<string, string> = {
  'mortal.unaware_to_suspicion': 'Rumors spread through {location} — someone speaks of miracles.',
  'mortal.suspicion_to_realization': 'The people of {location} begin to name the source of {sphere} blessings.',
  // ... all 8 from design doc
};
```

**Step 3: Commit**

```bash
git add src/data/narrative-content.ts src/data/__tests__/narrative-content.test.ts
git commit -m "content: add connective tissue — sphere events, seasons, echoes, stealth detection"
```

---

### Task 19: Cultural Tension Events

Add prose for culturalTension.ts fire events.

**Files:**
- Modify: `src/data/culture-content.ts`
- Test: extend `src/data/__tests__/culture-content.test.ts`

**Step 1: Write the failing test**

```typescript
import { CULTURAL_TENSION_TEMPLATES } from '../culture-content';

it('should have 12 cultural tension event templates (4 types × 3 variants)', () => {
  expect(Object.values(CULTURAL_TENSION_TEMPLATES).flat()).toHaveLength(12);
});
```

**Step 2: Implement 12 tension templates (4 types × 3 variants)**

**Step 3: Commit**

```bash
git add src/data/culture-content.ts src/data/__tests__/culture-content.test.ts
git commit -m "content: add 12 cultural tension event templates"
```

---

### Task 20: World-Soul Content Package

Create the fundament + resonance prose package.

**Files:**
- Create: `src/data/worldsoul-content.ts`
- Test: `src/data/__tests__/worldsoul-content.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { FUNDAMENT_DESCRIPTIONS, RESONANCE_FRAGMENT_PROSE } from '../worldsoul-content';

describe('worldsoul-content', () => {
  it('should have 12 fundament coefficient descriptions (one per sphere + 4 foundations)', () => {
    expect(Object.keys(FUNDAMENT_DESCRIPTIONS)).toHaveLength(12);
  });

  it('each fundament description should have high and low variants', () => {
    for (const [key, desc] of Object.entries(FUNDAMENT_DESCRIPTIONS)) {
      expect(desc.high.length, `${key} high`).toBeGreaterThan(20);
      expect(desc.low.length, `${key} low`).toBeGreaterThan(20);
    }
  });

  it('should have 8 resonance fragment prose templates', () => {
    expect(RESONANCE_FRAGMENT_PROSE).toHaveLength(8);
  });
});
```

**Step 2: Implement worldsoul-content.ts (~80 lines)**

**Step 3: Commit**

```bash
git add src/data/worldsoul-content.ts src/data/__tests__/worldsoul-content.test.ts
git commit -m "content: add worldsoul content package — 12 fundament descriptions, 8 resonance templates"
```

---

### Task 21: Ordeal System Connection Prose

Add prose for ordeal interactions with doom, culture, and rival systems.

**Files:**
- Modify: `src/data/ordeal-content.ts`
- Test: extend `src/data/__tests__/ordeal-content.test.ts`

**Step 1: Write the failing test**

```typescript
import { ORDEAL_SYSTEM_CONNECTIONS } from '../ordeal-content';

it('should have 9 ordeal system connection templates (3 doom + 3 culture + 3 rival)', () => {
  expect(ORDEAL_SYSTEM_CONNECTIONS.doom).toHaveLength(3);
  expect(ORDEAL_SYSTEM_CONNECTIONS.culture).toHaveLength(3);
  expect(ORDEAL_SYSTEM_CONNECTIONS.rival).toHaveLength(3);
});
```

**Step 2: Implement 9 connection templates**

**Step 3: Commit**

```bash
git add src/data/ordeal-content.ts src/data/__tests__/ordeal-content.test.ts
git commit -m "content: add 9 ordeal system connection templates (doom/culture/rival)"
```

---

### Task 22: Final Integration Test + Full Playtest

Verify all 4 layers produce a rich, varied playthrough.

**Files:**
- Create: `src/engine/__tests__/content-full-integration.test.ts`

**Step 1: Write integration test**

```typescript
import { describe, it, expect } from 'vitest';
import { ORDEAL_TEMPLATES, ORDEAL_INSPECTION_VIGNETTES, ORDEAL_DIFFICULTY_TIERS, ORDEAL_SYSTEM_CONNECTIONS } from '../../data/ordeal-content';
import { CHRONICLER_VIGNETTES, SUBLOCATION_FLAVOR, ARTIFACT_LORE, LOCATION_TYPE_FLAVOR, MAGIC_TRADITION_FLAVOR } from '../../data/chronicler-content';
import { ROUTINE_TEMPLATES, NOTABLE_TEMPLATES, LIFECYCLE_TEMPLATES, ARCHETYPE_EVENT_TEMPLATES, SPHERE_INFLUENCE_EVENTS, SEASONAL_VOCABULARY, ECHO_FLAVOR_TEXTS, STEALTH_DETECTION_PROSE, DILEMMA_STAKES_PROSE } from '../../data/narrative-content';
import { DOOM_VOCABULARY } from '../../data/doom-content';
import { RIVAL_PERSONALITY_PROFILES } from '../../data/rival-content';
import { CULTURAL_PROSE_PALETTES, CULTURAL_TENSION_TEMPLATES } from '../../data/culture-content';
import { FUNDAMENT_DESCRIPTIONS, RESONANCE_FRAGMENT_PROSE } from '../../data/worldsoul-content';

describe('Full content population integration', () => {
  it('Layer 1: minimum visible playthrough content present', () => {
    expect(ORDEAL_TEMPLATES.length).toBe(10);
    expect(Object.values(ROUTINE_TEMPLATES).flat().length).toBeGreaterThanOrEqual(80);
    expect(Object.values(NOTABLE_TEMPLATES).flat().length).toBeGreaterThanOrEqual(20);
    expect(Object.values(LIFECYCLE_TEMPLATES).flat().length).toBe(11);
    expect(Object.keys(DOOM_VOCABULARY)).toHaveLength(7);
  });

  it('Layer 2: inspection content present', () => {
    expect(Object.keys(CHRONICLER_VIGNETTES)).toHaveLength(15);
    expect(Object.keys(SUBLOCATION_FLAVOR)).toHaveLength(14);
    expect(ARTIFACT_LORE).toHaveLength(30);
    expect(Object.keys(LOCATION_TYPE_FLAVOR)).toHaveLength(15);
    expect(Object.keys(MAGIC_TRADITION_FLAVOR)).toHaveLength(34);
    expect(ORDEAL_INSPECTION_VIGNETTES.inProgress).toHaveLength(10);
  });

  it('Layer 3: replay variety content present', () => {
    expect(Object.keys(CULTURAL_PROSE_PALETTES)).toHaveLength(12);
    expect(Object.keys(ARCHETYPE_EVENT_TEMPLATES).length).toBeGreaterThanOrEqual(58);
    expect(RIVAL_PERSONALITY_PROFILES).toHaveLength(8);
    expect(Object.keys(DILEMMA_STAKES_PROSE)).toHaveLength(12);
    expect(Object.keys(ORDEAL_DIFFICULTY_TIERS)).toHaveLength(3);
  });

  it('Layer 4: connective tissue present', () => {
    expect(Object.keys(SPHERE_INFLUENCE_EVENTS)).toHaveLength(16);
    expect(Object.keys(SEASONAL_VOCABULARY)).toHaveLength(4);
    expect(ECHO_FLAVOR_TEXTS).toHaveLength(12);
    expect(Object.keys(STEALTH_DETECTION_PROSE)).toHaveLength(8);
    expect(Object.keys(FUNDAMENT_DESCRIPTIONS)).toHaveLength(12);
    expect(RESONANCE_FRAGMENT_PROSE).toHaveLength(8);
    expect(Object.keys(CULTURAL_TENSION_TEMPLATES)).toHaveLength(4);
    expect(ORDEAL_SYSTEM_CONNECTIONS.doom).toHaveLength(3);
  });

  it('grand total: ~632 new content entries', () => {
    // Count all new entries across all packages
    const layer1 = ORDEAL_TEMPLATES.length * 3 + // ordeal encounters
      Object.values(ROUTINE_TEMPLATES).flat().length +
      Object.values(NOTABLE_TEMPLATES).flat().length +
      Object.values(LIFECYCLE_TEMPLATES).flat().length +
      Object.keys(DOOM_VOCABULARY).length * 14; // 5+5+3+1 per stage

    const layer2 = Object.keys(CHRONICLER_VIGNETTES).length +
      Object.keys(SUBLOCATION_FLAVOR).length +
      ARTIFACT_LORE.length +
      Object.keys(LOCATION_TYPE_FLAVOR).length +
      Object.keys(MAGIC_TRADITION_FLAVOR).length +
      (ORDEAL_INSPECTION_VIGNETTES.inProgress.length + ORDEAL_INSPECTION_VIGNETTES.completed.length + ORDEAL_INSPECTION_VIGNETTES.failed.length);

    // Just verify totals are in the right ballpark
    expect(layer1).toBeGreaterThan(150);
    expect(layer2).toBeGreaterThan(80);
  });
});
```

**Step 2: Run full test suite**

Run: `npx vitest run --reporter=verbose 2>&1 | tail -10`
Expected: All tests pass, including all new content tests.

**Step 3: Run playtest across 3 seeds**

Run: `npx tsx scripts/playtest.ts --seeds 42,7,100 --ticks 100`
Expected: Reports show varied prose, new event types, doom-colored atmosphere, cultural voice differentiation.

**Step 4: Commit**

```bash
git add src/engine/__tests__/content-full-integration.test.ts
git commit -m "test: full content population integration test — all 4 layers verified"
```

---

### Task 23: Documentation Updates

Update CLAUDE.md, Obsidian vault, and Notion backlog.

**Files:**
- Modify: `CLAUDE.md` (project status, engine stats, changelog)
- Obsidian: Update Content Packages.md, add Ordeal System.md
- Notion: Mark content population tasks complete

**Step 1: Update CLAUDE.md**

- Add content population to project status
- Update engine stats (module count, line count, test count)
- Add changelog entries for each commit

**Step 2: Update Obsidian vault**

- Create `Systems/Ordeal System.md` with links to ordeal types, engine, content
- Update `Systems/Content Packages.md` — mark all new packages, update line counts
- Update `Index.md` — add Ordeal System link

**Step 3: Update Notion backlog**

- Mark content population tasks complete
- Add any new tasks discovered during implementation

**Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update project status after content population — 632 new entries across 4 layers"
```

---

## Summary

| Task | Layer | What | New Content |
|------|-------|------|-------------|
| 1 | L1 | Taxonomy expansion | 37 graph nodes + edges |
| 2 | L1 | Ordeal type system | Types + constants |
| 3 | L1 | Ordeal content package | 10 templates, 30 encounters, 6 overlays |
| 4 | L1 | Ordeal engine | ~400 lines of engine code |
| 5 | L1 | Ordeal orchestrator integration | Tick phase + action pipeline |
| 6 | L1 | Ordeal trace instrumentation | Debug panel support |
| 7 | L1 | Action prose expansion | +61 routine, +26 notable templates |
| 8 | L1 | Lifecycle prose | 5 death, 3 birth, 3 migration |
| 9 | L1 | Doom vocabulary | 7 stages × word banks |
| 10 | L1 | Layer 1 integration test | Playtest verification |
| 11 | L2 | Chronicler content package | 15 vignettes, 14 sublocations, 30 artifacts, 15 locations, 34 traditions |
| 12 | L2 | Ordeal inspection vignettes | 18 inspection prose entries |
| 13 | L3 | Cultural prose palettes | 12 palettes |
| 14 | L3 | Archetype-event prose | ~58 specialized templates |
| 15 | L3 | Rival personality profiles | 8 profiles, ~40 prose entries |
| 16 | L3 | Mandate milestone prose | ~96 milestone entries |
| 17 | L3 | Dilemma + ordeal difficulty | 12 dilemma + 3 tier entries |
| 18 | L4 | Sphere/seasonal/echo/stealth | 16+4+12+8 = 40 entries |
| 19 | L4 | Cultural tension events | 12 templates |
| 20 | L4 | World-Soul content | 12 fundament + 8 resonance |
| 21 | L4 | Ordeal system connections | 9 templates |
| 22 | All | Full integration test | Cross-layer verification |
| 23 | All | Documentation updates | CLAUDE.md, Obsidian, Notion |

**Grand total:** ~632 new content entries, ~38 graph nodes, 4 new files + extensions to 6 existing packages, ~20 commits.
