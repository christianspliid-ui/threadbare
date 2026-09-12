/**
 * HoverCard — Law 20's Tier 1½ (THR-1490).
 *
 * A tooltip explains a *concept* in a sentence. A card is the whole of a *thing*. Between
 * them sits the glance: you are reading a name in a line of prose and want to know who
 * that is without losing your place. That is this — the card's header and its first
 * section, anchored beside the name, gone when you look away.
 *
 * Three rules it does not break:
 * - **It never stacks.** The router refuses a hover while a modal is open, so there is
 *   never a floating answer on top of a floating answer.
 * - **It is not interactive.** `pointerEvents: none` — there is no control inside it to
 *   reach for and therefore no hover-gap to fall into. To act on the thing, click, and
 *   the card opens properly.
 * - **It stays on screen.** Anchored below the name where there is room and above it
 *   where there is not, and clamped to the viewport (Law 33 — nothing renders off it).
 */

import { createPortal } from 'react-dom';
import type { CSSProperties } from 'react';
import type { DetailPage } from '../../types/detailPage';
import { HOVER_CARD_MAX_SECTIONS, HOVER_CARD_W } from '../../types/detailPage';
import { Section } from './Section';

/** Gap between the anchor and the card, px. */
const HOVER_CARD_GAP_PX = 8;

/** Viewport margin the card keeps clear on every side, px. */
const HOVER_CARD_MARGIN_PX = 12;

/** Ceiling on the card's height; a glance is not a read. */
const HOVER_CARD_MAX_H_PX = 340;

/**
 * Place the card beside its anchor without leaving the viewport.
 *
 * Exported for the test — the clamping is the part that is easy to get wrong and
 * impossible to see in a screenshot taken at one window size.
 */
export function hoverCardPosition(
  anchor: { top: number; bottom: number; left: number },
  viewport: { width: number; height: number },
): { top: number; left: number } {
  const spaceBelow = viewport.height - anchor.bottom;
  const top =
    spaceBelow >= HOVER_CARD_MAX_H_PX + HOVER_CARD_GAP_PX + HOVER_CARD_MARGIN_PX
      ? anchor.bottom + HOVER_CARD_GAP_PX
      : Math.max(HOVER_CARD_MARGIN_PX, anchor.top - HOVER_CARD_MAX_H_PX - HOVER_CARD_GAP_PX);

  const maxLeft = viewport.width - HOVER_CARD_W - HOVER_CARD_MARGIN_PX;
  const left = Math.max(HOVER_CARD_MARGIN_PX, Math.min(anchor.left, maxLeft));

  return { top, left };
}

export function HoverCard({ page, anchorEl }: { page: DetailPage; anchorEl: HTMLElement }) {
  const rect = anchorEl.getBoundingClientRect();
  const { top, left } = hoverCardPosition(rect, {
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const sphereVar = `var(--sphere-${page.sphere}-bright, var(--accent-gold))`;

  const style: CSSProperties = {
    position: 'fixed',
    top,
    left,
    width: HOVER_CARD_W,
    maxHeight: HOVER_CARD_MAX_H_PX,
    // Above the drawers and panels it floats over, below the modal band — a hover card
    // and a modal are never on screen together, so it needs no room above one.
    zIndex: 60,
    background: 'linear-gradient(180deg, var(--bg-deep), var(--bg-abyss))',
    border: '1px solid var(--border-gold)',
    borderRadius: '8px',
    boxShadow: '0 6px 28px rgba(0, 0, 0, 0.6)',
    overflow: 'hidden',
    pointerEvents: 'none',
  };

  return createPortal(
    <div style={style} data-testid="hover-card" role="tooltip" aria-hidden="true">
      <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid var(--border-gold)' }}>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.6rem',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: sphereVar,
            marginBottom: '3px',
          }}
        >
          {page.kindLabel}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.05rem',
            color: 'var(--text-primary)',
            letterSpacing: '0.03em',
          }}
        >
          {page.displayName}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.65rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-tertiary)',
          }}
        >
          {page.subtitle}
        </div>
      </div>
      <div style={{ padding: '10px 14px', overflow: 'hidden' }}>
        {page.sections.slice(0, HOVER_CARD_MAX_SECTIONS).map((section, index) => (
          <Section key={`${section.typeId}-${index}`} section={section} />
        ))}
      </div>
    </div>,
    document.body,
  );
}
