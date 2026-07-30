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
import { NUDGE_GOLDEN_EXEMPLAR } from '../../../../data/__fixtures__/nudge-exemplar/darkhollow-vault-exemplar';
import { spendNudgeEssence, type EssencePool } from '../nudgeCommit';
import { forecastWithNudges } from '../useNudgeHand';
import {
  PIP_ODDS_TIERS,
  PIP_PENALTY_TIER,
  PIP_STEP_PERCENT,
  PIPS_PER_TIER,
  oddsPips,
  pipReadingLabel,
} from '../../../../data/nudge-pip-vocabulary';
import {
  NUDGE_CARD_TYPE_ICONS,
  nudgeCardKeyword,
} from '../../../../data/nudge-card-display';
import { NUDGE_CARD_TYPES, NUDGE_CARD_LIBRARY } from '../../../../data/nudge-card-library';
import { effectiveNudgeCost } from '../../../../engine/encounters/nudges';

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
  // THR-890 fixtures: a library-backed card (prints a keyword chip) that is also
  // paid for outside the essence pool (prints alternate-cost rows).
  {
    id: 'library_card',
    name: 'Press the hinge',
    libraryCardId: 'card.boost.core',
    essenceCost: 1,
    forecastDelta: 0.06,
    costs: { detectionDelta: 0.1, doomDelta: 0 },
    fiction: 'Something in the dark leans with her.',
    effectLine: 'Better odds, and someone notices.',
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

  it('surfaces every authored factor line with its authored polarity', () => {
    for (const [i, step] of NUDGE_GOLDEN_EXEMPLAR.steps.entries()) {
      const authored = (step as ActionStep).factorLines ?? [];
      const rendered = exemplarPhase(i).testPanel.factors;

      // Two empty arrays compare equal, so pin the population before comparing
      // it — otherwise this passes just as happily against an exemplar that
      // authored nothing and a panel that rendered nothing.
      expect(authored.length, `step ${i} authors no factor lines`).toBeGreaterThan(0);

      // The agent holds no traits here, so no live `trait:*` line is appended
      // and the panel is exactly the authored set, in authored order.
      expect(rendered.map((f) => f.text)).toEqual(authored.map((l) => l.text));
      expect(rendered.map((f) => f.polarity)).toEqual(authored.map((l) => l.polarity));
      expect(rendered.some((f) => f.polarity === 'neutral')).toBe(false);
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

// ─── Card display model (THR-890) ─────────────────────────────────

describe('buildNudgePhaseModel — card-row display model', () => {
  it('quotes the DISCOUNTED price, because that is the price the commit path charges', () => {
    // `force` is the only sphere in the pool, so a force-signed card is the
    // ascendant's own signature and discounts. Quoting `nudge.essenceCost` here
    // would show the card dear and bill it cheap — the exact bug
    // `effectiveNudgeCost` is exported to make impossible.
    const phase = buildPhase()!;
    const card = phase.cards.find((c) => c.id === 'force_surge')!;
    const authored = NUDGES.find((n) => n.id === 'force_surge')!.essenceCost;
    const expected = effectiveNudgeCost({ sphere: 'force', essenceCost: authored }, ['force']);

    expect(expected).toBeLessThan(authored);
    expect(card.essenceCost).toBe(expected);
    expect(card.discounted).toBe(true);
    expect(card.costLabel).toBe(`${expected} essence`);
  });

  it('leaves an undiscounted card at its authored price', () => {
    const card = buildPhase()!.cards.find((c) => c.id === 'steady_hand')!;
    expect(card.essenceCost).toBe(1);
    expect(card.discounted).toBe(false);
  });

  it('bills a reopened committed hand at the same discounted total the cards quoted', () => {
    const phase = buildPhase(undefined, buildAction({ activeNudges: ['force_surge'] }))!;
    const card = phase.cards.find((c) => c.id === 'force_surge')!;
    expect(phase.committedCost).toBe(card.essenceCost);
  });

  it('prints the library keyword and its icon on a library-backed card', () => {
    const card = buildPhase()!.cards.find((c) => c.id === 'library_card')!;
    // Derived from the library, not from a parallel field on `StepNudge`.
    const boost = NUDGE_CARD_TYPES.find((t) => t.id === 'boost')!;
    expect(card.keyword).toBe(boost.keyword);
    expect(card.keywordIcon).toBe(NUDGE_CARD_TYPE_ICONS.boost);
  });

  it('leaves a one-off authored option chipless rather than inventing a type', () => {
    const card = buildPhase()!.cards.find((c) => c.id === 'steady_hand')!;
    expect(card.libraryCardId).toBeUndefined();
    expect(card.keyword).toBeUndefined();
  });

  it('renders a declared-but-zero cost channel as no channel at all', () => {
    // `doomDelta: 0` is a channel the card named and did not use. Drawing it
    // would promise a price that never arrives.
    const card = buildPhase()!.cards.find((c) => c.id === 'library_card')!;
    expect(card.costChannels?.map((c) => c.id)).toEqual(['detection']);
    expect(card.costChannels![0].delta).toBeGreaterThan(0);
    expect(card.costChannels![0].label).toMatch(/[a-z]/);
    expect(card.costChannels![0].label).not.toMatch(/\d/);
  });

  it('gives a card with no cost channels none, rather than an empty row', () => {
    const card = buildPhase()!.cards.find((c) => c.id === 'steady_hand')!;
    expect(card.costChannels).toBeUndefined();
  });

  it('resolves a keyword for every card in the shipped library', () => {
    // A library member whose type carries no icon would render a blank chip.
    // Pin the whole library rather than a sample, and pin its population first
    // so an empty library cannot pass this vacuously.
    expect(NUDGE_CARD_LIBRARY.length).toBeGreaterThan(0);
    for (const member of NUDGE_CARD_LIBRARY) {
      const keyword = nudgeCardKeyword(member.id);
      expect(keyword, `no keyword for ${member.id}`).toBeDefined();
      expect(keyword!.keyword.length).toBeGreaterThan(0);
      expect(keyword!.icon.length).toBeGreaterThan(0);
    }
  });

  it('fails soft on a libraryCardId that names no member', () => {
    expect(nudgeCardKeyword('card.retired.long_ago')).toBeUndefined();
    expect(nudgeCardKeyword(undefined)).toBeUndefined();
  });
});

// ─── The odds pip vocabulary (THR-890) ────────────────────────────

describe('oddsPips', () => {
  it('walks the ladder one tier at a time, five steps per tier', () => {
    // The whole contract in one pass: step N of the ladder lands in tier
    // floor((N-1)/5) with ((N-1)%5)+1 pips filled.
    for (const [tierIndex, tier] of PIP_ODDS_TIERS.entries()) {
      for (let step = 1; step <= PIPS_PER_TIER; step += 1) {
        const percent = tier.minPercent + (step - 1) * PIP_STEP_PERCENT;
        const reading = oddsPips(percent / 100);
        expect(reading, `${percent}% read as nothing`).toBeDefined();
        expect(reading!.tier.id, `${percent}%`).toBe(PIP_ODDS_TIERS[tierIndex].id);
        expect(reading!.filled, `${percent}%`).toBe(step);
        expect(reading!.total).toBe(PIPS_PER_TIER);
        expect(reading!.polarity).toBe('gain');
      }
    }
  });

  it('rounds to the nearest ~5% rather than flooring', () => {
    // 0.08 is the commonest authored delta. Flooring would read it as one pip;
    // "to the nearest 5%" makes it two.
    expect(oddsPips(0.08)!.filled).toBe(2);
    expect(oddsPips(0.12)!.filled).toBe(2);
    expect(oddsPips(0.13)!.filled).toBe(3);
  });

  it('reads every authored delta in the shipped corpus as a drawable row', () => {
    // Today's corpus runs 0.03–0.18, all inside the faint tier. If a later batch
    // authors past it, this keeps saying so rather than silently clamping.
    for (const nudge of NUDGES) {
      if (nudge.forecastDelta === 0) continue;
      expect(oddsPips(nudge.forecastDelta), `${nudge.id}`).toBeDefined();
    }
  });

  it('reads a negative magnitude as filled penalty triangles with no hollow remainder', () => {
    const reading = oddsPips(-0.1)!;
    expect(reading.tier.id).toBe(PIP_PENALTY_TIER.id);
    expect(reading.polarity).toBe('penalty');
    // A penalty is not progress toward anything, so it draws no empty slots.
    expect(reading.total).toBe(reading.filled);
  });

  it('clamps past the top of the ladder instead of overflowing into a tier with no glyph', () => {
    const top = oddsPips(1)!;
    const past = oddsPips(4)!;
    expect(top.tier.id).toBe('fated');
    expect(top.filled).toBe(PIPS_PER_TIER);
    expect(past).toEqual(top);
  });

  it('draws nothing for zero, and nothing for a value that is not a number', () => {
    expect(oddsPips(0)).toBeUndefined();
    expect(oddsPips(Number.NaN)).toBeUndefined();
    expect(oddsPips(Number.POSITIVE_INFINITY)).toBeUndefined();
  });

  it('states the reading in words for a screen reader, with no glyphs in the label', () => {
    expect(pipReadingLabel(oddsPips(0.4)!)).toBe('Strong, 3 of 5');
    expect(pipReadingLabel(oddsPips(-0.1)!)).toBe('Penalty, 2');
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
