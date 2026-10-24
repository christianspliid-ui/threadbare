/**
 * THR-1381 — the end of the age. Plan `Docs/plans/2026-10-17-thr-1381-the-end-of-the-age.md`
 * § Done when: the Mandate ends the age, the beats per ending / fate / memory, the
 * content rows per doom file, `concludeRun` writing and fading memories, the two
 * popups as chronicle lines, and the fallback to the harvest.
 */
import { readdirSync } from 'fs';
import { join } from 'path';
import { beforeEach, describe, expect, it } from 'vitest';
import type { GameState } from '../../types/gameState';
import type { DoomClockArchetype } from '../../types/doomClock';
import { DOOM_CLOCK_ARCHETYPES } from '../../types/doomClock';
import type { ResonanceMemory } from '../../types/worldSoul';
import { initializeGameStateFromIdentity, devSeedTheFirst, DEV_ASCENDANT_IDENTITY } from '../gameInit';
import { computeHarvest, startTwilight } from '../cycleEnd';
import type { HarvestResult } from '../cycleEnd';
import { concludeRun, emptyAccount } from '../accountRecord';
import { phaseDoomExpiry, phaseMandate, resetDecisionCache, resetEventCounter } from '../orchestrator';
import { getFirstId } from '../meetingEncounter';
import { clearTraces, enableTracing, getTraces } from '../traceBuffer';
import { buildTwilightBeats, captureAgeMemories, openTwilight } from '../twilight';
import { ARCHETYPE_STAGE_NAMES } from '../../data/doom-content';
import { DOOM_ENDING_LINES } from '../../data/twilight-content';
import { RESONANCE_DEGRADE_PER_RUN } from '../../data/game-config';
import type { EchoDefinition } from '../../types/echo';

function newWorld(): GameState {
  resetEventCounter();
  resetDecisionCache();
  const state = initializeGameStateFromIdentity(DEV_ASCENDANT_IDENTITY, 42, undefined, 'small').state;
  devSeedTheFirst(state);
  return state;
}

const GOD = DEV_ASCENDANT_IDENTITY.divineName;

function withDoom(state: GameState, archetype: DoomClockArchetype): GameState {
  return { ...state, doomDefinition: { ...state.doomDefinition, archetype } };
}

function withMandate(state: GameState, name = 'The Long Peace'): GameState {
  const def = state.mandateDefinition ?? ({ id: 'mandate.test' } as NonNullable<GameState['mandateDefinition']>);
  return {
    ...state,
    mandateDefinition: { ...def, name },
    mandateState: { ...(state.mandateState ?? { mandateId: def.id, currentStage: 'culmination', progress: 1, failed: false }), completed: true } as NonNullable<GameState['mandateState']>,
  };
}

function withDominant(state: GameState, sphere: 'life' | 'order' | null): GameState {
  const agg = state.worldSoul.aggregate ?? { totalBySphere: {} as never, entityCount: 0, dominantSphere: null };
  return { ...state, worldSoul: { ...state.worldSoul, aggregate: { ...agg, dominantSphere: sphere } } };
}

const MONUMENT: EchoDefinition = {
  id: 'echo_1_divine_loc', echoType: 'monument', source: 'divine', originNodeId: 'loc', originCycle: 1,
  name: 'The Long Barrow', summary: '', sphereAffinities: ['life', 'order'], significance: 0.7,
  injection: { injectionType: 'location_feature', description: '' },
};

function harvestWith(state: GameState, divine: EchoDefinition[]): HarvestResult {
  return { ...computeHarvest(state), divineEchoes: divine };
}

beforeEach(() => {
  enableTracing();
  clearTraces();
});

