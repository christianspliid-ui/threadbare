// @vitest-environment jsdom
//
// THR-1299 slice 1 — the follow write lever is wired to React state.
//
// This is the wiring proof the constructed interrupt proof depends on. The CLI
// world mints no `thread` edges, so nothing is default-followed there and a moment
// can never resolve `interrupt` in a headless run; `__DEBUG.followAgent` is the
// only route to a followed agent, and a later slice's browser Done-when is
// unreachable if this lever is inert.
//
// "Inert" has a specific shape worth guarding. Follow state is React state, so a
// lever that mutated the state *provider's* object in place would flip the
// predicate while leaving every surface that reads it un-rendered — a change that
// is real and invisible, which is the worst possible failure for a lever whose
// entire job is to make something observable. The assertions therefore read the
// value back **through the live state provider after an `act()` flush**, which is
// the same object GameView re-renders from, rather than inspecting the patch the
// engine function returned (that is `followedAgents.test.ts`'s job).
//
// Runs under real <StrictMode>, so a lever that double-applied would show up as a
// duplicated id rather than passing quietly.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import { StrictMode } from 'react';
import { GameView } from '../GameView';
import type { GameState } from '../../../types/gameState';

// Mock HexMapV2 to avoid canvas initialization in jsdom
vi.mock('../../HexMapV2/HexMapV2', () => ({
  default: vi.fn().mockReturnValue(null),
}));

// Mock audio modules to avoid HTMLAudioElement issues in jsdom
vi.mock('../../../audio/MusicChannel', () => ({
  resumeMusic: vi.fn(),
  fadeOutMusic: vi.fn().mockResolvedValue(undefined),
  playMusic: vi.fn(),
  setMuted: vi.fn(),
  isMuted: vi.fn().mockReturnValue(false),
  getMusicVolume: vi.fn().mockReturnValue(0.4),
  setMusicVolume: vi.fn(),
  isMusicMuted: vi.fn().mockReturnValue(false),
  toggleMusicMute: vi.fn(),
  swapMusicTrack: vi.fn(),
  restoreMusicDefault: vi.fn(),
}));
vi.mock('../../../audio/BackgroundChannel', () => ({
  pushAmbient: vi.fn(),
  popAmbient: vi.fn(),
  getBackgroundVolume: vi.fn().mockReturnValue(0.35),
  setBackgroundVolume: vi.fn(),
  isBackgroundMuted: vi.fn().mockReturnValue(false),
  muteBackground: vi.fn(),
  unmuteBackground: vi.fn(),
}));
vi.mock('../../../audio/UiChannel', () => ({
  playUi: vi.fn(),
  getUiVolume: vi.fn().mockReturnValue(0.6),
  setUiVolume: vi.fn(),
  isUiMuted: vi.fn().mockReturnValue(false),
  muteUi: vi.fn(),
  unmuteUi: vi.fn(),
}));
vi.mock('../../../audio/AudioMaster', () => ({
  muteAll: vi.fn(),
  unmuteAll: vi.fn(),
  isAllMuted: vi.fn().mockReturnValue(false),
}));

interface FollowBridge {
  followAgent: (agentRef: string) => { success: boolean; agentId?: string; message?: string };
  unfollowAgent: (agentRef: string) => { success: boolean; agentId?: string; message?: string };
}

