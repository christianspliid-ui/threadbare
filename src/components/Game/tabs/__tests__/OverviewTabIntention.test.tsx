// @vitest-environment jsdom
/**
 * The intention line on the sheet (THR-1404, THR-1433): what a mortal is set on,
 * shown only when the one mind-reading rule opened the door, with the door in the
 * tooltip. Every arm carries its absence: a card whose door is closed renders no
 * line and no placeholder (Law 25), which is the load-bearing case — a line that
 * renders unconditionally would pass every presence assertion.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OverviewTab } from '../OverviewTab';
import type { AgentInfoCardData } from '../../../../engine/agentDetail';

function card(extra: Partial<AgentInfoCardData>): AgentInfoCardData {
  return { id: 'ind_maerin', name: 'Old Maerin', knowledgeLevel: 'stranger', ...extra } as unknown as AgentInfoCardData;
}

describe('OverviewTab — the intention line', () => {
  it('renders the ambition and the work it heads toward when read through a mark, with the door in the tooltip', () => {
    render(<OverviewTab card={card({
      intentionRead: { readable: true, through: 'mark', via: 'ind_vessa', viaName: 'Vessa', secret: false },
      intention: { ambition: 'Seek Revenge', heading: 'Raise a warhost', through: 'mark', how: "Vessa, whom you follow, holds a secret of Old Maerin's." },
    })} />);
    const line = screen.getByTestId('identity-intention');
    expect(line.textContent).toContain('Set on Seek Revenge');
    expect(line.textContent).toContain('Raise a warhost');
    expect(line.textContent).not.toMatch(/\d/);
  });

  it('renders the ambition alone when there is no work under way', () => {
    render(<OverviewTab card={card({
      intentionRead: { readable: true, through: 'familiarity', secret: false },
      intention: { ambition: 'Dominate Trade', through: 'familiarity', how: 'You have watched Old Maerin long enough to know what they want.' },
    })} />);
    expect(screen.getByTestId('identity-intention').textContent).toBe('Set on Dominate Trade');
  });

  it('renders nothing at all when the door is closed — no placeholder, no "unknown"', () => {
    render(<OverviewTab card={card({ intentionRead: { readable: false, secret: true }, primaryIntentSummary: { displayName: 'Seek Revenge', category: 'vengeance' } as never })} />);
    expect(screen.queryByTestId('identity-intention')).toBeNull();
    expect(screen.queryByText(/unknown/i)).toBeNull();
  });

  it('renders nothing when the door is open but the mortal pursues nothing', () => {
    render(<OverviewTab card={card({ knowledgeLevel: 'intimate', intentionRead: { readable: true, through: 'familiarity', secret: false } })} />);
    expect(screen.queryByTestId('identity-intention')).toBeNull();
  });
});
