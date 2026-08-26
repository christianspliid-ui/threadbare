/**
 * THR-1292 slice 2 — golden fixtures for `resolveUncontestedStep`.
 *
 * The plan's kill criterion for this slice reads: *"if golden-fixture parity
 * fails, stop and surface; do not ship a behaviour change under a refactor
 * label."* This file is that gate.
 *
 * It drives the real `resolveUncontestedStep` over a matrix chosen to walk every
 * branch the extraction moves — the six-band ladder, the THR-571 scale floor, the
 * THR-728 player floor, the resist downgrade, and the band rider — and pins the
 * exact result tuple as an inline literal. The literal was captured from `main`
 * at commit `a803d13a` (slice 1), *before* `stepResolutionCore.ts` existed, so a
 * post-refactor run reproducing it is genuine before/after parity rather than a
 * snapshot of the refactor agreeing with itself.
 *
 * Two properties make that claim hold:
 *  - the matrix is deterministic (a seeded mulberry32 stream per row, no clock,
 *    no `Math.random`), so a row's tuple is a function of the row alone; and
 *  - the tuple includes `roll` and `probability`, not merely the band, so a change
 *    that consumed a different number of rng draws — the failure mode a band-only
 *    snapshot would miss entirely — moves the fixture.
 *
 * Deliberately NOT a `toMatchSnapshot()`: an auto-written snapshot regenerates on
 * `-u` and would launder exactly the drift this exists to catch.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolveUncontestedStep } from '../unifiedActionResolution';
import { createUnifiedAction, resetUnifiedActionCounter } from '../unifiedActionLifecycle';
import type { UnifiedAction, UnifiedActionTemplate } from '../../types/unifiedAction';
import type { GameState } from '../../types/gameState';
import type { ActionScale } from '../../types/unifiedAction';
import { WorldGraph } from '../graph';
import { clearTraces, disableTracing } from '../traceBuffer';

const MORTAL_ID = 'agent.mortal';
const ASCENDANT_ID = 'asc.witness';
const TARGET_ID = 'loc-1';

/**
 * Deterministic seeded stream. Inlined rather than imported from `lib/prng` so a
 * future retune of the shared generator cannot silently rewrite these fixtures —
 * the golden values must be a function of THIS file.
 */
function seededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * `id` is load-bearing, not cosmetic: `isPushEligible` / `isResistEligible` are
 * *prefix* matches over the template id (`plannerForecast.ts:102-111`), so the id
 * is the only lever that opens the push and resist branches. A matrix built on one
 * neutral id would report `pushAttempted: false` on every row and pin nothing about
 * either path — which is precisely what the first draft of this file did.
 */
function makeTemplate(
  difficulty: number,
  scale: ActionScale,
  id: string,
  overrides: Partial<UnifiedActionTemplate> = {},
): UnifiedActionTemplate {
  return {
    id,
    rarityTier: 2,
    intrinsicTier: 'background',
    name: 'Test Working',
    reach: 'stone',
    crudType: 'update',
    scale,
    steps: [{
      reach: 'stone',
      duration: { min: 1, max: 1 },
      difficulty,
      onSuccess: [{ op: 'update_node', nodeId: '$target', changes: { worked: true } }],
      onFailure: [{ op: 'update_node', nodeId: '$target', changes: { worked: false } }],
      failBehavior: 'fail_action',
    }],
    apCost: 1,
    actorAffinities: ['individual', 'ascendant'],
    motivations: ['courage_prudence'],
    narrativeTemplates: { initiation: 'begins', success: 'succeeds', failure: 'fails' },
    ...overrides,
  };
}

/**
 * `capabilityRaw` is on the mortal scale `computeRawScore` walks (shipped mortals
 * carry 10–40). The ascendant instead carries `domainAffinities` 2–5, which is a
 * ranking weight, not a raw score — hence the two distinct node shapes.
 */
