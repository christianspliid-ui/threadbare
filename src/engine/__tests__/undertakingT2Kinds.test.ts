/**
 * Tier 2 shipped whole — THR-1308 (plan §5/§6, "The three vertical slices" #2).
 *
 * Two kinds — `trade_route` and `place_location` — and the one op the tier needed
 * before it could exist at all. T1's objects were edges, possessions and actor-side
 * records; none of those needs a node standing on the map, so nothing in the corpus
 * minted a *place*. `create_location` is that op, and this file proves four things
 * the kind rows alone cannot:
 *
 * 1. **The minted place is place-tier, by the discriminator the codebase shares.**
 *    `isLocationNode` is the test (THR-1183), not a subtype string and not a
 *    node type — so a founded settlement is visible to `getLocationNodes`
 *    sweeps and absent from `getPlaceNodes` ones, without either learning a
 *    new shape.
 * 2. **The blockade lands in an economy that already reads it.** Asserting the
 *    `threatened` flag alone would be the write-without-consumer failure the plan's
 *    own gate refuses — it proves the write, never the effect. So the headline
 *    assertion runs the **real `phaseProsperity`** over two worlds one blockade
 *    apart and reads the endpoint's prosperity, with the arm confirming it applied.
 *    That arm is also what caught the first draft of this fixture: an endpoint
 *    typed `market` (not a `LocationSubtype`) has no carrying capacity, so the
 *    "open route" control earned nothing and the comparison would have been
 *    vacuous in the passing direction.
 * 3. **The blockade suspends rather than deletes.** A counter that removed the edge
 *    would be deletion wearing a counter's name; the edge must survive, and
 *    `routeEvents` must still be able to clear the flag.
 * 4. **Nothing authored here is dead content.** Candidate generation runs off
 *    ambition `strategicProfile.templateIds`, so a template in no profile can never
 *    be offered to anyone — invisible by construction rather than merely rare.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  createLocation,
  blockadeRoute,
  createTradeRoute,
  findRouteIdentityNode,
} from '../strategicGraphOps';
import { findUnclaimedSite } from '../strategicActionLifecycle';
import { isLocationNode, isPlaceNode, getLocationNodes } from '../sublocationShape';
import { getAllStrategicTemplates, getStrategicTemplate } from '../strategicActionCandidates';
import { UNDERTAKING_KIND_ROWS } from '../../data/undertaking-kinds';
import {
  AMBITION_TEMPLATES,
  GRIEVANCE_AMBITION_TEMPLATES,
  EVENT_MINTED_AMBITION_TEMPLATES,
} from '../../data/ambition-templates';
import { ROUTE_IDENTITY_SUBTYPE } from '../../data/strategic-action-constants';
import { phaseProsperity, BASE_CARRYING_CAPACITY } from '../phaseProsperity';
import type { GameState } from '../../types/gameState';

const FOUNDER = 'actor_founder';
const WARLORD = 'actor_warlord';
const ORIGIN = 'loc_origin';
const DEST = 'loc_dest';

function world(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: FOUNDER, name: 'Edda Marrow', type: 'actor',
    properties: { actorType: 'individual' },
  });
  graph.addNode({
    id: WARLORD, name: 'Roth Kell', type: 'actor',
    properties: { actorType: 'individual' },
  });
  graph.addNode({
    id: ORIGIN, name: 'Coldwater', type: 'location',
    properties: { locationSubtype: 'town', locationType: 'town', hexCol: 4, hexRow: 4, prosperity: 30 },
  });
  graph.addNode({
    id: DEST, name: 'Ashford', type: 'location',
    properties: { locationSubtype: 'market', locationType: 'market', hexCol: 9, hexRow: 9, prosperity: 25 },
  });
  return graph;
}

// ─── create_location — the op the tier needed ───────────────────────

describe('create_location', () => {
  it('mints a place-tier location, by the discriminator every reader shares', () => {
    const graph = world();
    const result = createLocation(graph, { col: 6, row: 6 }, FOUNDER, "Edda's Rest", 'hamlet', 20);

    expect(result.success).toBe(true);
    const node = graph.getNode(result.createdId!)!;

    // The point of the whole op: place-tier, not a sublocation. Asserted through the
    // shared predicate rather than by reading `type` — a test that hand-rolled the
    // check could pass while the sweeps that matter disagreed (THR-1183).
    expect(isLocationNode(node)).toBe(true);
    expect(isPlaceNode(node)).toBe(false);
    expect(node.properties.parentLocationId).toBeUndefined();
    expect(getLocationNodes(graph).map(n => n.id)).toContain(node.id);
  });

  it('writes both subtype keys, because readers are split across them', () => {
    const graph = world();
    const result = createLocation(graph, { col: 6, row: 6 }, FOUNDER, "Edda's Rest", 'hamlet', 20);
    const node = graph.getNode(result.createdId!)!;

    // `worldSeed` writes both on every location it seeds and several readers still
    // take the older `locationType`. A node carrying only one is half-visible.
    expect(node.properties.locationSubtype).toBe('hamlet');
    expect(node.properties.locationType).toBe('hamlet');
    expect(node.properties.hexCol).toBe(6);
    expect(node.properties.hexRow).toBe(6);
  });

  it('records its builder — a founded place with no founder is nobody’s work', () => {
    const graph = world();
    const result = createLocation(graph, { col: 6, row: 6 }, FOUNDER, "Edda's Rest", 'hamlet', 20);

    const built = graph.getOutgoingEdges(result.createdId!, 'constructed_by');
    expect(built).toHaveLength(1);
    expect(built[0].target).toBe(FOUNDER);
    expect(graph.getNode(result.createdId!)!.properties.createdBy).toBe(FOUNDER);
  });

  it('refuses a second mint on the same site and tick rather than overwriting', () => {
    const graph = world();
    createLocation(graph, { col: 6, row: 6 }, FOUNDER, "Edda's Rest", 'hamlet', 20);
    const second = createLocation(graph, { col: 6, row: 6 }, FOUNDER, "Edda's Rest", 'hamlet', 20);

    expect(second.success).toBe(false);
    expect(second.error).toBe('location_already_exists');
  });

  it('is deterministic — same world, same tick, same id (NFP #3)', () => {
    const a = createLocation(world(), { col: 6, row: 6 }, FOUNDER, 'X', 'hamlet', 20);
    const b = createLocation(world(), { col: 6, row: 6 }, FOUNDER, 'X', 'hamlet', 20);
    expect(a.createdId).toBe(b.createdId);
  });
});

// ─── Site selection ─────────────────────────────────────────────────

describe('findUnclaimedSite', () => {
  it('founds on the origin hex when nothing stands there', () => {
    const graph = world();
    expect(findUnclaimedSite(graph, { col: 20, row: 20 })).toEqual({ col: 20, row: 20 });
  });

  it('steps off an occupied hex rather than founding on top of what is there', () => {
    const graph = world();
    // ORIGIN sits at 4,4.
    const site = findUnclaimedSite(graph, { col: 4, row: 4 });
    expect(site).not.toBeNull();
    expect(site).not.toEqual({ col: 4, row: 4 });
  });

  it('counts only place-tier occupancy — a sublocation shares its parent’s hex', () => {
    const graph = world();
    graph.addNode({
      id: 'subloc_warehouse', name: 'The Warehouse', type: 'location',
      properties: { sublocationTypeId: 'warehouse', parentLocationId: DEST, hexCol: 12, hexRow: 12 },
    });
    // 12,12 carries only a sublocation, so it is unoccupied ground.
    expect(findUnclaimedSite(graph, { col: 12, row: 12 })).toEqual({ col: 12, row: 12 });
  });

  it('refuses when the whole neighbourhood is built up — a refusal, not a fallback', () => {
    const graph = world();
    for (let col = 2; col <= 6; col++) {
      for (let row = 2; row <= 6; row++) {
        graph.addNode({
          id: `loc_fill_${col}_${row}`, name: `Fill ${col},${row}`, type: 'location',
          properties: { locationSubtype: 'hamlet', hexCol: col, hexRow: row },
        });
      }
    }
    expect(findUnclaimedSite(graph, { col: 4, row: 4 })).toBeNull();
  });

  it('is deterministic — the same crowded world picks the same ground (NFP #3)', () => {
    const build = () => {
      const graph = world();
      graph.addNode({
        id: 'loc_here', name: 'Here', type: 'location',
        properties: { locationSubtype: 'hamlet', hexCol: 30, hexRow: 30 },
      });
      return graph;
    };
    expect(findUnclaimedSite(build(), { col: 30, row: 30 }))
      .toEqual(findUnclaimedSite(build(), { col: 30, row: 30 }));
  });
});

// ─── The route identity node ────────────────────────────────────────

describe('route identity', () => {
  it('is found from either endpoint — a route is the same route read from both ends', () => {
    const graph = world();
    const identity = createLocation(
      graph, { col: 4, row: 4 }, FOUNDER, 'The Coldwater–Ashford Road', ROUTE_IDENTITY_SUBTYPE, 20,
      { routeSourceId: ORIGIN, routeTargetId: DEST },
    );

    expect(findRouteIdentityNode(graph, ORIGIN, DEST)?.id).toBe(identity.createdId);
    expect(findRouteIdentityNode(graph, DEST, ORIGIN)?.id).toBe(identity.createdId);
  });

  it('is absent, not invented, for a route that never got one', () => {
    const graph = world();
    createTradeRoute(graph, ORIGIN, DEST, FOUNDER, 20);
    expect(findRouteIdentityNode(graph, ORIGIN, DEST)).toBeUndefined();
  });
});

// ─── blockade_route — the counter-play ──────────────────────────────

/**
 * A minimal `GameState` for driving the real prosperity phase.
 *
 * Borrowed from `phaseProsperity.test.ts`'s factory rather than re-stating that
 * phase's predicate here. The distinction matters: a test that re-implements
 * "skip the route when `threatened`" and then asserts its own copy proves the
 * *write*, never the *effect* — and whether the world acts on a counter-play is
 * the entire question a counter-play has to answer.
 */
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

