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
import type { LoyaltyReason, OathKind, SwornToEdgeProperties } from './types';
import { getReputationWord } from '../../data/domain-words';
import { FEALTY_LIST_FOLD } from '../../data/crown-constants';
import { PURSE_CYCLE_TICKS } from '../../data/faction-purse-constants';
import { crownRulerOf, isCrown, oathOf, oathsTo, readOath } from './crownView';

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

/** "won by protection" · "bought with silver" · "forced by siege" (the vassal line). */
export function kindPhrase(kind: OathKind, forcedBy?: 'siege' | 'conquest'): string {
  if (kind === 'bought') return 'bought with silver';
  if (kind === 'coerced') return forcedBy === 'conquest' ? 'forced by conquest' : 'forced by siege';
  return 'won by protection';
}

/** "it swore under siege" · "it was bought with silver" · "it swore for protection" (the standing line). */
function kindClause(kind: OathKind, forcedBy?: 'siege' | 'conquest'): string {
  if (kind === 'bought') return 'it was bought with silver';
  if (kind === 'coerced') return forcedBy === 'conquest' ? 'it swore after losing a town to its liege' : 'it swore under siege';
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
    vassal = {
      liegeId: mine.target,
      oath: ['Owes fealty to ', factionPart(graph, mine.target), ` for ${durationWords(days)}, ${kindPhrase(p.kind, p.forcedBy)}.`],
      standing: { ...s, rest: `${kindClause(p.kind, p.forcedBy)}, ${trendClause(p)}.` },
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
