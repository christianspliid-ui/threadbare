// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { RegionLabels } from '../RegionLabels';
import { WorldGraph } from '../../../engine/graph';
import type { VisibilityMap } from '../../../types/visibility';

function makeGraphWithRegion(opts: {
  name?: string;
  featureType?: string;
  centerCol?: number;
  centerRow?: number;
} = {}): WorldGraph {
  const g = new WorldGraph();
  g.addNode({
    id: 'region_0',
    type: 'region',
    name: opts.name ?? 'The Iron Crags',
    properties: {
      featureType: opts.featureType ?? 'mountain_range',
      hexCount: 5,
      centerCol: opts.centerCol ?? 3,
      centerRow: opts.centerRow ?? 4,
    },
  });
  return g;
}

function renderInSvg(ui: React.ReactElement) {
  return render(<svg>{ui}</svg>);
}

describe('RegionLabels', () => {
  it('renders a text element for each region node', () => {
    const graph = makeGraphWithRegion();
    const { container } = renderInSvg(
      <RegionLabels graph={graph} hexSize={30} zoomScale={1.0} />
    );
    const texts = container.querySelectorAll('text');
    expect(texts.length).toBe(1);
    expect(texts[0].textContent).toBe('The Iron Crags');
  });

  it('skips regions with empty names', () => {
    const graph = makeGraphWithRegion({ name: '' });
    const { container } = renderInSvg(
      <RegionLabels graph={graph} hexSize={30} zoomScale={1.0} />
    );
    expect(container.querySelectorAll('text').length).toBe(0);
  });

  it('sets opacity to 1 when zoomScale <= FADE_START', () => {
    const graph = makeGraphWithRegion();
    const { container } = renderInSvg(
      <RegionLabels graph={graph} hexSize={30} zoomScale={1.0} />
    );
    const g = container.querySelector('.region-labels-layer');
    expect(g?.getAttribute('opacity')).toBe('1');
  });

  it('sets opacity to 0 when zoomScale >= FADE_END', () => {
    const graph = makeGraphWithRegion();
    const { container } = renderInSvg(
      <RegionLabels graph={graph} hexSize={30} zoomScale={4.0} />
    );
    const g = container.querySelector('.region-labels-layer');
    expect(g?.getAttribute('opacity')).toBe('0');
  });

  it('sets intermediate opacity during fade range', () => {
    const graph = makeGraphWithRegion();
    const { container } = renderInSvg(
      <RegionLabels graph={graph} hexSize={30} zoomScale={3.0} />
    );
    const g = container.querySelector('.region-labels-layer');
    const opacity = Number(g?.getAttribute('opacity'));
    expect(opacity).toBeGreaterThan(0);
    expect(opacity).toBeLessThan(1);
  });

  it('hides labels for fully unexplored regions', () => {
    const graph = makeGraphWithRegion({ centerCol: 3, centerRow: 4 });
    const visMap: VisibilityMap = new Map(); // empty = all unexplored
    const { container } = renderInSvg(
      <RegionLabels graph={graph} hexSize={30} zoomScale={1.0} visibilityMap={visMap} />
    );
    expect(container.querySelectorAll('text').length).toBe(0);
  });

  it('shows labels when visibilityMap is undefined (no fog)', () => {
    const graph = makeGraphWithRegion();
    const { container } = renderInSvg(
      <RegionLabels graph={graph} hexSize={30} zoomScale={1.0} />
    );
    expect(container.querySelectorAll('text').length).toBe(1);
  });
});
