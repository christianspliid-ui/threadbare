/**
 * The dealer — THR-1247.
 *
 * Two things these tests are built to prevent, both of which would pass a naive
 * suite:
 *
 * 1. **A vacuous pass.** Several cases below assert against a repertoire that
 *    genuinely contains dealable members, and assert a *non-empty* result before
 *    asserting anything about its contents. A dealer that returned `[]` for
 *    every input would satisfy most "the hand stays inside its bounds" phrasings.
 * 2. **The shown-but-inert card.** The integration case proves a dealt card
 *    survives the round trip into the shape resolution reads — because composing
 *    only on the render path would look completely correct here and ship a card
 *    that renders, charges, and does nothing.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import {
  DEALT_NUDGE_ID_PREFIX,
  composeDealtStep,
  composeDealtStepFromState,
  dealHand,
  isDealtNudgeId,
  lastDealReport,
  mintDealtNudge,
  recordDealReport,
  resetDealReport,
} from '../encounters/dealHand';
import {
  BAND_FRAGMENTS,
  NUDGE_CARD_LIBRARY,
  PLAY_PROFILES,
  dealableMembers,
  nudgeCardMember,
  profiledCardCount,
} from '../../data/nudge-card-library';
import { buildRepertoire, validateRepertoire } from '../nudgeCardRepertoire';
import type { RepertoireEntry } from '../nudgeCardRepertoire';
import {
  DEAL_COMMON_OPTIONS_MIN,
  DEAL_FAILURE_BAND_OUTCOMES,
  DEAL_HAND_MAX,
  DEAL_HAND_MAX_TOTAL_DELTA,
  DEAL_HAND_MIN,
  DEAL_SPHERE_COVERAGE_MIN,
} from '../../data/nudge-constants';
import {
  FAILURE_BAND_OUTCOMES,
  HAND_COMMON_OPTIONS_MIN,
  HAND_SPHERE_COVERAGE_MIN,
  NUDGE_HAND_MAX,
  NUDGE_HAND_MAX_TOTAL_DELTA,
  NUDGE_HAND_MIN,
} from '../../data/content-eval/nudgeAuthoringConstants';
import type { ActionStep, StepNudge } from '../../types/unifiedAction';
import {
  collectNudgeBandProse,
  collectNudgeModifiers,
  sumModifiers,
  totalNudgeCost,
} from '../encounters/nudges';
import { collectNudgeCostChannels } from '../encounters/nudgeDispatch';

// ─── Fixtures ────────────────────────────────────────────────────────

/**
 * A repertoire holding *every* library member, so the dealer's own filters are
 * what narrow the pool rather than the fixture. A fixture that pre-narrowed to
 * the two profiled members would make the "skips a member with no profile"
 * assertions below verify the fixture rather than the code.
 */
function fullRepertoire(): readonly RepertoireEntry[] {
  return NUDGE_CARD_LIBRARY.map((member) => ({
    member,
    access: 'full' as const,
    source: member.sphere ? ('signature' as const) : ('core' as const),
  }));
}

function stepWithDeal(overrides: Partial<ActionStep> = {}): Pick<ActionStep, 'nudges' | 'deal'> {
  return { deal: { count: 4 }, ...overrides } as Pick<ActionStep, 'nudges' | 'deal'>;
}

const DARKNESS = { primarySphere: 'darkness' as const, secondarySphere: 'order' as const };

beforeEach(() => {
  resetDealReport();
});

// ─── The library tables ──────────────────────────────────────────────

