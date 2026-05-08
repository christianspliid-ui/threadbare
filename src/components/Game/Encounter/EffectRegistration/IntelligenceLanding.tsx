import React from 'react';
import {
  type EffectLandingCommonProps,
  LandingCard,
  LANDING_LABEL_STYLE,
  LANDING_TAIL_STYLE,
  sphereBrightVar,
  useLandingLifecycle,
} from './_shared';
import { REGISTRATION_FLIP_INTELLIGENCE_MS } from '../../../../data/encounter-experience-constants';

/**
 * IntelligenceLanding — a clue card materialises in the items rail (hero panel).
 * Sphere coding: eye / mind-blue. Card-flip in (rotateX 80→0, 420ms).
 * Spec: §4.1 row 1.
 */
export interface IntelligenceLandingData {
  /** Top label, e.g. "CLUE · NEW" */
  readonly label: string;
  /** The clue itself — a sentence the protagonist now knows. */
  readonly name: string;
  /** Italic tail, e.g. "eye · she will see it in him next time" */
  readonly tail: string;
}

export interface IntelligenceLandingProps extends EffectLandingCommonProps {
  readonly data: IntelligenceLandingData;
}

export function IntelligenceLanding({ data, ...common }: IntelligenceLandingProps) {
  const phase = useLandingLifecycle({
    ...common,
    motionDurationMs: REGISTRATION_FLIP_INTELLIGENCE_MS,
  });
  const sphereColor = sphereBrightVar('mind');

  return (
    <LandingCard
      sphere="mind"
      motionDurationMs={REGISTRATION_FLIP_INTELLIGENCE_MS}
      phase={phase}
      suppressPulseRing={common.suppressPulseRing}
      testId="effect-registration-intelligence"
    >
      <div style={{ ...LANDING_LABEL_STYLE, color: sphereColor }}>{data.label}</div>
      <div style={{ fontSize: 13, marginTop: 2, color: 'var(--text-primary)' }}>
        {data.name}
      </div>
      <div style={LANDING_TAIL_STYLE}>{data.tail}</div>
    </LandingCard>
  );
}