/**
 * Prosperity at `DEST` after one real `phaseProsperity` pass, from a fixture built
 * so the route is the *only* thing that can move the number.
 *
 * Both endpoints are `town` — a real `LocationSubtype`, so they have a carrying
 * capacity — and start at that capacity, which puts the settlement at equilibrium
 * with drift zero. The route's trade bonus is then the whole signal. Volume is
 * raised to the same 10 the existing prosperity suite uses, because `createTradeRoute`
 * mints at volume 1 and a tenth of one route's bonus rounds away under the drift
 * clamp — a difference too small to measure is not evidence of no difference.
 */
function prosperityAfterOnePass(mutate: (graph: WorldGraph) => void): number {
  const graph = world();
  for (const id of [ORIGIN, DEST]) {
    graph.updateNode(id, {
      properties: {
        ...graph.getNode(id)!.properties,
        locationSubtype: 'town',
        locationType: 'town',
        prosperity: BASE_CARRYING_CAPACITY,
      },
    });
  }
  const route = createTradeRoute(graph, ORIGIN, DEST, FOUNDER, 20);
  const edge = graph.getEdge(route.createdId!)!;
  graph.updateEdge(edge.id, { properties: { ...edge.properties, volume: 10 } });

  mutate(graph);
  phaseProsperity(makeState(graph));
  return graph.getNode(DEST)!.properties.prosperity as number;
}

