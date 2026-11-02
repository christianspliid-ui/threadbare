import type { IconName } from '../../data/icons/iconRegistry';
import { SectionLabel } from './Section';

interface SectionHeadingProps {
  children: React.ReactNode;
  count?: number;
  as?: 'h2' | 'h3' | 'h4' | 'div';
  /** Show flanking gold rule lines (LoL Universe style) */
  ornamental?: boolean;
  /**
   * THR-2103 (rule R2) — the heading's carved idea, drawn before its text in the heading's
   * colour, as `SectionLabel` does. Read from a content table, never a literal (Law 58);
   * null or absent draws no shape.
   */
  icon?: IconName | null;
}

/**
 * THR-2122 (U3.3) — a wrapper over `SectionLabel`, the one section heading (Law 27). The
 * count reads "Retinue · 3"; the `.section-heading` class stays as the CSS hook. Its parent
 * spaces it, so it carries no margin of its own.
 */
export function SectionHeading({ children, count, as = 'h3', ornamental, icon }: SectionHeadingProps) {
  const heading = (
    <SectionLabel
      as={as}
      className="section-heading"
      label={children}
      count={count}
      icon={icon ?? undefined}
      flush
      attrs={icon ? { 'data-heading-icon': icon } : undefined}
      style={ornamental ? { whiteSpace: 'nowrap' } : undefined}
    />
  );
  if (ornamental) return <div className="ornamental-rule">{heading}</div>;
  return heading;
}
