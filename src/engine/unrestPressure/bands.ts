/**
 * Unrest bands (THR-1934 S1, plan § Engine 6–8).
 *
 * The chips are location traits with hysteresis (`phaseLocationTraits`); the band
 * here is the plain reading of the number, used by traces and the debug view. The
 * Fortunes row and `homeIsRestless` read the trait edges, so what the player is told
 * matches the chip on the page (Law 56).
 */
import type { GameState } from '../../types/gameState';
import type { WorldGraph } from '../graph';
import { LOCATION_TRAIT_IDS } from '../../data/location-trait-constants';
import {
  UNREST_BAND_RESTLESS,
  UNREST_BAND_LAWLESS,
  UNREST_BAND_ON_THE_EDGE,
  UNREST_BAND_RISING,
} from '../../data/unrest-pressure-constants';
import { RESIDENCE_POSITION_PROP } from '../agentResidence';
import { resolveToParentLocation } from '../sublocationShape';
import { taxHolderOf } from '../factionPurse/income';

const NO_REALM_MAP: ReadonlyMap<string, string> = new Map();

export type UnrestBand = 'calm' | 'restless' | 'lawless' | 'on_the_edge' | 'rising';

export function unrestBand(unrest: number): UnrestBand {
  if (unrest >= UNREST_BAND_RISING) return 'rising';
  if (unrest >= UNREST_BAND_ON_THE_EDGE) return 'on_the_edge';
  if (unrest >= UNREST_BAND_LAWLESS) return 'lawless';
  if (unrest >= UNREST_BAND_RESTLESS) return 'restless';
  return 'calm';
}

export function placeHasTrait(graph: WorldGraph, locationId: string, traitId: string): boolean {
  return graph.getOutgoingEdges(locationId, 'has_trait').some(e => e.target === traitId);
}

export function isRestlessPlace(graph: WorldGraph, locationId: string): boolean {
  return placeHasTrait(graph, locationId, LOCATION_TRAIT_IDS.restless);
}

export function isLawlessPlace(graph: WorldGraph, locationId: string): boolean {
  return placeHasTrait(graph, locationId, LOCATION_TRAIT_IDS.lawless);
}

/**
 * Does this mortal's home settlement read Restless or worse? The hook mortal wealth
 * S2's `computeMeansWant` calls to count a Restless home one Means band poorer
 * (`MEANS_RESTLESS_DROP`). Home is the observed residence, resolved to the place
 * tier. False when the mortal has no residence. Exported unused until that lands.
 */
export function homeIsRestless(state: Pick<GameState, 'graph'>, agentId: string): boolean {
  const graph = state.graph;
  const agent = graph.getNode(agentId);
  const residenceId = agent?.properties?.[RESIDENCE_POSITION_PROP];
  if (typeof residenceId !== 'string') return false;
  const home = resolveToParentLocation(graph, graph.getNode(residenceId));
  if (!home) return false;
  return isRestlessPlace(graph, home.id) || isLawlessPlace(graph, home.id);
}

/**
 * The holder a town on the edge would turn from: the one the daily turn pass judged
 * (`unrestHolderId`, realm-border tie-break included), else the controller ranking.
 * The Fortunes row and the Trouble lens both ask here, so they name the lord whose
 * `controls` would move (THR-1957, Law 56).
 */
export function judgedHolderOf(graph: WorldGraph, settlementId: string): string | null {
  const judged = graph.getNode(settlementId)?.properties?.unrestHolderId;
  if (judged === null) return null;
  if (typeof judged === 'string' && graph.getNode(judged)) return judged;
  return taxHolderOf(graph, settlementId, NO_REALM_MAP);
}
