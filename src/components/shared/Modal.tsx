import { IconButton } from './IconButton';
import { Icon } from './Icon';
import { Overlay, type OverlayAnimation, type OverlayProps } from './Overlay';
import { PanelLevelScope, panelStyle } from './Panel';
import { Z_BAND } from './zBands';
import { dialogContextClass, type DialogContext } from './dialogContext';
import { DIALOG_SIZE_DEFAULT, dialogSizeStyle, isDialogSize, type DialogSize } from './dialogSize';
import { SheetLayoutContext } from './SheetColumns';

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
  /** Size tier (THR-1820, Law 57). Default `'s'` — 600 px at 1080p, today's default width. */
  size?: DialogSize;
  /**
   * @deprecated THR-1820 — a free width, counted by the UI-debt ratchet (row `modal-maxwidth`).
   * Honoured only when `size` is absent, drawn exactly as before. Kept so surfaces that
   * THR-1827 / THR-1829 retire need no edit before they are deleted.
   */
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
 *
 * A tier name (THR-1820) draws the tier's width; a number is the deprecated free
 * width, drawn exactly as before the tiers (`width: 90%` under that cap).
 */
export function modalPanelStyle(sizeOrMaxWidth: DialogSize | number = DIALOG_SIZE_DEFAULT): React.CSSProperties {
  const width: React.CSSProperties = typeof sizeOrMaxWidth === 'number'
    ? { maxWidth: `${sizeOrMaxWidth}px`, width: '90%', maxHeight: 'var(--modal-max-h)' } // 85vh — the one dialog cap (Law 33, THR-1819)
    : dialogSizeStyle(sizeOrMaxWidth);
  return {
    ...panelStyle('page', { floating: true }),
    ...width,
    display: 'flex',
    flexDirection: 'column',
  };
}

/** What a Modal's panel draws: its tier, or `'free'` on the deprecated `maxWidth` path. */
export function resolveModalSize(size: DialogSize | undefined, maxWidth: number | undefined): DialogSize | 'free' {
  if (size !== undefined) return isDialogSize(size) ? size : DIALOG_SIZE_DEFAULT;
  if (maxWidth !== undefined) return 'free';
  return DIALOG_SIZE_DEFAULT;
}

const warnedOnce = new Set<string>();
function warnOnce(key: string, message: string): void {
  if (warnedOnce.has(key)) return;
  warnedOnce.add(key);
  console.warn(message);
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
 * stack, focus) whose surface is a floating `page` panel (THR-1884). The `size`
 * tier (THR-1820) sits here, never on Overlay; the panel carries `data-dialog-size`
 * and provides `SheetLayoutContext` (`'two'` at L and XL).
 */
function ModalRoot({ open, onClose, size, maxWidth, animation = 'anim-fade-up', zIndex = MODAL_Z_DEFAULT, closeOnEscape = true, 'aria-label': ariaLabel, panelClassName, context = 'neutral', children }: ModalProps) {
  const panelClasses = [dialogContextClass(context), panelClassName].filter(Boolean).join(' ') || undefined;
  const resolved = resolveModalSize(size, maxWidth);
  if (size !== undefined && !isDialogSize(size)) {
    warnOnce(`unknown:${String(size)}`, `[Modal] unknown size "${String(size)}" — drawn as '${DIALOG_SIZE_DEFAULT}' (THR-1820)`);
  } else if (size !== undefined && maxWidth !== undefined && import.meta.env?.DEV) {
    warnOnce(`both:${ariaLabel ?? ''}`, `[Modal] both size and maxWidth passed${ariaLabel ? ` to "${ariaLabel}"` : ''} — size wins (THR-1820)`);
  }
  const sheetLayout = resolved === 'l' || resolved === 'xl' ? 'two' : 'one';

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
      surfaceStyle={modalPanelStyle(resolved === 'free' ? (maxWidth as number) : resolved)}
      surfaceClassName={panelClasses}
      surfaceProps={{ 'data-dialog-context': context, 'data-panel-level': 'page', 'data-dialog-size': resolved }}
    >
      <SheetLayoutContext.Provider value={sheetLayout}>
        <PanelLevelScope level="page">{children}</PanelLevelScope>
      </SheetLayoutContext.Provider>
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
        <IconButton icon={<Icon name="close" size="chip" decorative />} variant="close" size="sm" aria-label="Close" onClick={onClose} />
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