describe('play profiles and band fragments', () => {
  it('ships at least the two reference profiles the ticket scopes', () => {
    // The floor, not the target. THR-1248 authors the corpus; this asserts the
    // path is exercised by more than one member, and by one of each access kind.
    expect(profiledCardCount()).toBeGreaterThanOrEqual(2);
    const profiled = NUDGE_CARD_LIBRARY.filter((m) => PLAY_PROFILES[m.id]);
    expect(profiled.some((m) => m.sphere === undefined)).toBe(true); // universal core
    expect(profiled.some((m) => m.sphere !== undefined)).toBe(true); // sphere signature
  });

  it('every profiled member is payable in at least one failure band', () => {
    // The payoff-at-every-band law, library-side. A profiled member with no
    // failure fragment would deal, cost essence, and then vanish from the
    // account of what went wrong.
    const profiled = NUDGE_CARD_LIBRARY.filter((m) => PLAY_PROFILES[m.id]);
    expect(profiled.length).toBeGreaterThan(0); // guard against a vacuous pass
    for (const member of profiled) {
      const bands = Object.keys(BAND_FRAGMENTS[member.id] ?? {});
      expect(bands.length, `${member.id} has no band fragments`).toBeGreaterThan(0);
      expect(
        bands.some((b) => DEAL_FAILURE_BAND_OUTCOMES.includes(b as never)),
        `${member.id} pays off no failure band`,
      ).toBe(true);
    }
  });

  it('every profile keys a member the library actually builds', () => {
    for (const id of Object.keys(PLAY_PROFILES)) {
      expect(nudgeCardMember(id), `PLAY_PROFILES key '${id}' is not a library member`).toBeDefined();
    }
    for (const id of Object.keys(BAND_FRAGMENTS)) {
      expect(nudgeCardMember(id), `BAND_FRAGMENTS key '${id}' is not a library member`).toBeDefined();
    }
  });

  it('validateRepertoire reports profile/fragment disagreement by name', () => {
    const report = validateRepertoire();
    expect(report.unpayableProfiles).toEqual([]);
    expect(report.profilelessFragments).toEqual([]);
    expect(report.winOnlyFragments).toEqual([]);
    // The sweep must have looked at the library, not at nothing.
    expect(report.checkedKeys).toBeGreaterThan(NUDGE_CARD_LIBRARY.length);
  });
});

// ─── The boundary mirror ─────────────────────────────────────────────

describe('dealer bounds agree with the authoring guardrails', () => {
  /*
   * `content-eval/nudgeAuthoringConstants.ts` is authoring-time only and forbids
   * import from `src/engine/**`, so the dealer cannot read the originals and
   * carries its own copies. This is the only thing standing between those two
   * sets of numbers and silent divergence — if it fails, reconcile the copies in
   * `nudge-constants.ts`, never weaken this test.
   */
  it('mirrors every hand bound exactly', () => {
    expect(DEAL_HAND_MIN).toBe(NUDGE_HAND_MIN);
    expect(DEAL_HAND_MAX).toBe(NUDGE_HAND_MAX);
    expect(DEAL_HAND_MAX_TOTAL_DELTA).toBe(NUDGE_HAND_MAX_TOTAL_DELTA);
    expect(DEAL_SPHERE_COVERAGE_MIN).toBe(HAND_SPHERE_COVERAGE_MIN);
    expect(DEAL_COMMON_OPTIONS_MIN).toBe(HAND_COMMON_OPTIONS_MIN);
    expect([...DEAL_FAILURE_BAND_OUTCOMES]).toEqual([...FAILURE_BAND_OUTCOMES]);
  });
});

// ─── Minting ─────────────────────────────────────────────────────────

