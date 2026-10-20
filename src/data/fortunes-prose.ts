/**
 * The place page's Fortunes sentence (THR-1934 S1, plan § Prose tables).
 *
 * One sentence: the prosperity word (`getProsperityTier`, lower-cased — the one
 * ladder every surface speaks), then, only when the town carries a band chip, the
 * band and the input that drives it most. No number ever appears (UI Law 13).
 *
 * The band is read from the trait edges, not the raw number, so the sentence always
 * matches the Restless / Lawless chips on the same page (Law 56). S2 (THR-1957) adds
 * the On the edge forms: a held town names the holder it may turn from (a ref, Law 21),
 * an unheld one says its people are on the edge of leaving.
 *
 * Pure builder: `fortunesSentence` returns the sentence split around the prosperity
 * word, so the page can hang the `ui.econ.prosperity` tooltip on that word alone.
 */
import type { WorldGraph } from '../engine/graph';
import { getProsperityTier } from '../engine/phaseProsperity';
import { isRestlessPlace, isLawlessPlace, placeHasTrait } from '../engine/unrestPressure/bands';
import { taxHolderOf } from '../engine/factionPurse/income';
import { LOCATION_TRAIT_IDS } from './location-trait-constants';
import { readUnrestInputs, largestInput, isPressureSettlement, UNREST_TARGET_PROP, type UnrestInputKey } from '../engine/unrestPressure/inputs';

export type FortunesBand = 'none' | 'restless' | 'lawless' | 'on_the_edge_held' | 'on_the_edge_unheld';

/** `{cause}` by the largest raising input. A push (unrest above every input) names no cause. */
export const FORTUNES_CAUSE: Readonly<Record<Exclude<UnrestInputKey, 'contentment'>, string>> = {
  hunger: ' with hunger',
  poverty: ' with want',
  siege: ', with an army at the walls',
  sickness: ' with sickness',
  deathSite: ' over their dead',
};

/** What follows the prosperity word, by band. `{cause}` is appended before the full stop. */
export const FORTUNES_BAND_TAIL: Readonly<Record<FortunesBand, string>> = {
  none: ' and quiet',
  restless: ', and its people are restless',
  lawless: ', and its streets have turned lawless',
  on_the_edge_held: ', and it is on the edge of turning from {holder}',
  on_the_edge_unheld: ', and its people are on the edge of leaving',
};

const NO_REALM_MAP: ReadonlyMap<string, string> = new Map();

export interface FortunesSentence {
  /** "Millbrook is " */
  readonly lead: string;
  /** "struggling" — the prosperity word, carrying the `ui.econ.prosperity` tooltip. */
  readonly prosperityWord: string;
  /** ", and its people are restless with hunger." */
  readonly tail: string;
  readonly band: FortunesBand;
  /** S2: the holder a town on the edge may turn from — named in `tail`, routed as a ref. */
  readonly holder?: { readonly id: string; readonly name: string };
  /** The whole sentence, for tests, traces and plain-text readers. */
  readonly text: string;
}

/**
 * The Fortunes sentence for one settlement, or null when the node is missing, is not
 * a settlement (hamlet, town, city, capital) or has no prosperity yet (fail-soft: the
 * row simply does not render).
 */
export function fortunesSentence(graph: WorldGraph, settlementId: string): FortunesSentence | null {
  const node = graph.getNode(settlementId);
  if (!isPressureSettlement(node)) return null;
  const prosperity = node.properties?.prosperity;
  if (typeof prosperity !== 'number' || !Number.isFinite(prosperity)) return null;

  const holderId = placeHasTrait(graph, settlementId, LOCATION_TRAIT_IDS.onTheEdge)
    ? taxHolderOf(graph, settlementId, NO_REALM_MAP) : undefined;
  const band: FortunesBand = holderId ? 'on_the_edge_held'
    : holderId === null ? 'on_the_edge_unheld'
    : isLawlessPlace(graph, settlementId) ? 'lawless'
    : isRestlessPlace(graph, settlementId) ? 'restless' : 'none';
  const holder = holderId ? { id: holderId, name: graph.getNode(holderId)?.name || holderId } : undefined;

  let cause = '';
  if (band !== 'none') {
    const inputs = readUnrestInputs(node);
    const key = inputs ? largestInput(inputs) : null;
    if (inputs && key) {
      const unrest = typeof node.properties.unrest === 'number' ? node.properties.unrest : 0;
      const target = typeof node.properties[UNREST_TARGET_PROP] === 'number' ? node.properties[UNREST_TARGET_PROP] as number : 0;
      // A push is larger than every input: the town is angry at something that passes.
      const push = unrest - target;
      if (!(push > inputs[key])) cause = FORTUNES_CAUSE[key];
    }
  }

  const lead = `${node.name} is `;
  const prosperityWord = getProsperityTier(prosperity).toLowerCase();
  const tail = `${FORTUNES_BAND_TAIL[band].replace('{holder}', holder?.name ?? '')}${cause}.`;
  return { lead, prosperityWord, tail, band, ...(holder ? { holder } : {}), text: `${lead}${prosperityWord}${tail}` };
}
