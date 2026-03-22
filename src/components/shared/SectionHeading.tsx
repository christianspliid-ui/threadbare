interface SectionHeadingProps {
  children: React.ReactNode;
  count?: number;
  as?: 'h2' | 'h3' | 'h4' | 'div';
  /** Show flanking gold rule lines (LoL Universe style) */
  ornamental?: boolean;
}

export function SectionHeading({ children, count, as: Tag = 'h3', ornamental }: SectionHeadingProps) {
  if (ornamental) {
    return (
      <div className="ornamental-rule">
        <Tag className="section-heading" style={{ whiteSpace: 'nowrap' }}>
          {children}
          {count !== undefined && ` (${count})`}
        </Tag>
      </div>
    );
  }
  return (
    <Tag className="section-heading">
      {children}
      {count !== undefined && ` (${count})`}
    </Tag>
  );
}
