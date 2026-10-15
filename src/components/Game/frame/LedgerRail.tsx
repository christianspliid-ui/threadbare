/**
 * LedgerRail — the right rail of the game screen: ThreadsPanel, the Chapter
 * Ledger launcher, World Pulse and the Chronicle, moved verbatim out of GameView
 * (THR-1881 split step e).
 *
 * Moves only: the props are GameView's own values under GameView's own names.
 * The ledger's open flag and seen-count come from `GameScreenState`, which
 * DialogHost reads to render the ledger. The launcher's focus ref and its
 * blur-on-close effect read nothing else, so they live here with the button.
 */
import { useEffect, useRef } from 'react';
import type { ComponentProps } from 'react';
import type { GameState } from '../../../types/gameState';
import type { OpeningRevealView } from '../GameView/openingReveal';
import { NEWLY_REVEALED_STYLE } from '../GameView/openingReveal';
import { unreadChapterCount } from '../GameView/firstScreenReveal';
import { countThreadedChapters } from '../ChapterLedger';
import { ThreadsPanel } from '../ThreadsPanel';
import { WorldPulse } from '../WorldPulse';
import { ChroniclePanel } from '../ChroniclePanel';
import { useGameScreenState } from './GameScreenState';

type ThreadsPanelProps = ComponentProps<typeof ThreadsPanel>;
type WorldPulseProps = ComponentProps<typeof WorldPulse>;
type ChroniclePanelProps = ComponentProps<typeof ChroniclePanel>;

export interface LedgerRailProps {
  gameState: GameState;
  openingReveal: OpeningRevealView;
  // ThreadsPanel
  threadedNodes: ThreadsPanelProps['threadedNodes'];
  selectedThreadNodeId: string | null;
  handleThreadNodeSelect: ThreadsPanelProps['onNodeSelect'];
  handleCenterOnHex: ThreadsPanelProps['onCenterOnHex'];
  handleZoomToLocation: ThreadsPanelProps['onZoomToLocation'];
  retinueActiveEncounters: ThreadsPanelProps['activeEncounters'];
  latestThreadEncounterDecisions: ThreadsPanelProps['agentEncounterDecisions'];
  handleToggleAttentionMode: ThreadsPanelProps['onToggleAttentionMode'];
  agentStrategicSummaries: ThreadsPanelProps['agentStrategicSummaries'];
  appointmentBadges: ThreadsPanelProps['appointmentBadges'];
  encounterStakesLines: ThreadsPanelProps['encounterStakesLines'];
  encounterBadges: ThreadsPanelProps['encounterBadges'];
  handleOpenEncounterBadge: ThreadsPanelProps['onOpenEncounterBadge'];
  tugBadges: ThreadsPanelProps['tugBadges'];
  attendThreadTug: ThreadsPanelProps['onAttendTugBadge'];
  noticeBadges: ThreadsPanelProps['noticeBadges'];
  handleOpenNoticeBadge: ThreadsPanelProps['onOpenNoticeBadge'];
  momentBadges: ThreadsPanelProps['momentBadges'];
  handleOpenMomentBadge: ThreadsPanelProps['onOpenMomentBadge'];
  sustainedControls: ThreadsPanelProps['sustainedControls'];
  openAgentSheetForId: NonNullable<ThreadsPanelProps['onChampionChipClick']>;
  // World Pulse
  seasonName: WorldPulseProps['season'];
  year: WorldPulseProps['year'];
  speed: WorldPulseProps['speed'];
  setSpeed: WorldPulseProps['onSpeedChange'];
  // Chronicle
  beforeYouWoke: NonNullable<ChroniclePanelProps['past']>;
}

