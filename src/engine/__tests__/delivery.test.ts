import { describe, it, expect } from 'vitest';
import type {
  DeliveryMode,
  LocalEncounterMode,
  InterventionType,
} from '../../types/dream';
import {
  DELIVERY_RANGE,
  LOCAL_ENCOUNTER,
  INTERVENTION_DEFINITIONS,
} from '../../types/dream';
import {
  hexDistance,
  isInRange,
  getDeliveryInfo,
} from '../delivery';

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

describe('hexDistance', () => {
  it('returns 0 for same hex', () => {
    expect(hexDistance({ col: 3, row: 4 }, { col: 3, row: 4 })).toBe(0);
  });

  it('returns 1 for adjacent hexes', () => {
    expect(hexDistance({ col: 3, row: 4 }, { col: 4, row: 4 })).toBe(1);
  });

  it('computes correct distance for offset hex grid', () => {
    expect(hexDistance({ col: 0, row: 0 }, { col: 3, row: 0 })).toBe(3);
  });
});

describe('isInRange', () => {
  const avatarPos = { col: 5, row: 5 };

  it('astral interventions are always in range', () => {
    expect(isInRange(avatarPos, { col: 99, row: 99 }, 'dream')).toBe(true);
  });

  it('remote interventions are always in range', () => {
    expect(isInRange(avatarPos, { col: 99, row: 99 }, 'coincidence')).toBe(true);
    expect(isInRange(avatarPos, { col: 99, row: 99 }, 'omen')).toBe(true);
  });

  it('local interventions require same hex', () => {
    expect(isInRange(avatarPos, { col: 5, row: 5 }, 'persuade')).toBe(true);
    expect(isInRange(avatarPos, { col: 6, row: 5 }, 'persuade')).toBe(false);
    expect(isInRange(avatarPos, { col: 5, row: 5 }, 'afflict_bless')).toBe(true);
    expect(isInRange(avatarPos, { col: 4, row: 5 }, 'afflict_bless')).toBe(false);
  });

  it('regional interventions check hex distance against DELIVERY_RANGE', () => {
    expect(isInRange(avatarPos, { col: 7, row: 5 }, 'deceive')).toBe(true);
    expect(isInRange(avatarPos, { col: 8, row: 5 }, 'deceive')).toBe(true);
    expect(isInRange(avatarPos, { col: 9, row: 5 }, 'deceive')).toBe(false);
  });

  it('inspire has longer range (5) than intimidate (3)', () => {
    expect(isInRange(avatarPos, { col: 9, row: 5 }, 'inspire_intervention')).toBe(true);
    expect(isInRange(avatarPos, { col: 9, row: 5 }, 'intimidate')).toBe(false);
  });
});

describe('getDeliveryInfo', () => {
  it('returns delivery mode and range for any intervention type', () => {
    const info = getDeliveryInfo('dream');
    expect(info.mode).toBe('astral');
    expect(info.range).toBeNull();
  });

  it('returns hex range for regional interventions', () => {
    const info = getDeliveryInfo('deceive');
    expect(info.mode).toBe('regional');
    expect(info.range).toBe(3);
  });

  it('returns range 0 for local interventions', () => {
    const info = getDeliveryInfo('persuade');
    expect(info.mode).toBe('local');
    expect(info.range).toBe(0);
  });

  it('returns null range for remote interventions', () => {
    const info = getDeliveryInfo('coincidence');
    expect(info.mode).toBe('remote');
    expect(info.range).toBeNull();
  });
});
