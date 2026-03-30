/**
 * agentAnimationState.test.ts — Unit tests for agent bezier hop animation state machine.
 *
 * Tests cover:
 * - startMoveAnimation creates AgentAnimState with correct bezier and timing
 * - tickAgentAnimations advances targets via AgentAnimationTarget interface
 * - Animation completes and removes from map after duration elapses
 * - Settle phase (150ms) after main move phase
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { startMoveAnimation, tickAgentAnimations } from '../agentAnimationState';
import type { AgentAnimState } from '../agentAnimationState';
import type { AgentAnimationTarget } from '../agentSpriteTarget';
import { AGENT_MOVE_TRANSITION_MS } from '../../../../data/agent-visual-content';

// ── Helpers ──────────────────────────────────────────────────────────────────

const SETTLE_DURATION_MS = 150;

/** Create a mock AgentAnimationTarget that tracks calls for assertion. */
function makeTarget(): { target: AgentAnimationTarget; calls: { position: [number, number, number][]; scaleMultiplier: number[]; resetCount: number } } {
  const calls = { position: [] as [number, number, number][], scaleMultiplier: [] as number[], resetCount: 0 };
  const target: AgentAnimationTarget = {
    setPosition(x, y, z) { calls.position.push([x, y, z]); },
    setScaleMultiplier(m) { calls.scaleMultiplier.push(m); },
    resetScale() { calls.resetCount++; },
  };
  return { target, calls };
}

