/**
 * Regional monopoly resolution and embargo upkeep — §1 of `phaseEconomicPower` under the
 * regional rule (THR-1955, war aims S2 § Engine 6 and 9).
 *
 * Daily, on the economic-power scan tick:
 *
 * 1. Compute today's regional monopolies (`computeRegionalMonopolies`) and diff each
 *    faction's against yesterday's. A region that still stands keeps its `sinceTick`
 *    (same resource, anchors within `MONOPOLY_REGION_RADIUS_HEXES` of each other).
 *    `monopoly_broken` is chronicled only for a region held at least
 *    `MONOPOLY_MIN_HOLD_DAYS`; `monopoly_established` for a re-formed region only when
 *    its last loss was that long ago. Every transition is traced either way.
 * 2. Lift each standing embargo whose term is over, or whose holder no longer holds the
 *    monopoly it rests on, and chronicle `embargo_lifted`.
 *
 * Writes `regionalMonopolies`, `monopolies` (resource ids, deduplicated — kept for any
 * reader), `monopolyLosses` (the de-duplication memory) and clears `activeEmbargo`.
 */

import type { GameState } from '../../types/gameState';
import type { GraphNode } from '../../types/graph';
import type { WorldGraph } from '../graph';
import { emitTrace } from '../traceBuffer';
import { hexDistance } from '../../lib/hexMath';
import { getLocationNodes } from '../sublocationShape';
import { isFactionNode, isSettlement } from '../factionPurse/income';
import { hexOfLocation } from '../warAims/context';
import { resolveEconomicChronicle, chronicleSeed } from '../economicChronicle';
import {
  buildBearingIndex,
  computeRegionalMonopolies,
  readRegionalMonopolies,
  readActiveEmbargo,
  monopolyCovering,
  hexOfLocationId,
  embargoedTownsOf,
  embargoedLanesOf,
  type RegionalMonopoly,
  type ActiveEmbargo,
} from '../regionalMonopoly';
import { RESOURCE_DEFINITIONS } from '../../data/resource-content';
import { TICKS_PER_DAY } from '../../data/attention-constants';
import { MONOPOLY_REGION_RADIUS_HEXES, MONOPOLY_MIN_HOLD_DAYS } from '../../data/regional-monopoly-constants';

/** Push a resolved chronicle line (the phase's own `pushChronicle`). */
export type ChroniclePush = (result: ReturnType<typeof resolveEconomicChronicle>, locationName: string) => void;

interface MonopolyLoss {
  resourceId: string;
  anchorLocationId: string;
  tick: number;
}

const HOLD_TICKS = MONOPOLY_MIN_HOLD_DAYS * TICKS_PER_DAY;

/**
 * A resolved line whose first word is a lower-case faction name ("hold of Witness
 * Skyfield …") starts with a capital. Mutates and returns the result.
 */
export function capitalised<T extends ReturnType<typeof resolveEconomicChronicle>>(result: T): T {
  if (result) {
    const p = result.chronicleChapter.prose;
    result.chronicleChapter.prose = p.charAt(0).toUpperCase() + p.slice(1);
  }
  return result;
}

/** A good's display name, lower case, for a chronicle line. Fail-soft to the id. */
export function resourceWord(resourceId: string): string {
  return (RESOURCE_DEFINITIONS[resourceId]?.name ?? resourceId).toLowerCase();
}

/** The settlement nearest a region's anchor (the town a line names), else the anchor itself. */
export function regionTownName(graph: WorldGraph, anchorLocationId: string): string {
  const anchor = graph.getNode(anchorLocationId);
  const anchorName = anchor?.name ?? 'the region';
  if (isSettlement(anchor)) return anchorName;
  const hex = hexOfLocation(graph, anchor);
  if (!hex) return anchorName;
  let best: { name: string; id: string; d: number } | null = null;
  for (const loc of getLocationNodes(graph)) {
    if (!isSettlement(loc)) continue;
    const h = hexOfLocation(graph, loc);
    if (!h) continue;
    const d = hexDistance(h, hex);
    if (d > MONOPOLY_REGION_RADIUS_HEXES) continue;
    if (!best || d < best.d || (d === best.d && loc.id < best.id)) best = { name: loc.name, id: loc.id, d };
  }
  return best?.name ?? anchorName;
}

