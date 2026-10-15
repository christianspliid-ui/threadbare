/**
 * Border ink keeps off the doom red and the Dominion gold (THR-1902, THR-1878 plan § D12).
 *
 * The test resolves every ink a border can draw — every heraldic colour, through the
 * remap, mixed toward every terrain colour of every palette — and fails naming the
 * colour pair if one reads as a reserved hue. A new heraldic colour or a repainted
 * terrain that drifts into red or gold fails here, not on the map.
 */
import { describe, it, expect } from 'vitest';
import { FACTION_HERALDIC_COLORS } from '../../agents/agentSpriteTypes';
import { TERRAIN_PALETTE } from '../../palette/terrainPalette';
import { PALETTE_THEMES } from '../../palette/paletteTheme';
import { hexToThreeColor } from '../../palette/colorUtils';
import {
  BORDER_INK,
  BORDER_INK_REMAP,
  RESERVED_DOMINION_GOLD,
  RESERVED_DOOM_RED,
  capitalInk,
  holderHeraldicInk,
  hueDistance,
  reservedHueClash,
  resolveBorderInk,
  rgbToHex,
  rgbToHsl,
} from '../borderInk';

/** Every terrain colour any palette paints. */
function allTerrainColors(): string[] {
  const set = new Set<string>(Object.values(TERRAIN_PALETTE));
  for (const theme of Object.values(PALETTE_THEMES)) {
    for (const c of Object.values(theme.terrainOverrides)) set.add(c);
    set.add(theme.fallbackTerrainColor);
  }
  return [...set];
}

describe('border ink — reserved hues', () => {
  it('the reserved colours themselves read as reserved (the check can fail)', () => {
    expect(reservedHueClash(hexToThreeColor(RESERVED_DOOM_RED))).toBe('doom red');
    expect(reservedHueClash(hexToThreeColor(RESERVED_DOMINION_GOLD))).toBe('Dominion gold');
    // Falsification arm: the raw heraldic red and orange clash before the remap.
    expect(reservedHueClash(hexToThreeColor('#e53e3e'))).toBe('doom red');
    // Orange (24°) sits inside 30° of both the red (3°) and the gold (39°).
    expect(reservedHueClash(hexToThreeColor('#dd6b20'))).not.toBeNull();
  });

  it('no resolved ink reads as doom red or Dominion gold, for any holder on any terrain', () => {
    const clashes: string[] = [];
    for (let i = 0; i < FACTION_HERALDIC_COLORS.length; i++) {
      const heraldic = holderHeraldicInk(i);
      expect(heraldic).not.toBeNull();
      for (const terrain of allTerrainColors()) {
        const base = hexToThreeColor(heraldic!);
        const t = hexToThreeColor(terrain);
        const mix = BORDER_INK.SHADOW_MIX;
        const ink = base.map((c, k) => c * (1 - mix) + t[k] * BORDER_INK.TERRAIN_SHADE * mix) as [number, number, number];
        const clash = reservedHueClash(ink);
        if (clash) clashes.push(`${FACTION_HERALDIC_COLORS[i]} (as ${heraldic}) on ${terrain} → ${rgbToHex(ink)} reads as ${clash}`);
      }
    }
    expect(clashes).toEqual([]);
  });

  it('the remap targets are themselves clear of both reserved hues', () => {
    for (const [from, to] of Object.entries(BORDER_INK_REMAP)) {
      expect(reservedHueClash(hexToThreeColor(to)), `${from} → ${to}`).toBeNull();
    }
  });
});

describe('border ink — remap targets stand apart', () => {
  it('each remap target is at least 30° from every other holder ink, so it reads as its own Realm', () => {
    const inks = FACTION_HERALDIC_COLORS.map((_, i) => holderHeraldicInk(i)!);
    const hue = (hex: string) => rgbToHsl(hexToThreeColor(hex)).h;
    const close: string[] = [];
    for (const target of Object.values(BORDER_INK_REMAP)) {
      for (const other of inks) {
        if (other === target) continue;
        const d = hueDistance(hue(target), hue(other));
        if (d < BORDER_INK.MIN_HUE_DISTANCE_DEG) close.push(`${target} is ${d.toFixed(0)}° from ${other}`);
      }
    }
    expect(close).toEqual([]);
  });
});

describe('border ink — resolution', () => {
  it('a holder takes its own heraldic colour unless remapped', () => {
    expect(holderHeraldicInk(1)).toBe(FACTION_HERALDIC_COLORS[1]);
    expect(holderHeraldicInk(0)).toBe(BORDER_INK_REMAP['#e53e3e']);
    // Indices beyond the palette wrap, like the agent rings.
    expect(holderHeraldicInk(FACTION_HERALDIC_COLORS.length + 1)).toBe(FACTION_HERALDIC_COLORS[1]);
  });

  it('no holder draws the unheld ink (fail-soft)', () => {
    expect(holderHeraldicInk(-1)).toBeNull();
    expect(holderHeraldicInk(Number.NaN)).toBeNull();
    expect(rgbToHex(resolveBorderInk(null, [0.5, 0.5, 0.5], '#3a3028'))).toBe('#3a3028');
    expect(capitalInk(-1, '#3a3028')).toBe('#3a3028');
  });

  it('the ink darkens toward the terrain shadow', () => {
    const heraldic = FACTION_HERALDIC_COLORS[1];
    const pure = hexToThreeColor(heraldic);
    const ink = resolveBorderInk(heraldic, [0.2, 0.3, 0.2], '#000000');
    expect(ink[0] + ink[1] + ink[2]).toBeLessThan(pure[0] + pure[1] + pure[2]);
  });

  it('an unmapped heraldic colour that clashes falls back to unheld ink, never a reserved hue', () => {
    const ink = resolveBorderInk('#e84038', [0.9, 0.3, 0.2], '#3a3028');
    expect(rgbToHex(ink)).toBe('#3a3028');
  });
});
