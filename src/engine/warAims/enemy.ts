/**
 * warAims/enemy.ts — who an army may march on and besiege (THR-1922).
 *
 * Before this guard, `selectArmyObjective` and siege start treated any settlement whose
 * `controls` edge belonged to another faction as hostile. Measured on seed 42 medium over
 * 600 ticks: 19 of 20 objectives went to factions with no quarrel at all, and half the
 * siege-ticks were the Civic Guard besieging the towns it keeps its halls in.
 *
 * Two questions, both pure reads over existing edges:
 * - `isEnemyFaction(a, b)` — `hostile_to` either way, or a `relates_to` either way with
 *   `isRival`, `basis: 'war'`, or sentiment below `RIVALRY_SENTIMENT_THRESHOLD`.
 *   Deliberately separate from `areFactionsHostile` (rivalry only), which other readers
 *   keep. The war-aims plan (THR-1933, `Docs/plans/2026-10-15-thr-1933-war-aims.md`
 *   § Engine 1) grows this predicate with monster factions and the alliance override.
 * - `factionKeepsHallAt(faction, location)` — the faction's home Location, a
 *   `located_at` edge from the faction (the guild-hall shape `factionSeeding` writes), or
 *   a faction-hall sublocation under the Location carrying the faction's id.
 *
 * NFP #4 Fail-soft: missing ids and dangling edges answer `false`; nothing throws.
 */

import type { WorldGraph } from '../graph';
import { RIVALRY_SENTIMENT_THRESHOLD } from '../../types/factionAction';

/** True when `a` and `b` are distinct factions with a quarrel an army may act on. */
export function isEnemyFaction(
  graph: WorldGraph,
  a: string | undefined,
  b: string | undefined,
): boolean {
  if (!a || !b || a === b) return false;
  const hostile = (src: string, tgt: string): boolean =>
    graph.getOutgoingEdges(src, 'hostile_to').some(e => e.target === tgt);
  if (hostile(a, b) || hostile(b, a)) return true;
  const quarrel = (src: string, tgt: string): boolean =>
    graph.getOutgoingEdges(src, 'relates_to').some(e => {
      if (e.target !== tgt) return false;
      const p = e.properties;
      if (p.isRival === true || p.basis === 'war') return true;
      return typeof p.sentiment === 'number' && p.sentiment < RIVALRY_SENTIMENT_THRESHOLD;
    });
  return quarrel(a, b) || quarrel(b, a);
}

/** True when `factionId` keeps a hall or its home at `locationId`. */
export function factionKeepsHallAt(
  graph: WorldGraph,
  factionId: string | undefined,
  locationId: string | undefined,
): boolean {
  if (!factionId || !locationId) return false;
  const faction = graph.getNode(factionId);
  if (faction?.properties.homeLocationId === locationId) return true;
  if (graph.getOutgoingEdges(factionId, 'located_at').some(e => e.target === locationId)) return true;
  return graph.getOutgoingEdges(locationId, 'contains').some(e => {
    const sub = graph.getNode(e.target);
    return sub?.properties.factionId === factionId
      && (sub.properties.sublocationTypeId === 'sublocation-type.faction-hall'
        || sub.properties.locationSubtype === 'guild-hall');
  });
}

/**
 * Whether an army of `armyFactionId` may besiege a settlement held by `holderId`.
 * Never its own hall or home town; otherwise only an enemy's town, or the town its
 * own objective names (an agenda campaign chose that target on purpose).
 */
export function mayBesiege(
  graph: WorldGraph,
  armyFactionId: string | undefined,
  holderId: string | undefined,
  settlementId: string,
  objectiveTargetId?: string,
): boolean {
  if (!armyFactionId || !holderId || armyFactionId === holderId) return false;
  if (factionKeepsHallAt(graph, armyFactionId, settlementId)) return false;
  return isEnemyFaction(graph, armyFactionId, holderId) || objectiveTargetId === settlementId;
}
