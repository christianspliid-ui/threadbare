// @vitest-environment jsdom
/**
 * Who matters here (THR-1655) — the three surfaces of notables-and-ties slice S4:
 * the bond word on the sheet, the notable on the settlement page, and the Rulers / Local
 * split in the Notables panel. Each face carries its absence arm.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NotablesPanel } from '../NotablesPanel';
import { WorldGraph } from '../../../engine/graph';
import { agendaFlags } from '../../../engine/notableAgendas';
import type { GameState, ActiveComposition } from '../../../types/gameState';

// The settlement page's NotableLine retired with the sheets (THR-1991); the place page's
// notable row is covered by the Inspector row tests.

describe('NotablesPanel — Rulers and Local (THR-1655)', () => {
  function state(compositions: ActiveComposition[], flags: Record<string, unknown>): GameState {
    const graph = new WorldGraph();
    graph.addNode({ id: 'n1', type: 'actor', name: 'Queen Aster', properties: { actorType: 'individual' } });
    graph.addNode({ id: 'n2', type: 'actor', name: 'Maren Dusk', properties: { actorType: 'individual' } });
    return { tick: 20, seed: 42, graph, worldFlags: flags, activeCompositions: compositions } as unknown as GameState;
  }
  const comp = (id: string, sponsor: string): ActiveComposition => ({
    compositionId: id, firedAtTick: 12, activatedPhaseIds: ['whisper'], phaseActivationTicks: {},
    resolvedNodes: {}, status: 'active', lastEvaluationTick: 20, sponsorNotableId: sponsor, agendaFamily: 'feud',
  });

  it('splits leader agendas from local ones, each with its own heading', () => {
    render(<NotablesPanel gameState={state(
      [comp('c1', 'n1'), comp('c2', 'n2')],
      { [agendaFlags.local('c2')]: true },
    )} />);
    expect(screen.getByTestId('notables-group-rulers').textContent).toContain('Queen Aster');
    expect(screen.getByTestId('notables-group-local').textContent).toContain('Maren Dusk');
    expect(screen.getByTestId('notables-group-local').textContent).not.toContain('Queen Aster');
  });

  it('renders no Local heading when no local agenda is live', () => {
    render(<NotablesPanel gameState={state([comp('c1', 'n1')], {})} />);
    expect(screen.queryByTestId('notables-group-local')).toBeNull();
    expect(screen.getByTestId('notables-group-rulers')).toBeTruthy();
  });
});
