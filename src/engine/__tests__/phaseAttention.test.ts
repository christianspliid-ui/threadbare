/**
 * phaseAttention contract tests — THR-16 curator metadata wiring.
 *
 * Verifies that CurationCandidate fields (isChainStage, isFinalChainStage,
 * factionThreadCount, matchesAmbition) are populated from real graph state
 * and flow through to CuratorDecisionTrace emissions.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { phaseAttention, resetTugCounter } from '../phaseAttention';
import { clearTraces, getTraces, enableTracing, disableTracing } from '../traceBuffer';
import type { GameState } from '../../types/gameState';
import type { UnifiedAction } from '../../types/unifiedAction';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';
import type { CuratorDecisionTrace } from '../../types/attention';
import type { TraceEntry } from '../../types/trace';
import { ENCOUNTER_CHAINS } from '../encounterChains';

// ─── Helpers ────────────────────────────────────────────────────

const ASCENDANT_ID = 'ascendant_1';

function makeMinimalTemplate(
  id: string,
  reach: string = 'iron',
): UnifiedActionTemplate {
  return {
    id,
    rarityTier: 1,
    intrinsicTier: 'shaping',
    name: id,
    reach: reach as any,
    crudType: 'read',
    scale: 'personal',
    steps: [{ id: 'step1', prose: '', difficulty: 30 }] as any,
    apCost: 1,
    actorAffinities: ['individual'],
  } as UnifiedActionTemplate;
}

function makeUnifiedAction(
  actionId: string,
  actorId: string,
  templateId: string,
): UnifiedAction {
  return {
    actionId,
    actorId,
    templateId,
    targetId: 'target_1',
    scale: 'personal',
    source: 'mortal',
    startTick: 1,
    currentStep: 0,
    stepProgress: 0,
    stepDuration: 6,
    resolved: false,
    stepOutcomes: [],
    effectiveTier: 'shaping',
  } as unknown as UnifiedAction;
}

function makeBaseState(graph: WorldGraph, unifiedActions: UnifiedAction[]): GameState {
  return {
    tick: 5,
    cycle: 0,
    seed: 42,
    graph,
    phase: 'playing',
    cosmology: { reachDomains: [], spheres: [] },
    tiles: [],
    clock: { dayOfCycle: 0, ticksOfDay: 0 },
    ascendantId: ASCENDANT_ID,
    essencePool: {},
    mandateDefinition: null,
    mandateState: null,
    rivalDefinitions: [],
    rivalStates: [],
    doomDefinition: {} as any,
    doomClock: {} as any,
    tickEvents: [],
    recentEvents: [],
    chronicleEntries: [],
    stealthExposure: 0,
    visibilityMap: new Map(),
    familiarityMap: new Map(),
    culturalInsightMap: new Map(),
    encounterProgress: [],
    actionsInProgress: [],
    unifiedActions,
    worldSoul: {} as any,
    echoDefinitions: [],
    echoStates: [],
    chronicle: { cycles: [], totalEntries: 0 },
    activeThreadTugs: [],
    digestBuffer: [],
    storyBeatQueue: [],
  } as unknown as GameState;
}

function addAscendant(graph: WorldGraph): void {
  graph.addNode({
    id: ASCENDANT_ID,
    type: 'actor',
    name: 'Ascendant',
    properties: {
      actorType: 'ascendant',
      attentionPool: 10,
      attentionCapacity: 10,
      attentionRegen: 1,
    },
  });
}

/** Add an agent with a thread edge from the ascendant and a given court position. */
function addThreadedAgent(
  graph: WorldGraph,
  agentId: string,
  courtPosition: string,
  extraProps: Record<string, unknown> = {},
): void {
  graph.addNode({
    id: agentId,
    type: 'actor',
    name: agentId,
    properties: { actorType: 'individual', ...extraProps },
  });
  graph.addEdge({
    id: `thread_${agentId}`,
    source: ASCENDANT_ID,
    target: agentId,
    type: 'thread',
    properties: { courtPosition },
  });
}

function seededRng(): () => number {
  let state = 12345;
  return () => {
    state = (state * 1664525 + 1013904223) & 0xffffffff;
    return Math.abs(state) / 0x7fffffff;
  };
}

function getCuratorTraces(traces: ReadonlyArray<TraceEntry>): CuratorDecisionTrace[] {
  return traces.filter(
    (t): t is CuratorDecisionTrace => t.category === 'curator_decision',
  );
}

// ─── Tests ──────────────────────────────────────────────────────

beforeEach(() => {
  clearTraces();
  enableTracing();
  resetTugCounter();
});

afterEach(() => {
  disableTracing();
  clearTraces();
});

