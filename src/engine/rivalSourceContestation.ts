/**
 * Rival source contestation (THR-621 — Divine Economy).
 *
 * The **rival-side driver** for the essence-source contestation interface that
 * shipped in THR-611. That slice built the whole source side of the mechanic —
 * `contestedBy` / `desecrated` on the source bag, the `contested` / `desecrated`
 * tier transitions, the income penalty, the per-tick sanctity drain, and the
 * Defend counter-play leg that clears both flags — but **nothing in production
 * ever set those two fields**. Only tests wrote them, and only the Defend op
 * cleared them. This module is the missing writer.
 *
 * It is deliberately thin: the tier derivation, the income multipliers, and the
 * drain-per-tick all stay owned by their existing homes (`data/essence-sources.ts`,
 * `engine/essenceSources.ts`). All this module does is decide *which* source a
 * rival goes after and flip the two flags — the shipped substrate does the rest.
 *
 * Rides the THR-66 rival scheme dispatch (no new rival subsystem): the two moves
 * here are invoked from `phaseRivalActions` as `contest_source` / `desecrate_source`
 * scheme beats. See `src/data/rival-schemes/profane.ts` for the authored arc.
 *
 * **Rivals are not graph nodes.** They live in `state.rivalDefinitions` /
 * `state.rivalStates`, so the drained income is credited to a `RivalState`
 * accumulator rather than an essence pool on some rival node, and the contested
 * signal is read off the *source bag* rather than a `sponsors_scheme` edge (which
 * cannot bind from a non-existent source node — see `rivalInfluenceMarkers.ts`).
 *
 * Pure over graph state except the two explicit flag writes (documented per
 * function); PRNG only in target selection, and only from the caller's seeded
 * stream (NFP #3). Every failure path is a no-op, never a throw (NFP #4).
 */

import type { WorldGraph } from './graph';
import type { EssenceSource } from '../types/essenceSource';
import { readEssenceSource } from './essenceSources';
import {
  BASE_SOURCE_INCOME,
  deriveSourceTier,
  sourceTierMultiplier,
  RIVAL_SOURCE_DRAIN_CAPTURE,
} from '../data/essence-sources';

/** A source a rival could open a drain against, with its keystone weight. */
export interface ContestableSource {
  /** Graph id of the host node (location / sublocation / artifact). */
  hostId: string;
  /** Display name of the host, falling back to its id. */
  name: string;
  /**
   * Keystone weight — the source's pre-DR yield at its current tier. The richer
   * a source is, the likelier a rival is to go for it: rivals hit the keystone,
   * not the rubble.
   */
  weight: number;
}

/**
 * Every source the ascendant controls that a rival could open a *new* drain
 * against: it must carry a source bag, must not already be desecrated, and must
 * not already be contested by anyone (one drain per source — two rivals bleeding
 * the same shrine would make `contestedBy` ambiguous and the Defend leg
 * unresolvable).
 *
 * Zero-yield sources are excluded: a source worth nothing is not worth a scheme.
 *
 * O(controlled hosts) — sources are few and player-owned (plan §Performance).
 * Fail-soft: a missing ascendant or unreadable host yields an empty list.
 */
export function findContestableSources(
  graph: WorldGraph,
  ascendantId: string,
): ContestableSource[] {
  const node = graph.getNode(ascendantId);
  if (!node) return [];

  const out: ContestableSource[] = [];
  for (const edge of graph.getOutgoingEdges(ascendantId, 'controls')) {
    const host = graph.getNode(edge.target);
    const src = readEssenceSource(host?.properties);
    if (!host || !src) continue;
    if (src.desecrated || src.contestedBy) continue; // already taken or already lost

    const weight = (BASE_SOURCE_INCOME[src.kind] ?? 0) * sourceTierMultiplier(src.tier);
    if (weight <= 0) continue; // nothing to bleed

    const name = (typeof host.properties.name === 'string' && host.properties.name) || host.id;
    out.push({ hostId: host.id, name, weight });
  }
  return out;
}

/**
 * True when the world holds at least one source a rival could contest — the
 * eligibility gate for the profane scheme family, mirroring
 * `worldHasResourceStocks` for the economic family (THR-619).
 *
 * A family that requires a player source stays ineligible in a world with none,
 * so it never launches and no-ops; it simply is not offered (fail-soft, NFP #4).
 */
export function worldHasContestableSource(
  graph: WorldGraph,
  ascendantId: string | undefined,
): boolean {
  if (!ascendantId) return false;
  try {
    return findContestableSources(graph, ascendantId).length > 0;
  } catch {
    return false; // unreadable graph → family stays ineligible rather than throwing
  }
}

/**
 * Pick a source for a rival to target, weighted by keystone value so the richest
 * holding is the likeliest mark. `alreadyTargeted` excludes hosts already under
 * another active scheme (the caller's cross-scheme ledger).
 *
 * Consumes exactly one draw from the caller's seeded stream whenever at least one
 * candidate exists, so the tick's PRNG sequence stays deterministic (NFP #3).
 * Returns undefined when nothing is contestable.
 */
export function selectContestableSource(
  graph: WorldGraph,
  ascendantId: string,
  alreadyTargeted: ReadonlySet<string>,
  rng: () => number,
): ContestableSource | undefined {
  const candidates = findContestableSources(graph, ascendantId).filter(
    (c) => !alreadyTargeted.has(c.hostId),
  );
  if (candidates.length === 0) return undefined;

  const total = candidates.reduce((sum, c) => sum + c.weight, 0);
  if (total <= 0) return candidates[0];

  let roll = rng() * total;
  for (const candidate of candidates) {
    roll -= candidate.weight;
    if (roll <= 0) return candidate;
  }
  return candidates[candidates.length - 1]; // float-drift guard
}

