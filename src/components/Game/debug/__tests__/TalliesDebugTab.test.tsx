// @vitest-environment jsdom
/**
 * THR-1140 — the designer readout for reputation tallies.
 *
 * These assertions are deliberately about what a designer can *read off the
 * surface*: the resolved words, the raw value Law 13 permits in the designer
 * view, the trait rung, and the movement band. They are the evidence that
 * THR-1136 §5's preserved inspectability is real rather than notional.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TalliesDebugTab } from '../TalliesDebugTab';
import { WorldGraph } from '../../../../engine/graph';
import type { TraceEntry } from '../../../../types/trace';
import {
  REPUTATION_LEVEL_1_THRESHOLD,
  REPUTATION_LEVEL_2_THRESHOLD,
} from '../../../../data/agent-behavior-constants';

/**
 * The real actor shape: `name` is a top-level `GraphNode` field, and the tallies
 * live in `properties`. Verified against a live world (seed 42, tick 60) — an
 * actor's `properties` carries `templateName`/`cultureIdentity` and **no**
 * `name`, so a fixture that put the name in `properties` would have verified a
 * shape the engine never produces.
 */
function graphWith(tallies: Record<string, number>, actorId = 'actor-1', name = 'Vara'): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: actorId,
    type: 'actor',
    name,
    properties: { reputationTallies: { ...tallies } },
  } as unknown as Parameters<WorldGraph['addNode']>[0]);
  return graph;
}

function incrementTrace(tallyValue: number, overrides: Record<string, unknown> = {}): TraceEntry {
  return {
    tick: 1,
    category: 'reputation_trait',
    agentId: 'actor-1',
    reach: 'star',
    polarity: 'positive',
    action: 'tally_increment',
    tallyValue,
    summary: 'tally',
    ...overrides,
  } as unknown as TraceEntry;
}

