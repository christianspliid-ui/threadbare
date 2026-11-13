/**
 * THR-2207 — Stay the Unmaking (slice 2 of `Docs/plans/2026-11-13-thr-2202-give-both-clocks-a-verb.md`).
 *
 *  - The Doom rate no longer compounds: an active `doom_rate_multiplier` scales each
 *    tick's advance and is never written back into `tickModifier`.
 *  - Holding Stay the Unmaking runs Doom at `DOOM_STAY_RATE` and drains its upkeep
 *    from the primary pool every tick.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { phaseDoom, resetEventCounter } from '../orchestrator';
import { seedWorld } from '../worldSeed';
import { createAscendant } from '../ascendant';
import { generateRivals, createRivalState } from '../rival';
import { generateDoomClock, createDoomClockState, advanceDoomClock } from '../doomClock';
import { createGreatChronicle } from '../chronicle';
import { createDefaultFundament, createResonanceState } from '../worldSoul';
import { enableTracing, disableTracing, clearTraces, getTraces } from '../traceBuffer';
import { phaseControlEffects } from '../phaseControlEffects';
import { spawnControlEffect, syncControlRuleOverrides, NON_STACKING_CONTROL_TEMPLATE_IDS } from '../controlEffectSpawn';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import { DOOM_STAY_TEMPLATE_ID, doomStayHint } from '../../data/doom-stay-content';
import { doomStayNotice } from '../views/doomStayNotice';
import { phaseAscendantProgression } from '../phaseAscendantProgression';
import { getMilestoneBeatById, MILESTONE_BEAT_PRESENTATION } from '../../data/ascendant-milestone-beats';
import { MILESTONE_FIRST_STAGE_BEAT_ID } from '../../data/player-progression';
import type { UnifiedAction } from '../../types/unifiedAction';
import type { ControlEffect } from '../../types/controlEffect';
import type { SphereName } from '../../types/index';
import type { GameState } from '../../types/gameState';
import type { CosmologyProfile } from '../../types/index';
import { SPHERE_NAMES } from '../../types/index';
import {
  DOOM_RATE_FLOOR,
  DOOM_STAY_COST,
  DOOM_STAY_RATE,
  DOOM_STAY_RATE_CROOKED,
  DOOM_STAY_UPKEEP_PER_TICK,
} from '../../data/game-config';

/** Long enough that no arm below reaches the end of the clock. */
const TOTAL_TICKS = 5000;

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
  graph.addNode({ id: 'first', type: 'actor', name: 'Kael', properties: { actorType: 'individual' } });
  graph.addEdge({
    id: 'thread_first',
    source: ascendantId,
    target: 'first',
    type: 'thread',
    properties: { courtPosition: 'the_first' },
  });
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

function withRateOverride(state: GameState, value: number, source = 'att.world_tree'): GameState {
  return {
    ...state,
    activeRuleOverrides: {
      [state.ascendantId]: [{
        sourceAttachmentId: source,
        sourceAgentId: state.ascendantId,
        rule: 'doom_rate_multiplier',
        value,
        scope: { scope: 'self' },
        expiryTick: null,
        establishedTick: 0,
      }],
    } as GameState['activeRuleOverrides'],
  };
}

/** Run phaseDoom `n` times, merging each partial the way runTick does. */
function runDoom(state: GameState, n: number): GameState {
  let s = state;
  for (let i = 0; i < n; i++) {
    s = { ...s, tickEvents: [] };
    s = { ...s, ...phaseDoom(s), tick: s.tick + 1 };
  }
  return s;
}

describe('THR-2207 — the Doom rate multiplier does not compound', () => {
  beforeEach(() => {
    resetEventCounter();
    clearTraces();
    enableTracing();
  });
  afterEach(() => {
    disableTracing();
  });

  it('a 0.5 multiplier held for 100 ticks advances the clock by 50 ± 1', () => {
    const after = runDoom(withRateOverride(makeState(), 0.5), 100);
    expect(after.doomClock.currentTick).toBeGreaterThanOrEqual(49);
    expect(after.doomClock.currentTick).toBeLessThanOrEqual(51);
    // The stored rate is the clock's own; the multiplier never reaches it.
    expect(after.doomClock.tickModifier).toBe(1);
  });

  it('an unmultiplied clock advances one tick per tick', () => {
    const after = runDoom(makeState(), 100);
    expect(after.doomClock.currentTick).toBe(100);
  });

  it('a removed override stops slowing the clock (the multiplier left no residue)', () => {
    const slowed = runDoom(withRateOverride(makeState(), 0.5), 20);
    const freed = runDoom({ ...slowed, activeRuleOverrides: {} }, 20);
    expect(freed.doomClock.currentTick - slowed.doomClock.currentTick).toBe(20);
  });

  it('advanceDoomClock clamps the effective rate at DOOM_RATE_FLOOR', () => {
    const clock = { ...createDoomClockState('breach', TOTAL_TICKS), wokeAtTick: 0 };
    const next = advanceDoomClock(clock, 0.001);
    expect(next.currentTick).toBeCloseTo(DOOM_RATE_FLOOR, 9);
    expect(next.tickModifier).toBe(1);
    // Default argument: unchanged behaviour.
    expect(advanceDoomClock(clock).currentTick).toBe(1);
  });
});

