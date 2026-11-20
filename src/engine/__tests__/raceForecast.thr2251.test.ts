/**
 * THR-2251 — the race reading: which clock lands first at the last fifteen days' pace.
 * Covers each state, the two-day hold, the first sight (not a turn), the post-bond
 * floor, the zero-pace guard, the lever order, and the phase wiring (alert, trace,
 * checkpoint line).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { createDoomClockState } from '../doomClock';
import { generateRememberedMandate } from '../mandateGenerator';
import { createMandateStateWith } from '../mandate';
import { phaseMandate, resetMandateCounter } from '../phaseMandate';
import {
  emptyRaceWatch,
  projectRace,
  raceLever,
  raceLeverMortalIds,
  raceReading,
  sampleRace,
  settleRace,
  shownRaceState,
  shortMandateSphere,
} from '../raceForecast';
import {
  RACE_MIN_SAMPLES,
  RACE_SAMPLE_EVERY_TICKS,
  RACE_TURN_HOLD_TICKS,
  RACE_WINDOW_SAMPLES,
  RACE_FORECAST_LINES,
  RACE_LEVER_STAY,
  raceChapterLeverLine,
  raceForecastLine,
} from '../../data/race-content';
import { DOOM_STAY_TEMPLATE_ID } from '../../data/doom-stay-content';
import { DOOM_MIN_RUN_TICKS_AFTER_BOND, MANDATE_BASELINE_SETTLE_TICK } from '../../data/game-config';
import type { DoomClockState } from '../../types/doomClock';
import type { RaceWatch } from '../../types/mandate';
import type { GameState } from '../../types/gameState';
import type { SphereAggregate } from '../../types/worldSoul';

const DAY = RACE_SAMPLE_EVERY_TICKS;

function clock(progress: number, wokeAtTick: number | null = 0): DoomClockState {
  return { ...createDoomClockState('breach', 1080), progress, wokeAtTick } as DoomClockState;
}

/** A watch whose samples rise linearly: `mandatePerDay` and `doomPerDay` per day. */
function watchOf(days: number, startTick: number, m0: number, mandatePerDay: number, d0: number, doomPerDay: number): RaceWatch {
  let w = emptyRaceWatch();
  for (let i = 0; i < days; i++) {
    w = sampleRace(w, startTick + i * DAY, m0 + i * mandatePerDay, d0 + i * doomPerDay);
  }
  return w;
}

function lastSample(w: RaceWatch) {
  return w.samples[w.samples.length - 1];
}

describe('THR-2251 — sampleRace', () => {
  it('takes one sample a day and keeps the window', () => {
    let w = emptyRaceWatch();
    w = sampleRace(w, 0, 0, 0.1);
    w = sampleRace(w, DAY - 1, 0.5, 0.5);
    expect(w.samples).toHaveLength(1);
    for (let i = 1; i < RACE_WINDOW_SAMPLES + 5; i++) w = sampleRace(w, i * DAY, 0, 0.1);
    expect(w.samples).toHaveLength(RACE_WINDOW_SAMPLES);
    expect(w.samples[0].tick).toBe(5 * DAY);
  });

  it('skips a non-finite reading', () => {
    const w = sampleRace(emptyRaceWatch(), 0, Number.NaN, 0.3);
    expect(w.samples).toHaveLength(0);
  });
});

