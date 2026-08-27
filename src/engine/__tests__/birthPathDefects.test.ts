/**
 * THR-1304 — the six birth-path defects the THR-1296 binder recon measured but did not fix.
 *
 * Every assertion here goes **through a reader**. That is the point of the ticket: all six
 * are a producer and a reader disagreeing about a field, silently, with no crash — so a test
 * that inspects the property the producer writes would have passed all along and proved
 * nothing. `getActorCultures` decides whether a culture edge counts; `computeCapability`
 * decides whether a capability number means anything; the deaths predicate decides whether a
 * reputation value is survivable; `COOPERATION_STRATEGIES` decides whether a strategy string
 * is a strategy. Ask those, not the property bag.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import { SPHERE_NAMES } from '../../types/index';
import type { EssencePool } from '../../types/index';
import {
  phaseAgentLifecycle,
  BORN_CULTURAL_STRENGTH,
  LOW_REP_THRESHOLD,
  resetLifecycleCounter,
} from '../agentLifecycle';
import { getActorCultures } from '../graphQueries';
import { computeCapability } from '../domainCapability';
import { validateAgentIntegrity } from '../agentValidation';
import { hydrateToTier } from '../npcGraduation';
import { COOPERATION_STRATEGIES, DEFAULT_REPUTATION } from '../../types/disposition';
import { getStrengthRange } from '../culturalTraits';
import { REACH_DOMAINS } from '../../types/traits';

// ─── Fixture ──────────────────────────────────────────────────────
//
// `mulberry32(seed + tick * 71)` is the births block's rng, and the deaths loop draws
// *nothing* when every agent's reputation is healthy (`rep < LOW_REP_THRESHOLD` short-
// circuits before the roll). So the first draw of the tick is the birth roll for the first
// location, and seed 42 / tick 64 puts it at 0.00447 — under BIRTH_CHANCE (0.01). Chosen by
// search rather than by hope; the other hits in the first 400 ticks are 145 and 301.
const BIRTH_SEED = 42;
const BIRTH_TICK = 64;

const PLACE = 'loc-harbour';
const QUIET = 'loc-backwater';
const CULTURE = 'culture-tidewatch';

function pool(): EssencePool {
  const p = {} as EssencePool;
  for (const s of SPHERE_NAMES) p[s] = 0;
  return p;
}

/** A culture node in the shape `cultureGenerator` actually writes (actor + actorType). */
function addCulture(graph: WorldGraph): void {
  graph.addNode({
    id: CULTURE,
    type: 'actor',
    name: 'Tidewatch Rule',
    properties: {
      actorType: 'culture',
      cultureIdentity: { foundationBias: 'order', veneratedSpheres: ['order'] },
    },
  });
}

/**
 * `parentCount` healthy adults at `locId`, each belonging to the culture on the canonical
 * `culturalStrength` key — so `getActorCultures` sees them and the newborn has something to
 * inherit. BIRTH_DENSITY_THRESHOLD is 3.
 */
function addParents(graph: WorldGraph, locId: string, parentCount = 4, prefix = 'p'): void {
  for (let i = 0; i < parentCount; i++) {
    const id = `${prefix}-${locId}-${i}`;
    graph.addNode({
      id,
      type: 'actor',
      name: `Parent ${i}`,
      properties: {
        actorType: 'individual',
        spotlightTier: 'spotlight',
        reputationScore: DEFAULT_REPUTATION,
        locationId: locId,
      },
    });
    graph.addEdge({
      id: `${id}_located_at_${locId}`, source: id, target: locId,
      type: 'located_at', properties: {},
    });
    graph.addEdge({
      id: `${id}_belongs_to_${CULTURE}`, source: id, target: CULTURE,
      type: 'belongs_to', properties: { culturalStrength: 1.0 },
    });
  }
}

function world(opts: { second?: boolean } = {}): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: PLACE, type: 'location', name: 'Tidewatch',
    properties: { hexCol: 3, hexRow: 4, sphereInfluence: { order: 0.6 } },
  });
  addCulture(graph);
  addParents(graph, PLACE);
  if (opts.second) {
    graph.addNode({
      id: QUIET, type: 'location', name: 'Backwater',
      properties: { hexCol: 9, hexRow: 9, sphereInfluence: { entropy: 0.4 } },
    });
    addParents(graph, QUIET, 4, 'q');
  }
  graph.addNode({
    id: 'asc-1', type: 'actor', name: 'Player God',
    properties: { actorType: 'ascendant' },
  });
  return graph;
}

