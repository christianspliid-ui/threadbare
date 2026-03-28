/**
 * Tests for phaseSpherePressure — sphere pressure resolution engine.
 *
 * Tests cover:
 * - No-op on empty pressures
 * - Constructive pressure: progress accumulation and level-up
 * - Opposition cancellation (net netting across pairs)
 * - Allied defense reduces erosion threshold
 * - Erosion when pressure exceeds threshold, with progress reset
 * - Agent presence buffer on hex entities
 * - MAX_SPHERE_SCORE cap (no level-up beyond 10)
 * - Trace emission for all outcomes
 */
import { describe, it, expect } from 'vitest';
import {
  resolveSpherePressure,
  netPressuresBySphere,
  cancelOppositions,
  effectiveHexThreshold,
  phaseSpherePressure,
} from '../phaseSpherePressure';
import { createDefaultSphereAffinity, MAX_SPHERE_SCORE, triangleCost } from '../../types/sphereAffinity';
import type { SphereAffinity, SpherePressureEvent } from '../../types/sphereAffinity';
import type { SphereName } from '../../types/index';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';

// ─── Helpers ────────────────────────────────────────────────────────

function makeAffinity(scores: Partial<Record<SphereName, number>>, progress: Partial<Record<SphereName, number>> = {}): SphereAffinity {
  const base = createDefaultSphereAffinity();
  for (const [k, v] of Object.entries(scores)) {
    base.scores[k as SphereName] = v as number;
  }
  for (const [k, v] of Object.entries(progress)) {
    base.progress[k as SphereName] = v as number;
  }
  return base;
}

function makePressure(targetEntityId: string, sphere: SphereName, magnitude: number): SpherePressureEvent {
  return {
    targetEntityId,
    sphere,
    magnitude,
    source: 'divine_action',
    sourceId: 'test',
  };
}

function makeState(
  entityId: string,
  affinity: SphereAffinity,
  pressures: SpherePressureEvent[] = [],
  actorPresentAffinities?: { id: string; affinity: SphereAffinity }[],
): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: entityId,
    type: 'location',
    name: 'Test Entity',
    properties: { sphereAffinity: affinity },
  });
  // Add agent actors with located_at edges for agent presence tests
  if (actorPresentAffinities) {
    for (const actor of actorPresentAffinities) {
      graph.addNode({
        id: actor.id,
        type: 'actor',
        name: `Agent ${actor.id}`,
        properties: {
          actorType: 'individual',
          sphereAffinity: actor.affinity,
        },
      });
      graph.addEdge({
        id: `edge_${actor.id}`,
        source: actor.id,
        target: entityId,
        type: 'located_at',
        properties: {},
      });
    }
  }
  return {
    tick: 1,
    graph,
    pendingSpherePressures: pressures,
  } as unknown as GameState;
}

// ─── netPressuresBySphere ────────────────────────────────────────────

describe('netPressuresBySphere', () => {
  it('returns all zeros when no pressures', () => {
    const result = netPressuresBySphere([]);
    expect(result.life).toBe(0);
    expect(result.force).toBe(0);
  });

  it('sums magnitudes per sphere', () => {
    const pressures: SpherePressureEvent[] = [
      makePressure('e1', 'life', 3),
      makePressure('e1', 'life', 2),
      makePressure('e1', 'force', 1),
    ];
    const result = netPressuresBySphere(pressures);
    expect(result.life).toBe(5);
    expect(result.force).toBe(1);
  });

  it('handles negative magnitudes (destructive events)', () => {
    const pressures: SpherePressureEvent[] = [
      makePressure('e1', 'life', 3),
      makePressure('e1', 'life', -1),
    ];
    const result = netPressuresBySphere(pressures);
    expect(result.life).toBe(2);
  });
});

// ─── cancelOppositions ──────────────────────────────────────────────

