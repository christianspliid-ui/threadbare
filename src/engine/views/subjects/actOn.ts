/**
 * The Act row's cards (THR-1876 § D9 way 1; THR-1822 § D7 `ActOnVM`).
 *
 * One `getTargetActionSlots` call for the open subject, with exactly the parameters the
 * two `ActionDrawer` hands pass today (`useTargetActions`, `useAgentInteraction`), so a
 * card costs and locks the same on every surface (interface row
 * `dominion-band-prices-god-casts`). S3 (THR-1911) casts from the row through
 * `useCastOnTarget`, which re-reads one card's slot here (`actOnSlots`).
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
import { outcomeBandWord } from '../../../data/outcome-band-content';
import { FORECAST_TIER_WORDS } from '../../../data/nudge-stage-content';
import type { ActOnCardVM, ActOnVM } from './subjectTypes';
import { godSpheres } from './pageResolvers';
import { tileAt } from './pageResolvers';

/** What the row is for: a person, a place (either tier), an artifact or a bare hex. */
export type ActOnTarget =
  | { kind: 'agent'; id: string }
  /** A faction is an actor node, dealt the non-agent hand (the drawer FactionSheet opened). */
  | { kind: 'faction'; id: string }
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
    case 'agent':
    case 'faction':
      return { category: 'actor', id: target.id };
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
    case 'companion':
      return { kind: 'agent', id: ref.id };
    case 'faction':
      return { kind: 'faction', id: ref.id };
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
  // THR-2054: the bind dedup gate reads "a thread exists", so a thread edge with no
  // `tier` still counts (0). Agents get the gate too — a bound First was offered a bind.
  const threaded = state.graph.getOutgoingEdges(state.ascendantId, 'thread').some(e => e.target === ctx.nodeId);
  const threadTier = threaded ? (threadTierOf(state, ctx.nodeId) ?? 0) : null;
  const slots = getTargetActionSlots({
    target: ctx,
    templates: templates ?? (target.kind === 'agent' ? AGENT_INTERVENTION_TEMPLATES : UNIFIED_ACTION_TEMPLATES),
    pool: state.essencePool,
    primarySphere: spheres.primary,
    avatarPos: getAvatarHexPosition(graph, state.ascendantId) ?? undefined,
    accessibleSpheres: [spheres.primary, spheres.secondary],
    hexRevelation: state.hexRevelation,
    existingThreadTier: threadTier,
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
  const cards = cardsOf(read.slots);
  if (cards.length === 0) return empty();
  return { heading, cards: withFates(state, target, read.slots, cards), emptyLine: null };
}

/**
 * THR-1992 (Law 37) — the fate word on each card cast on this subject: the latest receipt
 * whose template and target match (the retired drawer's `resolvedBands`, narrowed to the
 * subject the row is for). Acknowledged receipts count: dismissing the toast does not
 * un-happen the ending. A bare hex has no node id a receipt names, so it wears none.
 */
function withFates(state: GameState, target: ActOnTarget, slots: readonly WheelSlot[], cards: ActOnCardVM[]): ActOnCardVM[] {
  if (target.kind === 'hex') return cards;
  const latest = new Map<string, { band: string; tick: number }>();
  for (const r of state.playerActionReceipts ?? []) {
    if (r.targetId !== target.id) continue;
    const prev = latest.get(r.templateId);
    if (!prev || r.resolvedTick >= prev.tick) latest.set(r.templateId, { band: r.outcomeBand, tick: r.resolvedTick });
  }
  if (latest.size === 0) return cards;
  const templateOf = new Map(slots.map(s => [s.id, s.templateId ?? s.id]));
  return cards.map(c => {
    const templateId = templateOf.get(c.actionId);
    const hit = templateId ? latest.get(templateId) : undefined;
    return hit ? { ...c, fate: { band: hit.band, word: outcomeBandWord(hit.band) } } : c;
  });
}

/** The Act row's cards from a target's slots: the castable kinds, in slot order. */
function cardsOf(slots: readonly WheelSlot[]): ActOnCardVM[] {
  return slots
    .filter(s => s.type === 'target_action' || s.type === 'intervention')
    .map(s => ({
      actionId: s.id,
      name: s.label,
      sphere: (s.sphere ?? null) as SphereName | null,
      available: s.available,
      reason: s.available ? null : (actionBlockedReason(s.lockedReason, s.rangeStatus) ?? null),
      ...(s.forecastTier ? { odds: FORECAST_TIER_WORDS[s.forecastTier] } : {}),
    }));
}

/** The key a row's count is filed under: `kind:id`, as `data-link-row` spells it. */
export function rowCardsKey(ref: Pick<WorldRef, 'kind' | 'id'>): string {
  return `${ref.kind}:${ref.id}`;
}

/**
 * THR-1913 (plan § D9 way 2) — the cards a world-ref row's tray holds: the cards the god
 * can cast on that row's thing now. Locked cards stay on the thing's own Act row, where
 * they shake with their reason; a row counts only what it can do (Law 25 — "0 cards"
 * and a tray of locks are noise). Empty for a ref nothing can be cast on.
 */
export function actOnRowCards(state: GameState, ref: WorldRef): ActOnCardVM[] {
  const target = actOnTargetForRef(state, ref);
  if (!target) return [];
  const read = actOnSlots(state, target);
  return read ? cardsOf(read.slots).filter(c => c.available) : [];
}

/**
 * THR-1913 — the name a row's cast lands on, for the tray's "Cast on <name>" (Law 48).
 * A row's own label can name something else (a Resources row says "Iron" and links its
 * Location; a Covenants row says the covenant and links the hex), so the tray names the
 * target the cast resolves to. Null when nothing can be cast on the ref.
 */
export function actOnRowTargetName(state: GameState, ref: WorldRef): string | null {
  const target = actOnTargetForRef(state, ref);
  if (!target) return null;
  return targetContextFor(state, target)?.displayName ?? null;
}

/**
 * THR-1913 — card counts for rows, keyed by `rowCardsKey`. One `getTargetActionSlots`
 * per ref, so the caller passes the rows it renders and no more (the Inspector computes
 * one row at a time as each row mounts; a folded row is never counted). A ref with no
 * castable card counts 0, which renders nothing.
 */
export function actOnCounts(state: GameState, refs: readonly WorldRef[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const ref of refs) {
    const key = rowCardsKey(ref);
    if (key in counts) continue;
    counts[key] = actOnRowCards(state, ref).length;
  }
  return counts;
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
