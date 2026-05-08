import React from 'react';
import {
  type EffectLandingCommonProps,
  LANDING_LABEL_STYLE,
  sphereBrightVar,
  useLandingLifecycle,
} from './_shared';
import { REGISTRATION_FLIP_REPUTATION_TALLY_MS } from '../../../../data/encounter-experience-constants';

/**
 * ReputationTallyLanding — cast tile receives a sphere-coloured 3px left
 * border pulse. Old disposition phrase fades out 160ms; new phrase types in
 * 280ms (one character at a time). Never a numeric tick.
 * Sphere coding: iron / force-red. Spec: §4.1 row 3.
 */
export interface ReputationTallyLandingData {
  /** Cast member name, e.g. "CAPTAIN VEIREN" */
  readonly castLabel: string;
  /** Old disposition phrase to fade out. */
  readonly oldPhrase: string;
  /** New disposition phrase to type in. */
  readonly newPhrase: string;
  /** Italic tail, e.g. "iron · he marks her now" */
  readonly tail: string;
}

export interface ReputationTallyLandingProps extends EffectLandingCommonProps {
  readonly data: ReputationTallyLandingData;
}

const FADE_OUT_MS = 160;
const TYPE_DURATION_MS = REGISTRATION_FLIP_REPUTATION_TALLY_MS;

function useTypewriter(text: string, durationMs: number, isAnimating: boolean): string {
  const [revealed, setRevealed] = React.useState(0);

  React.useEffect(() => {
    if (!isAnimating) {
      setRevealed(text.length);
      return undefined;
    }
    setRevealed(0);
    if (text.length === 0) return undefined;
    const interval = Math.max(8, Math.floor(durationMs / text.length));
    const timer = window.setInterval(() => {
      setRevealed((current) => {
        if (current >= text.length) {
          window.clearInterval(timer);
          return current;
        }
        return current + 1;
      });
    }, interval);
    return () => window.clearInterval(timer);
  }, [text, durationMs, isAnimating]);

  return text.slice(0, revealed);
}

export function ReputationTallyLanding({ data, ...common }: ReputationTallyLandingProps) {
  const phase = useLandingLifecycle({
    ...common,
    motionDurationMs: FADE_OUT_MS + TYPE_DURATION_MS,
  });
  const sphereColor = sphereBrightVar('force');

  // After fade-out finishes, animate the typewriter of the new phrase.
  const showOld = phase === 'animating';
  const showNew = phase === 'settled';
  const typed = useTypewriter(data.newPhrase, TYPE_DURATION_MS, showNew);

  if (phase === 'pending') {
    return <div data-testid="effect-registration-reputation-tally" data-phase="pending" aria-hidden="true" />;
  }

  return (
    <div
      data-testid="effect-registration-reputation-tally"
      data-phase={phase}
      style={{
        position: 'relative',
        padding: '8px 10px 8px 12px',
        borderRadius: 8,
        background: 'var(--bg-raised)',
        borderLeft: `3px solid ${sphereColor}`,
        ...(common.suppressPulseRing
          ? {}
          : ({
              ['--mark-color' as string]: sphereColor,
              animation: `mark-pulse ${TYPE_DURATION_MS}ms ease-out 1`,
            } as React.CSSProperties)),
      }}
    >
      <div style={{ ...LANDING_LABEL_STYLE, color: sphereColor }}>{data.castLabel}</div>
      <div
        data-testid="effect-registration-reputation-tally-phrase"
        style={{
          fontSize: 12,
          color: 'var(--text-primary)',
          opacity: showOld ? 0 : 1,
          transition: `opacity ${FADE_OUT_MS}ms ease-out`,
          minHeight: '1.2em',
        }}
      >
        {showOld ? data.oldPhrase : typed}
      </div>
      <div style={{ fontSize: 11, fontStyle: 'italic', color: 'var(--text-tertiary)', marginTop: 2 }}>
        {data.tail}
      </div>
    </div>
  );
}
