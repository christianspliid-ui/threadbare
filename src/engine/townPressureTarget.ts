/**
 * The god's town push → one of the town's Places (THR-2094 Decision 1).
 *
 * A town card still changes the town as its words say; only its sphere push is re-aimed.
 * A push the god's own hand made (`divine_action`, `causedBy === ascendantId`) at a
 * `GOD_PUSH_TOWN_SUBTYPES` location lands in that town's Place (a sublocation, a
 * `location` node whose `parentLocationId` is the town) holding least of the sphere,
 * ties by id. A town with no Places keeps the push. Every other push passes through.
 * While `GOD_PUSH_TOWN_KEEPS_ECHO` holds, a copy at the unscaled size stays on the town
 * (`townEcho`, never Mandate credit), so the town's Dominion reads move as before.
 *
 * Pure: reads the graph, writes nothing. Deterministic (score then id, no PRNG).
 * Runs in `phaseSpherePressure` right after `resolveHexPressureTargets`, so a hex push
 * that anchored on a town is re-aimed too.
 *
 * Plan doc: Docs/plans/2026-10-31-thr-2094-town-cards-reach-the-mandate.md
 */

import type { WorldGraph } from './graph';
import type { SphereAffinity, SpherePressureEvent } from '../types/sphereAffinity';
import {
  GOD_PUSH_LANDS_IN_SUBLOCATION, GOD_PUSH_TOWN_KEEPS_ECHO, GOD_PUSH_TOWN_SUBTYPES,
} from '../types/sphereAffinity';
import type { TownPressureTrace } from '../types/traces/sphere-traces';
import { getPlaceNodes } from './sublocationShape';
import { DOMINION_READS_PARENT_KEY } from './dominion';

/** A town-pressure trace before the buffer stamps `id` and `timestamp`. */
export type TownPressureTraceInput = Omit<TownPressureTrace, 'id' | 'timestamp'>;

/** Optional overrides, for tests and the constant's revert switch. */
export interface TownPressureOptions {
  enabled?: boolean;
  keepEcho?: boolean;
}

function isTownTarget(graph: WorldGraph, id: string): boolean {
  const node = graph.getNode(id);
  if (!node || node.type !== 'location') return false;
  const props = node.properties ?? {};
  const subtype = (props.locationSubtype ?? props.locationType) as string | undefined;
  return typeof subtype === 'string' && GOD_PUSH_TOWN_SUBTYPES.includes(subtype);
}

function buildChildMap(graph: WorldGraph): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const node of getPlaceNodes(graph)) {
    const parent = node.properties?.parentLocationId;
    if (typeof parent !== 'string') continue;
    // A Place that reads its host's scores (an echo monument, THR-1843) is no landing:
    // its own scores move no Dominion read.
    if (node.properties?.[DOMINION_READS_PARENT_KEY] === true) continue;
    const list = map.get(parent);
    if (list) list.push(node.id);
    else map.set(parent, [node.id]);
  }
  return map;
}

function scoreOf(graph: WorldGraph, id: string, sphere: SpherePressureEvent['sphere']): number {
  const aff = graph.getNode(id)?.properties?.sphereAffinity as SphereAffinity | undefined;
  const score = aff?.scores?.[sphere];
  return typeof score === 'number' ? score : 0;
}

/** Re-aim the god's pushes at towns onto each town's least-touched Place. */
export function resolveTownPressureTargets(
  graph: WorldGraph,
  pressures: SpherePressureEvent[],
  ascendantId: string,
  tick: number,
  options: TownPressureOptions = {},
): { pressures: SpherePressureEvent[]; traces: TownPressureTraceInput[] } {
  const enabled = options.enabled ?? GOD_PUSH_LANDS_IN_SUBLOCATION;
  if (!enabled || !ascendantId) return { pressures, traces: [] };
  const keepEcho = options.keepEcho ?? GOD_PUSH_TOWN_KEEPS_ECHO;

  const qualifies = (p: SpherePressureEvent): boolean =>
    p.source === 'divine_action' && p.causedBy === ascendantId && !p.keepOnTarget &&
    isTownTarget(graph, p.targetEntityId);

  if (!pressures.some(qualifies)) return { pressures, traces: [] };

  try {
    let children: Map<string, string[]> | null = null;
    const out: SpherePressureEvent[] = [];
    const traces: TownPressureTraceInput[] = [];

    for (const p of pressures) {
      if (!qualifies(p)) {
        out.push(p);
        continue;
      }
      children ??= buildChildMap(graph);
      const places = children.get(p.targetEntityId);
      if (!places || places.length === 0) {
        out.push(p); // no Places: the push stays on the town
        continue;
      }
      let bestId = places[0];
      let bestScore = scoreOf(graph, bestId, p.sphere);
      for (let i = 1; i < places.length; i++) {
        const id = places[i];
        const score = scoreOf(graph, id, p.sphere);
        if (score < bestScore || (score === bestScore && id < bestId)) {
          bestId = id;
          bestScore = score;
        }
      }
      out.push({ ...p, targetEntityId: bestId });
      if (keepEcho) {
        // The town still feels the push as it did before the re-aim: unscaled, no credit.
        const { pushScale, ...rest } = p;
        out.push({ ...rest, magnitude: p.magnitude / (pushScale ?? 1), townEcho: true });
      }
      const townName = graph.getNode(p.targetEntityId)?.name ?? p.targetEntityId;
      const placeName = graph.getNode(bestId)?.name ?? bestId;
      traces.push({
        category: 'sphere_pressure.town_resolved',
        tick,
        townId: p.targetEntityId,
        sublocationId: bestId,
        sphere: p.sphere,
        sourceId: p.sourceId,
        sublocationScore: bestScore,
        summary: `${p.sphere} push on ${townName} lands in ${placeName} (score ${bestScore})`,
      });
    }

    return { pressures: out, traces };
  } catch {
    // Fail-soft: pushes stay on their towns, no trace.
    return { pressures, traces: [] };
  }
}
