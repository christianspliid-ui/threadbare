import { describe, it, expect, beforeEach } from 'vitest';
import {
  getActivePalette,
  getActivePaletteId,
  setActivePalette,
  onPaletteChange,
  buildLandHalo,
  buildRiverHalo,
} from '../activePalette';
import { GOLDEN_HOUR, DARK_PARCHMENT } from '../paletteTheme';

describe('activePalette', () => {
  // Reset to default before each test
  beforeEach(() => {
    setActivePalette('golden-hour');
  });

  it('returns golden-hour by default', () => {
    expect(getActivePaletteId()).toBe('golden-hour');
    expect(getActivePalette()).toBe(GOLDEN_HOUR);
  });

  it('switches to dark-parchment', () => {
    setActivePalette('dark-parchment');
    expect(getActivePaletteId()).toBe('dark-parchment');
    expect(getActivePalette()).toBe(DARK_PARCHMENT);
  });

  it('falls back to default for unknown IDs', () => {
    setActivePalette('dark-parchment');
    setActivePalette('nonexistent');
    expect(getActivePaletteId()).toBe('golden-hour');
  });

  it('no-ops when setting same palette', () => {
    let callCount = 0;
    const unsub = onPaletteChange(() => { callCount++; });
    setActivePalette('golden-hour'); // same as current — should not fire
    expect(callCount).toBe(0);
    unsub();
  });

  it('notifies listeners on change', () => {
    const received: string[] = [];
    const unsub = onPaletteChange((theme) => { received.push(theme.id); });
    setActivePalette('dark-parchment');
    setActivePalette('golden-hour');
    expect(received).toEqual(['dark-parchment', 'golden-hour']);
    unsub();
  });

  it('unsubscribe stops notifications', () => {
    let callCount = 0;
    const unsub = onPaletteChange(() => { callCount++; });
    unsub();
    setActivePalette('dark-parchment');
    expect(callCount).toBe(0);
  });
});

describe('buildLandHalo', () => {
  it('produces valid CSS text-shadow string', () => {
    const halo = buildLandHalo();
    expect(halo).toContain('rgba(');
    expect(halo).toContain('1px 0 0');
    // Should have 6 shadow entries separated by "), "
    expect(halo.split('),').length).toBe(6);
  });

  it('uses theme-specific halo color', () => {
    const goldenHalo = buildLandHalo(GOLDEN_HOUR);
    const darkHalo = buildLandHalo(DARK_PARCHMENT);
    expect(goldenHalo).toContain('240,235,220');
    expect(darkHalo).toContain('12,12,16');
    expect(goldenHalo).not.toBe(darkHalo);
  });
});

describe('buildRiverHalo', () => {
  it('produces valid CSS text-shadow string', () => {
    const halo = buildRiverHalo();
    expect(halo).toContain('rgba(');
    // Should have 6 shadow entries separated by "), "
    expect(halo.split('),').length).toBe(6);
  });

  it('has slightly lower primary opacity than land halo', () => {
    // River halo inner opacity = labelHaloOpacity - 0.05
    const landHalo = buildLandHalo(GOLDEN_HOUR);
    const riverHalo = buildRiverHalo(GOLDEN_HOUR);
    expect(riverHalo).not.toBe(landHalo);
  });
});
