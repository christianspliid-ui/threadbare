/**
 * Stage — the panel a mortal's moment plays on, over the dimmed map, with the moment's
 * hex lit in a window of open map beside it (THR-1892, plan THR-1877 § D3–D7).
 *
 * The **layer** covers the map region (right of the god rail, below the top bar). It is
 * transparent but takes pointer and wheel events, so the map under it holds still; a
 * drag, wheel or click on it answers with the hold line. Inside it the **panel** sits at
 * the gutter from the rail and the top bar, and the **window** is the open strip of map
 * at the right edge, measured from the DOM (`data-stage-window`), never computed in JS.
 *
 * Geometry is tokens only (THR-1819): the panel's width is derived — full =
 * 100vw − god rail − window − two gutters; compact = `--stage-compact-w` — and its height
 * is fixed, so one chrome holds from the first line to the last (Law 37). Nothing inside
 * the panel scrolls before the panel's own height (Law 57): its body region is the only
 * scroll box, and it is the whole height of the panel.
 *
 * **Enter sequence** (§ D6): the Stage mounts in `entering` with the panel hidden; the
 * rails fold in the same render; after `STAGE_LAYOUT_SETTLE_FRAMES` the window is measured
 * and the focus posted to `GameScreenState.stage`, which `GameMap` turns into the dim, the
 * ring and the camera move; when the camera lands (or `STAGE_CAMERA_SETTLE_TIMEOUT_MS`
 * passes) the panel enters on the ceremonial tier and keyboard focus moves into it.
 *
 * A name clicked on the Stage opens the Inspector over it (§ D7): the Stage republishes
 * the ref router with an `open` that marks `inspectorOverStage` first.
 *
 * The Stage never holds a map handle.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { StageHomedKind } from '../../../data/homed-surfaces';
import {
  STAGE_CAMERA_SETTLE_TIMEOUT_MS,
  STAGE_LAYOUT_SETTLE_FRAMES,
  STAGE_LIT_HEX_MIN_HIT_PX,
  STAGE_MAP_DIM,
  STAGE_MAP_HINT_MS,
  STAGE_PANEL_ENTRANCE_S,
} from '../../../data/stage-content';
import { STAGE_WORDS } from '../../../data/view-content';
import type { StageVM } from '../../../engine/views/stage/stageView';
import { emitTrace } from '../../../engine/traceBuffer';
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion';
import { RefRouterProvider, useRefRouterContext } from '../../../contexts/RefRouterContext';
import type { RefRouter } from '../../../hooks/useRefRouter';
import { Overlay } from '../../shared/Overlay';
import { Panel } from '../../shared/Panel';
import { EntityLink } from '../../shared/EntityLink';
import { Button } from '../../shared/Button';
import { GameErrorBoundary } from '../../shared/GameErrorBoundary';
import { useGameScreenState } from '../frame/GameScreenState';
import { IDLE_STAGE } from './stageState';

/** The panel's width in each layout, from tokens alone (§ D3). */
export const STAGE_PANEL_WIDTH: Record<'full' | 'compact', string> = {
  full: 'max(min(var(--dialog-m-w), calc(100vw - var(--rail-left-w) - 2 * var(--stage-gutter))), calc(100vw - var(--rail-left-w) - var(--stage-window-w) - 2 * var(--stage-gutter)))',
  compact: 'min(var(--stage-compact-w), calc(100vw - var(--rail-left-w) - 2 * var(--stage-gutter)))',
};

export interface StageProps {
  kind: StageHomedKind;
  vm: StageVM;
  /** The Stage's accessible name (the moment's title). */
  label: string;
  /** The moment's own Escape (§ D7: an encounter minimises; a story beat continues). */
  onEscape: () => void;
  closeOnEscape?: boolean;
  /** Full layout: art, cast and *At stake*. */
  left?: ReactNode;
  /** Full layout: header, scene, forecast and hand. Compact layout: the whole body. */
  right?: ReactNode;
  /** During an encounter the hold line names *Show on map* (S3). */
  holdLineShowsOnMap?: boolean;
  /** The game tick, for traces. */
  tick: number;
  /**
   * THR-1895 — the panel's ground, when the moment brings its own (the encounter's
   * `--veil-void`); otherwise the `Panel` level's.
   */
  ground?: string;
}

function rectOf(el: Element | null): { x: number; y: number; w: number; h: number } | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
}

