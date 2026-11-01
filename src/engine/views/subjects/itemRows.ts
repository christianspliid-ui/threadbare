/**
 * The artifact page's rows and the attachment card's rows (THR-1910, Inspector S2b —
 * plan `Docs/plans/2026-10-14-thr-1876-the-inspector.md` § D7.6, § D7.7, § D7.11).
 *
 * Every field `ArtifactSheet` and `AttachmentDetailView` show becomes a row here, read
 * from the same sources (`describeItem`, `readArtifactTraits`, `contentTagChips`,
 * `attachmentDetailFromNode`, `resolveConditionEffectLine`). An attachment's
 * `mechanicalSummary` is not shown (Law 13 — the reason `ArtifactSheet` withholds it);
 * raw `agreementType` and `payload.kind` are worded, and "(Nx)" goes.
 *
 * Artifact rows read `ctx.state` and return null without it. Attachment rows read the
 * template node `ctx.nodeId` names on a `content` page with no content ref (an attachment
 * ref names a template — committed content, THR-1822 § D7).
 */
import type {
  ChipDescriptor,
  ChipsSection,
  ProseSection,
  TriggerRow,
  TriggersSection,
} from '../../../types/detailPage';
import type { GraphNode } from '../../../types/graph';
import type { AttachmentEffect, ActionTriggerEffect } from '../../../types/effects';
import type { SectionResolver, SectionResolverContext } from '../../detailPageResolvers';
import type { GeneratedItemProvenance } from '../../itemGenerator/types';
import { describeItem } from '../../itemGenerator/describeItem';
import { isAgentGone } from '../../groups/groupQueries';
import { readArtifactTraits } from '../../artifactTraits';
import { ATTACHMENT_TOOLTIP_PREFIX, resolveConditionEffectLine } from '../../attachmentTemplateIndex';
import { attachmentDetailFromNode } from '../../attachmentTemplateDetail';
import { durationLabel, humanizeKeySegment } from '../../aftermathWords';
import { contentTagChips } from '../contentTagChips';
import { ACTION_TRIGGER_DEFAULT_PROBABILITY } from '../../../data/effect-constants';
import { CONDITION_DURATIONS } from '../../../data/condition-trait-content';
import {
  AGREEMENT_TYPE_WORDS,
  ITEM_LINES,
  LOSS_CONDITION_CLAUSES,
  SUBJECT_ROW_LABELS,
  SUBJECT_SENTENCE_CLAUSES,
  TRIGGER_EVENT_WORDS,
  TRIGGER_ONCE,
  TRIGGER_PAYLOAD_WORDS,
} from '../../../data/subject-sheet-words';
import { proseMarkupToHtml } from './pageResolvers';
import { linkedProseSection, type ProsePart } from './linkedProse';
import { asSentence, fillClause, sentenceSection } from './sentenceRows';

// ─── Artifact (§ D7.6) ───────────────────────────────────────────────────────

function artifactOf(ctx: SectionResolverContext): GraphNode | null {
  if (!ctx.state) return null;
  const node = ctx.graph.getNode(ctx.nodeId);
  return node && (node.type === 'artifact' || node.type === 'artifact_legendary') ? node : null;
}

function chips(typeId: string, label: string, list: ChipDescriptor[], source: string): ChipsSection | null {
  return list.length > 0 ? { kind: 'chips', typeId, label, gold: false, tier: 'routine', source, chips: list } : null;
}

/** "Made by Kael at Ashford" — a generated item's maker and place, as links (THR-1570). */
const madeBy: SectionResolver = (ctx) => {
  const node = artifactOf(ctx);
  if (!node || node.properties.origin !== 'generated') return null;
  const generated = node.properties.generated as GeneratedItemProvenance | undefined;
  const makerId = typeof node.properties.craftedBy === 'string' ? node.properties.craftedBy : null;
  if (!generated || !makerId) return null;
  const makerNode = ctx.graph.getNode(makerId);
  const concept = generated.provenanceConcepts?.find(c => c.kind === 'actor' && c.id === makerId);
  const makerName = makerNode?.name ?? concept?.name;
  if (!makerName) return null;
  // A gone maker is named, unlinked: never a dead link (Law 21).
  const maker: ProsePart = makerNode && !isAgentGone(makerNode) ? { text: makerName, ref: { kind: 'agent', id: makerId } } : makerName;
  const placeConcept = generated.provenanceConcepts?.find(c => c.kind === 'location');
  const place: ProsePart | null = placeConcept && ctx.graph.getNode(placeConcept.id) ? { text: placeConcept.name, ref: { kind: 'location', id: placeConcept.id } } : null;
  const parts: ProsePart[] = [ITEM_LINES.madeBy, maker];
  if (place) parts.push(ITEM_LINES.madeAt, place);
  parts.push('.');
  return linkedProseSection('made_by', SUBJECT_ROW_LABELS.madeBy, parts, 'craftedBy');
};

