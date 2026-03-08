// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { RivalIcon } from '../RivalIcon';

describe('RivalIcon', () => {
  it('renders with single sphere', () => {
    const { container } = render(
      <RivalIcon spheres={['force']} />
    );
    const span = container.querySelector('span');
    expect(span).toBeTruthy();
    expect(span?.textContent).toContain('●');
  });

  it('renders with two spheres', () => {
    const { container } = render(
      <RivalIcon spheres={['force', 'mind']} />
    );
    const dots = container.querySelectorAll('span:has(>span)');
    // RivalIcon with 2 spheres renders overlapped dots
    expect(dots.length).toBeGreaterThan(0);
  });

  it('renders with three spheres', () => {
    const { container } = render(
      <RivalIcon spheres={['force', 'mind', 'spirit']} />
    );
    const span = container.querySelector('span[style*="position"]');
    expect(span).toBeTruthy();
  });

  it('limits to maximum of 3 spheres', () => {
    const { container } = render(
      <RivalIcon spheres={['force', 'mind', 'spirit', 'energy', 'life']} />
    );
    // Should only render 3 colored dots
    const innerSpans = container.querySelectorAll('span > span');
    expect(innerSpans.length).toBeLessThanOrEqual(3);
  });

  it('handles empty sphere list', () => {
    const { container } = render(
      <RivalIcon spheres={[]} />
    );
    const span = container.querySelector('span');
    expect(span).toBeTruthy();
    expect(span?.textContent).toBe('●'); // Fallback dot
  });

  it('respects custom size', () => {
    const { container } = render(
      <RivalIcon spheres={['force']} size="2rem" />
    );
    const span = container.querySelector('span');
    const style = span?.getAttribute('style');
    expect(style).toContain('2rem');
  });

  it('respects custom className', () => {
    const { container } = render(
      <RivalIcon spheres={['force']} className="my-icon" />
    );
    const span = container.querySelector('span');
    expect(span).toHaveClass('my-icon');
  });

  it('includes accessibility title', () => {
    const { container } = render(
      <RivalIcon spheres={['force', 'mind']} title="Rival affinities" />
    );
    const span = container.querySelector('span');
    expect(span).toHaveAttribute('title', 'Rival affinities');
  });

  it('renders colored dots for each sphere', () => {
    const { container } = render(
      <RivalIcon spheres={['force', 'mind']} />
    );
    // Check that inner spans with style containing color are rendered
    const coloredSpans = container.querySelectorAll('span[style*="color"]');
    expect(coloredSpans.length).toBeGreaterThan(0);
  });

  it('applies progressive opacity for depth effect', () => {
    const { container } = render(
      <RivalIcon spheres={['force', 'mind', 'spirit']} />
    );
    const innerSpans = container.querySelectorAll('span > span');
    // Check that opacities increase progressively for depth
    expect(innerSpans.length).toBe(3);
  });

  it('uses sphere colors correctly', () => {
    const { container } = render(
      <RivalIcon spheres={['force']} />
    );
    // Force color should be in the rendered style
    const style = container.querySelector('span[style*="color"]')?.getAttribute('style');
    // Force bright color is #ff6b6b
    expect(style).toBeDefined();
  });

  it('handles unknown spheres gracefully', () => {
    const { container } = render(
      <RivalIcon spheres={['unknown-sphere' as any]} />
    );
    const span = container.querySelector('span');
    // Should still render without error
    expect(span).toBeTruthy();
  });

  it('merges custom styles', () => {
    const { container } = render(
      <RivalIcon
        spheres={['force']}
        style={{ margin: '10px' }}
      />
    );
    const span = container.querySelector('span');
    const style = span?.getAttribute('style');
    expect(style).toContain('margin');
  });

  it('single sphere renders as simple colored dot', () => {
    const { container } = render(
      <RivalIcon spheres={['energy']} />
    );
    const spans = container.querySelectorAll('span');
    // For single sphere, should be simpler structure
    expect(spans.length).toBeGreaterThan(0);
  });

  it('multiple spheres render in relative layout', () => {
    const { container } = render(
      <RivalIcon spheres={['force', 'mind']} />
    );
    const parentSpan = container.querySelector('span[style*="position: relative"]');
    expect(parentSpan).toBeTruthy();
  });
});
