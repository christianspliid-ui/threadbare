// @vitest-environment jsdom
/**
 * THR-1976 — an authored chapter step answers its Play button, once.
 *
 * Cold playtest round 4: on "The Page Beneath the Saint" the Play button took
 * the choice and nothing moved. The veil was wired to `handleEncounterIntervene`
 * — charge, record, resolve the notification — which never closes the veil, so
 * the open veil kept holding the clock and the step could not resolve. A free
 * choice looked dead; every press of a paid one charged again.
 *
 * GameView is too heavy to mount, so this file pins two things:
 *  1. the wiring at the source (the THR-1803 pattern): the veil commits through
 *     `handleEncounterCommitAndContinue`, which claims the step once, then
 *     shows the answering card or closes the veil;
 *  2. the behaviour through the real veil and the real guard, in a harness
 *     that does what that handler does: a free choice answers on screen, and a
 *     paid choice pressed twice charges once.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { useRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { EncounterVeil } from '../EncounterVeil';
import type { EncounterStageModel } from '../encounter-stage/types';
import {
  claimAuthoredChoiceCommit,
  isAuthoredChoiceStepCommitted,
} from '../encounter-stage/authoredChoiceCommitGuard';

vi.mock('../../../services/narration/useNarration', () => ({
  useNarration: () => ({
    enabled: false, status: 'idle' as const, backendType: null, loadProgress: 0,
    error: null, isSpeaking: false, isLoading: false, isAvailable: false,
    init: vi.fn(), initWorker: vi.fn(), speak: vi.fn(), speakSections: vi.fn(),
    stop: vi.fn(), narrateChronicle: vi.fn(),
  }),
}));

const GAME_VIEW = readFileSync(resolve(__dirname, '../GameView.tsx'), 'utf8');
const STAGE_HOST = readFileSync(resolve(__dirname, '../hosts/StageHost.tsx'), 'utf8');

function mountOf(source: string, tag: string): string {
  const start = source.indexOf(tag);
  expect(start).toBeGreaterThan(-1);
  return source.slice(start, source.indexOf('/>', start));
}

function bodyOf(source: string, declaration: string): string {
  const start = source.indexOf(declaration);
  expect(start).toBeGreaterThan(-1);
  // The handler ends at its useCallback dependency list.
  return source.slice(start, source.indexOf('\n  }, [', start));
}

const model: EncounterStageModel = {
  header: {
    title: 'The Page Beneath the Saint',
    subtitle: 'A page that should not exist',
    locationLabel: 'The Archive',
    threatLabel: 'moderate',
    threadTier: 'strong',
  },
  scene: { situationProse: 'The archive is cold.', pressureProse: '', noticeLines: [] },
  narrative: {
    paragraphs: [{ id: 'p-0', segments: [{ text: 'Elara holds the page.', emphasis: 'default' }] }],
    references: [],
  },
  cast: [],
  factions: [],
  signals: [],
  choices: [
    { id: 'give-nothing', label: 'Give them nothing', intent: 'Let her stand alone.', essenceCost: 0, affordable: true },
    { id: 'lend-strength', label: 'Lend strength', intent: 'Steady her hand.', essenceCost: 2, affordable: true },
  ],
  falloutPreview: [],
  history: [],
  resourceSummary: { quintessence: 12 },
};

/**
 * What `handleEncounterCommitAndContinue` does, minus GameView: claim the
 * step, charge, record, then the answering card (paused clock) or the close
 * (running clock).
 */
function Harness({ clockPaused, onCharge }: { clockPaused: boolean; onCharge: (cost: number, id: string) => void }) {
  const committed = useRef(new Set<string>());
  const [open, setOpen] = useState(true);
  const [answering, setAnswering] = useState<{ choiceLine: string } | null>(null);
  const commitAndContinue = (choiceId: string, cost: number) => {
    if (!claimAuthoredChoiceCommit('notif-step-1', committed.current).claimed) return;
    onCharge(cost, choiceId);
    if (clockPaused) {
      setAnswering({ choiceLine: `Chose: ${model.choices.find(c => c.id === choiceId)?.label}` });
      return;
    }
    setOpen(false);
  };
  if (!open) return <div data-testid="veil-closed" />;
  return (
    <EncounterVeil
      open
      model={model}
      threadTier="strong"
      essence={12}
      tick={10}
      autoResolveTick={null}
      onIntervene={commitAndContinue}
      onBoost={vi.fn()}
      onPeek={vi.fn()}
      onDisregard={vi.fn()}
      onMinimize={vi.fn()}
      onAcknowledgeAftermath={vi.fn()}
      onAftermathReaction={vi.fn()}
      answering={answering ?? undefined}
      onLetWorldTurn={vi.fn()}
      onBackToMap={vi.fn()}
    />
  );
}

