// @vitest-environment jsdom
/**
 * THR-2198 item 4 — "The pink ring on the map: no idea. Hovering showed nothing" (round-7
 * cold playtest). The anomaly shimmer / halo now has a hover line: the place by name once
 * found, the glow unnamed before, with a ring marker in the halo's own colour.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HexTooltip } from '../interaction/HexTooltip';
import { anomalyHoverLine, ANOMALY_HOVER_UNFOUND } from '../../../data/ui-content';
import { getAnomalySphereColor } from '../scene/AnomalyShimmerMesh';

const BASE = {
  terrainName: 'plains',
  terrainKey: 'plains',
  coord: { col: 5, row: 7 },
  screenX: 400,
  screenY: 400,
  canvasWidth: 1920,
  canvasHeight: 1080,
};

describe('anomalyHoverLine (THR-2198)', () => {
  it('names a found anomaly', () => {
    expect(anomalyHoverLine(true, 'The Weeping Stone')).toBe('The ring marks The Weeping Stone, a place where the world runs strange.');
  });

  it('keeps an unfound anomaly unnamed, whatever name it carries', () => {
    expect(anomalyHoverLine(false, 'The Weeping Stone')).toBe(ANOMALY_HOVER_UNFOUND);
    expect(anomalyHoverLine(false, 'The Weeping Stone')).not.toContain('Weeping');
  });

  it('a found anomaly with no name still reads as a sentence', () => {
    expect(anomalyHoverLine(true, '  ')).toBe('The ring marks a place where the world runs strange.');
  });

  it('the ring colour falls back for an unknown type, never throws', () => {
    expect(typeof getAnomalySphereColor('not_a_type')).toBe('string');
  });
});

describe('HexTooltip anomaly line (THR-2198)', () => {
  it('renders the line with a ring marker in the given colour', () => {
    render(<HexTooltip {...BASE} anomalyLine={{ text: anomalyHoverLine(true, 'The Weeping Stone'), color: 'rgb(170, 68, 221)' }} />);
    const line = screen.getByTestId('hex-tooltip-anomaly');
    expect(line.textContent).toContain('The Weeping Stone');
    const ring = line.querySelector('span[aria-hidden]') as HTMLElement;
    expect(ring.style.border).toContain('rgb(170, 68, 221)');
  });

  it('renders no anomaly line on an ordinary hex', () => {
    render(<HexTooltip {...BASE} />);
    expect(screen.queryByTestId('hex-tooltip-anomaly')).toBeNull();
  });
});