function makeState(capabilityRaw: number, quintessence: number): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: MORTAL_ID,
    type: 'actor',
    name: 'Tessel Vane',
    properties: {
      actorType: 'individual',
      domainCapabilities: { stone: capabilityRaw },
      quintessence,
    },
  });
  graph.addNode({
    id: ASCENDANT_ID,
    type: 'actor',
    name: 'The Witness',
    properties: { actorType: 'ascendant', domainAffinities: { stone: 4 }, quintessence },
  });
  graph.addNode({ id: TARGET_ID, type: 'location', name: 'The Hollow', properties: {} });
  graph.addEdge({ id: 'e1', source: MORTAL_ID, target: TARGET_ID, type: 'located_at', properties: {} });
  graph.addEdge({ id: 'e2', source: ASCENDANT_ID, target: TARGET_ID, type: 'located_at', properties: {} });

  return {
    tick: 10, seed: 42, cycle: 1, phase: 'playing', graph,
    cosmology: {} as never, tiles: [], clock: {} as never,
    ascendantId: ASCENDANT_ID, essencePool: {} as never,
    mandateDefinition: null, mandateState: null,
    rivalDefinitions: [], rivalStates: [],
    doomDefinition: {} as never, doomClock: {} as never,
    tickEvents: [], recentEvents: [], chronicleEntries: [],
    stealthExposure: 0, visibilityMap: {} as never, familiarityMap: {} as never,
    culturalInsightMap: new Map(), agentKnowledge: new Map(),
    encounterProgress: [], actionsInProgress: [], unifiedActions: [],
    worldSoul: {} as never, echoDefinitions: [], echoStates: [],
    chronicle: {} as never,
    pendingQuintessenceEvents: [],
    effectStates: [],
  } as unknown as GameState;
}

function makeAction(
  template: UnifiedActionTemplate,
  source: 'player' | 'agent',
): UnifiedAction {
  return createUnifiedAction({
    actorId: source === 'player' ? ASCENDANT_ID : MORTAL_ID,
    templateId: template.id,
    targetId: TARGET_ID,
    scale: template.scale,
    source,
    tick: 10,
    template,
    rng: () => 0.5,
    essencePaid: {} as never,
  });
}

/** Template ids chosen for what their PREFIX opens, not for their fiction. */
const ID_NEUTRAL = 'hex.test_working';                 // neither push- nor resist-eligible
const ID_PUSH = 'action.iron.conquer.test';            // PUSH_ELIGIBLE_PREFIXES
const ID_RESIST = 'action.heart.persuade.test';        // RESIST_ELIGIBLE_PREFIXES

/** One matrix row. `q` seeds the actor's quintessence, which gates push/resist. */
interface Row {
  readonly name: string;
  readonly difficulty: number;
  readonly scale: ActionScale;
  readonly capabilityRaw: number;
  readonly source: 'player' | 'agent';
  readonly q: number;
  readonly seed: number;
  readonly id?: string;
}

