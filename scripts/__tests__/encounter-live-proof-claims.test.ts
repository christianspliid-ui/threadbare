/**
 * THR-1047 — the two pure decisions inside `check:encounter-live`.
 *
 * The verdict tests carry most of the weight. Stage 4's failure mode is not a
 * crash; it is running clean over a template that promised nothing and printing
 * a green line, which reads as delivery and is not. Every assertion below that
 * names `vacuous` is guarding that one reading.
 */

import { describe, it, expect } from 'vitest';
import {
  BASELINE_CLAIMS,
  classifyDeclaration,
  computeVerdict,
  selectHand,
  selectReaction,
  type DeclarationSurface,
  type VerdictClaim,
} from '../encounter-live-proof-claims';

describe('computeVerdict', () => {
  const baseline: VerdictClaim[] = [
    { name: 'registered', status: 'pass' },
    { name: 'spawn', status: 'pass' },
    { name: 'no_tick_crash', status: 'pass' },
    { name: 'steps_resolved', status: 'pass' },
  ];

  it('calls a run that proved only the baseline vacuous, not proved', () => {
    // The whole point: spawning and not crashing is not evidence of delivery.
    const claims: VerdictClaim[] = [
      ...baseline,
      { name: 'cast_bound', status: 'not_declared' },
      { name: 'reward_node', status: 'not_declared' },
      { name: 'seed_planted', status: 'not_declared' },
      { name: 'aftermath_variant', status: 'not_declared' },
    ];
    expect(computeVerdict(claims)).toBe('vacuous');
  });

  it('is vacuous even when every baseline claim passes and nothing else exists', () => {
    expect(computeVerdict(baseline)).toBe('vacuous');
  });

  it('proves a run that declared and passed at least one delivery claim', () => {
    const claims: VerdictClaim[] = [
      ...baseline,
      { name: 'seed_planted', status: 'pass' },
      { name: 'cast_bound', status: 'not_declared' },
    ];
    expect(computeVerdict(claims)).toBe('proved');
  });

  it('fails on any failed claim, however much else passed', () => {
    const claims: VerdictClaim[] = [
      ...baseline,
      { name: 'seed_planted', status: 'pass' },
      { name: 'reward_node', status: 'pass' },
      { name: 'cast_bound', status: 'fail' },
    ];
    expect(computeVerdict(claims)).toBe('failed');
  });

  it('fails ahead of vacuous — a broken baseline claim is not "proved nothing"', () => {
    const claims: VerdictClaim[] = [
      { name: 'registered', status: 'fail' },
      { name: 'cast_bound', status: 'not_declared' },
    ];
    expect(computeVerdict(claims)).toBe('failed');
  });

  it('does not let a passing baseline claim satisfy the delivery test', () => {
    // Guards the exact regression: adding a baseline claim to the delivery set
    // would turn every clean run into `proved`.
    for (const name of BASELINE_CLAIMS) {
      expect(computeVerdict([{ name, status: 'pass' }])).toBe('vacuous');
    }
  });

  it('treats an empty claim set as vacuous rather than proved', () => {
    expect(computeVerdict([])).toBe('vacuous');
  });
});

describe('selectHand', () => {
  const stepOne = [
    { id: 'card.b', essenceCost: 2 },
    { id: 'card.a', essenceCost: 2 },
    { id: 'card.c', essenceCost: 5 },
  ];
  const stepTwo = [{ id: 'card.d', essenceCost: 1 }];

  it('commits nothing in `none` mode', () => {
    expect(selectHand([stepOne, stepTwo], 'none')).toEqual([]);
  });

  it('commits the cheapest card per nudge-bearing step', () => {
    expect(selectHand([stepOne, stepTwo], 'cheapest')).toEqual(['card.a', 'card.d']);
  });

  it('breaks cost ties by id, not by authoring order', () => {
    // A cosmetic re-order of a step's `nudges` array must not change which card
    // a proof plays, or the verdict would move under an edit that changed no
    // behaviour (NFP #3).
    const reordered = [stepOne[1], stepOne[0], stepOne[2]];
    expect(selectHand([reordered], 'cheapest')).toEqual(selectHand([stepOne], 'cheapest'));
  });

  it('commits the whole hand in `all` mode, preserving authored order', () => {
    expect(selectHand([stepOne], 'all')).toEqual(['card.b', 'card.a', 'card.c']);
  });

  it('skips steps that author no hand rather than emitting a placeholder', () => {
    expect(selectHand([[], stepTwo, []], 'cheapest')).toEqual(['card.d']);
  });

  it('returns an empty hand for a template with no nudge-bearing step', () => {
    expect(selectHand([[], []], 'cheapest')).toEqual([]);
  });
});

