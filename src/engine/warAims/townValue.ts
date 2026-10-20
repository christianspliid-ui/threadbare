/**
 * warAims/townValue.ts — what a town is worth to the faction that would take it (THR-1933).
 *
 * Plan § Engine 3: composed from the faction purse's own pure helpers, never a second
 * price (`Docs/plans/2026-10-15-thr-1933-war-aims.md` § Notes for the executor):
 *
 * 1. the purse's town tax (`townTaxOf`);
 * 2. the purse's place yield (`placeYieldOf`) for the town and each of its resource places;
 * 3. its field share — each unheld resource location within `WAR_AIM_FIELD_RADIUS_HEXES`
 *    pays its yield split evenly among the settlements within that radius of it.
 *
 * With the purse off, the fallback is the sketch's tax proxy, prosperity ÷ 100.
 *
 * Also here: `feedsLackingStaple` — the town or one of its fields bears a staple that
 * is scarce in at least one town the attacker is tax holder of.
 */

import type { GraphNode } from '../../types/graph';
import { hexDistance } from '../../lib/hexMath';
import { townTaxOf, placeYieldOf } from '../factionPurse/income';
import { readResources } from '../resourceEconomy';
import { getResourceClass } from '../../data/resource-classes';
import { FACTION_PURSE_ENABLED } from '../../data/faction-purse-constants';
import { WAR_AIM_FIELD_RADIUS_HEXES, WAR_AIM_FALLBACK_VALUE_DIVISOR } from '../../data/war-aims-constants';
import type { WarAimContext, WarField } from './context';
import { isEnemyFaction } from './enemy';
import {
  buildBearingIndex,
  allRegionalMonopolies,
  hexOfLocationId,
  computeRegionalMonopolies,
  type BearingIndex,
  type BearingPlace,
} from '../regionalMonopoly';
import type { HexCoord } from '../../types';
import {
  REGIONAL_MONOPOLY_ENABLED,
  MONOPOLY_REGION_RADIUS_HEXES,
  WAR_AIM_BONUS_BREAKS_MONOPOLY,
  WAR_AIM_BONUS_COMPLETES_MONOPOLY,
} from '../../data/regional-monopoly-constants';

/** The unheld fields a town counts, each with its share divisor (settlements in radius). */
function fieldsOf(ctx: WarAimContext, townId: string): { field: WarField; share: number }[] {
  const town = ctx.towns.get(townId);
  if (!town) return [];
  const out: { field: WarField; share: number }[] = [];
  for (const field of ctx.fields) {
    if (field.held) continue;
    if (hexDistance(town.hex, field.hex) > WAR_AIM_FIELD_RADIUS_HEXES) continue;
    let near = 0;
    for (const t of ctx.towns.values()) {
      if (hexDistance(t.hex, field.hex) <= WAR_AIM_FIELD_RADIUS_HEXES) near++;
    }
    out.push({ field, share: Math.max(1, near) });
  }
  return out;
}

/** What holding `townId` would pay its holder's purse each day. */
export function townValueFor(ctx: WarAimContext, townId: string): number {
  const town = ctx.towns.get(townId);
  if (!town) return 0;
  if (!FACTION_PURSE_ENABLED) {
    const prosperity = typeof town.node.properties.prosperity === 'number' ? town.node.properties.prosperity : 0;
    return prosperity / WAR_AIM_FALLBACK_VALUE_DIVISOR;
  }
  let value = townTaxOf(town.node, ctx.graph) + placeYieldOf(town.node);
  for (const place of ctx.townPlaces.get(townId) ?? []) value += placeYieldOf(place);
  for (const { field, share } of fieldsOf(ctx, townId)) value += placeYieldOf(field.node) / share;
  return value;
}

function staplesBorneBy(node: GraphNode): string[] {
  return Object.entries(readResources(node.properties))
    .filter(([rid, r]) => (r.quantity ?? 0) > 0 && getResourceClass(rid).category === 'staple')
    .map(([rid]) => rid);
}

/** Staples scarce in at least one town `factionId` is tax holder of, sorted. */
export function scarceStaplesOf(ctx: WarAimContext, factionId: string): string[] {
  const out = new Set<string>();
  for (const t of ctx.towns.values()) {
    if (t.holderId !== factionId) continue;
    for (const [rid, r] of Object.entries(readResources(t.node.properties))) {
      if (r.stockTier === 'scarce' && getResourceClass(rid).category === 'staple') out.add(rid);
    }
  }
  return [...out].sort();
}

/**
 * The first staple (by id) the town or its fields bear that is in `scarce`, or null.
 * `scarce` is `scarceStaplesOf(attacker)`, computed once per pick.
 */
export function feedsLackingStaple(ctx: WarAimContext, townId: string, scarce: readonly string[]): string | null {
  if (scarce.length === 0) return null;
  const town = ctx.towns.get(townId);
  if (!town) return null;
  const borne = new Set<string>(staplesBorneBy(town.node));
  for (const place of ctx.townPlaces.get(townId) ?? []) for (const rid of staplesBorneBy(place)) borne.add(rid);
  for (const { field } of fieldsOf(ctx, townId)) for (const rid of staplesBorneBy(field.node)) borne.add(rid);
  return scarce.find(rid => borne.has(rid)) ?? null;
}