describe('GameView follow bridge (THR-1299 slice 1)', () => {
  let stateProvider: (() => GameState | null) | null = null;
  let followBridge: FollowBridge | null = null;
  let previousDebug: unknown;

  beforeEach(() => {
    stateProvider = null;
    followBridge = null;

    previousDebug = (window as unknown as Record<string, unknown>).__DEBUG;
    // Permissive stub: GameView registers many bridges behind an
    // `import.meta.env.DEV && window.__DEBUG` guard. Unrecognised members no-op;
    // the two under test capture their callbacks.
    (window as unknown as Record<string, unknown>).__DEBUG = new Proxy(
      {} as Record<string, unknown>,
      {
        get: (_target, prop) => {
          if (prop === '_registerGameStateProvider') {
            return (fn: () => GameState | null) => { stateProvider = fn; };
          }
          if (prop === '_registerFollowBridge') {
            return (cb: FollowBridge) => { followBridge = cb; };
          }
          return () => undefined;
        },
        has: () => true,
      },
    );
  });

  afterEach(() => {
    (window as unknown as Record<string, unknown>).__DEBUG = previousDebug;
  });

  function renderGame() {
    render(
      <StrictMode>
        <GameView
          archetype={{
            id: 'seeker',
            name: 'The Seeker',
            title: 'The Seeker',
            description: 'A seeking god',
            sphereAlignment: { primary: 'light', secondary: 'chaos' },
            startingDomainAffinities: { iron: 0.5, gold: 0.5 },
            personalitySeed: {
              courage_prudence: 0.5,
              honesty_cunning: 0.5,
              sacrifice_survival: 0.5,
              loyalty_ambition: 0.5,
              tradition_novelty: 0.5,
              humility_pride: 0.5,
              mercy_ruthlessness: 0.5,
              asceticism_extravagance: 0.5,
            },
            flavorText: 'A seeking god',
          } as never}
          avatarName="Tester"
          cosmology={{
            force: 0.5, matter: 0.5, energy: 0.5, life: 0.5,
            mind: 0.5, spirit: 0.5, time: 0.5, entropy: 0.5,
          } as never}
          seed={42}
        />
      </StrictMode>,
    );

    expect(stateProvider, 'GameView did not register a game-state provider').not.toBeNull();
    expect(followBridge, 'GameView did not register a follow bridge').not.toBeNull();
    return stateProvider!;
  }

  it('follow lands in the live game state, and unfollow takes it back out', () => {
    const provider = renderGame();
    const initial = provider();
    expect(initial, 'game state provider returned null').not.toBeNull();

    // A real actor from the generated world, not the ascendant — the affordance's
    // subject is always a mortal.
    const target = initial!.graph.getNodesByType('actor')
      .find(n => n.properties?.actorType === 'individual' && n.id !== initial!.ascendantId);
    expect(target, 'generated world produced no individual actor to follow').toBeTruthy();
    const agentId = target!.id;

    expect(
      initial!.followedAgentIds ?? [],
      'fixture is not falsifying — the agent is already followed before the lever runs',
    ).not.toContain(agentId);

    let result: { success: boolean; agentId?: string; message?: string } | undefined;
    act(() => { result = followBridge!.followAgent(agentId); });
    expect(result?.success, `followAgent failed: ${result?.message}`).toBe(true);
    expect(result?.agentId).toBe(agentId);

    // Read back through the provider: this is the object GameView re-renders from.
    // A lever that mutated a detached copy would fail here and nowhere else.
    const followed = provider()!.followedAgentIds ?? [];
    expect(followed).toContain(agentId);
    // StrictMode double-invokes updaters; one press must still mean one entry.
    expect(followed.filter(id => id === agentId)).toHaveLength(1);

    act(() => { result = followBridge!.unfollowAgent(agentId); });
    expect(result?.success, `unfollowAgent failed: ${result?.message}`).toBe(true);

    const after = provider()!;
    expect(after.followedAgentIds ?? []).not.toContain(agentId);
    // Unthreaded agent, so the un-follow is a plain removal — no mute is recorded.
    expect(after.mutedAgentIds ?? []).not.toContain(agentId);
  });

  it('reports a miss instead of silently following nobody', () => {
    renderGame();

    let result: { success: boolean; message?: string } | undefined;
    act(() => { result = followBridge!.followAgent('no-such-agent-anywhere'); });

    expect(result?.success).toBe(false);
    expect(result?.message, 'a miss must say what it could not resolve').toBeTruthy();
  });
});
