import React from 'react';
import type {
  EncounterChoiceContract,
  EncounterChoiceReach,
} from '../../../types/encounter-contract';
import type { ThreadRevealPhase } from '../../../hooks/useThreadReveal';

/**
 * Sphere-bright lookup keyed by reach. SVG `stroke` cannot consume the
 * `data-reach` cascade (the cascade applies to the choice card row, not
 * to elements inside the SVG namespace), so we map directly to the
 * underlying CSS variables defined in `index.css`.
 */
const REACH_SPHERE_BRIGHT: Record<EncounterChoiceReach, string> = {
  iron: 'var(--sphere-force-bright)',
  stone: 'var(--sphere-matter-bright)',
  eye: 'var(--sphere-energy-bright)',
  gold: 'var(--sphere-life-bright)',
  veil: 'var(--sphere-mind-bright)',
  heart: 'var(--sphere-spirit-bright)',
  star: 'var(--sphere-time-bright)',
  shadow: 'var(--sphere-entropy-bright)',
  quintessence: 'var(--accent-gold)',
};

export interface ThreadOverlayProps {
  /** The three choices in the beat. Determines sphere colours. */
  choices: readonly EncounterChoiceContract[];
  /** Which reach was chosen (drives resolve beat colouring). */
  chosenReach: EncounterChoiceReach | null;
  /** Current animation phase from useThreadReveal */
  phase: ThreadRevealPhase;
  /** Width of the choice card row in px — SVG viewBox scales to this */
  width?: number;
  /** Height of the choice card row in px */
  height?: number;
}

/**
 * ThreadOverlay — SVG layer rendered above the choice card row during the
 * Moment 1 tension reveal sequence (5 beats, ~1.62s).
 *
 * Beats:
 *   - committed: page dim begins; threads still hidden
 *   - drawing:   threads animate stroke-dashoffset 600 → 0
 *   - taut:      threads pulse at full width; dust motes drift; nodes breathe
 *   - resolving: chosen thread brightens to opacity 1.0; unchosen fade to 0.15
 *   - settled:   chosen thread holds glow; sequence ends
 *
 * Colours are sourced from `--sphere-*-bright` CSS variables. The component
 * assumes its container is `position: relative` and fills it via `inset: 0`.
 */
