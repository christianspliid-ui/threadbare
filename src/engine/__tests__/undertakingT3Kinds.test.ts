/**
 * Tier 3 shipped whole — THR-1309 (plan §5/§6, "The three vertical slices" #3),
 * absorbing THR-1295.
 *
 * One kind — `warband` — and the op the tier needed: `create_group`. T1's objects
 * were edges, possessions and actor-side records; T2's were places. T3's object is
 * the first that can act back on the world by itself, and it is also the first tier
 * that had to *remove* something to arrive.
 *
 * This file proves five things the kind row alone cannot:
 *
 * 1. **The mirage is gone.** `strategic_recruit_warband` has completed for the whole
 *    life of the corpus while minting nobody — its mutation wrote an intelligence
 *    record called `warband_recruited`, so the verb entered the completion history
 *    and every dashboard counted it, and no band ever existed. The test is on the
 *    *template*, because that is where the lie lived.
 * 2. **The minted band is a company by the discriminator the codebase shares.**
 *    `isCompanyGroupNode` / `getGroupKind` are the test (THR-1297 §4), not a
 *    property-bag presence check — so the band is visible to every group sweep and
 *    is never mistaken for a faction by the ~49 raw `member_of` call sites.
 * 3. **Selection and resolution agree.** The `group_node` rule is the trap-1 fix:
 *    the update targets only bands the actor commands and the destroy only bands
 *    they do not, checked at *selection*. Asserting the op's refusal alone would
 *    prove the guard and miss the arc, which is exactly how `press_the_mark`
 *    completed three times and minted zero debts.
 * 4. **The counter-play inertifies rather than deletes**, through the single
 *    dissolution writer, so membership edges survive carrying `leftAtTick`.
 * 5. **Nothing authored here is dead content.** Candidate generation runs off
 *    ambition `strategicProfile.templateIds`, so a template in no profile can never
 *    be offered to anyone — invisible by construction rather than merely rare.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { raiseWarband, reinforceWarband, disbandGroup, foundFaction } from '../strategicGraphOps';
import { getGroupKind, isCompanyGroupNode, isGroupMembershipTarget } from '../groupShape';
import { getGroupMemberEdges, getGroupMembers } from '../groups/groupQueries';
import { evaluateMotiveGate, resolveTargetOwners } from '../undertakingMotive';
import { getAllStrategicTemplates, getStrategicTemplate } from '../strategicActionCandidates';
import { UNDERTAKING_KIND_ROWS } from '../../data/undertaking-kinds';
import {
  AMBITION_TEMPLATES,
  GRIEVANCE_AMBITION_TEMPLATES,
  EVENT_MINTED_AMBITION_TEMPLATES,
} from '../../data/ambition-templates';
import {
  WARBAND_INITIAL_COHESION,
  WARBAND_RECRUIT_CAST_KEY,
  WARBAND_TARGET_MEMBER_COUNT,
} from '../../data/strategic-action-constants';
import { GROUP_MAX_MEMBERS } from '../../data/group-constants';
import type { GameState } from '../../types/gameState';
import type { StrategicFactionSeed } from '../../types/strategicAction';

const COMMANDER = 'actor_commander';
const RIVAL = 'actor_rival';
const HOLD = 'loc_hold';

/** Ids of the ordinary mortals standing at `HOLD`. */
function recruitIds(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `actor_recruit_${i}`);
}

function world(recruitCount = 4): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: HOLD, name: 'Coldwater', type: 'location',
    properties: { locationSubtype: 'town', locationType: 'town', hexCol: 4, hexRow: 4, prosperity: 30 },
  });
  for (const id of [COMMANDER, RIVAL]) {
    graph.addNode({ id, name: id, type: 'actor', properties: { actorType: 'individual' } });
    graph.addEdge({ id: `e_loc_${id}`, source: id, target: HOLD, type: 'located_at', properties: {} });
  }
  for (const id of recruitIds(recruitCount)) {
    graph.addNode({ id, name: id, type: 'actor', properties: { actorType: 'individual' } });
    graph.addEdge({ id: `e_loc_${id}`, source: id, target: HOLD, type: 'located_at', properties: {} });
  }
  return graph;
}

