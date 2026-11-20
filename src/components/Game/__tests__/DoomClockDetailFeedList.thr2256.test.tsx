// @vitest-environment jsdom
/**
 * THR-2256 — the Doom panel's Where it feeds section: place rows with their word, a Rebuke
 * button only while a Rebuke there answers the Doom (UI Law 25), the empty line, and a row
 * click that opens the place.
 */
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DoomClockDetail } from '../DoomClockDetail';
import type { DoomClockDefinition, DoomClockState } from '../../../types/doomClock';
import type { DoomFeedingsView } from '../../../engine/views/doomFeedings';
import { DOOM_FEED_WORDS } from '../../../engine/views/doomFeedings';
import { DOOM_DIALOG_CLIMAX_FEED_ROWS } from '../../../data/game-config';

const definition: DoomClockDefinition = {
  archetype: 'breach',
  totalTicks: 100,
  stages: [
    { stage: 1, name: 'Whispers', tickThreshold: 0.0, events: [] },
    { stage: 2, name: 'Signs', tickThreshold: 0.2, events: [] },
    { stage: 3, name: 'Tremors', tickThreshold: 0.4, events: [] },
    { stage: 4, name: 'Crisis', tickThreshold: 0.6, events: [] },
    { stage: 5, name: 'Culmination', tickThreshold: 0.8, events: [] },
  ],
};

const state: DoomClockState = {
  definitionArchetype: 'breach',
  currentTick: 85,
  totalTicks: 100,
  currentStage: 5,
  progress: 0.85,
  stageTransitions: [0, 20, 40, 60, 80],
  expired: false,
  tickModifier: 1.0,
  nextEscalationSeverityModifier: 0,
  counterOmens: 0,
  resolvedEvents: [],
};

const view: DoomFeedingsView = {
  rows: [
    { placeId: 't1', placeName: 'Riverford', status: 'often', word: DOOM_FEED_WORDS.often, at: 90, rebukable: true },
    { placeId: 't2', placeName: 'Ashmoor', status: 'held', word: DOOM_FEED_WORDS.held, at: 80, rebukable: false },
    { placeId: 't3', placeName: 'Dunhallow', status: 'no_longer_held', word: DOOM_FEED_WORDS.noLongerHeld, at: 70, rebukable: false },
  ],
  total: 3,
  fed: [{ placeId: 't1', placeName: 'Riverford' }],
  holdsRebuke: true,
};

describe('DoomClockDetail — Where it feeds (THR-2256)', () => {
  it('lists each place with its word, under the current stage', () => {
    render(<DoomClockDetail open onClose={() => {}} definition={definition} state={{ ...state, currentStage: 4, progress: 0.7 }} feedings={view} onOpenPlace={() => {}} />);
    const rows = screen.getAllByTestId('doom-feed-row');
    expect(rows.map(r => r.textContent)).toEqual([
      'Riverford · fed here oftenRebuke',
      'Ashmoor · held',
      'Dunhallow · no longer held',
    ]);
    expect(screen.getByText(DOOM_FEED_WORDS.sectionLabel)).toBeTruthy();
  });

  it('THR-2269 — at the climax (stage 5) the dialog keeps the newest DOOM_DIALOG_CLIMAX_FEED_ROWS rows', () => {
    render(<DoomClockDetail open onClose={() => {}} definition={definition} state={state} feedings={view} onOpenPlace={() => {}} />);
    const rows = screen.getAllByTestId('doom-feed-row');
    expect(rows).toHaveLength(DOOM_DIALOG_CLIMAX_FEED_ROWS);
    expect(rows.map(r => r.textContent)).toEqual([
      'Riverford · fed here oftenRebuke',
      'Ashmoor · held',
    ]);
  });

  it('offers Rebuke only on the row a Rebuke answers, and both the name and the button open the place', () => {
    const onOpenPlace = vi.fn();
    render(<DoomClockDetail open onClose={() => {}} definition={definition} state={state} feedings={view} onOpenPlace={onOpenPlace} />);
    expect(screen.getAllByTestId('doom-feed-rebuke')).toHaveLength(1);
    fireEvent.click(screen.getByTestId('doom-feed-rebuke'));
    expect(onOpenPlace).toHaveBeenLastCalledWith('t1');
    fireEvent.click(screen.getByText('Ashmoor'));
    expect(onOpenPlace).toHaveBeenLastCalledWith('t2');
  });

  it('reads the empty line when the Doom has fed nowhere lately', () => {
    render(<DoomClockDetail open onClose={() => {}} definition={definition} state={state} feedings={{ rows: [], total: 0, fed: [], holdsRebuke: true }} />);
    expect(screen.getByTestId('doom-feed-empty').textContent).toBe(DOOM_FEED_WORDS.empty);
  });

  it('draws no section without a view (an old caller) or once the Doom has landed', () => {
    const { baseElement, rerender } = render(<DoomClockDetail open onClose={() => {}} definition={definition} state={state} />);
    expect(baseElement.querySelector('[data-testid="doom-feed-list"]')).toBeNull();
    rerender(<DoomClockDetail open onClose={() => {}} definition={definition} state={{ ...state, expired: true }} feedings={view} />);
    expect(baseElement.querySelector('[data-testid="doom-feed-list"]')).toBeNull();
  });
});
