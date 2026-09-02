/**
 * Moment card read-model — THR-1299 slice 3.
 *
 * The property under test is Law 56: every chip is backed by a state write, and
 * nothing on the face is a numeral. The arms are per class because each class
 * claims a different write; a single "renders chips" assertion would pass on a
 * model that put the same chip on everything.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../../engine/graph';
import type { GameState } from '../../../types/gameState';
import type { StrategicProjectRuntime, UndertakingMomentRecord } from '../../../types/strategicAction';
import { UNDERTAKING_EVENT_NODE_ID_PREFIX } from '../../../engine/grievance/undertakingOutcomeNode';
import { UNDERTAKING_PROGRESS_PER_ADVANCE } from '../../../data/strategic-action-constants';
import { buildMomentCardModel, findForwardLink } from '../momentCardModel';

function buildGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'ascendant', name: 'The God', type: 'actor', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'actor_1', name: 'Kael', type: 'actor', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'actor_2', name: 'Bram', type: 'actor', properties: { actorType: 'individual' } });
  return graph;
}

function buildProject(overrides: Partial<StrategicProjectRuntime> = {}): StrategicProjectRuntime {
  return {
    projectId: 'proj_1',
    actorId: 'actor_1',
    templateId: 'strategic_build_warehouse',
    ambitionId: 'ambition_dominate_trade',
    verb: 'create',
    behaviorFamily: 'merchant-expansion',
    progress: 12,
    progressRequired: 18,
    startedTick: 0,
    lastProgressTick: 10,
    status: 'active',
    ...overrides,
  };
}

function buildState(graph: WorldGraph, projects: StrategicProjectRuntime[] = [buildProject()], essence = 100): GameState {
  return {
    cycle: 1, tick: 10, phase: 'playing', seed: 42, graph,
    cosmology: { spheres: {} } as any,
    tiles: [], clock: { currentTick: 10 } as any,
    ascendantId: 'ascendant', ascendantIdentity: null,
    essencePool: { spirit: essence, entropy: essence } as any,
    mandateDefinition: null, mandateState: null,
    rivalDefinitions: [], rivalStates: [],
    doomDefinition: {} as any, doomClock: {} as any,
    tickEvents: [], recentEvents: [], chronicleEntries: [],
    stealthExposure: 0,
    visibilityMap: new Map() as any, familiarityMap: new Map() as any,
    culturalInsightMap: new Map(), agentKnowledge: new Map(),
    encounterProgress: [], actionsInProgress: [], unifiedActions: [],
    worldSoul: {} as any, echoDefinitions: [], echoStates: [], chronicle: {} as any,
    strategicState: { projects, controls: [], history: [] },
  } as unknown as GameState;
}

function record(overrides: Partial<UndertakingMomentRecord> = {}): UndertakingMomentRecord {
  return {
    id: 'undertaking_at_cost_proj_1_10',
    projectId: 'proj_1',
    actorId: 'actor_1',
    templateId: 'strategic_build_warehouse',
    momentClass: 'at_cost',
    presentation: 'interrupt',
    tick: 10,
    label: 'Kael presses on with Build Warehouse, but it costs them',
    undertakingName: 'Build Warehouse',
    band: 'success_at_cost',
    effect: 'advance_at_cost',
    acknowledged: false,
    ...overrides,
  };
}

const NUMERAL = /\d/;

describe('buildMomentCardModel', () => {
  it('names the actor and the work, and puts no numeral on the face', () => {
    const graph = buildGraph();
    const model = buildMomentCardModel(buildState(graph), record());

    expect(model.actorName).toBe('Kael');
    expect(model.undertakingName).toBe('Build Warehouse');
    expect(model.opening).toContain('Kael');
    expect(model.opening).toContain('Build Warehouse');
    expect(model.bandWord).toBeTruthy();
    // Law 13: words, never numerals — on every string the card renders.
    for (const text of [model.title, model.opening, model.consequence, model.bandWord ?? '', model.progressWord ?? '']) {
      expect(text).not.toMatch(NUMERAL);
    }
    for (const chip of model.chips) {
      expect(chip.category).not.toMatch(NUMERAL);
      expect(chip.noun).not.toMatch(NUMERAL);
    }
  });

  it('reads checkpoint position as a level off the live runtime, and degrades to none without it', () => {
    const graph = buildGraph();
    const withProject = buildMomentCardModel(buildState(graph), record());
    expect(withProject.checkpoints).toEqual({
      total: Math.ceil(18 / UNDERTAKING_PROGRESS_PER_ADVANCE),
      filled: Math.round(12 / UNDERTAKING_PROGRESS_PER_ADVANCE),
    });
    expect(withProject.progressWord).toBeTruthy();

    const gone = buildMomentCardModel(buildState(graph, []), record());
    expect(gone.checkpoints).toBeNull();
    expect(gone.progressWord).toBeNull();
    expect(gone.actionable).toBe(false);
  });

  it('claims one state write per class — the chip follows the runtime field that moved', () => {
    const graph = buildGraph();
    const state = buildState(graph);
    const chipIds = (r: Partial<UndertakingMomentRecord>) =>
      buildMomentCardModel(state, record(r)).chips.map(c => `${c.id}:${c.noun}`);

    expect(chipIds({ momentClass: 'started', band: undefined, effect: undefined })).toEqual(['work:begun']);
    expect(chipIds({ momentClass: 'completion' })).toEqual(['work:finished']);
    expect(chipIds({ momentClass: 'abandoned' })).toEqual(['work:abandoned']);
    expect(chipIds({ momentClass: 'fork' })[0]).toMatch(/^stakes:/);
    expect(chipIds({ momentClass: 'at_cost' })[0]).toMatch(/^progress:/);
    expect(chipIds({ momentClass: 'complication', effect: 'halt' })).toEqual(['progress:halted']);
  });

  it('a named loss becomes a Cast chip and the opening names them', () => {
    const graph = buildGraph();
    const model = buildMomentCardModel(
      buildState(graph),
      record({ momentClass: 'complication', effect: 'advance_at_cost', lostCastName: 'Old Maerin' }),
    );
    expect(model.chips.some(c => c.id === 'cast' && c.noun === 'lost Old Maerin')).toBe(true);
    expect(model.opening).toContain('Old Maerin');
    expect(model.title).toBe('Trouble');
  });

  it('the divine-hand chip renders only when the rider moved THIS checkpoint, and is unlinked', () => {
    const graph = buildGraph();
    const touched = buildMomentCardModel(
      buildState(graph),
      record({ divineInfluence: { verb: 'sabotage', tick: 10 } }),
    );
    const divine = touched.chips.find(c => c.id === 'divine');
    expect(divine?.noun).toContain('sabotaged');
    expect(divine?.selectAgentId).toBeUndefined();

    const untouched = buildMomentCardModel(buildState(graph), record());
    expect(untouched.chips.some(c => c.id === 'divine')).toBe(false);
  });

  it('the forward link reads a real outcome node and its victim\'s minted drive', () => {
    const graph = buildGraph();
    const eventId = `${UNDERTAKING_EVENT_NODE_ID_PREFIX}proj_1_10`;
    graph.addNode({
      id: eventId, name: 'raid (severed)', type: 'event',
      properties: { eventType: 'undertaking_outcome', tick: 10, victimAgentId: 'actor_2' },
    });
    graph.addNode({ id: 'amb_revenge', name: 'Answer the Raid', type: 'ambition', properties: {} });
    graph.addEdge({
      id: 'pursues_actor_2_amb_revenge', source: 'actor_2', target: 'amb_revenge', type: 'pursues',
      properties: { status: 'active', mintedByEventId: eventId },
    });

    const link = findForwardLink(graph, record({ momentClass: 'completion' }));
    expect(link).toEqual({ agentId: 'actor_2', agentName: 'Bram', ambitionId: 'amb_revenge', ambitionName: 'Answer the Raid' });

    const model = buildMomentCardModel(buildState(graph), record({ momentClass: 'completion' }));
    const forward = model.chips.find(c => c.id === 'forward');
    expect(forward?.selectAgentId).toBe('actor_2');
    expect(forward?.entity?.kind).toBe('agent');
    expect(forward?.noun).toContain('Bram');

    // The falsifier: a pursues edge minted by some OTHER event is not this moment's.
    graph.removeEdge('pursues_actor_2_amb_revenge');
    graph.addEdge({
      id: 'pursues_other', source: 'actor_2', target: 'amb_revenge', type: 'pursues',
      properties: { status: 'active', mintedByEventId: 'evt_elsewhere' },
    });
    expect(findForwardLink(graph, record({ momentClass: 'completion' }))).toBeNull();
  });

  it('the action slot opens only on a live work with a standing mortal, and prices affordability off the pool', () => {
    const graph = buildGraph();
    const live = buildMomentCardModel(buildState(graph), record());
    expect(live.actionable).toBe(true);
    expect(live.divineActions.map(a => a.verb)).toEqual(['inspire', 'sabotage']);
    expect(live.divineActions.every(a => a.affordable)).toBe(true);

    const finished = buildMomentCardModel(buildState(graph, [buildProject({ status: 'completed' })]), record({ momentClass: 'completion' }));
    expect(finished.actionable).toBe(false);

    const broke = buildMomentCardModel(buildState(graph, [buildProject()], 0), record());
    expect(broke.actionable).toBe(true);
    expect(broke.divineActions.every(a => a.affordable)).toBe(false);

    graph.removeNode('actor_1');
    const bereft = buildMomentCardModel(buildState(graph), record());
    expect(bereft.actionable).toBe(false);
    expect(bereft.actorExists).toBe(false);
    expect(bereft.actorName).toBe('actor_1');
  });
});