function makeState(graph: WorldGraph): GameState {
  return {
    tick: 1,
    cycle: 0,
    seed: 42,
    graph,
    phase: 'playing',
    cosmology: { reachDomains: [], spheres: [] },
    tiles: [],
    clock: { dayOfCycle: 0, ticksOfDay: 0 },
    ascendantId: 'asc_1',
    essencePool: {},
    mandateDefinition: null,
    mandateState: null,
    rivalDefinitions: [],
    rivalStates: [],
    doomDefinition: {} as GameState['doomDefinition'],
    doomClock: {} as GameState['doomClock'],
    tickEvents: [],
    recentEvents: [],
    chronicleEntries: [],
    stealthExposure: 0,
    visibilityMap: new Map(),
    familiarityMap: new Map(),
    culturalInsightMap: new Map(),
    encounterProgress: [],
    actionsInProgress: [],
    unifiedActions: [],
    worldSoul: {} as GameState['worldSoul'],
    echoDefinitions: [],
    echoStates: [],
    chronicle: { cycles: [], totalEntries: 0 },
  } as unknown as GameState;
}

// ─── The mirage, named and removed ──────────────────────────────────

describe('the recruit-warband mirage', () => {
  it('no longer records an intelligence entry in place of a band', () => {
    // The whole reason this tier could not simply register a row. The template
    // completed, was counted, and minted nobody — asserted on the template because
    // that is where the substitution lived, and because a row registered against it
    // in its old form would have been vacuity the registry gate could not see.
    const template = getStrategicTemplate('strategic_recruit_warband')!;
    expect(template.mutationHint).toEqual({ type: 'create_group', groupKind: 'company' });
  });

  it('carries the recruit cast — the halt that kept it off is fixed (THR-1321)', () => {
    // This pin is the inverse of the one it replaces, and the inversion is the point:
    // the old assertion said `false` and carried "restoring the cast is a deliberate
    // act that has to come back here and say the halt is fixed." This is that.
    //
    // The halt was never this template. `strategicActionLifecycle`'s phase return
    // rebuilt `strategicState` as a literal naming only `projects`/`controls`/
    // `history`, dropping `mintQueue` and `bindings` every tick — so a slot needing a
    // mint enqueued a birth the lifecycle valve never saw, deferred on `awaiting_mint`
    // forever, and timed out. Measured after the fix, seeds 42/99 × 150 ticks:
    //   cast + fix   → 12 ok / 0 fail, 9 bands  ·  12 ok / 1 fail, 11 bands
    //   fix, no cast →  8 ok / 1 fail, 4 bands  ·  10 ok / 4 fail,  8 bands
    //
    // Asserted on the *slot's shape*, not merely its presence: a cast whose
    // `acceptedRoles` were emptied or whose `mintRole` went missing would still
    // satisfy a bare `toBe(true)` while being unable to bind or mint anyone, which is
    // the same silent-inertness this ticket exists to end.
    const template = getStrategicTemplate('strategic_recruit_warband')!;
    const slot = template.cast?.find(c => c.key === WARBAND_RECRUIT_CAST_KEY);
    expect(slot).toBeDefined();
    expect(slot!.kind).toBe('actor');
    expect(slot!.persistence).toBe('must-persist');
    expect(slot!.mintRole).toBe('mercenary');
    expect(slot!.acceptedRoles?.length ?? 0).toBeGreaterThan(0);
  });

  it('leaves the reinforce verb castless, for a reason that is about its target', () => {
    // Not an oversight and not the same reason as the create verb's old one. A cast
    // slot's stage falls back to the undertaking's `targetNodeId`, and this verb
    // targets `{ type: 'group_node' }` — so the stage is a *group*, and a mint placed
    // there gets a group id as its `locationId`. Measured with the same cast the
    // create verb carries, seeds 42/99 × 150 ticks: every mint landed
    // `locationId → actor:group` (4 and 1). `buildHexActorIndex` reads that property,
    // so those recruits stand on no hex at all — and the undertaking still completes,
    // which is what makes it worth pinning rather than leaving to be rediscovered.
    const template = getStrategicTemplate('strategic_reinforce_warband')!;
    expect(template.targetRule?.type).toBe('group_node');
    expect(template.cast?.some(c => c.key === WARBAND_RECRUIT_CAST_KEY) ?? false).toBe(false);
  });

  it('still reads a bound cast when one exists — the path stays live', () => {
    // The ledger read is not dead code waiting on THR-1321: `raiseWarband` takes
    // bound ids today and prefers them over colocation, so restoring the cast is a
    // content edit. Exercised directly here because no shipped template feeds it.
    const state = makeState(world(4));
    const bound = [recruitIds(4)[3]];
    const band = raiseWarband(state, COMMANDER, bound).createdId!;
    expect(getGroupMembers(state.graph, band).map(n => n.id)).toContain(bound[0]);
  });

  it('does not require stage presence, which measures as total inertness', () => {
    // THR-1310's re-measurement: the wanderer family reports 0/115 rolled on seed 42
    // at `requiresLocation: true` — 100% `actor_absent` — because `isActorAtStage`
    // demands presence and the mover that would deliver it is unshipped. This verb
    // recruits at the commander's own location and needs no stage presence, so
    // authoring `true` here would make it inert by construction.
    expect(getStrategicTemplate('strategic_recruit_warband')!.requiresLocation).toBeFalsy();
  });
});

