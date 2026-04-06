import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import { phaseSlotCaps, phaseDisposalTimeout } from '../phaseSlotCaps';
import { SLOT_CAPS, OVERFLOW_DISPOSAL_TIMEOUT_TICKS } from '../../data/attachment-slot-constants';
import type { AttachmentEffect } from '../../types/effects';

// ─── Test Helpers ────────────────────────────────────────────────

function makeGraph(): WorldGraph { return new WorldGraph(); }

function addAgent(graph: WorldGraph, id: string) {
  graph.addNode({ id, type: 'actor', name: `Agent ${id}`, properties: { actorType: 'individual', spotlightTier: 'spotlight' } });
}

let ec = 0;
function eid() { return `e.phase.${++ec}`; }

beforeEach(() => { ec = 0; });

function addPossession(graph: WorldGraph, agentId: string, nodeId: string, slotTag: string, tier = 1, acquiredTick = 0) {
  graph.addNode({ id: nodeId, type: 'artifact', name: nodeId, properties: { slotTag, tier, acquiredTick } });
  graph.addEdge({ id: eid(), source: agentId, target: nodeId, type: 'possesses', properties: {} });
}

function makeMinimalState(graph: WorldGraph, tick = 1, seed = 42): GameState {
  return {
    tick,
    seed,
    graph,
    phase: 'playing',
    cycle: 1,
    cosmology: {} as any,
    tiles: [],
    clock: {} as any,
    ascendantId: '',
    ascendantIdentity: null,
    essencePool: {} as any,
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
    agentKnowledge: new Map(),
    encounterProgress: [],
    actionsInProgress: [],
    unifiedActions: [],
    worldSoul: {} as any,
    echoDefinitions: [],
    echoStates: [],
    chronicle: {} as any,
  };
}

// ─── phaseSlotCaps ───────────────────────────────────────────────

describe('phaseSlotCaps', () => {
  it('deactivates overflow possessions', () => {
    const g = makeGraph();
    addAgent(g, 'a1');

    // Add 3 weapons — cap is 2
    addPossession(g, 'a1', 'w1', 'weapon', 1, 0);
    addPossession(g, 'a1', 'w2', 'weapon', 2, 5);
    addPossession(g, 'a1', 'w3', 'weapon', 1, 3);

    const state = makeMinimalState(g);
    phaseSlotCaps(state);

    // Check that one weapon edge is now inactive
    const edges = g.getOutgoingEdges('a1', 'possesses');
    const inactive = edges.filter(e => e.properties.active === false);
    expect(inactive).toHaveLength(1);

    // The lowest-tier, oldest should be deactivated (w1: tier 1, tick 0)
    const deactivatedTarget = inactive[0].target;
    expect(deactivatedTarget).toBe('w1');
  });

  it('does not crash when agent has no attachments', () => {
    const g = makeGraph();
    addAgent(g, 'a1');

    const state = makeMinimalState(g);
    expect(() => phaseSlotCaps(state)).not.toThrow();
  });

  it('does not crash when attachment has no slotTag', () => {
    const g = makeGraph();
    addAgent(g, 'a1');

    // Add artifact with no slotTag and no subcategory
    g.addNode({ id: 'mystery', type: 'artifact', name: 'Mystery Item', properties: {} });
    g.addEdge({ id: eid(), source: 'a1', target: 'mystery', type: 'possesses', properties: {} });

    const state = makeMinimalState(g);
    expect(() => phaseSlotCaps(state)).not.toThrow();
  });

  it('respects slot bonuses when checking caps', () => {
    const g = makeGraph();
    addAgent(g, 'a1');

    // Add 3 consumables — base cap is 4, so no overflow
    addPossession(g, 'a1', 'c1', 'consumable', 1, 0);
    addPossession(g, 'a1', 'c2', 'consumable', 1, 1);
    addPossession(g, 'a1', 'c3', 'consumable', 1, 2);
    addPossession(g, 'a1', 'c4', 'consumable', 1, 3);
    addPossession(g, 'a1', 'c5', 'consumable', 1, 4);

    // Add bag that grants +2 consumable slots
    g.addNode({ id: 'bag', type: 'artifact', name: 'Bag', properties: {
      slotTag: 'utility',
      effects: [{ type: 'slot_bonus', slotTag: 'consumable', bonus: 2 }] satisfies AttachmentEffect[],
    }});
    g.addEdge({ id: eid(), source: 'a1', target: 'bag', type: 'possesses', properties: {} });

    const state = makeMinimalState(g);
    phaseSlotCaps(state);

    // 5 consumables with cap 4+2=6 — no overflow
    const edges = g.getOutgoingEdges('a1', 'possesses');
    const inactive = edges.filter(e => e.properties.active === false);
    expect(inactive).toHaveLength(0);
  });
});

// ─── phaseDisposalTimeout ────────────────────────────────────────

describe('phaseDisposalTimeout', () => {
  it('drops items that have been inactive beyond the timeout', () => {
    const g = makeGraph();
    addAgent(g, 'a1');

    g.addNode({ id: 'old_sword', type: 'artifact', name: 'Old Sword', properties: { slotTag: 'weapon' } });
    g.addEdge({
      id: eid(), source: 'a1', target: 'old_sword', type: 'possesses',
      properties: { active: false, inactiveReason: 'slot_overflow', overflowTick: 10 },
    });

    const state = makeMinimalState(g, 10 + OVERFLOW_DISPOSAL_TIMEOUT_TICKS + 1);
    phaseDisposalTimeout(state);

    // Edge should have been removed
    const edges = g.getOutgoingEdges('a1', 'possesses');
    expect(edges).toHaveLength(0);
  });

  it('does not drop recently deactivated items', () => {
    const g = makeGraph();
    addAgent(g, 'a1');

    g.addNode({ id: 'sword', type: 'artifact', name: 'Sword', properties: { slotTag: 'weapon' } });
    g.addEdge({
      id: eid(), source: 'a1', target: 'sword', type: 'possesses',
      properties: { active: false, inactiveReason: 'slot_overflow', overflowTick: 10 },
    });

    const state = makeMinimalState(g, 15); // Only 5 ticks since overflow
    phaseDisposalTimeout(state);

    // Edge should still exist
    const edges = g.getOutgoingEdges('a1', 'possesses');
    expect(edges).toHaveLength(1);
  });

  it('does not drop active items', () => {
    const g = makeGraph();
    addAgent(g, 'a1');

    g.addNode({ id: 'sword', type: 'artifact', name: 'Sword', properties: { slotTag: 'weapon' } });
    g.addEdge({
      id: eid(), source: 'a1', target: 'sword', type: 'possesses',
      properties: {},
    });

    const state = makeMinimalState(g, 100);
    phaseDisposalTimeout(state);

    const edges = g.getOutgoingEdges('a1', 'possesses');
    expect(edges).toHaveLength(1);
  });
});
