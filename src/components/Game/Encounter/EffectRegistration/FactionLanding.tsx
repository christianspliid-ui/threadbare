import React from 'react';
import {
  type EffectLandingCommonProps,
  type EffectSphere,
  LANDING_LABEL_STYLE,
  sphereBrightVar,
  useLandingLifecycle,
} from './_shared';
import { REGISTRATION_FLIP_FACTION_MS } from '../../../../data/encounter-experience-constants';

/**
 * FactionLanding — faction chip pulses; new tone is verbal, not numerical.
 * If the change is large enough, chip swaps colour-class (allied → opposed).
 * Chip border pulses once with the faction's sphere colour (single cycle, 800ms).
 * Cross-fade between old and new tone-words, 200ms.
 *
 * Default sphere: order / order-gold. Spec: §4.1 row 9. The actual mount inside
 * SceneStatePanel is wired by C4 (THR-333). This component renders the chip
 * standalone; integrators pass a ref or portal target as needed.
 *
 * NOTE: §4.1 lists `faction_*` family — this component covers the visual
 * landing for any faction-related aftermath kind (faction_splinter, _absorb,
 * _dissolve, _declare_war, _force_peace, faction_reputation_gain).
 */
export interface FactionLandingData {
  /** Faction display name, e.g. "CIVIC GUARD OF BREN" */
  readonly factionName: string;
  /** Old tone word (e.g. "allied"). */
  readonly oldTone: string;
  /** New tone word (e.g. "wary"). */
  readonly newTone: string;
  /** Italic descriptor, e.g. "order · because of what she said" */
  readonly descriptor: string;
  /** Optional sphere override (defaults to order). */
  readonly sphere?: EffectSphere;
}

export interface FactionLandingProps extends EffectLandingCommonProps {
  readonly data: FactionLandingData;
}

const TONE_CROSSFADE_MS = 200;

export function FactionLanding({ data, ...common }: FactionLandingProps) {
  const phase = useLandingLifecycle({
    ...common,
    motionDurationMs: REGISTRATION_FLIP_FACTION_MS,
  });
  const sphere = data.sphere ?? 'order';
  const sphereColor = sphereBrightVar(sphere);

  if (phase === 'pending') {
    return <div data-testid="effect-registration-faction" data-phase="pending" aria-hidden="true" />;
  }

  const isAnimating = phase === 'animating';

  return (
    <div
      data-testid="effect-registration-faction"
      data-phase={phase}
      style={{
        padding: '6px 12px',
        borderRadius: 999,
        border: `2px solid ${sphereColor}`,
        background: 'var(--bg-raised)',
        display: 'inline-flex',
        flexDirection: 'column',
        gap: 2,
        ...(common.suppressPulseRing
          ? {}
          : ({
              ['--mark-color' as string]: sphereColor,
              animation: `mark-pulse ${REGISTRATION_FLIP_FACTION_MS}ms ease-in-out 1`,
            } as React.CSSProperties)),
      }}
    >
      <div style={{ ...LANDING_LABEL_STYLE, color: sphereColor }}>{data.factionName}</div>
      <div
        data-testid="effect-registration-faction-tone"
        style={{ fontSize: 12, color: 'var(--text-primary)' }}
      >
        <span
          style={{
            opacity: isAnimating ? 0 : 1,
            transition: `opacity ${TONE_CROSSFADE_MS}ms ease-out`,
          }}
        >
          {isAnimating ? data.oldTone : data.newTone}
        </span>
      </div>
      <div style={{ fontSize: 11, fontStyle: 'italic', color: 'var(--text-tertiary)' }}>
        {data.descriptor}
      </div>
    </div>
  );
}
