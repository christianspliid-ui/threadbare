/**
 * THR-1665 (UI Law 35) — the hex hover tooltip sits above every label
 * overlay, every map overlay stays inside the documented 10–19 band, and no
 * overlay hardcodes a literal z-index again.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { MAP_OVERLAY_Z } from '../mapOverlayZ';

const HEXMAP_DIR = resolve(__dirname, '../..');

const OVERLAY_FILES = [
  'overlay/RegionLabelOverlay.tsx',
  'overlay/LocationLabelOverlay.tsx',
  'overlay/AgentPulseOverlay.tsx',
  'interaction/HexTooltip.tsx',
];

describe('MAP_OVERLAY_Z (THR-1665)', () => {
  it('puts the hex tooltip above every label overlay', () => {
    const { HEX_TOOLTIP, ...rest } = MAP_OVERLAY_Z;
    for (const z of Object.values(rest)) expect(HEX_TOOLTIP).toBeGreaterThan(z);
  });

  it('keeps every map overlay inside the "Map overlays" band (10–19), below the HUD at 20', () => {
    for (const z of Object.values(MAP_OVERLAY_Z)) {
      expect(z).toBeGreaterThanOrEqual(10);
      expect(z).toBeLessThan(20);
    }
  });

  it('orders the labels: pulse under region names under location names', () => {
    expect(MAP_OVERLAY_Z.AGENT_PULSE).toBeLessThan(MAP_OVERLAY_Z.REGION_LABELS);
    expect(MAP_OVERLAY_Z.REGION_LABELS).toBeLessThan(MAP_OVERLAY_Z.LOCATION_LABELS);
  });

  it.each(OVERLAY_FILES)('%s takes its z-index from MAP_OVERLAY_Z, never a literal', (file) => {
    const src = readFileSync(resolve(HEXMAP_DIR, file), 'utf8');
    expect(src).toMatch(/zIndex:\s*MAP_OVERLAY_Z\./);
    expect(src).not.toMatch(/zIndex:\s*\d/);
  });

  it('isolates the HexMapV2 container so the bands never outrank the HUD', () => {
    const src = readFileSync(resolve(HEXMAP_DIR, 'HexMapV2.tsx'), 'utf8');
    expect(src).toMatch(/isolation:\s*'isolate'/);
  });
});
