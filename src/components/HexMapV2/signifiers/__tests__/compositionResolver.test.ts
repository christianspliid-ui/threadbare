import { describe, it, expect } from 'vitest';
import { resolveHexComposition } from '../compositionResolver';
import type { HexVisualManifest } from '../compositionTypes';

const TERRAIN_SIGNIFIER: HexVisualManifest = {
  entityType: 'terrain-signifier',
  preferredSlot: 'FILL',
  footprint: 'full',
  suppresses: [],
  visibleAt: ['hero-local', 'regional'],
  priority: 10,
};

const MAJOR_LOCATION: HexVisualManifest = {
  entityType: 'major-location',
  preferredSlot: 'CENTER',
  footprint: 'full',
  suppresses: [{ target: 'terrain-signifier', when: 'always' }],
  visibleAt: ['hero-local', 'regional', 'continental'],
  priority: 90,
};

const MINOR_LOCATION: HexVisualManifest = {
  entityType: 'minor-location',
  preferredSlot: 'CENTER',
  footprint: 'medium',
  suppresses: [{ target: 'terrain-signifier', when: 'same-slot' }],
  visibleAt: ['hero-local', 'regional'],
  priority: 50,
};

describe('resolveHexComposition', () => {
  it('Test 1: single terrain-signifier returns visible result in FILL slot', () => {
    const result = resolveHexComposition([TERRAIN_SIGNIFIER]);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      entity: 'terrain-signifier',
      slot: 'FILL',
      visible: true,
    });
  });

  it('Test 2: major-location suppresses terrain-signifier with always rule', () => {
    const result = resolveHexComposition([TERRAIN_SIGNIFIER, MAJOR_LOCATION]);
    expect(result).toHaveLength(2);

    const locationResult = result.find(r => r.entity === 'major-location');
    const terrainResult = result.find(r => r.entity === 'terrain-signifier');

    expect(locationResult).toEqual({ entity: 'major-location', slot: 'CENTER', visible: true });
    expect(terrainResult?.visible).toBe(false);
  });

  it('Test 3: two entities wanting same slot — higher priority gets it, lower gets fallback', () => {
    const highPriority: HexVisualManifest = {
      entityType: 'high-entity',
      preferredSlot: 'CENTER',
      footprint: 'medium',
      suppresses: [],
      visibleAt: ['hero-local'],
      priority: 80,
    };
    const lowPriority: HexVisualManifest = {
      entityType: 'low-entity',
      preferredSlot: 'CENTER',
      footprint: 'small',
      suppresses: [],
      visibleAt: ['hero-local'],
      priority: 20,
      fallbackSlots: ['N'],
    };

    const result = resolveHexComposition([lowPriority, highPriority]);
    const highResult = result.find(r => r.entity === 'high-entity');
    const lowResult = result.find(r => r.entity === 'low-entity');

    expect(highResult).toEqual({ entity: 'high-entity', slot: 'CENTER', visible: true });
    expect(lowResult).toEqual({ entity: 'low-entity', slot: 'N', visible: true });
  });

  it('Test 4: entity with no available slot gets visible=false', () => {
    const blocker: HexVisualManifest = {
      entityType: 'blocker',
      preferredSlot: 'CENTER',
      footprint: 'medium',
      suppresses: [],
      visibleAt: ['hero-local'],
      priority: 80,
    };
    const noSlot: HexVisualManifest = {
      entityType: 'no-slot-entity',
      preferredSlot: 'CENTER',
      footprint: 'small',
      suppresses: [],
      visibleAt: ['hero-local'],
      priority: 20,
      // no fallbackSlots
    };

    const result = resolveHexComposition([blocker, noSlot]);
    const noSlotResult = result.find(r => r.entity === 'no-slot-entity');
    expect(noSlotResult?.visible).toBe(false);
  });

  it('Test 5: same-slot suppress rule only suppresses when entities are in same slot', () => {
    // minor-location at CENTER suppresses terrain-signifier only when same-slot
    // terrain-signifier is at FILL — different slot — so NOT suppressed
    const result = resolveHexComposition([TERRAIN_SIGNIFIER, MINOR_LOCATION]);

    const locationResult = result.find(r => r.entity === 'minor-location');
    const terrainResult = result.find(r => r.entity === 'terrain-signifier');

    expect(locationResult?.slot).toBe('CENTER');
    expect(terrainResult?.slot).toBe('FILL');
    // Different slots, same-slot rule → terrain NOT suppressed
    expect(terrainResult?.visible).toBe(true);
  });

  it('Test 6: empty entities array returns empty results', () => {
    const result = resolveHexComposition([]);
    expect(result).toEqual([]);
  });

  it('Test 7: multiple entities sorted correctly by priority descending', () => {
    const entities: HexVisualManifest[] = [
      { entityType: 'low', preferredSlot: 'S', footprint: 'small', suppresses: [], visibleAt: ['hero-local'], priority: 5 },
      { entityType: 'high', preferredSlot: 'N', footprint: 'small', suppresses: [], visibleAt: ['hero-local'], priority: 100 },
      { entityType: 'mid', preferredSlot: 'NE', footprint: 'small', suppresses: [], visibleAt: ['hero-local'], priority: 50 },
    ];

    const result = resolveHexComposition(entities);
    expect(result).toHaveLength(3);
    // Results returned in priority order (high first)
    expect(result[0].entity).toBe('high');
    expect(result[1].entity).toBe('mid');
    expect(result[2].entity).toBe('low');
  });
});
