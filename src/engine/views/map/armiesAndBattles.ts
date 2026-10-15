/**
 * map.armiesAndBattles — armies on campaign and battles/sieges on their hexes, in
 * one pass over the actors (THR-1822, moved from GameView's army/battle memo).
 *
 * An army row carries its faction's index among the factions and its headcount;
 * the host paints the heraldic colour and the scene's default size.
 */
import type { WorldGraph } from '../../graph';
import type { ArmyState } from '../../../types/army';
import type { BattleState } from '../../../types/battle';
import { getFactionMembershipEdges } from '../../graphQueries';
import type { ViewSelector } from '../readView';
import type { MapArmiesAndBattlesVM, MapArmyVM, MapBattleVM } from './mapTypes';
import { nodeMapHex } from './mapPosition';
import { buildFactionIndexMap } from './realmInk';

/** `faction_def_{defId}` or `faction_def_{defId}_{n}` → `defId`, for the coat of arms. */
const FACTION_DEF_ID_PATTERN = /^faction_def_(.+?)(?:_\d+)?$/;

/**
 * One battle/siege actor → its indicator row, or null when the node is not a
 * battle or its hex cannot be resolved. Battle and siege nodes carry no hexCol of
 * their own; the engine places them with a `located_at` edge to the hex
 * (battleResolution.ts, siegeResolution.ts). THR-1846: a siege keeps `isSiege`
 * all the way to the sprite.
 *
 * Moved from `HexMapV2/scene/BattleIndicatorLayer.ts` (THR-1822), which re-exports it.
 */
export function battleIndicatorForNode(
  graph: WorldGraph,
  battle: { id: string; properties: Record<string, unknown> },
): MapBattleVM | null {
  const battleState = battle.properties.battleState as
    | { battleType?: string; attackerArmyId?: string; defenderArmyId?: string }
    | undefined;
  if (battleState == null) return null;

  const locEdges = graph.getOutgoingEdges(battle.id, 'located_at');
  if (locEdges.length === 0) return null;

  const locationNode = graph.getNode(locEdges[0].target);
  if (!locationNode) return null;

  const hexCol = locationNode.properties.hexCol as number | undefined;
  const hexRow = locationNode.properties.hexRow as number | undefined;
  if (hexCol == null || hexRow == null) return null;

  const isSiege = battleState.battleType === 'siege';
  const attackerName = armyFactionName(graph, battleState.attackerArmyId);
  const defenderName = isSiege ? undefined : armyFactionName(graph, battleState.defenderArmyId);
  return {
    id: battle.id, hexCol, hexRow, isSiege,
    ...(attackerName ? { attackerName } : {}),
    ...(defenderName ? { defenderName } : {}),
  };
}

/** An army's faction name (faction targets only, as the army sprite reads it); undefined when it has none. */
function armyFactionName(graph: WorldGraph, armyId: string | undefined): string | undefined {
  if (!armyId) return undefined;
  const factionId = getFactionMembershipEdges(graph, armyId)[0]?.target;
  const name = factionId ? graph.getNode(factionId)?.name : undefined;
  return typeof name === 'string' && name.length > 0 ? name : undefined;
}

export const mapArmiesAndBattlesSelector: ViewSelector<void, MapArmiesAndBattlesVM> = {
  id: 'map.armiesAndBattles',
  invalidation: 'world',
  key: () => '',
  fallback: () => ({ armies: [], battles: [] }),
  build(ctx) {
    const graph = ctx.graph;
    const actors = graph.getNodesByType('actor');
    // THR-1902: the same index a Realm's border ink reads, so the two colours agree.
    const factionIdxMap = buildFactionIndexMap(graph);

    const armies: MapArmyVM[] = [];
    const battles: MapBattleVM[] = [];
    for (const node of actors) {
      const armyState = node.properties.armyState as ArmyState | undefined;
      const battleState = node.properties.battleState as BattleState | undefined;

      if (armyState != null) {
        const pos = nodeMapHex(graph, node);
        if (pos) {
          // THR-74: faction targets only — the heraldic colour keys off the faction,
          // and a company membership would otherwise hijack the lookup.
          const memberEdges = getFactionMembershipEdges(graph, node.id);
          const factionId = memberEdges.length > 0 ? memberEdges[0].target : undefined;
          const factionIndex = factionId ? (factionIdxMap.get(factionId) ?? 0) : 0;
          let factionDefId: string | null = null;
          if (factionId) {
            const defMatch = factionId.match(FACTION_DEF_ID_PATTERN);
            if (defMatch) factionDefId = defMatch[1];
          }
          armies.push({
            armyId: node.id,
            hexCol: pos.col,
            hexRow: pos.row,
            factionIndex,
            factionDefId,
            headcount: armyState.headcount ?? null,
            isInBattle: battleState != null,
          });
        }
      }

      if (battleState != null) {
        const entry = battleIndicatorForNode(graph, node);
        if (entry) battles.push(entry);
      }
    }
    return { armies, battles };
  },
};
