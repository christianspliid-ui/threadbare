import type { Dispatch, SetStateAction } from 'react';

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
export interface GameViewTopBarProps {
  gameState: GameState;

  // Time controls (SimulationControls)
  seasonName: string;
  year: number;
  running: boolean;
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
}

export function GameViewTopBar({
  gameState,
  seasonName,
  year,
  running,
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
}: GameViewTopBarProps) {
  // ═══ Top bar — v7 visual language: solid bg, hairline border, two-tier label/value pattern ═══
  return (
      <div
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
            tick={gameState.tick}
            season={seasonName}
            year={year}
            running={running}
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
          style={{
            gap: 'var(--topbar-gap)',
          }}
        >
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
          {gameState.omenState?.primary && (
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
          <RivalsButton
            definitions={gameState.rivalDefinitions}
            states={gameState.rivalStates}
          />
          {/* Notables intent panel (THR-630) */}
          <NotablesButton gameState={gameState} />
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
            />
          </div>
        </div>
      </div>
  );
}
