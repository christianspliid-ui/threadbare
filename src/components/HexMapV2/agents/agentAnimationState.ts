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

import { getSegmentBezier, evalBezierAtArcLength } from '../../../lib/movementPath';
import type { AgentAnimationTarget } from './agentSpriteTarget';
import type { SegmentBezier, Point } from '../../../lib/movementPath';
import { AGENT_MOVE_TRANSITION_MS, ROAD_MAJOR_HOP_MS, ROAD_TRAIL_HOP_MS, ROAD_WOBBLE_FACTOR } from '../../../data/agent-visual-content';
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
 * Per-agent animation state for bezier hop movement or ring-slot settle tween.
 * One entry per actively animating agent. Removed from the map on completion.
 */
export interface AgentAnimState {
  /** Agent node ID — matches key in AgentSpriteGroup.spriteMap */
  agentId: string;
  /** Precomputed bezier from start to destination world positions (used in 'moving' phase) */
  bezier: SegmentBezier;
  /** performance.now() when animation started */
  startTime: number;
  /** Main move phase duration (ms) — AGENT_MOVE_TRANSITION_MS */
  duration: number;
  /** Settle bounce duration (ms) — SETTLE_DURATION_MS */
  settleDuration: number;
  /** Current animation phase */
  phase: 'moving' | 'settling' | 'ring-settle' | 'idle';
  /** performance.now() when settle phase started — set on transition */
  settleStart?: number;
  /** Source hex for trace logging */
  fromHex: { col: number; row: number };
  /** Destination hex for trace logging */
  toHex: { col: number; row: number };
  /** For ring-settle: start world position */
  ringSettleFrom?: { x: number; y: number };
  /** For ring-settle: end world position */
  ringSettleTo?: { x: number; y: number };
  /** If set, this is a road hop — affects wobble and chaining behavior */
  roadContext?: {
    roadType: 'major' | 'trail';
    /** true → play settle bounce after this hop (final hex of road segment) */
    isLastHop: boolean;
  };
}

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Creates a new AgentAnimState for a hex-to-hex move.
 *
 * Converts fromHex/toHex to world positions (hexToPixel + Y-flip + ring offsets),
 * computes the wobbled bezier via getSegmentBezier, and returns a
 * state ready to hand to tickAgentAnimations.
 *
 * Ring offsets allow the bezier to animate from the agent's ring slot position
 * in the source hex to its ring slot position in the destination hex, matching
 * V1 AgentDots behavior where agents hop from slot to slot.
 *
 * @param agentId    — agent node ID (deterministic wobble seed)
 * @param fromHex    — source hex coordinate
 * @param toHex      — destination hex coordinate
 * @param seed       — additional numeric seed (e.g., tick number) for extra variation
 * @param fromOffset — optional ring slot offset in SVG units at the source hex
 * @param toOffset   — optional ring slot offset in SVG units at the destination hex
 * @returns new AgentAnimState with phase='moving'
 */
