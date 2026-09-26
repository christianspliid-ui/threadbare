/**
 * THR-998 — the focused card may not claim odds the roll will not deliver.
 *
 * The defect: `riskHintLine(maxStepDifficulty)` bucketed the template's *authored*
 * price, but `applyScaleDifficultyAdjust` caps that price from above so the per-scale
 * probability floor holds, and for a fresh god the cap is 0 at `local` and `personal`
 * — 85% of the actor-target slot list. Two cards priced 0.20 and 0.50 therefore read
 * "A steady working." and "A perilous working." while resolving to the identical
 * probability.
 *
 * The fix keeps the *engine* property (difficulty really is inert there; lowering the
 * floors was direction 3 and is ruled out, since `MIN_PROBABILITY_BY_SCALE` governs
 * mortal resolution too) and corrects the *card*: the line is now a function of
 * `effectiveCastDifficulty` alone, so equal odds give an equal line by construction.
 *
 * `playerCastBalance.test.ts`'s "difficulty is inert" assertion stays green and stays
 * true — it pins the engine property, which THR-998 accommodates rather than removes.
 * Its header said it "must go red when THR-998 lands"; that expectation was written
 * assuming direction 3 and is corrected there.
 *
 * The first test below is the Done-when's must-fail-first assertion: it is red against
 * the pre-fix build, where the two lines differ.
 *
 * THR-1581 (dice re-fit) retired the scale floors and the difficulty cap that encoded
 * them (`SCALE_FLOOR_DIFFICULTY_CAP_ENABLED = false`), so the premise above no longer
 * holds: the roll now reads the authored price at every scale, and two prices far
 * apart resolve to different odds. The arms below that asserted *equal* odds for
 * different prices were re-pointed at the property THR-998 actually protected — the
 * word is a pure function of the probability the roll uses — which is now asserted
 * with the two prices reading honestly apart.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { resolveUncontestedStep } from '../unifiedActionResolution';
import { createUnifiedAction, resetUnifiedActionCounter } from '../unifiedActionLifecycle';
import { WorldGraph } from '../graph';
import {
  castCapabilityByReach,
  effectiveCastDifficulty,
  castForecastProbability,
  CARD_READOUT_SPHERE_FACTOR,
  CARD_READOUT_MODS,
} from '../playerCastReadout';
import { applyScaleDifficultyAdjust, MIN_PROBABILITY_BY_SCALE } from '../resolutionScaleAdjust';
import { computeResolutionThreshold } from '../resolutionService';
import { classifyForecastTier } from '../encounters/outcomeForecast';
import type { UnifiedActionTemplate, ActionScale } from '../../types/unifiedAction';
import type { GameState } from '../../types/gameState';

const ASCENDANT_ID = 'asc.witness';
const REACH = 'stone';
/** Every scale, so no arm silently exercises only the one it was written against. */
const SCALES: ActionScale[] = ['personal', 'local', 'regional', 'cosmic'];
/** The ascendant's shipped affinity on a primary reach (THR-503) — the strongest fresh god. */
const AFFINITY_PRIMARY = 5;

function makeTemplate(difficulty: number, scale: ActionScale): UnifiedActionTemplate {
  return {
    id: 'hex.test_working',
    rarityTier: 2,
    intrinsicTier: 'background',
    name: 'Test Working',
    reach: REACH,
    crudType: 'update',
    scale,
    steps: [{
      reach: REACH,
      duration: { min: 1, max: 1 },
      difficulty,
      onSuccess: [{ op: 'update_node', nodeId: '$target', changes: { worked: true } }],
      onFailure: [{ op: 'update_node', nodeId: '$target', changes: { worked: false } }],
      failBehavior: 'fail_action',
    }],
    apCost: 1,
    actorAffinities: ['ascendant'],
    motivations: ['courage_prudence'],
    narrativeTemplates: { initiation: 'begins', success: 'succeeds', failure: 'fails' },
  } as UnifiedActionTemplate;
}

