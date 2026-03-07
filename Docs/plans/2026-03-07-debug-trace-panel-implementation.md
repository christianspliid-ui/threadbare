# Debug Trace Panel — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a structured trace system and in-game debug panel for inspecting agent decisions, narrative generation, context harvesting, dilemma resolution, and tick summaries.

**Architecture:** A ring buffer (`traceBuffer.ts`) holds `TraceEntry` discriminated-union objects emitted via `emitTrace()`. Engine functions (orchestrator phases, selection pipeline, narrative, context builder, disposition) call `emitTrace()` with structured data. A toggleable `DebugPanel` React component reads the buffer and renders three modes: Feed, Agent Follow, Tick Inspector. Tracing is off by default (zero-cost boolean gate).

**Tech Stack:** TypeScript, React, Vitest. No external dependencies.

---

### Task 1: TraceEntry Types

**Files:**
- Create: `src/types/trace.ts`
- Test: `src/types/__tests__/trace.test.ts`

**Step 1: Write the type file**

Create `src/types/trace.ts` with:

```typescript
import type { SphereName } from './index';

/** Base shape for all trace entries */
export interface TraceBase {
  id: number;
  tick: number;
  timestamp: number;
  category: string;
  agentId?: string;
  summary: string;
}

/** Stage snapshot for action selection pipeline */
export interface PipelineStageSnapshot {
  stageName: string;
  candidateIds: string[];
  scores: number[];
  notes?: string;
}

/** Trace: agent picks an action via 5-stage pipeline */
export interface ActionSelectionTrace extends TraceBase {
  category: 'action_selection';
  stages: PipelineStageSnapshot[];
  finalPick: { templateId: string; targetId: string; score: number; probability: number };
}

/** Trace: prose generated for a narrative event */
export interface NarrativeGenerationTrace extends TraceBase {
  category: 'narrative_generation';
  tier: 'routine' | 'notable' | 'chronicle';
  templateId?: string;
  sphereWords?: string[];
  personalityClause?: string;
  finalProse: string;
}

/** Trace: context builder harvest→rank→select pipeline */
export interface ContextHarvestTrace extends TraceBase {
  category: 'context_harvest';
  harvestedCount: number;
  rankedTop: { nodeId: string; name: string; score: number }[];
  selectedIds: string[];
  oppositionTension: number;
}

/** Trace: 2×2 dilemma resolved between two agents */
export interface DilemmaResolutionTrace extends TraceBase {
  category: 'dilemma_resolution';
  targetId: string;
  actorStrategy: string;
  targetStrategy: string;
  actorMove: 'cooperate' | 'defect';
  targetMove: 'cooperate' | 'defect';
  outcome: string;
  stakes: number;
  sentimentDelta: number;
  reputationDeltas: { actor: number; target: number };
}

/** Trace: tick completes with summary counts */
export interface TickSummaryTrace extends TraceBase {
  category: 'tick_summary';
  phaseEventCounts: Record<string, number>;
  agentsProcessed: number;
  doomStage: number;
  essenceTotal: number;
  mandateProgress: number;
}

/** Discriminated union of all trace types */
export type TraceEntry =
  | ActionSelectionTrace
  | NarrativeGenerationTrace
  | ContextHarvestTrace
  | DilemmaResolutionTrace
  | TickSummaryTrace;

/** All known trace categories (auto-discovered by panel, but useful for type-safe filters) */
export const TRACE_CATEGORIES = [
  'action_selection',
  'narrative_generation',
  'context_harvest',
  'dilemma_resolution',
  'tick_summary',
] as const;

export type TraceCategory = (typeof TRACE_CATEGORIES)[number];
```

**Step 2: Write the test file**

Create `src/types/__tests__/trace.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { TRACE_CATEGORIES } from '../trace';
import type {
  TraceBase, TraceEntry, ActionSelectionTrace, NarrativeGenerationTrace,
  ContextHarvestTrace, DilemmaResolutionTrace, TickSummaryTrace,
} from '../trace';

describe('Trace types', () => {
  it('TRACE_CATEGORIES contains all 5 categories', () => {
    expect(TRACE_CATEGORIES).toHaveLength(5);
    expect(TRACE_CATEGORIES).toContain('action_selection');
    expect(TRACE_CATEGORIES).toContain('narrative_generation');
    expect(TRACE_CATEGORIES).toContain('context_harvest');
    expect(TRACE_CATEGORIES).toContain('dilemma_resolution');
    expect(TRACE_CATEGORIES).toContain('tick_summary');
  });

  it('ActionSelectionTrace satisfies TraceEntry union', () => {
    const trace: TraceEntry = {
      id: 0, tick: 1, timestamp: Date.now(), category: 'action_selection',
      agentId: 'a1', summary: 'test',
      stages: [{ stageName: 'goalAlignment', candidateIds: ['c1'], scores: [0.5] }],
      finalPick: { templateId: 't1', targetId: 'a2', score: 0.8, probability: 0.6 },
    };
    expect(trace.category).toBe('action_selection');
  });

  it('NarrativeGenerationTrace satisfies TraceEntry union', () => {
    const trace: TraceEntry = {
      id: 1, tick: 1, timestamp: Date.now(), category: 'narrative_generation',
      summary: 'test', tier: 'routine', finalProse: 'A thing happened.',
    };
    expect(trace.category).toBe('narrative_generation');
  });

  it('ContextHarvestTrace satisfies TraceEntry union', () => {
    const trace: TraceEntry = {
      id: 2, tick: 1, timestamp: Date.now(), category: 'context_harvest',
      summary: 'test', harvestedCount: 5, rankedTop: [], selectedIds: [], oppositionTension: 0.3,
    };
    expect(trace.category).toBe('context_harvest');
  });

  it('DilemmaResolutionTrace satisfies TraceEntry union', () => {
    const trace: TraceEntry = {
      id: 3, tick: 1, timestamp: Date.now(), category: 'dilemma_resolution',
      agentId: 'a1', targetId: 'a2', summary: 'test',
      actorStrategy: 'tit-for-tat', targetStrategy: 'grudger',
      actorMove: 'cooperate', targetMove: 'defect',
      outcome: 'betrayed', stakes: 0.7,
      sentimentDelta: -0.15, reputationDeltas: { actor: -0.025, target: 0.05 },
    };
    expect(trace.category).toBe('dilemma_resolution');
  });

  it('TickSummaryTrace satisfies TraceEntry union', () => {
    const trace: TraceEntry = {
      id: 4, tick: 1, timestamp: Date.now(), category: 'tick_summary',
      summary: 'test', phaseEventCounts: { doom: 1 },
      agentsProcessed: 5, doomStage: 2, essenceTotal: 100, mandateProgress: 0.5,
    };
    expect(trace.category).toBe('tick_summary');
  });
});
```

**Step 3: Run tests**

Run: `npx vitest run src/types/__tests__/trace.test.ts`
Expected: 5 tests PASS

**Step 4: Export from types index**

Modify `src/types/index.ts` — add `export * from './trace';` alongside existing exports.