const MATRIX: readonly Row[] = [
  // Mortal, mid capability, across the difficulty range and several seeds — the
  // rows that should walk the ordinary six-band ladder.
  { name: 'mortal/easy/local/s1', difficulty: 0.2, scale: 'local', capabilityRaw: 25, source: 'agent', q: 0, seed: 1 },
  { name: 'mortal/easy/local/s2', difficulty: 0.2, scale: 'local', capabilityRaw: 25, source: 'agent', q: 0, seed: 2 },
  { name: 'mortal/mid/local/s3', difficulty: 0.5, scale: 'local', capabilityRaw: 25, source: 'agent', q: 0, seed: 3 },
  { name: 'mortal/mid/local/s4', difficulty: 0.5, scale: 'local', capabilityRaw: 25, source: 'agent', q: 0, seed: 4 },
  { name: 'mortal/hard/local/s5', difficulty: 0.8, scale: 'local', capabilityRaw: 25, source: 'agent', q: 0, seed: 5 },
  { name: 'mortal/hard/local/s6', difficulty: 0.8, scale: 'local', capabilityRaw: 25, source: 'agent', q: 0, seed: 6 },
  // Incapable mortal at a hard step — the THR-571 scale-floor path, at two
  // scales so a change to MIN_PROBABILITY_BY_SCALE moves the fixture.
  { name: 'mortal/incapable/local/s7', difficulty: 0.9, scale: 'local', capabilityRaw: 10, source: 'agent', q: 0, seed: 7 },
  { name: 'mortal/incapable/regional/s7', difficulty: 0.9, scale: 'regional', capabilityRaw: 10, source: 'agent', q: 0, seed: 7 },
  { name: 'mortal/incapable/cosmic/s8', difficulty: 0.9, scale: 'cosmic', capabilityRaw: 10, source: 'agent', q: 0, seed: 8 },
  // Capable mortal at an easy step — the top of the ladder, where crit success lives.
  { name: 'mortal/capable/local/s9', difficulty: 0.1, scale: 'local', capabilityRaw: 40, source: 'agent', q: 0, seed: 9 },
  { name: 'mortal/capable/local/s10', difficulty: 0.1, scale: 'local', capabilityRaw: 40, source: 'agent', q: 0, seed: 10 },
  // Funded mortal — push is pre-roll and resist is post-roll, and both draw from
  // the same stream, so these rows pin the draw ORDER as well as the bands.
  { name: 'mortal/funded/hard/s11', difficulty: 0.8, scale: 'local', capabilityRaw: 20, source: 'agent', q: 1, seed: 11 },
  { name: 'mortal/funded/hard/s12', difficulty: 0.8, scale: 'local', capabilityRaw: 20, source: 'agent', q: 1, seed: 12 },
  { name: 'mortal/funded/mid/s13', difficulty: 0.5, scale: 'local', capabilityRaw: 20, source: 'agent', q: 1, seed: 13 },
  // Player casts — the THR-728 floor, which must never yield failure/critical_failure.
  { name: 'player/hard/local/s14', difficulty: 0.8, scale: 'local', capabilityRaw: 0, source: 'player', q: 1, seed: 14 },
  { name: 'player/hard/local/s15', difficulty: 0.8, scale: 'local', capabilityRaw: 0, source: 'player', q: 1, seed: 15 },
  { name: 'player/mid/regional/s16', difficulty: 0.5, scale: 'regional', capabilityRaw: 0, source: 'player', q: 1, seed: 16 },
  // Zero-difficulty divine step — the auto-success early return, which the
  // extraction must leave upstream of the core entirely.
  { name: 'player/divine/zero/s17', difficulty: 0, scale: 'local', capabilityRaw: 0, source: 'player', q: 1, seed: 17 },

  // ── The ladder's tails ──────────────────────────────────────────────
  // Seeds chosen by scanning the stream for a first draw landing on doubles
  // (11,22,…,99 — `resolutionService.ts:108`) or within NEAR_MISS_MARGIN of the
  // threshold. Without these the matrix only ever shows success/failure/at-cost
  // and pins nothing about crit classification or the near-miss band.
  { name: 'mortal/crit-success/s21', difficulty: 0.5, scale: 'local', capabilityRaw: 25, source: 'agent', q: 0, seed: 21 },
  { name: 'mortal/crit-success/s65', difficulty: 0.5, scale: 'local', capabilityRaw: 25, source: 'agent', q: 0, seed: 65 },
  { name: 'mortal/crit-failure/s67', difficulty: 0.5, scale: 'local', capabilityRaw: 25, source: 'agent', q: 0, seed: 67 },
  { name: 'mortal/crit-failure/s143', difficulty: 0.5, scale: 'local', capabilityRaw: 25, source: 'agent', q: 0, seed: 143 },
  { name: 'mortal/near-miss/s1', difficulty: 0.5, scale: 'local', capabilityRaw: 25, source: 'agent', q: 0, seed: 1 },
  { name: 'mortal/near-miss/s22', difficulty: 0.5, scale: 'local', capabilityRaw: 25, source: 'agent', q: 0, seed: 22 },

  // ── Push ────────────────────────────────────────────────────────────
  // Push is PRE-roll: it moves the modifier, so it moves the threshold and can
  // move the band. Funded vs unfunded on the same seed isolates that.
  { name: 'push/funded/s21', difficulty: 0.5, scale: 'local', capabilityRaw: 15, source: 'agent', q: 1, seed: 21, id: ID_PUSH },
  { name: 'push/unfunded/s21', difficulty: 0.5, scale: 'local', capabilityRaw: 15, source: 'agent', q: 0, seed: 21, id: ID_PUSH },
  { name: 'push/funded/s67', difficulty: 0.5, scale: 'local', capabilityRaw: 15, source: 'agent', q: 1, seed: 67, id: ID_PUSH },
  // Below the `step.difficulty >= 0.3` push gate — pins that the gate reads the
  // RAW authored difficulty, not the scale-adjusted one.
  { name: 'push/below-gate/s21', difficulty: 0.25, scale: 'local', capabilityRaw: 15, source: 'agent', q: 1, seed: 21, id: ID_PUSH },

  // ── Resist ──────────────────────────────────────────────────────────
  // Resist is POST-roll and draws a SECOND rng value only when the actor can
  // afford it. These three rows pin the downgrade, the failed check, and the
  // unfunded skip — i.e. both branches of the conditional draw.
  { name: 'resist/downgrades/s67', difficulty: 0.5, scale: 'local', capabilityRaw: 25, source: 'agent', q: 1, seed: 67, id: ID_RESIST },
  { name: 'resist/downgrades/s143', difficulty: 0.5, scale: 'local', capabilityRaw: 25, source: 'agent', q: 1, seed: 143, id: ID_RESIST },
  { name: 'resist/check-fails/s142', difficulty: 0.5, scale: 'local', capabilityRaw: 25, source: 'agent', q: 1, seed: 142, id: ID_RESIST },
  { name: 'resist/unfunded/s67', difficulty: 0.5, scale: 'local', capabilityRaw: 25, source: 'agent', q: 0, seed: 67, id: ID_RESIST },
];

