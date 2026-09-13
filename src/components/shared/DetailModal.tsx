import { createPortal } from 'react-dom';
import { useRef, type CSSProperties } from 'react';
import type { DetailPage, DetailPageKind } from '../../types/detailPage';
import {
  DETAIL_DEFAULT_H,
  DETAIL_DEFAULT_W,
  DETAIL_DIM_BENEATH_PCT,
  DETAIL_EVENT_H,
  DETAIL_EVENT_W,
  DETAIL_GROUP_H,
  DETAIL_CONTENT_H,
  DETAIL_CONTENT_W,
  DETAIL_GROUP_W,
  DETAIL_PLACE_H,
  DETAIL_PLACE_W,
} from '../../types/detailPage';
import { useDetailStack } from '../../contexts/DetailModalStackContext';
import { DetailBreadcrumb } from './DetailBreadcrumb';
import { Section } from './Section';
import { useDialogFocus } from './useDialogFocus';
import { ProseTtsButton } from '../Game/Encounter/ProseTtsButton';

interface HeaderProps {
  page: DetailPage;
  onClose: () => void;
  onPop: () => void;
  onPopTo: (index: number) => void;
  canGoBack: boolean;
}

function DetailHeader({ page, onClose, onPop, onPopTo, canGoBack }: HeaderProps) {
  const sphereVar = `var(--sphere-${page.sphere}-bright, var(--accent-gold))`;

  return (
    <div
      style={{
        padding: '12px 16px 10px',
        borderBottom: '1px solid var(--border-gold)',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <div style={{ flex: 1 }}>
          <DetailBreadcrumb trail={page.trail} onNavigate={onPopTo} />
        </div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
          <DetailProseNarration page={page} />
          {canGoBack && (
            <button
              onClick={onPop}
              aria-label="Go back"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-tertiary)',
                cursor: 'pointer',
                fontSize: '1.1rem',
                padding: '0 4px',
                lineHeight: 1,
              }}
            >
              ←
            </button>
          )}
          <button
            onClick={onClose}
            aria-label="Close detail"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              fontSize: '1.2rem',
              padding: '0 4px',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      </div>

      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '0.65rem',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: sphereVar,
          marginBottom: '4px',
        }}
      >
        {page.kindLabel}
      </div>

      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.25rem',
          color: 'var(--text-primary)',
          marginBottom: '2px',
          letterSpacing: '0.03em',
        }}
      >
        {page.displayName}
      </div>

      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '0.7rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-tertiary)',
        }}
      >
        {page.subtitle}
      </div>
    </div>
  );
}

/**
 * The card's prose, as speech (THR-966's own Done-when, delivered by THR-1490's mount).
 *
 * THR-348 built narration for the encounter veil and the detail page was the other
 * surface it was meant for; it could not have it, because nothing mounted the detail
 * page. Now that something does, the button reads the card's prose in section order.
 *
 * **Prose is not only the `prose` sections.** Filtering on `kind === 'prose'` alone was
 * the first implementation and it put no button on the *actor* card — the most common
 * card in the game — because an actor page leads with `portrait_with_disposition`, a
 * `portrait` section whose paragraph lives in `bodyProse`. An event card's body is
 * likewise on `event-card`. All three are prose someone would want read aloud; chips and
 * panels are labels and rows, and a narration that read chip labels would be worse than
 * none.
 *
 * Renders nothing when the page has no prose at all, so a chips-only card shows no
 * control that does nothing (Law 25).
 */
function narratableProse(page: DetailPage): string[] {
  const strip = (s: string) => s.replace(/<[^>]+>/g, '').trim();
  const out: string[] = [];
  for (const section of page.sections) {
    if (section.kind === 'prose' || section.kind === 'event-card') out.push(strip(section.prose));
    else if (section.kind === 'portrait' && section.bodyProse) out.push(strip(section.bodyProse));
  }
  return out.filter(Boolean);
}

function DetailProseNarration({ page }: { page: DetailPage }) {
  const paragraphs = narratableProse(page);
  if (paragraphs.length === 0) return null;
  return <ProseTtsButton text={paragraphs} label={`Narrate ${page.displayName}`} />;
}

/**
 * The Tier-3 invitation, when there is one (Law 25).
 *
 * The label follows the page kind because the destinations are different rooms: a world
 * object opens *its own sheet*, a content object opens the *codex* — the reference shelf
 * the template lives on. One label for both would send the player looking for a page that
 * is not there (THR-1491).
 */
function ctaLabel(kind: DetailPageKind): string {
  return kind === 'content' ? 'open in codex ↗' : 'open her sheet ↗';
}

function DetailFooter({ page }: { page: DetailPage }) {
  const hasFullSheet = page.hasFullSheet;
  return (
    <div
      style={{
        padding: '8px 16px',
        borderTop: '1px solid var(--border-gold)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontSize: '0.68rem',
          color: 'var(--text-muted)',
          fontStyle: 'italic',
          letterSpacing: '0.02em',
        }}
      >
        ESC closes · ← steps back · the encounter remains paused
      </span>
      {hasFullSheet && (
        <button
          style={{
            background: 'none',
            border: '1px solid var(--border-gold)',
            borderRadius: '4px',
            color: 'var(--accent-gold)',
            cursor: 'pointer',
            fontSize: '0.72rem',
            fontFamily: 'var(--font-display)',
            letterSpacing: '0.06em',
            padding: '4px 10px',
          }}
        >
          {ctaLabel(page.kind)}
        </button>
      )}
    </div>
  );
}

