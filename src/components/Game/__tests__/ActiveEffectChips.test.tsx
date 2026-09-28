// @vitest-environment jsdom
/**
 * THR-1606 — what your hand is doing to a mortal renders as chips, one per real
 * influence (Law 56), with the sheet noun and no numeral on the face (Law 13).
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ActiveEffectChips, UNDER_YOUR_HAND_HEADING } from '../ActiveEffectChips';

afterEach(cleanup);

describe('ActiveEffectChips (THR-1606)', () => {
  it('renders nothing when the mortal carries no effect', () => {
    const { container } = render(<ActiveEffectChips effects={[]} heading={UNDER_YOUR_HAND_HEADING} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders one chip per effect under the heading, with the sheet noun and no numeral', () => {
    render(
      <ActiveEffectChips
        heading={UNDER_YOUR_HAND_HEADING}
        effects={[
          { type: 'dream', label: 'Dreaming', sphere: 'mind', strength: 0.6, ticksRemaining: 12, hover: 'Your hand is on them.' },
          { type: 'persuade', label: 'Compelled', sphere: 'spirit', strength: 0.4, ticksRemaining: 20 },
        ]}
      />,
    );
    expect(screen.getByText('Under your hand')).toBeTruthy();
    const chips = screen.getAllByTestId('active-effect-chip');
    expect(chips.map((c) => c.textContent)).toEqual(['◈Dreaming', '◈Compelled']);
    for (const chip of chips) expect(chip.textContent).not.toMatch(/\d/);
  });
});
