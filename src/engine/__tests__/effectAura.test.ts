import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { collectAuraEffects, resolveAuraModifiers } from '../effectAura';
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
