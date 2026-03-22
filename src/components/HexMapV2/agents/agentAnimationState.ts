/**
 * agentAnimationState.ts — Three.js agent bezier hop animation state machine.
 *
 * Manages per-agent animation state for smooth bezier movement between hexes.
 * Integrates into the Three.js render loop via tickAgentAnimations — no external tween library.
 *
 * Animation lifecycle:
 *   1. 'moving'   — 800ms bezier hop from old hex to new hex
 *   2. 'settling' — 150ms bounce scale 1.05 → 1.0 on arrival
 *   3. removed   — cleaned up from animStates map
 *
 * NFP #1 (tunability): All timing values come from named constants.
 * NFP #2 (inspectability): AgentAnimState carries fromHex/toHex for trace logging.
 * NFP #3 (determinism): Bezier computed via getSegmentBezier — same seed = same curve.
 * NFP #4 (fail-soft): Missing sprite silently skipped — never crashes render loop.
 */

import * as THREE from 'three';
import { getSegmentBezier, evalBezierAtArcLength } from '../../../lib/movementPath';
import type { SegmentBezier } from '../../../lib/movementPath';
import { AGENT_MOVE_TRANSITION_MS } from '../../../data/agent-visual-content';
import { AGENT_SPRITE_Z } from './agentSpriteTypes';
import { HEX_CONSTANTS } from '../scene/HexFillMesh';
import { hexToPixel } from '../../../lib/hexMath';

// ── Constants ────────────────────────────────────────────────────────────────

/** Duration of the settle bounce after the agent arrives at a new hex (ms). */
export const SETTLE_DURATION_MS = 150;

/** Peak scale multiplier at the start of the settle bounce (then lerps back to 1.0). */
const SETTLE_BOUNCE_SCALE = 1.05;

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Per-agent animation state for bezier hop movement.
 * One entry per actively animating agent. Removed from the map on completion.
 */
export interface AgentAnimState {
  /** Agent node ID — matches key in AgentSpriteGroup.spriteMap */
  agentId: string;
  /** Precomputed bezier from start to destination world positions */
  bezier: SegmentBezier;
  /** performance.now() when animation started */
  startTime: number;
  /** Main move phase duration (ms) — AGENT_MOVE_TRANSITION_MS */
  duration: number;
  /** Settle bounce duration (ms) — SETTLE_DURATION_MS */
  settleDuration: number;
  /** Current animation phase */
  phase: 'moving' | 'settling' | 'idle';
  /** performance.now() when settle phase started — set on transition */
  settleStart?: number;
  /** Source hex for trace logging */
  fromHex: { col: number; row: number };
  /** Destination hex for trace logging */
  toHex: { col: number; row: number };
}

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Creates a new AgentAnimState for a hex-to-hex move.
 *
 * Converts fromHex/toHex to world positions (hexToPixel + Y-flip),
 * computes the wobbled bezier via getSegmentBezier, and returns a
 * state ready to hand to tickAgentAnimations.
 *
 * @param agentId — agent node ID (deterministic wobble seed)
 * @param fromHex — source hex coordinate
 * @param toHex   — destination hex coordinate
 * @param seed    — additional numeric seed (e.g., tick number) for extra variation
 * @returns new AgentAnimState with phase='moving'
 */
export function startMoveAnimation(
  agentId: string,
  fromHex: { col: number; row: number },
  toHex: { col: number; row: number },
  seed: number,
): AgentAnimState {
  const fromCenter = hexToPixel(fromHex, HEX_CONSTANTS.HEX_SIZE);
  const toCenter   = hexToPixel(toHex,   HEX_CONSTANTS.HEX_SIZE);

  // Y-flip: SVG y-down → Three.js y-up
  const p0 = { x: fromCenter.x, y: -fromCenter.y };
  const p2 = { x: toCenter.x,   y: -toCenter.y   };

  // Build bezier using agentId as the deterministic seed source.
  // getSegmentBezier accepts HexCoord-shaped objects — supply fromHex/toHex
  // directly so the wobble is unique per agent + route (NFP #3).
  const bezier = getSegmentBezier(
    agentId,
    fromHex,
    toHex,
    HEX_CONSTANTS.HEX_SIZE,
  );

  // Override p0/p2 with Y-flipped world positions (getSegmentBezier uses hexToPixel
  // internally without Y-flip, so we swap them to match Three.js world space).
  bezier.p0 = p0;
  bezier.p2 = p2;

  return {
    agentId,
    bezier,
    startTime: performance.now(),
    duration: AGENT_MOVE_TRANSITION_MS,
    settleDuration: SETTLE_DURATION_MS,
    phase: 'moving',
    fromHex,
    toHex,
  };
}

// ── Tick function ─────────────────────────────────────────────────────────────

/**
 * Advances all active agent animations by one frame.
 *
 * Called once per frame from the Three.js render loop (before renderer.render()).
 * Mutates sprite positions and scales in place. Removes completed animations.
 *
 * @param animStates — mutable map of agentId → active animation state
 * @param spriteMap  — agent sprite references from AgentSpriteGroup
 */
export function tickAgentAnimations(
  animStates: Map<string, AgentAnimState>,
  spriteMap: Map<string, { portrait: THREE.Sprite; dot: THREE.Sprite; continental?: THREE.Sprite }>,
): void {
  if (animStates.size === 0) return;

  const now = performance.now();
  const toRemove: string[] = [];

  for (const [agentId, state] of animStates) {
    const sprites = spriteMap.get(agentId);
    if (!sprites) {
      // NFP #4: agent not in spriteMap — skip silently
      continue;
    }

    if (state.phase === 'moving') {
      const t = Math.min(1, (now - state.startTime) / state.duration);
      const pos = evalBezierAtArcLength(state.bezier.p0, state.bezier.ctrl, state.bezier.p2, t);

      sprites.portrait.position.set(pos.x, pos.y, AGENT_SPRITE_Z);
      sprites.dot.position.set(pos.x, pos.y, AGENT_SPRITE_Z);
      if (sprites.continental) {
        sprites.continental.position.set(pos.x, pos.y, AGENT_SPRITE_Z);
      }

      if (t >= 1) {
        // Transition to settle phase
        state.phase = 'settling';
        state.settleStart = now;
      }
    } else if (state.phase === 'settling') {
      const settleStart = state.settleStart ?? now;
      const t = Math.min(1, (now - settleStart) / state.settleDuration);

      // Bounce: scale from SETTLE_BOUNCE_SCALE down to 1.0
      const scale = SETTLE_BOUNCE_SCALE + (1.0 - SETTLE_BOUNCE_SCALE) * t;

      sprites.portrait.scale.set(scale, scale, 1);
      sprites.dot.scale.set(scale, scale, 1);
      if (sprites.continental) {
        sprites.continental.scale.set(scale, scale, 1);
      }

      if (t >= 1) {
        // Ensure final scale is exactly 1.0
        sprites.portrait.scale.set(1, 1, 1);
        sprites.dot.scale.set(1, 1, 1);
        if (sprites.continental) {
          sprites.continental.scale.set(1, 1, 1);
        }
        toRemove.push(agentId);
      }
    }
  }

  // Remove completed animations
  for (const agentId of toRemove) {
    animStates.delete(agentId);
  }
}
