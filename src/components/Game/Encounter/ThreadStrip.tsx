import React from 'react';
import type { SphereName } from '../../../types';
import type { EncounterThreadWeight } from '../../../types/encounter-contract';

export interface ThreadStripData {
  readonly id: string;
  readonly name: string;
  readonly weight: EncounterThreadWeight;
  readonly sphereColor: SphereName;
}

export interface ThreadStripProps {
  thread: ThreadStripData;
}

const SPHERE_VAR_BY_NAME: Record<SphereName, string> = {
  chaos: '--sphere-chaos-bright',
  order: '--sphere-order-bright',
  light: '--sphere-light-bright',
  darkness: '--sphere-darkness-bright',
  force: '--sphere-force-bright',
  matter: '--sphere-matter-bright',
  energy: '--sphere-energy-bright',
  life: '--sphere-life-bright',
  mind: '--sphere-mind-bright',
  spirit: '--sphere-spirit-bright',
  time: '--sphere-time-bright',
  entropy: '--sphere-entropy-bright',
};

const WEIGHT_HEIGHT_PX: Record<EncounterThreadWeight, number> = {
  taut: 2,
  thin: 1.2,
  fraying: 1,
};

const WEIGHT_OPACITY: Record<EncounterThreadWeight, number> = {
  taut: 1,
  thin: 0.75,
  fraying: 0.45,
};

const WEIGHT_DASH: Record<EncounterThreadWeight, string | undefined> = {
  taut: undefined,
  thin: undefined,
  fraying: '4 4',
};

export function ThreadStrip({ thread }: ThreadStripProps) {
  const colorVar = SPHERE_VAR_BY_NAME[thread.sphereColor];
  const height = WEIGHT_HEIGHT_PX[thread.weight];
  const opacity = WEIGHT_OPACITY[thread.weight];
  const dash = WEIGHT_DASH[thread.weight];

  return (
    <div
      data-testid={`encounter-thread-strip-${thread.id}`}
      data-weight={thread.weight}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        opacity,
      }}
    >
      <svg
        aria-hidden="true"
        width={48}
        height={height + 4}
        style={{ flexShrink: 0 }}
      >
        <line
          x1={0}
          x2={48}
          y1={(height + 4) / 2}
          y2={(height + 4) / 2}
          stroke={`var(${colorVar})`}
          strokeWidth={height}
          strokeLinecap="round"
          strokeDasharray={dash}
        />
      </svg>
      <span
        style={{
          fontSize: 12,
          color: 'var(--text-secondary)',
          fontStyle: thread.weight === 'fraying' ? 'italic' : 'normal',
          lineHeight: 1.35,
        }}
      >
        {thread.name}
      </span>
    </div>
  );
}

