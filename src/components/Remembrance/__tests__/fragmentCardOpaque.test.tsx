// @vitest-environment jsdom
/**
 * THR-2092 — the origin and drive pictures stay opaque in every state. They dim
 * by brightness, never opacity, so the stirring backdrop behind the row cannot
 * bleed through the art; hover still brightens the picture above rest.
 */
import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { FragmentCard, FRAGMENT_IMAGE_BRIGHTNESS } from '../FragmentCard';

function imageDiv(container: HTMLElement): HTMLElement {
  const el = container.querySelector('button > div') as HTMLElement | null;
  if (!el) throw new Error('picture div not found');
  return el;
}

function renderCard(selected: boolean) {
  return render(
    <FragmentCard prose="A bench" imageAssetPath="" selected={selected} onClick={() => {}} testId="card" />,
  );
}

describe('THR-2092 — FragmentCard picture is opaque in every state', () => {
  it('at rest: no translucency, dimmed by brightness', () => {
    const { container } = renderCard(false);
    const img = imageDiv(container);
    expect(img.style.opacity === '' || img.style.opacity === '1').toBe(true);
    expect(img.style.filter).toBe(`brightness(${FRAGMENT_IMAGE_BRIGHTNESS.rest})`);
    expect(img.style.transition).not.toContain('opacity');
  });

  it('hovered: still opaque, brighter than rest', () => {
    const { container, getByTestId } = renderCard(false);
    fireEvent.mouseEnter(getByTestId('card'));
    const img = imageDiv(container);
    expect(img.style.opacity === '' || img.style.opacity === '1').toBe(true);
    expect(img.style.filter).toBe(`brightness(${FRAGMENT_IMAGE_BRIGHTNESS.hovered})`);
    expect(FRAGMENT_IMAGE_BRIGHTNESS.hovered).toBeGreaterThan(FRAGMENT_IMAGE_BRIGHTNESS.rest);
  });

  it('selected: still opaque, brightest', () => {
    const { container } = renderCard(true);
    const img = imageDiv(container);
    expect(img.style.opacity === '' || img.style.opacity === '1').toBe(true);
    expect(img.style.filter).toBe(`brightness(${FRAGMENT_IMAGE_BRIGHTNESS.selected})`);
  });
});