describe('cancelOppositions', () => {
  it('returns unchanged if no opposing pressure', () => {
    const net: Record<SphereName, number> = {
      force: 0, matter: 0, energy: 0, life: 3,
      mind: 0, spirit: 0, time: 0, entropy: 0,
    };
    const result = cancelOppositions(net);
    expect(result.life).toBe(3);
    expect(result.entropy).toBe(0);
  });

  it('cancels Life vs Entropy: Life +3, Entropy +2 → Life +1, Entropy 0', () => {
    const net: Record<SphereName, number> = {
      force: 0, matter: 0, energy: 0, life: 3,
      mind: 0, spirit: 0, time: 0, entropy: 2,
    };
    const result = cancelOppositions(net);
    // Life dominates (3 > 2), remainder = 1 in Life, Entropy canceled to 0
    expect(result.life).toBe(1);
    expect(result.entropy).toBe(0);
  });

  it('cancels Energy vs Force: equal magnitudes → both 0', () => {
    const net: Record<SphereName, number> = {
      force: 3, matter: 0, energy: 3, life: 0,
      mind: 0, spirit: 0, time: 0, entropy: 0,
    };
    const result = cancelOppositions(net);
    expect(result.force).toBe(0);
    expect(result.energy).toBe(0);
  });

  it('cancels Mind vs Time: Time dominates', () => {
    const net: Record<SphereName, number> = {
      force: 0, matter: 0, energy: 0, life: 0,
      mind: 1, spirit: 0, time: 4, entropy: 0,
    };
    const result = cancelOppositions(net);
    expect(result.mind).toBe(0);
    expect(result.time).toBe(3);
  });

  it('cancels Matter vs Spirit', () => {
    const net: Record<SphereName, number> = {
      force: 0, matter: 5, energy: 0, life: 0,
      mind: 0, spirit: 2, time: 0, entropy: 0,
    };
    const result = cancelOppositions(net);
    expect(result.matter).toBe(3);
    expect(result.spirit).toBe(0);
  });
});

// ─── resolveSpherePressure ───────────────────────────────────────────