/** Write a source bag back onto its host, re-deriving the public tier. */
function writeSource(graph: WorldGraph, hostId: string, next: EssenceSource): void {
  const host = graph.getNode(hostId);
  if (!host) return;
  const tier = deriveSourceTier(next.sanctity, {
    contested: !!next.contestedBy,
    desecrated: !!next.desecrated,
  });
  graph.updateNode(hostId, {
    properties: { ...host.properties, essenceSource: { ...next, tier } },
  });
}

/**
 * `contest_source` move — open a rival drain against a source.
 *
 * Sets `contestedBy`, which flips the derived tier to `contested` (income drops
 * to `SOURCE_CONTESTED_PENALTY`) and starts the per-tick sanctity bleed that
 * `recomputeControlledSourceTiers` already applies. The player's counter-play is
 * the shipped Defend leg, which clears the flag.
 *
 * Idempotent and non-stealing: a source already contested by *another* rival is
 * left alone. Returns true when this call opened the drain.
 */
export function contestSource(
  graph: WorldGraph,
  hostId: string,
  rivalId: string,
): boolean {
  const host = graph.getNode(hostId);
  const src = readEssenceSource(host?.properties);
  if (!host || !src) return false;
  if (src.desecrated) return false; // already lost — nothing left to contest
  if (src.contestedBy) return false; // already contested (by this rival or another)

  writeSource(graph, hostId, { ...src, contestedBy: rivalId });
  return true;
}

/**
 * `desecrate_source` move — the terminal beat: a completed drain profanes the
 * source outright.
 *
 * Sets `desecrated`, which forces the `desecrated` tier (yield ×0 — income stops
 * reaching the player entirely) and makes the source inert to the essence bridge.
 * It stays reclaimable: the shipped Defend/reclaim op clears both flags.
 *
 * Gated on this rival already holding the drain — a rival cannot desecrate a
 * source it never contested, or one the player has since warded. That gate is
 * what makes the Defend leg *matter*: ward the source before the crack beat and
 * the crack lands on nothing. Returns true when this call desecrated it.
 */
export function desecrateSource(
  graph: WorldGraph,
  hostId: string,
  rivalId: string,
): boolean {
  const host = graph.getNode(hostId);
  const src = readEssenceSource(host?.properties);
  if (!host || !src) return false;
  if (src.contestedBy !== rivalId) return false; // never held it, or the player warded it
  if (src.desecrated) return false; // already desecrated

  writeSource(graph, hostId, { ...src, desecrated: true });
  return true;
}

/** What a rival is currently bleeding out of the player's portfolio. */
export interface RivalDrainYield {
  /** Essence per tick redirected from the player to this rival. */
  amount: number;
  /** Host ids this rival currently contests (not yet desecrated). */
  contestedHostIds: string[];
  /** Host ids this rival has desecrated. */
  desecratedHostIds: string[];
}

/**
 * Compute what a rival draws this tick from the player's sources — precisely the
 * income the player *loses* to it, so the ledger balances and every essence unit
 * stays attributable (NFP #2).
 *
 * Per source, the loss is measured against the tier the source *would* hold with
 * no rival on it:
 * - `contested`  → the gap between the uncontested yield and the leaked yield.
 * - `desecrated` → the whole uncontested yield (the player receives nothing).
 *
 * Scaled by `RIVAL_SOURCE_DRAIN_CAPTURE` so how much of the player's loss the
 * rival actually pockets is a tunable number, not a hardcoded assumption (NFP #1).
 *
 * Measured **pre-diminishing-returns**: the player's true loss is DR-adjusted by
 * portfolio rank, which would require re-running the whole portfolio calc against
 * a counterfactual. This reads the source's own yield instead — a slight
 * over-estimate for deep portfolios, and deliberately simple.
 *
 * Pure. Fail-soft: a missing ascendant returns a zero yield.
 */
export function computeRivalDrainYield(
  graph: WorldGraph,
  ascendantId: string | undefined,
  rivalId: string,
): RivalDrainYield {
  const empty: RivalDrainYield = { amount: 0, contestedHostIds: [], desecratedHostIds: [] };
  if (!ascendantId) return empty;
  const node = graph.getNode(ascendantId);
  if (!node) return empty;

  let amount = 0;
  const contestedHostIds: string[] = [];
  const desecratedHostIds: string[] = [];

  for (const edge of graph.getOutgoingEdges(ascendantId, 'controls')) {
    const host = graph.getNode(edge.target);
    const src = readEssenceSource(host?.properties);
    if (!host || !src || src.contestedBy !== rivalId) continue;

    const base = BASE_SOURCE_INCOME[src.kind] ?? 0;
    // The tier this source would hold if no rival were on it.
    const uncontested = sourceTierMultiplier(deriveSourceTier(src.sanctity, {}));

    if (src.desecrated) {
      desecratedHostIds.push(host.id);
      amount += base * uncontested; // the player receives nothing; all of it redirects
    } else {
      contestedHostIds.push(host.id);
      amount += base * (uncontested - sourceTierMultiplier('contested'));
    }
  }

  return {
    amount: Math.max(0, amount * RIVAL_SOURCE_DRAIN_CAPTURE),
    contestedHostIds,
    desecratedHostIds,
  };
}
