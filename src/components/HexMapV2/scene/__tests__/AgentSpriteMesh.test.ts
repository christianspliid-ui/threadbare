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

function makeAvatarAgent(id: string, hexCol: number, hexRow: number, sphereColor = '#ff6b6b'): AgentRenderData {
  return { id, hexCol, hexRow, factionIndex: 0, isRetinue: false, isAvatar: true, avatarSphereColor: sphereColor };
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

  it('group.renderOrder equals RENDER_ORDER.AGENTS (10)', () => {
    const result = createAgentSpriteMesh([]);
    expect(result.group.renderOrder).toBe(RENDER_ORDER.AGENTS);
    expect(result.group.renderOrder).toBe(10);
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

  it('spriteMap entry has sprite, materials and its MAP_MARKERS kind', () => {
    const agents = [makeAgent('agent-1', 5, 3)];
    const result = createAgentSpriteMesh(agents);
    const entry = result.spriteMap.get('agent-1')!;
    expect(entry.sprite).toBeInstanceOf(THREE.Sprite);
    expect(entry.materials.portrait).toBeDefined();
    expect(entry.materials.dot).toBeDefined();
    expect(entry.materials.pip).toBeDefined();
    expect(entry.kind).toBe('agent');
  });

  it('stores baseScale in sprite.userData (the close-up px at the hero-local reference zoom)', () => {
    const agents = [makeAgent('agent-1', 5, 3)];
    const result = createAgentSpriteMesh(agents);
    const entry = result.spriteMap.get('agent-1')!;
    // 48 px portrait / k 20
    expect(entry.sprite.userData.baseScale).toBeCloseTo(48 / 20, 6);
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

  it('a threaded mortal is the threadedAgent kind; the avatar is the avatar kind', () => {
    const result = createAgentSpriteMesh([
      { ...makeAgent('threaded-1', 5, 3, 0, true), isThreaded: true },
      makeAvatarAgent('avatar-1', 6, 3),
      makeAgent('group-1', 7, 3),
    ]);
    expect(result.spriteMap.get('threaded-1')!.kind).toBe('threadedAgent');
    expect(result.spriteMap.get('avatar-1')!.kind).toBe('avatar');
    expect(result.spriteMap.get('group-1')!.kind).toBe('agent');
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

  it('hero-local tier: portrait material', () => {
    const result = createAgentSpriteMesh([makeAgent('a', 0, 0)]);
    updateZoomVisibility(result, 'hero-local', 20);
    const entry = result.spriteMap.get('a')!;
    expect(entry.sprite.material).toBe(entry.materials.portrait);
    expect(entry.sprite.visible).toBe(true);
  });

  it('regional tier: an unthreaded mortal is a faction dot', () => {
    const result = createAgentSpriteMesh([makeAgent('a', 0, 0)]);
    updateZoomVisibility(result, 'regional', 10);
    const entry = result.spriteMap.get('a')!;
    expect(entry.sprite.material).toBe(entry.materials.dot);
    expect(entry.sprite.visible).toBe(true);
  });

  it('regional and continental: a threaded mortal is a medallion (its portrait material)', () => {
    const result = createAgentSpriteMesh([{ ...makeAgent('t', 0, 0, 0, true), isThreaded: true }]);
    const entry = result.spriteMap.get('t')!;
    updateZoomVisibility(result, 'regional', 10);
    expect(entry.sprite.material).toBe(entry.materials.portrait);
    updateZoomVisibility(result, 'continental', 3);
    expect(entry.sprite.material).toBe(entry.materials.portrait);
  });

  it('full-world tier: an unthreaded mortal is hidden; a threaded one is a gold pip', () => {
    const result = createAgentSpriteMesh([
      makeAgent('a', 0, 0),
      { ...makeAgent('t', 1, 0, 0, true), isThreaded: true },
    ]);
    updateZoomVisibility(result, 'full-world', 1);
    expect(result.spriteMap.get('a')!.sprite.visible).toBe(false);
    const t = result.spriteMap.get('t')!;
    expect(t.sprite.visible).toBe(true);
    expect(t.sprite.material).toBe(t.materials.pip);
  });

  it('updates baseScale on zoom swap for settle bounce', () => {
    const result = createAgentSpriteMesh([makeAgent('a', 0, 0)]);
    updateZoomVisibility(result, 'hero-local', 20);
    const entry = result.spriteMap.get('a')!;
    expect(entry.sprite.userData.baseScale).toBeCloseTo(48 / 20, 6);

    updateZoomVisibility(result, 'regional', 10);
    expect(entry.sprite.userData.baseScale).toBeCloseTo(14 / 10, 6);
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

describe('avatar visual treatment', () => {
  let createAgentSpriteMesh: typeof import('../AgentSpriteMesh').createAgentSpriteMesh;
  let updateZoomVisibility: typeof import('../AgentSpriteMesh').updateZoomVisibility;
  let tickAvatarPulse: typeof import('../AgentSpriteMesh').tickAvatarPulse;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('../AgentSpriteMesh');
    createAgentSpriteMesh = mod.createAgentSpriteMesh;
    updateZoomVisibility = mod.updateZoomVisibility;
    tickAvatarPulse = mod.tickAvatarPulse;
  });

  it('the avatar keeps its 82 px close-up (MAP_MARKERS avatar row)', () => {
    const agents = [makeAvatarAgent('avatar-1', 5, 3)];
    const result = createAgentSpriteMesh(agents);
    updateZoomVisibility(result, 'hero-local', 20);
    const entry = result.spriteMap.get('avatar-1')!;
    expect(entry.sprite.scale.x * 20).toBeCloseTo(82, 6);
    expect(entry.isAvatar).toBe(true);
  });

  it('avatar sprite gets z-bump above normal agents', () => {
    const normal = [makeAgent('normal-1', 5, 3)];
    const avatar = [makeAvatarAgent('avatar-1', 5, 3)];
    const normalResult = createAgentSpriteMesh(normal);
    const avatarResult = createAgentSpriteMesh(avatar);
    const normalZ = normalResult.spriteMap.get('normal-1')!.sprite.position.z;
    const avatarZ = avatarResult.spriteMap.get('avatar-1')!.sprite.position.z;
    expect(avatarZ).toBeGreaterThan(normalZ);
  });

  it('avatar gets a pulse ring sprite', () => {
    const agents = [makeAvatarAgent('avatar-1', 5, 3, '#ff6b6b')];
    const result = createAgentSpriteMesh(agents);
    const entry = result.spriteMap.get('avatar-1')!;
    expect(entry.pulseRingSprite).toBeDefined();
    expect(entry.pulseRingSprite).toBeInstanceOf(THREE.Sprite);
  });

  it('non-avatar agents have no pulse ring sprite', () => {
    const agents = [makeAgent('agent-1', 5, 3)];
    const result = createAgentSpriteMesh(agents);
    const entry = result.spriteMap.get('agent-1')!;
    expect(entry.pulseRingSprite).toBeUndefined();
  });

  it('pulse ring sprite tracks avatar sprite position', () => {
    const agents = [makeAvatarAgent('avatar-1', 5, 3)];
    const result = createAgentSpriteMesh(agents);
    const entry = result.spriteMap.get('avatar-1')!;
    const mainPos = entry.sprite.position;
    const ringPos = entry.pulseRingSprite!.position;
    expect(ringPos.x).toBe(mainPos.x);
    expect(ringPos.y).toBe(mainPos.y);
    expect(ringPos.z).toBeLessThan(mainPos.z); // Ring behind portrait
  });

  it('pulse ring visibility tracks portrait tier visibility', () => {
    const agents = [makeAvatarAgent('avatar-1', 0, 0)];
    const result = createAgentSpriteMesh(agents);
    const entry = result.spriteMap.get('avatar-1')!;

    updateZoomVisibility(result, 'hero-local');
    expect(entry.pulseRingSprite!.visible).toBe(true);

    updateZoomVisibility(result, 'full-world');
    expect(entry.pulseRingSprite!.visible).toBe(false);
  });

  it('tickAvatarPulse updates ring opacity over time', () => {
    const agents = [makeAvatarAgent('avatar-1', 0, 0)];
    const result = createAgentSpriteMesh(agents);
    updateZoomVisibility(result, 'hero-local');
    const entry = result.spriteMap.get('avatar-1')!;
    const ringMat = entry.pulseRingSprite!.material as THREE.SpriteMaterial;

    // Pulse at t=0 — sine(0) = 0, so t=0.5, opacity = 0.6 + 0.4*0.5 = 0.8
    tickAvatarPulse(result, 0);
    const op0 = ringMat.opacity;

    // Pulse at t=0.5 (quarter period) — sine(π/2) = 1, opacity = 1.0
    tickAvatarPulse(result, 0.5);
    const op1 = ringMat.opacity;

    expect(op1).toBeGreaterThan(op0);
    expect(op1).toBeCloseTo(1.0, 1);
  });

  it('dispose cleans up pulse ring material', () => {
    const agents = [makeAvatarAgent('avatar-1', 0, 0)];
    const result = createAgentSpriteMesh(agents);
    expect(() => result.dispose()).not.toThrow();
  });

  it('avatar animation target moves both main sprite and pulse ring', () => {
    const agents = [makeAvatarAgent('avatar-1', 5, 3)];
    const result = createAgentSpriteMesh(agents);
    const target = result.animationTargets.get('avatar-1')!;
    const entry = result.spriteMap.get('avatar-1')!;

    target.setPosition(100, 200, 5);
    expect(entry.sprite.position.x).toBe(100);
    expect(entry.sprite.position.y).toBe(200);
    expect(entry.pulseRingSprite!.position.x).toBe(100);
    expect(entry.pulseRingSprite!.position.y).toBe(200);
  });
});

// THR-126: activity halo sprites
describe('activity halo (THR-126)', () => {
  let createAgentSpriteMesh: typeof import('../AgentSpriteMesh').createAgentSpriteMesh;
  let updateZoomVisibility: typeof import('../AgentSpriteMesh').updateZoomVisibility;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('../AgentSpriteMesh');
    createAgentSpriteMesh = mod.createAgentSpriteMesh;
    updateZoomVisibility = mod.updateZoomVisibility;
  });

  it('creates activityHaloSprite when activityCategory is set', () => {
    const agents = [{ ...makeAgent('a1', 3, 3), activityCategory: 'conflict' as const }];
    const result = createAgentSpriteMesh(agents);
    const entry = result.spriteMap.get('a1')!;
    expect(entry.activityHaloSprite).toBeDefined();
  });

  it('does not create activityHaloSprite when activityCategory is absent', () => {
    const result = createAgentSpriteMesh([makeAgent('a1', 3, 3)]);
    const entry = result.spriteMap.get('a1')!;
    expect(entry.activityHaloSprite).toBeUndefined();
  });

  it('activityHaloSprite starts hidden', () => {
    const agents = [{ ...makeAgent('a1', 3, 3), activityCategory: 'commerce' as const }];
    const result = createAgentSpriteMesh(agents);
    expect(result.spriteMap.get('a1')!.activityHaloSprite!.visible).toBe(false);
  });

  it('updateZoomVisibility shows halo at hero-local tier', () => {
    const agents = [{ ...makeAgent('a1', 3, 3), activityCategory: 'diplomacy' as const }];
    const result = createAgentSpriteMesh(agents);
    updateZoomVisibility(result, 'hero-local');
    expect(result.spriteMap.get('a1')!.activityHaloSprite!.visible).toBe(true);
  });

  it('updateZoomVisibility hides halo at regional tier', () => {
    const agents = [{ ...makeAgent('a1', 3, 3), activityCategory: 'intrigue' as const }];
    const result = createAgentSpriteMesh(agents);
    updateZoomVisibility(result, 'hero-local');
    updateZoomVisibility(result, 'regional');
    expect(result.spriteMap.get('a1')!.activityHaloSprite!.visible).toBe(false);
  });

  it('animation target moves activityHaloSprite with main sprite', () => {
    const agents = [{ ...makeAgent('a1', 3, 3), activityCategory: 'craft' as const }];
    const result = createAgentSpriteMesh(agents);
    const target = result.animationTargets.get('a1')!;
    const entry = result.spriteMap.get('a1')!;
    target.setPosition(50, 75, 6);
    expect(entry.sprite.position.x).toBe(50);
    expect(entry.activityHaloSprite!.position.x).toBe(50);
    expect(entry.activityHaloSprite!.position.y).toBe(75);
  });

  it('dispose does not throw with activityHaloSprite', () => {
    const agents = [{ ...makeAgent('a1', 3, 3), activityCategory: 'exploration' as const }];
    const result = createAgentSpriteMesh(agents);
    expect(() => result.dispose()).not.toThrow();
  });
});