describe('resolveSpherePressure', () => {
  it('returns unchanged affinity and no traces when no pressures', () => {
    const affinity = makeAffinity({ life: 2 });
    const { updated, traces } = resolveSpherePressure(affinity, [], []);
    expect(updated.scores.life).toBe(2);
    expect(traces).toHaveLength(0);
  });

  it('constructive pressure of 1 on score-0 entity: progress reaches triangleCost(1)=1 → level up to score 1', () => {
    // triangleCost(1) = 1, so pressure 1 on score 0 → progress = 1 >= 1 → level up
    const affinity = makeAffinity({ life: 0 });
    const pressures = [makePressure('e1', 'life', 1)];
    const { updated, traces } = resolveSpherePressure(affinity, pressures, []);
    expect(updated.scores.life).toBe(1);
    expect(updated.progress.life).toBe(0); // reset after level-up
    const levelUpTrace = traces.find(t => t.outcome === 'level_up');
    expect(levelUpTrace).toBeDefined();
    expect(levelUpTrace?.sphere).toBe('life');
  });

  it('constructive pressure of 1 on score-1 entity: progress accumulates but no level up (cost = 2)', () => {
    // triangleCost(2) = 2; pressure 1 only gives progress 1, not enough
    const affinity = makeAffinity({ life: 1 }, { life: 0 });
    const pressures = [makePressure('e1', 'life', 1)];
    const { updated, traces } = resolveSpherePressure(affinity, pressures, []);
    expect(updated.scores.life).toBe(1); // no level up
    expect(updated.progress.life).toBe(1);
    const progressTrace = traces.find(t => t.outcome === 'progress');
    expect(progressTrace).toBeDefined();
  });

  it('erosion: pressure 10 against score 3, no allies → excess = 7, new score = max(0, 3-7) = 0, progress reset', () => {
    // Force pressure against an Energy-bearing entity
    // Force is opposite to Energy. Energy score = 3.
    // Net: force = 10 in net pressures. After cancelOppositions(force=10, energy=0) → force stays 10.
    // Force is destructive to Energy. Energy ally = Life.
    // With Life=0: threshold = 3 + floor(0/2) = 3. excess = 10-3 = 7. new score = max(0, 3-7) = 0.
    const affinity = makeAffinity({ energy: 3 }, { energy: 2 });
    // Force is the opposite of Energy — applying Force pressure is destructive to Energy
    const pressures = [makePressure('e1', 'force', 10)];
    const { updated, traces } = resolveSpherePressure(affinity, pressures, []);
    expect(updated.scores.energy).toBe(0);
    expect(updated.progress.energy).toBe(0); // reset
    const erosionTrace = traces.find(t => t.outcome === 'eroded');
    expect(erosionTrace).toBeDefined();
    expect(erosionTrace?.sphere).toBe('energy');
  });

  it('allied defense: Force 5 against Energy score 3, Life ally score 4 → threshold=3+2=5 → absorbed', () => {
    // Energy ally = Life. floor(4/2)=2. threshold = 3+2=5. pressure 5 <= 5 → absorbed.
    const affinity = makeAffinity({ energy: 3, life: 4 });
    const pressures = [makePressure('e1', 'force', 5)];
    const { updated, traces } = resolveSpherePressure(affinity, pressures, []);
    expect(updated.scores.energy).toBe(3); // no change
    const absorbedTrace = traces.find(t => t.outcome === 'absorbed');
    expect(absorbedTrace).toBeDefined();
    expect(absorbedTrace?.sphere).toBe('energy');
  });

  it('opposition cancellation: Life +3, Entropy +2 same entity → net constructive Life +1', () => {
    const affinity = makeAffinity({ life: 0 });
    const pressures: SpherePressureEvent[] = [
      makePressure('e1', 'life', 3),
      makePressure('e1', 'entropy', 2),
    ];
    const { updated, traces } = resolveSpherePressure(affinity, pressures, []);
    // After cancellation: life net = 1 constructive. triangleCost(1)=1, so level up.
    expect(updated.scores.life).toBe(1);
    expect(traces.find(t => t.sphere === 'entropy')).toBeUndefined(); // entropy fully cancelled
  });

  it('does not level up beyond MAX_SPHERE_SCORE', () => {
    const affinity = makeAffinity({ life: MAX_SPHERE_SCORE });
    const pressures = [makePressure('e1', 'life', 100)];
    const { updated } = resolveSpherePressure(affinity, pressures, []);
    expect(updated.scores.life).toBe(MAX_SPHERE_SCORE);
  });

  it('emits traces for all non-zero spheres resolved', () => {
    const affinity = makeAffinity({ life: 0, force: 2 });
    const pressures: SpherePressureEvent[] = [
      makePressure('e1', 'life', 2),
      makePressure('e1', 'energy', 3), // energy is opposite of force, will erode force
    ];
    const { traces } = resolveSpherePressure(affinity, pressures, []);
    expect(traces.length).toBeGreaterThan(0);
  });

  it('agent presence buffer: agent with Life:3 boosts effective hex threshold', () => {
    const hexAffinity = makeAffinity({ life: 2 });
    const agentAffinity = makeAffinity({ life: 3 });
    // Without agent: threshold = 2 + floor(allyEnergy/2) = 2
    // With agent Life:3: threshold = 2 + 0 + 3 = 5
    const threshold = effectiveHexThreshold(hexAffinity, 'life', [agentAffinity]);
    expect(threshold).toBe(5);
  });
});

// ─── effectiveHexThreshold ──────────────────────────────────────────

