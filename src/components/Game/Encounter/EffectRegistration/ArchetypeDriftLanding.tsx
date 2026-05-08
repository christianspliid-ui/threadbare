import React from 'react';
import {
  type EffectLandingCommonProps,
  type EffectSphere,
  LANDING_LABEL_STYLE,
  sphereBrightVar,
  useLandingLifecycle,
} from './_shared';
import { REGISTRATION_FLIP_ARCHETYPE_DRIFT_MS } from '../../../../data/encounter-experience-constants';

/**
 * ArchetypeDriftLanding — Iron / Eye / Heart capability band grows or shrinks
 * by one dot, italic qualifier rewrites. Single dot fills (240ms ease-out,
 * sphere colour). Faint chaos-grey particle drifts up from the band — drift,
 * never a stat-up animation.
 * Sphere coding: chaos / chaos-grey for the particle; band sphere for the dot.
 * Spec: §4.1 row 10.
 */
export interface ArchetypeDriftLandingData {
  /** Capability band sphere (force/mind/spirit) — drives the dot color. */
  readonly bandSphere: EffectSphere;
  /** ALLCAPS band label, e.g. "HEART · DRIFT" */
  readonly bandLabel: string;
  /** Old phrase, e.g. "her deepest thread" */
  readonly oldPhrase: string;
  /** New phrase, e.g. "the thread she lives by" */
  readonly newPhrase: string;
  /** Italic dot-change tail, e.g. "+1 dot · she is more this now" */
  readonly dotChangeNote: string;
}

export interface ArchetypeDriftLandingProps extends EffectLandingCommonProps {
  readonly data: ArchetypeDriftLandingData;
}

export function ArchetypeDriftLanding({ data, ...common }: ArchetypeDriftLandingProps) {
  const phase = useLandingLifecycle({
    ...common,
    motionDurationMs: REGISTRATION_FLIP_ARCHETYPE_DRIFT_MS,
  });
  const bandColor = sphereBrightVar(data.bandSphere);
  const chaosColor = sphereBrightVar('chaos');

  if (phase === 'pending') {
    return <div data-testid="effect-registration-archetype-drift" data-phase="pending" aria-hidden="true" />;
  }

  const isAnimating = phase === 'animating';

  return (
    <div
      data-testid="effect-registration-archetype-drift"
      data-phase={phase}
      style={{
        position: 'relative',
        padding: '8px 10px',
        borderRadius: 8,
        background: 'var(--bg-raised)',
        borderLeft: `2px solid ${bandColor}`,
      }}
    >
      <div style={{ ...LANDING_LABEL_STYLE, color: bandColor }}>{data.bandLabel}</div>

      {/* Single dot fill — the visible registration motion. */}
      <span
        data-testid="effect-registration-archetype-drift-dot"
        aria-hidden="true"
        style={{
          display: 'inline-block',
          width: 8,
          height: 8,
          borderRadius: 999,
          marginRight: 6,
          marginTop: 4,
          backgroundColor: bandColor,
          opacity: isAnimating ? 0 : 1,
          transition: `opacity ${REGISTRATION_FLIP_ARCHETYPE_DRIFT_MS}ms ease-out`,
        }}
      />

      <span
        style={{
          fontSize: 12,
          color: 'var(--text-primary)',
          opacity: isAnimating ? 0 : 1,
          transition: `opacity ${REGISTRATION_FLIP_ARCHETYPE_DRIFT_MS}ms ease-out`,
        }}
      >
        {isAnimating ? data.oldPhrase : data.newPhrase}
      </span>
      <div style={{ fontSize: 11, fontStyle: 'italic', color: 'var(--text-tertiary)', marginTop: 2 }}>
        {data.dotChangeNote}
      </div>

      {/* Chaos-grey particle drift — visible only during settle, faint. */}
      {phase === 'settled' && !common.suppressPulseRing ? (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: -4,
            left: 8,
            width: 3,
            height: 3,
            borderRadius: 999,
            background: chaosColor,
            opacity: 0.45,
            ['--mark-color' as string]: chaosColor,
            animation: `mark-pulse ${REGISTRATION_FLIP_ARCHETYPE_DRIFT_MS * 2}ms ease-out 1`,
          } as React.CSSProperties}
        />
      ) : null}
    </div>
  );
}
