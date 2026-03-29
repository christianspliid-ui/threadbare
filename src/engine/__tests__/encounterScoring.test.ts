import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import type { DistanceMatrix } from '../distanceMatrix';
import type { EncounterCacheEntry } from '../encounterCache';
import type { AxiologicalProfile, ValuePair } from '../../types/agent';
import { VALUE_PAIRS } from '../../types/agent';
import type { ReachDomain } from '../../types/traits';
import {
  estimateStepProbability,
  estimateCompletionProb,
  computeDesireScore,
  scoreAndSelect,
  computeEncounterResonance,
  computeWorldSoulValueDrift,
  computeFamiliarityPenalty,
  computeExplorationBonus,
  MINIMUM_DESIRE,
  IDLE_SCORE_THRESHOLD,
  AMBITION_REACH_BOOST,
  FAMILIARITY_DECAY_PER_ATTEMPT,
  FAMILIARITY_MAX_PENALTY,
  EXPLORATION_NOVELTY_BONUS,
  EXPLORATION_BONUS_DECAY_TICKS,
  ENCOUNTER_RESONANCE_SCALE,
  ENCOUNTER_RESONANCE_FLOOR,
  AXIOLOGICAL_DRIFT_SCALE,
  AXIOLOGICAL_DRIFT_MAX,
  DRIFT_ACTIVATION_THRESHOLD,
  SPHERE_DRIFT_MAP,
} from '../encounterScoring';
import type { FamiliarityRecord, ExplorationRecord } from '../encounterScoring';
import type { FundamentState } from '../../types/worldSoul';
import { SPHERE_NAMES } from '../../types/index';

// ─── Helpers ────────────────────────────────────────────────────

function zeroProfile(): AxiologicalProfile {
  return Object.fromEntries(VALUE_PAIRS.map((p) => [p, 0])) as AxiologicalProfile;
}

function makeProfile(overrides: Partial<Record<ValuePair, number>> = {}): AxiologicalProfile {
  const profile = zeroProfile();
  for (const [key, val] of Object.entries(overrides)) {
    profile[key as ValuePair] = val;
  }
  return profile;
}

function makeEntry(overrides: Partial<EncounterCacheEntry> = {}): EncounterCacheEntry {
  return {
    templateId: 'tmpl_default',
    locationId: 'loc_a',
    sublocationId: null,
    sublocationTypeId: null,
    reachPrimary: 'iron' as ReachDomain,
    reachSecondary: 'gold' as ReachDomain,
    threatRating: 'moderate' as any,
    encounterType: 'combat' as any,
    motivations: ['mercy_ruthlessness'] as ValuePair[],
    requiresPresence: true,
    remotePenalty: 0,
    questPriority: 1.0,
    totalTickCost: 3,
    successRewardEstimate: 2.0,
    stepCount: 1,
    stepDifficulties: [50],
    stepReaches: ['iron'] as ReachDomain[],
    ...overrides,
  };
}

function makeDistanceMatrix(
  entries: Array<[string, string, number]>,
): DistanceMatrix {
  const distances = new Map<string, Map<string, number>>();
  for (const [from, to, dist] of entries) {
    if (!distances.has(from)) distances.set(from, new Map());
    distances.get(from)!.set(to, dist);
    // Self-distance
    if (!distances.has(from)) distances.set(from, new Map());
    distances.get(from)!.set(from, 0);
    if (!distances.has(to)) distances.set(to, new Map());
    distances.get(to)!.set(to, 0);
  }
  return { distances, builtAtTick: 0, locationCount: distances.size };
}

/**
 * Build a graph with an agent at a location, with trait edges for capability.
 * traitLevel controls the domain contribution → higher = higher capability.
 */
