# Unified Action System — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace three parallel action execution pipelines (CRUD actions, encounters, divine interventions) with a single unified action system where every action in the game is the same kind of thing.

**Architecture:** One `UnifiedActionTemplate` format and one `UnifiedAction` runtime type, processed by a single 7-phase tick pipeline in the orchestrator. Existing decision-making systems (Axiological Motivation Engine, Disposition System) are untouched — they feed into the unified pipeline instead of three separate ones.

**Tech Stack:** TypeScript, Vitest, existing WorldGraph + GraphOp + Resolution systems.

**Design doc:** `Docs/plans/2026-03-12-unified-action-system-design.md`

---

## Sprint Overview

| Sprint | Focus | Deliverable |
|--------|-------|-------------|
| 1 | Foundation types + GraphOp extension | New types compile, new `apply_influence` GraphOp works, all existing tests pass |
| 2 | Unified template format + content migration | ~108 templates in one format, old templates deprecated, content tests pass |
| 3A | Unified action lifecycle (pure functions) | Lifecycle module: create, progress, advance, complete, sort. Fully tested in isolation. |
| 3B | Add UnifiedAction to GameState | Additive `unifiedActions` field. Zero risk. |
| 3C | Replace `phaseActionProgress` | Unified single-step resolution. New phase runs alongside old (no-op until 3E). |
| 3D | Replace `phaseEncounterProgression` | Multi-step advancement in unified resolution. Extends 3C for encounter-equivalent actions. |
| 3E | Replace `phaseAgentActions` (initiation) | Unified candidate generation + idle selection. **Cutover point** — old phases commented out. |
| 3F | Integration validation | End-to-end multi-tick test, full regression check, build verification. |
| 4 | Contestation + reactive candidate generation | Per-step contestation resolves, threat-reactive candidate scoring works |
| 5 | Player integration + UI + cleanup | Ascendant uses unified actions, UI shows all actions uniformly, old code removed |

---

## Sprint 1: Foundation Types + GraphOp Extension

**Goal:** Establish the new type foundation without breaking anything. After this sprint, the new types exist alongside the old ones and the `apply_influence` GraphOp works.

### Task 1.1: UnifiedActionTemplate type

**Files:**
- Create: `src/types/unifiedAction.ts`
- Test: `src/types/__tests__/unifiedAction.test.ts`

**Step 1: Write the type definition**

```typescript
// src/types/unifiedAction.ts
import { ReachDomain, SphereName } from './cosmology';
import { ActorType } from './graph';
import { ValuePair } from './agent';
import { GraphOp } from './graphOp';

export type ActionScale = 'cosmic' | 'regional' | 'local' | 'personal';
export type ActionSource = 'agent' | 'player' | 'system';
export type StepFailBehavior = 'fail_action' | 'continue_weakened';

export interface ActionStep {
  readonly reach: ReachDomain;
  readonly duration: { readonly min: number; readonly max: number };
  readonly difficulty: number; // 0-1
  readonly onSuccess: readonly GraphOp[];
  readonly onFailure: readonly GraphOp[];
  readonly failBehavior: StepFailBehavior;
  readonly narrativeTemplate?: string;
}

export interface UnifiedActionTemplate {
  // Identity
  readonly id: string;
  readonly name: string;
  readonly reach: ReachDomain;
  readonly crudType: 'create' | 'read' | 'update' | 'delete';

  // Scale & Priority
  readonly scale: ActionScale;

  // Steps (1 = simple, 2+ = encounter-like)
  readonly steps: readonly ActionStep[];

  // Costs
  readonly apCost: number; // typically 1
  readonly essenceCost?: number; // divine actions only

  // Filtering
  readonly actorAffinities: readonly ActorType[];
  readonly locationSubtypes?: readonly string[];
  readonly sphereAffinity?: SphereName;

  // Contestation
  readonly contestsWith?: readonly string[];

  // Selection
  readonly motivations: readonly ValuePair[];

  // Narrative
  readonly narrativeTemplates: {
    readonly initiation: string;
    readonly success: string;
    readonly failure: string;
    readonly contested?: string;
  };
}

// Scale priority for tick resolution ordering (lower = resolves first)
export const SCALE_PRIORITY: Record<ActionScale, number> = {
  cosmic: 0,
  regional: 1,
  local: 2,
  personal: 3,
};

// Runtime action instance
export type UnifiedActionOutcome =
  | 'success'
  | 'failure'
  | 'contested_won'
  | 'contested_lost'
  | 'critical_success'
  | 'critical_failure';

export type StepOutcome = 'success' | 'failure';

export interface UnifiedAction {
  readonly actionId: string;
  readonly actorId: string;
  readonly templateId: string;
  readonly targetId: string;

  // Priority
  readonly scale: ActionScale;
  readonly source: ActionSource;
  readonly startTick: number;

  // Step progression
  readonly currentStep: number; // 0-indexed
  readonly stepProgress: number; // ticks completed on current step
  readonly stepDuration: number; // total ticks for current step

  // Resources (already deducted on creation)
  readonly essencePaid?: number;

  // Contestation
  readonly contestedWith?: string; // actionId of opposing action

  // Resolution
  readonly resolved: boolean;
  readonly outcome?: UnifiedActionOutcome;
  readonly stepOutcomes: readonly StepOutcome[]; // per-step results
}
```

**Step 2: Write type validation tests**

