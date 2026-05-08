import React from 'react';
import type {
  EncounterArchetypePole,
  EncounterChoiceReach,
} from '../../../types/encounter-contract';

export interface MoralAxisTiltProps {
  reach: EncounterChoiceReach;
  pole: EncounterArchetypePole;
}

/**
 * MoralAxisTilt — small inline element used inside EncounterChoiceCard.
 *
 * Renders the encounter-author-supplied moral-axis pole as iconography +
 * label. Pure presentational: no derivation. The pole word is rendered in
 * Cinzel ALLCAPS, sphere-coloured. Per design plan §5.3 (the "Tilts toward:
 * <pole>" / "↬ tilts toward CONQUEROR" line).
 */
export function MoralAxisTilt({ reach, pole }: MoralAxisTiltProps) {
  // Sphere colour comes from the consuming card's data-reach attribute via
  // the --reach-sphere-bright cascade. Quintessence has no data-reach
  // mapping, so we fall back to the gold accent.
  const accent =
    reach === 'quintessence'
      ? 'var(--accent-gold)'
      : 'var(--reach-sphere-bright)';

  return (
    <div
      data-testid="encounter-moral-axis-tilt"
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 6,
        color: 'var(--text-tertiary)',
        fontSize: 11,
        marginTop: 4,
      }}
    >
      <span aria-hidden="true" style={{ color: accent }}>
        {'↬'}
      </span>
      <span>tilts toward</span>
      <span
        style={{
          color: accent,
          fontFamily: 'var(--font-display)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        {pole}
      </span>
    </div>
  );
}
