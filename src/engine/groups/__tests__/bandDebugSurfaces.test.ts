/**
 * Band debug + player surfaces (THR-731 PR 4).
 *
 * Two surfaces, one shared reason to exist: a band is hard to *observe*. Organic
 * spawns need a colocated, unbanded cluster above the reserve, which on most seeds
 * is rare enough that waiting for one is not a test — so `spawn band` forces the
 * spawn while keeping every structural precondition, and the Rivals line is how the
 * grudge those bands write reaches a player who never opens a trace viewer.
 *
 * The `raider` role has no organic producer at all until THR-767 gives monster
 * factions a population, so the forced path is currently the *only* way a raider
 * band exists — which is exactly why its role parameter is asserted here.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../graph';
import type { GameState } from '../../../types/gameState';
import { spawnDebugBand } from '../../debugWorldSpawnTools';
import { parseDebugCommand } from '../../debugCommands';
import { isBandNode, getGroupMembers, getAllGroups } from '../groupQueries';
import { getAgentInfoCard } from '../../agentDetail';
import {
  BAND_SIZE_MIN,
  BAND_FACTION_MEMBER_RESERVE,
  MAX_ACTIVE_BANDS_PER_FACTION,
} from '../../../data/group-constants';

function makeState(graph: WorldGraph, tick = 24): GameState {
  return { graph, tick, seed: 42, tickEvents: [] } as unknown as GameState;
}

/** A faction with `memberCount` colocated individual members. */
function seedFaction(
  graph: WorldGraph,
  factionId: string,
  memberCount: number,
  opts: { name?: string; factionDefId?: string; isMonsterFaction?: boolean; locationId?: string } = {},
): void {
  const locId = opts.locationId ?? 'loc.hall';
  if (!graph.getNode(locId)) {
    graph.addNode({
      id: locId,
      type: 'location',
      name: 'The Hall',
      properties: { locationType: 'settlement', hexCol: 3, hexRow: 3 },
    });
  }
  graph.addNode({
    id: factionId,
    type: 'actor',
    name: opts.name ?? `Guild ${factionId}`,
    properties: {
      actorType: 'faction',
      factionType: 'guild',
      ...(opts.factionDefId ? { factionDefId: opts.factionDefId } : {}),
      ...(opts.isMonsterFaction ? { isMonsterFaction: true } : {}),
    },
  });
  for (let i = 0; i < memberCount; i++) {
    const id = `${factionId}.m${i}`;
    graph.addNode({ id, type: 'actor', name: `Member ${i}`, properties: { actorType: 'individual' } });
    graph.addEdge({ id: `at.${id}`, source: id, target: locId, type: 'located_at', properties: {} });
    graph.addEdge({
      id: `mem.${id}`, source: id, target: factionId, type: 'member_of',
      properties: { role: 'member', rank: 0, joinedTick: 0 },
    });
  }
}

describe('spawn band — command parsing', () => {
  it('parses a bare faction query', () => {
    expect(parseDebugCommand('spawn band "The Arcane Circle"')).toEqual({
      kind: 'spawn-band',
      factionQuery: 'The Arcane Circle',
      role: undefined,
    });
  });

  it('parses an explicit role', () => {
    expect(parseDebugCommand('spawn band faction_def_arcane_circle --role raider')).toEqual({
      kind: 'spawn-band',
      factionQuery: 'faction_def_arcane_circle',
      role: 'raider',
    });
  });

  it('rejects a role outside the BandRole union', () => {
    // Not merely unknown-flag handling: an accepted-but-meaningless role would
    // silently mint a band nothing keys on.
    expect(parseDebugCommand('spawn band f.knives --role bandit')).toEqual({
      error: 'role must be raider or defender.',
    });
  });

  it('rejects an unknown flag rather than ignoring it', () => {
    expect(parseDebugCommand('spawn band f.knives --hex 3 3')).toEqual({
      error: "Unknown flag '--hex'.",
    });
  });

  it('requires a faction', () => {
    expect(parseDebugCommand('spawn band')).toEqual({
      error: 'Usage: spawn band <faction|factionDefId> [--role <raider|defender>]',
    });
  });
});

