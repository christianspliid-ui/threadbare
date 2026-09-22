/**
 * THR-790 — places earn traits from what happens to them.
 *
 * The phase is the settlement-promotion hysteresis pointed at four scalars, so the
 * tests are the promotion phase's, sharpened where the plan's Done-when asks for a
 * falsifying edge: *after `SUSTAIN` ticks and not one tick sooner*, *below release
 * and not in the dead band*, *the mid-band holds the counter*, *haunted supersedes
 * veil-thin*, *a 0–1 prosperity reads Destitute*. Each arm asserts both polarities,
 * because a rule that never refuses is not a rule.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import type { LocationTraitTrace } from '../../types/trace';
import { clearTraces, disableTracing, enableTracing, getTraces } from '../traceBuffer';
import { seedEncounterTraitDefinitions } from '../traitDefinitionSeeding';
import { createSimulationRuntime } from '../simulationRuntime';
import {
  describeLocationTraits,
  phaseLocationTraits,
  LOCATION_TRAIT_RULES,
  LOCATION_TRAIT_SOURCE,
  LOCATION_TRAIT_SUSTAIN_PROPERTY_PREFIX,
} from '../phaseLocationTraits';
import {
  LOCATION_TRAIT_IDS,
  LOCATION_TRAIT_SUSTAIN_TICKS,
  LOCATION_TRAIT_WELCOMING_ENTER,
  LOCATION_TRAIT_WELCOMING_RELEASE,
  LOCATION_TRAIT_LAWLESS_ENTER,
  LOCATION_TRAIT_VEIL_THIN_ENTER,
  LOCATION_TRAIT_HAUNTED_ENTER,
  LOCATION_TRAIT_HAUNTED_DEATHS,
  LOCATION_TRAIT_EVENT_SIGNIFICANCE,
} from '../../data/location-trait-constants';
import {
  CONDITION_DURATIONS,
  CONDITION_IDS_WITHOUT_EFFECT,
  LOCATION_CONDITION_IDS,
  LOCATION_CONDITION_MOVEMENT_TAX,
  LOCATION_CONDITION_STEP_MODIFIER,
} from '../../data/condition-trait-content';
import { conditionEffectLine } from '../aftermathWords';

const SUSTAIN = LOCATION_TRAIT_SUSTAIN_TICKS;

// ─── Fixture ────────────────────────────────────────────────────────────────

function makeState(graph: WorldGraph, tick = 1): GameState {
  return {
    tick,
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
    worldSoul: {} as GameState['worldSoul'],
    echoDefinitions: [],
    echoStates: [],
    chronicle: { cycles: [], totalEntries: 0 },
  } as unknown as GameState;
}

function addTown(graph: WorldGraph, id: string, props: Record<string, unknown>): void {
  graph.addNode({
    id,
    type: 'location',
    name: `Town ${id}`,
    properties: { locationSubtype: 'town', hexCol: 2, hexRow: 3, ...props },
  });
}

function traitsOn(graph: WorldGraph, locId: string): string[] {
  return graph.getOutgoingEdges(locId, 'has_trait').map(e => e.target).sort();
}

/** Run the phase `n` ticks, returning the last tick's partial state. */
function run(graph: WorldGraph, n: number, from = 1, runtime?: ReturnType<typeof createSimulationRuntime>) {
  let out: Partial<GameState> = {};
  for (let i = 0; i < n; i++) out = phaseLocationTraits(makeState(graph, from + i), runtime);
  return out;
}

function locationTraitTraces(): LocationTraitTrace[] {
  return getTraces().filter((t): t is LocationTraitTrace => t.category === 'location_trait');
}

