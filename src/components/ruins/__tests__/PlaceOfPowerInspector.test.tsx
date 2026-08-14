// @vitest-environment jsdom
/**
 * PlaceOfPowerInspector — the Place of Power panel's player-facing contract.
 *
 * Two tickets are locked in here, and they are different defect classes on the
 * same surface:
 *
 * **THR-1080 — the panel stopped speaking schema.** It had no test at all, which
 * is part of why three raw-value leaks survived in it: a per-tick rate
 * (`2 spirit / tick`), a tick countdown (`7 ticks of grace`), and the raw ruin
 * node id with the raw tick it transformed on (`ruin ruin_7 · tick 44`). Those
 * assertions are anti-regression locks and are carried forward unchanged.
 *
 * **THR-1104 — the panel stopped being a label strip.** THR-1080 cleaned the
 * values *inside* six `label / value` rows and deliberately left the row shape
 * alone; this ticket retired the shape (Law 16). The layout assertion at the
 * bottom of the THR-1080 suite pinned that shape — *"keeps every row a two-cell
 * space-between pair"* — so it is replaced here rather than deleted quietly: the
 * claim it protected (wider wording must not collapse the layout) is now
 * protected by asserting the reading is one flowing paragraph instead.
 *
 * These jsdom render assertions are also the **browser-verify substitution** for
 * THR-1104 (`Browser-verify substitution: jsdom-render — unattended run, no
 * startable dev server`, impediments #546/#574). They therefore cover every face
 * the change produces — held/unclaimed × alive/dormant × known/unknown origin,
 * both marks, and both wrong-kind link guards — plus absence where an element
 * must not render, which a screenshot of one state could not have shown.
 */

import { describe, expect, it, vi } from 'vitest';
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

/**
 * Graph carrying one holder of `pop-1`. `holderType` drives the link guard, and
 * `edgeProps` carries the god's two standing marks.
 */
function makeHeldGraph(
  holderType: string,
  edgeProps: Record<string, unknown> = {},
  nodes: Record<string, string> = {},
): WorldGraph {
  const holderNode = { id: 'agent-1', name: 'Vara Stonewake', type: 'actor', properties: {} };
  return {
    getNodesByType: (type: string) => (type === 'actor' ? [holderNode] : []),
    getOutgoingEdges: (id: string, type: string) =>
      id === 'agent-1' && type === 'holds_place_of_power'
        ? [{ source: 'agent-1', target: 'pop-1', type, properties: { holderType, ...edgeProps } }]
        : [],
    getNode: (id: string) =>
      id === 'agent-1' ? holderNode : nodes[id] ? { id, name: nodes[id] } : undefined,
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
});

describe('PlaceOfPowerInspector — sentences and chips, not a label strip (THR-1104, Law 16)', () => {
  const ALIVE = {
    popEssencePerTick: 2,
    popSphere: 'spirit',
    popStreamDecayCountdown: 7,
    transformedFromRuinId: 'ruin_7',
  };

  it('renders no key:value row — the shape THR-1080 left behind is gone', () => {
    render(
      <PlaceOfPowerInspector location={makeLocation(ALIVE)} graph={makeGraph({ ruin_7: 'Hollowbarrow' })} tick={12} />,
    );
    const block = screen.getByTestId('place-of-power-inspector');
    const labelRows = Array.from(block.querySelectorAll('div')).filter(
      d => (d as HTMLElement).style.justifyContent === 'space-between',
    );
    expect(labelRows, 'no space-between label/value pairs survive').toHaveLength(0);

    // The six row labels were the strip's whole vocabulary. None is a heading now.
    const text = block.textContent ?? '';
    for (const label of ['Holder', 'Stream', 'Decay', 'Origin']) {
      expect(text, `"${label}" no longer renders as a label`).not.toContain(label);
    }
  });

  it('reads as one flowing paragraph — every clause in a single sentence run', () => {
    render(
      <PlaceOfPowerInspector
        location={makeLocation(ALIVE)}
        graph={makeHeldGraph('actor', {}, { ruin_7: 'Hollowbarrow' })}
        tick={12}
      />,
    );
    const reading = screen.getByTestId('pop-reading').textContent ?? '';
    expect(reading).toContain('Vara Stonewake holds this place.');
    expect(reading).toContain('Its stream gives a steady flow of spirit, and fades before long.');
    expect(reading).toContain('It rose from Hollowbarrow.');
  });

  it('stays grammatical when nobody holds the place', () => {
    render(<PlaceOfPowerInspector location={makeLocation(ALIVE)} graph={makeGraph()} tick={12} />);
    const reading = screen.getByTestId('pop-reading').textContent ?? '';
    expect(reading).toContain('No one holds this place.');
    expect(reading).not.toContain('unclaimed');
  });

  it('stays grammatical when the stream is dormant — no dangling "of <sphere>" clause', () => {
    render(
      <PlaceOfPowerInspector
        location={makeLocation({ ...ALIVE, popStreamDead: true })}
        graph={makeHeldGraph('actor', {}, { ruin_7: 'Hollowbarrow' })}
        tick={12}
      />,
    );
    const reading = screen.getByTestId('pop-reading').textContent ?? '';
    expect(reading).toContain('Vara Stonewake holds this place. Its stream lies dormant.');
    expect(reading).not.toContain('gives');
    expect(reading).not.toContain('fades');
    expect(reading).toContain('It rose from Hollowbarrow.');
  });

  it('omits the origin sentence entirely when the place did not rise from a ruin', () => {
    render(
      <PlaceOfPowerInspector
        location={makeLocation({ popEssencePerTick: 2, popSphere: 'spirit', popStreamDecayCountdown: 7 })}
        graph={makeGraph()}
        tick={12}
      />,
    );
    expect(screen.getByTestId('pop-reading').textContent).not.toContain('It rose from');
  });

  it("renders the god's marks as kind-tag chips carrying their own sentence, not rows", () => {
    render(
      <PlaceOfPowerInspector
        location={makeLocation(ALIVE)}
        graph={makeHeldGraph('actor', { corruptMark: true, bargainFavor: true }, { ruin_7: 'Hollowbarrow' })}
        tick={12}
      />,
    );
    const marks = screen.getByTestId('pop-marks').textContent ?? '';
    expect(marks).toContain('Corrupt');
    expect(marks).toContain('the god siphons a share');
    expect(marks).toContain('Bound');
    expect(marks).toContain('the god owes its holder a favor');
  });

  it('renders no mark row at all when the god has no standing mark (Law 25)', () => {
    render(
      <PlaceOfPowerInspector location={makeLocation(ALIVE)} graph={makeHeldGraph('actor')} tick={12} />,
    );
    expect(screen.queryByTestId('pop-marks')).toBeNull();
  });
});

