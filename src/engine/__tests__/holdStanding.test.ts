/**
 * THR-1448 — a held town is a faction position.
 *
 * The reading (`holdStanding.ts`) and its one write (`reconcileHoldStandings`), on
 * fixtures that falsify. Every arm here is written against a specific wrong answer:
 * a standing that is a record, a `rank` that gets written, a wilds hold that opens a
 * membership, a second pass that announces twice, a closing that expels.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  holdStanding,
  heldTownAffinity,
  gripWord,
  createHoldReader,
  groundRealmNodeId,
  type HoldStandingLedgerEntry,
} from '../holdStanding';
import { reconcileHoldStandings } from '../strategicActionLifecycle';
import { findMembershipEdge } from '../factionMembership';
import { buildRealmDefinition } from '../../data/realm-content';
import {
  registerDynamicFactionDefinition,
  unregisterDynamicFactionDefinition,
  getFactionDefinition,
} from '../../data/faction-definition-lookup';
import { computeRankFromReputation } from '../../types/faction';
import {
  HOLD_STANDING_REPUTATION_SEED,
  HELD_REALM_AFFINITY_SHARE,
  HOLD_GRIP_WORDS,
  HOLD_STANDING_EVENT_SIGNIFICANCE,
} from '../../data/strategic-action-constants';
import { enableTracing, disableTracing, clearTraces, getTraces } from '../traceBuffer';
import type { RealmProjection } from '../realmProjection';
import type { StrategicControlState } from '../../types/strategicAction';
import type { TickEvent } from '../../types/gameState';
import type { MemberOfEdgeProperties } from '../../types/disposition';

const KEEPER = 'actor_keeper';
const OTHER = 'actor_other';
const REALM = 'faction_realm_vael';
const REALM_DEF = 'realm.vael';
const ASH = 'loc_ashford';        // on the Realm's ground
const REALM_SEAT = 'loc_seat';    // the Realm's own holding
const WILD = 'loc_wild';          // unclaimed ground
const HALL = 'place_hall';        // a Place inside Ashford

function buildWorld(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: KEEPER, name: 'Sera Goldvein', type: 'actor', properties: { actorType: 'individual' } });
  graph.addNode({ id: OTHER, name: 'Corin Ashvale', type: 'actor', properties: { actorType: 'individual' } });
  graph.addNode({
    id: REALM, name: 'Realm of the Vael', type: 'actor',
    properties: { actorType: 'faction', factionClass: 'realm', factionDefId: REALM_DEF },
  });
  graph.addNode({ id: ASH, name: 'Ashford', type: 'location', properties: { locationSubtype: 'town', hexCol: 4, hexRow: 7 } });
  graph.addNode({ id: REALM_SEAT, name: 'Vaelmoor', type: 'location', properties: { locationSubtype: 'city', hexCol: 6, hexRow: 7 } });
  graph.addNode({ id: WILD, name: 'Farhold', type: 'location', properties: { locationSubtype: 'town', hexCol: 20, hexRow: 20 } });
  graph.addNode({ id: HALL, name: 'The Moot Hall', type: 'location', properties: { locationSubtype: 'hall', parentLocationId: ASH } });
  graph.addEdge({ id: 'realm_holds_seat', source: REALM, target: REALM_SEAT, type: 'controls', properties: { role: 'seat' } });
  return graph;
}

/** The political map as the border draws it: Ashford's hex and the seat's belong to the Vael; Farhold's to nobody. */
function projection(): RealmProjection {
  return {
    realms: [{
      id: REALM, name: 'Realm of the Vael', seatHex: { col: 6, row: 7 }, seatLocationId: REALM_SEAT,
      heldLocationIds: [REALM_SEAT], hexes: [{ col: 4, row: 7 }, { col: 6, row: 7 }],
    }],
    hexRealmId: new Map([['4,7', REALM], ['6,7', REALM]]),
    unclaimedHexes: 0,
  };
}

function stance(actorId: string, targetNodeId: string, overrides: Partial<StrategicControlState> = {}): StrategicControlState {
  return {
    controlId: `ctrl_${actorId}_${targetNodeId}`,
    actorId,
    templateId: 'cell.control_claim.location',
    ambitionId: 'ambition_test',
    targetNodeId,
    verb: 'control',
    behaviorFamily: 'merchant-expansion',
    establishedTick: 1,
    neglectTicks: 0,
    active: true,
    degradation: 0,
    ...overrides,
  };
}

beforeAll(() => {
  registerDynamicFactionDefinition(buildRealmDefinition({ cultureId: 'vael', name: 'Realm of the Vael' }));
});
afterAll(() => {
  unregisterDynamicFactionDefinition(REALM_DEF);
});

