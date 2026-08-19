// @vitest-environment jsdom
/**
 * The place answers, rendered — THR-1173.
 *
 * `narrativeSegmentTiers.test.tsx` proves `NarrativeSegments` honours a
 * `location` segment; `narrativeLinkerLocationTier.test.ts` proves the producer
 * now emits one. Neither proves the two meet: both would still pass if the
 * producer's output never reached this component in the shape it renders.
 *
 * So this file drives the **real producer** into the **real component** and
 * asserts the rendered DOM — the surface evidence for a UI-pillar change made in
 * a run that cannot start a dev server (Browser-verify substitution: jsdom-render).
 *
 * Both faces are asserted, and the negative is the load-bearing one: a host that
 * cannot route a place must leave it as text, because a name that underlines and
 * opens the wrong sheet is worse than a name that does nothing (Law 21).
 */

import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { WorldGraph } from '../../../../engine/graph';
import type { GraphNode } from '../../../../types/graph';
import { NarrativeSegments } from '../NarrativeSegments';
import type { NarrativeEntityKind } from '../NarrativeSegments';
import { autoLinkNarrative, collectSupportBundleEntities } from '../narrativeLinker';

afterEach(cleanup);

const GROVE_ID = 'loc.sacred_grove';
const PROSE = 'They came to Sacred Grove at dusk, and Maren Ironhewn was already waiting.';

function makeGraph(): WorldGraph {
  const graph = new WorldGraph();
  const nodes: GraphNode[] = [
    { id: GROVE_ID, type: 'location', name: 'Sacred Grove', properties: { locationSubtype: 'grove' } },
    { id: 'actor.keeper', type: 'actor', name: 'Maren Ironhewn', properties: {} },
  ];
  for (const n of nodes) graph.addNode(n);
  return graph;
}

/** The producer half: bundle → link entries → linked paragraph. */
function buildParagraph() {
  const graph = makeGraph();
  const { linkEntries } = collectSupportBundleEntities(
    graph,
    [
      { kind: 'location', key: 'grove', sublocationTypeId: 'grove' },
      { kind: 'actor', key: 'keeper', supportRole: 'keeper' },
    ],
    [
      { key: 'grove', nodeId: GROVE_ID, kind: 'location', delivery: 'pre-seeded', persistence: 'scene-only', reused: false },
      { key: 'keeper', nodeId: 'actor.keeper', kind: 'actor', delivery: 'pre-seeded', persistence: 'scene-only', reused: false },
    ],
  );
  return autoLinkNarrative('p1', PROSE, linkEntries);
}

function renderWith(openEntity: (id: string | undefined, kind: NarrativeEntityKind | undefined) => (() => void) | undefined) {
  return render(
    <NarrativeSegments
      paragraph={buildParagraph()}
      openEntity={openEntity}
      linkColor="rgb(212, 175, 55)"
      underlineColor="rgb(120, 100, 40)"
      plainColor="rgb(200, 200, 200)"
      testIdPrefix="seg"
    />,
  );
}

describe('THR-1173 — the produced place renders as a link', () => {
  it('the place is a button, is underlined, and routes with kind "location"', () => {
    const routed = vi.fn();
    renderWith((id, kind) => (id === GROVE_ID && kind === 'location' ? () => routed(id, kind) : undefined));

    // The prose still reads as written — linking changed the markup, not the sentence.
    expect(screen.getByText('Sacred Grove')).toBeTruthy();

    const place = screen.getByText('Sacred Grove');
    expect(place.tagName).toBe('BUTTON');
    expect(place.style.borderBottom).not.toBe('');

    fireEvent.click(place);
    expect(routed).toHaveBeenCalledTimes(1);
    expect(routed).toHaveBeenCalledWith(GROVE_ID, 'location');
  });

  it('the cast member alongside it still routes as an agent (absent kind)', () => {
    // Same paragraph, same scan: the change must not have re-kinded people.
    const routed = vi.fn();
    renderWith((id, kind) => (id === 'actor.keeper' && kind === undefined ? () => routed(id) : undefined));

    const keeper = screen.getByText('Maren Ironhewn');
    expect(keeper.tagName).toBe('BUTTON');
    fireEvent.click(keeper);
    expect(routed).toHaveBeenCalledWith('actor.keeper');
  });

  it('NEGATIVE: a host that cannot open a place leaves it as text, not a dead link', () => {
    renderWith(() => undefined);

    const place = screen.getByText('Sacred Grove');
    // A span, not a button, and carrying neither the link role nor a handler.
    expect(place.tagName).toBe('SPAN');
    expect(place.getAttribute('role')).toBeNull();

    // It *does* keep the explain tier — `location.grove` is committed content and
    // resolves without a graph, so the place still says what kind of place it is.
    // That is the intended landing, not a leak: the tier drops from open-the-sheet
    // to explain-itself rather than all the way to inert text.
    expect(place.getAttribute('tabindex')).toBe('0');
  });

  it('NEGATIVE: no stray link — exactly the two named entities are buttons', () => {
    // A producer that stamped a kind onto every segment would still pass the
    // positive cases above and fail here.
    const { container } = renderWith((id) => (id ? () => {} : undefined));

    const buttons = Array.from(container.querySelectorAll('button')).map(b => b.textContent);
    expect(buttons.sort()).toEqual(['Maren Ironhewn', 'Sacred Grove']);
  });
});
