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
  /**
   * THR-1551 (fight on screen F2) — pip shape. 'round' (default) is every
   * existing use; 'square' is the fight clock, so its pip row never reads like
   * the step navigator's round dots on the same screen (Law 10).
   */
  shape?: 'round' | 'square';
  /**
   * THR-1551 — an accessible name for the row (e.g. the clock-state word). When
   * set the row is an `img` with this label and its dots are hidden from
   * assistive tech; unset, the row renders exactly as before.
   */
  ariaLabel?: string;
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
  shape = 'round',
  ariaLabel,
}: StepDotsProps) {
  return (
    <div
      className="flex gap-1.5 flex-shrink-0"
      style={{ display: 'flex', alignItems: 'center' }}
      data-shape={shape === 'square' ? shape : undefined}
      {...(ariaLabel ? { role: 'img', 'aria-label': ariaLabel } : {})}
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
            data-filled={shape === 'square' ? idx < currentStepIndex : undefined}
            aria-hidden={ariaLabel ? true : undefined}
            style={{
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: shape === 'square' ? '2px' : '50%',
              backgroundColor: dotColor,
              boxShadow: glow,
            }}
          />
        );
      })}
    </div>
  );
});
