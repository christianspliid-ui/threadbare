/**
 * THR-2042 — the commission take-up through the real resolution path.
 *
 * `processFactionEncounterReputation` is stubbed to credit one faction, so the arms pin
 * the seam in `executeStepResult` (completion gate, the aftermath change, its words)
 * without depending on a particular faction template's META row.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../factionReputation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../factionReputation')>();
  return {
    ...actual,
    processFactionEncounterReputation: vi.fn((_g: unknown, _a: unknown, _e: unknown, stepSuccess: boolean) =>
      stepSuccess ? 'faction_guild' : null),
  };
});

import { executeStepResult } from '../unifiedActionResolution';
import { createUnifiedAction, resetUnifiedActionCounter } from '../unifiedActionLifecycle';
import { WorldGraph } from '../graph';
import { COMMISSION_QUEST_COST } from '../../types/factionAction';
import type { UnifiedAction, UnifiedActionTemplate } from '../../types/unifiedAction';
import type { GameState } from '../../types/gameState';

const fixedRng = () => 0.5;

function createState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'faction_guild', type: 'actor', name: 'Civic Guard',
    properties: { actorType: 'faction', factionDefId: 'civic_guard', wealth: 20 },
  });
  graph.addNode({
    id: 'actor-1', type: 'actor', name: 'Kael Thornweaver',
    properties: { actorType: 'individual', wealth: 30, reputationScore: 0.5 },
  });
  graph.addNode({ id: 'loc-1', type: 'location', name: 'Market', properties: {} });
  graph.addEdge({ id: 'edge-loc-1', source: 'actor-1', target: 'loc-1', type: 'located_at', properties: {} });
  graph.addEdge({
    id: 'e_member', source: 'actor-1', target: 'faction_guild', type: 'member_of',
    properties: { role: 'member', joinedTick: 0, rank: 0.3, factionDefId: 'civic_guard' },
  });
  graph.addNode({
    id: 'faction_quest_1', type: 'event', name: 'Civic Guard Commission',
    properties: {
      eventType: 'faction_quest', factionId: 'faction_guild', expiryTick: 40,
      escrow: COMMISSION_QUEST_COST, status: 'open', createdTick: 5, claimed: false,
    },
  });
  graph.addEdge({
    id: 'e_commissions', source: 'faction_guild', target: 'faction_quest_1',
    type: 'commissions', properties: { expiryTick: 40 },
  });
  return {
    tick: 10, seed: 42, cycle: 1, phase: 'playing', graph,
    cosmology: {} as never, tiles: [], clock: {} as never,
    ascendantId: 'asc-1', essencePool: {} as never,
    mandateDefinition: null, mandateState: null,
    rivalDefinitions: [], rivalStates: [],
    doomDefinition: {} as never, doomClock: {} as never,
    tickEvents: [], recentEvents: [], chronicleEntries: [],
    stealthExposure: 0, visibilityMap: {} as never, familiarityMap: {} as never,
    culturalInsightMap: new Map(), agentKnowledge: new Map(),
    encounterProgress: [], actionsInProgress: [], unifiedActions: [],
    worldSoul: {} as never, echoDefinitions: [], echoStates: [],
    chronicle: {} as never,
  } as unknown as GameState;
}

function makeTemplate(steps: number): UnifiedActionTemplate {
  return {
    id: 'encounter.test.commission',
    rarityTier: 1,
    intrinsicTier: 'background',
    name: 'Guild Errand',
    reach: 'eye',
    crudType: 'read',
    scale: 'local',
    steps: Array.from({ length: steps }, () => ({
      reach: 'eye',
      duration: { min: 1, max: 1 },
      difficulty: 0.42,
      onSuccess: [],
      onFailure: [],
      failBehavior: 'abort',
    })),
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ['courage_prudence'],
    narrativeTemplates: { initiation: 'begins', success: 'succeeds', failure: 'fails' },
  } as unknown as UnifiedActionTemplate;
}

function start(template: UnifiedActionTemplate): UnifiedAction {
  return createUnifiedAction({
    actorId: 'actor-1', templateId: template.id, targetId: 'loc-1',
    scale: 'local', source: 'agent', tick: 0, template, rng: fixedRng,
  });
}

const commissionRows = (action: UnifiedAction) =>
  (action.aftermathChanges ?? []).filter(c => c.id.includes(':commission:'));

describe('THR-2042 — a completed faction encounter takes up the commission', () => {
  beforeEach(() => resetUnifiedActionCounter());

  it('a completed encounter carries one economy change naming the commission', () => {
    const state = createState();
    const template = makeTemplate(1);
    const { updatedAction } = executeStepResult(start(template), template, 'success', [], state, fixedRng, 10);
    const rows = commissionRows(updatedAction);
    expect(rows).toHaveLength(1);
    expect(rows[0].kind).toBe('economy');
    expect(rows[0].detail.endsWith('— a commission their faction paid for.')).toBe(true);
    expect(state.graph.getNode('faction_quest_1')!.properties.status).toBe('taken');
    expect(state.graph.getIncomingEdges('faction_quest_1', 'took_up')).toHaveLength(1);
  });

  it('a failed encounter carries none and leaves the posting open', () => {
    const state = createState();
    const template = makeTemplate(1);
    const { updatedAction } = executeStepResult(start(template), template, 'failure', [], state, fixedRng, 10);
    expect(commissionRows(updatedAction)).toHaveLength(0);
    expect(state.graph.getNode('faction_quest_1')!.properties.status).toBe('open');
  });

  it('an unfinished encounter (first of two steps) carries none', () => {
    const state = createState();
    const template = makeTemplate(2);
    const { updatedAction } = executeStepResult(start(template), template, 'success', [], state, fixedRng, 10);
    expect(updatedAction.resolved).toBe(false);
    expect(commissionRows(updatedAction)).toHaveLength(0);
    expect(state.graph.getNode('faction_quest_1')!.properties.status).toBe('open');
  });
});
