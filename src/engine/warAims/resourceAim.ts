/**
 * warAims/resourceAim.ts — `resource_acquisition` takes its target (THR-1955, plan § Engine 10).
 *
 * Daily, inside the re-aim pass: a faction pursuing `resource_acquisition` points its
 * ambition at the best-scoring enemy town (the § 3 score — value × (1 + bonuses) ÷
 * (1 + hexes / `WAR_AIM_HALF_VALUE_HEXES`)) whose own bag, places or fields grow a staple
 * the faction is short of. Distance is measured from the faction's seat (its home
 * location, else its first controlled settlement by id); with no seat it is 0.
 *
 * The ambition counts as **met** while the faction holds any regional monopoly. That is a
 * predicate (`resourceAcquisitionMet`), not a stored flag: its reader is THR-1937's
 * undertakings plan, and a stored field with no reader would only drift.
 *
 * No target found → the ambition's target is left as it was (an older pick still names a
 * real town; the abandon check clears a destroyed one). No random draw (NFP #3).
 */

import type { GameState } from '../../types/gameState';
import type { HexCoord } from '../../types';
import { hexDistance } from '../../lib/hexMath';
import { WAR_AIM_HALF_VALUE_HEXES, WAR_AIM_BONUS_FEEDS_STAPLE } from '../../data/war-aims-constants';
import { REGIONAL_MONOPOLY_ENABLED } from '../../data/regional-monopoly-constants';
import { readRegionalMonopolies } from '../regionalMonopoly';
import { hexOfLocation, type WarAimContext } from './context';
import { townValueFor, feedsLackingStaple, scarceStaplesOf, monopolyBonusFor } from './townValue';
import { stillEnemyTarget } from './score';

/** Whether a faction's `resource_acquisition` ambition is met (any regional monopoly held). */
export function resourceAcquisitionMet(graph: WarAimContext['graph'], factionId: string): boolean {
  return readRegionalMonopolies(graph.getNode(factionId)?.properties).length > 0;
}

function seatHexOf(ctx: WarAimContext, factionId: string): HexCoord | null {
  const faction = ctx.graph.getNode(factionId);
  const home = faction?.properties.homeLocationId;
  if (typeof home === 'string') {
    const hex = hexOfLocation(ctx.graph, ctx.graph.getNode(home));
    if (hex) return hex;
  }
  const held = ctx.graph.getOutgoingEdges(factionId, 'controls')
    .map(e => e.target).filter(id => ctx.towns.has(id)).sort();
  return held.length > 0 ? ctx.towns.get(held[0])!.hex : null;
}

/** The town a `resource_acquisition` faction wants, or null. */
export function pickResourceAim(ctx: WarAimContext, factionId: string): string | null {
  const scarce = scarceStaplesOf(ctx, factionId);
  if (scarce.length === 0) return null;
  const seat = seatHexOf(ctx, factionId);
  let best: { id: string; score: number; hexes: number } | null = null;
  for (const town of ctx.towns.values()) {
    if (!stillEnemyTarget(ctx, factionId, town.node.id)) continue;
    if (!feedsLackingStaple(ctx, town.node.id, scarce)) continue;
    const hexes = seat ? hexDistance(seat, town.hex) : 0;
    const bonuses = WAR_AIM_BONUS_FEEDS_STAPLE + monopolyBonusFor(ctx, factionId, town.node.id);
    const score = townValueFor(ctx, town.node.id) * (1 + bonuses) / (1 + hexes / WAR_AIM_HALF_VALUE_HEXES);
    if (!best || score > best.score || (score === best.score && (hexes < best.hexes
      || (hexes === best.hexes && town.node.id < best.id)))) {
      best = { id: town.node.id, score, hexes };
    }
  }
  return best?.id ?? null;
}

/** Point every `resource_acquisition` ambition at its town. */
export function aimResourceAmbitions(state: GameState, getCtx: () => WarAimContext): void {
  if (!REGIONAL_MONOPOLY_ENABLED) return;
  const graph = state.graph;
  const factions = graph.getNodesByType('actor')
    .filter(n => n.properties.actorType === 'faction')
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  for (const faction of factions) {
    try {
      const amb = graph.getOutgoingEdges(faction.id, 'pursues')
        .map(e => graph.getNode(e.target))
        .find(n => n && !n.properties.compositionId && n.properties.ambitionType === 'resource_acquisition');
      if (!amb) continue;
      const target = pickResourceAim(getCtx(), faction.id);
      if (target && amb.properties.targetNodeId !== target) graph.updateNode(amb.id, { properties: { targetNodeId: target } });
    } catch (err) {
      console.warn(`[war_aims] resource aim failed for ${faction.id}`, err);
    }
  }
}
