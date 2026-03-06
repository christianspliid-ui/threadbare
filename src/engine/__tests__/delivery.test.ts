import { describe, it, expect } from 'vitest';
import type {
  DeliveryMode,
  LocalEncounterMode,
} from '../../types/dream';
import {
  DELIVERY_RANGE,
  LOCAL_ENCOUNTER,
  INTERVENTION_DEFINITIONS,
} from '../../types/dream';

describe('Delivery type definitions', () => {
  it('exports DELIVERY_RANGE with correct hex values', () => {
    expect(DELIVERY_RANGE.deceive).toBe(3);
    expect(DELIVERY_RANGE.intimidate).toBe(3);
    expect(DELIVERY_RANGE.inspire).toBe(5);
  });

  it('exports LOCAL_ENCOUNTER constants', () => {
    expect(LOCAL_ENCOUNTER.visitImpactBonus).toBe(1.15);
    expect(LOCAL_ENCOUNTER.summonEssenceCost).toBe(1);
    expect(LOCAL_ENCOUNTER.summonDetectionPenalty).toBe(0.10);
    expect(LOCAL_ENCOUNTER.summonImpactBonus).toBe(1.05);
  });

  it('every InterventionDefinition has a deliveryMode', () => {
    const validModes: DeliveryMode[] = ['astral', 'regional', 'remote', 'local'];
    for (const [key, def] of Object.entries(INTERVENTION_DEFINITIONS)) {
      expect(validModes).toContain(def.deliveryMode);
    }
  });

  it('maps intervention types to correct delivery modes', () => {
    expect(INTERVENTION_DEFINITIONS.dream.deliveryMode).toBe('astral');
    expect(INTERVENTION_DEFINITIONS.persuade.deliveryMode).toBe('local');
    expect(INTERVENTION_DEFINITIONS.deceive.deliveryMode).toBe('regional');
    expect(INTERVENTION_DEFINITIONS.intimidate.deliveryMode).toBe('regional');
    expect(INTERVENTION_DEFINITIONS.inspire_intervention.deliveryMode).toBe('regional');
    expect(INTERVENTION_DEFINITIONS.coincidence.deliveryMode).toBe('remote');
    expect(INTERVENTION_DEFINITIONS.omen.deliveryMode).toBe('remote');
    expect(INTERVENTION_DEFINITIONS.afflict_bless.deliveryMode).toBe('local');
  });

  it('regional interventions have a range in DELIVERY_RANGE', () => {
    for (const [key, def] of Object.entries(INTERVENTION_DEFINITIONS)) {
      if (def.deliveryMode === 'regional') {
        const rangeKey = key === 'inspire_intervention' ? 'inspire' : key;
        expect(DELIVERY_RANGE).toHaveProperty(rangeKey);
        expect((DELIVERY_RANGE as any)[rangeKey]).toBeGreaterThan(0);
      }
    }
  });
});
