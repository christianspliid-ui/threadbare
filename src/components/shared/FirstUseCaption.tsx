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
   */
  readonly floating?: boolean;
}

export function useFirstUseCaptionVisible(id: string): boolean {
  const snap = useSyncExternalStore(subscribeFirstUseCaptions, getFirstUseCaptionSnapshot, getFirstUseCaptionSnapshot);
  return snap.visible.includes(id);
}

/** Where a floating caption's anchor sits on screen, re-read on resize. */
function useAnchorRect(active: boolean): [RefObject<HTMLSpanElement | null>, { top: number; right: number } | null] {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [rect, setRect] = useState<{ top: number; right: number } | null>(null);
  useLayoutEffect(() => {
    if (!active) return;
    const read = () => {
      const r = ref.current?.getBoundingClientRect();
      if (r) setRect(prev => (prev && prev.top === r.top && prev.right === r.right ? prev : { top: r.top, right: r.right }));
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
  return [ref, rect];
}

export function FirstUseCaption({ id, name, floating = false }: FirstUseCaptionProps) {
  useEffect(() => mountFirstUseCaption(id), [id]);
  const visible = useFirstUseCaptionVisible(id);
  const dismiss = useCallback(() => dismissFirstUseCaption(id), [id]);
  const text = visible ? getFirstUseCaptionText(id, name) : null;
  const [anchorRef, anchor] = useAnchorRect(floating && !!text);
  if (!text) return null;
  const line = (
    <div
      data-testid={`first-use-caption-${id}`}
      data-first-use-caption={id}
      style={{
        ...(floating ? FLOATING_STYLE : null),
        ...(floating && anchor
          ? { top: anchor.top + 4, left: Math.max(8, anchor.right - FLOATING_WIDTH_PX) }
          : null),
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
      {anchor && typeof document !== 'undefined' ? createPortal(line, document.body) : null}
    </>
  );
}

const FLOATING_WIDTH_PX = 260;

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
  const onPointerDown = useCallback(() => dismissFirstUseCaption(id), [id]);
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
