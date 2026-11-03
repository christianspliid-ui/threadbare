// @vitest-environment jsdom
/**
 * THR-2151 — the answer comes here. On a running clock a committed chapter step
 * stays on the Stage as the live answering card, the world turns underneath it,
 * and the step's answer opens in the same place, before a premonition that became
 * ready meanwhile.
 *
 * GameView is too heavy to mount (the THR-1976 pattern), so this file pins:
 *  1. the wiring at the source — the commit shows the live card on a running clock,
 *     the scan and the premonition stand down while it waits, the registry sees it,
 *     and the Stage renders both kinds from the one `encounter` slot;
 *  2. the behaviour, through the real hook, the real auto-pause, the real registry
 *     and the real veil, in a harness that wires them as GameView does.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { useEffect, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { EncounterVeil } from '../EncounterVeil';
import type { EncounterStageModel } from '../encounter-stage/types';
import { useChapterAnswerRun, type ChapterAnswerRunHandle } from '../hooks/useChapterAnswerRun';
import { useInterruptAutoPause } from '../hooks/useInterruptAutoPause';
import { resolveInterrupts, type InterruptResolution, type InterruptSnapshot } from '../interruptRegistry';
import { STAGE_HOST_KINDS } from '../hosts/hostKinds';
import { CHAPTER_ANSWER_LIVE_WAITS_LINE } from '../../../data/nudge-stage-content';
import type { UnifiedAction } from '../../../types/unifiedAction';
import type { EncounterNotification } from '../../../types/encounterVisibility';

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

function bodyOf(source: string, declaration: string): string {
  const start = source.indexOf(declaration);
  expect(start).toBeGreaterThan(-1);
  return source.slice(start, source.indexOf('\n  }, [', start));
}

const ACTION_ID = 'ua_ward_inspection';

function baseModel(history: EncounterStageModel['history']): EncounterStageModel {
  return {
    header: {
      title: 'Ward Inspection',
      subtitle: 'The tower wards',
      locationLabel: 'The Arcane Circle',
      threatLabel: 'moderate',
      threadTier: 'strong',
    },
    scene: { situationProse: 'The wards hum.', pressureProse: '', noticeLines: [] },
    narrative: {
      paragraphs: [{ id: 'p-0', segments: [{ text: 'Elara walks the wards.', emphasis: 'default' }] }],
      references: [],
    },
    cast: [],
    factions: [],
    signals: [],
    choices: [
      { id: 'boost', label: 'Boost', intent: 'Steady her hand.', essenceCost: 0, affordable: true },
    ],
    falloutPreview: [],
    history,
    resourceSummary: { quintessence: 12 },
  };
}

const STEP0 = baseModel([]);
// Step 1 opens on THR-2052's answer to step 0: "Step 1 held. You: Boost."
const STEP1 = baseModel([
  { status: 'resolved', outcomeWord: 'held', choiceText: 'Boost' },
  { status: 'current' },
] as unknown as EncounterStageModel['history']);

function notif(id: string, extra: Partial<EncounterNotification> = {}): EncounterNotification {
  return { id, actionId: ACTION_ID, resolved: false, autoResolveTick: null, ...extra } as unknown as EncounterNotification;
}

interface World {
  tick: number;
  actions: UnifiedAction[];
  notifications: EncounterNotification[];
  premonitionReady: boolean;
}

interface Probe {
  running: boolean;
  resolution: InterruptResolution;
  answer: ChapterAnswerRunHandle;
  premonitionShown: boolean;
  openNotificationId: string | null;
  /** The player reads the open beat and closes it. */
  close: () => void;
}

/**
 * GameView's wiring in miniature: the veil's notification, the lifted "live answer
 * pending" flag, the premonition deferral, the registry, the auto-pause, the hook.
 */
