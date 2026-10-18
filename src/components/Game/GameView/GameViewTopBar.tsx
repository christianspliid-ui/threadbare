import {
  useEffect,
  useRef,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react';

import { SimulationControls } from '../SimulationControls';
import { DoomBar } from '../DoomBar';
import { OmenIndicator } from '../OmenIndicator';
import { RivalsButton } from '../RivalsButton';
import { NotablesButton } from '../NotablesButton';
import { SettingsPanel } from '../SettingsPanel';
import { IconButton } from '../../shared/IconButton';

import type { GameState } from '../../../types/gameState';
import type { FirstScreenReveal } from './firstScreenReveal';
import { NEWLY_REVEALED_STYLE, type OpeningRevealShow } from './openingReveal';
import type { OpeningRevealSurfaceId } from '../../../data/opening-reveal-table';
import type {
  NotificationPreferences,
  NotificationCategoryKey,
  NotificationMode,
} from '../../../types/notification';

/**
 * GameViewTopBar — the header / HUD strip at the top of the game view.
 *
 * THR-579 (Phase 2, step 1 of the THR-572 GameView decomposition): extracted
 * verbatim from `GameView.tsx` as the cleanest self-contained presentational
 * leaf. Pure props-down — all state remains owned by `GameView.tsx`; this
 * component holds none. Zero behavior change from the pre-extraction JSX.
 */
/** THR-1724 — the CSS variable the top bar publishes its rendered height on. */
export const TOPBAR_LIVE_HEIGHT_VAR = '--topbar-live-height';

/** THR-1724 — how far the right group recedes while an encounter veil is open. */
const TOPBAR_INERT_OPACITY = 0.4;

/**
 * THR-1814 — while a veil is open the right group takes no press: its panels open
 * beneath the veil's z-band. Capture-phase, so it covers every control in the group;
 * the focused tooltip ("Opens when this chapter closes.") is the reply.
 *
 * Only presses whose DOM target sits inside the group are swallowed. React routes
 * events from a portal through its owner, so a panel the group already opened
 * (OmenDetail, the Notables modal — portalled to body above the veil) would
 * otherwise lose its own close button. `inert` never reached portalled DOM either.
 */
function pressIsInsideGroup(e: ReactMouseEvent | ReactKeyboardEvent): boolean {
  return e.target instanceof Node && e.currentTarget.contains(e.target);
}
function swallowLockedPress(e: ReactMouseEvent) {
  if (!pressIsInsideGroup(e)) return;
  e.preventDefault();
  e.stopPropagation();
}
function swallowLockedKey(e: ReactKeyboardEvent) {
  if (!pressIsInsideGroup(e)) return;
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    e.stopPropagation();
  }
}

export interface GameViewTopBarProps {
  gameState: GameState;

  // Time controls (SimulationControls)
  seasonName: string;
  year: number;
  running: boolean;
  /** True while an interrupt holds the clock; `running` is then the state it returns to (THR-1711). */
  clockHeld?: boolean;
  /** THR-1724 — the name of what holds the clock (the open encounter), for the status line. */
  clockHeldBy?: string;
  /** THR-1812 — a chapter answer the clock is turning toward, or one waiting on a paused clock. */
  clockAnswerStatus?: string;
  /** THR-1716 — the clock has never run and nothing holds it: the Play control asks for it. */
  firstRunPrompt?: boolean;
  /**
   * THR-1724 — an encounter veil is open below the bar. The right group's
   * panels (settings, rivals, notables, doom) open beneath the veil's z-band,
   * so while it is open they dim and swallow presses rather than take a click
   * that shows nothing (Laws 21, 25). Hover stays live (THR-1814). The time
   * control stays live (THR-1711).
   */
  encounterOpen?: boolean;
  speed: number;
  handleToggleRunning: () => void;
  doTick: () => void;
  setSpeed: (speed: number) => void;


  // Doom
  doomJourneyLabel: string | undefined;
  setDoomDetailOpen: Dispatch<SetStateAction<boolean>>;

