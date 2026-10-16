// @vitest-environment jsdom
/**
 * THR-1906 — the fallback tile's icon rules. The resolver's own category glyph becomes the carved
 * kind icon; a glyph the caller supplied is kept; a descriptor's `iconName` wins over both; a
 * person keeps their initial.
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { EntityVisual } from '../EntityVisual';
import { fallbackGlyphFor } from '../../../data/entity-visual-fallbacks';
import type { EntityVisualDescriptor } from '../entityVisualResolver';

const tile = (over: Partial<EntityVisualDescriptor>): EntityVisualDescriptor => ({
  tier: 'fallback',
  glyph: fallbackGlyphFor('faction', 'The Watch'),
  gradientIndex: 0,
  alt: 'The Watch',
  kind: 'faction',
  ...over,
});

describe('EntityVisual fallback tile (THR-1906)', () => {
  it("draws the carved kind icon in place of the resolver's category glyph", () => {
    const { container } = render(<EntityVisual size="chip" descriptor={tile({})} />);
    expect(container.querySelector('[data-icon="faction"]')).not.toBeNull();
    expect(container.textContent).toBe('');
  });

  it('keeps a glyph the caller supplied', () => {
    const { container } = render(<EntityVisual size="chip" descriptor={tile({ kind: 'encounter', glyph: '⚄' })} />);
    expect(container.querySelector('[data-icon]')).toBeNull();
    expect(container.textContent).toBe('⚄');
  });

  it("draws the descriptor's iconName over both", () => {
    const { container } = render(
      <EntityVisual size="chip" descriptor={tile({ kind: 'encounter', glyph: '⚄', iconName: 'gambit' })} />,
    );
    expect(container.querySelector('[data-icon="gambit"]')).not.toBeNull();
  });

  it('keeps a person initial', () => {
    const { container } = render(
      <EntityVisual size="chip" descriptor={tile({ kind: 'agent', glyph: 'K', alt: 'Kael' })} />,
    );
    expect(container.querySelector('[data-icon]')).toBeNull();
    expect(container.textContent).toBe('K');
  });
});
