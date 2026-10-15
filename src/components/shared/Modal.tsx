import { IconButton } from './IconButton';
import { Overlay, type OverlayAnimation, type OverlayProps } from './Overlay';
import { PanelLevelScope, panelStyle } from './Panel';
import { Z_BAND } from './zBands';
import { dialogContextClass, type DialogContext } from './dialogContext';

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
export const MODAL_Z_DEFAULT = Z_BAND.modal;
export const MODAL_Z_ABOVE_INTERRUPT = Z_BAND.modalAboveInterrupt;

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
  /**
   * Whether Escape closes this modal (default true). A modal whose `onClose`
   * deliberately ignores implicit closes (PremonitionModal, THR-1711) passes
   * false, so it registers no escape layer and Escape reaches the surface
   * beneath it instead of being swallowed (THR-1816).
   */
  closeOnEscape?: boolean;
  /** Accessible label for the dialog (aria-label). */
  'aria-label'?: string;
  /**
   * Extra classes on the panel element. Added for `RevealCard` to apply
   * `.frame-ceremonial` without forking Modal (THR-799); the panel's own gold
   * border becomes that frame's outer edge.
   */
  panelClassName?: string;
  /**
   * Dialogue context (THR-1586) — which kind of moment this dialog is. Applies the
   * matching `.dialog-ctx-*` class, whose local `--dlg-*` properties the panel
   * reads. Omitted (neutral) renders exactly as before: no class, and every
   * `var(--dlg-*)` falls back to the neutral value. Reference surfaces pass none.
   */
  context?: DialogContext;
  children: React.ReactNode;
}

/**
 * The panel look, shared by `Modal` and the StyleGuide's static context previews
 * (Law 27 — one copy of the panel). It is `Panel`'s `page` level, floating, plus
 * the dialog's width and the one height cap. Every `--dlg-*` read carries the
 * neutral value as its fallback, so a panel with no context class is unchanged.
 */
export function modalPanelStyle(maxWidth = 600): React.CSSProperties {
  return {
    ...panelStyle('page', { floating: true }),
    maxWidth: `${maxWidth}px`,
    width: '90%',
    maxHeight: 'var(--modal-max-h)', // 85vh — the one dialog cap (Law 33, THR-1819)
    display: 'flex',
    flexDirection: 'column',
  };
}

/** Modal's `animation` prop names the CSS class pair; Overlay names the motion. */
const MODAL_ANIMATION: Record<NonNullable<ModalProps['animation']>, OverlayAnimation> = {
  'anim-fade': 'fade',
  'anim-fade-up': 'fade-up',
};

/** Modal's numeric `zIndex` prop, read back as a named band where it is one. */
function bandFor(zIndex: number): Pick<OverlayProps, 'band' | 'zIndexOverride'> {
  if (zIndex === Z_BAND.modal) return { band: 'modal' };
  if (zIndex === Z_BAND.modalAboveInterrupt) return { band: 'modalAboveInterrupt' };
  return { band: 'modal', zIndexOverride: zIndex };
}

/**
 * Modal — the dialog: an `Overlay` (portal, dim backdrop, modal band, the Escape
 * stack, focus) whose surface is a floating `page` panel (THR-1884). Its props are
 * unchanged from before the re-base; THR-1820's `size` tiers will sit here, never
 * on Overlay.
 */
function ModalRoot({ open, onClose, maxWidth = 600, animation = 'anim-fade-up', zIndex = MODAL_Z_DEFAULT, closeOnEscape = true, 'aria-label': ariaLabel, panelClassName, context = 'neutral', children }: ModalProps) {
  const panelClasses = [dialogContextClass(context), panelClassName].filter(Boolean).join(' ') || undefined;

  return (
    <Overlay
      open={open}
      onClose={onClose}
      label={ariaLabel ?? 'dialog'}
      accessibleName={ariaLabel ?? false}
      {...bandFor(zIndex)}
      backdrop="dim"
      placement="top"
      closeOnEscape={closeOnEscape}
      animation={MODAL_ANIMATION[animation]}
      surfaceStyle={modalPanelStyle(maxWidth)}
      surfaceClassName={panelClasses}
      surfaceProps={{ 'data-dialog-context': context, 'data-panel-level': 'page' }}
    >
      <PanelLevelScope level="page">{children}</PanelLevelScope>
    </Overlay>
  );
}

function Header({ children, onClose }: { children: React.ReactNode; onClose?: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: 'var(--panel-padding)',
        borderBottom: '1px solid var(--dlg-rule, var(--border-gold))',
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-lg)',
        color: 'var(--dlg-text, var(--text-primary))',
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
