// @vitest-environment jsdom
/**
 * Who matters here (THR-1655) — the three surfaces of notables-and-ties slice S4:
 * the bond word on the sheet, the notable on the settlement page, and the Rulers / Local
 * split in the Notables panel. Each face carries its absence arm.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BondsTab } from '../tabs/BondsTab';
import { NotableLine } from '../NotableLine';
import { NotablesPanel } from '../NotablesPanel';
import { WorldGraph } from '../../../engine/graph';
import { agendaFlags } from '../../../engine/notableAgendas';
import type { AgentInfoCardData } from '../../../engine/agentDetail';
import type { SettlementNotable } from '../../../engine/settlementNotable';
import type { GameState, ActiveComposition } from '../../../types/gameState';

describe('BondsTab — the bond word (THR-1655)', () => {
  const card = (basis: string | undefined) => ({
    name: 'Old Maerin',
    knowledgeLevel: 'known',
    topBonds: [{ targetId: 'a.maren', name: 'Maren Dusk', strengthWord: 'deep', sentiment: 'positive', basis }],
  }) as unknown as AgentInfoCardData;

  it('shows the word before the name, and the name stays a link', () => {
    render(<BondsTab card={card('kin')} />);
    expect(screen.getByTestId('bond-word').textContent).toBe('kin');
    expect(screen.getByText('Maren Dusk')).toBeTruthy();
  });

  it('folds an alias to its word', () => {
    render(<BondsTab card={card('friendship')} />);
    expect(screen.getByTestId('bond-word').textContent).toBe('friend');
  });

  it('renders no chip for a basis with no word', () => {
    render(<BondsTab card={card('unknown')} />);
    expect(screen.queryByTestId('bond-word')).toBeNull();
    expect(screen.getByText('Maren Dusk')).toBeTruthy();
  });
});

describe('NotableLine — the settlement page (THR-1655)', () => {
  const notable: SettlementNotable = {
    notableId: 'a.maren',
    notableName: 'Maren Dusk',
    secretWithheld: false,
    clauses: [
      { kind: 'holds', targetId: 'loc.yard', targetName: "the Tanner's Yard", targetKind: 'sublocation' },
      { kind: 'at_odds_with', targetId: 'a.kael', targetName: 'Kael Thornweaver', targetKind: 'agent' },
      { kind: 'knows_secret_of', targetId: 'a.ysolde', targetName: 'Ysolde Vane', targetKind: 'agent' },
    ],
  };

  it('renders the chip, the name, and one sentence built from the clauses', () => {
    render(<NotableLine notable={notable} />);
    expect(screen.getByTestId('notable-chip').textContent).toBe('notable');
    expect(screen.getByTestId('settlement-notable-sentence').textContent).toBe(
      "Holds the Tanner's Yard. At odds with Kael Thornweaver. Knows something about Ysolde Vane.",
    );
  });

  it('omits the sentence when every clause is gone, and carries no numeral', () => {
    render(<NotableLine notable={{ ...notable, clauses: [] }} />);
    expect(screen.queryByTestId('settlement-notable-sentence')).toBeNull();
    expect(screen.getByTestId('settlement-notable').textContent).not.toMatch(/\d/);
  });
});

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
