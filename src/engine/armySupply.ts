/**
 * Army Supply — THR-626 (Flow Web P2: army supply rides trade conduits).
 *
 * Pure derivation of a supply line between an army and the nearest host that can
 * feed it, plus the tier function that turns the private larder scalar into the
 * three-word vocabulary every other surface reads.
 *
 * No PRNG, no graph mutation, no traces — the phase (`phases/armySupply.ts`)
 * owns all side effects. Same inputs → same outputs (NFP #3).
 *
 * The walk is a bounded breadth-first search over the **shipped** conduit types:
 * `road` edges (physical infrastructure) and `trades_with` edges (commercial
 * routes, including the `threatened` flag `routeEvents.ts` maintains). It does
 * not introduce a supply-line edge type — a supply line is not a durable
 * relationship, it is a *derived path over relationships that already exist*,
 * which is exactly why severing a trade route is felt at the front.
 *
 * Design docs: Docs/plans/2026-07-04-flow-web-exploration.md §Part 1 (army-supply
 * row), Docs/plans/2026-07-05-autonomous-notables.md §Enhancement THR-626,
 * Docs/plans/2026-07-22-flow-web-extraction-checkpoint.md §Re-open trigger.
 */

import type { GameState } from '../types/gameState';
import type { ArmyState, ArmySizeCategory } from '../types/army';
import type { ArmySupplyTier } from '../types/army';
import { readLocationResourceBalance } from './resourceEconomy';
import {
  ARMY_SUPPLY_MAX,
  ARMY_SUPPLY_MAX_HOPS,
  ARMY_SUPPLY_BASE_THROUGHPUT,
  ARMY_SUPPLY_HOP_DECAY,
  ARMY_SUPPLY_THREATENED_PENALTY,
  ARMY_SUPPLY_HOST_MIN_BALANCE,
  ARMY_SUPPLY_TIER_THRESHOLDS,
  ARMY_SUPPLY_CONSUMPTION,
} from '../data/army-supply-config';

// ─── Tier function ────────────────────────────────────────────────────────

/**
 * Map a larder scalar to the public vocabulary. **This is the only read surface**
 * — prose, UI, and every other system consume the tier, never the number
 * (Flow Web commitment: "tiers are the only read surface").
 *
 * Fail-soft: a non-finite or absent larder reads `supplied`, so a legacy army
 * that predates this system is never spuriously starved into a mutiny.
 */
export function deriveSupplyTier(
  supply: number | undefined,
  supplyMax: number = ARMY_SUPPLY_MAX,
): ArmySupplyTier {
  if (typeof supply !== 'number' || !Number.isFinite(supply)) return 'supplied';
  const max = supplyMax > 0 ? supplyMax : ARMY_SUPPLY_MAX;
  const fraction = supply / max;
  if (fraction <= ARMY_SUPPLY_TIER_THRESHOLDS.starving) return 'starving';
  if (fraction <= ARMY_SUPPLY_TIER_THRESHOLDS.strained) return 'strained';
  return 'supplied';
}

/** Provisions an army of this size consumes per scan. Fail-soft to warband. */
export function supplyConsumptionFor(size: ArmySizeCategory | undefined): number {
  return ARMY_SUPPLY_CONSUMPTION[size ?? 'warband'] ?? ARMY_SUPPLY_CONSUMPTION.warband;
}

// ─── Supply line resolution ───────────────────────────────────────────────

/** The derived state of one army's connection to the provisioning web. */
export interface SupplyLine {
  /** Location node id of the host feeding this army; null when cut off. */
  hostId: string | null;
  /** Conduit hops from the army to the host. `Infinity` when cut off. */
  hops: number;
  /** True when any hop on the line is a `threatened` trade route. */
  threatened: boolean;
  /** Provisions delivered per scan. 0 when cut off. */
  throughput: number;
}

/** The canonical cut-off line — the fail-soft value for every unresolvable case. */
export const CUT_OFF_SUPPLY_LINE: Readonly<SupplyLine> = {
  hostId: null,
  hops: Infinity,
  threatened: false,
  throughput: 0,
};

