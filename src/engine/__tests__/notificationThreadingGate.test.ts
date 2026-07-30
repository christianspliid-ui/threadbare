import { describe, it, expect } from 'vitest';
import type { TickEvent } from '../../types/gameState';
import type { WorldGraph } from '../graph';
import {
  resolveEventRouting,
  buildThreadingGate,
  isMortalAgentNode,
  isFactionNode,
  ALWAYS_GLOBAL_EVENT_TYPES,
  FACTION_ANCHORED_EVENT_TYPES,
} from '../notificationThreadingGate';

const THREADED = new Set(['agent_threaded', 'faction_threaded']);
const MORTALS = new Set(['agent_threaded', 'agent_stranger']);
const FACTIONS = new Set(['faction_threaded', 'faction_stranger']);
const isMortalAgent = (id: string) => MORTALS.has(id);
const isFaction = (id: string) => FACTIONS.has(id);

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
      event({ actorId: 'agent_threaded' }), THREADED, isMortalAgent, isFaction,
    );
    expect(routing).toEqual({ kind: 'entity', anchorId: 'agent_threaded', anchorKind: 'agent' });
  });

  it('suppresses an unthreaded agent\'s beat entirely', () => {
    const routing = resolveEventRouting(
      event({ actorId: 'agent_stranger' }), THREADED, isMortalAgent, isFaction,
    );
    expect(routing.kind).toBe('suppress');
  });

  it('passes an actorless world event through as global', () => {
    const routing = resolveEventRouting(
      event({ actorId: undefined, type: 'doom_escalation' }), THREADED, isMortalAgent, isFaction,
    );
    expect(routing.kind).toBe('global');
  });

  it('passes a non-mortal actor (faction, ascendant) through as global', () => {
    const routing = resolveEventRouting(
      event({ actorId: 'faction_1' }), THREADED, isMortalAgent, isFaction,
    );
    expect(routing.kind).toBe('global');
  });

  it('keeps always-global types global even when an unthreaded mortal triggered them', () => {
    // A stranger discovering a ruin is map news, not gossip about the stranger.
    const routing = resolveEventRouting(
      event({ actorId: 'agent_stranger', type: 'elder_site_discovered' }),
      THREADED,
      isMortalAgent,
      isFaction,
    );
    expect(routing.kind).toBe('global');
  });

  it('keeps always-global types global even for a threaded mortal', () => {
    const routing = resolveEventRouting(
      event({ actorId: 'agent_threaded', type: 'doom_escalation' }),
      THREADED,
      isMortalAgent,
      isFaction,
    );
    expect(routing.kind).toBe('global');
  });

  it('treats an empty threaded set as "nobody is watched"', () => {
    const routing = resolveEventRouting(
      event({ actorId: 'agent_threaded' }), new Set(), isMortalAgent, isFaction,
    );
    expect(routing.kind).toBe('suppress');
  });

  it('defaults the faction predicate to "nothing is a faction" — pre-THR-667 callers', () => {
    // The 4th argument is optional so existing three-argument callers keep the
    // mortal-only behaviour rather than silently gaining a faction branch.
    const routing = resolveEventRouting(
      event({ actorId: 'agent_threaded', factionId: 'faction_threaded', type: 'faction_rank_changed' }),
      THREADED,
      isMortalAgent,
    );
    expect(routing).toEqual({ kind: 'entity', anchorId: 'agent_threaded', anchorKind: 'agent' });
  });
});

/**
 * THR-667 — the faction anchor.
 *
 * `faction_rank_changed` carries BOTH an actorId (the promoted member) and a
 * factionId, so ordering is the whole design: the faction wins when threaded,
 * and the mortal path catches the rest. THR-666 sidestepped this by pinning
 * every faction type as always-global; these tests pin the split that replaced
 * that.
 */
