/**
 * AgentSpriteMesh.test.ts — Unit tests for the agent sprite scene module.
 *
 * Verifies: createAgentSpriteMesh returns correct groups, render orders,
 * RING layout for multiple agents, zoom visibility toggling.
 *
 * Mocks document.createElement (canvas) and THREE.CanvasTexture so tests
 * run in jsdom without a full WebGL context.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { RENDER_ORDER } from '../RenderLayers';
import type { AgentRenderData } from '../../agents/agentSpriteTypes';

// ── Mocks ─────────────────────────────────────────────────────────────────────

// Mock Image for portrait loading
vi.stubGlobal('Image', class {
  crossOrigin = '';
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  private _src = '';

  get src() { return this._src; }
  set src(val: string) {
    this._src = val;
    Promise.resolve().then(() => { if (this.onerror) this.onerror(); });
  }
});

// Mock canvas
vi.stubGlobal('document', {
  createElement: (tag: string) => {
    if (tag === 'canvas') {
      return {
        width: 0,
        height: 0,
        getContext: () => ({
          save: vi.fn(),
          restore: vi.fn(),
          scale: vi.fn(),
          fill: vi.fn(),
          fillStyle: '',
          globalAlpha: 1,
          beginPath: vi.fn(),
          arc: vi.fn(),
          clip: vi.fn(),
          closePath: vi.fn(),
          drawImage: vi.fn(),
          stroke: vi.fn(),
          strokeStyle: '',
          lineWidth: 0,
        }),
      };
    }
    return null;
  },
});

// Mock THREE.CanvasTexture to avoid GPU operations
vi.mock('three', async () => {
  const actual = await vi.importActual<typeof THREE>('three');
  class CanvasTextureMock {
    needsUpdate = false;
    isTexture = true;
    uuid = Math.random().toString();
    constructor(_canvas: unknown) {}
    dispose() {}
  }
  return {
    ...actual,
    CanvasTexture: CanvasTextureMock,
  };
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeAgent(id: string, hexCol: number, hexRow: number, factionIndex = 0, isRetinue = false): AgentRenderData {
  return { id, hexCol, hexRow, factionIndex, isRetinue };
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('createAgentSpriteMesh', () => {
  let createAgentSpriteMesh: typeof import('../AgentSpriteMesh').createAgentSpriteMesh;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('../AgentSpriteMesh');
    createAgentSpriteMesh = mod.createAgentSpriteMesh;
  });

  it('returns an AgentSpriteGroup with portraitGroup and dotGroup', () => {
    const group = createAgentSpriteMesh([]);
    expect(group).toBeDefined();
    expect(group.portraitGroup).toBeInstanceOf(THREE.Group);
    expect(group.dotGroup).toBeInstanceOf(THREE.Group);
  });

  it('returns a continentalGroup', () => {
    const group = createAgentSpriteMesh([]);
    expect(group.continentalGroup).toBeInstanceOf(THREE.Group);
  });

  it('portraitGroup.renderOrder equals RENDER_ORDER.AGENTS (9)', () => {
    const group = createAgentSpriteMesh([]);
    expect(group.portraitGroup.renderOrder).toBe(RENDER_ORDER.AGENTS);
    expect(group.portraitGroup.renderOrder).toBe(9);
  });

  it('dotGroup.renderOrder equals RENDER_ORDER.AGENTS (9)', () => {
    const group = createAgentSpriteMesh([]);
    expect(group.dotGroup.renderOrder).toBe(RENDER_ORDER.AGENTS);
  });

  it('continentalGroup.renderOrder equals RENDER_ORDER.AGENTS (9)', () => {
    const group = createAgentSpriteMesh([]);
    expect(group.continentalGroup.renderOrder).toBe(RENDER_ORDER.AGENTS);
  });

  it('returns empty groups for empty agents array', () => {
    const group = createAgentSpriteMesh([]);
    expect(group.portraitGroup.children.length).toBe(0);
    expect(group.dotGroup.children.length).toBe(0);
  });

  it('creates portrait and dot sprites for a single agent', () => {
    const agents = [makeAgent('agent-1', 5, 3)];
    const group = createAgentSpriteMesh(agents);
    expect(group.portraitGroup.children.length).toBe(1);
    expect(group.dotGroup.children.length).toBe(1);
  });

  it('spriteMap has an entry for each agent', () => {
    const agents = [
      makeAgent('agent-1', 5, 3),
      makeAgent('agent-2', 7, 4),
    ];
    const group = createAgentSpriteMesh(agents);
    expect(group.spriteMap.has('agent-1')).toBe(true);
    expect(group.spriteMap.has('agent-2')).toBe(true);
  });

  it('multiple agents on same hex get different RING positions', () => {
    const agents = [
      makeAgent('agent-1', 5, 3),
      makeAgent('agent-2', 5, 3), // same hex
      makeAgent('agent-3', 5, 3), // same hex
    ];
    const group = createAgentSpriteMesh(agents);

    const positions = Array.from(group.spriteMap.values()).map(s => ({
      x: s.dot.position.x,
      y: s.dot.position.y,
    }));

    // All 3 should have different positions
    const unique = new Set(positions.map(p => `${p.x.toFixed(4)},${p.y.toFixed(4)}`));
    expect(unique.size).toBe(3);
  });

  it('creates continental sprite for retinue agents', () => {
    const agents = [makeAgent('retinue-1', 5, 3, 0, true)];
    const group = createAgentSpriteMesh(agents);
    const entry = group.spriteMap.get('retinue-1');
    expect(entry?.continental).toBeDefined();
    expect(group.continentalGroup.children.length).toBe(1);
  });

  it('does not create continental sprite for non-retinue agents', () => {
    const agents = [makeAgent('regular-1', 5, 3, 0, false)];
    const group = createAgentSpriteMesh(agents);
    const entry = group.spriteMap.get('regular-1');
    expect(entry?.continental).toBeUndefined();
    expect(group.continentalGroup.children.length).toBe(0);
  });

  it('dispose function exists and can be called', () => {
    const agents = [makeAgent('agent-1', 5, 3)];
    const group = createAgentSpriteMesh(agents);
    expect(typeof group.dispose).toBe('function');
    expect(() => group.dispose()).not.toThrow();
  });
});

describe('updateZoomVisibility', () => {
  let createAgentSpriteMesh: typeof import('../AgentSpriteMesh').createAgentSpriteMesh;
  let updateZoomVisibility: typeof import('../AgentSpriteMesh').updateZoomVisibility;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('../AgentSpriteMesh');
    createAgentSpriteMesh = mod.createAgentSpriteMesh;
    updateZoomVisibility = mod.updateZoomVisibility;
  });

  it('at zoom >= 5 (zoomed in): only dotGroup is visible', () => {
    const group = createAgentSpriteMesh([makeAgent('a', 0, 0)]);
    updateZoomVisibility(group, 5);
    expect(group.portraitGroup.visible).toBe(false);
    expect(group.dotGroup.visible).toBe(true);
    expect(group.continentalGroup.visible).toBe(false);
  });

  it('at zoom 10 (max zoom): only dotGroup is visible', () => {
    const group = createAgentSpriteMesh([makeAgent('a', 0, 0)]);
    updateZoomVisibility(group, 10);
    expect(group.portraitGroup.visible).toBe(false);
    expect(group.dotGroup.visible).toBe(true);
    expect(group.continentalGroup.visible).toBe(false);
  });

  it('at zoom 4.9 (zoomed out): only portraitGroup is visible', () => {
    const group = createAgentSpriteMesh([makeAgent('a', 0, 0)]);
    updateZoomVisibility(group, 4.9);
    expect(group.portraitGroup.visible).toBe(true);
    expect(group.dotGroup.visible).toBe(false);
    expect(group.continentalGroup.visible).toBe(false);
  });

  it('at zoom 1.5 (continental boundary): only portraitGroup is visible', () => {
    const group = createAgentSpriteMesh([makeAgent('a', 0, 0)]);
    updateZoomVisibility(group, 1.5);
    expect(group.portraitGroup.visible).toBe(true);
    expect(group.dotGroup.visible).toBe(false);
    expect(group.continentalGroup.visible).toBe(false);
  });

  it('at zoom < 1.5 (full-world): all groups hidden', () => {
    const group = createAgentSpriteMesh([makeAgent('a', 0, 0)]);
    updateZoomVisibility(group, 1.0);
    expect(group.portraitGroup.visible).toBe(false);
    expect(group.dotGroup.visible).toBe(false);
    expect(group.continentalGroup.visible).toBe(false);
  });
});

describe('loadAgentPortraits', () => {
  let createAgentSpriteMesh: typeof import('../AgentSpriteMesh').createAgentSpriteMesh;
  let loadAgentPortraits: typeof import('../AgentSpriteMesh').loadAgentPortraits;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('../AgentSpriteMesh');
    createAgentSpriteMesh = mod.createAgentSpriteMesh;
    loadAgentPortraits = mod.loadAgentPortraits;
  });

  it('is async and resolves without throwing (fail-soft on load errors)', async () => {
    const agents: AgentRenderData[] = [
      { id: 'a1', hexCol: 0, hexRow: 0, factionIndex: 0, isRetinue: false, portraitUrl: '/portraits/hero.png' },
    ];
    const group = createAgentSpriteMesh(agents);
    await expect(loadAgentPortraits(group, agents)).resolves.toBeUndefined();
  });
});
