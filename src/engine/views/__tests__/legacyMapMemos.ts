/**
 * GameView's map memos as they stood before THR-1822 moved them onto the seam —
 * copied verbatim from `src/components/Game/GameView.tsx` at `089df053` and
 * wrapped as pure functions, so the golden tests compare the moved selectors
 * (plus the host adapters) against the code they replace on the same state.
 *
 * Test-only. Never import this from product code.
 */
import type { WorldGraph } from '../../graph';
import type { GameState } from '../../../types/gameState';
import type { SpotlightTier } from '../../../types/npc';
import type { ArmyState } from '../../../types/army';
import type { BattleState } from '../../../types/battle';
import type { BalanceEvent } from '../../../types/balanceEval';
import type { SimulationRuntime } from '../../simulationRuntime';
import { hexToWorld } from '../../../lib/worldPosition';
import { getAnyEncounterById } from '../../../data/encounter-content';
import { getUnifiedTemplateById } from '../../../data/unified-action-templates';
import { CRUD_TO_ENCOUNTER_TYPE } from '../../encounterCache';
import {
  ACTIVITY_ICON_OPACITY_BACKGROUND,
  ACTIVITY_ICON_OPACITY_SHAPING,
  ACTIVITY_ICON_OPACITY_STORY,
} from '../../../data/attention-constants';
import { getRetinueAgents } from '../../retinue';
import { getFactionMembershipEdges } from '../../graphQueries';
import { getActiveGroups, getGroupPosition, getGroupMembers, isGroupThreaded, isAgentGone } from '../../groups/groupQueries';
import { getLatestEncounterDecisionsByAgent } from '../../balanceTelemetry';
import { getAgentPortraitUrlFromProperties } from '../../../data/portrait-assets';
import { getOriginPortraitUrl } from '../../../data/avatar-portrait-assets';
import { getSphereSymbol } from '../../../data/sphereIcons';
import type { SphereName } from '../../../types';
import { HEX_CONSTANTS } from '../../../components/HexMapV2/scene/HexFillMesh';
import { FACTION_HERALDIC_COLORS } from '../../../components/HexMapV2/agents/agentSpriteTypes';
import { ARMY_SIZE_SMALL_MAX } from '../../../components/HexMapV2/scene/ArmySpriteMesh';
import { battleIndicatorForNode } from '../map/armiesAndBattles';
import { shouldRenderIndividualOnHexMap } from '../map/agentVisibility';
import { getSelectedEncounterPoolCandidate } from '../map/activityIcons';
import { getEncounterActivityIconKey } from '../../../components/Game/encounterActivityPresentation';

export interface LegacyInputs {
  state: GameState;
  runtime: SimulationRuntime;
  avatarNodeId: string | null | undefined;
  sphereColor: string | undefined;
  originFragmentId: string | undefined;
  primarySphere: SphereName;
  threadedAgentIds: readonly string[];
}

