// @vitest-environment jsdom
/**
 * Means and Knows-the-way-to render assertions (THR-1428).
 *
 * The two rows the owed readers earn their surface on: what a mortal's holdings
 * pay them, and what their surveys taught them. Both are asserted on the **live**
 * sheet — `OverviewTab`, which `AgentProfileModal` renders. (`AgentDetailPanel` was
 * the surface the plan named, but its own header records that it is unmounted and
 * only its test imports it; putting these rows only there would have shipped UI
 * nobody can open, which is the same pathology this ticket exists to end.)
 *
 * Every face is asserted with its absence arm, because a row that rendered
 * unconditionally would pass a presence-only test on a card carrying nothing:
 *   1. the wealth **tier word**, never a numeral (UI Law IV);
 *   2. the tooltip naming what last moved it in words, never a machine key (Law 14);
 *   3. the places a mortal knows, each by name, with the stage of a live lead;
 *   4. neither section rendering at all when the card carries neither.
 *
 * These stand in for the contractual 1920×1080 capture, which no unattended run can
 * produce (`preview_start` is refused with nobody present to approve it — impediments
 * #546, #574). They prove the words reached the DOM; they do not cover what only
 * pixels can — paint, overflow, z-index, off-viewport.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { OverviewTab } from '../OverviewTab';
import type { AgentInfoCardData } from '../../../../engine/agentDetail';
import { getWealthTier, WEALTH_TIER_MAGNATE, WEALTH_TIER_GETTING_BY } from '../../../../engine/wealth';

function card(extra: Partial<AgentInfoCardData>): AgentInfoCardData {
  return { name: 'Old Maerin', knowledgeLevel: 'intimate', ...extra } as unknown as AgentInfoCardData;
}

describe('OverviewTab — Means (THR-1428)', () => {
  it('renders the wealth tier word, and never the number behind it', () => {
    const wealth = WEALTH_TIER_MAGNATE + 5;
    render(<OverviewTab card={card({ wealth })} />);

    const means = screen.getByTestId('overview-means');
    // Sourced from the tier table, not typed literally — the banding is the link
    // under test, so re-banding a constant moves this assertion with it.
    expect(means.textContent).toContain(getWealthTier(wealth));
    expect(means.textContent).not.toMatch(/\d/);
  });

  it('bands a poor mortal differently from a rich one on the same surface', () => {
    // The pair is the point: a row that printed one constant word would pass either
    // arm alone.
    const rich = render(<OverviewTab card={card({ wealth: WEALTH_TIER_MAGNATE + 5 })} />);
    const richWord = rich.getByTestId('overview-means').textContent;
    rich.unmount();

    const poor = render(<OverviewTab card={card({ wealth: WEALTH_TIER_GETTING_BY - 5 })} />);
    const poorWord = poor.getByTestId('overview-means').textContent;

    expect(richWord).not.toBe(poorWord);
  });

  it('names what last moved the wealth in words, never a machine key', () => {
    // The tooltip mounts its description on focus after a delay, so the assertion has
    // to open it — reading `textContent` of the resting row would pass on a row with
    // no tooltip at all, which is the failure this test is here to catch. Same
    // focus + advance-timers shape as `shared/__tests__/Tooltip.test.tsx`.
    vi.useFakeTimers();
    try {
      render(<OverviewTab card={card({ wealth: 50, wealthSource: 'tolls on a road they hold' })} />);

      fireEvent.focus(screen.getByRole('term'));
      act(() => { vi.advanceTimersByTime(200); });

      const tip = screen.getByRole('tooltip');
      expect(tip.textContent).toContain('tolls on a road they hold');
      expect(tip.textContent).not.toMatch(/route_control|sublocation_income|location_tithe/);
    } finally {
      vi.useRealTimers();
    }
  });

  it('renders no Means section for a mortal whose wealth is unknown', () => {
    render(<OverviewTab card={card({})} />);
    expect(screen.queryByTestId('overview-means')).toBeNull();
  });
});

describe('OverviewTab — Knows the way to (THR-1428)', () => {
  it('names each place a survey made familiar', () => {
    render(<OverviewTab card={card({
      knownPlaces: [
        { id: 'loc_a', name: 'The Sunken Treasury' },
        { id: 'loc_b', name: 'Wickford' },
      ],
    })} />);

    const known = screen.getByTestId('overview-known-places');
    expect(known.textContent).toContain('The Sunken Treasury');
    expect(known.textContent).toContain('Wickford');
  });

  it('says how far along a live lead is, and says nothing where there is none', () => {
    render(<OverviewTab card={card({
      knownPlaces: [
        { id: 'loc_a', name: 'The Sunken Treasury', lead: 'knows where it lies' },
        { id: 'loc_b', name: 'Wickford' },
      ],
    })} />);

    const rows = screen.getByTestId('overview-known-places').querySelectorAll('li');
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain('knows where it lies');
    // The plain-familiarity row carries no lead phrase — a row that appended one
    // unconditionally would read as a lead the mortal does not have.
    expect(rows[1].textContent).toBe('Wickford');
  });

  it('renders no section for a mortal who knows the way nowhere', () => {
    render(<OverviewTab card={card({ knownPlaces: [] })} />);
    expect(screen.queryByTestId('overview-known-places')).toBeNull();
  });
});
