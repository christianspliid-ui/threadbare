/**
 * AgentSpriteMesh.test.ts — Unit tests for the single-sprite-per-agent scene module.
 *
 * Verifies: createAgentSpriteMesh returns a single group with one sprite per agent,
 * RING layout for multiple agents, zoom visibility material/scale swapping,
 * and portrait loading.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { RENDER_ORDER } from '../RenderLayers';
import type { AgentRenderData } from '../../agents/agentSpriteTypes';

// ── Mocks ─────────────────────────────────────────────────────────────────────

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

  it('returns an AgentSpriteGroup with a single group', () => {
    const result = createAgentSpriteMesh([]);
    expect(result).toBeDefined();
    expect(result.group).toBeInstanceOf(THREE.Group);
  });

  it('group.renderOrder equals RENDER_ORDER.AGENTS (9)', () => {
    const result = createAgentSpriteMesh([]);
    expect(result.group.renderOrder).toBe(RENDER_ORDER.AGENTS);
    expect(result.group.renderOrder).toBe(9);
  });

  it('returns empty group for empty agents array', () => {
    const result = createAgentSpriteMesh([]);
    expect(result.group.children.length).toBe(0);
    expect(result.spriteMap.size).toBe(0);
  });

  it('creates exactly one sprite per agent', () => {
    const agents = [makeAgent('agent-1', 5, 3), makeAgent('agent-2', 7, 4)];
    const result = createAgentSpriteMesh(agents);
    expect(result.group.children.length).toBe(2);
    expect(result.spriteMap.size).toBe(2);
  });

  it('spriteMap entry has sprite, materials, and scales', () => {
    const agents = [makeAgent('agent-1', 5, 3)];
    const result = createAgentSpriteMesh(agents);
    const entry = result.spriteMap.get('agent-1')!;
    expect(entry.sprite).toBeInstanceOf(THREE.Sprite);
    expect(entry.materials.portrait).toBeDefined();
    expect(entry.materials.dot).toBeDefined();
    expect(entry.scales.portrait).toBe(9); // AGENT_PORTRAIT_RADIUS (4.5) × 2
    expect(entry.scales.dot).toBe(3);      // AGENT_TOKEN_RADIUS (1.5) × 2
  });

  it('stores baseScale in sprite.userData', () => {
    const agents = [makeAgent('agent-1', 5, 3)];
    const result = createAgentSpriteMesh(agents);
    const entry = result.spriteMap.get('agent-1')!;
    // Starts with portrait scale
    expect(entry.sprite.userData.baseScale).toBe(9);
  });

  it('multiple agents on same hex get different positions', () => {
    const agents = [
      makeAgent('agent-1', 5, 3),
      makeAgent('agent-2', 5, 3),
      makeAgent('agent-3', 5, 3),
    ];
    const result = createAgentSpriteMesh(agents);

    const positions = Array.from(result.spriteMap.values()).map(e => ({
      x: e.sprite.position.x,
      y: e.sprite.position.y,
    }));

    const unique = new Set(positions.map(p => `${p.x.toFixed(4)},${p.y.toFixed(4)}`));
    expect(unique.size).toBe(3);
  });

  it('creates continental material for retinue agents', () => {
    const agents = [makeAgent('retinue-1', 5, 3, 0, true)];
    const result = createAgentSpriteMesh(agents);
    const entry = result.spriteMap.get('retinue-1')!;
    expect(entry.materials.continental).toBeDefined();
    expect(entry.scales.continental).toBe(5); // AGENT_DOT_RADIUS (2.5) × 2
    expect(entry.isRetinue).toBe(true);
  });

  it('does not create continental material for non-retinue agents', () => {
    const agents = [makeAgent('regular-1', 5, 3, 0, false)];
    const result = createAgentSpriteMesh(agents);
    const entry = result.spriteMap.get('regular-1')!;
    expect(entry.materials.continental).toBeUndefined();
    expect(entry.scales.continental).toBeUndefined();
    expect(entry.isRetinue).toBe(false);
  });

  it('dispose function exists and can be called', () => {
    const agents = [makeAgent('agent-1', 5, 3)];
    const result = createAgentSpriteMesh(agents);
    expect(typeof result.dispose).toBe('function');
    expect(() => result.dispose()).not.toThrow();
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

  it('hero-local tier: portrait material and scale', () => {
    const result = createAgentSpriteMesh([makeAgent('a', 0, 0)]);
    updateZoomVisibility(result, 'hero-local');
    const entry = result.spriteMap.get('a')!;
    expect(entry.sprite.material).toBe(entry.materials.portrait);
    expect(entry.sprite.visible).toBe(true);
    expect(entry.sprite.userData.baseScale).toBe(entry.scales.portrait);
  });

  it('regional tier: dot material and scale', () => {
    const result = createAgentSpriteMesh([makeAgent('a', 0, 0)]);
    updateZoomVisibility(result, 'regional');
    const entry = result.spriteMap.get('a')!;
    expect(entry.sprite.material).toBe(entry.materials.dot);
    expect(entry.sprite.visible).toBe(true);
    expect(entry.sprite.userData.baseScale).toBe(entry.scales.dot);
  });

  it('continental tier: all agents get dot material (agents_dot=true takes precedence)', () => {
    const result = createAgentSpriteMesh([
      makeAgent('regular', 0, 0, 0, false),
      makeAgent('retinue', 1, 0, 0, true),
    ]);
    updateZoomVisibility(result, 'continental');
    // agents_dot=true at continental, so dot material takes precedence for all agents
    const regular = result.spriteMap.get('regular')!;
    expect(regular.sprite.material).toBe(regular.materials.dot);
    expect(regular.sprite.visible).toBe(true);
    const retinue = result.spriteMap.get('retinue')!;
    expect(retinue.sprite.material).toBe(retinue.materials.dot);
    expect(retinue.sprite.visible).toBe(true);
  });

  it('full-world tier: sprite hidden', () => {
    const result = createAgentSpriteMesh([makeAgent('a', 0, 0)]);
    updateZoomVisibility(result, 'full-world');
    const entry = result.spriteMap.get('a')!;
    expect(entry.sprite.visible).toBe(false);
  });

  it('updates baseScale on zoom swap for settle bounce', () => {
    const result = createAgentSpriteMesh([makeAgent('a', 0, 0)]);
    updateZoomVisibility(result, 'hero-local');
    const entry = result.spriteMap.get('a')!;
    expect(entry.sprite.userData.baseScale).toBe(entry.scales.portrait);

    updateZoomVisibility(result, 'regional');
    expect(entry.sprite.userData.baseScale).toBe(entry.scales.dot);
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
    const result = createAgentSpriteMesh(agents);
    await expect(loadAgentPortraits(result, agents)).resolves.toBeUndefined();
  });
});
