// @vitest-environment jsdom
/**
 * NotablesPanel (THR-630 seam D) — intent panel rows derived from live
 * agenda compositions, rendered through the real component.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorldGraph } from '../../../engine/graph';
import { NotablesPanel, buildNotableAgendaRows } from '../NotablesPanel';
import { agendaFlags } from '../../../engine/notableAgendas';
import type { GameState, ActiveComposition } from '../../../types/gameState';

function makeState(overrides: Partial<GameState> = {}): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'n1', type: 'actor', name: 'Maren Hale', properties: { actorType: 'individual' } });
  graph.addNode({
    id: 'loc1',
    type: 'location',
    name: 'Farwatch',
    properties: { terrain: 'plains', locationSubtype: 'town', hexCol: 0, hexRow: 0 },
  });
  return {
    tick: 20,
    seed: 42,
    graph,
    worldFlags: {},
    activeCompositions: [],
    ...overrides,
  } as unknown as GameState;
}

function agendaComp(overrides: Partial<ActiveComposition> = {}): ActiveComposition {
  return {
    compositionId: 'notable-agenda-n1-claim-t12',
    firedAtTick: 12,
    activatedPhaseIds: ['whisper', 'declaration'],
    phaseActivationTicks: {},
    resolvedNodes: { target: 'loc1' },
    status: 'active',
    lastEvaluationTick: 20,
    sponsorNotableId: 'n1',
    agendaFamily: 'claim',
    ...overrides,
  };
}

describe('NotablesPanel (THR-630)', () => {
  it('renders the empty state when no agendas are live', () => {
    render(<NotablesPanel gameState={makeState()} />);
    expect(screen.getByText('The great and the restless bide their time.')).toBeTruthy();
  });

  it('renders an agenda row with notable name, family label, target, and phase progress', () => {
    const state = makeState({ activeCompositions: [agendaComp()] });
    render(<NotablesPanel gameState={state} />);
    expect(screen.getByText('Maren Hale')).toBeTruthy();
    expect(screen.getByText('Pressed Claim')).toBeTruthy();
    expect(screen.getByText(/Farwatch/)).toBeTruthy();
    const row = screen.getByRole('listitem');
    expect(row.getAttribute('aria-label')).toContain('phase 2 of 4');
  });

  it('marks contested agendas from world-flags and tug-gated ones from threads', () => {
    const state = makeState({
      activeCompositions: [agendaComp()],
      worldFlags: { [agendaFlags.counters('notable-agenda-n1-claim-t12')]: 1 },
      ascendantId: 'asc',
    });
    state.graph.addNode({ id: 'asc', type: 'actor', name: 'Asc', properties: { actorType: 'ascendant' } });
    state.graph.addEdge({ id: 'e_t', source: 'asc', target: 'n1', type: 'thread', properties: {} });
    render(<NotablesPanel gameState={state} />);
    expect(screen.getByText('Contested')).toBeTruthy();
    expect(screen.getByText('Tug-gated')).toBeTruthy();
  });

  it('buildNotableAgendaRows ignores rival schemes and reports terminal states', () => {
    const state = makeState({
      activeCompositions: [
        agendaComp({ status: 'failed' }),
        {
          compositionId: 'rival-scheme-r1',
          firedAtTick: 1,
          activatedPhaseIds: [],
          phaseActivationTicks: {},
          resolvedNodes: {},
          status: 'active',
          lastEvaluationTick: 1,
          sponsorRivalId: 'r1',
          schemeFamily: 'corruptive',
        },
      ],
    });
    const rows = buildNotableAgendaRows(state);
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe('failed');
  });
});
