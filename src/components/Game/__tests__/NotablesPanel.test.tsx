// @vitest-environment jsdom
/**
 * NotablesPanel (THR-630 seam D) — intent panel rows derived from live
 * agenda compositions, rendered through the real component.
 */
import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { WorldGraph } from '../../../engine/graph';
import { NotablesPanel, buildNotableAgendaRows, buildNotableEntries } from '../NotablesPanel';
import { NotablesButton } from '../NotablesButton';
import { RefRouterProvider } from '../../../contexts/RefRouterContext';
import type { RefRouter } from '../../../hooks/useRefRouter';
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
    const agenda = screen.getByTestId('notable-agenda');
    expect(agenda.getAttribute('aria-label')).toContain('phase 2 of 4');
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

  // ── THR-1780: one row per notable; the badge counts what the panel shows ──

  function twoNotablesThreeAgendas(): GameState {
    const state = makeState({
      activeCompositions: [
        agendaComp({ compositionId: 'a1', status: 'active' }),
        agendaComp({ compositionId: 'a2', status: 'completed', agendaFamily: 'claim' }),
        agendaComp({ compositionId: 'a3', sponsorNotableId: 'n2', status: 'failed' }),
      ],
    });
    state.graph.addNode({ id: 'n2', type: 'actor', name: 'Scorvin', properties: { actorType: 'individual' } });
    return state;
  }

  it('lists a notable with two agendas once, with both agendas under the name', () => {
    render(<NotablesPanel gameState={twoNotablesThreeAgendas()} />);
    const rows = screen.getAllByRole('listitem');
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getAllByTestId('notable-agenda')).toHaveLength(2);
    expect(screen.getAllByText('Maren Hale')).toHaveLength(1);
  });

  it('the top-bar badge equals the number of distinct notables the panel shows — terminal agendas included', () => {
    const state = twoNotablesThreeAgendas();
    const { container } = render(<NotablesButton gameState={state} />);
    const button = container.querySelector('button[aria-label]')!;
    // Only one of the three agendas is active; the old badge read 1 over a list of 2 names.
    expect(button.getAttribute('aria-label')).toBe('2 notables');
    expect(buildNotableEntries(state)).toHaveLength(2);
  });

  it('notable and target names open their cards through the ref router (Law 21)', () => {
    const opened: unknown[] = [];
    const router = {
      open: (ref: unknown) => opened.push(ref),
      armHover: () => {},
      disarmHover: () => {},
      closeHover: () => {},
    } as unknown as RefRouter;
    render(
      <RefRouterProvider router={router}>
        <NotablesPanel gameState={makeState({ activeCompositions: [agendaComp()] })} />
      </RefRouterProvider>,
    );
    screen.getByRole('button', { name: 'Maren Hale — open profile' }).click();
    screen.getByRole('button', { name: 'Farwatch — open profile' }).click();
    expect(opened).toEqual([
      { kind: 'agent', id: 'n1', name: 'Maren Hale' },
      { kind: 'location', id: 'loc1', name: 'Farwatch' },
    ]);
  });

  it('a sponsor missing from the graph renders as text, never a dead link', () => {
    render(<NotablesPanel gameState={makeState({ activeCompositions: [agendaComp({ sponsorNotableId: 'ghost' })] })} />);
    expect(screen.getByText('ghost')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /ghost/ })).toBeNull();
  });
});