function stateWith(graph: WorldGraph, tick = BIRTH_TICK): GameState {
  return {
    tick,
    seed: BIRTH_SEED,
    cycle: 1,
    phase: 'playing',
    graph,
    cosmology: { entropy: 0.2 } as any,
    tiles: [],
    clock: {} as any,
    ascendantId: 'asc-1',
    essencePool: pool(),
    mandateDefinition: null,
    mandateState: null,
    rivalDefinitions: [],
    rivalStates: [],
    doomDefinition: {} as any,
    doomClock: {} as any,
    tickEvents: [],
    recentEvents: [],
    chronicleEntries: [],
    stealthExposure: 0,
    visibilityMap: {} as any,
    familiarityMap: {} as any,
    culturalInsightMap: new Map(),
    agentKnowledge: new Map(),
    encounterProgress: [],
    actionsInProgress: [],
    unifiedActions: [],
    worldSoul: {} as any,
    echoDefinitions: [],
    echoStates: [],
    chronicle: {} as any,
    strategicState: { projects: [], controls: [], history: [] },
  } as unknown as GameState;
}

/** Run one lifecycle tick and return the id of the mortal born, failing loudly if none was. */
function birthOne(
  graph: WorldGraph,
  extra: { cache?: any; runtime?: any } = {},
): string {
  resetLifecycleCounter();
  const state = stateWith(graph);
  let n = 0;
  phaseAgentLifecycle(state, () => `ev-${++n}`, extra.cache, extra.runtime);
  const born = graph.getNodesByType('actor')
    .filter(a => a.properties.bornTick === BIRTH_TICK);
  // Guard the fixture itself: if the roll stops firing, every assertion below would pass
  // vacuously over an empty population.
  expect(born, 'fixture produced no birth — the seed/tick pair no longer rolls under BIRTH_CHANCE')
    .toHaveLength(1);
  return born[0].id;
}

// ─── #1 — culture-strength key ───────────────────────────────────

describe('THR-1304 #1 — the newborn culture edge is readable', () => {
  it('reports the inherited strength through getActorCultures', () => {
    const graph = world();
    const id = birthOne(graph);

    const cultures = getActorCultures(graph, id);
    expect(cultures).toHaveLength(1);
    expect(cultures[0].culture.id).toBe(CULTURE);
    // Fails against the pre-fix code: the edge carried `strength`, which this reader does
    // not read, so it fell through to the `?? 1.0` default and reported full inheritance.
    expect(cultures[0].strength).toBe(BORN_CULTURAL_STRENGTH);
  });

  it('lands in a cultural band that expresses traits, not the silent one', () => {
    const graph = world();
    const id = birthOne(graph);

    const strength = getActorCultures(graph, id)[0].strength;
    // Pre-fix this read `fanatical`, because `getActorCultures` defaulted the missing key to
    // 1.0 — while `culturalTraits`, `culturalProse`, `culturalTension` and
    // `insiderBeatDetection` default it to 0 and would have said `silent`. That is the whole
    // defect in one line: the same newborn read as maximally and minimally acculturated
    // depending on which reader you asked, and as the authored 0.6 to none of them.
    expect(getStrengthRange(strength)).toBe('strong');
  });
});

// ─── #2 — validator reachability ─────────────────────────────────

describe('THR-1304 #2 — the ambient birth validator actually runs', () => {
  it('skips checks 2-8 for an ambient individual by default, and runs them on request', () => {
    const graph = new WorldGraph();
    // A deliberately broken ambient individual: no axiologicalProfile, no capabilities,
    // no located_at edge. This is what a malformed newborn would look like.
    graph.addNode({
      id: 'broken-1', type: 'actor', name: 'Malformed',
      properties: { actorType: 'individual', spotlightTier: 'ambient' },
    });

    // Default: the tier skip returns after check 1 — this is the sparse-NPC carve-out and
    // stays intact, which is why the fix is an opt-in rather than a change to the skip.
    expect(validateAgentIntegrity(graph, 'broken-1').valid).toBe(true);

    // Opt-in: the battery runs and the malformation is reported. Fails against the pre-fix
    // code, where no option existed and the call could only ever return the skip.
    const forced = validateAgentIntegrity(graph, 'broken-1', { fullValidation: true });
    expect(forced.valid).toBe(false);
    expect(forced.errors.join(' ')).toMatch(/axiologicalProfile/);
  });

  it('passes a real newborn under the same full battery the births block now asks for', () => {
    const graph = world();
    const id = birthOne(graph);

    // The births block writes a complete bag, so the check it was placed there to perform
    // is one it can survive — the point is that it is now performed at all.
    const result = validateAgentIntegrity(graph, id, { fullValidation: true });
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });
});

// ─── #3 — cooperation-strategy vocabulary ────────────────────────

describe('THR-1304 #3 — graduated NPCs carry a strategy the readers recognise', () => {
  it('assigns a member of COOPERATION_STRATEGIES on promotion to spotlight', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'npc-1', type: 'actor', name: 'Walk-on',
      properties: { actorType: 'individual', spotlightTier: 'ambient', npcRole: 'guard' },
    });

    hydrateToTier(graph, 'npc-1', 'spotlight', () => 0.5);

    const strategy = graph.getNode('npc-1')!.properties.cooperationStrategy as string;
    // Reader-side: membership in the canonical list, not equality with a literal. Fails
    // against the pre-fix code, which wrote `tit_for_tat` — a string in no list, no union
    // and no lookup table, so every reader treated it as unknown.
    expect(COOPERATION_STRATEGIES).toContain(strategy as any);
  });
});

