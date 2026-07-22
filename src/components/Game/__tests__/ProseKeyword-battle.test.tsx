// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { renderProseWithIPK } from '../../ProseKeyword';
import { BATTLE_KEYWORD_TOOLTIPS } from '../../../data/battle-keywords';

// THR-628: battle IPK vocabulary renders through the shared prose renderer —
// the same path the shipped economy keywords (THR-615) use, and the path the
// siege_breach feed message + LocationView Walls line flow through.

describe('renderProseWithIPK — battle keywords (THR-628)', () => {
  it('renders every battle keyword as a tooltip term, not plain bold', () => {
    for (const keyword of Object.keys(BATTLE_KEYWORD_TOOLTIPS)) {
      const cap = keyword[0].toUpperCase() + keyword.slice(1);
      const { unmount } = render(<div>{renderProseWithIPK(`walls stand **${cap}** today`)}</div>);
      const el = screen.getByText(cap);
      expect(el.getAttribute('role')).toBe('term');
      unmount();
    }
  });

  it('renders the breach headline flip with both keywords and no literal asterisks', () => {
    const msg = 'What stood **Fortified** this morning is **Breached** by dusk.';
    const { container } = render(<div>{renderProseWithIPK(msg)}</div>);
    expect(screen.getByText('Fortified').getAttribute('role')).toBe('term');
    expect(screen.getByText('Breached').getAttribute('role')).toBe('term');
    expect(container.textContent).not.toContain('**');
  });

  it('leaves unknown bold text as plain <strong> (no false keyword matches)', () => {
    const { container } = render(<div>{renderProseWithIPK('a **Mysterious** word')}</div>);
    const strong = container.querySelector('strong');
    expect(strong?.textContent).toBe('Mysterious');
  });
});
