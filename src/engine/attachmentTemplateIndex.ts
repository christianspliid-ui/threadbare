/**
 * THR-1122 — the static attachment-template index behind the registry's
 * `attachment.*` tooltip prefix.
 *
 * ## The defect this closes
 *
 * Law 17 asks that every concept word carry a tooltip from the one registry,
 * and `resolveTooltip` routes strictly by prefix. There was no prefix covering
 * attachments — so a condition, blessing, curse or bestowed power named on a
 * player surface could not carry a registry tooltip at all. It was never that
 * the ids were unregistered; there was no namespace to register them in.
 * THR-1120 had already given those words their *link* tier (a consequence chip's
 * `wounded` opens the attachment sheet); this closes the *hover* tier.
 *
 * ## Why a static index and not the world graph
 *
 * `resolveAttachmentTooltip` exists and formats attachment data beautifully, but
 * it takes a data *object* — it is unreachable from any surface holding only an
 * id, which is every prose/segment surface including the consequence chip. The
 * obvious bridge is "resolve the template node from the graph, then delegate",
 * and it does not work: `Tooltip` calls `resolveTooltip(id)` with **no context**,
 * so a graph-bearing prefix is unreachable from the component that draws every
 * tooltip in the game. `agent.*` is exactly that shape, and pays for it by being
 * excluded from `conceptTooltipIds.test.ts`'s Law 17 sweep by hand.
 *
 * Attachment templates do not need the graph. They are shipped as static
 * `GraphNode[]` literals and *seeded into* the graph at construction
 * (`seedEncounterTraitDefinitions`, the reward/starter catalogs) — so the module
 * reads the same source the graph was built from, the way `sphere.*` and
 * `reach.*` read `world-model.json`. Context-free means a chip tooltip resolves
 * with no plumbing, and means the corpus sweep covers it like every other prefix.
 *
 * ## The body line is the plain register, never `mechanicalSummary`
 *
 * Law 18 binds tooltip copy to a plain what-and-why, and Law 13 forbids raw
 * magnitudes on a player surface. `mechanicalSummary` is where this corpus keeps
 * its numbers — `'-0.05 Iron (decays toward 0 over 24 ticks, self-removes on
 * heal)'` — so it is the sheet's field, not the tooltip's, and is deliberately
 * unreachable from here. The precedence is `description` → `flavorText` → `name`:
 * conditions and bestowed powers carry a description, possessions carry only
 * flavour, and a name is never empty, so there is always a line to draw (Law 14 —
 * no blank slot). `attachmentTooltipCopyIsPlainRegister` in the tests pins it.
 *
 * ## Fail-open (NFP #4)
 *
 * An id outside the index resolves to `null`, the surface draws plain text, and
 * one warning names the id — never the raw id on screen (Law 14). `ARTIFACT_TEMPLATES`
 * is deliberately *not* indexed: those entries carry no `description` and no
 * `flavorText`, so there is no plain-register line to show, and a tooltip that
 * says only the name it is attached to is worse than no tooltip at all.
 */

import type { GraphNode } from '../types/graph';
import type { AttachmentTier } from '../types/attachments';
import { attachmentDetailFromNode } from './attachmentTemplateDetail';
import { resolveAttachmentTooltip } from './attachmentTooltip';
import type { TooltipContent } from '../types/tooltip';
import { CONDITION_TRAIT_DEFINITIONS } from '../data/condition-trait-content';
import {
  REWARD_POSSESSIONS,
  REWARD_CONDITIONS,
  REWARD_BESTOWED_POWERS,
  TREASURE_MAPS,
  RUIN_SEEKER_TRAIT,
} from '../data/reward-attachment-catalog';
import { STARTER_POSSESSIONS, STARTER_CONDITIONS } from '../data/starter-attachments';

/** The registry prefix this module answers for. */
export const ATTACHMENT_TOOLTIP_PREFIX = 'attachment.';

/**
 * Longest body line a tooltip will show, in characters.
 *
 * Below the 200-char Law 18 ceiling `tooltipValidation.test.ts` enforces, so a
 * long authored description is trimmed here rather than failing the gate.
 */
export const ATTACHMENT_TOOLTIP_MAX_DESC = 160;

/**
 * Every shipped attachment-template family, in one list.
 *
 * Exported so tests assert over the *shipped* corpus rather than a hand-copied
 * id list — the latter goes vacuous the moment a template is added.
 */
export const ATTACHMENT_TEMPLATE_SOURCES: readonly GraphNode[] = [
  ...CONDITION_TRAIT_DEFINITIONS,
  ...REWARD_CONDITIONS,
  ...REWARD_BESTOWED_POWERS,
  ...REWARD_POSSESSIONS,
  ...TREASURE_MAPS,
  RUIN_SEEKER_TRAIT,
  ...STARTER_POSSESSIONS,
  ...STARTER_CONDITIONS,
];

