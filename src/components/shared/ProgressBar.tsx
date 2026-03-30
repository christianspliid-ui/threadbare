import React from 'react';
import { PROGRESS_BAR_BACKGROUND, PROGRESS_BAR_GLOW_OPACITY } from '../../data/uiColorPalette';

interface ProgressBarProps {
  /**
   * Progress value as a decimal (0.0 to 1.0)
   */
  progress: number;

  /**
   * Color of the progress fill (hex code)
   */
  color: string;

  /**
   * Whether to show a glowing boxShadow effect (default: true)
   */
  glow?: boolean;

  /**
   * Optional CSS class for custom styling
   */
  className?: string;

  /**
   * Optional test ID for testing
   */
  dataTestId?: string;
}

/**
 * Shared progress bar component used by MandateTracker and DoomBar.
 * Eliminates code duplication while maintaining Threadbare visual style.
 */
export const ProgressBar = React.memo(function ProgressBar({
  progress,
  color,
  glow = true,
  className = 'h-2',
  dataTestId,
}: ProgressBarProps) {
  const percentage = Math.round(progress * 100);

  return (
    <div
      className={`${className} rounded-full overflow-hidden`}
      style={{ backgroundColor: 'var(--bg-raised)' }}
      data-testid={dataTestId}
    >
      <div
        className="rounded-full transition-all duration-500 ease-out"
        style={{
          height: '100%',
          width: `${percentage}%`,
          backgroundColor: color,
          boxShadow: glow ? `0 0 8px ${color}${PROGRESS_BAR_GLOW_OPACITY}` : undefined,
        }}
      />
    </div>
  );
});
