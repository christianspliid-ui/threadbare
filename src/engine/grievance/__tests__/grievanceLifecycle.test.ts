/**
 * The grievance lifecycle — THR-1298 slice 5.
 *
 * Slices 1–4 proved a harm *mints* a drive. This file proves the rules that decide
 * whether it should, whose it becomes, and how it ends — the policy that keeps one
 * razed village from turning a region into a revenge monoculture.
 *
 * Every refusal below is paired with the arm that *does* write, on the same fixture
 * with one field changed. A test that only asserts "no grievance was written" would
 * pass just as happily against a routing function nobody called, or against a fixture
 * too impoverished to mint under any circumstances — the vacuous shape this suite is
 * built to avoid.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../graph';
import {
  resolveGrievanceDisposition,
  decayGrievance,
  findActiveGrievanceEdge,
  type GrievanceSeed,
} from '../grievanceLifecycle';
import { hasGrudge } from '../grudgeEdge';
import {
  GRIEVANCE_CHAIN_DEPTH_MAX,
  GRIEVANCE_COOL_THRESHOLD,
  GRIEVANCE_HEAT_DECAY_PER_CHECK,
  GRIEVANCE_REIGNITION_BOOST,
  GRIEVANCE_REPLACE_RATIO,
} from '../../../data/grievance-constants';

const VICTIM = 'actor_victim';
const CULPRIT = 'actor_culprit';
const HEIR = 'actor_heir';
const RIVAL_HEIR = 'actor_rival_heir';
const AMBITION_NODE = 'ambition.ambition_seek_revenge';

function addActor(
  graph: WorldGraph,
  id: string,
  props: Record<string, unknown> = {},
): void {
  graph.addNode({
    id,
    name: id,
    type: 'actor',
    properties: { actorType: 'individual', spotlightTier: 'spotlight', ...props },
  });
}

/** A spotlight victim, a culprit, and the shared ambition node a mint would target. */
function world(): WorldGraph {
  const graph = new WorldGraph();
  addActor(graph, VICTIM);
  addActor(graph, CULPRIT);
  graph.addNode({
    id: AMBITION_NODE,
    name: 'Seek Revenge',
    type: 'ambition',
    properties: { templateId: 'ambition_seek_revenge' },
  });
  return graph;
}

function seed(overrides: Partial<GrievanceSeed> = {}): GrievanceSeed {
  return { culpritAgentId: CULPRIT, harmMagnitude: 0.6, chainDepth: 0, ...overrides };
}

/** Put an active grievance on the victim, as a prior mint would have. */
function giveStandingGrievance(graph: WorldGraph, magnitude: number, heat: number): void {
  graph.addEdge({
    id: `pursues_${VICTIM}_${AMBITION_NODE}`,
    source: VICTIM,
    target: AMBITION_NODE,
    type: 'pursues',
    properties: {
      priority: 'primary',
      status: 'active',
      assignedTick: 0,
      completedMilestones: [],
      grievance: true,
      culpritAgentId: CULPRIT,
      harmMagnitude: magnitude,
      chainDepth: 0,
      heat,
    },
  });
}

describe('grievance routing — who gets a drive and who gets a grudge', () => {
  it('mints a drive for a spotlight victim', () => {
    const graph = world();
    const d = resolveGrievanceDisposition(graph, VICTIM, seed(), 10);

    expect(d.write).toBe(true);
    if (!d.write) return;
    expect(d.holderId).toBe(VICTIM);
    expect(d.outcome).toBe('minted');
    expect(d.properties.culpritAgentId).toBe(CULPRIT);
    expect(d.properties.heat).toBeGreaterThan(0);
  });

  it('gives an ambient victim a grudge edge instead of a drive it could never act on', () => {
    const graph = world();
    // The ONE field that differs from the minting arm above.
    graph.updateNode(VICTIM, {
      properties: { ...graph.getNode(VICTIM)!.properties, spotlightTier: 'ambient' },
    });

    const d = resolveGrievanceDisposition(graph, VICTIM, seed(), 10);

    expect(d.write).toBe(false);
    expect(d.outcome).toBe('grudge_only');
    expect(hasGrudge(graph, VICTIM, CULPRIT)).toBe(true);
  });

  it('stops the chain past the depth cap even for a spotlight victim', () => {
    const graph = world();
    const atCap = resolveGrievanceDisposition(
      graph, VICTIM, seed({ chainDepth: GRIEVANCE_CHAIN_DEPTH_MAX }), 10,
    );
    expect(atCap.write).toBe(true);

    // Same spotlight victim, one link deeper — the tier did not change, the depth did.
    const past = resolveGrievanceDisposition(
      world(), VICTIM, seed({ chainDepth: GRIEVANCE_CHAIN_DEPTH_MAX + 1 }), 10,
    );
    expect(past.write).toBe(false);
    expect(past.outcome).toBe('grudge_only');
  });
});