/** "What it does" / "The catch" — a generated item's words from its live effects (THR-1570). */
const whatItDoes: SectionResolver = (ctx) => {
  const node = artifactOf(ctx);
  if (!node || node.properties.origin !== 'generated') return null;
  const generated = node.properties.generated as GeneratedItemProvenance | undefined;
  if (!generated) return null;
  const effects = Array.isArray(node.properties.effects) ? (node.properties.effects as AttachmentEffect[]) : [];
  const words = describeItem(effects, generated.catchIndexes ?? [], generated.catchNotes ?? []);
  const paras: string[] = [];
  if (words.does.length > 0) paras.push(words.does.join(' '));
  if (words.catches.length > 0) paras.push(`**${SUBJECT_ROW_LABELS.theCatch}** — ${words.catches.join(' ')}`);
  if (paras.length === 0) return null;
  const section: ProseSection = { kind: 'prose', typeId: 'what_it_does', label: SUBJECT_ROW_LABELS.whatItDoes, gold: false, tier: 'routine', source: 'describeItem', prose: paras.map(proseMarkupToHtml).join('\n\n') };
  return section;
};

/** What the thing has become (THR-1521) — its `has_trait` edges, level in words. */
const traits: SectionResolver = (ctx) => {
  const node = artifactOf(ctx);
  if (!node) return null;
  const list: ChipDescriptor[] = readArtifactTraits(ctx.graph, node.id).map(r => ({
    label: r.name,
    flavour: r.levelWord ?? undefined,
    sentiment: r.polarity,
    tooltipId: `${ATTACHMENT_TOOLTIP_PREFIX}${r.traitId}`,
    dataKey: { attribute: 'artifact-trait', value: r.traitId },
  }));
  return chips('traits', SUBJECT_ROW_LABELS.traits, list, 'readArtifactTraits');
};

/** Authored tags, in the one tag-chip vocabulary (THR-1486 / THR-1521). */
const tags: SectionResolver = (ctx) => {
  const node = artifactOf(ctx);
  if (!node || !Array.isArray(node.properties.tags)) return null;
  const list = (node.properties.tags as unknown[]).filter((t): t is string => typeof t === 'string');
  return chips('tags', SUBJECT_ROW_LABELS.tags, contentTagChips(list), 'contentTagChips');
};

export const ITEM_ROW_RESOLVERS = {
  made_by: madeBy,
  what_it_does: whatItDoes,
  traits,
  tags,
} satisfies Record<string, SectionResolver>;

// ─── Attachment card (§ D7.7) ────────────────────────────────────────────────

/** The attachment template a content page with no content ref names, or null. */
export function attachmentTemplateOf(ctx: SectionResolverContext): GraphNode | null {
  if (ctx.contentRef || ctx.pageKind !== 'content') return null;
  const node = ctx.graph.getNode(ctx.nodeId);
  return node && attachmentDetailFromNode(node) ? node : null;
}

/**
 * Effect: what a condition does (THR-1475, the hover's own reading), when it is lost, who
 * grants it, and its agreement kind in words. `mechanicalSummary` is not shown (Law 13).
 */
