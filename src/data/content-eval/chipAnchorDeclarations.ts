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
/**
 * The agent the encounter was *aimed at* — `action.targetId` (THR-1130).
 *
 * The effect side has had this sentinel since THR-695
 * (`AFTERMATH_TARGET_SENTINEL`); the chip side did not, and the asymmetry was
 * load-bearing in the wrong direction. Several aftermath effects write their
 * durable fact onto the target rather than the actor — `favor_creation` is the
 * plain case, minting `owes_favor` with **debtor = target, creditor = actor** —
 * so a chip reporting that write is a sentence *about the target*, and the only
 * anchor an author could reach for was `$actor`, the other end of the edge.
 *
 * That is how The Grateful Kin shipped a chip whose noun ("the roof they are
 * owed") pointed at the creditor while the state it reported lived on the
 * debtor. Christian, playing it 2026-08-17: *"the bond… the roof they are owed:
 * again this simply doesn't communicate what game state has changed."*
 * Anchoring the creditor is not a smaller version of naming the debtor — it
 * points the player at the wrong person.
 */
export const ANCHOR_SENTINEL_TARGET = '$target';
/** A cast member, by its `supportBundle` key: `$cast:keeper`. */
export const ANCHOR_SENTINEL_CAST_PREFIX = '$cast:';
/** A faction, by its **definition** id: `$faction:holy_order_dawn`. */
export const ANCHOR_SENTINEL_FACTION_PREFIX = '$faction:';
/**
 * The artifact this encounter minted — THR-1275.
 *
 * A `possession` chip is a sentence about a *thing*, and until this sentinel
 * existed it could only anchor a *person*. `spawn_artifact` keys its node
 * `artifact_spawned_<encounterId>_<reactionId>_<i>_<tick>`, so the id carries the
 * tick and the effect index and no author can write it; the only literal the gate
 * accepts is an attachment template, which an artifact is not. So the whole
 * `possession` family was structurally forced to anchor the holder — the brief
 * discipline's "don't make every chip about a person" enforced in exactly the
 * wrong direction, and the package critic's P1 finding on The Beast in the
 * Granary.
 *
 * Ratified architecture points here rather than at blessing holder-anchoring:
 * THR-1156 holds that a chip anchors a **real graph object**, and the possession
 * is the object the sentence is about.
 *
 * The mint already stamps `sourceEncounterId` on the node, which is what makes
 * this resolvable at all — the sentinel is a lookup of that stamp, not new
 * bookkeeping. See {@link findSpawnedArtifactNodeId} for the pick order.
 */
export const ANCHOR_SENTINEL_ARTIFACT = '$artifact';

/** Whether a declared `entityId` is a sentinel rather than a literal id. */
export function isAnchorSentinel(entityId: string): boolean {
  return entityId.startsWith('$');
}

/** What a declared `entityId` turned out to be, once classified. */
export type AnchorDeclarationVerdict =
  | {
      readonly ok: true;
      readonly form: 'actor' | 'target' | 'cast' | 'faction' | 'artifact' | 'attachment_template';
    }
  | { readonly ok: false; readonly reason: string };

export interface ClassifyAnchorOptions {
  /**
   * The `supportBundle` actor keys this template declares. A `$cast:` sentinel
   * naming a key the template does not carry is the sentinel equivalent of a
   * typo'd node id, and it is checkable here rather than at render.
   */
  readonly supportKeys: ReadonlySet<string>;
  /**
   * Whether this template authors a `spawn_artifact` effect anywhere — THR-1275.
   *
   * `$artifact` is the one sentinel whose referent the *template* has to create;
   * `$actor` and `$target` name people the encounter already has, and `$faction:`
   * names committed content. So an author writing `$artifact` on a template that
   * mints nothing has written the sentinel equivalent of a typo'd cast key, and
   * this is where that is catchable — at render it would fail soft to plain text
   * and look like a styling choice.
   *
   * **Optional, and absent means "the caller cannot say" rather than "no".** A
   * caller holding only the declaration (the unit tests, an ad-hoc probe) is
   * asking "could this form ever resolve", which is the same question
   * `classifyAnchorDeclaration` answers for `$faction:` in a world that spawned no
   * chapter. The shipping gate is never vacuous on that account, because
   * `chipAnchorViolations` always computes and passes it.
   */
  readonly mintsArtifact?: boolean;
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
  if (entityId === ANCHOR_SENTINEL_TARGET) return { ok: true, form: 'target' };

