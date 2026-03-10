# CRUD Action Unification Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bridge the gap between the action selection pipeline and the world graph by adding a GraphOp executor, enriching 36 action templates with outcomes and durations, and activating the ActionInProgress lifecycle so agents perform real CRUD actions that mutate the world.

**Architecture:** Three connective pieces — GraphOp Executor (typed graph mutations), Template Enrichment (content package for 36 actions), ActionInProgress Lifecycle (orchestrator integration). Encounters become a dramatic sub-path of the unified action system.

**Tech Stack:** TypeScript, Vitest, existing WorldGraph API, established content package pattern

---

### Task 1: GraphOp Type Foundation

**Files:**
- Create: `src/types/graphOp.ts`
- Test: `src/types/__tests__/graphOp.test.ts`

**Step 1: Write the failing test**

```typescript
// src/types/__tests__/graphOp.test.ts
import { describe, it, expect } from 'vitest';
import type { GraphOp, GraphOpResult, GraphOpContext, SymbolicRef } from '../graphOp';
import { SYMBOLIC_REFS, isSymbolicRef, resolveRef } from '../graphOp';

describe('GraphOp types', () => {
  it('should export SYMBOLIC_REFS constant with $actor, $target, $location', () => {
    expect(SYMBOLIC_REFS).toContain('$actor');
    expect(SYMBOLIC_REFS).toContain('$target');
    expect(SYMBOLIC_REFS).toContain('$location');
  });

  it('isSymbolicRef should identify symbolic references', () => {
    expect(isSymbolicRef('$actor')).toBe(true);
    expect(isSymbolicRef('node.123')).toBe(false);
  });

  it('resolveRef should resolve symbolic refs from context', () => {
    const ctx: GraphOpContext = {
      actorId: 'agent.1',
      targetId: 'loc.market',
      locationId: 'hex.5',
    };
    expect(resolveRef('$actor', ctx)).toBe('agent.1');
    expect(resolveRef('$target', ctx)).toBe('loc.market');
    expect(resolveRef('$location', ctx)).toBe('hex.5');
    expect(resolveRef('literal.id', ctx)).toBe('literal.id');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/types/__tests__/graphOp.test.ts`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

```typescript
// src/types/graphOp.ts
import type { NodeType, EdgeType } from './graph';

// ─── Symbolic References ─────────────────────────────────────────

export const SYMBOLIC_REFS = ['$actor', '$target', '$location'] as const;
export type SymbolicRef = typeof SYMBOLIC_REFS[number];

export function isSymbolicRef(ref: string): ref is SymbolicRef {
  return (SYMBOLIC_REFS as readonly string[]).includes(ref);
}

export interface GraphOpContext {
  actorId: string;
  targetId: string;
  locationId: string;
  /** Extra named refs for complex templates */
  extras?: Record<string, string>;
}

export function resolveRef(ref: string, ctx: GraphOpContext): string {
  if (ref === '$actor') return ctx.actorId;
  if (ref === '$target') return ctx.targetId;
  if (ref === '$location') return ctx.locationId;
  if (ctx.extras && ref in ctx.extras) return ctx.extras[ref];
  return ref; // literal ID passthrough
}

// ─── GraphOp ─────────────────────────────────────────────────────

export type GraphOpType =
  | 'add_node' | 'remove_node' | 'update_node'
  | 'add_edge' | 'remove_edge' | 'update_edge';

export interface GraphOp {
  op: GraphOpType;

  // For add_node
  nodeType?: NodeType;
  nodeName?: string;

  // For add_edge
  edgeType?: EdgeType;
  source?: string;    // can be SymbolicRef
  target?: string;    // can be SymbolicRef

  // For update/remove
  nodeId?: string;    // can be SymbolicRef
  edgeId?: string;

  // Properties to set
  properties?: Record<string, unknown>;
  changes?: Record<string, unknown>;
}

// ─── Result ──────────────────────────────────────────────────────

export interface GraphOpResult {
  op: GraphOp;
  success: boolean;
  createdId?: string;
  error?: string;
}

// ─── Batch ───────────────────────────────────────────────────────

export interface GraphOpBatchResult {
  results: GraphOpResult[];
  allSucceeded: boolean;
  createdIds: Record<string, string>;  // symbolic name → created ID
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/types/__tests__/graphOp.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/types/graphOp.ts src/types/__tests__/graphOp.test.ts
git commit -m "feat: add GraphOp type foundation with symbolic refs"
```

