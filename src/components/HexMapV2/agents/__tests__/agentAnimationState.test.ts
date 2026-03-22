/**
 * agentAnimationState.test.ts — Unit tests for agent bezier hop animation state machine.
 *
 * Tests cover:
 * - startMoveAnimation creates AgentAnimState with correct bezier and timing
 * - tickAgentAnimations advances sprite positions along bezier curve
 * - Animation completes and removes from map after duration elapses
 * - Settle phase (150ms) after main move phase
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { startMoveAnimation, tickAgentAnimations } from '../agentAnimationState';
import type { AgentAnimState } from '../agentAnimationState';
import { AGENT_MOVE_TRANSITION_MS } from '../../../../data/agent-visual-content';

// ── Mock Three.js ─────────────────────────────────────────────────────────────
// agentAnimationState.ts uses THREE.Sprite for position updates.
// We mock Three.js to avoid WebGL initialization in tests.
vi.mock('three', () => {
  class MockSprite {
    position = { x: 0, y: 0, z: 0, set: vi.fn(function(this: { x: number; y: number; z: number }, x: number, y: number, z: number) { this.x = x; this.y = y; this.z = z; }) };
    scale = { x: 1, y: 1, z: 1, set: vi.fn() };
  }
  return {
    Sprite: MockSprite,
  };
});

// ── Helpers ──────────────────────────────────────────────────────────────────

const SETTLE_DURATION_MS = 150;

function makeSprite() {
  const pos = { x: 0, y: 0, z: 0 };
  const posSet = vi.fn((x: number, y: number, z: number) => { pos.x = x; pos.y = y; pos.z = z; });
  return {
    position: Object.assign(pos, { set: posSet }),
    scale: { x: 1, y: 1, z: 1, set: vi.fn() },
  } as unknown as import('three').Sprite;
}

function makeSpriteMap(agentId: string) {
  const portrait = makeSprite();
  const dot = makeSprite();
  const continental = makeSprite();
  const map = new Map<string, { portrait: import('three').Sprite; dot: import('three').Sprite; continental?: import('three').Sprite }>();
  map.set(agentId, { portrait, dot, continental });
  return { map, portrait, dot, continental };
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
    // fromHex={col:0,row:0} → hexToPixel → (0,0)
    const state = startMoveAnimation('agent-1', { col: 0, row: 0 }, { col: 1, row: 0 }, 0);
    // p0.x should be near 0 (hex(0,0) x is 0 for flat-top hex)
    expect(state.bezier.p0.x).toBeCloseTo(0, 0);
  });

  it('p2 is derived from toHex world position (different from fromHex)', () => {
    const state = startMoveAnimation('agent-1', { col: 0, row: 0 }, { col: 3, row: 0 }, 0);
    // Moving 3 hexes right — p2.x should be significantly larger than p0.x
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
    const { map, portrait } = makeSpriteMap('agent-1');
    tickAgentAnimations(animStates, map);
    expect(portrait.position.set).not.toHaveBeenCalled();
  });

  it('updates sprite position during moving phase', () => {
    const state = startMoveAnimation('agent-1', { col: 0, row: 0 }, { col: 2, row: 0 }, 42);
    // Override startTime to now (so t=0 at start)
    state.startTime = now;

    const animStates = new Map<string, AgentAnimState>();
    animStates.set('agent-1', state);

    const { map, portrait, dot } = makeSpriteMap('agent-1');

    // Tick at t=0 (no time elapsed)
    tickAgentAnimations(animStates, map);
    expect(portrait.position.set).toHaveBeenCalled();
    expect(dot.position.set).toHaveBeenCalled();
  });

  it('advances position midway through animation', () => {
    const state = startMoveAnimation('agent-1', { col: 0, row: 0 }, { col: 4, row: 0 }, 0);
    state.startTime = now;

    const animStates = new Map<string, AgentAnimState>();
    animStates.set('agent-1', state);

    const { map, portrait } = makeSpriteMap('agent-1');

    // Advance to halfway
    performanceNowSpy.mockReturnValue(now + 400); // t = 0.5
    tickAgentAnimations(animStates, map);

    const callArgs = (portrait.position.set as ReturnType<typeof vi.fn>).mock.calls[0];
    // At t=0.5, position should be somewhere between p0 and p2
    expect(callArgs[0]).toBeGreaterThan(state.bezier.p0.x);
    expect(callArgs[0]).toBeLessThan(state.bezier.p2.x);
  });

  it('transitions to settling phase after full move duration', () => {
    const state = startMoveAnimation('agent-1', { col: 0, row: 0 }, { col: 2, row: 0 }, 42);
    state.startTime = now;

    const animStates = new Map<string, AgentAnimState>();
    animStates.set('agent-1', state);

    const { map } = makeSpriteMap('agent-1');

    // Advance past full duration
    performanceNowSpy.mockReturnValue(now + 900); // t > 1
    tickAgentAnimations(animStates, map);

    expect(animStates.get('agent-1')?.phase).toBe('settling');
  });

  it('removes animation from map after settle phase completes', () => {
    const state = startMoveAnimation('agent-1', { col: 0, row: 0 }, { col: 2, row: 0 }, 42);
    state.startTime = now;
    state.phase = 'settling';
    // settleStart must be set — set it to 'now'
    (state as AgentAnimState & { settleStart?: number }).settleStart = now;

    const animStates = new Map<string, AgentAnimState>();
    animStates.set('agent-1', state);

    const { map } = makeSpriteMap('agent-1');

    // Advance past settle duration
    performanceNowSpy.mockReturnValue(now + 200); // past 150ms settle
    tickAgentAnimations(animStates, map);

    expect(animStates.has('agent-1')).toBe(false);
  });

  it('silently skips agents not in spriteMap (NFP #4)', () => {
    const state = startMoveAnimation('ghost-agent', { col: 0, row: 0 }, { col: 1, row: 0 }, 0);
    state.startTime = now;

    const animStates = new Map<string, AgentAnimState>();
    animStates.set('ghost-agent', state);

    // Empty sprite map — agent not found
    const emptyMap = new Map<string, { portrait: import('three').Sprite; dot: import('three').Sprite; continental?: import('three').Sprite }>();

    // Should not throw
    expect(() => tickAgentAnimations(animStates, emptyMap)).not.toThrow();
  });

  it('applies scale bounce during settling phase', () => {
    const state = startMoveAnimation('agent-1', { col: 0, row: 0 }, { col: 2, row: 0 }, 42);
    state.startTime = now - 900; // Move phase done
    state.phase = 'settling';
    (state as AgentAnimState & { settleStart?: number }).settleStart = now;

    const animStates = new Map<string, AgentAnimState>();
    animStates.set('agent-1', state);

    const { map, portrait } = makeSpriteMap('agent-1');

    // Tick during settle — should call scale.set with >1.0 (bounce)
    performanceNowSpy.mockReturnValue(now + 50); // 50ms into 150ms settle
    tickAgentAnimations(animStates, map);

    expect(portrait.scale.set).toHaveBeenCalled();
    const scaleArgs = (portrait.scale.set as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(scaleArgs[0]).toBeGreaterThan(1.0); // bounce scale
  });
});
