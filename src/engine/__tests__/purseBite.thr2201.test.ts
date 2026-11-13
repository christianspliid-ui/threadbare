/**
 * THR-2201 — make the purse bite: the two rule fixes and the cost-scale seam.
 *
 * Rule fix 1: the sphere discount goes to the god's own (bought) spheres only —
 * holding a little essence in a sphere (the 4% income floor keeps every pool above
 * zero) no longer makes its cards cheap, and no longer withholds them either.
 * Rule fix 2: a sphere-less card is priced against, and paid from, the god's own
 * spheres only — never the twelve pools added together.
 * Scale: `costScale` multiplies step-card prices; the meeting path passes none.
 *
 * Plan: Docs/plans/2026-11-13-thr-2201-make-the-purse-bite.md
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { ActionStep, StepNudge } from '../../types/unifiedAction';
import type { SphereName } from '../../types/index';
import { SPHERE_NAMES } from '../../types/index';
import {
  buildNudgeHand,
  effectiveNudgeCost,
  resetNudgeWarnings,
  totalNudgeCost,
} from '../encounters/nudges';
import { essenceReader, homeSpheresFor } from '../views/stage/buildNudgePhaseModel';
import { spendNudgeEssence, type EssencePool } from '../../components/Game/encounter-stage/nudgeCommit';
import { SPHERE_DISCOUNT } from '../../data/nudge-constants';
import type { GameState } from '../../types/gameState';

function card(overrides: Partial<StepNudge> & Pick<StepNudge, 'id'>): StepNudge {
  return { name: 'a card', essenceCost: 1, forecastDelta: 0, effectLine: 'Helps.', ...overrides };
}

function step(nudges: readonly StepNudge[]): Pick<ActionStep, 'nudges'> {
  return { nudges };
}

/** Every sphere at `base`, with overrides. */
function pool(base: number, overrides: Partial<Record<SphereName, number>> = {}): EssencePool {
  const p = {} as EssencePool;
  for (const s of SPHERE_NAMES) p[s] = base;
  return { ...p, ...overrides };
}

/** A minimal GameState slice: an ascendant node carrying `spherePoints`. */
function stateWith(
  props: Record<string, unknown> | undefined,
  primary?: SphereName,
): Pick<GameState, 'graph' | 'ascendantId' | 'ascendantIdentity'> {
  return {
    ascendantId: 'asc',
    graph: { getNode: (id: string) => (id === 'asc' && props ? { id, properties: props } : undefined) } as never,
    ascendantIdentity: (primary ? { sphereAlignment: { primary, secondary: primary } } : undefined) as never,
  };
}

beforeEach(() => resetNudgeWarnings());

describe('THR-2201 rule fix 1 — the discount goes to bought spheres', () => {
  const home: SphereName[] = ['mind', 'spirit'];

  it('an unbought sphere with essence in it gets no discount, and its card is still in hand', () => {
    const s = step([
      card({ id: 'order_card', sphere: 'order', essenceCost: 3 }),
      card({ id: 'mind_card', sphere: 'mind', essenceCost: 3 }),
    ]);
    const hand = buildNudgeHand(s, { id: 't', traitVariants: [] }, {
      availableEssence: () => 99,
      // Every sphere holds essence (the income floor) — the sphere_locked gate passes.
      accessibleSpheres: [...SPHERE_NAMES],
      discountSpheres: home,
      unlockedTemplateIds: new Set<string>(),
      heldTraits: new Set<string>(),
    });
    expect(hand.playable.map((e) => e.nudge.id).sort()).toEqual(['mind_card', 'order_card']);
    expect(effectiveNudgeCost({ sphere: 'order', essenceCost: 3 }, home)).toBe(3);
    expect(effectiveNudgeCost({ sphere: 'mind', essenceCost: 3 }, home)).toBe(3 - SPHERE_DISCOUNT);
    expect(totalNudgeCost(s, ['order_card', 'mind_card'], home)).toBe(3 + 3 - SPHERE_DISCOUNT);
  });

  it('an unbought-sphere card the god cannot pay at full price is dimmed, not withheld', () => {
    const s = step([card({ id: 'order_card', sphere: 'order', essenceCost: 3 })]);
    const hand = buildNudgeHand(s, { id: 't', traitVariants: [] }, {
      availableEssence: () => 2, // enough after a discount, not without one
      accessibleSpheres: [...SPHERE_NAMES],
      discountSpheres: home,
      unlockedTemplateIds: new Set<string>(),
      heldTraits: new Set<string>(),
    });
    expect(hand.dimmed.map((e) => [e.nudge.id, e.blocked])).toEqual([['order_card', 'essence_unavailable']]);
  });

  it('absent discountSpheres keeps the pre-THR-2201 reach (accessibleSpheres)', () => {
    const s = step([card({ id: 'order_card', sphere: 'order', essenceCost: 3 })]);
    const hand = buildNudgeHand(s, { id: 't', traitVariants: [] }, {
      availableEssence: () => 2,
      accessibleSpheres: ['order'],
      unlockedTemplateIds: new Set<string>(),
      heldTraits: new Set<string>(),
    });
    expect(hand.playable.map((e) => e.nudge.id)).toEqual(['order_card']);
  });
});

