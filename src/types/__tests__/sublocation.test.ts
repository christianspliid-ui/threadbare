import { describe, it, expect } from 'vitest';
import type {
  SublocationPersistence,
  SublocationProperties,
  TemporalTrigger,
  DivineOrigin,
} from '../sublocation';

describe('Sublocation types', () => {
  it('constructs a permanent sublocation', () => {
    const props: SublocationProperties = {
      sublocationTypeId: 'sublocation.temple-quarter',
      parentLocationId: 'loc.thornwall',
      persistence: { type: 'permanent' },
    };
    expect(props.persistence.type).toBe('permanent');
    expect(props.sublocationTypeId).toBe('sublocation.temple-quarter');
  });

  it('constructs a temporal sublocation with encounter_completed trigger', () => {
    const props: SublocationProperties = {
      sublocationTypeId: 'sublocation.moonlit-garden',
      parentLocationId: 'loc.thornwall',
      persistence: { type: 'temporal', dissolvesOn: 'encounter_completed' },
    };
    expect(props.persistence.type).toBe('temporal');
    if (props.persistence.type === 'temporal') {
      expect(props.persistence.dissolvesOn).toBe('encounter_completed');
    }
  });

  it('constructs a temporal sublocation with tick_expiry trigger', () => {
    const props: SublocationProperties = {
      sublocationTypeId: 'sublocation.war-camp',
      parentLocationId: 'loc.thornwall',
      persistence: {
        type: 'temporal',
        dissolvesOn: { type: 'tick_expiry', expiresAtTick: 50 },
      },
    };
    expect(props.persistence.type).toBe('temporal');
  });

  it('constructs a conditional sublocation', () => {
    const props: SublocationProperties = {
      sublocationTypeId: 'sublocation.barracks',
      parentLocationId: 'loc.thornwall',
      persistence: { type: 'conditional', predicate: 'faction_conflict_active' },
    };
    expect(props.persistence.type).toBe('conditional');
  });

  it('constructs a divine sublocation with origin metadata', () => {
    const origin: DivineOrigin = {
      creatorGodId: 'god.entropy',
      purpose: 'arrange_meeting',
      createdAtTick: 12,
    };
    const props: SublocationProperties = {
      sublocationTypeId: 'sublocation.moonlit-garden',
      parentLocationId: 'loc.thornwall',
      persistence: { type: 'temporal', dissolvesOn: 'encounter_completed' },
      divineOrigin: origin,
    };
    expect(props.divineOrigin?.creatorGodId).toBe('god.entropy');
    expect(props.divineOrigin?.purpose).toBe('arrange_meeting');
  });
});