describe('phaseLocationTraits — minting (THR-790)', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
    seedEncounterTraitDefinitions(graph);
    enableTracing();
    clearTraces();
  });

  afterEach(() => {
    clearTraces();
    disableTracing();
  });

  it('the four minted ids are location conditions by construction, and each ships a reader', () => {
    for (const id of Object.values(LOCATION_TRAIT_IDS)) {
      expect(LOCATION_CONDITION_IDS, `${id} is not under the prefix`).toContain(id);
      expect(graph.getNode(id), `${id} is not seeded`).toBeDefined();
      // THR-800's lesson: a definition with no reader is gate theatre. Every one of
      // the four carries a movement tax or a step modifier, and the exemption list
      // stays empty.
      const hasTax = typeof LOCATION_CONDITION_MOVEMENT_TAX[id] === 'number';
      const hasStep = Object.values(LOCATION_CONDITION_STEP_MODIFIER[id] ?? {}).some(v => v !== 0);
      expect(hasTax || hasStep, `${id} has no reader`).toBe(true);
      expect(CONDITION_IDS_WITHOUT_EFFECT).not.toContain(id);
      expect(conditionEffectLine(graph.getNode(id)!), `${id} renders no effect line`).not.toBeNull();
      // A minted trait has a cause, not a term.
      expect(CONDITION_DURATIONS[id]).toBeUndefined();
    }
  });

  it('mints Welcoming after exactly SUSTAIN ticks at or above enter — and not one tick sooner', () => {
    addTown(graph, 'loc.rich', { prosperity: LOCATION_TRAIT_WELCOMING_ENTER });

    run(graph, SUSTAIN - 1);
    expect(traitsOn(graph, 'loc.rich')).toEqual([]);
    expect(graph.getNode('loc.rich')!.properties[`${LOCATION_TRAIT_SUSTAIN_PROPERTY_PREFIX}welcoming`]).toBe(SUSTAIN - 1);

    const out = run(graph, 1, SUSTAIN);
    expect(traitsOn(graph, 'loc.rich')).toEqual([LOCATION_TRAIT_IDS.welcoming]);
    // The edge is the promotion phase's idiom: no term, the phase's own source.
    const edge = graph.getOutgoingEdges('loc.rich', 'has_trait')[0];
    expect(edge.properties.source).toBe(LOCATION_TRAIT_SOURCE);
    expect(edge.properties.ticksRemaining).toBeUndefined();
    expect(edge.properties.acquiredTick).toBe(SUSTAIN);
    // Counter reset on mint.
    expect(graph.getNode('loc.rich')!.properties[`${LOCATION_TRAIT_SUSTAIN_PROPERTY_PREFIX}welcoming`]).toBe(0);
    // One chronicle line, in the definition's word, never the id (Law 14).
    expect(out.tickEvents).toHaveLength(1);
    expect(out.tickEvents![0].message).toBe('Town loc.rich has become Welcoming.');
    expect(out.tickEvents![0].message).not.toContain('trait.condition');
    expect(out.tickEvents![0].significance).toBe(LOCATION_TRAIT_EVENT_SIGNIFICANCE);
  });

  it('a prosperous town below enter never mints, however long it sustains', () => {
    addTown(graph, 'loc.fine', { prosperity: LOCATION_TRAIT_WELCOMING_ENTER - 1 });
    run(graph, SUSTAIN * 3);
    expect(traitsOn(graph, 'loc.fine')).toEqual([]);
  });

  it('the mid-band holds the counter; a dip below release resets it', () => {
    addTown(graph, 'loc.wobble', { prosperity: LOCATION_TRAIT_WELCOMING_ENTER });
    const key = `${LOCATION_TRAIT_SUSTAIN_PROPERTY_PREFIX}welcoming`;
    const loc = graph.getNode('loc.wobble')!;

    run(graph, 10);
    expect(loc.properties[key]).toBe(10);

    // Inside the band: held, not reset, not advanced.
    loc.properties.prosperity = (LOCATION_TRAIT_WELCOMING_ENTER + LOCATION_TRAIT_WELCOMING_RELEASE) / 2;
    run(graph, 5, 11);
    expect(loc.properties[key]).toBe(10);

    // Back above enter: resumes from where it held.
    loc.properties.prosperity = LOCATION_TRAIT_WELCOMING_ENTER;
    run(graph, 1, 16);
    expect(loc.properties[key]).toBe(11);

    // Below release: the run is over.
    loc.properties.prosperity = LOCATION_TRAIT_WELCOMING_RELEASE - 1;
    run(graph, 1, 17);
    expect(loc.properties[key]).toBe(0);
    expect(traitsOn(graph, 'loc.wobble')).toEqual([]);
  });

  it('releases below release and holds inside the dead band once minted', () => {
    addTown(graph, 'loc.fading', { prosperity: LOCATION_TRAIT_WELCOMING_ENTER });
    run(graph, SUSTAIN);
    expect(traitsOn(graph, 'loc.fading')).toEqual([LOCATION_TRAIT_IDS.welcoming]);

    const loc = graph.getNode('loc.fading')!;
    // Dead band: the word stays.
    loc.properties.prosperity = LOCATION_TRAIT_WELCOMING_RELEASE;
    run(graph, 20, SUSTAIN + 1);
    expect(traitsOn(graph, 'loc.fading')).toEqual([LOCATION_TRAIT_IDS.welcoming]);

    // Below release: released, no chronicle line (a place returning to itself is not an event).
    clearTraces();
    loc.properties.prosperity = LOCATION_TRAIT_WELCOMING_RELEASE - 1;
    const out = run(graph, 1, SUSTAIN + 21);
    expect(traitsOn(graph, 'loc.fading')).toEqual([]);
    expect(out.tickEvents ?? []).toHaveLength(0);
    const trace = locationTraitTraces();
    expect(trace).toHaveLength(1);
    expect(trace[0].released).toEqual([
      { locationId: 'loc.fading', traitId: LOCATION_TRAIT_IDS.welcoming, value: LOCATION_TRAIT_WELCOMING_RELEASE - 1 },
    ]);
  });

  it('mints Lawless from sustained unrest', () => {
    addTown(graph, 'loc.riot', { unrest: LOCATION_TRAIT_LAWLESS_ENTER });
    run(graph, SUSTAIN);
    expect(traitsOn(graph, 'loc.riot')).toEqual([LOCATION_TRAIT_IDS.lawless]);
  });

  it('Haunted needs the dead: saturation alone mints Veil-thin, saturation plus deaths mints Haunted', () => {
    addTown(graph, 'loc.thin', { magicalSaturation: LOCATION_TRAIT_HAUNTED_ENTER, deathCount: LOCATION_TRAIT_HAUNTED_DEATHS - 1 });
    addTown(graph, 'loc.grave', { magicalSaturation: LOCATION_TRAIT_HAUNTED_ENTER, deathCount: LOCATION_TRAIT_HAUNTED_DEATHS });
    run(graph, SUSTAIN);
    expect(traitsOn(graph, 'loc.thin')).toEqual([LOCATION_TRAIT_IDS.veilThin]);
    expect(traitsOn(graph, 'loc.grave')).toEqual([LOCATION_TRAIT_IDS.haunted]);
  });

  it('Haunted supersedes Veil-thin on the same place, and blocks it while held', () => {
    addTown(graph, 'loc.hollow', { magicalSaturation: LOCATION_TRAIT_VEIL_THIN_ENTER, deathCount: 0 });
    run(graph, SUSTAIN);
    expect(traitsOn(graph, 'loc.hollow')).toEqual([LOCATION_TRAIT_IDS.veilThin]);

    // The dead arrive and the veil wears further.
    const loc = graph.getNode('loc.hollow')!;
    loc.properties.magicalSaturation = LOCATION_TRAIT_HAUNTED_ENTER;
    loc.properties.deathCount = LOCATION_TRAIT_HAUNTED_DEATHS;
    clearTraces();
    run(graph, SUSTAIN, SUSTAIN + 1);
    expect(traitsOn(graph, 'loc.hollow')).toEqual([LOCATION_TRAIT_IDS.haunted]);
    const trace = locationTraitTraces().at(-1)!;
    expect(trace.superseded).toEqual([
      { locationId: 'loc.hollow', removed: LOCATION_TRAIT_IDS.veilThin, by: LOCATION_TRAIT_IDS.haunted },
    ]);

    // While haunted, veil-thin does not creep back in beside it.
    run(graph, SUSTAIN * 2, SUSTAIN * 2 + 1);
    expect(traitsOn(graph, 'loc.hollow')).toEqual([LOCATION_TRAIT_IDS.haunted]);
  });

  it('a prosperity written on the 0–1 scale reads Destitute — nothing mints', () => {
    // `monsterFactionSeed.ts` and the ruin floor write 0–1; a den at "1.0" is not a boom town.
    addTown(graph, 'loc.den', { prosperity: 1.0 });
    run(graph, SUSTAIN * 2);
    expect(traitsOn(graph, 'loc.den')).toEqual([]);
  });

  it('a scalar nobody wrote skips its rule and writes no counter (fail-soft)', () => {
    addTown(graph, 'loc.blank', {});
    run(graph, SUSTAIN);
    const props = graph.getNode('loc.blank')!.properties;
    for (const rule of LOCATION_TRAIT_RULES) {
      expect(props[`${LOCATION_TRAIT_SUSTAIN_PROPERTY_PREFIX}${rule.id}`]).toBeUndefined();
    }
    expect(traitsOn(graph, 'loc.blank')).toEqual([]);
  });

  it('a Place (sublocation) is never minted on — the place tier is the one source every reader agrees on', () => {
    addTown(graph, 'loc.parent', { prosperity: LOCATION_TRAIT_WELCOMING_ENTER });
    graph.addNode({
      id: 'sub.market', type: 'location', name: 'The Market',
      properties: { parentLocationId: 'loc.parent', sublocationCategory: 'market', prosperity: LOCATION_TRAIT_WELCOMING_ENTER },
    });
    run(graph, SUSTAIN);
    expect(traitsOn(graph, 'loc.parent')).toEqual([LOCATION_TRAIT_IDS.welcoming]);
    expect(traitsOn(graph, 'sub.market')).toEqual([]);
  });

  it('a missing definition is counted and held, never thrown from the tick loop', () => {
    const bare = new WorldGraph(); // no definitions seeded
    addTown(bare, 'loc.old', { prosperity: LOCATION_TRAIT_WELCOMING_ENTER });
    expect(() => run(bare, SUSTAIN + 3)).not.toThrow();
    expect(traitsOn(bare, 'loc.old')).toEqual([]);
    // The counter parks at the threshold so the mint fires the tick the definition arrives.
    expect(bare.getNode('loc.old')!.properties[`${LOCATION_TRAIT_SUSTAIN_PROPERTY_PREFIX}welcoming`]).toBe(SUSTAIN);
    seedEncounterTraitDefinitions(bare);
    run(bare, 1, SUSTAIN + 4);
    expect(traitsOn(bare, 'loc.old')).toEqual([LOCATION_TRAIT_IDS.welcoming]);
  });

  it('bumps the world version on a mint (assignTrait does not), and only then', () => {
    const runtime = createSimulationRuntime();
    addTown(graph, 'loc.rich', { prosperity: LOCATION_TRAIT_WELCOMING_ENTER });
    const before = runtime.worldVersion;
    run(graph, SUSTAIN - 1, 1, runtime);
    expect(runtime.worldVersion).toBe(before);
    run(graph, 1, SUSTAIN, runtime);
    expect(runtime.worldVersion).toBe(before + 1);
  });

  it('emits one aggregate trace per tick that moved, and none on a quiet tick', () => {
    addTown(graph, 'loc.a', { prosperity: LOCATION_TRAIT_WELCOMING_ENTER });
    addTown(graph, 'loc.b', { unrest: LOCATION_TRAIT_LAWLESS_ENTER });
    run(graph, SUSTAIN - 1);
    expect(locationTraitTraces()).toHaveLength(0);
    run(graph, 1, SUSTAIN);
    const traces = locationTraitTraces();
    expect(traces).toHaveLength(1);
    expect(traces[0].minted.map(m => m.traitId).sort()).toEqual(
      [LOCATION_TRAIT_IDS.welcoming, LOCATION_TRAIT_IDS.lawless].sort(),
    );
    expect(traces[0].minted.find(m => m.locationId === 'loc.a')).toMatchObject({
      input: 'prosperity', value: LOCATION_TRAIT_WELCOMING_ENTER, sustainTicks: SUSTAIN,
    });
  });
});

