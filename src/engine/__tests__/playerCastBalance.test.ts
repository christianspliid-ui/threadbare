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
 * for 85% of the slot list, so the risk word describes a number that cannot move
 * the player's odds. `difficulty is inert …` below pins that property deliberately;
 * it is the assertion that must go red when THR-998 lands.
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
  RISK_HINT_THRESHOLDS,
  RISK_HINT_WORDS,
  riskHintLine,
  ASCENDANT_CAST_BASE_RAW,
  ASCENDANT_CAST_AFFINITY_WEIGHT,
} from '../../data/player-cast-constants';

const ASCENDANT_ID = 'asc.witness';
const SEEDS = 400;

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

/** Drive `SEEDS` independent casts and return the outcome shares plus the pre-roll reads. */
function castDistribution(difficulty: number, scale: ActionScale, affinity: number | null) {
  const counts: Record<string, number> = {};
  let capability = 0;
  let probability = 0;
  for (let seed = 1; seed <= SEEDS; seed++) {
    resetUnifiedActionCounter();
    const template = makeTemplate(difficulty, scale);
    const state = makeState(affinity);
    const action = createUnifiedAction({
      actorId: ASCENDANT_ID, templateId: template.id, targetId: 'loc-1',
      scale, source: 'player', tick: 10, template,
      rng: () => 0.5, essencePaid: {} as never,
    });
    const result = resolveUncontestedStep(action, template, state, seededRng(seed));
    counts[result.outcome] = (counts[result.outcome] ?? 0) + 1;
    capability = result.capability;
    probability = result.probability;
  }
  const share = (band: string) => (counts[band] ?? 0) / SEEDS;
  return { counts, share, capability, probability };
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

// ─── Verdict 1 — the fresh-god power curve ──────────────────────────────────

describe('THR-766 — fresh-god cast curve: keep BASE_RAW 6 / AFFINITY_WEIGHT 0.5', () => {
  it('places a fresh god on the measured capability band, off-domain through primary reach', () => {
    // Pins the verdict. Any change to either constant moves these and forces a
    // deliberate re-measure rather than a silent re-tune.
    expect(ASCENDANT_CAST_BASE_RAW).toBe(6);
    expect(ASCENDANT_CAST_AFFINITY_WEIGHT).toBe(0.5);

    const offDomain = castDistribution(0.35, 'local', null).capability;
    const secondary = castDistribution(0.35, 'local', AFFINITY_SECONDARY).capability;
    const primary = castDistribution(0.35, 'local', AFFINITY_PRIMARY).capability;

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

// ─── Verdict 2 — the risk-word cut-points ───────────────────────────────────

describe('THR-766 — risk words: keep RISK_HINT_THRESHOLDS [0.25, 0.45]', () => {
  it('reads a slot list large enough for a spread to mean anything', () => {
    // Guard against the vacuous pass: a spread assertion over an empty or tiny
    // pool succeeds while proving nothing. Measured 519 at the time of the verdict.
    expect(actorTargetSlots().length).toBeGreaterThan(100);
  });

  it('produces all three words across the live actor-target slot list, none dominant', () => {
    // The Done-when: a spread, asserted by re-reading the slot list rather than
    // assumed. Measured at the verdict: steady 19% / uncertain 50% / perilous 30%.
    //
    // The ticket's motivating sample ("7 of 10 read perilous") does not reproduce —
    // it was drawn when the pool held ~84 positive-difficulty templates, before the
    // WS5 migration grew it to 519. Every widening candidate tested made the spread
    // worse, not better: [0.35, 0.55] gives 49/38/13 and [0.40, 0.60] gives 61/29/10,
    // both of which trip the 60% dominance bound below.
    const slots = actorTargetSlots();
    const tally: Record<string, number> = { steady: 0, uncertain: 0, perilous: 0 };

    for (const template of slots) {
      const line = riskHintLine(maxStepDifficulty(template));
      const word = RISK_HINT_WORDS.find((w) => line?.includes(w));
      expect(word).toBeDefined();
      tally[word!] += 1;
    }

    for (const word of RISK_HINT_WORDS) {
      const share = tally[word] / slots.length;
      // Every word has to earn its place in the vocabulary.
      expect(share).toBeGreaterThan(0.05);
      // And none may swallow the card face — the failure the ticket was filed on.
      expect(share).toBeLessThan(0.60);
    }
  });

  it('escalates monotonically across the shipped cut-points', () => {
    const [lower, upper] = RISK_HINT_THRESHOLDS;
    expect(lower).toBeLessThan(upper);
    expect(riskHintLine(lower - 0.01)).toContain(RISK_HINT_WORDS[0]);
    expect(riskHintLine(lower)).toContain(RISK_HINT_WORDS[1]);
    expect(riskHintLine(upper - 0.01)).toContain(RISK_HINT_WORDS[1]);
    expect(riskHintLine(upper)).toContain(RISK_HINT_WORDS[2]);
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
    // This asserts a defect on purpose: it is the property THR-998 exists to remove,
    // and this is the test that should go red when it does. Do not relax it to keep
    // it green — delete it, and say so in the commit that fixes THR-998.
    for (const scale of ['local', 'personal'] as ActionScale[]) {
      const probabilities = [0.06, 0.25, 0.5, 1.0].map(
        (d) => castDistribution(d, scale, AFFINITY_PRIMARY).probability,
      );
      expect(new Set(probabilities).size).toBe(1);
    }
  });

  it('lets difficulty bite at regional scale, where the floor is low enough to clear', () => {
    // The counterweight to the test above: difficulty is not globally dead, so a
    // fix must not simply delete it. `regional`'s floor is 0.20, which a fresh god
    // clears, leaving a real (if narrow) band where authored difficulty moves P.
    const easy = castDistribution(0.06, 'regional', AFFINITY_PRIMARY).probability;
    const hard = castDistribution(0.5, 'regional', AFFINITY_PRIMARY).probability;
    expect(easy).toBeGreaterThan(hard);
  });
});
