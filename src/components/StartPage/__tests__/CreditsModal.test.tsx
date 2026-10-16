// @vitest-environment jsdom
/**
 * The Credits screen's Icons line (THR-1904, plan THR-1879 § 8): CC BY 3.0 attribution with the
 * authors read from ICON_CREDITS and links to game-icons.net and the licence.
 */
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CreditsModal, joinNames } from '../CreditsModal';
import { ICON_CREDITS } from '../../../data/icons/iconRegistry';

describe('CreditsModal icons line', () => {
  it('names every credited author, the source and the licence, with two links', () => {
    render(<CreditsModal open onClose={() => {}} />);
    const line = screen.getByTestId('credits-icons');
    expect(line.textContent).toContain(`Icons by ${joinNames(ICON_CREDITS)}, from game-icons.net`);
    expect(line.textContent).toContain('Creative Commons Attribution 3.0 licence (creativecommons.org/licenses/by/3.0). Recoloured for this game.');
    const hrefs = [...line.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['https://game-icons.net', 'https://creativecommons.org/licenses/by/3.0/']);
    expect(screen.getByText('Icons')).toBeTruthy();
  });

  it('joins names as a sentence', () => {
    expect(joinNames([])).toBe('');
    expect(joinNames(['Lorc'])).toBe('Lorc');
    expect(joinNames(['Lorc', 'Sbed'])).toBe('Lorc and Sbed');
    expect(joinNames(['A', 'B', 'C'])).toBe('A, B and C');
  });
});
