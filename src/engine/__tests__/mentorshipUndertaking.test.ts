// src/engine/__tests__/mentorshipUndertaking.test.ts
//
// Tests for the mentorship fold (THR-1292 §3).
//
// The retired `phaseMentorship` shipped with **zero** test coverage and was dead
// behind the initiative wealth floor, so there is no prior suite to port. These
// tests are written against the behaviour the plan says to preserve, and two of
// them exist specifically to prove the fold did *not* reproduce a defect the
// retired phase carried.

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import type { GraphNode } from '../../types/graph';
import type { StrategicProjectRuntime, UndertakingCheckpointEffect } from '../../types/strategicAction';
import {
  findEligibleApprentices,
  hasActiveMentorship,
  bootstrapMentorship,
  advanceMentorshipCheckpoint,
  driftBondFromCheckpoint,
  resolveMentorshipUndertaking,
  applyPendingMentorshipSevers,
  MENTORSHIP_TEMPLATE_ID,
} from '../mentorshipUndertaking';
import {
  MENTOR_MIN_TIER,
  BOND_DRIFT_ON_SUCCESS,
  BOND_DRIFT_ON_FAILURE,
  MENTORSHIP_MAX_SEPARATION_HEXES,
} from '../../data/mentorship-constants';

// ─── Fixtures ────────────────────────────────────────────────────────
//
// Capabilities are chosen by running them through the real `computeTier` rather
// than by picking numbers that look right: `MENTOR_MIN_TIER` is 6 on a sigmoid
// that saturates, so a "high" value guessed by eye can silently land a tier below
// the floor and make every test in the file vacuous.

function makeActor(
  graph: WorldGraph,
  id: string,
  heart: number,
  locationId: string,
): GraphNode {
  graph.addNode({
    id,
    name: id,
    type: 'actor',
    properties: {
      actorType: 'individual',
      domainCapabilities: {
        gold: 0, eye: 0, heart, shadow: 0,
        iron: 0, stone: 0, star: 0, veil: 0, flesh: 0,
      },
    },
  });
  graph.addEdge({
    id: `located_${id}`,
    source: id,
    target: locationId,
    type: 'located_at',
    properties: {},
  });
  return graph.getNode(id)!;
}

function makeLocation(graph: WorldGraph, id: string, col: number, row: number): void {
  graph.addNode({
    id,
    name: id,
    type: 'location',
    properties: { locationSubtype: 'town', hexCol: col, hexRow: row },
  });
}

/**
 * A mentor comfortably above the tier floor and an apprentice inside the band.
 *
 * The raw values are measured, not guessed: `computeCapability` is a sigmoid that
 * saturates near raw 20, and `computeTier` is `ceil(cap * 10)`. So raw 40 → tier 10
 * (clears MENTOR_MIN_TIER 6) and raw 7 → tier 3 (inside APPRENTICE_MIN/MAX 2–4).
 * The first draft used raw 3 for the apprentice, which is **tier 1** — below the
 * band — and every eligibility test in this file failed for that reason rather than
 * for anything about the code.
 */
function buildPairGraph(): WorldGraph {
  const graph = new WorldGraph();
  makeLocation(graph, 'loc_town', 5, 5);
  makeActor(graph, 'mentor', 40, 'loc_town');
  makeActor(graph, 'apprentice', 7, 'loc_town');
  return graph;
}

function makeProject(overrides: Partial<StrategicProjectRuntime> = {}): StrategicProjectRuntime {
  return {
    projectId: 'proj_mentor_1',
    actorId: 'mentor',
    templateId: MENTORSHIP_TEMPLATE_ID,
    ambitionId: 'ambition_master_craft',
    verb: 'change',
    behaviorFamily: 'scholar-seeker',
    progress: 0,
    progressRequired: 8,
    startedTick: 0,
    lastProgressTick: 0,
    status: 'active',
    ...overrides,
  };
}

const constRng = () => 0;

// ─── Eligibility — the single copy ───────────────────────────────────

