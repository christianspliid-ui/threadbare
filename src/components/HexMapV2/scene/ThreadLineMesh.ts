/**
 * ThreadLineMesh.ts — Three.js scene module for avatar-to-agent thread line rendering.
 *
 * Draws lines from the avatar's hex to each threaded agent's hex.
 * Lines are coloured by court position and pulse based on attention state.
 *
 * NFP #1 (tunability): All colours, opacities, and animation parameters are named constants.
 * NFP #2 (inspectability): ThreadLineData exposes all data needed to trace why a line appears.
 * NFP #3 (determinism): No PRNG — all animation driven by monotonic elapsed time.
 * NFP #4 (fail-soft): rebuild() with empty array silently clears the group. Missing court
 *   positions fall back to `watched` colour rather than crashing.
 * NFP #7 (performance): Materials are cloned per-line for independent opacity; all geometries
 *   and materials are disposed on rebuild/dispose — no leaked GPU resources.
 */

import * as THREE from 'three';
import { RENDER_ORDER, LAYER_Z } from './RenderLayers';

// ── Constants ─────────────────────────────────────────────────────────────────

/**
 * Hex color strings per court position.
 * NFP #1: Change a value here to retune thread appearance without touching logic.
 */
export const THREAD_COLORS: Record<string, string> = {
  the_first: '#d4a040',  // accent gold — protagonist
  retinue:   '#8b9dc3',  // soft blue-grey — inner circle
  watched:   '#5a6a7a',  // dim grey — distant
  dormant:   '#3a3a3a',  // near-invisible — slackened
};

/** Fallback colour when courtPosition is unrecognised. */
const THREAD_COLOR_FALLBACK = THREAD_COLORS['watched'];

/** Base opacity for thread lines when attention is fully focused (attentionRatio = 1.0). */
export const THREAD_BASE_OPACITY = 0.6;

/** Minimum opacity floor — lines never go fully invisible. */
export const THREAD_MIN_OPACITY = 0.15;

/** Line width passed to LineBasicMaterial. Note: most WebGL implementations clamp to 1px. */
export const THREAD_LINE_WIDTH = 1;

/**
 * Period in seconds for the gentle sine pulse applied to the_first thread.
 * NFP #1: Lower = faster pulse, higher = slower.
 */
export const THREAD_PULSE_PERIOD_S = 3.0;

/** ±Amplitude added/subtracted from base opacity during the_first pulse. */
export const THREAD_PULSE_AMPLITUDE = 0.15;

/** Opacity multiplier applied to dormant threads on top of attention scaling. */
const DORMANT_OPACITY_MULTIPLIER = 0.3;

/** Period in seconds for the fast vibrate applied to tugged lines. */
const TUG_VIBRATE_PERIOD_S = 0.5;

/** Amplitude of the tug vibrate pulse. */
const TUG_VIBRATE_AMPLITUDE = 0.3;

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * All data needed to render a single thread line between the avatar and one agent.
 */
export interface ThreadLineData {
  /** The agent this thread is connected to. */
  agentId: string;
  /** Court position key — maps to THREAD_COLORS. */
  courtPosition: string;
  /** Avatar world-space X position (line start). */
  fromX: number;
  /** Avatar world-space Y position (line start). */
  fromY: number;
  /** Agent world-space X position (line end). */
  toX: number;
  /** Agent world-space Y position (line end). */
  toY: number;
}

/**
 * Public interface for the ThreadLineMesh layer returned by createThreadLineMesh().
 */
export interface ThreadLineLayer {
  /** THREE.Group containing all thread lines. Add this to the scene. */
  group: THREE.Group;
  /**
   * Rebuild all thread lines from fresh data.
   * Disposes existing lines, creates new ones. Safe to call every frame if needed,
   * though prefer calling only when thread data changes (NFP #7).
   */
  rebuild(threads: ThreadLineData[]): void;
  /**
   * Per-frame update — drives opacity, pulse, and vibrate animations.
   * @param elapsedS      Monotonic elapsed time in seconds (e.g. from THREE.Clock).
   * @param attentionRatio Attention level 0.0–1.0 (1.0 = focused, lower = depleted).
   */
  tick(elapsedS: number, attentionRatio: number): void;
  /**
   * Mark a set of agents whose threads are currently being tugged.
   * Tugged lines get a fast vibrate overlay distinct from the gentle pulse.
   */
  setActiveTugs(tugAgentIds: Set<string>): void;
  /** Dispose all GPU resources. Call when removing the layer from the scene. */
  dispose(): void;
}