/** What taking a town does to a regional monopoly (THR-1955, plan § Engine 8). */
export interface MonopolyAim {
  /** Sum of the break and complete bonuses; 0 when neither applies. */
  bonus: number;
  /** The larger contributor, or null when neither applies. */
  reason: 'breaks_monopoly' | 'completes_monopoly' | null;
  /** The good behind that reason. */
  resourceId?: string;
  /** The enemy whose hold breaks (`breaks_monopoly` only). */
  holderId?: string;
}

function bearingIndexOf(ctx: WarAimContext): BearingIndex {
  ctx.bearing ??= buildBearingIndex(ctx.graph, ctx.hexRealmId);
  return ctx.bearing;
}

/** Anchor hexes of the regions `factionId` holds on `rid` among `places`, by the phase's rule. */
function regionAnchorsHeld(rid: string, places: readonly BearingPlace[], factionId: string): HexCoord[] {
  const hexOf = new Map(places.map(p => [p.id, p.hex] as const));
  const held = computeRegionalMonopolies(new Map([[rid, [...places]]]), 0).get(factionId) ?? [];
  return held.map(m => hexOf.get(m.anchorLocationId)).filter((h): h is HexCoord => !!h);
}

/** The phase's same-region test (`sameRegion` in phases/regionalMonopolies.ts), by anchor hex. */
function inSameRegion(a: HexCoord, b: HexCoord): boolean {
  return hexDistance(a, b) <= MONOPOLY_REGION_RADIUS_HEXES;
}

/**
 * The monopoly bonuses for taking `townId`, recomputed from the bearing index (no cache
 * beyond the pass's context):
 *
 * - **breaks** (`WAR_AIM_BONUS_BREAKS_MONOPOLY`): the town is one of an *enemy's*
 *   regional monopoly places, and once the attacker holds it the regional rule finds no
 *   region of that holder's on the good in the same region as the monopoly's anchor;
 * - **completes** (`WAR_AIM_BONUS_COMPLETES_MONOPOLY`): once the attacker holds the town,
 *   the regional rule finds a region of the attacker's on a good the town bears that is
 *   not the same region as any it holds today.
 *
 * Both run the phase's own rule (`computeRegionalMonopolies`) on the good's places with
 * the town's holder swapped, and match regions as the phase does (anchors within
 * `MONOPOLY_REGION_RADIUS_HEXES`), so a bonus is paid only for a capture the next scan
 * would record as a break or a new hold. Ties between goods break by resource id.
 * Off (`REGIONAL_MONOPOLY_ENABLED`) = no bonus.
 */
export function monopolyAimFor(ctx: WarAimContext, attackerId: string, townId: string): MonopolyAim {
  const none: MonopolyAim = { bonus: 0, reason: null };
  if (!REGIONAL_MONOPOLY_ENABLED) return none;
  const index = bearingIndexOf(ctx);
  const taken = (places: readonly BearingPlace[]): BearingPlace[] =>
    places.map(p => (p.id === townId ? { ...p, controllerId: attackerId } : p));

  let breaks: { resourceId: string; holderId: string } | null = null;
  for (const { factionId, monopoly } of allRegionalMonopolies(ctx.graph)) {
    if (factionId === attackerId || !monopoly.placeIds.includes(townId)) continue;
    if (!isEnemyFaction(ctx.graph, attackerId, factionId)) continue;
    const anchor = hexOfLocationId(ctx.graph, monopoly.anchorLocationId);
    const places = index.get(monopoly.resourceId);
    if (!anchor || !places) continue;
    const after = regionAnchorsHeld(monopoly.resourceId, taken(places), factionId);
    if (after.some(h => inSameRegion(h, anchor))) continue;
    if (!breaks || monopoly.resourceId < breaks.resourceId) breaks = { resourceId: monopoly.resourceId, holderId: factionId };
  }

  let completes: string | null = null;
  for (const rid of [...index.keys()].sort()) {
    const places = index.get(rid)!;
    if (!places.some(p => p.id === townId)) continue;
    const before = regionAnchorsHeld(rid, places, attackerId);
    const after = regionAnchorsHeld(rid, taken(places), attackerId);
    if (after.some(a => !before.some(b => inSameRegion(a, b)))) { completes = rid; break; }
  }

  const bonus = (breaks ? WAR_AIM_BONUS_BREAKS_MONOPOLY : 0) + (completes ? WAR_AIM_BONUS_COMPLETES_MONOPOLY : 0);
  if (bonus === 0) return none;
  // The larger contributor names the reason (completes 1.0 > breaks 0.5 at defaults).
  const completesWins = completes !== null
    && (!breaks || WAR_AIM_BONUS_COMPLETES_MONOPOLY >= WAR_AIM_BONUS_BREAKS_MONOPOLY);
  return completesWins
    ? { bonus, reason: 'completes_monopoly', resourceId: completes! }
    : { bonus, reason: 'breaks_monopoly', resourceId: breaks!.resourceId, holderId: breaks!.holderId };
}

/** The monopoly bonuses' sum (S1's seam; plan § Engine 3). */
export function monopolyBonusFor(ctx: WarAimContext, attackerId: string, townId: string): number {
  return monopolyAimFor(ctx, attackerId, townId).bonus;
}