describe('PlaceOfPowerInspector — entity presentation (THR-1104, Laws 1/21/22)', () => {
  const ALIVE = {
    popEssencePerTick: 2,
    popSphere: 'spirit',
    popStreamDecayCountdown: 7,
    transformedFromRuinId: 'ruin_7',
  };

  it('gives the holder its art tile — Law 1 image half', () => {
    render(
      <PlaceOfPowerInspector location={makeLocation(ALIVE)} graph={makeHeldGraph('actor')} tick={12} />,
    );
    expect(screen.getByTestId('pop-holder-art')).toBeTruthy();
  });

  it('renders no art tile when nobody holds the place', () => {
    render(<PlaceOfPowerInspector location={makeLocation(ALIVE)} graph={makeGraph()} tick={12} />);
    expect(screen.queryByTestId('pop-holder-art')).toBeNull();
  });

  it('links a mortal holder to their agent surface — Law 21', () => {
    const onOpenHolder = vi.fn();
    render(
      <PlaceOfPowerInspector
        location={makeLocation(ALIVE)}
        graph={makeHeldGraph('actor')}
        tick={12}
        onOpenHolder={onOpenHolder}
      />,
    );
    const name = screen.getByTestId('pop-open-seg-0');
    expect(name.tagName).toBe('BUTTON');
    name.click();
    expect(onOpenHolder).toHaveBeenCalledWith('agent-1');
  });

  it('does NOT link a god or faction holder — the agent drawer is the wrong kind (Law 21)', () => {
    for (const holderType of ['god', 'faction']) {
      const onOpenHolder = vi.fn();
      const { unmount } = render(
        <PlaceOfPowerInspector
          location={makeLocation(ALIVE)}
          graph={makeHeldGraph(holderType)}
          tick={12}
          onOpenHolder={onOpenHolder}
        />,
      );
      const name = screen.getByTestId('pop-open-seg-0');
      expect(name.tagName, `${holderType} holder is not a link`).not.toBe('BUTTON');
      expect(name.textContent).toContain('Vara Stonewake');
      expect(onOpenHolder).not.toHaveBeenCalled();
      unmount();
    }
  });

  it('falls open to plain text when the host gives it no way to open the holder (Law 21)', () => {
    render(
      <PlaceOfPowerInspector location={makeLocation(ALIVE)} graph={makeHeldGraph('actor')} tick={12} />,
    );
    expect(screen.getByTestId('pop-open-seg-0').tagName).not.toBe('BUTTON');
  });

  it('carries the zoom-to-map affordance for the origin ruin — Law 22', () => {
    const onNavigateToRuin = vi.fn();
    render(
      <PlaceOfPowerInspector
        location={makeLocation(ALIVE)}
        graph={makeGraph({ ruin_7: 'Hollowbarrow' })}
        tick={12}
        onNavigateToRuin={onNavigateToRuin}
      />,
    );
    const eye = screen.getByLabelText('Show Hollowbarrow on the map');
    eye.click();
    expect(onNavigateToRuin).toHaveBeenCalledWith('ruin_7');
  });

  it('renders no eye affordance when the host cannot navigate — a control that does nothing does not render (Law 25)', () => {
    render(
      <PlaceOfPowerInspector
        location={makeLocation(ALIVE)}
        graph={makeGraph({ ruin_7: 'Hollowbarrow' })}
        tick={12}
      />,
    );
    expect(screen.queryByLabelText('Show Hollowbarrow on the map')).toBeNull();
  });

  it('never renders an unresolvable sphere as its raw key — Law 14, NFP #4', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <PlaceOfPowerInspector
        location={makeLocation({ popEssencePerTick: 2, popSphere: 'not_a_sphere', popStreamDecayCountdown: 7 })}
        graph={makeGraph()}
        tick={12}
      />,
    );
    const reading = screen.getByTestId('pop-reading');
    expect(reading.textContent).toContain('of essence');
    expect(reading.textContent).not.toContain('not_a_sphere');
    // No icon either: the sphere vocabulary has nothing to draw for a key it
    // cannot resolve, and a wrong glyph is worse than none (Law 9).
    expect(reading.querySelector('svg')).toBeNull();
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });
});