/** A fresh god — `domainAffinities` only, which is what a real ascendant node carries. */
function makeState(affinity: number | null): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: ASCENDANT_ID,
    type: 'actor',
    name: 'The Witness',
    properties: {
      actorType: 'ascendant',
      ...(affinity === null ? {} : { domainAffinities: { [REACH]: affinity } }),
    },
  });
  graph.addNode({ id: 'loc-1', type: 'location', name: 'The Hollow', properties: {} });
  graph.addEdge({ id: 'e1', source: ASCENDANT_ID, target: 'loc-1', type: 'located_at', properties: {} });

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
    chronicle: {} as never, pendingQuintessenceEvents: [],
  } as unknown as GameState;
}

/**
 * The probability a cast will actually roll against — a pre-roll read, so one
 * resolution answers it exactly (THR-1000 established and pinned that property).
 */
function castProbability(difficulty: number, scale: ActionScale, affinity: number | null): number {
  resetUnifiedActionCounter();
  const template = makeTemplate(difficulty, scale);
  const state = makeState(affinity);
  const action = createUnifiedAction({
    actorId: ASCENDANT_ID, templateId: template.id, targetId: 'loc-1',
    scale, source: 'player', tick: 10, template,
    rng: () => 0.5, essencePaid: {} as never,
  });
  return resolveUncontestedStep(action, template, state, () => 0.5).probability;
}
/**
 * The **word** the card renders for this template, for a fresh god of `affinity`.
 *
 * Re-pointed by THR-1002 from `cardLine` — the card no longer prints a sentence
 * about its odds, it prints a forecast tier word, so the assertions below moved
 * with it. Every claim they made is still made; they are made about the word.
 */
function cardTier(difficulty: number, scale: ActionScale, affinity: number | null): string {
  const state = makeState(affinity);
  const capabilities = castCapabilityByReach(state.graph, ASCENDANT_ID);
  return classifyForecastTier(castForecastProbability(difficulty, capabilities[REACH], scale));
}

beforeEach(() => {
  resetUnifiedActionCounter();
});

// ─── The Done-when: equal odds must read as equal ───────────────────────────
//
// THR-998's Done-when, restated for THR-1002's vocabulary. The defect it was
// filed on — two templates with identical odds reading as different risks — is
// now impossible *by construction* rather than by measurement, because the word
// is a pure function of the probability. These arms are what proves the
// construction is the one that actually shipped.

describe('THR-998 — the card reads the price exactly as the roll does', () => {
  /**
   * Two authored prices far enough apart that the retired card bucketed them into
   * different risk words even when the floor made them resolve identically.
   */
  const EASY_PRICE = 0.20;
  const HARD_PRICE = 0.50;

  it('the roll now reads the price at local scale, and so does the card', () => {
    // THR-1581: the floor and its difficulty cap are retired, so a dearer working
    // genuinely resolves worse — asserted against the resolver itself.
    const easyP = castProbability(EASY_PRICE, 'local', AFFINITY_PRIMARY);
    const hardP = castProbability(HARD_PRICE, 'local', AFFINITY_PRIMARY);
    expect(easyP).toBeGreaterThan(hardP);

    // The Done-when, restated: each card's word is the resolver's probability's word.
    expect(cardTier(EASY_PRICE, 'local', AFFINITY_PRIMARY)).toBe(classifyForecastTier(easyP));
    expect(cardTier(HARD_PRICE, 'local', AFFINITY_PRIMARY)).toBe(classifyForecastTier(hardP));
  });

  it('says the same at personal scale', () => {
    const easyP = castProbability(EASY_PRICE, 'personal', AFFINITY_PRIMARY);
    const hardP = castProbability(HARD_PRICE, 'personal', AFFINITY_PRIMARY);
    expect(easyP).toBeGreaterThan(hardP);
    expect(cardTier(EASY_PRICE, 'personal', AFFINITY_PRIMARY)).toBe(classifyForecastTier(easyP));
    expect(cardTier(HARD_PRICE, 'personal', AFFINITY_PRIMARY)).toBe(classifyForecastTier(hardP));
  });

  it('reads the floored tiers as the odds the roll actually delivers', () => {
    // The truthfulness claim at the case that motivated THR-998, checked against
    // the **resolver itself**: `castProbability` drives a real
    // `resolveUncontestedStep` and reads the probability back off it, so the two
    // sides of this equality come from genuinely different routes — the card's
    // classifier against the roll that will happen.
    //
    // Note what this does *not* claim. A floored casting is not thereby a good
    // one: measured, a fresh god's capped `local` working sits at the scale floor
    // and so reads `perilous`. That is the honest word — the floor is where the
    // odds actually are. THR-998's defect was never that the card said `perilous`;
    // it was that the card said `perilous` for one price and `steady` for another
    // when both resolved identically. Asserting a *flattering* word here would
    // have been the same mistake in the other direction.
    for (const scale of ['local', 'personal'] as ActionScale[]) {
      expect(cardTier(HARD_PRICE, scale, AFFINITY_PRIMARY))
        .toBe(classifyForecastTier(castProbability(HARD_PRICE, scale, AFFINITY_PRIMARY)));
    }
  });
});

