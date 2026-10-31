/**
 * The person page's rows (THR-1909, Inspector S2a — plan
 * `Docs/plans/2026-10-14-thr-1876-the-inspector.md` § D7.1, § D6, § D7.11).
 *
 * Every field the person profile (`AgentProfileModal` and its seven tabs) and the thread
 * column (`ThreadDetailView`) show becomes a row here, resolved in the engine — no
 * component reads the graph (THR-1822). The rows read **one** card: the same
 * `getAgentInfoCard` the profile reads, built once per page compose with the live
 * intention read stamped on it (`canReadIntention`, the one gate — PC-6), so the
 * Inspector and the retiring sheet say the same thing until S4 deletes the sheet.
 *
 * Words at the source (Laws 13/14): worded keys, `elapsedLabel` for time, no domain
 * dots (Law 10). A row whose source is absent returns null (§ Fail-soft): the hover
 * card and graph-only callers carry no `state`, and these rows are Inspector-only.
 */
import type {
  CardTile,
  CardsSection,
  ChipDescriptor,
  ChipsSection,
  EventCardSection,
  EventEntry,
  PanelRow,
  PanelSection,
  ProseSection,
  SentencePart,
} from '../../../types/detailPage';
import type { WorldRef } from '../../../types/worldRef';
import { getAttachmentArtUrl } from '../../../data/artifact-category-art';
import { ICON_CLASSES, iconForKey } from '../../../data/icons/conceptIcons';
import type { GameState } from '../../../types/gameState';
import type { KnowledgeLevel } from '../../../types/familiarity';
import type { SectionResolver, SectionResolverContext } from '../../detailPageResolvers';
import {
  getAgentFullProfile,
  getAgentInfoCard,
  summarizeActiveUndertakings,
  type AgentFullProfileData,
  type AgentInfoCardData,
  type ActiveIntent,
  type ActiveUndertakingSummary,
} from '../../agentDetail';
import { agreementLine, type AttachmentFullEntry } from '../../agentAttachments';
import { getFamiliarity, getKnowledgeLevel } from '../../familiarity';
import { canReadIntention, describeIntentionRead, knowledgeAtLeast, readIntentionFromCard } from '../../intentionReading';
import { createHoldReader } from '../../holdStanding';
import type { RealmProjection } from '../../realmProjection';
import { composeThreadStory } from '../../threadDigest';
import { getFirstPathFor } from '../../firstPath';
import { getAgentArc } from '../../agentArc';
import { buildIntelligenceDisplay, INTEL_PANEL_FOG_MIN_TIER } from '../../intelligence';
import { getAgentStrategicHistory, getAgentStrategicSummary } from '../../strategicPresentation';
import { getNotableStandings } from '../../reputation';
import { getWealthTier } from '../../wealth';
import { pastLineText } from '../../worldPastWords';
import { durationLabel, elapsedLabel, humanizeKeySegment, outcomePhrase, reachDisplayName } from '../../aftermathWords';
import { getChapterTemplateName, isEncounterAction, isRoutineChapter } from '../../chapterArchive';
import { isRoutineTemplate } from '../../attentionCadence';
import { getReputationWord } from '../../../data/domain-words';
import { stepOutcomeWord } from '../../../data/outcome-band-content';
import { UNDERTAKING_HALT_RATCHET_N } from '../../../data/strategic-action-constants';
import { SLOT_TAG_DISPLAY_NAMES } from '../../../data/attachment-slot-constants';
import { ATTACHMENT_TIER_NAMES, type AttachmentTier } from '../../../types/attachments';
import {
  AMBITION_PRIMARY_INTERACTIONS,
  AMBITION_SECONDARY_INTERACTIONS,
  OVERVIEW_BACKSTORY_INTERACTIONS,
  OVERVIEW_GOSSIP_THRESHOLD,
  type AgentKnowledge,
} from '../../../types/agentKnowledge';
import { CORE_CONTINUA, CORE_NEUTRAL } from '../../../types/coreRegistry';
import { CANONICAL_AXES, signedToCanonical01 } from '../../../types/axisRegistry';
import { linkedProseSection, type ProsePart } from './linkedProse';
import {
  BLOOD_LINE,
  BOUNTY_BLOOD_LINE,
  CHAPTER_UNDER_WAY,
  COHESION_SENTENCE,
  DESIGN_OUTCOME_WORD,
  DISPOSITION_LABEL_MAP,
  LOCKED_STRATUM_TEXT,
  NATURE_LEAD,
  PERSON_COUNTED_LABEL,
  PERSON_EMPTY_LINES,
  WHO_THEY_ARE_CLAUSES,
  WHO_THEY_ARE_MEANS,
  personArticle,
  PERSON_FACT_WORDS,
  PERSON_ROW_LABELS,
  RELIABILITY_WORD,
  personLine,
  rivalsSentence,
} from '../../../data/person-sheet-words';

// ─── Tunables (NFP #1) ────────────────────────────────────────────────────────

/** How many standings the reputation row lists (the Overview's THR-1206 five). */
export const PERSON_MAX_STANDINGS = 5;
/** How many strategic history entries the Designs row lists (the thread column's three). */
export const PERSON_DESIGNS_HISTORY_MAX = 3;
/**
 * A core or moral-axis position within this of neutral reads as balanced — neither pole
 * word. Moved from `OverviewTab.tsx` (`CORE_LEAN_EPSILON`).
 */
export const PERSON_LEAN_EPSILON = 0.05;
/** A moral axis under this signed distance from neutral, with no contributor, is not listed. */
export const PERSON_AXIS_SIGNAL_EPSILON = 0.1;

// ─── The one card per compose ─────────────────────────────────────────────────

/** Everything the person rows read, built once per page compose. */
export interface PersonSheet {
  card: AgentInfoCardData;
  profile?: AgentFullProfileData;
  state: GameState;
  level: KnowledgeLevel;
  /**
   * The god's per-mortal interaction record (`GameState.agentKnowledge`) — the reveals the
   * profile tabs honour beside the knowledge level (a disposition seen, values shown,
   * gossip heard). Absent when the god has never dealt with them.
   */
  knowledge?: AgentKnowledge;
  /** The thread tier the god holds on this mortal (0 = no thread). */
  threadTier: number;
}

/**
 * The knowledge level a person page reads at — the profile's rule
 * (`resolveCardKnowledgeLevel`, minus the debug omniscience flag): the god's own avatar
 * is read whole, everyone else by familiarity. Fail-soft: no familiarity map reads a stranger.
 */