```typescript
// src/types/__tests__/unifiedAction.test.ts
import { describe, it, expect } from 'vitest';
import {
  SCALE_PRIORITY,
  type UnifiedActionTemplate,
  type UnifiedAction,
  type ActionStep,
} from '../unifiedAction';

describe('UnifiedAction types', () => {
  it('SCALE_PRIORITY orders cosmic first', () => {
    expect(SCALE_PRIORITY.cosmic).toBeLessThan(SCALE_PRIORITY.regional);
    expect(SCALE_PRIORITY.regional).toBeLessThan(SCALE_PRIORITY.local);
    expect(SCALE_PRIORITY.local).toBeLessThan(SCALE_PRIORITY.personal);
  });

  it('can construct a minimal 1-step template', () => {
    const template: UnifiedActionTemplate = {
      id: 'action.iron.raise-force',
      name: 'Raise Force',
      reach: 'iron',
      crudType: 'create',
      scale: 'regional',
      steps: [{
        reach: 'iron',
        duration: { min: 3, max: 5 },
        difficulty: 0.4,
        onSuccess: [],
        onFailure: [],
        failBehavior: 'fail_action',
      }],
      apCost: 1,
      actorAffinities: ['faction'],
      motivations: ['courage_prudence'],
      narrativeTemplates: {
        initiation: 'raises a force',
        success: 'the force is raised',
        failure: 'recruitment fails',
      },
    };
    expect(template.steps).toHaveLength(1);
    expect(template.scale).toBe('regional');
  });

  it('can construct a multi-step template', () => {
    const template: UnifiedActionTemplate = {
      id: 'encounter.raid-caravan',
      name: 'Raid Caravan',
      reach: 'shadow',
      crudType: 'read',
      scale: 'local',
      steps: [
        { reach: 'shadow', duration: { min: 1, max: 1 }, difficulty: 0.35, onSuccess: [], onFailure: [], failBehavior: 'fail_action' },
        { reach: 'iron', duration: { min: 1, max: 2 }, difficulty: 0.45, onSuccess: [], onFailure: [], failBehavior: 'fail_action' },
        { reach: 'gold', duration: { min: 1, max: 1 }, difficulty: 0.3, onSuccess: [], onFailure: [], failBehavior: 'fail_action' },
      ],
      apCost: 1,
      actorAffinities: ['individual'],
      motivations: ['ambition_contentment'],
      narrativeTemplates: {
        initiation: 'approaches the caravan',
        success: 'seizes the goods',
        failure: 'the raid is foiled',
      },
    };
    expect(template.steps).toHaveLength(3);
  });

  it('can construct a divine template with essenceCost', () => {
    const template: UnifiedActionTemplate = {
      id: 'divine.inspire',
      name: 'Inspire',
      reach: 'heart',
      crudType: 'update',
      scale: 'cosmic',
      steps: [{
        reach: 'heart',
        duration: { min: 1, max: 1 },
        difficulty: 0.0, // divine actions always succeed
        onSuccess: [], // will use apply_influence GraphOp
        onFailure: [],
        failBehavior: 'fail_action',
      }],
      apCost: 1,
      essenceCost: 15,
      actorAffinities: ['ascendant'],
      motivations: [],
      narrativeTemplates: {
        initiation: 'reaches into the mortal mind',
        success: 'divine inspiration takes hold',
        failure: 'the mortal resists',
      },
    };
    expect(template.essenceCost).toBe(15);
    expect(template.scale).toBe('cosmic');
  });

  it('can construct a runtime UnifiedAction', () => {
    const action: UnifiedAction = {
      actionId: 'action-001',
      actorId: 'actor-123',
      templateId: 'action.iron.raise-force',
      targetId: 'location-456',
      scale: 'regional',
      source: 'agent',
      startTick: 10,
      currentStep: 0,
      stepProgress: 2,
      stepDuration: 4,
      resolved: false,
      stepOutcomes: [],
    };
    expect(action.resolved).toBe(false);
    expect(action.stepProgress).toBe(2);
  });
});
```

**Step 3: Run tests to verify they pass**

Run: `npx vitest run src/types/__tests__/unifiedAction.test.ts`
Expected: 5 tests PASS

**Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add src/types/unifiedAction.ts src/types/__tests__/unifiedAction.test.ts
git commit -m "feat: add UnifiedActionTemplate and UnifiedAction types

Foundation types for the unified action system. Defines ActionStep,
UnifiedActionTemplate (one format for CRUD/encounter/divine), and
UnifiedAction runtime instance. Includes SCALE_PRIORITY for tick
resolution ordering (cosmic → regional → local → personal)."
```

---

### Task 1.2: apply_influence GraphOp type

**Files:**
- Modify: `src/types/graphOp.ts`
- Modify: `src/engine/graphOpExecutor.ts`
- Test: `src/engine/__tests__/graphOpExecutor-influence.test.ts`

**Step 1: Extend GraphOp type with apply_influence**

Add to `src/types/graphOp.ts`:

```typescript
// Add to GraphOpType union:
export type GraphOpType =
  | 'add_node' | 'remove_node' | 'update_node'
  | 'add_edge' | 'remove_edge' | 'update_edge'
  | 'apply_influence';

// Add new interface:
export interface InfluencePayload {
  readonly interventionType: string;
  readonly sphere: string;
  readonly initialStrength: number;
  readonly decayRate: number;
  readonly minimumStrength: number;
  readonly maxDuration: number;
  readonly valueDrifts?: Record<string, number>;
  readonly reachBoost?: { readonly reach: string; readonly bonus: number };
  readonly behaviorTag?: string;
  readonly traitId?: string;
  readonly strategyOverride?: string;
}

// Extend GraphOp interface — add optional influence field:
// influence?: InfluencePayload;
```

**Step 2: Write failing test for apply_influence execution**

```typescript
// src/engine/__tests__/graphOpExecutor-influence.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { executeGraphOps, resetOpCounter } from '../graphOpExecutor';
import { createTestGraph } from '../../test-utils/graphFactory';
import type { GraphOp, GraphOpContext, InfluencePayload } from '../../types/graphOp';

describe('executeGraphOps - apply_influence', () => {
  let graph: ReturnType<typeof createTestGraph>;
  let ctx: GraphOpContext;

  beforeEach(() => {
    resetOpCounter();
    graph = createTestGraph();
    // Add an actor node to the graph
    graph.addNode({ id: 'actor-1', type: 'individual', properties: {} });
    ctx = { actorId: 'actor-1', targetId: 'actor-1', locationId: 'loc-1' };
  });

  it('applies influence entry to target actor node', () => {
    const ops: GraphOp[] = [{
      type: 'apply_influence',
      target: '$target',
      influence: {
        interventionType: 'inspire_intervention',
        sphere: 'force',
        initialStrength: 1.0,
        decayRate: 0.92,
        minimumStrength: 0.05,
        maxDuration: 30,
        valueDrifts: { courage_prudence: 0.2 },
      },
    }];

    const result = executeGraphOps(graph, ops, ctx);
    expect(result.allSucceeded).toBe(true);

    const actor = graph.getNode('actor-1');
    const influences = actor?.properties?.divineInfluences ?? [];
    expect(influences).toHaveLength(1);
    expect(influences[0].interventionType).toBe('inspire_intervention');
    expect(influences[0].initialStrength).toBe(1.0);
  });

  it('appends to existing influences without replacing', () => {
    // Pre-populate one influence
    graph.updateNode('actor-1', {
      divineInfluences: [{
        id: 'existing-1',
        interventionType: 'dream',
        sphere: 'mind',
        tickApplied: 5,
        initialStrength: 0.8,
        decayRate: 0.90,
        minimumStrength: 0.05,
        maxDuration: 20,
      }],
    });

    const ops: GraphOp[] = [{
      type: 'apply_influence',
      target: '$target',
      influence: {
        interventionType: 'persuade',
        sphere: 'spirit',
        initialStrength: 1.0,
        decayRate: 0.92,
        minimumStrength: 0.05,
        maxDuration: 25,
      },
    }];

    const result = executeGraphOps(graph, ops, ctx);
    expect(result.allSucceeded).toBe(true);

    const actor = graph.getNode('actor-1');
    const influences = actor?.properties?.divineInfluences ?? [];
    expect(influences).toHaveLength(2);
  });

  it('resolves symbolic ref for target', () => {
    graph.addNode({ id: 'other-actor', type: 'individual', properties: {} });
    const ctxWithTarget = { ...ctx, targetId: 'other-actor' };

    const ops: GraphOp[] = [{
      type: 'apply_influence',
      target: '$target',
      influence: {
        interventionType: 'omen',
        sphere: 'time',
        initialStrength: 0.6,
        decayRate: 0.88,
        minimumStrength: 0.05,
        maxDuration: 15,
      },
    }];

    const result = executeGraphOps(graph, ops, ctxWithTarget);
    expect(result.allSucceeded).toBe(true);

    const otherActor = graph.getNode('other-actor');
    expect(otherActor?.properties?.divineInfluences).toHaveLength(1);
  });

  it('fails soft when target node does not exist', () => {
    const ctxBadTarget = { ...ctx, targetId: 'nonexistent' };
    const ops: GraphOp[] = [{
      type: 'apply_influence',
      target: '$target',
      influence: {
        interventionType: 'dream',
        sphere: 'mind',
        initialStrength: 1.0,
        decayRate: 0.9,
        minimumStrength: 0.05,
        maxDuration: 20,
      },
    }];

    const result = executeGraphOps(graph, ops, ctxBadTarget);
    expect(result.allSucceeded).toBe(false);
    expect(result.results[0].error).toBeDefined();
  });
});
```

**Step 3: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/graphOpExecutor-influence.test.ts`
Expected: FAIL — `apply_influence` not handled in executor