const effect: SectionResolver = (ctx) => {
  const node = attachmentTemplateOf(ctx);
  const detail = node ? attachmentDetailFromNode(node) : undefined;
  if (!node || !detail) return null;
  // THR-2098 (rule R6): the strip becomes sentences — the effect line, how it is lost, who
  // grants it, its agreement kind. The raw loss key is worded (Law 14); an unknown one drops.
  const reading = resolveConditionEffectLine(node.id);
  const granter = detail.grantedBy?.trim().replace(/^granted by\s+/i, '').replace(/[.]$/, '');
  const agreement = node.properties.agreementType;
  const loss = detail.lossCondition?.trim() ?? '';
  return sentenceSection('effect', SUBJECT_ROW_LABELS.effect, [
    reading?.line ? [asSentence(reading.line)] : null,
    LOSS_CONDITION_CLAUSES[loss] ? [LOSS_CONDITION_CLAUSES[loss]]
      : loss && !/^[a-z]+(_[a-z]+)*$/.test(loss) ? fillClause(SUBJECT_SENTENCE_CLAUSES.lostWhen, { loss: loss.replace(/[.]$/, '') })
      : null,
    granter ? fillClause(SUBJECT_SENTENCE_CLAUSES.grantedBy, { granter }) : null,
    typeof agreement === 'string' && agreement ? [asSentence(AGREEMENT_TYPE_WORDS[agreement] ?? humanizeKeySegment(agreement))] : null,
  ], 'attachmentDetailFromNode');
};

/**
 * Duration: a template has no bearer edge, so no remaining term (THR-1120). It states the
 * term a grant of it lasts — `CONDITION_DURATIONS`, the table the condition applier reads
 * (template nodes carry no term of their own). Absent for an untimed template.
 */
const duration: SectionResolver = (ctx) => {
  const node = attachmentTemplateOf(ctx);
  if (!node) return null;
  const ticks = CONDITION_DURATIONS[node.id];
  if (typeof ticks !== 'number' || ticks <= 0) return null;
  // THR-2098 (rule R6): "It lasts three days."
  return sentenceSection('duration', SUBJECT_ROW_LABELS.duration, [fillClause(SUBJECT_SENTENCE_CLAUSES.lasts, { term: durationLabel(ticks) })], 'templateDuration');
};

function triggerSummary(t: ActionTriggerEffect): string {
  const parts: string[] = [TRIGGER_PAYLOAD_WORDS[t.payload.kind] ?? humanizeKeySegment(t.payload.kind)];
  if (t.payload.kind === 'condition_grant' && t.payload.durationTicks != null) parts.push(`(${durationLabel(t.payload.durationTicks)})`);
  // "(once)" is a word; "(3x)" was a numeral and goes (Law 13).
  if (t.maxFires === 1) parts.push(TRIGGER_ONCE);
  return parts.join(' ');
}

/** On-use triggers (THR-719): event worded, odds as pips (Law 15), payload worded. */
const triggers: SectionResolver = (ctx) => {
  const node = attachmentTemplateOf(ctx);
  const detail = node ? attachmentDetailFromNode(node) : undefined;
  const list = detail?.actionTriggers ?? [];
  if (list.length === 0) return null;
  const rows: TriggerRow[] = list.map(t => ({
    condition: TRIGGER_EVENT_WORDS[t.on] ?? humanizeKeySegment(t.on).replace(/^\w/, c => c.toUpperCase()),
    probability: typeof t.probability === 'number' && Number.isFinite(t.probability) ? t.probability : ACTION_TRIGGER_DEFAULT_PROBABILITY,
    narrativeTemplate: t.narrativeTemplate || undefined,
    effectSummary: triggerSummary(t),
  }));
  const section: TriggersSection = { kind: 'triggers', typeId: 'triggers', label: SUBJECT_ROW_LABELS.triggers, gold: false, tier: 'routine', source: 'actionTriggers', triggers: rows };
  return section;
};

/** Where the template comes from (its authored `source` line). */
const source: SectionResolver = (ctx) => {
  const node = attachmentTemplateOf(ctx);
  const detail = node ? attachmentDetailFromNode(node) : undefined;
  if (!detail?.source) return null;
  const section: ProseSection = { kind: 'prose', typeId: 'source', label: SUBJECT_ROW_LABELS.source, gold: false, tier: 'routine', source: 'attachmentSource', prose: proseMarkupToHtml(detail.source) };
  return section;
};

export const ATTACHMENT_ROW_RESOLVERS = {
  effect,
  duration,
  triggers,
  source,
} satisfies Record<string, SectionResolver>;