function getPanelSize(page: DetailPage): { width: number; height: number } {
  if (page.kind === 'place') {
    return { width: DETAIL_PLACE_W, height: DETAIL_PLACE_H };
  }
  if (page.kind === 'event') {
    return { width: DETAIL_EVENT_W, height: DETAIL_EVENT_H };
  }
  if (page.kind === 'group') {
    return { width: DETAIL_GROUP_W, height: DETAIL_GROUP_H };
  }
  if (page.kind === 'content') {
    return { width: DETAIL_CONTENT_W, height: DETAIL_CONTENT_H };
  }
  return { width: DETAIL_DEFAULT_W, height: DETAIL_DEFAULT_H };
}

interface PanelProps {
  page: DetailPage;
  depth: number;
  isTopmost: boolean;
  onCloseAll: () => void;
  onPop: () => void;
  onPopTo: (index: number) => void;
}

function DetailModalPanel({
  page,
  depth,
  isTopmost,
  onCloseAll,
  onPop,
  onPopTo,
}: PanelProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  /**
   * Law 50, from the same implementation `Modal` uses (THR-1024).
   *
   * `active` is the panel's whole lifetime rather than `isTopmost`, because this is a
   * *stack*: each panel captures the element focused when it opened, which for a pushed
   * panel is a control inside the panel beneath it. Deactivating a panel when another
   * opens over it would restore focus one level too far and hand the new panel the wrong
   * invoker — popping back would then land the player outside the surface they are still
   * looking at. Trapping needs no `isTopmost` gate either: focus is in the topmost panel,
   * and the ones beneath take `pointerEvents: none`, so no other panel sees the keystroke.
   */
  const { onKeyDown } = useDialogFocus(panelRef, true);

  const { width, height } = getPanelSize(page);
  const zIndex = 70 + depth * 2;
  const backdropBg =
    depth === 0
      ? 'rgba(0, 0, 0, 0.55)'
      : `rgba(0, 0, 0, ${DETAIL_DIM_BENEATH_PCT})`;

  const backdropStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: `${Math.max(3, 5 - depth)}vh`,
    backgroundColor: backdropBg,
    pointerEvents: isTopmost ? 'auto' : 'none',
  };

  const panelStyle: CSSProperties = {
    width,
    height,
    maxHeight: '85vh',
    background: 'linear-gradient(180deg, var(--bg-deep), var(--bg-abyss))',
    border: '1px solid var(--border-gold)',
    borderRadius: '10px',
    boxShadow: '0 8px 40px rgba(0, 0, 0, 0.7)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    pointerEvents: 'auto',
  };

  return (
    <div
      style={backdropStyle}
      data-detail-depth={depth}
      role="dialog"
      // Only the panel the player is actually in claims the page; the ones beneath it
      // are visible context, not competing dialogs.
      aria-modal={isTopmost}
      aria-label={page.displayName}
    >
      <div
        ref={panelRef}
        style={panelStyle}
        data-testid={`detail-panel-${depth}`}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        onClick={event => event.stopPropagation()}
      >
        <DetailHeader
          page={page}
          onClose={onCloseAll}
          onPop={onPop}
          onPopTo={onPopTo}
          canGoBack={depth > 0}
        />
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {page.sections.map((section, index) => (
            <Section key={`${section.typeId}-${index}`} section={section} />
          ))}
        </div>
        <DetailFooter page={page} />
      </div>
    </div>
  );
}

/**
 * DetailModal — portal-based stacked detail page shell.
 *
 * Place inside a `DetailModalStackProvider`. Renders all open detail pages.
 * Keyboard behavior (ESC + ←) is handled globally by DetailModalStackProvider.
 *
 * ## Why this does not render through `Modal` (THR-1024)
 *
 * THR-1079 decided the overlay-fork fix shape as "compose `Modal`", and for a single
 * content-sized dialog that is right. It does not reach this surface, because what
 * `Modal` owns beyond the contract is a *layout* this one contradicts in four places:
 * panels here are an exact per-kind `width`×`height` (`Modal` is `width: 90%` under a
 * `maxWidth`, with no height at all, so the fixed-height scroll region would be lost);
 * they cap at 85vh rather than 75vh; they stack, each backdrop dimming by depth and
 * going `pointerEvents: none` beneath the topmost; and they sit in their own `70 + 2·depth`
 * band rather than the modal band. Composing would mean giving the primitive panel-style,
 * backdrop-style and pointer-events escape hatches — which is how a primitive stops being
 * one, and would put the fork inside `Modal` instead of next to it.
 *
 * What THR-1079 was actually protecting is that Law 50 has **one** implementation rather
 * than a copy per consumer. That holds: the contract lives in `useDialogFocus`, `Modal`
 * calls it, and so does this. The dialog semantics below mirror `Modal`'s own placement
 * exactly — `role`/`aria-modal`/`aria-label` on the backdrop, `tabIndex={-1}` and the trap
 * on the panel — so "follows `Modal`'s contract" (Law 23) is true element for element.
 */
export function DetailModal() {
  const { stack, pop, popTo } = useDetailStack();
  if (stack.length === 0) return null;

  return createPortal(
    <>
      {stack.map((page, depth) => (
        <DetailModalPanel
          key={`${page.nodeId}-${depth}`}
          page={page}
          depth={depth}
          isTopmost={depth === stack.length - 1}
          onCloseAll={() => popTo(-1)}
          onPop={pop}
          onPopTo={popTo}
        />
      ))}
    </>,
    document.body,
  );
}