describe('THR-2201 rule fix 2 — a sphere-less card pays from bought spheres only', () => {
  it('never draws on an unbought pool, even when the bought ones run dry', () => {
    const p = pool(30, { mind: 2, spirit: 1 });
    const r = spendNudgeEssence(p, [{ sphere: undefined, cost: 5 }], 'mind', ['mind', 'spirit']);
    expect(r.ok).toBe(false);
    expect(r.pool).toBe(p);
    expect(r.spent).toBe(0);
  });

  it('pays primary first, then the other bought spheres in order', () => {
    const p = pool(30, { mind: 2, spirit: 10 });
    const r = spendNudgeEssence(p, [{ sphere: undefined, cost: 5 }], 'mind', ['mind', 'spirit']);
    expect(r.ok).toBe(true);
    expect(r.pool.mind).toBe(0);
    expect(r.pool.spirit).toBe(7);
    for (const s of SPHERE_NAMES) if (s !== 'mind' && s !== 'spirit') expect(r.pool[s]).toBe(30);
  });

  it('without payableSpheres spills across the whole pool (the meeting path, P4)', () => {
    const p = pool(30, { mind: 2, spirit: 1 });
    const r = spendNudgeEssence(p, [{ sphere: undefined, cost: 5 }], 'mind');
    expect(r.ok).toBe(true);
    expect(r.spent).toBe(5);
  });

  it('the hand reads the same reach the commit charges', () => {
    const p = pool(30, { mind: 2, spirit: 1 });
    const read = essenceReader(p, ['mind', 'spirit']);
    expect(read(undefined)).toBe(3);
    expect(read('order')).toBe(30);
    // No home list (legacy run) ⇒ today's whole-pool read.
    expect(essenceReader(p)(undefined)).toBe(3 + 30 * (SPHERE_NAMES.length - 2));
  });
});

describe('THR-2201 homeSpheresFor', () => {
  it('ranks bought spheres, primary first', () => {
    expect(homeSpheresFor(stateWith({ spherePoints: { spirit: 3, mind: 2 } }, 'mind')))
      .toEqual(['mind', 'spirit']);
  });

  it('falls back to the alignment preset when no points are stored', () => {
    expect(homeSpheresFor(stateWith({ sphereAlignment: { primary: 'life', secondary: 'mind' } }, 'life')))
      .toEqual(['life', 'mind']);
  });

  it('falls back to the identity primary with no ascendant node, and never throws', () => {
    expect(homeSpheresFor(stateWith(undefined, 'mind'))).toEqual(['mind']);
    expect(homeSpheresFor(stateWith(undefined))).toEqual([]);
    expect(homeSpheresFor(null)).toEqual([]);
  });
});

describe('THR-2201 cost scale', () => {
  it('multiplies the authored price before the discount', () => {
    expect(effectiveNudgeCost({ sphere: 'mind', essenceCost: 2 }, ['mind'], 3)).toBe(2 * 3 - SPHERE_DISCOUNT);
    expect(effectiveNudgeCost({ essenceCost: 1 }, ['mind'], 3)).toBe(3);
  });

  it('keeps authored-free cards free', () => {
    expect(effectiveNudgeCost({ sphere: 'mind', essenceCost: 0 }, ['mind'], 3)).toBe(0);
  });

  it('treats a non-finite or non-positive scale as 1', () => {
    expect(effectiveNudgeCost({ essenceCost: 2 }, [], Number.NaN)).toBe(2);
    expect(effectiveNudgeCost({ essenceCost: 2 }, [], 0)).toBe(2);
  });

  it('a meeting card is unscaled: totalNudgeCost without a scale charges the authored price', () => {
    const s = step([card({ id: 'bond', essenceCost: 4 })]);
    expect(totalNudgeCost(s, ['bond'])).toBe(4);
    expect(totalNudgeCost(s, ['bond'], [], 3)).toBe(12);
  });
});
