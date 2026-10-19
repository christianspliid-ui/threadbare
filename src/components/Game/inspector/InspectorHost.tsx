/**
 * InspectorHost — the Inspector in the game (THR-1911, plan § D1–D3, § D5).
 *
 * Mounted by GameView's composition root between the map and the Ledger rail. It reads
 * the Inspector slice of `GameScreenState` (subject, history, size, pin), builds the open
 * subject's page through the view-model seam (`buildSubjectPage` — no graph reads here,
 * THR-1822) and renders it with `InspectorPage` at its size:
 *
 * - **Docked** and **wide** sit beside the map as a flex item; the map canvas shrinks.
 * - **Full** covers the map region right of the god rail and holds the clock (GameView
 *   folds it into the auto-pause and names it "the full view"); a pause-tier interrupt
 *   steps it down to docked (GameView's effect).
 *
 * Movement: back / forward / the trail walk the history; the pin keeps a map click from
 * replacing the subject; the eye flies the camera there (`focusOn`); `W` and the widen
 * button cycle the size; Esc steps one down (full → wide → docked → closed) through the
 * escape stack, below every dialog. Focus moves to the page heading when a subject opens
 * and returns to the invoker when the Inspector closes (Law 50; non-modal, no trap).
 *
 * THR-1892 (plan THR-1877 § D7): while a moment plays on the Stage the Inspector folds and
 * keeps its subject. A name clicked on the Stage opens its page **over the Stage** — docked
 * at the right, at `Z_BAND.modal`, below the top bar — and Escape or its close folds it
 * back to the moment, which never closed. When the Stage closes the Inspector returns with
 * the last subject opened.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { isStageOpen } from '../stage/stageState';
import type { GameState } from '../../../types/gameState';
import type { SimulationRuntime } from '../../../engine/simulationRuntime';
import { buildSubjectPage, type SubjectPageExtras } from '../../../engine/views/subjects/subjectPage';
import type { ActOnCardVM, SubjectPageVM } from '../../../engine/views/subjects/subjectTypes';
import { actOnRowCards, actOnRowTargetName, actOnTargetForRef, type ActOnTarget } from '../../../engine/views/subjects/actOn';
import type { WorldRef } from '../../../types/worldRef';
import { isContentRef, type AnyRef } from '../../../types/contentRef';
import { INSPECTOR_WORDS } from '../../../data/view-content';
import { useGameScreenState } from '../frame/GameScreenState';
import { useEscapeLayer, ESCAPE_LAYER_Z_PANEL } from '../../shared/useEscapeLayer';
import { Z_BAND } from '../../shared/zBands';
import { IconButton } from '../../shared/IconButton';
import { Button } from '../../shared/Button';
import { Icon } from '../../shared/Icon';
import { Tooltip } from '../../shared/Tooltip';
import { InspectorPage, type InspectorPageReport } from './InspectorPage';
import type { ActCastResult } from './InspectorParts';
import { RowCardsProvider } from './RowCards';
import {
  currentEntry,
  cycleSize,
  escapeStep,
  closeInspector,
  goBack,
  goForward,
  goTo,
  isInspectorOpen,
  nameEntry,
  togglePin,
  trailSteps,
  widen,
  type InspectorSize,
} from './inspectorState';
import { useInspectorHotkeys } from './useInspectorHotkeys';

/** The width each size takes beside the map (THR-1819 tokens). Full has no width token. */
const SIZE_WIDTH: Record<Exclude<InspectorSize, 'full'>, string> = {
  docked: 'var(--inspector-w)',
  wide: 'var(--inspector-wide-w)',
};

