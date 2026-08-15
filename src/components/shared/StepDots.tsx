import { memo } from 'react';

interface StepDotsProps {
  totalSteps: number;
  currentStepIndex: number;
  /** Dot diameter in px */
  size?: number;
  /**
   * 'progress' (default): completed dots + a glowing current dot + pending — the
   *   sequence semantics used by EncounterVignetteModal and LocationView.
   * 'magnitude' (THR-718): a level, not progress — the first `currentStepIndex`
   *   dots are filled, the rest dim, with NO current-dot glow. Used by DomainCard.
   */
  variant?: 'progress' | 'magnitude';
}

/**
 * Shared step-progress dots — filled dots for completed/current, dim for upcoming.
 * Reused by EncounterVignetteModal and LocationView. The optional
 * `magnitude` variant renders a filled/dim level meter (no glow) for DomainCard.
 */
export const StepDots = memo(function StepDots({
  totalSteps,
  currentStepIndex,
  size = 5,
  variant = 'progress',
}: StepDotsProps) {
  return (
    <div
      className="flex gap-1.5 flex-shrink-0"
      style={{ display: 'flex', alignItems: 'center' }}
    >
      {Array.from({ length: totalSteps }).map((_, idx) => {
        let dotColor = 'var(--step-pending)';
        let glow = 'none';

        if (variant === 'magnitude') {
          // Level meter: filled up to currentStepIndex, dim beyond. No current glow.
          if (idx < currentStepIndex) {
            dotColor = 'var(--step-completed)';
          }
        } else if (idx < currentStepIndex) {
          dotColor = 'var(--step-completed)';
        } else if (idx === currentStepIndex) {
          dotColor = 'var(--step-current)';
          glow = '0 0 6px var(--step-current-glow)';
        }

        return (
          <div
            key={idx}
            style={{
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: '50%',
              backgroundColor: dotColor,
              boxShadow: glow,
            }}
          />
        );
      })}
    </div>
  );
});
