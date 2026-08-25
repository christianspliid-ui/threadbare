import { useEffect, useCallback, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { IconButton } from './IconButton';
import { FOCUSABLE_SELECTOR } from './focusableSelector';

/**
 * The modal band (Law 35 — z-index comes from the stacking table, never invented).
 * `layout-zones.md`: 50 focused overlays · **60 modals** · 70+ tooltips · 9999 portalled menus.
 *
 * `MODAL_Z_DEFAULT` is where every modal sits, and equal z means DOM order decides
 * — which is a coin toss the JSX author never sees. `MODAL_Z_ABOVE_INTERRUPT` is the
 * one sanctioned step up, for a sheet opened *from* an interrupt that renders later
 * in `GameView` (AgentProfileModal over PremonitionModal, THR-1139). It deliberately
 * stops below 70: the profile sheet has tooltips inside it, and `Tooltip` sits at
 * `70 + depth`, so raising the sheet into that band would bury its own hovers.
 */
export const MODAL_Z_DEFAULT = 60;
export const MODAL_Z_ABOVE_INTERRUPT = 65;

interface ModalProps {
  open: boolean;
  onClose: () => void;
  maxWidth?: number;
  animation?: 'anim-fade' | 'anim-fade-up';
  /**
   * Stacking band. Defaults to `MODAL_Z_DEFAULT`, so every existing surface is
   * untouched; pass `MODAL_Z_ABOVE_INTERRUPT` to open above a modal-tier interrupt.
   */
  zIndex?: number;
  /** Accessible label for the dialog (aria-label). */
  'aria-label'?: string;
  /**
   * Extra classes on the panel element. Added for `RevealCard` to apply
   * `.frame-ceremonial` without forking Modal (THR-799); the panel's own gold
   * border becomes that frame's outer edge.
   */
  panelClassName?: string;
  children: React.ReactNode;
}

/**
 * Modal — portal-based dialog.
 *
 * Does NOT use AnimateMount because the wrapper div it creates breaks
 * `position: fixed` when animation keyframes use `transform` (creates
 * a new containing block). Instead, the backdrop div handles its own
 * mount/unmount lifecycle and applies animation classes directly.
 */
function ModalRoot({ open, onClose, maxWidth = 600, animation = 'anim-fade-up', zIndex = MODAL_Z_DEFAULT, 'aria-label': ariaLabel, panelClassName, children }: ModalProps) {
  const [shouldRender, setShouldRender] = useState(open);
  const [animClass, setAnimClass] = useState('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, handleEscape]);

  /**
   * Law 50 — focus follows the surface: opening moves focus into the panel,
   * closing hands it back to whatever opened it.
   *
   * Gated on `shouldRender` as well as `open` because the panel does not exist
   * on the render where `open` first flips true — the mount effect below sets
   * `shouldRender` a render later, and focusing before that is a no-op.
   */
  useEffect(() => {
    if (!open || !shouldRender) return;

    const invoker = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const panel = panelRef.current;
    if (panel) {
      // The panel itself is the fallback target, so a modal with no controls
      // still takes focus off the page behind it.
      (panel.querySelector<HTMLElement>(FOCUSABLE_SELECTOR) ?? panel).focus();
    }

    return () => {
      // Fail-soft (NFP #4): the invoker may have unmounted while we were open —
      // a row that opened a sheet and was then filtered out of its list.
      if (invoker?.isConnected) invoker.focus();
    };
  }, [open, shouldRender]);

  /**
   * Law 50 — Tab cycles within the overlay while modal. Scoped to the panel
   * rather than the document so nested modals each trap their own subtree:
   * both portal to `document.body`, so an outer panel is not an ancestor of an
   * inner one and never sees its keystrokes.
   */
  const handlePanelKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') return;
    const panel = panelRef.current;
    if (!panel) return;

    const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    if (focusable.length === 0) {
      // Nothing to cycle to; hold focus here rather than let it escape behind.
      e.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (e.shiftKey && (active === first || active === panel)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  // Mount/unmount with animation — inline to avoid AnimateMount wrapper div
  useEffect(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (open) {
      setShouldRender(true);
      requestAnimationFrame(() => setAnimClass(`${animation}-enter`));
    } else if (shouldRender) {
      setAnimClass(`${animation}-exit`);
      timeoutRef.current = setTimeout(() => {
        setShouldRender(false);
        setAnimClass('');
      }, 200);
    }
    return () => {
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    };
  }, [open, animation, shouldRender]);

  if (!shouldRender) return null;

  const backdrop: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: '5vh',
  };

  const panel: React.CSSProperties = {
    background: 'linear-gradient(180deg, var(--bg-deep), var(--bg-abyss))',
    border: '1px solid var(--border-gold)',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 1px var(--border-gold-strong)',
    maxWidth: `${maxWidth}px`,
    width: '90%',
    maxHeight: '75vh',
    display: 'flex',
    flexDirection: 'column',
  };

  return createPortal(
    <div
      className={animClass}
      style={backdrop}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <div
        ref={panelRef}
        className={panelClassName}
        style={panel}
        tabIndex={-1}
        onKeyDown={handlePanelKeyDown}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

function Header({ children, onClose }: { children: React.ReactNode; onClose?: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: 'var(--panel-padding)',
        borderBottom: '1px solid var(--border-gold)',
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-lg)',
        color: 'var(--text-primary)',
      }}
    >
      <span style={{ flex: 1 }}>{children}</span>
      {onClose && (
        <IconButton icon={<span>×</span>} variant="close" size="sm" aria-label="Close" onClick={onClose} />
      )}
    </div>
  );
}

function Body({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: 'var(--panel-padding)', overflowY: 'auto', flex: 1 }}>
      {children}
    </div>
  );
}

function Footer({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 'var(--space-2)',
        padding: 'var(--panel-padding)',
      }}
    >
      {children}
    </div>
  );
}

export const Modal = Object.assign(ModalRoot, { Header, Body, Footer });