// ─── THR-1132 — the false-fail the scoping rule exists to end ────────

describe('classifyDeclaration', () => {
  const surface = (over: Partial<DeclarationSurface> = {}): DeclarationSurface => ({
    unconditional: false,
    reactionIds: [],
    otherBand: false,
    ...over,
  });

  it('scopes a reaction-borne claim away when a DIFFERENT reaction fired', () => {
    // The measured case (THR-1132): `slice.family.swindled_family` authors its
    // swindler seed on `leave_them_to_it` / `watch_them_go`, and the engine
    // autonomously applied `make_the_town_haunted`. The seed was never going to
    // arrive — reporting that as ✗ is a false failure against clean content.
    //
    // This is also why the applied reaction is an *id* and not a boolean: under
    // a boolean this exact run read as "a reaction fired, so the seed must
    // arrive", and failed.
    const seedOnOtherReactions = surface({
      reactionIds: ['slice.family.leave_them_to_it', 'slice.family.watch_them_go'],
    });
    expect(
      classifyDeclaration(seedOnOtherReactions, 'slice.family.make_the_town_haunted'),
    ).toBe('reaction_scoped');
  });

  it('makes the same claim reachable once the carrying reaction is the one applied', () => {
    // The other half: scoping must not become blanket silence. When the reaction
    // that carries the seed is the one that fired, arrival is assertable again.
    const seedOnOtherReactions = surface({
      reactionIds: ['slice.family.leave_them_to_it', 'slice.family.watch_them_go'],
    });
    expect(
      classifyDeclaration(seedOnOtherReactions, 'slice.family.leave_them_to_it'),
    ).toBe('reachable');
  });

  it('scopes a claim authored only on a band this run did not roll', () => {
    // `unsafe_bridge` authors its reward and conditions on bands other than the
    // `success_at_cost` it rolled. A claim on band X cannot arrive on band Y.
    expect(classifyDeclaration(surface({ otherBand: true }), undefined)).toBe('band_scoped');
  });

  it('prefers reachable over both excuses when the rolled band also delivers', () => {
    // Order is load-bearing: a connection authored BOTH on the rolled band and
    // elsewhere is reachable. Were `otherBand` checked first, every widely
    // authored consequence would excuse itself and the gate would go quiet —
    // which is worse than the false failures, because nobody re-reads a green wall.
    const everywhere = surface({ unconditional: true, reactionIds: ['r.a'], otherBand: true });
    expect(classifyDeclaration(everywhere, undefined)).toBe('reachable');
  });

  it('reports a connection authored nowhere as absent, not as an excuse', () => {
    // `absent` must stay distinguishable from the two scoped answers: it is the
    // one case where the template genuinely declares nothing, and the row should
    // say so rather than implying something was withheld by chance.
    expect(classifyDeclaration(surface(), 'r.a')).toBe('absent');
  });
});

describe('selectReaction', () => {
  it('picks deterministically by id, not by authoring order', () => {
    // Same rule as `selectHand`: re-ordering a variant's `reactions` array is a
    // cosmetic edit and must not move a verdict (NFP #3).
    const authored = [{ id: 'r.charlie' }, { id: 'r.alpha' }, { id: 'r.bravo' }];
    const reordered = [authored[2], authored[0], authored[1]];
    expect(selectReaction(authored)).toBe('r.alpha');
    expect(selectReaction(reordered)).toBe(selectReaction(authored));
  });

  it('returns undefined when the aftermath authors no reaction', () => {
    expect(selectReaction([])).toBeUndefined();
  });
});