function Harness({ world, probe }: { world: World; probe: { current: Probe | null } }) {
  const [running, setRunning] = useState(true);
  const [veilFor, setVeilFor] = useState<string | null>('n_step0');
  const [liveAnswerPending, setLiveAnswerPending] = useState(false);
  const activePremonition = liveAnswerPending ? false : world.premonitionReady;
  const snapshot = {
    interruptsSuppressed: false,
    encounterOpen: veilFor !== null,
    encounterAnsweringLive: liveAnswerPending,
    premonitionPending: activePremonition,
  } as unknown as InterruptSnapshot;
  const resolution = resolveInterrupts(snapshot);
  const hold = useInterruptAutoPause({ interruptOpen: resolution.anyOpen, running, setRunning });
  const answer = useChapterAnswerRun({
    unifiedActions: world.actions,
    encounterNotifications: world.notifications,
    tick: world.tick,
    running,
    veilOpen: veilFor !== null,
    heldRunning: hold.heldRunning,
    hold,
    setRunning,
    pushToast: vi.fn(),
    openAnswer: (id) => { setVeilFor(id); return true; },
    closeVeil: () => setVeilFor(null),
    premonitionReady: world.premonitionReady,
  });
  const live = answer.record?.phase === 'answering_live';
  useEffect(() => { setLiveAnswerPending(live); }, [live]);
  probe.current = { running, resolution, answer, premonitionShown: resolution.rendering.includes('premonition'), openNotificationId: veilFor, close: () => setVeilFor(null) };

  const veilRenders = resolution.rendering.includes('encounter') || resolution.rendering.includes('encounter-answering');
  return (
    <div>
      {veilRenders && veilFor && (
        <EncounterVeil
          open
          model={veilFor === 'n_step0' ? STEP0 : STEP1}
          threadTier="strong"
          essence={12}
          tick={world.tick}
          autoResolveTick={null}
          onIntervene={() => {
            // handleEncounterCommitAndContinue → keepChapterOnScreenAfterCommit: the
            // hold was recorded "running", so the live card.
            answer.showLiveCard({
              actionId: ACTION_ID, stepIndex: 0, notificationId: 'n_step0',
              chapterName: 'Ward Inspection', choiceLine: 'Played: Boost.',
            });
          }}
          onBoost={vi.fn()}
          onPeek={vi.fn()}
          onDisregard={vi.fn()}
          onMinimize={vi.fn()}
          onAcknowledgeAftermath={() => setVeilFor(null)}
          onAftermathReaction={vi.fn()}
          answering={answer.answering ?? undefined}
          onLetWorldTurn={vi.fn()}
          onBackToMap={() => { answer.backToMap(); setVeilFor(null); }}
        />
      )}
      {resolution.rendering.includes('premonition') && <div data-testid="premonition-shown" />}
    </div>
  );
}

const STEP0_WORLD: World = { tick: 100, actions: [{ actionId: ACTION_ID, currentStep: 0, resolved: false } as unknown as UnifiedAction], notifications: [notif('n_step0', { stepIndex: 0 })], premonitionReady: false };

function commitOnRunningClock(world: World = STEP0_WORLD) {
  const probe: { current: Probe | null } = { current: null };
  const view = render(<Harness world={world} probe={probe} />);
  // The veil is up and holds the clock, which was running.
  expect(probe.current!.resolution.open).toContain('EncounterVeil');
  fireEvent.click(screen.getAllByTestId('veil-choice')[0]);
  fireEvent.click(screen.getByTestId('stage-commit'));
  return { ...view, probe };
}

