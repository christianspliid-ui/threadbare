import { describe, it, expect } from 'vitest';
import {
  HISTORICAL_CULTURE_TEMPLATES,
  HISTORICAL_CULTURE_COUNT,
  HISTORICAL_TERRITORY_COVERAGE,
  type HistoricalCultureTemplate,
} from '../historical-culture-content';

describe('historical culture content', () => {
  it('has at least 6 templates (enough for max 4 cultures with variety)', () => {
    expect(HISTORICAL_CULTURE_TEMPLATES.length).toBeGreaterThanOrEqual(6);
  });

  it('each template has required fields', () => {
    for (const t of HISTORICAL_CULTURE_TEMPLATES) {
      expect(t.id).toBeTruthy();
      expect(t.name).toBeTruthy();
      expect(t.ruinDescriptors.length).toBeGreaterThanOrEqual(2);
      expect(t.legacyFlavor).toBeTruthy();
    }
  });

  it('all template IDs are unique', () => {
    const ids = HISTORICAL_CULTURE_TEMPLATES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has tunable constants', () => {
    expect(HISTORICAL_CULTURE_COUNT.min).toBeGreaterThanOrEqual(2);
    expect(HISTORICAL_CULTURE_COUNT.max).toBeLessThanOrEqual(5);
    expect(HISTORICAL_TERRITORY_COVERAGE).toBeGreaterThan(0);
    expect(HISTORICAL_TERRITORY_COVERAGE).toBeLessThanOrEqual(1);
  });
});