describe('mintDealtNudge', () => {
  it('mints an ordinary StepNudge carrying the profile’s mechanics', () => {
    const member = nudgeCardMember('card.veil.signature.darkness')!;
    const profile = PLAY_PROFILES[member.id]!;
    const nudge = mintDealtNudge(member, profile);

    expect(nudge.id).toBe(`${DEALT_NUDGE_ID_PREFIX}${member.id}`);
    expect(nudge.libraryCardId).toBe(member.id);
    expect(nudge.essenceCost).toBe(profile.essenceCost);
    expect(nudge.forecastDelta).toBe(profile.forecastDelta);
    expect(nudge.costs).toEqual(profile.costs);
    expect(nudge.sphere).toBe('darkness');
    expect(nudge.bandProse).toEqual(BAND_FRAGMENTS[member.id]);
  });

  it('surfaces no flavor quote (Prose Doctrine v2)', () => {
    // The doctrine retired the quote by name. Minting is the newest surface in
    // the system and must not be where it comes back.
    const member = nudgeCardMember('card.boost.core')!;
    const nudge = mintDealtNudge(member, PLAY_PROFILES[member.id]!);
    expect(nudge.fiction).toBe('');
    expect(nudge.effectLine).not.toMatch(/\d/u); // words only, never a numeral
  });

  it('namespaces ids so a dealt card can never collide with an authored one', () => {
    const member = nudgeCardMember('card.boost.core')!;
    const nudge = mintDealtNudge(member, PLAY_PROFILES[member.id]!);
    expect(isDealtNudgeId(nudge.id)).toBe(true);
    expect(isDealtNudgeId('authored_boost')).toBe(false);
  });
});

// ─── Dealing ─────────────────────────────────────────────────────────

