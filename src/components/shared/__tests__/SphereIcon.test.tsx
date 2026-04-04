// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SphereIcon } from '../SphereIcon';
import { SPHERE_ICONS } from '../../../data/sphereIcons';
import { SPHERE_NAMES } from '../../../types/index';

describe('SphereIcon', () => {
  it('renders a span wrapper for known spheres', () => {
    const { container } = render(<SphereIcon sphereName="force" />);
    const span = container.querySelector('span');
    expect(span).toBeTruthy();
  });

  it('renders SVG content (delegates to icons/SphereIcon) for all creation spheres', () => {
    Object.keys(SPHERE_ICONS).forEach((sphere) => {
      const { container } = render(<SphereIcon sphereName={sphere} />);
      // The SVG icon system renders an SVG via dangerouslySetInnerHTML
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
    });
  });

  it('renders an SVG of the correct size for numeric size prop', () => {
    const { container } = render(<SphereIcon sphereName="mind" size={32} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('width')).toBe('32');
    expect(svg?.getAttribute('height')).toBe('32');
  });

  it('respects custom className on the inner SVG span', () => {
    const { container } = render(
      <SphereIcon sphereName="life" className="custom-class" />
    );
    // className is passed to SvgSphereIcon which puts it on its inner span
    const el = container.querySelector('.custom-class');
    expect(el).toBeTruthy();
  });

  it('monochrome prop is accepted without error (no-op for SVG path)', () => {
    // monochrome is a compat prop — should render without throwing
    const { container } = render(
      <SphereIcon sphereName="spirit" monochrome={true} />
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('includes accessibility title on wrapper span', () => {
    const { container } = render(
      <SphereIcon sphereName="energy" title="Energy Sphere" />
    );
    const span = container.querySelector('span[title]');
    expect(span).toHaveAttribute('title', 'Energy Sphere');
  });

  it('defaults to sphere name as aria-label on wrapper span', () => {
    const { container } = render(
      <SphereIcon sphereName="entropy" />
    );
    const span = container.querySelector('span[aria-label]');
    expect(span).toHaveAttribute('aria-label', 'entropy');
  });

  it('renders SVG for all known sphere names', () => {
    SPHERE_NAMES.forEach((sphere) => {
      const { container } = render(<SphereIcon sphereName={sphere} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
    });
  });

  it('renders force sphere with SVG (not Unicode glyph)', () => {
    const { container } = render(<SphereIcon sphereName="force" />);
    // Should have SVG, not raw Unicode text
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    // Should NOT contain the old Unicode symbol as direct text content
    expect(container.querySelector('span:not([aria-label])')?.textContent).not.toBe('✦');
  });

  it('renders matter sphere with SVG', () => {
    const { container } = render(<SphereIcon sphereName="matter" />);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('renders energy sphere with SVG', () => {
    const { container } = render(<SphereIcon sphereName="energy" />);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('renders life sphere with SVG', () => {
    const { container } = render(<SphereIcon sphereName="life" />);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('renders mind sphere with SVG', () => {
    const { container } = render(<SphereIcon sphereName="mind" />);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('renders spirit sphere with SVG', () => {
    const { container } = render(<SphereIcon sphereName="spirit" />);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('renders time sphere with SVG', () => {
    const { container } = render(<SphereIcon sphereName="time" />);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('renders entropy sphere with SVG', () => {
    const { container } = render(<SphereIcon sphereName="entropy" />);
    expect(container.querySelector('svg')).toBeTruthy();
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

    it('renders SVG (not img) when useImage is false', () => {
      const { container } = render(
        <SphereIcon sphereName="force" useImage={false} />
      );
      const img = container.querySelector('img');
      expect(img).toBeNull();
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
    });

    it('defaults to SVG rendering (backward compatible — no img tag)', () => {
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

    it('falls back to gray-circle span for unknown sphere even with useImage', () => {
      const { container } = render(
        <SphereIcon sphereName="unknown-sphere" useImage={true} />
      );
      // Unknown sphere has no imagePath, should fall back to gray circle
      const img = container.querySelector('img');
      expect(img).toBeNull();
      const span = container.querySelector('span');
      expect(span).toBeTruthy();
    });
  });

  it('merges custom styles on wrapper span', () => {
    const { container } = render(
      <SphereIcon
        sphereName="mind"
        style={{ opacity: 0.5 }}
      />
    );
    const span = container.querySelector('span[aria-label]');
    const style = span?.getAttribute('style');
    expect(style).toContain('opacity');
  });

  it('handles numeric size values — SVG uses pixel size', () => {
    const { container } = render(<SphereIcon sphereName="force" size={24} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('24');
    expect(svg?.getAttribute('height')).toBe('24');
  });

  it('renders gray circle fallback for unknown sphere name', () => {
    const { container } = render(<SphereIcon sphereName="not-a-sphere" />);
    const img = container.querySelector('img');
    expect(img).toBeNull();
    const svg = container.querySelector('svg');
    expect(svg).toBeNull();
    // Should have a span with background-color style for the gray circle
    const span = container.querySelector('span');
    expect(span).toBeTruthy();
  });
});
