/**
 * Nudge stage — THR-775 (WS2 interface).
 *
 * Covers the three pure surfaces the interface is built on: the per-code render
 * policy in `buildNudgePhaseModel`, the all-or-nothing essence spend in
 * `spendNudgeEssence`, and the forecast recompute both the hand and the commit
 * handler share.
 */

import { describe, expect, it } from 'vitest';
import { WorldGraph } from '../../../../engine/graph';
import type { SphereName } from '../../../../types/index';
import type { GameState } from '../../../../types/gameState';
import type {
  ActionStep,
  StepNudge,
  UnifiedAction,
  UnifiedActionTemplate,
} from '../../../../types/unifiedAction';
import { buildNudgePhaseModel } from '../adapters/buildNudgePhaseModel';
import { NUDGE_GOLDEN_EXEMPLAR } from '../../../../data/__fixtures__/nudge-exemplar/swollen-ford-exemplar';
import { spendNudgeEssence, type EssencePool } from '../nudgeCommit';
import { forecastWithNudges } from '../useNudgeHand';

// ─── Fixtures ─────────────────────────────────────────────────────

const NUDGES: StepNudge[] = [
  {
    id: 'steady_hand',
    name: 'Steady the hand',
    essenceCost: 1,
    forecastDelta: 0.08,
    fiction: 'The tremor in her fingers stops between one breath and the next.',
    effectLine: 'Steadier than she was.',
  },
  {
    id: 'force_surge',
    name: 'Lend her strength',
    sphere: 'force' as SphereName,
    essenceCost: 2,
    forecastDelta: 0.12,
    rider: 'no_crit_fail',
    fiction: 'The bar gives where her shoulder meets it.',
    effectLine: 'Nothing catastrophic can follow.',
  },
  {
    id: 'costly_blessing',
    name: 'A greater blessing',
    essenceCost: 99,
    forecastDelta: 0.2,
    fiction: 'Light pools in the doorway and does not move.',
    effectLine: 'Far beyond your means.',
  },
  {
    id: 'locked_sphere',
    name: 'Unmake the lock',
    sphere: 'entropy' as SphereName,
    essenceCost: 1,
    forecastDelta: 0.15,
    fiction: 'The iron reddens, flakes, and falls away.',
    effectLine: 'A sphere you do not hold.',
  },
  {
    id: 'trait_only',
    name: 'Recall the old road',
    requiredTrait: 'trait.wayfarer',
    essenceCost: 0,
    forecastDelta: 0.1,
    fiction: 'She has walked this stone before, in worse weather.',
    effectLine: 'Only for one who has walked it.',
  },
];

const STEP: ActionStep = {
  reach: 'iron',
  duration: { min: 1, max: 2 },
  difficulty: 0.5,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate: 'The vault door has not moved in a hundred years.',
  nudges: NUDGES,
};

const TEMPLATE: UnifiedActionTemplate = {
  id: 'test.nudge_encounter',
  rarityTier: 1,
  intrinsicTier: 'background',
  name: 'The Darkhollow Vault',
  reach: 'iron',
  crudType: 'read',
  scale: 'local',
  steps: [STEP],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['courage_prudence'],
  narrativeTemplates: {
    initiation: 'The vault door has not moved in a hundred years.',
    success: 'It moves.',
    failure: 'It does not move.',
  },
};

function buildGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'agent.thief',
    type: 'actor',
    name: 'Sera Vance',
    properties: { actorType: 'individual' },
  });
  graph.addNode({ id: 'loc.vault', type: 'location', name: 'Darkhollow Vault', properties: {} });
  return graph;
}

function buildAction(overrides?: Partial<UnifiedAction>): UnifiedAction {
  return {
    actionId: 'ua_nudge_1',
    actorId: 'agent.thief',
    templateId: TEMPLATE.id,
    targetId: 'loc.vault',
    scale: 'local',
    source: 'agent',
    startTick: 3,
    currentStep: 0,
    stepProgress: 0,
    stepDuration: 2,
    resolved: false,
    stepOutcomes: [],
    ...overrides,
  };
}

