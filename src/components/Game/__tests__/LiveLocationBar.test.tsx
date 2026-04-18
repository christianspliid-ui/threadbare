// @vitest-environment jsdom
/**
 * LiveLocationBar.test.tsx — Unit tests for Living World summary bar (THR-127).
 *
 * Tests cover:
 *   - Renders nothing when all locations are quiet
 *   - Renders nothing when summaries map is empty
 *   - Shows up to 3 non-quiet locations sorted by pulse severity
 *   - Dismiss button removes the bar
 *   - Clicking a location entry calls onCenterOnHex with correct coords
 *   - Rotation selects correct page based on tick
 *   - LIVE_LOCATION_BAR_CONSTANTS are defined and sensible
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LiveLocationBar, LIVE_LOCATION_BAR_CONSTANTS } from '../LiveLocationBar';
import type { LocationActivitySummary } from '../../../types/locationActivity';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSummary(
  id: string,
  name: string,
  pulse: LocationActivitySummary['pulse'],
  col = 0,
  row = 0,
): LocationActivitySummary {
  return {
    locationId: id,
    locationName: name,
    pulse,
    murmurs: [`Murmur for ${name}`],
    agentThreads: [],
    encounterPressure: 0,
    dominantActivity: null,
    hexCol: col,
    hexRow: row,
  };
}

function makeMap(entries: LocationActivitySummary[]): Map<string, LocationActivitySummary> {
  return new Map(entries.map(e => [e.locationId, e]));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('LiveLocationBar (THR-127)', () => {
  it('renders nothing when summaries map is empty', () => {
    const { container } = render(
      <LiveLocationBar summaries={new Map()} tick={0} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when all locations are quiet', () => {
    const map = makeMap([
      makeSummary('a', 'Hamlet', 'quiet'),
      makeSummary('b', 'Village', 'quiet'),
    ]);
    const { container } = render(<LiveLocationBar summaries={map} tick={0} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows non-quiet locations', () => {
    const map = makeMap([
      makeSummary('a', 'Quiet Town', 'quiet'),
      makeSummary('b', 'Tense Keep', 'tense'),
      makeSummary('c', 'Volatile Crater', 'volatile'),
    ]);
    render(<LiveLocationBar summaries={map} tick={0} />);
    expect(screen.getByText('Volatile Crater')).toBeTruthy();
    expect(screen.getByText('Tense Keep')).toBeTruthy();
    expect(screen.queryByText('Quiet Town')).toBeNull();
  });

  it('sorts by pulse severity descending (volatile > tense > busy > stirring)', () => {
    const map = makeMap([
      makeSummary('a', 'Stirring A', 'stirring'),
      makeSummary('b', 'Busy B', 'busy'),
      makeSummary('c', 'Volatile C', 'volatile'),
      makeSummary('d', 'Tense D', 'tense'),
    ]);
    const { container } = render(<LiveLocationBar summaries={map} tick={0} />);
    // Location buttons have aria-label containing a colon (name: pulse. murmur)
    // Exclude the dismiss button by filtering for buttons whose label contains ':'
    const buttons = [...container.querySelectorAll('button[aria-label]')]
      .filter(b => b.getAttribute('aria-label')?.includes(':'));
    expect(buttons[0]?.getAttribute('aria-label')).toContain('Volatile C');
    expect(buttons[1]?.getAttribute('aria-label')).toContain('Tense D');
    expect(buttons[2]?.getAttribute('aria-label')).toContain('Busy B');
  });

  it('shows at most PAGE_SIZE (3) locations per page', () => {
    const map = makeMap([
      makeSummary('a', 'A', 'volatile'),
      makeSummary('b', 'B', 'tense'),
      makeSummary('c', 'C', 'busy'),
      makeSummary('d', 'D', 'stirring'),
      makeSummary('e', 'E', 'tense'),
    ]);
    const { container } = render(<LiveLocationBar summaries={map} tick={0} />);
    // Location buttons have aria-label containing ':' (dismiss button does not)
    const locationButtons = [...container.querySelectorAll('button[aria-label]')]
      .filter(b => b.getAttribute('aria-label')?.includes(':'));
    expect(locationButtons.length).toBe(LIVE_LOCATION_BAR_CONSTANTS.PAGE_SIZE);
  });

  it('dismiss button removes the bar', () => {
    const map = makeMap([makeSummary('a', 'Active Place', 'tense')]);
    const { container } = render(<LiveLocationBar summaries={map} tick={0} />);
    expect(container.firstChild).toBeTruthy();

    const dismissBtn = screen.getByRole('button', { name: /dismiss/i });
    fireEvent.click(dismissBtn);

    expect(container.firstChild).toBeNull();
  });

  it('calls onCenterOnHex with correct coords when location is clicked', () => {
    const onCenter = vi.fn();
    const map = makeMap([makeSummary('a', 'Target Location', 'tense', 7, 3)]);
    render(<LiveLocationBar summaries={map} tick={0} onCenterOnHex={onCenter} />);

    fireEvent.click(screen.getByText('Target Location'));
    expect(onCenter).toHaveBeenCalledWith(7, 3);
  });

  it('murmur line is shown for each location', () => {
    const map = makeMap([makeSummary('a', 'Active Place', 'tense')]);
    render(<LiveLocationBar summaries={map} tick={0} />);
    expect(screen.getByText('Murmur for Active Place')).toBeTruthy();
  });

  it('rotation moves to next page after ROTATE_EVERY_TICKS ticks', () => {
    const { ROTATE_EVERY_TICKS, PAGE_SIZE } = LIVE_LOCATION_BAR_CONSTANTS;
    // Create PAGE_SIZE + 1 locations so there are 2 pages
    const entries = [
      makeSummary('a', 'Alpha', 'volatile'),
      makeSummary('b', 'Beta', 'tense'),
      makeSummary('c', 'Gamma', 'busy'),
      makeSummary('d', 'Delta', 'stirring'),
    ];
    const map = makeMap(entries);

    // Page 0: first PAGE_SIZE locations
    const { rerender } = render(<LiveLocationBar summaries={map} tick={0} />);
    expect(screen.queryByText('Alpha')).toBeTruthy();
    expect(screen.queryByText('Delta')).toBeNull();

    // Page 1 at tick = ROTATE_EVERY_TICKS: last location
    rerender(<LiveLocationBar summaries={map} tick={ROTATE_EVERY_TICKS} />);
    expect(screen.queryByText('Alpha')).toBeNull();
    expect(screen.queryByText('Delta')).toBeTruthy();
  });

  it('LIVE_LOCATION_BAR_CONSTANTS are sensible', () => {
    const { ROTATE_EVERY_TICKS, POOL_SIZE, PAGE_SIZE } = LIVE_LOCATION_BAR_CONSTANTS;
    expect(ROTATE_EVERY_TICKS).toBeGreaterThan(0);
    expect(POOL_SIZE).toBeGreaterThanOrEqual(PAGE_SIZE);
    expect(PAGE_SIZE).toBeGreaterThan(0);
  });
});
