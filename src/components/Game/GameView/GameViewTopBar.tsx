import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react';

import { SimulationControls } from '../SimulationControls';
import { DoomBar } from '../DoomBar';
import { OmenIndicator } from '../OmenIndicator';
import { RivalsButton } from '../RivalsButton';
import { NotablesButton } from '../NotablesButton';
import { SettingsPanel } from '../SettingsPanel';
import { AttentionPoolIndicator } from '../AttentionPoolIndicator';
import { IconButton } from '../../shared/IconButton';
import { WorldSoulIndicator } from '../../WorldSoulIndicator';

import type { GameState } from '../../../types/gameState';
import type { FirstScreenReveal } from './firstScreenReveal';
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
  /**
   * THR-1724 — an encounter veil is open below the bar. The right group's
   * panels (settings, rivals, notables, doom) open beneath the veil's z-band,
   * so while it is open they go inert and dim rather than take a click that
   * shows nothing (Laws 21, 25). The time control stays live (THR-1711).
   */
  encounterOpen?: boolean;
  speed: number;
  handleToggleRunning: () => void;
  doTick: () => void;
  setSpeed: (speed: number) => void;

  // Attention pool
  attentionPool: number;
  attentionCapacity: number;

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
}

export function GameViewTopBar({
  gameState,
  seasonName,
  year,
  running,
  clockHeld = false,
  clockHeldBy,
  encounterOpen = false,
  speed,
  handleToggleRunning,
  doTick,
  setSpeed,
  attentionPool,
  attentionCapacity,
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
}: GameViewTopBarProps) {
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
          <SimulationControls
            season={seasonName}
            year={year}
            running={running}
            held={clockHeld}
            heldBy={clockHeldBy}
            speed={speed}
            onToggle={handleToggleRunning}
            onStep={doTick}
            onSpeedChange={setSpeed}
            compact
          />

          {/* EssencePanel superseded by AscendantBar (THR-184) */}

          {/* WorldSoulIndicator — prose description of dominant sphere */}
          {gameState.worldSoul?.aggregate && (
            <>
              <div className="w-px self-stretch" style={{ background: 'var(--border-subtle)' }} />
              <WorldSoulIndicator aggregate={gameState.worldSoul.aggregate} />
            </>
          )}

          {/* Attention pool indicator — shows how much focused attention the ascendant has left */}
          {(() => {
            const ascNode = gameState.graph.getNode(gameState.ascendantId);
            const attentionRegen = (ascNode?.properties?.attentionRegen as number) ?? 0.4;
            return (
              <>
                <div className="w-px self-stretch" style={{ background: 'var(--border-subtle)' }} />
                <AttentionPoolIndicator
                  attentionPool={attentionPool}
                  attentionCapacity={attentionCapacity}
                  attentionRegen={attentionRegen}
                />
              </>
            );
          })()}
        </div>

        {/* Group divider — hairline, neutral; gold reserved for active states */}
        <div
          className="w-px self-stretch ml-auto flex-shrink-0"
          style={{ background: 'var(--border-subtle)' }}
        />

        {/* RIGHT GROUP: doom · mandate · alerts · rivals · debug — spacing-only separation */}
        <div
          className="flex items-center flex-shrink-0"
          data-testid="topbar-right-group"
          inert={encounterOpen}
          aria-disabled={encounterOpen || undefined}
          style={{
            gap: 'var(--topbar-gap)',
            opacity: encounterOpen ? TOPBAR_INERT_OPACITY : undefined,
            transition: 'opacity 0.2s ease',
          }}
        >
          {showDoom && (
          <div
            role="button" tabIndex={0}
            onClick={() => setDoomDetailOpen(true)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDoomDetailOpen(true); } }}
            className="cursor-pointer"
            style={{ minWidth: '140px' }}
            aria-label="View doom clock details"
          >
            <DoomBar
              definition={gameState.doomDefinition}
              state={gameState.doomClock}
              journeyLabel={doomJourneyLabel}
            />
          </div>
          )}
          {showOmens && gameState.omenState?.primary && (
            <>
              <div className="w-px self-stretch" style={{ background: 'var(--border-subtle)' }} />
              <OmenIndicator
                omenState={gameState.omenState}
                currentTick={gameState.tick}
              />
            </>
          )}
          {/* MandateTracker superseded by AscendantBar (THR-184) */}
          {/* AlertBar disabled */}
          {showRivals && (
            <RivalsButton
              definitions={gameState.rivalDefinitions}
              states={gameState.rivalStates}
            />
          )}
          {/* Notables intent panel (THR-630) */}
          {showNotables && <NotablesButton gameState={gameState} />}
          {/* Read the Threads — divine digest review */}
          <IconButton
            icon={<span>📖</span>}
            active={readThreadsOpen}
            onClick={() => setReadThreadsOpen(true)}
            title="Read the Threads"
            aria-label="Read the Threads"
          />
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
            />
          </div>
        </div>
      </div>
  );
}
