// @vitest-environment jsdom
/**
 * ArtifactSheet — artifact-representation pattern locks (THR-1009).
 *
 * Before THR-1009 this sheet rendered "Full artifact sheet coming in a future
 * update" for every artifact — a live-looking link to an empty page (UI Law 21).
 * These tests fail against that build.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ArtifactSheet } from '../ArtifactSheet';
import { WorldGraph } from '../../../engine/graph';

function graphWithMule(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'starter_road_worn_mule',
    type: 'artifact',
    name: 'Road-Worn Mule',
    properties: {
      subcategory: 'mounts_beasts',
      tier: 1,
      tags: ['#beast', '#mount'],
      flavorText: 'A stubborn creature with strong legs and stronger opinions.',
      // The authoring aid the sheet must NOT surface (Law 13).
      mechanicalSummary: '+0.03 Gold, 10% reduced movement cost (pack carrier)',
    },
  } as never);
  return graph;
}

describe('ArtifactSheet — artifact representation (THR-1009)', () => {
  it('Law 21: renders real content, not a "coming soon" stub', () => {
    render(
      <ArtifactSheet
        name="Road-Worn Mule"
        artifactId="starter_road_worn_mule"
        graph={graphWithMule()}
        onClose={() => {}}
      />,
    );

    expect(screen.queryByText(/coming in a future update/i)).toBeNull();
    expect(
      screen.getByText('A stubborn creature with strong legs and stronger opinions.'),
    ).toBeTruthy();
  });

  it('carries its canonical visual (Law 1) and identity block', () => {
    render(
      <ArtifactSheet
        name="Road-Worn Mule"
        artifactId="starter_road_worn_mule"
        graph={graphWithMule()}
        onClose={() => {}}
      />,
    );

    expect(screen.getByTestId('artifact-sheet-visual')).toBeTruthy();
    // Law 14: the subcategory reads as words, never `mounts_beasts`.
    expect(screen.getByText('Mounts & Beasts')).toBeTruthy();
    expect(screen.getByText('Mundane')).toBeTruthy();
  });

  it('Law 13: never surfaces mechanicalSummary, and shows no raw magnitude', () => {
    const { container } = render(
      <ArtifactSheet
        name="Road-Worn Mule"
        artifactId="starter_road_worn_mule"
        graph={graphWithMule()}
        onClose={() => {}}
      />,
    );

    expect(container.textContent).not.toMatch(/mechanicalSummary/);
    expect(container.textContent).not.toMatch(/\+0\.03/);
    expect(container.textContent).not.toMatch(/\d+%/);
  });

  it('Law 14: an unknown subcategory is omitted rather than printed raw', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'odd_thing',
      type: 'artifact',
      name: 'Odd Thing',
      properties: { subcategory: 'not_a_real_category' },
    } as never);

    const { container } = render(
      <ArtifactSheet name="Odd Thing" artifactId="odd_thing" graph={graph} onClose={() => {}} />,
    );

    expect(container.textContent).not.toMatch(/not_a_real_category/);
  });

  it('NFP #4: an unresolvable node still renders a designed body, never a blank', () => {
    const { container } = render(
      <ArtifactSheet
        name="Vanished Relic"
        artifactId="missing_id"
        graph={new WorldGraph()}
        onClose={() => {}}
      />,
    );

    expect(screen.getByText(/Nothing further is recorded/i)).toBeTruthy();
    expect(container.textContent).not.toMatch(/undefined|null/);
  });
});