**Step 5: Commit**

```bash
git add src/types/trace.ts src/types/__tests__/trace.test.ts src/types/index.ts
git commit -m "feat(trace): add TraceEntry discriminated union types — 5 categories"
```

---

### Task 2: Trace Buffer Module

**Files:**
- Create: `src/engine/traceBuffer.ts`
- Test: `src/engine/__tests__/traceBuffer.test.ts`

**Step 1: Write the failing tests**

Create `src/engine/__tests__/traceBuffer.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import {
  emitTrace, getTraces, getTracesForAgent, clearTraces,
  enableTracing, disableTracing, isTracingEnabled,
} from '../traceBuffer';
import type { TickSummaryTrace } from '../../types/trace';

describe('traceBuffer', () => {
  beforeEach(() => {
    disableTracing();   // reset between tests
    enableTracing();
  });

  it('emitTrace adds entry to buffer with auto-id and timestamp', () => {
    emitTrace({
      tick: 1, category: 'tick_summary', summary: 'Tick 1 done',
      phaseEventCounts: {}, agentsProcessed: 3, doomStage: 0, essenceTotal: 50, mandateProgress: 0,
    } as Omit<TickSummaryTrace, 'id' | 'timestamp'>);

    const traces = getTraces();
    expect(traces).toHaveLength(1);
    expect(traces[0].id).toBe(0);
    expect(traces[0].timestamp).toBeGreaterThan(0);
    expect(traces[0].summary).toBe('Tick 1 done');
  });

  it('does not emit when tracing is disabled', () => {
    disableTracing();
    emitTrace({
      tick: 1, category: 'tick_summary', summary: 'should not appear',
      phaseEventCounts: {}, agentsProcessed: 0, doomStage: 0, essenceTotal: 0, mandateProgress: 0,
    } as Omit<TickSummaryTrace, 'id' | 'timestamp'>);
    expect(getTraces()).toHaveLength(0);
  });

  it('auto-increments ids', () => {
    for (let i = 0; i < 3; i++) {
      emitTrace({
        tick: i, category: 'tick_summary', summary: `Tick ${i}`,
        phaseEventCounts: {}, agentsProcessed: 0, doomStage: 0, essenceTotal: 0, mandateProgress: 0,
      } as Omit<TickSummaryTrace, 'id' | 'timestamp'>);
    }
    const ids = getTraces().map(t => t.id);
    expect(ids).toEqual([0, 1, 2]);
  });

  it('evicts oldest when buffer exceeds BUFFER_SIZE', () => {
    for (let i = 0; i < 510; i++) {
      emitTrace({
        tick: i, category: 'tick_summary', summary: `Tick ${i}`,
        phaseEventCounts: {}, agentsProcessed: 0, doomStage: 0, essenceTotal: 0, mandateProgress: 0,
      } as Omit<TickSummaryTrace, 'id' | 'timestamp'>);
    }
    const traces = getTraces();
    expect(traces.length).toBeLessThanOrEqual(500);
    expect(traces[0].tick).toBe(10); // first 10 evicted
  });

  it('getTracesForAgent filters by agentId', () => {
    emitTrace({
      tick: 1, category: 'action_selection', agentId: 'agent-1', summary: 'Agent 1 acted',
      stages: [], finalPick: { templateId: 't1', targetId: 'a2', score: 0.5, probability: 0.5 },
    } as any);
    emitTrace({
      tick: 1, category: 'action_selection', agentId: 'agent-2', summary: 'Agent 2 acted',
      stages: [], finalPick: { templateId: 't2', targetId: 'a3', score: 0.6, probability: 0.4 },
    } as any);

    const agent1Traces = getTracesForAgent('agent-1');
    expect(agent1Traces).toHaveLength(1);
    expect(agent1Traces[0].agentId).toBe('agent-1');
  });

  it('clearTraces empties the buffer', () => {
    emitTrace({
      tick: 1, category: 'tick_summary', summary: 'test',
      phaseEventCounts: {}, agentsProcessed: 0, doomStage: 0, essenceTotal: 0, mandateProgress: 0,
    } as Omit<TickSummaryTrace, 'id' | 'timestamp'>);
    expect(getTraces()).toHaveLength(1);
    clearTraces();
    expect(getTraces()).toHaveLength(0);
  });

  it('disableTracing clears buffer and resets id counter', () => {
    emitTrace({
      tick: 1, category: 'tick_summary', summary: 'test',
      phaseEventCounts: {}, agentsProcessed: 0, doomStage: 0, essenceTotal: 0, mandateProgress: 0,
    } as Omit<TickSummaryTrace, 'id' | 'timestamp'>);
    disableTracing();
    expect(getTraces()).toHaveLength(0);
    enableTracing();
    emitTrace({
      tick: 2, category: 'tick_summary', summary: 'after reset',
      phaseEventCounts: {}, agentsProcessed: 0, doomStage: 0, essenceTotal: 0, mandateProgress: 0,
    } as Omit<TickSummaryTrace, 'id' | 'timestamp'>);
    expect(getTraces()[0].id).toBe(0); // reset
  });

  it('isTracingEnabled reflects current state', () => {
    expect(isTracingEnabled()).toBe(true);
    disableTracing();
    expect(isTracingEnabled()).toBe(false);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/engine/__tests__/traceBuffer.test.ts`
Expected: FAIL — module not found

**Step 3: Implement traceBuffer.ts**

Create `src/engine/traceBuffer.ts`:

```typescript
import type { TraceEntry } from '../types/trace';

const BUFFER_SIZE = 500;

let buffer: TraceEntry[] = [];
let nextId = 0;
let enabled = false;

export function enableTracing(): void {
  enabled = true;
}

export function disableTracing(): void {
  enabled = false;
  buffer = [];
  nextId = 0;
}

export function isTracingEnabled(): boolean {
  return enabled;
}

export function emitTrace(entry: Omit<TraceEntry, 'id' | 'timestamp'>): void {
  if (!enabled) return;
  buffer.push({ ...entry, id: nextId++, timestamp: Date.now() } as TraceEntry);
  if (buffer.length > BUFFER_SIZE) buffer.shift();
}

export function getTraces(): readonly TraceEntry[] {
  return buffer;
}

export function getTracesForAgent(agentId: string): TraceEntry[] {
  return buffer.filter(t => t.agentId === agentId);
}

export function getTracesForTick(tick: number): TraceEntry[] {
  return buffer.filter(t => t.tick === tick);
}

export function clearTraces(): void {
  buffer = [];
}
```

**Step 4: Run tests**

Run: `npx vitest run src/engine/__tests__/traceBuffer.test.ts`
Expected: 8 tests PASS

**Step 5: Commit**

```bash
git add src/engine/traceBuffer.ts src/engine/__tests__/traceBuffer.test.ts
git commit -m "feat(trace): add trace buffer with ring eviction and zero-cost toggle"
```

---

### Task 3: Instrument Orchestrator — Tick Summary Trace

