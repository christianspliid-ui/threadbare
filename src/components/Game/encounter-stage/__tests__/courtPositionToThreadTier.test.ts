import { describe, it, expect, afterEach } from 'vitest';
import { courtPositionToThreadTier } from '../types';
import { setForceFullEncounterVisibility } from '../../../../engine/debugVisibilityOverride';

describe('courtPositionToThreadTier', () => {
  it('maps the_first to strong, retinue to light, watched to watched', () => {
    expect(courtPositionToThreadTier('the_first')).toBe('strong');
    expect(courtPositionToThreadTier('retinue')).toBe('light');
    expect(courtPositionToThreadTier('watched')).toBe('watched');
  });

  it('maps dormant/null to watched', () => {
    expect(courtPositionToThreadTier('dormant')).toBe('watched');
    expect(courtPositionToThreadTier(null)).toBe('watched');
  });

  describe('force-full-encounter-visibility override (THR-880)', () => {
    afterEach(() => {
      setForceFullEncounterVisibility(false);
    });

    it('upgrades watched to strong while active', () => {
      setForceFullEncounterVisibility(true);
      expect(courtPositionToThreadTier('watched')).toBe('strong');
      expect(courtPositionToThreadTier('retinue')).toBe('strong');
      expect(courtPositionToThreadTier('the_first')).toBe('strong');
    });

    it('leaves dormant/null at watched while active', () => {
      setForceFullEncounterVisibility(true);
      expect(courtPositionToThreadTier('dormant')).toBe('watched');
      expect(courtPositionToThreadTier(null)).toBe('watched');
    });
  });
});
