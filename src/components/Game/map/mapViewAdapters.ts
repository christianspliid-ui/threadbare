/**
 * Map view-model rows → HexMapV2 render data (THR-1822 § D2).
 *
 * The seam's map rows carry semantic keys; the scene's render constants (the
 * heraldic palette, an army's default size, the activity icon registry, the
 * avatar's own paint) stay with the scene, and these one-line adapters apply them
 * after the read. Pure — no graph, no React.
 */
import type { MapActivityVM, MapAgentVM, MapArmyVM, MapRealmInkVM } from '../../../engine/views/map/mapTypes';
import type { BalanceEvent } from '../../../types/balanceEval';
import type { AgentRenderData } from '../../HexMapV2/agents/agentSpriteTypes';
import { FACTION_HERALDIC_COLORS } from '../../HexMapV2/agents/agentSpriteTypes';
import type { ArmyRenderData } from '../../HexMapV2/scene/ArmySpriteMesh';
import { ARMY_SIZE_SMALL_MAX } from '../../HexMapV2/scene/ArmySpriteMesh';
import type { ActivityIconData } from '../../HexMapV2/scene/ActivityIconMesh';
import { getEncounterActivityIconKey } from '../encounterActivityPresentation';

/** The avatar's own paint, applied to its row only. */
export interface AvatarPaint {
  portraitUrl: string | undefined;
  sphereColor: string | undefined;
  sigil: string | undefined;
}

export function toAgentRenderData(rows: readonly MapAgentVM[], avatar: AvatarPaint): AgentRenderData[] {
  return rows.map(r => ({
    ...r,
    portraitUrl: r.isAvatar ? avatar.portraitUrl : r.portraitUrl,
    avatarSphereColor: r.isAvatar ? avatar.sphereColor : undefined,
    // THR-1609: the god's sigil marks the avatar as the player's own shape.
    avatarSigil: r.isAvatar ? avatar.sigil : undefined,
  }));
}

export function toArmyRenderData(rows: readonly MapArmyVM[]): ArmyRenderData[] {
  return rows.map(r => ({
    armyId: r.armyId,
    hexCol: r.hexCol,
    hexRow: r.hexRow,
    factionColor: FACTION_HERALDIC_COLORS[Math.max(0, r.factionIndex) % FACTION_HERALDIC_COLORS.length],
    factionDefId: r.factionDefId,
    armySize: r.headcount ?? ARMY_SIZE_SMALL_MAX,
    isInBattle: r.isInBattle,
  }));
}

/** THR-1902: `map.realmInk` rows → Realm id → holder's heraldic index, for the border scene. */
export function toRealmHolderIndex(vm: MapRealmInkVM): Map<string, number> {
  return new Map(vm.realms.map(r => [r.realmId, r.factionIndex]));
}

export function toActivityIconData(rows: readonly MapActivityVM[]): ActivityIconData[] {
  return rows.map(r => ({
    agentId: r.agentId,
    worldX: r.worldX,
    worldY: r.worldY,
    iconKey: getEncounterActivityIconKey(r.encounterType, r.decisionType as BalanceEvent['decisionType'] | undefined),
    tierOpacity: r.tierOpacity,
  }));
}
