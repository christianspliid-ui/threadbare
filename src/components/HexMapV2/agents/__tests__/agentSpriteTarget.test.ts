/**
 * agentSpriteTarget.test.ts — Contract test for AgentAnimationTarget.
 *
 * Verifies that createAnimationTarget wrapping a Three.js sprite correctly
 * delegates position/scale operations and that the animation system can
 * never set an absolute scale (the bug class this abstraction eliminates).
 */

import { describe, it, expect, vi } from 'vitest';
import type { AgentAnimationTarget } from '../agentSpriteTarget';
import { createAnimationTarget } from '../agentSpriteTarget';

// Mock Three.js Sprite
function mockSprite(baseScale: number) {
  const position = { x: 0, y: 0, z: 0, set: vi.fn((x: number, y: number, z: number) => { position.x = x; position.y = y; position.z = z; }) };
  const scale = { x: baseScale, y: baseScale, z: 1, set: vi.fn((x: number, y: number, z: number) => { scale.x = x; scale.y = y; scale.z = z; }) };
  return {
    position,
    scale,
    userData: { baseScale } as Record<string, unknown>,
    material: {},
  } as unknown as import('three').Sprite;
}

describe('createAnimationTarget', () => {
  it('setPosition delegates to sprite.position.set', () => {
    const sprite = mockSprite(9);
    const target = createAnimationTarget(sprite);

    target.setPosition(10, -20, 0.5);

    expect(sprite.position.set).toHaveBeenCalledWith(10, -20, 0.5);
  });

  it('setScaleMultiplier applies multiplier relative to baseScale', () => {
    const sprite = mockSprite(9);
    const target = createAnimationTarget(sprite);

    target.setScaleMultiplier(1.05);

    expect(sprite.scale.set).toHaveBeenCalledWith(9 * 1.05, 9 * 1.05, 1);
  });

  it('setScaleMultiplier(1.0) restores exact baseScale', () => {
    const sprite = mockSprite(9);
    const target = createAnimationTarget(sprite);

    target.setScaleMultiplier(1.0);

    expect(sprite.scale.set).toHaveBeenCalledWith(9, 9, 1);
  });

  it('resetScale restores baseScale', () => {
    const sprite = mockSprite(3);
    const target = createAnimationTarget(sprite);

    target.resetScale();

    expect(sprite.scale.set).toHaveBeenCalledWith(3, 3, 1);
  });

  it('defaults to baseScale=1 when userData.baseScale is missing', () => {
    const sprite = mockSprite(1);
    sprite.userData = {}; // no baseScale

    const target = createAnimationTarget(sprite);
    target.setScaleMultiplier(1.05);

    expect(sprite.scale.set).toHaveBeenCalledWith(1.05, 1.05, 1);
  });

  it('full hop + settle cycle preserves sprite base scale', () => {
    const sprite = mockSprite(9);
    const target = createAnimationTarget(sprite);

    // Simulate hop: position changes, no scale change
    target.setPosition(10, -5, 0.5);
    target.setPosition(20, -10, 0.5);

    // Simulate settle bounce
    target.setScaleMultiplier(1.05);
    target.setScaleMultiplier(1.03);
    target.setScaleMultiplier(1.0);
    target.resetScale();

    // Final scale should be exactly baseScale
    const lastCall = (sprite.scale.set as ReturnType<typeof vi.fn>).mock.calls.at(-1)!;
    expect(lastCall[0]).toBe(9);
    expect(lastCall[1]).toBe(9);
  });
});
