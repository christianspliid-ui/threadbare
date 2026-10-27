/**
 * FirstUseCaption — one muted line under a panel, until the player uses the word
 * once (THR-1986, plan `2026-10-18-thr-1980-words-teach-themselves.md` U6).
 *
 * Two parts:
 *  - `FirstUseCaptionZone` wraps the panel. The first hover of any tooltip inside
 *    it, or the first press inside it, dismisses its caption for good.
 *  - `FirstUseCaption` renders the line itself with a small "got it". It shows
 *    only while its id is among the store's visible captions (at most
 *    `FIRST_USE_CAPTIONS_MAX_VISIBLE`, table order), so a panel that is not on
 *    screen never shows its caption, and a third waits for a slot.
 *
 * Laws: 1/17 (the panel keeps its registry tooltip; the caption adds none), 25
 * (never covers a control — it sits in flow), 33 (one line, wraps, never a
 * fixed height), 42 (plain register), 51 (dismissal remembered), 53 (temporary).
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode, type PointerEvent, type CSSProperties, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { Z_BAND } from './zBands';
import {
  dismissFirstUseCaption,
  getFirstUseCaptionSnapshot,
  mountFirstUseCaption,
  subscribeFirstUseCaptions,
} from './firstUseCaptionStore';
import { Button } from './Button';
import { FIRST_USE_CAPTION_DISMISS_LABEL, getFirstUseCaptionText } from '../../data/first-use-captions';

export interface FirstUseCaptionProps {
  /** A `FIRST_USE_CAPTIONS` id. */
  readonly id: string;
  /** The mortal `{name}` resolves to (Law 43). */
  readonly name?: string;
  /**
   * Float below the anchor instead of taking a line in flow — for a top-bar item,
   * whose row has no room for a second line and clips what overflows it (Law 33).
   * The anchor must be `position: relative`; the line is portalled to the body at
   * the anchor's lower right, over the map edge, never over a control (Law 25).
   * It yields while anything but the map's ground sits under that spot — the
   * Inspector, a Stage, a dialog — and comes back when that surface closes
   * (THR-2078).
   */
  readonly floating?: boolean;
}

export function useFirstUseCaptionVisible(id: string): boolean {
  const snap = useSyncExternalStore(subscribeFirstUseCaptions, getFirstUseCaptionSnapshot, getFirstUseCaptionSnapshot);
  return snap.visible.includes(id);
}

/** Marks the map's root: the only ground a floating caption may sit over (THR-2078). */
export const FIRST_USE_CAPTION_GROUND_ATTR = 'data-first-use-caption-ground';

interface FloatingSpot { readonly top: number; readonly left: number }

function floatingSpot(anchor: { top: number; right: number }): FloatingSpot {
  return { top: anchor.top + FLOATING_GAP_PX, left: Math.max(FLOATING_EDGE_PX, anchor.right - FLOATING_WIDTH_PX) };
}

/**
 * True while the caption's box lies over the map's ground. Any other surface
 * under one of its corners — the Inspector, a Stage, a dialog — and it yields.
 * Fail-soft: without `elementsFromPoint` (jsdom) or with no marked ground on the
 * page, the caption shows as before.
 */
export function isOverCaptionGround(spot: FloatingSpot): boolean {
  if (typeof document === 'undefined' || typeof document.elementsFromPoint !== 'function') return true;
  if (!document.querySelector(`[${FIRST_USE_CAPTION_GROUND_ATTR}]`)) return true;
  const right = spot.left + FLOATING_WIDTH_PX - 1;
  const bottom = spot.top + FLOATING_PROBE_HEIGHT_PX;
  const probes: ReadonlyArray<readonly [number, number]> = [
    [spot.left + 1, spot.top + 1], [right, spot.top + 1], [spot.left + 1, bottom], [right, bottom],
  ];
  return probes.every(([x, y]) => {
    // The caption's own line is not what lies under it.
    const hit = document.elementsFromPoint(x, y).find(el => !el.closest('[data-first-use-caption]'));
    return !!hit && !!hit.closest(`[${FIRST_USE_CAPTION_GROUND_ATTR}]`);
  });
}

/** Where a floating caption's anchor sits on screen, re-read on resize. */
function useAnchorRect(active: boolean): [RefObject<HTMLSpanElement | null>, { top: number; right: number } | null, boolean] {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [rect, setRect] = useState<{ top: number; right: number } | null>(null);
  const [overGround, setOverGround] = useState(true);
  useLayoutEffect(() => {
    if (!active) return;
    const read = () => {
      const r = ref.current?.getBoundingClientRect();
      if (r) {
        setRect(prev => (prev && prev.top === r.top && prev.right === r.right ? prev : { top: r.top, right: r.right }));
        setOverGround(isOverCaptionGround(floatingSpot(r)));
      }
    };
    read();
    // The top bar re-lays itself out without a window resize (a yield step hides a
    // name, Needs you appears), so the anchor is re-read while the line is up.
    const timer = window.setInterval(read, FLOATING_REREAD_MS);
    window.addEventListener('resize', read);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('resize', read);
    };
  }, [active]);
  return [ref, rect, overGround];
}

