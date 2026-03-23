import * as THREE from 'three';

/**
 * WebGL diagnostics for HexMapV2 — captures renderer stats, context events,
 * and errors for display in the debug panel.
 *
 * NFP #2 (Inspectability): Provides runtime observability into the Three.js
 * render pipeline without requiring browser DevTools.
 *
 * NFP #4 (Fail-soft): Context loss is caught and reported, not thrown.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface WebGLLogEntry {
  timestamp: number;
  level: 'info' | 'warn' | 'error';
  source: string;
  message: string;
}

export interface WebGLRenderStats {
  fps: number;
  frameTimeMs: number;
  drawCalls: number;
  triangles: number;
  points: number;
  lines: number;
  textures: number;
  geometries: number;
  programs: number;
}

export interface WebGLContextInfo {
  renderer: string;
  vendor: string;
  maxTextureSize: number;
  maxTextures: number;
  maxAttributes: number;
  maxVaryings: number;
  contextLost: boolean;
  contextRestoreCount: number;
}

export interface WebGLDiagnosticsSnapshot {
  stats: WebGLRenderStats;
  context: WebGLContextInfo;
  log: readonly WebGLLogEntry[];
  sceneObjects: number;
}

// ── Constants ────────────────────────────────────────────────────────────────

const DIAGNOSTICS_CONSTANTS = {
  /** Max log entries kept in memory */
  MAX_LOG_ENTRIES: 200,
  /** How many recent frames to average for FPS */
  FPS_SAMPLE_WINDOW: 60,
} as const;

// ── Diagnostics class ────────────────────────────────────────────────────────

export class WebGLDiagnostics {
  private log: WebGLLogEntry[] = [];
  private frameTimes: number[] = [];
  private lastFrameTime = 0;
  private contextLost = false;
  private contextRestoreCount = 0;
  private contextInfo: WebGLContextInfo | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private onContextLost: ((e: Event) => void) | null = null;
  private onContextRestored: ((e: Event) => void) | null = null;

  /**
   * Attach to a canvas and renderer. Call once after createHexScene.
   */
  attach(canvas: HTMLCanvasElement, renderer: THREE.WebGLRenderer): void {
    this.canvas = canvas;
    this.captureContextInfo(renderer);

    this.onContextLost = (e: Event) => {
      e.preventDefault(); // Allow context restoration
      this.contextLost = true;
      this.addLog('error', 'WebGL', 'WebGL context lost');
    };

    this.onContextRestored = () => {
      this.contextLost = false;
      this.contextRestoreCount++;
      this.addLog('warn', 'WebGL', `WebGL context restored (restore #${this.contextRestoreCount})`);
      this.captureContextInfo(renderer);
    };

    canvas.addEventListener('webglcontextlost', this.onContextLost);
    canvas.addEventListener('webglcontextrestored', this.onContextRestored);

    this.addLog('info', 'init', `Renderer attached — ${this.contextInfo?.renderer ?? 'unknown GPU'}`);
  }

  /**
   * Call at the start of every render loop frame.
   * Captures frame timing for FPS calculation.
   */
  recordFrame(): void {
    const now = performance.now();
    if (this.lastFrameTime > 0) {
      this.frameTimes.push(now - this.lastFrameTime);
      if (this.frameTimes.length > DIAGNOSTICS_CONSTANTS.FPS_SAMPLE_WINDOW) {
        this.frameTimes.shift();
      }
    }
    this.lastFrameTime = now;
  }

  /**
   * Log an event. Oldest entries are evicted when the buffer is full.
   */
  addLog(level: WebGLLogEntry['level'], source: string, message: string): void {
    this.log.push({ timestamp: Date.now(), level, source, message });
    if (this.log.length > DIAGNOSTICS_CONSTANTS.MAX_LOG_ENTRIES) {
      this.log.shift();
    }
  }

  /**
   * Take a snapshot of current diagnostics state.
   * Call from a React interval or on-demand from the debug panel.
   */
  snapshot(renderer: THREE.WebGLRenderer, scene: THREE.Scene): WebGLDiagnosticsSnapshot {
    const info = renderer.info;
    const avgFrameTime = this.frameTimes.length > 0
      ? this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length
      : 0;

    return {
      stats: {
        fps: avgFrameTime > 0 ? Math.round(1000 / avgFrameTime) : 0,
        frameTimeMs: Math.round(avgFrameTime * 100) / 100,
        drawCalls: info.render.calls,
        triangles: info.render.triangles,
        points: info.render.points,
        lines: info.render.lines,
        textures: info.memory.textures,
        geometries: info.memory.geometries,
        programs: info.programs?.length ?? 0,
      },
      context: this.contextInfo ?? {
        renderer: 'unknown',
        vendor: 'unknown',
        maxTextureSize: 0,
        maxTextures: 0,
        maxAttributes: 0,
        maxVaryings: 0,
        contextLost: this.contextLost,
        contextRestoreCount: this.contextRestoreCount,
      },
      log: this.log,
      sceneObjects: countSceneObjects(scene),
    };
  }

  /**
   * Detach event listeners. Call on component unmount.
   */
  dispose(): void {
    if (this.canvas && this.onContextLost) {
      this.canvas.removeEventListener('webglcontextlost', this.onContextLost);
    }
    if (this.canvas && this.onContextRestored) {
      this.canvas.removeEventListener('webglcontextrestored', this.onContextRestored);
    }
    this.canvas = null;
    this.log = [];
    this.frameTimes = [];
  }

  private captureContextInfo(renderer: THREE.WebGLRenderer): void {
    const gl = renderer.getContext();
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');

    this.contextInfo = {
      renderer: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : 'unknown',
      vendor: dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : 'unknown',
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxTextures: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
      maxAttributes: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
      maxVaryings: gl.getParameter(gl.MAX_VARYING_VECTORS),
      contextLost: this.contextLost,
      contextRestoreCount: this.contextRestoreCount,
    };
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function countSceneObjects(scene: THREE.Scene): number {
  let count = 0;
  scene.traverse(() => { count++; });
  return count;
}
