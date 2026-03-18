import { memo } from 'react';
import type { EncounterTemplate, EncounterProgress } from '../../types/encounter';
import { THREAT_RATING_COLORS } from '../../types/encounter';
import { resolveEncounterNarrative } from '../../data/encounter-content';
import { Tooltip } from '../shared/Tooltip';

interface EncounterLogProps {
  progress: EncounterProgress;
  template: EncounterTemplate;
  agentName: string;
  onClick?: () => void;
}

/**
 * Renders a single active or completed encounter's progress.
 * Shows title, step indicators, current narrative, and status.
 */
export const EncounterLog = memo(function EncounterLog({
  progress,
  template,
  agentName,
  onClick,
}: EncounterLogProps) {
  const currentStep = template.steps[progress.currentEncounterIndex];

  // Determine status styling
  const isActive = progress.status === 'active';
  const isCompleted = progress.status === 'completed';
  const isAbandoned = progress.status === 'abandoned';

  const threatColor = THREAT_RATING_COLORS[template.threatRating] ?? '#a78bfa';

  return (
    <div
      className="relative rounded-lg border p-4 mb-4 transition-opacity"
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      style={{
        backgroundColor: 'var(--bg-raised)',
        borderColor: isActive ? 'var(--accent-gold)' : 'var(--border-subtle)',
        borderWidth: isActive ? '2px' : '1px',
        opacity: isAbandoned ? 0.6 : 1,
        cursor: onClick ? 'pointer' : undefined,
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
              fontFamily: 'var(--font-display)',
            }}
          >
            {agentName} faces {template.name}
          </h4>
        </div>

        {/* FE-TT-19: Threat rating badge with tooltip */}
        <Tooltip label="Threat Rating" desc="How dangerous this encounter is. Higher threats demand stronger agents and reward greater narrative weight.">
          <div
            className="flex-shrink-0 px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap border cursor-help"
            style={{
              backgroundColor: 'var(--bg-deep)',
              color: threatColor,
              borderColor: threatColor,
            }}
          >
            {template.threatRating}
          </div>
        </Tooltip>

        {/* Status indicator */}
        <div className="flex-shrink-0">
          {isCompleted && (
            <span style={{ color: 'var(--status-success, #4ade80)', fontSize: '16px' }}>✓</span>
          )}
          {isAbandoned && (
            <span style={{ color: 'var(--status-error, #ef4444)', fontSize: '16px' }}>✕</span>
          )}
        </div>
      </div>

      {/* FE-TT-19: Step progress indicators with tooltip */}
      <Tooltip id="ui.encounter_progress">
        <div
          className="flex gap-1 mb-3 cursor-help"
          role="group"
          aria-label={`Encounter progress: step ${progress.currentEncounterIndex + 1} of ${template.steps.length}`}
        >
        {template.steps.map((step, idx) => {
          const isCurrentOrPassed = idx <= progress.currentEncounterIndex;
          const isCurrent = idx === progress.currentEncounterIndex;
          const stepLabel = isCurrent ? 'current' : isCurrentOrPassed ? 'completed' : 'upcoming';
          return (
            <div
              key={step.id}
              className="w-2 h-2 rounded-full transition-opacity"
              role="img"
              aria-label={`Step ${idx + 1}: ${step.name} (${stepLabel})`}
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
      </Tooltip>

      {/* Current step narrative */}
      {currentStep && (
        <div>
          <Tooltip id="ui.encounter_step">
            <p
              className="text-xs font-semibold mb-2 uppercase tracking-wider cursor-help"
              style={{
                color: 'var(--text-secondary)',
              }}
            >
              {currentStep.name}
            </p>
          </Tooltip>
          <p
            className="text-xs leading-relaxed"
            style={{
              color: isAbandoned
                ? 'var(--text-tertiary)'
                : 'var(--text-primary)',
            }}
          >
            {resolveEncounterNarrative(
              currentStep.narrative,
              agentName,
              currentStep.id,
              template.threatRating,
            )}
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
