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
import { conditionEffectLine, type ConditionEffectReading } from './aftermathWords';
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
 * The Law 18 ceiling itself, as a named number (THR-1475).
 *
 * `tooltipValidation.test.ts` sweeps every resolved `attachment.*` entry against
 * 200 characters. Until this ticket the body was the whole description, so the
 * 160 above was the only budget that mattered. A condition now appends an effect
 * line, and the two together are what the gate measures — so the body's budget
 * is computed *after* reserving room for the effect, and the effect is the half
 * that survives. That ordering is deliberate: the flavour prose is what the
 * player can already read on the sheet, and the effect line is the information
 * this ticket exists to deliver. Trimming the new thing to preserve the old one
 * would reintroduce the defect quietly, the way THR-1122 lost it the first time.
 */
export const ATTACHMENT_TOOLTIP_MAX_TOTAL_DESC = 200;

/**
 * Shortest body worth drawing. Below this the trim has eaten the sentence, so the
 * body is dropped entirely and the effect line stands alone — a clause severed at
 * twenty characters explains less than nothing (Law 14).
 */
export const ATTACHMENT_TOOLTIP_MIN_BODY = 40;

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

/**
 * THR-1475 — the condition effect reading for a template **id**, or `null`.
 *
 * The id-keyed door onto `conditionEffectLine`, which takes a node. It exists so
 * the hover and the sheet read the one derivation from the one place (Law 27):
 * `resolveAttachmentTemplateTooltip` below calls it with no grant, and
 * `AttachmentDetailView` calls it with the bearer's `totalTicks`. Those two call
 * sites are the whole reason the lookup is not inlined into either of them.
 *
 * Fail-open (NFP #4): an unindexed id, or a template with no effect substrate,
 * returns `null` and the surface simply draws one row fewer. Deliberately
 * silent — `resolveAttachmentTemplateTooltip` already warns once per unknown id,
 * and a second channel for the same fact would double every console line.
 */
export function resolveConditionEffectLine(
  templateId: string | undefined,
  grant?: { readonly totalTicks?: number | null },
): ConditionEffectReading | null {
  if (!templateId) return null;
  const node = getAttachmentTemplateNode(templateId);
  return node ? conditionEffectLine(node, grant) : null;
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
export function plainRegisterBody(
  node: GraphNode,
  rawBudget: number = ATTACHMENT_TOOLTIP_MAX_DESC,
): string {
  // Clamped because `slice(0, negative)` counts from the *end* — a caller passing a
  // budget below zero would silently get the text minus its last few characters
  // rather than the empty string it asked for.
  const budget = Math.max(0, Math.floor(Number.isFinite(rawBudget) ? rawBudget : 0));
  const props = node.properties as Record<string, unknown>;
  const raw =
    (typeof props.description === 'string' ? props.description : undefined)
    ?? (typeof props.flavorText === 'string' ? props.flavorText : undefined)
    ?? node.name;
  const text = raw.trim();
  if (text.length <= budget) return text;

  // Break at a sentence boundary when there is one worth using, so a trimmed
  // line still reads as a sentence rather than a severed clause.
  const clipped = text.slice(0, budget);
  const lastEnd = Math.max(
    clipped.lastIndexOf('.'),
    clipped.lastIndexOf('?'),
    clipped.lastIndexOf('!'),
  );
  if (lastEnd > budget / 2) return clipped.slice(0, lastEnd + 1);

  // THR-1475: the ellipsis costs a character, so the clip has to leave room for
  // it. It did not, and this branch returned `budget + 1` — which is why the
  // shipped corpus measured a 161-character body against a 160-character ceiling.
  // It went unnoticed because the only existing trim test exercises the sentence-
  // boundary branch above, and because one character over did not yet collide
  // with the Law 18 gate at 200. Composing an effect line into the same budget is
  // what made an exact ceiling load-bearing.
  if (budget <= 1) return '';
  return `${clipped.slice(0, budget - 1).trim()}…`;
}

/**
 * THR-1475 — the tooltip's body: the plain-register line, then the effect line.
 *
 * Pure, and exported, because it owns the one piece of arithmetic in this module
 * that shipped data cannot exercise. The body's budget is what is left of the Law
 * 18 ceiling once the effect line has its room (`ATTACHMENT_TOOLTIP_MAX_TOTAL_DESC`),
 * and the effect is the half that survives a squeeze — see that constant for why
 * that ordering is deliberate. With the current ladder no condition's reading comes
 * near long enough to squeeze anything, so testing the squeeze through the corpus
 * would be a probe that passes because nothing exercised it. Called directly with a
 * long synthetic reading, it is a real gate on the branch a future author will hit.
 *
 * A budget under `ATTACHMENT_TOOLTIP_MIN_BODY` drops the body rather than drawing a
 * clause severed mid-word; `plainRegisterBody`'s own trim would otherwise be handed
 * a number small enough to make nonsense of a sentence.
 */
export function composeTemplateTooltipBody(
  node: GraphNode,
  effect: ConditionEffectReading | null,
): string {
  if (!effect) return plainRegisterBody(node);

  // `- 1` for the newline the formatter joins these with.
  const budget = Math.min(
    ATTACHMENT_TOOLTIP_MAX_DESC,
    ATTACHMENT_TOOLTIP_MAX_TOTAL_DESC - effect.line.length - 1,
  );
  if (budget < ATTACHMENT_TOOLTIP_MIN_BODY) return effect.line;

  return `${plainRegisterBody(node, budget)}\n${effect.line}`;
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
    // `resolveAttachmentTooltip` puts this first and joins its lines with a
    // newline, so composing here is how the effect becomes the tooltip's second
    // line rather than a second field the formatter would have to learn about.
    //
    // No grant is available at this call site by construction: `resolveTooltip(id)`
    // is called with no context (see the header), so the term is the template
    // default. The bearer's own term appears on the sheet, which holds the edge.
    mechanicalSummary: composeTemplateTooltipBody(node, conditionEffectLine(node)),
  });

  return { label, desc };
}
