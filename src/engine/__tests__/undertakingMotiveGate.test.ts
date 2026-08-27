/**
 * The destroy motive gate at candidate generation — THR-1297 §2, slice 2.
 *
 * `undertakingMotive.ts` holds the rule; this file proves it is *wired into the
 * decision*, which is the claim that fails silently. The wiring arm is the one that
 * matters: every assertion below that a candidate is refused would pass equally well
 * against a gate nobody calls, so each refusal is paired with the same fixture
 * generating the same candidate once the motive exists.
 *
 * The subject is `strategic_raid_supply_lines` — the corpus' only `verb: 'destroy'`
 * template, and before this slice it was offerable against any town, city, camp or
 * fort in range with no quarrel behind it whatsoever. That is not a hypothetical the
 * gate guards against; it is what the shipped world did.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { generateStrategicCandidates } from '../strategicActionCandidates';
import {
  evaluateMotiveGate,
  holdsMotive,
  resolveTargetOwners,
} from '../undertakingMotive';
import { getStrategicTemplate } from '../strategicActionCandidates';
import { mulberry32 } from '../../lib/prng';

const RAID = 'strategic_raid_supply_lines';
const AMBITION = 'ambition_conquer_territory';
const WARLORD = 'actor_warlord';
const TOWN = 'loc_target_town';
const OWNER = 'faction_owner';

/**
 * A warlord at a camp, and exactly one raidable town — owned by a faction they have
 * no quarrel with.
 *
 * One town, deliberately: candidates are capped per template, so a gated target
 * sitting behind an ungated one is never evaluated and the gate reads as passing
 * while never having run.
 */
function world(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: WARLORD, name: 'Warlord Brann', type: 'actor',
    properties: {
      actorType: 'individual', spotlightTier: 'spotlight',
      domainCapabilities: {
        iron: 0.9, shadow: 0.9, eye: 0.9, heart: 0.9,
        gold: 0.9, stone: 0.9, star: 0.9, veil: 0.9,
      },
    },
  });
  graph.addNode({
    id: 'loc_camp', name: 'War Camp', type: 'location',
    properties: { locationSubtype: 'camp', hexCol: 5, hexRow: 5 },
  });
  graph.addNode({
    id: TOWN, name: 'Millbrook', type: 'location',
    properties: { locationSubtype: 'town', hexCol: 6, hexRow: 5 },
  });
  graph.addNode({
    id: OWNER, name: 'The Vale Compact', type: 'actor',
    properties: { actorType: 'faction' },
  });
  graph.addEdge({
    id: 'e_located', source: WARLORD, target: 'loc_camp',
    type: 'located_at', properties: {},
  });
  // Faction territory: the owner controls the town. This is the shape worldSeed writes.
  graph.addEdge({
    id: 'e_controls', source: OWNER, target: TOWN,
    type: 'controls', properties: { influence: 0.7 },
  });
  graph.addNode({
    id: 'ambition_node', name: 'Conquer Territory', type: 'event',
    properties: { templateId: AMBITION },
  });
  graph.addEdge({
    id: 'e_pursues', source: WARLORD, target: 'ambition_node',
    type: 'pursues',
    properties: { status: 'active', priority: 'primary', assignedTick: 1 },
  });
  return graph;
}

function raidCandidates(graph: WorldGraph) {
  const result = generateStrategicCandidates(
    graph, WARLORD, [AMBITION], undefined, 10, mulberry32(42),
  );
  return {
    offered: result.candidates.filter(c => c.templateId === RAID),
    refused: result.rejections.filter(r => r.templateId === RAID),
  };
}

function addHostile(graph: WorldGraph, from: string, to: string, props: Record<string, unknown>) {
  graph.addEdge({
    id: `e_hostile_${from}_${to}`, source: from, target: to,
    type: 'hostile_to', properties: props,
  });
}

// ─── Wiring ─────────────────────────────────────────────────────────