export function legacyAgentRenderData(i: LegacyInputs): unknown[] {
  const gameState = i.state;
  const avatarNodeId = i.avatarNodeId;
  const actors = gameState.graph.getNodesByType('actor');
  const retinueIds = new Set(getRetinueAgents(gameState.graph, gameState.ascendantId).map(r => r.id));
  const threadedAgentIds = new Set(gameState.graph.getOutgoingEdges(gameState.ascendantId, 'thread').map(e => e.target));
  const result: unknown[] = [];
  for (let k = 0; k < actors.length; k++) {
    const n = actors[k];
    const actorType = n.properties.actorType as string | undefined;
    if (actorType !== 'individual' && actorType !== 'group') continue;
    if (n.properties.armyState != null) continue;
    if (actorType === 'individual') {
      const commandedByEdges = gameState.graph.getIncomingEdges(n.id, 'commanded_by');
      const tier = n.properties.spotlightTier as SpotlightTier | undefined;
      if (!shouldRenderIndividualOnHexMap(tier, commandedByEdges.length)) continue;
      if (n.id !== avatarNodeId && !threadedAgentIds.has(n.id)) continue;
    }
    let hexCol = n.properties.hexCol as number | undefined;
    let hexRow = n.properties.hexRow as number | undefined;
    if (hexCol == null || hexRow == null) {
      const locEdges = gameState.graph.getOutgoingEdges(n.id, 'located_at');
      const locationId = locEdges.length > 0 ? locEdges[0].target : undefined;
      if (locationId) {
        const loc = gameState.graph.getNode(locationId);
        if (loc) {
          hexCol = loc.properties.hexCol as number | undefined;
          hexRow = loc.properties.hexRow as number | undefined;
        }
      }
    }
    if (hexCol == null || hexRow == null) continue;
    const movState = n.properties.movementState as
      | { currentHexPosition?: { col: number; row: number }; currentRoadType?: string; roadHexQueue?: unknown[] }
      | undefined;
    if (movState?.currentHexPosition) {
      hexCol = movState.currentHexPosition.col;
      hexRow = movState.currentHexPosition.row;
    }
    const isAvatar = n.id === avatarNodeId;
    result.push({
      id: n.id,
      hexCol,
      hexRow,
      portraitUrl: isAvatar
        ? getOriginPortraitUrl(i.originFragmentId ?? '')
        : (getAgentPortraitUrlFromProperties(n.properties as Record<string, unknown>) ?? undefined),
      factionIndex: k % 6,
      isRetinue: retinueIds.has(n.id),
      isAvatar,
      avatarSphereColor: isAvatar ? i.sphereColor : undefined,
      avatarSigil: isAvatar ? getSphereSymbol(i.primarySphere) : undefined,
      name: n.name,
      currentRoadType: movState?.currentRoadType as 'major' | 'trail' | undefined,
      roadHexQueueLength: Array.isArray(movState?.roadHexQueue) ? movState.roadHexQueue.length : undefined,
    });
  }
  return result;
}

export function legacyThreadLineData(i: LegacyInputs): unknown[] {
  const gameState = i.state;
  const avatarNodeId = i.avatarNodeId;
  const avatarPos = avatarNodeId
    ? (() => {
        const n = gameState.graph.getNode(avatarNodeId);
        if (!n) return null;
        let col = n.properties.hexCol as number | undefined;
        let row = n.properties.hexRow as number | undefined;
        if (col == null || row == null) {
          const locEdges = gameState.graph.getOutgoingEdges(avatarNodeId, 'located_at');
          if (locEdges.length > 0) {
            const loc = gameState.graph.getNode(locEdges[0].target);
            col = loc?.properties.hexCol as number | undefined;
            row = loc?.properties.hexRow as number | undefined;
          }
        }
        return col != null && row != null ? { col, row } : null;
      })()
    : null;
  if (!avatarPos) return [];
  const fromWorld = hexToWorld(avatarPos, HEX_CONSTANTS.HEX_SIZE);
  const threadEdges = gameState.graph.getOutgoingEdges(gameState.ascendantId, 'thread');
  const result: unknown[] = [];
  for (const edge of threadEdges) {
    const agentNode = gameState.graph.getNode(edge.target);
    if (!agentNode) continue;
    let hexCol = agentNode.properties.hexCol as number | undefined;
    let hexRow = agentNode.properties.hexRow as number | undefined;
    if (hexCol == null || hexRow == null) {
      const locEdges = gameState.graph.getOutgoingEdges(edge.target, 'located_at');
      if (locEdges.length > 0) {
        const loc = gameState.graph.getNode(locEdges[0].target);
        hexCol = loc?.properties.hexCol as number | undefined;
        hexRow = loc?.properties.hexRow as number | undefined;
      }
    }
    if (hexCol == null || hexRow == null) continue;
    const toWorld = hexToWorld({ col: hexCol, row: hexRow }, HEX_CONSTANTS.HEX_SIZE);
    const courtPosition = (edge.properties as Record<string, unknown>)['courtPosition'] as string | undefined;
    result.push({
      agentId: edge.target,
      courtPosition: courtPosition ?? 'watched',
      fromX: fromWorld.x,
      fromY: fromWorld.y,
      toX: toWorld.x,
      toY: toWorld.y,
    });
  }
  return result;
}