// ─── The reading ────────────────────────────────────────────────

describe('holdStanding — the reading', () => {
  it('a stance on a town inside a Realm’s projection names that Realm, the town and the grip', () => {
    const graph = buildWorld();
    const s = holdStanding(graph, [stance(KEEPER, ASH, { degradation: 0.2 })], projection(), KEEPER);
    expect(s).not.toBeNull();
    expect(s!.realmNodeId).toBe(REALM);
    expect(s!.realmDefId).toBe(REALM_DEF);
    expect(s!.townId).toBe(ASH);
    expect(s!.heldLocationIds).toEqual([ASH]);
    expect(s!.realmHeldLocationIds).toEqual([REALM_SEAT]);
    expect(s!.grip).toBe(0.2);
  });

  it('a stance in the wilds is a reading with no Realm — a hold is just a hold', () => {
    const graph = buildWorld();
    const s = holdStanding(graph, [stance(KEEPER, WILD)], projection(), KEEPER);
    expect(s).not.toBeNull();
    expect(s!.realmNodeId).toBeNull();
    expect(s!.realmDefId).toBeNull();
    expect(s!.townId).toBe(WILD);
    expect(s!.realmHeldLocationIds).toEqual([]);
  });

  it('no stance, an inactive stance, or someone else’s stance reads null', () => {
    const graph = buildWorld();
    expect(holdStanding(graph, [], projection(), KEEPER)).toBeNull();
    expect(holdStanding(graph, undefined, projection(), KEEPER)).toBeNull();
    expect(holdStanding(graph, [stance(KEEPER, ASH, { active: false })], projection(), KEEPER)).toBeNull();
    expect(holdStanding(graph, [stance(OTHER, ASH)], projection(), KEEPER)).toBeNull();
  });

  it('two stances by one actor: the first by id names the standing, both towns are held', () => {
    const graph = buildWorld();
    const b = stance(KEEPER, WILD, { controlId: 'ctrl_b' });
    const a = stance(KEEPER, ASH, { controlId: 'ctrl_a', degradation: 0.5 });
    const s = holdStanding(graph, [b, a], projection(), KEEPER);
    expect(s!.controlId).toBe('ctrl_a');
    expect(s!.townId).toBe(ASH);
    expect(s!.realmNodeId).toBe(REALM);
    expect(s!.heldLocationIds).toEqual([ASH, WILD]);
    expect(s!.grip).toBe(0.5);
  });

  it('a Realm the projection names but the graph no longer holds reads as no Realm, never a dangling id', () => {
    const graph = buildWorld();
    graph.removeNode(REALM);
    const s = holdStanding(graph, [stance(KEEPER, ASH)], projection(), KEEPER);
    expect(s!.realmNodeId).toBeNull();
  });

  it('the ground question resolves a Place up to its Location, and a projection-less call answers null', () => {
    const graph = buildWorld();
    expect(groundRealmNodeId(graph, projection(), HALL)).toBe(REALM);
    expect(groundRealmNodeId(graph, projection(), WILD)).toBeNull();
    expect(groundRealmNodeId(graph, null, ASH)).toBeNull();
    expect(groundRealmNodeId(graph, projection(), 'loc_missing')).toBeNull();
  });
});

// ─── The board term ─────────────────────────────────────────────

describe('heldTownAffinity — the board term’s three values', () => {
  const graph = buildWorld();
  const s = holdStanding(graph, [stance(KEEPER, ASH)], projection(), KEEPER)!;

  it('is 1 on the held town, the share on the Realm’s other holdings and the Realm itself, else 0', () => {
    expect(heldTownAffinity(s, ASH)).toBe(1);
    expect(heldTownAffinity(s, REALM_SEAT)).toBe(HELD_REALM_AFFINITY_SHARE);
    expect(heldTownAffinity(s, REALM)).toBe(HELD_REALM_AFFINITY_SHARE);
    expect(heldTownAffinity(s, WILD)).toBe(0);
    expect(heldTownAffinity(s, OTHER)).toBe(0);
  });

  it('is 0 with no standing, and 0 for a candidate with no target (NFP #4)', () => {
    expect(heldTownAffinity(null, ASH)).toBe(0);
    expect(heldTownAffinity(undefined, ASH)).toBe(0);
    expect(heldTownAffinity(s, undefined)).toBe(0);
  });

  it('a wilds hold still scores 1 on its own town and nothing on any Realm', () => {
    const w = holdStanding(graph, [stance(KEEPER, WILD)], projection(), KEEPER)!;
    expect(heldTownAffinity(w, WILD)).toBe(1);
    expect(heldTownAffinity(w, REALM_SEAT)).toBe(0);
  });
});

