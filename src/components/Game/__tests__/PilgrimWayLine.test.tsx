// @vitest-environment jsdom
/**
 * The pilgrim-way lines on the Location and Faction sheets (THR-1660 § UI S2).
 *
 * Both read the same `sacred_route` edges through `selectPilgrimWays`, so a seeded way
 * and a consecrated one read alike, and a town with no way shows nothing (no blank row).
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FactionSheet } from '../FactionSheet';
import { LocationProfileModal } from '../LocationProfileModal';
import { WorldGraph } from '../../../engine/graph';
import { TEMPLE_OF_SPHERES_DEF_ID } from '../../../data/world-scenario';

function world(): WorldGraph {
  const g = new WorldGraph();
  g.addNode({
    id: 'fac_temple', type: 'actor', name: 'the Temple of the Ashen Folk',
    properties: { actorType: 'faction', factionDefId: TEMPLE_OF_SPHERES_DEF_ID, veneratedSphere: 'spirit' },
  } as never);
  for (const [id, name] of [['loc_ashford', 'Ashford'], ['loc_brindle', 'Brindle'], ['loc_cold', 'Cold Harbour']] as const) {
    g.addNode({ id, type: 'location', name, properties: { locationSubtype: 'town', hexCol: 3, hexRow: 4 } } as never);
  }
  g.addEdge({ id: 'sr_a', source: 'fac_temple', target: 'loc_ashford', type: 'sacred_route', properties: { establishedTick: 0, origin: 'worldgen' } } as never);
  g.addEdge({ id: 'sr_b', source: 'fac_temple', target: 'loc_brindle', type: 'sacred_route', properties: { establishedTick: 40, origin: 'undertaking', projectId: 'p1' } } as never);
  return g;
}

describe('the pilgrim-way sheet lines (THR-1660)', () => {
  it('the Location sheet names the congregation whose pilgrims come here, as a link', () => {
    render(<LocationProfileModal name="Ashford" onClose={() => {}} locationId="loc_ashford" graph={world()} />);
    const line = screen.getByTestId('location-profile-pilgrim-way');
    expect(line.textContent).toContain('Pilgrims come here — a way of');
    expect(line.textContent).toContain('the Temple of the Ashen Folk');
    expect(line.textContent).not.toMatch(/sacred_route|\d/);
  });

  it('a town no way reaches shows no line at all', () => {
    render(<LocationProfileModal name="Cold Harbour" onClose={() => {}} locationId="loc_cold" graph={world()} />);
    expect(screen.queryByTestId('location-profile-pilgrim-way')).toBeNull();
  });

  it('the congregation\'s Faction sheet names every town its ways lead to, seeded and consecrated alike', () => {
    render(<FactionSheet factionId="fac_temple" name="the Temple of the Ashen Folk" graph={world()} onClose={() => {}} />);
    const line = screen.getByTestId('faction-pilgrim-ways');
    expect(line.textContent).toContain('Pilgrim ways to');
    expect(line.textContent).toContain('Ashford,');
    expect(line.textContent).toContain('Brindle.');
    expect(line.textContent).not.toContain('Cold Harbour');
  });
});