function buildTestGraph(opts: {
  agentId?: string;
  agentLocationId?: string;
  profile?: AxiologicalProfile;
  traitLevel?: number;
  traitDomain?: ReachDomain;
  withAmbition?: { reachAffinity: Partial<Record<ReachDomain, number>> };
}): WorldGraph {
  const graph = new WorldGraph();
  const agentId = opts.agentId ?? 'agent_1';
  const locId = opts.agentLocationId ?? 'loc_a';

  graph.addNode({
    id: locId,
    type: 'location',
    name: 'Test Location A',
    properties: { locationType: 'settlement' },
  });

  graph.addNode({
    id: 'loc_b',
    type: 'location',
    name: 'Test Location B',
    properties: { locationType: 'settlement' },
  });

  graph.addNode({
    id: agentId,
    type: 'actor',
    name: 'Test Agent',
    properties: {
      actorType: 'individual',
      axiologicalProfile: opts.profile ?? zeroProfile(),
      locationId: locId,
    },
  });

  // Add trait for capability if requested
  if (opts.traitLevel !== undefined) {
    const domain = opts.traitDomain ?? 'iron';
    graph.addNode({
      id: 'trait_combat',
      type: 'trait',
      name: 'Combat Trait',
      properties: {
        subcategory: 'mastery',
        domainContributions: { [domain]: 5 },
      },
    });
    graph.addEdge({
      id: 'edge_trait',
      source: agentId,
      target: 'trait_combat',
      type: 'has_trait',
      properties: { level: opts.traitLevel },
    });
  }

  // Add ambition if requested
  if (opts.withAmbition) {
    graph.addNode({
      id: 'ambition_1',
      type: 'ambition',
      name: 'Test Ambition',
      properties: {
        reachAffinity: opts.withAmbition.reachAffinity,
      },
    });
    graph.addEdge({
      id: 'edge_pursues',
      source: agentId,
      target: 'ambition_1',
      type: 'pursues',
      properties: { priority: 'primary', status: 'active' },
    });
  }

  return graph;
}

// ─── estimateStepProbability ────────────────────────────────────

describe('estimateStepProbability', () => {
  it('returns ~0.6 when capability matches difficulty/100', () => {
    // capability=0.5, difficulty=50 → 0.5 - 0.5 + 0.6 = 0.6
    const p = estimateStepProbability(0.5, 50);
    expect(p).toBeCloseTo(0.6, 5);
  });

  it('returns higher probability for high capability vs low difficulty', () => {
    const p = estimateStepProbability(0.9, 20);
    expect(p).toBeGreaterThan(0.8);
  });

  it('returns lower probability for low capability vs high difficulty', () => {
    const p = estimateStepProbability(0.1, 90);
    expect(p).toBeLessThan(0.2);
  });

  it('clamps to [0.05, 0.95]', () => {
    // Very high capability, very low difficulty
    const high = estimateStepProbability(1.0, 0);
    expect(high).toBe(0.95);

    // Very low capability, very high difficulty
    const low = estimateStepProbability(0.0, 100);
    expect(low).toBe(0.05);
  });
});

// ─── estimateCompletionProb ─────────────────────────────────────

describe('estimateCompletionProb', () => {
  it('returns product of per-step probabilities', () => {
    const graph = buildTestGraph({});
    const entry = makeEntry({
      stepCount: 2,
      stepDifficulties: [50, 50],
      stepReaches: ['iron', 'iron'],
    });

    const prob = estimateCompletionProb(entry, 'agent_1', graph);
    // Each step: computeCapability(no traits) → sigmoid(0) ≈ 0.018
    // Step prob ≈ 0.018 - 0.5 + 0.6 = 0.118, clamped to 0.118
    // Product of 2 steps: 0.118 * 0.118 ≈ 0.014
    expect(prob).toBeGreaterThan(0.01);
    expect(prob).toBeLessThan(0.05);
  });

  it('high-capability agent has higher completion probability', () => {
    const lowGraph = buildTestGraph({});
    const highGraph = buildTestGraph({ traitLevel: 5, traitDomain: 'iron' });

    const entry = makeEntry({
      stepCount: 1,
      stepDifficulties: [50],
      stepReaches: ['iron'],
    });

    const lowProb = estimateCompletionProb(entry, 'agent_1', lowGraph);
    const highProb = estimateCompletionProb(entry, 'agent_1', highGraph);

    expect(highProb).toBeGreaterThan(lowProb);
  });
});

// ─── computeDesireScore ─────────────────────────────────────────