/**
 * Throughput delivered across `hops` conduit hops.
 * Exported so the tuning story is testable without building a graph.
 */
export function throughputForHops(hops: number, threatened: boolean): number {
  if (!Number.isFinite(hops) || hops < 0 || hops > ARMY_SUPPLY_MAX_HOPS) return 0;
  const base = ARMY_SUPPLY_BASE_THROUGHPUT * Math.pow(ARMY_SUPPLY_HOP_DECAY, hops);
  return Number((threatened ? base * ARMY_SUPPLY_THREATENED_PENALTY : base).toFixed(3));
}

/**
 * True when a location can provision an army for `factionId`.
 *
 * Two conditions, both reading shipped state: the faction must **control** the
 * location (a `controls` edge — armies eat from their own granaries, not the
 * enemy's), and the location's aggregate resource balance must clear
 * `ARMY_SUPPLY_HOST_MIN_BALANCE`. The second is the coupling that makes a famine
 * upstream arrive as hunger at the front.
 */
export function isSupplyHost(
  state: GameState,
  locationId: string,
  factionId: string | undefined,
): boolean {
  if (!factionId) return false;
  const node = state.graph.getNode(locationId);
  if (!node || node.type !== 'location') return false;
  const controlled = state.graph
    .getIncomingEdges(locationId, 'controls')
    .some((e) => e.source === factionId);
  if (!controlled) return false;
  return readLocationResourceBalance(node.properties) >= ARMY_SUPPLY_HOST_MIN_BALANCE;
}

/**
 * Walk outward from `originId` over `road` + `trades_with` conduits to the
 * nearest supply host for `factionId`.
 *
 * Breadth-first, so the first host reached is the fewest-hop one; ties broken by
 * ascending node id so the result is deterministic regardless of edge insertion
 * order (NFP #3). Bounded by `ARMY_SUPPLY_MAX_HOPS`.
 *
 * `threatened` is carried along the path rather than checked at the end — a line
 * is strangled if *any* link in it is, which is what lets a single ambush deep in
 * friendly territory be felt at the front.
 *
 * Fail-soft: a missing origin, a factionless army, or an exhausted search all
 * return `CUT_OFF_SUPPLY_LINE` rather than throwing.
 */
export function resolveSupplyLine(
  state: GameState,
  originId: string | undefined,
  factionId: string | undefined,
  options: { allowSelfHost?: boolean } = {},
): SupplyLine {
  const { allowSelfHost = true } = options;
  if (!originId || !factionId) return { ...CUT_OFF_SUPPLY_LINE };
  if (!state.graph.getNode(originId)) return { ...CUT_OFF_SUPPLY_LINE };

  // The army may already be standing on a host — zero hops, full throughput.
  if (allowSelfHost && isSupplyHost(state, originId, factionId)) {
    return { hostId: originId, hops: 0, threatened: false, throughput: throughputForHops(0, false) };
  }

  const visited = new Set<string>([originId]);
  let frontier: Array<{ id: string; threatened: boolean }> = [{ id: originId, threatened: false }];

  for (let hops = 1; hops <= ARMY_SUPPLY_MAX_HOPS; hops++) {
    const next = new Map<string, boolean>(); // id -> threatened-on-the-way-here

    for (const { id, threatened } of frontier) {
      for (const link of conduitsFrom(state, id)) {
        if (visited.has(link.to)) continue;
        const carriedThreat = threatened || link.threatened;
        // A node reachable by two paths this hop keeps the *unthreatened* one:
        // supply takes the healthiest available road.
        const existing = next.get(link.to);
        next.set(link.to, existing === undefined ? carriedThreat : existing && carriedThreat);
      }
    }

    if (next.size === 0) break;

    // Deterministic scan order, independent of edge insertion order.
    const candidates = [...next.keys()].sort((a, b) => a.localeCompare(b));
    for (const candidateId of candidates) {
      if (isSupplyHost(state, candidateId, factionId)) {
        const threatened = next.get(candidateId) ?? false;
        return { hostId: candidateId, hops, threatened, throughput: throughputForHops(hops, threatened) };
      }
    }

    for (const id of candidates) visited.add(id);
    frontier = candidates.map((id) => ({ id, threatened: next.get(id) ?? false }));
  }

  return { ...CUT_OFF_SUPPLY_LINE };
}

