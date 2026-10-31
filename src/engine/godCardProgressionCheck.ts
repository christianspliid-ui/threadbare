/**
 * The god-card progression content gate (THR-1811, THR-1794 audit §7).
 *
 * Pure: takes the god cards and the grant lists, returns failures and warnings.
 * `scripts/check-god-card-progression.ts` runs it over the live catalog;
 * `godCardProgressionCheck.test.ts` drives each failure.
 *
 * Fails on: a god card without a `progression` block; an invalid field; a market card
 * with `giftBy`, or a gift without one; a non-generic market card with no sphere to be
 * priced in; spine / milestone / signature grant drift against `giftBy`.
 * Warns on: a `giftBy: 'spine'` card no spine beat grants (it reaches the god some
 * other way); sphere × tier holes in the market; a Hunger sphere with no cheap
 * (≤ CHEAP_PLACE_CARD_MAX_COST) tier-1 market place card (THR-2089).
 */

import { CREATION_SPHERE_NAMES, SPHERE_NAMES } from '../types/index';
import type { UnifiedActionTemplate } from '../types/unifiedAction';
import { HUNGER_CATALOG } from '../data/hunger-catalog';

/**
 * THR-2089: the price at or under which a tier-1 market place card counts as its
 * sphere's cheap card — the card a god can cast on a town often enough to raise its
 * Mandate half by its own hand.
 */
export const CHEAP_PLACE_CARD_MAX_COST = 2;

/** Every sphere a Hunger can name (primary or secondary) — the Mandate's spheres. */
export const HUNGER_SPHERES: readonly string[] = [
  ...new Set(HUNGER_CATALOG.flatMap(h => [h.sphereAlignment.primary, h.sphereAlignment.secondary])),
];

export interface GodCardGrantSources {
  /** Card ids any spine beat grants. */
  readonly spine: ReadonlySet<string>;
  /** Card ids any milestone beat grants. */
  readonly milestone: ReadonlySet<string>;
  /** The eight reach-signature card ids. */
  readonly signature: ReadonlySet<string>;
}

export interface GodCardProgressionReport {
  readonly cardCount: number;
  readonly failures: string[];
  readonly warnings: string[];
  readonly counts: {
    market: number;
    gift: number;
    generic: number;
    byTier: Record<1 | 2 | 3 | 4, number>;
    byGiftBy: Record<string, number>;
  };
  /** Card ids carrying each review flag. */
  readonly flags: Record<string, string[]>;
}

const VALID_GIFT_BY = new Set(['spine', 'milestone', 'rung', 'signature']);
const SPHERES = new Set<string>(SPHERE_NAMES);