/** A pool holding only `force` — so `entropy` cards are sphere-locked. */
function buildState(force = 3): Partial<GameState> {
  return {
    essencePool: { force } as unknown as GameState['essencePool'],
    unlockedActionIds: [],
  };
}

function buildPhase(stateOverride?: Partial<GameState>, action = buildAction()) {
  return buildNudgePhaseModel({
    template: TEMPLATE,
    activeAction: action,
    step: STEP,
    graph: buildGraph(),
    gameState: (stateOverride ?? buildState()) as GameState,
  });
}

// ─── Render policy ────────────────────────────────────────────────

describe('buildNudgePhaseModel — per-NudgeBlockedCode render policy', () => {
  it('returns undefined for a step with no authored hand, so legacy templates keep the legacy screen', () => {
    const bare: ActionStep = { ...STEP, nudges: undefined };
    const phase = buildNudgePhaseModel({
      template: { ...TEMPLATE, steps: [bare] },
      activeAction: buildAction(),
      step: bare,
      graph: buildGraph(),
      gameState: buildState() as GameState,
    });
    expect(phase).toBeUndefined();
  });

  it('renders affordable cards as playable', () => {
    const phase = buildPhase()!;
    const playable = phase.cards.filter((c) => c.state === 'playable').map((c) => c.id);
    expect(playable).toContain('steady_hand');
    expect(playable).toContain('force_surge');
  });

  it('dims an unaffordable card WITH its reason rather than hiding it', () => {
    const phase = buildPhase()!;
    const costly = phase.cards.find((c) => c.id === 'costly_blessing');
    // The Vision audit's blocking find: budget changes inside one encounter, so
    // hiding this card would make it flicker as the player toggles spends.
    expect(costly).toBeDefined();
    expect(costly!.state).toBe('dimmed');
    expect(costly!.blockedCode).toBe('essence_unavailable');
    expect(costly!.blockedReason).toBeTruthy();
  });

  it('withholds sphere_locked and unlock_missing from the player stage (ruling 4)', () => {
    const phase = buildPhase()!;
    expect(phase.cards.map((c) => c.id)).not.toContain('locked_sphere');
    const withheld = phase.withheld.find((w) => w.id === 'locked_sphere');
    expect(withheld?.blockedCode).toBe('sphere_locked');
  });

  it('never renders a trait_missing card, and lists it for the designer', () => {
    const phase = buildPhase()!;
    expect(phase.cards.map((c) => c.id)).not.toContain('trait_only');
    expect(phase.withheld.find((w) => w.id === 'trait_only')?.blockedCode).toBe('trait_missing');
  });

  it('carries words, not numerals, on the player-facing fields', () => {
    const phase = buildPhase()!;
    expect(phase.testPanel.difficultyWord).toMatch(/^[a-z]+$/);
    expect(phase.baseForecast.word).toMatch(/^[A-Z][a-z]+$/);
  });

  it('restores an already-committed hand when the stage reopens', () => {
    const phase = buildPhase(undefined, buildAction({ activeNudges: ['steady_hand'] }))!;
    expect(phase.committedIds).toEqual(['steady_hand']);
    expect(phase.committedCost).toBe(1);
  });

  it('fails soft on an absent essence pool rather than throwing', () => {
    const phase = buildPhase({ unlockedActionIds: [] } as Partial<GameState> as GameState)!;
    expect(phase).toBeDefined();
    expect(phase.availableEssence).toBe(0);
  });
});

// ─── Authored test-panel data (THR-820) ───────────────────────────
//
// The point of these: assert against `buildNudgePhaseModel` OUTPUT, driven by
// the real golden exemplar. The predecessor assertions read the exemplar's
// fixture constants directly, which is why they stayed green for a field no
// render path could reach.