describe('mentorship eligibility', () => {
  it('finds a colocated apprentice inside the tier band', () => {
    const graph = buildPairGraph();
    const picks = findEligibleApprentices(graph, 'mentor');
    expect(picks.length).toBeGreaterThan(0);
    expect(picks.every(p => p.apprenticeId === 'apprentice')).toBe(true);
  });

  it('excludes non-individual actors', () => {
    const graph = buildPairGraph();
    graph.getNode('apprentice')!.properties.actorType = 'group';
    expect(findEligibleApprentices(graph, 'mentor')).toEqual([]);
  });

  it('excludes an apprentice who already has an active mentorship', () => {
    const graph = buildPairGraph();
    graph.addEdge({
      id: 'mentors_other',
      source: 'mentor',
      target: 'apprentice',
      type: 'mentors',
      properties: { phase: 'training' },
    });
    expect(hasActiveMentorship(graph, 'apprentice')).toBe(true);
    expect(findEligibleApprentices(graph, 'mentor')).toEqual([]);
  });

  it('does not exclude an apprentice whose past mentorship has graduated', () => {
    const graph = buildPairGraph();
    graph.addEdge({
      id: 'mentors_old',
      source: 'mentor',
      target: 'apprentice',
      type: 'mentors',
      properties: { phase: 'graduated' },
    });
    expect(hasActiveMentorship(graph, 'apprentice')).toBe(false);
    expect(findEligibleApprentices(graph, 'mentor').length).toBeGreaterThan(0);
  });

  it('finds nobody when the mentor is below the tier floor', () => {
    const graph = new WorldGraph();
    makeLocation(graph, 'loc_town', 5, 5);
    // Both at tier 3: the apprentice is squarely IN the band, so the mentor floor is
    // the only thing that can exclude them. With both at tier 1 this passed vacuously.
    makeActor(graph, 'mentor', 7, 'loc_town');
    makeActor(graph, 'apprentice', 7, 'loc_town');
    expect(findEligibleApprentices(graph, 'mentor')).toEqual([]);
  });

  it('finds nobody when the candidate is at a different location', () => {
    const graph = new WorldGraph();
    makeLocation(graph, 'loc_town', 5, 5);
    makeLocation(graph, 'loc_far', 12, 12);
    makeActor(graph, 'mentor', 40, 'loc_town');
    makeActor(graph, 'apprentice', 7, 'loc_far');
    expect(findEligibleApprentices(graph, 'mentor')).toEqual([]);
  });

  // Guards the fixture itself: if MENTOR_MIN_TIER were unreachable by the numbers
  // above, every test in this describe would pass by finding nothing.
  it('the fixture mentor really does clear the tier floor', () => {
    expect(MENTOR_MIN_TIER).toBeGreaterThan(0);
    const graph = buildPairGraph();
    expect(findEligibleApprentices(graph, 'mentor').length).toBeGreaterThan(0);
  });
});

// ─── Bootstrap ───────────────────────────────────────────────────────

describe('mentorship bootstrap', () => {
  it('mints a mentors edge keyed to the undertaking', () => {
    const graph = buildPairGraph();
    const boot = bootstrapMentorship(graph, makeProject(), 3, constRng);
    expect(boot).not.toBeNull();
    expect(boot!.edge.properties.undertakingId).toBe('proj_mentor_1');
    expect(boot!.edge.properties.phase).toBe('offered');
    expect(boot!.edge.source).toBe('mentor');
    expect(boot!.edge.target).toBe('apprentice');
  });

  it('plants the offer seed with its load-bearing seed label', () => {
    const graph = buildPairGraph();
    const boot = bootstrapMentorship(graph, makeProject(), 3, constRng)!;
    expect(boot.seeds).toHaveLength(1);
    expect(boot.seeds[0].templateId).toBe('mentorship.the-offer');
    expect(boot.seeds[0].seedLabel).toBe('mentorship_offer');
    expect(boot.seeds[0].targetAgentId).toBe('apprentice');
  });

  it('returns null when there is nobody to teach', () => {
    const graph = new WorldGraph();
    makeLocation(graph, 'loc_town', 5, 5);
    makeActor(graph, 'mentor', 40, 'loc_town');
    expect(bootstrapMentorship(graph, makeProject(), 3, constRng)).toBeNull();
  });

  it('seeds bond quality from an existing relationship when there is one', () => {
    const graph = buildPairGraph();
    graph.addEdge({
      id: 'rel_1',
      source: 'mentor',
      target: 'apprentice',
      type: 'relates_to',
      properties: { sentiment: 0.5 },
    });
    const boot = bootstrapMentorship(graph, makeProject(), 3, constRng)!;
    expect(boot.edge.properties.bondQuality).toBeCloseTo(0.5, 5);
  });
});

// ─── Bond drift reads the band ───────────────────────────────────────

describe('bond drift', () => {
  // Totality over the effect union, asserted rather than re-typed: a new effect
  // added to `UndertakingCheckpointEffect` must be given a drift here.
  const EFFECTS: UndertakingCheckpointEffect[] = ['advance', 'advance_at_cost', 'halt'];

  it('is defined for every checkpoint effect', () => {
    for (const effect of EFFECTS) {
      expect(Number.isFinite(driftBondFromCheckpoint(0, effect))).toBe(true);
    }
  });

  it('advancing raises the bond and halting lowers it', () => {
    expect(driftBondFromCheckpoint(0, 'advance')).toBeCloseTo(BOND_DRIFT_ON_SUCCESS, 5);
    expect(driftBondFromCheckpoint(0, 'halt')).toBeCloseTo(-BOND_DRIFT_ON_FAILURE, 5);
  });

  it('advance_at_cost still drifts upward — the lesson landed', () => {
    expect(driftBondFromCheckpoint(0, 'advance_at_cost')).toBeGreaterThan(0);
  });

  it('clamps to [-1, 1]', () => {
    expect(driftBondFromCheckpoint(1, 'advance')).toBeLessThanOrEqual(1);
    expect(driftBondFromCheckpoint(-1, 'halt')).toBeGreaterThanOrEqual(-1);
  });
});