export function legacyCompanyRenderData(i: LegacyInputs): unknown[] {
  const graph: WorldGraph = i.state.graph;
  const result: unknown[] = [];
  for (const group of getActiveGroups(graph)) {
    const positionId = getGroupPosition(graph, group.id);
    if (!positionId) continue;
    let node = graph.getNode(positionId) ?? null;
    let hexCol: number | undefined;
    let hexRow: number | undefined;
    for (let depth = 0; depth < 3 && node; depth++) {
      const p = node.properties as Record<string, unknown>;
      if (typeof p.hexCol === 'number' && typeof p.hexRow === 'number') {
        hexCol = p.hexCol;
        hexRow = p.hexRow;
        break;
      }
      const parentId = p.parentLocationId as string | undefined;
      node = parentId ? (graph.getNode(parentId) ?? null) : null;
    }
    if (hexCol == null || hexRow == null) continue;
    const world = hexToWorld({ col: hexCol, row: hexRow }, HEX_CONSTANTS.HEX_SIZE);
    const memberCount = getGroupMembers(graph, group.id).filter(m => !isAgentGone(m)).length;
    result.push({
      id: group.id,
      worldX: world.x,
      worldY: world.y,
      threaded: isGroupThreaded(graph, group.id, i.state.ascendantId),
      memberCount,
    });
  }
  return result;
}

export function legacyActivityIconData(i: LegacyInputs): unknown[] {
  const gameState = i.state;
  const latestThreadEncounterDecisions: Map<string, BalanceEvent> = i.threadedAgentIds.length === 0
    ? new Map()
    : getLatestEncounterDecisionsByAgent(i.runtime, i.threadedAgentIds);
  type Row = { agentId: string; worldX: number; worldY: number; iconKey: string; tierOpacity: number; __priority__: number };
  const resultByAgent = new Map<string, Row>();
  const getAgentWorldPosition = (agentId: string): { worldX: number; worldY: number } | null => {
    const agentNode = gameState.graph.getNode(agentId);
    if (!agentNode) return null;
    let hexCol = agentNode.properties.hexCol as number | undefined;
    let hexRow = agentNode.properties.hexRow as number | undefined;
    if (hexCol == null || hexRow == null) {
      const locEdges = gameState.graph.getOutgoingEdges(agentId, 'located_at');
      if (locEdges.length > 0) {
        const loc = gameState.graph.getNode(locEdges[0].target);
        hexCol = loc?.properties.hexCol as number | undefined;
        hexRow = loc?.properties.hexRow as number | undefined;
      }
    }
    if (hexCol == null || hexRow == null) return null;
    const worldPos = hexToWorld({ col: hexCol, row: hexRow }, HEX_CONSTANTS.HEX_SIZE);
    return { worldX: worldPos.x, worldY: worldPos.y };
  };
  const upsertIcon = (agentId: string, iconData: { iconKey: string; tierOpacity: number }, priority: number) => {
    const worldPosition = getAgentWorldPosition(agentId);
    if (!worldPosition) return;
    const storedPriority = resultByAgent.get(agentId)?.__priority__ ?? -1;
    if (storedPriority > priority) return;
    resultByAgent.set(agentId, { agentId, worldX: worldPosition.worldX, worldY: worldPosition.worldY, ...iconData, __priority__: priority });
  };
  for (const [agentId, decision] of latestThreadEncounterDecisions.entries()) {
    if (decision.decisionType === 'idle') continue;
    const selectedCandidate = getSelectedEncounterPoolCandidate(decision);
    if (!selectedCandidate) continue;
    upsertIcon(agentId, {
      iconKey: getEncounterActivityIconKey(selectedCandidate.encounterType, decision.decisionType),
      tierOpacity: ACTIVITY_ICON_OPACITY_SHAPING,
    }, 0);
  }
  for (const action of gameState.unifiedActions) {
    if (action.resolved) continue;
    const template = getUnifiedTemplateById(action.templateId);
    if (!template) continue;
    const tier = action.effectiveTier ?? template.intrinsicTier;
    const tierOpacity =
      tier === 'story_beat'  ? ACTIVITY_ICON_OPACITY_STORY :
      tier === 'shaping'     ? ACTIVITY_ICON_OPACITY_SHAPING :
      ACTIVITY_ICON_OPACITY_BACKGROUND;
    upsertIcon(action.actorId, { iconKey: getEncounterActivityIconKey(template.encounterType, 'start_local'), tierOpacity }, 2);
  }
  for (const ep of gameState.encounterProgress) {
    if (ep.status !== 'active') continue;
    const legacyTemplate = getAnyEncounterById(ep.encounterId);
    const unifiedTemplate = legacyTemplate ? undefined : getUnifiedTemplateById(ep.encounterId);
    if (!legacyTemplate && !unifiedTemplate) continue;
    const encounterType = legacyTemplate
      ? legacyTemplate.encounterType
      : CRUD_TO_ENCOUNTER_TYPE[unifiedTemplate!.crudType] ?? 'assist';
    const epTier = ep.effectiveTier;
    const epTierOpacity =
      epTier === 'story_beat'  ? ACTIVITY_ICON_OPACITY_STORY :
      epTier === 'shaping'     ? ACTIVITY_ICON_OPACITY_SHAPING :
      ACTIVITY_ICON_OPACITY_BACKGROUND;
    upsertIcon(ep.actorId, { iconKey: getEncounterActivityIconKey(encounterType, 'start_local'), tierOpacity: epTierOpacity }, 2);
  }
  return [...resultByAgent.values()].map((entry) => ({
    agentId: entry.agentId,
    worldX: entry.worldX,
    worldY: entry.worldY,
    iconKey: entry.iconKey,
    tierOpacity: entry.tierOpacity,
  }));
}