describe('describeLocationTraits — the readout the bridge and the CLI share', () => {
  it('reports minted and planted conditions alike, with the sustain counters, by id or name', () => {
    const graph = new WorldGraph();
    seedEncounterTraitDefinitions(graph);
    addTown(graph, 'loc.rich', { prosperity: LOCATION_TRAIT_WELCOMING_ENTER });
    addTown(graph, 'loc.other', { unrest: 3 });
    run(graph, SUSTAIN);
    // An aftermath-planted condition beside the minted one.
    graph.addEdge({
      id: 'e.has_trait.loc.rich.festival', source: 'loc.rich', target: 'trait.condition.location.festival',
      type: 'has_trait', properties: { ticksRemaining: 12, source: 'encounter.fair' },
    });

    const all = describeLocationTraits(graph);
    expect(all.map(r => r.traitId).sort()).toEqual([LOCATION_TRAIT_IDS.welcoming, 'trait.condition.location.festival'].sort());

    const byName = describeLocationTraits(graph, 'town loc.rich');
    expect(byName).toHaveLength(2);
    const minted = byName.find(r => r.traitId === LOCATION_TRAIT_IDS.welcoming)!;
    expect(minted).toMatchObject({ locationId: 'loc.rich', traitName: 'Welcoming', source: LOCATION_TRAIT_SOURCE, ticksRemaining: null, since: SUSTAIN });
    expect(minted.sustain).toEqual({ welcoming: 0, lawless: 0, veilThin: 0, haunted: 0 });
    const planted = byName.find(r => r.traitId === 'trait.condition.location.festival')!;
    expect(planted).toMatchObject({ traitName: 'Festival', ticksRemaining: 12, source: 'encounter.fair' });

    expect(describeLocationTraits(graph, 'loc.other')).toEqual([]);
    expect(describeLocationTraits(graph, 'nowhere')).toEqual([]);
  });
});
