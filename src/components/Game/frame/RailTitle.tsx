/**
 * RailTitle (THR-2125, legibility 4 R2.1) — the one spelling of a Ledger-rail section's
 * Title: display face, `--text-lg`, 700, primary, its carved heading shape before the words.
 * Threads (both states) and the Chronicle head the rail the same way with it; neither sits
 * in a box — the Title and the space between sections group them (THR-2120 § 3).
 */
import type { CSSProperties, ReactNode } from 'react';
import { ListHeadingIcon } from '../../shared/ListHeadingIcon';
import type { ListHeadingId } from '../../../data/view-content';

export const RAIL_TITLE_STYLE: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 'var(--text-lg)',
  fontWeight: 700,
  color: 'var(--text-primary)',
  paddingBottom: 'var(--space-2)',
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
};

export function RailTitle({
  icon,
  children,
  style,
}: {
  icon?: ListHeadingId;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div data-rail-title="" style={{ ...RAIL_TITLE_STYLE, ...style }}>
      {icon && <ListHeadingIcon id={icon} />}
      {children}
    </div>
  );
}