export function FirstUseCaption({ id, name, floating = false }: FirstUseCaptionProps) {
  useEffect(() => mountFirstUseCaption(id), [id]);
  const visible = useFirstUseCaptionVisible(id);
  const dismiss = useCallback(() => dismissFirstUseCaption(id), [id]);
  const text = visible ? getFirstUseCaptionText(id, name) : null;
  const [anchorRef, anchor, overGround] = useAnchorRect(floating && !!text);
  if (!text) return null;
  const line = (
    <div
      data-testid={`first-use-caption-${id}`}
      data-first-use-caption={id}
      style={{
        ...(floating ? FLOATING_STYLE : null),
        ...(floating && anchor ? floatingSpot(anchor) : null),
        display: 'flex',
        alignItems: 'baseline',
        gap: 8,
        marginTop: 4,
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-xs)',
        lineHeight: 1.4,
        color: 'var(--text-tertiary)',
        fontStyle: 'italic',
      }}
    >
      <span style={{ flex: '1 1 auto', minWidth: 0 }}>{text}</span>
      <Button
        variant="ghost"
        size="sm"
        className="focus-ring"
        data-testid={`first-use-caption-${id}-dismiss`}
        onClick={(e) => { e.stopPropagation(); dismiss(); }}
        style={{ flex: '0 0 auto', fontStyle: 'normal' }}
      >
        {FIRST_USE_CAPTION_DISMISS_LABEL}
      </Button>
    </div>
  );
  if (!floating) return line;
  return (
    <>
      <span ref={anchorRef} aria-hidden style={{ position: 'absolute', top: '100%', right: 0, width: 0, height: 0 }} />
      {anchor && overGround && typeof document !== 'undefined' ? createPortal(line, document.body) : null}
    </>
  );
}

const FLOATING_WIDTH_PX = 260;

/** Gap between the anchor's lower edge and the floating line. */
const FLOATING_GAP_PX = 4;

/** The floating line never starts closer than this to the window's left edge. */
const FLOATING_EDGE_PX = 8;

/** How far down the ground probe reaches: about a two-line caption's height. */
const FLOATING_PROBE_HEIGHT_PX = 44;

/** How often a floating caption re-reads its anchor while it is on screen. */
const FLOATING_REREAD_MS = 400;

const FLOATING_STYLE: CSSProperties = {
  position: 'fixed',
  // Over the map, under the top bar's own menus and every modal.
  zIndex: Z_BAND.hud,
  width: FLOATING_WIDTH_PX,
  padding: '6px 10px',
  background: 'var(--bg-raised)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-control)',
  boxShadow: 'var(--shadow-panel)',
};

export interface FirstUseCaptionZoneProps {
  /** The caption this panel carries. */
  readonly id: string;
  readonly children: ReactNode;
  readonly style?: CSSProperties;
  readonly testId?: string;
  /** What counts as the panel's tooltip trigger. Default: any `Tooltip` trigger. */
  readonly hoverSelector?: string;
}

/**
 * The panel's own area: a tooltip hovered or anything pressed inside it is the
 * player using the word once. `display: contents` by default, so wrapping a
 * panel never changes its layout.
 */
export function FirstUseCaptionZone({ id, children, style, testId, hoverSelector = '[data-tooltip-trigger]' }: FirstUseCaptionZoneProps) {
  const onPointerOver = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const target = e.target as Element | null;
    if (target && typeof target.closest === 'function' && target.closest(hoverSelector)) {
      dismissFirstUseCaption(id);
    }
  }, [id, hoverSelector]);
  // A press on another caption nested in this panel (its "got it") is that
  // caption's own act, not a use of this panel.
  const onPointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const target = e.target as Element | null;
    const caption = target && typeof target.closest === 'function' ? target.closest('[data-first-use-caption]') : null;
    if (caption && caption.getAttribute('data-first-use-caption') !== id) return;
    dismissFirstUseCaption(id);
  }, [id]);
  return (
    <div
      {...(testId ? { 'data-testid': testId } : {})}
      onPointerOverCapture={onPointerOver}
      onPointerDownCapture={onPointerDown}
      style={style ?? { display: 'contents' }}
    >
      {children}
    </div>
  );
}