export function legacyLocationNodes(i: LegacyInputs): unknown[] {
  const gameState = i.state;
  const homeSeatLocationId = gameState.graph.getNode(gameState.ascendantId)
    ?.properties.homeSeatLocationId as string | undefined;
  return gameState.graph.getNodesByType('location')
    .filter(n => n.properties.hexCol != null && n.properties.hexRow != null)
    .filter(n => !n.properties.sublocationTypeId)
    .map(n => ({
      locationType: (n.properties.locationSubtype ?? n.properties.locationType ?? 'unexplored_poi') as string,
      hexCol: n.properties.hexCol as number,
      hexRow: n.properties.hexRow as number,
      name: n.name,
      rarityTier: n.properties.rarityTier as number | undefined,
      isCapital: n.properties.locationType === 'capital' || n.properties.locationSubtype === 'capital',
      isAnomalyLocation: n.properties.isAnomalyLocation === true,
      discoveredByExploration: n.properties.discoveredByExploration === true,
      isHomeSeat: homeSeatLocationId != null && n.id === homeSeatLocationId,
    }));
}

export function legacyArmiesAndBattles(i: LegacyInputs): { armyRenderData: unknown[]; battleRenderData: unknown[] } {
  const gameState = i.state;
  const actors = gameState.graph.getNodesByType('actor');
  const factionNodes = actors.filter(node => node.properties.actorType === 'faction');
  const factionIdxMap = new Map<string, number>();
  for (let k = 0; k < factionNodes.length; k++) factionIdxMap.set(factionNodes[k].id, k);
  const armies: unknown[] = [];
  const battles: unknown[] = [];
  for (const node of actors) {
    const armyState = node.properties.armyState as ArmyState | undefined;
    const battleState = node.properties.battleState as BattleState | undefined;
    if (armyState != null) {
      let hexCol = node.properties.hexCol as number | undefined;
      let hexRow = node.properties.hexRow as number | undefined;
      if (hexCol == null || hexRow == null) {
        const locEdges = gameState.graph.getOutgoingEdges(node.id, 'located_at');
        if (locEdges.length > 0) {
          const loc = gameState.graph.getNode(locEdges[0].target);
          hexCol = loc?.properties.hexCol as number | undefined;
          hexRow = loc?.properties.hexRow as number | undefined;
        }
      }
      if (hexCol != null && hexRow != null) {
        const memberEdges = getFactionMembershipEdges(gameState.graph, node.id);
        const factionId = memberEdges.length > 0 ? memberEdges[0].target : undefined;
        const factionIdx = factionId ? (factionIdxMap.get(factionId) ?? 0) : 0;
        const factionColor = FACTION_HERALDIC_COLORS[Math.max(0, factionIdx) % FACTION_HERALDIC_COLORS.length];
        let factionDefId: string | null = null;
        if (factionId) {
          const defMatch = factionId.match(/^faction_def_(.+?)(?:_\d+)?$/);
          if (defMatch) factionDefId = defMatch[1];
        }
        armies.push({
          armyId: node.id, hexCol, hexRow, factionColor, factionDefId,
          armySize: armyState.headcount ?? ARMY_SIZE_SMALL_MAX,
          isInBattle: battleState != null,
        });
      }
    }
    if (battleState != null) {
      const entry = battleIndicatorForNode(gameState.graph, node);
      if (entry) battles.push(entry);
    }
  }
  return { armyRenderData: armies, battleRenderData: battles };
}
