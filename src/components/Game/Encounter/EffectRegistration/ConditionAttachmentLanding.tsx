import React from 'react';
import {
  type EffectLandingCommonProps,
  LANDING_LABEL_STYLE,
  sphereBrightVar,
  useLandingLifecycle,
} from './_shared';
import { REGISTRATION_FLIP_CONDITION_ATTACHMENT_MS } from '../../../../data/encounter-experience-constants';

/**
 * ConditionAttachmentLanding — protagonist gains a new condition pill beneath
 * her name. Old pill cross-fades out 200ms; new pill fades up + 4px slide,
 * 240ms; spirit-violet thread tugs from chest in portrait into the new pill.
 * Sphere coding: spirit / spirit-violet. Spec: §4.1 row 2.
 */
export interface ConditionAttachmentLandingData {
  /** ALLCAPS label, e.g. "CONDITION" */
  readonly label: string;
  /** Pill name, e.g. "Sworn-witness" */
  readonly pillName: string;
  /** Italic qualifier, e.g. "she has spoken what she saw" */
  readonly qualifier: string;
}

export interface ConditionAttachmentLandingProps extends EffectLandingCommonProps {
  readonly data: ConditionAttachmentLandingData;
}

export function ConditionAttachmentLanding({
  data,
  ...common
}: ConditionAttachmentLandingProps) {
  const phase = useLandingLifecycle({
    ...common,
    motionDurationMs: REGISTRATION_FLIP_CONDITION_ATTACHMENT_MS,
  });
  const sphereColor = sphereBrightVar('spirit');

  if (phase === 'pending') {
    return (
      <div data-testid="effect-registration-condition-attachment" data-phase="pending" aria-hidden="true" />
    );
  }

  const isAnimating = phase === 'animating';

  return (
    <div
      data-testid="effect-registration-condition-attachment"
      data-phase={phase}
      style={{
        padding: '6px 10px',
        borderRadius: 999,
        border: `1px solid ${sphereColor}`,
        background: `color-mix(in oklab, ${sphereColor} 12%, transparent)`,
        display: 'inline-flex',
        flexDirection: 'column',
        gap: 2,
        opacity: isAnimating ? 0 : 1,
        transform: isAnimating ? 'translateY(4px)' : 'translateY(0)',
        transition: `opacity ${REGISTRATION_FLIP_CONDITION_ATTACHMENT_MS}ms ease-out, transform ${REGISTRATION_FLIP_CONDITION_ATTACHMENT_MS}ms ease-out`,
      }}
    >
      <div style={{ ...LANDING_LABEL_STYLE, color: sphereColor }}>{data.label}</div>
      <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{data.pillName}</div>
      <div style={{ fontSize: 11, fontStyle: 'italic', color: 'var(--text-tertiary)' }}>
        {data.qualifier}
      </div>
    </div>
  );
}
