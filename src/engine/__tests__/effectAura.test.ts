import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  collectAuraEffects,
  collectAuraEffectsNear,
  resolveAuraModifiers,
  selectAuraEmitters,
} from '../effectAura';
import { AURA_MAX_RADIUS, AURA_STACKING_CAP } from '../../data/effect-constants';
import type { AgentPosition } from '../effectAura';

// ─── Helpers ────────────────────────────────────────────────────

function makeGraph(): WorldGraph {
  return new WorldGraph();
}

function addAgentAtHex(
  graph: WorldGraph,
  id: string,
  hexCol: number,
  hexRow: number,
  factionId?: string,
): void {
  graph.addNode({
    id,
    type: 'actor',
    name: `Agent ${id}`,
    properties: { actorType: 'individual', ...(factionId ? { factionId } : {}) },
  });
  const locId = `loc-${id}`;
  graph.addNode({
    id: locId,
    type: 'location',
    name: `Loc ${id}`,
    properties: { hexCol, hexRow },
  });
  graph.addEdge({
    id: `edge-loc-${id}`,
    source: id,
    target: locId,
    type: 'located_at',
    properties: {},
  });
}

function addFaction(graph: WorldGraph, id: string): void {
  graph.addNode({
    id,
    type: 'actor',
    name: `Faction ${id}`,
    properties: { actorType: 'faction' },
  });
}

function addRivalEdge(graph: WorldGraph, factionA: string, factionB: string): void {
  graph.addEdge({
    id: `rival-${factionA}-${factionB}`,
    source: factionA,
    target: factionB,
    type: 'relates_to',
    properties: { isRival: true },
  });
}

function addAuraAttachment(
  graph: WorldGraph,
  agentId: string,
  attachId: string,
  target: 'all' | 'allies' | 'enemies',
  value: number,
  radius = 2,
): void {
  graph.addNode({
    id: attachId,
    type: 'artifact',
    name: `Attach ${attachId}`,
    properties: {
      effects: [{ type: 'aura', radius, target, reach: 'combat', value }],
    },
  });
  graph.addEdge({
    id: `edge-attach-${agentId}-${attachId}`,
    source: agentId,
    target: attachId,
    type: 'possesses',
    properties: {},
  });
}

function tgtPos(agentId: string, hexCol: number, hexRow: number, factionId?: string): AgentPosition {
  return { agentId, hexCol, hexRow, factionId };
}

// ─── Tests ────────────────────────────────────────────────────────

describe('effectAura', () => {
  it('all filter: applies to any in-range agent regardless of faction', () => {
    const graph = makeGraph();
    addAgentAtHex(graph, 'src', 0, 0, 'faction-a');
    addAgentAtHex(graph, 'tgt', 1, 0, 'faction-b');
    addAuraAttachment(graph, 'src', 'attach-1', 'all', 5);

    const auras = collectAuraEffects(graph);
    const mods = resolveAuraModifiers(graph, auras, 'tgt', tgtPos('tgt', 1, 0, 'faction-b'));
    expect(mods['combat']).toBe(5);
  });

  it('allies filter: applies to same-faction agent', () => {
    const graph = makeGraph();
    addAgentAtHex(graph, 'src', 0, 0, 'faction-a');
    addAgentAtHex(graph, 'tgt', 1, 0, 'faction-a');
    addAuraAttachment(graph, 'src', 'attach-1', 'allies', 5);

    const auras = collectAuraEffects(graph);
    const mods = resolveAuraModifiers(graph, auras, 'tgt', tgtPos('tgt', 1, 0, 'faction-a'));
    expect(mods['combat']).toBe(5);
  });

  it('allies filter: skips different-faction agent', () => {
    const graph = makeGraph();
    addAgentAtHex(graph, 'src', 0, 0, 'faction-a');
    addAgentAtHex(graph, 'tgt', 1, 0, 'faction-b');
    addAuraAttachment(graph, 'src', 'attach-1', 'allies', 5);

    const auras = collectAuraEffects(graph);
    const mods = resolveAuraModifiers(graph, auras, 'tgt', tgtPos('tgt', 1, 0, 'faction-b'));
    expect(mods['combat']).toBeUndefined();
  });

  it('enemies filter: applies to agent from rival faction', () => {
    const graph = makeGraph();
    addFaction(graph, 'faction-a');
    addFaction(graph, 'faction-b');
    addRivalEdge(graph, 'faction-a', 'faction-b');
    addAgentAtHex(graph, 'src', 0, 0, 'faction-a');
    addAgentAtHex(graph, 'tgt', 1, 0, 'faction-b');
    addAuraAttachment(graph, 'src', 'attach-1', 'enemies', -3);

    const auras = collectAuraEffects(graph);
    const mods = resolveAuraModifiers(graph, auras, 'tgt', tgtPos('tgt', 1, 0, 'faction-b'));
    expect(mods['combat']).toBe(-3);
  });

  it('enemies filter: skips agent from neutral (non-rival) faction', () => {
    const graph = makeGraph();
    addFaction(graph, 'faction-a');
    addFaction(graph, 'faction-b');
    // No rival edge — factions are neutral
    addAgentAtHex(graph, 'src', 0, 0, 'faction-a');
    addAgentAtHex(graph, 'tgt', 1, 0, 'faction-b');
    addAuraAttachment(graph, 'src', 'attach-1', 'enemies', -3);

    const auras = collectAuraEffects(graph);
    const mods = resolveAuraModifiers(graph, auras, 'tgt', tgtPos('tgt', 1, 0, 'faction-b'));
    expect(mods['combat']).toBeUndefined();
  });
});