// ─── The counterweight: the fix must not simply silence the card ────────────

describe('THR-998 — the word still moves where difficulty genuinely bites', () => {
  it('tracks the odds monotonically where the price survives', () => {
    // Two regional prices that both clear the cap resolve to different
    // probabilities, and the card is allowed to — and does — distinguish them.
    const easyP = castProbability(0.06, 'regional', AFFINITY_PRIMARY);
    const hardP = castProbability(0.14, 'regional', AFFINITY_PRIMARY);
    expect(easyP).toBeGreaterThan(hardP);

    const capability = castCapabilityByReach(makeState(AFFINITY_PRIMARY).graph, ASCENDANT_ID)[REACH];
    expect(effectiveCastDifficulty(0.14, capability, 'regional'))
      .toBeGreaterThan(effectiveCastDifficulty(0.06, capability, 'regional'));
  });

  it('never reads better for a harder price, anywhere in the corpus range', () => {
    // Monotonicity of the *word*, which is the property a player can actually
    // check. A classifier that inverted anywhere would let a dearer working look
    // safer than a cheaper one at the same scale — the failure mode that makes a
    // readout worse than no readout at all.
    const LADDER = ['fated', 'favorable', 'uncertain', 'perilous', 'doomed'];
    for (const scale of SCALES) {
      let previous = -1;
      for (let difficulty = 0; difficulty <= 1.0001; difficulty += 0.05) {
        const rung = LADDER.indexOf(cardTier(difficulty, scale, AFFINITY_PRIMARY));
        expect(rung).toBeGreaterThanOrEqual(0);
        // The ladder runs best → worst, so a rising price may only move rightwards.
        expect(rung).toBeGreaterThanOrEqual(previous);
        previous = rung;
      }
    }
  });

  it('reads better odds for a deepened god — the readout is self-maintaining', () => {
    // THR-1581: difficulty is what the step demands, the same for every caster (the
    // cap that let a stronger god "keep more of the price" is retired). A stronger
    // god now shows up where it belongs — in the odds — with no re-tune.
    const fresh = castCapabilityByReach(makeState(AFFINITY_PRIMARY).graph, ASCENDANT_ID)[REACH];
    const weak = castCapabilityByReach(makeState(null).graph, ASCENDANT_ID)[REACH];
    expect(fresh).toBeGreaterThan(weak);
    expect(effectiveCastDifficulty(0.5, fresh, 'regional'))
      .toBe(effectiveCastDifficulty(0.5, weak, 'regional'));
    expect(castForecastProbability(0.2, fresh, 'regional'))
      .toBeGreaterThan(castForecastProbability(0.2, weak, 'regional'));
  });
});

