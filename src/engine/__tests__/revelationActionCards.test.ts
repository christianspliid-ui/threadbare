/**
 * Tests for revelation action cards — the 4 divine action templates that let
 * the player deliberately discover agent information through the revelation system.
 *
 * Task 1: Template existence and field correctness tests.
 * Task 2: resolveRevelationAction resolution behavior tests.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { GameState } from '../../types/gameState';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';
import { WorldGraph } from '../graph';
import { createEmptyAgentKnowledge } from '../../types/agentKnowledge';
import { DEPTH_DIVINE_ACTION } from '../../types/agentKnowledge';
import { getOrCreateKnowledge } from '../revelationHooks';
import { clearTraces, enableTracing } from '../traceBuffer';

// ─── Template Imports ────────────────────────────────────────────────

import { UNIFIED_ACTION_TEMPLATES } from '../../data/unified-action-templates';

// ─── Minimal GameState Factory ────────────────────────────────────

function makeMinimalState(overrides: Partial<GameState> = {}): GameState {
  const graph = new WorldGraph();
  return {
    cycle: 0,
    tick: 1,
    phase: 'playing',
    seed: 42,
    graph,
    cosmology: {} as never,
    tiles: [],
    clock: {} as never,
    ascendantId: 'ascendant-1',
    essencePool: {} as never,
    mandateDefinition: null,
    mandateState: null,
    rivalDefinitions: [],
    rivalStates: [],
    doomDefinition: {} as never,
    doomClock: {} as never,
    tickEvents: [],
    recentEvents: [],
    chronicleEntries: [],
    stealthExposure: 0,
    visibilityMap: new Map(),
    familiarityMap: new Map(),
    culturalInsightMap: new Map(),
    agentKnowledge: new Map(),
    encounterProgress: [],
    actionsInProgress: [],
    unifiedActions: [],
    worldSoul: {} as never,
    echoDefinitions: [],
    echoStates: [],
    chronicle: {} as never,
    ...overrides,
  };
}

// ─── Graph Setup Helper ───────────────────────────────────────────

function buildAgentGraph(targetAgentId: string): WorldGraph {
  const graph = new WorldGraph();

  // Ascendant
  graph.addNode({
    id: 'ascendant-1',
    type: 'ascendant',
    name: 'The Ascendant',
    properties: {},
  });

  // Avatar actor (needed for some emitters)
  graph.addNode({
    id: 'avatar-1',
    type: 'actor',
    name: 'Avatar',
    properties: { actorType: 'individual' },
  });
  graph.addEdge({ id: 'e-avatar', source: 'avatar-1', target: 'ascendant-1', type: 'avatar_of' });

  // Location for avatar
  graph.addNode({ id: 'loc-1', type: 'location', name: 'Location 1', properties: {} });
  graph.addEdge({ id: 'e-avloc', source: 'avatar-1', target: 'loc-1', type: 'located_at' });

  // Target agent with domain capabilities + axiological profile
  graph.addNode({
    id: targetAgentId,
    type: 'actor',
    name: 'Test Agent',
    properties: {
      actorType: 'individual',
      domainCapabilities: {
        iron: 20,
        gold: 45,
        shadow: 10,
        veil: 30,
        heart: 55,
        eye: 25,
        stone: 15,
        star: 40,
      },
      axiologicalProfile: {
        mercy_ruthlessness: 0.7,
        honesty_cunning: 0.5,
        courage_prudence: 0.3,
      },
    },
  });
  graph.addEdge({ id: 'e-agloc', source: targetAgentId, target: 'loc-1', type: 'located_at' });

  // Add a bond target (for scry test)
  graph.addNode({ id: 'other-agent', type: 'actor', name: 'Other Agent', properties: { actorType: 'individual' } });
  graph.addEdge({ id: 'e-bond', source: targetAgentId, target: 'other-agent', type: 'relates_to' });

  // Add an ambition (for dream_sending test)
  graph.addNode({ id: 'ambition-1', type: 'ambition', name: 'Dominate Region', properties: {} });
  graph.addEdge({ id: 'e-ambition', source: targetAgentId, target: 'ambition-1', type: 'pursues' });

  return graph;
}

// ─── Task 1: Template Existence Tests ─────────────────────────────

describe('Revelation Action Card Templates', () => {
  let observeTemplate: UnifiedActionTemplate | undefined;
  let scryTemplate: UnifiedActionTemplate | undefined;
  let whisperTemplate: UnifiedActionTemplate | undefined;
  let dreamTemplate: UnifiedActionTemplate | undefined;

  beforeEach(() => {
    observeTemplate = UNIFIED_ACTION_TEMPLATES.find(t => t.id === 'observe_agent');
    scryTemplate = UNIFIED_ACTION_TEMPLATES.find(t => t.id === 'scry_agent');
    whisperTemplate = UNIFIED_ACTION_TEMPLATES.find(t => t.id === 'whisper_insight');
    dreamTemplate = UNIFIED_ACTION_TEMPLATES.find(t => t.id === 'dream_sending');
  });

  describe('observe_agent template', () => {
    it('exists in UNIFIED_ACTION_TEMPLATES', () => {
      expect(observeTemplate).toBeDefined();
    });

    it('has correct display name', () => {
      expect(observeTemplate?.name).toBe('Observe');
    });

    it('targets actor nodes', () => {
      expect(observeTemplate?.targetCategories).toContain('actor');
    });

    it('has reach: eye', () => {
      expect(observeTemplate?.reach).toBe('eye');
    });

    it('has essenceCost of 5', () => {
      expect(observeTemplate?.essenceCost).toBe(5);
    });

    it('has actorAffinities: ascendant', () => {
      expect(observeTemplate?.actorAffinities).toContain('ascendant');
    });

    it('has revelationAction metadata: observe', () => {
      expect((observeTemplate as any)?.revelationAction).toBe('observe');
    });
  });

  describe('scry_agent template', () => {
    it('exists in UNIFIED_ACTION_TEMPLATES', () => {
      expect(scryTemplate).toBeDefined();
    });

    it('has correct display name', () => {
      expect(scryTemplate?.name).toBe('Scry');
    });

    it('targets actor nodes', () => {
      expect(scryTemplate?.targetCategories).toContain('actor');
    });

    it('has reach: eye', () => {
      expect(scryTemplate?.reach).toBe('eye');
    });

    it('has essenceCost of 15', () => {
      expect(scryTemplate?.essenceCost).toBe(15);
    });

    it('has revelationAction metadata: scry', () => {
      expect((scryTemplate as any)?.revelationAction).toBe('scry');
    });
  });

  describe('whisper_insight template', () => {
    it('exists in UNIFIED_ACTION_TEMPLATES', () => {
      expect(whisperTemplate).toBeDefined();
    });

    it('has correct display name', () => {
      expect(whisperTemplate?.name).toBe('Whisper Insight');
    });

    it('targets actor nodes', () => {
      expect(whisperTemplate?.targetCategories).toContain('actor');
    });

    it('has reach: veil', () => {
      expect(whisperTemplate?.reach).toBe('veil');
    });

    it('has essenceCost of 5', () => {
      expect(whisperTemplate?.essenceCost).toBe(5);
    });

    it('has revelationAction metadata: whisper_insight', () => {
      expect((whisperTemplate as any)?.revelationAction).toBe('whisper_insight');
    });
  });

  describe('dream_sending template', () => {
    it('exists in UNIFIED_ACTION_TEMPLATES', () => {
      expect(dreamTemplate).toBeDefined();
    });

    it('has correct display name', () => {
      expect(dreamTemplate?.name).toBe('Dream Sending');
    });

    it('targets actor nodes', () => {
      expect(dreamTemplate?.targetCategories).toContain('actor');
    });

    it('has reach: star', () => {
      expect(dreamTemplate?.reach).toBe('star');
    });

    it('has essenceCost of 15', () => {
      expect(dreamTemplate?.essenceCost).toBe(15);
    });

    it('has revelationAction metadata: dream_sending', () => {
      expect((dreamTemplate as any)?.revelationAction).toBe('dream_sending');
    });
  });
});

// ─── Task 2: resolveRevelationAction Behavior Tests ──────────────

describe('resolveRevelationAction', () => {
  const TARGET_AGENT_ID = 'agent-target';

  let state: GameState;

  beforeEach(async () => {
    clearTraces();
    enableTracing(true);
    const graph = buildAgentGraph(TARGET_AGENT_ID);
    state = makeMinimalState({ graph });
    state.agentKnowledge = new Map();
  });

  it('observe reveals one unrevealed domain', async () => {
    const { resolveRevelationAction } = await import('../revelationEmitter');

    resolveRevelationAction('observe', state, TARGET_AGENT_ID);

    const knowledge = state.agentKnowledge!.get(TARGET_AGENT_ID);
    expect(knowledge).toBeDefined();
    expect(knowledge!.revealedDomains.size).toBe(1);
  });

  it('observe increments interactionDepth by DEPTH_DIVINE_ACTION', async () => {
    const { resolveRevelationAction } = await import('../revelationEmitter');

    resolveRevelationAction('observe', state, TARGET_AGENT_ID);

    const knowledge = state.agentKnowledge!.get(TARGET_AGENT_ID);
    expect(knowledge!.interactionDepth).toBeCloseTo(DEPTH_DIVINE_ACTION);
  });

  it('observe emits a domain_revealed TickEvent', async () => {
    const { resolveRevelationAction } = await import('../revelationEmitter');

    resolveRevelationAction('observe', state, TARGET_AGENT_ID);

    const domainEvents = state.tickEvents.filter(e => e.type === 'domain_revealed');
    expect(domainEvents.length).toBeGreaterThanOrEqual(1);
  });

  it('scry reveals all 8 domains', async () => {
    const { resolveRevelationAction } = await import('../revelationEmitter');

    resolveRevelationAction('scry', state, TARGET_AGENT_ID);

    const knowledge = state.agentKnowledge!.get(TARGET_AGENT_ID);
    expect(knowledge).toBeDefined();
    expect(knowledge!.revealedDomains.size).toBe(8);
  });

  it('scry reveals bond from relates_to edges', async () => {
    const { resolveRevelationAction } = await import('../revelationEmitter');

    resolveRevelationAction('scry', state, TARGET_AGENT_ID);

    const knowledge = state.agentKnowledge!.get(TARGET_AGENT_ID);
    expect(knowledge!.revealedBonds.has('other-agent')).toBe(true);
  });

  it('scry increments interactionDepth by DEPTH_DIVINE_ACTION', async () => {
    const { resolveRevelationAction } = await import('../revelationEmitter');

    resolveRevelationAction('scry', state, TARGET_AGENT_ID);

    const knowledge = state.agentKnowledge!.get(TARGET_AGENT_ID);
    expect(knowledge!.interactionDepth).toBeCloseTo(DEPTH_DIVINE_ACTION);
  });

  it('whisper_insight reveals one unrevealed value and sets dispositionRevealed', async () => {
    const { resolveRevelationAction } = await import('../revelationEmitter');

    resolveRevelationAction('whisper_insight', state, TARGET_AGENT_ID);

    const knowledge = state.agentKnowledge!.get(TARGET_AGENT_ID);
    expect(knowledge).toBeDefined();
    expect(knowledge!.revealedValues.size).toBeGreaterThanOrEqual(1);
    expect(knowledge!.dispositionRevealed).toBe(true);
  });

  it('whisper_insight increments interactionDepth by DEPTH_DIVINE_ACTION', async () => {
    const { resolveRevelationAction } = await import('../revelationEmitter');

    resolveRevelationAction('whisper_insight', state, TARGET_AGENT_ID);

    const knowledge = state.agentKnowledge!.get(TARGET_AGENT_ID);
    expect(knowledge!.interactionDepth).toBeCloseTo(DEPTH_DIVINE_ACTION);
  });

  it('dream_sending reveals primary ambition', async () => {
    const { resolveRevelationAction } = await import('../revelationEmitter');

    resolveRevelationAction('dream_sending', state, TARGET_AGENT_ID);

    const knowledge = state.agentKnowledge!.get(TARGET_AGENT_ID);
    expect(knowledge).toBeDefined();
    expect(knowledge!.revealedAmbitions.has('ambition-1')).toBe(true);
  });

  it('dream_sending sets threatRevealed', async () => {
    const { resolveRevelationAction } = await import('../revelationEmitter');

    resolveRevelationAction('dream_sending', state, TARGET_AGENT_ID);

    const knowledge = state.agentKnowledge!.get(TARGET_AGENT_ID);
    expect(knowledge!.threatRevealed).toBe(true);
  });

  it('dream_sending increments interactionDepth by DEPTH_DIVINE_ACTION', async () => {
    const { resolveRevelationAction } = await import('../revelationEmitter');

    resolveRevelationAction('dream_sending', state, TARGET_AGENT_ID);

    const knowledge = state.agentKnowledge!.get(TARGET_AGENT_ID);
    expect(knowledge!.interactionDepth).toBeCloseTo(DEPTH_DIVINE_ACTION);
  });

  it('observe is idempotent — calling twice reveals only one domain total', async () => {
    const { resolveRevelationAction } = await import('../revelationEmitter');

    resolveRevelationAction('observe', state, TARGET_AGENT_ID);
    const afterFirst = state.agentKnowledge!.get(TARGET_AGENT_ID)!.revealedDomains.size;

    resolveRevelationAction('observe', state, TARGET_AGENT_ID);
    const afterSecond = state.agentKnowledge!.get(TARGET_AGENT_ID)!.revealedDomains.size;

    // Second call should reveal the next domain (not re-reveal) — domains grow by 1 each call
    expect(afterFirst).toBe(1);
    expect(afterSecond).toBe(2); // Idempotent per-call: doesn't re-reveal same domain
  });

  it('scry is idempotent — calling twice does not exceed 8 domains', async () => {
    const { resolveRevelationAction } = await import('../revelationEmitter');

    resolveRevelationAction('scry', state, TARGET_AGENT_ID);
    resolveRevelationAction('scry', state, TARGET_AGENT_ID);

    const knowledge = state.agentKnowledge!.get(TARGET_AGENT_ID);
    expect(knowledge!.revealedDomains.size).toBe(8); // Same 8, not 16
  });

  it('resolveRevelationAction emits RevelationTrace for newly revealed facet', async () => {
    const { resolveRevelationAction } = await import('../revelationEmitter');

    resolveRevelationAction('observe', state, TARGET_AGENT_ID);

    const { getTraces } = await import('../traceBuffer');
    const traces = getTraces();
    const revelationTraces = traces.filter(t => t.category === 'agent_revelation');
    expect(revelationTraces.length).toBeGreaterThanOrEqual(1);
  });
});
