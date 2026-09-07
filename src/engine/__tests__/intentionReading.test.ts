/**
 * One rule for reading a mortal's mind (THR-1433).
 *
 * Each door is falsified at its owning layer, with its absence arm beside it: a
 * stranger with no mark is unreadable; a followed holder's mark opens them and an
 * unfollowed holder's does not, nor a revealed one; a followed network with a member
 * in reach opens them and not when the member is out of reach or the leader
 * unfollowed; the plot is closed at `transparent` and open through a mark.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import type { StrategicProjectRuntime } from '../../types/strategicAction';
import {
  canReadIntention,
  readIntentionFromCard,
  describeIntentionRead,
  isSecretCellId,
  secretIntentionOf,
} from '../intentionReading';
import { INTENTION_KNOWLEDGE_TIER } from '../../types/agentKnowledge';
import { NETWORK_READ_REACH_HEXES, SECRET_CELL_IDS } from '../../data/intention-reading-constants';
import { RING_REACH_HEXES } from '../../data/strategic-action-constants';
import { FAMILIARITY_THRESHOLDS } from '../../types/familiarity';
import { getCellTemplate } from '../../data/undertaking-cells';

// ─── Fixtures ────────────────────────────────────────────────────

const GOD = 'ascendant';

function world(): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: GOD, type: 'actor', name: 'The God', properties: { actorType: 'ascendant' } });
  // Three hexes along a row: near, mid, far.
  g.addNode({ id: 'loc_near', type: 'location', name: 'Nearby', properties: { locationSubtype: 'hamlet', hexCol: 0, hexRow: 0 } });
  g.addNode({ id: 'loc_edge', type: 'location', name: 'Edgeward', properties: { locationSubtype: 'hamlet', hexCol: NETWORK_READ_REACH_HEXES, hexRow: 0 } });
  g.addNode({ id: 'loc_far', type: 'location', name: 'Farholt', properties: { locationSubtype: 'hamlet', hexCol: NETWORK_READ_REACH_HEXES + 1, hexRow: 0 } });
  for (const [id, name, loc] of [
    ['ind_stranger', 'Old Maerin', 'loc_near'],
    ['ind_spider', 'Vessa', 'loc_far'],
    ['ind_patron', 'Hesk', 'loc_far'],
    ['ind_ringer', 'Tam', 'loc_edge'],
  ] as const) {
    g.addNode({ id, type: 'actor', name, properties: { actorType: 'individual' } });
    g.addEdge({ id: `${id}_at`, source: id, target: loc, type: 'located_at', properties: {} });
  }
  return g;
}

function mark(g: WorldGraph, holder: string, subject: string, revealed = false): void {
  g.addEdge({
    id: `knows_secret_of_${holder}_${subject}`, source: holder, target: subject, type: 'knows_secret_of',
    properties: { secretType: 'indiscretion', magnitude: 0.5, discoveredTick: 3, source: 'test', revealed },
  });
}

function ring(g: WorldGraph, leader: string, members: readonly string[]): string {
  const id = 'grp_ring';
  g.addNode({ id, type: 'actor', name: "Hesk's Hold", properties: { actorType: 'group', groupKind: 'network', groupStatus: 'active', groupType: 'network' } });
  g.addEdge({ id: `${id}_cmd`, source: id, target: leader, type: 'commanded_by', properties: {} });
  for (const m of [leader, ...members]) {
    g.addEdge({ id: `${m}_member_of_${id}`, source: m, target: id, type: 'member_of', properties: { joinedTick: 1 } });
  }
  return id;
}

function state(g: WorldGraph, overrides: Partial<GameState> = {}): GameState {
  return {
    tick: 10,
    graph: g,
    ascendantId: GOD,
    familiarityMap: new Map(),
    followedAgentIds: [],
    mutedAgentIds: [],
    strategicState: { projects: [], controls: [], history: [] },
    ...overrides,
  } as unknown as GameState;
}

function plot(actorId: string, templateId = 'cell.destroy.mortal'): StrategicProjectRuntime {
  return { projectId: `proj_${actorId}`, actorId, templateId, status: 'active', verb: 'destroy' } as unknown as StrategicProjectRuntime;
}

// ─── The doors ────────────────────────────────────────────────────

describe('canReadIntention — the familiarity door', () => {
  it('a stranger with no mark and no network is unreadable', () => {
    expect(canReadIntention(state(world()), GOD, 'ind_stranger')).toEqual({ readable: false, secret: false });
  });

  it('opens at INTENTION_KNOWLEDGE_TIER and not one step below', () => {
    const g = world();
    const at = new Map([['ind_stranger', FAMILIARITY_THRESHOLDS[INTENTION_KNOWLEDGE_TIER]]]);
    expect(canReadIntention(state(g, { familiarityMap: at }), GOD, 'ind_stranger')).toEqual({ readable: true, through: 'familiarity', secret: false });
    const below = new Map([['ind_stranger', FAMILIARITY_THRESHOLDS[INTENTION_KNOWLEDGE_TIER] - 0.01]]);
    expect(canReadIntention(state(g, { familiarityMap: below }), GOD, 'ind_stranger').readable).toBe(false);
  });

  it('a lifted knowledge level (omniscience) opens the door without a familiarity score', () => {
    expect(canReadIntention(state(world()), GOD, 'ind_stranger', { knowledgeLevel: 'transparent' }).readable).toBe(true);
  });

  it('only the ascendant reads by familiarity — another reader gets nothing from the map', () => {
    const at = new Map([['ind_stranger', 1]]);
    expect(canReadIntention(state(world(), { familiarityMap: at }), 'ind_patron', 'ind_stranger').readable).toBe(false);
  });
});

describe('canReadIntention — the mark door', () => {
  it('a stranger is readable through a followed mortal\'s unrevealed mark, and names the holder', () => {
    const g = world();
    mark(g, 'ind_spider', 'ind_stranger');
    const read = canReadIntention(state(g, { followedAgentIds: ['ind_spider'] }), GOD, 'ind_stranger');
    expect(read).toEqual({ readable: true, through: 'mark', via: 'ind_spider', viaName: 'Vessa', secret: false });
    expect(describeIntentionRead(read, 'Old Maerin')).toContain('Vessa');
  });

  it('an unfollowed holder\'s mark opens nothing', () => {
    const g = world();
    mark(g, 'ind_spider', 'ind_stranger');
    expect(canReadIntention(state(g), GOD, 'ind_stranger').readable).toBe(false);
  });

  it('a revealed mark is spent — it opens nothing even when the holder is followed', () => {
    const g = world();
    mark(g, 'ind_spider', 'ind_stranger', true);
    expect(canReadIntention(state(g, { followedAgentIds: ['ind_spider'] }), GOD, 'ind_stranger').readable).toBe(false);
  });

  it('a muted default-follow does not count as following the holder', () => {
    const g = world();
    g.addEdge({ id: 'thread_spider', source: GOD, target: 'ind_spider', type: 'thread', properties: { courtPosition: 'retinue' } });
    mark(g, 'ind_spider', 'ind_stranger');
    expect(canReadIntention(state(g), GOD, 'ind_stranger').readable).toBe(true);
    expect(canReadIntention(state(g, { mutedAgentIds: ['ind_spider'] }), GOD, 'ind_stranger').readable).toBe(false);
  });
});

describe('canReadIntention — the network door', () => {
  it('reads through a followed network with a living member within reach, and names the ring', () => {
    const g = world();
    const id = ring(g, 'ind_patron', ['ind_ringer']);
    const read = canReadIntention(state(g, { followedAgentIds: ['ind_patron'] }), GOD, 'ind_stranger');
    expect(read).toEqual({ readable: true, through: 'network', via: id, viaName: "Hesk's Hold", secret: false });
  });

  it('not when the nearest member is one hex beyond the reach', () => {
    const g = world();
    ring(g, 'ind_patron', []); // the patron alone, at loc_far — one hex past the reach
    expect(canReadIntention(state(g, { followedAgentIds: ['ind_patron'] }), GOD, 'ind_stranger').readable).toBe(false);
  });

  it('not when the leader is unfollowed, even with a member in reach', () => {
    const g = world();
    ring(g, 'ind_patron', ['ind_ringer']);
    expect(canReadIntention(state(g), GOD, 'ind_stranger').readable).toBe(false);
  });

  it('a disbanded ring watches nobody', () => {
    const g = world();
    const id = ring(g, 'ind_patron', ['ind_ringer']);
    g.getNode(id)!.properties.groupStatus = 'disbanded';
    expect(canReadIntention(state(g, { followedAgentIds: ['ind_patron'] }), GOD, 'ind_stranger').readable).toBe(false);
  });

  it('the reach is the ring\'s own reach — one constant, by construction', () => {
    expect(NETWORK_READ_REACH_HEXES).toBe(RING_REACH_HEXES);
  });
});

describe('canReadIntention — a secret intention', () => {
  it('the plot is unreadable at transparent familiarity and readable through a mark', () => {
    const g = world();
    const strategicState = { projects: [plot('ind_stranger')], controls: [], history: [] };
    const closed = canReadIntention(state(g, { strategicState }), GOD, 'ind_stranger', { knowledgeLevel: 'transparent' });
    expect(closed).toEqual({ readable: false, secret: true });

    mark(g, 'ind_spider', 'ind_stranger');
    const open = canReadIntention(state(g, { strategicState, followedAgentIds: ['ind_spider'] }), GOD, 'ind_stranger', { knowledgeLevel: 'transparent' });
    expect(open).toMatchObject({ readable: true, through: 'mark', secret: true });
  });

  it('a finished plot is no longer a secret; an override of the plot cell still is', () => {
    const g = world();
    const done = { ...plot('ind_stranger'), status: 'completed' } as StrategicProjectRuntime;
    expect(secretIntentionOf(state(g, { strategicState: { projects: [done], controls: [], history: [] } }), 'ind_stranger')).toBeNull();
    expect(secretIntentionOf(state(g, { strategicState: { projects: [plot('ind_stranger', 'cell.destroy.mortal.quiet_knife')], controls: [], history: [] } }), 'ind_stranger')).toBe('cell.destroy.mortal.quiet_knife');
    expect(isSecretCellId('cell.destroy.mortality')).toBe(false);
  });

  it('every secret cell is a live cell', () => {
    for (const id of SECRET_CELL_IDS) expect(getCellTemplate(id), id).toBeDefined();
  });
});

describe('readIntentionFromCard', () => {
  it('prefers the stamped live answer, and falls back to the card\'s own tier', () => {
    expect(readIntentionFromCard({ knowledgeLevel: 'stranger', intentionRead: { readable: true, through: 'mark', via: 'x', secret: false } }).readable).toBe(true);
    expect(readIntentionFromCard({ knowledgeLevel: 'transparent', intentionRead: { readable: false, secret: true } }).readable).toBe(false);
    expect(readIntentionFromCard({ knowledgeLevel: INTENTION_KNOWLEDGE_TIER })).toEqual({ readable: true, through: 'familiarity', secret: false });
    expect(readIntentionFromCard({ knowledgeLevel: 'stranger' }).readable).toBe(false);
  });

  it('the how-sentence carries no numeral and no tier word', () => {
    for (const read of [
      { readable: true, through: 'familiarity', secret: false },
      { readable: true, through: 'mark', via: 'a', viaName: 'Vessa', secret: false },
      { readable: true, through: 'network', via: 'g', viaName: "Hesk's Hold", secret: false },
    ] as const) {
      const how = describeIntentionRead(read, 'Old Maerin');
      expect(how.length).toBeGreaterThan(0);
      expect(how).not.toMatch(/\d|recognised|intimate|transparent|stranger/);
    }
    expect(describeIntentionRead({ readable: false, secret: false }, 'Old Maerin')).toBe('');
  });
});