/**
 * True when a besieged settlement can still be *relieved* — that is, when
 * provisions could still reach it from somewhere else (THR-626).
 *
 * Deliberately **not** `isSupplyHost(settlement)`: a besieged city is nearly
 * always a faction-controlled location with stock, so asking whether it can feed
 * itself is a question that answers "yes" until the moment it doesn't, which is
 * precisely the fixed clock this replaces. The interesting question is whether
 * anything can get *in* — so the self-host case is excluded and a threatened
 * line does not count. Bandits on the last road into a siege are not relief.
 *
 * Fail-soft: an unresolvable settlement reads unsupplied, preserving TB-073's
 * shipped starvation timing for any world this coupling cannot speak about.
 */
export function hasReliefLine(state: GameState, settlementId: string | undefined): boolean {
  if (!settlementId) return false;
  const node = state.graph.getNode(settlementId);
  if (!node) return false;
  const factionId = state.graph.getIncomingEdges(settlementId, 'controls')[0]?.source;
  if (!factionId) return false;
  const line = resolveSupplyLine(state, settlementId, factionId, { allowSelfHost: false });
  return line.hostId !== null && !line.threatened;
}

/** One conduit step: where it leads, and whether that link is threatened. */
interface ConduitLink {
  to: string;
  threatened: boolean;
}

/**
 * Every conduit leaving `locationId`, in both directions.
 *
 * Roads are physical and carry no threat state of their own. Trade routes carry
 * the `threatened` flag `routeEvents.ts` sets when banditry materializes — the
 * single property that makes economic warfare legible to the war system.
 */
function conduitsFrom(state: GameState, locationId: string): ConduitLink[] {
  const links: ConduitLink[] = [];
  const graph = state.graph;

  for (const e of graph.getOutgoingEdges(locationId, 'road')) links.push({ to: e.target, threatened: false });
  for (const e of graph.getIncomingEdges(locationId, 'road')) links.push({ to: e.source, threatened: false });

  for (const e of graph.getOutgoingEdges(locationId, 'trades_with')) {
    links.push({ to: e.target, threatened: e.properties.threatened === true });
  }
  for (const e of graph.getIncomingEdges(locationId, 'trades_with')) {
    links.push({ to: e.source, threatened: e.properties.threatened === true });
  }

  return links;
}

// ─── Larder update ────────────────────────────────────────────────────────

/**
 * Next larder value for an army, given what its line delivers and what it eats.
 * Clamped to `[0, supplyMax]`. Pure — the caller writes it back.
 */
export function nextSupplyLevel(
  current: number,
  throughput: number,
  consumption: number,
  supplyMax: number = ARMY_SUPPLY_MAX,
): number {
  const max = supplyMax > 0 ? supplyMax : ARMY_SUPPLY_MAX;
  const raw = current + throughput - consumption;
  const clamped = raw < 0 ? 0 : raw > max ? max : raw;
  return Number(clamped.toFixed(3));
}

/**
 * Read an army's larder fail-soft, defaulting a legacy army (raised before this
 * system) to a full one. An army that has never been provisioned is not a
 * starving army — it is an army the supply model has not met yet.
 */
export function readArmySupply(armyState: ArmyState): number {
  const s = armyState.supply;
  return typeof s === 'number' && Number.isFinite(s) ? s : ARMY_SUPPLY_MAX;
}

/** Read an army's larder ceiling fail-soft. */
export function readArmySupplyMax(armyState: ArmyState): number {
  const m = armyState.supplyMax;
  return typeof m === 'number' && Number.isFinite(m) && m > 0 ? m : ARMY_SUPPLY_MAX;
}
