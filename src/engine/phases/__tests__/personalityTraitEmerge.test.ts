import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../../graph';
import type { GameState } from '../../../types/gameState';
import type { AxiologicalProfile } from '../../../types/agent';
import { getTraitsForNode } from '../../traits';
import {
  enableTracing,
  disableTracing,
  clearTraces,
  getTraces,
} from '../../traceBuffer';
import { processPersonalityTraitEmergence } from '../personalityTraitEmerge';
import { PERSONALITY_TRAIT_DEFINITIONS } from '../../../data/personality-trait-content';

const IRON_VIRTUE = 'trait.personality.iron.virtue'; // "Brave"
const IRON_VICE = 'trait.personality.iron.vice'; // "Power-Hungry"
const ASCENDANT_ID = 'ascendant';

function makeActor(
  graph: WorldGraph,
  id: string,
  name: string,
  profile: Partial<AxiologicalProfile>,
): void {
  graph.addNode({
    id,
    type: 'actor',
    name,
    properties: { actorType: 'individual', axiologicalProfile: profile },
  });
}

function makeState(graph: WorldGraph, tick = 5): GameState {
  return { graph, tick, ascendantId: ASCENDANT_ID } as unknown as GameState;
}

function heldTraitIds(graph: WorldGraph, actorId: string): string[] {
  return getTraitsForNode(graph, actorId).map((e) => e.target);
}

describe('processPersonalityTraitEmergence', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
    clearTraces();
  });

  it('authors 16 personality trait definitions (8 axes × 2 poles)', () => {
    expect(PERSONALITY_TRAIT_DEFINITIONS).toHaveLength(16);
    // Every personality trait must carry scoringModifiers and NO domainContributions
    // (capability invariant) — personality steers selection, never competence.
    for (const def of PERSONALITY_TRAIT_DEFINITIONS) {
      const props = def.properties as Record<string, unknown>;
      expect(props.subcategory).toBe('personality');
      expect(props.scoringModifiers).toBeTruthy();
      expect(Object.keys(props.domainContributions as object)).toHaveLength(0);
    }
  });

  it('grants the virtue trait when the live position crosses the virtue threshold', () => {
    // value +0.7 → pos 0.85 ≥ 0.8 (virtue threshold)
    makeActor(graph, 'a1', 'Thorin', { mercy_ruthlessness: 0.7 });
    const result = processPersonalityTraitEmergence(makeState(graph));

    expect(heldTraitIds(graph, 'a1')).toContain(IRON_VIRTUE);
    expect(result.granted).toBe(1);
    expect(result.events).toHaveLength(1);
    expect(result.events[0].type).toBe('personality_trait_emerged');
    expect(result.events[0].message).toBe('Thorin has become Brave.');
    expect(result.events[0].actorId).toBe('a1');
  });

  it('grants the vice trait when the live position crosses the vice threshold', () => {
    // value −0.7 → pos 0.15 ≤ 0.2 (vice threshold)
    makeActor(graph, 'a1', 'Mara', { mercy_ruthlessness: -0.7 });
    const result = processPersonalityTraitEmergence(makeState(graph));

    expect(heldTraitIds(graph, 'a1')).toContain(IRON_VICE);
    expect(result.events[0].message).toBe('Mara has become Power-Hungry.');
  });

  it('does not grant a trait for a neutral position', () => {
    makeActor(graph, 'a1', 'Even', { mercy_ruthlessness: 0.0 });
    const result = processPersonalityTraitEmergence(makeState(graph));

    expect(heldTraitIds(graph, 'a1')).not.toContain(IRON_VIRTUE);
    expect(heldTraitIds(graph, 'a1')).not.toContain(IRON_VICE);
    expect(result.granted).toBe(0);
  });

  it('holds a granted trait within the hysteresis dead-band, then releases past it', () => {
    // Grant at 0.7 (pos 0.85).
    makeActor(graph, 'a1', 'Thorin', { mercy_ruthlessness: 0.7 });
    processPersonalityTraitEmergence(makeState(graph));
    expect(heldTraitIds(graph, 'a1')).toContain(IRON_VIRTUE);

    // Drift down to 0.35 → pos 0.675, above the 0.65 release floor → still held.
    const node = graph.getNode('a1')!;
    (node.properties.axiologicalProfile as AxiologicalProfile).mercy_ruthlessness = 0.35;
    const held = processPersonalityTraitEmergence(makeState(graph, 6));
    expect(heldTraitIds(graph, 'a1')).toContain(IRON_VIRTUE);
    expect(held.released).toBe(0);

    // Drift down to 0.25 → pos 0.625, below the 0.65 release floor → released.
    (node.properties.axiologicalProfile as AxiologicalProfile).mercy_ruthlessness = 0.25;
    const released = processPersonalityTraitEmergence(makeState(graph, 7));
    expect(heldTraitIds(graph, 'a1')).not.toContain(IRON_VIRTUE);
    expect(released.released).toBe(1);
  });

  it('is idempotent — re-running does not re-grant or duplicate edges', () => {
    makeActor(graph, 'a1', 'Thorin', { mercy_ruthlessness: 0.7 });
    processPersonalityTraitEmergence(makeState(graph));
    const second = processPersonalityTraitEmergence(makeState(graph, 6));

    expect(second.granted).toBe(0);
    expect(second.events).toHaveLength(0);
    expect(heldTraitIds(graph, 'a1').filter((id) => id === IRON_VIRTUE)).toHaveLength(1);
  });

  it('excludes the ascendant (personality is a mortal-agent layer)', () => {
    makeActor(graph, ASCENDANT_ID, 'The God', { mercy_ruthlessness: 0.9 });
    const result = processPersonalityTraitEmergence(makeState(graph));

    expect(heldTraitIds(graph, ASCENDANT_ID)).toHaveLength(0);
    expect(result.granted).toBe(0);
  });

  it('skips agents with no axiological profile (fail-soft)', () => {
    graph.addNode({ id: 'a1', type: 'actor', name: 'Blank', properties: { actorType: 'individual' } });
    expect(() => processPersonalityTraitEmergence(makeState(graph))).not.toThrow();
    expect(heldTraitIds(graph, 'a1')).toHaveLength(0);
  });

  it('emits a personality_trait_emerged trace on grant', () => {
    enableTracing();
    try {
      makeActor(graph, 'a1', 'Thorin', { mercy_ruthlessness: 0.7 });
      processPersonalityTraitEmergence(makeState(graph));
      const traces = getTraces().filter((t) => t.category === 'personality_trait_emerged');
      expect(traces.length).toBeGreaterThanOrEqual(1);
      expect(traces[0].actorId).toBe('a1');
    } finally {
      disableTracing();
      clearTraces();
    }
  });

  it('releases the opposite pole if it was somehow held when crossing a threshold', () => {
    // Force an inconsistent prior state: hold the vice trait, then push the
    // position to the virtue pole. The phase grants virtue and the vice trait
    // is released on the same pass it drops out of the dead-band.
    makeActor(graph, 'a1', 'Thorin', { mercy_ruthlessness: -0.7 });
    processPersonalityTraitEmergence(makeState(graph)); // grants vice
    expect(heldTraitIds(graph, 'a1')).toContain(IRON_VICE);

    const node = graph.getNode('a1')!;
    (node.properties.axiologicalProfile as AxiologicalProfile).mercy_ruthlessness = 0.7;
    processPersonalityTraitEmergence(makeState(graph, 6));
    expect(heldTraitIds(graph, 'a1')).toContain(IRON_VIRTUE);
    expect(heldTraitIds(graph, 'a1')).not.toContain(IRON_VICE);
  });
});
