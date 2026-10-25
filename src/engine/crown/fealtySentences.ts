/**
 * The crown — the faction sheet's words (THR-1932 § Player-facing display). Pure.
 *
 * Composed from the `sworn_to` edges the crown wrote, never recomputed, so the Crown
 * chip, the Fealty section, the Purse sentence and the chronicle read one state
 * (Law 56). Words only: no loyalty figure, tax or gift amount, no day count (Laws 13/14).
 * Names come back as parts carrying a ref, so the component routes them (Law 21).
 *
 * Never *king*, *queen*, *kingdom* or *sworn* (a court-ladder rung) on these surfaces.
 */

import type { WorldGraph } from '../graph';
import type { PursePart } from '../factionPurse/purseSentences';
import { durationWords } from '../factionPurse/purseSentences';
import type { LoyaltyReason, OathForcedBy, OathKind, SwornToEdgeProperties } from './types';
import { getReputationWord } from '../../data/domain-words';
import { FEALTY_LIST_FOLD } from '../../data/crown-constants';
import { PURSE_CYCLE_TICKS } from '../../data/faction-purse-constants';
import { crownRulerOf, isCrown, oathOf, oathsTo, readOath } from './crownView';
import { readPurseDay } from '../factionPurse';
import { FEALTY_WAGE_LINES } from '../../data/army-words';

/** A run of sentence text, or a name the UI renders as a link (a faction or the ruler). */
export type FealtyPart =
  | string
  | { text: string; ref: { kind: 'faction' | 'agent'; id: string } };

const COUNT_WORDS = [
  'no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen',
  'nineteen', 'twenty',
];

/** A count in words ("nine"); past twenty, "many". */
export function countWords(n: number): string {
  return COUNT_WORDS[n] ?? 'many';
}

function factionPart(graph: WorldGraph, id: string): { text: string; ref: { kind: 'faction'; id: string } } {
  return { text: graph.getNode(id)?.name ?? 'a faction', ref: { kind: 'faction', id } };
}

/** "won by protection" · "bought with silver" · "forced by siege" · "forced by a demand" (the vassal line). */
export function kindPhrase(kind: OathKind, forcedBy?: OathForcedBy): string {
  if (kind === 'bought') return 'bought with silver';
  if (kind === 'coerced') {
    if (forcedBy === 'conquest') return 'forced by conquest';
    return forcedBy === 'demand' ? 'forced by a demand' : 'forced by siege';
  }
  return 'won by protection';
}

/**
 * THR-1944 — the vassal line's tail when a mortal brokered the oath, the mortal a linked
 * name: "won by <broker>'s word." · "forced by <broker>'s demand." Null for a courted oath
 * or a broker no longer in the graph (the plain kind phrase reads instead).
 */
export function brokeredPhrase(
  graph: WorldGraph,
  props: Pick<SwornToEdgeProperties, 'kind' | 'brokeredBy'>,
): FealtyPart[] | null {
  const id = props.brokeredBy;
  const name = id ? graph.getNode(id)?.name : undefined;
  if (!id || typeof name !== 'string' || name.length === 0) return null;
  const coerced = props.kind === 'coerced';
  return [coerced ? 'forced by ' : 'won by ', { text: name, ref: { kind: 'agent', id } }, coerced ? '\'s demand.' : '\'s word.'];
}

/** "it swore under siege" · "it was bought with silver" · "it swore for protection" (the standing line). */
function kindClause(kind: OathKind, forcedBy?: OathForcedBy): string {
  if (kind === 'bought') return 'it was bought with silver';
  if (kind === 'coerced') {
    if (forcedBy === 'conquest') return 'it swore after losing a town to its liege';
    return forcedBy === 'demand' ? 'it swore because it was made to' : 'it swore under siege';
  }
  return 'it swore for protection';
}

const REASON_CLAUSE: Readonly<Record<LoyaltyReason, string>> = {
  liege_wealthy: 'its liege is rich',
  liege_strained: 'its liege barely pays its way',
  liege_destitute: 'its liege cannot pay its soldiers',
  holding_lost: 'it lost a town under its liege\'s banner',
  outgrown: 'it now earns more than its liege',
  rival_offer: 'another realm courts it with a better offer',
};

/** "rising because its liege is rich" · "falling because …" · "holding steady". */
export function trendClause(props: SwornToEdgeProperties): string {
  const deltas = props.lastLoyaltyDay?.deltas ?? [];
  const sum = deltas.reduce((s, d) => s + d.amount, 0);
  if (deltas.length === 0 || Math.abs(sum) < 1e-9) return 'and its loyalty holds steady';
  const sign = Math.sign(sum);
  const lead = deltas
    .filter(d => Math.sign(d.amount) === sign)
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))[0];
  const why = lead ? ` because ${REASON_CLAUSE[lead.reason]}` : '';
  return `and its loyalty is ${sign > 0 ? 'rising' : 'falling'}${why}`;
}

/** The standing word, and whether it is the band just above the break. */
export function standingWord(loyalty: number): { word: string; oneStepFromBreaking: boolean } {
  const word = getReputationWord(loyalty);
  return { word, oneStepFromBreaking: word === 'Unknown' };
}

export interface VassalView {
  liegeId: string;
  /** "Owes fealty to <liege> for a fortnight, bought with silver." */
  oath: FealtyPart[];
  standing: { word: string; oneStepFromBreaking: boolean; rest: string };
  /**
   * THR-1974 — "Its liege pays its soldiers." (or the partial line), from today's purse
   * day; null when its liege paid none of its soldiers today (Laws 45, 56).
   */
  wages: string | null;
}

