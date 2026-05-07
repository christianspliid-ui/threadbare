import { describe, expect, it } from 'vitest';
import { computeForecast, classifyForecastTier } from '../outcomeForecast';

describe('outcomeForecast', () => {
  it('classifies tier boundaries using encounter constants', () => {
    expect(classifyForecastTier(0)).toBe('doomed');
    expect(classifyForecastTier(0.2)).toBe('doomed');
    expect(classifyForecastTier(0.21)).toBe('perilous');
    expect(classifyForecastTier(0.4)).toBe('perilous');
    expect(classifyForecastTier(0.41)).toBe('uncertain');
    expect(classifyForecastTier(0.6)).toBe('uncertain');
    expect(classifyForecastTier(0.61)).toBe('favorable');
    expect(classifyForecastTier(0.8)).toBe('favorable');
    expect(classifyForecastTier(0.81)).toBe('fated');
  });

  it('clamps out-of-range probabilities', () => {
    const low = computeForecast(
      { forecastFactors: ['threads dim'] },
      { baseProbability: -1, modifiers: [] },
    );
    const high = computeForecast(
      { forecastFactors: ['threads bright'] },
      { baseProbability: 5, modifiers: [] },
    );

    expect(low.baseProbability).toBe(0);
    expect(low.finalProbability).toBe(0);
    expect(low.finalTier).toBe('doomed');

    expect(high.baseProbability).toBe(1);
    expect(high.finalProbability).toBe(1);
    expect(high.finalTier).toBe('fated');
  });

  it('selects one to three factors and falls back to tier-only when pool is empty', () => {
    const oneFactor = computeForecast(
      { forecastFactors: ['  iron-rooted  ', 'iron-rooted', ''] },
      { baseProbability: 0.1, modifiers: [] },
    );
    const twoFactors = computeForecast(
      { forecastFactors: ['a', 'b', 'c'] },
      { baseProbability: 0.45, modifiers: [] },
    );
    const threeFactors = computeForecast(
      { forecastFactors: ['a', 'b', 'c', 'd'] },
      { baseProbability: 0.8, modifiers: [] },
    );
    const empty = computeForecast(
      { forecastFactors: [] },
      { baseProbability: 0.8, modifiers: [] },
    );

    expect(oneFactor.factors).toEqual(['iron-rooted']);
    expect(twoFactors.factors).toEqual(['a', 'b']);
    expect(threeFactors.factors).toEqual(['a', 'b', 'c']);
    expect(empty.factors).toEqual([]);
  });

  it('keeps forecast factors prose-safe (no digits) when authored factors are prose-safe', () => {
    const forecast = computeForecast(
      { forecastFactors: ['iron-rooted omen', 'wind-turning thread', 'ashen vow'] },
      { baseProbability: 0.8, modifiers: [] },
    );

    expect(forecast.factors.length).toBeGreaterThan(0);
    for (const factor of forecast.factors) {
      expect(factor).not.toMatch(/\d/);
    }
  });
});
