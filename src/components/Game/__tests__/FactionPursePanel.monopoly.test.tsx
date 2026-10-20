// @vitest-environment jsdom
/**
 * THR-1955 — the Purse panel's monopoly chip, rendered through the real component (the
 * sanctioned jsdom-render substitution for an unattended run, verification-gates.md
 * § Browser-verify), driven by the real economic-power phase.
 *
 * The chip reads "Holds the region's grain" from the faction's `regionalMonopolies`
 * record, carries the `ui.econ.monopoly` tooltip, shows no number (Laws 13/14), and
 * clears the day the share drops (Law 56).
 */
import { describe, it, expect } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { FactionPursePanel } from '../FactionPursePanel';
import { WorldGraph } from '../../../engine/graph';
import { phaseEconomicPower } from '../../../engine/phases/economicPower';
import { ECON_POWER_SCAN_INTERVAL_TICKS } from '../../../data/economic-power-config';
import type { GameState } from '../../../types/gameState';
import type { PhaseContext } from '../../../engine/phaseRegistry';

const SCAN = ECON_POWER_SCAN_INTERVAL_TICKS;

function world(): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: 'H', type: 'actor', name: 'House Varr', properties: { actorType: 'faction', meansBand: 'Comfortable', wealth: 40 } });
  for (const [id, col] of [['h1', 0], ['h2', 1], ['h3', 2], ['x1', 3]] as const) {
    g.addNode({
      id, type: 'location', name: `Town ${id}`,
      properties: { locationSubtype: 'town', hexCol: col, hexRow: 0, prosperity: 50, resources: { grain: { resourceId: 'grain', quantity: 60 } } },
    });
  }
  for (const id of ['h1', 'h2', 'h3']) g.addEdge({ id: `c_${id}`, source: 'H', target: id, type: 'controls', properties: {} });
  return g;
}

function scan(g: WorldGraph, tick: number): void {
  phaseEconomicPower({ tick, seed: 42, graph: g, tickEvents: [], chronicleEntries: [], pendingSpherePressures: [] } as unknown as GameState, {} as PhaseContext);
}

describe('Purse panel monopoly chip (THR-1955)', () => {
  it('renders one worded chip with its tooltip term while the monopoly stands, and none the day it drops', () => {
    const g = world();
    scan(g, SCAN);
    render(<FactionPursePanel factionId="H" graph={g} />);
    const chip = screen.getByTestId('faction-purse-monopoly');
    expect(chip.textContent).toBe("Holds the region's grain");
    expect(chip.getAttribute('role')).toBe('term');
    expect(screen.getByTestId('faction-purse').textContent ?? '').not.toMatch(/\d/);
    cleanup();

    g.removeEdge('c_h3'); // 2 of 4: below the share
    scan(g, SCAN * 2);
    render(<FactionPursePanel factionId="H" graph={g} />);
    expect(screen.queryByTestId('faction-purse-monopoly')).toBeNull();
    cleanup();
  });
});
