import React from 'react';
import {
  type EffectLandingCommonProps,
  LANDING_LABEL_STYLE,
  sphereBrightVar,
  useLandingLifecycle,
} from './_shared';
import { REGISTRATION_FLIP_ENCOUNTER_SEED_MS } from '../../../../data/encounter-experience-constants';

/**
 * EncounterSeedLanding — a fresh card slides into the moments-that-could-echo
 * strip with a faint orange ring. Dim — not yet promised. Slide-up 8px + fade,
 * 360ms. Time-orange node pulses once at the corner.
 * Sphere coding: time / time-orange. Spec: §4.1 row 5.
 */
export interface EncounterSeedLandingData {
  /** ALLCAPS label, e.g. "SEED · ELIGIBLE" */
  readonly label: string;
  /** Seed summary, e.g. "A reckoning at the iron market." */
  readonly summary: string;
  /** When-tail, e.g. "time · 3–7 turns from now · veiren-related" */
  readonly when: string;
}

export interface EncounterSeedLandingProps extends EffectLandingCommonProps {
  readonly data: EncounterSeedLandingData;
}

export function EncounterSeedLanding({ data, ...common }: EncounterSeedLandingProps) {
  const phase = useLandingLifecycle({
    ...common,
    motionDurationMs: REGISTRATION_FLIP_ENCOUNTER_SEED_MS,
  });
  const sphereColor = sphereBrightVar('time');

  if (phase === 'pending') {
    return <div data-testid="effect-registration-encounter-seed" data-phase="pending" aria-hidden="true" />;
  }

  const isAnimating = phase === 'animating';

  return (
    <div
      data-testid="effect-registration-encounter-seed"
      data-phase={phase}
      style={{
        position: 'relative',
        padding: '8px 10px',
        borderRadius: 8,
        border: `1px solid ${sphereColor}`,
        background: `color-mix(in oklab, ${sphereColor} 6%, transparent)`,
        opacity: isAnimating ? 0 : 0.85,
        transform: isAnimating ? 'translateY(8px)' : 'translateY(0)',
        transition: `opacity ${REGISTRATION_FLIP_ENCOUNTER_SEED_MS}ms ease-out, transform ${REGISTRATION_FLIP_ENCOUNTER_SEED_MS}ms ease-out`,
      }}
    >
      {!common.suppressPulseRing && phase === 'settled' ? (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 4,
            right: 6,
            width: 6,
            height: 6,
            borderRadius: 999,
            background: sphereColor,
            ['--mark-color' as string]: sphereColor,
            animation: `mark-pulse ${REGISTRATION_FLIP_ENCOUNTER_SEED_MS}ms ease-out 1`,
          } as React.CSSProperties}
        />
      ) : null}
      <div style={{ ...LANDING_LABEL_STYLE, color: sphereColor }}>{data.label}</div>
      <div style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 2 }}>{data.summary}</div>
      <div style={{ fontSize: 11, fontStyle: 'italic', color: 'var(--text-tertiary)', marginTop: 2 }}>
        {data.when}
      </div>
    </div>
  );
}
