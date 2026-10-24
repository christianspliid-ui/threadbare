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
import { composeSections } from '../../../engine/detailPageGenerator';
import { Section } from '../../shared/Section';
import { FAMILIARITY_THRESHOLDS } from '../../../types/familiarity';
import type { GameState, ActiveComposition } from '../../../types/gameState';
import type { Section as DetailSection } from '../../../types/detailPage';

// THR-1991: the retired sheet's NotableLine is now the place page's `settlement_notable` row.
describe('the settlement notable row — the place page (THR-1655, THR-1991)', () => {
  function world(withClauses: boolean, familiar = false): GameState {
    const g = new WorldGraph();
    g.addNode({ id: 'asc', type: 'actor', name: 'Vara', properties: { actorType: 'ascendant' } });
    g.addNode({ id: 'loc.town', type: 'location', name: 'Ashford', properties: { locationType: 'town', locationSubtype: 'town', hexCol: 3, hexRow: 4 } });
    g.addNode({ id: 'loc.yard', type: 'location', name: "the Tanner's Yard", properties: { parentLocationId: 'loc.town', hexCol: 3, hexRow: 4 } });
    g.addNode({ id: 'a.maren', type: 'actor', name: 'Maren Dusk', properties: { actorType: 'individual', notableOrigin: 'worldgen' } });
    g.addNode({ id: 'a.kael', type: 'actor', name: 'Kael Thornweaver', properties: { actorType: 'individual' } });
    g.addNode({ id: 'a.ysolde', type: 'actor', name: 'Ysolde Vane', properties: { actorType: 'individual' } });
    g.addEdge({ id: 'at', source: 'a.maren', target: 'loc.yard', type: 'located_at', properties: {} });
    if (withClauses) {
      g.addEdge({ id: 'own', source: 'a.maren', target: 'loc.yard', type: 'owns', properties: {} });
      g.addEdge({ id: 'feud', source: 'a.maren', target: 'a.kael', type: 'hostile_to', properties: { cause: 'old_quarrel' } });
      g.addEdge({ id: 'sec', source: 'a.maren', target: 'a.ysolde', type: 'knows_secret_of', properties: { revealed: false } });
    }
    const familiarityMap = new Map(familiar ? [['a.maren', FAMILIARITY_THRESHOLDS.known]] : []);
    return { graph: g, ascendantId: 'asc', tick: 20, seed: 42, familiarityMap, visibilityMap: new Map(), recentEvents: [] } as unknown as GameState;
  }
  const row = (s: GameState, nodeId = 'loc.town'): DetailSection | undefined =>
    composeSections('place', { nodeId, pageKind: 'place', graph: s.graph, seed: s.seed, tick: s.tick, protagonistId: 'asc', state: s })
      .find(x => x.typeId === 'settlement_notable');

  it('names the notable and one sentence per clause, every noun a link', () => {
    const section = row(world(true, true));
    expect(section).toMatchObject({ kind: 'prose', label: 'Notable', labelTooltipId: 'agent.notable' });
    const { container } = render(<Section section={section!} />);
    expect(container.textContent).toContain(
      "Maren Dusk — Holds the Tanner's Yard. At odds with Kael Thornweaver. Knows something about Ysolde Vane.",
    );
    expect(section!.kind === 'prose' && section!.termRefs).toEqual({
      t0: { nodeId: 'a.maren', pageKind: 'actor' },
      t1: { nodeId: 'loc.yard', pageKind: 'place' },
      t2: { nodeId: 'a.kael', pageKind: 'actor' },
      t3: { nodeId: 'a.ysolde', pageKind: 'actor' },
    });
    expect(container.textContent).not.toMatch(/\d/);
  });

  it('withholds the secret until the player knows the notable', () => {
    const { container } = render(<Section section={row(world(true))!} />);
    expect(container.textContent).toContain("Maren Dusk — Holds the Tanner's Yard. At odds with Kael Thornweaver.");
    expect(container.textContent).not.toContain('Ysolde');
  });

  it('names only the notable when every clause is gone, and no row on a Place or a town without one', () => {
    const { container } = render(<Section section={row(world(false))!} />);
    expect(container.textContent).toContain('Maren Dusk');
    expect(container.textContent).not.toContain(' — ');
    expect(row(world(true), 'loc.yard')).toBeUndefined();
    const empty = world(false);
    empty.graph.removeNode('a.maren');
    expect(row(empty)).toBeUndefined();
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
