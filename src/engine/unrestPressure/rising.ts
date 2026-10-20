/**
 * Rising — a town throws off its holder (THR-1957, hunger and unrest S2; plan
 * `Docs/plans/2026-10-16-thr-1934-hunger-and-unrest.md` § Engine 10).
 *
 * Once a day, a held settlement with `unrest ≥ RISING_THRESHOLD`, out of its turn
 * cooldown, rises:
 *
 * - **Split** — the holder's members whose residence is the town break away through the
 *   shared splinter writes (`factionSplinter.ts`, the `resident_of` selector's test).
 * - **Founded** — when no member of the holder lives there, the resident with the
 *   highest `member_of.rank` in any faction (else the earliest arrival, ties by id)
 *   founds a free town through `foundFaction` and is its first member.
 * - **None** — no resident at all: no one to rise; the town keeps its holder.
 *
 * Either way the new faction takes the town's `controls` (`via: 'rising'`,
 * `takenFrom: holder`) and `hostile_to` is written both ways (`reason: 'rising'`), which
 * war aims' enemy rule reads. The town takes `RISING_RELIEF` and the cooldown stamp.
 *
 * The sack (the costliest building lost) needs the settlement economy's buildings
 * (THR-1923); until that ships the rising records `sackedBuildingId: null`.
 *
 * Unheld towns empty instead (people leave faster) — that cadence lives with the
 * Restless leaving in `unrestPressure.ts`.
 *
 * Deterministic (NFP #3): residents in id order, argmax with id ties. Fail-soft (NFP #4):
 * a founding or split that throws leaves the town with its holder.
 */
import type { GameState } from '../../types/gameState';
import type { GraphNode } from '../../types/graph';
import type { WorldGraph } from '../graph';
import { splinterFaction, residesIn } from '../factionSplinter';
import { foundFaction } from '../strategicGraphOps';
import { RESIDENCE_ARRIVED_PROP } from '../agentResidence';
import { DEFAULT_FACTION_REPUTATION } from '../encounterAftermath';
import { UNDERTAKING_DEFAULT_FACTION_SEED } from '../../data/strategic-action-constants';
import type { StrategicFactionSeed } from '../../types/strategicAction';
import {
  RISING_RELIEF,
  RISING_REPUTATION_SHARE,
  RISEN_FACTION_NAME,
  FREE_TOWN_FACTION_NAME,
  FREE_TOWN_FOUNDER_REPUTATION,
  FREE_TOWN_FOUNDER_RANK,
} from '../../data/unrest-pressure-constants';
import { moveControls, LAST_TURN_TICK_PROP } from './defection';

/** The free town's charter: a political order, seated in the town that rose. */
export const FREE_TOWN_FACTION_SEED: StrategicFactionSeed = {
  ...UNDERTAKING_DEFAULT_FACTION_SEED,
  factionType: 'political',
  nameTemplate: FREE_TOWN_FACTION_NAME,
  description: 'A town that rose against its lord and now answers to its own people.',
  themeColor: '#7a3b2e',
  locationTypes: ['hamlet', 'town', 'city', 'capital'],
};

export type RisingPath = 'split' | 'founded' | 'none';

export interface RisingResult {
  readonly path: RisingPath;
  readonly newFactionId: string | null;
  readonly residentsMoved: number;
  readonly sackedBuildingId: string | null;
  readonly failReason?: string;
}

