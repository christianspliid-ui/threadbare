/**
 * THR-1120 — resolve an attachment **template** node into the detail payload
 * `AttachmentDetailView` already draws.
 *
 * ## Why a template and not a granted instance
 *
 * An ending's consequence chip names what the ending grants — a condition, a
 * blessing, a curse, a bestowed power, an artifact — and the player must be able
 * to reach it (Law 21; Christian's THR-974 verdict: *"I am seeing no links to any
 * reward or penalty attachments anywhere."*). But the grant itself is written by
 * the reaction's `condition_attachment` / `attachment_grant` / `spawn_artifact`
 * effects, and those apply only when the player **picks** a reaction — at which
 * point the veil closes (`closeAfterSelection` defaults true). So at the moment
 * the chip is on screen the granted node does not exist, and no amount of payload
 * plumbing can make it exist.
 *
 * What *does* exist is the template: `instantiateReward` resolves it with
 * `graph.getNode(templateNodeId)`, so it is a graph-real node with a name, a
 * flavour line, tags and art. Linking it answers the player's actual question —
 * "what is this thing the ending is giving me?" — honestly, and is reachable a
 * second time from the bearer's own Attachments tab once the grant lands.
 *
 * ## What is deliberately absent
 *
 * Every per-bearer field. `ticksRemaining`, `totalTicks`, `active` and
 * `inactiveReason` live on the `has_trait` / `possesses` **edge** (THR-784 —
 * duration is per-agent state, never on the shared template), and there is no
 * edge here. Reading the node's own values instead would print a number that is
 * identical for every carrier and true for none. A template detail therefore
 * shows what the thing *is*, and the countdown appears once it is really held.
 *
 * Fail-open throughout (NFP #4): an id that resolves to no node, or to a node
 * that is not an attachment, returns `undefined` — the caller then draws plain
 * text rather than a link into an empty sheet.
 */

import type { WorldGraph } from './graph';
import type { GraphNode } from '../types/graph';
import type { AttachmentTier } from '../types/attachments';
import type { ActionTriggerEffect, AttachmentEffect } from '../types/effects';
import type { AttachmentDetailData } from '../components/Game/AttachmentDetailView';

/** Node types that carry a possession template. Mirrors `getAgentAttachments`. */
const POSSESSION_NODE_TYPES: ReadonlySet<string> = new Set(['artifact', 'artifact_legendary']);

/**
 * Trait subcategories that are attachments rather than plain traits.
 *
 * The same four `getAgentAttachments` sorts into `conditions` and `powers`. A
 * trait outside this set (a personality trait, an archetype marker) is a concept
 * with no sheet, and must resolve to `undefined` rather than to a blank one.
 */
const ATTACHMENT_TRAIT_SUBCATEGORIES: ReadonlySet<string> = new Set([
  'condition',
  'blessing',
  'curse',
  'bestowed',
]);

/** Tag → subcategory, in priority order. The mapping `getAgentAttachments` uses. */
const CONDITION_TAG_SUBCATEGORIES: readonly (readonly [string, string])[] = [
  ['#blessing', 'blessing'],
  ['#curse', 'curse'],
  ['#disease', 'disease'],
];

/** Default when no tag claims the condition — the same fallback the tab uses. */
const CONDITION_DEFAULT_SUBCATEGORY = 'wound';

/**
 * Pull on-use behaviour out of a template's `effects[]` (THR-719).
 *
 * Duplicated shape rather than imported from `agentAttachments`, which keeps it
 * private; the filter is three lines and sharing it would mean widening that
 * module's surface for one caller.
 */
function collectActionTriggers(effects: unknown): ActionTriggerEffect[] | undefined {
  if (!Array.isArray(effects)) return undefined;
  const triggers = (effects as AttachmentEffect[])
    .filter((e): e is ActionTriggerEffect => e?.type === 'action_trigger');
  return triggers.length > 0 ? triggers : undefined;
}

/**
 * Resolve an attachment template node id into detail data, or `undefined`.
 *
 * @param graph          the live world graph
 * @param templateNodeId a template id as written on an aftermath effect
 *                       (`trait.condition.wounded`, an artifact template id)
 */
export function resolveAttachmentTemplateDetail(
  graph: WorldGraph,
  templateNodeId: string | undefined,
): AttachmentDetailData | undefined {
  if (!templateNodeId) return undefined;
  return attachmentDetailFromNode(graph.getNode(templateNodeId));
}

/**
 * The classifier half of the resolver above, taking the node directly (THR-1122).
 *
 * Split out because the tooltip registry reaches the same templates through a
 * *static* index rather than a live graph — `resolveTooltip` has no graph, and
 * giving it one would put every `attachment.*` id behind a context the `Tooltip`
 * component does not pass (the reason `agent.*` is unreachable from a chip
 * today, and is excluded from `conceptTooltipIds.test.ts`'s sweep by hand).
 * Sharing this function is what keeps the subcategory mapping single-sourced:
 * a third copy of `#blessing → blessing` is exactly the drift Law 3 forbids.
 */
export function attachmentDetailFromNode(
  node: GraphNode | undefined,
): AttachmentDetailData | undefined {
  if (!node) return undefined;

  const props = node.properties as Record<string, unknown>;
  const tier = (props.tier as AttachmentTier) ?? 1;
  const tags = (props.tags as string[]) ?? [];
  // A template's own summary, then its description, then its name. The last is
  // never empty, so the sheet always has a line to draw (Law 14 — no blank slot).
  const mechanicalSummary =
    (props.mechanicalSummary as string | undefined)
    ?? (props.description as string | undefined)
    ?? node.name;

  const base = {
    id: node.id,
    name: node.name,
    tier,
    mechanicalSummary,
    flavorText: props.flavorText as string | undefined,
    tags,
    source: props.source as string | undefined,
    lossCondition: props.lossCondition as string | undefined,
    image: props.image as string | undefined,
    actionTriggers: collectActionTriggers(props.effects),
  };

  if (POSSESSION_NODE_TYPES.has(node.type)) {
    // `subcategory`, not the slot tag — the same field `getAgentAttachments`
    // puts on a possession entry, so the sheet's glyph and kind line read
    // identically whether it was reached from a chip or from the bearer's tab.
    return { ...base, subcategory: (props.subcategory as string | undefined) ?? 'relics_talismans' };
  }

  if (node.type === 'trait') {
    // `subcategory` is the modern field; `category` is the older one the same
    // aggregator still reads, so both are honoured rather than one silently winning.
    const category = (props.subcategory ?? props.category) as string | undefined;
    if (!category || !ATTACHMENT_TRAIT_SUBCATEGORIES.has(category)) return undefined;

    if (category === 'bestowed') {
      return {
        ...base,
        subcategory: 'bestowed_power',
        grantedBy: props.grantedBy as string | undefined,
      };
    }

    const tagged = CONDITION_TAG_SUBCATEGORIES.find(([tag]) => tags.includes(tag));
    return { ...base, subcategory: tagged ? tagged[1] : CONDITION_DEFAULT_SUBCATEGORY };
  }

  // Anything else — a location, a faction, an agent id handed here by mistake —
  // has no attachment sheet. Silence beats the wrong sheet.
  return undefined;
}