**Files:**
- Modify: `src/engine/orchestrator.ts`
- Test: `src/engine/__tests__/traceBuffer-orchestrator.test.ts`

This is the simplest instrumentation point — emit one `tick_summary` trace at the end of `runTick()`. Establishes the pattern for all subsequent instrumentation.

**Step 1: Write the failing test**

Create `src/engine/__tests__/traceBuffer-orchestrator.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { enableTracing, disableTracing, getTraces } from '../traceBuffer';
import { runTick } from '../orchestrator';
import { seedWorld } from '../worldSeed';
import type { GameState } from '../../types/gameState';

describe('orchestrator tick_summary trace', () => {
  let state: GameState;

  beforeEach(() => {
    disableTracing();
    enableTracing();
    const seed = seedWorld({ seed: 42, avatarName: 'Test', archetype: 'seeker' });
    state = seed.state;
    state.phase = 'playing';
  });

  it('emits a tick_summary trace after runTick', () => {
    const next = runTick(state);
    const traces = getTraces().filter(t => t.category === 'tick_summary');
    expect(traces).toHaveLength(1);
    const summary = traces[0];
    expect(summary.tick).toBe(next.tick);
    expect(summary.summary).toContain('Tick');
    expect((summary as any).agentsProcessed).toBeGreaterThanOrEqual(0);
    expect((summary as any).doomStage).toBeGreaterThanOrEqual(0);
  });

  it('does not emit tick_summary when tracing is disabled', () => {
    disableTracing();
    runTick(state);
    expect(getTraces()).toHaveLength(0);
  });
});
```

**Step 2: Run to verify failure**

Run: `npx vitest run src/engine/__tests__/traceBuffer-orchestrator.test.ts`
Expected: FAIL — no tick_summary traces emitted

**Step 3: Instrument orchestrator.ts**

At the top of `orchestrator.ts`, add import:
```typescript
import { emitTrace } from './traceBuffer';
```

At the end of `runTick()`, just before the return statement, add:
```typescript
// Emit tick summary trace
emitTrace({
  tick: merged.tick,
  category: 'tick_summary',
  summary: `Tick ${merged.tick}: ${merged.tickEvents.length} events, doom stage ${merged.doomClock.currentStage}`,
  phaseEventCounts: merged.tickEvents.reduce((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>),
  agentsProcessed: merged.tickEvents.filter(e => e.type === 'agent_action_resolved').length,
  doomStage: merged.doomClock.currentStage,
  essenceTotal: Object.values(merged.essencePool.pools).reduce((s, p) => s + p.current, 0),
  mandateProgress: merged.mandates?.[0]?.progress ?? 0,
});
```

Note: The exact field names (`merged`, `tickEvents`, `doomClock`, `essencePool`) may vary slightly — check the actual local variable names in `runTick()`. The pattern is: gather summary data from the merged state, call `emitTrace()`.

**Step 4: Run tests**

Run: `npx vitest run src/engine/__tests__/traceBuffer-orchestrator.test.ts`
Expected: 2 tests PASS

Also run full orchestrator tests to ensure no regressions:
Run: `npx vitest run src/engine/__tests__/orchestrator.test.ts`
Expected: All existing tests PASS

**Step 5: Commit**

```bash
git add src/engine/orchestrator.ts src/engine/__tests__/traceBuffer-orchestrator.test.ts
git commit -m "feat(trace): instrument orchestrator with tick_summary trace"
```

---

### Task 4: Instrument Agent Action Selection

**Files:**
- Modify: `src/engine/agentSelection.ts` (or `agentActions.ts` — check actual filename)
- Modify: `src/engine/orchestrator.ts` (phaseAgentActions)
- Test: `src/engine/__tests__/traceBuffer-actions.test.ts`

Emit an `action_selection` trace after each agent's action is selected, capturing all 5 pipeline stages.

**Step 1: Write the failing test**

Create `src/engine/__tests__/traceBuffer-actions.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { enableTracing, disableTracing, getTraces } from '../traceBuffer';
import { runTick } from '../orchestrator';
import { seedWorld } from '../worldSeed';
import type { GameState } from '../../types/gameState';
import type { ActionSelectionTrace } from '../../types/trace';

describe('action_selection trace', () => {
  let state: GameState;

  beforeEach(() => {
    disableTracing();
    enableTracing();
    // Use a seed known to produce agent actions (15% per-tick chance per agent)
    // Run multiple ticks to increase likelihood
    const seed = seedWorld({ seed: 42, avatarName: 'Test', archetype: 'seeker' });
    state = seed.state;
    state.phase = 'playing';
  });

  it('emits action_selection trace when an agent acts', () => {
    // Run up to 20 ticks to get at least one agent action
    let found = false;
    for (let i = 0; i < 20 && !found; i++) {
      state = runTick(state);
      const actionTraces = getTraces().filter(t => t.category === 'action_selection');
      if (actionTraces.length > 0) {
        found = true;
        const trace = actionTraces[0] as ActionSelectionTrace;
        expect(trace.agentId).toBeTruthy();
        expect(trace.stages).toBeInstanceOf(Array);
        expect(trace.stages.length).toBeGreaterThan(0);
        expect(trace.finalPick).toBeTruthy();
        expect(trace.finalPick.templateId).toBeTruthy();
        expect(trace.summary).toContain('chose');
      }
    }
    expect(found).toBe(true);
  });

  it('action_selection trace includes pipeline stage snapshots', () => {
    for (let i = 0; i < 30; i++) {
      state = runTick(state);
    }
    const actionTraces = getTraces().filter(t => t.category === 'action_selection') as ActionSelectionTrace[];
    if (actionTraces.length > 0) {
      const trace = actionTraces[0];
      // Each stage should have a name and candidate data
      for (const stage of trace.stages) {
        expect(stage.stageName).toBeTruthy();
        expect(stage.candidateIds).toBeInstanceOf(Array);
        expect(stage.scores).toBeInstanceOf(Array);
      }
    }
  });
});
```

**Step 2: Run to verify failure**

Run: `npx vitest run src/engine/__tests__/traceBuffer-actions.test.ts`
Expected: FAIL — no action_selection traces found

**Step 3: Instrument the selection pipeline**

In the file that runs the agent action selection pipeline (likely called from `phaseAgentActions` in `orchestrator.ts` or in a separate `agentActions.ts`/`agentSelection.ts`), add `emitTrace()` after the pipeline completes:

```typescript
import { emitTrace } from './traceBuffer';

// After pipeline produces a SelectionResult:
emitTrace({
  tick: state.tick,
  category: 'action_selection',
  agentId: actorId,
  summary: `${actorName} chose ${result.selected.templateId} targeting ${result.selected.targetId} (score: ${result.selected.score.toFixed(2)}, p: ${(result.selected.probability ?? 0).toFixed(2)})`,
  stages: [
    { stageName: 'goalAlignment', candidateIds: candidates.map(c => c.templateId), scores: candidates.map(c => c.score) },
    // Add snapshots for disposition, personality, topN, probability stages
    // Capture the scores/candidates array at each step
  ],
  finalPick: {
    templateId: result.selected.templateId,
    targetId: result.selected.targetId,
    score: result.selected.score,
    probability: result.selected.probability ?? 0,
  },
});
```

