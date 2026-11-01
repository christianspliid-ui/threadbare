/**
 * The faction page's rows (THR-1910, Inspector S2b — plan
 * `Docs/plans/2026-10-14-thr-1876-the-inspector.md` § D7.4, § D6, § D7.11).
 *
 * Every field `FactionSheet` shows becomes a row here (or a header field, or a
 * Connections row — leader, members, halls, controls, relations and vassals are
 * relations, § D6), resolved in the engine from the same reads the sheet makes
 * (`getFactionNetworkSummary`, `factionPurseView`, `fealtyView`). Scores and counts are
 * banded or dropped, raw `status` / `actionType` / `outcome` are worded (Laws 13/14).
 * Rows read `ctx.state` and return null without it.
 */
import type {
  ChipDescriptor,
  EventCardSection,
  EventEntry,
  ProseSection,
  SentencePart,
} from '../../../types/detailPage';
import type { GraphNode } from '../../../types/graph';
import type { FactionActionRecord } from '../../../types/factionAction';
import type { FactionDefinition } from '../../../types/faction';
import { REACH_DOMAINS } from '../../../types/traits';
import type { SectionResolver, SectionResolverContext } from '../../detailPageResolvers';
import type { WorldGraph } from '../../graph';
import { getFactionNetworkSummary, type FactionNetworkSummary } from '../../factionNetwork';
import { getFactionDefinition } from '../../../data/faction-definition-lookup';
import { formatCongregationSphereLine } from '../../../data/world-scenario';
import { REALM_FACTION_CLASS } from '../../../data/realm-content';
import { getReputationWord } from '../../../data/domain-words';
import { getWealthTier } from '../../wealth';
import { readMeansBand, readPurseDay } from '../../factionPurse';
import { factionPurseView } from '../../factionPurse/purseSentences';
import { fealtyPurseSentence, wagesPurseSentence, fealtyView } from '../../crown/fealtySentences';
import { composeCultureMores } from '../../cultureMores';
import { durationLabel, elapsedLabel, humanizeKeySegment, reachDisplayName } from '../../aftermathWords';
import {
  AGENDA_STATUS_WORDS,
  FACTION_LINES,
  FACTION_OUTCOME_WORDS,
  FACTION_RECENT_ACTIONS_MAX,
  FACTION_STRONGEST_REACHES_MAX,
  FACTION_MEANS_CLAUSES,
  SUBJECT_GALLERY_LABELS,
  SUBJECT_ROW_LABELS,
  SUBJECT_SENTENCE_CLAUSES,
  factionReachWord,
} from '../../../data/subject-sheet-words';
import { chipsSection, fillClause, lowerFirst, sentenceSection } from './sentenceRows';
import { relicGallery } from './relicGallery';
import { proseMarkupToHtml } from './pageResolvers';
import { linkedProseSection, type ProsePart } from './linkedProse';
import { pilgrimWayParts } from './placeRows';
import { selectPilgrimWays } from '../../pilgrimWays';
import { PILGRIM_WAY_LINES } from '../../../data/subject-sheet-words';

// ─── Shared ──────────────────────────────────────────────────────────────────

interface FactionRead {
  node: GraphNode;
  graph: WorldGraph;
  summary: FactionNetworkSummary | null;
  definition: FactionDefinition | undefined;
  tick: number;
  seed: number;
}

function factionOf(ctx: SectionResolverContext): FactionRead | null {
  if (!ctx.state) return null;
  const node = ctx.graph.getNode(ctx.nodeId);
  if (!node || node.type !== 'actor' || node.properties.actorType !== 'faction') return null;
  let summary: FactionNetworkSummary | null = null;
  try {
    summary = getFactionNetworkSummary(ctx.graph, node.id);
  } catch {
    summary = null;
  }
  // The sheet's definition lookup: the summary's, else the node's own `factionDefId`.
  let definition: FactionDefinition | undefined = summary?.definition ?? undefined;
  const defId = node.properties.factionDefId;
  if (!definition && typeof defId === 'string') definition = getFactionDefinition(defId) ?? undefined;
  return { node, graph: ctx.graph, summary, definition, tick: ctx.tick, seed: ctx.seed };
}