/** Routes at a location the prosperity phase would still count — its own predicate. */
function countActiveRoutes(graph: WorldGraph, locationId: string): number {
  return [
    ...graph.getOutgoingEdges(locationId, 'trades_with'),
    ...graph.getIncomingEdges(locationId, 'trades_with'),
  ].filter(edge => edge.properties?.threatened !== true).length;
}

describe('blockade_route', () => {
  it('costs the endpoint real prosperity — measured through the phase, not the flag', () => {
    // The controlled arm: identical worlds, one blockade apart. Running the *real*
    // `phaseProsperity` is what makes this a proof that the world acts, rather than
    // a restatement of the predicate the op just satisfied.
    const open = prosperityAfterOnePass(() => {});
    const blockaded = prosperityAfterOnePass(graph => {
      const result = blockadeRoute(graph, WARLORD, DEST, 30);
      // Confirm the perturbation actually applied — an arm that silently no-ops
      // would make the two numbers match and read as "no effect".
      expect(result.success, 'the blockade arm did not apply').toBe(true);
    });

    expect(open, 'an open route must lift its endpoint above equilibrium').toBeGreaterThan(BASE_CARRYING_CAPACITY);
    expect(blockaded, 'a blockaded route must cost its endpoint').toBeLessThan(open);
  });

  it('suspends rather than deletes — the edge survives so the blockade can lift', () => {
    const graph = world();
    const route = createTradeRoute(graph, ORIGIN, DEST, FOUNDER, 20);
    blockadeRoute(graph, WARLORD, DEST, 30);

    const edge = graph.getEdge(route.createdId!);
    expect(edge, 'the trades_with edge must survive a blockade').toBeDefined();
    // `routeEvents` clears on this pair; without the stamp the flag would never lift.
    expect(edge!.properties.threatened).toBe(true);
    expect(edge!.properties.threatenedSinceTick).toBe(30);
    expect(edge!.properties.blockadedBy).toBe(WARLORD);
  });

  it('marks the identity node too, so the blockade is legible on the named thing', () => {
    const graph = world();
    createTradeRoute(graph, ORIGIN, DEST, FOUNDER, 20);
    const identity = createLocation(
      graph, { col: 4, row: 4 }, FOUNDER, 'The Coldwater–Ashford Road', ROUTE_IDENTITY_SUBTYPE, 20,
      { routeSourceId: ORIGIN, routeTargetId: DEST },
    );

    blockadeRoute(graph, WARLORD, DEST, 30);

    expect(graph.getNode(identity.createdId!)!.properties.blockaded).toBe(true);
  });

  it('still works on a route with no identity node — the edge is the authority', () => {
    const graph = world();
    createTradeRoute(graph, ORIGIN, DEST, FOUNDER, 20);
    // A route established before this tier shipped carries no identity face.
    expect(blockadeRoute(graph, WARLORD, DEST, 30).success).toBe(true);
    expect(countActiveRoutes(graph, DEST)).toBe(0);
  });

  it('refuses an endpoint carrying no route — an ordinary refusal, not an error', () => {
    const graph = world();
    const result = blockadeRoute(graph, WARLORD, DEST, 30);
    expect(result.success).toBe(false);
    expect(result.error).toBe('no_route');
  });

  it('refuses when every route through the endpoint is already down', () => {
    const graph = world();
    createTradeRoute(graph, ORIGIN, DEST, FOUNDER, 20);
    blockadeRoute(graph, WARLORD, DEST, 30);

    const second = blockadeRoute(graph, WARLORD, DEST, 31);
    expect(second.success).toBe(false);
    expect(second.error).toBe('already_blockaded');
  });

  it('picks the same route every time when an endpoint carries several (NFP #3)', () => {
    const build = () => {
      const graph = world();
      graph.addNode({
        id: 'loc_third', name: 'Bellmoor', type: 'location',
        properties: { locationSubtype: 'town', hexCol: 15, hexRow: 15, prosperity: 10 },
      });
      createTradeRoute(graph, ORIGIN, DEST, FOUNDER, 20);
      createTradeRoute(graph, 'loc_third', DEST, FOUNDER, 21);
      return graph;
    };
    expect(blockadeRoute(build(), WARLORD, DEST, 30).createdId)
      .toBe(blockadeRoute(build(), WARLORD, DEST, 30).createdId);
  });

  it('fails soft on a location that does not exist', () => {
    const result = blockadeRoute(world(), WARLORD, 'loc_nowhere', 30);
    expect(result.success).toBe(false);
    expect(result.error).toBe('location_not_found');
  });
});