// ─── Checkpoint advancement ──────────────────────────────────────────

describe('mentorship checkpoint advancement', () => {
  function bootstrapped(): { graph: WorldGraph; project: StrategicProjectRuntime } {
    const graph = buildPairGraph();
    const project = makeProject();
    bootstrapMentorship(graph, project, 0, constRng);
    return { graph, project };
  }

  it('flips offered → training on first progress', () => {
    const { graph, project } = bootstrapped();
    advanceMentorshipCheckpoint(graph, { ...project, progress: 2 }, 'advance', 6);
    const edge = graph.getOutgoingEdges('mentor', 'mentors')[0];
    expect(edge.properties.phase).toBe('training');
  });

  it('projects undertaking progress onto the edge', () => {
    const { graph, project } = bootstrapped();
    advanceMentorshipCheckpoint(graph, { ...project, progress: 4, progressRequired: 8 }, 'advance', 6);
    const edge = graph.getOutgoingEdges('mentor', 'mentors')[0];
    expect(edge.properties.progress).toBeCloseTo(0.5, 5);
  });

  it('drifts the bond down on a halt', () => {
    const { graph, project } = bootstrapped();
    const before = graph.getOutgoingEdges('mentor', 'mentors')[0].properties.bondQuality as number;
    advanceMentorshipCheckpoint(graph, { ...project, progress: 2 }, 'halt', 6);
    const after = graph.getOutgoingEdges('mentor', 'mentors')[0].properties.bondQuality as number;
    expect(after).toBeLessThan(before);
  });

  it('fires a milestone seed when progress crosses a threshold', () => {
    const { graph, project } = bootstrapped();
    const r = advanceMentorshipCheckpoint(graph, { ...project, progress: 3, progressRequired: 8 }, 'advance', 6);
    expect(r.seeds.map(s => s.templateId)).toContain('mentorship.first-lesson');
    expect(r.seeds.map(s => s.seedLabel)).toContain('mentorship_lesson_1');
  });

  it('does not re-fire a milestone already crossed', () => {
    const { graph, project } = bootstrapped();
    advanceMentorshipCheckpoint(graph, { ...project, progress: 3, progressRequired: 8 }, 'advance', 6);
    const second = advanceMentorshipCheckpoint(graph, { ...project, progress: 4, progressRequired: 8 }, 'advance', 12);
    expect(second.seeds.map(s => s.seedLabel)).not.toContain('mentorship_lesson_1');
  });

  it('ends the arc when the pair separates beyond the limit', () => {
    const { graph, project } = bootstrapped();
    makeLocation(graph, 'loc_far', 5 + MENTORSHIP_MAX_SEPARATION_HEXES + 3, 5);
    const edge = graph.getOutgoingEdges('apprentice', 'located_at')[0];
    graph.removeEdge(edge.id);
    graph.addEdge({
      id: 'located_apprentice_2',
      source: 'apprentice',
      target: 'loc_far',
      type: 'located_at',
      properties: {},
    });
    const r = advanceMentorshipCheckpoint(graph, { ...project, progress: 2 }, 'advance', 6);
    expect(r.forceFailReason).toBe('apprentice_separation');
  });

  // Death sets `deceased` rather than removing the node — THR-479 keeps mythic echoes
  // in the graph forever. The first draft of this test called `removeNode`, which takes
  // the mentors edge with it, so the branch had nothing left to inspect and the test
  // was asserting against an unreachable path.
  it('ends the arc when the apprentice dies', () => {
    const { graph, project } = bootstrapped();
    graph.getNode('apprentice')!.properties.deceased = true;
    const r = advanceMentorshipCheckpoint(graph, { ...project, progress: 2 }, 'advance', 6);
    expect(r.forceFailReason).toBe('participant_lost');
  });

  it('ends the arc when the mentor dies', () => {
    const { graph, project } = bootstrapped();
    graph.getNode('mentor')!.properties.deceased = true;
    const r = advanceMentorshipCheckpoint(graph, { ...project, progress: 2 }, 'advance', 6);
    expect(r.forceFailReason).toBe('participant_lost');
    expect(graph.getOutgoingEdges('mentor', 'mentors')[0].properties.phase).toBe('estranged');
  });

  it('is inert on an already-terminal edge', () => {
    const { graph, project } = bootstrapped();
    graph.getOutgoingEdges('mentor', 'mentors')[0].properties.phase = 'graduated';
    const r = advanceMentorshipCheckpoint(graph, { ...project, progress: 4 }, 'advance', 6);
    expect(r.forceFailReason).toBeUndefined();
    expect(r.seeds).toEqual([]);
  });
});