export interface InspectorHostProps {
  gameState: GameState;
  runtime: SimulationRuntime | null;
  /** What only GameView holds, for the person page (S2a's input note). */
  extras: SubjectPageExtras;
  /** The one cast path (`useCastOnTarget`). */
  onCast: (actionId: string, target: ActOnTarget) => ActCastResult;
  /** The eye: fly the camera to a hex at `FOCUS_ZOOM`. */
  onShowOnMap: (hex: { col: number; row: number }) => void;
  /**
   * Meet The First, while it can be taken: the card the location view's drawer dealt.
   * It joins a place's Act row so that cast surface is not lost with the drawer.
   */
  meetTheFirst?: { actionId: string; sphere: string } | null;
  /** The page reports what it showed (the debug bridge reads it). */
  onReport?: (report: InspectorPageReport & { subjectKey: string; pageKind: string }) => void;
}

function hexOf(page: SubjectPageVM): { col: number; row: number } | null {
  const key = page.header.mapLocated ? page.header.hexKey : null;
  if (!key) return null;
  const [col, row] = key.split(',').map(Number);
  return Number.isFinite(col) && Number.isFinite(row) ? { col, row } : null;
}

function ToolButton({ label, icon, onClick, disabled, active }: { label: string; icon: Parameters<typeof Icon>[0]['name']; onClick: () => void; disabled?: boolean; active?: boolean }) {
  return (
    <Tooltip label={label}>
      <IconButton
        icon={<Icon name={icon} size="chip" decorative />}
        size="sm"
        aria-label={label}
        aria-pressed={active === undefined ? undefined : active}
        active={active}
        disabled={disabled}
        onClick={onClick}
        data-inspector-tool={icon}
      />
    </Tooltip>
  );
}

