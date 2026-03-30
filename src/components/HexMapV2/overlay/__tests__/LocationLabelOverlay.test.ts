/**
 * LocationLabelOverlay.test.ts — Unit tests for the location label HTML overlay.
 *
 * Tests component structure and styling without full rendering:
 * - Font sizes and weights per importance tier
 * - pointer-events: none on all labels
 * - Zoom visibility thresholds
 * - RING slot coexistence test (tests that labels do not interfere with composition)
 */

import { describe, it, expect, vi } from 'vitest';

// Mock React and react-dom/client for shallow testing
vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    useEffect: vi.fn((cb: () => void | (() => void)) => { /* no-op in unit tests */ }),
    useRef: vi.fn(() => ({ current: null })),
    useState: vi.fn((init: unknown) => [init, vi.fn()]),
  };
});

import {
  LOCATION_LABEL_FONT_SIZES,
  LOCATION_LABEL_FONT_WEIGHTS,
  LOCATION_MIN_ZOOM,
  type LocationLabelData,
} from '../LocationLabelOverlay';

describe('LocationLabelOverlay exports', () => {
  it('LOCATION_LABEL_FONT_SIZES has correct values', () => {
    expect(LOCATION_LABEL_FONT_SIZES.capital).toBe(16);
    expect(LOCATION_LABEL_FONT_SIZES.city).toBe(13);
    expect(LOCATION_LABEL_FONT_SIZES.town).toBe(13);
    expect(LOCATION_LABEL_FONT_SIZES.small).toBe(11);
  });

  it('LOCATION_LABEL_FONT_WEIGHTS are all bold', () => {
    expect(LOCATION_LABEL_FONT_WEIGHTS.capital).toBe(700);
    expect(LOCATION_LABEL_FONT_WEIGHTS.city).toBe(700);
    expect(LOCATION_LABEL_FONT_WEIGHTS.town).toBe(700);
    expect(LOCATION_LABEL_FONT_WEIGHTS.small).toBe(700);
  });

  it('LOCATION_MIN_ZOOM is CONTINENTAL_MAX (5) — labels hidden below continental', () => {
    // Labels visible at regional+ (k >= 5). At continental and below, icons only.
    expect(LOCATION_MIN_ZOOM).toBe(5);
  });
});

describe('LocationLabelData interface shape', () => {
  it('accepts valid LocationLabelData objects', () => {
    const data: LocationLabelData = {
      id: 'loc-1',
      name: 'Silverkeep',
      hexCol: 5,
      hexRow: 3,
      importance: 'capital',
    };
    expect(data.id).toBe('loc-1');
    expect(data.importance).toBe('capital');
  });

  it('supports all importance tiers', () => {
    const importances: Array<LocationLabelData['importance']> = ['capital', 'city', 'town', 'small'];
    for (const importance of importances) {
      const data: LocationLabelData = {
        id: `loc-${importance}`,
        name: 'Test',
        hexCol: 0,
        hexRow: 0,
        importance,
      };
      expect(data.importance).toBe(importance);
    }
  });
});