function sameRegion(graph: WorldGraph, a: { resourceId: string; anchorLocationId: string }, b: { resourceId: string; anchorLocationId: string }): boolean {
  if (a.resourceId !== b.resourceId) return false;
  if (a.anchorLocationId === b.anchorLocationId) return true;
  const ha = hexOfLocationId(graph, a.anchorLocationId);
  const hb = hexOfLocationId(graph, b.anchorLocationId);
  return !!ha && !!hb && hexDistance(ha, hb) <= MONOPOLY_REGION_RADIUS_HEXES;
}

function readLosses(props: Record<string, unknown>): MonopolyLoss[] {
  const raw = props.monopolyLosses;
  if (!Array.isArray(raw)) return [];
  return raw.filter((l): l is MonopolyLoss => !!l && typeof l === 'object'
    && typeof (l as MonopolyLoss).resourceId === 'string'
    && typeof (l as MonopolyLoss).anchorLocationId === 'string'
    && typeof (l as MonopolyLoss).tick === 'number');
}

function traceTransition(
  tick: number, faction: GraphNode, m: RegionalMonopoly, transition: 'established' | 'broken', chronicled: boolean,
): void {
  emitTrace({
    category: 'monopoly_transition',
    tick,
    summary: transition === 'established'
      ? `${faction.name} holds the ${m.resourceId} around ${m.anchorLocationId} (${Math.round(m.share * 100)}% of ${m.placeIds.length} held)${chronicled ? '' : ' — not chronicled (re-formed inside the hold window)'}`
      : `${faction.name}'s ${m.resourceId} hold around ${m.anchorLocationId} is broken${chronicled ? '' : ' — not chronicled (held under the hold window)'}`,
    factionId: faction.id,
    resourceId: m.resourceId,
    transition,
    controlFraction: transition === 'established' ? m.share : 0,
    anchorLocationId: m.anchorLocationId,
    chronicled,
  });
}

/** Emit the embargo trace for a record (laid or lifted). */
export function traceEmbargo(
  graph: WorldGraph, tick: number, holder: GraphNode, record: ActiveEmbargo,
  category: 'faction.embargo.laid' | 'faction.embargo.lifted', why?: 'expired' | 'monopoly_lost',
  hexRealmId?: ReadonlyMap<string, string>,
): void {
  const towns = embargoedTownsOf(graph, record, hexRealmId);
  emitTrace({
    category,
    tick,
    summary: `${holder.name} ${category === 'faction.embargo.laid' ? 'embargoes' : 'lifts its embargo on'} ${record.targetFactionId} (${record.resourceId} around ${record.anchorLocationId}, ${towns.length} towns)${why ? ` — ${why}` : ''}`,
    holderId: holder.id,
    targetFactionId: record.targetFactionId,
    resourceId: record.resourceId,
    anchorLocationId: record.anchorLocationId,
    townIds: towns.map(t => t.id),
    roads: embargoedLanesOf(graph, record, hexRealmId).length,
    untilTick: record.untilTick,
    ...(why ? { why } : {}),
  });
}

/**
 * Resolve today's regional monopolies and lift spent embargoes. Returns counts for the
 * phase's scan trace; chronicle lines go through `push`.
 */
