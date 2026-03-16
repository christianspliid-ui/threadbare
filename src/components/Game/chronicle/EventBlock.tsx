import { memo } from 'react';

interface EventBlockProps {
  label: string; // "Stirring" or "Crisis"
  text: string;
}

export const EventBlock = memo(function EventBlock({ label, text }: EventBlockProps) {
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        borderLeft: '3px solid var(--accent-gold)',
        borderRadius: '4px',
        padding: '10px 14px',
        margin: '8px 0',
      }}
    >
      <div
        style={{
          fontSize: '0.7rem',
          textTransform: 'uppercase',
          color: 'var(--accent-gold)',
          letterSpacing: '0.08em',
          fontWeight: 700,
          marginBottom: '6px',
          fontFamily: 'var(--font-display)',
        }}
      >
        {label}
      </div>
      <p
        style={{
          fontFamily: 'var(--font-prose)',
          color: 'var(--text-secondary)',
          fontSize: '0.85rem',
          lineHeight: 1.7,
          margin: 0,
        }}
      >
        {text}
      </p>
    </div>
  );
});