export function checkGodCardProgression(
  cards: readonly UnifiedActionTemplate[],
  sources: GodCardGrantSources,
): GodCardProgressionReport {
  const failures: string[] = [];
  const warnings: string[] = [];
  const counts = {
    market: 0,
    gift: 0,
    generic: 0,
    byTier: { 1: 0, 2: 0, 3: 0, 4: 0 } as Record<1 | 2 | 3 | 4, number>,
    byGiftBy: {} as Record<string, number>,
  };
  const flags: Record<string, string[]> = {};
  const byGiftBy = (g: string) => new Set(cards.filter(c => c.progression?.giftBy === g).map(c => c.id));

  for (const card of cards) {
    const p = card.progression;
    if (!p) {
      failures.push(`${card.id}: no progression block`);
      continue;
    }
    if (![1, 2, 3, 4].includes(p.tier)) failures.push(`${card.id}: tier ${String(p.tier)} is not 1–4`);
    if (p.offer !== 'market' && p.offer !== 'gift') failures.push(`${card.id}: offer '${String(p.offer)}' is not market | gift`);
    if (typeof p.generic !== 'boolean') failures.push(`${card.id}: generic is not a boolean`);
    if (p.offer === 'gift' && (!p.giftBy || !VALID_GIFT_BY.has(p.giftBy))) {
      failures.push(`${card.id}: a gift needs giftBy spine | milestone | rung | signature (got ${String(p.giftBy)})`);
    }
    if (p.offer === 'market' && p.giftBy) failures.push(`${card.id}: a market card carries giftBy '${p.giftBy}'`);
    if (p.pricedIn !== undefined && !SPHERES.has(p.pricedIn)) failures.push(`${card.id}: pricedIn '${p.pricedIn}' is not a sphere`);
    if (p.offerWeight !== undefined && !(Number.isFinite(p.offerWeight) && p.offerWeight > 0)) {
      failures.push(`${card.id}: offerWeight ${String(p.offerWeight)} must be a positive number`);
    }
    if (p.offer === 'market' && !p.generic && !p.pricedIn && !card.sphereAffinity) {
      failures.push(`${card.id}: a non-generic market card has no sphere to be priced in (set pricedIn)`);
    }
    if (p.offer === 'market') counts.market++; else counts.gift++;
    if (p.generic) counts.generic++;
    if (p.tier in counts.byTier) counts.byTier[p.tier]++;
    if (p.giftBy) counts.byGiftBy[p.giftBy] = (counts.byGiftBy[p.giftBy] ?? 0) + 1;
    for (const f of p.flags ?? []) (flags[f] ??= []).push(card.id);
  }

  // Grant drift: the beats that grant a card and the card's own giftBy must agree.
  const ids = new Set(cards.map(c => c.id));
  const tagged = { spine: byGiftBy('spine'), milestone: byGiftBy('milestone'), signature: byGiftBy('signature') };
  for (const id of sources.spine) {
    if (ids.has(id) && !tagged.spine.has(id)) failures.push(`${id}: a spine beat grants it, but giftBy is not 'spine'`);
  }
  for (const id of tagged.spine) {
    if (!sources.spine.has(id)) warnings.push(`${id}: giftBy 'spine' but no spine beat grants it (reaches the god another way?)`);
  }
  for (const id of sources.milestone) {
    if (ids.has(id) && !tagged.milestone.has(id)) failures.push(`${id}: a milestone beat grants it, but giftBy is not 'milestone'`);
  }
  for (const id of tagged.milestone) {
    if (!sources.milestone.has(id)) failures.push(`${id}: giftBy 'milestone' but no milestone beat grants it`);
  }
  for (const id of sources.signature) {
    if (ids.has(id) && !tagged.signature.has(id)) failures.push(`${id}: a reach signature, but giftBy is not 'signature'`);
  }
  for (const id of tagged.signature) {
    if (!sources.signature.has(id)) failures.push(`${id}: giftBy 'signature' but it is not a reach signature`);
  }

  // Sphere × tier holes in the market (warn): a creation sphere with no market card at a tier.
  for (const sphere of CREATION_SPHERE_NAMES) {
    const missing: number[] = [];
    for (const tier of [1, 2, 3, 4] as const) {
      const any = cards.some(c => c.progression?.offer === 'market' && c.progression.tier === tier
        && !c.progression.generic && (c.progression.pricedIn ?? c.sphereAffinity) === sphere);
      if (!any) missing.push(tier);
    }
    if (missing.length > 0) warnings.push(`hole: no ${sphere} market card at tier ${missing.join(', ')}`);
  }

  // THR-2089: a Hunger sphere with no cheap tier-1 market card a god can cast on a town.
  for (const sphere of HUNGER_SPHERES) {
    const any = cards.some(c => c.progression?.offer === 'market' && c.progression.tier === 1
      && c.sphereAffinity === sphere
      && (c.essenceCost ?? Infinity) <= CHEAP_PLACE_CARD_MAX_COST
      && (c.targetCategories ?? []).some(cat => cat === 'location' || cat === 'sublocation')
      && (!c.targetSubtypes || c.targetSubtypes.length === 0 || c.targetSubtypes.includes('town')));
    if (!any) warnings.push(`hole: no cheap ${sphere} place card`);
  }

  return { cardCount: cards.length, failures, warnings, counts, flags };
}
