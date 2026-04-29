import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildPhasePlan,
  runRegisteredPhases,
  PHASE_SLOTS,
  type EnginePhase,
  type PhaseSlot,
} from '../phaseRegistry';
import type { GameState } from '../../types/gameState';
import { enableTracing, clearTraces, getTraces } from '../traceBuffer';

// Minimal GameState shim for unit tests — registry only touches `tick` and `tickEvents`.
function makeState(): GameState {
  return {
    tick: 0,
    tickEvents: [],
  } as unknown as GameState;
}

function makePhase(
  id: string,
  slot: PhaseSlot,
  opts: Partial<EnginePhase> = {},
): EnginePhase {
  return {
    id,
    slot,
    run: () => ({}),
    ...opts,
  };
}

describe('phaseRegistry — buildPhasePlan validation', () => {
  it('builds an empty plan for an empty registry', () => {
    const plan = buildPhasePlan([]);
    expect(plan.size).toBe(0);
    for (const slot of PHASE_SLOTS) {
      expect(plan.get(slot) ?? []).toEqual([]);
    }
  });

  it('places a single phase in its declared slot', () => {
    const a = makePhase('a', 'pre-doom');
    const plan = buildPhasePlan([a]);
    expect(plan.get('pre-doom')).toEqual([a]);
    expect(plan.get('post-doom')).toBeUndefined();
  });

  it('groups multiple phases into the same slot', () => {
    const a = makePhase('a', 'post-doom');
    const b = makePhase('b', 'post-doom');
    const c = makePhase('c', 'pre-lifecycle');
    const plan = buildPhasePlan([a, b, c]);
    expect(plan.get('post-doom')?.length).toBe(2);
    expect(plan.get('pre-lifecycle')?.length).toBe(1);
  });

  it('topologically sorts within a slot by afterPhase', () => {
    // a depends on b, c depends on a → b → a → c
    const a = makePhase('a', 'post-doom', { afterPhase: ['b'] });
    const b = makePhase('b', 'post-doom');
    const c = makePhase('c', 'post-doom', { afterPhase: ['a'] });
    const plan = buildPhasePlan([a, b, c]);
    const ids = (plan.get('post-doom') ?? []).map(p => p.id);
    expect(ids).toEqual(['b', 'a', 'c']);
  });

  it('topologically sorts within a slot by beforePhase', () => {
    // a must run before c → a -> c. independent b.
    const a = makePhase('a', 'post-doom', { beforePhase: ['c'] });
    const b = makePhase('b', 'post-doom');
    const c = makePhase('c', 'post-doom');
    const plan = buildPhasePlan([a, b, c]);
    const ids = (plan.get('post-doom') ?? []).map(p => p.id);
    // a -> c plus alphabetical tie-break for ready set.
    // initial ready = [a, b]; pick a; then ready = [b]; pick b; c becomes ready; pick c.
    expect(ids).toEqual(['a', 'b', 'c']);
  });

  it('uses alphabetical tie-break for independent phases (deterministic order)', () => {
    const z = makePhase('z', 'pre-doom');
    const a = makePhase('a', 'pre-doom');
    const m = makePhase('m', 'pre-doom');
    const plan = buildPhasePlan([z, a, m]);
    const ids = (plan.get('pre-doom') ?? []).map(p => p.id);
    expect(ids).toEqual(['a', 'm', 'z']);
  });

  it('throws on duplicate ids', () => {
    const a1 = makePhase('a', 'pre-doom');
    const a2 = makePhase('a', 'post-doom');
    expect(() => buildPhasePlan([a1, a2])).toThrow(/Duplicate phase id "a"/);
  });

  it('throws on unknown afterPhase reference', () => {
    const a = makePhase('a', 'pre-doom', { afterPhase: ['ghost'] });
    expect(() => buildPhasePlan([a])).toThrow(/unknown afterPhase "ghost"/);
  });

  it('throws on unknown beforePhase reference', () => {
    const a = makePhase('a', 'pre-doom', { beforePhase: ['ghost'] });
    expect(() => buildPhasePlan([a])).toThrow(/unknown beforePhase "ghost"/);
  });

  it('throws on cross-slot afterPhase reference', () => {
    const a = makePhase('a', 'pre-doom', { afterPhase: ['b'] });
    const b = makePhase('b', 'post-doom');
    expect(() => buildPhasePlan([a, b])).toThrow(/Cross-slot dependencies are not supported/);
  });

  it('throws on cross-slot beforePhase reference', () => {
    const a = makePhase('a', 'pre-doom', { beforePhase: ['b'] });
    const b = makePhase('b', 'post-doom');
    expect(() => buildPhasePlan([a, b])).toThrow(/Cross-slot dependencies are not supported/);
  });

  it('throws on a 2-cycle', () => {
    const a = makePhase('a', 'post-doom', { afterPhase: ['b'] });
    const b = makePhase('b', 'post-doom', { afterPhase: ['a'] });
    expect(() => buildPhasePlan([a, b])).toThrow(/Cycle detected in slot "post-doom"/);
  });

  it('throws on a 3-cycle', () => {
    const a = makePhase('a', 'post-doom', { afterPhase: ['c'] });
    const b = makePhase('b', 'post-doom', { afterPhase: ['a'] });
    const c = makePhase('c', 'post-doom', { afterPhase: ['b'] });
    expect(() => buildPhasePlan([a, b, c])).toThrow(/Cycle detected in slot "post-doom"/);
  });
});

