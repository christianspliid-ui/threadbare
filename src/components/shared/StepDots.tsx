import { memo } from 'react';

interface StepDotsProps {
  totalSteps: number;
  currentStepIndex: number;
  /** Dot diameter in px */
  size?: number;
}

/**
 * Shared step-progress dots — filled dots for completed/current, dim for upcoming.
 * Reused by RetinuePanel, EncounterVignetteModal, and LocationView.
 */
export const StepDots = memo(function StepDots({
  totalSteps,
  currentStepIndex,
  size = 5,
}: StepDotsProps) {
  return (
    <div
      className="flex gap-1.5 flex-shrink-0"
      style={{ display: 'flex', alignItems: 'center' }}
    >
      {Array.from({ length: totalSteps }).map((_, idx) => {
        let dotColor = 'var(--step-pending)';
        let glow = 'none';

        if (idx < currentStepIndex) {
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
