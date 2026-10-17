/**
 * The Act row's cards (THR-1876 § D9 way 1; THR-1822 § D7 `ActOnVM`).
 *
 * One `getTargetActionSlots` call for the open subject, with exactly the parameters the
 * two `ActionDrawer` hands pass today (`useTargetActions`, `useAgentInteraction`), so a
 * card costs and locks the same on every surface (interface row
 * `dominion-band-prices-god-casts`). Casting from the row arrives with S3 (THR-1911);
 * S1 shows which cards work on the subject and why a locked one is locked.
 *
 * Range is unchanged (§ D9): person and place contexts carry no position, so only cards
 * cast on bare land are bound by `DEFAULT_LOCAL_RANGE`.
 */
import type { GameState } from '../../../types/gameState';
import type { TargetContext } from '../../../types/targetContext';
import type { SphereName } from '../../../types';
import { getTargetActionSlots } from '../../targetActions';
import {
  buildActorTargetContext,
  buildArtifactTargetContext,
  buildHexTargetContext,
  buildLocationTargetContext,
} from '../../targetContextBuilders';
import { getAscendantDomainAffinities } from '../../ascendant';
import { castCapabilityByReach } from '../../playerCastReadout';
import { teachSpellPreview } from '../../ascendantExpression';
import { getAvatarHexPosition } from '../../visibility';
import { AGENT_INTERVENTION_TEMPLATES, UNIFIED_ACTION_TEMPLATES } from '../../../data/unified-action-templates';
import { actionBlockedReason } from '../../../data/action-card-display';
import { INSPECTOR_WORDS } from '../../../data/view-content';
import type { ActOnVM } from './subjectTypes';
import { godSpheres } from './pageResolvers';
import { tileAt } from './pageResolvers';

/** What the row is for: a person, a place (either tier), an artifact or a bare hex. */
export type ActOnTarget =
  | { kind: 'agent'; id: string }
  | { kind: 'location'; id: string }
  | { kind: 'artifact'; id: string }
  | { kind: 'hex'; col: number; row: number };

function contextFor(state: GameState, target: ActOnTarget): TargetContext | null {
  const graph = state.graph;
  switch (target.kind) {
    case 'agent': {
      const tier = graph.getOutgoingEdges(state.ascendantId, 'thread').find(e => e.target === target.id)?.properties.tier as number | undefined;
      return buildActorTargetContext(target.id, graph, tier ?? 0);
    }
    case 'location':
      return buildLocationTargetContext(target.id, graph);
    case 'artifact':
      return buildArtifactTargetContext(target.id, graph);
    case 'hex': {
      const tile = tileAt(state, target.col, target.row);
      return buildHexTargetContext({ col: target.col, row: target.row, terrain: tile?.terrain ?? 'plains', graph });
    }
  }
}

/**
 * The subject's cards. `name` is the subject's display name for the heading
 * ("Act on Shutash"); a land page passes `land: true` for "Act on this land".
 */
export function buildActOn(state: GameState, target: ActOnTarget, name: string, land = false): ActOnVM {
  const heading = land ? INSPECTOR_WORDS.actOnLand : INSPECTOR_WORDS.actOn.replace('{name}', name);
  const empty = (): ActOnVM => ({ heading, cards: [], emptyLine: INSPECTOR_WORDS.actOnEmpty.replace('{name}', land ? 'this land' : name) });
  const spheres = godSpheres(state);
  const ctx = contextFor(state, target);
  if (!spheres || !ctx) return empty();

  const graph = state.graph;
  const threadTier = graph.getOutgoingEdges(state.ascendantId, 'thread').find(e => e.target === ctx.nodeId)?.properties.tier as number | undefined;
  const slots = getTargetActionSlots({
    target: ctx,
    templates: target.kind === 'agent' ? AGENT_INTERVENTION_TEMPLATES : UNIFIED_ACTION_TEMPLATES,
    pool: state.essencePool,
    primarySphere: spheres.primary,
    avatarPos: getAvatarHexPosition(graph, state.ascendantId) ?? undefined,
    accessibleSpheres: [spheres.primary, spheres.secondary],
    hexRevelation: state.hexRevelation,
    existingThreadTier: target.kind === 'agent' ? undefined : (threadTier ?? null),
    unlockedActionIds: state.unlockedActionIds,
    ascendantDomainAffinities: getAscendantDomainAffinities(graph, state.ascendantId),
    ascendantCastCapabilities: castCapabilityByReach(graph, state.ascendantId),
    heldControlEffects: state.controlEffects,
    controlOwnerId: state.ascendantId,
    pendingActions: state.unifiedActions,
    spellTeachingPreview: teachSpellPreview(graph, state.ascendantId, ctx.nodeId, Number(state.seed ?? 0)),
  });

  const cards = slots
    .filter(s => s.type === 'target_action' || s.type === 'intervention')
    .map(s => ({
      actionId: s.id,
      name: s.label,
      sphere: (s.sphere ?? null) as SphereName | null,
      available: s.available,
      reason: s.available ? null : (actionBlockedReason(s.lockedReason, s.rangeStatus) ?? null),
    }));
  if (cards.length === 0) return empty();
  return { heading, cards, emptyLine: null };
}