// ─── raiseWarband — the op the tier needed ──────────────────────────

describe('raiseWarband', () => {
  it('mints a company by the discriminator every group reader shares', () => {
    const state = makeState(world());
    const result = raiseWarband(state, COMMANDER);

    expect(result.success).toBe(true);
    const band = state.graph.getNode(result.createdId!)!;

    // Asserted through the shared predicate rather than by reading a property bag.
    // A hand-rolled check could pass while the sweeps that matter disagreed — the
    // failure `groupShape.ts` exists to end (THR-1297 §4).
    expect(getGroupKind(band)).toBe('company');
    expect(isCompanyGroupNode(band)).toBe(true);
    // And it must read as a *group* membership target, not a faction — otherwise
    // every raw `member_of` call site reports the band as its members' faction.
    expect(isGroupMembershipTarget(band)).toBe(true);
  });

  it('puts the commander in command and the recruits in the roster', () => {
    const state = makeState(world());
    const band = raiseWarband(state, COMMANDER).createdId!;

    const commandedBy = state.graph.getOutgoingEdges(band, 'commanded_by');
    expect(commandedBy).toHaveLength(1);
    expect(commandedBy[0].target).toBe(COMMANDER);

    const memberIds = getGroupMembers(state.graph, band).map(n => n.id);
    expect(memberIds).toContain(COMMANDER);
    expect(memberIds.length).toBeGreaterThan(1);
  });

  it('writes the schema-required member_of trio on every edge', () => {
    // `role` / `rank` / `joinedTick` are required by `edgeSchema`; armies use the
    // same names. An edge missing them is one the schema warns on every tick.
    const state = makeState(world());
    const band = raiseWarband(state, COMMANDER).createdId!;

    const edges = getGroupMemberEdges(state.graph, band);
    expect(edges.length).toBeGreaterThan(0); // not vacuous over an empty roster
    for (const edge of edges) {
      expect(edge.properties.role).toBeTruthy();
      expect(typeof edge.properties.rank).toBe('number');
      expect(typeof edge.properties.joinedTick).toBe('number');
    }
  });

  it('starts above the base cohesion — a recruited band is not an accident', () => {
    // `GROUP_COHESION_START_BASE` is for strangers who fell in together. These people
    // were recruited through the undertaking's checkpoints, which is the work that
    // cohesion measures.
    const state = makeState(world());
    const band = state.graph.getNode(raiseWarband(state, COMMANDER).createdId!)!;
    expect(band.properties.cohesion).toBeCloseTo(WARBAND_INITIAL_COHESION, 5);
  });

  it('prefers the bound cast, then tops up from whoever is standing there', () => {
    const state = makeState(world(4));
    const bound = [recruitIds(4)[3]];
    const band = raiseWarband(state, COMMANDER, bound).createdId!;

    const memberIds = getGroupMembers(state.graph, band).map(n => n.id);
    // The bound recruit is in the band, ahead of the colocated fill.
    expect(memberIds).toContain(bound[0]);
  });

  it('never enrols someone already in another band — two rosters, same people', () => {
    const state = makeState(world(4));
    const first = raiseWarband(state, COMMANDER).createdId!;
    const firstMembers = new Set(getGroupMembers(state.graph, first).map(n => n.id));

    const second = raiseWarband(state, RIVAL);
    if (second.success) {
      for (const id of getGroupMembers(state.graph, second.createdId!).map(n => n.id)) {
        if (id === RIVAL) continue;
        expect(firstMembers.has(id)).toBe(false);
      }
    }
  });

  it('refuses in an empty field rather than minting a band of nobody', () => {
    // The refusal is the honest outcome, and it is visible in the op result — which
    // is the difference between this and the record it replaces.
    const graph = new WorldGraph();
    graph.addNode({
      id: HOLD, name: 'Coldwater', type: 'location',
      properties: { locationSubtype: 'town', hexCol: 4, hexRow: 4 },
    });
    graph.addNode({ id: COMMANDER, name: 'C', type: 'actor', properties: { actorType: 'individual' } });
    graph.addEdge({ id: 'e1', source: COMMANDER, target: HOLD, type: 'located_at', properties: {} });

    const result = raiseWarband(makeState(graph), COMMANDER);
    expect(result.success).toBe(false);
    expect(result.error).toBe('no_recruits');
  });

  it('refuses a commander who is nowhere', () => {
    const graph = world();
    graph.removeEdge(`e_loc_${COMMANDER}`);
    const result = raiseWarband(makeState(graph), COMMANDER);
    expect(result.success).toBe(false);
    expect(result.error).toBe('no_location');
  });

  it('caps the roster at the authored target count', () => {
    const state = makeState(world(20));
    const band = raiseWarband(state, COMMANDER).createdId!;
    // Commander plus at most the target number of recruits.
    expect(getGroupMembers(state.graph, band).length).toBeLessThanOrEqual(
      WARBAND_TARGET_MEMBER_COUNT + 1,
    );
  });

  it('is deterministic — same world, same members (NFP #3)', () => {
    const a = makeState(world(6));
    const b = makeState(world(6));
    const bandA = raiseWarband(a, COMMANDER).createdId!;
    const bandB = raiseWarband(b, COMMANDER).createdId!;

    expect(bandA).toBe(bandB);
    expect(getGroupMembers(a.graph, bandA).map(n => n.id))
      .toEqual(getGroupMembers(b.graph, bandB).map(n => n.id));
  });
});