describe('phaseRegistry — runRegisteredPhases runtime', () => {
  beforeEach(() => {
    enableTracing();
    clearTraces();
  });

  it('returns the input state unchanged for an empty plan (Land 1 ship state)', () => {
    const state = makeState();
    const plan = buildPhasePlan([]);
    const out = runRegisteredPhases(state, {}, 'pre-doom', plan);
    expect(out).toBe(state);
  });

  it('returns the input state unchanged when no phases match the slot', () => {
    const a = makePhase('a', 'post-doom');
    const plan = buildPhasePlan([a]);
    const state = makeState();
    const out = runRegisteredPhases(state, {}, 'pre-doom', plan);
    expect(out).toBe(state);
  });

  it('merges Partial<GameState> deltas in topo order', () => {
    const a = makePhase('a', 'pre-doom', {
      run: (s) => ({ tick: s.tick + 100 }),
    });
    const b = makePhase('b', 'pre-doom', {
      afterPhase: ['a'],
      run: (s) => ({ tick: s.tick * 2 }),
    });
    const plan = buildPhasePlan([a, b]);
    const state = makeState(); // tick = 0
    const out = runRegisteredPhases(state, {}, 'pre-doom', plan);
    // a runs: tick = 0 + 100 = 100
    // b runs: tick = 100 * 2 = 200
    expect(out.tick).toBe(200);
  });

  it('catches phase exceptions, emits tick_crash, and continues to next phase', () => {
    const exploder = makePhase('exploder', 'pre-doom', {
      run: () => { throw new Error('boom'); },
    });
    const survivor = makePhase('survivor', 'pre-doom', {
      afterPhase: ['exploder'],
      run: (s) => ({ tick: s.tick + 7 }),
    });
    const plan = buildPhasePlan([exploder, survivor]);
    const state = makeState();
    const out = runRegisteredPhases(state, {}, 'pre-doom', plan);
    expect(out.tick).toBe(7);
    const crashes = getTraces().filter(t => t.category === 'tick_crash');
    expect(crashes.length).toBe(1);
    expect(crashes[0].summary).toContain('exploder');
    expect(crashes[0].summary).toContain('boom');
  });

  it('emits a tick_phase_profile trace per registered phase that ran', () => {
    const a = makePhase('a', 'pre-doom', { run: () => ({}) });
    const b = makePhase('b', 'pre-doom', { run: () => ({}) });
    const plan = buildPhasePlan([a, b]);
    runRegisteredPhases(makeState(), {}, 'pre-doom', plan);
    const profiles = getTraces().filter(t => t.category === 'tick_phase_profile');
    expect(profiles.length).toBe(2);
    expect(new Set(profiles.map(p => (p as { phase?: string }).phase))).toEqual(new Set(['a', 'b']));
  });

  it('does not emit tick_phase_profile for a phase that crashed', () => {
    const exploder = makePhase('exploder', 'pre-doom', {
      run: () => { throw new Error('nope'); },
    });
    const plan = buildPhasePlan([exploder]);
    runRegisteredPhases(makeState(), {}, 'pre-doom', plan);
    const profiles = getTraces().filter(t => t.category === 'tick_phase_profile');
    expect(profiles.length).toBe(0);
    const crashes = getTraces().filter(t => t.category === 'tick_crash');
    expect(crashes.length).toBe(1);
  });
});