describe('THR-1976 — the veil commits through the handler that answers', () => {
  it('StageHost hands the veil handleEncounterCommitAndContinue, never the bare commit', () => {
    const veil = mountOf(STAGE_HOST, '<EncounterVeil');
    expect(veil).toMatch(/\n\s*onIntervene=\{handleEncounterCommitAndContinue\}/);
    expect(STAGE_HOST).not.toMatch(/onIntervene=\{handleEncounterIntervene\}/);
    const host = mountOf(GAME_VIEW, '<StageHost');
    expect(host).toMatch(/\n\s*handleEncounterCommitAndContinue=\{handleEncounterCommitAndContinue\}/);
    expect(host).not.toMatch(/handleEncounterIntervene=/);
  });

  it('the handler claims the step once, then answers on screen or closes', () => {
    const body = bodyOf(GAME_VIEW, 'const handleEncounterCommitAndContinue = useCallback(');
    const claim = body.indexOf('claimAuthoredChoiceCommit(');
    const charge = body.indexOf('handleEncounterIntervene(choiceId, essenceSpent)');
    expect(claim).toBeGreaterThan(-1);
    expect(charge).toBeGreaterThan(claim);
    // A rejected spend frees the step so a cheaper option can still be played.
    expect(body).toMatch(/commit\.release\(\)/);
    expect(body).toMatch(/keepChapterOnScreenAfterCommit\(/);
    expect(body).toMatch(/setTieredEncounterState\(null\)/);
  });
});

describe('THR-1976 — the Play button answers, once', () => {
  it('a free choice on a paused clock shows the answering card without Escape', () => {
    const onCharge = vi.fn();
    render(<Harness clockPaused onCharge={onCharge} />);

    fireEvent.click(screen.getAllByTestId('veil-choice')[0]);
    fireEvent.click(screen.getByTestId('stage-commit'));

    expect(onCharge).toHaveBeenCalledTimes(1);
    expect(onCharge).toHaveBeenCalledWith(0, 'give-nothing');
    expect(screen.getByTestId('chapter-answering-card')).toBeInTheDocument();
    expect(screen.getByTestId('chapter-answering-choice')).toHaveTextContent('Give them nothing');
    // The Play button is gone, so it cannot be pressed again.
    expect(screen.queryByTestId('stage-commit')).not.toBeInTheDocument();
  });

  it('a free choice on a running clock closes the veil onto the world', () => {
    const onCharge = vi.fn();
    render(<Harness clockPaused={false} onCharge={onCharge} />);

    fireEvent.click(screen.getAllByTestId('veil-choice')[0]);
    fireEvent.click(screen.getByTestId('stage-commit'));

    expect(onCharge).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('veil-closed')).toBeInTheDocument();
  });

  it('a paid choice pressed twice in one frame charges once and keeps the first choice', () => {
    const committed = new Set<string>();
    const charges: Array<[string, number]> = [];
    const press = (id: string, cost: number) => {
      if (!claimAuthoredChoiceCommit('notif-step-1', committed).claimed) return;
      charges.push([id, cost]);
    };
    // Both presses land before React re-renders the veil.
    press('lend-strength', 2);
    press('lend-strength', 2);
    press('give-nothing', 0);
    expect(charges).toEqual([['lend-strength', 2]]);
    expect(isAuthoredChoiceStepCommitted('notif-step-1', committed)).toBe(true);
  });

  it('a rejected commit releases the step for another option', () => {
    const committed = new Set<string>();
    const first = claimAuthoredChoiceCommit('notif-step-1', committed);
    expect(first.claimed).toBe(true);
    first.release(); // the pool could not pay
    expect(isAuthoredChoiceStepCommitted('notif-step-1', committed)).toBe(false);
    expect(claimAuthoredChoiceCommit('notif-step-1', committed).claimed).toBe(true);
  });

  it('each step has its own notification, so the next step is not blocked', () => {
    const committed = new Set<string>(['notif-step-1']);
    expect(claimAuthoredChoiceCommit('notif-step-2', committed).claimed).toBe(true);
  });
});