export function LedgerRail({
  gameState,
  openingReveal,
  threadedNodes,
  selectedThreadNodeId,
  handleThreadNodeSelect,
  handleCenterOnHex,
  handleZoomToLocation,
  retinueActiveEncounters,
  latestThreadEncounterDecisions,
  handleToggleAttentionMode,
  agentStrategicSummaries,
  appointmentBadges,
  encounterStakesLines,
  encounterBadges,
  handleOpenEncounterBadge,
  tugBadges,
  attendThreadTug,
  noticeBadges,
  handleOpenNoticeBadge,
  momentBadges,
  handleOpenMomentBadge,
  sustainedControls,
  openAgentSheetForId,
  seasonName,
  year,
  speed,
  setSpeed,
  beforeYouWoke,
}: LedgerRailProps) {
  const {
    state: { chapterLedgerOpen, chapterLedgerSeenCount },
    setChapterLedgerOpen,
    setChapterLedgerSeenCount,
  } = useGameScreenState();

  const chapterLedgerButtonRef = useRef<HTMLButtonElement>(null);
  const chapterLedgerWasOpenRef = useRef(false);
  useEffect(() => {
    const wasOpen = chapterLedgerWasOpenRef.current;
    chapterLedgerWasOpenRef.current = chapterLedgerOpen;
    if (!wasOpen || chapterLedgerOpen) return;
    // THR-1648 (S5): the dialog hands focus back to its invoker (Law 50), which
    // for the ledger is the launcher — so the next Enter reopened it. Return
    // focus to the game surface instead. The dialog's cleanup runs before this
    // effect in the same commit; the frame delay covers any later restore.
    const frame = requestAnimationFrame(() => {
      const btn = chapterLedgerButtonRef.current;
      if (btn && document.activeElement === btn) btn.blur();
    });
    return () => cancelAnimationFrame(frame);
  }, [chapterLedgerOpen]);

  return (
    <div
      data-testid="right-sidebar"
      className="flex-shrink-0 overflow-y-auto"
      style={{
        width: 'var(--rail-right-w)', // THR-1819 Ledger rail: 340 at 1080p, 420 at 1440p
        background: 'linear-gradient(180deg, var(--bg-deep), var(--bg-abyss))',
        borderLeft: '1px solid var(--border-subtle)',
      }}
    >
      <div style={{ padding: 'var(--panel-padding)' }}>
        {openingReveal.show.threads && (
        <ThreadsPanel
          threadedNodes={threadedNodes}
          selectedNodeId={selectedThreadNodeId}
          onNodeSelect={handleThreadNodeSelect}
          onCenterOnHex={handleCenterOnHex}
          onZoomToLocation={handleZoomToLocation}
          activeEncounters={retinueActiveEncounters}
          agentEncounterDecisions={latestThreadEncounterDecisions}
          onToggleAttentionMode={handleToggleAttentionMode}
          agentStrategicSummaries={agentStrategicSummaries}
          appointmentBadges={appointmentBadges}
          encounterStakesLines={encounterStakesLines}
          encounterBadges={encounterBadges}
          onOpenEncounterBadge={handleOpenEncounterBadge}
          tugBadges={tugBadges}
          onAttendTugBadge={attendThreadTug}
          noticeBadges={noticeBadges}
          onOpenNoticeBadge={handleOpenNoticeBadge}
          momentBadges={momentBadges}
          onOpenMomentBadge={handleOpenMomentBadge}
          sustainedControls={sustainedControls}
          // THR-1500 — `openAgentSheetForId`, not `openAgentProfileForId`.
          // The chip names a champion who need not be the selected mortal
          // (any threaded row can carry one), and the bare opener sets only
          // the modal id while the card is memoised on `selectedAgentId`:
          // the chip then showed nothing, or the previously selected
          // mortal's sheet under the champion's id (Laws 1, 21, 33).
          onChampionChipClick={openAgentSheetForId}
        />
        )}
        {/* THR-603: open the Chapter Ledger — every encounter, always readable.
            THR-1837: it arrives with The First's first chapter. */}
        {openingReveal.show.chapter_ledger && (
        <button
          ref={chapterLedgerButtonRef}
          type="button"
          data-testid="chapter-ledger-launcher"
          onClick={() => {
            setChapterLedgerSeenCount(countThreadedChapters(gameState));
            setChapterLedgerOpen(true);
          }}
          data-newly-revealed={openingReveal.newly.has('chapter_ledger') ? 'true' : undefined}
          style={{
            ...(openingReveal.newly.has('chapter_ledger') ? NEWLY_REVEALED_STYLE : {}),
            marginTop: 'var(--panel-padding)',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '8px',
            background: 'var(--bg-panel, rgba(255,255,255,0.02))',
            border: '1px solid var(--border-subtle, #40382c)',
            borderRadius: '8px',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: 'var(--text-sm)',
          }}
          aria-label="Open the Chapter Ledger"
        >
          📖 Chapter Ledger
          <span
            data-testid="chapter-ledger-unread"
            style={{ color: 'var(--text-tertiary, #6a6255)', fontSize: 'var(--text-xs)' }}
            title="New chapters since you last opened the ledger"
          >
            {/* THR-1604: counts what the ledger lists by default (threaded
                chapters), not every encounter the world has archived.
                THR-1648: only the ones not yet seen. */}
            {unreadChapterCount(countThreadedChapters(gameState), chapterLedgerSeenCount)}
          </span>
        </button>
        )}
        {/* THR-1837: World Pulse arrives with A Path Opens. */}
        {openingReveal.show.world_pulse && (
        <div
          data-newly-revealed={openingReveal.newly.has('world_pulse') ? 'true' : undefined}
          style={{ marginTop: 'var(--panel-padding)', ...(openingReveal.newly.has('world_pulse') ? NEWLY_REVEALED_STYLE : {}) }}
        >
          <WorldPulse
            gameState={gameState}
            season={seasonName}
            year={year}
            speed={speed}
            onSpeedChange={setSpeed}
          />
        </div>
        )}
        {/* THR-1656: the chronicle mounts from minute one when the world has a past. */}
        {openingReveal.show.chronicle && (gameState.chronicleEntries.length > 0 || beforeYouWoke.length > 0) && (
          <div style={{ marginTop: 'var(--panel-padding)' }}>
            <ChroniclePanel entries={gameState.chronicleEntries} currentTick={gameState.tick} past={beforeYouWoke} />
          </div>
        )}
      </div>
    </div>
  );
}
