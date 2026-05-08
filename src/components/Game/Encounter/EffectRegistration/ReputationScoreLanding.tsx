import React from 'react';
import {
  type EffectLandingCommonProps,
  LANDING_LABEL_STYLE,
  sphereBrightVar,
  useLandingLifecycle,
} from './_shared';
import { REGISTRATION_FLIP_REPUTATION_SCORE_MS } from '../../../../data/encounter-experience-constants';

/**
 * ReputationScoreLanding — qualitative band a faction holds her in moves up
 * or down a step. Old band-word fades through a thread of force-red (180ms),
 * new word lands; soft horizontal pull along the cast tile.
 * Sphere coding: iron / force-red. Spec: §4.1 row 4.
 */
export interface ReputationScoreLandingData {
  /** Faction or actor label, e.g. "CIVIC GUARD OF BREN" */
  readonly groupLabel: string;
  /** Old band word, e.g. "a quiet certainty" */
  readonly oldBandWord: string;
  /** New band word, e.g. "a name they remember" */
  readonly newBandWord: string;
  /** Crossing note tail, e.g. "crossed: from useful to known" */
  readonly crossingNote: string;
}

export interface ReputationScoreLandingProps extends EffectLandingCommonProps {
  readonly data: ReputationScoreLandingData;
}

const SWAP_THROUGH_MS = 180;

export function ReputationScoreLanding({ data, ...common }: ReputationScoreLandingProps) {
  const phase = useLandingLifecycle({
    ...common,
    motionDurationMs: REGISTRATION_FLIP_REPUTATION_SCORE_MS,
  });
  const sphereColor = sphereBrightVar('force');

  if (phase === 'pending') {
    return <div data-testid="effect-registration-reputation-score" data-phase="pending" aria-hidden="true" />;
  }

  const isAnimating = phase === 'animating';

  return (
    <div
      data-testid="effect-registration-reputation-score"
      data-phase={phase}
      style={{
        padding: '8px 10px',
        borderRadius: 8,
        background: 'var(--bg-raised)',
        borderLeft: `2px solid ${sphereColor}`,
        transition: `transform ${REGISTRATION_FLIP_REPUTATION_SCORE_MS}ms ease-out`,
        transform: isAnimating ? 'translateX(-2px)' : 'translateX(0)',
      }}
    >
      <div style={{ ...LANDING_LABEL_STYLE, color: sphereColor }}>{data.groupLabel}</div>
      <div
        data-testid="effect-registration-reputation-score-bandword"
        style={{
          fontSize: 12,
          color: 'var(--text-primary)',
          marginTop: 2,
          position: 'relative',
        }}
      >
        <span
          style={{
            opacity: isAnimating ? 0 : 1,
            transition: `opacity ${SWAP_THROUGH_MS}ms ease-out`,
            color: isAnimating ? sphereColor : 'var(--text-primary)',
          }}
        >
          {isAnimating ? data.oldBandWord : data.newBandWord}
        </span>
      </div>
      <div style={{ fontSize: 11, fontStyle: 'italic', color: 'var(--text-tertiary)', marginTop: 2 }}>
        {data.crossingNote}
      </div>
    </div>
  );
}