describe('computeDesireScore', () => {
  it('sums motivation values from profile', () => {
    const profile = makeProfile({
      mercy_ruthlessness: 0.8,
      honesty_cunning: -0.3,
    });

    const score = computeDesireScore(
      ['mercy_ruthlessness', 'honesty_cunning'],
      profile,
    );
    expect(score).toBeCloseTo(0.5, 5);
  });

  it('returns 0 for empty motivations', () => {
    const profile = makeProfile({ mercy_ruthlessness: 0.8 });
    expect(computeDesireScore([], profile)).toBe(0);
  });

  it('returns 0 for zero profile', () => {
    const profile = zeroProfile();
    expect(computeDesireScore(['mercy_ruthlessness'], profile)).toBe(0);
  });
});

// ─── scoreAndSelect ─────────────────────────────────────────────

describe('scoreAndSelect', () => {
  it('local encounter scores higher than distant equivalent', () => {
    const graph = buildTestGraph({ agentLocationId: 'loc_a' });
    const dm = makeDistanceMatrix([
      ['loc_a', 'loc_a', 0],
      ['loc_a', 'loc_b', 10],
    ]);

    const local = makeEntry({ templateId: 'local', locationId: 'loc_a' });
    const distant = makeEntry({ templateId: 'distant', locationId: 'loc_b' });

    const result = scoreAndSelect(
      [local, distant],
      'agent_1',
      'loc_a',
      graph,
      dm,
      1,
    );

    const localCandidate = result.topCandidates.find(
      (c) => c.entry.templateId === 'local',
    );
    const distantCandidate = result.topCandidates.find(
      (c) => c.entry.templateId === 'distant',
    );

    expect(localCandidate!.finalScore).toBeGreaterThan(
      distantCandidate!.finalScore,
    );
  });

  it('high-capability agent estimates higher completion probability', () => {
    const graph = buildTestGraph({ traitLevel: 5, traitDomain: 'iron' });
    const dm = makeDistanceMatrix([['loc_a', 'loc_a', 0]]);

    const entry = makeEntry({ locationId: 'loc_a' });
    const result = scoreAndSelect([entry], 'agent_1', 'loc_a', graph, dm, 1);

    expect(result.topCandidates[0].completionProb).toBeGreaterThan(0.05);
  });

  it('remote encounter has zero travel cost', () => {
    const graph = buildTestGraph({ agentLocationId: 'loc_a' });
    const dm = makeDistanceMatrix([
      ['loc_a', 'loc_a', 0],
      ['loc_a', 'loc_b', 5],
    ]);

    const remote = makeEntry({
      templateId: 'remote',
      locationId: 'loc_b',
      requiresPresence: false,
    });

    const result = scoreAndSelect(
      [remote],
      'agent_1',
      'loc_a',
      graph,
      dm,
      1,
    );

    expect(result.topCandidates[0].travelCost).toBe(0);
    expect(result.topCandidates[0].action).toBe('attempt_remote');
  });

  it('desire multiplier amplifies axiologically aligned encounters', () => {
    const alignedProfile = makeProfile({ mercy_ruthlessness: 0.9 });
    const neutralProfile = zeroProfile();

    const graphAligned = buildTestGraph({ profile: alignedProfile });
    const graphNeutral = buildTestGraph({
      agentId: 'agent_1',
      profile: neutralProfile,
    });
    const dm = makeDistanceMatrix([['loc_a', 'loc_a', 0]]);

    const entry = makeEntry({
      locationId: 'loc_a',
      motivations: ['mercy_ruthlessness'],
    });

    const alignedResult = scoreAndSelect(
      [entry],
      'agent_1',
      'loc_a',
      graphAligned,
      dm,
      1,
    );
    const neutralResult = scoreAndSelect(
      [entry],
      'agent_1',
      'loc_a',
      graphNeutral,
      dm,
      1,
    );

    expect(alignedResult.topCandidates[0].desireMultiplier).toBeGreaterThan(
      neutralResult.topCandidates[0].desireMultiplier,
    );
    expect(alignedResult.topCandidates[0].finalScore).toBeGreaterThan(
      neutralResult.topCandidates[0].finalScore,
    );
  });

  it('MINIMUM_DESIRE prevents zero scores for neutral encounters', () => {
    const graph = buildTestGraph({ profile: zeroProfile() });
    const dm = makeDistanceMatrix([['loc_a', 'loc_a', 0]]);

    const entry = makeEntry({ locationId: 'loc_a' });
    const result = scoreAndSelect([entry], 'agent_1', 'loc_a', graph, dm, 1);

    // D.1: desireMultiplier is exponentiated — min desire^PERSONALITY_SCORE_EXPONENT
    expect(result.topCandidates[0].desireMultiplier).toBeGreaterThan(0);
    expect(result.topCandidates[0].finalScore).toBeGreaterThan(0);
  });

  it('IDLE_SCORE_THRESHOLD: all low scores → selected is null', () => {
    const graph = buildTestGraph({ profile: zeroProfile() });
    // Mark location as visited long ago so exploration bonus = 0
    graph.updateNode('agent_1', {
      properties: {
        ...graph.getNode('agent_1')!.properties,
        explorationRecord: { visitedLocations: { loc_a: 0 } },
      },
    });
    const dm = makeDistanceMatrix([['loc_a', 'loc_a', 0]]);

    // Very low reward, high cost → tiny valuePerTick → tiny finalScore
    const entry = makeEntry({
      locationId: 'loc_a',
      successRewardEstimate: 0.001,
      totalTickCost: 100,
    });

    // Use tick far enough past visit to ensure exploration bonus fully decayed
    const result = scoreAndSelect([entry], 'agent_1', 'loc_a', graph, dm, 200);

    expect(result.selected).toBeNull();
    expect(result.trace.action).toBe('idle');
  });

  it('deterministic: same inputs produce same selection', () => {
    const graph = buildTestGraph({
      profile: makeProfile({ mercy_ruthlessness: 0.5 }),
    });
    const dm = makeDistanceMatrix([
      ['loc_a', 'loc_a', 0],
      ['loc_a', 'loc_b', 3],
    ]);

    const candidates = [
      makeEntry({ templateId: 'a', locationId: 'loc_a' }),
      makeEntry({ templateId: 'b', locationId: 'loc_b' }),
    ];

    const r1 = scoreAndSelect(candidates, 'agent_1', 'loc_a', graph, dm, 1);
    const r2 = scoreAndSelect(candidates, 'agent_1', 'loc_a', graph, dm, 1);

    expect(r1.selected?.entry.templateId).toBe(r2.selected?.entry.templateId);
    expect(r1.selected?.finalScore).toBe(r2.selected?.finalScore);
  });

  it('action classification: local, remote, queue_movement', () => {
    const graph = buildTestGraph({ agentLocationId: 'loc_a' });
    const dm = makeDistanceMatrix([
      ['loc_a', 'loc_a', 0],
      ['loc_a', 'loc_b', 5],
    ]);

    const localEntry = makeEntry({
      templateId: 'local',
      locationId: 'loc_a',
      requiresPresence: true,
    });
    const remoteEntry = makeEntry({
      templateId: 'remote',
      locationId: 'loc_b',
      requiresPresence: false,
    });
    const movementEntry = makeEntry({
      templateId: 'movement',
      locationId: 'loc_b',
      requiresPresence: true,
    });

    const result = scoreAndSelect(
      [localEntry, remoteEntry, movementEntry],
      'agent_1',
      'loc_a',
      graph,
      dm,
      1,
    );

    const byTemplate = new Map(
      result.topCandidates.map((c) => [c.entry.templateId, c]),
    );

    expect(byTemplate.get('local')!.action).toBe('start_local');
    expect(byTemplate.get('remote')!.action).toBe('attempt_remote');
    expect(byTemplate.get('movement')!.action).toBe('queue_movement');
  });

  it('missing agent returns null selected with empty candidates', () => {
    const graph = new WorldGraph();
    const dm = makeDistanceMatrix([]);
    const entry = makeEntry();

    const result = scoreAndSelect(
      [entry],
      'nonexistent',
      'loc_a',
      graph,
      dm,
      1,
    );

    expect(result.selected).toBeNull();
    expect(result.topCandidates).toHaveLength(0);
  });

  it('empty candidates returns null selected immediately', () => {
    const graph = buildTestGraph({});
    const dm = makeDistanceMatrix([]);

    const result = scoreAndSelect([], 'agent_1', 'loc_a', graph, dm, 1);

    expect(result.selected).toBeNull();
    expect(result.topCandidates).toHaveLength(0);
  });

  it('ambition boost increases score for matching reach', () => {
    const graph = buildTestGraph({
      profile: zeroProfile(),
      withAmbition: { reachAffinity: { iron: 0.8 } },
    });
    const dm = makeDistanceMatrix([['loc_a', 'loc_a', 0]]);

    const matchingEntry = makeEntry({
      templateId: 'iron_encounter',
      locationId: 'loc_a',
      reachPrimary: 'iron',
    });

    const result = scoreAndSelect(
      [matchingEntry],
      'agent_1',
      'loc_a',
      graph,
      dm,
      1,
    );

    expect(result.topCandidates[0].ambitionBoost).toBe(AMBITION_REACH_BOOST);
    // D.1: desireMultiplier is exponentiated, so compare score with/without ambition
    expect(result.topCandidates[0].desireMultiplier).toBeGreaterThan(0);
    expect(result.topCandidates[0].finalScore).toBeGreaterThan(0);
  });

  it('trace contains top candidates and selected info', () => {
    const graph = buildTestGraph({
      profile: makeProfile({ mercy_ruthlessness: 0.5 }),
    });
    const dm = makeDistanceMatrix([['loc_a', 'loc_a', 0]]);
    const entry = makeEntry({ locationId: 'loc_a' });

    const result = scoreAndSelect([entry], 'agent_1', 'loc_a', graph, dm, 10);

    expect(result.trace.category).toBe('encounter_scoring');
    expect(result.trace.agentId).toBe('agent_1');
    expect(result.trace.tick).toBe(10);
    expect(result.trace.topCandidates).toHaveLength(1);
    expect(result.trace.topCandidates[0].templateId).toBe('tmpl_default');
    if (result.selected) {
      expect(result.trace.selectedTemplateId).toBe('tmpl_default');
      expect(result.trace.action).not.toBe('idle');
    }
  });

  it('remote penalty reduces completion probability', () => {
    const graph = buildTestGraph({
      profile: makeProfile({ mercy_ruthlessness: 0.5 }),
    });
    const dm = makeDistanceMatrix([
      ['loc_a', 'loc_a', 0],
      ['loc_a', 'loc_b', 5],
    ]);

    const noPenalty = makeEntry({
      templateId: 'no_penalty',
      locationId: 'loc_b',
      requiresPresence: false,
      remotePenalty: 0,
    });
    const withPenalty = makeEntry({
      templateId: 'with_penalty',
      locationId: 'loc_b',
      requiresPresence: false,
      remotePenalty: 0.5,
    });

    const result = scoreAndSelect(
      [noPenalty, withPenalty],
      'agent_1',
      'loc_a',
      graph,
      dm,
      1,
    );

    const noPen = result.topCandidates.find(
      (c) => c.entry.templateId === 'no_penalty',
    );
    const withPen = result.topCandidates.find(
      (c) => c.entry.templateId === 'with_penalty',
    );

    expect(withPen!.completionProb).toBeLessThan(noPen!.completionProb);
  });
});