describe('THR-2251 — projectRace states', () => {
  const base = { trendRising: false };

  it('hidden before Doom reaches its Signs stage', () => {
    const w = watchOf(10, 0, 0, 0.01, 0.05, 0.01);
    expect(projectRace(w, clock(0.15), 9 * DAY, { ...base, mandateProgress: 0.09 }).state).toBe('hidden');
  });

  it('hidden with fewer than five samples', () => {
    const w = watchOf(RACE_MIN_SAMPLES - 1, 0, 0, 0.01, 0.3, 0.01);
    expect(projectRace(w, clock(0.33), 3 * DAY, { ...base, mandateProgress: 0.03 }).state).toBe('hidden');
  });

  it('hidden while the Doom clock sleeps, or with no clock', () => {
    const w = watchOf(10, 0, 0, 0.01, 0.3, 0.01);
    expect(projectRace(w, clock(0.4, null), 9 * DAY, { ...base, mandateProgress: 0.09 }).state).toBe('hidden');
    expect(projectRace(w, undefined, 9 * DAY, { ...base, mandateProgress: 0.09 }).state).toBe('hidden');
  });

  it('mandate_first when the Mandate fills well before Doom', () => {
    // Mandate +0.05/day from 0.3 → ~1 in 6 days; Doom +0.005/day from 0.3 → ~130 days.
    const w = watchOf(10, 0, 0.3, 0.05, 0.3, 0.005);
    const s = lastSample(w);
    const p = projectRace(w, clock(s.doom), s.tick, { ...base, mandateProgress: s.mandate });
    expect(p.state).toBe('mandate_first');
    expect(p.mandateEndTick!).toBeLessThan(p.doomEndTick!);
  });

  it('doom_first when Doom ends well before the Mandate fills', () => {
    const w = watchOf(10, 0, 0.1, 0.002, 0.3, 0.02);
    const s = lastSample(w);
    const p = projectRace(w, clock(s.doom), s.tick, { ...base, mandateProgress: s.mandate });
    expect(p.state).toBe('doom_first');
  });

  it('close when the two ends sit within the close share of the time left', () => {
    // Both rise 0.01/day from the same fill → identical end ticks.
    const w = watchOf(10, 0, 0.3, 0.01, 0.3, 0.01);
    const s = lastSample(w);
    const p = projectRace(w, clock(s.doom), s.tick, { ...base, mandateProgress: s.mandate });
    expect(p.state).toBe('close');
  });

  it('zero Mandate pace: no end tick and no division; stalled, or doom_first while Rising', () => {
    const w = watchOf(10, 0, 0.2, 0, 0.3, 0.01);
    const s = lastSample(w);
    const stalled = projectRace(w, clock(s.doom), s.tick, { trendRising: false, mandateProgress: s.mandate });
    expect(stalled).toMatchObject({ state: 'stalled', mandateEndTick: null });
    const rising = projectRace(w, clock(s.doom), s.tick, { trendRising: true, mandateProgress: s.mandate });
    expect(rising).toMatchObject({ state: 'doom_first', mandateEndTick: null });
  });

  it('a falling Mandate reads stalled too (no negative pace projected)', () => {
    const w = watchOf(10, 0, 0.5, -0.01, 0.3, 0.01);
    const s = lastSample(w);
    expect(projectRace(w, clock(s.doom), s.tick, { ...base, mandateProgress: s.mandate }).state).toBe('stalled');
  });

  it('a non-positive Doom pace reads hidden', () => {
    const w = watchOf(10, 0, 0.3, 0.01, 0.4, 0);
    const s = lastSample(w);
    expect(projectRace(w, clock(s.doom), s.tick, { ...base, mandateProgress: s.mandate }).state).toBe('hidden');
  });

  it('Doom never ends before the post-bond floor', () => {
    // Doom nearly full and racing; woke at tick 100 → floor 100 + 720.
    const w = watchOf(10, 100, 0.1, 0.01, 0.8, 0.02);
    const s = lastSample(w);
    const p = projectRace(w, clock(0.98, 100), s.tick, { ...base, mandateProgress: s.mandate });
    expect(p.doomEndTick).toBe(100 + DOOM_MIN_RUN_TICKS_AFTER_BOND);
    // Mandate at 0.19 +0.01/day → ~81 days = 972 ticks; floor at 820 is within reach.
    expect(['doom_first', 'close']).toContain(p.state);
  });
});

