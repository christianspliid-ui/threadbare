import React from 'react';
import {
  type EffectLandingCommonProps,
  LANDING_LABEL_STYLE,
  LANDING_TAIL_STYLE,
  sphereBrightVar,
  useLandingLifecycle,
} from './_shared';
import { REGISTRATION_FLIP_SPAWN_ARTIFACT_MS } from '../../../../data/encounter-experience-constants';

/**
 * SpawnArtifactLanding — items rail flips a new tile; the tile carries a
 * single matter-thread along its edge. Card-flip-in (rotateX 80→0, 460ms —
 * slightly heavier than intelligence). Faint matter-umber rim glow holds
 * for 600ms then settles to none.
 * Sphere coding: matter / matter-umber. Spec: §4.1 row 8.
 */
export interface SpawnArtifactLandingData {
  /** ALLCAPS label, e.g. "ITEM · NEW" */
  readonly label: string;
  /** Artifact name. */
  readonly name: string;
  /** Italic tail, e.g. "matter · favor of the captain" */
  readonly tail: string;
}

export interface SpawnArtifactLandingProps extends EffectLandingCommonProps {
  readonly data: SpawnArtifactLandingData;
}

const RIM_GLOW_HOLD_MS = 600;

export function SpawnArtifactLanding({ data, ...common }: SpawnArtifactLandingProps) {
  const phase = useLandingLifecycle({
    ...common,
    motionDurationMs: REGISTRATION_FLIP_SPAWN_ARTIFACT_MS,
  });
  const sphereColor = sphereBrightVar('matter');

  if (phase === 'pending') {
    return <div data-testid="effect-registration-spawn-artifact" data-phase="pending" aria-hidden="true" />;
  }

  const isAnimating = phase === 'animating';
  const isSettled = phase === 'settled';

  return (
    <div
      data-testid="effect-registration-spawn-artifact"
      data-phase={phase}
      style={{
        padding: '8px 10px',
        borderRadius: 8,
        border: `1px solid ${sphereColor}`,
        background: `linear-gradient(90deg, color-mix(in oklab, ${sphereColor} 10%, transparent), transparent)`,
        perspective: '600px',
        animation: isAnimating
          ? `card-flip-in ${REGISTRATION_FLIP_SPAWN_ARTIFACT_MS}ms cubic-bezier(.2,.7,.2,1) 1`
          : 'none',
        boxShadow: isSettled ? 'none' : `0 0 12px ${sphereColor}`,
        transition: `box-shadow ${RIM_GLOW_HOLD_MS}ms ease-out`,
      }}
    >
      <div style={{ ...LANDING_LABEL_STYLE, color: sphereColor }}>{data.label}</div>
      <div style={{ fontSize: 13, marginTop: 2, color: 'var(--text-primary)' }}>{data.name}</div>
      <div style={LANDING_TAIL_STYLE}>{data.tail}</div>
    </div>
  );
}
