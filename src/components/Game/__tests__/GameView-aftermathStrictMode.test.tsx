// @vitest-environment jsdom
//
// THR-780 regression guard: applying one aftermath reaction must apply its effects
// exactly once, even though <StrictMode> double-invokes every setGameState updater in
// development.
//
// `applyEncounterAftermathReaction` mutates the live WorldGraph in place
// (`node.properties.reputationTallies = tallies`). While GameView called it from
// *inside* a `setGameState(prev => …)` updater, StrictMode's double-invoke ran every
// accumulating effect twice — a 0.35 tally delta landed as 0.70 — while idempotent
// effects (hidden_mark, deduped by a deterministic markId) silently looked correct.
//
// This test drives the real `applyAftermathReactionForAgent` through GameView's
// aftermath debug bridge, under a real <StrictMode> tree. If the engine call is ever
// moved back inside the updater, the tally assertion doubles and this fails.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import { StrictMode } from 'react';
import { GameView } from '../GameView';
import { disableTracing, enableTracing, clearTraces, getTraces } from '../../../engine/traceBuffer';
import type { GameState } from '../../../types/gameState';
import type { UnifiedAction } from '../../../types/unifiedAction';

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

/** Authored delta under test — one application must move the tally by exactly this. */
const TALLY_DELTA = 0.35;
const TALLY_KEY = 'shadow.negative';
const REACTION_ID = 'thr780-tally-once';
const TEMPLATE_ID = 'thr780.strictmode.probe';

interface AftermathBridge {
  pickAftermathReaction: (
    agentQuery: string,
    reactionId?: string,
  ) => { success: boolean; message: string; reactionId?: string };
}

describe('GameView aftermath reactions under StrictMode (THR-780)', () => {
  let stateProvider: (() => GameState | null) | null = null;
  let aftermathBridge: AftermathBridge | null = null;
  let previousDebug: unknown;

  beforeEach(() => {
    stateProvider = null;
    aftermathBridge = null;
    clearTraces();
    enableTracing();

    previousDebug = (window as unknown as Record<string, unknown>).__DEBUG;
    // Permissive stub: GameView registers many bridges on window.__DEBUG behind an
    // `import.meta.env.DEV && window.__DEBUG` guard. Every unrecognised member is a
    // no-op; the two we care about capture their callbacks.
    (window as unknown as Record<string, unknown>).__DEBUG = new Proxy(
      {} as Record<string, unknown>,
      {
        get: (_target, prop) => {
          if (prop === '_registerGameStateProvider') {
            return (fn: () => GameState | null) => { stateProvider = fn; };
          }
          if (prop === '_registerAftermathBridge') {
            return (cb: AftermathBridge) => { aftermathBridge = cb; };
          }
          return () => undefined;
        },
        has: () => true,
      },
    );
  });

  afterEach(() => {
    (window as unknown as Record<string, unknown>).__DEBUG = previousDebug;
    disableTracing();
    clearTraces();
  });

  it('applies a reputation_tally reaction exactly once (not twice)', () => {
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

    // The bridges register in effects, so they are live by the time render() returns.
    expect(stateProvider, 'GameView did not register a game-state provider').not.toBeNull();
    expect(aftermathBridge, 'GameView did not register an aftermath bridge').not.toBeNull();

    const state = stateProvider!();
    expect(state, 'game state provider returned null').not.toBeNull();

    // Plant a pending aftermath on a real actor. resolveAftermathContextForAgent only
    // needs a unifiedAction whose actorId matches and which carries reactions; with no
    // encounterNotifications for this agent it takes the sorted-candidate fallback path.
    const actorId = state!.ascendantId;
    const actorNode = state!.graph.getNode(actorId);
    expect(actorNode, `ascendant node '${actorId}' missing from graph`).toBeTruthy();

    const plantedAction = {
      actionId: 'thr780-probe-action',
      templateId: TEMPLATE_ID,
      actorId,
      aftermathSummary: {
        encounterId: TEMPLATE_ID,
        outcome: 'success',
        overview: 'THR-780 StrictMode probe.',
        changes: [],
        reactions: [{
          id: REACTION_ID,
          label: 'Let the rumour stand',
          effects: [{ kind: 'reputation_tally', key: TALLY_KEY, delta: TALLY_DELTA }],
        }],
      },
    } as unknown as UnifiedAction;

    // unifiedActions is read off the live state object the component holds in its ref.
    (state!.unifiedActions as UnifiedAction[]).push(plantedAction);

    const talliesBefore = (actorNode!.properties.reputationTallies as Record<string, number> | undefined) ?? {};
    const before = talliesBefore[TALLY_KEY] ?? 0;

    clearTraces();
    let result: { success: boolean; message: string } | undefined;
    act(() => {
      result = aftermathBridge!.pickAftermathReaction(actorId, REACTION_ID);
    });

    expect(result?.success, `pickAftermathReaction failed: ${result?.message}`).toBe(true);

    const talliesAfter = (actorNode!.properties.reputationTallies as Record<string, number> | undefined) ?? {};
    const after = talliesAfter[TALLY_KEY] ?? 0;

    // The whole point: one delta, not two. Under the pre-fix shape this was 0.70.
    expect(after - before).toBeCloseTo(TALLY_DELTA, 10);

    // And the reaction announced itself exactly once.
    const appliedTraces = getTraces().filter(
      trace => (trace as { category?: string }).category === 'encounter_aftermath_applied'
        && (trace as { reactionId?: string }).reactionId === REACTION_ID,
    );
    expect(appliedTraces).toHaveLength(1);
  });
});