describe('one slot — a second harm feeds or displaces, never queues', () => {
  it('feeds heat when the new harm does not decisively outweigh the standing one', () => {
    const graph = world();
    giveStandingGrievance(graph, 0.6, 0.5);

    // Just under the replacement bar, so this must feed rather than displace.
    const under = 0.6 * GRIEVANCE_REPLACE_RATIO - 0.01;
    const d = resolveGrievanceDisposition(graph, VICTIM, seed({ harmMagnitude: under }), 20);

    expect(d.write).toBe(false);
    expect(d.outcome).toBe('heat_fed');

    const standing = findActiveGrievanceEdge(graph, VICTIM);
    expect(standing).toBeDefined();
    // The point of feeding: the standing grievance is hotter than it was, and is still
    // the same grievance — not a second one queued behind it.
    expect(standing!.properties.heat as number).toBeGreaterThan(0.5);
    expect(standing!.properties.harmMagnitude).toBe(0.6);
    expect(
      graph.getOutgoingEdges(VICTIM, 'pursues')
        .filter(e => e.properties.status === 'active' && e.properties.grievance === true),
    ).toHaveLength(1);
  });

  it('displaces the standing grievance when the new harm clears the ratio', () => {
    const graph = world();
    giveStandingGrievance(graph, 0.4, 0.5);

    // Just over the bar — the boundary's other side, same fixture.
    const over = 0.4 * GRIEVANCE_REPLACE_RATIO + 0.01;
    const d = resolveGrievanceDisposition(graph, VICTIM, seed({ harmMagnitude: over }), 20);

    expect(d.write).toBe(true);
    if (!d.write) return;
    expect(d.outcome).toBe('replaced');
    expect(d.properties.harmMagnitude).toBeCloseTo(over, 5);

    // The displaced drive closed, and is remembered as a grudge rather than erased.
    const old = graph.getOutgoingEdges(VICTIM, 'pursues')
      .find(e => e.id === `pursues_${VICTIM}_${AMBITION_NODE}`);
    expect(old!.properties.status).toBe('abandoned');
    expect(old!.properties.resolvedTick).toBe(20);
    expect(hasGrudge(graph, VICTIM, CULPRIT)).toBe(true);
  });
});

describe('succession — a dead victim passes the vendetta to their closest bond', () => {
  function worldWithHeirs(): WorldGraph {
    const graph = world();
    addActor(graph, HEIR);
    addActor(graph, RIVAL_HEIR);
    graph.updateNode(VICTIM, {
      properties: { ...graph.getNode(VICTIM)!.properties, deceased: true },
    });
    // The weaker bond is added FIRST, so passing would require ordering by strength
    // rather than by insertion.
    graph.addEdge({
      id: 'rel_victim_rival', source: VICTIM, target: RIVAL_HEIR,
      type: 'relates_to', properties: { strength: 0.3 },
    });
    graph.addEdge({
      id: 'rel_victim_heir', source: VICTIM, target: HEIR,
      type: 'relates_to', properties: { strength: 0.9 },
    });
    return graph;
  }

  it('passes it to the strongest positive bond, not the first one found', () => {
    const graph = worldWithHeirs();
    const d = resolveGrievanceDisposition(graph, VICTIM, seed(), 30);

    expect(d.write).toBe(true);
    if (!d.write) return;
    expect(d.holderId).toBe(HEIR);
    expect(d.outcome).toBe('succeeded_to_bond');
    expect(d.properties.culpritAgentId).toBe(CULPRIT);
  });

  it('never makes the culprit their own victim by inheritance', () => {
    const graph = worldWithHeirs();
    // The culprit is the dead victim's strongest bond — a betrayal by an intimate.
    graph.addEdge({
      id: 'rel_victim_culprit', source: VICTIM, target: CULPRIT,
      type: 'relates_to', properties: { strength: 1 },
    });

    const d = resolveGrievanceDisposition(graph, VICTIM, seed(), 30);

    expect(d.write).toBe(true);
    if (!d.write) return;
    expect(d.holderId).toBe(HEIR);
  });

  it('ends the chain when nobody survives to carry it', () => {
    const graph = world();
    graph.updateNode(VICTIM, {
      properties: { ...graph.getNode(VICTIM)!.properties, deceased: true },
    });

    const d = resolveGrievanceDisposition(graph, VICTIM, seed(), 30);

    expect(d.write).toBe(false);
    expect(d.outcome).toBe('chain_ended');
  });
});