describe('effectiveHexThreshold', () => {
  it('base case: no agents, no ally → equals hex score', () => {
    const hex = makeAffinity({ life: 3 });
    expect(effectiveHexThreshold(hex, 'life', [])).toBe(3);
  });

  it('includes ally defense: Energy:3 with Life ally 4 → 3 + floor(4/2) = 5', () => {
    const hex = makeAffinity({ energy: 3, life: 4 });
    expect(effectiveHexThreshold(hex, 'energy', [])).toBe(5);
  });

  it('includes agent scores * AGENT_PRESENCE_RATIO (1.0): agent Life:3 → adds 3', () => {
    const hex = makeAffinity({ life: 2 });
    const agent = makeAffinity({ life: 3 });
    expect(effectiveHexThreshold(hex, 'life', [agent])).toBe(5);
  });

  it('multiple agents sum their contributions', () => {
    const hex = makeAffinity({ force: 1 });
    const a1 = makeAffinity({ force: 2 });
    const a2 = makeAffinity({ force: 3 });
    // ally of force = matter, both 0. threshold = 1 + 0 + 2 + 3 = 6
    expect(effectiveHexThreshold(hex, 'force', [a1, a2])).toBe(6);
  });
});

// ─── phaseSpherePressure (orchestrator phase) ───────────────────────

describe('phaseSpherePressure', () => {
  it('is a no-op when pendingSpherePressures is empty', () => {
    const affinity = makeAffinity({ life: 2 });
    const state = makeState('loc1', affinity, []);
    const result = phaseSpherePressure(state);
    // Should return empty partial (no updates needed)
    expect(result).toEqual({});
  });

  it('is a no-op when pendingSpherePressures is undefined', () => {
    const affinity = makeAffinity({ life: 2 });
    const state = makeState('loc1', affinity);
    delete (state as unknown as { pendingSpherePressures?: unknown }).pendingSpherePressures;
    const result = phaseSpherePressure(state);
    expect(result).toEqual({});
  });

  it('updates entity sphere affinity in graph', () => {
    const affinity = makeAffinity({ life: 0 });
    const pressures = [makePressure('loc1', 'life', 1)];
    const state = makeState('loc1', affinity, pressures);
    const result = phaseSpherePressure(state);
    // Result should have updated graph
    expect(result.graph).toBeDefined();
    const updatedNode = result.graph!.getNode('loc1');
    const updatedAffinity = updatedNode?.properties.sphereAffinity as SphereAffinity;
    expect(updatedAffinity.scores.life).toBe(1); // leveled up
  });

  it('clears pendingSpherePressures in result', () => {
    const affinity = makeAffinity({ life: 0 });
    const pressures = [makePressure('loc1', 'life', 1)];
    const state = makeState('loc1', affinity, pressures);
    const result = phaseSpherePressure(state);
    expect(result.pendingSpherePressures).toEqual([]);
  });

  it('skips entities with no sphereAffinity (fail-soft)', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'loc1', type: 'location', name: 'Test', properties: {} });
    const state = {
      tick: 1,
      graph,
      pendingSpherePressures: [makePressure('loc1', 'life', 5)],
    } as unknown as GameState;
    expect(() => phaseSpherePressure(state)).not.toThrow();
  });

  it('skips unknown entity IDs (fail-soft)', () => {
    const affinity = makeAffinity({ life: 2 });
    const pressures = [makePressure('nonexistent', 'life', 5)];
    const state = makeState('loc1', affinity, pressures);
    expect(() => phaseSpherePressure(state)).not.toThrow();
  });

  it('uses agent presence buffer for location nodes', () => {
    // An agent at the same location boosts effective defense
    const hexAffinity = makeAffinity({ energy: 2 });
    const agentAffinity = makeAffinity({ energy: 5 }); // strong energy agent
    // Force pressure 5 against energy:2, no agent: threshold=2, excess=3, erodes
    // With agent energy:5: threshold = 2+5=7 (plus ally), pressure 5 <= 7 → absorbed
    const pressures = [makePressure('loc1', 'force', 5)]; // force is opposite of energy
    const state = makeState('loc1', hexAffinity, pressures, [
      { id: 'agent1', affinity: agentAffinity }
    ]);
    const result = phaseSpherePressure(state);
    const updatedNode = result.graph!.getNode('loc1');
    const updatedAffinity = updatedNode?.properties.sphereAffinity as SphereAffinity;
    // Energy should be absorbed (not eroded) because agent boosts threshold
    expect(updatedAffinity.scores.energy).toBe(2);
  });
});
