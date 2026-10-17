/**
 * warAims/defence.ts — defence first (THR-1933 § Engine 2).
 *
 * A faction's protected holdings are its own settlements plus its sworn vassals'
 * (`protectedHoldingsOf`, the crown's view). A **threat** is an enemy army whose
 * objective targets one of them. The army defends the threatened holding nearest to it
 * when that holding lies within `WAR_AIM_DEFENCE_RADIUS_HEXES`, ties by holding id. It
 * marches to the holding and stands there — it does not chase the enemy army (movement
 * paths to Locations; the battle start then fights with the prepared-defence bonus).
 */

import type { WorldGraph } from '../graph';
import type { ArmyObjective, ArmyState } from '../../types/army';
import type { HexCoord } from '../../types';
import { hexDistance } from '../../lib/hexMath';
import { protectedHoldingsOf } from '../crown/crownView';
import { WAR_AIM_DEFENCE_RADIUS_HEXES } from '../../data/war-aims-constants';
import { isEnemyFaction } from './enemy';
import { hexOfLocation } from './context';

export interface DefenceTarget {
  objective: ArmyObjective;
  /** The holding belongs to a sworn vassal, not the faction itself. */
  sworn: boolean;
  hexes: number;
}

function factionOf(graph: WorldGraph, actorId: string): string | undefined {
  return graph.getOutgoingEdges(actorId, 'member_of')[0]?.target;
}

/** Protected holdings of `factionId`: own and sworn settlements (the crown's view). */
export function holdingsToDefend(graph: WorldGraph, factionId: string): string[] {
  try {
    return protectedHoldingsOf(graph, factionId);
  } catch {
    // fail-soft: the crown view unavailable → own holdings only
    return graph.getOutgoingEdges(factionId, 'controls').map(e => e.target).sort();
  }
}

export function findThreatToDefend(
  graph: WorldGraph,
  armyId: string,
  factionId: string,
  armyHex: HexCoord,
): DefenceTarget | null {
  const holdings = new Set(holdingsToDefend(graph, factionId));
  if (holdings.size === 0) return null;

  // holding id → the lowest-id enemy army marching on it
  const threats = new Map<string, string>();
  const armies = graph.getNodesByType('actor')
    .filter(n => n.id !== armyId && n.properties.armyState != null)
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  for (const other of armies) {
    const target = (other.properties.armyState as ArmyState).objective?.targetNodeId;
    if (!target || !holdings.has(target) || threats.has(target)) continue;
    if (!isEnemyFaction(graph, factionId, factionOf(graph, other.id))) continue;
    threats.set(target, other.id);
  }

  let best: { holdingId: string; againstArmyId: string; hexes: number } | null = null;
  for (const [holdingId, againstArmyId] of threats) {
    const hex = hexOfLocation(graph, graph.getNode(holdingId));
    if (!hex) continue;
    const hexes = hexDistance(armyHex, hex);
    if (hexes > WAR_AIM_DEFENCE_RADIUS_HEXES) continue;
    if (!best || hexes < best.hexes || (hexes === best.hexes && holdingId < best.holdingId)) {
      best = { holdingId, againstArmyId, hexes };
    }
  }
  if (!best) return null;

  const sworn = !graph.getIncomingEdges(best.holdingId, 'controls').some(e => e.source === factionId);
  return {
    objective: {
      type: 'defend',
      targetNodeId: best.holdingId,
      estimatedAttrition: 0,
      reason: 'defence',
      againstArmyId: best.againstArmyId,
      source: 'war_aim',
    },
    sworn,
    hexes: best.hexes,
  };
}
