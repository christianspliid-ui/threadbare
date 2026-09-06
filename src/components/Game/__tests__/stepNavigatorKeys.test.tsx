// @vitest-environment jsdom
/**
 * THR-1417 — the step navigator's dots must carry a real React key.
 *
 * The defect was not a missing `key` prop: `StepNavigator` has keyed its dots on
 * `step.stepId` since the component was written. The key *evaluated to
 * `undefined`*, because `buildGateDutyEncounterStageModel` wrote `step.id` into a
 * non-optional `stepId` and gate-duty template steps carry no `id`. React reports
 * an undefined key with the same words as an absent one, which is what sent the
 * original report at the component instead of the producer.
 *
 * The two failure modes are distinguishable and worth pinning apart, because only
 * the first is what the veil actually logged:
 *   - undefined key  → 'Each child in a list should have a unique "key" prop'
 *   - duplicate keys → 'Encountered two children with the same key'
 *
 * This file guards the component's own fallback. The producer that caused the bug
 * is falsified independently in
 * `encounter-stage/__tests__/buildGateDutyEncounterStageModel.test.ts` — neither
 * test can mask the other's regression.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { EncounterVeil } from '../EncounterVeil';
import type { EncounterStageModel } from '../encounter-stage/types';

vi.mock('../../../services/narration/useNarration', () => ({
  useNarration: () => ({
    enabled: false,
    status: 'idle' as const,
    backendType: null,
    loadProgress: 0,
    error: null,
    isSpeaking: false,
    isLoading: false,
    isAvailable: false,
    init: vi.fn(),
    initWorker: vi.fn(),
    speak: vi.fn(),
    speakSections: vi.fn(),
    stop: vi.fn(),
    narrateChronicle: vi.fn(),
  }),
}));

const BASE_MODEL = {
  header: {
    title: 'Gate Duty',
    subtitle: 'A test of authority',
    locationLabel: 'South Gate',
    threatLabel: 'moderate',
    threadTier: 'strong',
  },
  illustration: { src: '/concept-art/encounters/gate-duty.jpg', alt: 'A checkpoint', caption: 'Dusk' },
  scene: { situationProse: 'The torchlight gutters.', pressureProse: 'Time runs short.', noticeLines: [] },
  narrative: {
    paragraphs: [{ id: 'p-0', segments: [{ text: 'The torchlight gutters.', emphasis: 'default' }] }],
    references: [],
  },
  cast: [],
  factions: [],
  signals: [],
  choices: [],
  falloutPreview: [],
  history: [],
  resourceSummary: { quintessence: 12 },
} as unknown as EncounterStageModel;

/** React's key complaints, separated from every other console.error the veil may emit. */
function renderAndCollectKeyWarnings(history: EncounterStageModel['history']): {
  undefinedKey: string[];
  duplicateKey: string[];
} {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
  render(
    <EncounterVeil
      open
      model={{ ...BASE_MODEL, history }}
      onClose={() => {}}
      onSelectChoice={() => {}}
    />,
  );
  const messages = spy.mock.calls.map((call) => call.map(String).join(' '));
  spy.mockRestore();
  return {
    undefinedKey: messages.filter((m) => m.includes('should have a unique "key" prop')),
    duplicateKey: messages.filter((m) => m.includes('two children with the same key')),
  };
}

const THREE_STEPS = [
  { stepId: 'step-0', stepLabel: 'First', status: 'resolved' as const, outcome: 'success' as const },
  { stepId: 'step-1', stepLabel: 'Second', status: 'current' as const },
  { stepId: 'step-2', stepLabel: 'Third', status: 'future' as const },
];

afterEach(() => {
  vi.restoreAllMocks();
});

