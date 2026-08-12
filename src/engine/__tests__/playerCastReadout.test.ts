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
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { resolveUncontestedStep } from '../unifiedActionResolution';
import { createUnifiedAction, resetUnifiedActionCounter } from '../unifiedActionLifecycle';
import { WorldGraph } from '../graph';
import { castCapabilityByReach, effectiveCastDifficulty } from '../playerCastReadout';
import {
  castHintLine,
  riskHintLine,
  SCALE_HINT_LINES,
  RISK_HINT_WORDS,
  RISK_HINT_THRESHOLDS,
} from '../../data/player-cast-constants';
import type { UnifiedActionTemplate, ActionScale } from '../../types/unifiedAction';
import type { GameState } from '../../types/gameState';

const ASCENDANT_ID = 'asc.witness';
const REACH = 'stone';
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

/** The line the focused card renders for this template, for a fresh god of `affinity`. */
function cardLine(difficulty: number, scale: ActionScale, affinity: number | null): string | null {
  const state = makeState(affinity);
  const capabilities = castCapabilityByReach(state.graph, ASCENDANT_ID);
  const effective = effectiveCastDifficulty(difficulty, capabilities[REACH], scale);
  return castHintLine(difficulty, effective, scale);
}

beforeEach(() => {
  resetUnifiedActionCounter();
});

// ─── The Done-when: equal odds must read as equal ───────────────────────────

describe('THR-998 — the card does not differentiate on a price the roll ignored', () => {
  it('gives two templates across a risk threshold the same line at local scale, because they have the same odds', () => {
    // 0.20 sits below RISK_HINT_THRESHOLDS[0] and 0.50 above RISK_HINT_THRESHOLDS[1],
    // so the pre-fix card read "A steady working." and "A perilous working." for these.
    const [lower, upper] = RISK_HINT_THRESHOLDS;
    const easy = lower - 0.05;
    const hard = upper + 0.05;

    // The premise, asserted rather than assumed: at local scale a fresh god's floor
    // caps both prices away, so these two cast at the identical probability.
    expect(castProbability(easy, 'local', AFFINITY_PRIMARY))
      .toBe(castProbability(hard, 'local', AFFINITY_PRIMARY));

    // Non-vacuity: the two authored prices really do straddle a cut-point, so the
    // pre-fix build genuinely differentiated them. If this ever stops holding the
    // test above would pass for the wrong reason.
    expect(riskHintLine(easy)).not.toBe(riskHintLine(hard));

    // The Done-when. Red before the fix, green after.
    expect(cardLine(easy, 'local', AFFINITY_PRIMARY))
      .toBe(cardLine(hard, 'local', AFFINITY_PRIMARY));
  });

  it('says the same at personal scale, the other floored tier', () => {
    const [lower, upper] = RISK_HINT_THRESHOLDS;
    expect(castProbability(lower - 0.05, 'personal', AFFINITY_PRIMARY))
      .toBe(castProbability(upper + 0.05, 'personal', AFFINITY_PRIMARY));
    expect(cardLine(lower - 0.05, 'personal', AFFINITY_PRIMARY))
      .toBe(cardLine(upper + 0.05, 'personal', AFFINITY_PRIMARY));
  });

  it('names the scale rather than a risk where the floor has capped the price away', () => {
    // Direction 2: stop claiming risk that is not there, and say the true thing —
    // at a floored tier, scale is the term actually setting the odds.
    expect(cardLine(0.5, 'local', AFFINITY_PRIMARY)).toBe(SCALE_HINT_LINES.local);
    expect(cardLine(0.5, 'personal', AFFINITY_PRIMARY)).toBe(SCALE_HINT_LINES.personal);

    // And it is not a risk word wearing a different coat.
    for (const word of RISK_HINT_WORDS) {
      expect(cardLine(0.5, 'local', AFFINITY_PRIMARY)).not.toContain(word);
    }
  });
});

// ─── The counterweight: the fix must not simply silence the card ────────────

