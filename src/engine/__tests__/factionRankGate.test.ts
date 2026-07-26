/**
 * THR-805 — guild rank gating for the senior/elite tail of guild content.
 *
 * Two layers under test:
 *   1. `meetsFactionRankRequirement` — the rank predicate, including its fail-open
 *      contract on unresolvable data.
 *   2. `filterByPrerequisites` — that the gate is actually *wired* into the draw path,
 *      closed for a low-rank member and open for a high-rank one, with the `standard`
 *      quest/social tier left ungated.
 *
 * Anchored on shipped definitions (`FACTION_ENCOUNTER_META`, `FACTION_DEFINITIONS`)
 * rather than invented fixtures, so authoring drift in either surfaces here.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { meetsFactionRankRequirement } from '../factionReputation';
import { filterByPrerequisites } from '../encounterFilterPipeline';
import { FACTION_ENCOUNTER_META } from '../../data/faction-encounter-content';
import { FACTION_DEFINITIONS } from '../../data/faction-definitions';
import { CACHE_REGISTERED_REGIONAL_TEMPLATE_IDS } from '../../data/unified-action-templates';
import type { EncounterCacheEntry } from '../encounterCache';

// ─── Fixtures ──────────────────────────────────────────────────────────────

const RANGERS = 'rangers_brotherhood';
const RANGERS_NODE = 'faction_node_rangers';

function makeGraph(): WorldGraph {
  return new WorldGraph();
}

function addAgent(graph: WorldGraph, id: string): void {
  graph.addNode({
    id,
    type: 'actor',
    name: `Agent ${id}`,
    properties: { actorType: 'individual' },
  });
}

function addFaction(graph: WorldGraph, nodeId: string, factionDefId: string): void {
  graph.addNode({
    id: nodeId,
    type: 'actor',
    name: `Faction ${factionDefId}`,
    properties: { actorType: 'faction', factionType: 'guild', factionDefId },
  });
}

function join(
  graph: WorldGraph,
  agentId: string,
  factionNodeId: string,
  factionDefId: string,
  reputation: number,
): void {
  graph.addEdge({
    id: `member_${agentId}_${factionNodeId}`,
    source: agentId,
    target: factionNodeId,
    type: 'member_of',
    properties: { role: 'x', rank: 0, joinedTick: 0, reputation, factionDefId },
  });
}

function entry(templateId: string): EncounterCacheEntry {
  return {
    templateId,
    locationId: 'loc1',
    sublocationId: null,
    sublocationTypeId: null,
    reachPrimary: 'iron',
    reachSecondary: 'stone',
    threatRating: 'moderate',
    encounterType: 'combat',
    motivations: [],
    requiresPresence: true,
    remotePenalty: 0,
    questPriority: 0,
  } as unknown as EncounterCacheEntry;
}

/** Reputation floor of the tier a template's authored `minRank` names. */
function requiredReputationFor(templateId: string): number {
  const meta = FACTION_ENCOUNTER_META.get(templateId);
  if (!meta) throw new Error(`no meta for ${templateId}`);
  const def = FACTION_DEFINITIONS.get(meta.factionDefId);
  const tier = def?.rankTiers.find(t => t.id === meta.minRank);
  if (!tier) throw new Error(`minRank '${meta.minRank}' resolves to no tier`);
  return tier.minReputation;
}

// ─── The predicate ─────────────────────────────────────────────────────────

describe('meetsFactionRankRequirement', () => {
  it('opens for a member at the required tier', () => {
    const g = makeGraph();
    addAgent(g, 'a1');
    addFaction(g, RANGERS_NODE, RANGERS);
    join(g, 'a1', RANGERS_NODE, RANGERS, 0.6);
    expect(meetsFactionRankRequirement(g, 'a1', RANGERS, 'ranger_captain')).toBe(true);
  });

  it('closes for a member below the required tier', () => {
    const g = makeGraph();
    addAgent(g, 'a1');
    addFaction(g, RANGERS_NODE, RANGERS);
    join(g, 'a1', RANGERS_NODE, RANGERS, 0.59);
    expect(meetsFactionRankRequirement(g, 'a1', RANGERS, 'ranger_captain')).toBe(false);
  });

  it('closes for a non-member — the gate is about standing in THAT faction', () => {
    const g = makeGraph();
    addAgent(g, 'a1');
    addFaction(g, RANGERS_NODE, RANGERS);
    expect(meetsFactionRankRequirement(g, 'a1', RANGERS, 'ranger_captain')).toBe(false);
  });

  it('closes when the agent is high-ranked in a DIFFERENT faction', () => {
    const g = makeGraph();
    addAgent(g, 'a1');
    addFaction(g, RANGERS_NODE, RANGERS);
    addFaction(g, 'faction_node_temple', 'temple_of_spheres');
    join(g, 'a1', 'faction_node_temple', 'temple_of_spheres', 1.0);
    expect(meetsFactionRankRequirement(g, 'a1', RANGERS, 'ranger_captain')).toBe(false);
  });

  it('treats a missing reputation property as 0 (pre-faction member_of edges)', () => {
    const g = makeGraph();
    addAgent(g, 'a1');
    addFaction(g, RANGERS_NODE, RANGERS);
    g.addEdge({
      id: 'member_legacy',
      source: 'a1',
      target: RANGERS_NODE,
      type: 'member_of',
      properties: { role: 'x', rank: 0, joinedTick: 0, factionDefId: RANGERS },
    });
    expect(meetsFactionRankRequirement(g, 'a1', RANGERS, 'ranger_captain')).toBe(false);
    // ...but the entry tier (minReputation 0) still admits them.
    expect(meetsFactionRankRequirement(g, 'a1', RANGERS, 'scout')).toBe(true);
  });

  it('fails OPEN on an unknown factionDefId rather than orphaning content', () => {
    const g = makeGraph();
    addAgent(g, 'a1');
    expect(meetsFactionRankRequirement(g, 'a1', 'no_such_faction', 'ranger_captain')).toBe(true);
  });

  it('fails OPEN when minRank names no tier in that definition', () => {
    const g = makeGraph();
    addAgent(g, 'a1');
    addFaction(g, RANGERS_NODE, RANGERS);
    join(g, 'a1', RANGERS_NODE, RANGERS, 0);
    expect(meetsFactionRankRequirement(g, 'a1', RANGERS, 'grand_poobah')).toBe(true);
  });
});

