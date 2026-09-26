// @vitest-environment jsdom
/**
 * THR-1604 — Enter in the name field submits the name. The cold playtest's
 * testers typed a name, pressed Enter, and nothing happened.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OriginBeat } from '../OriginBeat';
import type { RemembranceFragment } from '../../../types/remembrance';

const fragment = {
  id: 'origin.test',
  beat: 'origin',
  prose: 'You kept the lighthouse.',
  imageAssetPath: '',
  stirringClusters: [],
  tags: [],
  domainLeanings: [],
  sphereDirection: [],
  hungerWeights: {},
} as RemembranceFragment;

describe('OriginBeat name field (THR-1604)', () => {
  it('submits on Enter once an origin is chosen', () => {
    const onSelect = vi.fn();
    const { container } = render(<OriginBeat fragments={[fragment]} onSelect={onSelect} />);
    // The first click focuses the fragment (its art fills the screen); a click on
    // that art chooses it.
    fireEvent.click(screen.getByTestId('origin-origin.test'));
    const art = container.querySelector('div.absolute.inset-0.cursor-pointer');
    expect(art).not.toBeNull();
    fireEvent.click(art!);
    const input = screen.getByTestId('mortal-name-input');
    fireEvent.change(input, { target: { value: 'Maren' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith(fragment, 'Maren');
  });

  it('does nothing on Enter before an origin is chosen', () => {
    const onSelect = vi.fn();
    render(<OriginBeat fragments={[fragment]} onSelect={onSelect} />);
    fireEvent.keyDown(screen.getByTestId('mortal-name-input'), { key: 'Enter' });
    expect(onSelect).not.toHaveBeenCalled();
  });
});