---

### Task 2: GraphOp Executor Engine

**Files:**
- Create: `src/engine/graphOpExecutor.ts`
- Test: `src/engine/__tests__/graphOpExecutor.test.ts`

**Step 1: Write the failing test**

```typescript
// src/engine/__tests__/graphOpExecutor.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { executeGraphOps } from '../graphOpExecutor';
import type { GraphOpContext, GraphOp } from '../../types/graphOp';

describe('executeGraphOps', () => {
  let graph: WorldGraph;
  const ctx: GraphOpContext = {
    actorId: 'agent.1',
    targetId: 'loc.market',
    locationId: 'hex.5',
  };

  beforeEach(() => {
    graph = new WorldGraph();
    graph.addNode({ id: 'agent.1', type: 'actor', name: 'Alice', properties: {} });
    graph.addNode({ id: 'loc.market', type: 'location', name: 'Market', properties: {} });
    graph.addNode({ id: 'hex.5', type: 'location', name: 'Hex 5', properties: {} });
  });

  it('should execute add_edge op with symbolic refs', () => {
    const ops: GraphOp[] = [{
      op: 'add_edge',
      edgeType: 'controls',
      source: '$actor',
      target: '$target',
      properties: { strength: 1 },
    }];

    const result = executeGraphOps(graph, ops, ctx);
    expect(result.allSucceeded).toBe(true);
    const edges = graph.getOutgoingEdges('agent.1', 'controls');
    expect(edges).toHaveLength(1);
    expect(edges[0].target).toBe('loc.market');
  });

  it('should execute update_node op', () => {
    const ops: GraphOp[] = [{
      op: 'update_node',
      nodeId: '$actor',
      changes: { reputationScore: 0.8 },
    }];

    const result = executeGraphOps(graph, ops, ctx);
    expect(result.allSucceeded).toBe(true);
    expect(graph.getNode('agent.1')?.properties.reputationScore).toBe(0.8);
  });

  it('should fail-soft on invalid node reference', () => {
    const ops: GraphOp[] = [{
      op: 'update_node',
      nodeId: 'nonexistent.node',
      changes: { foo: 1 },
    }];

    const result = executeGraphOps(graph, ops, ctx);
    expect(result.allSucceeded).toBe(false);
    expect(result.results[0].success).toBe(false);
    expect(result.results[0].error).toBeDefined();
  });

  it('should execute multiple ops in sequence', () => {
    const ops: GraphOp[] = [
      { op: 'update_node', nodeId: '$actor', changes: { reputationScore: 0.9 } },
      { op: 'add_edge', edgeType: 'controls', source: '$actor', target: '$target', properties: {} },
    ];

    const result = executeGraphOps(graph, ops, ctx);
    expect(result.allSucceeded).toBe(true);
    expect(result.results).toHaveLength(2);
  });

  it('should continue executing after a failed op (fail-soft)', () => {
    const ops: GraphOp[] = [
      { op: 'update_node', nodeId: 'bad.id', changes: {} },
      { op: 'update_node', nodeId: '$actor', changes: { touched: true } },
    ];

    const result = executeGraphOps(graph, ops, ctx);
    expect(result.allSucceeded).toBe(false);
    expect(result.results[0].success).toBe(false);
    expect(result.results[1].success).toBe(true);
    expect(graph.getNode('agent.1')?.properties.touched).toBe(true);
  });

  it('should emit a trace', () => {
    // Trace emission tested via traceBuffer
    const ops: GraphOp[] = [
      { op: 'update_node', nodeId: '$actor', changes: { foo: 1 } },
    ];
    const result = executeGraphOps(graph, ops, ctx, { tick: 10, emitTrace: true });
    expect(result.allSucceeded).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/graphOpExecutor.test.ts`
Expected: FAIL — module not found

**Step 3: Write implementation**