**Step 4: Implement apply_influence in graphOpExecutor.ts**

Add handler function in `src/engine/graphOpExecutor.ts`:

```typescript
function executeApplyInfluence(
  graph: WorldGraph,
  op: GraphOp,
  ctx: GraphOpContext
): GraphOpResult {
  const targetId = resolveRef(op.target ?? '$target', ctx);
  const node = graph.getNode(targetId);
  if (!node) {
    return { success: false, error: `Target node ${targetId} not found` };
  }

  const influence = op.influence;
  if (!influence) {
    return { success: false, error: 'apply_influence op missing influence payload' };
  }

  const existing: unknown[] = node.properties?.divineInfluences ?? [];
  const entry = {
    id: `influence-${opCounter++}`,
    ...influence,
    tickApplied: ctx.tick ?? 0,
  };

  graph.updateNode(targetId, {
    divineInfluences: [...existing, entry],
  });

  return { success: true };
}
```

Add to the `executeSingleOp` switch statement:
```typescript
case 'apply_influence':
  return executeApplyInfluence(graph, op, ctx);
```

**Step 5: Run tests to verify they pass**

Run: `npx vitest run src/engine/__tests__/graphOpExecutor-influence.test.ts`
Expected: 4 tests PASS

**Step 6: Run all existing graphOp tests to verify no regressions**

Run: `npx vitest run src/engine/__tests__/graphOpExecutor.test.ts src/types/__tests__/graphOp.test.ts`
Expected: All 32 existing tests PASS

**Step 7: Commit**

```bash
git add src/types/graphOp.ts src/engine/graphOpExecutor.ts src/engine/__tests__/graphOpExecutor-influence.test.ts
git commit -m "feat: add apply_influence GraphOp type

Extends GraphOp with apply_influence operation that adds decaying
DivineInfluenceEntry to target actor nodes. Appends to existing
influences without replacing. Fail-soft on missing target.
Part of unified action system (Sprint 1)."
```

---

### Task 1.3: Full test suite regression check

**Step 1: Run all tests**

