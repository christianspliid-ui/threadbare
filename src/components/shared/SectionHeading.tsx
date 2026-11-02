import type { IconName } from '../../data/icons/iconRegistry';
import { Icon } from './Icon';

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

function HeadingText({ children, count, icon }: Pick<SectionHeadingProps, 'children' | 'count' | 'icon'>) {
  if (!icon) {
    return (
      <>
        {children}
        {count !== undefined && ` (${count})`}
      </>
    );
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <Icon name={icon} size="chip" decorative />
      <span>
        {children}
        {count !== undefined && ` (${count})`}
      </span>
    </span>
  );
}

export function SectionHeading({ children, count, as: Tag = 'h3', ornamental, icon }: SectionHeadingProps) {
  const iconAttr = icon ? { 'data-heading-icon': icon } : {};
  if (ornamental) {
    return (
      <div className="ornamental-rule">
        <Tag className="section-heading" style={{ whiteSpace: 'nowrap' }} {...iconAttr}>
          <HeadingText count={count} icon={icon}>{children}</HeadingText>
        </Tag>
      </div>
    );
  }
  return (
    <Tag className="section-heading" {...iconAttr}>
      <HeadingText count={count} icon={icon}>{children}</HeadingText>
    </Tag>
  );
}