  // Read the Threads
  readThreadsOpen: boolean;
  setReadThreadsOpen: Dispatch<SetStateAction<boolean>>;

  // Settings panel + toggles
  settingsPanelOpen: boolean;
  setSettingsPanelOpen: Dispatch<SetStateAction<boolean>>;
  fogDisabled: boolean;
  setFogDisabled: Dispatch<SetStateAction<boolean>>;
  debugPanelOpen: boolean;
  handleToggleDebug: () => void;
  showOrganicShore: boolean;
  setShowOrganicShore: Dispatch<SetStateAction<boolean>>;

  // Notification preferences
  notificationPrefs: NotificationPreferences;
  toggleNotifCategory: (key: NotificationCategoryKey) => void;
  setNotifMode: (key: NotificationCategoryKey, mode: NotificationMode) => void;
  resetNotifPrefs: () => void;

  // Audio
  musicVolume: number;
  handleMusicVolume: (v: number) => void;
  bgVolume: number;
  handleBgVolume: (v: number) => void;
  uiVolume: number;
  handleUiVolume: (v: number) => void;
  audioMuted: boolean;
  handleToggleAudioMute: () => void;

  // Trouble — the incident snapshot (THR-1134)
  recordingTrouble: boolean;
  handleToggleRecordTrouble: () => void;
  includeWorldInSnapshot: boolean;
  handleToggleIncludeWorld: () => void;
  handleSaveSnapshot: () => void;

  // Leave the game for the title screen (THR-1604)
  onExitToTitle?: () => void;

  /**
   * A quiet first screen (THR-1648): which pressure surfaces the player has
   * earned. Omitted means everything shows — the pre-S5 behaviour.
   */
  reveal?: FirstScreenReveal;

  /**
   * THR-1837 — the staged opening reveal: which surfaces have arrived (latched)
   * and which are inside their gold-ring window. Omitted means everything shows.
   */
  opening?: { show: OpeningRevealShow; newly: ReadonlySet<OpeningRevealSurfaceId> };
  /** THR-1837 — the standing direction line, rendered after the time controls. */
  directionLine?: ReactNode;
  /** THR-1837 — the "Show every panel" setting. */
  showEveryPanel?: boolean;
  onToggleShowEveryPanel?: () => void;
  /** THR-1853 — the Rivals and Notables dropdowns report their open state up to GameView. */
  onRivalsOpenChange?: (open: boolean) => void;
  onNotablesOpenChange?: (open: boolean) => void;
}

