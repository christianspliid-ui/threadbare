/**
 * Tests for the chosen-faction consumer (THR-513).
 *
 * Proves the previously-dead `chosen` status is now mechanically live: a chosen
 * faction's members gain a power-keyed reputation bonus each tick through the
 * existing reputation system (no longer a no-op). End-to-end: anoint a faction,
 * run the phase, assert member reputation rose.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import type { ReachDomain } from '../../types/traits';
import { applyAnointFaction } from '../ascendantExpression';
import { phaseChosenFactionPowers, CHOSEN_POWER_EFFECT_TABLE } from '../chosenFactionPowers';
import { CHOSEN_FACTION_REPUTATION_PER_TICK } from '../../data/ascendant-expression-constants';

// ─── Builders ──────────────────────────────────────────────────────────────

function addAscendant(g: WorldGraph, id: string, affinities: Partial<Record<ReachDomain, number>>): void {
  g.addNode({
    id,
    type: 'actor',
    name: id,
    properties: { actorType: 'ascendant', domainAffinities: affinities },
  });
}

function addFaction(g: WorldGraph, id: string, props: Record<string, unknown> = {}): void {
  g.addNode({ id, type: 'actor', name: id, properties: { actorType: 'faction', ...props } });
}

function addMember(g: WorldGraph, memberId: string, factionId: string, reputation: number): void {
  g.addNode({ id: memberId, type: 'actor', name: memberId, properties: { actorType: 'individual' } });
  g.addEdge({
    id: `mem:${memberId}->${factionId}`,
    source: memberId,
    target: factionId,
    type: 'member_of',
    properties: { reputation, role: 'member', rank: 0, joinedTick: 0 },
  });
}

/** Minimal GameState — the phase only touches `graph` and `tick`. */
function makeState(graph: WorldGraph, tick: number): GameState {
  return { graph, tick } as unknown as GameState;
}

function reputationOf(g: WorldGraph, memberId: string, factionId: string): number {
  const edge = g.getOutgoingEdges(memberId, 'member_of').find((e) => e.target === factionId)!;
  return (edge.properties.reputation as number) ?? 0;
}

// ═══════════════════════════════════════════════════════════════════════════
// phaseChosenFactionPowers
// ═══════════════════════════════════════════════════════════════════════════

describe('phaseChosenFactionPowers', () => {
  it('grants chosen-faction members a power-keyed reputation gain each tick', () => {
    const g = new WorldGraph();
    addAscendant(g, 'asc', { gold: 5 }); // primary reach = gold → chosen.gold.reputation
    addFaction(g, 'guild');
    addMember(g, 'm1', 'guild', 0.4);
    addMember(g, 'm2', 'guild', 0.6);

    applyAnointFaction(g, 'asc', 'guild', 1);
    phaseChosenFactionPowers(makeState(g, 2));

    const expected = CHOSEN_POWER_EFFECT_TABLE['chosen.gold.reputation'];
    expect(reputationOf(g, 'm1', 'guild')).toBeCloseTo(0.4 + expected, 6);
    expect(reputationOf(g, 'm2', 'guild')).toBeCloseTo(0.6 + expected, 6);
  });

  it('uses the per-power magnitude from the effect table (iron < gold)', () => {
    const g = new WorldGraph();
    addAscendant(g, 'asc', { iron: 5 }); // → chosen.iron.leadership_aura
    addFaction(g, 'legion');
    addMember(g, 'm1', 'legion', 0.5);

    applyAnointFaction(g, 'asc', 'legion', 1);
    phaseChosenFactionPowers(makeState(g, 2));

    const ironGain = CHOSEN_POWER_EFFECT_TABLE['chosen.iron.leadership_aura'];
    expect(reputationOf(g, 'm1', 'legion')).toBeCloseTo(0.5 + ironGain, 6);
    expect(ironGain).toBeLessThan(CHOSEN_POWER_EFFECT_TABLE['chosen.gold.reputation']);
  });

  it('accumulates across multiple ticks', () => {
    const g = new WorldGraph();
    addAscendant(g, 'asc', { gold: 5 });
    addFaction(g, 'guild');
    addMember(g, 'm1', 'guild', 0.4);
    applyAnointFaction(g, 'asc', 'guild', 1);

    const gain = CHOSEN_POWER_EFFECT_TABLE['chosen.gold.reputation'];
    phaseChosenFactionPowers(makeState(g, 2));
    phaseChosenFactionPowers(makeState(g, 3));
    expect(reputationOf(g, 'm1', 'guild')).toBeCloseTo(0.4 + 2 * gain, 6);
  });

  it('clamps member reputation at 1.0 (never overfills)', () => {
    const g = new WorldGraph();
    addAscendant(g, 'asc', { gold: 5 });
    addFaction(g, 'guild');
    addMember(g, 'm1', 'guild', 1.0);
    applyAnointFaction(g, 'asc', 'guild', 1);

    phaseChosenFactionPowers(makeState(g, 2));
    expect(reputationOf(g, 'm1', 'guild')).toBe(1.0);
  });

  it('falls back to the default per-tick gain when a power has no table entry', () => {
    const g = new WorldGraph();
    addFaction(g, 'guild');
    addMember(g, 'm1', 'guild', 0.4);
    // Stamp a chosen power id that is absent from CHOSEN_POWER_EFFECT_TABLE.
    const node = g.getNode('guild')!;
    g.updateNode('guild', {
      properties: {
        ...node.properties,
        chosen: {
          byAscendantId: 'asc',
          domain: 'gold',
          grantedTick: 1,
          power: { id: 'chosen.unknown.mystery', label: 'Mystery', summary: '' },
        },
      },
    });

    phaseChosenFactionPowers(makeState(g, 2));
    expect(reputationOf(g, 'm1', 'guild')).toBeCloseTo(0.4 + CHOSEN_FACTION_REPUTATION_PER_TICK, 6);
  });

  // ─── Fail-soft / no-op (NFP #4) ───────────────────────────────────────────

  it('does nothing for an un-anointed faction', () => {
    const g = new WorldGraph();
    addFaction(g, 'guild');
    addMember(g, 'm1', 'guild', 0.4);
    phaseChosenFactionPowers(makeState(g, 2));
    expect(reputationOf(g, 'm1', 'guild')).toBe(0.4);
  });

  it('skips a dissolved chosen faction', () => {
    const g = new WorldGraph();
    addAscendant(g, 'asc', { gold: 5 });
    addFaction(g, 'guild');
    addMember(g, 'm1', 'guild', 0.4);
    applyAnointFaction(g, 'asc', 'guild', 1);
    const node = g.getNode('guild')!;
    g.updateNode('guild', { properties: { ...node.properties, dissolved: true } });

    phaseChosenFactionPowers(makeState(g, 2));
    expect(reputationOf(g, 'm1', 'guild')).toBe(0.4);
  });

  it('does not throw on a chosen faction with no members', () => {
    const g = new WorldGraph();
    addAscendant(g, 'asc', { gold: 5 });
    addFaction(g, 'guild');
    applyAnointFaction(g, 'asc', 'guild', 1);
    expect(() => phaseChosenFactionPowers(makeState(g, 2))).not.toThrow();
  });
});