export function ThreadOverlay({
  choices,
  chosenReach,
  phase,
  width = 0,
  height = 0,
}: ThreadOverlayProps) {
  // Anchor at bottom-center (the player's hand origin).
  const anchor: [number, number] = [width / 2, height * 0.92];

  // Three card-top targets, evenly spaced thirds.
  const targets: Array<[number, number]> = [
    [width * (1 / 6), height * 0.1],
    [width * (3 / 6), height * 0.1],
    [width * (5 / 6), height * 0.1],
  ];

  // Visibility flags per phase.
  const threadsVisible =
    phase === 'drawing' ||
    phase === 'taut' ||
    phase === 'resolving' ||
    phase === 'settled';
  const showDim =
    phase === 'committed' ||
    phase === 'drawing' ||
    phase === 'taut' ||
    phase === 'resolving';
  const showMotes = phase === 'taut';

  // Stroke-dash animation: 600 (hidden) before drawing; 0 once drawn.
  const dashOffset =
    phase === 'idle' || phase === 'committed' ? 600 : 0;

  return (
    <div
      data-testid="thread-overlay-root"
      data-phase={phase}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
      }}
    >
      {/* 8% page-dim overlay siblings — sits behind the SVG threads. */}
      {showDim && (
        <div
          data-testid="thread-overlay-page-dim"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'black',
            opacity: 0.08,
            animation: 'pageDim8pct 380ms ease-out forwards',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Dust motes during the taut beat. */}
      {showMotes &&
        Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            data-testid={`thread-overlay-mote-${i}`}
            style={
              {
                position: 'absolute',
                left: width * (0.1 + i * 0.1),
                bottom: height * (0.1 + (i % 3) * 0.05),
                width: 2,
                height: 2,
                borderRadius: 99,
                background: '#ffd28066',
                animation: `dustMoteDrift ${1.6 + (i % 4) * 0.3}s ease-in-out ${i * 0.12}s infinite`,
                '--mx': `${(i % 2 ? -1 : 1) * 30}px`,
                '--my': `-${30 + i * 4}px`,
                pointerEvents: 'none',
              } as React.CSSProperties
            }
          />
        ))}

      {/* SVG thread layer. Always mounted so transitions can run; visibility is
          controlled per-thread via opacity. */}
      <svg
        data-testid="thread-overlay-svg"
        width={width}
        height={height}
        viewBox={`0 0 ${Math.max(1, width)} ${Math.max(1, height)}`}
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'visible',
          pointerEvents: 'none',
        }}
      >
        {choices.slice(0, 3).map((choice, idx) => {
          const target = targets[idx] ?? targets[2];
          const reach = choice.reach;
          const stroke = REACH_SPHERE_BRIGHT[reach];
          const isChosen = chosenReach === reach && chosenReach !== null;

          // Per-phase opacity / width.
          let threadOpacity = 0;
          let threadWidth = 0;
          if (phase === 'drawing' || phase === 'taut') {
            threadOpacity = 0.85;
            threadWidth = 1.2;
          } else if (phase === 'resolving' || phase === 'settled') {
            threadOpacity = isChosen ? 1.0 : 0.15;
            threadWidth = isChosen ? 1.8 : 0.9;
          }

          // Bézier from anchor to card top.
          const path = `M${anchor[0]},${anchor[1]} C${anchor[0]},${
            height * 0.6
          } ${target[0]},${target[1] * 3} ${target[0]},${target[1]}`;

          return (
            <g
              key={`${reach}-${idx}`}
              data-testid={`thread-overlay-thread-${reach}`}
              data-chosen={isChosen ? 'true' : 'false'}
              style={{
                opacity: threadsVisible ? 1 : 0,
                transition: 'opacity 400ms ease-out',
              }}
            >
              {/* Glow layer */}
              <path
                d={path}
                fill="none"
                stroke={stroke}
                strokeWidth={threadWidth > 0 ? 4 : 0}
                strokeLinecap="round"
                strokeDasharray="600"
                strokeDashoffset={dashOffset}
                opacity={threadOpacity * 0.45}
                style={{
                  filter: 'blur(3px)',
                  transition:
                    'stroke-dashoffset 520ms ease-out, opacity 400ms ease-out, stroke-width 240ms ease-out',
                }}
              />
              {/* Core layer */}
              <path
                data-testid={`thread-overlay-thread-core-${reach}`}
                d={path}
                fill="none"
                stroke={stroke}
                strokeWidth={threadWidth}
                strokeLinecap="round"
                strokeDasharray="600"
                strokeDashoffset={dashOffset}
                opacity={threadOpacity * 0.95}
                style={{
                  transition:
                    'stroke-dashoffset 520ms ease-out, opacity 400ms ease-out, stroke-width 240ms ease-out',
                }}
              />

              {/* Card-top node, breathes during taut. */}
              <circle
                cx={target[0]}
                cy={target[1]}
                r={3}
                fill={stroke}
                opacity={threadOpacity}
                style={{ transition: 'opacity 400ms ease-out' }}
              >
                {phase === 'taut' && (
                  <animate
                    attributeName="r"
                    values="3;5;3"
                    dur="0.9s"
                    repeatCount="indefinite"
                  />
                )}
              </circle>
            </g>
          );
        })}

        {/* Anchor mote at the player's hand origin. */}
        <circle
          data-testid="thread-overlay-anchor-mote"
          cx={anchor[0]}
          cy={anchor[1]}
          r={2.5}
          fill="var(--accent-gold)"
          opacity={threadsVisible ? 0.8 : 0}
          style={{ transition: 'opacity 400ms ease-out' }}
        />
      </svg>
    </div>
  );
}