describe('TalliesDebugTab', () => {
  it('renders the empty state when no actor carries a tally', () => {
    render(<TalliesDebugTab graph={new WorldGraph()} traces={[]} />);
    expect(screen.getByText('No reputation tallies accumulated yet.')).toBeTruthy();
  });

  it('fails soft with no graph rather than throwing (NFP #4)', () => {
    render(<TalliesDebugTab graph={undefined} traces={[]} />);
    expect(screen.getByText('No world graph connected.')).toBeTruthy();
  });

  it('resolves the tally key into words — the vocabulary this surface exists to consume', () => {
    render(<TalliesDebugTab graph={graphWith({ 'star.positive': 2 })} traces={[]} />);
    // Law 14's key→words rule, via describeTallyKey.
    expect(screen.getByText('reputation for Star')).toBeTruthy();
  });

  it('resolves a negative-polarity key to its own phrase, not a shared one', () => {
    render(<TalliesDebugTab graph={graphWith({ 'iron.negative': 2 })} traces={[]} />);
    expect(screen.getByText('ill repute in Iron')).toBeTruthy();
  });

  it('shows the raw value and the key beside the words — the designer view Law 13 allows', () => {
    render(<TalliesDebugTab graph={graphWith({ 'star.positive': 2 })} traces={[]} />);
    expect(screen.getByText('2.00')).toBeTruthy();
    expect(screen.getByText('star.positive')).toBeTruthy();
  });

  it('names the trait rung once the tally crosses its threshold', () => {
    render(<TalliesDebugTab graph={graphWith({ 'star.positive': REPUTATION_LEVEL_1_THRESHOLD })} traces={[]} />);
    expect(screen.getByText('Whispered (L1)')).toBeTruthy();
  });

  it('shows no rung below the first threshold, and reports the gap to it', () => {
    // Literal 1 rather than the constant on both sides (the tautology trap):
    // 1 is below 3, so the surface must say "2.00 to Whispered".
    render(<TalliesDebugTab graph={graphWith({ 'star.positive': 1 })} traces={[]} />);
    expect(screen.queryByText(/Whispered \(L1\)/)).toBeNull();
    expect(screen.getByText('2.00 to Whispered')).toBeTruthy();
  });

  it('reports the gap to the next rung while a lower rung is held', () => {
    render(<TalliesDebugTab graph={graphWith({ 'star.positive': REPUTATION_LEVEL_1_THRESHOLD })} traces={[]} />);
    const gap = REPUTATION_LEVEL_2_THRESHOLD - REPUTATION_LEVEL_1_THRESHOLD;
    expect(screen.getByText(`${gap.toFixed(2)} to Known`)).toBeTruthy();
  });

  it('bands observed movement with the tally ladder', () => {
    // 1 → 5 is a movement of 4, which TALLY_MAGNITUDE_BANDS calls "markedly".
    const traces = [incrementTrace(1), incrementTrace(5)];
    render(<TalliesDebugTab graph={graphWith({ 'star.positive': 5 })} traces={traces} />);
    expect(screen.getByText(/rose markedly/)).toBeTruthy();
  });

  it('reports no movement from a single increment rather than inventing a zero delta', () => {
    // One sample proves the tally moved but not by how much; banding 0 would
    // print "rose again" for every freshly-touched tally.
    render(<TalliesDebugTab graph={graphWith({ 'star.positive': 5 })} traces={[incrementTrace(5)]} />);
    expect(screen.queryByText(/rose /)).toBeNull();
    expect(screen.getByText('1 increment in window')).toBeTruthy();
  });

  it('ignores increments belonging to a different agent', () => {
    const traces = [
      incrementTrace(1, { agentId: 'someone-else' }),
      incrementTrace(9, { agentId: 'someone-else' }),
    ];
    render(<TalliesDebugTab graph={graphWith({ 'star.positive': 5 })} traces={traces} />);
    expect(screen.queryByText(/rose /)).toBeNull();
  });

  it('ignores non-increment reputation actions when computing movement', () => {
    const traces = [
      incrementTrace(1, { action: 'trait_assigned' }),
      incrementTrace(9, { action: 'trait_reinforced' }),
    ];
    render(<TalliesDebugTab graph={graphWith({ 'star.positive': 5 })} traces={traces} />);
    expect(screen.queryByText(/rose /)).toBeNull();
  });

  it('names the actor and omits actors carrying no tally', () => {
    const graph = graphWith({ 'star.positive': 2 });
    graph.addNode({
      id: 'actor-2',
      type: 'actor',
      name: 'Silent One',
      properties: {},
    } as unknown as Parameters<WorldGraph['addNode']>[0]);

    render(<TalliesDebugTab graph={graph} traces={[]} />);
    expect(screen.getByText(/Vara/)).toBeTruthy();
    expect(screen.queryByText(/Silent One/)).toBeNull();
  });

  it('reads the name off the node, not off properties (the live-world shape)', () => {
    // Regression lock: the first cut of this tab read `properties.name`, which
    // no generated actor has — every row rendered "(unresolved)". A fixture
    // carrying the name in `properties` would have passed that broken code.
    const graph = new WorldGraph();
    graph.addNode({
      id: 'actor-live',
      type: 'actor',
      name: 'Hadrik',
      properties: { templateName: 'wandering-smith', reputationTallies: { 'iron.positive': 2 } },
    } as unknown as Parameters<WorldGraph['addNode']>[0]);

    render(<TalliesDebugTab graph={graph} traces={[]} />);
    expect(screen.getByText(/Hadrik/)).toBeTruthy();
    expect(screen.queryByText(/unnamed/)).toBeNull();
  });

  it('falls back to a designed label, never a blank, when a node has no name', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'actor-abcdefgh',
      type: 'actor',
      name: '',
      properties: { reputationTallies: { 'iron.positive': 2 } },
    } as unknown as Parameters<WorldGraph['addNode']>[0]);

    render(<TalliesDebugTab graph={graph} traces={[]} />);
    expect(screen.getByText(/abcdefgh \(unnamed\)/)).toBeTruthy();
  });

  it('drops a zeroed tally — a decayed key is not a standing', () => {
    render(<TalliesDebugTab graph={graphWith({ 'star.positive': 0 })} traces={[]} />);
    expect(screen.getByText('No reputation tallies accumulated yet.')).toBeTruthy();
  });

  it('says so plainly when the followed agent carries no tally', () => {
    render(
      <TalliesDebugTab graph={graphWith({ 'star.positive': 2 })} traces={[]} focusedAgentId="actor-missing" />,
    );
    expect(screen.getByText('No tallies on the followed agent.')).toBeTruthy();
  });

  it('renders the followed agent alongside the rest of the world', () => {
    render(
      <TalliesDebugTab graph={graphWith({ 'star.positive': 2 })} traces={[]} focusedAgentId="actor-1" />,
    );
    expect(screen.getByText('reputation for Star')).toBeTruthy();
    expect(screen.queryByText('No tallies on the followed agent.')).toBeNull();
  });
});