describe('motive gate — wired into candidate generation', () => {
  it('refuses the raid against a town the warlord has no quarrel with', () => {
    const { offered, refused } = raidCandidates(world());

    expect(offered).toEqual([]);
    expect(refused).toContainEqual({ templateId: RAID, reason: `no_motive:${TOWN}` });
  });

  it('offers the same raid, same fixture, once a rivalry exists', () => {
    // The arm that makes the refusal above mean something. Nothing changes but one
    // edge: if this still refused, the gate would be a permanent "no" rather than a gate.
    const graph = world();
    addHostile(graph, WARLORD, OWNER, { reason: 'excommunicated', createdTick: 1 });

    const { offered, refused } = raidCandidates(graph);
    expect(offered.map(c => c.targetNodeId)).toEqual([TOWN]);
    // The warlord's own camp is a `camp` and so also a raid target — and nobody holds
    // it, so it stays refused. The gate discriminates by target, not by actor mood.
    expect(refused).toEqual([{ templateId: RAID, reason: 'no_motive_unowned:loc_camp' }]);
  });

  it('offers the raid on a grudge from a past engagement', () => {
    const graph = world();
    addHostile(graph, WARLORD, OWNER, { since: 4, cause: 'group_engagement' });

    expect(raidCandidates(graph).offered.map(c => c.targetNodeId)).toEqual([TOWN]);
  });

  it('offers the raid when the two factions are declared rivals', () => {
    const graph = world();
    graph.addNode({
      id: 'faction_mine', name: 'The Iron Pact', type: 'actor',
      properties: { actorType: 'faction' },
    });
    graph.addEdge({
      id: 'e_member', source: WARLORD, target: 'faction_mine',
      type: 'member_of', properties: { role: 'commander', rank: 0.8, joinedTick: 1 },
    });
    graph.addEdge({
      id: 'e_rivals', source: 'faction_mine', target: OWNER,
      type: 'relates_to', properties: { isRival: true },
    });

    expect(raidCandidates(graph).offered.map(c => c.targetNodeId)).toEqual([TOWN]);
  });

  it('refuses a town nobody holds — the destruction is aimed at no one', () => {
    const graph = world();
    graph.removeEdge('e_controls');
    // Even with a standing rivalry: the quarrel is with the Compact, and the Compact
    // does not hold this town. A gated verb that fired here would be aimed at nothing.
    addHostile(graph, WARLORD, OWNER, { reason: 'excommunicated', createdTick: 1 });

    const { offered, refused } = raidCandidates(graph);
    expect(offered).toEqual([]);
    expect(refused).toContainEqual({ templateId: RAID, reason: `no_motive_unowned:${TOWN}` });
  });

  it('distinguishes "unowned" from "no quarrel" in the reason, not just the count', () => {
    // The two refusals want different fixes — one is a world that has not claimed the
    // ground yet, the other is a warlord with nothing against its holder — and the
    // board trace's `refusals` list is the only place either becomes visible. A single
    // shared `no_motive` string would collapse them the moment anyone read a run.
    const owned = raidCandidates(world()).refused.map(r => r.reason);
    const unowned = (() => {
      const graph = world();
      graph.removeEdge('e_controls');
      return raidCandidates(graph).refused.map(r => r.reason);
    })();

    expect(owned).toContain(`no_motive:${TOWN}`);
    expect(unowned).toContain(`no_motive_unowned:${TOWN}`);
    expect(owned).not.toContain(`no_motive_unowned:${TOWN}`);
    // Both stay matchable by one prefix, which is what a sweep over a run will use.
    expect([...owned, ...unowned].every(r => r.startsWith('no_motive'))).toBe(true);
  });

  it('leaves ungated templates alone — the gate is opt-in', () => {
    // The same generation pass offers the warlord's non-destroy verbs against the very
    // target it refused the raid on. Without this, a gate that refused everything
    // would pass every assertion above.
    const result = generateStrategicCandidates(
      world(), WARLORD, [AMBITION], undefined, 10, mulberry32(42),
    );
    const ungated = result.candidates.filter(c => c.templateId !== RAID);
    expect(ungated.length).toBeGreaterThan(0);
    expect(ungated.some(c => c.targetNodeId === TOWN)).toBe(true);
  });

  it('the raid template still declares the gate it is being tested through', () => {
    // Pins the subject rather than the assertion: if the gate were quietly removed
    // from the template, every refusal test above would flip to "offered" and read as
    // a behaviour change rather than as the gate having been deleted.
    expect(getStrategicTemplate(RAID)?.motiveGate)
      .toEqual(['rivalry', 'grudge', 'faction_war']);
  });
});

// ─── The rule ───────────────────────────────────────────────────────