describe('THR-1381 E3 — finishing the Mandate ends the age', () => {
  it('a completed Mandate in play enters the Twilight and traces age.ended by mandate', () => {
    const state = withMandate(newWorld());
    expect(state.phase).toBe('playing');
    const out = phaseDoomExpiry(state);
    expect(out.phase).toBe('twilight');
    const ended = getTraces().filter(t => t.category === 'age.ended');
    expect(ended).toHaveLength(1);
    expect((ended[0] as { by: string }).by).toBe('mandate');
  });

  it('a doom expiry before the floor still holds, and no Mandate means no early end', () => {
    const base = newWorld();
    const state: GameState = { ...base, doomClock: { ...base.doomClock, expired: true, wokeAtTick: base.tick } };
    const out = phaseDoomExpiry(state);
    expect(out.phase).toBeUndefined();
    expect(getTraces().some(t => t.category === 'age.ended')).toBe(false);
  });

  it('when both clocks are done the age ends in triumph (Mandate first)', () => {
    const base = withMandate(newWorld());
    const state: GameState = { ...base, doomClock: { ...base.doomClock, expired: true, wokeAtTick: -10_000 } };
    phaseDoomExpiry(state);
    const ended = getTraces().filter(t => t.category === 'age.ended');
    expect(ended.map(t => (t as { by: string }).by)).toEqual(['mandate']);
  });
});

describe('THR-1381 Decided 6 — the age-end popups are chronicle lines', () => {
  it('doom expiry raises an alert (the Chronicle intake), not a popup, with the final stage named', () => {
    const base = withDoom(newWorld(), 'breach');
    const state: GameState = { ...base, doomClock: { ...base.doomClock, expired: true, wokeAtTick: -10_000 } };
    const out = phaseDoomExpiry(state);
    expect(out.phase).toBe('twilight');
    const ev = (out.tickEvents ?? []).find(e => e.type === 'phase_change');
    expect(ev?.notification?.channel).toBe('alert');
    expect(ev?.message).toBe('The Breach: the Unmaking begins.');
  });

  it('the Mandate completion line rides the alert channel, never a popup', () => {
    const state = newWorld();
    if (!state.mandateDefinition || !state.mandateState) return; // a world without a Mandate has no line to check
    const pressed: GameState = { ...state, mandateState: { ...state.mandateState, progress: 0.999, currentStage: 'culmination' } };
    const out = phaseMandate(pressed);
    for (const e of out.tickEvents ?? []) {
      if (e.type === 'mandate_progress') expect(e.notification?.channel).not.toBe('popup');
    }
  });
});