describe('dealHand', () => {
  it('deals nothing when the step declares no fill', () => {
    const result = dealHand({ nudges: [] }, fullRepertoire(), DARKNESS);
    expect(result.nudges).toEqual([]);
    expect(result.report.requested).toBe(0);
  });

  it('deals only members with both a profile and fragments', () => {
    const result = dealHand(stepWithDeal(), fullRepertoire(), DARKNESS);
    // Non-vacuous: the pool really does contain dealable members.
    expect(result.nudges.length).toBeGreaterThan(0);
    const dealableIds = new Set(dealableMembers().map((m) => m.id));
    for (const nudge of result.nudges) {
      expect(dealableIds.has(nudge.libraryCardId!)).toBe(true);
    }
    // And it really did consider — and reject — the rest of the library.
    expect(result.report.candidates.some((c) => c.eliminated === 'no_profile')).toBe(true);
  });

  it('is deterministic — same inputs, same cards in the same order', () => {
    const a = dealHand(stepWithDeal(), fullRepertoire(), DARKNESS);
    const b = dealHand(stepWithDeal(), fullRepertoire(), DARKNESS);
    expect(a.nudges.map((n) => n.id)).toEqual(b.nudges.map((n) => n.id));
    // The property the whole design rests on: a dealt hand replays from a save.
    expect(a.nudges.length).toBeGreaterThan(0);
  });

  it('ranks the god’s own sphere above an unheld one', () => {
    const dark = dealHand(stepWithDeal(), fullRepertoire(), DARKNESS).report.candidates;
    const veil = dark.find((c) => c.cardId === 'card.veil.signature.darkness')!;
    expect(veil.sphereTerm).toBeGreaterThan(0);

    const offSphere = dealHand(stepWithDeal(), fullRepertoire(), {
      primarySphere: 'light',
      secondarySphere: 'life',
    }).report.candidates;
    const veilOff = offSphere.find((c) => c.cardId === 'card.veil.signature.darkness')!;
    expect(veilOff.sphereTerm).toBeLessThan(veil.sphereTerm);
  });

  it('scores a context-tag match above no match', () => {
    const untagged = dealHand(stepWithDeal(), fullRepertoire(), DARKNESS).report.candidates;
    const tagged = dealHand(
      stepWithDeal(),
      fullRepertoire(),
      { ...DARKNESS, tags: ['shadow'] },
    ).report.candidates;

    const before = untagged.find((c) => c.cardId === 'card.veil.signature.darkness')!;
    const after = tagged.find((c) => c.cardId === 'card.veil.signature.darkness')!;
    expect(before.tagTerm).toBe(0);
    expect(after.tagTerm).toBeGreaterThan(0);
    expect(after.score).toBeGreaterThan(before.score);
  });

  it('gives an earned member a provenance bonus over a starting one', () => {
    const earned: RepertoireEntry[] = [
      { member: nudgeCardMember('card.boost.core')!, access: 'full', source: 'core' },
      {
        member: nudgeCardMember('card.veil.signature.darkness')!,
        access: 'full',
        source: 'sphere_attunement',
      },
    ];
    const report = dealHand(stepWithDeal(), earned, DARKNESS).report;
    const veil = report.candidates.find((c) => c.cardId === 'card.veil.signature.darkness')!;
    const boost = report.candidates.find((c) => c.cardId === 'card.boost.core')!;
    expect(veil.provenanceTerm).toBeGreaterThan(0);
    expect(boost.provenanceTerm).toBe(0);
  });

  it('never repeats a type an authored special already covers', () => {
    const special: StepNudge = {
      id: 'authored_boost',
      libraryCardId: 'card.boost.core',
      name: 'Press Harder',
      essenceCost: 2,
      forecastDelta: 0.1,
      fiction: '',
      effectLine: 'Leans the odds.',
      bandProse: { failure: 'It was not enough.' },
    };
    const result = dealHand(
      { nudges: [special], deal: { count: 4 } },
      fullRepertoire(),
      DARKNESS,
    );
    expect(result.nudges.some((n) => n.libraryCardId === 'card.boost.core')).toBe(false);
    expect(
      result.report.candidates.find((c) => c.cardId === 'card.boost.core')?.eliminated,
    ).toBe('type_already_authored');
  });

  it('honours an explicit type exclusion', () => {
    const result = dealHand(
      { deal: { count: 4, exclude: ['veil'] } },
      fullRepertoire(),
      DARKNESS,
    );
    expect(result.nudges.some((n) => n.libraryCardId === 'card.veil.signature.darkness')).toBe(false);
    expect(
      result.report.candidates.find((c) => c.cardId === 'card.veil.signature.darkness')?.eliminated,
    ).toBe('type_excluded');
  });

  it('keeps the composed hand inside the hand ceiling', () => {
    const specials: StepNudge[] = Array.from({ length: DEAL_HAND_MAX }, (_, i) => ({
      id: `authored_${i}`,
      name: `Card ${i}`,
      essenceCost: 1,
      forecastDelta: 0,
      fiction: '',
      effectLine: 'Does a thing.',
    }));
    const result = dealHand({ nudges: specials, deal: { count: 4 } }, fullRepertoire(), DARKNESS);
    // A full authored hand leaves no room; the fill contributes nothing rather
    // than overflowing the hand.
    expect(result.nudges).toEqual([]);
    expect(specials.length + result.nudges.length).toBeLessThanOrEqual(DEAL_HAND_MAX);
  });

  it('keeps the composed hand under the delta budget', () => {
    const heavy: StepNudge = {
      id: 'authored_heavy',
      name: 'Bend It All',
      essenceCost: 5,
      forecastDelta: DEAL_HAND_MAX_TOTAL_DELTA,
      fiction: '',
      effectLine: 'Bends the odds hard.',
    };
    const result = dealHand({ nudges: [heavy], deal: { count: 4 } }, fullRepertoire(), DARKNESS);
    const total =
      heavy.forecastDelta + result.nudges.reduce((s, n) => s + n.forecastDelta, 0);
    expect(total).toBeLessThanOrEqual(DEAL_HAND_MAX_TOTAL_DELTA + 1e-9);
  });

  it('deals what exists rather than failing when the pool is thin', () => {
    // The fail-soft row: a god holding one dealable card asking for four gets
    // one, not an error and not nothing.
    const thin: RepertoireEntry[] = [
      { member: nudgeCardMember('card.boost.core')!, access: 'full', source: 'core' },
    ];
    const result = dealHand(stepWithDeal(), thin, DARKNESS);
    expect(result.nudges).toHaveLength(1);
    expect(result.report.requested).toBe(4);
  });

  it('reports every candidate it weighed, dealt or not', () => {
    const result = dealHand(stepWithDeal(), fullRepertoire(), DARKNESS);
    // The inspectability contract: no card disappears without a stated reason.
    expect(result.report.candidates.length).toBe(NUDGE_CARD_LIBRARY.length);
    for (const c of result.report.candidates) {
      const wasDealt = result.report.dealt.includes(`${DEALT_NUDGE_ID_PREFIX}${c.cardId}`);
      expect(wasDealt || c.eliminated !== undefined).toBe(true);
    }
  });
});

