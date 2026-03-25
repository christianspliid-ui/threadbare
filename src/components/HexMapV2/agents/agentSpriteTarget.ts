/**
 * agentSpriteTarget.ts — Animation target interface for agent sprites.
 *
 * Decouples the animation system from Three.js sprite internals. The animation
 * module calls setPosition/setScaleMultiplier — it never touches .position or
 * .scale directly. This makes the settle-scale bug class impossible: the animation
 * system literally cannot set an absolute scale.
 *
 * Adding a new sprite tier (e.g., activity indicators) requires zero changes to
 * the animation module — only AgentSpriteMesh needs to update createAnimationTarget.
 *
 * NFP #4: Missing baseScale defaults to 1.0 via ?? operator in the implementation.
 */

import type * as THREE from 'three';

/**
 * Animation target interface — what the animation system can do to a renderable agent.
 * Abstracts over the concrete sprite structure (portrait, dot, continental, or any future tier).
 */
export interface AgentAnimationTarget {
  /** Move all representations to a world position. */
  setPosition(x: number, y: number, z: number): void;
  /** Apply a scale multiplier relative to base size (1.0 = normal). */
  setScaleMultiplier(multiplier: number): void;
  /** Reset scale to base size. Equivalent to setScaleMultiplier(1.0). */
  resetScale(): void;
}

/**
 * Create an AgentAnimationTarget that wraps a single Three.js sprite.
 * Reads baseScale from sprite.userData.baseScale (set at creation time).
 *
 * @param sprite - The Three.js sprite to wrap
 */
export function createAnimationTarget(sprite: THREE.Sprite): AgentAnimationTarget {
  return {
    setPosition(x: number, y: number, z: number) {
      sprite.position.set(x, y, z);
    },
    setScaleMultiplier(m: number) {
      const base = (sprite.userData.baseScale as number) ?? 1;
      sprite.scale.set(base * m, base * m, 1);
    },
    resetScale() {
      const base = (sprite.userData.baseScale as number) ?? 1;
      sprite.scale.set(base, base, 1);
    },
  };
}