describe('THR-1381 E1 — the beats', () => {
  it('opens each doom kind with its last stage name and its line', () => {
    for (const archetype of DOOM_CLOCK_ARCHETYPES) {
      const state = withDoom(newWorld(), archetype);
      const beats = buildTwilightBeats(state, harvestWith(state, []), 1);
      expect(beats.ending.kind).toBe('doom');
      expect(beats.ending.title).toBe(ARCHETYPE_STAGE_NAMES[archetype][4]);
      expect(beats.ending.kind === 'doom' && beats.ending.line).toBe(DOOM_ENDING_LINES[archetype]);
      expect(beats.ending.close).toBe(`The age of ${GOD} ends. From here you watch; you cannot act.`);
      expect(beats.fallbacks).toEqual([]);
    }
  });

  it('opens a Mandate ending with its name, fulfilled', () => {
    const state = withMandate(newWorld(), 'the Long Peace');
    const beats = buildTwilightBeats(state, harvestWith(state, []), 1);
    expect(beats.ending.kind).toBe('mandate');
    expect(beats.ending.title).toBe('The Long Peace, fulfilled');
    expect(beats.ending.kind === 'mandate' && beats.ending.line).toBe(`${GOD} did all the Mandate asked before the end came.`);
    expect(beats.ending.close).toBe(`The age of ${GOD} ends in triumph. From here you watch; you cannot act.`);
  });

  it('falls back to "The Unmaking" when the doom data is missing', () => {
    const state = { ...newWorld(), doomDefinition: { archetype: 'nonsense' } as never };
    const beats = buildTwilightBeats(state, harvestWith(state, []), 1);
    expect(beats.ending.title).toBe('The Unmaking');
    expect(beats.fallbacks).toContain('doom_data_missing');
  });

  it("names the First's fate from state: lived, died, Aspect, none", () => {
    const state = newWorld();
    const firstId = getFirstId(state.graph, state.ascendantId)!;
    const node = state.graph.getNode(firstId)!;
    delete (node.properties as Record<string, unknown>).calling;
    delete (node.properties as Record<string, unknown>).callingTitleKey;
    let beats = buildTwilightBeats(state, harvestWith(state, []), 1);
    expect(beats.first?.fate).toBe('lived');
    expect(beats.first?.line).toBe(`${node.name}, your First, lived to see the age end.`);

    Object.assign(node.properties, { calling: 'Mender', callingTitleKey: 'mender' });
    beats = buildTwilightBeats(state, harvestWith(state, []), 1);
    expect(beats.first?.line).toBe(`${node.name}, your First, lived to see the age end, a mender to the last.`);

    node.properties.deceased = true;
    beats = buildTwilightBeats(state, harvestWith(state, []), 1);
    expect(beats.first?.fate).toBe('died');
    expect(beats.first?.line).toBe(`${node.name}, your First, died before the age ended.`);

    state.graph.addEdge({ id: 'aspect_test', source: state.ascendantId, target: firstId, type: 'aspect_of', properties: { attainedTick: 1 } });
    beats = buildTwilightBeats(state, harvestWith(state, []), 1);
    expect(beats.first?.fate).toBe('aspect');
    expect(beats.first?.line).toBe(`${node.name}, your First, stands at the end of the age as your Aspect.`);

    const unbonded = initializeGameStateFromIdentity(DEV_ASCENDANT_IDENTITY, 42, undefined, 'small').state;
    expect(buildTwilightBeats(unbonded, harvestWith(unbonded, []), 1).first).toBeUndefined();
  });

  it('captures the memories in order — ending, leaning, mark — with the exact lines', () => {
    const state = withDominant(withDoom(newWorld(), 'breach'), 'life');
    const harvest = harvestWith(state, [MONUMENT]);
    const beats = buildTwilightBeats(state, harvest, 3);
    expect(beats.memories.map(m => m.memoryType)).toEqual(['doom_scar', 'sphere_dominance', 'divine_intervention']);
    expect(beats.memories.map(m => m.summary)).toEqual([
      `The Breach ended the age of ${GOD}.`,
      `When the age of ${GOD} ended, the world leaned most to Life.`,
      `${GOD} held The Long Barrow above every other place.`,
    ]);
    expect(beats.memories.map(m => m.id)).toEqual(['mem-3-doom_scar', 'mem-3-sphere_dominance', 'mem-3-divine_intervention']);
    expect(beats.memories.every(m => m.degradation === 0 && m.cycleOrigin === 3)).toBe(true);

    // Legacy and Relic name their echo the harvest's way.
    const legacy = captureAgeMemories(state, harvestWith(state, [{ ...MONUMENT, echoType: 'legacy', name: 'Maren Ashfold' }]), 3);
    expect(legacy[2].summary).toBe(`${GOD} raised the line of Maren Ashfold above every other mortal.`);
    const relic = captureAgeMemories(state, harvestWith(state, [{ ...MONUMENT, echoType: 'relic', name: 'the Ember Crown' }]), 3);
    expect(relic[2].summary).toBe(`${GOD}'s chosen carried the Ember Crown.`);

    const mandate = captureAgeMemories(withMandate(state, 'The Long Peace'), harvest, 3);
    expect(mandate[0]).toMatchObject({ memoryType: 'mandate_triumph', summary: `${GOD} fulfilled The Long Peace before the end.` });
  });

  it('drops a memory whose fact is absent: no aggregate, no echo', () => {
    const state = withDominant(newWorld(), null);
    expect(captureAgeMemories(state, harvestWith(state, []), 1).map(m => m.memoryType)).toEqual(['doom_scar']);
  });

  it('is pure: called twice on the same state it returns equal beats', () => {
    const state = withDominant(newWorld(), 'order');
    const harvest = computeHarvest(state);
    expect(buildTwilightBeats(state, harvest, 1)).toEqual(buildTwilightBeats(state, harvest, 1));
  });
});

describe('THR-1381 Content — every doom kind has an ending row', () => {
  it('each archetype file under src/data/doom/ has a line', () => {
    const files = readdirSync(join(__dirname, '../../data/doom'))
      .filter(f => f.endsWith('.json') && f !== 'vocabulary.json')
      .map(f => f.replace(/\.json$/, ''));
    expect(files.length).toBe(DOOM_CLOCK_ARCHETYPES.length);
    for (const kind of files) {
      expect(DOOM_ENDING_LINES[kind as DoomClockArchetype], `no ending row for ${kind}`).toBeTruthy();
    }
  });
});