// ─── Divine sever ────────────────────────────────────────────────────

describe('divine sever', () => {
  it('translates the agent flag onto the active edge and consumes it', () => {
    const graph = buildPairGraph();
    bootstrapMentorship(graph, makeProject(), 0, constRng);
    graph.getNode('apprentice')!.properties.pendingMentorshipSever = true;

    applyPendingMentorshipSevers(graph);

    expect(graph.getOutgoingEdges('mentor', 'mentors')[0].properties.severedByDivineWill).toBe(true);
    expect(graph.getNode('apprentice')!.properties.pendingMentorshipSever).toBeUndefined();
  });

  it('ends the undertaking at the next checkpoint', () => {
    const graph = buildPairGraph();
    const project = makeProject();
    bootstrapMentorship(graph, project, 0, constRng);
    graph.getNode('mentor')!.properties.pendingMentorshipSever = true;
    applyPendingMentorshipSevers(graph);

    const r = advanceMentorshipCheckpoint(graph, { ...project, progress: 2 }, 'advance', 6);
    expect(r.forceFailReason).toBe('divine_sever');
  });
});

// ─── The two defects the fold must not reproduce ─────────────────────

describe('rewires that fix retired-phase defects', () => {
  // The retired phase inferred completion from the backing initiative having
  // *vanished* (`phaseMentorship.ts:253-259`), so a record cleared for any reason —
  // including a fail-soft catch — resolved as a graduation-eligible completion.
  // The fold takes the verdict as an argument, so there is no absence to misread.
  it('a failed undertaking resolves as a failure, not a completion', () => {
    const graph = buildPairGraph();
    const project = makeProject();
    bootstrapMentorship(graph, project, 0, constRng);
    // Give it a bond that WOULD graduate, so a mis-read status is visible.
    graph.getOutgoingEdges('mentor', 'mentors')[0].properties.bondQuality = 0.9;
    graph.getOutgoingEdges('mentor', 'mentors')[0].properties.progress = 1;

    resolveMentorshipUndertaking(graph, project, 'failed', 20);

    const edge = graph.getOutgoingEdges('mentor', 'mentors')[0];
    // Dissolution estranges; a graduation would have set 'graduated'.
    expect(edge.properties.phase).toBe('estranged');
  });

  it('a completed undertaking with a strong bond does graduate', () => {
    const graph = buildPairGraph();
    const project = makeProject();
    bootstrapMentorship(graph, project, 0, constRng);
    const edge = graph.getOutgoingEdges('mentor', 'mentors')[0];
    edge.properties.bondQuality = 0.9;
    edge.properties.progress = 1;

    resolveMentorshipUndertaking(graph, project, 'completed', 20);

    expect(graph.getOutgoingEdges('mentor', 'mentors')[0].properties.phase).toBe('graduated');
  });

  // The retired `markInitiativeFailed` set `status: 'failed'` on the initiative and
  // trusted a phase that only ever cleaned up its own failures — leaving a
  // permanently non-active record pinned to the agent, blocking every future one.
  // The fold clears the undertaking's edge link at the terminal arc instead.
  it('a terminal arc releases the edge so the agent is not blocked', () => {
    const graph = buildPairGraph();
    const project = makeProject();
    bootstrapMentorship(graph, project, 0, constRng);

    resolveMentorshipUndertaking(graph, project, 'failed', 20);

    const edge = graph.getOutgoingEdges('mentor', 'mentors')[0];
    expect(edge.properties.undertakingId).toBeUndefined();
    // And the apprentice is free to be taught again.
    expect(hasActiveMentorship(graph, 'apprentice')).toBe(false);
  });

  it('resolving twice is inert rather than double-granting', () => {
    const graph = buildPairGraph();
    const project = makeProject();
    bootstrapMentorship(graph, project, 0, constRng);
    graph.getOutgoingEdges('mentor', 'mentors')[0].properties.progress = 1;

    const first = resolveMentorshipUndertaking(graph, project, 'completed', 20);
    const second = resolveMentorshipUndertaking(graph, project, 'completed', 21);

    expect(first.events.length + first.seeds.length).toBeGreaterThan(0);
    expect(second.events).toEqual([]);
    expect(second.seeds).toEqual([]);
  });
});
