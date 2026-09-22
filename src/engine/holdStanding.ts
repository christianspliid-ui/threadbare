/**
 * holdStanding.ts — a held town is a faction position (THR-1448).
 *
 * A mortal who keeps a town keeps it for someone. Before this module the hold was a
 * private clock: no faction knew the keeper, no encounter turned to them, and the
 * board weighed their work on a held town like any other. This module reads the
 * **standing** a hold opens with the Realm whose ground the town sits on.
 *
 * **The standing is a reading, not a record.** It is computed on demand from the
 * active stances (`StrategicControlState`) and the political map
 * (`RealmProjection.hexRealmId`) — nothing is written on the stance, nothing on the
 * `controls` edge, and no new node or edge type exists. Two sources of truth for
 * "whose keeper is this" is the THR-1211 shape, and this module refuses it. The one
 * write the standing causes — the `member_of` edge it opens through `joinFaction` —
 * lives in `strategicActionLifecycle.ts`, where every other stance write lives.
 *
 * **Which Realm (Q1).** The Realm whose ground the town sits on, read from the
 * projection entry for the town's hex — **ground only**. A keeper who already holds
 * standing with some *other* Realm keeps this town for the ground's crown all the
 * same. A town in unclaimed wilds opens no standing: a hold in the wilds is just a
 * hold, and the reading says so with `realmNodeId: null`.
 *
 * **Why the projection and not `getLocationHolder`.** A claimable town has no faction
 * `controls` edge by rule (`control:claim` requires `unowned`), and the point reader
 * filters to faction sources and excludes a mortal's stance by name, citing this
 * ticket. `hexRealmId` answers the ground; the town's holder answers a different
 * question.
 *
 * NFP #1 Tunability: every number is a constant in `strategic-action-constants.ts`.
 * NFP #2 Inspectability: `__DEBUG.getHoldStanding`, CLI `hold`, and the
 * `position_opened` / `position_closed` trace members carry the Realm.
 * NFP #3 Determinism: pure — same stances, same projection, same reading. Ties
 * between two stances by one actor break on the stance id, never on order.
 * NFP #4 Fail-soft: a stance on a deleted town, a town with no stamped hex, an
 * unclaimed hex, a projection that throws, or a Realm node that has since gone all
 * degrade to "just a hold"; a candidate with no target scores `0`.
 */

import type { WorldGraph } from './graph';
import type { StrategicControlState } from '../types/strategicAction';
import type { RealmProjection } from './realmProjection';
import type { RealmProjectionThunk } from './sceneRealm';
import { resolveLocationToHex } from './encounterAwareness';
import { hexKeyFromCoord } from '../lib/hexKey';
import {
  HELD_REALM_AFFINITY_SHARE,
  HOLD_GRIP_WORDS,
} from '../data/strategic-action-constants';

/** What a hold means to a faction, as every surface reads it. */
export interface HoldStanding {
  /** The keeper. */
  readonly actorId: string;
  /** The stance the standing reads — the keeper's first active stance by id. */
  readonly controlId: string;
  /** The town the standing names — that stance's target. */
  readonly townId: string;
  /** Every Location the keeper holds through an active stance; `townId` is first. */
  readonly heldLocationIds: readonly string[];
  /**
   * The Realm whose ground the town sits on — `null` when the ground is unclaimed
   * (wilds), the town has no resolvable hex, or the Realm node is gone.
   */
  readonly realmNodeId: string | null;
  /** The Realm's `factionDefId` (`realm.<cultureId>`), or `null` with `realmNodeId`. */
  readonly realmDefId: string | null;
  /** The Realm's own holdings, from the projection — the affinity share's population. */
  readonly realmHeldLocationIds: readonly string[];
  /** The stance's `degradation`: 0 healthy → 1 about to collapse. Rendered through `gripWord`. */
  readonly grip: number;
}

/**
 * One row of the session ledger (`SimulationRuntime.holdStandings`): what the `2a.55`
 * reconciliation announced for a stance, so it can announce it once and trace the
 * closing with the same ids after the stance record is gone.
 */
export interface HoldStandingLedgerEntry {
  readonly actorId: string;
  readonly targetNodeId: string;
  /** `null` for a hold in the wilds — announced nowhere, ledgered so it is not re-asked. */
  readonly realmNodeId: string | null;
}

/**
 * The Realm claiming the ground under a Location, from the projection — or `null`
 * when nobody does, the Location has no stamped hex, or the Realm node is gone.
 *
 * The one place the ground question is asked, so the reconciliation, the filter
 * gate and the supply arm cannot answer it three ways.
 */
export function groundRealmNodeId(
  graph: WorldGraph,
  projection: RealmProjection | null | undefined,
  locationId: string | undefined,
): string | null {
  if (!projection || !locationId) return null;
  const hex = resolveLocationToHex(graph, locationId);
  if (!hex) return null;
  const realmId = projection.hexRealmId.get(hexKeyFromCoord(hex));
  if (!realmId) return null;
  // A stale projection entry naming a Realm that has since dissolved must read as no
  // Realm rather than a standing with nothing: the membership edge would otherwise be
  // minted into a node that is gone.
  return graph.getNode(realmId) ? realmId : null;
}

