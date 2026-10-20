/**
 * Read-only readout of a settlement's unrest pressure (THR-1934) — what
 * `window.__DEBUG.getUnrest` and the Economy debug tab show. Numbers are fine here;
 * the player sees only the Fortunes sentence and the chips.
 */
import type { WorldGraph } from '../graph';
import type { GraphNode } from '../../types/graph';
import { getLocationNodes } from '../sublocationShape';
import { fortunesSentence } from '../../data/fortunes-prose';
import {
  isPressureSettlement,
  readUnrestInputs,
  UNREST_TARGET_PROP,
  HUNGER_DAYS_PROP,
  RESTLESS_DAYS_PROP,
  LAST_LEAVE_TO_PROP,
  type UnrestInputs,
} from './inputs';
import { unrestBand, isRestlessPlace, isLawlessPlace, placeHasTrait, type UnrestBand } from './bands';
import type { TownLordViewParts } from '../../types/trace';
import { LOCATION_TRAIT_IDS } from '../../data/location-trait-constants';
import { buildCrownWorld } from '../crown/eligibility';
import { settlementHolders, buildTownView, LAST_TURN_TICK_PROP } from './defection';

export interface UnrestReadout {
  locationId: string;
  locationName: string;
  unrest: number;
  target: number | null;
  inputs: UnrestInputs | null;
  hungerDays: number;
  band: UnrestBand;
  chips: { restless: boolean; lawless: boolean; onTheEdge: boolean };
  /** S2: the tick the town last turned (defection or rising), or null. */
  lastTurnTick: number | null;
  restlessDays: number;
  leaveTo: string | null;
  fortunes: string | null;
}

function num(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

export function readUnrestOf(graph: WorldGraph, node: GraphNode): UnrestReadout {
  const p = node.properties ?? {};
  const unrest = num(p.unrest) ?? 0;
  return {
    locationId: node.id,
    locationName: node.name,
    unrest,
    target: num(p[UNREST_TARGET_PROP]) ?? null,
    inputs: readUnrestInputs(node),
    hungerDays: num(p[HUNGER_DAYS_PROP]) ?? 0,
    band: unrestBand(unrest),
    chips: {
      restless: isRestlessPlace(graph, node.id),
      lawless: isLawlessPlace(graph, node.id),
      onTheEdge: placeHasTrait(graph, node.id, LOCATION_TRAIT_IDS.onTheEdge),
    },
    lastTurnTick: num(p[LAST_TURN_TICK_PROP]) ?? null,
    restlessDays: num(p[RESTLESS_DAYS_PROP]) ?? 0,
    leaveTo: typeof p[LAST_LEAVE_TO_PROP] === 'string' ? p[LAST_LEAVE_TO_PROP] as string : null,
    fortunes: fortunesSentence(graph, node.id)?.text ?? null,
  };
}

/** Every settlement's readout, highest unrest first (ties by id). */
export function describeAllUnrest(graph: WorldGraph): UnrestReadout[] {
  return getLocationNodes(graph)
    .filter(isPressureSettlement)
    .map(n => readUnrestOf(graph, n))
    .sort((a, b) => b.unrest - a.unrest || (a.locationId < b.locationId ? -1 : a.locationId > b.locationId ? 1 : 0));
}

/** One settlement by id, id prefix or partial name (case-insensitive). Null when nothing matches. */
export function describeUnrest(graph: WorldGraph, query: string): UnrestReadout | null {
  const settlements = getLocationNodes(graph).filter(isPressureSettlement);
  const q = (query ?? '').toLowerCase();
  const hit = settlements.find(n => n.id === query)
    ?? settlements.find(n => n.id.toLowerCase().startsWith(q))
    ?? settlements.find(n => (n.name ?? '').toLowerCase().includes(q));
  return hit ? readUnrestOf(graph, hit) : null;
}

/** S2 (THR-1957) — how a town sees its holder and the lords near it (`__DEBUG.getTownView`). */
export interface TownViewReadout {
  townId: string;
  townName: string;
  holder: string | null;
  holderView: TownLordViewParts | null;
  candidates: TownLordViewParts[];
}

/** The town view for one settlement (by id, prefix or name). Null when nothing matches. */
export function describeTownView(graph: WorldGraph, tick: number, query: string): TownViewReadout | null {
  const settlements = getLocationNodes(graph).filter(isPressureSettlement);
  const q = (query ?? '').toLowerCase();
  const hit = settlements.find(n => n.id === query)
    ?? settlements.find(n => n.id.toLowerCase().startsWith(q))
    ?? settlements.find(n => (n.name ?? '').toLowerCase().includes(q));
  if (!hit) return null;
  const holders = settlementHolders(graph);
  const view = buildTownView(buildCrownWorld(graph, tick, null), holders, hit);
  return {
    townId: hit.id,
    townName: hit.name,
    holder: view?.holderId ?? null,
    holderView: view?.holder ?? null,
    candidates: view ? [...view.candidates] : [],
  };
}
