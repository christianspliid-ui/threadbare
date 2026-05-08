import React from 'react';
import {
  type EffectLandingCommonProps,
  LandingCard,
  LANDING_LABEL_STYLE,
  LANDING_TAIL_STYLE,
  sphereBrightVar,
  useLandingLifecycle,
} from './_shared';
import { REGISTRATION_FLIP_RECENT_EVENT_MS } from '../../../../data/encounter-experience-constants';

/**
 * RecentEventLanding — what just happened becomes biography. New card slides
 * into the echo strip, marked INVOKED THIS BEAT. Card-flip-in into the echo
 * strip; gold callback ring pulses on settle.
 * Sphere coding: heart / spirit-violet. Spec: §4.1 row 7.
 */
export interface RecentEventLandingData {
  /** ALLCAPS label, e.g. "INVOKED THIS BEAT" */
  readonly label: string;
  /** Event summary line. */
  readonly summary: string;
  /** Tail tag, e.g. "heart-related · 0 turns ago" */
  readonly tail: string;
}

export interface RecentEventLandingProps extends EffectLandingCommonProps {
  readonly data: RecentEventLandingData;
}

export function RecentEventLanding({ data, ...common }: RecentEventLandingProps) {
  const phase = useLandingLifecycle({
    ...common,
    motionDurationMs: REGISTRATION_FLIP_RECENT_EVENT_MS,
  });
  const sphereColor = sphereBrightVar('spirit');

  return (
    <LandingCard
      sphere="spirit"
      motionDurationMs={REGISTRATION_FLIP_RECENT_EVENT_MS}
      phase={phase}
      suppressPulseRing={common.suppressPulseRing}
      testId="effect-registration-recent-event"
    >
      <div style={{ ...LANDING_LABEL_STYLE, color: sphereColor }}>{data.label}</div>
      <div style={{ fontSize: 13, marginTop: 2, color: 'var(--text-primary)' }}>{data.summary}</div>
      <div style={LANDING_TAIL_STYLE}>{data.tail}</div>
    </LandingCard>
  );
}