// ─── reinforceWarband — the update that is not a record ─────────────

describe('reinforceWarband', () => {
  it('actually adds people — the update column is not a second mirage', () => {
    // The nearest precedent (`strategic_extend_reach`) writes an intelligence record
    // and changes nothing about the network it claims to extend. Shipping that shape
    // here while removing it from `recruit_warband` would be a wash.
    const state = makeState(world(2));
    const band = raiseWarband(state, COMMANDER).createdId!;
    const before = getGroupMembers(state.graph, band).length;

    // New arrivals the first muster did not take.
    for (const id of ['actor_late_a', 'actor_late_b']) {
      state.graph.addNode({ id, name: id, type: 'actor', properties: { actorType: 'individual' } });
      state.graph.addEdge({ id: `e_loc_${id}`, source: id, target: HOLD, type: 'located_at', properties: {} });
    }

    const result = reinforceWarband(state, COMMANDER, band);
    expect(result.success).toBe(true);
    expect(getGroupMembers(state.graph, band).length).toBeGreaterThan(before);
  });

  it('refreshes the roster mirror, so a cascade-deleted edge stays detectable', () => {
    const state = makeState(world(2));
    const band = raiseWarband(state, COMMANDER).createdId!;
    state.graph.addNode({
      id: 'actor_late', name: 'late', type: 'actor', properties: { actorType: 'individual' },
    });
    state.graph.addEdge({
      id: 'e_loc_late', source: 'actor_late', target: HOLD, type: 'located_at', properties: {},
    });

    reinforceWarband(state, COMMANDER, band);
    const roster = state.graph.getNode(band)!.properties.roster as string[];
    expect(roster).toContain('actor_late');
  });

  it('refuses a full band rather than overflowing it', () => {
    const state = makeState(world(GROUP_MAX_MEMBERS + 8));
    const band = raiseWarband(state, COMMANDER).createdId!;
    // Fill to the cap.
    while (getGroupMembers(state.graph, band).length < GROUP_MAX_MEMBERS) {
      const r = reinforceWarband(state, COMMANDER, band);
      if (!r.success) break;
    }
    const result = reinforceWarband(state, COMMANDER, band);
    expect(result.success).toBe(false);
    expect(['band_full', 'no_recruits']).toContain(result.error);
  });

  it('refuses a disbanded band — an inert node is not reinforceable', () => {
    const state = makeState(world());
    const band = raiseWarband(state, COMMANDER).createdId!;
    disbandGroup(state, band);

    const result = reinforceWarband(state, COMMANDER, band);
    expect(result.success).toBe(false);
    expect(result.error).toBe('already_disbanded');
  });

  it('refuses a target that is not a company at all', () => {
    const state = makeState(world());
    const result = reinforceWarband(state, COMMANDER, HOLD);
    expect(result.success).toBe(false);
    expect(result.error).toBe('not_a_company');
  });
});