describe('gripWord — the sheet’s word for degradation', () => {
  it('bands ascend firm → slipping → failing, and a non-number reads the last word', () => {
    expect(gripWord(0)).toBe('firm');
    expect(gripWord(HOLD_GRIP_WORDS[0][0])).toBe('firm');
    expect(gripWord(0.5)).toBe('slipping');
    expect(gripWord(0.9)).toBe('failing');
    expect(gripWord(1)).toBe('failing');
    expect(gripWord(Number.NaN)).toBe('failing');
    expect(gripWord(2)).toBe('failing');
  });
});

// ─── The reader ─────────────────────────────────────────────────

describe('createHoldReader — lazy and memoised', () => {
  it('never touches the projection for an agent who holds nothing, and asks it at most once', () => {
    const graph = buildWorld();
    let calls = 0;
    const reader = createHoldReader(graph, [stance(KEEPER, ASH)], () => { calls += 1; return projection(); });
    expect(reader.standingFor(OTHER)).toBeNull();
    expect(calls).toBe(0);
    expect(reader.standingFor(KEEPER)!.realmNodeId).toBe(REALM);
    expect(reader.standingFor(KEEPER)!.realmNodeId).toBe(REALM);
    expect(reader.groundRealmOf(REALM_SEAT)).toBe(REALM);
    expect(calls).toBe(1);
  });

  it('a projection that throws degrades to “just a hold” rather than breaking the pass', () => {
    const graph = buildWorld();
    const reader = createHoldReader(graph, [stance(KEEPER, ASH)], () => { throw new Error('map down'); });
    const s = reader.standingFor(KEEPER);
    expect(s).not.toBeNull();
    expect(s!.realmNodeId).toBeNull();
    expect(reader.groundRealmOf(ASH)).toBeNull();
  });

  it('accepts a projection value as well as a thunk', () => {
    const graph = buildWorld();
    const reader = createHoldReader(graph, [stance(KEEPER, ASH)], projection());
    expect(reader.standingFor(KEEPER)!.realmNodeId).toBe(REALM);
  });
});

// ─── The one write ──────────────────────────────────────────────