describe('THR-1417 — StepNavigator dot keys', () => {
  it('renders three steps with no React key warning', () => {
    const { undefinedKey, duplicateKey } = renderAndCollectKeyWarnings(THREE_STEPS);

    expect(undefinedKey).toEqual([]);
    expect(duplicateKey).toEqual([]);
  });

  it('still keys every dot when a producer hands it an undefined stepId', () => {
    // The exact shape `buildGateDutyEncounterStageModel` produced before its
    // repair. `stepId` is declared non-optional, so only a cast can express it —
    // which is the point: the type could not catch this, and the component is the
    // last line that can. Remove the `?? \`step-${i}\`` fallback in
    // `StepNavigator` and this test fails with the veil's original message.
    const history = THREE_STEPS.map((step) => ({
      ...step,
      stepId: undefined,
    })) as unknown as EncounterStageModel['history'];

    const { undefinedKey, duplicateKey } = renderAndCollectKeyWarnings(history);

    expect(undefinedKey).toEqual([]);
    expect(duplicateKey).toEqual([]);
  });

  it('the guard is real: the same render warns when the fallback cannot apply', () => {
    // Falsification for the two tests above — proof the probe can see a key
    // failure at all, rather than passing because it looks in the wrong place.
    // Identical ids defeat any per-dot fallback, so React must complain here; a
    // silent result would mean the spy, not the component, is doing the work.
    const history = THREE_STEPS.map((step) => ({
      ...step,
      stepId: 'collision',
    })) as EncounterStageModel['history'];

    const { duplicateKey } = renderAndCollectKeyWarnings(history);

    expect(duplicateKey.length).toBeGreaterThan(0);
  });
});

/**
 * `Browser-verify substitution: jsdom-render — unattended run, no startable dev server`
 * (verification-gates.md § Sanctioned evidence routes, bullet 3).
 *
 * These assert the rendered faces the THR-1417 repair produces, which is what the
 * screenshot would have shown: the dot row survives an undefined `stepId` intact
 * (three distinct controls, not a collapsed or dropped list), and the replay
 * header renders the repaired `stepLabel` instead of the blank a gate-duty step
 * used to leave there.
 */
describe('THR-1417 — rendered faces', () => {
  function renderVeil(history: EncounterStageModel['history']) {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const utils = render(
      <EncounterVeil
        open
        model={{ ...BASE_MODEL, history }}
        onClose={() => {}}
        onSelectChoice={() => {}}
      />,
    );
    spy.mockRestore();
    return utils;
  }

  it('renders one distinct dot per step even when every stepId is undefined', () => {
    const history = THREE_STEPS.map((step) => ({ ...step, stepId: undefined })) as unknown as
      EncounterStageModel['history'];

    renderVeil(history);

    // The accessible names come from the index (`Step ${i + 1}`), so three
    // distinct controls prove the list neither collapsed nor lost a child.
    expect(screen.getByLabelText('Step 1 — resolved')).toBeInTheDocument();
    expect(screen.getByLabelText('Step 2 — in progress')).toBeInTheDocument();
    expect(screen.getByLabelText('Step 3')).toBeInTheDocument();
  });

  it('shows the repaired step label in the replay header, where a blank used to render', () => {
    // `stepLabel` is what `EncounterVeil` prints at the top of `StepReplayView`.
    // Before the adapter repair a gate-duty step arrived here as `undefined` and
    // this header rendered empty.
    //
    // Scope, stated plainly: this asserts the *rendered face* — that the header
    // prints the label it is given — which is the screenshot's job under the
    // jsdom substitution. It does not prove the adapter produces `Step 1`; the
    // fixture supplies that string, so this test would pass with the producer
    // reverted. The value is owned and falsified by
    // `buildGateDutyEncounterStageModel.test.ts`.
    const history = [
      { stepId: 'step-0', stepLabel: 'Step 1', status: 'resolved' as const, outcome: 'success' as const,
        replayNarrative: 'The courier is waved through.' },
      { stepId: 'step-1', stepLabel: 'Step 2', status: 'current' as const },
    ] as EncounterStageModel['history'];

    renderVeil(history);
    fireEvent.click(screen.getByLabelText('Step 1 — resolved'));

    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText(/courier is waved through/)).toBeInTheDocument();
  });
});
