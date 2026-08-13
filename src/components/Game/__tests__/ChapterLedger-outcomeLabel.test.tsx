// @vitest-environment jsdom
/**
 * THR-1035 — the Chapter Ledger row's outcome label.
 *
 * The reported defect was one template literal: `resolved · ${r.outcome ?? 'unknown'}`,
 * which put `success_at_cost` verbatim on the ledger row while the chapter's own
 * detail header — one click away — said "won, at a price" about the same record.
 *
 * These tests **render the component** rather than only calling the label
 * function. The bug was about what reached the surface, so evidence that stops
 * at the pure function would not have caught a row that computed the right
 * string and then displayed something else. That matters more than usual here:
 * this ticket shipped from an unattended run where no dev server (and so no
 * contractual 1920×1080 capture) was available — impediment #546 — so the
 * rendered DOM is the substituted evidence.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChapterLedger, resolvedStatusLabel } from '../ChapterLedger';
import type { ChapterRecord } from '../../../types/chapterRecord';
import type { GameState } from '../../../types/gameState';
import type { UnifiedActionOutcome } from '../../../types/unifiedAction';

const ALL_OUTCOMES: readonly UnifiedActionOutcome[] = [
  'success', 'failure', 'contested_won', 'contested_lost',
  'critical_success', 'critical_failure', 'success_at_cost',
];

function makeChapter(outcome?: UnifiedActionOutcome): ChapterRecord {
  return {
    actionId: 'ua_1',
    templateId: 'encounter.shrine_offering',
    templateName: 'Leave a Shrine Offering',
    actorId: 'actor-1',
    actorName: 'Vara',
    targetId: 'loc-1',
    targetName: 'The Roadside Shrine',
    scale: 'personal' as ChapterRecord['scale'],
    startTick: 8,
    resolvedTick: 12,
    resolved: true,
    outcome,
    threaded: true,
    participants: [],
    openingProse: 'The shrine stood where the road bent.',
    steps: [],
  };
}

/**
 * Only the fields the ledger actually reads. `filterAgentId` is passed to the
 * component so the default threaded-only filter is bypassed, which keeps this
 * fixture from needing an ascendant and a thread edge to prove a string.
 */
function makeGameState(archive: readonly ChapterRecord[]): GameState {
  return {
    tick: 20,
    chapterArchive: archive,
    unifiedActions: [],
    graph: { getNode: () => undefined, getIncomingEdges: () => [] },
  } as unknown as GameState;
}

describe('ChapterLedger outcome label (THR-1035)', () => {
  it('renders the reported case as prose, not the raw key', () => {
    render(
      <ChapterLedger
        gameState={makeGameState([makeChapter('success_at_cost')])}
        filterAgentId="actor-1"
        embedded
        onClose={() => {}}
      />,
    );

    // The exact string from the bug report was "Vara · resolved · success_at_cost".
    expect(screen.getByText(/resolved · won, at a price/)).toBeTruthy();
    expect(screen.queryByText(/success_at_cost/)).toBeNull();
  });

  it('leaks no raw key for any band in the union', () => {
    expect(ALL_OUTCOMES).toHaveLength(7);

    for (const outcome of ALL_OUTCOMES) {
      const { container, unmount } = render(
        <ChapterLedger
          gameState={makeGameState([makeChapter(outcome)])}
          filterAgentId="actor-1"
          embedded
          onClose={() => {}}
        />,
      );
      const text = container.textContent ?? '';
      expect(text, `band '${outcome}' reached the DOM`).not.toContain(outcome);
      expect(text, `band '${outcome}' left an underscore in the DOM`).not.toMatch(/\w_\w/);
      unmount();
    }
  });

  it('says only "resolved" when an archived chapter carries no outcome', () => {
    // The old code answered this with "resolved · unknown" — a word for a
    // question nobody asked. Absence is a real state.
    const { container } = render(
      <ChapterLedger
        gameState={makeGameState([makeChapter(undefined)])}
        filterAgentId="actor-1"
        embedded
        onClose={() => {}}
      />,
    );
    expect(container.textContent).toContain('resolved');
    expect(container.textContent).not.toContain('unknown');
  });

  it('humanises an unrecognised band rather than leaking it', () => {
    expect(resolvedStatusLabel('pyrrhic_reversal')).toBe('resolved · pyrrhic reversal');
  });
});
