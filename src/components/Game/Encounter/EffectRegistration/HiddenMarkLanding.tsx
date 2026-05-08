import React from 'react';
import {
  type EffectLandingCommonProps,
  LANDING_LABEL_STYLE,
  sphereBrightVar,
  useLandingLifecycle,
} from './_shared';
import { REGISTRATION_FLIP_HIDDEN_MARK_MS } from '../../../../data/encounter-experience-constants';

/**
 * HiddenMarkLanding — single dark-violet thread draws around portrait edge
 * (700ms). Pill appears beneath portrait with player-only treatment (dotted
 * outline, 35% opacity background). Always lands LAST per §4.2.
 * Sphere coding: darkness / dark-violet. Spec: §4.1 row 6.
 */
export interface HiddenMarkLandingData {
  /** ALLCAPS label, e.g. "HIDDEN · ONLY YOU SEE THIS" */
  readonly label: string;
  /** Mark name, e.g. "Marked by coincidence" */
  readonly markName: string;
  /** Italic descriptor, e.g. "this scene becomes biographical" */
  readonly descriptor: string;
}

export interface HiddenMarkLandingProps extends EffectLandingCommonProps {
  readonly data: HiddenMarkLandingData;
}

export function HiddenMarkLanding({ data, ...common }: HiddenMarkLandingProps) {
  const phase = useLandingLifecycle({
    ...common,
    motionDurationMs: REGISTRATION_FLIP_HIDDEN_MARK_MS,
  });
  const sphereColor = sphereBrightVar('darkness');

  if (phase === 'pending') {
    return <div data-testid="effect-registration-hidden-mark" data-phase="pending" aria-hidden="true" />;
  }

  const isAnimating = phase === 'animating';

  return (
    <div
      data-testid="effect-registration-hidden-mark"
      data-phase={phase}
      style={{
        position: 'relative',
        padding: '8px 10px',
        borderRadius: 8,
        // Player-only treatment: dotted outline, 35% opacity background.
        border: `1px dotted ${sphereColor}`,
        background: `color-mix(in oklab, ${sphereColor} 8%, transparent)`,
        opacity: isAnimating ? 0.35 : 0.75,
        transition: `opacity ${REGISTRATION_FLIP_HIDDEN_MARK_MS}ms ease-out`,
      }}
    >
      <div style={{ ...LANDING_LABEL_STYLE, color: sphereColor }}>{data.label}</div>
      <div style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 2 }}>{data.markName}</div>
      <div style={{ fontSize: 11, fontStyle: 'italic', color: 'var(--text-tertiary)', marginTop: 2 }}>
        {data.descriptor}
      </div>
    </div>
  );
}
