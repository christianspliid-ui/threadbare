/**
 * THR-1640 — spotlight mortals who join guilds.
 *
 * Pins the three fixes of plan 2026-09-27-thr-1633-written-encounters-land § S3:
 * a join is offered at every hall at a Location (not only the first); a join carries
 * the mortal's guild fit into its reward; and a join that resolves in a success band
 * on the live unified-action path writes the `member_of` edge. Plus the funnel the
 * debug bridge reads.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { generateFactionLifecycleCandidates, computeGuildFit } from '../factionQuestGeneration';
import { processResolvedFactionLifecycleAction } from '../factionOutcome';
import { computeGuildFitBonus } from '../encounterScoring';
import { computeGuildJoinFunnel, isCoverageGuild } from '../guildJoinFunnel';
import { enableTracing, disableTracing, clearTraces, getTraces } from '../traceBuffer';
import { getFactionMembershipEdges } from '../graphQueries';
import { getFactionDefinition } from '../../data/faction-definition-lookup';
import {
  FACTION_JOIN_FIT_BONUS,
  FACTION_LIFECYCLE_SUCCESS_BANDS,
  GUILD_SPOTLIGHT_COVERAGE_MIN,
} from '../../data/faction-constants';
import type { MemberOfEdgeProperties } from '../../types/disposition';

const AG = 'adventuring_guild';
const LK = 'lorekeepers_covenant';

function addFaction(graph: WorldGraph, defId: string): string {
  const id = `faction_def_${defId}`;
  graph.addNode({ id, type: 'actor', name: `The ${defId}`, properties: { actorType: 'faction', factionType: 'guild', factionDefId: defId } });
  return id;
}

function addHall(graph: WorldGraph, locationId: string, hallId: string, defId: string): void {
  graph.addNode({
    id: hallId,
    type: 'location',
    name: `Hall ${hallId}`,
    properties: { parentLocationId: locationId, sublocationTypeId: 'sublocation-type.faction-hall', factionDefId: defId },
  });
  graph.addEdge({ id: `contains_${locationId}_${hallId}`, source: locationId, target: hallId, type: 'contains', properties: {} });
}

function makeWorld(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'town', type: 'location', name: 'Town', properties: { locationSubtype: 'town' } });
  graph.addNode({ id: 'mortal', type: 'actor', name: 'Aurin', properties: { actorType: 'individual', spotlightTier: 'spotlight' } });
  addFaction(graph, AG);
  addFaction(graph, LK);
  addHall(graph, 'town', 'hall_ag', AG);
  addHall(graph, 'town', 'hall_lk', LK);
  return graph;
}

function joinTemplateOf(defId: string): string {
  return getFactionDefinition(defId)!.joinEncounterTemplateId;
}

describe('THR-1640 — a join at every hall', () => {
  it('offers one join per hall, each keyed to its own hall', () => {
    const graph = makeWorld();
    const joins = generateFactionLifecycleCandidates(graph, 'mortal', 'town');
    const byTemplate = new Map(joins.map(e => [e.templateId, e]));
    expect(byTemplate.get(joinTemplateOf(AG))?.sublocationId).toBe('hall_ag');
    expect(byTemplate.get(joinTemplateOf(LK))?.sublocationId).toBe('hall_lk');
  });

  it('still offers the second hall when the mortal already belongs to the first', () => {
    const graph = makeWorld();
    graph.addEdge({
      id: 'member_mortal_ag', source: 'mortal', target: `faction_def_${AG}`, type: 'member_of',
      properties: { role: 'initiate', rank: 0, joinedTick: 0, reputation: 0.05, factionDefId: AG },
    });
    const ids = generateFactionLifecycleCandidates(graph, 'mortal', 'town').map(e => e.templateId);
    expect(ids).not.toContain(joinTemplateOf(AG));
    expect(ids).toContain(joinTemplateOf(LK));
  });

  it('offers a guild with two halls at the Location once', () => {
    const graph = makeWorld();
    addHall(graph, 'town', 'hall_ag_2', AG);
    const ids = generateFactionLifecycleCandidates(graph, 'mortal', 'town').map(e => e.templateId);
    expect(ids.filter(id => id === joinTemplateOf(AG))).toHaveLength(1);
  });
});

describe('THR-1640 — guild fit rides the join reward', () => {
  it('writes a 0–1 fit on every join entry', () => {
    const graph = makeWorld();
    for (const entry of generateFactionLifecycleCandidates(graph, 'mortal', 'town')) {
      expect(entry.guildFit).toBeGreaterThanOrEqual(0);
      expect(entry.guildFit).toBeLessThanOrEqual(1);
    }
  });

  it('reads 0 fit for a mortal with no capability, never a throw', () => {
    const graph = makeWorld();
    expect(computeGuildFit(graph, 'mortal', getFactionDefinition(AG)!)).toBe(0);
    expect(computeGuildFit(graph, 'nobody', getFactionDefinition(AG)!)).toBe(0);
  });

  it('scales the reward term by FACTION_JOIN_FIT_BONUS and is 0 off a join entry', () => {
    expect(computeGuildFitBonus({ guildFit: 0.5 })).toBeCloseTo(FACTION_JOIN_FIT_BONUS * 0.5);
    expect(computeGuildFitBonus({ guildFit: 2 })).toBeCloseTo(FACTION_JOIN_FIT_BONUS);
    expect(computeGuildFitBonus({ guildFit: Number.NaN })).toBe(0);
    expect(computeGuildFitBonus({})).toBe(0);
  });
});

describe('THR-1640 — a resolved join becomes a membership on the live path', () => {
  beforeEach(() => { clearTraces(); enableTracing(); });

  it('writes member_of and emits a joined trace for every success-family band', () => {
    for (const band of FACTION_LIFECYCLE_SUCCESS_BANDS) {
      clearTraces();
      const graph = makeWorld();
      const events = processResolvedFactionLifecycleAction(graph, { actorId: 'mortal', templateId: joinTemplateOf(AG), outcome: band }, 40, () => 0.5);
      const edge = getFactionMembershipEdges(graph, 'mortal')
        .find(e => (e.properties as Partial<MemberOfEdgeProperties>).factionDefId === AG);
      expect(edge, band).toBeDefined();
      expect((edge!.properties as unknown as MemberOfEdgeProperties).joinedTick).toBe(40);
      expect(events.some(e => e.type === 'faction_member_joined')).toBe(true);
      const trace = getTraces().find(t => t.category === 'guild_join_resolved') as unknown as Record<string, unknown>;
      expect(trace).toMatchObject({ joined: true, landed: true, reason: 'joined', factionDefId: AG, outcome: band });
    }
  });

  it('writes nothing on a near miss or failure, and says why', () => {
    for (const band of ['near_miss', 'failure', 'critical_failure']) {
      clearTraces();
      const graph = makeWorld();
      const events = processResolvedFactionLifecycleAction(graph, { actorId: 'mortal', templateId: joinTemplateOf(AG), outcome: band }, 40, () => 0.5);
      expect(events).toEqual([]);
      expect(getFactionMembershipEdges(graph, 'mortal')).toHaveLength(0);
      expect(getTraces().find(t => t.category === 'guild_join_resolved')).toMatchObject({ joined: false, landed: false, reason: 'band_not_landed' });
    }
  });

  it('reports no_faction_node when the guild has no node in this world', () => {
    const graph = makeWorld();
    graph.removeNode(`faction_def_${LK}`);
    processResolvedFactionLifecycleAction(graph, { actorId: 'mortal', templateId: joinTemplateOf(LK), outcome: 'success' }, 40, () => 0.5);
    expect(getTraces().find(t => t.category === 'guild_join_resolved')).toMatchObject({ joined: false, reason: 'no_faction_node' });
  });

  it('ignores a template that is not a lifecycle template, with no trace', () => {
    const graph = makeWorld();
    expect(processResolvedFactionLifecycleAction(graph, { actorId: 'mortal', templateId: 'encounter.deep_descent', outcome: 'success' }, 40, () => 0.5)).toEqual([]);
    expect(getTraces().filter(t => t.category === 'guild_join_resolved')).toHaveLength(0);
  });

  it('is silent when tracing is off but still writes the membership', () => {
    disableTracing();
    const graph = makeWorld();
    processResolvedFactionLifecycleAction(graph, { actorId: 'mortal', templateId: joinTemplateOf(AG), outcome: 'success' }, 40, () => 0.5);
    expect(getFactionMembershipEdges(graph, 'mortal')).toHaveLength(1);
    enableTracing();
  });
});

describe('THR-1640 — the guild-join funnel', () => {
  beforeEach(() => { clearTraces(); enableTracing(); });

  it('counts reached / chosen from engagement decisions and resolutions by band', () => {
    const graph = makeWorld();
    processResolvedFactionLifecycleAction(graph, { actorId: 'mortal', templateId: joinTemplateOf(AG), outcome: 'success' }, 40, () => 0.5);
    processResolvedFactionLifecycleAction(graph, { actorId: 'mortal', templateId: joinTemplateOf(LK), outcome: 'failure' }, 41, () => 0.5);
    const traces = [
      ...getTraces(),
      { category: 'engagement_decision', candidates: [{ id: 'ag.join' }, { id: 'x' }], chosenId: 'ag.join' },
      { category: 'engagement_decision', candidates: [{ id: 'lk.join' }], chosenId: 'x' },
      { category: 'engagement_decision', candidates: [{ id: 'x' }], chosenId: 'x' },
    ] as unknown as Parameters<typeof computeGuildJoinFunnel>[1];
    const funnel = computeGuildJoinFunnel(graph, traces);
    expect(funnel.reached).toBe(2);
    expect(funnel.chosen).toBe(1);
    expect(funnel.joined).toBe(1);
    expect(funnel.resolvedByOutcome).toEqual({ success: 1, failure: 1 });
    expect(funnel.notJoinedByReason).toEqual({ band_not_landed: 1 });
    expect(funnel.coverageMin).toBe(GUILD_SPOTLIGHT_COVERAGE_MIN);
  });

  it('counts coverage only for spotlight members of non-Realm, non-monster guilds', () => {
    expect(isCoverageGuild(AG)).toBe(true);
    expect(isCoverageGuild('realm.culture_0')).toBe(false);
    expect(isCoverageGuild(undefined)).toBe(false);
    expect(isCoverageGuild('no_such_guild')).toBe(false);
  });
});
