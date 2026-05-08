import React from 'react';

/**
 * Shared types + helpers for Phase D2 EffectRegistration components (THR-335).
 *
 * Each effect-kind landing component shares the same animation lifecycle:
 *   1. Wait `delay` ms before triggering its visible motion.
 *   2. Run the kind-specific motion (card-flip / typewriter / slide / dot fill).
 *   3. Fire `onEffectLand` once when the motion settles.
 *
 * Components are presentational. Mounting / wiring into hero panel / cast tile /
 * scene-state is the integrator's responsibility (Phase F2 + C4 follow-up).
 */

/** Sphere identifier used for color coding per canonical UI spec §4.1. */
export type EffectSphere =
  | 'force' // iron
  | 'mind' // eye
  | 'spirit' // heart
  | 'time'
  | 'matter'
  | 'life'
  | 'energy'
  | 'entropy'
  | 'order'
  | 'chaos'
  | 'light'
  | 'darkness';

/** Common props shared by every EffectRegistration component. */
export interface EffectLandingCommonProps {
  /** Animation start delay in ms (set by useEffectSequencing). Defaults to 0. */
  delay?: number;
  /** Suppress pulse ring per discipline rule §4.3 #2. */
  suppressPulseRing?: boolean;
  /** Fires once when the landing motion settles. Post-v1 audio H1 consumes this. */
  onEffectLand?: () => void;
  /** Test override: skip animation timing (jump straight to settled). */
  skipAnimation?: boolean;
}

/**
 * Resolves the bright sphere CSS variable for a given sphere identifier.
 * The naming uses force/mind/spirit (the cosmological sphere names) rather
 * than iron/eye/heart (the reach names) — both refer to the same color.
 */
export function sphereBrightVar(sphere: EffectSphere): string {
  return `var(--sphere-${sphere}-bright)`;
}

/** Resolves the dim sphere CSS variable for borders/glows that should be subtler. */
export function sphereVar(sphere: EffectSphere): string {
  return `var(--sphere-${sphere})`;
}

/**
 * Lifecycle hook used by every EffectRegistration component.
 *
 * Phases:
 *   - 'pending'  — before delay elapses (component renders nothing visible)
 *   - 'animating'— card-flip / typewriter / slide motion playing
 *   - 'settled'  — final state, onEffectLand has fired
 *
 * Tests can pass `skipAnimation` to jump directly to 'settled' synchronously.
 */
export type LandingPhase = 'pending' | 'animating' | 'settled';

export interface UseLandingLifecycleArgs extends EffectLandingCommonProps {
  /** Duration of the kind-specific motion (settle delay) in ms. */
  motionDurationMs: number;
}

export function useLandingLifecycle(args: UseLandingLifecycleArgs): LandingPhase {
  const { delay = 0, motionDurationMs, onEffectLand, skipAnimation = false } = args;
  const [phase, setPhase] = React.useState<LandingPhase>(
    skipAnimation ? 'settled' : 'pending',
  );

  // Settle callback ref to avoid restarting timers on re-renders that just
  // change the callback identity.
  const onEffectLandRef = React.useRef(onEffectLand);
  React.useEffect(() => {
    onEffectLandRef.current = onEffectLand;
  }, [onEffectLand]);

  React.useEffect(() => {
    if (skipAnimation) {
      onEffectLandRef.current?.();
      setPhase('settled');
      return undefined;
    }

    setPhase('pending');
    let settleTimer: number | null = null;

    const startTimer = window.setTimeout(() => {
      setPhase('animating');
      settleTimer = window.setTimeout(() => {
        setPhase('settled');
        onEffectLandRef.current?.();
      }, motionDurationMs);
    }, Math.max(0, delay));

    return () => {
      window.clearTimeout(startTimer);
      if (settleTimer !== null) window.clearTimeout(settleTimer);
    };
  }, [delay, motionDurationMs, skipAnimation]);

  return phase;
}

/**
 * Generic wrapper that applies the card-flip animation + sphere coloring +
 * optional pulse ring on settle. Used by intelligence / spawn_artifact /
 * recent_event landings, which share the card-flip pattern.
 */
export interface LandingCardProps {
  readonly sphere: EffectSphere;
  readonly motionDurationMs: number;
  readonly phase: LandingPhase;
  readonly suppressPulseRing?: boolean;
  readonly testId?: string;
  readonly children: React.ReactNode;
}

export function LandingCard({
  sphere,
  motionDurationMs,
  phase,
  suppressPulseRing = false,
  testId,
  children,
}: LandingCardProps) {
  const sphereColor = sphereBrightVar(sphere);
  const isAnimating = phase === 'animating';
  const isSettled = phase === 'settled';
  const showPulseRing = !suppressPulseRing && (isAnimating || isSettled);

  if (phase === 'pending') {
    return <div data-testid={testId} data-phase="pending" aria-hidden="true" />;
  }

  return (
    <div
      data-testid={testId}
      data-phase={phase}
      style={{
        padding: '8px 10px',
        borderRadius: 8,
        border: `1px solid ${sphereColor}`,
        background: `linear-gradient(90deg, color-mix(in oklab, ${sphereColor} 8%, transparent), transparent)`,
        perspective: '600px',
        animation: isAnimating
          ? `card-flip-in ${motionDurationMs}ms cubic-bezier(.2,.7,.2,1) 1`
          : 'none',
        ...(showPulseRing
          ? ({
              ['--mark-color' as string]: sphereColor,
              boxShadow: isSettled ? undefined : `0 0 0 0 ${sphereColor}`,
            } as React.CSSProperties)
          : {}),
      }}
    >
      {children}
    </div>
  );
}

/** Shared label style — used for the small ALLCAPS sphere/kind tag. */
export const LANDING_LABEL_STYLE: React.CSSProperties = {
  fontSize: 9,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
};

/** Italic-tail style — used for the "tail" prose under the main name. */
export const LANDING_TAIL_STYLE: React.CSSProperties = {
  fontSize: 11,
  fontStyle: 'italic',
  color: 'var(--text-tertiary)',
  marginTop: 2,
};
