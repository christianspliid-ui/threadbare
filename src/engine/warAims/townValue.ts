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

/**
 * S1: always 0 — the world-wide monopoly rule never fires. S2 (regional monopolies)
 * swaps this body for the break / complete bonuses (plan § Engine 8).
 */
export function monopolyBonusFor(_ctx: WarAimContext, _attackerId: string, _townId: string): number {
  return 0;
}
