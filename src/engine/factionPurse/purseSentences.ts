/**
 * The faction purse — the Purse panel's words (THR-1931 § Player-facing text). Pure.
 *
 * Composed from the `PurseDay` the phase wrote, never recomputed, so the chip, the
 * sentences and the chronicle read one state (Law 56). Words only: no amount, price or
 * id ever reaches the sheet (Laws 13/14). Names come back as parts carrying a ref, so
 * the component routes them through the ref router (Law 21).
 */

import type { WorldGraph } from '../graph';
import type { GraphNode } from '../../types/graph';
import type { PurseSourceKind } from './income';
import { isSettlement } from './income';
import { readResources } from '../resourceEconomy';
import { ARMY_UPKEEP_PER_DAY } from '../../data/faction-purse-constants';
import type { ArmySizeCategory } from '../../types/army';
import { readRegionalMonopolies } from '../regionalMonopoly';
import { MONOPOLY_WORDS, fillMonopolyWords } from '../../data/regional-monopoly-words';

/** A run of sentence text, or a name the UI renders as a link. */
export type PursePart =
  | string
  | { text: string; ref: { kind: 'location' | 'sublocation' | 'faction'; id: string } };

/** The slice of `PurseDay` the words need — kept structural so the UI passes the stored record. */
export interface PurseDayWords {
  topSources: { kind: PurseSourceKind; nodeId: string }[];
  paysTo: string | null;
  armiesPaid: string[];
  armiesUnpaid: string[];
  /** THR-1974 — the unpaid armies its liege paid today (`crown` wage step). */
  armiesPaidByLiege?: string[];
  taxHolderOf?: string[];
  paidBy?: string[];
}

function nameOf(n: GraphNode | undefined, fallback: string): string {
  return n?.name ?? fallback;
}

function placeRef(graph: WorldGraph, id: string): PursePart {
  const n = graph.getNode(id);
  const kind = n && typeof n.properties.parentLocationId === 'string' ? 'sublocation' : 'location';
  return { text: nameOf(n, 'a holding'), ref: { kind, id } };
}

/** A resource id as the player reads it ("grain", "iron ore"). */
export function resourceWord(id: string): string {
  return id.replace(/[_-]+/g, ' ');
}

/** The good a place has most of, or null. */
export function largestGood(place: GraphNode | undefined): string | null {
  if (!place) return null;
  let best: string | null = null;
  let bestQ = 0;
  for (const [rid, r] of Object.entries(readResources(place.properties))) {
    const q = typeof (r as { quantity?: unknown }).quantity === 'number' ? (r as { quantity: number }).quantity : 0;
    if (q > bestQ) { bestQ = q; best = rid; }
  }
  return best;
}

function settlementWord(n: GraphNode): string {
  const sub = String(n.properties.locationSubtype ?? 'town');
  return sub === 'capital' ? 'city' : sub;
}

/** One income source as a phrase: "the town of Millbrook", "the salt of Saltmarch Hold", "its lands". */
export function sourcePhrase(graph: WorldGraph, kind: PurseSourceKind, nodeId: string): PursePart[] {
  switch (kind) {
    case 'land':
      return ['its lands'];
    case 'town': {
      const n = graph.getNode(nodeId);
      return n && isSettlement(n) ? [`the ${settlementWord(n)} of `, placeRef(graph, nodeId)] : [placeRef(graph, nodeId)];
    }
    case 'place': {
      const good = largestGood(graph.getNode(nodeId));
      return good ? [`the ${resourceWord(good)} of `, placeRef(graph, nodeId)] : [placeRef(graph, nodeId)];
    }
    case 'guild':
      return ['its work in ', placeRef(graph, nodeId)];
    case 'lane': {
      const edge = graph.getAllEdges().find(e => e.id === nodeId);
      if (!edge) return ['the toll on a road'];
      return ['the toll on the road between ', placeRef(graph, edge.source), ' and ', placeRef(graph, edge.target)];
    }
    default:
      return ['what it holds'];
  }
}

/** "Most of its coin comes from X and Y. A share goes to Z." */
export function incomeSentence(graph: WorldGraph, day: PurseDayWords | null): PursePart[] {
  // No pay day yet (the opening purse only): say nothing rather than claim no income.
  if (!day) return [];
  if (day.topSources.length === 0) return ['It has no income of its own.'];
  const [a, b] = day.topSources;
  const parts: PursePart[] = ['Most of its coin comes from ', ...sourcePhrase(graph, a.kind, a.nodeId)];
  if (b) parts.push(' and ', ...sourcePhrase(graph, b.kind, b.nodeId));
  parts.push('.');
  if (day.paysTo && graph.getNode(day.paysTo)) {
    parts.push(' A share goes to ', { text: nameOf(graph.getNode(day.paysTo), 'its overlord'), ref: { kind: 'faction', id: day.paysTo } }, '.');
  }
  return parts;
}

