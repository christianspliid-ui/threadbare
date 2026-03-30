// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { CoastlineOverlay } from '../CoastlineOverlay';
import type { CoastlineData } from '../../../types/coastline';
import { COASTLINE_DEFAULTS } from '../../../types/coastline';

const mockData: CoastlineData = {
  loops: [[
    { x: 10, y: 10 }, { x: 50, y: 10 }, { x: 50, y: 50 }, { x: 10, y: 50 },
  ]],
  shallowLoops: [[
    { x: 5, y: 5 }, { x: 55, y: 5 }, { x: 55, y: 55 }, { x: 5, y: 55 },
  ]],
};

function renderInSvg(children: React.ReactNode) {
  return render(<svg>{children}</svg>);
}

describe('CoastlineOverlay', () => {
  it('renders shallows path before land contour path', () => {
    const { container } = renderInSvg(
      <CoastlineOverlay data={mockData} svgWidth={600} svgHeight={400} colors={COASTLINE_DEFAULTS.colors} />
    );
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBeGreaterThanOrEqual(2);
  });

  it('applies correct fill colors', () => {
    const { container } = renderInSvg(
      <CoastlineOverlay data={mockData} svgWidth={600} svgHeight={400} colors={COASTLINE_DEFAULTS.colors} />
    );
    const paths = container.querySelectorAll('path');
    const fills = Array.from(paths).map(p => p.getAttribute('fill'));
    expect(fills).toContain(COASTLINE_DEFAULTS.colors.shallows);
    expect(fills).toContain(COASTLINE_DEFAULTS.colors.coastEdge);
  });

  it('renders nothing when loops are empty', () => {
    const emptyData: CoastlineData = { loops: [], shallowLoops: [] };
    const { container } = renderInSvg(
      <CoastlineOverlay data={emptyData} svgWidth={600} svgHeight={400} colors={COASTLINE_DEFAULTS.colors} />
    );
    const paths = container.querySelectorAll('path');
    expect(paths).toHaveLength(0);
  });

  it('renders land contour even when shallowLoops are empty', () => {
    const noShallows: CoastlineData = {
      loops: mockData.loops,
      shallowLoops: [],
    };
    const { container } = renderInSvg(
      <CoastlineOverlay data={noShallows} svgWidth={600} svgHeight={400} colors={COASTLINE_DEFAULTS.colors} />
    );
    const paths = container.querySelectorAll('path');
    expect(paths).toHaveLength(1);
    expect(paths[0].getAttribute('fill')).toBe(COASTLINE_DEFAULTS.colors.coastEdge);
  });
});
