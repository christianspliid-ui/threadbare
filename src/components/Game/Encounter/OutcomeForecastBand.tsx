import React from 'react';
import {
  FORECAST_FACTORS_VISIBLE_DEFAULT,
  FORECAST_FACTORS_VISIBLE_HOVER_MAX,
  FORECAST_TIER_DOOMED_MAX,
  FORECAST_TIER_PERILOUS_MAX,
  FORECAST_TIER_UNCERTAIN_MAX,
  FORECAST_TIER_FAVORABLE_MAX,
} from '../../../data/encounter-experience-constants';
import type { EncounterForecastFactors } from '../../../types/encounter-contract';

export interface OutcomeForecastBandProps {
  /**
   * Pre-computed numeric success probability in [0, 1]. Used to derive a
   * qualitative tier. **Never displayed.** If null/undefined, the band
   * renders only the placeholder factor.
   */
  successProbability: number | null | undefined;
  /** Up-to-3-tuple of narrative factors per the encounter contract. */
  factors: EncounterForecastFactors;
  /**
   * Optional controlled override for hover expansion (used by tests).
   * If undefined, the component manages its own hover state.
   */
  expanded?: boolean;
}

interface ForecastTier {
  readonly id: 'doomed' | 'perilous' | 'uncertain' | 'favorable' | 'favored';
  readonly label: string;
  readonly phrase: string;
}

const TIER_DOOMED: ForecastTier = {
  id: 'doomed',
  label: 'doomed',
  phrase: 'the threads have already broken',
};
const TIER_PERILOUS: ForecastTier = {
  id: 'perilous',
  label: 'perilous',
  phrase: 'the threads are fraying',
};
const TIER_UNCERTAIN: ForecastTier = {
  id: 'uncertain',
  label: 'uncertain',
  phrase: 'the threads stand uncertain',
};
const TIER_FAVORABLE: ForecastTier = {
  id: 'favorable',
  label: 'favorable',
  phrase: 'the threads pull toward her',
};
const TIER_FAVORED: ForecastTier = {
  id: 'favored',
  label: 'favored',
  phrase: 'the threads bend in her favour',
};

function pickTier(probability: number): ForecastTier {
  if (probability <= FORECAST_TIER_DOOMED_MAX) return TIER_DOOMED;
  if (probability <= FORECAST_TIER_PERILOUS_MAX) return TIER_PERILOUS;
  if (probability <= FORECAST_TIER_UNCERTAIN_MAX) return TIER_UNCERTAIN;
  if (probability <= FORECAST_TIER_FAVORABLE_MAX) return TIER_FAVORABLE;
  return TIER_FAVORED;
}

function compactFactors(factors: EncounterForecastFactors): string[] {
  return factors.filter((f): f is string => typeof f === 'string' && f.length > 0);
}

/**
 * OutcomeForecastBand — qualitative forecast for the current beat.
 *
 * Shows a tier label phrase derived from `successProbability` plus a
 * narrative-factor read. By default `FORECAST_FACTORS_VISIBLE_DEFAULT`
 * factor is inline; hover expands up to `FORECAST_FACTORS_VISIBLE_HOVER_MAX`
 * factors (capped to the actual factors length). No numbers are ever shown.
 *
 * Fail-soft:
 *  - null/undefined `successProbability` → render only the placeholder
 *    factor "the threads are still gathering" with no tier line.
 *  - empty factors array → render only the tier line.
 */
export function OutcomeForecastBand({
  successProbability,
  factors,
  expanded,
}: OutcomeForecastBandProps) {
  const [hovered, setHovered] = React.useState(false);
  const isExpanded = expanded ?? hovered;

  const probIsKnown =
    typeof successProbability === 'number' && Number.isFinite(successProbability);
  const tier = probIsKnown ? pickTier(successProbability as number) : null;

  const allFactors = compactFactors(factors);
  const visibleCount = isExpanded
    ? Math.min(allFactors.length, FORECAST_FACTORS_VISIBLE_HOVER_MAX)
    : Math.min(allFactors.length, FORECAST_FACTORS_VISIBLE_DEFAULT);
  const visibleFactors = allFactors.slice(0, visibleCount);

  // Fail-soft for unknown probability: placeholder only, no tier line.
  if (!probIsKnown) {
    return (
      <div
        data-testid="encounter-outcome-forecast-band"
        data-tier="unknown"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          padding: '8px 12px',
          borderRadius: 8,
          border: '1px solid var(--border-subtle)',
          background: 'var(--bg-raised)',
        }}
      >
        <div
          data-testid="encounter-outcome-forecast-factors"
          style={{
            color: 'var(--text-tertiary)',
            fontSize: 12,
            fontStyle: 'italic',
            lineHeight: 1.4,
          }}
        >
          the threads are still gathering
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="encounter-outcome-forecast-band"
      data-tier={tier?.id}
      data-expanded={isExpanded ? 'true' : 'false'}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: '8px 12px',
        borderRadius: 8,
        border: '1px solid var(--border-subtle)',
        background: 'var(--bg-raised)',
        transition: 'background 200ms ease-out',
      }}
    >
      {tier && (
        <div
          data-testid="encounter-outcome-forecast-tier"
          style={{
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            fontStyle: 'italic',
            lineHeight: 1.4,
          }}
        >
          {tier.phrase}
        </div>
      )}

      {visibleFactors.length > 0 && (
        <ul
          data-testid="encounter-outcome-forecast-factors"
          style={{
            margin: 0,
            padding: 0,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            color: 'var(--text-tertiary)',
            fontSize: 11,
            lineHeight: 1.4,
            transition: 'opacity 200ms ease-out',
          }}
        >
          {visibleFactors.map((factor, index) => (
            <li key={`${tier?.id ?? 'unknown'}-factor-${index}`}>{factor}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