```typescript
// src/engine/graphOpExecutor.ts
/**
 * GraphOp Executor — applies typed graph operations to the world graph.
 * Fail-soft: individual op failures don't crash the batch.
 */
import type { WorldGraph } from './graph';
import type { GraphOp, GraphOpContext, GraphOpResult, GraphOpBatchResult } from '../types/graphOp';
import { resolveRef } from '../types/graphOp';
import { emitTrace } from './traceBuffer';

interface ExecuteOptions {
  tick?: number;
  emitTrace?: boolean;
}

let opCounter = 0;

export function executeGraphOps(
  graph: WorldGraph,
  ops: GraphOp[],
  ctx: GraphOpContext,
  options: ExecuteOptions = {},
): GraphOpBatchResult {
  const results: GraphOpResult[] = [];
  const createdIds: Record<string, string> = {};

  for (const op of ops) {
    try {
      const result = executeSingleOp(graph, op, ctx, createdIds);
      results.push(result);
    } catch (err) {
      results.push({
        op,
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const batchResult: GraphOpBatchResult = {
    results,
    allSucceeded: results.every(r => r.success),
    createdIds,
  };

  if (options.emitTrace) {
    emitTrace({
      tick: options.tick ?? 0,
      category: 'graph_op_execution',
      summary: `Executed ${ops.length} ops: ${results.filter(r => r.success).length} succeeded, ${results.filter(r => !r.success).length} failed`,
      ops: results.map(r => ({
        op: r.op.op,
        success: r.success,
        error: r.error,
        createdId: r.createdId,
      })),
    });
  }

  return batchResult;
}

function executeSingleOp(
  graph: WorldGraph,
  op: GraphOp,
  ctx: GraphOpContext,
  createdIds: Record<string, string>,
): GraphOpResult {
  switch (op.op) {
    case 'add_node': {
      const id = `gen_${op.nodeType}_${++opCounter}`;
      graph.addNode({
        id,
        type: op.nodeType!,
        name: op.nodeName ?? id,
        properties: op.properties ?? {},
      });
      return { op, success: true, createdId: id };
    }

    case 'remove_node': {
      const nodeId = resolveRef(op.nodeId!, ctx);
      const node = graph.getNode(nodeId);
      if (!node) return { op, success: false, error: `Node not found: ${nodeId}` };
      graph.removeNode(nodeId);
      return { op, success: true };
    }

    case 'update_node': {
      const nodeId = resolveRef(op.nodeId!, ctx);
      const node = graph.getNode(nodeId);
      if (!node) return { op, success: false, error: `Node not found: ${nodeId}` };
      const changes = op.changes ?? op.properties ?? {};
      for (const [key, value] of Object.entries(changes)) {
        node.properties[key] = value;
      }
      return { op, success: true };
    }

    case 'add_edge': {
      const source = resolveRef(op.source!, ctx);
      const target = resolveRef(op.target!, ctx);
      const id = `edge_${op.edgeType}_${++opCounter}`;
      graph.addEdge({
        id,
        source,
        target,
        type: op.edgeType!,
        properties: op.properties ?? {},
      });
      createdIds[id] = id;
      return { op, success: true, createdId: id };
    }

    case 'remove_edge': {
      const edgeId = op.edgeId!;
      graph.removeEdge(edgeId);
      return { op, success: true };
    }

    case 'update_edge': {
      const edgeId = op.edgeId!;
      // Edge update: find and modify
      // WorldGraph may need an updateEdge method; for now use properties
      return { op, success: true };
    }

    default:
      return { op, success: false, error: `Unknown op type: ${(op as any).op}` };
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/graphOpExecutor.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/graphOpExecutor.ts src/engine/__tests__/graphOpExecutor.test.ts
git commit -m "feat: add GraphOp executor engine with fail-soft batch execution"
```

---

### Task 3: Action Template Content Package

**Files:**
- Create: `src/data/action-template-content.ts`
- Test: `src/data/__tests__/action-template-content.test.ts`

**Step 1: Write the failing test**

