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
import { Icon } from '../../shared/Icon';
import { Button } from '../../shared/Button';
import { Tooltip } from '../../shared/Tooltip';
import { NeedsYou } from '../frame/NeedsYou';
import { useTopBarYield } from '../frame/topBarYield';
import { TOP_BAR_ITEMS, type TopBarItemDef, type TopBarItemId, type TopBarYieldStep } from '../../../data/frame-registry';
import { getUITooltip } from '../../../data/ui-content';
import type { NeedsYouRowVM, NeedsYouVM } from '../../../engine/views/needsYou';

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
export const TOPBAR_INERT_OPACITY = 0.4;

/**
 * THR-1875 (frame plan § F3) — the Find slot's minimum between the groups. It shrinks
 * first (yield step 1), to zero while no `find` entry exists.
 */
export const TOP_BAR_CENTRE_MIN_REM = 15;

/** THR-1875 — the debug lever's display-only overrides for the one-row check (§ Debug inspection). */
export interface TopBarFrameFixture {
  revealAll?: boolean;
  omenName?: string;
  heldBy?: string;
}

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
  /**
   * THR-1837 — the standing direction line, rendered after the time controls. THR-1875:
   * a function receives `short` (yield step 5) and returns the short form.
   */
  directionLine?: ReactNode | ((short: boolean) => ReactNode);
  /** THR-1837 — the "Show every panel" setting. */
  showEveryPanel?: boolean;
  onToggleShowEveryPanel?: () => void;
  /** THR-1853 — the Rivals and Notables dropdowns report their open state up to GameView. */
  onRivalsOpenChange?: (open: boolean) => void;
  onNotablesOpenChange?: (open: boolean) => void;

  /** THR-1875 (§ F4) — Needs you: the queue, its open state, the gift raise, a row's press. */
  needsYou?: NeedsYouVM;
  needsYouOpen?: boolean;
  setNeedsYouOpen?: (open: boolean) => void;
  needsYouRaised?: boolean;
  /** An interrupt holds the clock: Needs-you rows are read-only. */
  needsYouGuarded?: boolean;
  onPressNeedsYouRow?: (row: NeedsYouRowVM) => void;
  /** THR-1875 — the avatar's arrival names the pause (§ F4). */
  namedPause?: string;
  /** THR-1875 — alerts the router trimmed at its safety cap (Law 49), shown in getFrameState. */
  alertsTrimmedAtCap?: number;
  /** THR-1875 — `__DEBUG.setFrameFixture` overrides for the one-row check. */
  frameFixture?: TopBarFrameFixture | null;
  /** THR-1915 — the Find field (`FindBox`), drawn in the centre slot. Absent → the slot stays empty. */
  findSlot?: ReactNode;
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
  needsYou,
  needsYouOpen = false,
  setNeedsYouOpen,
  needsYouRaised = false,
  needsYouGuarded = false,
  onPressNeedsYouRow,
  namedPause,
  alertsTrimmedAtCap = 0,
  frameFixture,
  findSlot,
}: GameViewTopBarProps) {
  const revealAll = frameFixture?.revealAll === true;
  const shown = (id: OpeningRevealSurfaceId) => revealAll || (opening?.show[id] ?? true);
  /** The gold ring on a panel that just arrived (THR-1837 U4). */
  const ring = (id: OpeningRevealSurfaceId) =>
    opening?.newly.has(id) ? { 'data-newly-revealed': 'true', style: NEWLY_REVEALED_STYLE } : {};
  /** THR-1875 — an item is on the bar when its reveal surface and its THR-1648 gate both hold. */
  const gated = (item: TopBarItemDef) =>
    revealAll || ((item.revealSurface ? shown(item.revealSurface) : true)
      && (item.firstScreenGate ? (reveal?.[item.firstScreenGate] ?? true) : true));

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
  const heldByShown = frameFixture?.heldBy ?? clockHeldBy;
  const clockHeldShown = clockHeld || !!frameFixture?.heldBy;
  const omenItem = TOP_BAR_ITEMS.find(i => i.id === 'omen');
  const omenRendered = !!omenItem && gated(omenItem) && !!gameState.omenState?.primary;
  const contentKey = [
    TOP_BAR_ITEMS.filter(gated).map(i => i.id).join(','),
    heldByShown ?? '', clockAnswerStatus ?? '', namedPause ?? '',
    omenRendered ? (frameFixture?.omenName ?? gameState.omenState?.primary?.name ?? '') : '',
    needsYou?.count ? 'ny' : '', directionLine ? 'dir' : '', running ? 'r' : 'p', firstRunPrompt ? 'f' : '',
  ].join('|');
  const yielded = useTopBarYield(barRef, contentKey);
  const y = new Set<TopBarYieldStep>(yielded);

  /** One component per entry (Law 58): a missing id is a type error. */
  const ITEM: Record<TopBarItemId, () => ReactNode> = {
    find: () => findSlot ?? null,
    time: () => (
      <SimulationControls
        season={seasonName}
        year={year}
        running={running}
        held={clockHeldShown}
        heldBy={heldByShown}
        answerStatus={clockAnswerStatus}
        firstRunPrompt={firstRunPrompt}
        namedPause={namedPause}
        statusNarrow={y.has('time_status')}
        speed={speed}
        onToggle={handleToggleRunning}
        onStep={doTick}
        onSpeedChange={setSpeed}
        compact
      />
    ),
    needs_you: () => (needsYou && setNeedsYouOpen ? (
      <NeedsYou
        vm={needsYou}
        open={needsYouOpen}
        onOpenChange={setNeedsYouOpen}
        guarded={needsYouGuarded}
        raised={needsYouRaised}
        trimmedAtCap={alertsTrimmedAtCap}
        onPressRow={row => onPressNeedsYouRow?.(row)}
      />
    ) : null),
    direction_line: () => (typeof directionLine === 'function' ? directionLine(y.has('direction_short')) : directionLine),
    doom: () => (
      <div
        role="button" tabIndex={0}
        onClick={() => { if (!encounterOpen) setDoomDetailOpen(true); }}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!encounterOpen) setDoomDetailOpen(true); } }}
        className="cursor-pointer min-w-0"
        data-newly-revealed={opening?.newly.has('doom') ? 'true' : undefined}
        style={opening?.newly.has('doom') ? NEWLY_REVEALED_STYLE : undefined}
        aria-label="View doom clock details"
        aria-disabled={encounterOpen || undefined}
      >
        <DoomBar
          definition={gameState.doomDefinition}
          state={gameState.doomClock}
          journeyLabel={doomJourneyLabel}
          locked={encounterOpen}
          hideStageName={y.has('doom_name')}
        />
      </div>
    ),
    omen: () => (omenRendered ? (
      <div {...ring('omen')}>
        <OmenIndicator
          omenState={gameState.omenState}
          currentTick={gameState.tick}
          locked={encounterOpen}
          hideName={y.has('omen_name')}
          nameOverride={frameFixture?.omenName}
        />
      </div>
    ) : null),
    rivals: () => (
      <RivalsButton
        definitions={gameState.rivalDefinitions}
        states={gameState.rivalStates}
        onOpenChange={onRivalsOpenChange}
      />
    ),
    notables: () => <div {...ring('notables')}><NotablesButton gameState={gameState} onOpenChange={onNotablesOpenChange} /></div>,
    read_threads: () => (
      <LabelledButton id="read_threads" active={readThreadsOpen} onClick={() => setReadThreadsOpen(true)} />
    ),
    settings: () => (
      <div className="flex items-center gap-1" style={{ position: 'relative' }}>
        <LabelledButton
          id="settings"
          active={settingsPanelOpen}
          onClick={() => setSettingsPanelOpen(v => !v)}
          testId="settings-toggle"
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
    ),
  };

  const renderItem = (item: TopBarItemDef) => {
    if (!gated(item)) return null;
    const guarded = item.guardedWhileEncounter && encounterOpen;
    return (
      <div
        key={item.id}
        data-topbar-item={item.id}
        data-topbar-guarded={guarded ? 'true' : undefined}
        className="flex items-center flex-shrink-0 min-w-0"
      >
        {ITEM[item.id]()}
      </div>
    );
  };
  const byOrder = (a: TopBarItemDef, b: TopBarItemDef) => a.order - b.order;
  const left = TOP_BAR_ITEMS.filter(i => i.group === 'left').sort(byOrder);
  const centre = TOP_BAR_ITEMS.filter(i => i.group === 'centre').sort(byOrder);
  const right = TOP_BAR_ITEMS.filter(i => i.group === 'right').sort(byOrder);
  const rightLocked = encounterOpen && right.some(i => i.guardedWhileEncounter);

  // ═══ Top bar — one row of `--topbar-height`, drawn from TOP_BAR_ITEMS (THR-1875, § F3) ═══
  return (
      <div
        ref={barRef}
        data-testid="game-topbar"
        data-topbar-yielded={yielded.join(',')}
        className="w-full flex items-center relative z-30 flex-shrink-0"
        style={{
          background: 'var(--bg-deep)',
          borderBottom: '1px solid var(--border-subtle)',
          height: 'var(--topbar-height)',
          flexWrap: 'nowrap',
          overflow: 'hidden',
          paddingLeft: 'var(--topbar-padding-x)',
          paddingRight: 'var(--topbar-padding-x)',
          gap: 'var(--topbar-gap)',
        }}
      >
        {/* LEFT GROUP: time · Needs you · the direction line */}
        <div className="flex items-center flex-shrink-0" style={{ gap: 'var(--topbar-gap)' }}>
          {left.map(renderItem)}
        </div>

        {/* CENTRE: Find (THR-1915). Empty space while Find is gated or absent, never a stub. */}
        <div
          data-testid="topbar-centre"
          aria-hidden={findSlot && centre.some(gated) ? undefined : 'true'}
          className="flex items-center justify-center"
          style={{ flex: '1 1 0', minWidth: y.has('centre') ? 0 : `${TOP_BAR_CENTRE_MIN_REM}rem` }}
        >
          {findSlot && centre.map(item => (gated(item) ? (
            <div key={item.id} data-topbar-item={item.id} data-topbar-guarded={item.guardedWhileEncounter && encounterOpen ? 'true' : undefined} className="flex items-center justify-center min-w-0" style={{ width: '100%' }}>
              {ITEM[item.id]()}
            </div>
          ) : null))}
        </div>

        {/* RIGHT GROUP: doom · omen · rivals · notables · read the threads · settings.
            THR-1814: not `inert` — hover and focus stay live under a veil so Doom and
            Omen still explain themselves (Laws 17, 25). Presses are swallowed instead,
            because every panel in this group opens beneath the veil's z-band. */}
        <div
          className="flex items-center flex-shrink-0"
          data-testid="topbar-right-group"
          aria-disabled={rightLocked || undefined}
          onClickCapture={rightLocked ? swallowLockedPress : undefined}
          onKeyDownCapture={rightLocked ? swallowLockedKey : undefined}
          style={{
            gap: 'var(--topbar-gap)',
            opacity: rightLocked ? TOPBAR_INERT_OPACITY : undefined,
            transition: 'opacity 0.2s ease',
          }}
        >
          {right.map(renderItem)}
        </div>
      </div>
  );
}

