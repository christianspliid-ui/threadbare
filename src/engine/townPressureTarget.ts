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
  GOD_PUSH_LANDS_IN_SUBLOCATION, GOD_PUSH_TOWN_KEEPS_ECHO, GOD_PUSH_TOWN_SUBTYPES, triangleTotal,
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

// ─── The copy's banked progress (review cycle 4) ─────────────────────

/**
 * Node property: progress a town copy (`townEcho`) left on the town short of a level,
 * per sphere. The Mandate credit re-resolve starts without it, so a later seat, claim or
 * carry push that tips the town over that level is not credited for what the copy filled.
 * Its own key, not a field of `sphereAffinity`, so other affinity writers keep it.
 */
export const TOWN_ECHO_BANK_KEY = 'townEchoBank';

export type TownEchoBank = Partial<Record<SpherePressureEvent['sphere'], number>>;

/** The town's bank, each sphere capped at the progress it still holds; null when empty. */
export function readTownEchoBank(
  props: Record<string, unknown> | undefined,
  affinity: SphereAffinity,
): TownEchoBank | null {
  const raw = props?.[TOWN_ECHO_BANK_KEY];
  if (!raw || typeof raw !== 'object') return null;
  const bank: TownEchoBank = {};
  for (const [sphere, value] of Object.entries(raw as Record<string, unknown>)) {
    const held = affinity.progress[sphere as keyof SphereAffinity['progress']];
    if (typeof value !== 'number' || !(value > 0) || typeof held !== 'number') continue;
    const capped = Math.min(value, held);
    if (capped > 0) bank[sphere as keyof TownEchoBank] = capped;
  }
  return Object.keys(bank).length > 0 ? bank : null;
}

/** The town as if no copy had ever reached it: its progress less the bank. */
export function withoutTownEchoBank(affinity: SphereAffinity, bank: TownEchoBank | null): SphereAffinity {
  if (!bank) return affinity;
  const progress = { ...affinity.progress };
  for (const [sphere, value] of Object.entries(bank)) {
    const key = sphere as keyof typeof progress;
    progress[key] = Math.max(0, progress[key] - (value ?? 0));
  }
  return { scores: affinity.scores, progress };
}

/**
 * The bank after this tick: how far the real town got past the copy-free one, in total
 * investment (`triangleTotal(score) + progress`), capped at the progress the real town
 * holds — a level the copy alone filled was never credited, so only leftover is banked.
 */
export function townEchoBankAfter(real: SphereAffinity, copyFree: SphereAffinity): TownEchoBank | null {
  const bank: TownEchoBank = {};
  for (const sphere of Object.keys(real.progress) as Array<keyof SphereAffinity['progress']>) {
    const lead = (triangleTotal(real.scores[sphere]) + real.progress[sphere])
      - (triangleTotal(copyFree.scores[sphere] ?? 0) + (copyFree.progress[sphere] ?? 0));
    const banked = Math.min(lead, real.progress[sphere]);
    if (banked > 0) bank[sphere] = banked;
  }
  return Object.keys(bank).length > 0 ? bank : null;
}
