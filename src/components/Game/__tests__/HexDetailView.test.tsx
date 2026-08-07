// @vitest-environment jsdom
/**
 * HexDetailView — UI Laws regression locks (THR-1009).
 *
 * Each test below fails against the pre-THR-1009 build, which rendered hex
 * contents as `names.join(', ')`, printed `region_0` as the region, and showed
 * elevation/temperature/moisture as `NN%`.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HexDetailView } from '../HexDetailView';
import { WorldGraph } from '../../../engine/graph';
import type { HexTile } from '../../../types';

const COORD = { col: 3, row: 4 };

function buildGraph(): WorldGraph {
  const graph = new WorldGraph();

  graph.addNode({
    id: 'region_0',
    type: 'region',
    name: 'The Expanse',
    properties: {},
  } as never);

  graph.addNode({
    id: 'loc_mill',
    type: 'location',
    name: 'Greyhollow Mill',
    properties: { hexCol: COORD.col, hexRow: COORD.row },
  } as never);

  graph.addNode({
    id: 'agent_kael',
    type: 'actor',
    name: 'Kael Thornweaver',
    properties: { actorType: 'individual', hexCol: COORD.col, hexRow: COORD.row },
  } as never);

  return graph;
}

function buildTile(): HexTile {
  return {
    coord: COORD,
    terrain: 'plains',
    regionId: 'region_0',
    geoParams: { elevation: 0.12, temperature: 0.55, moisture: 0.91 },
  } as unknown as HexTile;
}

function renderView(overrides: Partial<React.ComponentProps<typeof HexDetailView>> = {}) {
  return render(
    <HexDetailView
      coord={COORD}
      tile={buildTile()}
      onClose={() => {}}
      onGoToChronicle={() => {}}
      graph={buildGraph()}
      {...overrides}
    />,
  );
}

describe('HexDetailView — UI Laws (THR-1009)', () => {
  it('Law 21: an agent row routes to the agent surface by kind', () => {
    const onAgentClick = vi.fn();
    renderView({ onAgentClick });

    fireEvent.click(screen.getByText('Kael Thornweaver'));

    expect(onAgentClick).toHaveBeenCalledWith('agent_kael');
  });

  it('Law 21: a location row routes to the location surface by kind', () => {
    const onLocationClick = vi.fn();
    renderView({ onLocationClick });

    fireEvent.click(screen.getByText('Greyhollow Mill'));

    expect(onLocationClick).toHaveBeenCalledWith('loc_mill');
  });

  it('Law 21 fail-open: with no handler the row carries no interactive affordance', () => {
    renderView();

    const row = screen.getByText('Kael Thornweaver').closest('.interactive-row');
    expect(row).not.toBeNull();
    // No onClick ⇒ ListRow renders no role/tabIndex, so it is plain styled text.
    expect(row?.getAttribute('role')).toBeNull();
    expect(row?.getAttribute('tabindex')).toBeNull();
  });

  it('Law 14: the region renders its authored name, never the internal key', () => {
    renderView();

    expect(screen.getByText('The Expanse')).toBeTruthy();
    expect(screen.queryByText(/region_0/)).toBeNull();
  });

  it('Law 14: an unresolvable region id is omitted rather than printed raw', () => {
    const tile = { ...buildTile(), regionId: 'region_missing' } as HexTile;
    renderView({ tile });

    expect(screen.queryByText(/region_missing/)).toBeNull();
    expect(screen.queryByText('Region:')).toBeNull();
  });

  it('Law 13: geo parameters render as words, with no percentage anywhere', () => {
    const { container } = renderView();

    expect(screen.getByText('Lowland')).toBeTruthy();   // elevation 0.12
    expect(screen.getByText('Temperate')).toBeTruthy(); // temperature 0.55
    expect(screen.getByText('Drenched')).toBeTruthy();  // moisture 0.91
    expect(container.textContent).not.toMatch(/\d+%/);
  });

  it('Law 1: each listed entity carries its image chip', () => {
    const { container } = renderView();

    const chips = container.querySelectorAll('[data-entity-visual-tier]');
    // One per listed entity: the mill and the agent.
    expect(chips.length).toBe(2);
  });
});