/** The pinned tuple. Captured on `main` @ a803d13a, before the extraction. */
type Golden = Record<string, {
  outcome: string; rawOutcome: string; probability: number; roll: number;
  capability: number; pushAttempted: boolean; pushCost: number;
  resistAttempted: boolean; resistSucceeded: boolean; resistCost: number;
  preResistOutcome: string | undefined; opCount: number;
}>;

function runRow(row: Row) {
  const template = makeTemplate(row.difficulty, row.scale, row.id ?? ID_NEUTRAL);
  const state = makeState(row.capabilityRaw, row.q);
  const action = makeAction(template, row.source);
  const r = resolveUncontestedStep(action, template, state, seededRng(row.seed));
  return {
    outcome: r.outcome,
    rawOutcome: r.rawOutcome,
    probability: Number(r.probability.toFixed(6)),
    roll: r.roll,
    capability: Number(r.capability.toFixed(6)),
    pushAttempted: r.pushAttempted,
    pushCost: Number(r.pushCost.toFixed(6)),
    resistAttempted: r.resistAttempted,
    resistSucceeded: r.resistSucceeded,
    resistCost: Number(r.resistCost.toFixed(6)),
    preResistOutcome: r.preResistOutcome,
    opCount: r.opsToExecute.length,
  };
}

beforeEach(() => {
  resetUnifiedActionCounter();
  clearTraces();
});

afterEach(() => {
  disableTracing();
  clearTraces();
});

