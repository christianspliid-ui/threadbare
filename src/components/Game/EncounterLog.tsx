import { memo } from 'react';
import type { EncounterTemplate, EncounterProgress } from '../../types/encounter';

interface EncounterLogProps {
  progress: EncounterProgress;
  template: EncounterTemplate;
  agentName: string;
}

/**
 * Renders a single active or completed encounter's progress.
 * Shows title, step indicators, current narrative, and status.
 */
export const EncounterLog = memo(function EncounterLog({
  progress,
  template,
  agentName,
}: EncounterLogProps) {
  const currentStep = template.steps[progress.currentEncounterIndex];

  // Determine status styling
  const isActive = progress.status === 'active';
  const isCompleted = progress.status === 'completed';
  const isAbandoned = progress.status === 'abandoned';

  // Get threat rating color (simple mapping)
  const threatColors: Record<string, string> = {
    trivial: '#4ade80',   // green
    easy: '#60a5fa',      // blue
    moderate: '#fbbf24',  // amber
    hard: '#f87171',      // red
    deadly: '#d946ef',    // magenta
  };
  const threatColor = threatColors[template.threatRating] ?? '#a78bfa'; // default purple

  return (
    <div
      className="relative rounded-lg border p-4 mb-4 transition-opacity"
      style={{
        backgroundColor: 'var(--bg-raised)',
        borderColor: isActive ? 'var(--accent-gold)' : 'var(--border-subtle)',
        borderWidth: isActive ? '2px' : '1px',
        opacity: isAbandoned ? 0.6 : 1,
      }}
    >
      {/* Title bar with status */}
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="flex-1 min-w-0">
          <h4
            className="font-semibold truncate"
            style={{
              fontSize: 'var(--text-sm)',
              color: isAbandoned ? 'var(--text-tertiary)' : 'var(--text-primary)',
            }}
          >
            {agentName} faces {template.name}
          </h4>
        </div>

        {/* Threat rating badge */}
        <div
          className="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
          style={{
            backgroundColor: threatColor,
            color: 'white',
          }}
        >
          {template.threatRating}
        </div>

        {/* Status indicator */}
        <div className="flex-shrink-0">
          {isCompleted && (
            <span style={{ color: '#4ade80', fontSize: '16px' }}>✓</span>
          )}
          {isAbandoned && (
            <span style={{ color: '#ef4444', fontSize: '16px' }}>✕</span>
          )}
        </div>
      </div>

      {/* Step progress indicators (dots) */}
      <div className="flex gap-1 mb-3">
        {template.steps.map((step, idx) => {
          const isCurrentOrPassed = idx <= progress.currentEncounterIndex;
          return (
            <div
              key={step.id}
              className="w-2 h-2 rounded-full transition-opacity"
              style={{
                backgroundColor: isCurrentOrPassed
                  ? 'var(--accent-gold)'
                  : 'var(--border-subtle)',
                opacity: isCurrentOrPassed ? 1 : 0.4,
              }}
            />
          );
        })}
      </div>

      {/* Current step narrative */}
      {currentStep && (
        <div>
          <p
            className="text-xs font-semibold mb-2 uppercase tracking-wider"
            style={{
              color: 'var(--text-secondary)',
            }}
          >
            {currentStep.name}
          </p>
          <p
            className="text-xs leading-relaxed"
            style={{
              color: isAbandoned
                ? 'var(--text-tertiary)'
                : 'var(--text-primary)',
            }}
          >
            {currentStep.narrative}
          </p>
        </div>
      )}

      {/* Glow effect for active encounters */}
      {isActive && (
        <div
          className="absolute inset-0 rounded-lg pointer-events-none opacity-30"
          style={{
            boxShadow: 'inset 0 0 8px var(--accent-gold)',
          }}
        />
      )}
    </div>
  );
});
