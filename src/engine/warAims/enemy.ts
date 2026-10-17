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
 *   § Engine 1) grew it with monster factions and the alliance override (`enemyArm`);
 *   targeting, battle start and siege start all read it.
 * - `factionKeepsHallAt(faction, location)` — the faction's home Location, a
 *   `located_at` edge from the faction (the guild-hall shape `factionSeeding` writes), or
 *   a faction-hall sublocation under the Location carrying the faction's id.
 *
 * NFP #4 Fail-soft: missing ids and dangling edges answer `false`; nothing throws.
 */

import type { WorldGraph } from '../graph';
import { RIVALRY_SENTIMENT_THRESHOLD } from '../../types/factionAction';
import { WAR_AIMS_ENABLED } from '../../data/war-aims-constants';

/** True when `a` and `b` are distinct factions with a quarrel an army may act on. */
export function isEnemyFaction(
  graph: WorldGraph,
  a: string | undefined,
  b: string | undefined,
): boolean {
  if (!a || !b || a === b) return false;
  return enemyArm(graph, a, b) !== null;
}

/** Which arm of the enemy rule fires for `a` and `b`, or null (debug: `__DEBUG.isEnemyFaction`). */
export type EnemyArm = 'hostile_to' | 'rival' | 'war' | 'sentiment' | 'monster';

/**
 * The arm of the enemy rule that makes `a` and `b` enemies, checked in a fixed order,
 * or null. With `WAR_AIMS_ENABLED` (THR-1933 § Engine 1) a monster faction is everyone's
 * enemy, and an alliance either way silences the sentiment arm (allies who quarrel are
 * not at war) — never `hostile_to`, rivalry or a declared war.
 */
export function enemyArm(graph: WorldGraph, a: string, b: string): EnemyArm | null {
  if (a === b) return null;
  const hostile = (src: string, tgt: string): boolean =>
    graph.getOutgoingEdges(src, 'hostile_to').some(e => e.target === tgt);
  if (hostile(a, b) || hostile(b, a)) return 'hostile_to';
  const rel = [
    ...graph.getOutgoingEdges(a, 'relates_to').filter(e => e.target === b),
    ...graph.getOutgoingEdges(b, 'relates_to').filter(e => e.target === a),
  ];
  if (rel.some(e => e.properties.isRival === true)) return 'rival';
  if (rel.some(e => e.properties.basis === 'war')) return 'war';
  if (WAR_AIMS_ENABLED) {
    const isMonster = (id: string): boolean => graph.getNode(id)?.properties.factionType === 'monster';
    if (isMonster(a) || isMonster(b)) return 'monster';
  }
  const allied = WAR_AIMS_ENABLED && rel.some(e => e.properties.isAlliance === true);
  if (!allied && rel.some(e => typeof e.properties.sentiment === 'number'
    && e.properties.sentiment < RIVALRY_SENTIMENT_THRESHOLD)) return 'sentiment';
  return null;
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
 * True when `factionId` lost `locationId` by conquest to its current holder — the
 * `controls` edge carries `takenFrom` (stamped by the battle aftermath while the crown
 * is on). A faction may march on its own hall town to win it back.
 */
export function wasTakenFrom(graph: WorldGraph, factionId: string, locationId: string): boolean {
  return graph.getIncomingEdges(locationId, 'controls').some(e => e.properties.takenFrom === factionId);
}

/** The own-hall veto: a hall or home town is off limits unless it was taken from this faction. */
export function hallBarsAttack(graph: WorldGraph, factionId: string, locationId: string): boolean {
  return factionKeepsHallAt(graph, factionId, locationId) && !wasTakenFrom(graph, factionId, locationId);
}

/**
 * The town a notable-agenda campaign army was raised to take, or undefined. Such an army
 * pursues a campaign ambition (`compositionId` set) whose `targetNodeId` is the declared
 * object; an ordinary army's objective is not a declaration and earns no exception.
 */
export function campaignTargetOf(graph: WorldGraph, armyId: string): string | undefined {
  for (const e of graph.getOutgoingEdges(armyId, 'pursues')) {
    const amb = graph.getNode(e.target);
    if (amb?.properties.compositionId && typeof amb.properties.targetNodeId === 'string') {
      return amb.properties.targetNodeId;
    }
  }
  return undefined;
}

/**
 * Whether an army of `armyFactionId` may besiege a settlement held by `holderId`.
 * Never its own hall or home town unless that town was taken from it; otherwise only an
 * enemy's town, or the town a notable-agenda campaign declared (`campaignTargetId`).
 */
export function mayBesiege(
  graph: WorldGraph,
  armyFactionId: string | undefined,
  holderId: string | undefined,
  settlementId: string,
  campaignTargetId?: string,
): boolean {
  if (!armyFactionId || !holderId || armyFactionId === holderId) return false;
  if (hallBarsAttack(graph, armyFactionId, settlementId)) return false;
  return isEnemyFaction(graph, armyFactionId, holderId) || campaignTargetId === settlementId;
}
