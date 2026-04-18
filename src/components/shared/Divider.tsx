interface DividerProps {
  gold?: boolean;
}

export function Divider({ gold }: DividerProps) {
  return (
    <div
      style={{
        height: 1,
        background: gold ? 'var(--border-accent)' : 'var(--border-subtle)',
        margin: '8px 0',
      }}
    />
  );
}