describe('resolveEventRouting — faction anchoring', () => {
  const rankEvent = (overrides: Partial<TickEvent> = {}) => event({
    type: 'faction_rank_changed',
    message: 'Kael has been promoted to Journeyman in the Iron Guard.',
    actorId: 'agent_stranger',
    factionId: 'faction_threaded',
    ...overrides,
  });

  it('anchors a faction-scoped beat to the threaded faction\'s row', () => {
    const routing = resolveEventRouting(rankEvent(), THREADED, isMortalAgent, isFaction);
    expect(routing).toEqual({
      kind: 'entity', anchorId: 'faction_threaded', anchorKind: 'faction',
    });
  });

  it('prefers the faction row over the member\'s, even when both are threaded', () => {
    const routing = resolveEventRouting(
      rankEvent({ actorId: 'agent_threaded' }), THREADED, isMortalAgent, isFaction,
    );
    expect(routing).toMatchObject({ anchorKind: 'faction', anchorId: 'faction_threaded' });
  });

  it('falls back to the member\'s row when the faction is unthreaded but they are not', () => {
    // Holding the member's thread and not the faction's is common; the news is
    // still the player's, so it must not vanish.
    const routing = resolveEventRouting(
      rankEvent({ actorId: 'agent_threaded', factionId: 'faction_stranger' }),
      THREADED, isMortalAgent, isFaction,
    );
    expect(routing).toEqual({ kind: 'entity', anchorId: 'agent_threaded', anchorKind: 'agent' });
  });

  it('suppresses when neither the faction nor the member is threaded', () => {
    const routing = resolveEventRouting(
      rankEvent({ factionId: 'faction_stranger' }), THREADED, isMortalAgent, isFaction,
    );
    expect(routing.kind).toBe('suppress');
  });

  it('ignores a factionId that no longer resolves to a faction (fail-soft)', () => {
    const routing = resolveEventRouting(
      rankEvent({ actorId: 'agent_threaded', factionId: 'deleted_node' }),
      THREADED, isMortalAgent, isFaction,
    );
    expect(routing).toEqual({ kind: 'entity', anchorId: 'agent_threaded', anchorKind: 'agent' });
  });

  it('does not anchor a non-faction-scoped type that happens to carry a factionId', () => {
    const routing = resolveEventRouting(
      event({ actorId: 'agent_threaded', factionId: 'faction_threaded' }),
      THREADED, isMortalAgent, isFaction,
    );
    expect(routing).toMatchObject({ anchorKind: 'agent' });
  });

  it('keeps world-scale faction news global — founding and collapse outrank the anchor', () => {
    for (const type of ['faction_founded', 'faction_dissolved'] as const) {
      const routing = resolveEventRouting(
        rankEvent({ type }), THREADED, isMortalAgent, isFaction,
      );
      expect(routing.kind).toBe('global');
    }
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
    // THR-667: a thread to a faction. `collectThreadedAgents` is keyed by thread
    // target, so factions were already in that map — the gate simply had no
    // branch to spend them on.
    { id: 'th_3', source: 'asc_1', target: 'guild',   type: 'thread', properties: { tier: 2, courtPosition: 'retinue' } },
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

  it('identifies a faction by actorType too — same shape, no category field', () => {
    expect(isFactionNode(graph, 'guild')).toBe(true);
    expect(isFactionNode(graph, 'kael')).toBe(false);
    expect(isFactionNode(graph, 'asc_1')).toBe(false);
    expect(isFactionNode(graph, 'missing')).toBe(false);
  });

  it('routes a threaded mortal to their row', () => {
    expect(gate.resolveEventRouting(event({ actorId: 'kael' })))
      .toEqual({ kind: 'entity', anchorId: 'kael', anchorKind: 'agent' });
  });

  it('suppresses an unthreaded mortal', () => {
    expect(gate.resolveEventRouting(event({ actorId: 'stranger' })).kind).toBe('suppress');
  });

  it('suppresses a dormant-threaded mortal — a thread set down is not watched', () => {
    expect(gate.resolveEventRouting(event({ actorId: 'dormant' })).kind).toBe('suppress');
  });

  it('routes a faction actor globally on the mortal path', () => {
    expect(gate.resolveEventRouting(event({ actorId: 'guild' })).kind).toBe('global');
  });

  it('anchors a rank change to the threaded faction, reading the real graph', () => {
    // The whole-gate path: real thread edges, real actorType reads, real sets.
    expect(gate.resolveEventRouting(event({
      type: 'faction_rank_changed',
      actorId: 'stranger',
      factionId: 'guild',
    }))).toEqual({ kind: 'entity', anchorId: 'guild', anchorKind: 'faction' });
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

/**
 * THR-667 — the two sets must not overlap. `ALWAYS_GLOBAL_EVENT_TYPES` is checked
 * first, so a type listed in both would read as anchored here while behaving as
 * global forever: the exact silent-dead-path shape this ticket removed from
 * THR-666's parked faction entry.
 */
describe('FACTION_ANCHORED_EVENT_TYPES', () => {
  it('anchors the faction-scoped types', () => {
    expect(FACTION_ANCHORED_EVENT_TYPES.has('faction_rank_changed')).toBe(true);
  });

  it('is disjoint from ALWAYS_GLOBAL_EVENT_TYPES', () => {
    const overlap = [...FACTION_ANCHORED_EVENT_TYPES]
      .filter(type => ALWAYS_GLOBAL_EVENT_TYPES.has(type));
    expect(overlap).toEqual([]);
  });

  it('leaves world-scale faction news global', () => {
    for (const type of ['faction_founded', 'faction_dissolved'] as const) {
      expect(FACTION_ANCHORED_EVENT_TYPES.has(type)).toBe(false);
      expect(ALWAYS_GLOBAL_EVENT_TYPES.has(type)).toBe(true);
    }
  });
});