/** Built once at module load; the sources are static literals. */
const TEMPLATE_INDEX: ReadonlyMap<string, GraphNode> = new Map(
  ATTACHMENT_TEMPLATE_SOURCES.map(node => [node.id, node]),
);

/** Look up a shipped attachment template by its node id. */
export function getAttachmentTemplateNode(templateId: string): GraphNode | undefined {
  return TEMPLATE_INDEX.get(templateId);
}

/** Ids already warned about, so a re-render does not re-warn (Law 14). */
const warnedIds = new Set<string>();

/**
 * Warn exactly once that `templateId` has no shipped template.
 *
 * Exported only so tests can reset it — a module-level Set otherwise leaks the
 * first test's warning suppression into every later one.
 */
export function resetAttachmentTooltipWarnings(): void {
  warnedIds.clear();
}

/**
 * Say once why `templateId` cannot be explained, then resolve to nothing.
 *
 * Once, because `tooltipResolves` runs on every render of every segment — a
 * per-call warning would bury the console under one dangling id. Returning
 * `null` is what keeps the promise the warning describes: the surface draws the
 * concept as plain text, and the id itself never reaches the player (Law 14).
 */
function warnOnce(templateId: string, reason: string): null {
  if (!warnedIds.has(templateId)) {
    warnedIds.add(templateId);
    console.warn(
      `[attachment tooltip] "${templateId}": ${reason} — the concept renders as `
      + 'plain text (Law 14: never the raw id).',
    );
  }
  return null;
}

/**
 * The plain-register body line for a template node, trimmed to tooltip width.
 *
 * See the header: `mechanicalSummary` is excluded on purpose, because that is
 * where this corpus keeps the numerals Law 13 forbids on a player surface.
 *
 * Exported for direct unit testing: no shipped template is currently long
 * enough to trigger the trim, so asserting it through the corpus would be a
 * vacuous probe that passes because nothing exercised it.
 */
export function plainRegisterBody(node: GraphNode): string {
  const props = node.properties as Record<string, unknown>;
  const raw =
    (typeof props.description === 'string' ? props.description : undefined)
    ?? (typeof props.flavorText === 'string' ? props.flavorText : undefined)
    ?? node.name;
  const text = raw.trim();
  if (text.length <= ATTACHMENT_TOOLTIP_MAX_DESC) return text;

  // Break at a sentence boundary when there is one worth using, so a trimmed
  // line still reads as a sentence rather than a severed clause.
  const clipped = text.slice(0, ATTACHMENT_TOOLTIP_MAX_DESC);
  const lastEnd = Math.max(
    clipped.lastIndexOf('.'),
    clipped.lastIndexOf('?'),
    clipped.lastIndexOf('!'),
  );
  if (lastEnd > ATTACHMENT_TOOLTIP_MAX_DESC / 2) return clipped.slice(0, lastEnd + 1);
  return `${clipped.trim()}…`;
}

/**
 * Resolve `attachment.<templateNodeId>` into tooltip content, or `null`.
 *
 * Delegates the *formatting* to `resolveAttachmentTooltip` — the same formatter
 * `AttachmentsTab`, `ProwessTab` and the gate-duty stage already use — so a
 * concept word and the row it names read identically. What is deliberately not
 * passed is every field that would print a numeral or an internal key:
 *
 * | Omitted           | Why                                                     |
 * |-------------------|---------------------------------------------------------|
 * | `ticksRemaining`  | per-bearer edge state (THR-784); a template has none     |
 * | `actionTriggers`  | renders a `%` chance — Law 13 on a player surface        |
 * | `lossCondition`   | an internal key (`breakable`) — Law 14                   |
 */
export function resolveAttachmentTemplateTooltip(templateId: string): TooltipContent | null {
  const node = getAttachmentTemplateNode(templateId);
  if (!node) return warnOnce(templateId, 'no shipped attachment template');

  const detail = attachmentDetailFromNode(node);
  // A trait outside the four attachment subcategories is a concept with no
  // sheet — a personality trait, an archetype marker, a mastery. Silence beats
  // a tooltip that implies a sheet the player cannot open.
  if (!detail) return warnOnce(templateId, 'shipped, but not an attachment subcategory');

  const { label, desc } = resolveAttachmentTooltip({
    name: detail.name,
    subcategory: detail.subcategory,
    tier: detail.tier as AttachmentTier,
    mechanicalSummary: plainRegisterBody(node),
  });

  return { label, desc };
}