// ─── Neighbourhood-scoped collection (THR-1243) ───────────────────
//
// The wiring's whole affordability argument is that far-away emitters are never
// walked. These tests hold that claim to the distance bound rather than to the
// aggregate, because `resolveAuraModifiers` would filter a too-wide collection
// back down to the same answer and hide the cost.

describe('collectAuraEffectsNear', () => {
  it('collects an emitter standing inside the radius', () => {
    const graph = makeGraph();
    addAgentAtHex(graph, 'src', 0, 0, 'faction-a');
    addAgentAtHex(graph, 'tgt', 1, 0, 'faction-a');
    addAuraAttachment(graph, 'src', 'attach-1', 'all', 5);

    const near = collectAuraEffectsNear(graph, tgtPos('tgt', 1, 0, 'faction-a'));
    expect(near.map(e => e.sourceAgentId)).toEqual(['src']);
  });

  it('drops an emitter beyond AURA_MAX_RADIUS before walking its attachments', () => {
    const graph = makeGraph();
    // Far enough that no aura could reach, whatever radius it declares.
    addAgentAtHex(graph, 'src', AURA_MAX_RADIUS + 5, 0, 'faction-a');
    addAgentAtHex(graph, 'tgt', 0, 0, 'faction-a');
    addAuraAttachment(graph, 'src', 'attach-1', 'all', 5, AURA_MAX_RADIUS);

    expect(collectAuraEffectsNear(graph, tgtPos('tgt', 0, 0, 'faction-a'))).toEqual([]);
    // The unscoped collector still sees it — so the empty result above is the
    // distance bound doing work, not an empty world.
    expect(collectAuraEffects(graph).map(e => e.sourceAgentId)).toEqual(['src']);
  });

  it('never collects the target as its own emitter', () => {
    const graph = makeGraph();
    addAgentAtHex(graph, 'tgt', 0, 0, 'faction-a');
    addAuraAttachment(graph, 'tgt', 'attach-self', 'all', 5);

    expect(collectAuraEffectsNear(graph, tgtPos('tgt', 0, 0, 'faction-a'))).toEqual([]);
  });

  it('skips an emitter whose position will not resolve, without throwing', () => {
    const graph = makeGraph();
    addAgentAtHex(graph, 'tgt', 0, 0, 'faction-a');
    // Emitter with an aura but no located_at edge at all.
    graph.addNode({
      id: 'src',
      type: 'actor',
      name: 'Agent src',
      properties: { actorType: 'individual' },
    });
    addAuraAttachment(graph, 'src', 'attach-1', 'all', 5);

    expect(() => collectAuraEffectsNear(graph, tgtPos('tgt', 0, 0, 'faction-a'))).not.toThrow();
    expect(collectAuraEffectsNear(graph, tgtPos('tgt', 0, 0, 'faction-a'))).toEqual([]);
  });
});