describe('holdsMotive', () => {
  it('reads a plain hostility as rivalry, not grudge', () => {
    const graph = world();
    addHostile(graph, WARLORD, OWNER, { reason: 'excommunicated', createdTick: 1 });

    expect(holdsMotive(graph, WARLORD, OWNER, 'rivalry')).toBe(true);
    expect(holdsMotive(graph, WARLORD, OWNER, 'grudge')).toBe(false);
  });

  it('reads an injury-provenance hostility as grudge, not rivalry', () => {
    const graph = world();
    addHostile(graph, WARLORD, OWNER, { since: 4, cause: 'group_engagement' });

    expect(holdsMotive(graph, WARLORD, OWNER, 'grudge')).toBe(true);
    expect(holdsMotive(graph, WARLORD, OWNER, 'rivalry')).toBe(false);
  });

  it('reads a severed mentorship as a grudge, under its own property key', () => {
    // The three hostile_to writers stamp provenance under three different keys
    // (`cause`, `reason`, `basis`). A reader that checked only one would classify two
    // thirds of the world's hostilities as bare rivalry and never know.
    const graph = world();
    addHostile(graph, WARLORD, OWNER, { basis: 'mentorship_break', createdAt: 2 });

    expect(holdsMotive(graph, WARLORD, OWNER, 'grudge')).toBe(true);
  });

  it('does not read hostility held in the other direction', () => {
    // The owner hating the warlord is not the warlord's motive. Directionality is the
    // whole difference between "he had a reason" and "someone had a reason".
    const graph = world();
    addHostile(graph, OWNER, WARLORD, { reason: 'excommunicated', createdTick: 1 });

    expect(holdsMotive(graph, WARLORD, OWNER, 'rivalry')).toBe(false);
  });

  it('reads a shared active ambition as contested', () => {
    const graph = world();
    graph.addEdge({
      id: 'e_pursues_owner', source: OWNER, target: 'ambition_node',
      type: 'pursues', properties: { status: 'active', priority: 'primary', assignedTick: 1 },
    });

    expect(holdsMotive(graph, WARLORD, OWNER, 'contested_ambition')).toBe(true);
  });

  it('does not read a resolved ambition as contested — a finished race is a memory', () => {
    const graph = world();
    graph.addEdge({
      id: 'e_pursues_owner', source: OWNER, target: 'ambition_node',
      type: 'pursues', properties: { status: 'completed', priority: 'primary', assignedTick: 1 },
    });

    expect(holdsMotive(graph, WARLORD, OWNER, 'contested_ambition')).toBe(false);
  });

  it('never lets an actor hold a motive toward themselves', () => {
    const graph = world();
    addHostile(graph, WARLORD, WARLORD, { reason: 'self_loathing', createdTick: 1 });

    expect(holdsMotive(graph, WARLORD, WARLORD, 'rivalry')).toBe(false);
  });
});

describe('resolveTargetOwners', () => {
  it('reads a controlling faction', () => {
    expect(resolveTargetOwners(world(), TOWN)).toEqual([OWNER]);
  });

  it('reads a group-family commander', () => {
    const graph = world();
    graph.addNode({
      id: 'grp_band', name: 'The Sparrows', type: 'actor',
      properties: { actorType: 'group', groupKind: 'company' },
    });
    graph.addEdge({
      id: 'e_cmd', source: 'grp_band', target: WARLORD,
      type: 'commanded_by', properties: {},
    });

    expect(resolveTargetOwners(graph, 'grp_band')).toEqual([WARLORD]);
  });

  it('answers empty for an unheld node, rather than throwing', () => {
    expect(resolveTargetOwners(world(), 'loc_camp')).toEqual([]);
    expect(resolveTargetOwners(world(), 'no_such_node')).toEqual([]);
  });
});

describe('evaluateMotiveGate', () => {
  it('passes an ungated template unconditionally', () => {
    const ungated = getStrategicTemplate('strategic_scout_defenses')!;
    expect(evaluateMotiveGate(world(), WARLORD, TOWN, ungated).allowed).toBe(true);
  });

  it('names which motive licensed the verb, and whose', () => {
    // NFP #2: the trace must be able to say *why* a razing was allowed, not only that
    // it was — a boolean here would make every allowed destroy indistinguishable.
    const graph = world();
    addHostile(graph, WARLORD, OWNER, { since: 4, cause: 'group_engagement' });

    const result = evaluateMotiveGate(graph, WARLORD, TOWN, getStrategicTemplate(RAID)!);
    expect(result).toMatchObject({ allowed: true, motive: 'grudge', ownerId: OWNER });
  });

  it('separates "unowned" from "no quarrel" in the refusal', () => {
    const graph = world();
    const gated = getStrategicTemplate(RAID)!;

    expect(evaluateMotiveGate(graph, WARLORD, TOWN, gated))
      .toMatchObject({ allowed: false, ownerCount: 1 });

    graph.removeEdge('e_controls');
    expect(evaluateMotiveGate(graph, WARLORD, TOWN, gated))
      .toMatchObject({ allowed: false, ownerCount: 0 });
  });
});
