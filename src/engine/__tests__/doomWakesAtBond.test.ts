/**
 * THR-1646 — the doom clock waits for The First (opening plan S2,
 * `Docs/plans/2026-09-27-thr-1605-the-opening.md`).
 *
 * The Done-when, one arm each:
 *  - no doom advance before the bond;
 *  - `wokeAtTick` is set on the first bonded tick (with its trace and chronicle line);
 *  - expiry is held until the floor, even with `doom_rate_multiplier` 10;
 *  - rivals are silent inside the grace window.
 * Plus the fail-soft reading of a pre-wake-era clock (no `wokeAtTick` field), the
 * omen gate, and the new-cycle clock waking at cycle start.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { phaseDoom, phaseDoomExpiry, phaseRivalActions, resetEventCounter } from '../orchestrator';
import { phaseOmenAgenda, OMEN_FIRST_ACTIVATION_TICK } from '../phaseOmenAgenda';
import { transitionToNewCycle } from '../cycleEnd';
import { seedWorld } from '../worldSeed';
import { createAscendant } from '../ascendant';
import { generateRivals, createRivalState } from '../rival';
import {
  generateDoomClock,
  createDoomClockState,
  resolveDoomWokeAtTick,
  doomFloorMetAtTick,
  isRivalGraceActive,
} from '../doomClock';
import { createGreatChronicle } from '../chronicle';
import { createDefaultFundament, createResonanceState } from '../worldSoul';
import { enableTracing, disableTracing, clearTraces, getTraces } from '../traceBuffer';
import {
  DOOM_MIN_RUN_TICKS_AFTER_BOND,
  RIVAL_GRACE_TICKS_AFTER_BOND,
} from '../../data/game-config';
import { DOOM_WAKES_LINES } from '../../data/doom-wake-lines';
import { DOOM_CLOCK_ARCHETYPES } from '../../types/doomClock';
import type { GameState } from '../../types/gameState';
import type { CosmologyProfile } from '../../types/index';
import { SPHERE_NAMES } from '../../types/index';

const TOTAL_TICKS = 360;

function makeState(): GameState {
  const cosmology = {} as CosmologyProfile;
  for (const s of SPHERE_NAMES) cosmology[s] = 0.125;
  const tiles = [];
  for (let col = 0; col < 5; col++) {
    for (let row = 0; row < 5; row++) {
      tiles.push({
        coord: { col, row },
        geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 },
        terrain: 'grassland' as const,
      });
    }
  }
  const seed = 42;
  const { graph } = seedWorld(cosmology, tiles, seed);
  graph.addNode({ id: 'loc.start', type: 'location', name: 'Sacred Grove', properties: { locationType: 'location' } });
  const { ascendantId } = createAscendant(graph, {
    archetype: {
      id: 'arch_test',
      name: 'The Watcher Divine',
      title: 'The Watcher',
      description: 'Test archetype',
      sphereAlignment: { primary: 'mind', secondary: 'spirit' },
      startingDomainAffinities: { iron: 2, gold: 1 },
      personalitySeed: {},
      flavorText: 'A test archetype',
    },
    avatar: { name: 'TestAvatar', startLocationId: 'loc.start', formDescription: 'A test avatar' },
  } as Parameters<typeof createAscendant>[1]);
  const rivalDefinitions = generateRivals(cosmology, seed);
  const essencePool: Record<string, number> = {};
  for (const s of SPHERE_NAMES) essencePool[s] = 0;

  return {
    cycle: 1,
    tick: 0,
    phase: 'playing',
    seed,
    graph,
    cosmology,
    tiles,
    clock: { currentTick: 0, ticksPerSeason: 90, season: 0, year: 0 },
    ascendantId,
    essencePool,
    mandateDefinition: null,
    mandateState: null,
    rivalDefinitions,
    rivalStates: rivalDefinitions.map(r => createRivalState(r.id)),
    doomDefinition: generateDoomClock('breach', TOTAL_TICKS, seed),
    doomClock: createDoomClockState('breach', TOTAL_TICKS),
    tickEvents: [],
    recentEvents: [],
    chronicleEntries: [],
    stealthExposure: 0,
    visibilityMap: new Map(),
    encounterProgress: [],
    worldSoul: { fundament: createDefaultFundament(), resonance: createResonanceState(), currentCycle: 1 },
    echoDefinitions: [],
    echoStates: [],
    chronicle: createGreatChronicle(),
  } as unknown as GameState;
}

function bondTheFirst(state: GameState): void {
  state.graph.addNode({ id: 'first', type: 'actor', name: 'Kael', properties: { actorType: 'individual' } });
  state.graph.addEdge({
    id: 'thread_first',
    source: state.ascendantId,
    target: 'first',
    type: 'thread',
    properties: { courtPosition: 'the_first' },
  });
}

/** Run phaseDoom `n` times from `state.tick`, merging each partial like runTick does. */
function runDoom(state: GameState, n: number): GameState {
  let s = state;
  for (let i = 0; i < n; i++) {
    s = { ...s, tickEvents: [] };
    s = { ...s, ...phaseDoom(s), tick: s.tick + 1 };
  }
  return s;
}

