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

import { useCallback, useEffect, useSyncExternalStore, type ReactNode, type PointerEvent, type CSSProperties } from 'react';
import {
  dismissFirstUseCaption,
  getFirstUseCaptionSnapshot,
  mountFirstUseCaption,
  subscribeFirstUseCaptions,
} from './firstUseCaptionStore';
import { FIRST_USE_CAPTION_DISMISS_LABEL, getFirstUseCaptionText } from '../../data/first-use-captions';

export interface FirstUseCaptionProps {
  /** A `FIRST_USE_CAPTIONS` id. */
  readonly id: string;
  /** The mortal `{name}` resolves to (Law 43). */
  readonly name?: string;
  /**
   * Float below the anchor instead of taking a line in flow — for a top-bar item,
   * whose row has no room for a second line (Law 33). The anchor must be
   * `position: relative`. It sits over the map edge, never over a control (Law 25).
   */
  readonly floating?: boolean;
}

export function useFirstUseCaptionVisible(id: string): boolean {
  const snap = useSyncExternalStore(subscribeFirstUseCaptions, getFirstUseCaptionSnapshot, getFirstUseCaptionSnapshot);
  return snap.visible.includes(id);
}

export function FirstUseCaption({ id, name, floating = false }: FirstUseCaptionProps) {
  useEffect(() => mountFirstUseCaption(id), [id]);
  const visible = useFirstUseCaptionVisible(id);
  const dismiss = useCallback(() => dismissFirstUseCaption(id), [id]);
  if (!visible) return null;
  const text = getFirstUseCaptionText(id, name);
  if (!text) return null;
  return (
    <div
      data-testid={`first-use-caption-${id}`}
      data-first-use-caption={id}
      style={{
        ...(floating ? FLOATING_STYLE : null),
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
      <button
        className="focus-ring"
        type="button"
        data-testid={`first-use-caption-${id}-dismiss`}
        onClick={(e) => { e.stopPropagation(); dismiss(); }}
        style={{
          flex: '0 0 auto',
          background: 'none',
          border: 'none',
          // Law 46 — the mark stays small, the hit area does not.
          padding: '6px 8px',
          margin: '-6px -8px',
          font: 'inherit',
          fontStyle: 'normal',
          color: 'var(--text-tertiary)',
          borderBottom: '1px solid var(--border-subtle)',
          cursor: 'pointer',
        }}
      >
        {FIRST_USE_CAPTION_DISMISS_LABEL}
      </button>
    </div>
  );
}

const FLOATING_STYLE: CSSProperties = {
  position: 'absolute',
  top: '100%',
  right: 0,
  zIndex: 5,
  width: 260,
  padding: '6px 10px',
  background: 'var(--bg-raised)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 6,
  boxShadow: 'var(--shadow-panel)',
};

export interface FirstUseCaptionZoneProps {
  /** The caption this panel carries. */
  readonly id: string;
  readonly children: ReactNode;
  readonly style?: CSSProperties;
  readonly testId?: string;
  /** What counts as the panel's tooltip trigger. Default: any registry tooltip. */
  readonly hoverSelector?: string;
}

/**
 * The panel's own area: a tooltip hovered or anything pressed inside it is the
 * player using the word once. `display: contents` by default, so wrapping a
 * panel never changes its layout.
 */
export function FirstUseCaptionZone({ id, children, style, testId, hoverSelector = '[data-tooltip-id]' }: FirstUseCaptionZoneProps) {
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