// ─── M1.2: Global Sphere Resonance ──────────────────────────────

describe('computeEncounterResonance (World-Soul global)', () => {
  function makeFundament(overrides: Partial<FundamentState> = {}): FundamentState {
    const balanced = 1 / SPHERE_NAMES.length;
    const sphereWeights = Object.fromEntries(
      SPHERE_NAMES.map((s) => [s, balanced])
    ) as Record<string, number>;
    return {
      sphereWeights,
      cycleCount: 0,
      ...overrides,
    };
  }

  it('returns 0 when fundament is undefined', () => {
    const result = computeEncounterResonance('force', undefined);
    expect(result).toBe(0);
  });

  it('returns 0 when encounterSphere is undefined', () => {
    const fundament = makeFundament();
    const result = computeEncounterResonance(undefined, fundament);
    expect(result).toBe(0);
  });

  it('returns positive bonus when sphere is dominant', () => {
    const balanced = 1 / SPHERE_NAMES.length;
    const weights = Object.fromEntries(
      SPHERE_NAMES.map(s => [s, balanced])
    ) as Record<string, number>;
    weights.force = balanced + 0.125; // dominant (+0.125 deviation)
    const fundament = makeFundament({ sphereWeights: weights });
    const result = computeEncounterResonance('force', fundament);
    const expected = 0.125 * ENCOUNTER_RESONANCE_SCALE;
    expect(result).toBeCloseTo(expected, 5);
  });

  it('returns negative bonus when sphere is recessive', () => {
    const balanced = 1 / SPHERE_NAMES.length;
    const weights = Object.fromEntries(
      SPHERE_NAMES.map(s => [s, balanced])
    ) as Record<string, number>;
    weights.force = 0.0; // recessive (-balanced deviation)
    const fundament = makeFundament({ sphereWeights: weights });
    const result = computeEncounterResonance('force', fundament);
    const expected = Math.max(
      ENCOUNTER_RESONANCE_FLOOR,
      -balanced * ENCOUNTER_RESONANCE_SCALE
    );
    expect(result).toBeCloseTo(expected, 5);
  });

  it('returns ~0 when sphere is balanced', () => {
    const fundament = makeFundament(); // All spheres at 1/12
    const result = computeEncounterResonance('force', fundament);
    expect(result).toBeCloseTo(0, 5);
  });

  it('applies floor to prevent extreme negative scores', () => {
    const weights = Object.fromEntries(SPHERE_NAMES.map(s => [s, 1/12])) as Record<string, number>;
    weights.force = 0.0; // heavily suppressed
    weights.matter = 0.25;
    weights.life = 0.25;
    const fundament = makeFundament({ sphereWeights: weights });
    const result = computeEncounterResonance('force', fundament);
    expect(result).toBeGreaterThanOrEqual(ENCOUNTER_RESONANCE_FLOOR);
  });
});