// ── Internal record ───────────────────────────────────────────────────────────

interface ThreadLineRecord {
  agentId: string;
  courtPosition: string;
  line: THREE.Line;
  material: THREE.LineBasicMaterial;
  baseOpacity: number;
}

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Creates a ThreadLineMesh layer.
 *
 * The returned group uses RENDER_ORDER.THREADS (9.5) and LAYER_Z.THREADS (5.500),
 * positioning thread lines below agent sprites but above location markers.
 *
 * @returns ThreadLineLayer ready to be added to the scene.
 */
export function createThreadLineMesh(): ThreadLineLayer {
  const group = new THREE.Group();
  group.renderOrder = RENDER_ORDER.THREADS;

  let records: ThreadLineRecord[] = [];
  let activeTugs: Set<string> = new Set();

  // ── dispose helpers ────────────────────────────────────────────────────────

  function disposeRecord(r: ThreadLineRecord): void {
    group.remove(r.line);
    r.line.geometry.dispose();
    r.material.dispose();
  }

  function disposeAll(): void {
    for (const r of records) {
      disposeRecord(r);
    }
    records = [];
  }

  // ── rebuild ────────────────────────────────────────────────────────────────

  function rebuild(threads: ThreadLineData[]): void {
    disposeAll();

    for (const t of threads) {
      const colorHex = THREAD_COLORS[t.courtPosition] ?? THREAD_COLOR_FALLBACK;

      const points = [
        new THREE.Vector3(t.fromX, t.fromY, LAYER_Z.THREADS),
        new THREE.Vector3(t.toX,   t.toY,   LAYER_Z.THREADS),
      ];

      const geometry = new THREE.BufferGeometry().setFromPoints(points);

      // Clone material per line so each can have its opacity updated independently.
      const material = new THREE.LineBasicMaterial({
        color:       colorHex,
        transparent: true,
        opacity:     THREAD_BASE_OPACITY,
        linewidth:   THREAD_LINE_WIDTH,
        depthWrite:  false,
      });

      const line = new THREE.Line(geometry, material);
      line.renderOrder = RENDER_ORDER.THREADS;
      group.add(line);

      records.push({
        agentId:       t.agentId,
        courtPosition: t.courtPosition,
        line,
        material,
        baseOpacity: THREAD_BASE_OPACITY,
      });
    }
  }

  // ── tick ───────────────────────────────────────────────────────────────────

  function tick(elapsedS: number, attentionRatio: number): void {
    // Clamp attentionRatio to [0, 1].
    const ratio = Math.max(0, Math.min(1, attentionRatio));

    for (const r of records) {
      let opacity = r.baseOpacity;

      // the_first: gentle sine pulse.
      if (r.courtPosition === 'the_first') {
        const pulse =
          Math.sin((elapsedS / THREAD_PULSE_PERIOD_S) * Math.PI * 2) *
          THREAD_PULSE_AMPLITUDE;
        opacity += pulse;
      }

      // dormant: multiply down further.
      if (r.courtPosition === 'dormant') {
        opacity *= DORMANT_OPACITY_MULTIPLIER;
      }

      // Tugged lines: fast vibrate overlay.
      if (activeTugs.has(r.agentId)) {
        const vibrate =
          Math.sin((elapsedS / TUG_VIBRATE_PERIOD_S) * Math.PI * 2) *
          TUG_VIBRATE_AMPLITUDE;
        opacity += vibrate;
      }

      // Scale by attentionRatio, then clamp to [THREAD_MIN_OPACITY, 1].
      opacity = opacity * ratio;
      opacity = Math.max(THREAD_MIN_OPACITY, Math.min(1, opacity));

      r.material.opacity = opacity;
    }
  }

  // ── setActiveTugs ──────────────────────────────────────────────────────────

  function setActiveTugs(tugAgentIds: Set<string>): void {
    activeTugs = tugAgentIds;
  }

  // ── dispose ────────────────────────────────────────────────────────────────

  function dispose(): void {
    disposeAll();
  }

  return { group, rebuild, tick, setActiveTugs, dispose };
}
