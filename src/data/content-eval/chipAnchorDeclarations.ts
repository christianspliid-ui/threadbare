/**
 * Chip anchor declaration forms — THR-1164.
 *
 * Law 56 clause 2 requires a consequence chip's referent to be an existing graph
 * object, resolvable in the live world the player is in. Most of the corpus can
 * say that statically: an attachment's `entityId` is its **template** node id,
 * which is committed content and identical in every world.
 *
 * The rest cannot, and that is what this module exists for. A faction node is
 * minted per world and chapters of one order share a `factionDefId`, so there is
 * no static id an author could write for "The Dawn" — nineteen shipped chips name
 * it and none of them could point at it. The same holds for a cast actor spawned
 * by the encounter and for the acting agent themselves.
 *
 * So an anchor is a **declaration**, not always a literal id: a sentinel naming
 * *how* to find the object, resolved against the live graph at render. The two
 * halves are deliberately in one file because they are one rule read twice —
 * {@link classifyAnchorDeclaration} is what `check:chip-anchors` gates on before
 * the content ships, {@link resolveAnchorDeclaration} is what the encounter stage
 * runs when it draws. Split across two modules they would drift, and the drift
 * would present as a chip that passed the gate and rendered a dead link (Law 21),
 * which is the exact failure the clause exists to remove.
 *
 * NFP #4 (fail-soft): resolution returns `undefined` for anything it cannot
 * resolve. A chip whose sentinel finds nothing renders as text — the tier it had
 * before it declared anything — rather than a link to nowhere.
 */

import { ALL_FACTION_DEFINITIONS } from '../faction-definition-lookup';
import { getAttachmentTemplateNode } from '../../engine/attachmentTemplateIndex';
import type { WorldGraph } from '../../engine/graph';

/** The acting agent — the one the encounter resolved for. */
export const ANCHOR_SENTINEL_ACTOR = '$actor';
/** A cast member, by its `supportBundle` key: `$cast:keeper`. */
export const ANCHOR_SENTINEL_CAST_PREFIX = '$cast:';
/** A faction, by its **definition** id: `$faction:holy_order_dawn`. */
export const ANCHOR_SENTINEL_FACTION_PREFIX = '$faction:';

/** Whether a declared `entityId` is a sentinel rather than a literal id. */
export function isAnchorSentinel(entityId: string): boolean {
  return entityId.startsWith('$');
}

/** What a declared `entityId` turned out to be, once classified. */
export type AnchorDeclarationVerdict =
  | { readonly ok: true; readonly form: 'actor' | 'cast' | 'faction' | 'attachment_template' }
  | { readonly ok: false; readonly reason: string };

export interface ClassifyAnchorOptions {
  /**
   * The `supportBundle` actor keys this template declares. A `$cast:` sentinel
   * naming a key the template does not carry is the sentinel equivalent of a
   * typo'd node id, and it is checkable here rather than at render.
   */
  readonly supportKeys: ReadonlySet<string>;
}

/**
 * Whether a declared `entityId` names something the live world can produce.
 *
 * Static half of the rule. It answers "could this ever resolve?", never "did it
 * resolve in this world" — a `$faction:` whose definition ships is legal even in
 * a world that happened to spawn no chapter of it, because that is a worldgen
 * outcome and not an authoring error.
 */
export function classifyAnchorDeclaration(
  entityId: string,
  options: ClassifyAnchorOptions,
): AnchorDeclarationVerdict {
  if (entityId === ANCHOR_SENTINEL_ACTOR) return { ok: true, form: 'actor' };

  if (entityId.startsWith(ANCHOR_SENTINEL_CAST_PREFIX)) {
    const key = entityId.slice(ANCHOR_SENTINEL_CAST_PREFIX.length);
    if (!key) return { ok: false, reason: `'${entityId}' names no cast key` };
    if (!options.supportKeys.has(key)) {
      return {
        ok: false,
        reason: `'${entityId}' names cast key '${key}', which this template's supportBundle does not declare`,
      };
    }
    return { ok: true, form: 'cast' };
  }

  if (entityId.startsWith(ANCHOR_SENTINEL_FACTION_PREFIX)) {
    const defId = entityId.slice(ANCHOR_SENTINEL_FACTION_PREFIX.length);
    if (!defId) return { ok: false, reason: `'${entityId}' names no faction definition` };
    if (!ALL_FACTION_DEFINITIONS.has(defId)) {
      return { ok: false, reason: `'${entityId}' names no known faction definition` };
    }
    return { ok: true, form: 'faction' };
  }

  if (isAnchorSentinel(entityId)) {
    return {
      ok: false,
      reason:
        `'${entityId}' is not a sentinel this build resolves — the forms are `
        + `'${ANCHOR_SENTINEL_ACTOR}', '${ANCHOR_SENTINEL_CAST_PREFIX}<key>', `
        + `'${ANCHOR_SENTINEL_FACTION_PREFIX}<defId>'`,
    };
  }

  // A literal id. The only literal an author can write that means the same thing
  // in every world is committed content — an attachment's template node. A raw
  // node id is per-world by construction, so it is rejected here rather than
  // shipping as a link that works in the authoring session and nowhere else.
  if (getAttachmentTemplateNode(entityId)) return { ok: true, form: 'attachment_template' };

  return {
    ok: false,
    reason:
      `'${entityId}' resolves to no shipped attachment template and is not a sentinel — `
      + 'a literal node id is minted per world and cannot be authored',
  };
}

export interface ResolveAnchorContext {
  readonly graph: WorldGraph;
  /** The agent the encounter resolved for — what `$actor` means. */
  readonly actorId: string | undefined;
  /** Resolved support bindings, keyed as the template declared them. */
  readonly castNodeIdByKey: ReadonlyMap<string, string>;
}

/**
 * Turn a declared `entityId` into a node id in *this* world.
 *
 * Runtime half of the rule. A literal (an attachment template id) passes through
 * unchanged — the template node is real and shared — and only sentinels are
 * looked up.
 */
export function resolveAnchorDeclaration(
  entityId: string,
  context: ResolveAnchorContext,
): string | undefined {
  if (!isAnchorSentinel(entityId)) return entityId;

  if (entityId === ANCHOR_SENTINEL_ACTOR) return context.actorId;

  if (entityId.startsWith(ANCHOR_SENTINEL_CAST_PREFIX)) {
    return context.castNodeIdByKey.get(entityId.slice(ANCHOR_SENTINEL_CAST_PREFIX.length));
  }

  if (entityId.startsWith(ANCHOR_SENTINEL_FACTION_PREFIX)) {
    return findFactionNodeId(context.graph, entityId.slice(ANCHOR_SENTINEL_FACTION_PREFIX.length));
  }

  return undefined;
}

/**
 * The faction **node** in this world carrying a given definition id.
 *
 * Chapters share a definition id, so this deliberately returns the first match
 * rather than pretending to disambiguate: a chip naming "The Dawn" is about the
 * order, and the order's sheet is what the player wants. Sorted by node id so the
 * choice is the same on every run from the same seed (NFP #3) — `getNodesByType`
 * ordering is an insertion detail, not a promise.
 */
function findFactionNodeId(graph: WorldGraph, factionDefId: string): string | undefined {
  if (!factionDefId) return undefined;
  const matches: string[] = [];
  for (const node of graph.getNodesByType('actor')) {
    if (node.properties.actorType === 'faction' && node.properties.factionDefId === factionDefId) {
      matches.push(node.id);
    }
  }
  if (matches.length === 0) return undefined;
  return matches.sort()[0];
}