The exact implementation depends on where in the code the pipeline stages happen. The key principle: capture candidate arrays and scores at each stage boundary. If stages are inline in one function, snapshot the array after each transform. If stages are separate functions, add a snapshot after each call returns.

**Step 4: Run tests**

Run: `npx vitest run src/engine/__tests__/traceBuffer-actions.test.ts`
Expected: PASS

Run full test suite to check regressions:
Run: `npx vitest run src/engine/__tests__/`
Expected: All PASS

**Step 5: Commit**

```bash
git add src/engine/agentSelection.ts src/engine/orchestrator.ts src/engine/__tests__/traceBuffer-actions.test.ts
git commit -m "feat(trace): instrument action selection pipeline with stage snapshots"
```

---

### Task 5: Instrument Narrative Generation

**Files:**
- Modify: `src/engine/narrative.ts`
- Test: `src/engine/__tests__/traceBuffer-narrative.test.ts`

Emit a `narrative_generation` trace each time prose is generated (routine, notable, or chronicle tier).

**Step 1: Write the failing test**

Create `src/engine/__tests__/traceBuffer-narrative.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { enableTracing, disableTracing, getTraces } from '../traceBuffer';
import { generateRoutineProse, generateNotableProse } from '../narrative';
import type { NarrativeGenerationTrace } from '../../types/trace';
import type { ProseContext } from '../../types/narrative';

describe('narrative_generation trace', () => {
  beforeEach(() => {
    disableTracing();
    enableTracing();
  });

  it('emits trace for routine prose generation', () => {
    const context: ProseContext = {
      sphere: 'force',
      actorName: 'Kael',
      targetName: 'Mira',
      locationName: 'Iron Gate',
    };
    generateRoutineProse('agent_action', context, 42);

    const traces = getTraces().filter(t => t.category === 'narrative_generation') as NarrativeGenerationTrace[];
    expect(traces).toHaveLength(1);
    expect(traces[0].tier).toBe('routine');
    expect(traces[0].finalProse).toBeTruthy();
    expect(traces[0].summary).toContain('routine');
  });

  it('emits trace for notable prose generation', () => {
    const context: ProseContext = {
      sphere: 'mind',
      actorName: 'Sera',
      targetName: 'Vorn',
      locationName: 'Silver Hall',
      dominantValues: [{ left: 'loyalty', right: 'treachery', balance: 0.7 }],
    };
    generateNotableProse('agent_action', context, 99);

    const traces = getTraces().filter(t => t.category === 'narrative_generation') as NarrativeGenerationTrace[];
    expect(traces).toHaveLength(1);
    expect(traces[0].tier).toBe('notable');
    expect(traces[0].personalityClause).toBeDefined();
  });
});
```

Note: The exact function arguments (`NarrativeEventType`, `ProseContext` shape, `ValuePair` structure) must match the actual codebase — check `src/engine/narrative.ts` and `src/types/narrative.ts` for exact signatures. Adjust test inputs accordingly.

**Step 2: Run to verify failure**

Run: `npx vitest run src/engine/__tests__/traceBuffer-narrative.test.ts`
Expected: FAIL — no narrative_generation traces found

**Step 3: Instrument narrative.ts**

Add `import { emitTrace } from './traceBuffer';` at the top.

In `generateRoutineProse()`, just before the return:
```typescript
emitTrace({
  tick: 0, // narrative doesn't know the tick — caller can set if needed
  category: 'narrative_generation',
  summary: `routine prose: "${result.text.slice(0, 60)}..."`,
  tier: 'routine',
  templateId: selectedTemplate?.id,
  sphereWords: [adj, verb, noun].filter(Boolean),
  finalProse: result.text,
});
```

In `generateNotableProse()`, just before the return:
```typescript
emitTrace({
  tick: 0,
  category: 'narrative_generation',
  summary: `notable prose: "${result.text.slice(0, 60)}..."`,
  tier: 'notable',
  templateId: selectedTemplate?.id,
  sphereWords: [adj, verb, noun].filter(Boolean),
  personalityClause: personalityClause ?? undefined,
  finalProse: result.text,
});
```

**Step 4: Run tests**

Run: `npx vitest run src/engine/__tests__/traceBuffer-narrative.test.ts`
Expected: PASS

Run existing narrative tests:
Run: `npx vitest run src/engine/__tests__/narrative.test.ts`
Expected: All PASS

**Step 5: Commit**

```bash
git add src/engine/narrative.ts src/engine/__tests__/traceBuffer-narrative.test.ts
git commit -m "feat(trace): instrument narrative prose generation (routine + notable)"
```

---

### Task 6: Instrument Context Builder + Dilemma Resolution

**Files:**
- Modify: `src/engine/contextBuilder.ts`
- Modify: `src/engine/disposition.ts`
- Test: `src/engine/__tests__/traceBuffer-context.test.ts`
- Test: `src/engine/__tests__/traceBuffer-dilemma.test.ts`

Two simpler instrumentation points — each emits one trace at function exit.

**Step 1: Write failing tests for context harvest**

Create `src/engine/__tests__/traceBuffer-context.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { enableTracing, disableTracing, getTraces } from '../traceBuffer';
import { buildNarrativeContext } from '../contextBuilder';
import type { ContextHarvestTrace } from '../../types/trace';
import type { NarrativeEvent } from '../../types/narrative';

describe('context_harvest trace', () => {
  beforeEach(() => {
    disableTracing();
    enableTracing();
  });

  it('emits context_harvest trace for notable/chronicle events', () => {
    // Create a minimal notable NarrativeEvent and WorldGraph
    // The exact shape depends on the codebase — adjust accordingly
    const event: NarrativeEvent = {
      id: 'test-1', type: 'agent_action', tier: 'notable',
      actorId: 'a1', tick: 5, message: 'test', significance: 0.9,
      sphere: 'force',
    } as any;

    // Need a WorldGraph with at least one actor — build from seedWorld
    // This may need to use seedWorld() to get a real graph
    // Placeholder — adjust to actual buildNarrativeContext signature
    const result = buildNarrativeContext(event, /* graph */ {} as any);

    const traces = getTraces().filter(t => t.category === 'context_harvest') as ContextHarvestTrace[];
    expect(traces).toHaveLength(1);
    expect(traces[0].harvestedCount).toBeGreaterThanOrEqual(0);
    expect(traces[0].oppositionTension).toBeGreaterThanOrEqual(0);
  });

  it('does NOT emit context_harvest trace for routine events', () => {
    const event = { tier: 'routine' } as any;
    buildNarrativeContext(event, {} as any);
    const traces = getTraces().filter(t => t.category === 'context_harvest');
    expect(traces).toHaveLength(0);
  });
});
```

**Step 2: Write failing tests for dilemma resolution**