  if (entityId === ANCHOR_SENTINEL_ARTIFACT) {
    if (options.mintsArtifact === false) {
      return {
        ok: false,
        reason:
          `'${entityId}' names the artifact this encounter mints, but the template `
          + 'authors no `spawn_artifact` effect anywhere — so there is nothing for it '
          + 'to point at',
      };
    }
    return { ok: true, form: 'artifact' };
  }

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
        + `'${ANCHOR_SENTINEL_ACTOR}', '${ANCHOR_SENTINEL_TARGET}', `
        + `'${ANCHOR_SENTINEL_ARTIFACT}', `
        + `'${ANCHOR_SENTINEL_CAST_PREFIX}<key>', `
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
  /**
   * The agent the encounter was aimed at — what `$target` means. Optional
   * because plenty of encounters target a place or nothing at all; an
   * unresolvable target falls through to `undefined` and the chip renders as
   * text, the same fail-open path every other sentinel takes (NFP #4).
   */
  readonly targetId?: string | undefined;
  /** Resolved support bindings, keyed as the template declared them. */
  readonly castNodeIdByKey: ReadonlyMap<string, string>;
  /**
   * The template id of the encounter being resolved — what `$artifact` searches by
   * (THR-1275).
   *
   * `spawn_artifact` stamps `sourceEncounterId` on the node it mints, and
   * `encounterAftermath` sets that value from `action.templateId`. So this is the
   * same string on both sides of the mint, which is what lets the sentinel find the
   * artifact without the veil having to be handed mint-time state it never sees.
   * Optional: a caller with no template id resolves `$artifact` to `undefined` and
   * the chip renders as text (NFP #4).
   */
  readonly encounterTemplateId?: string | undefined;
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
  if (entityId === ANCHOR_SENTINEL_TARGET) return context.targetId;

  if (entityId === ANCHOR_SENTINEL_ARTIFACT) {
    return findSpawnedArtifactNodeId(context);
  }

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
/**
 * The artifact node this encounter minted, in *this* world — THR-1275.
 *
 * Search key is the `sourceEncounterId` stamp `spawn_artifact` writes, which equals
 * the resolving action's `templateId`. Pick order, and why each step is where it is:
 *
 * 1. **An artifact the actor now holds.** A `possession` chip is about a possession,
 *    so an artifact hanging off the actor's `possesses` / `bonded_to` edge is the one
 *    the sentence means. This also disambiguates the case the tick stamp cannot: two
 *    agents resolving the same template on the same tick mint two nodes carrying the
 *    same `sourceEncounterId`, and only the edge says which is whose.
 * 2. **The most recent mint.** The veil renders straight after the write, so the
 *    newest node is this playthrough's rather than a previous run of the same
 *    encounter elsewhere in the world.
 * 3. **Lowest node id**, so a genuine tie resolves identically on every run from the
 *    same seed (NFP #3).
 *
 * Returns `undefined` when nothing matches — no template id, no mint yet, an
 * encounter that spawned nothing — and the chip renders as plain text rather than a
 * link to nowhere (NFP #4, Law 21). Both artifact node types are searched: `tier`
 * decides between `artifact` and `artifact_legendary` at mint, and an author writing
 * `$artifact` is naming the thing, not its tier.
 */
function findSpawnedArtifactNodeId(context: ResolveAnchorContext): string | undefined {
  const { graph, actorId, encounterTemplateId } = context;
  if (!encounterTemplateId) return undefined;

  const matches = [
    ...graph.getNodesByType('artifact'),
    ...graph.getNodesByType('artifact_legendary'),
  ].filter(node => node.properties?.sourceEncounterId === encounterTemplateId);

  if (matches.length === 0) return undefined;

  const held = new Set<string>(
    actorId
      ? [
          ...graph.getOutgoingEdges(actorId, 'possesses'),
          ...graph.getOutgoingEdges(actorId, 'bonded_to'),
        ].map(edge => edge.target)
      : [],
  );

  const preferred = matches.filter(node => held.has(node.id));
  const pool = preferred.length > 0 ? preferred : matches;

  // Sort by id first so the reduce below breaks a same-tick tie by id rather than by
  // graph insertion order, which is not a promise.
  return [...pool]
    .sort((a, b) => a.id.localeCompare(b.id))
    .reduce((best, node) => {
      const bestTick = typeof best.properties?.spawnedAtTick === 'number'
        ? best.properties.spawnedAtTick
        : -Infinity;
      const nodeTick = typeof node.properties?.spawnedAtTick === 'number'
        ? node.properties.spawnedAtTick
        : -Infinity;
      return nodeTick > bestTick ? node : best;
    }).id;
}

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