describe('THR-1292 slice 2 — step resolution golden fixtures', () => {
  it('reproduces the pinned pre-refactor tuple for every matrix row', () => {
    const actual: Golden = {};
    for (const row of MATRIX) actual[row.name] = runRow(row);

    // GOLDEN — do not hand-edit to make a failing run pass. A diff here means the
    // extraction changed observable resolution behaviour, which the plan's kill
    // criterion says to surface rather than ship.
    expect(actual).toEqual(GOLDEN);
  });

  it('is deterministic — the same row twice yields the identical tuple', () => {
    // Guards the fixture itself: if a row leaked ambient state (a module-level
    // counter, a clock), the pin above would be measuring noise.
    for (const row of MATRIX) {
      expect(runRow(row)).toEqual(runRow(row));
    }
  });

  it('walks the whole six-band ladder — the matrix is not vacuously one-band', () => {
    // A golden fixture over a matrix that only ever produces `success` would pin
    // nothing about the ladder. This asserts the corpus is populated before the
    // pin above is allowed to mean anything (the vacuous-probe guard).
    const bands = new Set(MATRIX.map((row) => runRow(row).outcome));
    expect([...bands].sort()).toEqual([
      'critical_failure', 'critical_success', 'failure', 'near_miss', 'success', 'success_at_cost',
    ]);
  });

  it('actually exercises push and resist — both branches of each, not just the skip', () => {
    // The guard this file needed and did not have on its first draft: with a
    // neutral template id every row reported `pushAttempted: false`, so the
    // fixture pinned the push and resist paths vacuously. Assert the matrix
    // reaches BOTH sides of each gate, so a future edit that neutralises the
    // template ids fails here rather than quietly narrowing the pin.
    const by = (name: string) => runRow(MATRIX.find((r) => r.name === name)!);

    expect(by('push/funded/s21').pushAttempted).toBe(true);
    expect(by('push/funded/s21').pushCost).toBeGreaterThan(0);
    expect(by('push/unfunded/s21').pushAttempted).toBe(false);
    // The push gate reads the RAW authored difficulty (`step.difficulty >= 0.3`),
    // so a 0.25 step never pushes however well funded the actor is.
    expect(by('push/below-gate/s21').pushAttempted).toBe(false);

    expect(by('resist/downgrades/s67').resistAttempted).toBe(true);
    expect(by('resist/downgrades/s67').resistSucceeded).toBe(true);
    expect(by('resist/check-fails/s142').resistAttempted).toBe(true);
    expect(by('resist/check-fails/s142').resistSucceeded).toBe(false);
    expect(by('resist/unfunded/s67').resistAttempted).toBe(false);
  });

  it('never yields a bare failure band for a player cast — THR-728 floor holds', () => {
    for (const row of MATRIX.filter((r) => r.source === 'player')) {
      const outcome = runRow(row).outcome;
      expect(['failure', 'critical_failure']).not.toContain(outcome);
    }
  });
});

