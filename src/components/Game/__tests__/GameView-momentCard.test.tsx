// @vitest-environment jsdom
//
// THR-1299 slice 3 — the moment queue has a consumer, and it is wired.
//
// This is the proof the interface-map row's LIVE badge rests on. Every unit test
// on `resolveUndertakingCheckpoint` and `undertakingMoments.ts` passes through a
// GameView that never pops the queue, so the only thing that can fail here is the
// consumer: the slot filling, the card entering the interrupt registry, and the
// acknowledge landing back in the live game state through the queue's writer.
//
// The world is real (`initializeGameState → runTick`, driven through the debug
// tick bridge), the follow is real (the slice-1 lever), and the moments are the
// engine's own — no record is injected. A CLI world follows nobody, so the arm
// this exercises is unreachable headlessly by construction; the lever is what
// makes it reachable at all.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, act, screen, fireEvent } from '@testing-library/react';
import { StrictMode } from 'react';
import { GameView } from '../GameView';
import type { GameState } from '../../../types/gameState';
import { clearTraces, disableTracing, enableTracing, getTraces } from '../../../engine/traceBuffer';
import { UNDERTAKING_CHECKPOINT_INTERVAL_TICKS } from '../../../data/strategic-action-constants';

vi.mock('../../HexMapV2/HexMapV2', () => ({
  default: vi.fn().mockReturnValue(null),
}));
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
type TickBridge = (n: number) => { ticksRun?: number; tick?: number };
type OpenModalsProvider = () => string[];
type BeatSuppression = (enabled: boolean) => void;

/** Ticks to drive before giving up — enough for several checkpoints on every followed work. */
const MAX_TICKS = 96;

describe('GameView moment card consumer (THR-1299 slice 3)', () => {
  let stateProvider: (() => GameState | null) | null = null;
  let followBridge: FollowBridge | null = null;
  let tickBridge: TickBridge | null = null;
  let openModals: OpenModalsProvider | null = null;
  let beatSuppression: BeatSuppression | null = null;
  let previousDebug: unknown;

  beforeEach(() => {
    stateProvider = null;
    followBridge = null;
    tickBridge = null;
    openModals = null;
    beatSuppression = null;
    clearTraces();
    enableTracing();
    previousDebug = (window as unknown as Record<string, unknown>).__DEBUG;
    (window as unknown as Record<string, unknown>).__DEBUG = new Proxy(
      {} as Record<string, unknown>,
      {
        get: (_target, prop) => {
          if (prop === '_registerGameStateProvider') return (fn: () => GameState | null) => { stateProvider = fn; };
          if (prop === '_registerFollowBridge') return (cb: FollowBridge) => { followBridge = cb; };
          if (prop === '_registerTickBridge') return (fn: TickBridge) => { tickBridge = fn; };
          if (prop === '_registerOpenModalsProvider') return (fn: OpenModalsProvider) => { openModals = fn; };
          if (prop === '_registerBeatSuppression') return (fn: BeatSuppression) => { beatSuppression = fn; };
          return () => undefined;
        },
        has: () => true,
      },
    );
  });

  afterEach(() => {
    disableTracing();
    clearTraces();
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
          mapSize="small"
        />
      </StrictMode>,
    );
    expect(stateProvider, 'GameView did not register a game-state provider').not.toBeNull();
    expect(followBridge, 'GameView did not register a follow bridge').not.toBeNull();
    expect(tickBridge, 'GameView did not register a tick bridge').not.toBeNull();
    expect(openModals, 'GameView did not register an open-modals provider').not.toBeNull();
    expect(beatSuppression, 'GameView did not register beat suppression').not.toBeNull();
  }

  it('pops an interrupt-tier moment into the card, registers it, and acknowledges it through the live state', () => {
    renderGame();

    // Same posture as a verification run: narrative beats (premonitions, vignettes,
    // story beats) auto-resolve as they arrive, so the card is not waiting behind
    // one. The first run of this test found exactly that — a premonition modal open
    // and the card correctly holding back — which is the collation rule working,
    // not the consumer failing. `suppressBeats` deliberately never touches the
    // moment card, so what is asserted below is still the card's own behaviour.
    act(() => { beatSuppression!(true); });

    // Let the world start some undertakings, then follow every mortal running one.
    // Following is the affordance; a followed mortal's next costly step, trouble,
    // finish or doubling-down resolves `interrupt`, and only then does a card exist.
    act(() => { tickBridge!(UNDERTAKING_CHECKPOINT_INTERVAL_TICKS * 2); });
    let ticks = UNDERTAKING_CHECKPOINT_INTERVAL_TICKS * 2;
    const followed = new Set<string>();
    const followActiveActors = () => {
      const projects = stateProvider!()?.strategicState?.projects ?? [];
      for (const p of projects) {
        if (p.status !== 'active' || followed.has(p.actorId)) continue;
        let r: { success: boolean } | undefined;
        act(() => { r = followBridge!.followAgent(p.actorId); });
        if (r?.success) followed.add(p.actorId);
      }
    };
    followActiveActors();
    expect(followed.size, 'no undertaking was running to follow — the fixture cannot falsify').toBeGreaterThan(0);

    // Drive until the engine produces an interrupt-tier record for a followed mortal.
    let interruptSeen = false;
    while (ticks < MAX_TICKS && !interruptSeen) {
      act(() => { tickBridge!(UNDERTAKING_CHECKPOINT_INTERVAL_TICKS); });
      ticks += UNDERTAKING_CHECKPOINT_INTERVAL_TICKS;
      followActiveActors();
      const queue = stateProvider!()?.pendingUndertakingMoments ?? [];
      interruptSeen = queue.some(m => m.presentation === 'interrupt');
    }
    expect(interruptSeen, `no interrupt-tier moment in ${ticks} ticks across ${followed.size} followed works`).toBe(true);

    // The consumer: the oldest unacknowledged interrupt is on screen and in the registry.
    // Named in the failure so a card held behind another surface reads as collation
    // rather than as a missing consumer.
    expect(openModals!(), `MomentCard not registered; open surfaces: ${openModals!().join(', ') || '(none)'}`).toContain('MomentCard');
    const card = screen.getByTestId('moment-card');
    expect(card).toBeTruthy();
    const shownId = (() => {
      const queue = stateProvider!()!.pendingUndertakingMoments ?? [];
      return queue.find(m => m.presentation === 'interrupt' && !m.acknowledged)!.id;
    })();
    expect(getTraces().some(t => t.category === 'moment_surface' && (t as { event?: string }).event === 'opened')).toBe(true);

    // Acknowledge lands through the queue's writer, read back through the live provider.
    act(() => { fireEvent.click(screen.getByTestId('moment-card-acknowledge')); });
    const after = stateProvider!()!.pendingUndertakingMoments ?? [];
    const shown = after.find(m => m.id === shownId);
    expect(shown?.acknowledged, 'acknowledge did not land in the live game state').toBe(true);
    expect(getTraces().some(t => t.category === 'moment_surface' && (t as { event?: string }).event === 'acknowledged')).toBe(true);
    // The record stays for the badge to count — dismissal never destroys.
    expect(after.some(m => m.id === shownId)).toBe(true);
  }, 240_000);
});
