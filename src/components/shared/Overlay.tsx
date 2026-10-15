import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { useDialogFocus } from './useDialogFocus';
import { useEscapeLayer } from './useEscapeLayer';
import { Z_BAND, type OverlayBand } from './zBands';

/**
 * Overlay — the one backdrop, z-band and Escape implementation (THR-1884, plan
 * THR-1821 § Overlay).
 *
 * Before this, full-screen layers were built by hand at z-index values typed into
 * each file, and each hung its own Escape listener on `document` — so one Escape
 * closed every surface at once (the THR-1816 bug class). Overlay owns all of it:
 *
 * - **Portal** to `document.body`, with the mount/unmount animation done on the
 *   backdrop itself (no `AnimateMount` wrapper: a transform on a wrapper makes it
 *   the containing block for `position: fixed`).
 * - **Z-band** by name from `zBands.ts`, never a number (Law 35).
 * - **Escape stack** through `useEscapeLayer` with this Overlay's `label`, so only
 *   the topmost surface answers the key (Law 23).
 * - **Focus** through `useDialogFocus` (Law 50): in on open, trapped while
 *   `modal`, back to the invoker on close.
 *
 * Overlay does not size anything. Dialog sizes belong to `Modal`; the Inspector and
 * the Stage have their own geometry; anchored menus and tooltips keep their own
 * positioning and only join the escape registry.
 */

export type OverlayBackdrop = 'dim' | 'heavy' | 'void' | 'none';
export type OverlayPlacement = 'top' | 'center' | 'fill';
export type OverlayInset = 'viewport' | 'belowTopBar';
export type OverlayAnimation = 'fade' | 'fade-up' | 'none';

/** `placement="top"` offset from the top of the viewport (Modal's today). */
export const OVERLAY_TOP_OFFSET_VH = 5;
/** Unmount delay after the exit animation starts (Modal's today). */
export const OVERLAY_EXIT_MS = 200;

const BACKDROP_FILL: Record<OverlayBackdrop, string> = {
  dim: 'var(--scrim-dim)',
  heavy: 'var(--scrim-heavy)',
  void: 'var(--bg-abyss)',
  none: 'transparent',
};

const ANIMATION_CLASS: Record<OverlayAnimation, string> = {
  fade: 'anim-fade',
  'fade-up': 'anim-fade-up',
  none: '',
};

export interface OverlayProps {
  open: boolean;
  /** Escape and a backdrop click route here. */
  onClose: () => void;
  /** Required: the accessible name and the escape-layer debug label. */
  label: string;
  /**
   * The accessible name on the dialog element. Defaults to `label`; `false` sets
   * none, for content that names itself (and for `Modal`, whose `aria-label` is
   * optional).
   */
  accessibleName?: string | false;
  band?: OverlayBand;
  backdrop?: OverlayBackdrop;
  placement?: OverlayPlacement;
  /** `belowTopBar` keeps the top bar in view (the Stage, Law 52). */
  inset?: OverlayInset;
  /** Default true: focus trap and `aria-modal`. False: focus moves in, no trap. */
  modal?: boolean;
  /** Default true. False registers no escape layer, so Escape reaches the surface below. */
  closeOnEscape?: boolean;
  /**
   * Default true for `dim` / `heavy`, false for `void` / `none`. A `none` backdrop
   * is pointer-transparent unless this is true — then it is an invisible
   * click-catcher (a menu that closes on an outside click).
   */
  closeOnBackdrop?: boolean;
  /** Reduced motion collapses `fade-up` to a plain fade (Law 44). */
  animation?: OverlayAnimation;
  /**
   * Legacy: an exact z for a caller that still passes a number (Modal's `zIndex`
   * prop). New surfaces name a `band`.
   */
  zIndexOverride?: number;
  /** Style for the surface element the Overlay focuses (a Modal draws its panel here). */
  surfaceStyle?: CSSProperties;
  surfaceClassName?: string;
  /** Extra attributes on the surface element (`data-*`, `aria-*`). */
  surfaceProps?: HTMLAttributes<HTMLDivElement> & Record<`data-${string}`, string | undefined>;
  children: ReactNode;
}

function placementStyle(placement: OverlayPlacement): CSSProperties {
  switch (placement) {
    case 'top':
      return { alignItems: 'flex-start', justifyContent: 'center', paddingTop: `${OVERLAY_TOP_OFFSET_VH}vh` };
    case 'center':
      return { alignItems: 'center', justifyContent: 'center' };
    case 'fill':
      return { alignItems: 'stretch', justifyContent: 'stretch' };
  }
}

export function Overlay({
  open,
  onClose,
  label,
  accessibleName,
  band = 'modal',
  backdrop = 'dim',
  placement = 'top',
  inset = 'viewport',
  modal = true,
  closeOnEscape = true,
  closeOnBackdrop,
  animation = 'fade-up',
  zIndexOverride,
  surfaceStyle,
  surfaceClassName,
  surfaceProps,
  children,
}: OverlayProps) {
  const [shouldRender, setShouldRender] = useState(open);
  const [animClass, setAnimClass] = useState('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  const zIndex = zIndexOverride ?? Z_BAND[band];
  const backdropCloses = closeOnBackdrop ?? (backdrop === 'dim' || backdrop === 'heavy');
  const anim = ANIMATION_CLASS[reducedMotion && animation === 'fade-up' ? 'fade' : animation];

  // Law 23 (THR-1816): Escape closes this Overlay only while it is the topmost surface.
  useEscapeLayer(open && closeOnEscape, onClose, zIndex, label);

  // Law 50: gated on `shouldRender` too — the surface does not exist on the render
  // where `open` first flips true.
  const { onKeyDown: trapTab } = useDialogFocus(surfaceRef, open && shouldRender);

  useEffect(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (open) {
      setShouldRender(true);
      if (anim) requestAnimationFrame(() => setAnimClass(`${anim}-enter`));
    } else if (shouldRender) {
      if (!anim) {
        setShouldRender(false);
        return;
      }
      setAnimClass(`${anim}-exit`);
      timeoutRef.current = setTimeout(() => {
        setShouldRender(false);
        setAnimClass('');
      }, OVERLAY_EXIT_MS);
    }
    return () => {
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    };
  }, [open, anim, shouldRender]);

  if (!shouldRender) return null;

  const pointerThrough = backdrop === 'none' && !backdropCloses;
  const backdropStyle: CSSProperties = {
    position: 'fixed',
    ...(inset === 'belowTopBar'
      ? { top: 'var(--topbar-height)', right: 0, bottom: 0, left: 0 }
      : { inset: 0 }),
    background: BACKDROP_FILL[backdrop],
    zIndex,
    display: 'flex',
    ...placementStyle(placement),
    ...(pointerThrough ? { pointerEvents: 'none' } : {}),
  };

  const surface: CSSProperties = {
    ...(placement === 'fill' ? { width: '100%', height: '100%' } : {}),
    ...(pointerThrough ? { pointerEvents: 'auto' } : {}),
    ...surfaceStyle,
  };

  const name = accessibleName === false ? undefined : (accessibleName ?? label);

  return createPortal(
    <div
      className={anim ? animClass : undefined}
      style={backdropStyle}
      onClick={backdropCloses ? onClose : undefined}
      role="dialog"
      aria-modal={modal ? 'true' : undefined}
      aria-label={name}
      data-overlay-band={band}
      data-overlay-backdrop={backdrop}
    >
      <div
        {...surfaceProps}
        ref={surfaceRef}
        className={surfaceClassName}
        style={surface}
        tabIndex={-1}
        onKeyDown={modal ? trapTab : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