export function InspectorHost({ gameState, runtime, extras, onCast, onShowOnMap, meetTheFirst, onReport }: InspectorHostProps) {
  const { state: screen, setInspector, setStage } = useGameScreenState();
  const inspector = screen.inspector;
  const open = isInspectorOpen(inspector);
  // THR-1892 — folded under the Stage; over it when a name on the Stage asked for it.
  const stageOpen = isStageOpen(screen.stage);
  const overStage = stageOpen && screen.stage.inspectorOverStage;
  const shown = open && (!stageOpen || overStage);
  const foldBack = useCallback(() => setStage(prev => ({ ...prev, inspectorOverStage: false })), [setStage]);
  const entry = currentEntry(inspector);
  const size = inspector.size;

  const builtPage = useMemo<SubjectPageVM | null>(() => {
    if (!entry) return null;
    try {
      return buildSubjectPage(gameState, entry.subject, runtime, extras);
    } catch (err) {
      // A resolver throw must never take the screen down (NFP #4).
      console.warn('[InspectorHost] page build failed:', err);
      return null;
    }
    // The world is mutated in place: rebuild on every state the game hands down.
  }, [entry, gameState, runtime, extras]);

  const castTarget = useMemo<ActOnTarget | null>(() => {
    const subject = entry?.subject;
    if (!subject || subject.kind === 'event-node' || isContentRef(subject as AnyRef)) return null;
    return actOnTargetForRef(gameState, subject as WorldRef);
  }, [entry, gameState]);

  // Meet The First leads a place's Act row while it can be taken.
  const page = useMemo<SubjectPageVM | null>(() => {
    const placeTarget = castTarget?.kind === 'location' || castTarget?.kind === 'sublocation';
    if (!builtPage?.actOn || !meetTheFirst || !placeTarget) return builtPage;
    if (builtPage.actOn.cards.some(c => c.actionId === meetTheFirst.actionId)) return builtPage;
    const card: ActOnCardVM = { actionId: meetTheFirst.actionId, name: INSPECTOR_WORDS.meetTheFirst, sphere: meetTheFirst.sphere as ActOnCardVM['sphere'], available: true, reason: null };
    return { ...builtPage, actOn: { ...builtPage.actOn, cards: [card, ...builtPage.actOn.cards], emptyLine: null } } as SubjectPageVM;
  }, [builtPage, castTarget, meetTheFirst]);

  // The trail names each step by its page's name.
  const pageName = page?.header.name ?? '';
  const entryKey = entry?.key ?? null;
  useEffect(() => {
    if (entryKey && pageName) setInspector(prev => nameEntry(prev, entryKey, pageName));
  }, [entryKey, pageName, setInspector]);

  // Focus: the heading on every new subject; the invoker again when the Inspector closes.
  const headingRef = useRef<HTMLDivElement | null>(null);
  const invokerRef = useRef<Element | null>(null);
  const wasOpen = useRef(false);
  useLayoutEffect(() => {
    if (open && !wasOpen.current) invokerRef.current = document.activeElement;
    if (!open && wasOpen.current) {
      const back = invokerRef.current as HTMLElement | null;
      invokerRef.current = null;
      if (back && typeof back.focus === 'function' && document.contains(back)) back.focus();
    }
    wasOpen.current = open;
  }, [open]);
  useEffect(() => {
    if (!entryKey) return;
    const id = requestAnimationFrame(() => headingRef.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(id);
  }, [entryKey]);

  const onEscape = useCallback(() => setInspector(escapeStep), [setInspector]);
  useEscapeLayer(shown, overStage ? foldBack : onEscape, overStage ? Z_BAND.modal : ESCAPE_LAYER_Z_PANEL, 'Inspector');
  useInspectorHotkeys({
    open: shown,
    onCycleSize: () => setInspector(cycleSize),
    onBack: () => setInspector(goBack),
    onForward: () => setInspector(goForward),
  });

  const cast = useCallback((actionId: string): ActCastResult => (castTarget ? onCast(actionId, castTarget) : { cast: false, reason: null }), [castTarget, onCast]);

  // THR-1913 — a row's cards and its tray's cast. A new reader per world state, so every
  // rendered row re-reads once per state and a folded row never reads (plan § D9 way 2).
  const rowCardsFor = useCallback((ref: WorldRef) => {
    try {
      return actOnRowCards(gameState, ref);
    } catch (err) {
      console.warn('[InspectorHost] row cards failed:', err);
      return [];
    }
  }, [gameState]);
  const rowTargetName = useCallback((ref: WorldRef) => {
    try {
      return actOnRowTargetName(gameState, ref);
    } catch (err) {
      console.warn('[InspectorHost] row target name failed:', err);
      return null;
    }
  }, [gameState]);
  const castOnRow = useCallback((actionId: string, ref: WorldRef): ActCastResult => {
    const target = actOnTargetForRef(gameState, ref);
    return target ? onCast(actionId, target) : { cast: false, reason: null };
  }, [gameState, onCast]);

  const report = useCallback((r: InspectorPageReport) => {
    if (page) onReport?.({ ...r, subjectKey: page.subjectKey, pageKind: page.pageKind });
  }, [onReport, page]);

  if (!shown || !entry || !page) return null;

  const hex = hexOf(page);
  const trail = trailSteps(inspector);
  const T = INSPECTOR_WORDS.toolbar;
  const widenLabel = size === 'docked' ? T.widen : size === 'wide' ? T.full : T.narrow;

  const toolbar = (
    <div role="toolbar" aria-label={T.label} data-inspector-toolbar="" style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0, paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '8px' }}>
      <ToolButton label={T.back} icon="back" onClick={() => setInspector(goBack)} disabled={inspector.index <= 0} />
      <ToolButton label={T.forward} icon="forward" onClick={() => setInspector(goForward)} disabled={inspector.index >= inspector.history.length - 1} />
      {size !== 'full' && (
        <nav aria-label={T.trail} data-inspector-trail="" style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden', whiteSpace: 'nowrap', fontSize: 'var(--text-xs)' }}>
          {trail.more && (
            <Button variant="ghost" size="sm" onClick={() => setInspector(prev => goTo(prev, Math.max(0, prev.index - trail.steps.length)))} aria-label={T.trailMore} style={trailLinkStyle}>…</Button>
          )}
          {trail.steps.map((step, i) => (
            <span key={step.index} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
              {i > 0 && <span aria-hidden="true" style={{ color: 'var(--text-tertiary)' }}>›</span>}
              {step.current ? (
                <span aria-current="page" style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{step.name}</span>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => setInspector(prev => goTo(prev, step.index))} style={trailLinkStyle}>{step.name}</Button>
              )}
            </span>
          ))}
        </nav>
      )}
      {size === 'full' && <span style={{ flex: 1 }} />}
      <ToolButton label={inspector.pinned ? T.unpin : T.pin} icon="pin" onClick={() => setInspector(togglePin)} active={inspector.pinned} />
      {/* THR-1892: over the Stage the map holds still, so the eye does not render (Law 25). */}
      {hex && !overStage && <ToolButton label={T.eye} icon="show-on-map" onClick={() => onShowOnMap(hex)} />}
      <ToolButton label={widenLabel} icon="widen" onClick={() => setInspector(cycleSize)} active={size !== 'docked'} />
      <ToolButton label={T.close} icon="close" onClick={overStage ? foldBack : () => setInspector(closeInspector)} />
    </div>
  );

  const pageEl = (
    <RowCardsProvider key={entry.key} cardsFor={rowCardsFor} targetNameFor={rowTargetName} cast={castOnRow}>
      <InspectorPage
        page={page}
        size={size}
        graph={gameState.graph}
        onWiden={() => setInspector(widen)}
        onReport={report}
        toolbar={toolbar}
        onCast={castTarget ? cast : undefined}
        headingRef={headingRef}
      />
    </RowCardsProvider>
  );

  if (overStage) {
    // Over the Stage: docked at the right edge, above the Stage panel and below the top bar.
    const width = size === 'docked' ? SIZE_WIDTH.docked : SIZE_WIDTH.wide;
    return createPortal(
      <aside data-inspector-host="" data-inspector-size={size} data-inspector-over-stage="" aria-label={page.header.name}
        style={{ position: 'fixed', top: 'var(--topbar-height)', right: 0, bottom: 0, width, zIndex: Z_BAND.modal, borderLeft: '1px solid var(--border-gold)', background: 'linear-gradient(180deg, var(--bg-deep), var(--bg-abyss))', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, minHeight: 0 }}>{pageEl}</div>
      </aside>,
      document.body,
    );
  }

  if (size === 'full') {
    // Full: the trail column · the page (two columns and the Connections aside). The top bar
    // and the god rail stay visible (call 11): this covers the map region only.
    return (
      <div data-inspector-host="" data-inspector-size="full" role="region" aria-label={page.header.name}
        style={{ position: 'absolute', inset: 0, zIndex: Z_BAND.drawer, display: 'flex', gap: '12px', padding: '12px', background: 'var(--bg-abyss)', minHeight: 0 }}>
        <nav aria-label={T.trail} data-inspector-trail="" style={{ width: 'var(--inspector-full-trail-w)', flexShrink: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: 'var(--text-sm)' }}>
          {inspector.history.map((step, i) => (
            i === inspector.index ? (
              <span key={`${step.key}-${i}`} aria-current="page" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{step.name}</span>
            ) : (
              <Button key={`${step.key}-${i}`} variant="ghost" size="sm" onClick={() => setInspector(prev => goTo(prev, i))} style={{ ...trailLinkStyle, justifyContent: 'flex-start' }}>{step.name}</Button>
            )
          ))}
        </nav>
        <div style={{ flex: 1, minWidth: 0, minHeight: 0 }}>{pageEl}</div>
      </div>
    );
  }

  return (
    <aside data-inspector-host="" data-inspector-size={size} aria-label={page.header.name}
      style={{ width: SIZE_WIDTH[size], flexShrink: 0, height: '100%', minHeight: 0, borderLeft: '1px solid var(--border-gold)', background: 'linear-gradient(180deg, var(--bg-deep), var(--bg-abyss))', display: 'flex', flexDirection: 'column' }}>
      {inspector.pinned && <p role="status" style={{ margin: 0, padding: '4px 12px', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{T.pinnedNote}</p>}
      <div style={{ flex: 1, minHeight: 0 }}>{pageEl}</div>
    </aside>
  );
}

const trailLinkStyle: CSSProperties = {
  padding: '0 4px',
  color: 'var(--accent-gold)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  minWidth: 0,
};