// ─── Card-face contract ─────────────────────────────────────────────────────

describe('THR-1002 — the odds word is omitted rather than guessed', () => {
  it('falls to the scale floor when capability is unknown, never to the authored price', () => {
    // A slot built without a capability map carries no `forecastTier` at all —
    // `targetActions` omits the field and the face renders no odds zone. This pins
    // the layer below that: asked directly, the readout answers with the floor's
    // probability rather than reaching for the authored number, which is the
    // fallback that was the defect itself.
    for (const scale of SCALES) {
      expect(castForecastProbability(0.5, undefined, scale))
        .toBe(MIN_PROBABILITY_BY_SCALE[scale]);
    }
  });

  it('is a pure function of the effective odds, whatever the authored price was', () => {
    // The invariant the whole fix rests on, and the reason "equal odds ⇒ equal
    // word" is true by construction: the word depends on the probability alone.
    // (THR-1581: the two prices no longer share odds, so each is checked against
    // its own probability rather than against each other.)
    const capability = castCapabilityByReach(makeState(AFFINITY_PRIMARY).graph, ASCENDANT_ID)[REACH];
    for (const price of [0.20, 0.90]) {
      expect(cardTier(price, 'local', AFFINITY_PRIMARY))
        .toBe(classifyForecastTier(castForecastProbability(price, capability, 'local')));
    }
  });

  it('speaks a word from the one forecast ladder, never an internal key (Law 14)', () => {
    const LADDER = ['doomed', 'perilous', 'uncertain', 'favorable', 'fated'];
    for (const scale of SCALES) {
      const word = cardTier(0.3, scale, AFFINITY_PRIMARY);
      expect(LADDER).toContain(word);
      // The scale key itself must never be the word. 'region' is ordinary English;
      // 'local', 'personal' and 'cosmic' are internal vocabulary.
      expect(word).not.toBe(scale);
    }
  });
});

