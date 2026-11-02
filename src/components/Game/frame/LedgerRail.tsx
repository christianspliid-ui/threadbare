/**
 * LedgerRail — the right rail of the game screen: your threads and the story so far
 * (THR-1881 host; THR-1893 builds it, frame plan § F7–F8).
 *
 * Drawn from `LEDGER_RAIL_SECTIONS` (Threads, then the Chronicle) through
 * `LEDGER_SECTION_COMPONENTS`; the Chronicle carries the World-Soul line and the tabs
 * Now · Years · Ledger. World Pulse retired with this slice: its speed stepper went to
 * the top bar's Time slot, its mood lines to the World-Soul line, and its counts went.
 * The Chapter Ledger launcher became the Ledger tab.
 *
 * The rail folds to a 56 px strip (`LedgerStrip`) when the player folds it (`L`, the
 * Fold control; remembered) or while the docked Inspector is open. With the Inspector
 * open a strip press opens the flyout — the full rail floating over the Inspector's
 * edge — instead of unfolding. During a Stage moment the rail is hidden (THR-1892
 * adds the read). Precedence: hidden › strip › open (`ledgerFold.ts`).
 *
 * ─── Constants ───────────────────────────────────────────────────
 * | LEDGER_CHRONICLE_MIN_REM | 12 | Height Threads leaves for the Chronicle; Threads scrolls inside the rest |
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentProps, ReactElement } from 'react';
import type { GameState } from '../../../types/gameState';
import type { OpeningRevealView } from '../GameView/openingReveal';
import { countThreadedChapters } from '../ChapterLedger';
import { ThreadsPanel, threadHasWaitingChapter } from '../ThreadsPanel';
import { ChroniclePanel } from '../ChroniclePanel';
import { Overlay } from '../../shared/Overlay';
import { Icon } from '../../shared/Icon';
import { Tooltip } from '../../shared/Tooltip';
import { Z_BAND } from '../../shared/zBands';
import { useView } from '../../../hooks/useView';
import { ledgerRailSelector } from '../../../engine/views/ledgerRail';
import { rowVisual } from '../../../engine/views/rowVisual';
import type { EntityVisualDescriptor } from '../../../engine/views/entityVisualResolver';
import { LEDGER_RAIL_SECTIONS, LEDGER_TABS, type LedgerSectionId } from '../../../data/frame-registry';
import { LEDGER_FLYOUT_ARIA, LEDGER_FOLD_LABEL, LEDGER_RAIL_ARIA } from '../../../data/frame-content';
import { useGameScreenState } from './GameScreenState';
import { LEDGER_SECTION_COMPONENTS, type LedgerSectionBag } from './ledgerComponents';
import { LedgerStrip, type LedgerStripItem, type LedgerStripItemId } from './LedgerStrip';
import { ledgerFoldReason, ledgerRailState, writeLedgerFoldedPref } from './ledgerFold';
import { isStageOpen } from '../stage/stageState';

/** Height Threads leaves for the Chronicle before Threads scrolls inside its own region. */
export const LEDGER_CHRONICLE_MIN_REM = 12;

type ThreadsPanelProps = ComponentProps<typeof ThreadsPanel>;
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
  // Chronicle
  beforeYouWoke: NonNullable<ChroniclePanelProps['past']>;
}

