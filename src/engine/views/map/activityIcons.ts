/**
 * map.activity — what each mortal on the map is doing, at their position
 * (THR-1822, moved from GameView's `activityIconData` memo).
 *
 * Three sources, later ones winning per mortal: the latest encounter decision the
 * telemetry recorded for a threaded mortal (priority 0), then any unresolved
 * unified action and any active legacy encounter (priority 2). The row carries the
 * encounter type and decision type; the host maps them to the scene's icon key.
 */
import type { BalanceEncounterPoolCandidate, BalanceEvent } from '../../../types/balanceEval';
import { hexToWorld } from '../../../lib/worldPosition';
import { getAnyEncounterById } from '../../../data/encounter-content';
import { getUnifiedTemplateById } from '../../../data/unified-action-templates';
import {
  ACTIVITY_ICON_OPACITY_BACKGROUND,
  ACTIVITY_ICON_OPACITY_SHAPING,
  ACTIVITY_ICON_OPACITY_STORY,
} from '../../../data/attention-constants';
import { CRUD_TO_ENCOUNTER_TYPE } from '../../encounterCache';
import { getLatestEncounterDecisionsByAgent } from '../../balanceTelemetry';
import type { ViewSelector } from '../readView';
import type { MapActivityVM } from './mapTypes';
import { nodeMapHex } from './mapPosition';

/**
 * The selected candidate of a decision's ranked encounter pool, else its first.
 * Moved from `src/components/Game/encounterActivityPresentation.ts` (THR-1822),
 * which re-exports it.
 */
export function getSelectedEncounterPoolCandidate(
  decision?: Pick<BalanceEvent, 'rankedEncounterPool'> | null,
): BalanceEncounterPoolCandidate | null {
  const candidates = decision?.rankedEncounterPool ?? [];
  if (candidates.length === 0) return null;
  return candidates.find(candidate => candidate.selected) ?? candidates[0] ?? null;
}

export interface MapActivityArgs {
  hexSize: number;
  /** The threaded mortals whose telemetry decisions are read. */
  threadedAgentIds: readonly string[];
  /**
   * `runtime.balanceTelemetryVersion` — the telemetry moves on its own counter, so
   * it is part of the key.
   */
  telemetryVersion: number;
}

/** Decision-sourced icons lose to a running action or encounter on the same mortal. */
const ACTIVITY_PRIORITY_DECISION = 0;
const ACTIVITY_PRIORITY_RUNNING = 2;

function tierOpacityOf(tier: string | undefined): number {
  return tier === 'story_beat' ? ACTIVITY_ICON_OPACITY_STORY
    : tier === 'shaping' ? ACTIVITY_ICON_OPACITY_SHAPING
      : ACTIVITY_ICON_OPACITY_BACKGROUND;
}

export const mapActivitySelector: ViewSelector<MapActivityArgs, MapActivityVM[]> = {
  id: 'map.activity',
  invalidation: 'world',
  key: (args) => `${args.hexSize}|${args.telemetryVersion}|${args.threadedAgentIds.join(',')}`,
  fallback: () => [],
  build(ctx, { hexSize, threadedAgentIds }) {
    const graph = ctx.graph;
    const state = ctx.state;
    const resultByAgent = new Map<string, MapActivityVM & { priority: number }>();

    const upsert = (
      agentId: string,
      fields: Pick<MapActivityVM, 'encounterType' | 'decisionType' | 'tierOpacity'>,
      priority: number,
    ) => {
      const agentNode = graph.getNode(agentId);
      if (!agentNode) return;
      const pos = nodeMapHex(graph, agentNode);
      if (!pos) return;
      const stored = resultByAgent.get(agentId)?.priority ?? -1;
      if (stored > priority) return;
      const world = hexToWorld(pos, hexSize);
      resultByAgent.set(agentId, { agentId, worldX: world.x, worldY: world.y, ...fields, priority });
    };

    const decisions = ctx.runtime && threadedAgentIds.length > 0
      ? getLatestEncounterDecisionsByAgent(ctx.runtime, threadedAgentIds)
      : new Map<string, BalanceEvent>();
    for (const [agentId, decision] of decisions.entries()) {
      if (decision.decisionType === 'idle') continue;
      const selected = getSelectedEncounterPoolCandidate(decision);
      if (!selected) continue;
      upsert(agentId, {
        encounterType: selected.encounterType,
        decisionType: decision.decisionType,
        tierOpacity: ACTIVITY_ICON_OPACITY_SHAPING,
      }, ACTIVITY_PRIORITY_DECISION);
    }

    for (const action of state.unifiedActions) {
      if (action.resolved) continue;
      const template = getUnifiedTemplateById(action.templateId);
      if (!template) continue;
      upsert(action.actorId, {
        encounterType: template.encounterType,
        decisionType: 'start_local',
        tierOpacity: tierOpacityOf(action.effectiveTier ?? template.intrinsicTier),
      }, ACTIVITY_PRIORITY_RUNNING);
    }

    // Legacy encounterProgress, so mortals in old-system encounters show icons too.
    for (const ep of state.encounterProgress) {
      if (ep.status !== 'active') continue;
      const legacyTemplate = getAnyEncounterById(ep.encounterId);
      const unifiedTemplate = legacyTemplate ? undefined : getUnifiedTemplateById(ep.encounterId);
      if (!legacyTemplate && !unifiedTemplate) continue;
      const encounterType = legacyTemplate
        ? legacyTemplate.encounterType
        : CRUD_TO_ENCOUNTER_TYPE[unifiedTemplate!.crudType] ?? 'assist';
      upsert(ep.actorId, {
        encounterType,
        decisionType: 'start_local',
        tierOpacity: tierOpacityOf(ep.effectiveTier),
      }, ACTIVITY_PRIORITY_RUNNING);
    }

    return [...resultByAgent.values()].map(({ priority: _priority, ...row }) => row);
  },
};