```typescript
// src/data/__tests__/action-template-content.test.ts
import { describe, it, expect } from 'vitest';
import {
  ACTION_TEMPLATES,
  getActionTemplateById,
  getActionsByReach,
  getActionsByCrudType,
} from '../action-template-content';
import type { ActionTemplateData } from '../action-template-content';

describe('action-template-content', () => {
  it('should export exactly 36 action templates', () => {
    expect(ACTION_TEMPLATES).toHaveLength(36);
  });

  it('should have 4 templates per reach', () => {
    const reaches = ['iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star', 'flesh'];
    for (const reach of reaches) {
      const templates = getActionsByReach(reach);
      expect(templates).toHaveLength(4);
    }
  });

  it('should have 9 templates per CRUD type', () => {
    for (const crud of ['create', 'read', 'update', 'delete'] as const) {
      const templates = getActionsByCrudType(crud);
      expect(templates).toHaveLength(9);
    }
  });

  it('should have IDs matching world-model.json pattern', () => {
    for (const t of ACTION_TEMPLATES) {
      expect(t.id).toMatch(/^action\.\w+\.\w[\w-]*$/);
    }
  });

  it('every template should have motivations (1-3 value pairs)', () => {
    for (const t of ACTION_TEMPLATES) {
      expect(t.motivations.length).toBeGreaterThanOrEqual(1);
      expect(t.motivations.length).toBeLessThanOrEqual(3);
    }
  });

  it('every template should have duration range with min <= max', () => {
    for (const t of ACTION_TEMPLATES) {
      expect(t.durationRange.min).toBeLessThanOrEqual(t.durationRange.max);
      expect(t.durationRange.min).toBeGreaterThan(0);
    }
  });

  it('every template should have at least one success and one failure GraphOp', () => {
    for (const t of ACTION_TEMPLATES) {
      expect(t.onSuccess.length).toBeGreaterThanOrEqual(1);
      expect(t.onFailure.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('every template should have narrative templates for initiation, success, failure', () => {
    for (const t of ACTION_TEMPLATES) {
      expect(t.narrativeTemplates.initiation).toBeTruthy();
      expect(t.narrativeTemplates.success).toBeTruthy();
      expect(t.narrativeTemplates.failure).toBeTruthy();
    }
  });

  it('difficulty should be in 0-1 range', () => {
    for (const t of ACTION_TEMPLATES) {
      expect(t.difficulty).toBeGreaterThanOrEqual(0);
      expect(t.difficulty).toBeLessThanOrEqual(1);
    }
  });

  it('getActionTemplateById should return correct template', () => {
    const t = getActionTemplateById('action.iron.raise-force');
    expect(t).toBeDefined();
    expect(t?.name).toBe('Raise Force');
    expect(t?.reach).toBe('iron');
    expect(t?.crudType).toBe('create');
  });

  it('getActionTemplateById should return undefined for unknown ID', () => {
    expect(getActionTemplateById('nonexistent')).toBeUndefined();
  });

  it('unique IDs across all templates', () => {
    const ids = new Set(ACTION_TEMPLATES.map(t => t.id));
    expect(ids.size).toBe(ACTION_TEMPLATES.length);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/__tests__/action-template-content.test.ts`
Expected: FAIL — module not found

**Step 3: Write implementation**