export function resolveRegionalMonopolies(
  state: GameState,
  push: ChroniclePush,
  hexRealmId?: ReadonlyMap<string, string>,
): { held: number; established: number; broken: number; changed: boolean } {
  const { graph, tick } = state;
  const today = computeRegionalMonopolies(buildBearingIndex(graph, hexRealmId), tick);
  let held = 0;
  let established = 0;
  let broken = 0;
  let changed = false;

  const factions = graph.getNodesByType('actor').filter(isFactionNode)
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  for (const faction of factions) {
    const props = faction.properties as Record<string, unknown>;
    const prev = readRegionalMonopolies(props);
    const now = today.get(faction.id) ?? [];
    held += now.length;
    // An old save carries the world-wide ledger (`monopolies`) with no regional record:
    // its entries are dropped quietly (traced, never chronicled) once the regional rule runs.
    const legacy = prev.length === 0 && Array.isArray(props.monopolies)
      ? (props.monopolies as unknown[]).filter((x): x is string => typeof x === 'string') : [];
    if (prev.length === 0 && now.length === 0 && legacy.length === 0) continue;
    for (const rid of legacy) {
      if (now.some(n => n.resourceId === rid)) continue;
      changed = true;
      broken++;
      traceTransition(tick, faction, { resourceId: rid, anchorLocationId: '', share: 0, placeIds: [], sinceTick: tick }, 'broken', false);
    }

    const losses = readLosses(props).filter(l => tick - l.tick < HOLD_TICKS);
    const matched = new Set<RegionalMonopoly>();

    for (const n of now) {
      const old = prev.find(p => !matched.has(p) && sameRegion(graph, p, n));
      if (old) {
        matched.add(old);
        n.sinceTick = typeof old.sinceTick === 'number' ? old.sinceTick : tick;
        continue;
      }
      changed = true;
      established++;
      const recentLoss = losses.some(l => sameRegion(graph, l, n));
      if (!recentLoss) {
        const town = regionTownName(graph, n.anchorLocationId);
        push(capitalised(resolveEconomicChronicle(
          'monopoly_established',
          { actor: faction.name, actorId: faction.id, resource: resourceWord(n.resourceId), settlement: town },
          tick,
          chronicleSeed(state.seed, `${faction.id}_${n.resourceId}_${n.anchorLocationId}_${tick}`),
        )), town);
      }
      traceTransition(tick, faction, n, 'established', !recentLoss);
    }

    for (const p of prev) {
      if (matched.has(p)) continue;
      changed = true;
      broken++;
      const stood = tick - (typeof p.sinceTick === 'number' ? p.sinceTick : tick) >= HOLD_TICKS;
      if (stood) {
        const town = regionTownName(graph, p.anchorLocationId);
        push(capitalised(resolveEconomicChronicle(
          'monopoly_broken',
          { actor: faction.name, actorId: faction.id, resource: resourceWord(p.resourceId), settlement: town },
          tick,
          chronicleSeed(state.seed, `${faction.id}_${p.resourceId}_${p.anchorLocationId}_${tick}_broken`),
        )), town);
      }
      losses.push({ resourceId: p.resourceId, anchorLocationId: p.anchorLocationId, tick });
      traceTransition(tick, faction, p, 'broken', stood);
    }

    props.regionalMonopolies = now;
    props.monopolies = [...new Set(now.map(m => m.resourceId))].sort();
    props.monopolyLosses = losses;
  }

  // ── Embargo upkeep ──────────────────────────────────────────────────────
  for (const faction of factions) {
    const record = readActiveEmbargo(faction.properties);
    if (!record) continue;
    const anchorHex = hexOfLocationId(graph, record.anchorLocationId);
    const stillHeld = anchorHex ? monopolyCovering(graph, faction.id, record.resourceId, anchorHex) !== null : false;
    const expired = tick >= record.untilTick;
    if (!expired && stillHeld) continue;
    changed = true;
    const town = regionTownName(graph, record.anchorLocationId);
    const target = graph.getNode(record.targetFactionId);
    push(capitalised(resolveEconomicChronicle(
      'embargo_lifted',
      {
        actor: faction.name, actorId: faction.id,
        target: target?.name ?? 'its enemies', targetId: record.targetFactionId,
        resource: resourceWord(record.resourceId), settlement: town,
      },
      tick,
      chronicleSeed(state.seed, `${faction.id}_embargo_${record.untilTick}_lifted`),
    )), town);
    traceEmbargo(graph, tick, faction, record, 'faction.embargo.lifted', expired ? 'expired' : 'monopoly_lost', hexRealmId);
    (faction.properties as Record<string, unknown>).activeEmbargo = null;
  }

  return { held, established, broken, changed };
}
