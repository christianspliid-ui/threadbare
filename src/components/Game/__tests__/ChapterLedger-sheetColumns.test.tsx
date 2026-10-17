// @vitest-environment jsdom
/**
 * THR-1820 — the Chapter Ledger as an L dialog in SheetColumns: index left,
 * chapter right. Covers the three behaviours the plan's Done-when names:
 *  - the newest row whose record builds is selected on open;
 *  - a click on a row whose record does not build shows the fail-soft line,
 *    never the previous chapter;
 *  - a live row's step label and its chapter agree after the rows recompute
 *    (the selection is the row key, the record is re-derived).
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import type { ChapterRecord } from '../../../types/chapterRecord';
import type { GameState } from '../../../types/gameState';
import { CHAPTER_LEDGER_NO_RECORD } from '../../../data/ui-content';

vi.mock('../../../engine/chapterArchive', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../engine/chapterArchive')>();
  return {
    ...actual,
    isEncounterAction: (templateId: string) => templateId.startsWith('enc.'),
    // A live encounter's record: built from its current step, or null for the broken one.
    buildChapterRecord: (action: { actionId: string; currentStep: number }) =>
      action.actionId === 'ua_broken'
        ? null
        : chapter(action.actionId, `Live chapter at step ${action.currentStep + 1}.`, false),
  };
});

// Imported after the mock is declared (vi.mock is hoisted).
import { ChapterLedger } from '../ChapterLedger';

function chapter(actionId: string, openingProse: string, resolved = true, resolvedTick = 10): ChapterRecord {
  return {
    actionId,
    templateId: 'encounter.deep_descent',
    templateName: `Chapter ${actionId}`,
    actorId: 'actor-1',
    actorName: 'Vara',
    targetId: 'loc-1',
    targetName: 'The Roadside Shrine',
    scale: 'personal' as ChapterRecord['scale'],
    startTick: 1,
    resolvedTick,
    resolved,
    outcome: resolved ? 'success' : undefined,
    threaded: true,
    participants: [],
    openingProse,
    steps: [],
  };
}

function liveAction(actionId: string, currentStep: number) {
  return { actionId, templateId: 'enc.live', actorId: 'actor-1', currentStep, resolved: false, supportBindings: [] };
}

function state(archive: ChapterRecord[], actions: unknown[], tick = 20): GameState {
  return {
    tick,
    chapterArchive: archive,
    unifiedActions: actions,
    graph: { getNode: () => ({ name: 'Vara' }), getIncomingEdges: () => [] },
  } as unknown as GameState;
}

function chapterColumn(): HTMLElement {
  return screen.getByTestId('chapter-ledger-chapter');
}

describe('ChapterLedger at L (THR-1820)', () => {
  it('renders in SheetColumns inside an L dialog', () => {
    render(<ChapterLedger gameState={state([chapter('ua_old', 'Old prose.')], [])} filterAgentId="actor-1" onClose={() => {}} />);
    expect(document.querySelector('[data-dialog-size]')?.getAttribute('data-dialog-size')).toBe('l');
    expect(screen.getByTestId('sheet-columns').getAttribute('data-layout')).toBe('two');
  });

  it('selects the newest buildable row on open, skipping one with no record', () => {
    const gs = state(
      [chapter('ua_old', 'Old prose.', true, 5), chapter('ua_new', 'New prose.', true, 12)],
      [liveAction('ua_broken', 0)], // newest (sorts at the current tick) but has no record
    );
    render(<ChapterLedger gameState={gs} filterAgentId="actor-1" onClose={() => {}} />);
    expect(within(chapterColumn()).getByText('New prose.')).toBeTruthy();
    const selected = screen.getAllByTestId('chapter-ledger-row').filter((r) => r.getAttribute('data-selected') === 'true');
    expect(selected).toHaveLength(1);
    expect(selected[0].textContent).toContain('Chapter ua_new');
  });

  it('a click on a row with no record shows the fail-soft line, not the previous chapter', () => {
    const gs = state([chapter('ua_new', 'New prose.', true, 12)], [liveAction('ua_broken', 0)]);
    render(<ChapterLedger gameState={gs} filterAgentId="actor-1" onClose={() => {}} />);
    const brokenRow = screen.getAllByTestId('chapter-ledger-row').find((r) => r.textContent?.includes('active · step 1'));
    fireEvent.click(brokenRow!);
    expect(brokenRow!.getAttribute('data-selected')).toBe('true');
    expect(within(chapterColumn()).getByText(CHAPTER_LEDGER_NO_RECORD)).toBeTruthy();
    expect(within(chapterColumn()).queryByText('New prose.')).toBeNull();
  });

  it("keeps a live row's step label and its chapter in agreement after the rows recompute", () => {
    const { rerender } = render(
      <ChapterLedger gameState={state([], [liveAction('ua_live', 1)])} filterAgentId="actor-1" onClose={() => {}} />,
    );
    expect(screen.getByText(/active · step 2/)).toBeTruthy();
    expect(within(chapterColumn()).getByText('Live chapter at step 2.')).toBeTruthy();

    rerender(<ChapterLedger gameState={state([], [liveAction('ua_live', 2)], 21)} filterAgentId="actor-1" onClose={() => {}} />);
    expect(screen.getByText(/active · step 3/)).toBeTruthy();
    expect(within(chapterColumn()).getByText('Live chapter at step 3.')).toBeTruthy();
  });

  it('hides Back in the two-column layout and renders no chapter column with no chapters', () => {
    const { unmount } = render(<ChapterLedger gameState={state([chapter('ua_a', 'A.')], [])} filterAgentId="actor-1" onClose={() => {}} />);
    expect(within(chapterColumn()).queryByRole('button', { name: /all chapters|back/i })).toBeNull();
    unmount();
    render(<ChapterLedger gameState={state([], [])} filterAgentId="actor-1" onClose={() => {}} />);
    expect(screen.queryByTestId('sheet-columns')).toBeNull();
    expect(screen.queryByTestId('chapter-ledger-chapter')).toBeNull();
  });

  it('embedded mode keeps the one-column list → chapter → Back flow', () => {
    render(<ChapterLedger gameState={state([chapter('ua_a', 'A prose.')], [])} filterAgentId="actor-1" embedded />);
    expect(screen.queryByText('A prose.')).toBeNull();
    fireEvent.click(screen.getByTestId('chapter-ledger-row'));
    expect(screen.getByText('A prose.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /all chapters|back/i }));
    expect(screen.getByTestId('chapter-ledger-row')).toBeTruthy();
  });
});
