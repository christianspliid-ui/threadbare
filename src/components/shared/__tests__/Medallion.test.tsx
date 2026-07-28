// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Medallion,
  MEDALLION_SIZE_SM,
  MEDALLION_SIZE_MD,
  MEDALLION_SIZE_LG,
  MEDALLION_FALLBACK_GLYPH,
} from '../Medallion';

describe('Medallion (THR-799)', () => {
  it('defaults to md when no size is given', () => {
    render(<Medallion />);
    expect(screen.getByTestId('medallion').getAttribute('data-size')).toBe('md');
  });

  it.each([
    ['sm', MEDALLION_SIZE_SM],
    ['md', MEDALLION_SIZE_MD],
    ['lg', MEDALLION_SIZE_LG],
  ] as const)('renders %s at its named constant diameter', (size, px) => {
    render(<Medallion size={size} />);
    const el = screen.getByTestId('medallion');
    expect(el.style.width).toBe(`${px}px`);
    expect(el.style.height).toBe(`${px}px`);
  });

  it('falls back to a glyph rather than an empty disc when given no child', () => {
    render(<Medallion />);
    expect(screen.getByTestId('medallion').textContent).toBe(MEDALLION_FALLBACK_GLYPH);
  });

  it('renders the supplied child instead of the fallback', () => {
    render(<Medallion><span>◆</span></Medallion>);
    const el = screen.getByTestId('medallion');
    expect(el.textContent).toBe('◆');
    expect(el.textContent).not.toBe(MEDALLION_FALLBACK_GLYPH);
  });

  it('gives lg the bright gold ring and smaller sizes the dim one (gold budget)', () => {
    const { unmount } = render(<Medallion size="lg" />);
    expect(screen.getByTestId('medallion').style.border).toContain('var(--accent-gold)');
    unmount();

    render(<Medallion size="sm" />);
    expect(screen.getByTestId('medallion').style.border).toContain('var(--accent-gold-dim)');
  });

  it('honours an explicit accentColor over the size default', () => {
    render(<Medallion size="lg" accentColor="#c87533" />);
    // jsdom normalises hex to rgb() when reading back a parsed border shorthand.
    const border = screen.getByTestId('medallion').style.border;
    expect(border).toContain('rgb(200, 117, 51)');
    expect(border).not.toContain('var(--accent-gold)');
  });

  it('exposes its title for assistive tech', () => {
    render(<Medallion title="Old Steel" />);
    expect(screen.getByLabelText('Old Steel')).toBeTruthy();
  });
});