Create `src/engine/__tests__/traceBuffer-dilemma.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { enableTracing, disableTracing, getTraces } from '../traceBuffer';
import { resolveDilemma, applyDilemmaEffects } from '../disposition';
import type { DilemmaResolutionTrace } from '../../types/trace';

describe('dilemma_resolution trace', () => {
  beforeEach(() => {
    disableTracing();
    enableTracing();
  });

  it('emits dilemma_resolution trace when dilemma is resolved', () => {
    const dilemma = resolveDilemma(
      'actor-1', 'target-1',
      'tit-for-tat', 'grudger',
      [], [], // empty histories = first move
      10, 'trade dispute', 0.7
    );

    const traces = getTraces().filter(t => t.category === 'dilemma_resolution') as DilemmaResolutionTrace[];
    expect(traces).toHaveLength(1);
    expect(traces[0].actorStrategy).toBe('tit-for-tat');
    expect(traces[0].targetStrategy).toBe('grudger');
    expect(traces[0].actorMove).toBeTruthy();
    expect(traces[0].targetMove).toBeTruthy();
    expect(traces[0].outcome).toBeTruthy();
    expect(traces[0].stakes).toBe(0.7);
  });
});
```

**Step 3: Run to verify failures**

Run: `npx vitest run src/engine/__tests__/traceBuffer-context.test.ts src/engine/__tests__/traceBuffer-dilemma.test.ts`
Expected: FAIL

**Step 4: Instrument contextBuilder.ts**

Add import and emit at the end of `buildNarrativeContext()`:

```typescript
import { emitTrace } from './traceBuffer';

// At end of buildNarrativeContext, before return:
emitTrace({
  tick: event.tick ?? 0,
  category: 'context_harvest',
  agentId: event.actorId,
  summary: `Context: ${harvested.length} harvested → ${selected.length} selected, tension ${oppositionSummary.tensionScore.toFixed(2)}`,
  harvestedCount: harvested.length,
  rankedTop: ranked.slice(0, 5).map(o => ({ nodeId: o.nodeId, name: o.name, score: o.relevanceScore })),
  selectedIds: selected.map(o => o.nodeId),
  oppositionTension: oppositionSummary.tensionScore,
});
```

**Step 5: Instrument disposition.ts**

Add import and emit at the end of `resolveDilemma()`:

```typescript
import { emitTrace } from './traceBuffer';

// At end of resolveDilemma, before return:
const effects = applyDilemmaEffects(dilemma.outcome);
emitTrace({
  tick: tick,
  category: 'dilemma_resolution',
  agentId: actorId,
  targetId: targetId,
  summary: `Dilemma: ${actorId} (${actorStrategy}) vs ${targetId} (${targetStrategy}) → ${dilemma.outcome}`,
  actorStrategy: actorStrategy,
  targetStrategy: targetStrategy,
  actorMove: dilemma.actorMove,
  targetMove: dilemma.targetMove,
  outcome: dilemma.outcome,
  stakes: stakes,
  sentimentDelta: effects.sentimentDelta,
  reputationDeltas: { actor: effects.actorRepDelta, target: effects.targetRepDelta },
});
```

**Step 6: Run tests**

Run: `npx vitest run src/engine/__tests__/traceBuffer-context.test.ts src/engine/__tests__/traceBuffer-dilemma.test.ts`
Expected: PASS

Run full disposition + context tests:
Run: `npx vitest run src/engine/__tests__/disposition.test.ts src/engine/__tests__/contextBuilder.test.ts`
Expected: All PASS

**Step 7: Commit**

```bash
git add src/engine/contextBuilder.ts src/engine/disposition.ts src/engine/__tests__/traceBuffer-context.test.ts src/engine/__tests__/traceBuffer-dilemma.test.ts
git commit -m "feat(trace): instrument context builder and dilemma resolution"
```

---

### Task 7: DebugPanel React Component — Right-Side Drawer with Structured Renderers

**Files:**
- Create: `src/components/Game/DebugPanel.tsx`
- Test: `src/components/Game/__tests__/DebugPanel.test.tsx`

**Design Reference:** See `Docs/plans/2026-03-07-debug-trace-panel-design.md` Decision 5 for the full UI specification.

**Step 1: Write the failing tests**

Create `src/components/Game/__tests__/DebugPanel.test.tsx`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DebugPanel } from '../DebugPanel';
import { enableTracing, disableTracing, emitTrace } from '../../../engine/traceBuffer';

