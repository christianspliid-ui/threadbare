import { describe, it, expect } from 'vitest';
import type { TickEvent } from '../../types/gameState';
import type { WorldGraph } from '../graph';
import {
  resolveEventRouting,
  buildThreadingGate,
  isMortalAgentNode,
  ALWAYS_GLOBAL_EVENT_TYPES,
} from '../notificationThreadingGate';

const THREADED = new Set(['agent_threaded']);
const MORTALS = new Set(['agent_threaded', 'agent_stranger']);
const isMortalAgent = (id: string) => MORTALS.has(id);

function event(overrides: Partial<TickEvent> = {}): TickEvent {
  return {
    id: 'evt_1',
    tick: 12,
    type: 'personality_trait_emerged',
    message: 'Ziven has become Guiding',
    significance: 0.4,
    notification: { channel: 'toast' },
    ...overrides,
  } as TickEvent;
}

describe('resolveEventRouting', () => {
  it('routes a threaded agent\'s beat to their row', () => {
    const routing = resolveEventRouting(
      event({ actorId: 'agent_threaded' }), THREADED, isMortalAgent,
    );
    expect(routing).toBe('entity');
  });

  it('suppresses an unthreaded agent\'s beat entirely', () => {
    const routing = resolveEventRouting(
      event({ actorId: 'agent_stranger' }), THREADED, isMortalAgent,
    );
    expect(routing).toBe('suppress');
  });

  it('passes an actorless world event through as global', () => {
    const routing = resolveEventRouting(
      event({ actorId: undefined, type: 'doom_escalation' }), THREADED, isMortalAgent,
    );
    expect(routing).toBe('global');
  });

  it('passes a non-mortal actor (faction, ascendant) through as global', () => {
    const routing = resolveEventRouting(
      event({ actorId: 'faction_1' }), THREADED, isMortalAgent,
    );
    expect(routing).toBe('global');
  });

  it('keeps always-global types global even when an unthreaded mortal triggered them', () => {
    // A stranger discovering a ruin is map news, not gossip about the stranger.
    const routing = resolveEventRouting(
      event({ actorId: 'agent_stranger', type: 'elder_site_discovered' }),
      THREADED,
      isMortalAgent,
    );
    expect(routing).toBe('global');
  });

  it('keeps always-global types global even for a threaded mortal', () => {
    const routing = resolveEventRouting(
      event({ actorId: 'agent_threaded', type: 'doom_escalation' }),
      THREADED,
      isMortalAgent,
    );
    expect(routing).toBe('global');
  });

  it('treats an empty threaded set as "nobody is watched"', () => {
    const routing = resolveEventRouting(
      event({ actorId: 'agent_threaded' }), new Set(), isMortalAgent,
    );
    expect(routing).toBe('suppress');
  });
});

/**
 * Graph-backed coverage. `resolveEventRouting` takes the mortal predicate as an
 * argument, so a wrong predicate passes every test above — that is exactly how
 * an early draft shipped `node.category === 'agent'` against a `GraphNode` that
 * has no `category` field, which would have silently disabled the whole gate.
 * These tests run the real graph reads.
 */
describe('buildThreadingGate — against a graph', () => {
  const NODES = {
    asc_1:    { id: 'asc_1',    type: 'actor', name: 'The God',  properties: { actorType: 'ascendant' } },
    kael:     { id: 'kael',     type: 'actor', name: 'Kael',     properties: { actorType: 'individual' } },
    stranger: { id: 'stranger', type: 'actor', name: 'Ziven',    properties: { actorType: 'individual' } },
    dormant:  { id: 'dormant',  type: 'actor', name: 'Sear',     properties: { actorType: 'individual' } },
    guild:    { id: 'guild',    type: 'actor', name: 'The Guild', properties: { actorType: 'faction' } },
  } as const;

  const THREAD_EDGES = [
    { id: 'th_1', source: 'asc_1', target: 'kael',    type: 'thread', properties: { tier: 3, courtPosition: 'retinue' } },
    { id: 'th_2', source: 'asc_1', target: 'dormant', type: 'thread', properties: { tier: 1, courtPosition: 'dormant' } },
  ];

  const graph = {
    getNode: (id: string) => (NODES as Record<string, unknown>)[id],
    getOutgoingEdges: (id: string, type: string) =>
      (id === 'asc_1' && type === 'thread' ? THREAD_EDGES : []),
    getIncomingEdges: () => [],
  } as unknown as WorldGraph;

  const gate = buildThreadingGate(graph, 'asc_1');

  it('identifies a mortal agent by actorType, not by a category field', () => {
    expect(isMortalAgentNode(graph, 'kael')).toBe(true);
    expect(isMortalAgentNode(graph, 'asc_1')).toBe(false);
    expect(isMortalAgentNode(graph, 'guild')).toBe(false);
    expect(isMortalAgentNode(graph, 'missing')).toBe(false);
  });

  it('routes a threaded mortal to their row', () => {
    expect(gate.resolveEventRouting(event({ actorId: 'kael' }))).toBe('entity');
  });

  it('suppresses an unthreaded mortal', () => {
    expect(gate.resolveEventRouting(event({ actorId: 'stranger' }))).toBe('suppress');
  });

  it('suppresses a dormant-threaded mortal — a thread set down is not watched', () => {
    expect(gate.resolveEventRouting(event({ actorId: 'dormant' }))).toBe('suppress');
  });

  it('routes a faction actor globally', () => {
    expect(gate.resolveEventRouting(event({ actorId: 'guild' }))).toBe('global');
  });
});

describe('ALWAYS_GLOBAL_EVENT_TYPES', () => {
  it('covers the categories the spec keeps global', () => {
    for (const type of [
      'doom_escalation', 'omen_started', 'settlement_tier_change',
      'economic_chronicle', 'hidden_site_discovered', 'faction_founded',
      'battle_started', 'intervention_effect',
    ] as const) {
      expect(ALWAYS_GLOBAL_EVENT_TYPES.has(type)).toBe(true);
    }
  });

  it('does not swallow the per-agent beats the gate exists to catch', () => {
    for (const type of [
      'personality_trait_emerged', 'complication', 'ambition_milestone',
      'tier_promotion', 'agent_action',
    ] as const) {
      expect(ALWAYS_GLOBAL_EVENT_TYPES.has(type)).toBe(false);
    }
  });
});