describe('THR-998 — the risk word survives where difficulty genuinely bites', () => {
  it('still states a risk at regional scale, where the floor is low enough to clear', () => {
    // `regional`'s floor is 0.20, which a fresh god clears — so authored difficulty
    // reaches the roll there and the card is entitled to talk about it. A fix that
    // replaced every card with a scale line would pass the Done-when and lose this.
    const line = cardLine(0.06, 'regional', AFFINITY_PRIMARY);
    expect(RISK_HINT_WORDS.some((w) => line?.includes(w))).toBe(true);
    expect(line).not.toBe(SCALE_HINT_LINES.regional);
  });

  it('tracks the odds monotonically where the price survives', () => {
    // Two regional prices that both clear the cap resolve to different probabilities,
    // and the card is allowed to — and does — distinguish them.
    const easyP = castProbability(0.06, 'regional', AFFINITY_PRIMARY);
    const hardP = castProbability(0.14, 'regional', AFFINITY_PRIMARY);
    expect(easyP).toBeGreaterThan(hardP);

    const effEasy = effectiveCastDifficulty(0.06, castCapabilityByReach(makeState(AFFINITY_PRIMARY).graph, ASCENDANT_ID)[REACH], 'regional');
    const effHard = effectiveCastDifficulty(0.14, castCapabilityByReach(makeState(AFFINITY_PRIMARY).graph, ASCENDANT_ID)[REACH], 'regional');
    expect(effHard).toBeGreaterThan(effEasy);
  });

  it('opens the harder words to a deepened god — the readout is self-maintaining', () => {
    // The cap is `capability - MIN_PROBABILITY_BY_SCALE[scale]`, so a stronger god
    // keeps more of the authored price. This is the property that means the card
    // starts reporting risk exactly when risk becomes real, with no re-tune.
    const fresh = castCapabilityByReach(makeState(AFFINITY_PRIMARY).graph, ASCENDANT_ID)[REACH];
    const weak = castCapabilityByReach(makeState(null).graph, ASCENDANT_ID)[REACH];
    expect(fresh).toBeGreaterThan(weak);
    expect(effectiveCastDifficulty(0.5, fresh, 'regional'))
      .toBeGreaterThan(effectiveCastDifficulty(0.5, weak, 'regional'));
  });
});

// ─── Card-face contract ─────────────────────────────────────────────────────

describe('THR-998 — castHintLine contract', () => {
  it('keeps a guaranteed casting silent, exactly as before', () => {
    // Certainty on the soul-verbs is a design statement, not an omission — the
    // pre-THR-998 behaviour, preserved verbatim.
    expect(castHintLine(0, 0, 'local')).toBeNull();
    expect(castHintLine(undefined, undefined, 'local')).toBeNull();
    expect(castHintLine(Number.NaN, 0, 'local')).toBeNull();
  });

  it('never claims a risk it cannot substantiate when capability is unknown', () => {
    // A slot built without a capability map (tests, or a surface with no ascendant in
    // scope) carries no effective difficulty. The conservative read is the scale line,
    // never a fallback to the authored price — that fallback is the defect itself.
    expect(castHintLine(0.5, undefined, 'local')).toBe(SCALE_HINT_LINES.local);
    expect(castHintLine(0.5, undefined, null)).toBe(SCALE_HINT_LINES.regional);
  });

  it('speaks prose, never the internal scale key (Law 14)', () => {
    const keys: ActionScale[] = ['personal', 'local', 'regional', 'cosmic'];
    for (const scale of keys) {
      const line = SCALE_HINT_LINES[scale];
      expect(line).toMatch(/^A working the size of .+\.$/);
      // The enum key itself must not surface. 'local'/'personal'/'cosmic' are internal
      // vocabulary; 'region' is ordinary English and is allowed in the regional line.
      if (scale !== 'regional') expect(line.toLowerCase()).not.toContain(scale);
    }
  });

  it('is a pure function of the effective difficulty, whatever the authored price was', () => {
    // The invariant the whole fix rests on: given the same effective difficulty, the
    // line does not vary with the authored one. This is what makes "equal odds ⇒ equal
    // line" true by construction rather than by measurement.
    expect(castHintLine(0.06, 0.3, 'regional')).toBe(castHintLine(0.9, 0.3, 'regional'));
    expect(castHintLine(0.06, 0, 'local')).toBe(castHintLine(0.9, 0, 'local'));
  });
});