describe('phaseAttention curator metadata wiring (THR-16)', () => {
  it('populates isChainStage=true for agent whose next chain stage matches template', () => {
    const chain = ENCOUNTER_CHAINS.find(c => c.id === 'chain.scholars_path')!;
    // stage 0 = 'knowledge_test'
    const templateId = chain.stages[0];

    const graph = new WorldGraph();
    addAscendant(graph);
    addThreadedAgent(graph, 'agent_chain', 'the_first', {
      // no chainProgress → stage 0 is always the next stage
    });

    const templates = [makeMinimalTemplate(templateId, 'eye')];
    const ua = makeUnifiedAction('ua_chain_1', 'agent_chain', templateId);
    const state = makeBaseState(graph, [ua]);

    phaseAttention(state, templates, seededRng());

    const traces = getCuratorTraces(getTraces());
    expect(traces.length).toBeGreaterThan(0);

    const chainTrace = traces.find(t => t.encounterId === 'ua_chain_1');
    expect(chainTrace).toBeDefined();
    expect(chainTrace!.isChainStage).toBe(true);
    expect(chainTrace!.isFinalChainStage).toBe(false);
  });

  it('populates isFinalChainStage=true for agent on the last chain stage', () => {
    const chain = ENCOUNTER_CHAINS.find(c => c.id === 'chain.scholars_path')!;
    const finalTemplateId = chain.stages[chain.stages.length - 1]; // 'arcane_duel'

    const graph = new WorldGraph();
    addAscendant(graph);
    addThreadedAgent(graph, 'agent_final', 'the_first', {
      chainProgress: {
        completed: { 'chain.scholars_path': chain.stages.length - 2 },
      },
    });

    const templates = [makeMinimalTemplate(finalTemplateId, 'eye')];
    const ua = makeUnifiedAction('ua_final_1', 'agent_final', finalTemplateId);
    const state = makeBaseState(graph, [ua]);

    phaseAttention(state, templates, seededRng());

    const traces = getCuratorTraces(getTraces());
    const finalTrace = traces.find(t => t.encounterId === 'ua_final_1');
    expect(finalTrace).toBeDefined();
    expect(finalTrace!.isChainStage).toBe(true);
    expect(finalTrace!.isFinalChainStage).toBe(true);
  });

  it('populates factionThreadCount with count of threaded fellow faction members', () => {
    const templateId = 'some_encounter';

    const graph = new WorldGraph();
    addAscendant(graph);
    addThreadedAgent(graph, 'agent_faction', 'the_first');

    // Add a faction
    graph.addNode({ id: 'faction_1', type: 'faction', name: 'Test Faction', properties: {} });

    // Agent is member of faction
    graph.addEdge({
      id: 'mem_agent',
      source: 'agent_faction',
      target: 'faction_1',
      type: 'member_of',
      properties: {},
    });

    // Two fellows in the faction who have ascendant threads
    addThreadedAgent(graph, 'fellow_a', 'inner_circle');
    graph.addEdge({ id: 'mem_a', source: 'fellow_a', target: 'faction_1', type: 'member_of', properties: {} });

    addThreadedAgent(graph, 'fellow_b', 'retinue');
    graph.addEdge({ id: 'mem_b', source: 'fellow_b', target: 'faction_1', type: 'member_of', properties: {} });

    // One faction member WITHOUT a thread — should not count
    graph.addNode({ id: 'fellow_c', type: 'actor', name: 'fellow_c', properties: { actorType: 'individual' } });
    graph.addEdge({ id: 'mem_c', source: 'fellow_c', target: 'faction_1', type: 'member_of', properties: {} });

    const templates = [makeMinimalTemplate(templateId, 'iron')];
    const ua = makeUnifiedAction('ua_faction_1', 'agent_faction', templateId);
    const state = makeBaseState(graph, [ua]);

    phaseAttention(state, templates, seededRng());

    const traces = getCuratorTraces(getTraces());
    const factionTrace = traces.find(t => t.encounterId === 'ua_faction_1');
    expect(factionTrace).toBeDefined();
    expect(factionTrace!.factionThreadCount).toBe(2);
  });

  it('populates matchesAmbition=true when agent pursues an ambition with matching reach', () => {
    const templateId = 'iron_template';

    const graph = new WorldGraph();
    addAscendant(graph);
    addThreadedAgent(graph, 'agent_ambition', 'the_first');

    // Ambition with iron reachAffinity
    graph.addNode({
      id: 'ambition_iron',
      type: 'ambition',
      name: 'Iron Mastery',
      properties: { reachAffinity: { iron: 0.8 } },
    });
    graph.addEdge({
      id: 'edge_pursues',
      source: 'agent_ambition',
      target: 'ambition_iron',
      type: 'pursues',
      properties: { priority: 'primary', status: 'active' },
    });

    const templates = [makeMinimalTemplate(templateId, 'iron')];
    const ua = makeUnifiedAction('ua_ambition_1', 'agent_ambition', templateId);
    const state = makeBaseState(graph, [ua]);

    phaseAttention(state, templates, seededRng());

    const traces = getCuratorTraces(getTraces());
    const ambitionTrace = traces.find(t => t.encounterId === 'ua_ambition_1');
    expect(ambitionTrace).toBeDefined();
    expect(ambitionTrace!.matchesAmbition).toBe(true);
  });

  it('leaves all four fields at default for an agent with no chain/faction/ambition', () => {
    const graph = new WorldGraph();
    addAscendant(graph);
    addThreadedAgent(graph, 'plain_agent', 'the_first');

    const templates = [makeMinimalTemplate('plain_encounter', 'iron')];
    const ua = makeUnifiedAction('ua_plain_1', 'plain_agent', 'plain_encounter');
    const state = makeBaseState(graph, [ua]);

    phaseAttention(state, templates, seededRng());

    const traces = getCuratorTraces(getTraces());
    const plainTrace = traces.find(t => t.encounterId === 'ua_plain_1');
    expect(plainTrace).toBeDefined();
    expect(plainTrace!.isChainStage).toBe(false);
    expect(plainTrace!.isFinalChainStage).toBe(false);
    expect(plainTrace!.factionThreadCount).toBe(0);
    expect(plainTrace!.matchesAmbition).toBe(false);
  });
});