// ─── castForecastProbability — the truthfulness pin (THR-1002) ───────
//
// The action card's odds zone prints a forecast tier *word*. The invariant that
// makes that word honest is not "the word looks right" but: **the probability the
// card classifies is the probability the roll uses.**
//
// ─── Which "the resolver" these arms pin against, and why it changed ───
//
// They used to pin `castForecastProbability` against `computeResolutionThreshold`
// alone, on the reasoning that it is the resolver's single source of truth for P.
// It is not the *last* word on P, and the difference shipped two live defects
// (THR-1002): `stepResolutionCore` lifts a below-floor probability to the **scale**
// floor afterwards, and `resolveUncontestedStep` short-circuits a difficulty-0 step
// to `probability: 1` before any of it. Both sat under a green sweep for the whole
// of the foundation slice, because the sweep and the code agreed with each other
// about the wrong layer.
//
// So the helper below models the resolver's full post-process — and the arm after
// it goes further and drives `resolveUncontestedStep` itself, which is the only
// side of this comparison that cannot be wrong about what the resolver does.
describe('castForecastProbability', () => {
  /**
   * What the resolver would arrive at for the same cast: the threshold function,
   * then the scale floor, with the zero-difficulty early return in front.
   */
  function resolverProbability(
    maxDifficulty: number,
    capability: number,
    scale: ActionScale,
  ): number {
    // `resolveUncontestedStep`: *"Divine actions (difficulty 0) always succeed"* —
    // returned before any scale adjustment runs.
    if (maxDifficulty === 0) return 1;
    const { adjustedDifficulty } = applyScaleDifficultyAdjust(
      maxDifficulty,
      capability,
      CARD_READOUT_SPHERE_FACTOR,
      CARD_READOUT_MODS,
      scale,
    );
    const threshold = computeResolutionThreshold({
      // `actorId` and `domain` are required by the input type but unread by the
      // threshold maths; named here rather than cast, so a future reader of this
      // input does not have to wonder whether they mattered.
      actorId: ASCENDANT_ID,
      domain: REACH,
      capability,
      difficulty: Math.max(0, adjustedDifficulty),
      sphereFactor: CARD_READOUT_SPHERE_FACTOR,
      actionModifiers: CARD_READOUT_MODS,
    });
    // `stepResolutionCore`: `probabilityFloorActive` ⇒ `probability: scaleMinP`.
    return Math.max(MIN_PROBABILITY_BY_SCALE[scale], threshold);
  }

  it('equals what the live resolver actually rolls against, not merely what the threshold function returns', () => {
    // The arm that would have caught both shipped defects on its own. One side is
    // the card's helper; the other is `resolveUncontestedStep` driven for real,
    // with its probability read back off the result. No re-implementation on
    // either side, so there is no shared mistake available to them.
    //
    // `castProbability` builds a fresh god from `domainAffinities`, so capability
    // is whatever the engine derives rather than a number chosen here — which is
    // the case the corrections were about.
    const capability = castCapabilityByReach(makeState(AFFINITY_PRIMARY).graph, ASCENDANT_ID)[REACH];
    let compared = 0;
    for (const scale of SCALES) {
      for (const difficulty of [0, 0.05, 0.2, 0.5, 0.9]) {
        expect(castForecastProbability(difficulty, capability, scale))
          .toBeCloseTo(castProbability(difficulty, scale, AFFINITY_PRIMARY), 10);
        compared++;
      }
    }
    expect(compared).toBe(SCALES.length * 5);
  });

  it('equals the resolver probability across the measured capability and difficulty range', () => {
    // The *measured* range, not the type range: ascendant cast capability runs
    // roughly 0.2–0.9 in play, and authored step difficulties run 0–1.
    let compared = 0;
    for (const scale of SCALES) {
      for (let cap = 0.2; cap <= 0.9001; cap += 0.1) {
        for (let diff = 0; diff <= 1.0001; diff += 0.1) {
          expect(castForecastProbability(diff, cap, scale)).toBeCloseTo(
            resolverProbability(diff, cap, scale),
            10,
          );
          compared++;
        }
      }
    }
    // Guard against a loop that silently compared nothing (the vacuous-probe trap).
    expect(compared).toBeGreaterThan(300);
  });

  it('and so the tier word the card prints equals the tier of the roll probability', () => {
    for (const scale of SCALES) {
      for (let cap = 0.2; cap <= 0.9001; cap += 0.1) {
        for (let diff = 0; diff <= 1.0001; diff += 0.25) {
          expect(classifyForecastTier(castForecastProbability(diff, cap, scale))).toBe(
            classifyForecastTier(resolverProbability(diff, cap, scale)),
          );
        }
      }
    }
  });

  it('reads fated for a zero-difficulty working by a capable god', () => {
    // Nothing is subtracted, so P is the capability — and a guaranteed casting is
    // what the word should say.
    expect(classifyForecastTier(castForecastProbability(0, 0.9, 'personal'))).toBe('fated');
  });

  it('never drops below the scale floor, and no floor flatters a hard working', () => {
    // THR-1581: the local floor is the global PROBABILITY_FLOOR now, so a hard
    // local working reads the honest word for its odds — 0.40 + 1.25 × (0.75 − 0.80)
    // ≈ 0.34, perilous — where the retired 0.65 floor would have called it favorable.
    const p = castForecastProbability(0.9, 0.75, 'local');
    expect(p).toBeGreaterThanOrEqual(MIN_PROBABILITY_BY_SCALE.local);
    expect(classifyForecastTier(p)).toBe('perilous');
  });

  it('returns the scale floor rather than NaN on non-finite input', () => {
    expect(castForecastProbability(0.5, Number.NaN, 'local')).toBe(MIN_PROBABILITY_BY_SCALE.local);
    expect(castForecastProbability(0.5, undefined, 'cosmic')).toBe(MIN_PROBABILITY_BY_SCALE.cosmic);
  });
});