describe('THR-2251 — settleRace', () => {
  it('first sight shows at once, once per age, and is not a turn', () => {
    const r = settleRace(emptyRaceWatch(), 'doom_first', 100);
    expect(r).toMatchObject({ turned: 'doom_first', firstSight: true, from: 'hidden' });
    expect(r.watch).toMatchObject({ shown: 'doom_first', seen: true });
  });

  it('a new state shows only after it held two days in a row', () => {
    let w: RaceWatch = { samples: [], shown: 'doom_first', seen: true };
    let r = settleRace(w, 'close', 100);
    expect(r.turned).toBeNull();
    expect(r.watch.pending).toEqual({ state: 'close', since: 100 });
    w = r.watch;
    r = settleRace(w, 'close', 100 + RACE_TURN_HOLD_TICKS - 1);
    expect(r.turned).toBeNull();
    r = settleRace(r.watch, 'close', 100 + RACE_TURN_HOLD_TICKS);
    expect(r).toMatchObject({ turned: 'close', firstSight: false, from: 'doom_first' });
    expect(r.watch.shown).toBe('close');
    expect(r.watch.pending).toBeUndefined();
  });

  it('a flap back to the shown state clears the hold, and a different state restarts it', () => {
    const w: RaceWatch = { samples: [], shown: 'doom_first', seen: true, pending: { state: 'close', since: 100 } };
    expect(settleRace(w, 'doom_first', 110).watch.pending).toBeUndefined();
    expect(settleRace(w, 'mandate_first', 110).watch.pending).toEqual({ state: 'mandate_first', since: 110 });
  });

  it('a fall to hidden is a silent data gap, and the return from it is silent too', () => {
    const w: RaceWatch = { samples: [], shown: 'close', seen: true };
    const gap = settleRace(w, 'hidden', 200);
    expect(gap).toMatchObject({ turned: null });
    expect(gap.watch.shown).toBe('hidden');
    const back = settleRace(gap.watch, 'doom_first', 212);
    expect(back.turned).toBeNull();
    expect(back.watch.shown).toBe('doom_first');
  });

  it('keeps the debug override as it finds it', () => {
    const w: RaceWatch = { samples: [], shown: 'doom_first', seen: true, forced: 'mandate_first' };
    const r = settleRace(w, 'doom_first', 10);
    expect(r.watch.forced).toBe('mandate_first');
    expect(shownRaceState(r.watch)).toBe('mandate_first');
    expect(shownRaceState(undefined)).toBe('hidden');
  });
});

// ── Lever ────────────────────────────────────────────────────────────────────