// ─── #4 — reputation on graduation ───────────────────────────────

describe('THR-1304 #4 — graduation does not mark a walk-on for death', () => {
  it('seeds reputationScore above the deaths predicate threshold', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'npc-2', type: 'actor', name: 'Walk-on',
      properties: { actorType: 'individual', spotlightTier: 'ambient', npcRole: 'guard' },
    });

    hydrateToTier(graph, 'npc-2', 'notable', () => 0.5);

    const rep = graph.getNode('npc-2')!.properties.reputationScore as number;
    // The reader that matters is the deaths loop's own predicate. Fails against the pre-fix
    // code, which stamped 0 — below LOW_REP_THRESHOLD, so being promoted handed the NPC a
    // DEATH_CHANCE_LOW_REP roll every tick thereafter.
    expect(rep).toBeGreaterThanOrEqual(LOW_REP_THRESHOLD);
    expect(rep).toBe(DEFAULT_REPUTATION);
  });
});

// ─── #5 — capability scale ───────────────────────────────────────

describe('THR-1304 #5 — a born mortal is scored on the scale the sigmoid expects', () => {
  it('reads back a capability that is not pinned at the sigmoid floor', () => {
    const graph = world();
    const id = birthOne(graph);

    // `computeCapability` runs the raw score through sigmoid(midpoint 10, k 0.4). A 0-1
    // fraction written into that field reads ~0.02 — the pre-fix code's `0.1 + rng() * 0.4`
    // put every world-born mortal there, in all eight reaches. Encounter growth is the only
    // way off that floor and it rewards success, so a mortal starting there rarely left it.
    const caps = REACH_DOMAINS.map(d => computeCapability(graph, id, d));
    expect(Math.max(...caps)).toBeGreaterThan(0.2);

    // And the archetype's primary reach should be the strongest of the eight — the affinity
    // is what makes a born mortal lean somewhere rather than being flat.
    expect(Math.max(...caps)).toBeGreaterThan(Math.min(...caps));
  });

  it('reads in the same capability band as a graduated notable NPC', () => {
    // The invariant the defect broke is *scale parity* with the other producer on the
    // correct scale, so assert against that producer rather than against a threshold picked
    // by hand. Both populations now come from `generateRoleCapabilities(_, _, 'notable')`,
    // so their strongest reaches must land in the same band — pre-fix, the born mortal's
    // best reach (~0.02) sat an order of magnitude below the NPC's (~0.6).
    const graph = world();
    const bornId = birthOne(graph);

    graph.addNode({
      id: 'npc-ref', type: 'actor', name: 'Reference Walk-on',
      properties: { actorType: 'individual', spotlightTier: 'ambient', npcRole: 'guard' },
    });
    hydrateToTier(graph, 'npc-ref', 'notable', () => 0.5);

    const bestBorn = Math.max(...REACH_DOMAINS.map(d => computeCapability(graph, bornId, d)));
    const bestNpc = Math.max(...REACH_DOMAINS.map(d => computeCapability(graph, 'npc-ref', d)));

    // Same order of magnitude, in both directions — a born mortal is neither floored nor
    // accidentally promoted past the ambient population it belongs to.
    expect(bestBorn).toBeGreaterThan(bestNpc / 3);
    expect(bestBorn).toBeLessThan(bestNpc * 3);
  });
});

// ─── #6 — content-rich birth siting ──────────────────────────────

describe('THR-1304 #6 — the birth-siting cache is actually consulted', () => {
  /** Minimal stand-in for the one method the siting call uses. */
  function cacheNaming(locationId: string) {
    return { getLocationsWithMinEntries: () => [locationId] };
  }

  it('sites the birth at the content-rich location when a cache is supplied', () => {
    const graph = world({ second: true });
    // PLACE is first in graph order and would win by default; the cache names QUIET.
    const id = birthOne(graph, { cache: cacheNaming(QUIET) });

    expect(graph.getNode(id)!.properties.locationId).toBe(QUIET);
  });

  it('resolves the cache off the runtime when no cache argument is passed', () => {
    const graph = world({ second: true });
    // This is the defect's actual shape: the orchestrator supplied no cache argument for
    // the parameter's entire life, so the branch was unreachable in production however
    // well it unit-tested. Deriving from the runtime the phase already receives is what
    // makes forgetting to forward it impossible.
    const id = birthOne(graph, { runtime: { encounterCache: cacheNaming(QUIET) } });

    expect(graph.getNode(id)!.properties.locationId).toBe(QUIET);
  });

  it('falls back to every location when neither source offers a cache', () => {
    const graph = world({ second: true });
    const id = birthOne(graph);

    expect(graph.getNode(id)!.properties.locationId).toBe(PLACE);
  });
});
