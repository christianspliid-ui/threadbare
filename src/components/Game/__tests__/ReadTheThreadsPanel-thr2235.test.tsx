// @vitest-environment jsdom
/**
 * THR-2235 — a longer look back is always more, not less. Read the Threads fades
 * each chapter by its own age, a faded group still tells one story line, a notable
 * chapter never vanishes, and each window says what it buys. Rendered, because the
 * fault was what reached the surface (the 3-day read showed a tally everywhere).
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { ReadTheThreadsPanel } from '../ReadTheThreadsPanel';
import { WorldGraph } from '../../../engine/graph';
import { tellDigestEntry } from '../../../engine/threadDigest';
import { READ_THREADS_WINDOW_LINES } from '../../../data/view-content';
import type { DigestEntry } from '../../../types/attention';

afterEach(cleanup);

const NOW = 200;

function makeEntry(overrides: Partial<DigestEntry> = {}): DigestEntry {
  return {
    agentId: 'elara',
    agentName: 'Elara',
    encounterId: 'ua_1',
    encounterName: 'The Tribute Exchange',
    encounterType: 'explore',
    reachPrimary: 'gold',
    tick: NOW - 1,
    success: true,
    outcomeBand: 'success',
    significantOutcomes: [],
    capabilityChanges: {},
    attachmentsGained: [],
    attachmentsLost: [],
    quintessenceDelta: 0,
    isNotable: false,
    wasCuratedOut: false,
    isDormantAgent: false,
    sourceType: 'agent',
    ...overrides,
  };
}

/** One buffer spanning the whole 3-day window: fresh, mid-aged and old chapters in two reaches. */
function buffer(): DigestEntry[] {
  return [
    makeEntry({ agentId: 'elara', agentName: 'Elara', encounterId: 'fresh_gold', tick: NOW - 2 }),
    makeEntry({ agentId: 'bram', agentName: 'Bram', encounterId: 'fresh_iron', reachPrimary: 'iron', tick: NOW - 5, success: false, outcomeBand: 'failure' }),
    makeEntry({ agentId: 'elara', agentName: 'Elara', encounterId: 'day_gold', tick: NOW - 10 }),
    makeEntry({ agentId: 'bram', agentName: 'Bram', encounterId: 'mid_iron', reachPrimary: 'iron', tick: NOW - 20 }),
    makeEntry({ agentId: 'corin', agentName: 'Corin', encounterId: 'old_gold', encounterName: 'The Salt Road', tick: NOW - 30, attachmentsGained: ['a merchant\'s favour'] }),
    makeEntry({ agentId: 'elara', agentName: 'Elara', encounterId: 'old_gold_2', tick: NOW - 33, success: false, outcomeBand: 'failure' }),
  ];
}

function graphWith(...names: [string, string][]): WorldGraph {
  const graph = new WorldGraph();
  for (const [id, name] of names) {
    graph.addNode({ id, type: 'actor', name, properties: { actorType: 'individual' } });
  }
  return graph;
}

const GRAPH = graphWith(['elara', 'Elara'], ['bram', 'Bram'], ['corin', 'Corin']);

function read(entries: DigestEntry[], windowLabel: string, opts: { tell?: boolean } = {}) {
  const view = render(
    <ReadTheThreadsPanel
      open
      onClose={() => {}}
      digestBuffer={entries}
      currentTick={NOW}
      essenceAvailable={999}
      onSpendEssence={() => {}}
      tellChapter={opts.tell === false ? undefined : (e, t) => tellDigestEntry(e, GRAPH, t)}
    />,
  );
  fireEvent.click(screen.getByText(windowLabel));
  fireEvent.click(screen.getByRole('button', { name: 'Read the Threads' }));
  const rows = new Map<string, string>();
  for (const row of view.baseElement.querySelectorAll('[data-testid="digest-row"]')) {
    rows.set(row.getAttribute('data-digest-key') ?? '', row.getAttribute('data-fidelity') ?? '');
  }
  return { view, rows };
}

describe('THR-2235 — Read the Threads fades each chapter by its age', () => {
  it('the 3-day read renders every row the half-day read does, at the same tier', () => {
    const half = read(buffer(), 'Half day').rows;
    cleanup();
    const three = read(buffer(), '3 days').rows;
    expect(half.size).toBeGreaterThan(0);
    for (const [key, tier] of half) {
      expect(three.get(key), `row ${key}`).toBe(tier);
    }
    // …and more besides: the older chapters the half day cannot reach.
    expect(three.size).toBeGreaterThan(half.size);
  });

  it('in one 3-day read, this half day is told in full and two and a half days ago sits in its group\'s faded line', () => {
    const { view, rows } = read(buffer(), '3 days');
    expect(rows.get('elara|fresh_gold|198')).toBe('full');
    expect(rows.get('bram|mid_iron|180')).toBe('moderate');
    // The 30-tick-old chapter is no row at all: it is inside the faded group.
    expect(rows.has('corin|old_gold|170')).toBe(false);
    const faded = view.baseElement.querySelector('[data-testid="digest-faded-group"]');
    expect(faded).not.toBeNull();
    expect(faded!.textContent).toContain('Corin');
  });

  it('a faded group leads with a story line naming a mortal, the tally under it', () => {
    const { view } = read(buffer(), '3 days');
    const faded = view.baseElement.querySelector('[data-testid="digest-faded-group"]') as HTMLElement;
    const first = faded.firstElementChild as HTMLElement;
    expect(first.getAttribute('data-testid')).toBe('digest-faded-story');
    // The most significant faded chapter (Corin gained a tie) is the one told.
    expect(first.textContent).toContain('Corin');
    // A story line, not the tally.
    expect(first.textContent).not.toMatch(/\d+ encounters?:/);
    expect(first.textContent).not.toContain('The Salt Road');
    const tally = within(faded).getByTestId('digest-faded-tally');
    expect(tally.textContent).toBe('2 encounters: 1 succeeded, 1 failed.');
  });

  it('without a host teller the story line still names the mortal and how it went', () => {
    const { view } = read(buffer(), '3 days', { tell: false });
    const story = view.baseElement.querySelector('[data-testid="digest-faded-story"]');
    expect(story?.textContent).toContain('Corin');
  });

  it('a notable chapter at the faded age still renders a row', () => {
    const { view, rows } = read(
      [makeEntry({ agentId: 'dara', agentName: 'Dara', encounterId: 'old_notable', tick: NOW - 34, isNotable: true })],
      '3 days',
    );
    expect(rows.get('dara|old_notable|166')).toBe('moderate');
    expect(view.baseElement.textContent).toContain('Notable');
    expect(view.baseElement.textContent).toContain('Dara');
  });

  it('each window says what it buys, under its cost', () => {
    render(
      <ReadTheThreadsPanel open onClose={() => {}} digestBuffer={[]} currentTick={NOW} essenceAvailable={999} onSpendEssence={() => {}} />,
    );
    const lines = screen.getAllByTestId('read-threads-window-line').map(el => el.textContent);
    expect(lines).toEqual(Object.values(READ_THREADS_WINDOW_LINES));
    expect(lines).toHaveLength(4);
    for (const line of lines) expect(line).not.toMatch(/\d/);
  });
});
