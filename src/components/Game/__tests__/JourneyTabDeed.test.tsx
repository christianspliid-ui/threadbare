// @vitest-environment jsdom
/**
 * The ledger names each deed by verb and object (THR-1434): the verb word with
 * its tooltip, the object linked where a page exists and plain where none does.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorldGraph } from '../../../engine/graph';
import type { GameState } from '../../../types/gameState';
import type { AgentInfoCardData } from '../../../engine/agentDetail';
import { JourneyTab } from '../tabs/JourneyTab';

function state(history?: unknown[]): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'kael', type: 'actor', name: 'Kael', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'loc_salt', type: 'location', name: 'the Saltway', properties: { locationSubtype: 'trade_route', hexCol: 1, hexRow: 1 } });
  return {
    tick: 80,
    ascendantId: 'ascendant',
    graph,
    followedAgentIds: [],
    mutedAgentIds: [],
    strategicState: {
      projects: [],
      controls: [],
      history: history ?? [
        {
          tick: 40, actorId: 'kael', templateId: 'cell.create.route', ambitionId: 'a', verb: 'establish',
          behaviorFamily: 'merchant-expansion', displayName: 'Create a route', outcome: 'completed',
          graphOps: [], catalystSeeded: false,
          deed: { verb: 'create', word: 'Founded', objectName: 'the Saltway', objectRef: { kind: 'location', id: 'loc_salt', name: 'the Saltway' }, phrase: 'Founded the Saltway' },
        },
        {
          tick: 52, actorId: 'kael', templateId: 'cell.destroy.condition', ambitionId: 'a', verb: 'undermine',
          behaviorFamily: 'counter-play', displayName: 'Destroy a condition', outcome: 'completed',
          graphOps: [], catalystSeeded: false,
          deed: { verb: 'destroy', word: 'Cured', objectName: "Old Maerin's fever", phrase: "Cured Old Maerin's fever" },
        },
      ],
    },
    pendingUndertakingMoments: [],
  } as unknown as GameState;
}

const card = { id: 'kael', name: 'Kael', locationId: 'loc_1', locationName: 'Millhaven', knowledgeLevel: 'intimate', intents: [] } as unknown as AgentInfoCardData;

describe('the ledger names deeds by verb and object', () => {
  it('renders the verb word and links the object where a page exists', () => {
    const onOpenLocation = vi.fn();
    render(<JourneyTab card={card} gameState={state()} onOpenLocation={onOpenLocation} />);
    const deeds = screen.getAllByTestId('arc-deed');
    expect(deeds.map(d => d.textContent)).toEqual(['Founded the Saltway.', "Cured Old Maerin's fever."]);
    const objects = screen.getAllByTestId('arc-deed-object');
    expect(objects[0].tagName).toBe('BUTTON');
    fireEvent.click(objects[0]);
    expect(onOpenLocation).toHaveBeenCalledWith('loc_salt');
    // A cured fever has no page: named, not linked.
    expect(objects[1].tagName).toBe('SPAN');
    for (const d of deeds) expect(d.textContent).not.toMatch(/cell\.|\d/);
  });

  it('falls back to the finished-work line for a template-model completion without a deed', () => {
    const s = state([{
      tick: 40, actorId: 'kael', templateId: 'strategic_build_warehouse', ambitionId: 'a', verb: 'establish',
      behaviorFamily: 'merchant-expansion', displayName: 'Build a Warehouse', outcome: 'completed', graphOps: [], catalystSeeded: false,
    }]);
    render(<JourneyTab card={card} gameState={s} />);
    expect(screen.queryByTestId('arc-deed')).toBeNull();
    expect(screen.getByText('Finished Build a Warehouse.')).toBeTruthy();
  });
});