describe('DebugPanel', () => {
  beforeEach(() => {
    disableTracing();
    enableTracing();
  });

  it('renders as a right-side drawer with Feed mode by default', () => {
    render(<DebugPanel currentTick={5} />);
    const panel = screen.getByTestId('debug-panel');
    expect(panel).toBeTruthy();
    expect(screen.getByText('Feed')).toBeTruthy();
    expect(screen.getByText('Agent')).toBeTruthy();
    expect(screen.getByText('Tick')).toBeTruthy();
  });

  it('displays trace entries with human-readable summaries', () => {
    emitTrace({
      tick: 1, category: 'tick_summary',
      summary: 'Tick 1: 3 events, doom stage 2, essence 50',
      phaseEventCounts: { agent_actions: 2, doom_escalation: 1 },
      agentsProcessed: 3, doomStage: 2, essenceTotal: 50, mandateProgress: 0.4,
    } as any);
    render(<DebugPanel currentTick={1} />);
    expect(screen.getByText(/Tick 1: 3 events/)).toBeTruthy();
  });

  it('shows category badge with correct color', () => {
    emitTrace({ tick: 1, category: 'action_selection', summary: 'Kael chose RAID', agentId: 'a1', stages: [], finalPick: {} } as any);
    render(<DebugPanel currentTick={1} />);
    const badge = screen.getByText('action_selection');
    expect(badge).toBeTruthy();
    // Badge should have tan (#d4a574) color
  });

  it('filters by category when checkbox toggled', () => {
    emitTrace({ tick: 1, category: 'tick_summary', summary: 'Summary trace' } as any);
    emitTrace({ tick: 1, category: 'action_selection', summary: 'Action trace', agentId: 'a1', stages: [], finalPick: {} } as any);

    render(<DebugPanel currentTick={1} />);
    expect(screen.getByText(/Summary trace/)).toBeTruthy();
    expect(screen.getByText(/Action trace/)).toBeTruthy();

    const checkbox = screen.getByLabelText(/tick_summary/i);
    fireEvent.click(checkbox);
    expect(screen.queryByText(/Summary trace/)).toBeNull();
    expect(screen.getByText(/Action trace/)).toBeTruthy();
  });

  it('switches to Agent Follow mode and filters by agent', () => {
    emitTrace({ tick: 1, category: 'action_selection', summary: 'Kael chose RAID', agentId: 'agent-a', stages: [], finalPick: {} } as any);
    emitTrace({ tick: 1, category: 'action_selection', summary: 'Mira chose TRADE', agentId: 'agent-b', stages: [], finalPick: {} } as any);

    render(<DebugPanel currentTick={1} followAgentId="agent-a" />);
    fireEvent.click(screen.getByText('Agent'));

    expect(screen.getByText(/Kael chose RAID/)).toBeTruthy();
    expect(screen.queryByText(/Mira chose TRADE/)).toBeNull();
  });

  it('switches to Tick Inspector mode and groups by tick', () => {
    emitTrace({ tick: 47, category: 'action_selection', summary: 'Kael chose RAID', agentId: 'a1', stages: [], finalPick: {} } as any);
    emitTrace({ tick: 47, category: 'tick_summary', summary: 'Tick 47: 3 events' } as any);
    emitTrace({ tick: 48, category: 'tick_summary', summary: 'Tick 48: 1 event' } as any);

    render(<DebugPanel currentTick={48} />);
    fireEvent.click(screen.getByText('Tick'));
    // Should show tick grouping headers
    expect(screen.getByText(/47/)).toBeTruthy();
    expect(screen.getByText(/48/)).toBeTruthy();
  });

  it('expands trace to show structured detail (not raw JSON)', () => {
    emitTrace({
      tick: 1, category: 'tick_summary',
      summary: 'Tick 1: 3 events, doom stage 1',
      phaseEventCounts: { agent_actions: 2, doom_escalation: 1 },
      agentsProcessed: 3, doomStage: 1, essenceTotal: 75, mandateProgress: 0.4,
    } as any);

    render(<DebugPanel currentTick={1} />);
    const summaryRow = screen.getByText(/Tick 1: 3 events/);
    fireEvent.click(summaryRow);
    // Should show structured key-value pairs, not raw JSON
    expect(screen.getByText(/agents processed/i)).toBeTruthy();
    expect(screen.getByText(/doom stage/i)).toBeTruthy();
  });

  it('renders empty state when no traces', () => {
    render(<DebugPanel currentTick={0} />);
    expect(screen.getByText(/no traces/i)).toBeTruthy();
  });

  it('shows reverse-chronological order (newest first)', () => {
    emitTrace({ tick: 1, category: 'tick_summary', summary: 'First trace' } as any);
    emitTrace({ tick: 2, category: 'tick_summary', summary: 'Second trace' } as any);

    render(<DebugPanel currentTick={2} />);
    const items = screen.getAllByTestId('trace-entry');
    // Second trace (newer) should appear before first
    expect(items[0].textContent).toContain('Second trace');
    expect(items[1].textContent).toContain('First trace');
  });
});
```

**Step 2: Run to verify failure**

Run: `npx vitest run src/components/Game/__tests__/DebugPanel.test.tsx`
Expected: FAIL — module not found

**Step 3: Implement DebugPanel.tsx**

Create `src/components/Game/DebugPanel.tsx`. This is a substantial component (~400-500 lines) implementing the right-side drawer design.

**Component architecture:**

```
DebugPanel (root — 480px right drawer)
├── DebugTabBar (Feed | Agent | Tick mode tabs)
├── CategoryFilters (checkbox row with colored badges)
├── TraceList (scrollable, reverse-chronological)
│   ├── TraceEntry (collapsed: summary + badge + tick)
│   │   └── TraceDetail (expanded: category-specific renderer)
│   └── ... more entries
└── NewTracesButton (floating "↑ New traces" pill when scrolled)
```

**Props:**

```typescript
interface DebugPanelProps {
  currentTick: number;
  followAgentId?: string;
  onClose?: () => void;
}
```

**State:**

```typescript
const [mode, setMode] = useState<'feed' | 'agent-follow' | 'tick-inspector'>('feed');
const [enabledCategories, setEnabledCategories] = useState<Set<string>>(new Set(Object.keys(CATEGORY_BADGE_COLORS)));
const [expandedId, setExpandedId] = useState<number | null>(null);
const [inspectTick, setInspectTick] = useState<number | null>(null);
```

**Category badge colors (module-level constants):**

```typescript
const CATEGORY_BADGE_COLORS: Record<string, string> = {
  action_selection: '#d4a574',     // tan — matches agent action dot
  narrative_generation: '#aa44dd', // violet/Spirit — creative, story-related
  context_harvest: '#2288ff',      // blue/Mind — knowledge, awareness
  dilemma_resolution: '#ff4444',   // crimson/Force — conflict, tension
  tick_summary: '#ca8a04',         // amber — neutral system info
};
```

**Threadbare styling constants:**

```typescript
const PANEL_STYLES = {
  background: '#0d0b14',           // darker than stone-900
  borderColor: 'rgba(120, 53, 15, 0.3)', // amber-900/30
  textColor: '#c8c0d8',           // light lavender-grey
  tickColor: 'rgba(200, 192, 216, 0.3)', // subtle tick numbers
  detailBg: 'rgba(28, 25, 23, 0.4)',     // stone-800/40
  detailBorder: 'rgba(120, 53, 15, 0.15)', // amber-900/15
  width: 480,
  zIndex: 45,                     // below ScryOverlay (50), above game (0)
} as const;
```

**Auto-follow behavior:** When `followAgentId` changes and mode is 'feed', auto-switch to 'agent-follow'. When `followAgentId` is cleared, switch back to 'feed'.

**Category-specific detail renderers:**

Each trace category gets a purpose-built renderer (not raw JSON):

- **`action_selection`**: Pipeline breakdown with horizontal bar charts (Unicode ▓░), one stage per section, showing candidate names with scores, modifiers, probabilities, roll result.
- **`narrative_generation`**: Prose generation detail with tier, template ID, sphere words list, personality clause, final prose in a quote block.
- **`context_harvest`**: Harvested/selected counts, top-ranked objects with scores, opposition tension level.
- **`dilemma_resolution`**: 2×2 payoff matrix (Unicode table), actor/target strategies, outcome cell highlighted, sentiment/reputation deltas.
- **`tick_summary`**: Phase event counts, agents processed, doom stage, essence, mandate progress.
- **Fallback (unknown categories)**: Formatted `key: value` lines with indentation — NOT raw `JSON.stringify`.

**Typography:**

- Summary lines: `font-size: 14px` (text-sm), system sans-serif
- Detail sections: `font-size: 12px; font-family: monospace` (text-xs font-mono)
- Category badges: `font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em`
- Tick numbers: `font-family: monospace; color: rgba(200, 192, 216, 0.3)`

**Scroll behavior:** New traces appear at top. If scrolled to top, auto-scroll. If user has scrolled down, show floating "↑ New traces" pill button at top of list.

**Step 4: Run tests**

Run: `npx vitest run src/components/Game/__tests__/DebugPanel.test.tsx`
Expected: 9 tests PASS

**Step 5: Commit**

```bash
git add src/components/Game/DebugPanel.tsx src/components/Game/__tests__/DebugPanel.test.tsx
git commit -m "feat(trace): add DebugPanel right-side drawer with structured renderers and Threadbare styling"
```

---

### Task 8: Wire DebugPanel into GameView — Drawer Layout + Top-Bar Toggle

**Files:**
- Modify: `src/components/Game/GameView.tsx`
- Test: `src/components/Game/__tests__/GameView-debug.test.tsx`

**Design Reference:** The debug panel is a 480px right-side drawer that **replaces** the right sidebar (retinue/agent detail) when open. The hex map remains visible and playable on the left. A "Debug" pill button in the top bar toggles it, plus backtick keyboard shortcut.

**Step 1: Write the failing tests**

Create `src/components/Game/__tests__/GameView-debug.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameView } from '../GameView';

