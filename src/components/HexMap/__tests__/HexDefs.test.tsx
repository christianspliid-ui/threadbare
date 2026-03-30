// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { HexDefs } from '../HexDefs';

describe('HexDefs', () => {
  it('renders a clipPath with id hex-clip-{size}', () => {
    const { container } = render(
      <svg><HexDefs size={30} /></svg>
    );
    const clipPath = container.querySelector('#hex-clip-30');
    expect(clipPath).toBeTruthy();
    expect(clipPath?.tagName).toBe('clipPath');
  });

  it('clipPath contains a polygon with 6 vertices', () => {
    const { container } = render(
      <svg><HexDefs size={30} /></svg>
    );
    const polygon = container.querySelector('#hex-clip-30 polygon');
    expect(polygon).toBeTruthy();
    const points = polygon!.getAttribute('points')!.split(' ');
    expect(points.length).toBe(6);
  });

  it('polygon is centered at origin (0,0)', () => {
    const { container } = render(
      <svg><HexDefs size={30} /></svg>
    );
    const polygon = container.querySelector('#hex-clip-30 polygon');
    const points = polygon!.getAttribute('points')!.split(' ').map(p => {
      const [x, y] = p.split(',').map(Number);
      return { x, y };
    });
    const avgX = points.reduce((s, p) => s + p.x, 0) / points.length;
    const avgY = points.reduce((s, p) => s + p.y, 0) / points.length;
    expect(Math.abs(avgX)).toBeLessThan(0.01);
    expect(Math.abs(avgY)).toBeLessThan(0.01);
  });
});
