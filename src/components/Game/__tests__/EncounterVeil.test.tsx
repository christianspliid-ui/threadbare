// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
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

const mockModel: EncounterStageModel = {
  header: {
    title: 'Gate Duty',
    subtitle: 'A test of authority',
    locationLabel: 'South Gate',
    threatLabel: 'moderate',
    threadTier: 'strong',
  },
  illustration: {
    src: '/concept-art/encounters/gate-duty.jpg',
    alt: 'A checkpoint at dusk',
    caption: 'The Checkpoint at Dusk',
  },
  scene: {
    situationProse: 'The torchlight gutters.',
    pressureProse: 'Time runs short.',
    noticeLines: [],
  },
  narrative: {
    paragraphs: [
      {
        id: 'p-0',
        segments: [{ text: 'The torchlight gutters as another caravan approaches.', emphasis: 'default' }],
      },
    ],
    references: [],
  },
  cast: [],
  factions: [],
  signals: [],
  choices: [
    {
      id: 'choice-support',
      label: 'Show mercy',
      intent: 'Let the grain through. The settlements are hungry.',
      essenceCost: 2,
      affordable: true,
      interventionType: 'supportive',
      godVoice: 'The hungry do not eat paperwork.',
      probabilityBoost: 0.2,
    },
    {
      id: 'choice-coerce',
      label: 'Seize it',
      intent: 'Hold the shipment. The truth matters more.',
      essenceCost: 4,
      affordable: true,
      interventionType: 'coercive',
      godVoice: 'Pull the thread.',
      probabilityBoost: 0.35,
    },
    {
      id: 'choice-withdraw',
      label: 'Step back',
      intent: 'Let Vasara decide alone.',
      essenceCost: 0,
      affordable: true,
      interventionType: 'withdrawn',
      probabilityBoost: 0,
    },
  ],
  falloutPreview: [],
  history: [
    { stepId: 'step-1', stepLabel: 'First Step', status: 'current' },
    { stepId: 'step-2', stepLabel: 'Second Step', status: 'future' },
  ],
  resourceSummary: { quintessence: 12 },
  resolutionReadout: {
    heading: 'Resolution Readout',
    current: {
      id: 'current:step-1',
      stepId: 'step-1',
      stepLabel: 'First Step',
      state: 'pending',
      reach: 'iron',
      reachLabel: 'Iron',
      difficulty: 45,
      difficultyLabel: '45/100',
      capability: 0.62,
      modifierTotal: 0.08,
      probability: 0.25,
      threshold: 25,
      forecastLabel: 'Perilous',
    },
    previous: [
      {
        id: 'resolved:step-0',
        stepId: 'step-0',
        stepLabel: 'Opening Clash',
        state: 'resolved',
        reach: 'heart',
        reachLabel: 'Heart',
        difficulty: 30,
        difficultyLabel: '30/100',
        capability: 0.7,
        modifierTotal: 0.1,
        probability: 0.5,
        threshold: 50,
        roll: 47,
        margin: -3,
        outcomeLabel: 'Success',
        nearMiss: true,
      },
    ],
  },
};

const defaultProps = {
  open: true,
  model: mockModel,
  threadTier: 'strong' as const,
  essence: 12,
  tick: 10,
  autoResolveTick: null as number | null,
  onIntervene: vi.fn(),
  onBoost: vi.fn(),
  onPeek: vi.fn(),
  onDisregard: vi.fn(),
  onAcknowledgeAftermath: vi.fn(),
  onAftermathReaction: vi.fn(),
};

