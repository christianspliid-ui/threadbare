// @vitest-environment jsdom
/**
 * THR-1715 — "The First asks", UI half.
 *
 * - The Chapter Ledger's default view and the launcher badge exclude daily life
 *   (routine chores); the Daily-life chip lists them (Law 55).
 * - The attention toggle repaints on click without a tick, reads "Asks you" /
 *   "Lives on", and a refused click says why (Law 47).
 */

import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ChapterLedger, countThreadedChapters, DAILY_LIFE_EMPTY_STATE } from '../ChapterLedger';
import { AutoToggle } from '../ThreadsPanel';
import type { ChapterRecord } from '../../../types/chapterRecord';
import type { GameState } from '../../../types/gameState';
import type { ThreadEdgeProperties } from '../../../types/influence';
import { WorldGraph } from '../../../engine/graph';
import { resolveAttentionMode } from '../../../engine/attentionCadence';
import { toggleAttentionMode } from '../../../engine/encounterVisibility';

function chapter(actionId: string, templateId: string, templateName: string, routine?: boolean): ChapterRecord {
  return {
    actionId,
    templateId,
    templateName,
    ...(routine ? { routine: true } : {}),
    actorId: 'actor-1',
    actorName: 'Thessa',
    targetId: 'loc-1',
    targetName: 'The Ford',
    scale: 'personal' as ChapterRecord['scale'],
    startTick: 1,
    resolvedTick: Number(actionId.replace(/\D/g, '')) || 2,
    resolved: true,
    outcome: 'success',
    threaded: true,
    participants: [],
    openingProse: '',
    steps: [],
  };
}

function makeGameState(archive: readonly ChapterRecord[]): GameState {
  return {
    tick: 20,
    ascendantId: 'asc_1',
    chapterArchive: archive,
    unifiedActions: [],
    graph: { getNode: () => undefined, getIncomingEdges: () => [] },
  } as unknown as GameState;
}

const ARCHIVE = [
  chapter('ua_3', 'encounter.deep_descent', 'The Deep Descent'),
  chapter('ua_4', 'encounter.mend_equipment', 'Mend Equipment', true),
  // An old record with no flag — classified through the template.
  chapter('ua_5', 'encounter.forage_provisions', 'Forage for Provisions'),
];

describe('Chapter Ledger — daily life (THR-1715)', () => {
  it('the badge count excludes routine chapters', () => {
    expect(countThreadedChapters(makeGameState(ARCHIVE))).toBe(1);
  });

  it('the default view lists story only; the Daily-life chip lists the chores', () => {
    render(<ChapterLedger gameState={makeGameState(ARCHIVE)} embedded />);
    expect(screen.queryByText('The Deep Descent')).not.toBeNull();
    expect(screen.queryByText('Mend Equipment')).toBeNull();
    expect(screen.queryByText('Forage for Provisions')).toBeNull();

    fireEvent.click(screen.getByTestId('chapter-ledger-daily-life'));
    expect(screen.queryByText('The Deep Descent')).toBeNull();
    expect(screen.queryByText('Mend Equipment')).not.toBeNull();
    expect(screen.queryByText('Forage for Provisions')).not.toBeNull();
  });

  it('the per-agent ledger offers the same chip, and its empty state is plain', () => {
    render(
      <ChapterLedger
        gameState={makeGameState([chapter('ua_3', 'encounter.deep_descent', 'The Deep Descent')])}
        filterAgentId="actor-1"
        embedded
      />,
    );
    fireEvent.click(screen.getByTestId('chapter-ledger-daily-life'));
    expect(screen.queryByText(DAILY_LIFE_EMPTY_STATE)).not.toBeNull();
  });
});

/** Mirrors GameView's handler: toggle the graph in place, then force a render. */
function ToggleHarness({ graph }: { graph: WorldGraph }) {
  const [, setVersion] = useState(0);
  const mode = resolveAttentionMode(graph.getEdge('thread_1')!.properties as unknown as ThreadEdgeProperties);
  return (
    <AutoToggle
      asking={mode === 'pause'}
      name="Thessa"
      onToggle={() => {
        const result = toggleAttentionMode(graph, 'thread_1', 'asc_1', 5);
        if (!result.ok) return { ok: false, reason: result.reason };
        setVersion(v => v + 1);
        return { ok: true };
      }}
    />
  );
}

function threadGraph(courtPosition: string, tier: number, attentionMode: 'pause' | 'auto_resolve'): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: 'asc_1', type: 'actor', name: 'The God', properties: {} });
  g.addNode({ id: 'agent_1', type: 'actor', name: 'Thessa', properties: {} });
  g.addEdge({
    id: 'thread_1', source: 'asc_1', target: 'agent_1', type: 'thread',
    properties: { courtPosition, tier, attentionMode },
  });
  return g;
}

describe('attention toggle (THR-1715)', () => {
  it('repaints its label on click without a tick', () => {
    render(<ToggleHarness graph={threadGraph('the_first', 1, 'pause')} />);
    const button = screen.getByTestId('attention-toggle');
    expect(button.textContent).toContain('Asks you');
    fireEvent.click(button);
    expect(screen.getByTestId('attention-toggle').textContent).toContain('Lives on');
    fireEvent.click(screen.getByTestId('attention-toggle'));
    expect(screen.getByTestId('attention-toggle').textContent).toContain('Asks you');
  });

  it('a refused click shakes and keeps the true label', () => {
    render(<ToggleHarness graph={threadGraph('retinue', 1, 'auto_resolve')} />);
    fireEvent.click(screen.getByTestId('attention-toggle'));
    const button = screen.getByTestId('attention-toggle');
    expect(button.className).toContain('anim-shake-no');
    expect(button.textContent).toContain('Lives on');
  });
});
