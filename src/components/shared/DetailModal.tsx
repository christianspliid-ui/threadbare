import { createPortal } from 'react-dom';
import type { CSSProperties } from 'react';
import type { DetailPage } from '../../types/detailPage';
import {
  DETAIL_DEFAULT_H,
  DETAIL_DEFAULT_W,
  DETAIL_DIM_BENEATH_PCT,
  DETAIL_EVENT_H,
  DETAIL_EVENT_W,
  DETAIL_GROUP_H,
  DETAIL_GROUP_W,
  DETAIL_PLACE_H,
  DETAIL_PLACE_W,
} from '../../types/detailPage';
import { useDetailStack } from '../../contexts/DetailModalStackContext';
import { DetailBreadcrumb } from './DetailBreadcrumb';
import { Section } from './Section';
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

function DetailFooter({ hasFullSheet }: { hasFullSheet: boolean }) {
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
          open her sheet ↗
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
    <div style={backdropStyle} data-detail-depth={depth}>
      <div
        style={panelStyle}
        data-testid={`detail-panel-${depth}`}
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
        <DetailFooter hasFullSheet={page.hasFullSheet} />
      </div>
    </div>
  );
}

/**
 * DetailModal — portal-based stacked detail page shell.
 *
 * Place inside a `DetailModalStackProvider`. Renders all open detail pages.
 * Keyboard behavior (ESC + ←) is handled globally by DetailModalStackProvider.
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
