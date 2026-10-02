// @vitest-environment jsdom
/**
 * sphereTint — the Premonition's recipe, shared (THR-1586).
 *
 * 1. Equivalence: the helper emits exactly the strings `PremonitionModal` emitted
 *    before extraction (`color-mix(in srgb, <c> 25|3|87%, transparent)`), so the
 *    surface Christian reacted to does not move by a pixel.
 * 2. Card face: tinted when `sphereTint` is set, untinted otherwise, and state wins
 *    over tint — a selected card's border is the selected border.
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { sphereTint, sphereBrightToken } from '../sphereTint';
import { CardFace, cardSphereTintActive, type CardFaceModel } from '../CardFace';

/** What PremonitionModal's local `tint(color, pct)` produced before THR-1586. */
const premonitionTint = (color: string, pct: number) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;

describe('sphereTint reproduces the Premonition recipe', () => {
  for (const color of ['#ff6b6b', 'var(--text-muted)', '#c084fc']) {
    it(`emits identical strings for ${color}`, () => {
      expect(sphereTint(color, 'border')).toBe(premonitionTint(color, 25));
      expect(sphereTint(color, 'bg')).toBe(premonitionTint(color, 3));
      expect(sphereTint(color, 'text')).toBe(premonitionTint(color, 87));
    });
  }

  it('cards read the sphere bright token', () => {
    expect(sphereBrightToken('force')).toBe('var(--sphere-force-bright)');
  });
});

const BASE: CardFaceModel = {
  id: 'tint.test',
  testIdPrefix: 'tint-card',
  picture: { tier: 'fallback', glyph: '◈', gradientIndex: 1, alt: 'Test', kind: 'encounter' },
  sphere: 'force',
  cost: 2,
  name: 'Test',
  effectLine: 'Does a thing.',
  odds: null,
  selected: false,
  dimmed: false,
  disabled: false,
};

const button = () => document.querySelector('[data-testid="tint-card-tint.test"]') as HTMLElement;

describe('CardFace sphere tint (THR-1586)', () => {
  it('a tinted card wears the sphere edge and data-sphere-tint', () => {
    render(<CardFace model={{ ...BASE, sphereTint: 'force' }} designerView={false} onToggle={() => {}} />);
    const style = button().getAttribute('style') ?? '';
    expect(button().getAttribute('data-sphere-tint')).toBe('force');
    expect(style).toContain('var(--sphere-force-bright) 25%');
    expect(style).toContain('var(--sphere-force-bright) 3%');
  });

  it('an untinted card keeps the resting gold edge and no data-sphere-tint', () => {
    render(<CardFace model={BASE} designerView={false} onToggle={() => {}} />);
    const style = button().getAttribute('style') ?? '';
    expect(button().hasAttribute('data-sphere-tint')).toBe(false);
    expect(style).not.toContain('--sphere-force-bright');
  });

  it('state wins: a selected tinted card has the selected border, not the tint', () => {
    render(<CardFace model={{ ...BASE, sphereTint: 'force', selected: true }} designerView={false} onToggle={() => {}} />);
    const el = button();
    expect(el.getAttribute('style') ?? '').not.toContain('--sphere-force-bright');
    // The selected border is the gold one the face has always used.
    const untintedSelected = render(
      <CardFace model={{ ...BASE, id: 'tint.ref', selected: true }} designerView={false} onToggle={() => {}} />,
    ).container.querySelector('button') as HTMLElement;
    expect(el.style.border).toBe(untintedSelected.style.border);
  });

  it('disabled and resolved cards are never tinted', () => {
    expect(cardSphereTintActive({ ...BASE, sphereTint: 'force', disabled: true })).toBe(false);
    expect(cardSphereTintActive({ ...BASE, sphereTint: 'force', resolvedBand: { word: 'Success', color: 'x' } })).toBe(false);
    expect(cardSphereTintActive({ ...BASE, sphereTint: 'force' })).toBe(true);
    expect(cardSphereTintActive(BASE)).toBe(false);
  });
});