// ─── Holding the card ──────────────────────────────────────────────────────────

function castStay(state: GameState, outcome: UnifiedAction['outcome']): ControlEffect {
  const template = getUnifiedTemplateById(DOOM_STAY_TEMPLATE_ID);
  if (!template) throw new Error('Stay the Unmaking template missing');
  const action = {
    id: 'ua.stay',
    templateId: DOOM_STAY_TEMPLATE_ID,
    actorId: state.ascendantId,
    targetId: state.ascendantId,
    resolved: true,
    outcome,
    essencePaid: DOOM_STAY_COST,
  } as unknown as UnifiedAction;
  const spawned = spawnControlEffect(action, template, state.tick, state.graph, state.controlEffects ?? []);
  if (!spawned) throw new Error('Stay the Unmaking did not spawn');
  return spawned.effect;
}

/** Control effects then doom, the order a tick runs them in across the tick boundary. */
function runHeld(state: GameState, n: number): GameState {
  let s = state;
  for (let i = 0; i < n; i++) {
    s = { ...s, tickEvents: [] };
    s = { ...s, ...phaseDoom(s) };
    s = { ...s, ...phaseControlEffects(s), tick: s.tick + 1 };
  }
  return s;
}

function primaryOf(state: GameState): SphereName {
  const effect = castStay(state, 'success');
  return Object.keys(effect.perTickCost)[0] as SphereName;
}

describe('THR-2207 — holding Stay the Unmaking', () => {
  beforeEach(() => {
    resetEventCounter();
    clearTraces();
    enableTracing();
  });
  afterEach(() => {
    disableTracing();
  });

  it('is a sustained, non-stacking, generic milestone gift priced from the primary pool', () => {
    const t = getUnifiedTemplateById(DOOM_STAY_TEMPLATE_ID);
    expect(t?.durationMode).toBe('sustained');
    expect(t?.essenceCost).toBe(DOOM_STAY_COST);
    expect(t?.controlSpec?.perTickCostFromPrimary).toBe(DOOM_STAY_UPKEEP_PER_TICK);
    expect(t?.progression).toMatchObject({ offer: 'gift', giftBy: 'milestone', generic: true });
    expect(NON_STACKING_CONTROL_TEMPLATE_IDS.has(DOOM_STAY_TEMPLATE_ID)).toBe(true);
  });

  it('held clean for 240 ticks: Doom advances 180 ± 2 and the primary pays 0.15 × 240', () => {
    const base = makeState();
    const primary = primaryOf(base);
    const startPool = 1000;
    const effect = castStay(base, 'success');
    expect(effect.ownerRuleOverride).toEqual({ rule: 'doom_rate_multiplier', value: DOOM_STAY_RATE });
    expect(effect.landedCrooked).toBe(false);

    // The control phase runs late in the cast's tick and writes the override; the
    // clock reads it from the next tick on.
    let s: GameState = {
      ...base,
      essencePool: { ...base.essencePool, [primary]: startPool },
      controlEffects: [effect],
    };
    s = { ...s, ...phaseControlEffects(s) };
    expect(s.activeRuleOverrides?.[s.ascendantId]?.some(o => o.rule === 'doom_rate_multiplier')).toBe(true);
    const before = s.doomClock.currentTick;
    const poolBefore = s.essencePool[primary];

    s = runHeld(s, 240);
    const advanced = s.doomClock.currentTick - before;
    expect(advanced).toBeGreaterThanOrEqual(178);
    expect(advanced).toBeLessThanOrEqual(182);
    // runHeld paid 240 upkeeps on top of the first one above.
    expect(poolBefore - s.essencePool[primary]).toBeCloseTo(DOOM_STAY_UPKEEP_PER_TICK * 240, 6);
    expect(s.doomClock.tickModifier).toBe(1);

    const stays = getTraces().filter(t => t.category === 'doom.stay_applied');
    expect(stays).toHaveLength(240);
    expect(stays[0]).toMatchObject({ rate: DOOM_STAY_RATE, crooked: false, upkeepPaid: DOOM_STAY_UPKEEP_PER_TICK });
  });

  it('an unheld control run advances the full 240', () => {
    const s = runHeld(makeState(), 240);
    expect(s.doomClock.currentTick).toBe(240);
  });

  it('a crooked landing holds Doom at DOOM_STAY_RATE_CROOKED', () => {
    const base = makeState();
    const effect = castStay(base, 'success_at_cost');
    expect(effect.landedCrooked).toBe(true);
    expect(effect.ownerRuleOverride?.value).toBe(DOOM_STAY_RATE_CROOKED);
    const primary = Object.keys(effect.perTickCost)[0] as SphereName;
    let s: GameState = { ...base, essencePool: { ...base.essencePool, [primary]: 1000 }, controlEffects: [effect] };
    s = { ...s, ...phaseControlEffects(s) };
    const before = s.doomClock.currentTick;
    s = runHeld(s, 100);
    expect(s.doomClock.currentTick - before).toBeCloseTo(100 * DOOM_STAY_RATE_CROOKED, 6);
  });

  it('lapses when the purse runs dry, and the rate returns to its own pace', () => {
    const base = makeState();
    const effect = castStay(base, 'success');
    const primary = Object.keys(effect.perTickCost)[0] as SphereName;
    // Enough for ten ticks of upkeep, then nothing.
    let s: GameState = {
      ...base,
      essencePool: { ...base.essencePool, [primary]: DOOM_STAY_UPKEEP_PER_TICK * 10 + 0.01 },
      controlEffects: [effect],
    };
    s = { ...s, ...phaseControlEffects(s) };
    s = runHeld(s, 30);
    expect(s.controlEffects?.[0]?.active).toBe(false);
    expect(s.controlEffects?.[0]?.lapseReason).toBe('essence_depleted');
    expect(s.activeRuleOverrides?.[s.ascendantId] ?? []).toEqual([]);
    const at = s.doomClock.currentTick;
    s = runHeld(s, 10);
    expect(s.doomClock.currentTick - at).toBe(10);
  });

  it('a second hold on the god is refused while the first is active', () => {
    const base = makeState();
    const first = castStay(base, 'success');
    const template = getUnifiedTemplateById(DOOM_STAY_TEMPLATE_ID)!;
    const again = spawnControlEffect(
      { id: 'ua.stay2', templateId: DOOM_STAY_TEMPLATE_ID, actorId: base.ascendantId, targetId: base.ascendantId, resolved: true, outcome: 'success' } as unknown as UnifiedAction,
      template, base.tick, base.graph, [first],
    );
    expect(again).toBeNull();
  });

  it('syncControlRuleOverrides leaves non-control overrides untouched', () => {
    const s = withRateOverride(makeState(), 0.5);
    expect(syncControlRuleOverrides([], s.activeRuleOverrides, 0)).toBeUndefined();
  });
});

