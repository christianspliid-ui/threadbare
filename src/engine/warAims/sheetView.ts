/**
 * warAims/sheetView.ts — the army sheet's war-aim line as a view model (THR-1933).
 *
 * The sheet reads no graph itself (NFP #2, the view-model seam): this resolves the
 * objective's town, the enemy host a defence holds against, the staple behind a
 * `feeds_staple` reason, and whether a holding army stands on its own ground, then hands
 * back the template from `army-words.ts` with its `{town}` / `{enemy}` slots named.
 *
 * Null when the army carries no reason and no hold (an old save, a campaign army) — the
 * sheet's plain objective sentence covers those.
 */

import type { WorldGraph } from '../graph';
import {
  armyAimTemplate,
  scarceClauseOf,
  ARMY_HOLD_COPY,
} from '../../data/army-words';
import { RESOURCE_DEFINITIONS } from '../../data/resource-content';
import { getResourceTierProse } from '../../data/resource-classes';
import { placeTierLocationOf } from './context';

export interface WarAimSlot {
  id: string;
  name: string;
  kind: 'location' | 'army';
}

export interface ArmyAimView {
  /** The sentence with `{town}` / `{enemy}` slots, or a plain line with none. */
  template: string;
  slots: { town: WarAimSlot | null; enemy: WarAimSlot | null };
}

function factionOf(graph: WorldGraph, actorId: string): string | undefined {
  return graph.getOutgoingEdges(actorId, 'member_of')[0]?.target;
}

export function armyAimView(graph: WorldGraph, armyId: string): ArmyAimView | null {
  const armyState = graph.getNode(armyId)?.properties.armyState as Record<string, unknown> | undefined;
  if (!armyState) return null;
  const objective = (armyState.objective ?? null) as Record<string, unknown> | null;

  if (!objective) {
    if (armyState.holdReason !== 'no_enemy_in_reach') return null;
    const factionId = factionOf(graph, armyId);
    const placeId = placeTierLocationOf(graph, armyId);
    const atHome = !!factionId && !!placeId
      && graph.getIncomingEdges(placeId, 'controls').some(e => e.source === factionId);
    return { template: atHome ? ARMY_HOLD_COPY.home : ARMY_HOLD_COPY.away, slots: { town: null, enemy: null } };
  }

  const townId = typeof objective.targetNodeId === 'string' ? objective.targetNodeId : null;
  const town = townId ? graph.getNode(townId) : undefined;
  if (!town) return null;

  let enemy: WarAimSlot | null = null;
  const againstId = typeof objective.againstArmyId === 'string' ? objective.againstArmyId : null;
  if (againstId && graph.getNode(againstId)) {
    const enemyFactionId = factionOf(graph, againstId);
    const enemyName = enemyFactionId ? graph.getNode(enemyFactionId)?.name : undefined;
    if (enemyName) enemy = { id: againstId, name: enemyName, kind: 'army' };
  }

  const rid = typeof objective.reasonResourceId === 'string' ? objective.reasonResourceId : null;
  const attackerId = factionOf(graph, armyId);
  const template = armyAimTemplate({
    objectiveType: objective.type,
    reason: objective.reason,
    resourceName: rid ? (RESOURCE_DEFINITIONS[rid]?.name ?? rid).toLowerCase() : null,
    scarceClause: rid ? scarceClauseOf(rid, getResourceTierProse(rid, 'scarce')) : null,
    attackerFactionName: attackerId ? (graph.getNode(attackerId)?.name ?? null) : null,
    hasNamedEnemy: enemy !== null,
  });
  if (!template) return null;
  return { template, slots: { town: { id: town.id, name: town.name, kind: 'location' }, enemy } };
}