// ─── disbandGroup — the counter-play ────────────────────────────────

describe('disbandGroup', () => {
  it('inertifies rather than deleting — the node and its edges survive', () => {
    // A counter that removed the band would be deletion wearing a counter's name.
    // The groups system reads disbanded companies as history, and every membership
    // edge has to keep carrying `leftAtTick` for that history to be readable.
    //
    // **Read the RAW incoming edges, not `getGroupMemberEdges`.** That helper filters
    // to *live* membership (`leftAtTick == null`) by design, so it correctly returns
    // zero after a disband — which is the opposite of what this test is asking. The
    // first draft asserted against it and failed honestly; the draft below it then
    // iterated the same empty array and *passed vacuously*, which is the more
    // dangerous half of the same mistake.
    const state = makeState(world());
    const band = raiseWarband(state, COMMANDER).createdId!;
    const rawBefore = state.graph.getIncomingEdges(band, 'member_of').length;
    expect(rawBefore).toBeGreaterThan(0); // never let this comparison go vacuous
    expect(getGroupMemberEdges(state.graph, band).length).toBe(rawBefore);

    const result = disbandGroup(state, band);
    expect(result.success).toBe(true);

    expect(state.graph.getNode(band)).toBeDefined();
    expect(state.graph.getNode(band)!.properties.groupStatus).toBe('disbanded');
    // The edges are all still there…
    expect(state.graph.getIncomingEdges(band, 'member_of')).toHaveLength(rawBefore);
    // …and none of them counts as current membership any more.
    expect(getGroupMemberEdges(state.graph, band)).toHaveLength(0);
  });

  it('stamps leftAtTick on every membership edge', () => {
    const state = makeState(world());
    const band = raiseWarband(state, COMMANDER).createdId!;
    disbandGroup(state, band);

    const edges = state.graph.getIncomingEdges(band, 'member_of');
    // The guard that stops this from passing over an empty list — the exact way its
    // first draft passed while proving nothing.
    expect(edges.length).toBeGreaterThan(0);
    for (const edge of edges) {
      expect(edge.properties.leftAtTick).toBe(state.tick);
      expect(edge.properties.leaveReason).toBeTruthy();
    }
  });

  it('refuses to break the same band twice', () => {
    const state = makeState(world());
    const band = raiseWarband(state, COMMANDER).createdId!;
    disbandGroup(state, band);

    const second = disbandGroup(state, band);
    expect(second.success).toBe(false);
    expect(second.error).toBe('already_disbanded');
  });

  it('refuses a target that is not a company', () => {
    const state = makeState(world());
    const result = disbandGroup(state, HOLD);
    expect(result.success).toBe(false);
    expect(result.error).toBe('not_a_company');
  });
});

