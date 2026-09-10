// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecentEventsView } from '../RecentEventsView';
import { WorldGraph } from '../../../../engine/graph';
import { applyEncounterAftermathReaction } from '../../../../engine/encounterAftermath';
import { createSimulationRuntime } from '../../../../engine/simulationRuntime';
import { MAX_RECENT_EVENTS, type GameState, type TickEvent } from '../../../../types/gameState';
import type { ClearanceGateRuntimeState } from '../../../../types/contentShells';
import type { EncounterAftermathReaction, UnifiedAction } from '../../../../types/unifiedAction';

const events: TickEvent[] = [
  {
    id: 'evt-1',
    tick: 12,
    type: 'narrative',
    message: 'A cold wind crosses Ashvale',
    significance: 0.4,
    sphere: 'spirit',
  },
  {
    id: 'evt-2',
    tick: 13,
    type: 'narrative',
    message: 'Intervention beat',
    significance: 0.9,
    sphere: 'mind',
    isInterventionBeat: true,
  },
];

describe('RecentEventsView', () => {
  it('does not subscribe while stream is off', () => {
    const getRecentEvents = vi.fn(() => events);
    render(<RecentEventsView getRecentEvents={getRecentEvents} />);

    expect(getRecentEvents).not.toHaveBeenCalled();
    expect(screen.queryByTestId('recent-event-row')).toBeNull();
    expect(screen.queryByTestId('intervention-beat')).toBeNull();
  });

  it('renders rows after stream is enabled', () => {
    const getRecentEvents = vi.fn(() => events);
    render(<RecentEventsView getRecentEvents={getRecentEvents} />);

    fireEvent.click(screen.getByLabelText('Stream recent events'));

    expect(getRecentEvents).toHaveBeenCalled();
    expect(screen.getByText('A cold wind crosses Ashvale')).toBeInTheDocument();
    expect(screen.getByText('Intervention beat')).toBeInTheDocument();
  });

  it('marks intervention beats for styling hooks', () => {
    render(<RecentEventsView getRecentEvents={() => events} />);

    fireEvent.click(screen.getByLabelText('Stream recent events'));

    expect(screen.getByTestId('intervention-beat')).toBeInTheDocument();
  });
});

/**
 * THR-1447 — contract test across the engine→UI seam.
 *
 * The engine mints the ids and this view keys its rows on them, so uniqueness is a
 * contract *between* them that neither side can verify alone: an engine test proves
 * the ids differ, a UI test with hand-written fixtures proves only that React can
 * render two rows. This drives the real `applyEncounterAftermathReaction` and renders
 * the real component, so a regression in the mint fails here even though nothing in
 * this file changes.
 *
 * React answers a duplicate key by duplicating or *omitting* a child — and this list
 * is one the player reads. It reports the collision only on `console.error`, so that
 * is the assertion surface.
 */
function mintTwoAftermathEventsOnOneTick(): readonly TickEvent[] {
  const graph = new WorldGraph();
  graph.addNode({ id: 'actor-1', type: 'actor', name: 'Ashara', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'actor-2', type: 'actor', name: 'Berun', properties: { actorType: 'individual' } });

  // Saturate the buffer: below MAX_RECENT_EVENTS the old length-suffix really did
  // vary, so an unsaturated fixture would pass against the defect.
  const filler: TickEvent[] = Array.from({ length: MAX_RECENT_EVENTS }, (_, i) => ({
    id: `filler_${i}`, tick: 1, type: 'narrative', message: `filler ${i}`, significance: 0.1,
  }));

  const base = {
    tick: 53, seed: 42, cycle: 1, phase: 'playing', graph,
    cosmology: {} as never, tiles: [], clock: {} as never, ascendantId: 'asc-1',
    essencePool: {} as never, mandateDefinition: null, mandateState: null,
    rivalDefinitions: [], rivalStates: [], doomDefinition: {} as never, doomClock: {} as never,
    tickEvents: [], recentEvents: filler, chronicleEntries: [], stealthExposure: 0,
    visibilityMap: {} as never, familiarityMap: {} as never, culturalInsightMap: new Map(),
    agentKnowledge: new Map(), encounterProgress: [], actionsInProgress: [], unifiedActions: [],
    worldSoul: {} as never, echoDefinitions: [], echoStates: [], chronicle: {} as never,
    encounterNotifications: [], clearanceGateStates: new Map<string, ClearanceGateRuntimeState>(),
  } as GameState;

  const reaction: EncounterAftermathReaction = {
    id: 'anchored_react_deepen_the_anchor',
    label: 'Deepen the anchor.',
    effects: [{
      kind: 'recent_event', eventType: 'narrative',
      message: 'The old customs become covenants.', significance: 0.8,
    }],
    closeAfterSelection: false,
  };
  const action = (actorId: string, actionId: string) => ({
    actionId, actorId, templateId: 'enc.comet.turning', targetId: actorId,
    scale: 'personal', source: 'agent', startTick: 1, currentStep: 0,
    stepProgress: 1, stepDuration: 1, resolved: true, outcome: 'success', stepOutcomes: [],
  } as UnifiedAction);

  const runtime = createSimulationRuntime();
  const first = applyEncounterAftermathReaction(base, action('actor-1', 'ua_a'), reaction, 53, runtime).state;
  return applyEncounterAftermathReaction(first, action('actor-2', 'ua_b'), reaction, 53, runtime).state.recentEvents;
}

describe('RecentEventsView — engine-minted event ids (THR-1447)', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('renders two same-reaction aftermath events without a duplicate-key error', () => {
    const minted = mintTwoAftermathEventsOnOneTick();
    const aftermathRows = minted.filter(e => e.id.startsWith('enc_after_'));
    // Guard the guard: if the engine stopped emitting these, the console assertion
    // below would pass on an empty list and prove nothing.
    expect(aftermathRows).toHaveLength(2);

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<RecentEventsView getRecentEvents={() => minted} />);
    fireEvent.click(screen.getByLabelText('Stream recent events'));

    const duplicateKeyErrors = errorSpy.mock.calls
      .map(call => call.join(' '))
      .filter(msg => /same key/i.test(msg));
    expect(duplicateKeyErrors).toEqual([]);

    // And both authored lines actually reached the player, not one silently omitted.
    expect(screen.getAllByText('The old customs become covenants.')).toHaveLength(2);
  });
});