describe('reconcileHoldStandings — opens once, seeds reputation, never rank, closes without expelling', () => {
  beforeEach(() => { enableTracing(); clearTraces(); });
  afterAll(() => { disableTracing(); });

  const lifecycleTraces = () => getTraces().filter(t => t.category === 'strategic_control_lifecycle') as Array<
    { event: string; realmNodeId?: string; membershipMinted?: boolean; actorId: string; targetNodeId: string }
  >;

  it('a stance on the Realm’s ground mints the membership with the seed and derives to *subject*', () => {
    const graph = buildWorld();
    const ledger = new Map<string, HoldStandingLedgerEntry>();
    const events: TickEvent[] = [];
    const controls = [stance(KEEPER, ASH)];

    reconcileHoldStandings(graph, controls, projection(), 5, ledger, events);

    const edge = findMembershipEdge(graph, KEEPER, REALM);
    expect(edge).toBeDefined();
    const props = edge!.properties as Partial<MemberOfEdgeProperties>;
    expect(props.reputation).toBe(HOLD_STANDING_REPUTATION_SEED);
    expect(props.factionDefId).toBe(REALM_DEF);
    // `rank` is never written by this plan — it stays what `joinFaction` minted.
    expect(props.rank).toBe(0);
    // …and the rank the reader everyone uses derives from the seed is the ladder's second rung.
    const def = getFactionDefinition(REALM_DEF)!;
    expect(computeRankFromReputation(props.reputation!, def).id).toBe('subject');

    const opened = lifecycleTraces().filter(t => t.event === 'position_opened');
    expect(opened).toHaveLength(1);
    expect(opened[0]).toMatchObject({ realmNodeId: REALM, membershipMinted: true, actorId: KEEPER, targetNodeId: ASH });

    expect(events).toHaveLength(1);
    expect(events[0].message).toBe('Sera Goldvein keeps Ashford for Realm of the Vael');
    expect(events[0].significance).toBe(HOLD_STANDING_EVENT_SIGNIFICANCE);
    expect(ledger.get(controls[0].controlId)).toEqual({ actorId: KEEPER, targetNodeId: ASH, realmNodeId: REALM });
  });

  it('a second pass announces nothing and writes nothing — the ledger makes it idempotent', () => {
    const graph = buildWorld();
    const ledger = new Map<string, HoldStandingLedgerEntry>();
    const events: TickEvent[] = [];
    const controls = [stance(KEEPER, ASH)];
    reconcileHoldStandings(graph, controls, projection(), 5, ledger, events);
    clearTraces();
    const before = { ...(findMembershipEdge(graph, KEEPER, REALM)!.properties) };

    reconcileHoldStandings(graph, controls, projection(), 6, ledger, events);

    expect(lifecycleTraces()).toHaveLength(0);
    expect(events).toHaveLength(1);
    expect(findMembershipEdge(graph, KEEPER, REALM)!.properties).toEqual(before);
  });

  it('a keeper already a member gets membershipMinted:false and keeps the reputation they earned', () => {
    const graph = buildWorld();
    graph.addEdge({
      id: `member_${KEEPER}_${REALM}`, source: KEEPER, target: REALM, type: 'member_of',
      properties: { role: 'yeoman', rank: 0.3, joinedTick: 1, reputation: 0.4, factionDefId: REALM_DEF },
    });
    const ledger = new Map<string, HoldStandingLedgerEntry>();
    const events: TickEvent[] = [];

    reconcileHoldStandings(graph, [stance(KEEPER, ASH)], projection(), 5, ledger, events);

    const props = findMembershipEdge(graph, KEEPER, REALM)!.properties as Partial<MemberOfEdgeProperties>;
    expect(props.reputation).toBe(0.4);
    expect(props.rank).toBe(0.3);
    const opened = lifecycleTraces().filter(t => t.event === 'position_opened');
    expect(opened).toHaveLength(1);
    expect(opened[0].membershipMinted).toBe(false);
    // The standing still opens — the chronicle line is about the town, not the edge.
    expect(events).toHaveLength(1);
  });

  it('a stance in the wilds opens nothing: no membership, no trace, no line — but it is ledgered so it is not re-asked', () => {
    const graph = buildWorld();
    const ledger = new Map<string, HoldStandingLedgerEntry>();
    const events: TickEvent[] = [];
    const controls = [stance(KEEPER, WILD)];

    reconcileHoldStandings(graph, controls, projection(), 5, ledger, events);

    expect(findMembershipEdge(graph, KEEPER, REALM)).toBeUndefined();
    expect(lifecycleTraces()).toHaveLength(0);
    expect(events).toHaveLength(0);
    expect(ledger.get(controls[0].controlId)).toEqual({ actorId: KEEPER, targetNodeId: WILD, realmNodeId: null });
  });

  it('no projection this tick: the stance stays unledgered and is asked again next pass', () => {
    const graph = buildWorld();
    const ledger = new Map<string, HoldStandingLedgerEntry>();
    const events: TickEvent[] = [];
    const controls = [stance(KEEPER, ASH)];

    reconcileHoldStandings(graph, controls, null, 5, ledger, events);
    expect(ledger.size).toBe(0);
    expect(findMembershipEdge(graph, KEEPER, REALM)).toBeUndefined();

    reconcileHoldStandings(graph, controls, projection(), 6, ledger, events);
    expect(ledger.size).toBe(1);
    expect(findMembershipEdge(graph, KEEPER, REALM)).toBeDefined();
  });

  it('a stance that is gone closes the standing with its ids and leaves the membership in place', () => {
    const graph = buildWorld();
    const ledger = new Map<string, HoldStandingLedgerEntry>();
    const events: TickEvent[] = [];
    const controls = [stance(KEEPER, ASH)];
    reconcileHoldStandings(graph, controls, projection(), 5, ledger, events);
    clearTraces();

    // Collapsed or seized: `retireControl` has already dropped the record.
    reconcileHoldStandings(graph, [], projection(), 9, ledger, events);

    const closed = lifecycleTraces().filter(t => t.event === 'position_closed');
    expect(closed).toHaveLength(1);
    expect(closed[0]).toMatchObject({ realmNodeId: REALM, actorId: KEEPER, targetNodeId: ASH });
    expect(ledger.size).toBe(0);
    // The court remembers its keeper: the edge stays, at whatever it earned.
    expect(findMembershipEdge(graph, KEEPER, REALM)).toBeDefined();
    expect(events).toHaveLength(1); // only the opening line — nothing on close
  });

  it('an inactive stance still listed counts as gone, and a wilds entry closes silently', () => {
    const graph = buildWorld();
    const ledger = new Map<string, HoldStandingLedgerEntry>();
    const events: TickEvent[] = [];
    reconcileHoldStandings(graph, [stance(KEEPER, ASH), stance(OTHER, WILD)], projection(), 5, ledger, events);
    clearTraces();

    reconcileHoldStandings(graph, [stance(KEEPER, ASH, { active: false })], projection(), 6, ledger, events);

    const closed = lifecycleTraces().filter(t => t.event === 'position_closed');
    expect(closed).toHaveLength(1);
    expect(closed[0].actorId).toBe(KEEPER);
    expect(ledger.size).toBe(0);
  });
});