const GOLDEN: Golden = {
  'mortal/easy/local/s1': {
    outcome: 'success', rawOutcome: 'success',
    probability: 0.897527, roll: 63, capability: 0.997527,
    pushAttempted: false, pushCost: 0,
    resistAttempted: false, resistSucceeded: false, resistCost: 0,
    preResistOutcome: undefined, opCount: 1,
  },
  'mortal/easy/local/s2': {
    outcome: 'success', rawOutcome: 'success',
    probability: 0.897527, roll: 74, capability: 0.997527,
    pushAttempted: false, pushCost: 0,
    resistAttempted: false, resistSucceeded: false, resistCost: 0,
    preResistOutcome: undefined, opCount: 1,
  },
  'mortal/mid/local/s3': {
    outcome: 'failure', rawOutcome: 'failure',
    probability: 0.65, roll: 73, capability: 0.997527,
    pushAttempted: false, pushCost: 0,
    resistAttempted: false, resistSucceeded: false, resistCost: 0,
    preResistOutcome: undefined, opCount: 1,
  },
  'mortal/mid/local/s4': {
    outcome: 'failure', rawOutcome: 'failure',
    probability: 0.65, roll: 93, capability: 0.997527,
    pushAttempted: false, pushCost: 0,
    resistAttempted: false, resistSucceeded: false, resistCost: 0,
    preResistOutcome: undefined, opCount: 1,
  },
  'mortal/hard/local/s5': {
    outcome: 'failure', rawOutcome: 'failure',
    probability: 0.65, roll: 69, capability: 0.997527,
    pushAttempted: false, pushCost: 0,
    resistAttempted: false, resistSucceeded: false, resistCost: 0,
    preResistOutcome: undefined, opCount: 1,
  },
  'mortal/hard/local/s6': {
    outcome: 'success', rawOutcome: 'success',
    probability: 0.65, roll: 53, capability: 0.997527,
    pushAttempted: false, pushCost: 0,
    resistAttempted: false, resistSucceeded: false, resistCost: 0,
    preResistOutcome: undefined, opCount: 1,
  },
  'mortal/incapable/local/s7': {
    outcome: 'success', rawOutcome: 'success',
    probability: 0.65, roll: 2, capability: 0.5,
    pushAttempted: false, pushCost: 0,
    resistAttempted: false, resistSucceeded: false, resistCost: 0,
    preResistOutcome: undefined, opCount: 1,
  },
  'mortal/incapable/regional/s7': {
    outcome: 'success', rawOutcome: 'success',
    probability: 0.2, roll: 2, capability: 0.5,
    pushAttempted: false, pushCost: 0,
    resistAttempted: false, resistSucceeded: false, resistCost: 0,
    preResistOutcome: undefined, opCount: 1,
  },
  'mortal/incapable/cosmic/s8': {
    outcome: 'failure', rawOutcome: 'failure',
    probability: 0.05, roll: 16, capability: 0.5,
    pushAttempted: false, pushCost: 0,
    resistAttempted: false, resistSucceeded: false, resistCost: 0,
    preResistOutcome: undefined, opCount: 1,
  },
  'mortal/capable/local/s9': {
    outcome: 'success', rawOutcome: 'success',
    probability: 0.95, roll: 20, capability: 0.999994,
    pushAttempted: false, pushCost: 0,
    resistAttempted: false, resistSucceeded: false, resistCost: 0,
    preResistOutcome: undefined, opCount: 1,
  },
  'mortal/capable/local/s10': {
    outcome: 'success', rawOutcome: 'success',
    probability: 0.95, roll: 51, capability: 0.999994,
    pushAttempted: false, pushCost: 0,
    resistAttempted: false, resistSucceeded: false, resistCost: 0,
    preResistOutcome: undefined, opCount: 1,
  },
  'mortal/funded/hard/s11': {
    outcome: 'success', rawOutcome: 'success',
    probability: 0.65, roll: 52, capability: 0.982014,
    pushAttempted: false, pushCost: 0,
    resistAttempted: false, resistSucceeded: false, resistCost: 0,
    preResistOutcome: undefined, opCount: 1,
  },
  'mortal/funded/hard/s12': {
    outcome: 'success', rawOutcome: 'success',
    probability: 0.65, roll: 29, capability: 0.982014,
    pushAttempted: false, pushCost: 0,
    resistAttempted: false, resistSucceeded: false, resistCost: 0,
    preResistOutcome: undefined, opCount: 1,
  },
  'mortal/funded/mid/s13': {
    outcome: 'success', rawOutcome: 'success',
    probability: 0.65, roll: 57, capability: 0.982014,
    pushAttempted: false, pushCost: 0,
    resistAttempted: false, resistSucceeded: false, resistCost: 0,
    preResistOutcome: undefined, opCount: 1,
  },
  'player/hard/local/s14': {
    outcome: 'success_at_cost', rawOutcome: 'success_at_cost',
    probability: 0.65, roll: 45, capability: 0.310026,
    pushAttempted: false, pushCost: 0,
    resistAttempted: false, resistSucceeded: false, resistCost: 0,
    preResistOutcome: undefined, opCount: 1,
  },
  'player/hard/local/s15': {
    outcome: 'success', rawOutcome: 'success',
    probability: 0.65, roll: 24, capability: 0.310026,
    pushAttempted: false, pushCost: 0,
    resistAttempted: false, resistSucceeded: false, resistCost: 0,
    preResistOutcome: undefined, opCount: 1,
  },
  'player/mid/regional/s16': {
    outcome: 'success_at_cost', rawOutcome: 'success_at_cost',
    probability: 0.2, roll: 64, capability: 0.310026,
    pushAttempted: false, pushCost: 0,
    resistAttempted: false, resistSucceeded: false, resistCost: 0,
    preResistOutcome: undefined, opCount: 1,
  },
  'player/divine/zero/s17': {
    outcome: 'success', rawOutcome: 'success',
    probability: 1, roll: 0, capability: 1,
    pushAttempted: false, pushCost: 0,
    resistAttempted: false, resistSucceeded: false, resistCost: 0,
    preResistOutcome: undefined, opCount: 1,
  },
  'mortal/crit-success/s21': {
    outcome: 'critical_success', rawOutcome: 'critical_success',
    probability: 0.65, roll: 44, capability: 0.997527,
    pushAttempted: false, pushCost: 0,
    resistAttempted: false, resistSucceeded: false, resistCost: 0,
    preResistOutcome: undefined, opCount: 1,
  },
  'mortal/crit-success/s65': {
    outcome: 'critical_success', rawOutcome: 'critical_success',
    probability: 0.65, roll: 11, capability: 0.997527,
    pushAttempted: false, pushCost: 0,
    resistAttempted: false, resistSucceeded: false, resistCost: 0,
    preResistOutcome: undefined, opCount: 1,
  },
  'mortal/crit-failure/s67': {
    outcome: 'critical_failure', rawOutcome: 'critical_failure',
    probability: 0.65, roll: 99, capability: 0.997527,
    pushAttempted: false, pushCost: 0,
    resistAttempted: false, resistSucceeded: false, resistCost: 0,
    preResistOutcome: undefined, opCount: 1,
  },
  'mortal/crit-failure/s143': {
    outcome: 'critical_failure', rawOutcome: 'critical_failure',
    probability: 0.65, roll: 88, capability: 0.997527,
    pushAttempted: false, pushCost: 0,
    resistAttempted: false, resistSucceeded: false, resistCost: 0,
    preResistOutcome: undefined, opCount: 1,
  },
  'mortal/near-miss/s1': {
    outcome: 'near_miss', rawOutcome: 'success',
    probability: 0.65, roll: 63, capability: 0.997527,
    pushAttempted: false, pushCost: 0,
    resistAttempted: false, resistSucceeded: false, resistCost: 0,
    preResistOutcome: undefined, opCount: 1,
  },
  'mortal/near-miss/s22': {
    outcome: 'near_miss', rawOutcome: 'success',
    probability: 0.65, roll: 63, capability: 0.997527,
    pushAttempted: false, pushCost: 0,
    resistAttempted: false, resistSucceeded: false, resistCost: 0,
    preResistOutcome: undefined, opCount: 1,
  },
  'push/funded/s21': {
    outcome: 'critical_success', rawOutcome: 'critical_success',
    probability: 0.65, roll: 44, capability: 0.880797,
    pushAttempted: true, pushCost: 0.05,
    resistAttempted: false, resistSucceeded: false, resistCost: 0,
    preResistOutcome: undefined, opCount: 1,
  },
  'push/unfunded/s21': {
    outcome: 'critical_success', rawOutcome: 'critical_success',
    probability: 0.65, roll: 44, capability: 0.880797,
    pushAttempted: false, pushCost: 0,
    resistAttempted: false, resistSucceeded: false, resistCost: 0,
    preResistOutcome: undefined, opCount: 1,
  },
  'push/funded/s67': {
    outcome: 'critical_failure', rawOutcome: 'critical_failure',
    probability: 0.65, roll: 99, capability: 0.880797,
    pushAttempted: true, pushCost: 0.05,
    resistAttempted: false, resistSucceeded: false, resistCost: 0,
    preResistOutcome: undefined, opCount: 1,
  },
  'push/below-gate/s21': {
    outcome: 'critical_success', rawOutcome: 'critical_success',
    probability: 0.730797, roll: 44, capability: 0.880797,
    pushAttempted: false, pushCost: 0,
    resistAttempted: false, resistSucceeded: false, resistCost: 0,
    preResistOutcome: undefined, opCount: 1,
  },
  'resist/downgrades/s67': {
    outcome: 'failure', rawOutcome: 'critical_failure',
    probability: 0.65, roll: 99, capability: 0.997527,
    pushAttempted: false, pushCost: 0,
    resistAttempted: true, resistSucceeded: true, resistCost: 0.03,
    preResistOutcome: 'critical_failure', opCount: 1,
  },
  'resist/downgrades/s143': {
    outcome: 'failure', rawOutcome: 'critical_failure',
    probability: 0.65, roll: 88, capability: 0.997527,
    pushAttempted: false, pushCost: 0,
    resistAttempted: true, resistSucceeded: true, resistCost: 0.03,
    preResistOutcome: 'critical_failure', opCount: 1,
  },
  'resist/check-fails/s142': {
    outcome: 'critical_failure', rawOutcome: 'critical_failure',
    probability: 0.65, roll: 66, capability: 0.997527,
    pushAttempted: false, pushCost: 0,
    resistAttempted: true, resistSucceeded: false, resistCost: 0.03,
    preResistOutcome: 'critical_failure', opCount: 1,
  },
  'resist/unfunded/s67': {
    outcome: 'critical_failure', rawOutcome: 'critical_failure',
    probability: 0.65, roll: 99, capability: 0.997527,
    pushAttempted: false, pushCost: 0,
    resistAttempted: false, resistSucceeded: false, resistCost: 0,
    preResistOutcome: undefined, opCount: 1,
  },
};
