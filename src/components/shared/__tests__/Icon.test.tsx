// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Icon, ICON_SIZE_REM } from '../Icon';
import { iconShape, isIconName, resetIconWarningsForTest } from '../iconShape';
import { ICON_REGISTRY, type IconName } from '../../../data/icons/iconRegistry';

afterEach(() => {
  resetIconWarningsForTest();
  vi.restoreAllMocks();
});

describe('Icon', () => {
  it('a decorative icon is hidden from assistive tech', () => {
    const { container } = render(<Icon name="fallback" decorative />);
    const svg = container.querySelector('svg')!;
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).not.toHaveAttribute('role');
    expect(svg).toHaveAttribute('data-icon', 'fallback');
  });

  it('a labelled icon is an image with that name', () => {
    render(<Icon name="fallback" label="Not drawn yet" />);
    expect(screen.getByRole('img', { name: 'Not drawn yet' })).toBeInTheDocument();
  });

  it('draws every registry path, filled with currentColor', () => {
    const { container } = render(<Icon name="fallback" decorative />);
    const svg = container.querySelector('svg')!;
    expect(svg).toHaveAttribute('fill', 'currentColor');
    expect(svg).toHaveAttribute('viewBox', ICON_REGISTRY.fallback.shape.viewBox);
    expect(container.querySelectorAll('path')).toHaveLength(ICON_REGISTRY.fallback.shape.paths.length);
  });

  it.each(Object.entries(ICON_SIZE_REM))('size %s renders %srem square', (size, rem) => {
    const { container } = render(<Icon name="fallback" size={size as keyof typeof ICON_SIZE_REM} decorative />);
    const svg = container.querySelector('svg')!;
    expect(svg).toHaveAttribute('width', `${rem}rem`);
    expect(svg).toHaveAttribute('height', `${rem}rem`);
  });

  it('an unknown name at runtime draws the fallback mark and warns once (Law 4)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const unknown = 'no-such-icon' as IconName;
    const { container } = render(
      <>
        <Icon name={unknown} decorative />
        <Icon name={unknown} decorative />
      </>,
    );
    expect(container.querySelectorAll('svg')).toHaveLength(2);
    expect(iconShape('no-such-icon')).toBe(ICON_REGISTRY.fallback.shape);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(isIconName('no-such-icon')).toBe(false);
    expect(isIconName('fallback')).toBe(true);
  });

  it('a meaning-bearing icon without a label does not type-check', () => {
    // The assertions are the compile-time ones: each line must be a type error.
    // @ts-expect-error — neither `decorative` nor `label`
    const unlabelled = <Icon name="fallback" />;
    // @ts-expect-error — `decorative` and `label` together
    const both = <Icon name="fallback" decorative label="x" />;
    // @ts-expect-error — an unknown literal name
    const unknownName = <Icon name="not-a-registry-name" decorative />;
    expect([unlabelled, both, unknownName]).toHaveLength(3);
  });
});
