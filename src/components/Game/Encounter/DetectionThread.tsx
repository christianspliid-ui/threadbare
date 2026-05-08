import React from 'react';
import {
  DETECTION_THRESHOLD_NOTICE,
  DETECTION_THRESHOLD_TURN,
} from '../../../data/encounter-experience-constants';
import type { DetectionThresholdBand } from '../../../types/traces/encounter-traces';

export interface DetectionThreadProps {
  pressure: number;
}

const NOTICE_PROSE = 'rivals are starting to notice';
const TURN_PROSE = 'a rival god turns its head';
const ENCOUNTER_PROSE = 'a rival god has fixed its gaze on her';

function pressureToBand(pressure: number): DetectionThresholdBand | null {
  if (!Number.isFinite(pressure)) return null;
  if (pressure >= 1) return 'encounter';
  if (pressure >= DETECTION_THRESHOLD_TURN) return 'turn';
  if (pressure >= DETECTION_THRESHOLD_NOTICE) return 'notice';
  return null;
}

const BAND_HEIGHT_PX: Record<DetectionThresholdBand, number> = {
  notice: 1.5,
  turn: 3,
  encounter: 4,
};

const BAND_OPACITY: Record<DetectionThresholdBand, number> = {
  notice: 0.7,
  turn: 0.95,
  encounter: 1,
};

const BAND_PROSE: Record<DetectionThresholdBand, string> = {
  notice: NOTICE_PROSE,
  turn: TURN_PROSE,
  encounter: ENCOUNTER_PROSE,
};

const BAND_FONT_SIZE_PX: Record<DetectionThresholdBand, number> = {
  notice: 12,
  turn: 13,
  encounter: 13,
};

const BAND_FONT_WEIGHT: Record<DetectionThresholdBand, number> = {
  notice: 400,
  turn: 600,
  encounter: 700,
};

const BAND_TEXT_COLOR: Record<DetectionThresholdBand, string> = {
  notice: 'var(--text-tertiary)',
  turn: 'var(--text-secondary)',
  encounter: 'var(--text-primary)',
};

/**
 * DetectionThread - special thread row that surfaces regional rival pressure.
 * Hidden when pressure < 0.50. Renders thicker and darker as pressure escalates
 * through NOTICE (0.50), TURN (0.80), and ENCOUNTER (1.00).
 */
export function DetectionThread({ pressure }: DetectionThreadProps) {
  const band = pressureToBand(pressure);
  if (!band) return null;

  const height = BAND_HEIGHT_PX[band];
  const opacity = BAND_OPACITY[band];

  return (
    <div
      data-testid="encounter-detection-thread"
      data-band={band}
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
          stroke="var(--text-primary)"
          strokeWidth={height}
          strokeLinecap="round"
        />
      </svg>
      <span
        style={{
          fontSize: BAND_FONT_SIZE_PX[band],
          fontWeight: BAND_FONT_WEIGHT[band],
          color: BAND_TEXT_COLOR[band],
          fontStyle: 'italic',
          lineHeight: 1.35,
        }}
      >
        {BAND_PROSE[band]}
      </span>
    </div>
  );
}