describe('GameView debug panel integration', () => {
  const defaultProps = {
    archetype: 'seeker' as any,
    avatarName: 'Tester',
    cosmology: { foundation: { chaos: 0.5, order: 0.5, light: 0.5, darkness: 0.5 }, creation: ['force', 'matter'] } as any,
    seed: 42,
  };

  it('does not show debug panel by default', () => {
    render(<GameView {...defaultProps} />);
    expect(screen.queryByTestId('debug-panel')).toBeNull();
  });

  it('shows Debug toggle button in top bar', () => {
    render(<GameView {...defaultProps} />);
    expect(screen.getByTestId('debug-toggle')).toBeTruthy();
  });

  it('toggles debug panel with backtick keyboard shortcut', () => {
    render(<GameView {...defaultProps} />);
    fireEvent.keyDown(document, { key: '`' });
    expect(screen.getByTestId('debug-panel')).toBeTruthy();
    fireEvent.keyDown(document, { key: '`' });
    expect(screen.queryByTestId('debug-panel')).toBeNull();
  });

  it('toggles debug panel with top-bar button click', () => {
    render(<GameView {...defaultProps} />);
    fireEvent.click(screen.getByTestId('debug-toggle'));
    expect(screen.getByTestId('debug-panel')).toBeTruthy();
    fireEvent.click(screen.getByTestId('debug-toggle'));
    expect(screen.queryByTestId('debug-panel')).toBeNull();
  });

  it('hides right sidebar when debug panel is open', () => {
    render(<GameView {...defaultProps} />);
    // Right sidebar should be visible initially
    expect(screen.getByTestId('right-sidebar')).toBeTruthy();

    fireEvent.keyDown(document, { key: '`' });
    // Right sidebar should be hidden, debug panel visible
    expect(screen.queryByTestId('right-sidebar')).toBeNull();
    expect(screen.getByTestId('debug-panel')).toBeTruthy();
  });

  it('shows glowing dot on Debug button when panel is active', () => {
    render(<GameView {...defaultProps} />);
    const btn = screen.getByTestId('debug-toggle');
    expect(btn.querySelector('[data-active="true"]')).toBeNull();

    fireEvent.keyDown(document, { key: '`' });
    const activeBtn = screen.getByTestId('debug-toggle');
    expect(activeBtn.querySelector('[data-active="true"]')).toBeTruthy();
  });

  it('auto-follows selected agent when debug panel is open', () => {
    render(<GameView {...defaultProps} />);
    fireEvent.keyDown(document, { key: '`' });
    // The DebugPanel should receive followAgentId from selectedAgentId
    const panel = screen.getByTestId('debug-panel');
    expect(panel).toBeTruthy();
  });

  it('enables tracing when panel opens, disables when it closes', () => {
    render(<GameView {...defaultProps} />);
    // Tracing should be off by default
    fireEvent.keyDown(document, { key: '`' });
    // Tracing now on — verified by the panel receiving trace data
    fireEvent.keyDown(document, { key: '`' });
    // Tracing now off
  });
});
```

**Step 2: Run to verify failure**

Run: `npx vitest run src/components/Game/__tests__/GameView-debug.test.tsx`
Expected: FAIL — no debug-panel or debug-toggle found

**Step 3: Wire into GameView**

In `GameView.tsx`:

1. **Add state:**
```typescript
const [debugPanelOpen, setDebugPanelOpen] = useState(false);
```

2. **Add toggle handler (useCallback):**
```typescript
const handleToggleDebug = useCallback(() => {
  setDebugPanelOpen(prev => {
    if (!prev) { enableTracing(); } else { disableTracing(); }
    return !prev;
  });
}, []);
```

3. **Add keyboard handler** (extend existing keydown handler or add new useEffect):
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === '`') {
      handleToggleDebug();
    }
  };
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [handleToggleDebug]);
```

4. **Add Debug pill button in the top bar** (next to MandateTracker):
```tsx
<button
  data-testid="debug-toggle"
  onClick={handleToggleDebug}
  style={{
    padding: '2px 10px',
    borderRadius: 9999,
    fontSize: 12,
    background: debugPanelOpen ? 'rgba(120, 53, 15, 0.3)' : 'rgba(28, 25, 23, 0.5)',
    color: debugPanelOpen ? '#d4a574' : '#c8c0d8',
    border: '1px solid rgba(120, 53, 15, 0.3)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  }}
>
  {debugPanelOpen && <span data-active="true" style={{ width: 6, height: 6, borderRadius: '50%', background: '#d4a574', boxShadow: '0 0 4px #d4a574' }} />}
  Debug
</button>
```

5. **Conditionally render right sidebar vs debug panel:**
```tsx
{/* Right column — either debug panel or normal sidebar */}
{debugPanelOpen ? (
  <DebugPanel
    data-testid="debug-panel"
    currentTick={gameState.tick}
    followAgentId={selectedAgentId ?? undefined}
    onClose={handleToggleDebug}
  />
) : (
  <div data-testid="right-sidebar" style={{ width: 288 }}>
    {/* existing RetinuePanel / AgentDetailPanel */}
  </div>
)}
```

**Important layout change:** When the debug panel is open, the right column width changes from 288px (normal sidebar) to 480px (debug drawer). The main content area (hex map) shrinks accordingly but remains playable. Use CSS transition for smooth width change.

6. **Add imports:**
```typescript
import { DebugPanel } from './DebugPanel';
import { enableTracing, disableTracing } from '../../engine/traceBuffer';
```

**Step 4: Run tests**

Run: `npx vitest run src/components/Game/__tests__/GameView-debug.test.tsx`
Expected: 8 tests PASS

Run full GameView tests to check regressions:
Run: `npx vitest run src/components/Game/__tests__/GameView.test.tsx`
Expected: All existing tests PASS

**Step 5: Commit**

```bash
git add src/components/Game/GameView.tsx src/components/Game/__tests__/GameView-debug.test.tsx
git commit -m "feat(trace): wire DebugPanel drawer into GameView with top-bar toggle, backtick shortcut, and sidebar replacement"
```

---

### Task 9: Integration Test — Full Trace Flow

**Files:**
- Create: `src/engine/__tests__/traceBuffer-integration.test.ts`

**Step 1: Write the integration test**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { enableTracing, disableTracing, getTraces, getTracesForAgent } from '../traceBuffer';
import { runTick } from '../orchestrator';
import { seedWorld } from '../worldSeed';
import type { GameState } from '../../types/gameState';
import { TRACE_CATEGORIES } from '../../types/trace';

describe('trace system integration', () => {
  let state: GameState;

  beforeEach(() => {
    disableTracing();
    enableTracing();
    const seed = seedWorld({ seed: 42, avatarName: 'Test', archetype: 'seeker' });
    state = seed.state;
    state.phase = 'playing';
  });

  it('running 50 ticks produces traces across multiple categories', () => {
    for (let i = 0; i < 50; i++) {
      state = runTick(state);
    }
    const traces = getTraces();
    expect(traces.length).toBeGreaterThan(0);

    const categories = new Set(traces.map(t => t.category));
    // tick_summary should always appear (one per tick)
    expect(categories.has('tick_summary')).toBe(true);
    // After 50 ticks, we should have at least some agent actions
    expect(traces.filter(t => t.category === 'tick_summary')).toHaveLength(50);
  });

  it('getTracesForAgent returns only that agent traces', () => {
    for (let i = 0; i < 30; i++) {
      state = runTick(state);
    }
    const allTraces = getTraces();
    const agentTraces = allTraces.filter(t => t.agentId);
    if (agentTraces.length > 0) {
      const agentId = agentTraces[0].agentId!;
      const filtered = getTracesForAgent(agentId);
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every(t => t.agentId === agentId)).toBe(true);
    }
  });

  it('every trace entry has required base fields', () => {
    for (let i = 0; i < 10; i++) {
      state = runTick(state);
    }
    for (const trace of getTraces()) {
      expect(trace.id).toBeGreaterThanOrEqual(0);
      expect(trace.tick).toBeGreaterThanOrEqual(0);
      expect(trace.timestamp).toBeGreaterThan(0);
      expect(trace.category).toBeTruthy();
      expect(trace.summary).toBeTruthy();
    }
  });

  it('buffer does not exceed BUFFER_SIZE', () => {
    // Run enough ticks to exceed 500 traces
    for (let i = 0; i < 200; i++) {
      state = runTick(state);
    }
    expect(getTraces().length).toBeLessThanOrEqual(500);
  });
});
```

**Step 2: Run**

Run: `npx vitest run src/engine/__tests__/traceBuffer-integration.test.ts`
Expected: 4 tests PASS

**Step 3: Commit**

```bash
git add src/engine/__tests__/traceBuffer-integration.test.ts
git commit -m "test(trace): add integration tests for full trace flow across 50 ticks"
```

---

### Task 10: Documentation Updates — Definition of Done

**Files:**
- Modify: `CLAUDE.md`
- Create (via Obsidian MCP): `Debug Trace System.md` in vault

**Step 1: Update CLAUDE.md — Session Workflow**

In the "Session Workflow" section (step 5 list), add a new bullet after "Update affected Obsidian vault notes":

```
- Verify new engine functions emit appropriate TraceEntry types — if a function makes decisions, resolves outcomes, or generates content, it must call `emitTrace()` with a descriptive summary and relevant structured data. See `Debug Trace System.md` in the Obsidian vault for the 3-step recipe.
```

**Step 2: Update CLAUDE.md — Non-Functional Priorities**

In "Non-Functional Priorities", under item 2 (Inspectability), append:

```
All engine modules must emit structured traces via `emitTrace()` from `src/engine/traceBuffer.ts`. The debug panel (backtick key in-game) is the primary inspectability tool — if you can't see a decision or outcome in the panel, it's not inspectable. New trace categories follow a 3-step recipe: define interface, add to union, call emitTrace.
```

**Step 3: Create Obsidian vault note**

Use Obsidian MCP to create `Debug Trace System.md` in the `Systems/` folder:

```markdown
---
tags: [system, infrastructure, inspectability]
status: implemented
---

# Debug Trace System

Structured trace infrastructure for inspecting agent decisions, narrative generation, and game state changes. Designed for easy expansion — adding a new trace category requires 3 steps.

## Architecture

- **Ring buffer** (`src/engine/traceBuffer.ts`): 500-entry FIFO with zero-cost boolean toggle
- **Type system** (`src/types/trace.ts`): Discriminated union on `category` field
- **Debug panel** (`src/components/Game/DebugPanel.tsx`): Toggleable overlay (backtick key)

## Trace Categories

| Category | Emitted by | Key data |
|----------|-----------|----------|
| `action_selection` | Agent selection pipeline | 5 pipeline stages, scores, final pick |
| `narrative_generation` | `narrative.ts` | Tier, template, sphere words, prose |
| `context_harvest` | `contextBuilder.ts` | Harvested/ranked/selected objects, tension |
| `dilemma_resolution` | `disposition.ts` | Strategies, moves, outcome, deltas |
| `tick_summary` | `orchestrator.ts` | Phase counts, doom, essence, mandates |

## 3-Step Recipe: Adding a New Category

1. **Define interface** in `src/types/trace.ts`:
   ```typescript
   export interface NewSystemTrace extends TraceBase {
     category: 'new_system';
     // system-specific fields
   }
   ```
2. **Add to union**: `type TraceEntry = ... | NewSystemTrace;`
3. **Emit from engine**: `emitTrace({ tick, category: 'new_system', summary, ...data })`

The debug panel auto-discovers new categories from the buffer — no UI changes needed.

## Connections

- [[Inspectability]] — non-functional priority this system serves
- [[Agent Selection Pipeline]] — traced via `action_selection`
- [[Narrative Engine]] — traced via `narrative_generation`
- [[Narrative Context Pipeline]] — traced via `context_harvest`
- [[Game Theory Disposition]] — traced via `dilemma_resolution`
```

**Step 4: Update Obsidian Index.md**

Add `Debug Trace System` link to the Infrastructure/Systems section of `Index.md`.

**Step 5: Update CLAUDE.md changelog**

Append entry to Recent Changes table.

**Step 6: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add tracing requirement to definition of done and non-functional priorities"
```

---

### Task 11: Run Full Test Suite

**Step 1: Type-check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 2: Run all tests**

Run: `npm test`
Expected: All ~1,500+ existing tests PASS, plus ~30-40 new trace tests PASS

**Step 3: Production build**

Run: `npx vite build`
Expected: Build succeeds

---

## Summary

| Task | What | New files | Tests |
|------|------|-----------|-------|
| 1 | TraceEntry types | `types/trace.ts` | 5 |
| 2 | Trace buffer | `engine/traceBuffer.ts` | 8 |
| 3 | Instrument orchestrator | modify `orchestrator.ts` | 2 |
| 4 | Instrument action selection | modify pipeline file | 2 |
| 5 | Instrument narrative | modify `narrative.ts` | 2 |
| 6 | Instrument context + dilemma | modify `contextBuilder.ts`, `disposition.ts` | 4 |
| 7 | DebugPanel component | `components/Game/DebugPanel.tsx` | 6 |
| 8 | Wire into GameView | modify `GameView.tsx` | 2 |
| 9 | Integration test | test file | 4 |
| 10 | Documentation | CLAUDE.md, Obsidian note | — |
| 11 | Full validation | — | — |
| **Total** | | **4 new files + 5 modified** | **~35 new tests** |