export function GameViewTopBar({
  gameState,
  seasonName,
  year,
  running,
  clockHeld = false,
  clockHeldBy,
  clockAnswerStatus,
  firstRunPrompt = false,
  encounterOpen = false,
  speed,
  handleToggleRunning,
  doTick,
  setSpeed,
  doomJourneyLabel,
  setDoomDetailOpen,
  readThreadsOpen,
  setReadThreadsOpen,
  settingsPanelOpen,
  setSettingsPanelOpen,
  fogDisabled,
  setFogDisabled,
  debugPanelOpen,
  handleToggleDebug,
  showOrganicShore,
  setShowOrganicShore,
  notificationPrefs,
  toggleNotifCategory,
  setNotifMode,
  resetNotifPrefs,
  musicVolume,
  handleMusicVolume,
  bgVolume,
  handleBgVolume,
  uiVolume,
  handleUiVolume,
  audioMuted,
  handleToggleAudioMute,
  recordingTrouble,
  handleToggleRecordTrouble,
  includeWorldInSnapshot,
  handleToggleIncludeWorld,
  handleSaveSnapshot,
  onExitToTitle,
  reveal,
  opening,
  directionLine,
  showEveryPanel,
  onToggleShowEveryPanel,
  onRivalsOpenChange,
  onNotablesOpenChange,
}: GameViewTopBarProps) {
  const shown = (id: OpeningRevealSurfaceId) => opening?.show[id] ?? true;
  /** The gold ring on a panel that just arrived (THR-1837 U4). */
  const ring = (id: OpeningRevealSurfaceId) =>
    opening?.newly.has(id) ? { 'data-newly-revealed': 'true', style: NEWLY_REVEALED_STYLE } : {};
  const showDoom = reveal?.doom ?? true;
  const showRivals = reveal?.rivals ?? true;
  const showNotables = reveal?.notables ?? true;
  const showOmens = reveal?.omens ?? true;

  // THR-1724 — publish the bar's *rendered* height as `--topbar-live-height`.
  // The encounter veil starts below it, so the time control — which names an
  // encounter's auto-pause (Law 52, amended 2026-10-04) — stays in view while
  // the encounter holds the clock. Measured, not `--topbar-height`: the bar
  // wraps to two tiers and renders taller than its minimum. Fail-soft: without
  // ResizeObserver the variable is unset and the veil covers the full screen.
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = barRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const root = document.documentElement;
    const publish = () =>
      root.style.setProperty(TOPBAR_LIVE_HEIGHT_VAR, `${Math.round(el.getBoundingClientRect().height)}px`);
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(el);
    return () => {
      observer.disconnect();
      root.style.removeProperty(TOPBAR_LIVE_HEIGHT_VAR);
    };
  }, []);
  // ═══ Top bar — v7 visual language: solid bg, hairline border, two-tier label/value pattern ═══
  return (
      <div
        ref={barRef}
        data-testid="game-topbar"
        className="w-full flex items-center relative z-30 flex-shrink-0"
        style={{
          background: 'var(--bg-deep)',
          borderBottom: '1px solid var(--border-subtle)',
          minHeight: 'var(--topbar-height)',
          paddingTop: '4px',
          paddingBottom: '4px',
          paddingLeft: 'var(--topbar-padding-x)',
          paddingRight: 'var(--topbar-padding-x)',
          gap: 'var(--topbar-gap)',
        }}
      >
        {/* LEFT GROUP: identity · time · essence */}
        <div className="flex items-center flex-1 min-w-0" style={{ gap: 'var(--topbar-gap)' }}>
          {/* IdentityChip superseded by AscendantBar (THR-184) */}

          {/* Time controls */}
          {shown('time_controls') && (
          <SimulationControls
            season={seasonName}
            year={year}
            running={running}
            held={clockHeld}
            heldBy={clockHeldBy}
            answerStatus={clockAnswerStatus}
            firstRunPrompt={firstRunPrompt}
            speed={speed}
            onToggle={handleToggleRunning}
            onStep={doTick}
            onSpeedChange={setSpeed}
            compact
          />
          )}

          {/* THR-1837 — the one standing direction line, until the first chapter is seen through */}
          {directionLine}

          {/* EssencePanel superseded by AscendantBar (THR-184) */}

          {/* THR-1893: the World-Soul line moved to the head of the Chronicle (frame/LedgerRail). */}

          {/* THR-1894: Attention moved to the god rail, under essence (frame/GodRail). */}
        </div>

        {/* Group divider — hairline, neutral; gold reserved for active states */}
        <div
          className="w-px self-stretch ml-auto flex-shrink-0"
          style={{ background: 'var(--border-subtle)' }}
        />

        {/* RIGHT GROUP: doom · mandate · alerts · rivals · debug — spacing-only separation */}
        {/* THR-1814: not `inert` — hover and focus stay live under a veil so Doom and
            Omen still explain themselves (Laws 17, 25). Presses are swallowed instead,
            because every panel in this group opens beneath the veil's z-band. */}
        <div
          className="flex items-center flex-shrink-0"
          data-testid="topbar-right-group"
          aria-disabled={encounterOpen || undefined}
          onClickCapture={encounterOpen ? swallowLockedPress : undefined}
          onKeyDownCapture={encounterOpen ? swallowLockedKey : undefined}
          style={{
            gap: 'var(--topbar-gap)',
            opacity: encounterOpen ? TOPBAR_INERT_OPACITY : undefined,
            transition: 'opacity 0.2s ease',
          }}
        >
          {showDoom && (
          <div
            role="button" tabIndex={0}
            onClick={() => { if (!encounterOpen) setDoomDetailOpen(true); }}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!encounterOpen) setDoomDetailOpen(true); } }}
            className="cursor-pointer"
            data-newly-revealed={opening?.newly.has('doom') ? 'true' : undefined}
            style={{ minWidth: '140px', ...(opening?.newly.has('doom') ? NEWLY_REVEALED_STYLE : {}) }}
            aria-label="View doom clock details"
            aria-disabled={encounterOpen || undefined}
          >
            <DoomBar
              definition={gameState.doomDefinition}
              state={gameState.doomClock}
              journeyLabel={doomJourneyLabel}
              locked={encounterOpen}
            />
          </div>
          )}
          {showOmens && gameState.omenState?.primary && (
            <>
              <div className="w-px self-stretch" style={{ background: 'var(--border-subtle)' }} />
              <div {...ring('omen')}>
                <OmenIndicator
                  omenState={gameState.omenState}
                  currentTick={gameState.tick}
                  locked={encounterOpen}
                />
              </div>
            </>
          )}
          {/* MandateTracker superseded by AscendantBar (THR-184) */}
          {/* AlertBar disabled */}
          {showRivals && (
            <RivalsButton
              definitions={gameState.rivalDefinitions}
              states={gameState.rivalStates}
              onOpenChange={onRivalsOpenChange}
            />
          )}
          {/* Notables intent panel (THR-630) */}
          {showNotables && <div {...ring('notables')}><NotablesButton gameState={gameState} onOpenChange={onNotablesOpenChange} /></div>}
          {/* Read the Threads — divine digest review */}
          {shown('read_threads') && (
          <IconButton
            icon={<span>📖</span>}
            active={readThreadsOpen}
            onClick={() => setReadThreadsOpen(true)}
            title="Read the Threads"
            aria-label="Read the Threads"
          />
          )}
          {shown('settings') && (
          <div className="flex items-center gap-1" style={{ position: 'relative' }}>
            <IconButton
              data-testid="settings-toggle"
              icon={<span>⚙</span>}
              active={settingsPanelOpen}
              onClick={() => setSettingsPanelOpen(v => !v)}
              title="Settings"
              aria-label="Settings"
            />
            <SettingsPanel
              open={settingsPanelOpen}
              onClose={() => setSettingsPanelOpen(false)}
              fogDisabled={fogDisabled}
              onToggleFog={() => setFogDisabled(v => !v)}
              debugPanelOpen={debugPanelOpen}
              onToggleDebug={handleToggleDebug}
              showOrganicShore={showOrganicShore}
              onToggleOrganicShore={() => setShowOrganicShore(v => !v)}
              notificationPrefs={notificationPrefs}
              onToggleNotificationCategory={toggleNotifCategory}
              onSetNotificationMode={setNotifMode}
              onResetNotificationPrefs={resetNotifPrefs}
              musicVolume={musicVolume}
              onMusicVolume={handleMusicVolume}
              bgVolume={bgVolume}
              onBgVolume={handleBgVolume}
              uiVolume={uiVolume}
              onUiVolume={handleUiVolume}
              audioMuted={audioMuted}
              onToggleAudioMute={handleToggleAudioMute}
              recordingTrouble={recordingTrouble}
              onToggleRecordTrouble={handleToggleRecordTrouble}
              includeWorldInSnapshot={includeWorldInSnapshot}
              onToggleIncludeWorld={handleToggleIncludeWorld}
              onSaveSnapshot={handleSaveSnapshot}
              {...(onExitToTitle ? { onExitToTitle } : {})}
              {...(onToggleShowEveryPanel ? { showEveryPanel, onToggleShowEveryPanel } : {})}
            />
          </div>
          )}
        </div>
      </div>
  );
}