export function personKnowledgeLevel(state: GameState, agentId: string): KnowledgeLevel {
  const graph = state.graph;
  if (state.ascendantId && graph.getOutgoingEdges(agentId, 'avatar_of').some(e => e.target === state.ascendantId)) return 'transparent';
  const fam = state.familiarityMap;
  return getKnowledgeLevel(fam && typeof fam.get === 'function' ? getFamiliarity(fam, agentId) : 0);
}

/**
 * The card the person rows read, with the live intention read stamped on it — the
 * same build `useAgentInteraction` makes for the profile (THR-1433: one rule for
 * reading a mortal's mind). Null without a state or a person.
 */
export function buildPersonSheet(state: GameState, agentId: string, realmProjection: RealmProjection | null = null): PersonSheet | null {
  const node = state.graph.getNode(agentId);
  if (!node || node.type !== 'actor') return null;
  const level = personKnowledgeLevel(state, agentId);
  // A held town is a faction position (THR-1448). Without the runtime's political map the
  // standing still names the town and its grip; the Inspector in the game passes the map
  // so the Realm is named (THR-1911).
  const hold = createHoldReader(state.graph, state.strategicState?.controls, realmProjection).standingFor(agentId);
  const card = getAgentInfoCard(state.graph, agentId, state.ascendantId, level, state.seed, state.tick, hold);
  if (!card) return null;
  const read = canReadIntention(state, state.ascendantId, agentId, { knowledgeLevel: level });
  card.intentionRead = read;
  if (read.readable && card.primaryIntentSummary) {
    const heading = summarizeActiveUndertakings(state.strategicState, agentId)?.[0]?.displayName;
    card.intention = {
      ambition: card.primaryIntentSummary.displayName,
      ...(heading ? { heading } : {}),
      through: read.through,
      how: describeIntentionRead(read, card.name),
    };
  }
  const thread = state.graph.getOutgoingEdges(state.ascendantId, 'thread').find(e => e.target === agentId);
  const threadTier = typeof thread?.properties.tier === 'number' ? thread.properties.tier : thread ? 1 : 0;
  const store = state.agentKnowledge;
  const knowledge = store && typeof store.get === 'function' ? store.get(agentId) : undefined;
  return {
    card,
    profile: getAgentFullProfile(state.graph, agentId, state.ascendantId, level),
    state,
    level,
    ...(knowledge ? { knowledge } : {}),
    threadTier,
  };
}

// The composer hands every resolver of one page the same context object, so keying on it
// builds the card once per compose and can never serve a stale one (the graph is mutated
// in place — never key on graph identity).
const SHEETS = new WeakMap<SectionResolverContext, PersonSheet | null>();

function sheetOf(ctx: SectionResolverContext): PersonSheet | null {
  if (!ctx.state || ctx.pageKind !== 'actor') return null;
  if (SHEETS.has(ctx)) return SHEETS.get(ctx) ?? null;
  let sheet: PersonSheet | null = null;
  try {
    sheet = buildPersonSheet(ctx.state, ctx.nodeId, ctx.realmProjection ?? null);
  } catch {
    sheet = null;
  }
  SHEETS.set(ctx, sheet);
  return sheet;
}

// ─── The shared gates (moved from the profile tabs) ───────────────────────────

function atLeast(sheet: PersonSheet, minimum: KnowledgeLevel): boolean {
  return knowledgeAtLeast(sheet.card.knowledgeLevel, minimum);
}

/**
 * The ambitions a reader may see, in order, behind their gate — moved from
 * `JourneyTab.tsx` (`visibleJourneyIntents`, THR-1963) so the Journey tab, the thread
 * column's "What they want most" and the person rows read one gate. `knowledge` is the
 * per-agent interaction record a surface may hold; without it the knowledge level and
 * the one mind-reading rule (`readIntentionFromCard`, THR-1433) decide.
 */
export function visibleJourneyIntents(
  card: Pick<AgentInfoCardData, 'intents' | 'knowledgeLevel' | 'intentionRead'>,
  knowledge?: AgentKnowledge,
): ActiveIntent[] {
  const showAmbitions =
    (knowledge != null && knowledge.interactionDepth >= AMBITION_PRIMARY_INTERACTIONS)
    || readIntentionFromCard(card).readable;
  const showSecondary =
    (knowledge != null && knowledge.interactionDepth >= AMBITION_SECONDARY_INTERACTIONS)
    || knowledgeAtLeast(card.knowledgeLevel, 'intimate');
  if (!card.intents || card.intents.length === 0 || !showAmbitions) return [];
  return showSecondary ? card.intents : card.intents.filter(i => i.priority === 'primary');
}

/** The halts sentence: how close the work is to its fork, in words. Moved from `JourneyTab.tsx`. */
export function haltsSentence(u: Pick<ActiveUndertakingSummary, 'escalated' | 'halts'>): string {
  if (u.escalated) return 'Doubled down once already; another run of halts ends it.';
  if (u.halts <= 0) return 'Going as planned.';
  if (u.halts >= UNDERTAKING_HALT_RATCHET_N - 1) return 'Halted again and again — one more and they must choose.';
  return 'Halted once; pressing on.';
}

// ─── Section builders ─────────────────────────────────────────────────────────

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function prose(
  typeId: string,
  label: string,
  paragraphs: readonly (string | undefined | null)[],
  extra: Partial<ProseSection> = {},
): ProseSection | null {
  const kept = paragraphs.filter((p): p is string => typeof p === 'string' && p.trim().length > 0);
  if (kept.length === 0) return null;
  return {
    kind: 'prose',
    typeId,
    label,
    gold: false,
    tier: 'routine',
    source: `personRows.${typeId}`,
    prose: kept.map(escapeHtml).join('\n\n'),
    ...extra,
  };
}

function panel(typeId: string, label: string, rows: PanelRow[], extra: Partial<PanelSection> = {}): PanelSection | null {
  if (rows.length === 0) return null;
  return { kind: 'panel', typeId, label, gold: false, tier: 'routine', source: `personRows.${typeId}`, rows, ...extra };
}

function cards(typeId: string, label: string, tiles: CardTile[]): CardsSection | null {
  if (tiles.length === 0) return null;
  return { kind: 'cards', typeId, label, gold: false, tier: 'routine', source: `personRows.${typeId}`, tiles };
}

function chips(typeId: string, label: string, list: ChipDescriptor[]): ChipsSection | null {
  if (list.length === 0) return null;
  return { kind: 'chips', typeId, label, gold: false, tier: 'routine', source: `personRows.${typeId}`, chips: list };
}