// ─── foundFaction — THR-1295's Done-when ────────────────────────────

const SEED: StrategicFactionSeed = {
  factionType: 'guild',
  nameTemplate: "Edda's Order",
  description: 'A chartered order.',
  iconGlyph: '⚜',
  themeColor: '#B8A56A',
  locationTypes: ['town', 'city', 'capital'],
  joinEncounterTemplateId: 'ag.join',
  promotionEncounterTemplateId: 'ag.promotion',
  questTemplateIds: ['ag.quest.escort_caravan'],
  socialTemplateIds: ['ag.social.tavern_tales'],
};

describe('foundFaction', () => {
  it('restores the producer `dynamicFactionDefinitions` never had', () => {
    // The measured gap THR-1295 recorded: a declared `GameState` field, an
    // IA-manifest row, and no live writer anywhere since the initiative retirement.
    // The world could not gain a faction after worldgen by any path.
    const state = makeState(world());
    const result = foundFaction(state, COMMANDER, HOLD, SEED, { heart: 0.5 }, "Edda's Order", 5);

    expect(result.success).toBe(true);
    const defs = state.dynamicFactionDefinitions!;
    expect(Object.keys(defs)).toHaveLength(1);

    const definition = Object.values(defs)[0];
    // The four content-id lists must survive onto the definition — a faction whose
    // encounters resolve to nothing is live by every dashboard and inert in play.
    expect(definition.joinEncounterTemplateId).toBe('ag.join');
    expect(definition.promotionEncounterTemplateId).toBe('ag.promotion');
    expect(definition.questTemplateIds).toEqual(['ag.quest.escort_caravan']);
    expect(definition.socialTemplateIds).toEqual(['ag.social.tavern_tales']);
    expect(definition.rankTiers.length).toBeGreaterThan(0);
  });

  it('mints a faction node the graph can actually find', () => {
    const state = makeState(world());
    const result = foundFaction(state, COMMANDER, HOLD, SEED, { heart: 0.5 }, "Edda's Order", 5);

    const faction = state.graph.getNode(result.createdId!)!;
    expect(faction).toBeDefined();
    expect(faction.properties.actorType).toBe('faction');
    // Not a group — the group discriminator must not claim it, or every `member_of`
    // sweep would read the order's members as a company's (THR-1297 §4).
    expect(getGroupKind(faction)).toBeUndefined();
  });

  it('records who chartered it, on a schema-legal edge', () => {
    // `commanded_by` (actor → actor), not `constructed_by` (location → actor). The
    // first draft used the latter and every founding logged a `[GraphSchema]` source
    // violation — a malformed edge that nothing threw on, which is trap 2 exactly.
    const state = makeState(world());
    const result = foundFaction(state, COMMANDER, HOLD, SEED, { heart: 0.5 }, "Edda's Order", 5);

    const led = state.graph.getOutgoingEdges(result.createdId!, 'commanded_by');
    expect(led).toHaveLength(1);
    expect(led[0].target).toBe(COMMANDER);
    expect(state.graph.getOutgoingEdges(result.createdId!, 'constructed_by')).toHaveLength(0);
  });

  it('rolls the definition back when the order gets no seat', () => {
    // The seeder fail-softs to a hall-less faction when nothing qualifies. That is an
    // order with no seat, and leaving the entry behind would give the faction layer a
    // definition it reads forever for a faction that never stood up.
    const graph = new WorldGraph();
    graph.addNode({ id: COMMANDER, name: 'C', type: 'actor', properties: { actorType: 'individual' } });
    graph.addNode({
      id: HOLD, name: 'Wastes', type: 'location',
      // A subtype no `locationTypes` entry accepts — nothing qualifies.
      properties: { locationSubtype: 'ruins', locationType: 'ruins', hexCol: 1, hexRow: 1 },
    });
    const state = makeState(graph);

    const result = foundFaction(state, COMMANDER, HOLD, SEED, { heart: 0.5 }, "Edda's Order", 5);
    expect(result.success).toBe(false);
    expect(result.error).toBe('no_qualifying_locations');
    expect(Object.keys(state.dynamicFactionDefinitions ?? {})).toHaveLength(0);
  });

  it('refuses to charter the same order twice on one tick', () => {
    const state = makeState(world());
    foundFaction(state, COMMANDER, HOLD, SEED, { heart: 0.5 }, "Edda's Order", 5);
    const second = foundFaction(state, COMMANDER, HOLD, SEED, { heart: 0.5 }, "Edda's Order", 5);
    expect(second.success).toBe(false);
    expect(second.error).toBe('faction_already_founded');
  });

  it('is deterministic — same world, same faction id (NFP #3)', () => {
    const a = foundFaction(makeState(world()), COMMANDER, HOLD, SEED, { heart: 0.5 }, 'O', 5);
    const b = foundFaction(makeState(world()), COMMANDER, HOLD, SEED, { heart: 0.5 }, 'O', 5);
    expect(a.createdId).toBe(b.createdId);
  });
});

