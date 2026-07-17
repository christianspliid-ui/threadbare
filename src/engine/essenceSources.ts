/**
 * Essence Source engine logic (THR-611 — Divine Economy).
 *
 * Graph-reading derivations for the essence-source substrate: the typed
 * per-sphere income term, forward-migration of legacy places of power, and
 * per-tick tier recomputation. Pure over graph state except the explicit
 * in-place migrations / tier writes (documented below); no PRNG (NFP #3).
 *
 * Scope is deliberately O(controlled hosts): sources are "few and player-owned"
 * (plan §Performance), so every walk here iterates the ascendant's `controls`
 * edges, never all nodes.
 */

import type { SphereName } from '../types';
import type { EssenceSource } from '../types/essenceSource';
import type { WorldGraph } from './graph';
import { hexDistance } from './delivery';
import { resolveLocationToHex } from './encounterAwareness';
import {
  BASE_SOURCE_INCOME,
  deriveSourceTier,
  sourceTierMultiplier,
  sourceDepthMultiplier,
  SANCTITY_DRAIN_PER_TICK_CONTESTED,
} from '../data/essence-sources';

/** Read the `essenceSource` bag from a node's properties (or undefined). */
export function readEssenceSource(
  properties: Record<string, unknown> | undefined,
): EssenceSource | undefined {
  const src = properties?.essenceSource;
  return src && typeof src === 'object' ? (src as EssenceSource) : undefined;
}

/**
 * Find latent (undiscovered) essence sources within `rangeHops` hexes of a
 * center hex. "Latent" = carries an `essenceSource` bag whose `discoveredBy` is
 * undefined (fog-consistent: hidden until a Find reveals it). Walks all location
 * nodes — acceptable because a Find is a rare, deliberate player action and
 * sources are few; not a per-tick path. Returns the matching host location ids.
 */
export function findLatentSourcesInRange(
  graph: WorldGraph,
  center: { col: number; row: number },
  rangeHops: number,
): string[] {
  const found: string[] = [];
  for (const loc of graph.getNodesByType('location')) {
    const src = readEssenceSource(loc.properties);
    if (!src || src.discoveredBy) continue; // not a source, or already discovered
    const hex = resolveLocationToHex(graph, loc.id);
    if (!hex) continue; // fail-soft: unplaceable host is skipped
    if (hexDistance(center, hex) <= rangeHops) found.push(loc.id);
  }
  return found;
}

/**
 * A **typed** source routes its income to its own `sphereAffinity` (not the
 * ascendant's alignment). Untyped sources (no `sphereAffinity` — e.g. a migrated,
 * unbuilt place of power) fall back to the legacy alignment-distributed path in
 * `computeEssenceGeneration`, which is what preserves existing income exactly.
 */
function isTypedSource(src: EssenceSource | undefined): src is EssenceSource & { sphereAffinity: SphereName } {
  return !!src && !!src.sphereAffinity;
}

interface TypedSourceEntry {
  sphere: SphereName;
  /** Base × tier multiplier, before diminishing returns. */
  preDrIncome: number;
}

/**
 * Compute typed per-sphere source income for an ascendant. Only **typed**
 * controlled sources contribute here; untyped (legacy / migrated-but-unbuilt)
 * places of power stay on the legacy alignment-distributed term. Diminishing
 * returns apply across portfolio depth within each sphere (richest first).
 *
 * Returns a sparse per-sphere map (spheres with no typed source are absent).
 */
export function computeSourceIncome(
  graph: WorldGraph,
  ascendantId: string,
): Partial<Record<SphereName, number>> {
  const node = graph.getNode(ascendantId);
  if (!node) return {};

  const homeSeatLocationId = node.properties.homeSeatLocationId as string | undefined;

  // Collect typed sources grouped by sphere.
  const bySphere = new Map<SphereName, TypedSourceEntry[]>();
  for (const edge of graph.getOutgoingEdges(ascendantId, 'controls')) {
    if (edge.target === homeSeatLocationId) continue; // seat is a distinct income term
    const host = graph.getNode(edge.target);
    const src = readEssenceSource(host?.properties);
    if (!isTypedSource(src)) continue;

    const base = BASE_SOURCE_INCOME[src.kind] ?? 0;
    const preDrIncome = base * sourceTierMultiplier(src.tier);
    if (preDrIncome <= 0) continue; // desecrated / zero-yield sources contribute nothing

    const list = bySphere.get(src.sphereAffinity) ?? [];
    list.push({ sphere: src.sphereAffinity, preDrIncome });
    bySphere.set(src.sphereAffinity, list);
  }

  // Apply diminishing returns per sphere, richest first.
  const income: Partial<Record<SphereName, number>> = {};
  for (const [sphere, entries] of bySphere) {
    entries.sort((a, b) => b.preDrIncome - a.preDrIncome);
    let total = 0;
    entries.forEach((entry, rank) => {
      total += entry.preDrIncome * sourceDepthMultiplier(rank);
    });
    income[sphere] = (income[sphere] ?? 0) + total;
  }

  return income;
}