function makeTargetMap(agentId: string) {
  const { target, calls } = makeTarget();
  const map = new Map<string, AgentAnimationTarget>();
  map.set(agentId, target);
  return { map, calls };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('startMoveAnimation', () => {
  it('creates AgentAnimState with phase="moving"', () => {
    const state = startMoveAnimation('agent-1', { col: 0, row: 0 }, { col: 1, row: 0 }, 42);
    expect(state.phase).toBe('moving');
  });

  it('sets agentId correctly', () => {
    const state = startMoveAnimation('agent-42', { col: 0, row: 0 }, { col: 0, row: 1 }, 1);
    expect(state.agentId).toBe('agent-42');
  });

  it('uses AGENT_MOVE_TRANSITION_MS as duration', () => {
    const state = startMoveAnimation('agent-1', { col: 0, row: 0 }, { col: 2, row: 0 }, 0);
    expect(state.duration).toBe(AGENT_MOVE_TRANSITION_MS);
    expect(state.duration).toBe(800);
  });

  it('uses 150ms as settleDuration', () => {
    const state = startMoveAnimation('agent-1', { col: 0, row: 0 }, { col: 2, row: 0 }, 0);
    expect(state.settleDuration).toBe(SETTLE_DURATION_MS);
  });

  it('creates a valid bezier with p0, ctrl, p2', () => {
    const state = startMoveAnimation('agent-1', { col: 0, row: 0 }, { col: 1, row: 1 }, 99);
    expect(state.bezier).toBeDefined();
    expect(state.bezier.p0).toBeDefined();
    expect(state.bezier.ctrl).toBeDefined();
    expect(state.bezier.p2).toBeDefined();
  });

  it('stores fromHex and toHex', () => {
    const state = startMoveAnimation('agent-1', { col: 3, row: 2 }, { col: 4, row: 2 }, 1);
    expect(state.fromHex).toEqual({ col: 3, row: 2 });
    expect(state.toHex).toEqual({ col: 4, row: 2 });
  });

  it('sets startTime close to performance.now()', () => {
    const before = performance.now();
    const state = startMoveAnimation('agent-1', { col: 0, row: 0 }, { col: 1, row: 0 }, 0);
    const after = performance.now();
    expect(state.startTime).toBeGreaterThanOrEqual(before);
    expect(state.startTime).toBeLessThanOrEqual(after);
  });

  it('p0 is derived from fromHex world position', () => {
    const state = startMoveAnimation('agent-1', { col: 0, row: 0 }, { col: 1, row: 0 }, 0);
    expect(state.bezier.p0.x).toBeCloseTo(0, 0);
  });

  it('p2 is derived from toHex world position (different from fromHex)', () => {
    const state = startMoveAnimation('agent-1', { col: 0, row: 0 }, { col: 3, row: 0 }, 0);
    expect(state.bezier.p2.x).toBeGreaterThan(state.bezier.p0.x);
  });
});

describe('tickAgentAnimations', () => {
  let performanceNowSpy: ReturnType<typeof vi.spyOn>;
  let now = 1000;

  beforeEach(() => {
    now = 1000;
    performanceNowSpy = vi.spyOn(performance, 'now').mockReturnValue(now);
  });

  afterEach(() => {
    performanceNowSpy.mockRestore();
  });

  it('does nothing if animStates is empty', () => {
    const animStates = new Map<string, AgentAnimState>();
    const { map, calls } = makeTargetMap('agent-1');
    tickAgentAnimations(animStates, map);
    expect(calls.position.length).toBe(0);
  });

  it('calls setPosition during moving phase', () => {
    const state = startMoveAnimation('agent-1', { col: 0, row: 0 }, { col: 2, row: 0 }, 42);
    state.startTime = now;

    const animStates = new Map<string, AgentAnimState>();
    animStates.set('agent-1', state);

    const { map, calls } = makeTargetMap('agent-1');

    tickAgentAnimations(animStates, map);
    expect(calls.position.length).toBeGreaterThan(0);
  });

  it('advances position midway through animation', () => {
    const state = startMoveAnimation('agent-1', { col: 0, row: 0 }, { col: 4, row: 0 }, 0);
    state.startTime = now;

    const animStates = new Map<string, AgentAnimState>();
    animStates.set('agent-1', state);

    const { map, calls } = makeTargetMap('agent-1');

    performanceNowSpy.mockReturnValue(now + 400);
    tickAgentAnimations(animStates, map);

    const [x] = calls.position[0];
    expect(x).toBeGreaterThan(state.bezier.p0.x);
    expect(x).toBeLessThan(state.bezier.p2.x);
  });

  it('transitions to settling phase after full move duration', () => {
    const state = startMoveAnimation('agent-1', { col: 0, row: 0 }, { col: 2, row: 0 }, 42);
    state.startTime = now;

    const animStates = new Map<string, AgentAnimState>();
    animStates.set('agent-1', state);

    const { map } = makeTargetMap('agent-1');

    performanceNowSpy.mockReturnValue(now + 900);
    tickAgentAnimations(animStates, map);

    expect(animStates.get('agent-1')?.phase).toBe('settling');
  });

  it('removes animation from map after settle phase completes', () => {
    const state = startMoveAnimation('agent-1', { col: 0, row: 0 }, { col: 2, row: 0 }, 42);
    state.startTime = now;
    state.phase = 'settling';
    (state as AgentAnimState & { settleStart?: number }).settleStart = now;

    const animStates = new Map<string, AgentAnimState>();
    animStates.set('agent-1', state);

    const { map } = makeTargetMap('agent-1');

    performanceNowSpy.mockReturnValue(now + 200);
    tickAgentAnimations(animStates, map);

    expect(animStates.has('agent-1')).toBe(false);
  });

  it('silently skips agents not in targetMap (NFP #4)', () => {
    const state = startMoveAnimation('ghost-agent', { col: 0, row: 0 }, { col: 1, row: 0 }, 0);
    state.startTime = now;

    const animStates = new Map<string, AgentAnimState>();
    animStates.set('ghost-agent', state);

    const emptyMap = new Map<string, AgentAnimationTarget>();

    expect(() => tickAgentAnimations(animStates, emptyMap)).not.toThrow();
  });

  it('calls setScaleMultiplier during settling phase', () => {
    const state = startMoveAnimation('agent-1', { col: 0, row: 0 }, { col: 2, row: 0 }, 42);
    state.startTime = now - 900;
    state.phase = 'settling';
    (state as AgentAnimState & { settleStart?: number }).settleStart = now;

    const animStates = new Map<string, AgentAnimState>();
    animStates.set('agent-1', state);

    const { map, calls } = makeTargetMap('agent-1');

    performanceNowSpy.mockReturnValue(now + 50);
    tickAgentAnimations(animStates, map);

    // Should have called setScaleMultiplier with a bounce value > 1.0
    expect(calls.scaleMultiplier.length).toBeGreaterThan(0);
    expect(calls.scaleMultiplier[0]).toBeGreaterThan(1.0);
  });

  it('calls resetScale when settle completes', () => {
    const state = startMoveAnimation('agent-1', { col: 0, row: 0 }, { col: 2, row: 0 }, 42);
    state.startTime = now - 900;
    state.phase = 'settling';
    (state as AgentAnimState & { settleStart?: number }).settleStart = now;

    const animStates = new Map<string, AgentAnimState>();
    animStates.set('agent-1', state);

    const { map, calls } = makeTargetMap('agent-1');

    performanceNowSpy.mockReturnValue(now + 200); // past settle duration
    tickAgentAnimations(animStates, map);

    expect(calls.resetCount).toBe(1);
    expect(animStates.has('agent-1')).toBe(false);
  });
});