// ─── Authored-data invariants ──────────────────────────────────────────────

describe('THR-805 authored rank data', () => {
  it('every rank-gated meta resolves its minRank to a real tier (no fail-open in practice)', () => {
    const unresolved: string[] = [];
    for (const [templateId, meta] of FACTION_ENCOUNTER_META) {
      if (meta.questType === 'standard') continue;
      const def = FACTION_DEFINITIONS.get(meta.factionDefId);
      if (!def || !def.rankTiers.some(t => t.id === meta.minRank)) {
        unresolved.push(`${templateId} (${meta.factionDefId}/${meta.minRank})`);
      }
    }
    expect(unresolved).toEqual([]);
  });

  it('the 12 wired guild senior/elite templates are all rank-gated', () => {
    const guildIds = CACHE_REGISTERED_REGIONAL_TEMPLATE_IDS
      .filter(id => FACTION_ENCOUNTER_META.has(id));
    // Pin the membership itself, not a count — a template dropping out of the meta
    // map would otherwise silently shrink this set and still pass.
    expect(guildIds.slice().sort()).toEqual([
      'bf.elite.engineer_wonder',
      'bf.elite.grand_monument',
      'mct.elite.market_domination',
      'mct.elite.trade_summit',
      'mct.senior.foreign_deal',
      'rb.elite.frontier_defense',
      'rb.elite.monster_hunt',
      'rb.senior.ambush_raiders',
      'rb.senior.deep_scout',
      'rb.senior.map_unknown',
      'ts.elite.found_cathedral',
      'ts.elite.sphere_convergence',
    ]);
    for (const id of guildIds) {
      expect(FACTION_ENCOUNTER_META.get(id)!.questType).not.toBe('standard');
      expect(requiredReputationFor(id)).toBeGreaterThan(0);
    }
  });

  it('the 5 non-guild regional templates carry no meta, so the gate never touches them', () => {
    const ungated = CACHE_REGISTERED_REGIONAL_TEMPLATE_IDS
      .filter(id => !FACTION_ENCOUNTER_META.has(id));
    expect(ungated.slice().sort()).toEqual([
      'fa.alliance_ceremony',
      'fa.bounty_hunt',
      'fa.conclave_debate',
      'monster.encounter.horde_raid',
      'monster.encounter.lair_defense',
    ]);
  });
});

// ─── The wiring (both directions through the real pipeline) ────────────────

describe('filterByPrerequisites — faction rank gate', () => {
  const SENIOR = 'rb.senior.deep_scout';

  it('closes a senior template for a low-rank member', () => {
    const g = makeGraph();
    addAgent(g, 'a1');
    addFaction(g, RANGERS_NODE, RANGERS);
    join(g, 'a1', RANGERS_NODE, RANGERS, 0.1);
    const out = filterByPrerequisites([entry(SENIOR)], 'a1', g);
    expect(out.map(e => e.templateId)).toEqual([]);
  });

  it('opens the same template once the member reaches the tier', () => {
    const g = makeGraph();
    addAgent(g, 'a1');
    addFaction(g, RANGERS_NODE, RANGERS);
    join(g, 'a1', RANGERS_NODE, RANGERS, requiredReputationFor(SENIOR));
    const out = filterByPrerequisites([entry(SENIOR)], 'a1', g);
    expect(out.map(e => e.templateId)).toEqual([SENIOR]);
  });

  it('closes a senior template for a non-member', () => {
    const g = makeGraph();
    addAgent(g, 'a1');
    addFaction(g, RANGERS_NODE, RANGERS);
    const out = filterByPrerequisites([entry(SENIOR)], 'a1', g);
    expect(out.map(e => e.templateId)).toEqual([]);
  });

  it('leaves the standard quest/social tier ungated for a non-member', () => {
    const standardIds = [...FACTION_ENCOUNTER_META.entries()]
      .filter(([, m]) => m.questType === 'standard')
      .map(([id]) => id)
      .slice(0, 12);
    expect(standardIds.length).toBeGreaterThan(0);

    const g = makeGraph();
    addAgent(g, 'a1');
    const out = filterByPrerequisites(standardIds.map(entry), 'a1', g);
    // Whatever else Stage 3 gates on, rank must not be the reason any of these drop.
    expect(out.length).toBe(standardIds.length);
  });
});
