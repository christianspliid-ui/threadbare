// @vitest-environment jsdom
/**
 * THR-2055 — Read the Threads printed "Unknown — Resolved successfully" for a
 * chapter the mortal lost, and listed dormant names twice. Rendered rather than
 * unit-checked: the fault was what reached the surface.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ReadTheThreadsPanel } from '../ReadTheThreadsPanel';
import type { DigestEntry } from '../../../types/attention';

afterEach(cleanup);

function makeEntry(overrides: Partial<DigestEntry> = {}): DigestEntry {
  return {
    agentId: 'elara',
    agentName: 'Elara',
    encounterId: 'ua_1',
    encounterName: 'The Tribute Exchange',
    encounterType: 'explore',
    reachPrimary: 'gold',
    tick: 95,
    success: false,
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

function readThreads(buffer: DigestEntry[]): string {
  render(
    <ReadTheThreadsPanel
      open
      onClose={() => {}}
      digestBuffer={buffer}
      currentTick={100}
      essenceAvailable={999}
      onSpendEssence={() => {}}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Read the Threads' }));
  return document.body.textContent ?? '';
}

describe('THR-2055 — Read the Threads tells a lost chapter as lost', () => {
  it('names the mortal and says the chapter faltered', () => {
    const text = readThreads([makeEntry({ outcomeBand: 'failure' })]);
    expect(text).toContain('Elara');
    expect(text).toContain('It faltered.');
    expect(text).not.toContain('Unknown');
    expect(text).not.toContain('Resolved successfully');
  });

  it('a chapter still in play says so instead of claiming a result', () => {
    const text = readThreads([makeEntry({ unresolved: true })]);
    expect(text).toContain('Still unfolding.');
    expect(text).not.toContain('Resolved successfully');
    expect(text).not.toContain('Did not go as planned');
  });

  it('lists each dormant mortal once', () => {
    const text = readThreads([
      makeEntry({ agentId: 'a', agentName: 'Ana', isDormantAgent: true, tick: 96, success: true }),
      makeEntry({ agentId: 'a', agentName: 'Ana', isDormantAgent: true, tick: 97, success: true }),
      makeEntry({ agentId: 'b', agentName: 'Bo', isDormantAgent: true, tick: 98, success: true }),
    ]);
    expect(text.match(/Ana — faint signs of movement/g)).toHaveLength(1);
    expect(text.match(/Bo — faint signs of movement/g)).toHaveLength(1);
  });

  it('two mortals missing the same chapter are both listed', () => {
    const text = readThreads([
      makeEntry({ agentId: 'a', agentName: 'Ana', encounterId: 'tavern_brawl', wasCuratedOut: true, unresolved: true }),
      makeEntry({ agentId: 'b', agentName: 'Bo', encounterId: 'tavern_brawl', wasCuratedOut: true, unresolved: true }),
      makeEntry({ agentId: 'b', agentName: 'Bo', encounterId: 'tavern_brawl', wasCuratedOut: true, unresolved: true, tick: 96 }),
    ]);
    expect(text.match(/Ana — The Tribute Exchange/g)).toHaveLength(1);
    expect(text.match(/Bo — The Tribute Exchange/g)).toHaveLength(1);
  });
});