const SECTIONS = [...LEDGER_RAIL_SECTIONS].sort((a, b) => a.order - b.order);
const LEDGER_TAB_DEF = LEDGER_TABS.find(t => t.id === 'ledger');

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
  beforeYouWoke,
}: LedgerRailProps) {
  const {
    state: { chapterLedgerOpen, chapterLedgerSeenCount, ledgerFoldPref, ledgerFlyout, inspectorOpen, stage },
    setChapterLedgerOpen,
    setChapterLedgerSeenCount,
    setChapterLedgerInitialKey,
    setLedgerFoldPref,
    setLedgerFlyout,
    setLedgerLastSection,
    setInspectorOpen,
  } = useGameScreenState();

  // § F8: the player's fold, the Inspector, and (THR-1892) the Stage.
  const foldInputs = { foldPref: ledgerFoldPref, inspectorOpen, stageOpen: isStageOpen(stage) };
  const railState = ledgerRailState(foldInputs);
  const foldedBy = ledgerFoldReason(foldInputs);
  const flyoutOpen = railState === 'strip' && inspectorOpen && ledgerFlyout !== null;

  useEffect(() => { writeLedgerFoldedPref(ledgerFoldPref); }, [ledgerFoldPref]);
  // The flyout lives only while the Inspector folds the rail.
  useEffect(() => { if (!inspectorOpen && ledgerFlyout !== null) setLedgerFlyout(null); }, [inspectorOpen, ledgerFlyout, setLedgerFlyout]);

  const show = openingReveal.show;
  const entries = gameState.chronicleEntries;
  const chronicleShown = show.chronicle;
  const threadsWaiting = useMemo(
    () => threadedNodes.filter(n => threadHasWaitingChapter(n, retinueActiveEncounters)).length,
    [threadedNodes, retinueActiveEncounters],
  );

  // The strip's Chronicle count: entries since the Chronicle was last on screen.
  const [seenChronicle, setSeenChronicle] = useState(() => entries.length);
  const chronicleOnScreen = chronicleShown && (railState === 'open' || flyoutOpen);
  useEffect(() => {
    if (chronicleOnScreen) setSeenChronicle(entries.length);
  }, [chronicleOnScreen, entries.length]);

  const contentStamp = `${entries.length}|${gameState.chapterArchive?.length ?? 0}|${gameState.unifiedActions.length}`;
  const vm = useView(ledgerRailSelector, { seenChronicle, seenLedger: chapterLedgerSeenCount, threadsWaiting, contentStamp });

  // Opening the reader from the Ledger tab. The dialog hands focus back to its invoker
  // on close (Law 50); for a tab row that would let the next Enter reopen it, so the
  // focus returns to the game surface instead (THR-1648 S5's rule for the old launcher).
  const invokerRef = useRef<HTMLElement | null>(null);
  const openLedger = useCallback((recordKey: string | null) => {
    invokerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setChapterLedgerSeenCount(countThreadedChapters(gameState));
    setChapterLedgerInitialKey(recordKey);
    setChapterLedgerOpen(true);
  }, [gameState, setChapterLedgerSeenCount, setChapterLedgerInitialKey, setChapterLedgerOpen]);
  const ledgerWasOpenRef = useRef(false);
  useEffect(() => {
    const wasOpen = ledgerWasOpenRef.current;
    ledgerWasOpenRef.current = chapterLedgerOpen;
    if (!wasOpen || chapterLedgerOpen) return;
    setChapterLedgerInitialKey(null);
    const frame = requestAnimationFrame(() => {
      const el = invokerRef.current;
      if (el && document.activeElement === el) el.blur();
      invokerRef.current = null;
    });
    return () => cancelAnimationFrame(frame);
  }, [chapterLedgerOpen, setChapterLedgerInitialKey]);
  const markLedgerSeen = useCallback(() => {
    setChapterLedgerSeenCount(countThreadedChapters(gameState));
  }, [gameState, setChapterLedgerSeenCount]);

  // Dev-only lever: force the Inspector input for the fold check (THR-1876 writes it later).
  useEffect(() => {
    if (!import.meta.env.DEV || typeof window === 'undefined') return;
    window.__DEBUG?._registerFrameBridge?.({ setInspectorOpen: (open: boolean) => { setInspectorOpen(open); return open; } });
  }, [setInspectorOpen]);

  // THR-2103 (S7.1) — every threaded row's picture, resolved here so the panel never reads
  // the graph. Rebuilt when the threaded list is (it is rebuilt each tick), and when the
  // god's knowledge of a mortal or the map changes.
  const familiarityMap = gameState.familiarityMap;
  const tiles = gameState.tiles;
  const threadVisuals = useMemo(() => {
    const out: Record<string, EntityVisualDescriptor | null> = {};
    const ctx = { graph: gameState.graph, familiarityMap, tiles };
    for (const node of threadedNodes) out[node.id] = rowVisual(ctx, { kind: node.category, id: node.id, name: node.name });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the graph mutates in place; the list is the rebuild signal
  }, [threadedNodes, familiarityMap, tiles]);

  const sectionRefs = useRef<Partial<Record<LedgerSectionId, HTMLDivElement | null>>>({});

  const bag: LedgerSectionBag = {
    threads: {
      threadedNodes,
      selectedNodeId: selectedThreadNodeId,
      onNodeSelect: handleThreadNodeSelect,
      onCenterOnHex: handleCenterOnHex,
      onZoomToLocation: handleZoomToLocation,
      activeEncounters: retinueActiveEncounters,
      agentEncounterDecisions: latestThreadEncounterDecisions,
      onToggleAttentionMode: handleToggleAttentionMode,
      agentStrategicSummaries,
      appointmentBadges,
      encounterStakesLines,
      encounterBadges,
      onOpenEncounterBadge: handleOpenEncounterBadge,
      tugBadges,
      onAttendTugBadge: attendThreadTug,
      noticeBadges,
      onOpenNoticeBadge: handleOpenNoticeBadge,
      momentBadges,
      onOpenMomentBadge: handleOpenMomentBadge,
      sustainedControls,
      // THR-1500 — `openAgentSheetForId`, not `openAgentProfileForId`.
      // The chip names a champion who need not be the selected mortal
      // (any threaded row can carry one), and the bare opener sets only
      // the modal id while the card is memoised on `selectedAgentId`:
      // the chip then showed nothing, or the previously selected
      // mortal's sheet under the champion's id (Laws 1, 21, 33).
      onChampionChipClick: openAgentSheetForId,
      threadVisuals,
    },
    chronicle: {
      entries,
      currentTick: gameState.tick,
      past: beforeYouWoke,
      vm,
      reveal: {
        worldSoul: show.world_soul,
        ledger: show.chapter_ledger,
        newlyWorldSoul: openingReveal.newly.has('world_soul'),
        newlyLedger: openingReveal.newly.has('chapter_ledger'),
      },
      visible: chronicleOnScreen,
      onOpenLedger: openLedger,
      onLedgerSeen: markLedgerSeen,
    },
  };

  const sectionShown = (id: LedgerSectionId) => (id === 'threads' ? show.threads : chronicleShown);

  const renderBody = (where: 'rail' | 'flyout') => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, padding: 'var(--panel-padding)', gap: 'var(--panel-padding)' }}>
      {/* The header row: the fold control at the right. ThreadsPanel names its own section. */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flex: '0 0 auto' }}>
        {where === 'rail' && (
          <Tooltip id="ui.ledger_fold">
            <button
              type="button"
              data-testid="ledger-fold"
              onClick={() => setLedgerFoldPref(true)}
              aria-label={LEDGER_FOLD_LABEL}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px', minHeight: '2rem', padding: '0 6px',
                background: 'transparent', border: '1px solid transparent', borderRadius: '4px', cursor: 'pointer',
                color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 'var(--text-xs)',
              }}
            >
              {LEDGER_FOLD_LABEL}
              <Icon name="disclosure" size="chip" decorative />
            </button>
          </Tooltip>
        )}
      </div>
      {SECTIONS.filter(s => sectionShown(s.id)).map((s): ReactElement => (
        <div
          key={s.id}
          ref={el => { if (where === 'rail') sectionRefs.current[s.id] = el; }}
          data-ledger-section={s.id}
          style={s.id === 'threads'
            ? { flex: '0 1 auto', minHeight: 0, overflowY: 'auto' }
            : { flex: '1 1 auto', minHeight: `${LEDGER_CHRONICLE_MIN_REM}rem`, display: 'flex', flexDirection: 'column' }}
        >
          {LEDGER_SECTION_COMPONENTS[s.id](bag)}
        </div>
      ))}
    </div>
  );

  const stripItems: LedgerStripItem[] = [
    ...SECTIONS.filter(s => sectionShown(s.id)).map(s => ({
      id: s.id as LedgerStripItemId,
      label: s.label,
      tooltipId: s.tooltipId,
      strip: s.strip,
      count: vm.strip[s.id],
    })),
    ...(LEDGER_TAB_DEF?.strip && show.chapter_ledger && chronicleShown
      ? [{
          id: 'ledger' as const,
          label: LEDGER_TAB_DEF.stripLabel ?? LEDGER_TAB_DEF.label,
          tooltipId: LEDGER_TAB_DEF.tooltipId ?? 'ui.chapter_ledger',
          strip: LEDGER_TAB_DEF.strip,
          count: vm.strip.ledger,
        }]
      : []),
  ];

  const onStripItem = (id: LedgerStripItemId) => {
    const section: LedgerSectionId = id === 'threads' ? 'threads' : 'chronicle';
    setLedgerLastSection(section);
    if (inspectorOpen) {
      setLedgerFlyout(prev => (prev === section ? null : section));
      return;
    }
    setLedgerFoldPref(false);
    requestAnimationFrame(() => sectionRefs.current[section]?.scrollIntoView?.({ block: 'nearest' }));
  };

  if (railState === 'hidden') return null;

  return (
    <aside
      data-testid="right-sidebar"
      aria-label={LEDGER_RAIL_ARIA}
      data-ledger-state={railState}
      data-folded={railState === 'strip' ? 'true' : 'false'}
      data-folded-by={foldedBy ?? ''}
      data-flyout={flyoutOpen ? ledgerFlyout ?? '' : ''}
      className="flex-shrink-0"
      style={{
        width: railState === 'strip' ? 'var(--rail-strip-w)' : 'var(--rail-right-w)', // THR-1819: 340/420 open, 56 folded
        height: '100%',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, var(--bg-deep), var(--bg-abyss))',
        borderLeft: '1px solid var(--border-subtle)',
      }}
    >
      {railState === 'open' ? renderBody('rail') : (
        <LedgerStrip items={stripItems} onUnfold={() => onStripItem('threads')} onItem={onStripItem} />
      )}
      <Overlay
        open={flyoutOpen}
        onClose={() => setLedgerFlyout(null)}
        label={LEDGER_FLYOUT_ARIA}
        backdrop="none"
        closeOnBackdrop
        modal={false}
        animation="fade"
        zIndexOverride={Z_BAND.hud}
        surfaceProps={{ 'data-testid': 'ledger-flyout' }}
        surfaceStyle={{
          position: 'absolute',
          top: 'var(--topbar-height)',
          bottom: 0,
          right: 'var(--rail-strip-w)',
          width: 'var(--rail-right-w)',
          background: 'linear-gradient(180deg, var(--bg-deep), var(--bg-abyss))',
          borderLeft: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-panel)',
          overflow: 'hidden',
        }}
      >
        {renderBody('flyout')}
      </Overlay>
    </aside>
  );
}
