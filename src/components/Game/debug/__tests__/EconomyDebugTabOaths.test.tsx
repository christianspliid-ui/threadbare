// @vitest-environment jsdom
/**
 * THR-1944 — the Economy debug tab's Oaths table names who brokered an oath. A brokered
 * oath shows the mortal's name in the "brokered by" column and its kind reads
 * "coerced (demand)"; a courted oath shows a dash.
 */
import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { EconomyDebugTab } from '../EconomyDebugTab';
import { WorldGraph } from '../../../../engine/graph';
import type { SwornToEdgeProperties } from '../../../../engine/crown/types';

function oath(over: Partial<SwornToEdgeProperties>): Record<string, unknown> {
  return {
    kind: 'persuaded', taxShare: 0.3, loyalty: 0.7, swornTick: 24, giftPaid: 0,
    lastLoyaltyDay: null, recentLosses: [], taxPaidTotal: 0, taxPaidToday: 0, lastPassTick: 24,
    ...over,
  };
}

function makeGraph(): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: 'faction_0', type: 'actor', name: 'Hold of Witness Skyfield', properties: { actorType: 'faction', factionClass: 'realm' } });
  g.addNode({ id: 'faction_merc', type: 'actor', name: 'Scarlet Company', properties: { actorType: 'faction', factionClass: 'mercenary' } });
  g.addNode({ id: 'guild_0', type: 'actor', name: 'Silverborough Mining Consortium', properties: { actorType: 'faction', factionClass: 'guild' } });
  g.addNode({ id: 'actor-hero', type: 'actor', name: 'Maret', properties: { actorType: 'individual' } });
  g.addEdge({ id: 'e_sworn_merc', source: 'faction_merc', target: 'faction_0', type: 'sworn_to', properties: oath({ kind: 'coerced', loyalty: 0.35, forcedBy: 'demand', brokeredBy: 'actor-hero' }) });
  g.addEdge({ id: 'e_sworn_guild', source: 'guild_0', target: 'faction_0', type: 'sworn_to', properties: oath({}) });
  return g;
}

describe('EconomyDebugTab — Oaths table (THR-1944)', () => {
  it('names the mortal who brokered an oath, and a dash for a courted one', () => {
    render(<EconomyDebugTab graph={makeGraph()} currentTick={48} />);
    const table = screen.getByTestId('economy-oaths');
    expect(within(table).getByText('brokered by')).toBeTruthy();
    const merc = within(table).getByText('Scarlet Company').closest('tr')!;
    expect(within(merc).getByText('Maret')).toBeTruthy();
    expect(within(merc).getByText('coerced (demand)')).toBeTruthy();
    const guild = within(table).getByText('Silverborough Mining Consortium').closest('tr')!;
    expect(guild.textContent).toContain('—');
    expect(within(guild).queryByText('Maret')).toBeNull();
  });
});