export function startMoveAnimation(
  agentId: string,
  fromHex: { col: number; row: number },
  toHex: { col: number; row: number },
  seed: number,
  fromOffset?: Point,
  toOffset?: Point,
): AgentAnimState {
  // getSegmentBezier computes the full bezier in SVG space (y-down) with ring offsets.
  const svgBezier = getSegmentBezier(
    agentId,
    fromHex,
    toHex,
    HEX_CONSTANTS.HEX_SIZE,
    fromOffset,
    toOffset,
  );

  // Y-flip all three bezier points from SVG space (y-down) to Three.js space (y-up).
  const bezier: SegmentBezier = {
    p0:   { x: svgBezier.p0.x,   y: -svgBezier.p0.y },
    ctrl: { x: svgBezier.ctrl.x, y: -svgBezier.ctrl.y },
    p2:   { x: svgBezier.p2.x,   y: -svgBezier.p2.y },
  };

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

/**
 * Creates a new AgentAnimState for a road hop (shorter, reduced wobble, chaining).
 *
 * Road hops use shorter durations (300ms major / 500ms trail) and reduced wobble
 * (ROAD_WOBBLE_FACTOR × standard). Settle bounce only plays on the final hop
 * of a road segment (isLastHop = true).
 *
 * @param agentId    — agent node ID
 * @param fromHex    — source hex coordinate
 * @param toHex      — destination hex coordinate
 * @param seed       — numeric seed for wobble
 * @param roadType   — 'major' or 'trail' (determines hop duration)
 * @param isLastHop  — if true, play settle bounce after this hop
 * @param fromOffset — optional ring slot offset at source hex
 * @param toOffset   — optional ring slot offset at destination hex
 * @returns new AgentAnimState with phase='moving' and roadContext set
 */
export function startRoadHopAnimation(
  agentId: string,
  fromHex: { col: number; row: number },
  toHex: { col: number; row: number },
  seed: number,
  roadType: 'major' | 'trail',
  isLastHop: boolean,
  fromOffset?: Point,
  toOffset?: Point,
): AgentAnimState {
  const svgBezier = getSegmentBezier(
    agentId,
    fromHex,
    toHex,
    HEX_CONSTANTS.HEX_SIZE,
    fromOffset,
    toOffset,
    ROAD_WOBBLE_FACTOR,
  );

  const bezier: SegmentBezier = {
    p0:   { x: svgBezier.p0.x,   y: -svgBezier.p0.y },
    ctrl: { x: svgBezier.ctrl.x, y: -svgBezier.ctrl.y },
    p2:   { x: svgBezier.p2.x,   y: -svgBezier.p2.y },
  };

  const duration = roadType === 'major' ? ROAD_MAJOR_HOP_MS : ROAD_TRAIL_HOP_MS;

  return {
    agentId,
    bezier,
    startTime: performance.now(),
    duration,
    settleDuration: SETTLE_DURATION_MS,
    phase: 'moving',
    fromHex,
    toHex,
    roadContext: { roadType, isLastHop },
  };
}

/**
 * Creates an AgentAnimState for a same-hex ring slot rearrangement (settle tween).
 *
 * When agents enter or leave a hex, the remaining agents' ring slot positions change.
 * This creates a short linear tween from the old position to the new one, matching
 * V1 AgentDots settle behavior (150ms).
 *
 * @param agentId — agent node ID
 * @param fromWorld — current world position {x, y} of the sprite
 * @param toWorld   — target world position {x, y} after ring rearrangement
 * @returns new AgentAnimState with phase='ring-settle'
 */
export function startSettleAnimation(
  agentId: string,
  fromWorld: { x: number; y: number },
  toWorld: { x: number; y: number },
): AgentAnimState {
  return {
    agentId,
    // Bezier unused for ring-settle — set to degenerate line
    bezier: { p0: fromWorld, ctrl: fromWorld, p2: toWorld },
    startTime: performance.now(),
    duration: SETTLE_DURATION_MS,
    settleDuration: SETTLE_DURATION_MS,
    phase: 'ring-settle',
    fromHex: { col: 0, row: 0 },
    toHex: { col: 0, row: 0 },
    ringSettleFrom: fromWorld,
    ringSettleTo: toWorld,
  };
}

// ── Tick function ─────────────────────────────────────────────────────────────

/**
 * Advances all active agent animations by one frame.
 *
 * Called once per frame from the Three.js render loop (before renderer.render()).
 * Operates on AgentAnimationTarget interface — never touches sprites directly.
 * Removes completed animations.
 *
 * @param animStates — mutable map of agentId → active animation state
 * @param targetMap  — agent animation targets from AgentSpriteGroup
 */
export function tickAgentAnimations(
  animStates: Map<string, AgentAnimState>,
  targetMap: Map<string, AgentAnimationTarget>,
): void {
  if (animStates.size === 0) return;

  const now = performance.now();
  const toRemove: string[] = [];

  for (const [agentId, state] of animStates) {
    const target = targetMap.get(agentId);
    if (!target) {
      // NFP #4: agent not in targetMap — skip silently
      continue;
    }

    if (state.phase === 'moving') {
      const t = Math.min(1, (now - state.startTime) / state.duration);
      const pos = evalBezierAtArcLength(state.bezier.p0, state.bezier.ctrl, state.bezier.p2, t);

      target.setPosition(pos.x, pos.y, AGENT_SPRITE_Z);

      if (t >= 1) {
        if (state.roadContext && !state.roadContext.isLastHop) {
          toRemove.push(agentId);
        } else {
          state.phase = 'settling';
          state.settleStart = now;
        }
      }
    } else if (state.phase === 'settling') {
      const settleStart = state.settleStart ?? now;
      const t = Math.min(1, (now - settleStart) / state.settleDuration);

      const bounceMultiplier = SETTLE_BOUNCE_SCALE + (1.0 - SETTLE_BOUNCE_SCALE) * t;
      target.setScaleMultiplier(bounceMultiplier);

      if (t >= 1) {
        target.resetScale();
        toRemove.push(agentId);
      }
    } else if (state.phase === 'ring-settle') {
      const from = state.ringSettleFrom;
      const to = state.ringSettleTo;
      if (!from || !to) {
        toRemove.push(agentId);
        continue;
      }

      const t = Math.min(1, (now - state.startTime) / state.duration);
      const px = from.x + (to.x - from.x) * t;
      const py = from.y + (to.y - from.y) * t;

      target.setPosition(px, py, AGENT_SPRITE_Z);

      if (t >= 1) {
        toRemove.push(agentId);
      }
    }
  }

  for (const agentId of toRemove) {
    animStates.delete(agentId);
  }
}