// ─── The `found_order` payoff, at the template ──────────────────────

describe('strategic_found_order', () => {
  it('now charters a faction rather than only building a room', () => {
    // THR-1295's Done-when, asserted where the gap was: the template shipped a
    // guild-hall sublocation and stopped, carrying a TODO that named this ticket.
    const hint = getStrategicTemplate('strategic_found_order')!.mutationHint!;
    expect(hint.type).toBe('create_group');
    expect(hint).toMatchObject({ groupKind: 'faction' });
  });

  it('carries a faction seed whose content ids all resolve', () => {
    // The refusal condition the op enforces, checked here at authoring time: a seed
    // pointing at content that does not exist would found an order whose join and
    // quest encounters resolve to nothing.
    const hint = getStrategicTemplate('strategic_found_order')!.mutationHint!;
    expect(hint.type).toBe('create_group');
    if (hint.type !== 'create_group') return;

    const seed = hint.factionSeed!;
    expect(seed).toBeDefined();
    expect(seed.questTemplateIds.length).toBeGreaterThan(0);
    expect(seed.socialTemplateIds.length).toBeGreaterThan(0);
    expect(seed.joinEncounterTemplateId).toBeTruthy();
    expect(seed.promotionEncounterTemplateId).toBeTruthy();
  });
});

// ─── The kind row, and the arc it closes ────────────────────────────

describe('the warband kind row', () => {
  const row = UNDERTAKING_KIND_ROWS.find(r => r.kindId === 'warband')!;

  it('is registered with a full CRUD closure', () => {
    expect(row).toBeDefined();
    expect(row.tier).toBe(3);
    expect(row.createTemplateIds).toContain('strategic_recruit_warband');
    expect(row.updateTemplateIds).toContain('strategic_reinforce_warband');
    expect(row.destroyTemplateIds).toContain('strategic_suborn_warband');
  });

  it('is commanded, not held — people are not ground', () => {
    // The same line the tier-1 `network` row draws. Holdings is about ground, and a
    // band of mortals is not ground however large it gets.
    expect(row.ownable).toBe(false);
  });

  it('names a counter-play that is cross-family and motive-gated', () => {
    // The D column is what the *world* can do to take a work back, so the warlord who
    // raised the band cannot un-raise it — a self-spend is a use, not a counter.
    const create = getStrategicTemplate(row.createTemplateIds[0])!;
    const destroy = getStrategicTemplate(row.destroyTemplateIds[0])!;

    expect(destroy.verb).toBe('destroy');
    expect(destroy.motiveGate?.length).toBeGreaterThan(0);
    expect(destroy.behaviorFamily).not.toBe(create.behaviorFamily);
  });
});

// ─── Selection agrees with resolution (trap 1) ──────────────────────

