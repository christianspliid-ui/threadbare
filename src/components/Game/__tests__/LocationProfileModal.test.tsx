// @vitest-environment jsdom
/**
 * LocationProfileModal — artifact-representation pattern locks (THR-1023).
 *
 * Before THR-1023 this modal rendered "Full location profile coming in a future
 * update" for every place, reached from HexSidebar and HexDetailView — a
 * live-looking link to an empty page (UI Law 21). These tests fail against that
 * build.
 *
 * The fixture mirrors a real node: property names and values are taken from
 * `loc_0` in a seed-42 medium world (verified via CLI), including the raw
 * `prosperity` float the sheet must not surface.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LocationProfileModal } from '../LocationProfileModal';
import { WorldGraph } from '../../../engine/graph';

function graphWithKeep(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'loc_0',
    type: 'location',
    name: 'Ardenmor Keep',
    properties: {
      locationType: 'capital',
      locationSubtype: 'capital',
      terrain: 'temperate_forest',
      rarityTier: 1,
      archetypeName: 'Seat of Power',
      archetypeProseFlavor: 'power flows downhill from these walls',
      // Raw magnitudes the sheet must NOT surface (Law 13).
      prosperity: 48.508699108995636,
      importance: 0,
      populationLagTicks: 3,
    },
  } as never);
  return graph;
}

describe('LocationProfileModal — location representation (THR-1023)', () => {
  it('Law 21: renders real content, not a "coming soon" stub', () => {
    render(
      <LocationProfileModal
        name="Ardenmor Keep"
        locationId="loc_0"
        graph={graphWithKeep()}
        onClose={() => {}}
      />,
    );

    expect(screen.queryByText(/coming in a future update/i)).toBeNull();
    expect(screen.getByText('Power flows downhill from these walls.')).toBeTruthy();
  });

  it('carries its canonical visual (Law 1) and identity block', () => {
    render(
      <LocationProfileModal
        name="Ardenmor Keep"
        locationId="loc_0"
        graph={graphWithKeep()}
        onClose={() => {}}
      />,
    );

    expect(screen.getByTestId('location-profile-visual')).toBeTruthy();
    expect(screen.getByText('Capital')).toBeTruthy();
    expect(screen.getByText('Seat of Power')).toBeTruthy();
  });

  it('Law 13: surfaces no raw magnitude — prosperity, importance or tick counts', () => {
    const { container } = render(
      <LocationProfileModal
        name="Ardenmor Keep"
        locationId="loc_0"
        graph={graphWithKeep()}
        onClose={() => {}}
      />,
    );

    expect(container.textContent).not.toMatch(/48\.5/);
    expect(container.textContent).not.toMatch(/prosperity/i);
    expect(container.textContent).not.toMatch(/\d+%/);
  });

  it('Law 14: an unnamed subtype is omitted rather than printed as its key', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'loc_odd',
      type: 'location',
      name: 'The Nameless Place',
      properties: { locationSubtype: 'not_a_real_subtype', terrain: 'plateau' },
    } as never);

    const { container } = render(
      <LocationProfileModal
        name="The Nameless Place"
        locationId="loc_odd"
        graph={graph}
        onClose={() => {}}
      />,
    );

    expect(container.textContent).not.toMatch(/not_a_real_subtype/);
  });

  it('Law 14: a live-world null subtype prints nothing, not "null"', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'loc_null',
      type: 'location',
      name: 'Open Country',
      properties: { locationSubtype: null, terrain: 'grassland' },
    } as never);

    const { container } = render(
      <LocationProfileModal
        name="Open Country"
        locationId="loc_null"
        graph={graph}
        onClose={() => {}}
      />,
    );

    expect(container.textContent).not.toMatch(/null|undefined/);
  });

  it('NFP #4: an unresolvable node still renders a designed body, never a blank', () => {
    const { container } = render(
      <LocationProfileModal
        name="Lost Hold"
        locationId="missing_id"
        graph={new WorldGraph()}
        onClose={() => {}}
      />,
    );

    expect(screen.getByText(/Nothing further is recorded/i)).toBeTruthy();
    expect(container.textContent).not.toMatch(/undefined|null/);
  });

  it('NFP #4: renders without a graph at all (callers that pass only a name)', () => {
    const { container } = render(<LocationProfileModal name="Somewhere" onClose={() => {}} />);

    expect(screen.getByText(/Nothing further is recorded/i)).toBeTruthy();
    expect(container.textContent).not.toMatch(/undefined|null/);
  });
});