describe('spawnDebugBand', () => {
  it('fields a band, skipping the interval gate that governs the organic sweep', () => {
    const graph = new WorldGraph();
    seedFaction(graph, 'f.knives', BAND_SIZE_MIN + BAND_FACTION_MEMBER_RESERVE);
    // Tick 7 is not a multiple of BAND_SPAWN_INTERVAL, so the sweep would decline.
    const state = makeState(graph, 7);

    const result = spawnDebugBand(state, 'f.knives');

    expect(result.success).toBe(true);
    expect(result.kind).toBe('band');
    const band = graph.getNode(result.nodeId!)!;
    expect(isBandNode(band)).toBe(true);
    expect(getGroupMembers(graph, band.id).length).toBeGreaterThanOrEqual(BAND_SIZE_MIN);
  });

  it('honours the requested role — the only way a raider band exists before THR-767', () => {
    const graph = new WorldGraph();
    seedFaction(graph, 'f.lair', BAND_SIZE_MIN + BAND_FACTION_MEMBER_RESERVE);
    const state = makeState(graph);

    const result = spawnDebugBand(state, 'f.lair', { role: 'raider' });

    expect(result.success).toBe(true);
    expect(graph.getNode(result.nodeId!)!.properties.bandRole).toBe('raider');
  });

  it('defaults to defender', () => {
    const graph = new WorldGraph();
    seedFaction(graph, 'f.temple', BAND_SIZE_MIN + BAND_FACTION_MEMBER_RESERVE);
    const state = makeState(graph);

    const result = spawnDebugBand(state, 'f.temple');

    expect(graph.getNode(result.nodeId!)!.properties.bandRole).toBe('defender');
  });

  it('resolves a faction by name and by factionDefId, not just node id', () => {
    const graph = new WorldGraph();
    seedFaction(graph, 'guild_7', BAND_SIZE_MIN + BAND_FACTION_MEMBER_RESERVE, {
      name: 'The Arcane Circle',
      factionDefId: 'faction_def_arcane_circle',
    });

    expect(spawnDebugBand(makeState(new WorldGraph()), 'guild_7').success).toBe(false);
    expect(spawnDebugBand(makeState(graph), 'The Arcane Circle').success).toBe(true);

    const graph2 = new WorldGraph();
    seedFaction(graph2, 'guild_7', BAND_SIZE_MIN + BAND_FACTION_MEMBER_RESERVE, {
      name: 'The Arcane Circle',
      factionDefId: 'faction_def_arcane_circle',
    });
    expect(spawnDebugBand(makeState(graph2), 'faction_def_arcane_circle').success).toBe(true);
  });

  it('keeps the reserve floor a forced spawn cannot cross', () => {
    const graph = new WorldGraph();
    // One short of the floor: forcing must not conjure the missing member.
    seedFaction(graph, 'f.thin', BAND_SIZE_MIN + BAND_FACTION_MEMBER_RESERVE - 1);
    const state = makeState(graph);

    const result = spawnDebugBand(state, 'f.thin');

    expect(result.success).toBe(false);
    expect(result.message).toContain('cannot field a band');
    // No company node was minted. There is no `type: 'group'` — a company is
    // `type: 'actor'` + `actorType: 'group'`, which `getAllGroups` encapsulates.
    expect(getAllGroups(graph).length).toBe(0);
  });

  it('keeps the per-faction active-band cap', () => {
    const graph = new WorldGraph();
    // Enough members for many bands; the cap, not the roster, is what stops it.
    seedFaction(graph, 'f.big', (BAND_SIZE_MIN + BAND_FACTION_MEMBER_RESERVE) * (MAX_ACTIVE_BANDS_PER_FACTION + 2));
    const state = makeState(graph);

    let fielded = 0;
    for (let i = 0; i < MAX_ACTIVE_BANDS_PER_FACTION + 2; i++) {
      if (spawnDebugBand(state, 'f.big').success) fielded++;
    }

    expect(fielded).toBe(MAX_ACTIVE_BANDS_PER_FACTION);
  });

  it('refuses a monster faction with the reason, not a bare failure', () => {
    const graph = new WorldGraph();
    seedFaction(graph, 'f.lair', BAND_SIZE_MIN + BAND_FACTION_MEMBER_RESERVE, { isMonsterFaction: true });

    const result = spawnDebugBand(makeState(graph), 'f.lair');

    expect(result.success).toBe(false);
    expect(result.message).toContain('THR-767');
  });

  it('names the missing faction rather than failing silently', () => {
    const result = spawnDebugBand(makeState(new WorldGraph()), 'nobody');
    expect(result.success).toBe(false);
    expect(result.message).toContain("No faction matching 'nobody'");
  });

  it('is deterministic for the same seed, tick, and faction', () => {
    const run = () => {
      const graph = new WorldGraph();
      seedFaction(graph, 'f.knives', BAND_SIZE_MIN + BAND_FACTION_MEMBER_RESERVE + 3);
      const result = spawnDebugBand(makeState(graph), 'f.knives');
      return getGroupMembers(graph, result.nodeId!).map(m => m.id).join(',');
    };
    expect(run()).toBe(run());
  });
});

