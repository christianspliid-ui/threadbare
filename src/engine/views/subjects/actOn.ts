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
import type { TargetCategory, TargetContext } from '../../../types/targetContext';
import type { WorldRef } from '../../../types/worldRef';
import { parseHexRefId } from '../../../types/worldRef';
import type { WheelSlot } from '../../wheel';
import type { UnifiedActionTemplate } from '../../../types/unifiedAction';
import { isPlaceNode } from '../../sublocationShape';
import type { SphereName } from '../../../types';
import { getTargetActionSlots } from '../../targetActions';
import {
  buildActorTargetContext,
  buildArtifactTargetContext,
  buildHexTargetContext,
  buildLocationTargetContext,
  buildLegendaryArtifactTargetContext,
  buildSublocationTargetContext,
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
  | { kind: 'sublocation'; id: string }
  | { kind: 'artifact'; id: string }
  | { kind: 'hex'; col: number; row: number };

/** One builder per target category: given the subject's id (`'c,r'` for a hex), its context. */
export type TargetContextBuilder = (state: GameState, id: string) => TargetContext | null;

function threadTierOf(state: GameState, nodeId: string): number | undefined {
  return state.graph.getOutgoingEdges(state.ascendantId, 'thread').find(e => e.target === nodeId)?.properties.tier as number | undefined;
}

/**
 * THR-1911 (plan § D9, Law 58) — the one list of how a card's target is described to the
 * gates. `Record<TargetCategory, …>`: a new target category is a type error until it has a
 * builder. The sublocation and artifact builders get their first callers here.
 */
export const TARGET_CONTEXT_BUILDERS: Record<TargetCategory, TargetContextBuilder> = {
  actor: (state, id) => buildActorTargetContext(id, state.graph, threadTierOf(state, id) ?? 0),
  location: (state, id) => buildLocationTargetContext(id, state.graph),
  sublocation: (state, id) => buildSublocationTargetContext(id, state.graph),
  hex: (state, id) => {
    const at = parseHexRefId(id);
    if (!at) return null;
    const tile = tileAt(state, at.col, at.row);
    return buildHexTargetContext({ col: at.col, row: at.row, terrain: tile?.terrain ?? 'plains', graph: state.graph });
  },
  artifact: (state, id) => buildArtifactTargetContext(id, state.graph),
  artifact_legendary: (state, id) => buildLegendaryArtifactTargetContext(id, state.graph),
};

/** The category and id a target is built from. */
export function categoryFor(state: GameState, target: ActOnTarget): { category: TargetCategory; id: string } {
  switch (target.kind) {
    case 'agent': return { category: 'actor', id: target.id };
    case 'location': return { category: 'location', id: target.id };
    case 'sublocation': return { category: 'sublocation', id: target.id };
    case 'artifact':
      return { category: state.graph.getNode(target.id)?.type === 'artifact_legendary' ? 'artifact_legendary' : 'artifact', id: target.id };
    case 'hex': return { category: 'hex', id: `${target.col},${target.row}` };
  }
}

/**
 * The Act row's target for a world ref, or null when nothing can be cast on that kind
 * (records, attachments, Areas). Factions and companions are actor nodes.
 */
export function actOnTargetForRef(state: GameState, ref: WorldRef): ActOnTarget | null {
  switch (ref.kind) {
    case 'agent':
    case 'faction':
    case 'companion':
      return { kind: 'agent', id: ref.id };
    case 'location':
    case 'sublocation': {
      const node = state.graph.getNode(ref.id);
      return node && isPlaceNode(node) ? { kind: 'sublocation', id: ref.id } : { kind: 'location', id: ref.id };
    }
    case 'artifact':
      return { kind: 'artifact', id: ref.id };
    case 'hex': {
      const at = parseHexRefId(ref.id);
      return at ? { kind: 'hex', col: at.col, row: at.row } : null;
    }
    default:
      return null;
  }
}

/** The target's context, through `TARGET_CONTEXT_BUILDERS`. */
export function targetContextFor(state: GameState, target: ActOnTarget): TargetContext | null {
  const { category, id } = categoryFor(state, target);
  return TARGET_CONTEXT_BUILDERS[category](state, id);
}

/**
 * The target's slots, with exactly the parameters the two `ActionDrawer` hands passed
 * (`useTargetActions`, `useAgentInteraction`). `templates` narrows the set — the cast path
 * re-reads one card's slot through it (plan § D9 "one cast path").
 */
export function actOnSlots(
  state: GameState,
  target: ActOnTarget,
  templates?: readonly UnifiedActionTemplate[],
): { ctx: TargetContext; slots: WheelSlot[] } | null {
  const spheres = godSpheres(state);
  const ctx = targetContextFor(state, target);
  if (!spheres || !ctx) return null;

  const graph = state.graph;
  const threadTier = threadTierOf(state, ctx.nodeId);
  const slots = getTargetActionSlots({
    target: ctx,
    templates: templates ?? (target.kind === 'agent' ? AGENT_INTERVENTION_TEMPLATES : UNIFIED_ACTION_TEMPLATES),
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
  return { ctx, slots };
}

/**
 * The subject's cards. `name` is the subject's display name for the heading
 * ("Act on Shutash"); a land page passes `land: true` for "Act on this land".
 */
export function buildActOn(state: GameState, target: ActOnTarget, name: string, land = false): ActOnVM {
  const heading = land ? INSPECTOR_WORDS.actOnLand : INSPECTOR_WORDS.actOn.replace('{name}', name);
  const empty = (): ActOnVM => ({ heading, cards: [], emptyLine: INSPECTOR_WORDS.actOnEmpty.replace('{name}', land ? 'this land' : name) });
  const read = actOnSlots(state, target);
  if (!read) return empty();
  const { slots } = read;

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

/**
 * THR-1911 — the ref kind a Location id opens as in the Inspector: a Place (a Location
 * carrying `parentLocationId`, THR-1183) is a `sublocation`, a settlement a `location`.
 */
export function placeRefKind(state: Pick<GameState, 'graph'>, locationId: string): 'location' | 'sublocation' {
  return state.graph.getNode(locationId)?.properties.parentLocationId ? 'sublocation' : 'location';
}

/** THR-1911 — the hex a cast on this target lands on (the particle burst), or null. */
export function castHexOf(state: Pick<GameState, 'graph'>, target: ActOnTarget, nodeId: string): { col: number; row: number } | null {
  if (target.kind === 'hex') return { col: target.col, row: target.row };
  const graph = state.graph;
  const node = graph.getNode(nodeId);
  if (!node) return null;
  let col = node.properties.hexCol as number | undefined;
  let row = node.properties.hexRow as number | undefined;
  if (col == null || row == null) {
    const at = graph.getOutgoingEdges(nodeId, 'located_at')[0]?.target;
    const loc = at ? graph.getNode(at) : undefined;
    col = loc?.properties.hexCol as number | undefined;
    row = loc?.properties.hexRow as number | undefined;
  }
  return col != null && row != null ? { col, row } : null;
}

/**
 * THR-1911 — what the agenda picker needs to open on a person (the drawer's intervention
 * branch read it inline): their value profile and narrative archetype. Null when the
 * person has no profile, so no picker opens.
 */
export function interventionSubjectOf(state: Pick<GameState, 'graph'>, agentId: string): { profile: unknown; archetypeId: string } | null {
  const node = state.graph.getNode(agentId);
  const profile = node?.properties?.axiologicalProfile;
  if (!profile) return null;
  return { profile, archetypeId: (node?.properties?.narrativeArchetype as string) ?? 'unknown' };
}
