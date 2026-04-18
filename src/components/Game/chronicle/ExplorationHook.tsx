import { memo } from 'react';

interface ExplorationHookProps {
  text: string;
}

export const ExplorationHook = memo(function ExplorationHook({ text }: ExplorationHookProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px',
        margin: '8px 0',
      }}
    >
      <span
        style={{
          color: 'var(--accent-gold)',
          fontSize: '1rem',
          flexShrink: 0,
          marginTop: '2px',
        }}
      >
        ⟐
      </span>
      <p
        style={{
          fontFamily: 'var(--font-prose)',
          color: 'var(--text-tertiary)',
          fontSize: 'var(--text-xs)',
          fontStyle: 'italic',
          lineHeight: 1.7,
          margin: 0,
        }}
      >
        {text}
      </p>
    </div>
  );
});