describe('THR-1381 E5 — concludeRun writes the World-Soul\'s memories', () => {
  it('a second age holds the first age\'s memories faded by one step, plus its own fresh', () => {
    const first = withDominant(newWorld(), 'life');
    const record1 = concludeRun(emptyAccount(42), first, harvestWith(first, [MONUMENT]));
    expect(record1.resonance.memories.map(m => m.id)).toEqual(['mem-1-doom_scar', 'mem-1-sphere_dominance', 'mem-1-divine_intervention']);
    expect(record1.resonance.memories.every(m => m.degradation === 0)).toBe(true);
    expect(getTraces().filter(t => t.category === 'resonance.memory_captured')).toHaveLength(3);

    // The next world wakes carrying the record's memories (gameInit copies them in).
    const second = withMandate(withDominant(newWorld(), 'order'));
    second.worldSoul = { ...second.worldSoul, resonance: record1.resonance };
    const record2 = concludeRun(record1, second, harvestWith(second, []));
    const byAge = (age: number) => record2.resonance.memories.filter(m => m.cycleOrigin === age);
    expect(byAge(1)).toHaveLength(3);
    for (const m of byAge(1)) expect(m.degradation).toBeCloseTo(RESONANCE_DEGRADE_PER_RUN, 10);
    expect(byAge(2).map(m => m.memoryType)).toEqual(['mandate_triumph', 'sphere_dominance']);
    for (const m of byAge(2)) expect(m.degradation).toBe(0);
  });

  it('with ten memories held, the weakest is evicted and traced', () => {
    const state = withDominant(newWorld(), null);
    const weak: ResonanceMemory[] = Array.from({ length: 10 }, (_, i) => ({
      id: `old-${i}`, cycleOrigin: 0, memoryType: 'sphere_dominance', spheres: ['life'],
      summary: `old ${i}`, significance: i === 4 ? 0.1 : 0.6, degradation: 0,
    }));
    state.worldSoul = { ...state.worldSoul, resonance: { memories: weak, maxMemories: 10 } };
    const record = concludeRun(emptyAccount(42), state, harvestWith(state, []));
    expect(record.resonance.memories).toHaveLength(10);
    expect(record.resonance.memories.some(m => m.id === 'old-4')).toBe(false);
    expect(record.resonance.memories.some(m => m.memoryType === 'doom_scar')).toBe(true);
    const evicted = getTraces().filter(t => t.category === 'resonance.memory_evicted');
    expect(evicted.map(t => (t as { memoryId: string; cause: string }))).toEqual([expect.objectContaining({ memoryId: 'old-4', cause: 'full' })]);
  });

  it('a memory faded to nothing drops, traced as faded', () => {
    const state = withDominant(newWorld(), null);
    state.worldSoul = { ...state.worldSoul, resonance: { memories: [{
      id: 'ancient', cycleOrigin: 0, memoryType: 'doom_scar', spheres: [], summary: 'ancient', significance: 0.9, degradation: 0.9,
    }], maxMemories: 10 } };
    const record = concludeRun(emptyAccount(42), state, harvestWith(state, []));
    expect(record.resonance.memories.some(m => m.id === 'ancient')).toBe(false);
    expect(getTraces().some(t => t.category === 'resonance.memory_evicted' && (t as { cause: string }).cause === 'faded')).toBe(true);
  });
});

describe('THR-1381 fail-soft — a ceremony that cannot be built still reaches the harvest', () => {
  it('openTwilight with a throwing build completes the Twilight and traces the fallback', () => {
    const state = startTwilight(newWorld());
    const opened = openTwilight(state, () => { throw new Error('boom'); });
    expect(opened.ok).toBe(false);
    if (!opened.ok) expect(opened.state.phase).toBe('harvest');
    const fb = getTraces().filter(t => t.category === 'twilight.fallback');
    expect(fb.map(t => (t as { cause: string }).cause)).toEqual(['beats_threw']);
  });

  it('openTwilight on a good state traces the beats once', () => {
    const state = startTwilight(newWorld());
    const opened = openTwilight(state);
    expect(opened.ok).toBe(true);
    expect(getTraces().filter(t => t.category === 'twilight.beats_built')).toHaveLength(1);
  });
});