/** A labelled top-bar button: the carved icon and the word, always (THR-1834 § 5). */
function LabelledButton({ id, active, onClick, testId }: { id: TopBarItemId; active: boolean; onClick: () => void; testId?: string }) {
  const item = TOP_BAR_ITEMS.find(i => i.id === id);
  if (!item) return null;
  const tip = item.tooltipId ? getUITooltip(item.tooltipId) : null;
  const button = (
    <Button
      variant="ghost"
      className="focus-ring"
      data-testid={testId}
      aria-label={item.label}
      aria-pressed={active}
      onClick={onClick}
      style={{
        gap: 'var(--space-1)',
        height: '2rem',
        padding: '0 var(--space-2)',
        borderRadius: 'var(--radius-sm, 4px)',
        border: '1px solid transparent',
        background: active ? 'var(--bg-hover)' : 'transparent',
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
        fontFamily: 'var(--font-body)',
        fontWeight: 700,
        fontSize: 'var(--text-sm)',
        whiteSpace: 'nowrap',
        cursor: 'pointer',
      }}
    >
      {item.icon && <Icon name={item.icon} size="chip" decorative />}
      <span>{item.label}</span>
    </Button>
  );
  return tip && item.tooltipId ? <Tooltip id={item.tooltipId} label={tip.label} desc={tip.desc}>{button}</Tooltip> : button;
}