describe('Company panel — Rivals (THR-731)', () => {
  /**
   * A minimal world with one threaded agent in a company, plus a rival group. Only
   * the pieces `getAgentInfoCard` needs to populate `card.company` are seeded.
   */
  function seedCompanyWorld(): { graph: WorldGraph; agentId: string; groupId: string } {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'loc.hall', type: 'location', name: 'The Hall',
      properties: { locationType: 'settlement', hexCol: 3, hexRow: 3 },
    });
    graph.addNode({ id: 'ascendant', type: 'actor', name: 'The Ascendant', properties: { actorType: 'ascendant' } });

    for (const [id, name] of [['a.hero', 'Kael'], ['a.friend', 'Sorcha']] as const) {
      graph.addNode({
        id, type: 'actor', name,
        // `getAgentInfoCard` resolves through `getAgentDetail`, which needs a
        // profile + capabilities to return a card at all.
        properties: {
          actorType: 'individual',
          axiologicalProfile: {
            loyalty_ambition: 0, courage_prudence: 0, mercy_ruthlessness: 0,
            honesty_cunning: 0, sacrifice_survival: 0, tradition_novelty: 0,
            preservation_transformation: 0, asceticism_extravagance: 0,
          },
          domainCapabilities: { iron: 10, gold: 10, shadow: 10, veil: 10, heart: 10, eye: 10, stone: 10, star: 10 },
          locationId: 'loc.hall',
        },
      });
      graph.addEdge({ id: `at.${id}`, source: id, target: 'loc.hall', type: 'located_at', properties: {} });
      graph.addEdge({ id: `thread.${id}`, source: 'ascendant', target: id, type: 'thread', properties: { tier: 2 } });
    }

    // A company is `type: 'actor'` + `actorType: 'group'` — see `isCompanyNode`.
    // There is no `type: 'group'` node in this schema.
    graph.addNode({
      id: 'g.company', type: 'actor', name: 'Company of the Inn',
      properties: { actorType: 'group', groupType: 'party', groupStatus: 'active', cohesion: 0.7, formedAtTick: 1 },
    });
    for (const [id, role] of [['a.hero', 'leader'], ['a.friend', 'member']] as const) {
      graph.addEdge({
        id: `gm.${id}`, source: id, target: 'g.company', type: 'member_of',
        properties: { role, rank: 0, joinedTick: 1 },
      });
    }

    return { graph, agentId: 'a.hero', groupId: 'g.company' };
  }

  function addRivalGroup(graph: WorldGraph, id: string, name: string): void {
    graph.addNode({
      id, type: 'actor', name,
      properties: {
        actorType: 'group', groupType: 'faction_band', groupStatus: 'active',
        cohesion: 0.7, bandRole: 'defender',
      },
    });
  }

  it('carries no rivals field when the company has never fought anyone', () => {
    const { graph, agentId } = seedCompanyWorld();
    const card = getAgentInfoCard(graph, agentId, 'ascendant', 'known');
    expect(card!.company).toBeDefined();
    expect(card!.company!.rivals).toBeUndefined();
  });

  it('names a rival the company holds an outgoing grudge against', () => {
    const { graph, agentId, groupId } = seedCompanyWorld();
    addRivalGroup(graph, 'g.knives', 'The Ashen Knives');
    graph.addEdge({
      id: 'e_hostile_to_a', source: groupId, target: 'g.knives', type: 'hostile_to',
      properties: { since: 81, cause: 'group_engagement' },
    });

    const card = getAgentInfoCard(graph, agentId, 'ascendant', 'known');
    expect(card!.company!.rivals).toEqual(['The Ashen Knives']);
  });

  it('reads an incoming-only grudge too — blood is blood whichever side wrote it', () => {
    const { graph, agentId, groupId } = seedCompanyWorld();
    addRivalGroup(graph, 'g.sparrows', 'The Sparrows');
    graph.addEdge({
      id: 'e_hostile_to_b', source: 'g.sparrows', target: groupId, type: 'hostile_to',
      properties: { since: 84, cause: 'group_engagement' },
    });

    const card = getAgentInfoCard(graph, agentId, 'ascendant', 'known');
    expect(card!.company!.rivals).toEqual(['The Sparrows']);
  });

  it('dedupes the mutual pair the grudge writer actually writes', () => {
    const { graph, agentId, groupId } = seedCompanyWorld();
    addRivalGroup(graph, 'g.sparrows', 'The Sparrows');
    graph.addEdge({
      id: 'e_hostile_to_out', source: groupId, target: 'g.sparrows', type: 'hostile_to',
      properties: { since: 84, cause: 'group_engagement' },
    });
    graph.addEdge({
      id: 'e_hostile_to_in', source: 'g.sparrows', target: groupId, type: 'hostile_to',
      properties: { since: 84, cause: 'group_engagement' },
    });

    const card = getAgentInfoCard(graph, agentId, 'ascendant', 'known');
    expect(card!.company!.rivals).toEqual(['The Sparrows']);
  });

  it('drops a grudge whose target node is gone rather than rendering a blank name', () => {
    const { graph, agentId, groupId } = seedCompanyWorld();
    addRivalGroup(graph, 'g.vanished', 'The Doomed');
    graph.addEdge({
      id: 'e_hostile_to_ghost', source: groupId, target: 'g.vanished', type: 'hostile_to',
      properties: { since: 12, cause: 'group_engagement' },
    });
    // `addEdge` validates that the target exists, so a dangling grudge can only
    // arise the way it would in a real run: the rival's node leaves the graph after
    // the edge is written. If `removeNode` cascades the edge away, the name filter
    // is belt-and-braces — this test then proves the *outcome* (no blank rival)
    // either way, which is what the panel cares about.
    graph.removeNode('g.vanished');

    const card = getAgentInfoCard(graph, agentId, 'ascendant', 'known');
    expect(card!.company!.rivals).toBeUndefined();
  });

  it('orders multiple rivals deterministically', () => {
    const { graph, agentId, groupId } = seedCompanyWorld();
    addRivalGroup(graph, 'g.zeta', 'The Zeta Band');
    addRivalGroup(graph, 'g.alpha', 'The Alpha Band');
    for (const target of ['g.zeta', 'g.alpha']) {
      graph.addEdge({
        id: `e_hostile_to_${target}`, source: groupId, target, type: 'hostile_to',
        properties: { since: 90, cause: 'group_engagement' },
      });
    }

    const card = getAgentInfoCard(graph, agentId, 'ascendant', 'known');
    // Sorted by node id: g.alpha before g.zeta.
    expect(card!.company!.rivals).toEqual(['The Alpha Band', 'The Zeta Band']);
  });
});
