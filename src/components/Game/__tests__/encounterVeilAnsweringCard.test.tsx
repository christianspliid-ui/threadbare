// @vitest-environment jsdom
/**
 * THR-1812 — the veil's answering card.
 *
 * After a commit on a paused clock the veil stays up: it keeps its header and
 * replaces the move with the choice line, why nothing has answered yet, and two
 * controls. Escape is *Back to the map*; the run button takes focus, so Enter
 * (a native button press) is *Let the world turn*.
 */

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { EncounterVeil } from '../EncounterVeil';
import type { EncounterStageModel } from '../encounter-stage/types';
import {
  CHAPTER_ANSWER_BACK_LABEL,
  CHAPTER_ANSWER_RUN_LABEL,
  CHAPTER_ANSWER_WAITS_LINE,
} from '../../../data/nudge-stage-content';

vi.mock('../../../services/narration/useNarration', () => ({
  useNarration: () => ({
    enabled: false, status: 'idle' as const, backendType: null, loadProgress: 0,
    error: null, isSpeaking: false, isLoading: false, isAvailable: false,
    init: vi.fn(), initWorker: vi.fn(), speak: vi.fn(), speakSections: vi.fn(),
    stop: vi.fn(), narrateChronicle: vi.fn(),
  }),
}));

const model: EncounterStageModel = {
  header: {
    title: "The Healer's Oath",
    subtitle: 'A sickness in the lower streets',
    locationLabel: 'Lower Streets',
    threatLabel: 'moderate',
    threadTier: 'strong',
  },
  scene: { situationProse: 'The ward is quiet.', pressureProse: '', noticeLines: [] },
  narrative: {
    paragraphs: [{ id: 'p-0', segments: [{ text: 'Kael kneels by the cot.', emphasis: 'default' }] }],
    references: [],
  },
  cast: [],
  factions: [],
  signals: [],
  choices: [
    { id: 'c1', label: 'Steady Hand', intent: 'Hold the line of the fever.', essenceCost: 1, affordable: true },
  ],
  falloutPreview: [],
  history: [],
  resourceSummary: { quintessence: 12 },
};

function renderVeil(overrides: Partial<React.ComponentProps<typeof EncounterVeil>> = {}) {
  const props = {
    open: true,
    model,
    threadTier: 'strong' as const,
    essence: 12,
    tick: 10,
    autoResolveTick: null as number | null,
    onIntervene: vi.fn(),
    onBoost: vi.fn(),
    onPeek: vi.fn(),
    onDisregard: vi.fn(),
    onMinimize: vi.fn(),
    onAcknowledgeAftermath: vi.fn(),
    onAftermathReaction: vi.fn(),
    answering: { choiceLine: 'Played: Steady Hand, Old Debts.' },
    onLetWorldTurn: vi.fn(),
    onBackToMap: vi.fn(),
    ...overrides,
  };
  render(<EncounterVeil {...props} />);
  return props;
}

describe('THR-1812 — the answering card', () => {
  it('shows the choice line, the waits line and both controls in place of the move', () => {
    renderVeil();

    expect(screen.getByTestId('chapter-answering-card')).toBeInTheDocument();
    expect(screen.getByTestId('chapter-answering-choice')).toHaveTextContent('Played: Steady Hand, Old Debts.');
    expect(screen.getByTestId('chapter-answering-waits')).toHaveTextContent(CHAPTER_ANSWER_WAITS_LINE);
    expect(screen.getByTestId('chapter-answer-run')).toHaveTextContent(CHAPTER_ANSWER_RUN_LABEL);
    expect(screen.getByTestId('chapter-answer-back')).toHaveTextContent(CHAPTER_ANSWER_BACK_LABEL);
    // The move is gone; the header stays.
    expect(screen.queryByTestId('stage-commit')).not.toBeInTheDocument();
    expect(screen.getByTestId('veil-title')).toHaveTextContent("The Healer's Oath");
  });

  it('without `answering` the move renders as before (falsification arm)', () => {
    renderVeil({ answering: undefined });

    expect(screen.queryByTestId('chapter-answering-card')).not.toBeInTheDocument();
    expect(screen.getByTestId('stage-commit')).toBeInTheDocument();
  });

  it('Let the world turn calls onLetWorldTurn and takes focus, so Enter presses it', () => {
    const props = renderVeil();
    const run = screen.getByTestId('chapter-answer-run');

    expect(document.activeElement).toBe(run);
    fireEvent.click(run);
    expect(props.onLetWorldTurn).toHaveBeenCalledTimes(1);
  });

  it('Back to the map calls onBackToMap', () => {
    const props = renderVeil();
    fireEvent.click(screen.getByTestId('chapter-answer-back'));
    expect(props.onBackToMap).toHaveBeenCalledTimes(1);
  });

  it('Escape is Back to the map, not the minimise the attended veil uses', () => {
    const props = renderVeil();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(props.onBackToMap).toHaveBeenCalledTimes(1);
    expect(props.onMinimize).not.toHaveBeenCalled();
  });
});