describe('THR-2151 — the wiring at the source', () => {
  it('a running-clock commit shows the live card; a paused one keeps THR-1812', () => {
    const body = bodyOf(GAME_VIEW, 'const keepChapterOnScreenAfterCommit = useCallback(');
    expect(body).toMatch(/if \(clockRuns\) answer\.showLiveCard\(target\);\s*else answer\.showCard\(target\);/);
    expect(body).toMatch(/clockRuns && !CHAPTER_ANSWER_CARD_ON_RUNNING_CLOCK/);
  });

  it('the scan stands down and the premonition waits while the live answer is pending', () => {
    expect(GAME_VIEW).toMatch(/const activePremonition = liveAnswerPending \? null : readyPremonition;/);
    expect(GAME_VIEW).toMatch(/if \(liveAnswerPending\) return;\s*if \(isEncounterAutoOpenSuppressed/);
    expect(GAME_VIEW).toMatch(/encounterAnsweringLive: liveAnswerPending,/);
    expect(GAME_VIEW).toMatch(/openAnswer: handleOpenChapterAnswer,/);
  });

  it('the Stage renders both kinds from the encounter slot, so the veil never remounts', () => {
    expect(STAGE_HOST).toMatch(/renders\.has\('encounter'\) \|\| renders\.has\('encounter-answering'\)/);
    expect(STAGE_HOST_KINDS).toContain('encounter-answering');
  });
});

describe('THR-2151 — the answer comes here', () => {
  it('after Play the live card is up, the clock runs, and nothing holds it', () => {
    const { probe } = commitOnRunningClock();
    expect(screen.getByTestId('chapter-answering-card')).toHaveAttribute('data-live', 'true');
    expect(screen.getByTestId('chapter-answering-choice')).toHaveTextContent('Played: Boost.');
    expect(screen.getByTestId('chapter-answering-waits')).toHaveTextContent(CHAPTER_ANSWER_LIVE_WAITS_LINE);
    expect(screen.queryByTestId('chapter-answer-run')).not.toBeInTheDocument();
    expect(screen.getByTestId('chapter-answer-back')).toBeInTheDocument();
    const { resolution, answer, running } = probe.current!;
    expect(answer.getDebugState().state).toBe('answering_live');
    expect(resolution.rendering).toContain('encounter-answering');
    expect(resolution.open).not.toContain('EncounterVeil');
    expect(resolution.open).not.toContain('EncounterVeilAnswering');
    expect(running).toBe(true);
  });

  it('when the step answers, the next step opens in place on "Step 1 held. You: Boost." without the veil unmounting', () => {
    const { probe, rerender, container } = commitOnRunningClock();
    const veilRoot = container.firstChild!.firstChild;
    act(() => {
      rerender(<Harness probe={probe} world={{
        ...STEP0_WORLD,
        tick: 104,
        actions: [{ actionId: ACTION_ID, currentStep: 1, resolved: false } as unknown as UnifiedAction],
        notifications: [notif('n_step0', { stepIndex: 0 }), notif('n_step1', { stepIndex: 1 })],
      }} />);
    });
    expect(probe.current!.openNotificationId).toBe('n_step1');
    expect(screen.queryByTestId('chapter-answering-card')).not.toBeInTheDocument();
    expect(screen.getByTestId('veil-last-step-answer')).toHaveTextContent('Step 1 held. You: Boost.');
    // Same veil element: the Stage swapped content, the map never showed.
    expect(container.firstChild!.firstChild).toBe(veilRoot);
    // The answer is an ordinary beat: it holds the clock again (Law 39).
    expect(probe.current!.resolution.open).toContain('EncounterVeil');
    expect(probe.current!.answer.getDebugState().state).toBe('none');
  });

  it('a premonition ready during the wait opens after the Aftermath, not before it (D3)', () => {
    const { probe, rerender } = commitOnRunningClock();
    const withPremonition: World = { ...STEP0_WORLD, tick: 102, premonitionReady: true };
    act(() => { rerender(<Harness probe={probe} world={withPremonition} />); });
    expect(probe.current!.answer.getDebugState().premonitionDeferred).toBe(true);
    expect(screen.queryByTestId('premonition-shown')).not.toBeInTheDocument();

    // The chapter ends: its Aftermath opens in place first.
    act(() => {
      rerender(<Harness probe={probe} world={{
        ...withPremonition,
        tick: 105,
        actions: [{ actionId: ACTION_ID, currentStep: 0, resolved: true } as unknown as UnifiedAction],
        notifications: [notif('n_step0', { stepIndex: 0 }), notif('n_after', { kind: 'aftermath' })],
      }} />);
    });
    expect(probe.current!.openNotificationId).toBe('n_after');
    expect(screen.queryByTestId('premonition-shown')).not.toBeInTheDocument();

    // The player closes the Aftermath; now the premonition takes the Stage.
    act(() => probe.current!.close());
    expect(screen.getByTestId('premonition-shown')).toBeInTheDocument();
    expect(probe.current!.premonitionShown).toBe(true);
  });
});