export function Stage({ kind, vm, label, onEscape, closeOnEscape = true, left, right, holdLineShowsOnMap = false, tick, ground }: StageProps) {
  const { state: screen, setStage } = useGameScreenState();
  const stage = screen.stage;
  const reducedMotion = usePrefersReducedMotion();
  const windowRef = useRef<HTMLDivElement | null>(null);
  const layerRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const [hint, setHint] = useState(false);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickRef = useRef(tick);
  tickRef.current = tick;

  // ── Mount: enter; unmount: back to idle. ──
  useEffect(() => {
    setStage({ ...IDLE_STAGE, kind, phase: 'entering' });
    emitTrace({
      tick: tickRef.current,
      category: 'ui_stage',
      action: 'opened',
      kind,
      litSource: vm.litSource,
      litHex: vm.litHex,
      layout: vm.layout,
      summary: `ui_stage: opened ${kind} — ${vm.litHex ? `lit ${vm.litHex} from ${vm.litSource}` : 'nothing lit'}, ${vm.layout}`,
    });
    return () => {
      setStage(IDLE_STAGE);
      emitTrace({ tick: tickRef.current, category: 'ui_stage', action: 'closed', kind, summary: `ui_stage: closed ${kind}` });
    };
    // One mount per moment: StageHost keys the Stage on the moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── After the rails settle, measure the window and ask the map for its focus. ──
  const litKey = vm.litHex;
  const frameKey = vm.frame.join('|');
  useEffect(() => {
    let frames = STAGE_LAYOUT_SETTLE_FRAMES;
    let id = 0;
    const step = () => {
      if (--frames > 0) {
        id = requestAnimationFrame(step);
        return;
      }
      const windowRect = rectOf(windowRef.current) ?? { x: 0, y: 0, w: 0, h: 0 };
      setStage(prev => ({
        ...prev,
        cameraSettled: false,
        cameraMode: null,
        focus: {
          lit: litKey ? [litKey] : [],
          options: [],
          strength: STAGE_MAP_DIM,
          frame: frameKey ? frameKey.split('|') : [],
          windowRect,
          instant: reducedMotion,
        },
      }));
    };
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [litKey, frameKey, reducedMotion, setStage]);

  // ── The panel enters when the camera lands, or after the timeout if it never reports. ──
  const focusPosted = stage.focus !== null;
  useEffect(() => {
    if (!focusPosted || stage.cameraSettled) return;
    const t = setTimeout(() => {
      setStage(prev => (prev.cameraSettled ? prev : { ...prev, cameraSettled: true, cameraMode: 'timed_out' }));
    }, STAGE_CAMERA_SETTLE_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [focusPosted, stage.cameraSettled, setStage]);

  const open = stage.cameraSettled;
  useEffect(() => {
    if (!open) return;
    setStage(prev => (prev.phase === 'entering' ? { ...prev, phase: 'open' } : prev));
    const id = requestAnimationFrame(() => panelRef.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(id);
  }, [open, setStage]);

  // ── The held map answers every input (Law 47, PC-8). ──
  const showHint = useCallback(() => {
    setHint(true);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setHint(false), STAGE_MAP_HINT_MS);
  }, []);
  useEffect(() => () => { if (hintTimer.current) clearTimeout(hintTimer.current); }, []);
  const onLayerInput = useCallback((e: { target: EventTarget | null }) => {
    if (panelRef.current && e.target instanceof Node && panelRef.current.contains(e.target)) return;
    if (e.target instanceof Element && e.target.closest('[data-stage-lit-hex],[data-stage-place-tag]')) return;
    showHint();
  }, [showHint]);
  // A wheel over the layer must never reach the map: listen non-passively and stop it.
  // THR-1895 — a wheel inside the panel is the panel's own: it scrolls the moment's column.
  useEffect(() => {
    const el = layerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (panelRef.current && e.target instanceof Node && panelRef.current.contains(e.target)) return;
      e.preventDefault();
      onLayerInput(e);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onLayerInput]);

  // ── Names on the Stage open the Inspector over it (§ D7). ──
  const router = useRefRouterContext();
  const stageRouter = useMemo<RefRouter | undefined>(() => {
    if (!router) return undefined;
    return {
      ...router,
      open: (ref, mode, options) => {
        if (mode !== 'hover') setStage(prev => ({ ...prev, inspectorOverStage: true }));
        router.open(ref, mode, options);
      },
    };
  }, [router, setStage]);

  // ── The lit-hex button sits over the lit hex once the camera has landed. ──
  const layerRect = open ? rectOf(layerRef.current) : null;
  const lit = open ? stage.litHexScreen : null;
  const hitSize = lit ? Math.max(STAGE_LIT_HEX_MIN_HIT_PX, lit.size) : 0;
  const openLitHex = useCallback(() => {
    if (vm.place && stageRouter) stageRouter.open(vm.place.ref, 'card', { via: 'stage' });
  }, [vm.place, stageRouter]);

  const layout = vm.layout;
  const panelWidth = STAGE_PANEL_WIDTH[layout];
  const entrance = reducedMotion ? 'opacity var(--anim-fast) ease' : `opacity ${STAGE_PANEL_ENTRANCE_S}s ease`;

  const panelStyle: CSSProperties = {
    position: 'absolute',
    left: 'var(--stage-gutter)',
    top: 'var(--stage-gutter)',
    width: panelWidth,
    height: 'calc(100vh - var(--topbar-height) - 2 * var(--stage-gutter))',
    display: 'flex',
    flexDirection: 'row',
    minHeight: 0,
    overflow: 'hidden',
    opacity: open ? 1 : 0,
    visibility: open ? 'visible' : 'hidden',
    transition: entrance,
    ...(ground ? { background: ground } : {}),
  };

  const holdLine = holdLineShowsOnMap ? `${STAGE_WORDS.holdLine} ${STAGE_WORDS.holdLineShowOnMap}` : STAGE_WORDS.holdLine;
  const context = vm.palette === 'story' || vm.palette === 'elder' || vm.palette === 'gain' ? vm.palette : undefined;

  const body = (
    <div
      ref={layerRef}
      data-stage-layer=""
      data-stage-kind={kind}
      data-stage-phase={stage.phase}
      data-stage-layout={layout}
      onPointerDown={onLayerInput}
      style={{ position: 'absolute', inset: 0 }}
    >
      <Panel
        ref={panelRef}
        level="page"
        context={context}
        as="section"
        aria-label={label}
        tabIndex={-1}
        data-stage-panel=""
        style={panelStyle}
      >
        <GameErrorBoundary>
          {/* THR-1895 — a full-layout moment with nothing for the left column (no art,
              no cast) gives the right column the whole panel, never a blank column. */}
          {layout === 'full' && left != null && left !== false ? (
            <>
              <div data-stage-left="" style={{ width: 'var(--stage-left-col-w)', flexShrink: 0, minHeight: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-subtle)' }}>{left}</div>
              <div data-stage-right="" style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>{right}</div>
            </>
          ) : (
            <div data-stage-body="" style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>{right}</div>
          )}
        </GameErrorBoundary>
      </Panel>

      {/* The window: open map at the right edge. Measured, never computed. */}
      <div
        ref={windowRef}
        data-stage-window=""
        style={{ position: 'absolute', top: 0, bottom: 0, right: 0, left: `calc(2 * var(--stage-gutter) + ${panelWidth})` }}
      >
        {vm.place && vm.placeTagSuffix && (
          <div
            data-stage-place-tag=""
            style={{
              position: 'absolute', top: 'var(--stage-gutter)', left: '50%', transform: 'translateX(-50%)',
              maxWidth: 'calc(100% - 2 * var(--stage-gutter))', padding: '4px 10px', borderRadius: 'var(--radius-control)',
              background: 'var(--scrim-heavy)', color: 'var(--text-primary)', fontSize: 'var(--text-sm)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center',
            }}
          >
            <EntityLink id={vm.place.ref.id} name={vm.place.name} entityRef={vm.place.ref} />
            <span>{vm.placeTagSuffix}</span>
          </div>
        )}
        <p
          role="status"
          data-stage-hold-line=""
          style={{
            position: 'absolute', top: 'calc(var(--stage-gutter) + 2.5em)', left: 'var(--stage-gutter)', right: 'var(--stage-gutter)',
            margin: 0, textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)',
            opacity: hint ? 1 : 0, transition: 'opacity var(--anim-fast) ease', pointerEvents: 'none',
          }}
        >
          {hint ? holdLine : ''}
        </p>
      </div>

      {/* The lit hex is a real control: its place's tooltip on hover, its page on click (Law 46). */}
      {lit && layerRect && vm.place && (
        <Button
          variant="ghost"
          type="button"
          data-stage-lit-hex=""
          aria-label={STAGE_WORDS.litHexLabel.replace('{place}', vm.place.name)}
          title={vm.place.name}
          onClick={openLitHex}
          style={{
            position: 'absolute',
            left: lit.x - layerRect.x - hitSize / 2,
            top: lit.y - layerRect.y - hitSize / 2,
            width: hitSize,
            height: hitSize,
            clipPath: 'polygon(25% 6.7%, 75% 6.7%, 100% 50%, 75% 93.3%, 25% 93.3%, 0% 50%)',
            padding: 0,
            border: 'none',
          }}
        />
      )}
    </div>
  );

  return (
    <Overlay
      open={true}
      onClose={onEscape}
      closeOnEscape={closeOnEscape}
      label={label}
      band="stage"
      inset="belowTopBar"
      backdrop="none"
      placement="fill"
      closeOnBackdrop={false}
      animation="none"
      modal={true}
      surfaceStyle={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 'var(--rail-left-w)', width: 'auto', height: 'auto' }}
      surfaceProps={{ 'data-stage': '' }}
    >
      {stageRouter ? <RefRouterProvider router={stageRouter}>{body}</RefRouterProvider> : body}
    </Overlay>
  );
}
