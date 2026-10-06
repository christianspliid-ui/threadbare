/**
 * A site's delve road (THR-1702, plan `Docs/plans/2026-10-05-thr-1702-found-leads-end-the-climb.md` § D1).
 *
 * Kept in its own leaf module (re-exported from `delveVariant.ts`) so the lead helpers in
 * `leadVisit.ts` can read it without importing `delveVariant` → `clueLifecycle`, which would
 * close an import cycle through `phaseClueDecay`.
 */

import type { GraphEdge } from '../../types/graph';
import type { WorldGraph } from '../graph';
import { RUINED_SETTLEMENT_DELVE_DECAY_TICKS } from '../../data/strategic-action-constants';
import { isLocationNode } from '../sublocationShape';
import { CLUE_SPENT_LEAD_ENDS_CLIMB } from './constants';

/**
 * `now` — a delve can be admitted today (a worldgen elder ruin, or a settlement a mortal
 * ruined once `RUINED_SETTLEMENT_DELVE_DECAY_TICKS` have passed); `later` — a
 * mortal-ruined settlement still settling; `never` — every other site (wonders, plain
 * worldgen ruins such as a shipwreck).
 */
export type DelveRoad = 'now' | 'later' | 'never';

/** Pure: reads the Location's properties only. */
export function delveRoadOf(props: Record<string, unknown>, tick: number): DelveRoad {
  if (props.locationType === 'elder_ruin') return 'now';
  const subtype = (props.locationSubtype ?? props.locationType) as string | undefined;
  const ruinedTick = props.ruinedTick;
  if (subtype !== 'ruins' || typeof ruinedTick !== 'number') return 'never';
  return ruinedTick + RUINED_SETTLEMENT_DELVE_DECAY_TICKS <= tick ? 'now' : 'later';
}

/**
 * THR-1702 — is this lead *spent*: an unconsumed `located` `knows_clue_of` edge whose
 * site's delve road is `never`, so the climb has no rung left. Behind
 * `CLUE_SPENT_LEAD_ENDS_CLIMB`. A missing or non-Location target is not spent
 * (decay owns that case, NFP #4). Re-exported from `leadVisit.ts`.
 */
export function isLeadSpent(graph: WorldGraph, edge: GraphEdge, tick: number): boolean {
  if (!CLUE_SPENT_LEAD_ENDS_CLIMB) return false;
  if (edge.type !== 'knows_clue_of' || edge.properties?.consumed === true) return false;
  if (edge.properties?.precision !== 'located') return false;
  const site = graph.getNode(edge.target);
  if (!site || !isLocationNode(site)) return false;
  return delveRoadOf(site.properties, tick) === 'never';
}
