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
import { mintMasterwork } from '../../../engine/strategicGraphOps';
import {
  assignArtifactTrait,
  readArtifactTraits,
  recordArtifactEncounterPresence,
} from '../../../engine/artifactTraits';
import {
  ARTIFACT_STORIED_TRAIT_ID,
  ARTIFACT_STORIED_ENCOUNTERS_PER_LEVEL,
} from '../../../data/artifact-trait-content';

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

describe('ArtifactSheet — the trait slot (THR-1521)', () => {
  function graphWithStoriedBlade(): { graph: WorldGraph; id: string } {
    const graph = new WorldGraph();
    graph.addNode({ id: 'maker', type: 'actor', name: 'Sila Vane', properties: { actorType: 'individual' } } as never);
    const minted = mintMasterwork(graph, 'maker', 'blade', 12);
    const id = minted.createdId!;
    graph.updateNode(id, { properties: { flavorText: 'A blade with a temper.', tags: ['#cursed', '#not_a_real_tag'] } });
    return { graph, id };
  }

  // The Modal renders through a portal, so chip queries go to `document`, never the
  // render `container` (the attachment view's tests take the same route).
  it('Law 56: a minted masterwork shows its Storied chip, backed by the has_trait edge', () => {
    const { graph, id } = graphWithStoriedBlade();
    render(<ArtifactSheet name="Sila's blade" artifactId={id} graph={graph} onClose={() => {}} />);
    const slot = screen.getByTestId('artifact-sheet-traits');
    expect(slot.textContent).toMatch(/Storied/);
    // The chip anchors the real edge, not a property or an invented row.
    const chip = document.querySelector(`[data-artifact-trait="${ARTIFACT_STORIED_TRAIT_ID}"]`);
    expect(chip).not.toBeNull();
    expect(graph.getEdge(`e.has_trait.${id}.${ARTIFACT_STORIED_TRAIT_ID}`)).toBeDefined();
  });

  it('Law 13: the level is a word, never a numeral', () => {
    const { graph, id } = graphWithStoriedBlade();
    // Climb it exactly one word so a numeral would have something to leak.
    for (let i = 0; i < ARTIFACT_STORIED_ENCOUNTERS_PER_LEVEL; i++) {
      recordArtifactEncounterPresence(graph, 'maker', 20 + i);
    }
    expect(readArtifactTraits(graph, id)[0]?.level).toBe(2);
    render(<ArtifactSheet name="Sila's blade" artifactId={id} graph={graph} onClose={() => {}} />);
    const slot = screen.getByTestId('artifact-sheet-traits');
    expect(slot.textContent).toMatch(/has seen much/);
    expect(slot.textContent).not.toMatch(/\d/);
  });

  it('an open sheet shows a trait stamped after it opened once the world version moves', () => {
    // The graph is mutated in place and the sheet is memoised: without `worldVersion`
    // the rerender below is skipped and the Cursed chip never appears (pre-fix arm).
    const { graph, id } = graphWithStoriedBlade();
    const onClose = (): void => {}; // stable, as GameView's is — an inline arrow would defeat the memo on its own
    const { rerender } = render(
      <ArtifactSheet name="Sila's blade" artifactId={id} graph={graph} worldVersion={1} onClose={onClose} />,
    );
    expect(screen.getByTestId('artifact-sheet-traits').textContent).not.toMatch(/Cursed/);
    assignArtifactTrait(graph, id, 'trait.artifact.cursed', { tick: 13, source: 'test' });
    rerender(<ArtifactSheet name="Sila's blade" artifactId={id} graph={graph} worldVersion={2} onClose={onClose} />);
    expect(screen.getByTestId('artifact-sheet-traits').textContent).toMatch(/Cursed/);
  });

  it('Law 4: a thing that carries no trait shows no Traits slot', () => {
    render(
      <ArtifactSheet
        name="Road-Worn Mule"
        artifactId="starter_road_worn_mule"
        graph={graphWithMule()}
        onClose={() => {}}
      />,
    );
    expect(screen.queryByTestId('artifact-sheet-traits')).toBeNull();
  });

  it('a holding face never shows a trait, even if an edge was forced onto it', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'hold_face',
      type: 'artifact',
      name: 'Holds Greyford',
      properties: { attachmentCategory: 'holding', tags: ['#holding'] },
    } as never);
    // The writer refuses it — and the reader would skip it even if a raw edge existed.
    const refused = assignArtifactTrait(graph, 'hold_face', ARTIFACT_STORIED_TRAIT_ID, { tick: 1, source: 'test' });
    expect(refused.ok).toBe(false);
    render(<ArtifactSheet name="Holds Greyford" artifactId="hold_face" graph={graph} onClose={() => {}} />);
    expect(screen.queryByTestId('artifact-sheet-traits')).toBeNull();
  });

  it('tags render through the attachment sheet\'s chip vocabulary, not as raw spans', () => {
    const { graph, id } = graphWithStoriedBlade();
    render(<ArtifactSheet name="Sila's blade" artifactId={id} graph={graph} onClose={() => {}} />);
    // The seated tag carries the vocabulary's data key and its axis glyph.
    const cursed = document.querySelector('[data-content-tag="#cursed"]');
    expect(cursed).not.toBeNull();
    expect(cursed!.textContent).toMatch(/○/);
    expect(cursed!.textContent).toMatch(/cursed/);
    // An unseated spelling still renders (Law 14), without pretending to be seated.
    const odd = document.querySelector('[data-content-tag="#not_a_real_tag"]');
    expect(odd).not.toBeNull();
    expect(odd!.textContent).toMatch(/not a real tag/);
    // No raw `#` anywhere on the surface.
    expect(screen.getByTestId('artifact-sheet-tags').textContent).not.toMatch(/#/);
  });
});