/** The keeper's active stances, first by id — the deterministic tiebreak the plan names. */
function activeStancesOf(
  controls: readonly StrategicControlState[],
  agentId: string,
): StrategicControlState[] {
  return controls
    .filter(c => c.active && c.actorId === agentId)
    .sort((a, b) => (a.controlId < b.controlId ? -1 : a.controlId > b.controlId ? 1 : 0));
}

/**
 * The standing a mortal's hold opens, or `null` when they hold nothing.
 *
 * `null` means *no active stance*. A keeper whose town sits on unclaimed ground still
 * gets a reading — the sheet says *keeps Ashford · grip firm* with no Realm — with
 * `realmNodeId: null`. Callers that need a Realm test that field, not the reading.
 */
export function holdStanding(
  graph: WorldGraph,
  controls: readonly StrategicControlState[] | undefined,
  projection: RealmProjection | null | undefined,
  agentId: string,
): HoldStanding | null {
  if (!controls || controls.length === 0) return null;
  const stances = activeStancesOf(controls, agentId);
  if (stances.length === 0) return null;

  const first = stances[0];
  const realmNodeId = groundRealmNodeId(graph, projection, first.targetNodeId);
  const realmNode = realmNodeId ? graph.getNode(realmNodeId) : undefined;
  const realmDefId = typeof realmNode?.properties.factionDefId === 'string'
    ? (realmNode.properties.factionDefId as string)
    : null;
  const realmEntry = realmNodeId
    ? projection?.realms.find(r => r.id === realmNodeId)
    : undefined;

  return {
    actorId: agentId,
    controlId: first.controlId,
    townId: first.targetNodeId,
    heldLocationIds: stances.map(s => s.targetNodeId),
    realmNodeId,
    realmDefId: realmNodeId ? realmDefId : null,
    realmHeldLocationIds: realmEntry ? [...realmEntry.heldLocationIds] : [],
    grip: first.degradation,
  };
}

/**
 * The board term's input (Q4): `1` when the candidate's object is a Location the
 * actor holds, `HELD_REALM_AFFINITY_SHARE` when it is the Realm itself or a Location
 * the Realm holds, else `0`.
 *
 * Most candidates are on neither, which is what makes the term discriminate by
 * construction — the opposite of the THR-1301 shape, where a term whose population
 * was every candidate tuned nothing. A candidate with no target reads `0` (NFP #4).
 */
export function heldTownAffinity(
  standing: HoldStanding | null | undefined,
  targetNodeId: string | undefined,
): number {
  if (!standing || !targetNodeId) return 0;
  if (standing.heldLocationIds.includes(targetNodeId)) return 1;
  if (standing.realmNodeId && targetNodeId === standing.realmNodeId) return HELD_REALM_AFFINITY_SHARE;
  if (standing.realmHeldLocationIds.includes(targetNodeId)) return HELD_REALM_AFFINITY_SHARE;
  return 0;
}

/**
 * `degradation` → the word the sheet reads (Law 13). Bands are upper bounds in
 * ascending order; anything past the last bound (or not a finite number) reads the
 * last word, so a collapsing hold can never render as healthy.
 */
export function gripWord(degradation: number): string {
  const value = Number.isFinite(degradation) ? degradation : 1;
  for (const [bound, word] of HOLD_GRIP_WORDS) {
    if (value <= bound) return word;
  }
  return HOLD_GRIP_WORDS[HOLD_GRIP_WORDS.length - 1][1];
}

/**
 * The two questions the filter gate and the supply arm ask, memoised per agent for
 * one decision pass, over a projection that is resolved lazily and at most once.
 *
 * A reader rather than a projection because `ensureRealmProjection` takes a
 * fingerprint of every faction-`controls` edge on each call when the version is
 * current; most agents hold nothing, and this never touches the projection for them.
 */
export interface HoldReader {
  /** The standing of one agent, or `null` when they hold nothing. */
  standingFor(agentId: string): HoldStanding | null;
  /** The Realm claiming the ground under a Location, or `null`. */
  groundRealmOf(locationId: string | undefined): string | null;
}

export function createHoldReader(
  graph: WorldGraph,
  controls: readonly StrategicControlState[] | undefined,
  projection: RealmProjectionThunk | RealmProjection | null | undefined,
): HoldReader {
  let resolved: RealmProjection | null | undefined;
  const projectionOnce = (): RealmProjection | null => {
    if (resolved !== undefined) return resolved;
    try {
      resolved = typeof projection === 'function' ? projection() : (projection ?? null);
    } catch {
      // A projection that throws is already traced by `ensureRealmProjection`; never
      // let a standing lookup be what breaks a decision pass.
      resolved = null;
    }
    return resolved;
  };
  const standings = new Map<string, HoldStanding | null>();

  return {
    standingFor(agentId) {
      const cached = standings.get(agentId);
      if (cached !== undefined) return cached;
      // No stances at all is the overwhelming case: answer without the projection.
      const holds = controls?.some(c => c.active && c.actorId === agentId) ?? false;
      const standing = holds ? holdStanding(graph, controls, projectionOnce(), agentId) : null;
      standings.set(agentId, standing);
      return standing;
    },
    groundRealmOf(locationId) {
      return groundRealmNodeId(graph, projectionOnce(), locationId);
    },
  };
}