/** A story list (the event-card shape's `entries`). An empty list says its empty line, or is skipped. */
function story(
  typeId: string,
  label: string,
  entries: EventEntry[],
  emptyLine: string | null,
  extra: Partial<EventCardSection> = {},
): EventCardSection | null {
  if (entries.length === 0 && !emptyLine) return null;
  return {
    kind: 'event-card',
    typeId,
    label,
    gold: false,
    tier: 'routine',
    source: `personRows.${typeId}`,
    whenLabel: '',
    prose: entries.length === 0 ? emptyLine ?? '' : '',
    entries,
    ...extra,
  };
}

/** "three days ago" — `elapsedLabel` with the preposition (never "N turns ago"). */
function agoWord(now: number, tick: number): string {
  return `${elapsedLabel(Math.max(0, now - tick))} ago`;
}

function sentenceCase(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function tierName(tier: unknown): string {
  return ATTACHMENT_TIER_NAMES[tier as AttachmentTier] ?? '';
}

/** THR-2023 — the debt's tooltip: what a debt is and how it ends. */
export const DEBT_TOOLTIP_ID = 'ui.debt_owed';

/**
 * THR-2097 — the page a carried thing opens through the router (Law 21): an artifact node
 * is an artifact, any other node an attachment. No node, no ref — never a dead link.
 */
function carriedRef(graph: GameState['graph'] | undefined, entry: AttachmentFullEntry): WorldRef | undefined {
  const node = graph?.getNode(entry.id);
  if (!node) return undefined;
  const kind = node.type === 'artifact' || node.type === 'artifact_legendary' ? 'artifact' : 'attachment';
  return { kind, id: node.id, name: entry.name };
}

/**
 * One attachment as a card tile — the profile's vignette. THR-2097 (rule R3): with a graph
 * the tile carries its art (bespoke plate, else the category plate, `getAttachmentArtUrl`)
 * and the ref that opens it; without one it stays words only.
 */
function attachmentTile(entry: AttachmentFullEntry, kindWord?: string, graph?: GameState['graph']): CardTile {
  const lines: string[] = [];
  const cls = entry.powerClass === 'spell' ? 'Spell' : entry.powerClass === 'bestowal' ? 'Bestowal' : entry.powerClass === 'innate' ? 'Innate' : '';
  if (entry.sealed) lines.push('Sealed — bound, and it will not answer');
  if (entry.sign && entry.sign !== 'blessing') {
    lines.push(`${entry.sign === 'seal' ? 'A sealing' : 'A cursing'}${entry.inflictedByName ? ` — ${entry.inflictedByName}'s doing` : " — someone's doing"}`);
  }
  if (entry.sign === 'blessing') lines.push(`A blessing${entry.inflictedByName ? ` — ${entry.inflictedByName} saw to it` : ''}`);
  if (entry.flavorText) lines.push(entry.flavorText);
  if (entry.counterpartyName) lines.push(agreementLine(entry, entry.counterpartyName));
  else if (entry.grantedBy) lines.push(entry.agreementType ? agreementLine(entry, entry.grantedBy) : `Granted by ${entry.grantedBy}`);
  if (entry.learnedFrom) lines.push(`Learned from ${entry.learnedFrom}`);
  if (entry.spellWords) {
    for (const [lead, text] of [
      ['Taught by', entry.spellWords.taughtBy],
      ['What it does', entry.spellWords.does],
      ['What it costs', entry.spellWords.costs],
      ['What goes wrong', entry.spellWords.wrong],
    ] as const) {
      if (text) lines.push(`${lead}: ${text}`);
    }
  }
  if (entry.active === false && entry.inactiveReason) lines.push(`Inactive: ${entry.inactiveReason}`);
  const timed = entry.ticksRemaining != null && entry.totalTicks != null && entry.totalTicks > 0;
  const art = graph ? getAttachmentArtUrl(entry.id, entry.subcategory) : null;
  const ref = carriedRef(graph, entry);
  return {
    ...(ref ? { ref } : {}),
    ...(art ? { image: { src: art, alt: entry.name } } : {}),
    title: entry.name,
    kindWord: kindWord ?? [cls, tierName(entry.tier)].filter(Boolean).join(' · '),
    ...(entry.agreementType === 'debt' ? { kindWordTooltipId: DEBT_TOOLTIP_ID } : {}),
    lines,
    ...(timed ? { meter: (entry.ticksRemaining as number) / (entry.totalTicks as number), durationWord: `${durationLabel(entry.ticksRemaining as number)} remaining` } : {}),
  };
}

function leaningWord(value01: number, virtue: string, vice: string): string {
  if (value01 > CORE_NEUTRAL + PERSON_LEAN_EPSILON) return virtue;
  if (value01 < CORE_NEUTRAL - PERSON_LEAN_EPSILON) return vice;
  return PERSON_FACT_WORDS.balanced;
}

// ─── Overview ─────────────────────────────────────────────────────────────────

const fate: SectionResolver = (ctx) => {
  const s = sheetOf(ctx);
  const death = s?.card.death;
  if (!death) return null;
  return prose('fate', PERSON_ROW_LABELS.fate, [
    death.by ? `${death.causeWord} — by ${death.by}` : death.causeWord,
    death.pastLine ? pastLineText(death.pastLine) : null,
  ]);
};

const storySoFar: SectionResolver = (ctx) => {
  const s = sheetOf(ctx);
  if (!s || s.threadTier === 0 || !s.state.digestBuffer) return null;
  const story = composeThreadStory(s.state.graph, ctx.nodeId, s.state.digestBuffer, s.state.tick);
  if (story.isEmpty) return null;
  return prose('story_so_far', PERSON_ROW_LABELS.storySoFar, [story.tensionLine, ...story.beatLines]);
};

const revealedNotices: SectionResolver = (ctx) => {
  const group = ctx.revealedNotices;
  if (!sheetOf(ctx) || !group || group.anchorId !== ctx.nodeId) return null;
  // The snapshot is newest first already (`buildRevealedNotices`); keep its order.
  return prose('revealed_notices', PERSON_ROW_LABELS.revealedNotices, group.lines.map(l => l.message));
};

const underYourHand: SectionResolver = (ctx) => {
  const s = sheetOf(ctx);
  if (!s) return null;
  return chips('under_your_hand', PERSON_ROW_LABELS.underYourHand, (s.card.activeEffects ?? []).map(effect => ({
    label: effect.label,
    sphere: effect.sphere,
    ...(effect.ticksRemaining != null ? { flavour: `${durationLabel(effect.ticksRemaining)} remaining` } : {}),
  })));
};

const intention: SectionResolver = (ctx) => {
  const intent = sheetOf(ctx)?.card.intention;
  if (!intent) return null;
  return prose('intention', PERSON_ROW_LABELS.intention, [
    `Set on ${intent.ambition}${intent.heading ? ` — ${intent.heading}` : ''}.`,
    intent.how,
  ], { labelTooltipId: `ui.intention.${intent.through}` });
};

const currentWork: SectionResolver = (ctx) => {
  const s = sheetOf(ctx);
  if (!s) return null;
  const work = summarizeActiveUndertakings(s.state.strategicState, ctx.nodeId)?.[0];
  if (!work) return null;
  return prose('current_work', PERSON_ROW_LABELS.currentWork, [`${work.displayName} — ${work.progressWord}.`], { labelTooltipId: 'ui.thread_work' });
};

const leadingAmbition: SectionResolver = (ctx) => {
  const s = sheetOf(ctx);
  const want = s ? visibleJourneyIntents(s.card, s.knowledge)[0] : undefined;
  if (!want) return null;
  // THR-2097 (rule R5): the page's one highlighted line — the ambition's own idea and name
  // as the headline, its authored flavour line under it. With no flavour line the headline
  // is the whole of it; the renderer does not say the name twice.
  const icon = iconForKey(ICON_CLASSES.ambition, want.category);
  return prose('leading_ambition', PERSON_ROW_LABELS.leadingAmbition, [want.flavorText ?? want.displayName], {
    labelTooltipId: 'ui.thread_want_most',
    icon,
    highlight: { icon, headline: want.displayName },
  });
};

/** A fact word drawn as a term, with its tooltip (Law 17). */
interface WhoFact {
  word: string;
  tooltipId?: string;
}

/** Everything Who they are can say — the same facts the retired panel listed (THR-2097). */
export interface WhoTheyAreFacts {
  archetype?: WhoFact;
  trade?: WhoFact;
  calling?: WhoFact;
  /** The wealth tier word (`getWealthTier`). */
  means?: keyof typeof WHO_THEY_ARE_MEANS;
  godMark?: { name: string; line: string };
  path?: WhoFact;
  /** Already a whole sentence (`riteSheetLine`). */
  rite?: string;
  knows?: readonly { id: string; name: string; lead?: string }[];
}

/**
 * Who they are as one or two sentences (THR-2097, rule R6; plan § S1.7). Pure: the facts in,
 * the sentence parts out. A missing fact drops its clause; a fact whose word is blank is
 * dropped too (Law 14), never printed as a key. Zero facts → null, and the row hides.
 */
export function composeWhoTheyAre(facts: WhoTheyAreFacts, name: string): { parts: SentencePart[]; text: string } | null {
  const parts: SentencePart[] = [];
  const word = (f: WhoFact | undefined) => (f && f.word.trim() ? f : undefined);
  /** Fill one clause template: `{x}` becomes the term, the rest plain text. */
  const clause = (template: string, x: SentencePart | null, extra: Record<string, string> = {}) => {
    const plain = (t: string) => t.replace(/\{(\w+)\}/g, (m, k: string) => (k === 'name' ? name : extra[k] ?? m));
    for (const piece of template.split(/(\{x\})/)) {
      if (piece === '{x}') {
        if (x) parts.push(x);
      } else if (piece) {
        parts.push(plain(piece));
      }
    }
  };
  const term = (f: WhoFact, lower = true): SentencePart => ({ text: lower ? f.word.toLowerCase() : f.word, ...(f.tooltipId ? { tooltipId: f.tooltipId } : {}) });

  const archetype = word(facts.archetype);
  const trade = word(facts.trade);
  const calling = word(facts.calling);
  if (archetype) clause(WHO_THEY_ARE_CLAUSES.archetype, term(archetype), { A: personArticle(archetype.word, true) });
  if (trade) clause(archetype ? WHO_THEY_ARE_CLAUSES.trade : WHO_THEY_ARE_CLAUSES.tradeOpener, term(trade), { a: personArticle(trade.word) });
  if (calling) {
    clause(parts.length > 0 ? WHO_THEY_ARE_CLAUSES.calling : WHO_THEY_ARE_CLAUSES.callingOpener, term(calling), { a: personArticle(calling.word) });
  } else if (parts.length > 0) {
    parts.push('.');
  }
  if (facts.means && WHO_THEY_ARE_MEANS[facts.means]) clause(WHO_THEY_ARE_CLAUSES.means, WHO_THEY_ARE_MEANS[facts.means]);
  if (facts.godMark && facts.godMark.name.trim()) {
    // The line runs on after the dash, so it opens lower case: "Heartfire — their resolve holds…".
    const raw = facts.godMark.line.trim();
    const line = raw.charAt(0).toLowerCase() + raw.slice(1);
    clause(WHO_THEY_ARE_CLAUSES.godMark, { text: facts.godMark.name }, { line: /[.!?]$/.test(line) ? line : `${line}.` });
  }
  const path = word(facts.path);
  if (path) clause(WHO_THEY_ARE_CLAUSES.path, term(path, false));
  if (facts.rite && facts.rite.trim()) clause(WHO_THEY_ARE_CLAUSES.rite, facts.rite.trim());
  for (const place of facts.knows ?? []) {
    if (!place.name.trim()) continue;
    const x: SentencePart = { text: place.name, ref: { kind: 'location', id: place.id, name: place.name } };
    if (place.lead) clause(WHO_THEY_ARE_CLAUSES.knowsTheWayToLead, x, { lead: place.lead });
    else clause(WHO_THEY_ARE_CLAUSES.knowsTheWayTo, x);
  }
  if (parts.length === 0) return null;
  // A sentence that opens on a later clause drops that clause's leading space.
  if (typeof parts[0] === 'string') parts[0] = parts[0].trimStart();
  const text = parts.map(p => (typeof p === 'string' ? p : p.text)).join('');
  return { parts, text };
}

const whoTheyAre: SectionResolver = (ctx) => {
  const s = sheetOf(ctx);
  if (!s) return null;
  const { card } = s;
  const recognised = atLeast(s, 'recognised');
  // THR-1988: the path the god chose at the bond, beside the mark it set. Ungated like the mark.
  const path = getFirstPathFor(s.state.graph, s.state.ascendantId, ctx.nodeId);
  const composed = composeWhoTheyAre({
    ...(recognised && card.archetypeLabel ? { archetype: { word: card.archetypeLabel, ...(card.archetypeId ? { tooltipId: `archetype.${card.archetypeId}` } : {}) } } : {}),
    // THR-1982: the trade the god met them in — between the archetype and the calling.
    ...(recognised && card.tradeWord ? { trade: { word: card.tradeWord, tooltipId: 'ui.trade' } } : {}),
    ...(recognised && card.calling ? { calling: { word: card.calling.title, tooltipId: 'ui.calling' } } : {}),
    ...(card.wealth != null ? { means: getWealthTier(card.wealth) } : {}),
    ...(card.godMark ? { godMark: { name: card.godMark.name, line: card.godMark.line } } : {}),
    ...(path ? { path: { word: path.title, tooltipId: `ui.first.path.${path.reach}` } } : {}),
    ...(card.riteLine ? { rite: card.riteLine } : {}),
    // A skill, not a relation (brainstorm § Field inventories): the place as a link.
    ...(card.knownPlaces && card.knownPlaces.length > 0 ? { knows: card.knownPlaces } : {}),
  }, card.name);
  if (!composed) return null;
  return {
    kind: 'prose',
    typeId: 'who_they_are',
    label: PERSON_ROW_LABELS.whoTheyAre,
    gold: false,
    tier: 'routine',
    source: 'personRows.who_they_are',
    prose: escapeHtml(composed.text),
    parts: composed.parts,
  };
};

const allegiance: SectionResolver = (ctx) => {
  const s = sheetOf(ctx);
  if (!s || !atLeast(s, 'recognised')) return null;
  const { card } = s;
  const rows: PanelRow[] = [];
  if (card.holdTownName) {
    rows.push({ left: PERSON_FACT_WORDS.keeps, right: card.holdTownName, ...(card.holdTownId ? { ref: { kind: 'location' as const, id: card.holdTownId, name: card.holdTownName } } : {}) });
    if (card.holdRealmName) {
      rows.push({ left: PERSON_FACT_WORDS.keepsFor, right: card.holdRealmName, ...(card.holdRealmNodeId ? { ref: { kind: 'faction' as const, id: card.holdRealmNodeId, name: card.holdRealmName } } : {}) });
    }
    if (card.holdGripWord) rows.push({ left: PERSON_FACT_WORDS.grip, right: card.holdGripWord, tooltipId: 'ui.hold' });
  }
  if (atLeast(s, 'known') && card.factionName && card.factionReputation != null) {
    rows.push({
      left: personLine(PERSON_FACT_WORDS.standingWith, { faction: card.factionName }),
      right: getReputationWord(card.factionReputation),
      meter: card.factionReputation,
    });
  }
  return panel('allegiance', PERSON_ROW_LABELS.allegiance, rows);
};

const company: SectionResolver = (ctx) => {
  const c = sheetOf(ctx)?.card.company;
  if (!c) return null;
  const where = c.memberLocations && c.memberLocations.length > 0
    ? `${c.sizeWord ?? 'a handful'} of people, in ${c.memberLocations.map(l => l.name).join(', ').replace(/, ([^,]*)$/, ' and $1')}.`
    : null;
  return prose('company', c.kindWord, [
    `${c.name}${c.role === 'leader' ? ' — they lead it' : ''}.`,
    COHESION_SENTENCE[c.cohesionState],
    where,
    c.rivals && c.rivals.length > 0 ? rivalsSentence(c.rivals) : null,
  ]);
};

const nature: SectionResolver = (ctx) => {
  const s = sheetOf(ctx);
  if (!s || (!s.knowledge && !atLeast(s, 'recognised'))) return null;
  const all = s.card.topValues ?? [];
  const byKnowledge = s.knowledge ? all.filter(v => s.knowledge?.revealedValues.has(v.pair)) : [];
  const byLevel = atLeast(s, 'recognised') ? all : [];
  const values = byLevel.length > byKnowledge.length ? byLevel : byKnowledge;
  if (values.length === 0) {
    return prose('nature', PERSON_ROW_LABELS.nature, [personLine(PERSON_EMPTY_LINES.natureHidden, { name: s.card.name })]);
  }
  // THR-2097 (rule R7): a trait list is chips; the first leads — "Loyal above all".
  return chips('nature', PERSON_ROW_LABELS.nature, values.map((v, i) => (
    i === 0 ? { label: personLine(NATURE_LEAD, { word: v.word }), lead: true } : { label: v.word }
  )));
};

const core: SectionResolver = (ctx) => {
  const profile = sheetOf(ctx)?.card.coreProfile;
  if (!profile) return null;
  return panel('core', PERSON_ROW_LABELS.core, CORE_CONTINUA.map(c => {
    const value = Math.max(0, Math.min(1, profile[c.continuumId as keyof typeof profile] ?? CORE_NEUTRAL));
    return { left: `${c.virtue.word} · ${c.vice.word}`, right: leaningWord(value, c.virtue.word, c.vice.word), meter: value, poles: [c.vice.word, c.virtue.word] as [string, string] };
  }));
};

const personality: SectionResolver = (ctx) => {
  const s = sheetOf(ctx);
  if (!s || !atLeast(s, 'intimate')) return null;
  const { card } = s;
  const byAxis = new Map<string, NonNullable<AgentInfoCardData['personalityContributors']>>();
  for (const c of card.personalityContributors ?? []) {
    const list = byAxis.get(c.axisId) ?? [];
    list.push(c);
    byAxis.set(c.axisId, list);
  }
  const rows: PanelRow[] = [];
  for (const axis of CANONICAL_AXES) {
    const signed = card.axiologicalProfile?.[axis.valuePair] ?? 0;
    if (Math.abs(signed) < PERSON_AXIS_SIGNAL_EPSILON && !byAxis.has(axis.axisId)) continue;
    const v = signedToCanonical01(signed);
    rows.push({ left: `${axis.virtue.word} · ${axis.vice.word}`, right: leaningWord(v, axis.virtue.word, axis.vice.word), meter: v, poles: [axis.vice.word, axis.virtue.word] });
    for (const c of byAxis.get(axis.axisId) ?? []) {
      rows.push({ left: c.source === 'origin' ? PERSON_FACT_WORDS.origin : PERSON_FACT_WORDS.mark, right: c.text });
    }
  }
  const becoming = (card.personalityTraits ?? []).map(t => t.name);
  if (becoming.length > 0) rows.push({ left: PERSON_FACT_WORDS.becoming, right: becoming.join(', ') });
  for (const trait of card.allTraits ?? []) rows.push({ left: '', right: trait });
  return panel('personality', PERSON_ROW_LABELS.personality, rows);
};

const reputation: SectionResolver = (ctx) => {
  const s = sheetOf(ctx);
  if (!s) return null;
  const revealed = (s.knowledge != null && s.knowledge.interactionDepth >= OVERVIEW_GOSSIP_THRESHOLD) || atLeast(s, 'known');
  const word = revealed ? s.card.reputationWord : undefined;
  const rows: PanelRow[] = [];
  // The profile's rule: the word when heard; the unheard line for anyone but a stranger.
  if (word) rows.push({ left: PERSON_FACT_WORDS.reputation, right: word, tooltipId: 'ui.reputation' });
  else if (s.card.knowledgeLevel !== 'stranger') {
    rows.push({ left: PERSON_FACT_WORDS.reputation, right: personLine(PERSON_EMPTY_LINES.reputationUnheard, { name: s.card.name }), tooltipId: 'ui.reputation' });
  }
  if (revealed) {
    for (const standing of getNotableStandings(s.state.graph, ctx.nodeId, PERSON_MAX_STANDINGS)) {
      const node = s.state.graph.getNode(standing.targetId);
      if (!node) continue;
      const kind = node.type === 'location' ? 'location' : node.properties.actorType === 'faction' ? 'faction' : 'agent';
      rows.push({ left: standing.band, right: node.name, ref: { kind, id: node.id, name: node.name }, tooltipId: 'ui.reputation_with' });
    }
  }
  return panel('reputation', PERSON_ROW_LABELS.reputation, rows);
};

const words: SectionResolver = (ctx) => {
  const s = sheetOf(ctx);
  const quotes = s?.card.quotes ?? [];
  if (!s || quotes.length === 0) return null;
  // The card gates the quotes by knowledge level; the profile shows every one it carries.
  return prose('words', PERSON_ROW_LABELS.words, quotes, { variant: 'quote' });
};

const origin: SectionResolver = (ctx) => {
  const s = sheetOf(ctx);
  if (!s) return null;
  const revealed = (s.knowledge != null && s.knowledge.interactionDepth >= OVERVIEW_BACKSTORY_INTERACTIONS) || atLeast(s, 'intimate');
  if (revealed && s.card.backstoryParagraph1) return prose('origin', PERSON_ROW_LABELS.origin, [s.card.backstoryParagraph1]);
  if (!revealed && atLeast(s, 'recognised')) return prose('origin', PERSON_ROW_LABELS.origin, [personLine(PERSON_EMPTY_LINES.originHidden, { name: s.card.name })]);
  return null;
};

// ─── Prowess ──────────────────────────────────────────────────────────────────

const domains: SectionResolver = (ctx) => {
  const s = sheetOf(ctx);
  if (!s) return null;
  const revealedDomain = (domain: string) => s.knowledge?.revealedDomains.has(domain) === true || atLeast(s, 'recognised');
  // The rank word per Reach; the magnitude dots go (Law 10: pips mean odds only).
  return cards('domains', PERSON_ROW_LABELS.domains, (s.card.domains ?? []).filter(d => revealedDomain(d.domain)).map(d => ({
    title: reachDisplayName(d.domain),
    kindWord: PERSON_FACT_WORDS.reach,
    lines: [d.word],
  })));
};

const HARM_SUBCATEGORIES = new Set(['wound', 'injury', 'disease', 'poison']);

const conditions: SectionResolver = (ctx) => {
  const s = sheetOf(ctx);
  if (!s) return null;
  const all = [
    ...(s.card.afflictions ?? []),
    ...(s.card.giftsAndBurdens ?? []).filter(g => HARM_SUBCATEGORIES.has(g.subcategory) || g.subcategory === 'blessing' || g.subcategory === 'curse'),
  ];
  const visible = all.filter(entry => {
    if (HARM_SUBCATEGORIES.has(entry.subcategory)) return true;
    if (entry.subcategory === 'blessing') return atLeast(s, 'known');
    if (entry.subcategory === 'curse') return s.knowledge?.revealedConditions.has(entry.id) === true || atLeast(s, 'intimate');
    return atLeast(s, 'recognised');
  });
  return cards('conditions', PERSON_ROW_LABELS.conditions, visible.map(e => attachmentTile(e)));
};

const bestowedPowers: SectionResolver = (ctx) => {
  const s = sheetOf(ctx);
  if (!s || !atLeast(s, 'recognised')) return null;
  const powers = (s.card.giftsAndBurdens ?? []).filter(g => g.subcategory === 'bestowed_power'
    && (s.knowledge?.revealedPowers.has(g.id) === true || atLeast(s, 'intimate')));
  return cards('bestowed_powers', PERSON_ROW_LABELS.bestowedPowers, powers.map(e => attachmentTile(e)));
};

// ─── Attachments ──────────────────────────────────────────────────────────────

/** Slot groups in the profile's order — holdings lead (THR-1297). Moved from `AttachmentsTab.tsx`. */
export const PERSON_SLOT_GROUP_ORDER: readonly string[] = [
  'holding',
  'quest',
  'weapon', 'vestment', 'ring', 'necklace', 'tome', 'spell',
  'consumable', 'utility', 'mount', 'ally', 'companion', 'wealth', 'brand',
  'wound', 'disease', 'curse', 'blessing', 'bestowed', 'innate_power',
  'agreement',
];

function carried(card: AgentInfoCardData): AttachmentFullEntry[] {
  const isPower = (g: AttachmentFullEntry) => g.powerClass !== undefined || g.subcategory === 'bestowed_power';
  return [
    ...(card.holdings ?? []),
    ...(card.possessions ?? []),
    ...(card.afflictions ?? []),
    ...(card.giftsAndBurdens ?? []).filter(isPower),
    ...(card.giftsAndBurdens ?? []).filter(g => !isPower(g)),
  ];
}

const slots: SectionResolver = (ctx) => {
  const s = sheetOf(ctx);
  if (!s) return null;
  const groups = new Map<string, AttachmentFullEntry[]>();
  for (const item of carried(s.card).filter(e => e.active !== false)) {
    const tag = item.slotTag ?? item.subcategory ?? 'uncategorized';
    groups.set(tag, [...(groups.get(tag) ?? []), item]);
  }
  const order = [...PERSON_SLOT_GROUP_ORDER, ...[...groups.keys()].filter(t => !PERSON_SLOT_GROUP_ORDER.includes(t))];
  const tiles: CardTile[] = [];
  for (const tag of order) {
    const items = groups.get(tag);
    if (!items || items.length === 0) continue;
    // The "(n/cap)" numeral retires (Law 13): the group's tiles sit together, so the count
    // is what the player sees, and the cap is a rule of the slot, not a fact about them.
    const name = SLOT_TAG_DISPLAY_NAMES[tag] ?? humanizeKeySegment(tag);
    for (const item of items) tiles.push(attachmentTile(item, `${name}${tierName(item.tier) ? ` · ${tierName(item.tier)}` : ''}`, s.state.graph));
  }
  // THR-2097: the gallery label carries its count — "What they carry · 4" (rule R3).
  return cards('slots', personLine(PERSON_COUNTED_LABEL, { label: PERSON_ROW_LABELS.slots, n: String(tiles.length) }), tiles);
};

const knows: SectionResolver = (ctx) => {
  const spells = sheetOf(ctx)?.card.knownSpells ?? [];
  return panel('knows', PERSON_ROW_LABELS.knows, spells.map(spell => ({
    left: spell.name,
    right: [spell.tradition, spell.grantedBy ? `granted by ${spell.grantedBy}` : spell.learnedFrom ? `learned from ${spell.learnedFrom}` : null].filter(Boolean).join(' · '),
  })));
};

const inactive: SectionResolver = (ctx) => {
  const s = sheetOf(ctx);
  if (!s) return null;
  return cards('inactive', PERSON_ROW_LABELS.inactive, carried(s.card).filter(e => e.active === false).map(e => attachmentTile(e)));
};

// ─── Bonds ────────────────────────────────────────────────────────────────────

const disposition: SectionResolver = (ctx) => {
  const s = sheetOf(ctx);
  if (!s || !s.card.cooperationStrategy) return null;
  if (!(s.knowledge?.dispositionRevealed === true || atLeast(s, 'intimate'))) return null;
  const rows: PanelRow[] = [{
    left: PERSON_FACT_WORDS.strategy,
    right: DISPOSITION_LABEL_MAP[s.card.cooperationStrategy] ?? sentenceCase(humanizeKeySegment(s.card.cooperationStrategy)),
  }];
  if (s.card.reputationWord) rows.push({ left: PERSON_FACT_WORDS.reputation, right: s.card.reputationWord, tooltipId: 'ui.reputation' });
  return panel('disposition', PERSON_ROW_LABELS.disposition, rows);
};

/**
 * Blood (THR-1992): BondsTab's Blood section, restored — one line per standing grudge,
 * the other party's name a link (Law 21). `card.grudges` is set only when blood exists,
 * so a mortal who has wronged nobody gets no row at all (Law 25).
 *
 * THR-2072 — then one line per faction with an open price on their head, the faction's
 * name verbatim as a link: "The Adventurers Guild has put a price on their head."
 * `card.bountiesOn` is set only while a bounty is open (Law 56).
 */
const blood: SectionResolver = (ctx) => {
  const s = sheetOf(ctx);
  const grudges = s?.card.grudges ?? [];
  const bounties = s?.card.bountiesOn ?? [];
  if (grudges.length === 0 && bounties.length === 0) return null;
  const parts: ProsePart[] = [];
  grudges.forEach((g, i) => {
    if (i > 0) parts.push('\n\n');
    parts.push(BLOOD_LINE.lead, { text: g.targetName, ref: { kind: 'agent', id: g.targetId } }, `${BLOOD_LINE.joiner}${g.causeClause}${BLOOD_LINE.tail}`);
  });
  bounties.forEach((b, i) => {
    if (grudges.length > 0 || i > 0) parts.push('\n\n');
    if (BOUNTY_BLOOD_LINE.lead) parts.push(BOUNTY_BLOOD_LINE.lead);
    parts.push({ text: b.factionName, ref: { kind: 'faction', id: b.factionId } }, BOUNTY_BLOOD_LINE.tail);
  });
  return linkedProseSection('blood', PERSON_ROW_LABELS.blood, parts, 'personRows.blood');
};

// ─── Journey ──────────────────────────────────────────────────────────────────

const theWork: SectionResolver = (ctx) => {
  const s = sheetOf(ctx);
  if (!s) return null;
  const works = summarizeActiveUndertakings(s.state.strategicState, ctx.nodeId) ?? [];
  if (works.length === 0) return prose('the_work', PERSON_ROW_LABELS.theWork, [PERSON_EMPTY_LINES.noWork]);
  return cards('the_work', PERSON_ROW_LABELS.theWork, works.map(u => ({
    title: u.displayName,
    kindWord: PERSON_FACT_WORDS.work,
    lines: [u.progressWord, ...(u.lastBand ? [stepOutcomeWord(u.lastBand)] : []), haltsSentence(u)],
  })));
};

const designs: SectionResolver = (ctx) => {
  const s = sheetOf(ctx);
  if (!s) return null;
  const summary = getAgentStrategicSummary(s.state.strategicState, ctx.nodeId, s.state.graph, s.state.tick);
  const rows: PanelRow[] = [];
  if (summary?.activeProject) rows.push({ left: summary.activeProject.displayName, right: summary.activeProject.word });
  if (summary?.primaryControl) rows.push({ left: summary.primaryControl.targetName, right: summary.primaryControl.healthLabel });
  for (const entry of getAgentStrategicHistory(s.state.strategicState, ctx.nodeId, s.state.tick).slice(0, PERSON_DESIGNS_HISTORY_MAX)) {
    rows.push({ left: entry.displayName, right: DESIGN_OUTCOME_WORD[entry.outcome], sentiment: entry.outcome === 'completed' ? 'positive' : entry.outcome === 'failed' ? 'negative' : 'neutral' });
  }
  return panel('designs', PERSON_ROW_LABELS.designs, rows);
};

const ambitions: SectionResolver = (ctx) => {
  const s = sheetOf(ctx);
  if (!s) return null;
  const intents = visibleJourneyIntents(s.card, s.knowledge);
  if (intents.length === 0) return prose('ambitions', PERSON_ROW_LABELS.ambitions, [personLine(PERSON_EMPTY_LINES.ambitionsHidden, { name: s.card.name })]);
  return cards('ambitions', PERSON_ROW_LABELS.ambitions, intents.map(i => ({
    title: i.displayName,
    // The raw priority key, worded at the source.
    kindWord: i.priority === 'primary' ? PERSON_FACT_WORDS.primaryAmbition : PERSON_FACT_WORDS.secondaryAmbition,
    lines: [
      ...(i.flavorText ? [i.flavorText] : []),
      ...(i.mintedByLabel ? [`Born of ${i.mintedByLabel}`] : []),
      ...(i.grievance ? [`Against ${i.grievance.culpritName ?? 'someone unnamed'} — ${i.grievance.heatWord}`] : []),
    ],
  })));
};

const arcSoFar: SectionResolver = (ctx) => {
  const s = sheetOf(ctx);
  if (!s) return null;
  const arc = getAgentArc(s.state, s.state.graph, ctx.nodeId);
  return story('arc_so_far', PERSON_ROW_LABELS.arcSoFar, arc.map(e => ({ whenLabel: e.when, prose: e.line })), PERSON_EMPTY_LINES.arcEmpty, { labelTooltipId: 'ui.arc_strip' });
};

// ─── Chronicle ────────────────────────────────────────────────────────────────

const theirStory: SectionResolver = (ctx) => {
  const s = sheetOf(ctx);
  if (!s) return null;
  const { card } = s;
  const strata = card.backstory?.strata ?? [];
  if (strata.length === 0) {
    return card.influenceTier === 0 ? prose('their_story', PERSON_ROW_LABELS.theirStory, [personLine(PERSON_EMPTY_LINES.storyTooThin, { name: card.name })]) : null;
  }
  const locked = ([2, 3, 4] as const).filter(t => t > (card.backstory?.maxStratum ?? 4)).map(t => personLine(LOCKED_STRATUM_TEXT[t], { name: card.name }));
  return prose('their_story', PERSON_ROW_LABELS.theirStory, [
    ...strata.flatMap(st => [`${st.title} — ${st.subtitle}`, ...st.text.split('\n\n')]),
    ...locked,
  ]);
};

const timeline: SectionResolver = (ctx) => {
  const s = sheetOf(ctx);
  const all = s?.profile?.historyTimeline ?? [];
  const events = s?.knowledge ? all.filter(e => s.knowledge?.knownEvents.has(String(e.tick))) : all;
  if (!s || events.length === 0) return null;
  return story('timeline', PERSON_ROW_LABELS.timeline, [...events].reverse().map(e => ({ whenLabel: agoWord(s.state.tick, e.tick), prose: e.event })), null);
};

const fullAccount: SectionResolver = (ctx) => {
  const s = sheetOf(ctx);
  if (!s || s.card.knowledgeLevel !== 'transparent' || !s.profile?.fullBackstory) return null;
  return prose('full_account', PERSON_ROW_LABELS.fullAccount, s.profile.fullBackstory.split('\n\n'));
};

const interactionRecord: SectionResolver = (ctx) => {
  const s = sheetOf(ctx);
  const records = s?.profile?.dispositionRecord ?? [];
  if (!s || s.card.knowledgeLevel !== 'transparent' || records.length === 0) return null;
  // Raw move keys worded at the source.
  return story('interaction_record', PERSON_ROW_LABELS.interactionRecord, records.map(r => ({
    whenLabel: agoWord(s.state.tick, r.tick),
    prose: `${humanizeKeySegment(String(r.actorMove))} → ${humanizeKeySegment(String(r.targetMove))}`,
  })), null);
};

const completedAmbitions: SectionResolver = (ctx) => {
  const s = sheetOf(ctx);
  if (!s) return null;
  const readable = (s.knowledge != null && s.knowledge.interactionDepth >= AMBITION_PRIMARY_INTERACTIONS) || readIntentionFromCard(s.card).readable;
  const done = readable ? s.card.completedAmbitions ?? [] : [];
  return story('completed_ambitions', PERSON_ROW_LABELS.completedAmbitions, done.map(a => ({
    whenLabel: a.resolvedTick != null ? agoWord(s.state.tick, a.resolvedTick) : '',
    prose: a.name,
  })), personLine(readable ? PERSON_EMPTY_LINES.completedNone : PERSON_EMPTY_LINES.completedHidden, { name: s.card.name }));
};

const TARGET_KIND_WORD: Record<'agent' | 'location' | 'region' | 'unknown', string> = {
  agent: 'a person',
  location: 'a place',
  region: 'an area',
  unknown: '',
};

const intelligence: SectionResolver = (ctx) => {
  const s = sheetOf(ctx);
  if (!s) return null;
  // The fog rule: a stranger's knowledge is not the god's to read (`INTEL_PANEL_FOG_MIN_TIER`).
  if (s.threadTier < INTEL_PANEL_FOG_MIN_TIER && s.card.knowledgeLevel !== 'transparent') return null;
  const entries = buildIntelligenceDisplay(s.state.intelligenceRecords, ctx.nodeId, s.state.graph, s.state.tick);
  return cards('intelligence', PERSON_ROW_LABELS.intelligence, entries.map(e => ({
    title: e.label,
    kindWord: e.categoryLabel,
    lines: [
      e.detail,
      // "(targetKind)" worded.
      ...(e.targetDisplayName ? [`About ${e.targetDisplayName}${TARGET_KIND_WORD[e.targetKind] ? `, ${TARGET_KIND_WORD[e.targetKind]}` : ''}`] : []),
      `${RELIABILITY_WORD[e.reliabilityDescriptor]} · ${agoWord(s.state.tick, e.acquiredTick)}`,
    ].filter(Boolean),
  })));
};

// ─── Chapters ─────────────────────────────────────────────────────────────────

const chapters: SectionResolver = (ctx) => {
  const s = sheetOf(ctx);
  if (!s) return null;
  const id = ctx.nodeId;
  const now = s.state.tick;
  const entries: EventEntry[] = [];
  for (const a of s.state.unifiedActions ?? []) {
    if (a.resolved || !isEncounterAction(a.templateId) || isRoutineTemplate(a.templateId)) continue;
    if (a.actorId !== id && !(a.supportBindings ?? []).some(b => b.nodeId === id)) continue;
    // "active · step N" becomes the chapter's word.
    entries.push({ whenLabel: CHAPTER_UNDER_WAY, prose: getChapterTemplateName(a.templateId) });
  }
  const archived = (s.state.chapterArchive ?? [])
    .filter(r => !isRoutineChapter(r) && (r.actorId === id || r.participants.some(p => p.id === id)))
    .sort((a, b) => b.resolvedTick - a.resolvedTick);
  for (const r of archived) {
    const phrase = outcomePhrase(r.outcome);
    entries.push({
      whenLabel: agoWord(now, r.resolvedTick),
      prose: `${r.templateName}${phrase ? ` — ${phrase}` : ''}${r.stakesLine ? `. ${r.stakesLine}` : ''}`,
    });
  }
  return story('chapters', PERSON_ROW_LABELS.chapters, entries, PERSON_EMPTY_LINES.chaptersNone);
};

/** The S2a person rows, by `typeId` — the page-layout table's `actor` rows read these. */
export const PERSON_RESOLVERS = {
  fate,
  story_so_far: storySoFar,
  revealed_notices: revealedNotices,
  under_your_hand: underYourHand,
  intention,
  current_work: currentWork,
  leading_ambition: leadingAmbition,
  who_they_are: whoTheyAre,
  allegiance,
  company,
  nature,
  core,
  personality,
  reputation,
  words,
  origin,
  domains,
  conditions,
  bestowed_powers: bestowedPowers,
  slots,
  knows,
  inactive,
  disposition,
  blood,
  the_work: theWork,
  designs,
  ambitions,
  arc_so_far: arcSoFar,
  their_story: theirStory,
  timeline,
  full_account: fullAccount,
  interaction_record: interactionRecord,
  completed_ambitions: completedAmbitions,
  intelligence,
  chapters,
} satisfies Record<string, SectionResolver>;
