interface SectionHeadingProps {
  children: React.ReactNode;
  count?: number;
  as?: 'h2' | 'h3' | 'h4' | 'div';
}

export function SectionHeading({ children, count, as: Tag = 'h3' }: SectionHeadingProps) {
  return (
    <Tag className="section-heading">
      {children}
      {count !== undefined && ` (${count})`}
    </Tag>
  );
}