describe('THR-1646 — the doom clock waits for The First', () => {
  beforeEach(() => {
    resetEventCounter();
    clearTraces();
    enableTracing();
  });
  afterEach(() => {
    disableTracing();
  });

  it('a fresh clock is asleep: wokeAtTick is null', () => {
    const clock = createDoomClockState('breach', TOTAL_TICKS);
    expect(clock.wokeAtTick).toBeNull();
    expect(resolveDoomWokeAtTick(clock)).toBeNull();
    expect(doomFloorMetAtTick(clock)).toBeNull();
  });

  it('does not advance before the bond', () => {
    const after = runDoom(makeState(), 30);
    expect(after.doomClock.currentTick).toBe(0);
    expect(after.doomClock.progress).toBe(0);
    expect(after.doomClock.wokeAtTick).toBeNull();
    expect(getTraces().some(t => t.category === 'doom.wake')).toBe(false);
  });

  it('wakes on the first bonded tick, traces doom.wake and tells the chronicle', () => {
    let s = runDoom(makeState(), 10);
    bondTheFirst(s);
    s = { ...s, tickEvents: [] };
    const wakeTick = s.tick;
    const partial = phaseDoom(s);
    expect(partial.doomClock?.wokeAtTick).toBe(wakeTick);
    // The clock counts from the wake tick on, exactly as before.
    expect(partial.doomClock?.currentTick).toBe(1);

    const wakeTraces = getTraces().filter(t => t.category === 'doom.wake');
    expect(wakeTraces).toHaveLength(1);
    expect(wakeTraces[0].tick).toBe(wakeTick);

    // THR-1774: the authored line, then one sentence that names the doom.
    const wakeMessage = `${DOOM_WAKES_LINES.breach} The Age of the Breach has begun.`;
    const line = (partial.tickEvents ?? []).find(e => e.message === wakeMessage);
    expect(line).toBeDefined();
    expect(line?.notification?.channel).toBe('toast');
    // …and the Chronicle keeps it after the toast is gone.
    const chronicled = (partial.chronicleEntries ?? []).filter(e => e.prose === wakeMessage);
    expect(chronicled).toHaveLength(1);
    expect(chronicled[0].title).toBe('The Age of the Breach');

    // The wake is once: the next tick advances without a second wake.
    s = { ...s, ...partial, tick: s.tick + 1, tickEvents: [] };
    const next = phaseDoom(s);
    expect(next.doomClock?.wokeAtTick).toBe(wakeTick);
    expect(getTraces().filter(t => t.category === 'doom.wake')).toHaveLength(1);
  });

  it('never re-sleeps once woken, even if The First is gone', () => {
    let s = makeState();
    bondTheFirst(s);
    s = runDoom(s, 5);
    s.graph.removeNode('first');
    const partial = phaseDoom({ ...s, tickEvents: [] });
    expect(partial.doomClock?.currentTick).toBe(6);
  });

  it('holds the Unmaking until the floor, even with doom_rate_multiplier 10', () => {
    let s = makeState();
    bondTheFirst(s);
    s.activeRuleOverrides = {
      [s.ascendantId]: [{
        sourceAttachmentId: 'att.test',
        sourceAgentId: s.ascendantId,
        rule: 'doom_rate_multiplier',
        value: 10,
        scope: { scope: 'self' },
        expiryTick: null,
        establishedTick: 0,
      }],
    } as GameState['activeRuleOverrides'];
    const wokeAt = s.tick;

    // 360 total ticks at ×10 expires in ~36 ticks — far inside the 720-tick floor.
    let heldPhases = 0;
    let traced = 0;
    for (let i = 0; i < 60; i++) {
      s = { ...s, tickEvents: [] };
      s = { ...s, ...phaseDoom(s) };
      const expiry = phaseDoomExpiry(s);
      expect(expiry.phase).toBeUndefined();
      if (s.doomClock.expired) heldPhases++;
      s = { ...s, ...expiry, tick: s.tick + 1 };
      traced = getTraces().filter(t => t.category === 'doom.expiry_held').length;
    }
    expect(s.doomClock.expired).toBe(true);
    expect(s.doomClock.currentStage).toBe(5);
    expect(heldPhases).toBeGreaterThan(0);
    expect(traced).toBe(1); // once, not every held tick

    // At the floor, the Unmaking begins.
    const atFloor = phaseDoomExpiry({ ...s, tick: wokeAt + DOOM_MIN_RUN_TICKS_AFTER_BOND });
    expect(atFloor.phase).toBe('twilight');
    const justBefore = phaseDoomExpiry({ ...s, tick: wokeAt + DOOM_MIN_RUN_TICKS_AFTER_BOND - 1 });
    expect(justBefore.phase).toBeUndefined();
  });

  it('an expired clock that never woke never starts the Unmaking', () => {
    const s = makeState();
    s.doomClock = { ...s.doomClock, expired: true };
    expect(phaseDoomExpiry({ ...s, tick: 5000 }).phase).toBeUndefined();
  });

  it('a pre-wake-era clock (no wokeAtTick field) runs as woken at tick 0, floor included', () => {
    const s = makeState();
    const { wokeAtTick: _dropped, ...legacy } = s.doomClock;
    s.doomClock = legacy;
    expect(resolveDoomWokeAtTick(s.doomClock)).toBe(0);
    expect(phaseDoom(s).doomClock?.currentTick).toBe(1);
    s.doomClock = { ...legacy, expired: true };
    expect(phaseDoomExpiry({ ...s, tick: DOOM_MIN_RUN_TICKS_AFTER_BOND - 1 }).phase).toBeUndefined();
    expect(phaseDoomExpiry({ ...s, tick: DOOM_MIN_RUN_TICKS_AFTER_BOND }).phase).toBe('twilight');
  });

  it('rivals are silent before the bond and inside the grace window, then act', () => {
    let s = makeState();
    const runRivals = (from: number, to: number): number => {
      let events = 0;
      for (let t = from; t < to; t++) {
        s = { ...s, tick: t, tickEvents: [] };
        const partial = phaseRivalActions(s);
        events += (partial.tickEvents ?? []).length;
        s = { ...s, ...partial };
      }
      return events;
    };

    // Asleep: nothing, for as long as the player takes.
    expect(runRivals(0, 60)).toBe(0);
    expect(isRivalGraceActive(s.doomClock, 59)).toBe(true);

    // Bond at tick 60; the grace window runs to 60 + 48.
    bondTheFirst(s);
    s = { ...s, tick: 60, tickEvents: [] };
    s = { ...s, ...phaseDoom(s) };
    expect(s.doomClock.wokeAtTick).toBe(60);
    expect(runRivals(60, 60 + RIVAL_GRACE_TICKS_AFTER_BOND)).toBe(0);

    const graceTraces = getTraces().filter(t => t.category === 'rival.grace_hold');
    expect(graceTraces).toHaveLength(1);

    // After the window the rivals move again (the orchestrator suite's own bar:
    // rival events fire within 20 ticks of an open window).
    expect(isRivalGraceActive(s.doomClock, 60 + RIVAL_GRACE_TICKS_AFTER_BOND)).toBe(false);
    expect(runRivals(60 + RIVAL_GRACE_TICKS_AFTER_BOND, 60 + RIVAL_GRACE_TICKS_AFTER_BOND + 20))
      .toBeGreaterThan(0);
  });

  it('omens first activate OMEN_FIRST_ACTIVATION_TICK ticks after the wake, not after tick 0', () => {
    const s = makeState();
    expect(phaseOmenAgenda({ ...s, tick: 50 })).toEqual({});
    s.doomClock = { ...s.doomClock, wokeAtTick: 40 };
    expect(phaseOmenAgenda({ ...s, tick: 40 + OMEN_FIRST_ACTIVATION_TICK - 1 })).toEqual({});
  });

  it('a new cycle starts with its clock already awake at tick 0', () => {
    const s = makeState();
    const next = transitionToNewCycle({ ...s, phase: 'twilight' }, [], [], 'test harvest');
    expect(next.tick).toBe(0);
    expect(next.doomClock.wokeAtTick).toBe(0);
    expect(next.doomClock.currentTick).toBe(0);
  });

  it('names the doom by its display name in stage escalations, never the raw key (THR-1774)', () => {
    for (const archetype of ['breach', 'reckoning'] as const) {
      resetEventCounter();
      let s = { ...makeState(), doomDefinition: generateDoomClock(archetype, TOTAL_TICKS, 42), doomClock: createDoomClockState(archetype, TOTAL_TICKS) };
      bondTheFirst(s);
      const escalations: string[] = [];
      for (let i = 0; i < TOTAL_TICKS && escalations.length === 0; i++) {
        s = { ...s, tickEvents: [] };
        const partial = phaseDoom(s);
        for (const e of partial.tickEvents ?? []) {
          if (e.type === 'doom_escalation') escalations.push(e.message, e.notification?.popup?.body ?? '');
        }
        s = { ...s, ...partial, tick: s.tick + 1 };
      }
      expect(escalations.length).toBeGreaterThan(0);
      const name = archetype === 'breach' ? 'Breach' : 'Reckoning';
      expect(escalations[0]).toMatch(new RegExp(`^The ${name} intensifies — `));
      // Case-sensitive: the display name is capitalised, the raw key is not.
      for (const text of escalations) expect(text).not.toMatch(new RegExp(`\\b${archetype}\\b`));
    }
  });

  it('authors one wake line per doom archetype', () => {
    for (const archetype of DOOM_CLOCK_ARCHETYPES) {
      expect(DOOM_WAKES_LINES[archetype]?.length ?? 0).toBeGreaterThan(0);
    }
  });
});