function prose(typeId: string, label: string, text: string, source: string, extra: Partial<ProseSection> = {}): ProseSection | null {
  if (!text.trim()) return null;
  return { kind: 'prose', typeId, label, gold: false, tier: 'routine', source, prose: proseMarkupToHtml(text), ...extra };
}

function sentenceCase(text: string): string {
  return text.length > 0 ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

function stableHash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

// ─── Overview ────────────────────────────────────────────────────────────────

/** The definition's description and motto. */
const description: SectionResolver = (ctx) => {
  const f = factionOf(ctx);
  if (!f?.definition) return null;
  const paras = [f.definition.description, f.definition.motto ? `“${f.definition.motto}”` : null].filter((x): x is string => Boolean(x && x.trim()));
  if (paras.length === 0) return null;
  return { kind: 'prose', typeId: 'description', label: SUBJECT_ROW_LABELS.description, gold: true, tier: 'routine', source: 'factionDefinition', prose: paras.map(proseMarkupToHtml).join('\n\n') };
};

/** A congregation's venerated sphere (THR-1659). */
const venerates: SectionResolver = (ctx) => {
  const f = factionOf(ctx);
  const sphere = f?.node.properties.veneratedSphere;
  if (!f || typeof sphere !== 'string' || !sphere) return null;
  return prose('venerates', SUBJECT_ROW_LABELS.venerates, formatCongregationSphereLine(sphere), 'veneratedSphere', { labelTooltipId: `sphere.${sphere}` });
};

/** The current agenda (`pursues`), its status worded; kindled callings say so. */
const agenda: SectionResolver = (ctx) => {
  const f = factionOf(ctx);
  if (!f) return null;
  const a = f.summary?.activeAmbition;
  if (!a) return prose('agenda', SUBJECT_ROW_LABELS.agenda, FACTION_LINES.noAgenda, 'factionNetwork');
  const status = AGENDA_STATUS_WORDS[a.status] ?? sentenceCase(humanizeKeySegment(a.status));
  // THR-2098 (rule R6): "Hold the river crossings: under way." then the kindled line.
  return sentenceSection('agenda', SUBJECT_ROW_LABELS.agenda, [
    fillClause(SUBJECT_SENTENCE_CLAUSES.agenda, { agenda: a.name, status: lowerFirst(status) }),
    a.kindled ? [FACTION_LINES.kindled] : null,
  ], 'factionNetwork');
};

/** An active conclave: its term in words and its question. */
const conclave: SectionResolver = (ctx) => {
  const f = factionOf(ctx);
  const c = f?.node.properties.activeConclave as { question?: string; ticksRemaining?: number } | null | undefined;
  if (!f || !c) return null;
  const lead = FACTION_LINES.conclave.replace('{left}', durationLabel(c.ticksRemaining ?? 0));
  return prose('conclave', SUBJECT_ROW_LABELS.conclave, c.question ? `${lead} ${c.question}` : lead, 'activeConclave');
};

/**
 * The purse's band (THR-1931), else the wealth tier word (THR-1428). THR-2098 (rule R6):
 * one sentence — "They live in comfort." — the band phrase a term with its tooltip.
 */
const means: SectionResolver = (ctx) => {
  const f = factionOf(ctx);
  if (!f) return null;
  const band = readMeansBand(f.node);
  const wealth = f.node.properties.wealth;
  const tier = band ?? (typeof wealth === 'number' ? getWealthTier(wealth) : null);
  const clause = tier ? FACTION_MEANS_CLAUSES[tier] : undefined;
  if (!clause) return null;
  const term: SentencePart = band ? { text: clause.term, tooltipId: 'ui.econ.means.faction' } : clause.term;
  return sentenceSection('means', SUBJECT_ROW_LABELS.means, [[clause.lead, term, '.']], band ? 'readMeansBand' : 'getWealthTier');
};

/** The purse's day in sentences (THR-1931): income, fealty paid, spending. Names link. */
const purse: SectionResolver = (ctx) => {
  const f = factionOf(ctx);
  if (!f) return null;
  const view = factionPurseView(f.graph, f.node.id, { band: readMeansBand, day: readPurseDay });
  if (!view) return null;
  const parts: ProsePart[] = [];
  if (view.income.length > 0) parts.push(...view.income, ' ');
  const fealty = fealtyPurseSentence(f.graph, readPurseDay(f.node));
  if (fealty) parts.push(...fealty, ' ');
  // THR-1974 — a liege that paid its vassals' soldiers today says whose.
  const wages = wagesPurseSentence(f.graph, f.node.id);
  if (wages) parts.push(...wages, ' ');
  parts.push(view.spending);
  return linkedProseSection('purse', SUBJECT_ROW_LABELS.purse, parts, 'factionPurseView');
};

/** A Crown's line (THR-1932): who wears it and how many owe it fealty. */
const crown: SectionResolver = (ctx) => {
  const f = factionOf(ctx);
  if (!f) return null;
  const c = fealtyView(f.graph, f.node.id).crown;
  if (!c) return null;
  const parts: ProsePart[] = c.ruler ? [c.ruler, FACTION_LINES.crownRuler, c.count] : [sentenceCase(c.count)];
  return linkedProseSection('crown', SUBJECT_ROW_LABELS.crown, parts, 'fealtyView', { labelTooltipId: 'ui.crown.title' });
};

/**
 * A vassal's oath and its standing with its liege (THR-1932). The liege's own vassal
 * list is a relation — it lives in Connections (§ D6), not here.
 */
const fealty: SectionResolver = (ctx) => {
  const f = factionOf(ctx);
  if (!f) return null;
  const v = fealtyView(f.graph, f.node.id).vassal;
  if (!v) return null;
  const parts: ProsePart[] = [
    ...v.oath,
    '\n\n',
    `${FACTION_LINES.standingLead}${v.standing.word}${v.standing.oneStepFromBreaking ? FACTION_LINES.oneStepFromBreaking : ''} — ${v.standing.rest}`,
    // THR-1974 — its liege pays its soldiers (today's purse day only).
    ...(v.wages ? [' ', v.wages] : []),
  ];
  return linkedProseSection('fealty', SUBJECT_ROW_LABELS.fealty, parts, 'fealtyView', { labelTooltipId: 'ui.crown.standing' });
};

/**
 * The top Reaches as words; the score numeral goes (Law 13). THR-2098 (rule R7): chips —
 * "Might · Strong" — and the bar drops, because the word already carries the size.
 */
const strongestReaches: SectionResolver = (ctx) => {
  const f = factionOf(ctx);
  if (!f?.summary) return null;
  const caps = f.summary.domainCapabilities;
  const chips: ChipDescriptor[] = [...REACH_DOMAINS]
    .filter(d => (caps[d] ?? 0) > 0)
    .sort((a, b) => (caps[b] ?? 0) - (caps[a] ?? 0))
    .slice(0, FACTION_STRONGEST_REACHES_MAX)
    .map(d => ({ label: reachDisplayName(d), flavour: factionReachWord(caps[d] ?? 0), tooltipId: `reach.${d}` }));
  return chipsSection('strongest_reaches', SUBJECT_ROW_LABELS.strongestReaches, chips, 'factionNetwork');
};

/**
 * A Realm's customs — the culture's mores prose HexChronicle's *The People* told
 * (`composeCultureMores`). It describes the people, and cultures open through their Realm.
 * Seeded per culture (not per hex), so the Realm reads one way wherever it is opened.
 */
const customs: SectionResolver = (ctx) => {
  const f = factionOf(ctx);
  if (!f || f.node.properties.factionClass !== REALM_FACTION_CLASS) return null;
  const defId = f.node.properties.factionDefId;
  const cultureId = typeof defId === 'string' && defId.startsWith('realm.') ? defId.slice('realm.'.length)
    : f.graph.getOutgoingEdges(f.node.id, 'belongs_to').map(e => f.graph.getNode(e.target)).find(n => n?.properties.actorType === 'culture')?.id;
  const culture = cultureId ? f.graph.getNode(cultureId) : undefined;
  const identity = culture?.properties.cultureIdentity as Parameters<typeof composeCultureMores>[0] | undefined;
  if (!culture || !identity) return null;
  const text = composeCultureMores(identity, (f.seed ^ stableHash(culture.id)) >>> 0);
  return text ? prose('customs', SUBJECT_ROW_LABELS.customs, text, 'composeCultureMores') : null;
};

/**
 * Rank tiers and the band each opens at; "(N slots)" goes (Law 13). THR-2098 (rule R7):
 * chips — "Initiate · Accepted and above" — band words only, never a raw 0–1 value.
 */
const ranks: SectionResolver = (ctx) => {
  const f = factionOf(ctx);
  if (!f?.definition?.rankTiers?.length) return null;
  const chips: ChipDescriptor[] = f.definition.rankTiers.map(t => ({ label: t.name, flavour: FACTION_LINES.rankBand.replace('{band}', getReputationWord(t.minReputation)) }));
  return chipsSection('ranks', SUBJECT_ROW_LABELS.ranks, chips, 'factionDefinition');
};

/**
 * THR-2098 (rule R3) — the relics this faction holds, as art tiles in the aside: the
 * `possesses` edges the Connections block reads. "Relics they hold · 2". None → no row.
 */
const relicsHeld: SectionResolver = (ctx) => {
  const f = factionOf(ctx);
  if (!f) return null;
  const ids = f.graph.getOutgoingEdges(f.node.id, 'possesses').map(e => e.target);
  return relicGallery(f.graph, ids, 'relics_held', SUBJECT_GALLERY_LABELS.relicsHeld);
};

// ─── Story ───────────────────────────────────────────────────────────────────

/** The sheet's five latest faction actions (`factionActionHistory`), newest first, worded. */
const recentActions: SectionResolver = (ctx) => {
  const f = factionOf(ctx);
  if (!f) return null;
  const history = (f.node.properties.factionActionHistory as FactionActionRecord[] | undefined) ?? [];
  if (history.length === 0) return null;
  const entries: EventEntry[] = history.slice(-FACTION_RECENT_ACTIONS_MAX).reverse().map(r => {
    const what = sentenceCase(humanizeKeySegment(r.actionType));
    const target = r.targetName ? ` — ${r.targetName}` : '';
    const outcome = FACTION_OUTCOME_WORDS[r.outcome] ?? humanizeKeySegment(r.outcome);
    return {
      whenLabel: `${sentenceCase(elapsedLabel(Math.max(0, f.tick - r.executedTick)))} ago`,
      prose: `${what}${target}: ${outcome}.`,
    };
  });
  const section: EventCardSection = {
    kind: 'event-card', typeId: 'recent_actions', label: SUBJECT_ROW_LABELS.recentActions, gold: false, tier: 'routine', source: 'factionActionHistory',
    whenLabel: '', prose: '', entries,
  };
  return section;
};

/**
 * Where this congregation's pilgrims go (THR-1992): the towns its ways lead to, each a
 * link — `PilgrimWayLine`'s congregation line, restored. No way → no row (Law 25).
 */
const pilgrimWays: SectionResolver = (ctx) => {
  const f = factionOf(ctx);
  if (!f) return null;
  const ids = selectPilgrimWays(f.graph).filter(w => w.congregationId === f.node.id).map(w => w.siteId);
  const parts = pilgrimWayParts(f.graph, ids, 'location', PILGRIM_WAY_LINES.congregationLead);
  return linkedProseSection('pilgrim_ways', SUBJECT_ROW_LABELS.pilgrimWays, parts, 'selectPilgrimWays', { labelTooltipId: 'ui.pilgrim_way' });
};

/** The faction rows, by `typeId`. */
export const FACTION_ROW_RESOLVERS = {
  description,
  venerates,
  pilgrim_ways: pilgrimWays,
  agenda,
  conclave,
  means,
  purse,
  crown,
  fealty,
  strongest_reaches: strongestReaches,
  customs,
  ranks,
  relics_held: relicsHeld,
  recent_actions: recentActions,
} satisfies Record<string, SectionResolver>;