Run: `npm test`
Expected: All ~2,680+ tests pass. No regressions from new types (they're additive).

**Step 2: Type-check entire project**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit (if any fixups needed)**

Sprint 1 complete. New types exist alongside old ones. `apply_influence` GraphOp works. Nothing broken.

---

## Sprint 2: Unified Template Format + Content Migration

**Goal:** Create the unified template data file and migrate all 108 templates into the new format. Old template files remain but are marked deprecated. All content validation tests pass on the new format.

### Task 2.1: Template migration helpers

**Files:**
- Create: `src/data/unified-action-templates.ts`
- Test: `src/data/__tests__/unified-action-templates.test.ts`

**Step 1: Write the unified template file with migration functions**

Create `src/data/unified-action-templates.ts` with:
- `UNIFIED_ACTION_TEMPLATES: UnifiedActionTemplate[]` — starts empty
- `function migrateActionTemplate(old: ActionTemplateData): UnifiedActionTemplate` — converts old 1-step template
- `function migrateEncounterTemplate(old: EncounterTemplate): UnifiedActionTemplate` — converts old multi-step template
- `function getUnifiedTemplateById(id: string): UnifiedActionTemplate | undefined`

The migration functions map old fields to new format:
- ActionTemplateData → 1-step UnifiedActionTemplate, scale inferred from actorAffinities (faction → regional, individual → personal)
- EncounterTemplate → multi-step UnifiedActionTemplate, each EncounterStep → ActionStep

**Step 2: Write content validation tests**

Tests should verify:
- All 36 migrated action templates have exactly 1 step
- All migrated encounter templates have 2-4 steps
- Every template has at least 1 motivation
- Every template has valid reach domains
- Every step has difficulty in [0, 1]
- Every step has duration.min ≤ duration.max
- Every step has duration.min ≥ 1 (minimum 1 tick rule)
- No duplicate template IDs
- `getUnifiedTemplateById` returns correct template

**Step 3: Run tests, iterate until passing**

Run: `npx vitest run src/data/__tests__/unified-action-templates.test.ts`

**Step 4: Commit**

```bash
git commit -m "feat: unified template format with migration from old action templates

Migrates 36 CRUD action templates and encounter templates into
UnifiedActionTemplate format. Old files preserved but deprecated.
Content validation tests verify structure integrity."
```

---

### Task 2.2: Divine intervention templates

**Files:**
- Modify: `src/data/unified-action-templates.ts`
- Test: `src/data/__tests__/unified-action-templates-divine.test.ts`

**Step 1: Author 8 divine intervention templates**

Each intervention type (dream, persuade, deceive, intimidate, inspire_intervention, coincidence, omen, afflict_bless) becomes a UnifiedActionTemplate with:
- `scale: 'cosmic'`
- `actorAffinities: ['ascendant']`
- `essenceCost`: pulled from existing `INTERVENTION_DEFINITIONS`
- 1 step, duration `{ min: 1, max: 1 }` (1 tick)
- `onSuccess`: `apply_influence` GraphOp with the same parameters currently hardcoded in `interventionEffects.ts`
- Difficulty: 0.0 (divine actions always succeed — contested resolution is separate)

**Step 2: Tests verifying all 8 divine templates**

- Each has scale 'cosmic'
- Each has essenceCost > 0
- Each step's onSuccess contains exactly 1 apply_influence GraphOp
- Each has actorAffinities containing 'ascendant'

**Step 3: Run and verify**

Run: `npx vitest run src/data/__tests__/unified-action-templates-divine.test.ts`

**Step 4: Commit**

```bash
git commit -m "feat: add 8 divine intervention templates to unified format

Converts hardcoded intervention handlers to data-driven templates.
Each uses apply_influence GraphOp for effects. All 1-tick, cosmic
scale, ascendant-only. Part of unified action system (Sprint 2)."
```

---

### Task 2.3: Full template count validation

**Files:**
- Modify: `src/data/__tests__/unified-action-templates.test.ts`

**Step 1: Add aggregate validation test**

```typescript
it('contains all expected templates', () => {
  const templates = UNIFIED_ACTION_TEMPLATES;
  const actionCount = templates.filter(t => t.id.startsWith('action.')).length;
  const encounterCount = templates.filter(t => t.id.startsWith('encounter.')).length;
  const divineCount = templates.filter(t => t.id.startsWith('divine.')).length;

  expect(actionCount).toBe(36);
  expect(encounterCount).toBeGreaterThanOrEqual(10); // encounter template count varies
  expect(divineCount).toBe(8);
  expect(templates.length).toBeGreaterThanOrEqual(54);
});
```

**Step 2: Run full test suite**

Run: `npm test`
Expected: All tests pass, including old template tests (old files still exist)

**Step 3: Commit**

Sprint 2 complete. All templates exist in unified format. Old files preserved for now.

---

## Sprint 3: Unified Action Lifecycle + Orchestrator Rewrite

**Goal:** Replace the action lifecycle, encounter lifecycle, and relevant orchestrator phases with the unified action pipeline. This is the core mechanical change.

**Risk mitigation strategy:** The three old orchestrator phases (`phaseActionProgress`, `phaseEncounterProgression`, and initiation logic in `phaseAgentActions`) are independent — each reads/writes different slices of state. We replace them **one at a time**, keeping the others running old code during the transition. This means each sub-sprint produces a working game with a mix of old and new pipelines, rather than a big-bang rewrite that's broken until everything's done.

**Replacement order** (simplest → most complex):
1. `phaseActionProgress` — single-step CRUD tick+resolve. Simplest because it's a pure map over `actionsInProgress` with no inter-action dependencies.
2. `phaseEncounterProgression` — multi-step encounter tick+resolve. Medium complexity: per-step advancement, but well-contained.
3. `phaseAgentActions` (initiation) — candidate generation + action/encounter creation. Most complex because it merges two candidate sources and has the most branching.

---

### Sub-sprint 3A: Unified Action Lifecycle (pure functions, no orchestrator changes)

**Goal:** Build the lifecycle module that all subsequent sub-sprints depend on. Pure functions, fully testable in isolation, zero risk to existing code.

#### Task 3A.1: Core lifecycle functions

**Files:**
- Create: `src/engine/unifiedActionLifecycle.ts`
- Test: `src/engine/__tests__/unifiedActionLifecycle.test.ts`

**Step 1: Write the unified lifecycle module**

Pure functions mirroring the existing actionLifecycle.ts pattern but operating on UnifiedAction:

```typescript
export function createUnifiedAction(params: CreateUnifiedActionParams): UnifiedAction
export function progressUnifiedAction(action: UnifiedAction): UnifiedAction  // +1 stepProgress
export function isStepComplete(action: UnifiedAction): boolean  // stepProgress >= stepDuration
export function advanceStep(action: UnifiedAction, outcome: StepOutcome, template: UnifiedActionTemplate, rng: () => number): UnifiedAction  // move to next step or mark resolved
export function completeAction(action: UnifiedAction, outcome: UnifiedActionOutcome): UnifiedAction
export function isUnifiedAgentIdle(actions: readonly UnifiedAction[], agentId: string): boolean
export function getActiveUnifiedActions(actions: readonly UnifiedAction[]): UnifiedAction[]
export function sortByPriority(actions: readonly UnifiedAction[]): UnifiedAction[]  // scale → FIFO
```

Key behaviors:
- `createUnifiedAction` computes stepDuration from template step's duration range using rng
- `advanceStep` checks if more steps remain; if yes, resets stepProgress and computes next stepDuration; if no, marks resolved
- `sortByPriority` sorts by SCALE_PRIORITY[scale] ascending, then startTick ascending (FIFO)
- All functions are pure — return new instances, no mutation

**Step 2: Write comprehensive tests**

Tests covering:
- Create a 1-step action, progress to completion, complete it
- Create a 3-step action, advance through all steps
- Step failure with `fail_action` behavior → entire action fails
- Step failure with `continue_weakened` behavior → advances to next step
- Priority sorting: cosmic before regional before local before personal
- Priority sorting: FIFO within same scale band
- `isUnifiedAgentIdle` when agent has active actions vs no actions
- `getActiveUnifiedActions` filters resolved actions
- Edge case: action with duration `{ min: 1, max: 1 }` → always 1 tick
- Edge case: `advanceStep` on final step → marks resolved

**Step 3: Run and iterate**

Run: `npx vitest run src/engine/__tests__/unifiedActionLifecycle.test.ts`

**Step 4: Commit**

```bash
git commit -m "feat: unified action lifecycle with priority sorting

Pure-function lifecycle for UnifiedAction: create, progress, advance
step, complete. Sorts by scale band (cosmic→personal) then FIFO.
Supports multi-step with per-step fail behaviors."
```

---

### Sub-sprint 3B: Add UnifiedAction to GameState

**Goal:** Additive change — add the `unifiedActions` array to GameState alongside the old fields. Zero risk.

#### Task 3B.1: GameState extension

**Files:**
- Modify: `src/types/gameState.ts`
- Modify: `src/engine/gameInit.ts` (or wherever GameState is initialized)

**Step 1: Add `unifiedActions` field alongside existing fields**

```typescript
// In GameState interface, add:
unifiedActions: UnifiedAction[];
```

Initialize as `[]` in gameInit. Keep `actionsInProgress` and `encounterProgress` for now — they're still in use by old phases until we swap them out.

**Step 2: Type-check**

Run: `npx tsc --noEmit`

**Step 3: Run all tests**

Run: `npm test`
Expected: All pass (additive change)

**Step 4: Commit**

```bash
git commit -m "feat: add unifiedActions field to GameState

Additive change — existing actionsInProgress and encounterProgress
preserved until Sprint 5 cleanup."
```

---

### Sub-sprint 3C: Replace `phaseActionProgress` (single-step CRUD resolution)

**Goal:** Swap out the simplest of the three old phases. After this sub-sprint, single-step CRUD actions tick and resolve through the unified pipeline while encounters and initiation still use old code.

**What `phaseActionProgress` currently does** (orchestrator lines 399-472):
1. Iterates over `state.actionsInProgress`
2. Increments progress on each active action via `progressAction()`
3. Checks completion via `isActionComplete()`
4. On completion: resolves (random roll vs template difficulty), executes GraphOps, marks resolved, emits trace + event

**What replaces it:**
- Phases 1-2 of the unified pipeline (progress + collect completions) operating on `state.unifiedActions`
- Phases 4-5 (resolve + execute GraphOps) for single-step completions
- Phase 6 (mark resolved) for completed single-step actions

#### Task 3C.1: Unified single-step resolution functions

**Files:**
- Create: `src/engine/unifiedActionResolution.ts`
- Test: `src/engine/__tests__/unifiedActionResolution.test.ts`

**Step 1: Write resolution functions (standalone, not wired to orchestrator yet)**

```typescript
/**
 * Progress all active unified actions by 1 tick.
 * Returns updated actions array (pure — no mutation).
 */
export function progressAllActions(actions: readonly UnifiedAction[]): UnifiedAction[]

/**
 * Collect actions whose current step completed this tick.
 */
export function collectCompletions(actions: readonly UnifiedAction[]): UnifiedAction[]

/**
 * Resolve a single uncontested action step.
 * Uses sigmoid→d100 from resolution.ts against the step's difficulty,
 * modified by actor's domain capability.
 */
export function resolveUncontestedStep(
  action: UnifiedAction,
  template: UnifiedActionTemplate,
  state: GameState,
  rng: () => number
): { outcome: StepOutcome; opsToExecute: readonly GraphOp[] }

/**
 * Execute resolution results: apply GraphOps, advance/complete action.
 * Returns the updated action and any tick events generated.
 */
export function executeStepResult(
  action: UnifiedAction,
  template: UnifiedActionTemplate,
  outcome: StepOutcome,
  ops: readonly GraphOp[],
  state: GameState,
  rng: () => number
): { updatedAction: UnifiedAction; events: TickEvent[] }
```

**Step 2: Tests for single-step resolution**

- 1-step action: progress → complete → resolve success → GraphOps executed → marked resolved
- 1-step action: progress → complete → resolve failure → onFailure GraphOps executed → marked failed
- Action not yet complete: progress increments but no resolution
- Priority ordering: if two actions complete same tick, higher-scale resolves first
- Trace emission on resolution

**Step 3: Run and iterate**

Run: `npx vitest run src/engine/__tests__/unifiedActionResolution.test.ts`

**Step 4: Commit**

```bash
git commit -m "feat: unified single-step resolution functions

Progress, collect completions, resolve uncontested steps, execute
GraphOps. Pure functions tested in isolation, not yet wired to
orchestrator."
```

#### Task 3C.2: Bridge — route CRUD actions through unified pipeline

**Files:**
- Modify: `src/engine/orchestrator.ts`
- Modify or create: `src/engine/unifiedActionPhases.ts` (thin orchestrator wrapper)

**Step 1: Write `phaseUnifiedActionProgress` wrapper**

This new phase function replaces `phaseActionProgress`. It operates on `state.unifiedActions` instead of `state.actionsInProgress`:

```typescript
export function phaseUnifiedActionProgress(state: GameState): Partial<GameState> {
  // 1. Progress all active unified actions
  const progressed = progressAllActions(state.unifiedActions);
  // 2. Collect completions
  const completing = collectCompletions(progressed);
  // 3. Sort by priority
  const sorted = sortByPriority(completing);
  // 4. Resolve each (uncontested for now — contestation in Sprint 4)
  // 5. Execute GraphOps
  // 6. Advance or complete
  // Return updated unifiedActions + new events
}
```

**Step 2: Swap in orchestrator**

In the orchestrator's `runTick` function, replace the call to `phaseActionProgress` with `phaseUnifiedActionProgress`. Keep `phaseAgentActions` and `phaseEncounterProgression` as-is — they still create old-format actions.

**Critical bridge requirement:** For this transitional state to work, `phaseAgentActions`'s CRUD initiation branch (lines 183-263) must *also* create a `UnifiedAction` alongside the old `ActionInProgress`. This is a temporary dual-write bridge:

```typescript
// In phaseAgentActions, when creating a CRUD action:
// 1. Still create old ActionInProgress (so old encounter-skip logic sees it)
// 2. Also create a UnifiedAction and push to state.unifiedActions
```

Alternatively, if dual-write is too messy: keep `phaseActionProgress` running on old `actionsInProgress` *and* run `phaseUnifiedActionProgress` on `unifiedActions` in parallel, but don't create any unified actions yet. The unified pipeline is "hot but empty" — it gets populated in Sub-sprint 3E when we replace initiation.

**Recommended approach:** Keep `phaseActionProgress` alive for now. Run the new `phaseUnifiedActionProgress` in parallel on the (currently empty) `unifiedActions` array. This is a no-op swap-in — the new code runs but doesn't affect the game because there are no unified actions yet. The real cutover happens in Sub-sprint 3E when initiation starts creating UnifiedActions instead of ActionInProgress.

**Step 3: Run all orchestrator tests**

Run: `npx vitest run src/engine/__tests__/orchestrator*.test.ts`
Expected: All pass — the new phase runs but is effectively a no-op on empty array.

**Step 4: Run full test suite**

Run: `npm test`

**Step 5: Commit**

```bash
git commit -m "feat: add phaseUnifiedActionProgress to orchestrator (parallel, no-op)

New unified action progress phase runs alongside old phaseActionProgress.
Currently processes empty unifiedActions array — becomes active when
initiation is swapped in Sub-sprint 3E."
```

---

### Sub-sprint 3D: Replace `phaseEncounterProgression` (multi-step resolution)

**Goal:** Extend the unified resolution to handle multi-step actions (encounters). After this sub-sprint, the unified pipeline can process both single-step and multi-step actions.

**What `phaseEncounterProgression` currently does** (orchestrator lines 327-394):
1. Finds active encounters from `state.encounterProgress`
2. Resolves current step via `resolveEncounter()` (domain capability check)
3. Advances encounter via `advanceEncounter()` (next step or complete/abandon)
4. Also has a second loop: 3% chance per tick to initiate new encounters for idle agents (this is initiation — moves to Sub-sprint 3E)

**What replaces it:**
- The unified resolution functions from 3C already handle step progression
- We need to extend them to call `advanceStep` after resolution (moving to next step or completing)
- The initiation loop (3% encounter chance) stays in old code until Sub-sprint 3E

#### Task 3D.1: Multi-step advancement in unified resolution

**Files:**
- Modify: `src/engine/unifiedActionResolution.ts`
- Modify: `src/engine/__tests__/unifiedActionResolution.test.ts`

**Step 1: Extend `executeStepResult` for multi-step**

`executeStepResult` already calls `advanceStep` from the lifecycle module. Verify it correctly handles:
- Step success on non-final step → advance to next step, compute new stepDuration
- Step failure with `fail_action` → mark entire action failed
- Step failure with `continue_weakened` → advance to next step with penalty context
- Final step success → mark action resolved with `success` outcome
- Per-step narrative generation using step's `narrativeTemplate`

**Step 2: Add multi-step tests**

- 3-step action: step 1 succeeds → advances, step 2 succeeds → advances, step 3 succeeds → resolved
- 3-step action: step 2 fails (fail_action) → entire action fails at step 2
- 3-step action: step 1 fails (continue_weakened) → advances to step 2 anyway
- Verify `stepOutcomes` array records each step's result
- Verify correct GraphOps execute per-step (step 1's onSuccess, then step 2's onSuccess, etc.)
- Verify events generated per-step include step number context

**Step 3: Run tests**

Run: `npx vitest run src/engine/__tests__/unifiedActionResolution.test.ts`

**Step 4: Commit**

```bash
git commit -m "feat: multi-step action resolution in unified pipeline

Extends unified resolution to handle 2-4 step actions with per-step
advancement, fail behaviors (fail_action / continue_weakened), and
per-step GraphOp execution. Covers encounter-equivalent functionality."
```

#### Task 3D.2: Verify `phaseUnifiedActionProgress` handles multi-step

**Files:**
- Modify: `src/engine/__tests__/unifiedActionPhases.test.ts`

**Step 1: Write integration test with pre-populated multi-step unified actions**

Manually insert a 3-step UnifiedAction into `state.unifiedActions` and run multiple ticks through `phaseUnifiedActionProgress`. Verify:
- Step 1 ticks down, resolves, advances to step 2
- Step 2 ticks down, resolves, advances to step 3
- Step 3 ticks down, resolves, action marked complete
- Events generated at each step transition

**Step 2: Run and verify**

Run: `npx vitest run src/engine/__tests__/unifiedActionPhases.test.ts`

**Step 3: Commit**

```bash
git commit -m "test: integration tests for multi-step unified action progression

Verifies the full lifecycle of a 3-step action through the unified
orchestrator phase: tick-by-tick progression, per-step resolution,
step advancement, and completion."
```

---

### Sub-sprint 3E: Replace `phaseAgentActions` (unified initiation)

**Goal:** Replace the most complex of the three old phases — the action/encounter initiation logic. After this sub-sprint, agents create `UnifiedAction` instances from `UNIFIED_ACTION_TEMPLATES` instead of split `ActionInProgress` + `EncounterProgress` from separate template sets.

**What `phaseAgentActions` currently does** (orchestrator lines 126-322):
1. Iterates over all individual actors
2. Skips if actor has active encounter or action
3. Rolls encounter vs CRUD vs routine action (probability cascade)
4. **Encounter branch:** generates encounter candidates → selection pipeline → `initiateEncounter()`
5. **CRUD branch:** generates action candidates → selection pipeline → `createAction()`
6. **Routine branch:** generates flavor-text event (no state change)
7. Also generates periodic notable events

**What replaces it:**
- Phase 7 (idle selection) of the unified pipeline
- One `generateUnifiedCandidates()` function replaces both `generateEncounterCandidates()` and `generateActionCandidates()`
- `createUnifiedAction()` replaces both `initiateEncounter()` and `createAction()`
- Routine events preserved (they're flavor, not actions)
- Notable event generation preserved

#### Task 3E.1: Unified candidate generation

**Files:**
- Create: `src/engine/unifiedCandidates.ts`
- Test: `src/engine/__tests__/unifiedCandidates.test.ts`

**Step 1: Write `generateUnifiedCandidates`**

Merges `generateActionCandidates` and `generateEncounterCandidates` into one function:

```typescript
export function generateUnifiedCandidates(
  graph: WorldGraph,
  actorId: string,
  locationId: string,
  templates: readonly UnifiedActionTemplate[]
): ActionCandidate[]
```

Filtering logic (same as current, but from one template set):
- Actor affinity match (template.actorAffinities includes actor's type)
- Location subtype match (if template specifies locationSubtypes)
- Reach domain capability check (actor has relevant domain capability)
- Returns candidates with scores based on motivations + actor profile

**Step 2: Tests**

- Actor with 'individual' type → gets personal/local scale templates only
- Actor at a 'settlement' location → gets settlement-valid templates
- Actor without shadow reach capability → doesn't get shadow-domain templates
- Candidates include both former-CRUD (1-step) and former-encounter (multi-step) templates
- No duplicate candidates from same template

**Step 3: Run and iterate**

Run: `npx vitest run src/engine/__tests__/unifiedCandidates.test.ts`

**Step 4: Commit**

```bash
git commit -m "feat: unified candidate generation from single template set

Merges generateActionCandidates + generateEncounterCandidates into
generateUnifiedCandidates. Filters by actor affinity, location
subtype, and domain capability. One template pool, one output format."
```

#### Task 3E.2: Unified idle selection phase

**Files:**
- Modify: `src/engine/unifiedActionPhases.ts`
- Test: `src/engine/__tests__/unifiedActionPhases.test.ts`

**Step 1: Implement `phaseIdleSelection`**

```typescript
export function phaseIdleSelection(state: GameState, rng: () => number): Partial<GameState> {
  const events: TickEvent[] = [];
  const newActions = [...state.unifiedActions];

  const actors = state.graph.getNodesByType('actor')
    .filter(n => n.properties.actorType === 'individual');

  for (const actor of actors) {
    // Skip if already has active unified action
    if (!isUnifiedAgentIdle(state.unifiedActions, actor.id)) continue;

    // Generate candidates from unified template set
    const candidates = generateUnifiedCandidates(graph, actor.id, locationId, UNIFIED_ACTION_TEMPLATES);

    if (candidates.length > 0) {
      // Selection pipeline (same as before — axiological scoring)
      const result = runSelectionPipeline(graph, actor.id, candidates, ...);
      const template = getUnifiedTemplateById(result.selected.templateId);

      if (template) {
        const action = createUnifiedAction({ ... });
        newActions.push(action);
        events.push({ ... });
      }
    } else {
      // Routine event (flavor text — no action created)
      // Preserve existing routine + notable event logic
    }
  }

  return { unifiedActions: newActions, tickEvents: [...state.tickEvents, ...events] };
}
```

**Step 2: Wire into orchestrator — the big swap**

This is the cutover point. In the orchestrator:

```typescript
// REMOVE:
// phaseAgentActions(state);        // was doing encounter+CRUD initiation
// phaseEncounterProgression(state); // was doing encounter tick+resolve
// phaseActionProgress(state);       // was doing CRUD tick+resolve

// REPLACE WITH:
phaseIdleSelection(state, rng);           // initiation (Phase 7)
phaseUnifiedActionProgress(state, rng);   // tick+resolve (Phases 1-6)
```

**Note on ordering:** In the old orchestrator, initiation happens *before* progression within the same tick. We preserve this: idle selection (Phase 7) runs first in tick order, then progression (Phases 1-6). This matches the current flow where `phaseAgentActions` runs before `phaseActionProgress`.

Wait — the design doc says Phase 7 (idle selection) is *last*. Let's reconcile: in the design, the idea is "resolve what's in flight, then fill idle slots." The current code does the opposite: "fill idle slots first, then progress existing actions." The design ordering is better (an agent shouldn't start a new action and progress it in the same tick), so we use:

```typescript
// Correct unified ordering:
phaseUnifiedActionProgress(state, rng);   // Phases 1-6: progress + resolve existing
phaseIdleSelection(state, rng);           // Phase 7: idle agents pick new actions
```

This is a behavior change from old code, but it's the correct one: newly created actions don't get a free tick of progress on their creation tick.

**Step 3: Disable old phases**

Comment out (don't delete) the old phase calls. Add `// DEPRECATED: replaced by unified pipeline` comments.

**Step 4: Run all tests, triage failures**

Run: `npm test`

Expected failures:
- Tests that directly call `phaseAgentActions` → update to call `phaseIdleSelection`
- Tests that check `state.actionsInProgress` → update to check `state.unifiedActions`
- Tests that check `state.encounterProgress` → update to check `state.unifiedActions`
- Tests that use old `ActionInProgress` type → update to use `UnifiedAction`

**Triage strategy:**
- Tests testing *behavior* (agent picks an action, action resolves) → migrate to unified types
- Tests testing *old implementation details* (specific encounter state shape) → mark `.todo` for Sprint 5 cleanup or delete if behavior is covered by new tests

**Step 5: Commit**

```bash
git commit -m "feat: unified initiation replaces phaseAgentActions

Agents now create UnifiedActions from unified template set via
generateUnifiedCandidates + selection pipeline. Old phaseAgentActions,
phaseEncounterProgression, phaseActionProgress commented out.
Unified pipeline is now the sole execution path for all actions."
```

---

### Sub-sprint 3F: Integration validation

**Goal:** Ensure the complete unified pipeline works end-to-end with no regressions.

#### Task 3F.1: End-to-end integration test

**Files:**
- Create: `src/engine/__tests__/unifiedPipeline-integration.test.ts`

**Step 1: Write a multi-tick integration test**

Set up a minimal game state with 3-4 actors, run 10 ticks through the unified pipeline, and verify:
- Idle agents pick actions from unified templates
- Single-step actions complete within expected tick range
- Multi-step actions advance through steps correctly
- Actions are visible in `state.unifiedActions` with correct fields
- Resolved actions have outcomes set
- GraphOps from successful actions mutate the graph correctly
- Events are generated at each resolution point
- No crashes (fail-soft principle)

**Step 2: Run and iterate**

Run: `npx vitest run src/engine/__tests__/unifiedPipeline-integration.test.ts`

#### Task 3F.2: Full regression check

**Step 1: Run all tests**

Run: `npm test`

**Step 2: Type-check**

Run: `npx tsc --noEmit`

**Step 3: Build**

Run: `npx vite build`

**Step 4: Triage any remaining failures**

If tests fail:
- Orchestrator tests referencing old phases → update or remove
- Snapshot tests with old state shape → update snapshots
- Component tests reading `actionsInProgress` → update to read `unifiedActions`

**Step 5: Commit**

```bash
git commit -m "test: end-to-end unified pipeline integration tests

Multi-tick integration test verifying the complete unified action
pipeline: idle selection, progression, resolution, GraphOp execution,
and step advancement across multiple actors and action types."
```

Sprint 3 complete. The unified pipeline is live. Old pipeline code is commented out but preserved for reference until Sprint 5 cleanup.

---

## Sprint 4: Contestation + Reactive Candidate Generation

**Goal:** Implement per-step contestation and the three mechanisms for frequent contests.

### Task 4.1: Contestation resolution

**Files:**
- Create: `src/engine/contestation.ts`
- Test: `src/engine/__tests__/contestation.test.ts`

**Step 1: Implement contestation detection and resolution**

```typescript
export interface ContestationPair {
  readonly attackerActionId: string;
  readonly defenderActionId: string;
  readonly targetId: string;
}

// Finds pairs of active actions with matching contestsWith on same target
export function detectContestations(
  actions: readonly UnifiedAction[],
  templates: readonly UnifiedActionTemplate[]
): ContestationPair[]

// Resolves a contested pair using dual independent rolls
export function resolveContestation(
  attacker: UnifiedAction,
  defender: UnifiedAction,
  attackerTemplate: UnifiedActionTemplate,
  defenderTemplate: UnifiedActionTemplate,
  state: GameState,
  rng: () => number
): { attackerOutcome: StepOutcome; defenderOutcome: StepOutcome }
```

Uses existing `resolveContestedAction` from `resolution.ts` for the dual roll.

**Step 2: Tests**

- Two opposing actions on same target → detected as pair
- Two non-opposing actions on same target → not paired
- Two opposing actions on different targets → not paired
- Resolution uses domain capability for both sides
- Defender wins ties (stability bias)

**Step 3: Wire into Phase 3 of the unified pipeline**

Replace the stub from Task 3.3 with real contestation detection.

**Step 4: Commit**

```bash
git commit -m "feat: per-step contestation detection and resolution

Detects opposing actions on same target via contestsWith template field.
Resolves via dual independent rolls. Defender wins ties."
```

---

### Task 4.2: Reactive candidate generation

**Files:**
- Modify: `src/engine/actionCandidates.ts` (or create `src/engine/unifiedCandidates.ts`)
- Test: `src/engine/__tests__/unifiedCandidates.test.ts`

**Step 1: Implement threat-reactive scoring**

When generating candidates, check for active hostile actions targeting the agent's location:

```typescript
export function generateUnifiedCandidates(
  graph: WorldGraph,
  actorId: string,
  locationId: string,
  activeActions: readonly UnifiedAction[],
  templates: readonly UnifiedActionTemplate[]
): ActionCandidate[]
```

If any active action targets this location and the actor's template `contestsWith` that action's template, boost that candidate's score by a `THREAT_REACTION_BONUS` (e.g., 0.5 — substantial but not guaranteed).

The agent's axiological profile still drives the final selection — a cowardly agent may still pick "Flee" over "Defend" even with the bonus. But for most agents, the threat signal makes defensive actions rise to the top.

**Step 2: Tests**

- No threat → candidates scored normally
- Active siege at location → "Defend" candidate gets bonus
- Cowardly agent still prefers Flee despite bonus (if values strongly favor it)
- Bonus doesn't apply to unrelated actions

**Step 3: Commit**

```bash
git commit -m "feat: threat-reactive candidate scoring for frequent contestation

Active hostile actions targeting agent's location boost defensive
candidate scores. Creates organic contestation without forcing it."
```

---

### Task 4.3: Contestation integration test

**Files:**
- Create: `src/engine/__tests__/contestation-integration.test.ts`

**Step 1: Write end-to-end contestation test**

Set up a scenario: faction A starts "Siege City" (15 ticks, regional), agent B at same location is idle, B's selection pipeline runs, B picks "Defend City" (reactive bonus), both tick down, when B's defense step completes on same tick as siege step → dual resolution fires.

**Step 2: Run and iterate**

Run: `npx vitest run src/engine/__tests__/contestation-integration.test.ts`

**Step 3: Commit**

Sprint 4 complete. Contestation works. Reactive candidates drive frequent contests.

---

## Sprint 5: Player Integration + UI + Cleanup

**Goal:** Make the Ascendant use the unified system, update UI to show all actions uniformly, remove old code.

### Task 5.1: Ascendant action execution via unified system

**Files:**
- Modify: `src/components/Game/hooks/useAgentInteraction.ts`
- Modify: `src/engine/dream.ts`

**Step 1: Replace `executeIntervention` with unified action creation**

When the player selects an intervention:
1. Look up the divine UnifiedActionTemplate (e.g., `divine.inspire`)
2. Check Essence cost (same as before)
3. Check AP availability (new — does Ascendant have a free slot?)
4. Create a `UnifiedAction` with `source: 'player'` and add to `state.unifiedActions`
5. The unified pipeline handles the rest — it ticks down (1 tick), resolves, executes the `apply_influence` GraphOp

**Step 2: Update tests**

Modify `useAgentInteraction-effects.test.tsx` and related tests to verify interventions create UnifiedActions instead of calling `applyInterventionEffects` directly.

**Step 3: Commit**

```bash
git commit -m "feat: Ascendant interventions use unified action pipeline

Divine interventions now create UnifiedActions with source='player'.
They tick down (1 tick minimum), resolve via standard pipeline, and
execute apply_influence GraphOps. AP slots now gate concurrency."
```

---

### Task 5.2: UI integration — action display on actors

**Files:**
- Modify: relevant tooltip/detail components (agent detail panel, tooltips)

**Step 1: Show current action on actor tooltip**

For any actor, look up their active UnifiedAction in `state.unifiedActions`. Display:
- Template name
- Step progress: "Step 2/3" for multi-step, or "3/5 ticks" for single-step
- Contested indicator if `contestedWith` is set

This applies uniformly to all actors — agents, factions, the Ascendant.

**Step 2: Show action in agent detail panel**

In the existing agent detail panel, add an "Activity" section showing:
- Current action name and progress bar
- Time remaining (ticks)
- If contested: who the opponent is

**Step 3: Commit**

```bash
git commit -m "feat: unified action display in tooltips and agent detail

All actors show their current action uniformly — same format for
Ascendant, agents, factions. Shows step progress, time remaining,
and contestation status."
```

---

### Task 5.3: Remove old systems

**Files:**
- Remove from orchestrator: `phaseAgentActions`, `phaseEncounterProgression`, `phaseActionProgress` (already bypassed in Sprint 3)
- Remove from GameState: `actionsInProgress`, `encounterProgress` fields
- Deprecate: `src/engine/actionLifecycle.ts` (replaced by unifiedActionLifecycle.ts)
- Deprecate: `src/engine/encounter.ts` lifecycle functions (replaced by unified pipeline)
- Keep: `src/engine/interventionEffects.ts` `buildValueOverlay` function (still needed for decay computation)
- Keep: `src/engine/encounter.ts` `resolveEncounter` capability computation (may be reused)
- Remove: old test files that test removed code, or update them to test unified equivalents

**Step 1: Remove old GameState fields**

Remove `actionsInProgress: ActionInProgress[]` and `encounterProgress: EncounterProgress[]` from GameState. Update gameInit. Fix all type errors.

**Step 2: Remove old orchestrator phases**

Delete the old phase functions from orchestrator.ts. They were already bypassed in Sprint 3.

**Step 3: Run full test suite**

Run: `npm test`
Fix all failures — some old tests will need updating or removal.

**Step 4: Type-check and build**

Run: `npx tsc --noEmit && npx vite build`

**Step 5: Commit**

```bash
git commit -m "chore: remove old action/encounter/intervention execution code

Removes ActionInProgress, EncounterProgress from GameState.
Removes phaseAgentActions, phaseEncounterProgression, phaseActionProgress.
Unified action pipeline is now the sole execution path."
```

---

### Task 5.4: Documentation updates

**Files:**
- Modify: `CLAUDE.md` — update system descriptions
- Modify: Obsidian vault notes via MCP — update CRUD Action System, Turn Economy, Action Points, Encounter System
- Modify: `Docs/changelog.md`
- Modify: `Docs/project-status.md`

**Step 1: Update CLAUDE.md**

Add note about unified action system. Update the "Load-Bearing Architectural Decisions" section to include: "Every action is a UnifiedAction. No separate encounter or intervention pipelines."

**Step 2: Update Obsidian notes**

- [[CRUD Action System]] — update to reference unified system
- [[Turn Economy]] — add 4 ticks ≈ 24 hours mapping, duration-as-reaction-window principle
- [[Action Points]] — note that Ascendant now uses AP
- Add new note: [[Unified Action System]] as the canonical reference

**Step 3: Changelog entry**

**Step 4: Commit**

```bash
git commit -m "docs: update documentation for unified action system

Updates CLAUDE.md, Obsidian vault, changelog, and project status.
Adds Unified Action System note. Documents 4 ticks ≈ 24 hours
time mapping and duration-as-reaction-window principle."
```

---

### Task 5.5: Final validation

**Step 1: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 2: Type-check**

Run: `npx tsc --noEmit`

**Step 3: Build**

Run: `npx vite build`

**Step 4: Verify test count**

The total test count should be similar to current (~2,680+). Some old tests removed, some new tests added. Net change should be roughly neutral or positive.

Sprint 5 complete. The unified action system is the sole execution path. All documentation updated.

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Sprint 3 orchestrator rewrite breaks many tests | Old phases kept as dead code until Sprint 5. Run tests after each task. |
| Encounter template migration loses nuance | Keep old encounter-content.ts as reference. Validate step counts and reach domains match. |
| Player-facing intervention feel changes | 1-tick divine actions still feel near-instant. AP gating is the new constraint — tune in playtesting. |
| Contestation too rare or too common | THREAT_REACTION_BONUS is a tunable constant. Adjust after playtest data. |
| Multi-step contestation too complex | Per-step resolution reuses existing dual-roll system. Complexity is in detection, not resolution. |

## Testing Strategy

Each sprint has its own test suite. Run `npm test` after every task. The overall approach:

- **Sprint 1:** Pure additive — nothing can break
- **Sprint 2:** Content migration — old tests still pass, new tests validate new format
- **Sprint 3:** Core rewrite — highest risk, most test churn. Old orchestrator tests updated.
- **Sprint 4:** Feature addition — new tests for contestation
- **Sprint 5:** Cleanup — test count stabilizes, old tests removed/migrated