// ─── Composition ─────────────────────────────────────────────────────

describe('composeDealtStep', () => {
  it('returns the same step object when nothing is declared (NFP #6)', () => {
    const step = { nudges: [] as StepNudge[] };
    const { step: out } = composeDealtStep(step, fullRepertoire(), DARKNESS);
    // Identity, not equality: the no-dealing path must allocate nothing and be
    // incapable of changing behavior for the shipped corpus.
    expect(out).toBe(step);
  });

  it('appends dealt cards after the authored ones', () => {
    const special: StepNudge = {
      id: 'authored_special',
      name: 'The Scene’s Own',
      essenceCost: 1,
      forecastDelta: 0.05,
      fiction: '',
      effectLine: 'Only here.',
    };
    const { step } = composeDealtStep(
      { nudges: [special], deal: { count: 2 } },
      fullRepertoire(),
      DARKNESS,
    );
    expect(step.nudges![0]).toBe(special);
    expect(step.nudges!.length).toBeGreaterThan(1);
    expect(step.nudges!.slice(1).every((n) => isDealtNudgeId(n.id))).toBe(true);
  });
});

describe('composeDealtStepFromState', () => {
  const identityState = {
    ascendantIdentity: {
      sphereAlignment: { primary: 'darkness' as const, secondary: 'order' as const },
      hungerId: 'hunger.witness',
    },
    unlockedActionIds: [] as string[],
  };

  it('deals nothing for a run with no ascendant identity', () => {
    // A god with no sphere identity has no repertoire to deal *from*; dealing
    // anyway would hand out cards nobody earned.
    const step = stepWithDeal();
    const { step: out } = composeDealtStepFromState(step, { ascendantIdentity: null });
    expect(out).toBe(step);
  });

  it('deals from the repertoire the same state builds', () => {
    const { step } = composeDealtStepFromState(stepWithDeal(), identityState);
    expect(step.nudges?.length).toBeGreaterThan(0);

    // The cards dealt must be ones this god actually holds — a dealer that
    // ignored the repertoire would pass every test above and fail this one.
    const held = new Set(
      buildRepertoire({
        primary: 'darkness',
        secondary: 'order',
        hunger: 'witness',
        unlockedActionIds: new Set<string>(),
      }).map((e) => e.member.id),
    );
    for (const nudge of step.nudges ?? []) {
      expect(held.has(nudge.libraryCardId!)).toBe(true);
    }
  });

  it('produces the identical hand on the render path and at resolution', () => {
    /*
     * The property that makes re-deriving at resolution sound, and therefore the
     * property that stands between this feature and a card that renders, charges,
     * and then contributes nothing. Resolution does not receive the hand the
     * player saw — it rebuilds it — so if these two ever diverge, a committed
     * card's delta, rider, costs, grants and band prose are all silently lost.
     */
    const render = composeDealtStepFromState(stepWithDeal(), identityState).step;
    const resolve = composeDealtStepFromState(stepWithDeal(), identityState).step;
    expect(render.nudges?.map((n) => n.id)).toEqual(resolve.nudges?.map((n) => n.id));
    expect(render.nudges?.length).toBeGreaterThan(0);
  });

  it('mints cards resolution can look up by committed id', () => {
    // The exact lookup `collectNudgeModifiers` / `dispatchNudgeCommitments` do.
    const { step } = composeDealtStepFromState(stepWithDeal(), identityState);
    const committed = step.nudges!.map((n) => n.id);
    const byId = new Map(step.nudges!.map((n) => [n.id, n]));
    expect(committed.length).toBeGreaterThan(0);
    for (const id of committed) {
      expect(byId.get(id), `resolution could not find committed card '${id}'`).toBeDefined();
    }
  });
});

