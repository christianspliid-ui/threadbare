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
import { HOVER_CARD_MAX_SECTIONS } from '../../types/detailPage';
import { Section } from './Section';
import { TEXT_TOKENS_REM, remToPx } from './layoutContract';
import { RowPicture } from './RowPicture';
import { Icon } from './Icon';
import type { IconName } from '../../data/icons/iconRegistry';
import type { EntityVisualDescriptor } from '../../engine/views/entityVisualResolver';

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

  // `--hovercard-w` in px at the live root size (THR-1819).
  const maxLeft = viewport.width - remToPx(TEXT_TOKENS_REM.hovercardW) - HOVER_CARD_MARGIN_PX;
  const left = Math.max(HOVER_CARD_MARGIN_PX, Math.min(anchor.left, maxLeft));

  return { top, left };
}

type HoverSection = DetailPage['sections'][number];

/**
 * THR-2125 R4.4 (decision 6) — the hover card's Now line: the `headline` of the first
 * section carrying a `highlight` (art-led R5; at most one per page). A headline equal to
 * the page's own name (a faction's) is skipped, so the name is said once. `null` = no Now
 * line, nothing drawn in its place.
 */
export function hoverNow(
  page: DetailPage,
  composedBody?: readonly unknown[] | null,
): { headline: string; icon: IconName; index: number } | null {
  const own = hoverNowFrom(page.sections ?? [], page.displayName);
  if (own) return own;
  // The hover page is the graph-only legacy page; a mortal's want resolves only with the
  // game state in context. GameView passes the Inspector's composed body for the same
  // subject, so the Now line is the very headline its Inspector page draws (index -1:
  // not one of the card's own sections, so nothing in the body is stripped).
  const composed = composedBody ? hoverNowFrom(composedBody, page.displayName) : null;
  return composed ? { ...composed, index: -1 } : null;
}

function hoverNowFrom(
  sections: readonly unknown[],
  displayName: string | undefined,
): { headline: string; icon: IconName; index: number } | null {
  const index = sections.findIndex((s) => !!(s as { highlight?: unknown } | null)?.highlight);
  if (index < 0) return null;
  const hl = (sections[index] as { highlight?: { headline: string; icon: IconName } }).highlight;
  const headline = hl?.headline?.trim();
  if (!hl || !headline) return null;
  if (headline.toLowerCase() === (displayName ?? '').trim().toLowerCase()) return null;
  return { headline, icon: hl.icon, index };
}

/** R4.5 — the body section without the headline the Now line promoted. */
function withoutHighlight(section: HoverSection): HoverSection {
  if (!(section as { highlight?: unknown }).highlight) return section;
  const { highlight: _drop, ...rest } = section as HoverSection & { highlight?: unknown };
  void _drop;
  return rest as HoverSection;
}

export function HoverCard({ page, anchorEl, visual, composedBody }: {
  page: DetailPage;
  anchorEl: HTMLElement;
  /**
   * THR-2103 (decision 5) — the subject's picture at chip size beside the name, resolved by
   * the host (knowledge-gated, Law 8). Absent or null ⇒ the header draws as before.
   */
  visual?: EntityVisualDescriptor | null;
  /** THR-2125 R4.4 — the subject's Inspector body (state-composed), where its Now headline lives. */
  composedBody?: readonly unknown[] | null;
}) {
  const rect = anchorEl.getBoundingClientRect();
  const { top, left } = hoverCardPosition(rect, {
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const sphereVar = `var(--sphere-${page.sphere}-bright, var(--accent-gold))`;
  const subtitle = page.subtitle?.trim() ?? '';
  const now = hoverNow(page, composedBody);

  const style: CSSProperties = {
    position: 'fixed',
    top,
    left,
    width: 'var(--hovercard-w)',
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
      <div
        style={{ padding: '10px 14px 8px', borderBottom: '1px solid var(--border-gold)', display: 'flex', gap: '10px', alignItems: 'center' }}
        {...(visual ? { 'data-row-subject': visual.kind, 'data-row-art': visual.tier } : {})}
      >
        <RowPicture visual={visual} testId="hover-card-visual" />
        <div style={{ minWidth: 0, flex: '1 1 auto' }}>
        {/* THR-2125 R4.3 — the sub-kind joins the kind label (Panel anatomy § 5). */}
        <div
          data-hover-kind=""
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: 'var(--text-xs)',
            color: sphereVar,
            marginBottom: 'var(--space-1)',
          }}
        >
          {page.kindLabel}
          {subtitle && <span style={{ color: 'var(--text-tertiary)' }}>{` · ${subtitle}`}</span>}
        </div>
        <div
          data-row-name=""
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: 'var(--text-sm)',
            color: 'var(--text-primary)',
          }}
        >
          {page.displayName}
        </div>
        {/* THR-2125 R4.4 / decision 6 — the second line is Now: the page's one highlighted line. */}
        {now && (
          <div
            data-hover-now=""
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-1)',
              fontFamily: 'var(--font-body)',
              fontWeight: 400,
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
            }}
          >
            <Icon name={now.icon} size="floor" decorative />
            {now.headline}
          </div>
        )}
        </div>
      </div>
      <div style={{ padding: '10px 14px', overflow: 'hidden' }}>
        {page.sections.slice(0, HOVER_CARD_MAX_SECTIONS).map((section, index) => (
          <Section
            key={`${section.typeId}-${index}`}
            // R4.5 — a promoted headline is not said twice.
            section={now && now.index === index ? withoutHighlight(section) : section}
          />
        ))}
      </div>
    </div>,
    document.body,
  );
}