// ─── The rows, and what makes them a tier ───────────────────────────

describe('the T2 rows', () => {
  const t2 = UNDERTAKING_KIND_ROWS.filter(row => row.tier === 2);

  it('registers exactly the two kinds whose counter-play THR-1308 could author', () => {
    expect(t2.map(r => r.kindId)).toEqual(['trade_route', 'place_location']);
  });

  it('carries the full authored seam set on every verb of every row', () => {
    // The five T1 rows each carry these; a T2 row that skipped them would inherit
    // engine defaults and read as authored. `requiresLocation` is deliberately not
    // in this list — instant verbs run no checkpoints, so the flag is inert on them.
    for (const row of t2) {
      const verbs = [...row.createTemplateIds, ...row.updateTemplateIds, ...row.destroyTemplateIds];
      expect(verbs.length, `${row.kindId} has no verbs`).toBeGreaterThan(0);
      for (const id of verbs) {
        const template = getStrategicTemplate(id);
        expect(template, `${row.kindId}: '${id}' does not resolve`).toBeDefined();
        expect(template!.checkpointDifficulty, `${id} checkpointDifficulty`).toBeGreaterThan(0);
        expect(template!.payoffValue, `${id} payoffValue`).toBeGreaterThan(0);
        expect((template!.motivations ?? []).length, `${id} motivations`).toBeGreaterThan(0);
      }
    }
  });

  it('prices T2 payoffs inside the cutover envelope the plan set', () => {
    // Plan §"The ten kind rows": T2 ≈ 1.0–1.5 EVT, above T1's ~0.5–0.8 and below
    // T3's ~2.0. The envelope is the tuning contract, and tuning to move the
    // *cutover gate* rather than to price the work is what the ticket forbids.
    const t1Max = Math.max(
      ...UNDERTAKING_KIND_ROWS
        .filter(r => r.tier === 1)
        .flatMap(r => [...r.createTemplateIds, ...r.updateTemplateIds, ...r.destroyTemplateIds])
        .map(id => getStrategicTemplate(id)?.payoffValue ?? 0),
    );
    for (const row of t2) {
      for (const id of [...row.createTemplateIds, ...row.updateTemplateIds, ...row.destroyTemplateIds]) {
        const payoff = getStrategicTemplate(id)!.payoffValue!;
        expect(payoff, `${id} is priced below the T1 ceiling`).toBeGreaterThan(t1Max);
        expect(payoff, `${id} exceeds the T2 envelope`).toBeLessThanOrEqual(1.6);
      }
    }
  });

  it('authors every multi-tick T2 verb `requiresLocation: false`, on THR-1310’s evidence', () => {
    // Not a preference. THR-1310 landed proximity-bounded targeting and re-measured:
    // the wanderer family still reported 0/115 rolled at `true` on seed 42, 100%
    // `actor_absent`, because nothing moves an agent to its stage until doc 3's
    // binder ships (TODO(THR-1294)). Authoring `true` here would make the whole T2
    // tier inert the same way. Re-measure when the binder lands, not before.
    for (const row of t2) {
      for (const id of [...row.createTemplateIds, ...row.updateTemplateIds, ...row.destroyTemplateIds]) {
        const template = getStrategicTemplate(id)!;
        if (template.executionMode !== 'multi_tick_project') continue;
        expect(template.requiresLocation, `${id} would starve its kind at true`).toBe(false);
      }
    }
  });

  it('names a mutation hint on every T2 verb — no verb that changes nothing', () => {
    for (const row of t2) {
      for (const id of [...row.createTemplateIds, ...row.updateTemplateIds, ...row.destroyTemplateIds]) {
        expect(getStrategicTemplate(id)!.mutationHint, `${id} has no mutationHint`).toBeDefined();
      }
    }
  });

  it('registers every T2 verb in an ambition profile — nothing authored here is dead', () => {
    // Candidate generation runs off `strategicProfile.templateIds`. A template in no
    // profile is unreachable by construction, not merely rare, so this is the gate
    // between "authored" and "in the game".
    const registered = new Set(
      [...AMBITION_TEMPLATES, ...GRIEVANCE_AMBITION_TEMPLATES, ...EVENT_MINTED_AMBITION_TEMPLATES]
        .flatMap(a => a.strategicProfile?.templateIds ?? []),
    );
    const orphans = t2
      .flatMap(r => [...r.createTemplateIds, ...r.updateTemplateIds, ...r.destroyTemplateIds])
      .filter(id => !registered.has(id));
    expect(orphans).toEqual([]);
  });

  it('leaves the corpus with no ungated destroy verb', () => {
    // The corpus-wide half of the rule, re-asserted because THR-1308 adds two
    // destroys and this is exactly where an ungated one would enter.
    const ungated = getAllStrategicTemplates()
      .filter(t => t.verb === 'destroy' && (t.motiveGate?.length ?? 0) === 0)
      .map(t => t.id);
    expect(ungated).toEqual([]);
  });
});