// ─── The mechanics actually reach resolution ─────────────────────────

describe('a dealt card is live at resolution, not merely rendered', () => {
  const identityState = {
    ascendantIdentity: {
      sphereAlignment: { primary: 'darkness' as const, secondary: 'order' as const },
      hungerId: 'hunger.witness',
    },
    unlockedActionIds: [] as string[],
  };

  /*
   * These call the *real* functions resolution calls, on the *real* composed
   * step, with the card's own id as the committed id. Each one is the specific
   * loss that composing on the render path alone would have caused: the card
   * renders and charges, and then contributes nothing here.
   */

  it('contributes its forecast modifier', () => {
    const { step } = composeDealtStepFromState(stepWithDeal(), identityState);
    const dealt = step.nudges!.find((n) => isDealtNudgeId(n.id))!;
    expect(dealt.forecastDelta).not.toBe(0); // the assertion below must be able to fail

    const modifiers = collectNudgeModifiers(step as ActionStep, [dealt.id]);
    const total = sumModifiers(modifiers);
    expect(modifiers.some((m) => m.source === `nudge:${dealt.id}`)).toBe(true);
    expect(total).toBeCloseTo(dealt.forecastDelta, 10);

    // Falsification: the *authored* step — what resolution would have used
    // without `composeDealtStepFromState` — finds nothing and sums to zero.
    const uncomposed = sumModifiers(
      // The authored step exactly as `resolveStepDefinition` hands it over:
      // the specials only, with no dealt card anywhere in `nudges`.
      collectNudgeModifiers({ nudges: [] }, [dealt.id]),
    );
    expect(uncomposed).toBe(0);
  });

  it('is billed for what its face quoted', () => {
    const { step } = composeDealtStepFromState(stepWithDeal(), identityState);
    const dealt = step.nudges!.find((n) => isDealtNudgeId(n.id))!;
    const charged = totalNudgeCost(step as ActionStep, [dealt.id]);
    expect(charged).toBe(dealt.essenceCost);
    expect(charged).toBeGreaterThan(0);
  });

  it('pays off in band prose', () => {
    const { step } = composeDealtStepFromState(stepWithDeal(), identityState);
    const dealt = step.nudges!.find((n) => isDealtNudgeId(n.id) && n.bandProse?.failure)!;
    const prose = collectNudgeBandProse(step as ActionStep, [dealt.id], 'failure');
    expect(prose.length).toBeGreaterThan(0);
    expect(prose).toContain(dealt.bandProse!.failure);
  });

  it('dispatches its cost channels', () => {
    const { step } = composeDealtStepFromState(stepWithDeal(), identityState);
    const withCosts = step.nudges!.find((n) => isDealtNudgeId(n.id) && n.costs);
    // Only meaningful if a dealt card actually carries a cost channel — the Veil
    // reference profile does. Guard rather than silently pass if it stops.
    expect(withCosts, 'no dealt card carries a cost channel — test is vacuous').toBeDefined();
    const channels = collectNudgeCostChannels(step as ActionStep, [withCosts!.id]);
    expect(channels).toEqual(withCosts!.costs);
  });
});

// ─── The deal report ─────────────────────────────────────────────────

describe('the deal report', () => {
  it('starts empty and records the last deal', () => {
    expect(lastDealReport()).toBeUndefined();
    const result = dealHand(stepWithDeal(), fullRepertoire(), DARKNESS);
    recordDealReport('encounter.test', result.report);
    expect(lastDealReport()?.templateId).toBe('encounter.test');
    expect(lastDealReport()?.report.dealt.length).toBeGreaterThan(0);
  });
});
