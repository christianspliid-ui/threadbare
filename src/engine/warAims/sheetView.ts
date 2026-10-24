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
  armyAimPaidTemplate,
  scarceClauseOf,
  ARMY_HOLD_COPY,
  ARMY_HOLD_PAID_COPY,
} from '../../data/army-words';
import { payingLiegeOf } from '../crown/wages';
import { RESOURCE_DEFINITIONS } from '../../data/resource-content';
import { getResourceTierProse } from '../../data/resource-classes';
import { placeTierLocationOf } from './context';

export interface WarAimSlot {
  id: string;
  name: string;
  kind: 'location' | 'army' | 'faction';
}

export interface ArmyAimView {
  /** The sentence with `{town}` / `{enemy}` / `{liege}` slots, or a plain line with none. */
  template: string;
  slots: { town: WarAimSlot | null; enemy: WarAimSlot | null; liege?: WarAimSlot | null };
}

/**
 * THR-1974 — the liege paying this army's soldiers at `tick`, as a slot, or null. Read
 * only from a fresh wage stamp (Law 45); a liege with no name omits the clause (PC-3).
 */
function paymasterSlot(graph: WorldGraph, armyId: string, tick: number | undefined): WarAimSlot | null {
  if (tick === undefined) return null;
  const liegeId = payingLiegeOf(graph, armyId, tick);
  const name = liegeId ? graph.getNode(liegeId)?.name : undefined;
  return liegeId && typeof name === 'string' && name ? { id: liegeId, name, kind: 'faction' } : null;
}

function factionOf(graph: WorldGraph, actorId: string): string | undefined {
  return graph.getOutgoingEdges(actorId, 'member_of')[0]?.target;
}

/** `tick` (THR-1974): when given, an army its liege pays names the liege (`{liege}`). */
export function armyAimView(graph: WorldGraph, armyId: string, tick?: number): ArmyAimView | null {
  const armyState = graph.getNode(armyId)?.properties.armyState as Record<string, unknown> | undefined;
  if (!armyState) return null;
  const objective = (armyState.objective ?? null) as Record<string, unknown> | null;
  const liege = paymasterSlot(graph, armyId, tick);

  if (!objective) {
    if (armyState.holdReason !== 'no_enemy_in_reach') return null;
    if (liege) return { template: ARMY_HOLD_PAID_COPY, slots: { town: null, enemy: null, liege } };
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
  const input = {
    objectiveType: objective.type,
    reason: objective.reason,
    resourceName: rid ? (RESOURCE_DEFINITIONS[rid]?.name ?? rid).toLowerCase() : null,
    scarceClause: rid ? scarceClauseOf(rid, getResourceTierProse(rid, 'scarce')) : null,
    attackerFactionName: attackerId ? (graph.getNode(attackerId)?.name ?? null) : null,
    hasNamedEnemy: enemy !== null,
    monopolyResourceName: rid ? (RESOURCE_DEFINITIONS[rid]?.name ?? rid).toLowerCase() : null,
    monopolyHolderName: typeof objective.reasonFactionId === 'string'
      ? (graph.getNode(objective.reasonFactionId)?.name ?? null)
      : null,
  };
  const paid = liege ? armyAimPaidTemplate(input) : null;
  const template = paid ?? armyAimTemplate(input);
  if (!template) return null;
  return {
    template,
    slots: { town: { id: town.id, name: town.name, kind: 'location' }, enemy, ...(paid ? { liege } : {}) },
  };
}
