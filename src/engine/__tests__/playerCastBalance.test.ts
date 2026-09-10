/**
 * THR-766 — the measured balance verdicts for player casts.
 *
 * THR-728 shipped the mechanism and had to pick two numbers to open the outcome
 * ladder at all (`ASCENDANT_CAST_BASE_RAW`, `ASCENDANT_CAST_AFFINITY_WEIGHT`),
 * plus the risk-word cut-points. THR-766 was the balance pass on those numbers.
 * Its verdict was **keep all three** — but a verdict recorded only in prose rots,
 * and the measurement it rests on is a distribution rather than a single value.
 *
 * So the verdict lives here as assertions. Each one is a bound the shipped values
 * sit inside and a plausible re-tune would break, which is the point: changing a
 * constant should turn a test red and force a deliberate re-verdict, not drift
 * silently. The tolerances are wide enough to survive content authoring and
 * narrow enough to catch a real move — see each test for what breaks it.
 *
 * Companion finding: THR-998. Authored step difficulty does not reach the roll
 * for 85% of the slot list, so the risk word described a number that could not move
 * the player's odds. `difficulty is inert …` below pins that engine property.
 *
 * **THR-998 shipped 2026-08-12 and that assertion stays green — deliberately.** This
 * header used to say it "must go red when THR-998 lands", which assumed the fix would
 * be direction 3 (lower `MIN_PROBABILITY_BY_SCALE` so authored difficulty bites again).
 * Direction 3 was ruled out: those floors govern mortal resolution too, so it is not a
 * player-cast-local change. The shipped fix is direction 2 — the engine property is
 * left exactly as it is and the *card* stops claiming otherwise, naming the scale
 * where the floor has capped the price away. So "difficulty is inert" is still a true
 * statement about this engine and is still worth pinning; what changed is that nothing
 * now reports it to the player as a per-template risk. The card-face contract lives in
 * `playerCastReadout.test.ts`.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { resolveUncontestedStep } from '../unifiedActionResolution';
import { createUnifiedAction, resetUnifiedActionCounter } from '../unifiedActionLifecycle';
import { isActionStepBranch } from '../../types/unifiedAction';
import type { UnifiedActionTemplate, ActionScale } from '../../types/unifiedAction';
import type { GameState } from '../../types/gameState';
import { WorldGraph } from '../graph';
import { UNIFIED_ACTION_TEMPLATES } from '../../data/unified-action-templates';
import {
  ASCENDANT_CAST_BASE_RAW,
  ASCENDANT_CAST_AFFINITY_WEIGHT,
} from '../../data/player-cast-constants';
import {
  castForecastProbability,
  CARD_READOUT_SPHERE_FACTOR,
  CARD_READOUT_MODS,
} from '../playerCastReadout';
import { applyScaleDifficultyAdjust, MIN_PROBABILITY_BY_SCALE } from '../resolutionScaleAdjust';
import { computeResolutionThreshold } from '../resolutionService';
import { classifyForecastTier } from '../encounters/outcomeForecast';

const ASCENDANT_ID = 'asc.witness';
const SEEDS = 400;

/**
 * Two cast capabilities inside the **measured** band (THR-1002).
 *
 * Ascendant cast capability runs roughly 0.2–0.9 in play — the range
 * `playerCastReadout.test.ts` sweeps — and these are a fresh god's on a primary
 * and a secondary reach. Named rather than swept because the truthfulness pin is
 * an *identity*: it must hold at every capability, so any point in the band
 * exercises it, and re-sweeping the whole grid here would only re-run the sibling
 * file's job over the same arithmetic.
 */
const FRESH_GOD_PRIMARY_CAPABILITY = 0.55;
const FRESH_GOD_SECONDARY_CAPABILITY = 0.40;

/** The ascendant's shipped affinity range (THR-503): 2 on a secondary reach, 5 on a primary. */
const AFFINITY_SECONDARY = 2;
const AFFINITY_PRIMARY = 5;

// ─── Harness ────────────────────────────────────────────────────────────────