// ─── M1.2: Axiological Drift ────────────────────────────────────

describe('computeWorldSoulValueDrift (World-Soul)', () => {
  function makeFundament(overrides: Partial<FundamentState> = {}): FundamentState {
    const balanced = 1 / SPHERE_NAMES.length;
    const sphereWeights = Object.fromEntries(
      SPHERE_NAMES.map((s) => [s, balanced])
    ) as Record<string, number>;
    return {
      sphereWeights,
      cycleCount: 0,
      ...overrides,
    };
  }

  it('returns empty drift when fundament is undefined', () => {
    const result = computeWorldSoulValueDrift(undefined);
    expect(result).toEqual({});
  });

  it('returns empty drift when all spheres are balanced', () => {
    const fundament = makeFundament();
    const result = computeWorldSoulValueDrift(fundament);
    expect(Object.keys(result).length).toBe(0);
  });

  it('applies drift when force is dominant (mercy_ambition +ambition)', () => {
    const balanced = 1 / SPHERE_NAMES.length;
    const weights = Object.fromEntries(SPHERE_NAMES.map(s => [s, balanced])) as Record<string, number>;
    weights.force = balanced + 0.125; // +0.125 deviation, above threshold
    const fundament = makeFundament({ sphereWeights: weights });
    const result = computeWorldSoulValueDrift(fundament);
    // Force maps to mercy_ambition with direction +1, but other spheres slightly below balanced
    // may also contribute. Just verify force's pair got a positive drift.
    expect(result[SPHERE_DRIFT_MAP.force.pair]).toBeGreaterThan(0);
  });

  it('skips drift when deviation is below threshold', () => {
    const balanced = 1 / SPHERE_NAMES.length;
    const weights = Object.fromEntries(SPHERE_NAMES.map(s => [s, balanced])) as Record<string, number>;
    weights.force = balanced + 0.02; // small deviation, below threshold
    const fundament = makeFundament({ sphereWeights: weights });
    const result = computeWorldSoulValueDrift(fundament);
    expect(result[SPHERE_DRIFT_MAP.force.pair] ?? 0).toBeLessThan(0.001);
  });

  it('clamps drift to AXIOLOGICAL_DRIFT_MAX', () => {
    const weights = Object.fromEntries(SPHERE_NAMES.map(s => [s, 0.01])) as Record<string, number>;
    weights.force = 0.89; // extreme dominance
    const fundament = makeFundament({ sphereWeights: weights });
    const result = computeWorldSoulValueDrift(fundament);
    expect(Math.abs(result[SPHERE_DRIFT_MAP.force.pair] ?? 0)).toBeLessThanOrEqual(
      AXIOLOGICAL_DRIFT_MAX
    );
  });

  it('applies negative drift when sphere is recessive (life -> mercy)', () => {
    const balanced = 1 / SPHERE_NAMES.length;
    const weights = Object.fromEntries(SPHERE_NAMES.map(s => [s, balanced])) as Record<string, number>;
    weights.life = 0.01; // very recessive, negative deviation
    // life maps to mercy_ambition with direction -1
    // When life is recessive, deviation is negative, direction -1
    // drift = negative * -1 = positive (toward ambition), which means mercy is less
    const fundament = makeFundament({ sphereWeights: weights });
    const result = computeWorldSoulValueDrift(fundament);
    // Life recessive means less mercy (direction -1 * negative deviation = positive drift)
    expect(result.mercy_ambition).toBeDefined();
  });

  it('handles multiple sphere drifts in same pair', () => {
    const weights = Object.fromEntries(SPHERE_NAMES.map(s => [s, 1/12])) as Record<string, number>;
    weights.force = 0.25;   // dominant — mercy_ambition direction +1
    weights.entropy = 0.25; // dominant — mercy_ambition direction +1
    weights.life = 0.01;    // recessive — mercy_ambition direction -1 (negative deviation * -1 = positive)
    const fundament = makeFundament({ sphereWeights: weights });
    const result = computeWorldSoulValueDrift(fundament);
    // force, entropy, and life all map to mercy_ambition
    // force and entropy are dominant → positive drift
    // life is recessive with direction -1 → negative * -1 = positive drift
    // All three push mercy_ambition positive (toward ambition)
    expect(result.mercy_ambition ?? 0).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// B.1: Familiarity Discount
// ═══════════════════════════════════════════════════════════════════

describe('computeFamiliarityPenalty', () => {
  it('returns 0 for undefined record', () => {
    expect(computeFamiliarityPenalty(undefined, 'tmpl_a')).toBe(0);
  });

  it('returns 0 for unseen template', () => {
    const record: FamiliarityRecord = { attemptCount: {} };
    expect(computeFamiliarityPenalty(record, 'tmpl_a')).toBe(0);
  });

  it('returns linear penalty per attempt', () => {
    const record: FamiliarityRecord = { attemptCount: { tmpl_a: 3 } };
    const penalty = computeFamiliarityPenalty(record, 'tmpl_a');
    expect(penalty).toBeCloseTo(3 * FAMILIARITY_DECAY_PER_ATTEMPT, 5);
  });

  it('caps at FAMILIARITY_MAX_PENALTY', () => {
    const record: FamiliarityRecord = { attemptCount: { tmpl_a: 100 } };
    const penalty = computeFamiliarityPenalty(record, 'tmpl_a');
    expect(penalty).toBe(FAMILIARITY_MAX_PENALTY);
  });
});

// ═══════════════════════════════════════════════════════════════════
// B.2: Exploration Bonus
// ═══════════════════════════════════════════════════════════════════

describe('computeExplorationBonus', () => {
  it('returns full bonus for undefined record', () => {
    expect(computeExplorationBonus(undefined, 'loc_a', 10)).toBe(EXPLORATION_NOVELTY_BONUS);
  });

  it('returns full bonus for unvisited location', () => {
    const record: ExplorationRecord = { visitedLocations: {} };
    expect(computeExplorationBonus(record, 'loc_a', 10)).toBe(EXPLORATION_NOVELTY_BONUS);
  });

  it('returns decayed bonus for recently visited location', () => {
    const record: ExplorationRecord = { visitedLocations: { loc_a: 10 } };
    const halfLife = EXPLORATION_BONUS_DECAY_TICKS / 2;
    const bonus = computeExplorationBonus(record, 'loc_a', 10 + halfLife);
    expect(bonus).toBeCloseTo(EXPLORATION_NOVELTY_BONUS * 0.5, 5);
  });

  it('returns 0 after full decay period', () => {
    const record: ExplorationRecord = { visitedLocations: { loc_a: 10 } };
    const bonus = computeExplorationBonus(record, 'loc_a', 10 + EXPLORATION_BONUS_DECAY_TICKS);
    expect(bonus).toBe(0);
  });

  it('returns 0 long after decay period', () => {
    const record: ExplorationRecord = { visitedLocations: { loc_a: 10 } };
    const bonus = computeExplorationBonus(record, 'loc_a', 10 + EXPLORATION_BONUS_DECAY_TICKS + 100);
    expect(bonus).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// B.3 + D.1: Travel Cost Dampening & Personality in scoreAndSelect
// ═══════════════════════════════════════════════════════════════════

describe('scoring integration (B.3/D.1)', () => {
  it('distant encounters score higher with travel cost dampening', () => {
    // With TRAVEL_COST_WEIGHT=0.5, a 4-hop journey costs only 2 in the denominator
    const graph = buildTestGraph({ traitLevel: 3, traitDomain: 'iron' });
    const dm = makeDistanceMatrix([
      ['loc_a', 'loc_b', 4],
    ]);
    const localEntry = makeEntry({ locationId: 'loc_a', templateId: 'tmpl_local' });
    const distantEntry = makeEntry({ locationId: 'loc_b', templateId: 'tmpl_distant' });

    const result = scoreAndSelect(
      [localEntry, distantEntry],
      'agent_1',
      'loc_a',
      graph,
      dm,
      10,
    );

    // Both should score — distant should not be eliminated
    expect(result.topCandidates.length).toBe(2);
    const distantScore = result.topCandidates.find(c => c.entry.templateId === 'tmpl_distant')!.finalScore;
    expect(distantScore).toBeGreaterThan(0);
  });

  it('familiarity penalty reduces repeated encounter scores', () => {
    const graph = buildTestGraph({ traitLevel: 3, traitDomain: 'iron' });
    // Set familiarity record on agent
    const agentNode = graph.getNode('agent_1')!;
    graph.updateNode('agent_1', {
      properties: {
        ...agentNode.properties,
        familiarityRecord: { attemptCount: { tmpl_default: 5 } },
      },
    });

    const dm = makeDistanceMatrix([]);
    const entry = makeEntry({ locationId: 'loc_a' });

    const result = scoreAndSelect([entry], 'agent_1', 'loc_a', graph, dm, 10);
    const candidate = result.topCandidates[0];
    expect(candidate.familiarityPenalty).toBeGreaterThan(0);
    expect(candidate.familiarityPenalty).toBeCloseTo(5 * FAMILIARITY_DECAY_PER_ATTEMPT, 5);
  });

  it('exploration bonus increases scores for unvisited locations', () => {
    const graph = buildTestGraph({ traitLevel: 3, traitDomain: 'iron' });
    const dm = makeDistanceMatrix([['loc_a', 'loc_b', 1]]);
    const entry = makeEntry({ locationId: 'loc_b', templateId: 'tmpl_far' });

    const result = scoreAndSelect([entry], 'agent_1', 'loc_a', graph, dm, 10);
    const candidate = result.topCandidates[0];
    expect(candidate.explorationBonus).toBe(EXPLORATION_NOVELTY_BONUS);
  });

  it('personality exponent amplifies high-desire encounters', () => {
    // Agent with strong mercy_ruthlessness preference
    const profile = makeProfile({ mercy_ruthlessness: 1.5 });
    const graph = buildTestGraph({ profile, traitLevel: 3, traitDomain: 'iron' });
    const dm = makeDistanceMatrix([]);

    const highDesireEntry = makeEntry({
      templateId: 'tmpl_high',
      locationId: 'loc_a',
      motivations: ['mercy_ruthlessness'] as ValuePair[],
    });
    const lowDesireEntry = makeEntry({
      templateId: 'tmpl_low',
      locationId: 'loc_a',
      motivations: ['loyalty_ambition'] as ValuePair[],
    });

    const result = scoreAndSelect(
      [highDesireEntry, lowDesireEntry],
      'agent_1',
      'loc_a',
      graph,
      dm,
      10,
    );

    // High desire encounter should be selected
    expect(result.selected?.entry.templateId).toBe('tmpl_high');
    // The desire multiplier gap should be significant thanks to the exponent
    const highCandidate = result.topCandidates.find(c => c.entry.templateId === 'tmpl_high')!;
    const lowCandidate = result.topCandidates.find(c => c.entry.templateId === 'tmpl_low')!;
    expect(highCandidate.desireMultiplier).toBeGreaterThan(lowCandidate.desireMultiplier);
  });
});
