// @vitest-environment jsdom
/**
 * THR-1080 — the Place of Power inspector stopped speaking schema.
 *
 * This surface had no test at all, which is part of why three raw-value leaks
 * survived in it: a per-tick rate (`2 spirit / tick`), a tick countdown
 * (`7 ticks of grace`), and the raw ruin node id with the raw tick it
 * transformed on (`ruin ruin_7 · tick 44`).
 *
 * The containment assertions at the bottom exist because this run could not
 * take the contractual pixel capture (impediment #546) and the replacement
 * wording is *wider* than what it replaced — so the layout claim is asserted
 * rather than argued, per THR-1070's rule.
 */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlaceOfPowerInspector } from '../PlaceOfPowerInspector';
import type { GraphNode } from '../../../types/graph';
import type { WorldGraph } from '../../../engine/graph';
import {
  POP_ESSENCE_PER_TICK_MIN,
  POP_ESSENCE_PER_TICK_MAX,
} from '../../../engine/ruins/constants';

function makeLocation(props: Record<string, unknown>): GraphNode {
  return { id: 'pop-1', name: 'The Sunken Chancel', type: 'location', properties: props } as unknown as GraphNode;
}

/** Minimal graph: no holder, and node lookup for the transformed-from lineage. */
function makeGraph(nodes: Record<string, string> = {}): WorldGraph {
  return {
    getNodesByType: () => [],
    getOutgoingEdges: () => [],
    getNode: (id: string) => (nodes[id] ? { id, name: nodes[id] } : undefined),
  } as unknown as WorldGraph;
}

describe('PlaceOfPowerInspector — player-facing language (THR-1080)', () => {
  it('reads the stream strength in words, never a per-tick numeral', () => {
    for (let rate = POP_ESSENCE_PER_TICK_MIN; rate <= POP_ESSENCE_PER_TICK_MAX; rate++) {
      const { container, unmount } = render(
        <PlaceOfPowerInspector
          location={makeLocation({ popEssencePerTick: rate, popSphere: 'spirit', popStreamDecayCountdown: 4 })}
          graph={makeGraph()}
          tick={12}
        />,
      );
      const text = container.textContent ?? '';
      expect(text, `rate ${rate}`).not.toContain('/ tick');
      expect(text, `rate ${rate}`).not.toContain(`${rate} spirit`);
      expect(text).toContain('of spirit');
      unmount();
    }
  });

  it('reads the decay countdown in words, never a tick count', () => {
    const { container } = render(
      <PlaceOfPowerInspector
        location={makeLocation({ popEssencePerTick: 2, popSphere: 'spirit', popStreamDecayCountdown: 7 })}
        graph={makeGraph()}
        tick={12}
      />,
    );
    const text = container.textContent ?? '';
    expect(text).not.toMatch(/\d+\s+ticks? of grace/);
    expect(text).toContain('fades');
  });

  it('names the origin ruin instead of printing its node id and tick', () => {
    const { container } = render(
      <PlaceOfPowerInspector
        location={makeLocation({
          popEssencePerTick: 2,
          popSphere: 'spirit',
          popStreamDecayCountdown: 4,
          transformedFromRuinId: 'ruin_7',
          transformedAtTick: 44,
        })}
        graph={makeGraph({ ruin_7: 'Hollowbarrow' })}
        tick={60}
      />,
    );
    const text = container.textContent ?? '';
    expect(text).toContain('Hollowbarrow');
    expect(text).not.toContain('ruin_7');
    expect(text).not.toContain('44');
  });

  it('fails open to plain English when the origin ruin is no longer in the graph (NFP #4)', () => {
    const { container } = render(
      <PlaceOfPowerInspector
        location={makeLocation({ transformedFromRuinId: 'ruin_gone', popStreamDecayCountdown: 2 })}
        graph={makeGraph()}
        tick={60}
      />,
    );
    const text = container.textContent ?? '';
    expect(text).toContain('a fallen ruin');
    expect(text).not.toContain('ruin_gone');
  });

  it('says dormant rather than banding a dead stream', () => {
    const { container } = render(
      <PlaceOfPowerInspector
        location={makeLocation({ popStreamDead: true, popEssencePerTick: 3 })}
        graph={makeGraph()}
        tick={12}
      />,
    );
    expect(container.textContent).toContain('dormant');
  });

  it('keeps every row a two-cell space-between pair, so wider wording cannot collapse it', () => {
    // The pixel capture is owed (impediment #546); this pins the layout claim
    // the substitution rests on — the replacement strings are longer than the
    // numerals they replace, and each still sits in its own flex cell.
    render(
      <PlaceOfPowerInspector
        location={makeLocation({ popEssencePerTick: 3, popSphere: 'spirit', popStreamDecayCountdown: 9 })}
        graph={makeGraph()}
        tick={12}
      />,
    );
    const block = screen.getByTestId('place-of-power-inspector');
    const rows = Array.from(block.querySelectorAll('div')).filter(
      d => (d as HTMLElement).style.justifyContent === 'space-between',
    );
    expect(rows.length).toBeGreaterThanOrEqual(3);
    for (const row of rows) {
      expect(row.querySelectorAll('span').length, 'label + value cell').toBe(2);
    }
  });
});