function makeTemplate(difficulty: number, scale: ActionScale): UnifiedActionTemplate {
  return {
    id: 'hex.test_working',
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
      ...(affinity === null ? {} : { domainAffinities: { stone: affinity } }),
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

/** Deterministic seeded stream (mulberry32) — a fresh one per seed, reproducible. */
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
 * Drive `SEEDS` independent casts and return the outcome shares plus the pre-roll reads.
 *
 * THR-1000: the template and the state are built **once** per call rather than once
 * per seed. Resolution does not mutate either — a player cast never reaches the
 * quintessence spend (`PLAYER_CAST_PUSH_ENABLED` is `false`, and `hex.test_working`
 * is not in `PUSH_ELIGIBLE_PREFIXES` regardless), and the intel branch needs a
 * `difficultyContext` this template does not set. So the only per-seed state is the
 * action counter and the rng stream, both of which are still fresh every iteration.
 * Rebuilding a `WorldGraph` 400 times per call is what put the 8-call test at 113%
 * of the vitest default and turned unrelated PRs red.
 *
 * `preRollStable` is the guard on that reasoning: it goes false the moment any seed
 * reads a different capability or probability than the first, which is the only way
 * hoisting could change a result.
 */
function castDistribution(difficulty: number, scale: ActionScale, affinity: number | null) {
  const counts: Record<string, number> = {};
  const template = makeTemplate(difficulty, scale);
  const state = makeState(affinity);
  let capability = 0;
  let probability = 0;
  let preRollStable = true;
  for (let seed = 1; seed <= SEEDS; seed++) {
    resetUnifiedActionCounter();
    const action = createUnifiedAction({
      actorId: ASCENDANT_ID, templateId: template.id, targetId: 'loc-1',
      scale, source: 'player', tick: 10, template,
      rng: () => 0.5, essencePaid: {} as never,
    });
    const result = resolveUncontestedStep(action, template, state, seededRng(seed));
    counts[result.outcome] = (counts[result.outcome] ?? 0) + 1;
    if (seed === 1) {
      capability = result.capability;
      probability = result.probability;
    } else if (result.capability !== capability || result.probability !== probability) {
      preRollStable = false;
    }
  }
  const share = (band: string) => (counts[band] ?? 0) / SEEDS;
  return { counts, share, capability, probability, preRollStable };
}

/**
 * The pre-roll reads for one cell — a **single** resolution, not `SEEDS` of them.
 *
 * THR-1000: `capability` and `probability` are computed before `resolveActionShared`
 * touches the rng — capability from the graph, probability from capability, the
 * scale-adjusted difficulty and the modifier total, then floored at
 * `MIN_PROBABILITY_BY_SCALE` on a comparison that never reads the roll. The rng
 * decides only *which outcome* a cast lands on. So a test asserting a pre-roll value
 * gets the identical answer from one seed as from 400, and the 399 extra casts were
 * measuring nothing. `castDistribution` stays the right tool for the share
 * assertions, which genuinely need the spread.
 *
 * Seed 1 is deliberate: it is the first iteration of the distribution loop, so the
 * equivalence guard below compares like with like rather than trusting the argument.
 */
function castReadout(difficulty: number, scale: ActionScale, affinity: number | null) {
  resetUnifiedActionCounter();
  const template = makeTemplate(difficulty, scale);
  const state = makeState(affinity);
  const action = createUnifiedAction({
    actorId: ASCENDANT_ID, templateId: template.id, targetId: 'loc-1',
    scale, source: 'player', tick: 10, template,
    rng: () => 0.5, essencePaid: {} as never,
  });
  const result = resolveUncontestedStep(action, template, state, seededRng(1));
  return { capability: result.capability, probability: result.probability };
}

/** The hardest non-branch step difficulty — mirrors `targetActions.ts`. */
function maxStepDifficulty(template: UnifiedActionTemplate): number {
  let max = 0;
  for (const step of template.steps) {
    if (isActionStepBranch(step)) continue;
    const difficulty = (step as { difficulty?: number }).difficulty ?? 0;
    if (Number.isFinite(difficulty) && difficulty > max) max = difficulty;
  }
  return max;
}

/**
 * The live actor-target slot list, as the drawer actually builds it.
 *
 * `getTargetActionSlots` gates on `targetCategories` (defaulting to `['actor']`)
 * and never on `actorAffinities` — every slot it returns is a player cast. Reading
 * the pool through `actorAffinities: ['ascendant']` instead yields 8 templates and
 * makes any spread assertion over it vacuous; the real list is two orders larger.
 */
function actorTargetSlots(): UnifiedActionTemplate[] {
  return (UNIFIED_ACTION_TEMPLATES as readonly UnifiedActionTemplate[]).filter((t) => {
    const categories = (t as { targetCategories?: readonly string[] }).targetCategories ?? ['actor'];
    return categories.includes('actor') && maxStepDifficulty(t) > 0;
  });
}

beforeEach(() => {
  resetUnifiedActionCounter();
});

// ─── The harness contract the two verdicts rest on (THR-1000) ───────────────

describe('THR-1000 — the pre-roll reads are seed-invariant', () => {
  it('reads one capability and one probability across all 400 seeds, so the readout may use one', () => {
    // This is the assertion that licenses `castReadout` and the hoisted template/state
    // above. Both rest on the same claim — that the rng reaches the roll and nothing
    // upstream of it — and a claim load-bearing for a performance change has to be
    // falsifiable rather than argued. Feed the rng into capability or probability and
    // `preRollStable` goes false here; break the hoist and the equality below breaks.
    const d = castDistribution(0.35, 'local', AFFINITY_PRIMARY);
    expect(d.preRollStable).toBe(true);

    // Non-vacuity: a distribution that resolved nothing would report `preRollStable`
    // true for want of a second seed to disagree with.
    expect(Object.values(d.counts).reduce((a, b) => a + b, 0)).toBe(SEEDS);

    const readout = castReadout(0.35, 'local', AFFINITY_PRIMARY);
    expect(readout.capability).toBe(d.capability);
    expect(readout.probability).toBe(d.probability);
  });
});

// ─── Verdict 1 — the fresh-god power curve ──────────────────────────────────

describe('THR-766 — fresh-god cast curve: keep BASE_RAW 6 / AFFINITY_WEIGHT 0.5', () => {
  it('places a fresh god on the measured capability band, off-domain through primary reach', () => {
    // Pins the verdict. Any change to either constant moves these and forces a
    // deliberate re-measure rather than a silent re-tune.
    expect(ASCENDANT_CAST_BASE_RAW).toBe(6);
    expect(ASCENDANT_CAST_AFFINITY_WEIGHT).toBe(0.5);

    // Capability is a pre-roll read, so one resolution per cell answers it exactly
    // (THR-1000) — the seed-invariance guard above is what makes that substitution safe.
    const offDomain = castReadout(0.35, 'local', null).capability;
    const secondary = castReadout(0.35, 'local', AFFINITY_SECONDARY).capability;
    const primary = castReadout(0.35, 'local', AFFINITY_PRIMARY).capability;

    expect(offDomain).toBeCloseTo(0.168, 3);
    expect(secondary).toBeCloseTo(0.231, 3);
    expect(primary).toBeCloseTo(0.354, 3);

    // The reach ordering is the whole reason the affinity term exists.
    expect(primary).toBeGreaterThan(secondary);
    expect(secondary).toBeGreaterThan(offDomain);
  });

  it('keeps success-at-cost dominant, clean success meaningful and surge rare at local scale', () => {
    // The rulebook's stated texture, measured rather than asserted by eye. `local`
    // is 79% of the slot list, so this is the distribution a player actually meets.
    const d = castDistribution(0.35, 'local', AFFINITY_PRIMARY);

    // Measured 0.648 — dominant but not the only band. Raising BASE_RAW to 10 drops
    // this to ~0.50 and breaks the lower bound, which is the intended trip-wire:
    // the base raw doubles as the whole progression range `reachPractice` walks,
    // so spending it up front flattens the Deepening arc.
    expect(d.share('success_at_cost')).toBeGreaterThan(0.55);
    expect(d.share('success_at_cost')).toBeLessThan(0.75);

    // Measured 0.280 — a clean landing has to stay a real outcome, not a rumour.
    expect(d.share('success')).toBeGreaterThan(0.20);
    expect(d.share('success')).toBeLessThan(0.40);

    // Measured 0.030 — a surge is an event, so it stays scarce.
    expect(d.share('critical_success')).toBeLessThan(0.08);
    expect(d.share('critical_success')).toBeGreaterThan(0);

    // THR-728's safety floor: a paid cast never outright fails, at any capability.
    expect(d.share('failure')).toBe(0);
    expect(d.share('critical_failure')).toBe(0);
  });

  it('leaves a weaker god crooked more often — the curve has to be monotone to be a curve', () => {
    const primary = castDistribution(0.35, 'local', AFFINITY_PRIMARY);
    const secondary = castDistribution(0.35, 'local', AFFINITY_SECONDARY);
    const offDomain = castDistribution(0.35, 'local', null);

    expect(secondary.share('success_at_cost')).toBeGreaterThan(primary.share('success_at_cost'));
    expect(offDomain.share('success_at_cost')).toBeGreaterThan(secondary.share('success_at_cost'));
    expect(primary.share('success')).toBeGreaterThan(offDomain.share('success'));
  });
});

// ─── Verdict 2 — the card's odds word ───────────────────────────────────────

/**
 * **Re-pointed by THR-1002, not deleted.**
 *
 * This block used to calibrate `RISK_HINT_THRESHOLDS` — the cut-points behind
 * the retired `riskHintLine`, a sentence the focused card printed under its
 * Effect block. Both the sentence and its cut-points are gone: the card now
 * prints the **forecast tier word**, classified from the probability the roll
 * will actually use, through the same `classifyForecastTier` the encounter
 * forecast reads. So the vocabulary the old assertions calibrated no longer
 * reaches any surface, and a green test on it would have been a green test on a
 * dead contract.
 *
 * What survives is the *purpose*, sharpened. The old purpose was **the card's
 * word is not decorative** — a spread across the corpus, no word dominant. The
 * new purpose is stronger and is the one THR-998 asked for: **the card's word
 * equals the roll's tier**. A spread can be healthy while every individual card
 * lies; equality cannot. So the spread assertion is kept as the anti-degenerate
 * guard, and the truthfulness pin is added above it as the primary claim.
 */
describe('THR-1002 — the card word equals the roll it forecasts', () => {
  it('reads a slot list large enough for a spread to mean anything', () => {
    // Guard against the vacuous pass: a spread assertion over an empty or tiny
    // pool succeeds while proving nothing. Measured 519 at the time of the verdict.
    expect(actorTargetSlots().length).toBeGreaterThan(100);
  });

  it('classifies every live slot from the probability the resolver would use', () => {
    // The truthfulness pin, over the **corpus** rather than a swept grid.
    //
    // `playerCastReadout.test.ts` already pins `castForecastProbability` against
    // `computeResolutionThreshold` across the measured capability × difficulty
    // range. This is the same equality asked of the *actual* templates a player
    // can cast — which is not the same question, because the corpus picks its own
    // scales and difficulties and can hold a combination the sweep's 0.1 steps
    // never land on. The two sides come from genuinely different routes: the left
    // is the card's helper, the right is the resolver's own threshold function.
    //
    // Capability is a fresh god's on a primary reach, the case the card is read in
    // most; the classifier is scale-sensitive, so any capability exercises it.
    const capability = FRESH_GOD_PRIMARY_CAPABILITY;
    let compared = 0;
    for (const template of actorTargetSlots()) {
      const difficulty = maxStepDifficulty(template);
      const scale = template.scale;
      const cardTier = classifyForecastTier(
        castForecastProbability(difficulty, capability, scale),
      );
      const { adjustedDifficulty } = applyScaleDifficultyAdjust(
        difficulty,
        capability,
        CARD_READOUT_SPHERE_FACTOR,
        CARD_READOUT_MODS,
        scale ?? 'regional',
      );
      // The resolver's full post-process, not just its threshold function
      // (THR-1002): `stepResolutionCore` lifts a below-floor probability to the
      // **scale** floor, and `resolveUncontestedStep` short-circuits an unpriced
      // step to 1 before any of this runs. Pinning against the threshold alone is
      // what let two divergences ship green — see `playerCastReadout.test.ts`.
      const resolverTier = classifyForecastTier(
        difficulty === 0
          ? 1
          : Math.max(
            MIN_PROBABILITY_BY_SCALE[scale ?? 'regional'],
            computeResolutionThreshold({
              actorId: ASCENDANT_ID,
              domain: 'stone',
              capability,
              difficulty: Math.max(0, adjustedDifficulty),
              sphereFactor: CARD_READOUT_SPHERE_FACTOR,
              actionModifiers: CARD_READOUT_MODS,
            }),
          ),
      );
      expect(cardTier).toBe(resolverTier);
      compared += 1;
    }
    // The comparison actually ran over the corpus, rather than over nothing.
    expect(compared).toBeGreaterThan(100);
  });

  it('spreads across more than one tier for a fresh god, so the word carries information', () => {
    // The anti-degenerate guard, inherited from the retired block's purpose. A
    // classifier that answers `uncertain` for every card in the corpus is
    // decorative even when it is truthful — the player learns nothing by reading
    // it. Two tiers is the floor; the old block's per-word 5% bound does not port,
    // because the tier ladder has five rungs against the old vocabulary's three
    // and the floor legitimately empties the extremes at some capabilities.
    const capability = FRESH_GOD_SECONDARY_CAPABILITY;
    const seen = new Set<string>();
    for (const template of actorTargetSlots()) {
      seen.add(classifyForecastTier(castForecastProbability(
        maxStepDifficulty(template),
        capability,
        template.scale,
      )));
    }
    expect(seen.size).toBeGreaterThan(1);
  });
});

// ─── The finding the verdict rests on — deliberately pinned (THR-998) ───────

describe('THR-766 — authored difficulty is inert where players actually cast (THR-998)', () => {
  it('resolves the same probability across the whole difficulty range at local and personal scale', () => {
    // `applyScaleDifficultyAdjust` clamps difficulty to
    //   max(0, capability + sphereFactor + mods - MIN_PROBABILITY_BY_SCALE[scale])
    // and a fresh god's capability (0.354 at best) is below both the `personal`
    // floor (0.70) and the `local` floor (0.65) — so that expression is 0 and every
    // authored difficulty resolves identically. Together these two scales are 85%
    // of the slot list.
    //
    // This asserts a real property of the engine, and THR-998 (shipped 2026-08-12)
    // deliberately did not change it — see the file header. The defect was never the
    // flatness; it was the *card* differentiating on a price the flatness had already
    // discarded. So keep this green and keep it honest: if a future change makes
    // authored difficulty bite at these scales, this test should go red and be
    // re-verdicted, because that is a balance change to `MIN_PROBABILITY_BY_SCALE`
    // (direction 3) reaching mortal resolution as well.
    //
    // THR-1000: the probability read is pre-roll, so each cell needs one resolution
    // rather than 400. The assertion is unchanged — same four difficulties, same two
    // scales, same set-collapse — but the eight cells cost eight casts instead of
    // 3200, which is what put this test 13% over the vitest default and blocked PR
    // #1313. The width of the difficulty range is the point of the property and is
    // deliberately not narrowed to buy time.
    for (const scale of ['local', 'personal'] as ActionScale[]) {
      const probabilities = [0.06, 0.25, 0.5, 1.0].map(
        (d) => castReadout(d, scale, AFFINITY_PRIMARY).probability,
      );
      expect(new Set(probabilities).size).toBe(1);
    }
  });

  it('lets difficulty bite at regional scale, where the floor is low enough to clear', () => {
    // The counterweight to the test above: difficulty is not globally dead, so a
    // fix must not simply delete it. `regional`'s floor is 0.20, which a fresh god
    // clears, leaving a real (if narrow) band where authored difficulty moves P.
    const easy = castReadout(0.06, 'regional', AFFINITY_PRIMARY).probability;
    const hard = castReadout(0.5, 'regional', AFFINITY_PRIMARY).probability;
    expect(easy).toBeGreaterThan(hard);
  });
});