const COUNT_WORDS = ['no', 'one', 'two', 'three', 'four', 'five'];

function armyListWords(sizes: readonly ArmySizeCategory[]): string {
  const counts = new Map<ArmySizeCategory, number>();
  for (const s of sizes) counts.set(s, (counts.get(s) ?? 0) + 1);
  const order: ArmySizeCategory[] = ['host', 'regiment', 'warband'];
  const phrases = order.filter(s => counts.has(s)).map(s => {
    const n = counts.get(s)!;
    return n === 1 ? `one ${s}` : `${COUNT_WORDS[n] ?? 'several'} ${s}s`;
  });
  return phrases.length <= 1 ? (phrases[0] ?? '') : `${phrases.slice(0, -1).join(', ')} and ${phrases[phrases.length - 1]}`;
}

/** How long the purse keeps its soldiers, in words. */
export function durationWords(days: number): string {
  if (days < 5) return 'a few days';
  if (days < 15) return 'a fortnight';
  if (days < 40) return 'a month';
  return 'a season and more';
}

export const PURSE_BROKE_LINE = 'Its purse cannot pay its soldiers. They go unpaid and begin to slip away.';
/**
 * THR-1974 — every army its purse could not pay, its liege paid: true, and not the broke
 * line. Who pays them is the Fealty section's sentence (one fact, one sentence per page).
 */
export const PURSE_LIEGE_COVERS_LINE = 'Its own purse cannot pay its soldiers.';

/** THR-1974 — the armies still unpaid today once its liege's wages are counted. */
export function stillUnpaid(day: PurseDayWords | null): string[] {
  if (!day) return [];
  const byLiege = new Set(day.armiesPaidByLiege ?? []);
  return day.armiesUnpaid.filter(id => !byLiege.has(id));
}

/** "It pays for one warband, and has coin to spare for a month of it." · "It keeps no soldiers." · the broke line. */
export function spendingSentence(graph: WorldGraph, day: PurseDayWords | null, wealth: number): string {
  if (!day) return 'It keeps no soldiers.';
  if (stillUnpaid(day).length > 0) return PURSE_BROKE_LINE;
  if (day.armiesUnpaid.length > 0 && day.armiesPaid.length === 0) return PURSE_LIEGE_COVERS_LINE;
  const sizes = day.armiesPaid
    .map(id => (graph.getNode(id)?.properties.armyState as { size?: ArmySizeCategory } | undefined)?.size)
    .filter((s): s is ArmySizeCategory => typeof s === 'string');
  if (sizes.length === 0) return 'It keeps no soldiers.';
  const perDay = sizes.reduce((sum, s) => sum + (ARMY_UPKEEP_PER_DAY[s] ?? 0), 0);
  const days = perDay > 0 ? wealth / perDay : 0;
  const them = sizes.length === 1 ? 'it' : 'them';
  return `It pays for ${armyListWords(sizes)}, and has coin to spare for ${durationWords(days)} of ${them}.`;
}

/** The What-They-Control clause: "pays tax", "yields salt", or null when it pays this faction nothing. */
export function holdingClause(graph: WorldGraph, placeId: string, day: PurseDayWords | null): string | null {
  if (!day) return null;
  const place = graph.getNode(placeId);
  if (!place) return null;
  if (isSettlement(place)) return day.taxHolderOf?.includes(placeId) ? 'pays tax' : null;
  if (!day.paidBy?.includes(placeId)) return null;
  const good = largestGood(place);
  return good ? `yields ${resourceWord(good)}` : null;
}

/** Everything the Purse panel renders, read in one engine call (the view-model seam, NFP #2). */
export interface FactionPurseView {
  band: string;
  broke: boolean;
  income: PursePart[];
  spending: string;
  /** THR-1955 — one chip text per good the faction holds a regional monopoly on (id-sorted). */
  monopolies: string[];
}

/**
 * The Purse panel's view model, or null when the purse has not reached this faction.
 * Takes the band and day as the phase wrote them (`meansBand`, `purseLastDay`).
 */
export function factionPurseView(
  graph: WorldGraph,
  factionId: string,
  read: { band: (n: GraphNode | undefined) => string | null; day: (n: GraphNode | undefined) => PurseDayWords | null },
): FactionPurseView | null {
  const node = graph.getNode(factionId);
  const band = read.band(node);
  if (!node || !band) return null;
  const day = read.day(node);
  const wealth = typeof node.properties.wealth === 'number' ? node.properties.wealth : 0;
  return {
    band,
    broke: stillUnpaid(day).length > 0,
    income: incomeSentence(graph, day),
    spending: spendingSentence(graph, day, wealth),
    monopolies: [...new Set(readRegionalMonopolies(node.properties).map(m => m.resourceId))].sort()
      .map(rid => fillMonopolyWords(MONOPOLY_WORDS.chip, { good: resourceWord(rid) })),
  };
}