describe('re-ignition — the second betrayal burns hotter than the first', () => {
  it('opens hotter when a grudge already stands between the pair', () => {
    const cold = resolveGrievanceDisposition(world(), VICTIM, seed(), 10);

    const withHistory = world();
    withHistory.addEdge({
      id: `e_hostile_to_${VICTIM}_${CULPRIT}`, source: VICTIM, target: CULPRIT,
      type: 'hostile_to', properties: { since: 1, cause: 'grievance_cooled' },
    });
    const hot = resolveGrievanceDisposition(withHistory, VICTIM, seed(), 10);

    expect(cold.write && hot.write).toBe(true);
    if (!cold.write || !hot.write) return;
    expect(hot.outcome).toBe('reignited');
    // The controlled arm actually perturbed the number it claims to: a magnitude of
    // 0.6 boosted by 1.5 is 0.9, still under the 1.0 ceiling, so the boost is visible
    // rather than clamped away.
    expect(hot.properties.heat).toBeCloseTo(cold.properties.heat * GRIEVANCE_REIGNITION_BOOST, 5);
    expect(hot.properties.heat).toBeGreaterThan(cold.properties.heat);
  });
});

describe('cooling — heat decays on the milestone pass and the drive becomes a grudge', () => {
  it('cools without demoting while the grievance is still hot', () => {
    const graph = world();
    giveStandingGrievance(graph, 0.8, 0.8);
    const edge = findActiveGrievanceEdge(graph, VICTIM)!;

    const demoted = decayGrievance(graph, edge, VICTIM, 45);

    expect(demoted).toBe(false);
    const after = findActiveGrievanceEdge(graph, VICTIM);
    expect(after!.properties.heat).toBeCloseTo(0.8 - GRIEVANCE_HEAT_DECAY_PER_CHECK, 5);
  });

  it('demotes to a standing grudge once it crosses the cooling threshold', () => {
    const graph = world();
    // One decay step above the threshold, so this pass is the one that crosses it.
    giveStandingGrievance(graph, 0.8, GRIEVANCE_COOL_THRESHOLD + GRIEVANCE_HEAT_DECAY_PER_CHECK / 2);
    const edge = findActiveGrievanceEdge(graph, VICTIM)!;

    const demoted = decayGrievance(graph, edge, VICTIM, 60);

    expect(demoted).toBe(true);
    expect(findActiveGrievanceEdge(graph, VICTIM)).toBeUndefined();
    const closed = graph.getOutgoingEdges(VICTIM, 'pursues')[0];
    expect(closed!.properties.status).toBe('abandoned');
    expect(closed!.properties.resolvedTick).toBe(60);
    // Letting it go is not the same as never having felt it.
    expect(hasGrudge(graph, VICTIM, CULPRIT)).toBe(true);
    expect(closed!.properties.culpritAgentId).toBe(CULPRIT);
  });

  it('leaves ordinary ambitions alone', () => {
    const graph = world();
    graph.addEdge({
      id: `pursues_${VICTIM}_${AMBITION_NODE}`,
      source: VICTIM, target: AMBITION_NODE, type: 'pursues',
      properties: { priority: 'primary', status: 'active', assignedTick: 0, completedMilestones: [] },
    });
    const edge = graph.getOutgoingEdges(VICTIM, 'pursues')[0]!;

    expect(decayGrievance(graph, edge, VICTIM, 45)).toBe(false);
    expect(graph.getOutgoingEdges(VICTIM, 'pursues')[0]!.properties.status).toBe('active');
    expect(graph.getOutgoingEdges(VICTIM, 'pursues')[0]!.properties.heat).toBeUndefined();
  });
});