describe('EncounterVeil', () => {
  it('renders when open is true', () => {
    render(<EncounterVeil {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    render(<EncounterVeil {...defaultProps} open={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('displays encounter title', () => {
    render(<EncounterVeil {...defaultProps} />);
    expect(screen.getByText('Gate Duty')).toBeInTheDocument();
  });

  it('displays narrative prose', () => {
    render(<EncounterVeil {...defaultProps} />);
    expect(screen.getByText(/torchlight gutters/)).toBeInTheDocument();
  });

  it('displays all choice intents', () => {
    render(<EncounterVeil {...defaultProps} />);
    expect(screen.getByText(/Let the grain through/)).toBeInTheDocument();
    expect(screen.getByText(/Hold the shipment/)).toBeInTheDocument();
    expect(screen.getByText(/Let Vasara decide/)).toBeInTheDocument();
  });

  it('calls onDisregard when Escape is pressed', () => {
    render(<EncounterVeil {...defaultProps} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(defaultProps.onDisregard).toHaveBeenCalled();
  });

  it('calls onIntervene with selected choice when Intervene is clicked', () => {
    const onIntervene = vi.fn();
    render(<EncounterVeil {...defaultProps} onIntervene={onIntervene} />);
    // Click a choice to select it
    fireEvent.click(screen.getByText(/Let the grain through/));
    // Click Intervene
    fireEvent.click(screen.getByText('Intervene'));
    expect(onIntervene).toHaveBeenCalledWith('choice-support', 2);
  });

  it('shows art title from illustration caption', () => {
    render(<EncounterVeil {...defaultProps} />);
    expect(screen.getByText('The Checkpoint at Dusk')).toBeInTheDocument();
  });

  it('renders without illustration when model has none', () => {
    const noArtModel = { ...mockModel, illustration: undefined };
    render(<EncounterVeil {...defaultProps} model={noArtModel} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Gate Duty')).toBeInTheDocument();
  });

  it('displays thread tier label', () => {
    render(<EncounterVeil {...defaultProps} />);
    expect(screen.getByText(/Strongly Threaded/)).toBeInTheDocument();
  });

  it('displays step indicator', () => {
    render(<EncounterVeil {...defaultProps} />);
    expect(screen.getByText(/1 of 2/)).toBeInTheDocument();
  });

  it('renders the resolution readout when provided', () => {
    render(<EncounterVeil {...defaultProps} />);
    expect(screen.getByText('Resolution Readout')).toBeInTheDocument();
    expect(screen.getByText(/Test: Iron vs 45\/100 difficulty/)).toBeInTheDocument();
    expect(screen.getByText(/Roll 47 vs 50/)).toBeInTheDocument();
  });
});

describe('lightly threaded', () => {
  const lightProps = {
    ...defaultProps,
    threadTier: 'light' as const,
    autoResolveTick: 16,
    tick: 12,
  };

  it('displays auto-resolve timer', () => {
    render(<EncounterVeil {...lightProps} />);
    expect(screen.getByText(/auto-resolves in 4 tick/)).toBeInTheDocument();
  });

  it('shows Lightly Threaded label', () => {
    render(<EncounterVeil {...lightProps} />);
    expect(screen.getByText(/Lightly Threaded/)).toBeInTheDocument();
  });

  /**
   * THR-1068: the countdown must never run backwards past its deadline.
   *
   * Measured before the fix: a notification 37 ticks overdue rendered
   * "auto-resolves in -37 ticks". The engine now retires these records at their
   * deadline, so an overdue veil is unreachable in a live run — the clamp is
   * belt-and-braces on a surface that must not render a lie whenever its
   * upstream slips.
   */
  it('reads "auto-resolving now" at the deadline rather than "in 0 ticks"', () => {
    render(<EncounterVeil {...lightProps} tick={16} />);
    expect(screen.getByText(/auto-resolving now/)).toBeInTheDocument();
    expect(screen.queryByText(/auto-resolves in/)).not.toBeInTheDocument();
  });

  it('clamps past the deadline instead of counting negative', () => {
    render(<EncounterVeil {...lightProps} tick={53} />);
    expect(screen.getByText(/auto-resolving now/)).toBeInTheDocument();
    expect(screen.queryByText(/-37/)).not.toBeInTheDocument();
  });

  it('still pluralises a live countdown', () => {
    render(<EncounterVeil {...lightProps} tick={15} />);
    expect(screen.getByText(/auto-resolves in 1 tick$/)).toBeInTheDocument();
  });
});

describe('watched tier', () => {
  const watchedProps = {
    ...defaultProps,
    threadTier: 'watched' as const,
  };

  it('shows peek gate initially', () => {
    render(<EncounterVeil {...watchedProps} />);
    expect(screen.getByText(/Peer Through the Thread/)).toBeInTheDocument();
  });

  it('calls onPeek when peek button is clicked', () => {
    const onPeek = vi.fn();
    render(<EncounterVeil {...watchedProps} onPeek={onPeek} />);
    fireEvent.click(screen.getByText(/Peer Through the Thread/));
    expect(onPeek).toHaveBeenCalled();
  });

  it('shows Watched label', () => {
    render(<EncounterVeil {...watchedProps} />);
    expect(screen.getByText(/Watched/)).toBeInTheDocument();
  });

  it('Law 46: every boost pip carries a >=24px hit area around its 12px dot', () => {
    render(<EncounterVeil {...watchedProps} />);
    fireEvent.click(screen.getByText(/Peer Through the Thread/));
    const pips = screen.getAllByRole('button', { name: /^Boost \d$/ });
    expect(pips).toHaveLength(5);
    for (const pip of pips) {
      // jsdom does not lay out, so the assertion is on the declared size —
      // which is what the fix changed. The composed rect is verified in the
      // browser pass (`getBoundingClientRect` on the shipped build).
      expect(pip.style.width).toBe('24px');
      expect(pip.style.height).toBe('24px');
      // The dot itself stayed small: padding grew, the visual did not.
      const dot = pip.querySelector('span');
      expect(dot?.style.width).toBe('12px');
    }
  });
});

// ── Law 44 — prefers-reduced-motion ────────────────────────────────

describe('reduced motion (Law 44)', () => {
  /**
   * jsdom has no `matchMedia`, so each arm installs one. The veil reads the
   * query through `usePrefersReducedMotion`, which is what makes an
   * inline-styled surface able to honour a media query at all.
   */
  const stubMatchMedia = (matches: boolean) => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('prefers-reduced-motion') ? matches : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  };

  afterEach(() => vi.unstubAllGlobals());

  /** The art layer is the element carrying the 8s zoom Law 44 names. */
  const artLayer = (container: HTMLElement | Document) =>
    (container as Document).querySelector<HTMLElement>(
      '[style*="gate-duty.jpg"]',
    ) ?? document.body.querySelector<HTMLElement>('[style*="gate-duty.jpg"]');

  it('keeps the ceremonial stagger and the slow zoom at full motion', () => {
    stubMatchMedia(false);
    render(<EncounterVeil {...defaultProps} />);
    const art = artLayer(document);
    expect(art).not.toBeNull();
    expect(art!.style.transition).toContain('transform 8s');
    expect(art!.style.transform).not.toBe('');
  });

  it('collapses the slow zoom to an --anim-fast fade under reduced motion', () => {
    stubMatchMedia(true);
    render(<EncounterVeil {...defaultProps} />);
    const art = artLayer(document);
    expect(art).not.toBeNull();
    expect(art!.style.transition).not.toContain('8s');
    expect(art!.style.transition).toContain('0.15s');
    // Law 44's second clause: the art still arrives, it just does not zoom.
    expect(art!.style.transform).toBe('');
  });

  it('still renders every beat under reduced motion — no information lost to a dropped stagger', () => {
    stubMatchMedia(true);
    render(<EncounterVeil {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Gate Duty')).toBeInTheDocument();
  });
});

describe('aftermath mode', () => {
  const aftermathModel: EncounterStageModel = {
    ...mockModel,
    aftermath: {
      title: 'Aftermath',
      overview: 'The grain passes through. Vasara watches the caravan disappear.',
      actorMoments: [
        {
          id: 'actor-1',
          actorName: 'Vasara',
          summaryLines: ['Gained a reputation for pragmatism.'],
        },
      ],
      changes: [
        {
          id: 'change-1',
          kind: 'reputation',
          title: "The Merchant's Debt",
          detail: 'The merchant remembers a kindness.',
          polarity: 'gain',
        },
      ],
    },
  };

  // ── Encounter identity chrome (THR-1003) ─────────────────────────
  //
  // The ending is the last page of one encounter, so it must say which
  // encounter, whose, and how far the flow got. Before this, the aftermath
  // carried a bare "resolved" dot row and nothing else — a screen with no
  // stated relationship to the steps the player had just played.

  const identityModel: EncounterStageModel = {
    ...aftermathModel,
    header: {
      ...mockModel.header,
      agentName: 'Vasara Enkhet',
      focalActorId: 'agent-vasara',
      reachLabel: 'Iron',
    },
    history: [
      { stepId: 'step-1', stepLabel: 'First Step', status: 'resolved', outcome: 'success', outcomeWord: 'held' },
      { stepId: 'step-2', stepLabel: 'Second Step', status: 'resolved', outcome: 'failure', outcomeWord: 'slipped' },
    ],
  };

  it('names the encounter on the aftermath screen', () => {
    render(<EncounterVeil {...defaultProps} model={identityModel} />);
    expect(screen.getByTestId('aftermath-encounter-title')).toHaveTextContent('Gate Duty');
  });

  it('carries the agent context strip into the aftermath', () => {
    render(<EncounterVeil {...defaultProps} model={identityModel} />);
    const strip = screen.getByTestId('aftermath-context-strip');
    expect(strip).toHaveTextContent('Vasara Enkhet');
    expect(strip).toHaveTextContent('Iron');
    expect(strip).toHaveTextContent('South Gate');
  });

  it('shows the step flow as complete rather than as a bare "resolved" tag', () => {
    render(<EncounterVeil {...defaultProps} model={identityModel} />);
    expect(screen.getByText('all 2 resolved')).toBeInTheDocument();
    // Each step keeps its own outcome reading — the flow, not a summary badge.
    expect(screen.getByRole('button', { name: 'Step 1 — held' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Step 2 — slipped' })).toBeInTheDocument();
  });

  it('reports the true count when the encounter ended before its last step', () => {
    render(
      <EncounterVeil
        {...defaultProps}
        model={{
          ...identityModel,
          history: [
            { stepId: 'step-1', stepLabel: 'First Step', status: 'resolved', outcome: 'success', outcomeWord: 'held' },
            { stepId: 'step-2', stepLabel: 'Second Step', status: 'future' },
          ],
        }}
      />,
    );
    expect(screen.getByText('1 of 2 resolved')).toBeInTheDocument();
  });

  it('leaves the aftermath navigator inert — no dot enters a replay that cannot render', () => {
    render(<EncounterVeil {...defaultProps} model={identityModel} />);
    expect(screen.getByRole('button', { name: 'Step 1 — held' })).toBeDisabled();
  });

  it('keeps the aftermath section marker distinct from the encounter title', () => {
    render(<EncounterVeil {...defaultProps} model={identityModel} />);
    expect(screen.getByTestId('aftermath-section-label')).toHaveTextContent('Aftermath');
    expect(screen.getByTestId('aftermath-encounter-title')).not.toHaveTextContent('Aftermath');
  });

  it('displays aftermath overview prose', () => {
    render(<EncounterVeil {...defaultProps} model={aftermathModel} />);
    expect(screen.getByText(/grain passes through/)).toBeInTheDocument();
  });

  it('displays actor moments', () => {
    render(<EncounterVeil {...defaultProps} model={aftermathModel} />);
    expect(screen.getByText('Vasara')).toBeInTheDocument();
    expect(screen.getByText(/reputation for pragmatism/)).toBeInTheDocument();
  });

  it('displays aftermath changes', () => {
    render(<EncounterVeil {...defaultProps} model={aftermathModel} />);
    expect(screen.getByText("The Merchant's Debt")).toBeInTheDocument();
  });

  it('shows Return to the world button', () => {
    render(<EncounterVeil {...defaultProps} model={aftermathModel} />);
    expect(screen.getByText('Return to the world')).toBeInTheDocument();
  });

  it('calls onAcknowledgeAftermath when return button is clicked', () => {
    const onAcknowledge = vi.fn();
    render(<EncounterVeil {...defaultProps} model={aftermathModel} onAcknowledgeAftermath={onAcknowledge} />);
    fireEvent.click(screen.getByText('Return to the world'));
    expect(onAcknowledge).toHaveBeenCalled();
  });

  // ── Consequence chips (THR-971) ──────────────────────────────────
  //
  // The mockup's ending: what you got, what it cost, what it planted.

  const chipModel: EncounterStageModel = {
    ...aftermathModel,
    aftermath: {
      ...aftermathModel.aftermath!,
      consequences: [
        {
          id: 'c-prize',
          kind: 'prize',
          kindLabel: 'PRIZE',
          sentence: { id: 'c-prize', segments: [{ text: 'A wrapped parcel changed hands.' }] },
          tone: 'gain',
        },
        {
          id: 'c-seed',
          kind: 'seed',
          kindLabel: 'SEED',
          sentence: {
            id: 'c-seed',
            segments: [
              { text: 'A promise made by ' },
              { text: 'Vasara', referenceId: 'cast:vasara', emphasis: 'strong', entityId: 'actor-1' },
              { text: ' falls due at the full moon.' },
            ],
          },
          tone: 'seed',
        },
      ],
    },
  };

  it('renders a chip per consequence, tagged with its kind', () => {
    render(<EncounterVeil {...defaultProps} model={chipModel} />);
    expect(screen.getByTestId('aftermath-consequences')).toBeInTheDocument();
    expect(screen.getByTestId('consequence-chip-prize')).toBeInTheDocument();
    expect(screen.getByTestId('consequence-chip-seed')).toBeInTheDocument();
    expect(screen.getByText('PRIZE')).toBeInTheDocument();
    expect(screen.getByText('SEED')).toBeInTheDocument();
  });

  it('names the planted follow-up in the seed chip', () => {
    render(<EncounterVeil {...defaultProps} model={chipModel} />);
    expect(screen.getByText(/falls due at the full moon/)).toBeInTheDocument();
  });

  it('suppresses the legacy changes block once chips render — never both', () => {
    render(<EncounterVeil {...defaultProps} model={chipModel} />);
    // Same underlying change set; the chip row replaces the old presentation.
    expect(screen.queryByText("The Merchant's Debt")).not.toBeInTheDocument();
  });

  it('still renders the legacy changes block when no chips are present', () => {
    render(<EncounterVeil {...defaultProps} model={aftermathModel} />);
    expect(screen.queryByTestId('aftermath-consequences')).not.toBeInTheDocument();
    expect(screen.getByText("The Merchant's Debt")).toBeInTheDocument();
  });

  it('makes a resolved entity inside a chip clickable', () => {
    const onSelectAgent = vi.fn();
    render(<EncounterVeil {...defaultProps} model={chipModel} onSelectAgent={onSelectAgent} />);
    fireEvent.click(screen.getByRole('button', { name: 'Vasara' }));
    expect(onSelectAgent).toHaveBeenCalledWith('actor-1');
  });

  it('REGRESSION: a mounted veil can cross into aftermath without dropping a hook', () => {
    // The natural play path — an open encounter resolves and the same mounted
    // component re-renders in aftermath mode. `narratableProse` used to be
    // memoised *after* the aftermath early return, so this transition changed
    // the hook count and React threw "Rendered fewer hooks than expected",
    // sending the whole ending to the error boundary (THR-971).
    const { rerender } = render(<EncounterVeil {...defaultProps} model={mockModel} />);
    expect(() =>
      rerender(<EncounterVeil {...defaultProps} model={chipModel} />),
    ).not.toThrow();
    expect(screen.getByTestId('aftermath-consequences')).toBeInTheDocument();
  });

  it('FAIL-OPEN: renders an entity as plain text when no handler is wired', () => {
    render(<EncounterVeil {...defaultProps} model={chipModel} onSelectAgent={undefined} />);
    // Present as text, but never a dead link.
    expect(screen.getByText('Vasara', { selector: 'span' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Vasara' })).not.toBeInTheDocument();
  });

  // ── Concept words on chips (THR-1033) ────────────────────────────
  //
  // The chip draws the "this word explains itself" underline, while the
  // explanation lives in the registry. Deciding on the *presence* of a tooltip
  // id rather than on whether it resolves is how every STANDING chip shipped
  // looking live and doing nothing — Law 21's named anti-pattern.
  describe('concept words (THR-1033)', () => {
    const conceptChipModel = (tooltipId: string): EncounterStageModel => ({
      ...aftermathModel,
      aftermath: {
        ...aftermathModel.aftermath!,
        consequences: [
          {
            id: 'c-standing',
            kind: 'standing',
            kindLabel: 'STANDING',
            sentence: {
              id: 'c-standing',
              segments: [
                { text: "Vara's " },
                { text: 'standing', emphasis: 'accent', tooltipId },
                { text: ' rose sharply.' },
              ],
            },
            tone: 'gain',
          },
        ],
      },
    });

    it('LAW 17: a resolvable concept word is keyboard-reachable so its tooltip can open', () => {
      render(<EncounterVeil {...defaultProps} model={conceptChipModel('ui.standing')} />);
      const word = screen.getByText('standing', { selector: 'span' });
      expect(word).toHaveAttribute('tabindex', '0');
    });

    it('LAW 21: an unresolvable concept id renders as plain prose, not a dead underline', () => {
      // `ui.reputation` is the exact id that shipped dangling.
      render(<EncounterVeil {...defaultProps} model={conceptChipModel('ui.reputation')} />);
      const word = screen.getByText('standing', { selector: 'span' });
      // Not focusable, and not styled as though hovering it would explain it.
      expect(word).not.toHaveAttribute('tabindex');
      expect(word.style.borderBottom).toBe('');
    });

    it('the word itself survives either way — fail-open never drops content', () => {
      render(<EncounterVeil {...defaultProps} model={conceptChipModel('ui.reputation')} />);
      expect(screen.getByText(/rose sharply/)).toBeInTheDocument();
      expect(screen.getByText('standing', { selector: 'span' })).toBeInTheDocument();
    });
  });

  // ── Aftermath reactions (THR-1029) ───────────────────────────────
  //
  // Director review of `encounter.slice.unsafe_bridge`: a prompt asking which
  // consequence to keep, one button under it, and no statement of what the pick
  // entails. Two defects — the authored `intent` was dropped at render (Law 1 /
  // Law 16), and a lone reaction posed as a choice (Law 25).

  const reactionModel = (
    reactions: NonNullable<EncounterStageModel['aftermath']>['reactions'],
  ): EncounterStageModel => ({
    ...aftermathModel,
    aftermath: {
      ...aftermathModel.aftermath!,
      reactionPrompt: 'Choose what to carry forward.',
      reactions,
    },
  });

  const loneReaction = [
    {
      id: 'slice.bridge.walk_on',
      label: 'Walk on',
      intent: 'The road goes on from either bank.',
    },
  ];

  const twoReactions = [
    ...loneReaction,
    {
      id: 'slice.bridge.look_back',
      label: 'Look back at the span',
      intent: 'Fix the crossing in memory before the planks are gone.',
    },
  ];

  it('renders a reaction label AND its authored intent — the sentence is not dropped', () => {
    render(<EncounterVeil {...defaultProps} model={reactionModel(loneReaction)} />);
    expect(screen.getByTestId('aftermath-reaction-label-slice.bridge.walk_on'))
      .toHaveTextContent('Walk on');
    expect(screen.getByTestId('aftermath-reaction-intent-slice.bridge.walk_on'))
      .toHaveTextContent('The road goes on from either bank.');
  });

  it('does not pose a choice when there is only one reaction (Law 25)', () => {
    render(<EncounterVeil {...defaultProps} model={reactionModel(loneReaction)} />);
    expect(screen.queryByTestId('aftermath-reaction-prompt')).not.toBeInTheDocument();
    // Asserted on the copy as well as the testid: a regression that re-rendered
    // the prompt without the hook would otherwise pass this vacuously.
    expect(screen.queryByText('Choose what to carry forward.')).not.toBeInTheDocument();
    // The control itself stays: it consumes marks and resolves the notification,
    // which the footer's plain acknowledge does not do.
    expect(screen.getByTestId('aftermath-reaction-label-slice.bridge.walk_on')).toBeInTheDocument();
  });

  it('renders the prompt once there are genuinely two paths', () => {
    render(<EncounterVeil {...defaultProps} model={reactionModel(twoReactions)} />);
    expect(screen.getByTestId('aftermath-reaction-prompt'))
      .toHaveTextContent('Choose what to carry forward.');
    expect(screen.getByTestId('aftermath-reaction-intent-slice.bridge.look_back'))
      .toHaveTextContent('Fix the crossing in memory');
  });

  it('fires the reaction handler with the chosen id', () => {
    const onAftermathReaction = vi.fn();
    render(
      <EncounterVeil
        {...defaultProps}
        model={reactionModel(twoReactions)}
        onAftermathReaction={onAftermathReaction}
      />,
    );
    fireEvent.click(screen.getByTestId('aftermath-reaction-label-slice.bridge.look_back'));
    expect(onAftermathReaction).toHaveBeenCalledWith('slice.bridge.look_back');
  });

  it('FAIL-SOFT: a reaction with no authored intent still renders its label', () => {
    render(<EncounterVeil {...defaultProps} model={reactionModel([{ id: 'r1', label: 'Move on' }])} />);
    expect(screen.getByTestId('aftermath-reaction-label-r1')).toHaveTextContent('Move on');
    expect(screen.queryByTestId('aftermath-reaction-intent-r1')).not.toBeInTheDocument();
  });
});

// ─── THR-1041: cast strip and fallout preview ───────────────────────
//
// Both models were built by the adapter and read by no component, so every
// assertion below fails on the pre-THR-1041 veil — the strips did not exist.
// The `mockModel` above ships `cast: []` and `falloutPreview: []`, which is
// also the empty-state arm: absent data must render nothing at all rather than
// an empty labelled container.

describe('EncounterVeil — cast strip (THR-1041)', () => {
  const boundCast = [
    { id: 'tessaly', name: 'Tessaly the Broker', role: 'subject' as const, roleLabel: 'broker', nodeId: 'npc.tessaly', reused: true },
    { id: 'carin', name: 'Carin Harken', role: 'witness' as const, roleLabel: 'witness', nodeId: 'npc.carin', reused: false },
  ];

  function castModel(cast: EncounterStageModel['cast']): EncounterStageModel {
    return { ...mockModel, cast };
  }

  it('renders nothing when the encounter binds no cast', () => {
    render(<EncounterVeil {...defaultProps} />);
    expect(screen.queryByTestId('veil-cast-strip')).not.toBeInTheDocument();
  });

  it('renders a chip per bound actor, with name and role', () => {
    render(<EncounterVeil {...defaultProps} model={castModel(boundCast)} />);
    expect(screen.getByTestId('veil-cast-strip')).toBeInTheDocument();
    expect(screen.getByTestId('veil-cast-chip-tessaly')).toHaveTextContent('Tessaly the Broker');
    expect(screen.getByTestId('veil-cast-chip-tessaly')).toHaveTextContent('broker');
    expect(screen.getByTestId('veil-cast-chip-carin')).toHaveTextContent('Carin Harken');
  });

  // Law 1's link half: a named concept the player cannot go look at is only
  // half-present. Law 21's half: the control must not exist when the
  // destination does not.
  it('routes a chip click to the agent surface', () => {
    const onSelectAgent = vi.fn();
    render(<EncounterVeil {...defaultProps} model={castModel(boundCast)} onSelectAgent={onSelectAgent} />);
    fireEvent.click(screen.getByTestId('veil-cast-chip-tessaly'));
    expect(onSelectAgent).toHaveBeenCalledWith('npc.tessaly');
  });

  it('LAW 21: an unbound cast member renders as a name, not a dead link', () => {
    const onSelectAgent = vi.fn();
    render(
      <EncounterVeil
        {...defaultProps}
        model={castModel([{ id: 'ghost', name: 'A waiting stranger', role: 'witness', roleLabel: 'witness' }])}
        onSelectAgent={onSelectAgent}
      />,
    );
    const chip = screen.getByTestId('veil-cast-chip-ghost');
    expect(chip).toHaveTextContent('A waiting stranger');
    expect(chip).toBeDisabled();
    fireEvent.click(chip);
    expect(onSelectAgent).not.toHaveBeenCalled();
  });

  it('LAW 21: no handler wired means no live link, however well-bound the cast', () => {
    render(<EncounterVeil {...defaultProps} model={castModel(boundCast)} />);
    expect(screen.getByTestId('veil-cast-chip-tessaly')).toBeDisabled();
  });

  // LAW 17: the hover explanation goes through the Tooltip primitive; `title`
  // is permitted only as the assistive-tech duplicate of `aria-label`. A chip
  // whose `title` says something `aria-label` does not is the retired
  // raw-`title` tooltip pattern wearing a different name.
  it('LAW 17: title duplicates aria-label and carries no separate explanation', () => {
    render(<EncounterVeil {...defaultProps} model={castModel(boundCast)} />);
    const chip = screen.getByTestId('veil-cast-chip-tessaly');
    expect(chip.getAttribute('title')).toBe(chip.getAttribute('aria-label'));
    expect(chip.getAttribute('title')).not.toMatch(/already/i);
  });

  it('names reuse provenance in the hover explanation', () => {
    vi.useFakeTimers();
    try {
      render(<EncounterVeil {...defaultProps} model={castModel(boundCast)} />);
      fireEvent.pointerEnter(screen.getByTestId('veil-cast-chip-tessaly'));
      act(() => { vi.advanceTimersByTime(300); });
      expect(screen.getByRole('tooltip')).toHaveTextContent('Already part of this world');
    } finally {
      vi.useRealTimers();
    }
  });

  it('FAIL-SOFT: a member with no roleLabel falls back to the mapped role', () => {
    render(
      <EncounterVeil
        {...defaultProps}
        model={castModel([{ id: 'plain', name: 'Someone', role: 'authority', nodeId: 'npc.x' }])}
      />,
    );
    expect(screen.getByTestId('veil-cast-chip-plain')).toHaveTextContent('authority');
  });
});

describe('EncounterVeil — fallout preview (THR-1041)', () => {
  it('renders nothing when the step puts nothing on record', () => {
    render(<EncounterVeil {...defaultProps} />);
    expect(screen.queryByTestId('veil-fallout-preview')).not.toBeInTheDocument();
  });

  it('renders one chip per authored stake', () => {
    render(
      <EncounterVeil
        {...defaultProps}
        model={{
          ...mockModel,
          falloutPreview: [
            { kind: 'reputation', label: 'Reputation may increase on success' },
            { kind: 'reputation', label: 'Reputation may decrease on failure' },
          ],
        }}
      />,
    );
    const preview = screen.getByTestId('veil-fallout-preview');
    expect(preview).toHaveTextContent('At stake');
    expect(preview).toHaveTextContent('Reputation may increase on success');
    expect(preview).toHaveTextContent('Reputation may decrease on failure');
  });

  // NFP #5 / the veil's whole premise: the stage narrates, it does not report.
  it('shows the authored label and no numeral', () => {
    render(
      <EncounterVeil
        {...defaultProps}
        model={{ ...mockModel, falloutPreview: [{ kind: 'reputation', label: 'Reputation may increase on success' }] }}
      />,
    );
    const preview = screen.getByTestId('veil-fallout-preview');
    expect(preview.textContent).not.toMatch(/[-+]?\d/);
  });
});
