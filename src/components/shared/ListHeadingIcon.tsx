/**
 * ListHeadingIcon (THR-2103, art-led pass slice 7, S7.3) — the carved shape a list heading
 * draws before its text, read from `LIST_HEADING_ICONS` (Law 58). A `null` row draws nothing.
 * Used where a heading is a styled label rather than a `SectionHeading`; it carries
 * `data-heading-icon`, which `__DEBUG.getListDressing()` reads.
 */
import type { CSSProperties } from 'react';
import { Icon } from './Icon';
import { listHeadingIcon, type ListHeadingId } from '../../data/view-content';

export function ListHeadingIcon({ id, style }: { id: ListHeadingId; style?: CSSProperties }) {
  const name = listHeadingIcon(id);
  if (!name) return null;
  return (
    <span data-heading-icon={name} style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0, ...style }}>
      <Icon name={name} size="chip" decorative />
    </span>
  );
}