describe('buildNudgePhaseModel — authored purpose line and factor lines', () => {
  /** Build a phase from the real exemplar at `stepIndex`. */
  function exemplarPhase(stepIndex: number) {
    const step = NUDGE_GOLDEN_EXEMPLAR.steps[stepIndex] as ActionStep;
    return buildNudgePhaseModel({
      template: NUDGE_GOLDEN_EXEMPLAR,
      activeAction: buildAction({
        templateId: NUDGE_GOLDEN_EXEMPLAR.id,
        currentStep: stepIndex,
      }),
      step,
      graph: buildGraph(),
      gameState: buildState() as GameState,
    })!;
  }

  it('surfaces every authored purpose line on the rendered panel', () => {
    for (const [i, step] of NUDGE_GOLDEN_EXEMPLAR.steps.entries()) {
      const authored = (step as ActionStep).purposeLine;
      expect(exemplarPhase(i).testPanel.purposeLine).toBe(authored);
    }
  });

  it('surfaces authored factor lines with their authored polarity (legacy templates)', () => {
    // The exemplar authors no static factor lines (the variance rule,
    // Christian 2026-07-30) — but un-migrated templates still carry them, so
    // the THR-820 pass-through path stays covered by a synthetic step built
    // from exemplar step 0 plus authored lines.
    const base = NUDGE_GOLDEN_EXEMPLAR.steps[0] as ActionStep;
    const authored = [
      { text: 'A carried lantern gives them light to read by.', polarity: 'for' as const },
      { text: 'The dark is coming down faster than the reading.', polarity: 'against' as const },
    ];
    const step: ActionStep = { ...base, factorLines: authored };
    const phase = buildNudgePhaseModel({
      template: { ...NUDGE_GOLDEN_EXEMPLAR, steps: [step] },
      activeAction: buildAction({ templateId: NUDGE_GOLDEN_EXEMPLAR.id, currentStep: 0 }),
      step,
      graph: buildGraph(),
      gameState: buildState() as GameState,
    })!;

    const rendered = phase.testPanel.factors;
    // The agent holds no traits here, so no live `trait:*` line is appended
    // and the panel is exactly the authored set, in authored order.
    expect(rendered.map((f) => f.text)).toEqual(authored.map((l) => l.text));
    expect(rendered.map((f) => f.polarity)).toEqual(authored.map((l) => l.polarity));
    expect(rendered.some((f) => f.polarity === 'neutral')).toBe(false);
  });

  it('the exemplar itself authors no static factor lines (the variance rule)', () => {
    for (const [i, step] of NUDGE_GOLDEN_EXEMPLAR.steps.entries()) {
      expect((step as ActionStep).factorLines ?? [], `step ${i}`).toEqual([]);
    }
  });

  it('falls back to unsigned contract factors when a step authors none', () => {
    // The un-migrated path every pre-nudge template still takes: no authored
    // lines, so whatever the contract yields renders `neutral` rather than
    // claiming a sign the encounter never stated.
    const phase = buildPhase()!;
    expect(phase.testPanel.purposeLine).toBeUndefined();
    for (const factor of phase.testPanel.factors) {
      expect(factor.polarity).toBe('neutral');
    }
  });
});

// ─── Forecast recompute ───────────────────────────────────────────

