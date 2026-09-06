import type React from 'react';
import { TRACE_CATEGORY_COLORS } from '../../../data/uiColorPalette';

export const PANEL_STYLES = {
  background: 'var(--bg-deep)',
  borderColor: 'var(--border-subtle)',
  textColor: 'var(--text-primary)',
  tickColor: 'var(--text-muted)',
  detailBg: 'var(--bg-raised)',
  detailBorder: 'var(--border-subtle)',
  width: 480,
  zIndex: 45,
} as const;

export const CONTAINER_STYLE: React.CSSProperties = {
  position: 'fixed',
  right: 0,
  top: 0,
  bottom: 0,
  width: PANEL_STYLES.width,
  background: PANEL_STYLES.background,
  borderLeft: `1px solid ${PANEL_STYLES.borderColor}`,
  zIndex: PANEL_STYLES.zIndex,
  display: 'flex',
  flexDirection: 'column',
  fontFamily: 'system-ui, sans-serif',
};

export const HEADER_STYLE: React.CSSProperties = {
  padding: '12px 16px',
  borderBottom: `1px solid ${PANEL_STYLES.borderColor}`,
  color: PANEL_STYLES.textColor,
  fontSize: 'var(--text-xs)',
};

/**
 * Ceiling on the wrapped tab strip, in px. The strip wraps rather than
 * overflowing off-panel (THR-1412: 43 tabs in a 480px panel measured
 * scrollWidth 3751 against clientWidth 479, putting 37 of them past the right
 * edge and reachable only by scripted `button.click()`). Wrapping alone would
 * cost ~8 rows of the panel's height, so the strip is capped and scrolls
 * vertically past the cap — every tab stays mouse-reachable while the trace
 * area below keeps the bulk of the panel. Raise for more rows on screen at
 * once, lower to give the trace feed more room.
 */
export const TAB_BAR_MAX_HEIGHT = 112;

export const TAB_BAR_STYLE: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  borderBottom: `1px solid ${PANEL_STYLES.borderColor}`,
  padding: '8px 12px',
  background: 'var(--bg-abyss)',
  maxHeight: TAB_BAR_MAX_HEIGHT,
  overflowY: 'auto',
  // The strip sizes to its content and never gets squeezed by the scroll area
  // below it, which owns `flex: 1`.
  flexShrink: 0,
};

const TAB_BUTTON_BASE: React.CSSProperties = {
  padding: '6px 12px',
  border: 'none',
  background: 'transparent',
  color: PANEL_STYLES.textColor,
  cursor: 'pointer',
  fontSize: 'var(--text-xs)',
  fontWeight: 500,
  transition: 'all 200ms ease-out',
  // Multi-word labels ("Essence Sources") wrap as whole tabs, never mid-label.
  whiteSpace: 'nowrap',
  flexShrink: 0,
};

// RC-019: Pre-computed tab styles to avoid object allocation per render
export const TAB_BUTTON_ACTIVE: React.CSSProperties = {
  ...TAB_BUTTON_BASE,
  borderBottom: `2px solid ${TRACE_CATEGORY_COLORS.action_selection}`,
  color: 'var(--accent-gold)',
  opacity: 1,
};
export const TAB_BUTTON_INACTIVE: React.CSSProperties = {
  ...TAB_BUTTON_BASE,
  borderBottom: 'none',
  color: PANEL_STYLES.textColor,
  opacity: 0.6,
};

export const FILTER_AREA_STYLE: React.CSSProperties = {
  padding: '8px 12px',
  borderBottom: `1px solid ${PANEL_STYLES.borderColor}`,
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px',
  fontSize: 'var(--text-xs)',
};

export const CHECKBOX_LABEL_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  color: PANEL_STYLES.textColor,
  cursor: 'pointer',
  userSelect: 'none',
};

export const SCROLL_AREA_STYLE: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  overflowX: 'hidden',
  padding: '8px',
};

export const EMPTY_STATE_STYLE: React.CSSProperties = {
  padding: '32px 16px',
  textAlign: 'center',
  color: PANEL_STYLES.textColor,
  opacity: 0.4,
  fontSize: 'var(--text-xs)',
};

export const SELECT_STYLE: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  background: 'var(--bg-raised)',
  border: `1px solid var(--border-subtle)`,
  color: 'var(--text-primary)',
  borderRadius: '3px',
  fontSize: 'var(--text-xs)',
  cursor: 'pointer',
};
