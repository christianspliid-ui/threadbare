import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { ROUTINE_TEMPLATES } from '../../data/narrative-content';
import { generateRoutineProse, resetNarrativeEventCounter } from '../narrative';
import { MIN_SHAPES_PER_EVENT_TYPE } from '../narrative-constants';
import type { ProseContext, NarrativeEventType } from '../../types/narrative';

beforeEach(() => {
  resetNarrativeEventCounter();
});

// ─── Test 1: Structural variety per event type ────────────────────

describe('ROUTINE_TEMPLATES structural variety', () => {
  it('every event type has ≥3 templates and ≥MIN_SHAPES_PER_EVENT_TYPE distinct shapes', () => {
    for (const [eventType, pool] of Object.entries(ROUTINE_TEMPLATES)) {
      expect(pool.length, `${eventType} has too few templates`).toBeGreaterThanOrEqual(3);
      const shapes = new Set(pool.map(t => t.shape));
      expect(shapes.size, `${eventType} has fewer than ${MIN_SHAPES_PER_EVENT_TYPE} shapes: [${[...shapes].join(', ')}]`).toBeGreaterThanOrEqual(MIN_SHAPES_PER_EVENT_TYPE);
    }
  });

  it('every template has a non-empty shape and non-empty template string', () => {
    for (const [eventType, pool] of Object.entries(ROUTINE_TEMPLATES)) {
      for (const t of pool) {
        expect(t.shape, `${eventType}: missing shape`).toBeTruthy();
        expect(t.template.length, `${eventType}: empty template`).toBeGreaterThan(10);
      }
    }
  });

  it('no template uses {actor} (all migrated to {name})', () => {
    for (const [eventType, pool] of Object.entries(ROUTINE_TEMPLATES)) {
      for (const t of pool) {
        expect(t.template, `${eventType}: still uses {actor}`).not.toContain('{actor}');
      }
    }
  });
});

// ─── Test 2: Shape rotation — consecutive shapes differ ───────────

describe('shape rotation', () => {
  it('consecutive calls for the same event type differ in shape ≥80% of the time', () => {
    const context: ProseContext = { actorName: 'Thane Volkar', sphere: 'force' };
    const eventType: NarrativeEventType = 'action_resolved';
    const N = 10;
    const shapes: string[] = [];

    for (let i = 0; i < N; i++) {
      const result = generateRoutineProse(eventType, context, i * 17 + 1);
      expect(result.shape).toBeTruthy();
      shapes.push(result.shape!);
    }

    let sameCount = 0;
    for (let i = 1; i < shapes.length; i++) {
      if (shapes[i] === shapes[i - 1]) sameCount++;
    }
    const repeatRate = sameCount / (shapes.length - 1);
    expect(repeatRate, `Consecutive shape repeat rate too high: ${repeatRate.toFixed(2)}`).toBeLessThan(0.2);
  });
});

// ─── Test 3: Enrichment fallback — no raw placeholder leaks ───────

describe('enrichment fallback (no graph)', () => {
  it('produces well-formed text with no raw {placeholder} tokens', () => {
    const eventTypes: NarrativeEventType[] = [
      'action_resolved', 'trait_acquired', 'actor_death',
      'divine_intervention', 'encounter_completed',
    ];
    const context: ProseContext = {
      actorName: 'Kira',
      targetName: 'the fortress',
      locationName: 'Ashenvale',
      sphere: 'mind',
    };

    for (const eventType of eventTypes) {
      resetNarrativeEventCounter();
      const result = generateRoutineProse(eventType, context, 42);
      expect(result.text, `${eventType}: empty text`).toBeTruthy();
      expect(result.text, `${eventType}: raw placeholder leaked`).not.toMatch(/\{[^}]+\}/);
    }
  });

  it('emits shape on returned ProseFragment', () => {
    const result = generateRoutineProse('action_resolved', { actorName: 'Volkar', sphere: 'force' }, 99);
    expect(['svo', 'aftermath', 'inverted', 'compound', 'fragment']).toContain(result.shape);
  });
});

// ─── Test 4: Enrichment happy path (with graph + actor) ──────────

describe('enrichment happy path', () => {
  it('resolves {name} from graph when actorId and graph provided', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'agent-1', name: 'Serafina Ashveil', category: 'agent', properties: {} });
    graph.addNode({ id: 'loc-1', name: 'Ironhold', category: 'location', properties: {} });
    graph.addEdge({ id: 'e1', source: 'agent-1', target: 'loc-1', type: 'located_at', properties: {} });

    const context: ProseContext = {
      actorName: 'Fallback Name',
      actorId: 'agent-1',
      locationName: 'Ironhold',
      sphere: 'spirit',
    };

    // Try multiple seeds until we hit a template with {name}
    let foundName = false;
    for (let seed = 1; seed <= 20; seed++) {
      resetNarrativeEventCounter();
      const result = generateRoutineProse('trait_acquired', context, seed, graph);
      expect(result.text).not.toMatch(/\{[^}]+\}/);
      if (result.text.includes('Serafina')) {
        foundName = true;
        break;
      }
    }
    expect(foundName, 'enrichProse should resolve {name} to graph agent name').toBe(true);
  });
});

// ─── Test 5: Determinism — same seed + reset = same output ────────

describe('determinism', () => {
  it('same seed produces identical text and shape after state reset', () => {
    const context: ProseContext = { actorName: 'Volkar', sphere: 'force' };

    resetNarrativeEventCounter();
    const a = generateRoutineProse('action_resolved', context, 99);

    resetNarrativeEventCounter();
    const b = generateRoutineProse('action_resolved', context, 99);

    expect(a.text).toBe(b.text);
    expect(a.shape).toBe(b.shape);
  });

  it('different seeds produce different shapes at least sometimes', () => {
    const context: ProseContext = { actorName: 'Volkar', sphere: 'force' };
    const shapes = new Set<string>();

    for (let seed = 1; seed <= 20; seed++) {
      resetNarrativeEventCounter();
      const result = generateRoutineProse('action_resolved', context, seed);
      if (result.shape) shapes.add(result.shape);
    }
    expect(shapes.size, 'Expected multiple distinct shapes across seeds').toBeGreaterThan(1);
  });
});