function num(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

function byId(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** The living mortals whose residence is this town, id order. */
export function townResidents(graph: WorldGraph, townId: string): GraphNode[] {
  return graph.getNodesByType('actor')
    .filter(a => {
      const p = a.properties ?? {};
      return p.actorType === 'individual' && p.deceased !== true && p.armyState == null
        && residesIn(graph, a.id, townId);
    })
    .sort((a, b) => byId(a.id, b.id));
}

/** The holder's members who live in the town, with their reputation, id order. */
export function residentMembers(graph: WorldGraph, holderId: string, townId: string) {
  return graph.getIncomingEdges(holderId, 'member_of')
    .filter(e => {
      const p = graph.getNode(e.source)?.properties;
      return p?.actorType === 'individual' && p.deceased !== true && residesIn(graph, e.source, townId);
    })
    .map(e => ({ id: e.source, reputation: num(e.properties?.reputation) ?? DEFAULT_FACTION_REPUTATION }))
    .sort((a, b) => byId(a.id, b.id));
}

/** The resident who founds a free town: highest rank in any faction, then earliest arrival, then id. */
export function pickFounder(graph: WorldGraph, residents: readonly GraphNode[]): GraphNode | null {
  let best: { node: GraphNode; rank: number; arrived: number } | null = null;
  for (const r of residents) {
    let rank = -1;
    for (const e of graph.getOutgoingEdges(r.id, 'member_of')) {
      rank = Math.max(rank, num(e.properties?.rank) ?? 0);
    }
    const arrived = num(r.properties[RESIDENCE_ARRIVED_PROP]) ?? Infinity;
    const better = !best || rank > best.rank
      || (rank === best.rank && (arrived < best.arrived || (arrived === best.arrived && r.id < best.node.id)));
    if (better) best = { node: r, rank, arrived };
  }
  return best?.node ?? null;
}

function hostileBothWays(graph: WorldGraph, a: string, b: string, tick: number): void {
  for (const [s, t] of [[a, b], [b, a]] as const) {
    try {
      graph.addEdge({
        id: `e_hostile_rising_${s}_${t}_${tick}`,
        source: s,
        target: t,
        type: 'hostile_to',
        properties: { reason: 'rising', sinceTick: tick },
      });
    } catch { /* duplicate on a double pass */ }
  }
}

/**
 * The held town rises. Mutates the graph; the caller bumps structure on a non-`none`
 * path and writes the chronicle line.
 */
export function applyRising(state: GameState, town: GraphNode, holderId: string): RisingResult {
  const graph = state.graph;
  const tick = state.tick;
  const townName = town.name || town.id;
  let path: RisingPath = 'none';
  let newFactionId: string | null = null;
  let residentsMoved = 0;

  try {
    const members = residentMembers(graph, holderId, town.id);
    if (members.length > 0) {
      newFactionId = `faction_risen_${town.id}_${tick}`;
      residentsMoved = splinterFaction(graph, {
        sourceFactionId: holderId,
        newFactionId,
        newFactionName: RISEN_FACTION_NAME.replace('{town}', townName),
        members,
        reputationShare: RISING_REPUTATION_SHARE,
        tick,
        extraProperties: { factionType: 'political', risenAtLocationId: town.id, homeLocationId: town.id },
      }).length;
      path = 'split';
    } else {
      const founder = pickFounder(graph, townResidents(graph, town.id));
      if (!founder) {
        return { path: 'none', newFactionId: null, residentsMoved: 0, sackedBuildingId: null, failReason: 'no_one' };
      }
      const name = FREE_TOWN_FACTION_NAME.replace('{town}', townName);
      const res = foundFaction(state, founder.id, town.id, FREE_TOWN_FACTION_SEED, {}, name, tick);
      if (!res.success || !res.createdId) {
        return { path: 'none', newFactionId: null, residentsMoved: 0, sackedBuildingId: null, failReason: res.error ?? 'found_failed' };
      }
      newFactionId = res.createdId;
      try {
        graph.addEdge({
          id: `member_of_${founder.id}_${newFactionId}`,
          source: founder.id,
          target: newFactionId,
          type: 'member_of',
          properties: { reputation: FREE_TOWN_FOUNDER_REPUTATION, rank: FREE_TOWN_FOUNDER_RANK, role: 'leader', joinedTick: tick },
        });
        residentsMoved = 1;
      } catch { /* fail-soft: duplicate id */ }
      const node = graph.getNode(newFactionId);
      if (node) node.properties.risenAtLocationId = town.id;
      path = 'founded';
    }
  } catch (err) {
    return { path: 'none', newFactionId: null, residentsMoved: 0, sackedBuildingId: null, failReason: String(err) };
  }

  moveControls(graph, town.id, holderId, newFactionId, 'rising', tick);
  hostileBothWays(graph, newFactionId, holderId, tick);
  const unrest = num(town.properties.unrest) ?? 0;
  town.properties.unrest = Math.max(0, Math.min(100, unrest + RISING_RELIEF));
  town.properties[LAST_TURN_TICK_PROP] = tick;
  return { path, newFactionId, residentsMoved, sackedBuildingId: null };
}