describe('forecastWithNudges', () => {
  it('is pure — the same selection yields the same forecast every call', () => {
    const phase = buildPhase()!;
    const a = forecastWithNudges(phase, ['steady_hand']);
    const b = forecastWithNudges(phase, ['steady_hand']);
    expect(a).toEqual(b);
  });

  it('a positive-delta nudge never lowers the probability', () => {
    const phase = buildPhase()!;
    const before = forecastWithNudges(phase, []).probability;
    const after = forecastWithNudges(phase, ['steady_hand', 'force_surge']).probability;
    expect(after).toBeGreaterThanOrEqual(before);
  });

  it('an unknown id contributes nothing rather than throwing', () => {
    const phase = buildPhase()!;
    expect(forecastWithNudges(phase, ['no_such_card'])).toEqual(forecastWithNudges(phase, []));
  });

  it('moves the tier WORD when the actor is not pinned to the probability floor', () => {
    // The recompute is only *visible* between the floor (0.05) and ceiling (0.95).
    // An actor far below the floor stays `doomed` no matter what is played — which
    // is the engine being honest, not the hand being inert — so this pins the
    // behaviour that matters at a capability where the word can actually move.
    const phase = buildPhase()!;
    const capable = {
      ...phase,
      forecastInput: { ...phase.forecastInput, capability: 0.75, difficulty: 0.5 },
    };
    const before = forecastWithNudges(capable, []);
    const after = forecastWithNudges(capable, ['steady_hand', 'force_surge']);

    expect(after.probability).toBeGreaterThan(before.probability);
    expect(after.tier).not.toBe(before.tier);
    expect(after.word).not.toBe(before.word);
  });

  it('stays pinned — and stays honest — when the actor is below the floor', () => {
    const phase = buildPhase()!;
    const hopeless = {
      ...phase,
      forecastInput: { ...phase.forecastInput, capability: 0.02, difficulty: 0.9 },
    };
    const before = forecastWithNudges(hopeless, []);
    const after = forecastWithNudges(hopeless, ['steady_hand', 'force_surge']);
    // Same word, because a small nudge genuinely cannot save this. The stage must
    // not fake movement it did not earn.
    expect(after.tier).toBe(before.tier);
    expect(after.probability).toBe(before.probability);
  });
});

// ─── Essence spend ────────────────────────────────────────────────

describe('spendNudgeEssence', () => {
  const pool = (over: Partial<Record<SphereName, number>>): EssencePool =>
    ({ force: 0, matter: 0, energy: 0, life: 0, mind: 0, spirit: 0, time: 0, entropy: 0,
       chaos: 0, order: 0, light: 0, darkness: 0, ...over } as EssencePool);

  it('charges a sphere-gated card against its own sphere', () => {
    const result = spendNudgeEssence(pool({ force: 5 }), [{ sphere: 'force', cost: 2 }], 'mind');
    expect(result.ok).toBe(true);
    expect(result.pool.force).toBe(3);
    expect(result.spent).toBe(2);
  });

  it('charges a common card against the primary sphere first', () => {
    const result = spendNudgeEssence(pool({ mind: 4, force: 4 }), [{ sphere: undefined, cost: 3 }], 'mind');
    expect(result.ok).toBe(true);
    expect(result.pool.mind).toBe(1);
    expect(result.pool.force).toBe(4);
  });

  it('spills a common card across spheres, because affordability read the pooled total', () => {
    const result = spendNudgeEssence(pool({ mind: 1, force: 4 }), [{ sphere: undefined, cost: 3 }], 'mind');
    expect(result.ok).toBe(true);
    expect(result.pool.mind).toBe(0);
    expect(result.pool.force).toBe(2);
    expect(result.spent).toBe(3);
  });

  it('rejects all-or-nothing and leaves the pool untouched on a shortfall', () => {
    const original = pool({ force: 1 });
    const result = spendNudgeEssence(original, [{ sphere: 'force', cost: 5 }], 'mind');
    expect(result.ok).toBe(false);
    expect(result.spent).toBe(0);
    expect(result.pool).toBe(original);
    expect(result.shortfallSphere).toBe('force');
  });

  it('does not let a common card strand a sphere-gated one', () => {
    // The common card would happily eat all the `force` if it went first,
    // leaving the force-gated card unpayable from a pool that could afford both.
    const result = spendNudgeEssence(
      pool({ force: 3 }),
      [{ sphere: undefined, cost: 2 }, { sphere: 'force', cost: 2 }],
      'force',
    );
    expect(result.ok).toBe(false);
    expect(result.spent).toBe(0);
  });

  it('treats a free (trait) card as free', () => {
    const result = spendNudgeEssence(pool({ force: 1 }), [{ sphere: undefined, cost: 0 }], 'force');
    expect(result.ok).toBe(true);
    expect(result.spent).toBe(0);
    expect(result.pool.force).toBe(1);
  });
});