function leverState(opts: { threaded?: string[]; first?: string; unlocked?: boolean; primaryShare?: number; secondaryShare?: number }) {
  const graph = new WorldGraph();
  graph.addNode({ id: 'asc', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
  for (const id of opts.threaded ?? []) {
    graph.addNode({ id, type: 'actor', name: `Mortal ${id}`, properties: {} });
    graph.addEdge({ id: `t_${id}`, source: 'asc', target: id, type: 'thread', properties: {} } as never);
  }
  const mandateDefinition = {
    id: 'm', name: 'M', runtimeKind: 'sphere_growth', primarySphere: 'order', secondarySphere: 'mind',
    primaryTargetDelta: 1, secondaryTargetDelta: 1,
  };
  return {
    graph,
    ascendantId: 'asc',
    tick: 0,
    mandateDefinition,
    mandateState: {
      mandateId: 'm', currentStage: 'setup', progress: 0, completed: false, failed: false,
      primaryDelta: opts.primaryShare ?? 0.5, secondaryDelta: opts.secondaryShare ?? 0.5,
    },
    unlockedActionIds: opts.unlocked ? [DOOM_STAY_TEMPLATE_ID] : [],
    controlEffects: [],
    unifiedActions: [],
  } as unknown as GameState;
}

describe('THR-2251 — raceLever', () => {
  it('never offers a lever while the Mandate lands first or the race is hidden', () => {
    const gs = leverState({ threaded: ['a'], unlocked: true });
    expect(raceLever('mandate_first', gs)).toBeNull();
    expect(raceLever('hidden', gs)).toBeNull();
  });

  it('names a chapter in the short Mandate sphere first', () => {
    const gs = leverState({ threaded: ['a'], unlocked: true, primaryShare: 0.6, secondaryShare: 0.2 });
    expect(raceLever('doom_first', gs)).toEqual({ kind: 'chapter', sphere: 'mind', mortalId: 'a' });
    const tie = leverState({ threaded: ['a'], primaryShare: 0.3, secondaryShare: 0.3 });
    expect(shortMandateSphere(tie)).toBe('order');
  });

  it('skips the dead and the avatar when naming the mortal', () => {
    const gs = leverState({ threaded: ['dead', 'av', 'b'] });
    gs.graph.getNode('dead')!.properties.deceased = true;
    gs.graph.addEdge({ id: 'av_of', source: 'av', target: 'asc', type: 'avatar_of', properties: {} } as never);
    expect(raceLeverMortalIds(gs)).toEqual(['b']);
  });

  it('falls back to Stay with no bound mortal, and offers nothing without the card', () => {
    expect(raceLever('stalled', leverState({ unlocked: true }))).toEqual({ kind: 'stay', held: false });
    expect(raceLever('close', leverState({}))).toBeNull();
  });
});

describe('THR-2251 — race content', () => {
  it('every sentence is fifteen words or fewer, with no numeral', () => {
    const lines = [
      ...Object.values(RACE_FORECAST_LINES),
      RACE_LEVER_STAY,
      raceChapterLeverLine('Order', 'Kael Thornweaver'),
    ];
    for (const l of lines) {
      expect(l.split(/\s+/).length).toBeLessThanOrEqual(15);
      expect(l).not.toMatch(/\d/);
    }
  });

  it('the lever fallbacks read without a raw token', () => {
    expect(raceChapterLeverLine('Order', 'Kael')).toBe("Spend Order essence on Kael's chapters to raise your Mandate.");
    expect(raceChapterLeverLine('Order', undefined)).toBe('Spend Order essence on the chapters of a mortal bound to you.');
    expect(raceChapterLeverLine(undefined, 'Kael')).toBe("Spend essence on Kael's chapters to raise your Mandate.");
    expect(raceForecastLine('hidden')).toBeNull();
    expect(raceForecastLine('nonsense')).toBeNull();
  });
});

// ── Phase wiring ─────────────────────────────────────────────────────────────

function makeAggregate(): SphereAggregate {
  const base = 100;
  return {
    totalBySphere: {
      force: base, matter: base, energy: base, life: base, mind: base, spirit: base,
      time: base, entropy: base, order: base, chaos: base, light: base, darkness: base,
    },
    dominantSphere: 'mind',
    entityCount: 12,
  };
}

function phaseState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'asc', type: 'actor', name: 'Ascendant', properties: { actorType: 'ascendant' } });
  const mandateDefinition = generateRememberedMandate({
    alignment: { primary: 'mind', secondary: 'spirit' },
    aggregate: makeAggregate(),
  });
  return {
    graph,
    ascendantId: 'asc',
    tick: 0,
    mandateDefinition,
    mandateState: createMandateStateWith(mandateDefinition.id, 0, {
      checkpointResults: [],
      counterOmensEarned: 0,
      doomSeverityPenalties: 0,
    }),
    tickEvents: [],
    pendingSpherePressures: [],
    unlockedActionIds: [],
    controlEffects: [],
    unifiedActions: [],
    doomClock: { ...createDoomClockState('breach', 1080), currentTick: 0, progress: 0, wokeAtTick: 0 },
    worldSoul: { aggregate: makeAggregate() },
  } as unknown as GameState;
}

describe('THR-2251 — phaseMandate reads the race', () => {
  beforeEach(() => resetMandateCounter());

  it('shows the first sight once as an alert and replaces "on pace" in the checkpoint line', () => {
    let state = phaseState();
    const raceAlerts: string[] = [];
    const checkpointLines: string[] = [];
    // Doom rises 0.01 a day from 0.20; the Mandate never rises (no god ledger credits).
    for (let day = 0; day < 20; day++) {
      const tick = MANDATE_BASELINE_SETTLE_TICK + day * DAY;
      const doomProgress = 0.2 + day * 0.01;
      const at = { ...state, tick, tickEvents: [], doomClock: { ...state.doomClock, progress: doomProgress } } as GameState;
      const out = phaseMandate(at);
      state = { ...at, ...out } as GameState;
      for (const e of state.tickEvents) {
        if (e.type !== 'mandate_progress') continue;
        if (/how the age ends/i.test(e.message)) raceAlerts.push(e.message);
        if (/ held\./.test(e.message)) checkpointLines.push(e.message);
      }
    }
    expect(raceAlerts).toHaveLength(1);
    expect(raceAlerts[0]).toMatch(/^Now you can see how the age ends\. /);
    expect(raceAlerts[0]).toContain(RACE_FORECAST_LINES.stalled);
    expect(state.mandateState?.raceWatch).toMatchObject({ shown: 'stalled', seen: true });
    for (const line of checkpointLines) expect(line).not.toContain('on pace');
    expect(raceReading(state).computed).toBe('stalled');
  });
});