describe('selectAuraEmitters', () => {
  function addEmitter(graph: WorldGraph, id: string, value: number): void {
    addAgentAtHex(graph, id, 0, 0, 'faction-a');
    addAuraAttachment(graph, id, `attach-${id}`, 'all', value);
  }

  it('keeps the strongest emitters when more than the cap are in range', () => {
    const graph = makeGraph();
    addAgentAtHex(graph, 'tgt', 0, 0, 'faction-a');
    // One more emitter than the cap allows, each stronger than the last.
    const values = Array.from({ length: AURA_STACKING_CAP + 1 }, (_, i) => i + 1);
    values.forEach((v, i) => addEmitter(graph, `src${i}`, v));

    const near = collectAuraEffectsNear(graph, tgtPos('tgt', 0, 0, 'faction-a'));
    const kept = selectAuraEmitters(
      graph, near, 'tgt', tgtPos('tgt', 0, 0, 'faction-a'), 'combat', AURA_STACKING_CAP,
    );

    expect(kept.size).toBe(AURA_STACKING_CAP);
    // The weakest emitter is the one dropped.
    expect(kept.has('src0')).toBe(false);
    expect(kept.has(`src${values.length - 1}`)).toBe(true);
  });

  it('counts one emitter once however many auras it carries', () => {
    const graph = makeGraph();
    addAgentAtHex(graph, 'tgt', 0, 0, 'faction-a');
    addAgentAtHex(graph, 'src', 0, 0, 'faction-a');
    addAuraAttachment(graph, 'src', 'attach-a', 'all', 1);
    addAuraAttachment(graph, 'src', 'attach-b', 'all', 1);
    addAuraAttachment(graph, 'src', 'attach-c', 'all', 1);
    addAuraAttachment(graph, 'src', 'attach-d', 'all', 1);

    const near = collectAuraEffectsNear(graph, tgtPos('tgt', 0, 0, 'faction-a'));
    expect(near).toHaveLength(4);

    const kept = selectAuraEmitters(
      graph, near, 'tgt', tgtPos('tgt', 0, 0, 'faction-a'), 'combat', AURA_STACKING_CAP,
    );
    expect(kept.size).toBe(1);
    expect(kept.get('src')).toHaveLength(4);
  });

  it('excludes auras for a different reach than the step being resolved', () => {
    const graph = makeGraph();
    addAgentAtHex(graph, 'tgt', 0, 0, 'faction-a');
    addEmitter(graph, 'src', 5); // reach: 'combat'

    const near = collectAuraEffectsNear(graph, tgtPos('tgt', 0, 0, 'faction-a'));
    const kept = selectAuraEmitters(
      graph, near, 'tgt', tgtPos('tgt', 0, 0, 'faction-a'), 'stone', AURA_STACKING_CAP,
    );
    expect(kept.size).toBe(0);
  });

  it('selects the same emitters on repeated calls (determinism)', () => {
    const graph = makeGraph();
    addAgentAtHex(graph, 'tgt', 0, 0, 'faction-a');
    // Equal magnitudes, so the tie-break — not the magnitude — decides.
    for (let i = 0; i < AURA_STACKING_CAP + 2; i++) addEmitter(graph, `src${i}`, 4);

    const pos = tgtPos('tgt', 0, 0, 'faction-a');
    const first = [...selectAuraEmitters(
      graph, collectAuraEffectsNear(graph, pos), 'tgt', pos, 'combat', AURA_STACKING_CAP,
    ).keys()];
    const second = [...selectAuraEmitters(
      graph, collectAuraEffectsNear(graph, pos), 'tgt', pos, 'combat', AURA_STACKING_CAP,
    ).keys()];

    expect(first).toHaveLength(AURA_STACKING_CAP);
    expect(second).toEqual(first);
  });
});