/**
 * Forward-migrate controlled legacy places of power into the source model
 * (in-place, idempotent). A controlled `isPlaceOfPower` location that lacks an
 * `essenceSource` bag gains a **dormant, untyped** `placeOfPower` source — which
 * keeps its income identical (it stays on the legacy alignment-distributed term
 * until built / consecrated). Returns the number migrated this call.
 */
export function migrateControlledPlacesOfPower(
  graph: WorldGraph,
  ascendantId: string,
  tick: number,
): number {
  const node = graph.getNode(ascendantId);
  if (!node) return 0;

  let migrated = 0;
  for (const edge of graph.getOutgoingEdges(ascendantId, 'controls')) {
    const host = graph.getNode(edge.target);
    if (!host) continue;
    if (host.properties.isPlaceOfPower !== true) continue;
    if (readEssenceSource(host.properties)) continue; // already migrated

    const source: EssenceSource = {
      kind: 'placeOfPower',
      sanctity: 0,
      tier: 'dormant',
      originTick: tick,
      // sphereAffinity intentionally undefined → untyped → legacy income preserved.
    };
    graph.updateNode(host.id, { properties: { ...host.properties, essenceSource: source } });
    migrated++;
  }
  return migrated;
}

/** Aggregate read of the god's essence-source holdings (THR-613 §4.2). */
export interface ControlledSourceCount {
  /** Every source the ascendant `controls`, whatever its tier. */
  total: number;
  /** Of those, the ones currently at the `flowering` tier. */
  flowering: number;
}

/**
 * Count the ascendant's controlled essence sources, split out by flowering tier
 * (THR-613 §4.2). A pure read — it never writes tiers; the per-tick recompute in
 * {@link recomputeControlledSourceTiers} owns that, and runs in `phaseEssenceSources`
 * earlier in the tick, so the tiers this reads are already fresh.
 *
 * Exists so the progression phase can detect the essence-source *milestone* without
 * reaching into the source model's internals or duplicating the `controls`-edge walk.
 * Fail-soft (NFP #4): missing ascendant / hosts without a source bag → not counted.
 */
export function countControlledSources(
  graph: WorldGraph,
  ascendantId: string,
): ControlledSourceCount {
  const node = graph.getNode(ascendantId);
  if (!node) return { total: 0, flowering: 0 };

  let total = 0;
  let flowering = 0;
  for (const edge of graph.getOutgoingEdges(ascendantId, 'controls')) {
    const host = graph.getNode(edge.target);
    const src = readEssenceSource(host?.properties);
    if (!host || !src) continue;
    total++;
    if (src.tier === 'flowering') flowering++;
  }
  return { total, flowering };
}

export interface SourceTierRecompute {
  sourceCount: number;
  tierChanges: number;
  contestedCount: number;
}

/**
 * Recompute the derived tier for every controlled source and apply the
 * contested-sanctity drain (in-place). Returns aggregate counts for the phase
 * trace. Fail-soft: a host with no source bag is skipped; a malformed sanctity
 * resolves to `dormant` via `deriveSourceTier`.
 */
export function recomputeControlledSourceTiers(
  graph: WorldGraph,
  ascendantId: string,
): SourceTierRecompute {
  const node = graph.getNode(ascendantId);
  if (!node) return { sourceCount: 0, tierChanges: 0, contestedCount: 0 };

  let sourceCount = 0;
  let tierChanges = 0;
  let contestedCount = 0;

  for (const edge of graph.getOutgoingEdges(ascendantId, 'controls')) {
    const host = graph.getNode(edge.target);
    const src = readEssenceSource(host?.properties);
    if (!host || !src) continue;
    sourceCount++;

    const contested = !!src.contestedBy;
    const desecrated = !!src.desecrated;
    if (contested) contestedCount++;

    // Contested + undefended sources bleed sanctity toward desecration.
    let sanctity = src.sanctity;
    if (contested && !desecrated) {
      sanctity = Math.max(0, sanctity - SANCTITY_DRAIN_PER_TICK_CONTESTED);
    }

    const nextTier = deriveSourceTier(sanctity, { contested, desecrated });
    if (nextTier !== src.tier || sanctity !== src.sanctity) {
      if (nextTier !== src.tier) tierChanges++;
      graph.updateNode(host.id, {
        properties: { ...host.properties, essenceSource: { ...src, sanctity, tier: nextTier } },
      });
    }
  }

  return { sourceCount, tierChanges, contestedCount };
}
