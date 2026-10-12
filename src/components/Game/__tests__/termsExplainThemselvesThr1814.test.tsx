// @vitest-environment jsdom
/**
 * THR-1814 — the map's words explain themselves (THR-1807 plan, half A).
 *
 * - Every new or rewritten registry id resolves, within Law 18's 200 characters.
 * - Every interrupt surface the registry can open has a holder name, and the TIME
 *   readout names the holder for every hold.
 * - Under an encounter veil the top bar stays hoverable: Doom explains itself plus
 *   "Opens when this chapter closes.", and a press opens nothing. Without a veil the
 *   press opens the panel.
 * - Empty Signatures / Covenants / Hooks sections do not render; a held hook brings
 *   Hooks with its `ui.hooks` tooltip.
 * - Reach tier words carry a rung marker on the bar.
 *
 * Real components on a real world (`initializeGameState`, the `?seeded` pair), the
 * jsdom-render route of `Docs/canon/verification-gates.md` § Browser-verify.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { GameViewTopBar, type GameViewTopBarProps } from '../GameView/GameViewTopBar';
import { SimulationControls } from '../SimulationControls';
import { AscendantBar } from '../ascendant-bar/AscendantBar';
import { ReachesBlock } from '../ascendant-bar/ReachesBlock';
import { INTERRUPT_SURFACES, resolveInterrupts } from '../interruptRegistry';
import { resolveTooltip } from '../../../engine/tooltipResolver';
import { TOPBAR_LOCKED_SUFFIX, CLOCK_HELD_STAYS_PAUSED_DESC } from '../../../data/ui-content';
import {
  CLOCK_HELD_FALLBACK_HOLDER,
  INTERRUPT_HOLDER_NAMES,
  clockHeldStatus,
  resolveClockHolder,
} from '../../../data/nudge-stage-content';
import { getReachRung } from '../../../data/ascendant-reach-register';
import { initializeGameState, devSeedAscendantTestPackage } from '../../../engine/gameInit';
import { generateArchetypes } from '../../../engine/ascendant';
import { createBalancedCosmology } from '../../../engine/cosmology';
import { DEFAULT_NOTIFICATION_PREFS } from '../../../types/notification';
import type { GameState } from '../../../types/gameState';
import type { InterruptSnapshot } from '../interruptRegistry';
import { countHooks } from '../ascendant-bar/HooksBlock';
import { selectCovenantRows } from '../ascendant-bar/selectors';

let signaturePathsOverride: unknown[] | null = null;
vi.mock('../ascendant-bar/selectors', async (importActual) => {
  const actual = await importActual<typeof import('../ascendant-bar/selectors')>();
  return {
    ...actual,
    selectSignaturePaths: (gameState: GameState) =>
      signaturePathsOverride ?? actual.selectSignaturePaths(gameState),
  };
});

const TEST_SEED = 42;
const archetype = generateArchetypes(4, TEST_SEED)[0];

function freshWorld(): GameState {
  const { state } = initializeGameState(archetype, 'Vess', createBalancedCosmology(), TEST_SEED, 16, 12);
  return state as GameState;
}

const bareWorld = freshWorld();
const seededWorld = freshWorld();
devSeedAscendantTestPackage(seededWorld);

afterEach(() => cleanup());

// ─── Registry ────────────────────────────────────────────────────────────────

describe('THR-1814 registry entries', () => {
  const IDS = [
    'ui.doom_bar', 'ui.omen', 'ui.world_soul', 'ui.attention',
    'ui.signatures', 'ui.hooks', 'ui.clock_held', 'ui.step_test',
  ];

  it.each(IDS)('%s resolves with copy inside Law 18', (id) => {
    const tip = resolveTooltip(id);
    expect(tip).not.toBeNull();
    expect(tip!.label.length).toBeGreaterThan(0);
    expect(tip!.desc.length).toBeGreaterThan(0);
    expect(tip!.desc.length).toBeLessThanOrEqual(200);
  });

  it('Doom says it is a slow clock that cannot end the world early', () => {
    expect(resolveTooltip('ui.doom_bar')!.desc).toContain('cannot end the world early');
  });
});

// ─── Who holds the clock ─────────────────────────────────────────────────────

describe('THR-1814 clock holder names', () => {
  it('every interrupt surface the registry can open has a holder name', () => {
    const missing = INTERRUPT_SURFACES.map((s) => s.id).filter((id) => !INTERRUPT_HOLDER_NAMES[id]);
    expect(missing).toEqual([]);
  });

  it('the Chapter Ledger holds the clock by name', () => {
    const snapshot: InterruptSnapshot = {
      interruptsSuppressed: false,
      encounterOpen: false,
      meetingPending: false,
      hasAscendantIdentity: true,
      premonitionPending: false,
      vignettePending: false,
      storyBeatPending: false,
      ascendantBeatEntered: false,
      choiceSetPending: false,
      emergenceDecisionPending: false,
      divineReceiptPending: false,
      momentPending: false,
      chapterLedgerOpen: true,
      courtOpen: false,
      popupQueued: false,
    } as InterruptSnapshot;
    const { open } = resolveInterrupts(snapshot);
    expect(resolveClockHolder(open)).toBe('the Chapter Ledger');
  });

  it('an encounter veil uses its own title, then the table, then the fallback', () => {
    expect(resolveClockHolder(['EncounterVeil'], 'The Unsafe Bridge')).toBe('The Unsafe Bridge');
    expect(resolveClockHolder(['EncounterVeil'], '  ')).toBe(INTERRUPT_HOLDER_NAMES.EncounterVeil);
    expect(resolveClockHolder(['NotASurface'])).toBe(CLOCK_HELD_FALLBACK_HOLDER);
    expect(resolveClockHolder([])).toBe(CLOCK_HELD_FALLBACK_HOLDER);
  });

  it('the readout says what happens when the holder closes', () => {
    expect(clockHeldStatus('the Chapter Ledger', true)).toBe('held by the Chapter Ledger · runs on when it closes');
    expect(clockHeldStatus('Decipher Old Markings', false)).toBe('held by Decipher Old Markings · stays paused');
    expect(clockHeldStatus(undefined, false)).toBe(`held by ${CLOCK_HELD_FALLBACK_HOLDER} · stays paused`);
  });

  it('SimulationControls renders the held line under the ui.clock_held tooltip', () => {
    render(
      <SimulationControls
        season="spring" year={1} running speed={1}
        onToggle={vi.fn()} onStep={vi.fn()} onSpeedChange={vi.fn()}
        compact held heldBy="the Chapter Ledger"
      />,
    );
    const status = screen.getByTestId('clock-held-status');
    expect(status.textContent).toBe('held by the Chapter Ledger · runs on when it closes');
    expect(status.closest('[data-tooltip-id="ui.clock_held"]')).toBeTruthy();
  });

  it('the held hover matches the branch: runs again, or stays paused', () => {
    vi.useFakeTimers();
    try {
      const { rerender } = render(
        <SimulationControls
          season="spring" year={1} running speed={1}
          onToggle={vi.fn()} onStep={vi.fn()} onSpeedChange={vi.fn()}
          compact held heldBy="The Unsafe Bridge"
        />,
      );
      fireEvent.pointerEnter(screen.getByTestId('clock-held-status'));
      act(() => { vi.advanceTimersByTime(400); });
      expect(screen.getByRole('tooltip').textContent).toContain('It runs again when this closes');
      fireEvent.pointerLeave(screen.getByTestId('clock-held-status'));
      act(() => { vi.advanceTimersByTime(400); });

      rerender(
        <SimulationControls
          season="spring" year={1} running={false} speed={1}
          onToggle={vi.fn()} onStep={vi.fn()} onSpeedChange={vi.fn()}
          compact held heldBy="The Unsafe Bridge"
        />,
      );
      fireEvent.pointerEnter(screen.getByTestId('clock-held-status'));
      act(() => { vi.advanceTimersByTime(400); });
      const tip = screen.getByRole('tooltip').textContent ?? '';
      expect(tip).toContain(CLOCK_HELD_STAYS_PAUSED_DESC);
      expect(tip).not.toContain('runs again');
    } finally {
      vi.useRealTimers();
    }
  });
});

// ─── Top bar under a veil ────────────────────────────────────────────────────

function topBarProps(overrides: Partial<GameViewTopBarProps>): GameViewTopBarProps {
  return {
    gameState: seededWorld,
    seasonName: 'spring',
    year: 1,
    running: false,
    speed: 1,
    handleToggleRunning: vi.fn(),
    doTick: vi.fn(),
    setSpeed: vi.fn(),
    attentionPool: 3,
    attentionCapacity: 5,
    doomJourneyLabel: undefined,
    setDoomDetailOpen: vi.fn(),
    readThreadsOpen: false,
    setReadThreadsOpen: vi.fn(),
    settingsPanelOpen: false,
    setSettingsPanelOpen: vi.fn(),
    fogDisabled: false,
    setFogDisabled: vi.fn(),
    debugPanelOpen: false,
    handleToggleDebug: vi.fn(),
    showOrganicShore: false,
    setShowOrganicShore: vi.fn(),
    notificationPrefs: DEFAULT_NOTIFICATION_PREFS,
    toggleNotifCategory: vi.fn(),
    setNotifMode: vi.fn(),
    resetNotifPrefs: vi.fn(),
    musicVolume: 0,
    handleMusicVolume: vi.fn(),
    bgVolume: 0,
    handleBgVolume: vi.fn(),
    uiVolume: 0,
    handleUiVolume: vi.fn(),
    audioMuted: true,
    handleToggleAudioMute: vi.fn(),
    recordingTrouble: false,
    handleToggleRecordTrouble: vi.fn(),
    includeWorldInSnapshot: false,
    handleToggleIncludeWorld: vi.fn(),
    handleSaveSnapshot: vi.fn(),
    ...overrides,
  };
}

describe('THR-1814 top bar stays explainable inside a veil', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('with a veil open: the group is not inert, Doom hovers with the locked line, and a press opens nothing', () => {
    const setDoomDetailOpen = vi.fn();
    const setSettingsPanelOpen = vi.fn();
    render(<GameViewTopBar {...topBarProps({ encounterOpen: true, setDoomDetailOpen, setSettingsPanelOpen })} />);

    const group = screen.getByTestId('topbar-right-group');
    expect(group.hasAttribute('inert')).toBe(false);
    expect(group.getAttribute('aria-disabled')).toBe('true');

    const doomTrigger = document.querySelector('[data-tooltip-id="ui.doom_bar"]')!;
    expect(doomTrigger).toBeTruthy();
    fireEvent.pointerEnter(doomTrigger);
    act(() => { vi.advanceTimersByTime(400); });
    const tip = screen.getByRole('tooltip');
    expect(tip.textContent).toContain('cannot end the world early');
    expect(tip.textContent).toContain(TOPBAR_LOCKED_SUFFIX);

    fireEvent.click(screen.getByLabelText('View doom clock details'));
    fireEvent.keyDown(screen.getByLabelText('View doom clock details'), { key: 'Enter' });
    expect(setDoomDetailOpen).not.toHaveBeenCalled();
    // The capture guard covers the whole group, not only Doom.
    fireEvent.click(screen.getByTestId('settings-toggle'));
    expect(setSettingsPanelOpen).not.toHaveBeenCalled();
  });

  it('a panel the group opened before the veil (portalled above it) still closes on a press', () => {
    // Review-gate finding: React routes portal events through the owner, so the
    // group's capture guard must leave presses whose DOM target is outside it alone.
    const world = { ...seededWorld, omenState: {
      primary: {
        templateId: 'omen.breach.thin_places', name: 'Thin Places', category: 'doom_echo',
        startTick: 0, duration: 48, slot: 'primary', lastBeatTick: 0,
      },
      secondary: null,
      history: [],
    } } as GameState;
    const { rerender } = render(<GameViewTopBar {...topBarProps({ gameState: world, encounterOpen: false })} />);
    fireEvent.click(screen.getByLabelText('View world omen details'));
    expect(screen.getByLabelText('World omen details')).toBeTruthy();

    rerender(<GameViewTopBar {...topBarProps({ gameState: world, encounterOpen: true })} />);
    // The modal's backdrop is its close control; it is portalled to body, outside the group.
    fireEvent.click(screen.getByLabelText('World omen details'));
    expect(screen.queryByLabelText('World omen details')).toBeNull();
  });

  it('without a veil: a press opens the Doom panel and the hover has no locked line', () => {
    const setDoomDetailOpen = vi.fn();
    render(<GameViewTopBar {...topBarProps({ encounterOpen: false, setDoomDetailOpen })} />);

    fireEvent.click(screen.getByLabelText('View doom clock details'));
    expect(setDoomDetailOpen).toHaveBeenCalledWith(true);

    fireEvent.pointerEnter(document.querySelector('[data-tooltip-id="ui.doom_bar"]')!);
    act(() => { vi.advanceTimersByTime(400); });
    expect(screen.getByRole('tooltip').textContent).not.toContain(TOPBAR_LOCKED_SUFFIX);
  });
});

// ─── Side bar ────────────────────────────────────────────────────────────────

function renderBar(world: GameState) {
  return render(
    <AscendantBar
      gameState={world}
      archetype={archetype}
      ascendantIdentity={null}
      avatarName="Vess"
      worldVersion={1}
      onOpenSheet={vi.fn()}
      onOpenMandate={vi.fn()}
    />,
  );
}

describe('THR-1814 empty side-bar sections do not render', () => {
  afterEach(() => { signaturePathsOverride = null; });

  it('a god holding no signatures, covenants or hooks shows none of the three headers', () => {
    // A god's own paths count from the moment its Reaches settle, so the zero case
    // is a god before that: the selector returns no path of its own.
    signaturePathsOverride = [];
    expect(countHooks(bareWorld)).toBe(0);
    expect(selectCovenantRows(bareWorld)).toHaveLength(0);
    renderBar(bareWorld);
    expect(screen.queryByText('Signatures')).toBeNull();
    expect(screen.queryByText('Covenants')).toBeNull();
    expect(screen.queryByText('Hooks')).toBeNull();
    // The always-present sections still render.
    expect(screen.getByText('Reaches')).toBeTruthy();
    expect(screen.getByText('Essence')).toBeTruthy();
  });

  it('a god with paths of its own shows Signatures, carrying its ui.signatures tooltip', () => {
    renderBar(bareWorld);
    expect(screen.getByText('Signatures').closest('[data-tooltip-id="ui.signatures"]')).toBeTruthy();
  });

  it('a held hook brings the Hooks header, carrying its ui.hooks tooltip', () => {
    renderBar(seededWorld);
    const header = screen.getByText('Hooks');
    expect(header.closest('[data-tooltip-id="ui.hooks"]')).toBeTruthy();
  });
});

// ─── Reach rung marker ───────────────────────────────────────────────────────

describe('THR-1814 Reach tier words read as ranks', () => {
  it('the register places a word on its ladder, and fails soft off it', () => {
    expect(getReachRung('eye', 'Blinkered')).toEqual({ rung: 1, count: 5 });
    expect(getReachRung('eye', 'Before It Happens')).toEqual({ rung: 5, count: 5 });
    expect(getReachRung('eye', 'Nonsense')).toBeNull();
    expect(getReachRung('nowhere', 'Blinkered')).toBeNull();
  });

  it('the bar draws the marker inside the tier word tooltip, filled up to the rung', () => {
    render(
      <ReachesBlock
        rows={[{ reach: 'eye', label: 'Eye', rank: 'primary', tierWord: 'Watching', pendingDeepening: false } as never]}
      />,
    );
    const marker = screen.getByTestId('reach-rung-eye');
    expect(marker.getAttribute('data-rung')).toBe('2');
    expect(marker.getAttribute('data-rung-count')).toBe('5');
    expect(marker.closest('[data-tooltip-id="ui.reach_tier.eye.watching"]')).toBeTruthy();
    // No numeral reaches the player (Law 13).
    expect(marker.textContent).toBe('');
  });
});
