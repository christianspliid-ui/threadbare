/**
 * The crown — the offer score (THR-1932, plan § 2). Pure over a `CrownWorld`.
 *
 *   protection = threat > 0 ? strength(R) / (strength(R) + threat) : OATH_NO_THREAT_PROTECTION
 *   gift       = giftShare ∈ [0,1]
 *   standing   = +1 ally · −1 rival, at war or hostile either way · else 0
 *   pride      = min(OATH_PRIDE_CAP, income(C) / max(0.01, fullIncome(R)))
 *   score      = Wp·protection + Wg·gift + Ws·standing − Wpr·pride
 *
 * Hunger and unrest (THR-1934) will read standing and offers from here.
 */

import type { WorldGraph } from '../graph';
import type { OfferParts } from './types';
import type { CrownWorld } from './eligibility';
import { hexDistance } from '../../lib/hexMath';
import {
  OATH_PROTECTION_W,
  OATH_GIFT_W,
  OATH_STANDING_W,
  OATH_PRIDE_W,
  OATH_PRIDE_CAP,
  OATH_GIFT_DAYS,
  OATH_GIFT_RESERVE,
  OATH_THREAT_RADIUS_HEXES,
  OATH_NO_THREAT_PROTECTION,
} from '../../data/crown-constants';

function pairEdges(graph: WorldGraph, a: string, b: string, type: 'relates_to' | 'hostile_to') {
  return [
    ...graph.getOutgoingEdges(a, type).filter(e => e.target === b),
    ...graph.getOutgoingEdges(b, type).filter(e => e.target === a),
  ];
}

export function isAllied(graph: WorldGraph, a: string, b: string): boolean {
  return pairEdges(graph, a, b, 'relates_to').some(e => e.properties.isAlliance === true);
}

/** Rival, at war (`basis:'war'`), or hostile either way. Reads war itself (plan § Notes). */
export function isEnemy(graph: WorldGraph, a: string, b: string): boolean {
  if (pairEdges(graph, a, b, 'hostile_to').length > 0) return true;
  return pairEdges(graph, a, b, 'relates_to').some(e => e.properties.isRival === true || e.properties.basis === 'war');
}

/** The standing term: +1 ally, −1 enemy, else 0. */
export function standingOf(graph: WorldGraph, c: string, r: string): number {
  if (isAllied(graph, c, r)) return 1;
  if (isEnemy(graph, c, r)) return -1;
  return 0;
}

/** The strongest army near any of C's holdings or halls that is not C's, R's, a fellow vassal's, or C's ally's. */
export function threatTo(world: CrownWorld, c: string, r: string): number {
  const holds = world.holdHexes.get(c) ?? [];
  if (holds.length === 0) return 0;
  let threat = 0;
  for (const a of world.armies) {
    if (!a.hex || a.factionId === c || a.factionId === r) continue;
    const armyLiege = world.graph.getOutgoingEdges(a.factionId, 'sworn_to')[0]?.target;
    if (armyLiege === r) continue;
    if (isAllied(world.graph, c, a.factionId)) continue;
    if (a.strength <= threat) continue;
    if (holds.some(h => hexDistance(h, a.hex!) <= OATH_THREAT_RADIUS_HEXES)) threat = a.strength;
  }
  return threat;
}

/** The largest gift share R can pay C, keeping OATH_GIFT_RESERVE back. 0 when C earns nothing. */
export function affordableGift(world: CrownWorld, c: string, r: string): number {
  const full = OATH_GIFT_DAYS * Math.max(0, world.income.get(c) ?? 0);
  if (full <= 0) return 0;
  const spare = Math.max(0, (world.wealth.get(r) ?? 0) - OATH_GIFT_RESERVE);
  return Math.min(1, spare / full);
}

/** Coin a gift of this share costs: giftShare × OATH_GIFT_DAYS × income(C). */
export function giftCost(world: CrownWorld, c: string, giftShare: number): number {
  return giftShare * OATH_GIFT_DAYS * Math.max(0, world.income.get(c) ?? 0);
}

export function offerScore(world: CrownWorld, c: string, r: string, giftShare: number): OfferParts {
  const own = world.strength.get(r) ?? 0;
  const threat = threatTo(world, c, r);
  const protection = threat > 0 ? own / (own + threat) : OATH_NO_THREAT_PROTECTION;
  const gift = Math.max(0, Math.min(1, giftShare));
  const standing = standingOf(world.graph, c, r);
  const pride = Math.min(OATH_PRIDE_CAP, Math.max(0, world.income.get(c) ?? 0) / Math.max(0.01, world.fullIncome.get(r) ?? 0));
  const score = OATH_PROTECTION_W * protection + OATH_GIFT_W * gift + OATH_STANDING_W * standing - OATH_PRIDE_W * pride;
  return { protection, gift, standing, pride, score, threat };
}
