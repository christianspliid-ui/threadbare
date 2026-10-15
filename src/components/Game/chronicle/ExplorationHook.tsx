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
          font: 'var(--type-flavor)',
          color: 'var(--text-tertiary)',
          margin: 0,
        }}
      >
        {text}
      </p>
    </div>
  );
});