export interface LiegeView {
  vassals: { id: string; part: FealtyPart; word: string }[];
  /** How many past FEALTY_LIST_FOLD, spelled out ("three"), or null when none fold. */
  moreWords: string | null;
}

export interface CrownLineView {
  ruler: FealtyPart | null;
  /** "nine factions owe it fealty." */
  count: string;
}

export interface FealtyView {
  crown: CrownLineView | null;
  vassal: VassalView | null;
  liege: LiegeView | null;
}

/** Everything the sheet renders for the crown, in one call (the view-model seam, NFP #2). */
export function fealtyView(graph: WorldGraph, factionId: string): FealtyView {
  let crown: CrownLineView | null = null;
  let vassal: VassalView | null = null;
  let liege: LiegeView | null = null;

  const toMe = oathsTo(graph, factionId);
  if (isCrown(graph, factionId)) {
    const rulerId = crownRulerOf(graph, factionId);
    const ruler = rulerId && graph.getNode(rulerId)
      ? ({ text: graph.getNode(rulerId)!.name ?? 'its ruler', ref: { kind: 'agent', id: rulerId } } as FealtyPart)
      : null;
    const n = toMe.length;
    crown = { ruler, count: `${countWords(n)} faction${n === 1 ? '' : 's'} owe${n === 1 ? 's' : ''} it fealty.` };
  }

  const mine = oathOf(graph, factionId);
  if (mine) {
    const p = readOath(mine);
    const days = Math.max(0, ((p.lastPassTick ?? p.swornTick) - p.swornTick) / PURSE_CYCLE_TICKS);
    const s = standingWord(p.loyalty ?? 0);
    const brokered = brokeredPhrase(graph, p);
    vassal = {
      liegeId: mine.target,
      oath: [
        'Owes fealty to ', factionPart(graph, mine.target),
        ...(brokered
          ? [` for ${durationWords(days)}, `, ...brokered]
          : [` for ${durationWords(days)}, ${kindPhrase(p.kind, p.forcedBy)}.`]),
      ],
      standing: { ...s, rest: `${kindClause(p.kind, p.forcedBy)}, ${trendClause(p)}.` },
      wages: vassalWagesLine(readPurseDay(graph.getNode(factionId))),
    };
  }

  if (toMe.length > 0) {
    const all = toMe
      .map(e => ({ id: e.source, part: factionPart(graph, e.source), word: getReputationWord(readOath(e).loyalty ?? 0) }))
      .sort((a, b) => (a.id < b.id ? -1 : 1));
    const extra = all.length - FEALTY_LIST_FOLD;
    liege = { vassals: all, moreWords: extra > 0 ? countWords(extra) : null };
  }

  return { crown, vassal, liege };
}

/** The Purse panel's fealty sentence, or null when it paid none today. */
export function fealtyPurseSentence(graph: WorldGraph, day: { fealtyOut?: number; fealtyTo?: string | null } | null): PursePart[] | null {
  if (!day || !(typeof day.fealtyOut === 'number' && day.fealtyOut > 0) || !day.fealtyTo) return null;
  if (!graph.getNode(day.fealtyTo)) return null;
  return ['It pays a share of all it earns to ', factionPart(graph, day.fealtyTo), '.'];
}

/**
 * THR-1974 — the vassal's wage clause: its liege paid some or all of the soldiers it
 * could not pay today. Null when it paid none (nothing renders empty, Law 56).
 */
export function vassalWagesLine(
  day: { wagesFromLiege?: number; armiesUnpaid?: string[]; armiesPaidByLiege?: string[] } | null,
): string | null {
  if (!day || !(typeof day.wagesFromLiege === 'number' && day.wagesFromLiege > 0)) return null;
  const paid = new Set(day.armiesPaidByLiege ?? []);
  const rest = (day.armiesUnpaid ?? []).filter(id => !paid.has(id));
  return rest.length > 0 ? FEALTY_WAGE_LINES.partial : FEALTY_WAGE_LINES.all;
}

/**
 * THR-1974 — the liege's Purse sentence: "It pays the soldiers of <vassal>." (" and one
 * other" past the first, counts spelled out). Read from the vassals' purse days, so it
 * says only what was paid today; null when this faction paid no wages. An unnamed vassal
 * is never named: the sentence is omitted rather than rendered with a blank (PC-3).
 */
export function wagesPurseSentence(graph: WorldGraph, factionId: string): PursePart[] | null {
  const day = readPurseDay(graph.getNode(factionId));
  if (!day || !(typeof day.wagesToVassals === 'number' && day.wagesToVassals > 0)) return null;
  const paid = oathsTo(graph, factionId)
    .map(e => e.source)
    .filter(id => {
      const d = readPurseDay(graph.getNode(id));
      return !!d && d.tick === day.tick && typeof d.wagesFromLiege === 'number' && d.wagesFromLiege > 0;
    })
    .sort();
  const first = paid.find(id => typeof graph.getNode(id)?.name === 'string');
  if (!first) return null;
  const others = paid.length - 1;
  const tail = others > 0 ? ` and ${countWords(others)} other${others === 1 ? '' : 's'}.` : '.';
  return [FEALTY_WAGE_LINES.purseLead, factionPart(graph, first), tail];
}