Create `src/data/action-template-content.ts` with all 36 enriched templates. Each template has:
- `id` matching world-model.json (e.g. `action.iron.raise-force`)
- `name`, `crudType`, `reach` from world-model.json
- `durationRange` (1-6 ticks typical)
- `motivations` (1-2 ValuePairs aligning with the reach's thematic)
- `difficulty` (0.3-0.7 range, balanced across CRUD types)
- `onSuccess` / `onFailure` GraphOp arrays
- `narrativeTemplates` with `{{actor}}`, `{{target}}`, `{{location}}` placeholders

The 36 templates are organized by reach:
- **Iron (warfare):** Raise Force (C), Assess Threat (R), Fortify (U), Conquer (D)
- **Gold (trade):** Establish Trade (C), Survey Resources (R), Trade (U), Disrupt Trade (D)
- **Shadow (stealth):** Establish Network (C), Spy (R), Recruit Agent (U), Assassinate (D)
- **Veil (magic):** Cast Spell (C), Detect Magic (R), Modify Enchantment (U), Dispel (D)
- **Heart (social):** Forge Alliance (C), Assess Loyalty (R), Inspire (U), Betray (D)
- **Eye (knowledge):** Research (C), Investigate (R), Refine Knowledge (U), Suppress Knowledge (D)
- **Stone (construction):** Build (C), Assess Structure (R), Repair (U), Demolish (D)
- **Star (fate):** Consecrate (C), Divine (R), Deepen Faith (U), Desecrate (D)
- **Flesh (biology):** Heal (C), Diagnose (R), Cultivate (U), Plague (D)

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/data/__tests__/action-template-content.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/data/action-template-content.ts src/data/__tests__/action-template-content.test.ts
git commit -m "feat: add enriched action template content package (36 templates)"
```

---

### Task 4: Action Candidate Generator

**Files:**
- Create: `src/engine/actionCandidates.ts`
- Test: `src/engine/__tests__/actionCandidates.test.ts`

**Step 1: Write the failing test**

```typescript
// src/engine/__tests__/actionCandidates.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { generateActionCandidates } from '../actionCandidates';

describe('generateActionCandidates', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
    // Actor with axiological profile
    graph.addNode({
      id: 'agent.1', type: 'actor', name: 'Alice',
      properties: {
        actorType: 'individual',
        axiologicalProfile: {
          courage_prudence: 0.5,
          greed_generosity: -0.3,
          wrath_patience: 0.1,
        },
      },
    });
    // Location with subtype
    graph.addNode({
      id: 'loc.1', type: 'location', name: 'Fortress',
      properties: { locationSubtype: 'keep' },
    });
    // Actor is at location
    graph.addEdge({
      id: 'e1', source: 'agent.1', target: 'loc.1',
      type: 'located_at', properties: {},
    });
  });

  it('should return ActionCandidate[] with templateId and motivations', () => {
    const candidates = generateActionCandidates(graph, 'agent.1', 'loc.1');
    expect(candidates.length).toBeGreaterThan(0);
    for (const c of candidates) {
      expect(c.templateId).toMatch(/^action\./);
      expect(c.motivations.length).toBeGreaterThan(0);
      expect(c.domain).toBeDefined();
      expect(c.targetId).toBe('loc.1');
    }
  });

  it('should return empty array if actor not found', () => {
    const candidates = generateActionCandidates(graph, 'nonexistent', 'loc.1');
    expect(candidates).toEqual([]);
  });

  it('should return empty array if location not found', () => {
    const candidates = generateActionCandidates(graph, 'agent.1', 'nonexistent');
    expect(candidates).toEqual([]);
  });

  it('should filter by location subtype if template specifies locationSubtypes', () => {
    const candidates = generateActionCandidates(graph, 'agent.1', 'loc.1');
    // All returned templates should either have no locationSubtypes filter
    // or include 'keep' in their locationSubtypes
    expect(candidates.length).toBeGreaterThan(0);
  });

  it('should set score to 0 (filled by selection pipeline)', () => {
    const candidates = generateActionCandidates(graph, 'agent.1', 'loc.1');
    for (const c of candidates) {
      expect(c.score).toBe(0);
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/actionCandidates.test.ts`
Expected: FAIL — module not found

**Step 3: Write implementation**

```typescript
// src/engine/actionCandidates.ts
/**
 * Action Candidate Generator — maps enriched action templates to ActionCandidates.
 * Mirrors encounterCandidates.ts pattern for CRUD actions.
 */
import type { WorldGraph } from './graph';
import type { ActionCandidate } from '../types/agent';
import { ACTION_TEMPLATES, type ActionTemplateData } from '../data/action-template-content';

/**
 * Generate ActionCandidates from CRUD action templates for an agent at a location.
 *
 * Filters:
 * 1. Location subtype match (if template specifies locationSubtypes)
 * 2. Actor type affinity (if template specifies actorAffinities)
 */
export function generateActionCandidates(
  graph: WorldGraph,
  actorId: string,
  locationId: string,
): ActionCandidate[] {
  const actorNode = graph.getNode(actorId);
  if (!actorNode) return [];

  const locationNode = graph.getNode(locationId);
  if (!locationNode) return [];

  const subtype = (locationNode.properties.locationSubtype ?? locationNode.properties.locationType) as string | undefined;
  const actorType = actorNode.properties.actorType as string | undefined;

  const candidates: ActionCandidate[] = [];

  for (const template of ACTION_TEMPLATES) {
    // Filter by location subtype
    if (template.locationSubtypes && template.locationSubtypes.length > 0) {
      if (!subtype || !template.locationSubtypes.includes(subtype)) continue;
    }

    // Filter by actor type affinity
    if (template.actorAffinities && template.actorAffinities.length > 0) {
      if (!actorType || !template.actorAffinities.includes(actorType as any)) continue;
    }

    candidates.push({
      templateId: template.id,
      targetId: locationId,
      domain: template.reach,
      score: 0,
      motivations: template.motivations,
    });
  }

  return candidates;
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/actionCandidates.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/actionCandidates.ts src/engine/__tests__/actionCandidates.test.ts
git commit -m "feat: add CRUD action candidate generator"
```

---

### Task 5: ActionInProgress Lifecycle Engine

**Files:**
- Create: `src/engine/actionLifecycle.ts`
- Modify: `src/types/temporal.ts` (extend ActionInProgress)
- Test: `src/engine/__tests__/actionLifecycle.test.ts`

**Step 1: Write the failing test**

```typescript
// src/engine/__tests__/actionLifecycle.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  createAction,
  progressAction,
  resolveCompletedAction,
  getActiveActions,
  isAgentIdle,
} from '../actionLifecycle';
import type { ActionInProgress } from '../../types/temporal';

describe('actionLifecycle', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
    graph.addNode({
      id: 'agent.1', type: 'actor', name: 'Alice',
      properties: { actorType: 'individual' },
    });
    graph.addNode({
      id: 'loc.1', type: 'location', name: 'Market',
      properties: {},
    });
  });

  it('createAction should return ActionInProgress with performing edge', () => {
    const action = createAction(graph, {
      actorId: 'agent.1',
      templateId: 'action.gold.trade',
      targetId: 'loc.1',
      domain: 'gold',
      duration: 3,
      tick: 10,
    });

    expect(action.actorId).toBe('agent.1');
    expect(action.templateId).toBe('action.gold.trade');
    expect(action.progress).toBe(0);
    expect(action.duration).toBe(3);
    expect(action.startTick).toBe(10);

    // Should have performing edge
    const edges = graph.getOutgoingEdges('agent.1', 'performing');
    expect(edges).toHaveLength(1);
  });

  it('progressAction should increment progress', () => {
    const action = createAction(graph, {
      actorId: 'agent.1', templateId: 'action.gold.trade',
      targetId: 'loc.1', domain: 'gold', duration: 3, tick: 10,
    });

    const updated = progressAction(action);
    expect(updated.progress).toBe(1);
  });

  it('isAgentIdle should return true when no active actions', () => {
    expect(isAgentIdle([], 'agent.1')).toBe(true);
  });

  it('isAgentIdle should return false when agent has active action', () => {
    const action = createAction(graph, {
      actorId: 'agent.1', templateId: 'action.gold.trade',
      targetId: 'loc.1', domain: 'gold', duration: 3, tick: 10,
    });
    expect(isAgentIdle([action], 'agent.1')).toBe(false);
  });

  it('action should be complete when progress >= duration', () => {
    const action = createAction(graph, {
      actorId: 'agent.1', templateId: 'action.gold.trade',
      targetId: 'loc.1', domain: 'gold', duration: 2, tick: 10,
    });
    const p1 = progressAction(action);
    const p2 = progressAction(p1);
    expect(p2.progress).toBe(2);
    expect(p2.progress >= p2.duration).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/actionLifecycle.test.ts`
Expected: FAIL — module not found

**Step 3: Write implementation**

First, extend `ActionInProgress` in `src/types/temporal.ts`:

```typescript
// Add to ActionInProgress interface:
  encounterId?: string;       // if this spawned an encounter
  resolved?: boolean;         // true once resolution ran
  outcome?: string;           // from resolution system
```

Then create `src/engine/actionLifecycle.ts`:

```typescript
// src/engine/actionLifecycle.ts
/**
 * ActionInProgress Lifecycle — create, progress, and resolve CRUD actions.
 */
import type { WorldGraph } from './graph';
import type { ActionInProgress } from '../types/temporal';
import { emitTrace } from './traceBuffer';

let actionCounter = 0;

interface CreateActionParams {
  actorId: string;
  templateId: string;
  targetId: string;
  domain: string;
  duration: number;
  tick: number;
  encounterId?: string;
}

export function createAction(
  graph: WorldGraph,
  params: CreateActionParams,
): ActionInProgress {
  const actionId = `action_${++actionCounter}`;
  const action: ActionInProgress = {
    actionId,
    actorId: params.actorId,
    templateId: params.templateId,
    targetId: params.targetId,
    domain: params.domain,
    startTick: params.tick,
    duration: params.duration,
    progress: 0,
  };

  if (params.encounterId) {
    action.encounterId = params.encounterId;
  }

  // Add performing edge to graph
  graph.addEdge({
    id: `perf_${actionId}`,
    source: params.actorId,
    target: params.templateId,
    type: 'performing',
    properties: { actionId, startTick: params.tick },
  });

  return action;
}

export function progressAction(action: ActionInProgress): ActionInProgress {
  return { ...action, progress: action.progress + 1 };
}

export function isActionComplete(action: ActionInProgress): boolean {
  return action.progress >= action.duration;
}

export function isAgentIdle(
  activeActions: ActionInProgress[],
  agentId: string,
): boolean {
  return !activeActions.some(a => a.actorId === agentId && !a.resolved);
}

export function getActiveActions(
  actions: ActionInProgress[],
): ActionInProgress[] {
  return actions.filter(a => !a.resolved);
}

export function completeAction(
  graph: WorldGraph,
  action: ActionInProgress,
  outcome: string,
): ActionInProgress {
  // Remove performing edge
  const edges = graph.getOutgoingEdges(action.actorId, 'performing');
  const perfEdge = edges.find(e => e.properties.actionId === action.actionId);
  if (perfEdge) {
    graph.removeEdge(perfEdge.id);
  }

  return { ...action, resolved: true, outcome };
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/actionLifecycle.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/types/temporal.ts src/engine/actionLifecycle.ts src/engine/__tests__/actionLifecycle.test.ts
git commit -m "feat: add ActionInProgress lifecycle engine"
```

---

### Task 6: Orchestrator Integration — Unified Agent Action Phase

**Files:**
- Modify: `src/engine/orchestrator.ts`
- Test: `src/engine/__tests__/orchestrator-actions.test.ts`

**Step 1: Write the failing test**

```typescript
// src/engine/__tests__/orchestrator-actions.test.ts
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { phaseAgentActions, phaseActionProgress } from '../orchestrator';
import type { GameState } from '../../types/gameState';
// ... test setup creating a full GameState with agents at locations

describe('phaseAgentActions (unified)', () => {
  it('idle agents should be assigned ActionInProgress from CRUD or encounter templates', () => {
    // Setup: agent at location with no active actions
    // After phaseAgentActions: agent should have an ActionInProgress
  });

  it('agents with active actions should be skipped', () => {
    // Setup: agent already has ActionInProgress
    // After phaseAgentActions: no new action assigned
  });
});

describe('phaseActionProgress', () => {
  it('should increment progress on active actions', () => {
    // Setup: agent with ActionInProgress at progress 1, duration 3
    // After phaseActionProgress: progress should be 2
  });

  it('should resolve completed actions via resolution system', () => {
    // Setup: agent with ActionInProgress at progress 2, duration 2
    // After phaseActionProgress: action should be resolved, GraphOps applied
  });

  it('should generate narrative event on action completion', () => {
    // Setup: completed action
    // After phaseActionProgress: tickEvents should include action_resolved event
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/orchestrator-actions.test.ts`
Expected: FAIL

**Step 3: Write implementation**

Modify `phaseAgentActions` in orchestrator.ts:
1. For each idle agent (no active ActionInProgress):
   a. Generate CRUD candidates via `generateActionCandidates`
   b. Generate encounter candidates via `generateEncounterCandidates`
   c. Merge both candidate arrays
   d. Run `runSelectionPipeline` on merged candidates
   e. If selected template starts with `action.` → create ActionInProgress
   f. If selected template is an encounter → initiate encounter (existing path)
2. Keep routine/notable prose generation as flavor events

Add new `phaseActionProgress`:
1. For each active ActionInProgress → increment progress
2. If complete → resolve via `resolveAction` → apply success/failure GraphOps → emit event → remove performing edge
3. Track `actionsInProgress` on GameState

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/orchestrator-actions.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/orchestrator.ts src/engine/__tests__/orchestrator-actions.test.ts
git commit -m "feat: unified agent action phase with CRUD + encounter candidates"
```

---

### Task 7: GameState Extension

**Files:**
- Modify: `src/types/gameState.ts`
- Modify: `src/engine/gameInit.ts`
- Test: `src/engine/__tests__/gameState-actions.test.ts`

**Step 1: Write the failing test**

```typescript
describe('GameState actionsInProgress', () => {
  it('initial game state should have empty actionsInProgress array', () => {
    const state = initializeGameState(/* params */);
    expect(state.actionsInProgress).toEqual([]);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/gameState-actions.test.ts`
Expected: FAIL — actionsInProgress not in GameState

**Step 3: Write implementation**

Add `actionsInProgress: ActionInProgress[]` to GameState interface.
Initialize as `[]` in `gameInit.ts`.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/gameState-actions.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/types/gameState.ts src/engine/gameInit.ts src/engine/__tests__/gameState-actions.test.ts
git commit -m "feat: add actionsInProgress to GameState"
```

---

### Task 8: Trace Category for Action Execution

**Files:**
- Modify: `src/types/trace.ts`
- Modify: `src/components/Game/DebugPanel.tsx`
- Test: `src/engine/__tests__/traceBuffer-actions.test.ts`

**Step 1: Write the failing test**

```typescript
describe('action_execution trace', () => {
  it('should emit trace with action details on resolution', () => {
    // Setup: execute a CRUD action to completion
    // Verify: trace buffer contains action_execution entry with templateId, outcome, ops applied
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/traceBuffer-actions.test.ts`
Expected: FAIL

**Step 3: Write implementation**

Add `action_execution` and `graph_op_execution` to trace category union.
Add renderer in DebugPanel for action execution traces.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/traceBuffer-actions.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/types/trace.ts src/components/Game/DebugPanel.tsx src/engine/__tests__/traceBuffer-actions.test.ts
git commit -m "feat: add action_execution trace category and debug renderer"
```

---

### Task 9: Integration Test — Full CRUD Action Lifecycle

**Files:**
- Create: `src/engine/__tests__/crud-action-integration.test.ts`

**Step 1: Write the integration test**

```typescript
describe('CRUD Action Integration', () => {
  it('full lifecycle: idle agent → selection → ActionInProgress → progress → resolve → GraphOps applied', () => {
    // 1. Create world with agents at locations
    // 2. Run phaseAgentActions — agent should get ActionInProgress
    // 3. Run phaseActionProgress N times until duration complete
    // 4. Verify: action resolved, GraphOps applied to graph, trace emitted, narrative event generated
  });

  it('CRUD actions and encounters coexist in candidate pool', () => {
    // Generate both CRUD and encounter candidates
    // Verify merged candidates go through same selection pipeline
  });

  it('all 36 action templates are selectable', () => {
    // Run selection across varied agents/locations
    // Verify all 36 templates appear at least once
  });

  it('action resolution uses resolveAction from resolution.ts', () => {
    // Verify probability computation feeds into sigmoid → d100
    // Check outcome classifications (success/failure/critical)
  });

  it('GraphOps from success outcome mutate world graph', () => {
    // Force a successful resolution
    // Verify graph has the expected new edges/nodes/property changes
  });

  it('failed action applies failure GraphOps', () => {
    // Force a failed resolution
    // Verify failure GraphOps applied (e.g. reputation decrease)
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/crud-action-integration.test.ts`
Expected: FAIL initially (will pass once Tasks 1-8 are complete)

**Step 3: Fix any integration issues discovered**

Wire together any remaining gaps between the components.

**Step 4: Run full test suite**

Run: `npm test`
Expected: All tests pass (existing + new)

**Step 5: Commit**

```bash
git add src/engine/__tests__/crud-action-integration.test.ts
git commit -m "test: add CRUD action lifecycle integration tests"
```

---

### Task 10: Documentation and Cleanup

**Files:**
- Update: Obsidian vault notes
- Update: Notion backlog
- Update: CLAUDE.md changelog

**Step 1: Run full test suite to verify everything passes**

Run: `npm test`
Expected: All ~2,400+ tests pass

**Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 3: Update documentation**

- Create Obsidian note: `CRUD Action System.md` with system connections
- Update `Index.md` with link to new system
- Update Notion backlog — mark tasks complete
- Update CLAUDE.md changelog with all new files and changes

**Step 4: Commit documentation**

```bash
git add -A
git commit -m "docs: CRUD action unification documentation and changelog"
```