describe('the group_node target rule', () => {
  it('points the update at bands the actor commands', () => {
    const rule = getStrategicTemplate('strategic_reinforce_warband')!.targetRule;
    expect(rule).toEqual({
      type: 'group_node', groupKind: 'company', ownership: 'commanded_by_actor',
    });
  });

  it('points the destroy at bands the actor does NOT command', () => {
    // Without this the counter-play would be offered against the actor's own band —
    // a self-spend wearing a counter's name, and the taxonomic error the whole D
    // column is defined against.
    const rule = getStrategicTemplate('strategic_suborn_warband')!.targetRule;
    expect(rule).toEqual({
      type: 'group_node', groupKind: 'company', ownership: 'other_commander',
    });
  });
});

// ─── The counter-play is reachable end to end ───────────────────────

describe('the suborn chain resolves, gate included', () => {
  it('resolves a band’s commander as the owner the motive gate aims at', () => {
    // The link the whole counter-play hangs on, and it is not obvious: a company is
    // not owned by a `controls` edge, so `resolveTargetOwners` has to find the
    // commander through `commanded_by`. If it did not, a motive-gated destroy aimed
    // at a band could never pass its own gate — the verb would be registered,
    // authored, offered and structurally unable to fire, which is precisely the
    // vacuity the kind registry exists to refuse.
    const state = makeState(world());
    const band = raiseWarband(state, COMMANDER).createdId!;

    expect(resolveTargetOwners(state.graph, band)).toContain(COMMANDER);
  });

  it('passes the gate for a rival who holds a grudge, and refuses one who does not', () => {
    const state = makeState(world());
    const band = raiseWarband(state, COMMANDER).createdId!;
    const template = getStrategicTemplate('strategic_suborn_warband')!;

    // No quarrel yet — a gated verb with nothing behind it is refused.
    expect(evaluateMotiveGate(state.graph, RIVAL, band, template).allowed).toBe(false);

    // Give the rival a reason, aimed at the *commander*, not the band.
    state.graph.addEdge({
      id: 'e_hostile', source: RIVAL, target: COMMANDER, type: 'hostile_to', properties: {},
    });
    expect(evaluateMotiveGate(state.graph, RIVAL, band, template).allowed).toBe(true);
  });

  it('and the op then actually breaks the band', () => {
    // The last link: gate passed, mutation lands. Asserted as a chain rather than in
    // isolation because each piece was individually correct in the `press_the_mark`
    // failure too — what was missing there was that they connected.
    const state = makeState(world());
    const band = raiseWarband(state, COMMANDER).createdId!;
    state.graph.addEdge({
      id: 'e_hostile', source: RIVAL, target: COMMANDER, type: 'hostile_to', properties: {},
    });

    const template = getStrategicTemplate('strategic_suborn_warband')!;
    expect(evaluateMotiveGate(state.graph, RIVAL, band, template).allowed).toBe(true);
    expect(disbandGroup(state, band).success).toBe(true);
    expect(state.graph.getNode(band)!.properties.groupStatus).toBe('disbanded');
  });
});

// ─── No dead content ────────────────────────────────────────────────

describe('the T3 templates are reachable', () => {
  const ALL_PROFILE_TEMPLATE_IDS = new Set(
    [...AMBITION_TEMPLATES, ...GRIEVANCE_AMBITION_TEMPLATES, ...EVENT_MINTED_AMBITION_TEMPLATES]
      .flatMap(a => a.strategicProfile?.templateIds ?? []),
  );

  it('every T3 template is named by at least one ambition profile', () => {
    // Candidate generation runs off `strategicProfile.templateIds`. A template in no
    // profile can never be offered to anyone — invisible by construction rather than
    // merely rare, which is the shape of dead content this whole tier exists against.
    for (const id of [
      'strategic_recruit_warband',
      'strategic_reinforce_warband',
      'strategic_suborn_warband',
      'strategic_found_order',
    ]) {
      expect(ALL_PROFILE_TEMPLATE_IDS.has(id), `${id} is in no ambition profile`).toBe(true);
    }
  });

  it('every T3 template resolves in the template registry', () => {
    const known = new Set(getAllStrategicTemplates().map(t => t.id));
    for (const id of [
      'strategic_recruit_warband',
      'strategic_reinforce_warband',
      'strategic_suborn_warband',
    ]) {
      expect(known.has(id), `${id} does not resolve`).toBe(true);
    }
  });
});
