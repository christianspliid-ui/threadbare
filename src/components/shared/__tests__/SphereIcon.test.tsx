// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SphereIcon } from '../SphereIcon';
import { SPHERE_ICONS } from '../../../data/sphereIcons';

describe('SphereIcon', () => {
  it('renders with correct sphere color', () => {
    const { container } = render(<SphereIcon sphereName="force" />);
    const span = container.querySelector('span');
    expect(span).toBeTruthy();
    // Check that the color style is applied
    const style = span?.getAttribute('style');
    expect(style).toContain('color');
  });

  it('renders all creation spheres correctly', () => {
    Object.keys(SPHERE_ICONS).forEach((sphere) => {
      const { container } = render(<SphereIcon sphereName={sphere} />);
      const span = container.querySelector('span');
      expect(span).toBeTruthy();
      // Should contain the symbol
      const symbol = SPHERE_ICONS[sphere as keyof typeof SPHERE_ICONS]?.symbol;
      expect(span?.textContent).toBe(symbol);
    });
  });

  it('renders custom size', () => {
    const { container } = render(<SphereIcon sphereName="mind" size="2rem" />);
    const span = container.querySelector('span');
    const style = span?.getAttribute('style');
    expect(style).toContain('font-size');
  });

  it('respects custom className', () => {
    const { container } = render(
      <SphereIcon sphereName="life" className="custom-class" />
    );
    const span = container.querySelector('span');
    expect(span).toHaveClass('custom-class');
  });

  it('renders monochrome variant', () => {
    const { container } = render(
      <SphereIcon sphereName="spirit" monochrome={true} />
    );
    const span = container.querySelector('span');
    const style = span?.getAttribute('style');
    // In monochrome mode, color is 'currentColor', not the sphere color
    expect(style).toMatch(/color:\s*currentcolor/i);
  });

  it('includes accessibility title', () => {
    const { container } = render(
      <SphereIcon sphereName="energy" title="Energy Sphere" />
    );
    const span = container.querySelector('span');
    expect(span).toHaveAttribute('title', 'Energy Sphere');
  });

  it('defaults to sphere name as aria-label', () => {
    const { container } = render(
      <SphereIcon sphereName="entropy" />
    );
    const span = container.querySelector('span');
    expect(span).toHaveAttribute('aria-label', 'entropy');
  });

  it('renders force sphere with correct bright color', () => {
    const { container } = render(<SphereIcon sphereName="force" />);
    const span = container.querySelector('span');
    expect(span?.textContent).toBe('✦'); // Sharp directional
  });

  it('renders matter sphere with hexagon symbol', () => {
    const { container } = render(<SphereIcon sphereName="matter" />);
    const span = container.querySelector('span');
    expect(span?.textContent).toBe('⬡'); // Crystalline hexagon
  });

  it('renders energy sphere with radiant symbol', () => {
    const { container } = render(<SphereIcon sphereName="energy" />);
    const span = container.querySelector('span');
    expect(span?.textContent).toBe('⊙'); // Radiating spike
  });

  it('renders life sphere with organic symbol', () => {
    const { container } = render(<SphereIcon sphereName="life" />);
    const span = container.querySelector('span');
    expect(span?.textContent).toBe('∿'); // Organic branching
  });

  it('renders mind sphere with neural symbol', () => {
    const { container } = render(<SphereIcon sphereName="mind" />);
    const span = container.querySelector('span');
    expect(span?.textContent).toBe('◉'); // Neural nodes
  });

  it('renders spirit sphere with ethereal symbol', () => {
    const { container } = render(<SphereIcon sphereName="spirit" />);
    const span = container.querySelector('span');
    expect(span?.textContent).toBe('⟡'); // Ethereal/ascending
  });

  it('renders time sphere with echo symbol', () => {
    const { container } = render(<SphereIcon sphereName="time" />);
    const span = container.querySelector('span');
    expect(span?.textContent).toBe('◈'); // Ripple/echo
  });

  it('renders entropy sphere with fractured symbol', () => {
    const { container } = render(<SphereIcon sphereName="entropy" />);
    const span = container?.querySelector('span');
    expect(span?.textContent).toBe('◆'); // Fractured
  });

  describe('image rendering', () => {
    it('renders an img element when useImage is true', () => {
      const { container } = render(
        <SphereIcon sphereName="force" useImage={true} size="32px" />
      );
      const img = container.querySelector('img');
      expect(img).toBeTruthy();
      expect(img?.getAttribute('src')).toContain('/icons/spheres/force.png');
    });

    it('falls back to glyph when useImage is false', () => {
      const { container } = render(
        <SphereIcon sphereName="force" useImage={false} />
      );
      const img = container.querySelector('img');
      expect(img).toBeNull();
      expect(container.textContent).toContain('✦');
    });

    it('defaults to glyph rendering (backward compatible)', () => {
      const { container } = render(<SphereIcon sphereName="force" />);
      const img = container.querySelector('img');
      expect(img).toBeNull();
    });

    it('renders img with correct dimensions from numeric size', () => {
      const { container } = render(
        <SphereIcon sphereName="mind" useImage={true} size={48} />
      );
      const img = container.querySelector('img');
      expect(img).toBeTruthy();
      expect(img?.getAttribute('width')).toBe('48');
      expect(img?.getAttribute('height')).toBe('48');
    });

    it('renders img with alt text', () => {
      const { container } = render(
        <SphereIcon sphereName="life" useImage={true} title="Life Sphere" />
      );
      const img = container.querySelector('img');
      expect(img?.getAttribute('alt')).toBe('Life Sphere');
    });

    it('falls back to glyph for unknown sphere even with useImage', () => {
      const { container } = render(
        <SphereIcon sphereName="unknown-sphere" useImage={true} />
      );
      // Unknown sphere has no imagePath, should fall back to glyph
      const img = container.querySelector('img');
      expect(img).toBeNull();
      const span = container.querySelector('span');
      expect(span).toBeTruthy();
    });
  });

  it('merges custom styles with computed styles', () => {
    const { container } = render(
      <SphereIcon
        sphereName="mind"
        style={{ opacity: 0.5 }}
      />
    );
    const span = container.querySelector('span');
    const style = span?.getAttribute('style');
    expect(style).toContain('opacity');
    expect(style).toContain('color');
  });

  it('handles numeric size values', () => {
    const { container } = render(<SphereIcon sphereName="force" size={24} />);
    const span = container.querySelector('span');
    const style = span?.getAttribute('style');
    expect(style).toContain('24px');
  });
});