// ─── The notice and the gift ───────────────────────────────────────────────────

describe('THR-2207 — the Doom notice and the first-stage gift', () => {
  it('says nothing while the card is not held', () => {
    const s = makeState();
    expect(doomStayNotice({ ...s, unifiedActions: [] })).toEqual({});
  });

  it('offers "Stay it" and names the paying pool while held and not active', () => {
    const s = { ...makeState(), unlockedActionIds: [DOOM_STAY_TEMPLATE_ID], unifiedActions: [] };
    const n = doomStayNotice(s);
    expect(n.button).toBe('Stay it');
    expect(n.line).toMatch(/^Stay the Unmaking slows it\. Holding it draws on your [A-Z][a-z]+ essence every day\.$/);
  });

  it('reads "You are holding it back." while active, with no button', () => {
    const base = makeState();
    const effect = castStay(base, 'success');
    const n = doomStayNotice({ ...base, unlockedActionIds: [DOOM_STAY_TEMPLATE_ID], controlEffects: [effect], unifiedActions: [] });
    expect(n).toEqual({ line: 'You are holding it back.' });
  });

  it('an empty sphere slot reads the fallback (PC-3)', () => {
    expect(doomStayHint(undefined)).toBe('Stay the Unmaking slows it. Holding it draws on your primary essence every day.');
  });

  it('the first-stage milestone grants Stay the Unmaking', () => {
    const beat = getMilestoneBeatById(MILESTONE_FIRST_STAGE_BEAT_ID);
    expect(beat?.grantsActionIds).toEqual([DOOM_STAY_TEMPLATE_ID]);
    expect(MILESTONE_BEAT_PRESENTATION[MILESTONE_FIRST_STAGE_BEAT_ID]?.cta).toBe('Receive');
  });

  it('phaseAscendantProgression enqueues it once the clock passes its opening stage after the bond', () => {
    const base = makeState();
    const beats = { spineCursor: -1, pending: null, lastBeatTurn: 0, history: [] } as unknown as GameState['ascendantBeats'];
    // Stage 1, woken: nothing yet.
    const quiet = phaseAscendantProgression({
      ...base,
      ascendantBeats: beats,
      doomClock: { ...base.doomClock, wokeAtTick: 0, currentStage: 1 },
    });
    expect(quiet.ascendantBeats?.pending?.beatId).not.toBe(MILESTONE_FIRST_STAGE_BEAT_ID);

    const fresh = makeState();
    const fired = phaseAscendantProgression({
      ...fresh,
      ascendantBeats: beats,
      doomClock: { ...fresh.doomClock, wokeAtTick: 0, currentStage: 2 },
    });
    expect(fired.ascendantBeats?.pending).toMatchObject({ beatId: MILESTONE_FIRST_STAGE_BEAT_ID, kind: 'milestone' });
  });
});
