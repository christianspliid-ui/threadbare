// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
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

  /**
   * THR-1121 — the commit moved out of the footer and into the stage, and now
   * says `Let fate decide` like every other commit in the nudge pattern. What it
   * *does* is unchanged, which is what this pins: select a choice, commit, and
   * `onIntervene` still receives that choice's id and price.
   */
  it('calls onIntervene with the selected choice when the stage commit is clicked', () => {
    const onIntervene = vi.fn();
    render(<EncounterVeil {...defaultProps} onIntervene={onIntervene} />);

    // Nothing selected: the commit is present but refuses.
    const commit = screen.getByTestId('stage-commit');
    expect(commit).toBeDisabled();
    fireEvent.click(commit);
    expect(onIntervene).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText(/Let the grain through/));
    expect(commit).toBeEnabled();
    fireEvent.click(commit);
    expect(onIntervene).toHaveBeenCalledWith('choice-support', 2);
  });

  /**
   * The legacy pair is gone as *labels*, not merely relocated — the director's
   * finding was about the words on screen ("the resume/intervene buttons bottom
   * right ... is a legacy UX pattern"), so absence is the assertion.
   */
  it('no longer renders the legacy Intervene / Resume pair', () => {
    render(<EncounterVeil {...defaultProps} />);
    expect(screen.queryByText('Intervene')).toBeNull();
    expect(screen.queryByText('Resume')).toBeNull();
    expect(screen.getByText('Let fate decide')).toBeInTheDocument();
  });

  /**
   * The commit is not a paid-odds purchase any more, so no stance may advertise
   * one. Falsified against the mock's own choices, which carry the boosts the
   * retired mechanic would have printed (0.2 and 0.35 ⇒ "+20%" / "+35%").
   */
  it('never prints a percentage success purchase beside a choice', () => {
    render(<EncounterVeil {...defaultProps} />);
    expect(screen.queryByText(/\+\d+% success/)).toBeNull();
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
    expect(screen.getByText(/auto-resolves shortly/)).toBeInTheDocument();
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
    expect(screen.queryByText(/auto-resolves /)).not.toBeInTheDocument();
  });

  it('clamps past the deadline instead of counting negative', () => {
    render(<EncounterVeil {...lightProps} tick={53} />);
    expect(screen.getByText(/auto-resolving now/)).toBeInTheDocument();
    expect(screen.queryByText(/-37/)).not.toBeInTheDocument();
  });

  it('words the nearest band rather than counting the last tick', () => {
    render(<EncounterVeil {...lightProps} tick={15} />);
    expect(screen.getByText(/auto-resolves in a moment/)).toBeInTheDocument();
  });

  /**
   * THR-1070: the strip was the last surface rendering a raw tick numeral, and
   * every routine review URL misses it — it needs `threadTier === 'light'` AND
   * a non-null `autoResolveTick`, which the `?spawn=` route never produces.
   * So the guard is a sweep of the whole live range rather than a spot check:
   * `RETINUE_VIGNETTE_TIMEOUT` is 8, so 0–8 is every state a player can reach.
   */
  it('renders no numeral anywhere in the strip across the full 0–8 tick range', () => {
    const deadline = 16;
    for (let remaining = 0; remaining <= 8; remaining++) {
      const { unmount } = render(
        <EncounterVeil {...lightProps} autoResolveTick={deadline} tick={deadline - remaining} />,
      );
      // The veil portals into document.body, so query via `screen`, not the
      // render container — the container is empty for a portalled tree.
      const label = screen.getByText(/auto-resolv/);
      expect(label.textContent).not.toMatch(/\d/);
      unmount();
    }
  });

  /**
   * THR-1070 browser-verify substitution (impediment #546 — `preview_start` is
   * refused in unattended runs, so the contractual 1920×1080 capture has no
   * reachable route this pass). #546's scope test allows a jsdom substitution
   * for a change that does not move layout, and pins that claim here rather
   * than asserting it in a commit message:
   *
   * The strip is `[flex:1 bar][gap][nowrap label]`, so the label's width is the
   * only thing that can move — and the widest wording the new scale can produce
   * ("auto-resolves before long") is one character wider than the widest the
   * numeral could ("auto-resolves in 8 ticks"). A one-character delta in a
   * `nowrap` label inside a self-sizing flex row cannot wrap, overflow, or
   * breach the viewport contract.
   */
  it('keeps the strip composition and nowrap label the numeral wording had', () => {
    render(<EncounterVeil {...lightProps} tick={10} />);
    const label = screen.getByText(/auto-resolves before long/);
    expect(label).toHaveStyle({ whiteSpace: 'nowrap' });

    const widestNew = 'auto-resolves before long'.length;
    const widestOld = 'auto-resolves in 8 ticks'.length;
    expect(Math.abs(widestNew - widestOld)).toBeLessThanOrEqual(1);

    // The timer bar still shares the row — the label did not displace it.
    const strip = label.parentElement!;
    expect(strip.children).toHaveLength(2);
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
          category: 'boon',
          categoryLabel: 'BOON',
          categoryGlyph: '✦',
          sentence: { id: 'c-prize', segments: [{ text: 'A wrapped parcel changed hands.' }] },
          sentenceText: 'A wrapped parcel changed hands.',
          compact: false,
          tone: 'gain',
        },
        {
          id: 'c-seed',
          kind: 'seed',
          kindLabel: 'SEED',
          category: 'path',
          categoryLabel: 'PATH',
          categoryGlyph: '◆',
          sentence: {
            id: 'c-seed',
            segments: [
              { text: 'A promise made by ' },
              { text: 'Vasara', referenceId: 'cast:vasara', emphasis: 'strong', entityId: 'actor-1' },
              { text: ' falls due at the full moon.' },
            ],
          },
          sentenceText: 'A promise made by Vasara falls due at the full moon.',
          compact: false,
          tone: 'seed',
        },
      ],
    },
  };

  it('renders a chip per consequence, tagged with its story category (THR-1082)', () => {
    render(<EncounterVeil {...defaultProps} model={chipModel} />);
    expect(screen.getByTestId('aftermath-consequences')).toBeInTheDocument();
    // The wire kind still keys the testid — it is the engine's word for what
    // changed, and the plan keeps it rather than sweeping every fixture.
    expect(screen.getByTestId('consequence-chip-prize')).toBeInTheDocument();
    expect(screen.getByTestId('consequence-chip-seed')).toBeInTheDocument();
    // What the *player* reads is the story category. PRIZE/SEED were mechanical
    // buckets; BOON/PATH say what the change meant to the character. Scoped to
    // the chip because the first-contact legend names all four words too.
    expect(within(screen.getByTestId('consequence-chip-prize')).getByText('BOON')).toBeInTheDocument();
    expect(within(screen.getByTestId('consequence-chip-seed')).getByText('PATH')).toBeInTheDocument();
    expect(screen.queryByText('PRIZE')).not.toBeInTheDocument();
    expect(screen.queryByText('SEED')).not.toBeInTheDocument();
  });

  // ── The granted attachment is reachable (THR-1120) ────────────────
  //
  // Christian's THR-974 verdict: *"I am seeing no links to any reward or
  // penalty attachments anywhere."* A chip whose whole point is that something
  // real was granted must let the player reach that thing (Law 21).
  //
  // These assert the *surface as composed*, which is what the UI-pillar gate
  // asks for: that the chip draws a real control, that activating it hands the
  // host the template id and the kind that routes it, and — the half that keeps
  // the affordance honest — that a chip granting nothing draws no control at all.

  const grantChipModel: EncounterStageModel = {
    ...aftermathModel,
    aftermath: {
      ...aftermathModel.aftermath!,
      consequences: [
        {
          id: 'c-grant',
          kind: 'wound',
          kindLabel: 'WOUND',
          category: 'scar',
          categoryLabel: 'SCAR',
          categoryGlyph: '✕',
          sentence: {
            id: 'c-grant',
            segments: [
              { text: 'They come off the bridge ' },
              {
                text: 'wounded',
                emphasis: 'accent',
                entityId: 'trait.condition.wounded',
                entityKind: 'attachment',
              },
              { text: ', and the leg will have opinions about stairs.' },
            ],
          },
          sentenceText: 'They come off the bridge wounded, and the leg will have opinions about stairs.',
          compact: false,
          tone: 'loss',
        },
      ],
    },
  };

  it('draws a real control on the granted attachment, and hands the host its template id', () => {
    const onSelectEntity = vi.fn();
    render(
      <EncounterVeil {...defaultProps} model={grantChipModel} onSelectEntity={onSelectEntity} />,
    );

    // getByRole('button') is load-bearing: a `role="link"` span would not match,
    // so this also pins the un-nested rendering a chip is supposed to take.
    const link = within(screen.getByTestId('consequence-chip-wound'))
      .getByRole('button', { name: 'wounded' });
    fireEvent.click(link);

    expect(onSelectEntity).toHaveBeenCalledWith('trait.condition.wounded', 'attachment');
  });

  it('leaves the grant as plain text when the host cannot open one', () => {
    // Fail-open, the rule NarrativeSegments already states for every kind: a
    // dead affordance that looks live is worse than no affordance.
    render(<EncounterVeil {...defaultProps} model={grantChipModel} onSelectEntity={undefined} />);

    const chip = within(screen.getByTestId('consequence-chip-wound'));
    expect(chip.queryByRole('button', { name: 'wounded' })).not.toBeInTheDocument();
    expect(chip.getByText('wounded')).toBeInTheDocument();
  });

  it('draws no control on a chip that granted nothing graph-real', () => {
    // The absence half of the Done-when. The pre-existing PRIZE chip names a
    // parcel and grants no node, so it must render exactly as it always did.
    render(<EncounterVeil {...defaultProps} model={chipModel} onSelectEntity={vi.fn()} />);

    const chip = within(screen.getByTestId('consequence-chip-prize'));
    expect(chip.queryByRole('button')).not.toBeInTheDocument();
    expect(chip.getByText('A wrapped parcel changed hands.')).toBeInTheDocument();
  });

  it('LAW 12: introduces the category vocabulary on first contact (THR-1082)', () => {
    render(<EncounterVeil {...defaultProps} model={chipModel} />);
    const legend = screen.getByTestId('consequence-legend');
    expect(legend).toBeInTheDocument();
    // All four words, so the player learns the vocabulary once rather than
    // inferring it from whichever two categories this ending happened to use.
    for (const word of ['SCAR', 'BOND', 'BOON', 'PATH']) {
      expect(within(legend).getByText(word)).toBeInTheDocument();
    }
  });

  // THR-1082 — the compact row. These assert the *surface*, not the adapter:
  // that the veil actually draws a tag and a cluster and withholds the sentence
  // for incidental drift, which is the change Christian's ruling asked for.
  const compactModel: EncounterStageModel = {
    ...aftermathModel,
    aftermath: {
      ...aftermathModel.aftermath!,
      consequences: [
        {
          id: 'c-growth',
          // `mark` is the *display* kind capability growth used to classify as —
          // the retired bucket. Kept as the fixture's wire kind precisely so
          // these assertions prove MARK no longer reaches the screen.
          kind: 'mark',
          kindLabel: 'MARK',
          category: 'boon',
          categoryLabel: 'BOON',
          nounLabel: 'STONE',
          categoryGlyph: '✦',
          reachDomain: 'stone',
          sentence: { id: 'c-growth', segments: [{ text: "Vara's Stone grew steadily." }] },
          sentenceText: "Vara's Stone grew steadily.",
          compact: true,
          delta: { direction: 'gain', count: 2, label: 'Stone rose, a clear amount' },
          tone: 'gain',
        },
      ],
    },
  };

  it('names the changed state on the tag, so no chip says "something" (THR-1082)', () => {
    render(<EncounterVeil {...defaultProps} model={compactModel} />);
    const chip = screen.getByTestId('consequence-chip-mark');
    expect(within(chip).getByText('BOON')).toBeInTheDocument();
    expect(within(chip).getByText('STONE')).toBeInTheDocument();
  });

  it('withholds the sentence on a compact chip, keeping it in the hover tier (THR-1082)', () => {
    render(<EncounterVeil {...defaultProps} model={compactModel} />);
    // The adverb Christian called ungaugeable is off the screen...
    expect(screen.queryByText(/grew steadily/)).not.toBeInTheDocument();
    // ...but not destroyed: it rides the cluster's label, one hover away.
    const cluster = screen.getByTestId('delta-cluster');
    expect(cluster.getAttribute('aria-label')).toContain('Stone rose, a clear amount');
    expect(cluster.getAttribute('aria-label')).toContain('grew steadily');
  });

  it('draws the magnitude as marks the eye can count, never a numeral (THR-1082)', () => {
    render(<EncounterVeil {...defaultProps} model={compactModel} />);
    const cluster = screen.getByTestId('delta-cluster');
    expect(cluster).toHaveAttribute('data-count', '2');
    expect(cluster.textContent).toBe('▲▲');
    expect(cluster.textContent).not.toMatch(/\d/);
  });

  it('tiles a reach consequence with the shared reach glyph, not a guessed entity (THR-1082)', () => {
    render(<EncounterVeil {...defaultProps} model={compactModel} />);
    expect(screen.getByTestId('consequence-chip-reach-boon')).toBeInTheDocument();
  });

  it('falls back to the category glyph when neither entity nor reach resolves (THR-1082)', () => {
    // `flesh` is tooltip-backed but has no icon in REACH_TO_SPHERE — the exact
    // case that would render a glyph with an undefined sphere colour.
    const fleshModel: EncounterStageModel = {
      ...compactModel,
      aftermath: {
        ...compactModel.aftermath!,
        consequences: [{ ...compactModel.aftermath!.consequences![0], reachDomain: 'flesh' }],
      },
    };
    render(<EncounterVeil {...defaultProps} model={fleshModel} />);
    expect(screen.queryByTestId('consequence-chip-reach-boon')).not.toBeInTheDocument();
    expect(screen.getByTestId('consequence-chip-glyph-boon')).toBeInTheDocument();
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
            category: 'bond',
            categoryLabel: 'BOND',
            categoryGlyph: '◈',
            sentence: {
              id: 'c-standing',
              segments: [
                { text: "Vara's " },
                { text: 'standing', emphasis: 'accent', tooltipId },
                { text: ' rose sharply.' },
              ],
            },
            sentenceText: "Vara's standing rose sharply.",
            // Not compact: this fixture exists to prove the sentence's concept
            // words stay keyboard-reachable, which a compact chip has none of.
            compact: false,
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

  // ── Chip segments render through NarrativeSegments (THR-1105) ────
  //
  // All three tiers were already pinned before this block existed, and those
  // assertions pass unchanged through the substitution — which is the evidence
  // that matters: the click tier by `getByRole('button', { name: 'Vasara' })`
  // (line ~700), which would *not* match had the chips been handed `nested`,
  // since that draws a `role="link"` span rather than a button; the hover and
  // plain tiers by the Law 17/21 cases just above. What is genuinely new is the
  // per-segment test ids the shared renderer emits, so pin only that rather
  // than restating coverage that already holds.
  describe('chip segments through the shared renderer (THR-1105)', () => {
    it('emits per-segment test ids so a chip sentence is inspectable (NFP #2)', () => {
      render(<EncounterVeil {...defaultProps} model={chipModel} />);
      const chip = screen.getByTestId('consequence-chip-seed');
      expect(within(chip).getByTestId('consequence-chip-seed-seg-0')).toBeInTheDocument();
      expect(within(chip).getByTestId('consequence-chip-seed-seg-1')).toHaveTextContent('Vasara');
      expect(within(chip).getByTestId('consequence-chip-seed-seg-2')).toBeInTheDocument();
    });

    it('emits no segment ids for a compact chip, which draws no sentence (THR-1082 held)', () => {
      render(<EncounterVeil {...defaultProps} model={compactModel} />);
      expect(screen.queryByTestId('consequence-chip-mark-seg-0')).not.toBeInTheDocument();
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

  // ── Reaction entity links (THR-1084) ─────────────────────────────
  //
  // The defect: one modal named the same person twice — gold and clickable in
  // the SEED change-detail line, flat text in the reaction directly beneath it
  // (Laws 1, 21). Every assertion below fails on the pre-THR-1084 veil, which
  // rendered `reaction.label` as a bare string and had nowhere to put a link.
  //
  // The nested-interaction decision under test: the entity is a `role="link"`
  // span that stops propagation, so the button's own pick still fires on every
  // other pixel of the option. A nested `<button>` would be invalid HTML.

  const LINKED_LABEL = {
    id: 'reaction-r1-label',
    segments: [
      { text: 'Deepen the connection to ' },
      { text: 'Councilor Maevis Drent', entityId: 'agent-maevis', entityKind: 'agent' as const },
      { text: '.' },
    ],
  };

  const linkedReaction = [{ id: 'r1', label: 'Deepen the connection to Councilor Maevis Drent.', labelSegments: LINKED_LABEL }];

  it('renders an entity named in a reaction label as a link routed by kind', () => {
    render(
      <EncounterVeil
        {...defaultProps}
        model={reactionModel(linkedReaction)}
        onSelectAgent={vi.fn()}
      />,
    );
    const link = screen.getByTestId('aftermath-reaction-label-r1-seg-1');
    expect(link).toHaveAttribute('role', 'link');
    expect(link).toHaveTextContent('Councilor Maevis Drent');
    // Keyboard-reachable, per Law 17/23 — a link nobody can focus is inert.
    expect(link).toHaveAttribute('tabindex', '0');
    // NOT a nested <button>: that is invalid HTML inside the reaction button.
    expect(link.tagName).toBe('SPAN');
  });

  it('opens the entity on click WITHOUT also firing the reaction pick', () => {
    const onSelectAgent = vi.fn();
    const onAftermathReaction = vi.fn();
    render(
      <EncounterVeil
        {...defaultProps}
        model={reactionModel(linkedReaction)}
        onSelectAgent={onSelectAgent}
        onAftermathReaction={onAftermathReaction}
      />,
    );
    fireEvent.click(screen.getByTestId('aftermath-reaction-label-r1-seg-1'));
    expect(onSelectAgent).toHaveBeenCalledWith('agent-maevis');
    // The whole point of `nested`: the pick must not fire alongside it.
    expect(onAftermathReaction).not.toHaveBeenCalled();
  });

  it('opens the entity on Enter WITHOUT also firing the reaction pick', () => {
    const onSelectAgent = vi.fn();
    const onAftermathReaction = vi.fn();
    render(
      <EncounterVeil
        {...defaultProps}
        model={reactionModel(linkedReaction)}
        onSelectAgent={onSelectAgent}
        onAftermathReaction={onAftermathReaction}
      />,
    );
    fireEvent.keyDown(screen.getByTestId('aftermath-reaction-label-r1-seg-1'), { key: 'Enter' });
    expect(onSelectAgent).toHaveBeenCalledWith('agent-maevis');
    expect(onAftermathReaction).not.toHaveBeenCalled();
  });

  it('KEEPS the button as the pick target — a click on non-entity prose still picks', () => {
    const onSelectAgent = vi.fn();
    const onAftermathReaction = vi.fn();
    render(
      <EncounterVeil
        {...defaultProps}
        model={reactionModel(linkedReaction)}
        onSelectAgent={onSelectAgent}
        onAftermathReaction={onAftermathReaction}
      />,
    );
    fireEvent.click(screen.getByTestId('aftermath-reaction-label-r1-seg-0'));
    expect(onAftermathReaction).toHaveBeenCalledWith('r1');
    expect(onSelectAgent).not.toHaveBeenCalled();
  });

  it('FAIL-OPEN: an entity the host cannot open stays plain text, never a dead link', () => {
    // No `onSelectAgent` wired ⇒ no page to route to ⇒ no affordance drawn.
    render(<EncounterVeil {...defaultProps} model={reactionModel(linkedReaction)} />);
    const seg = screen.getByTestId('aftermath-reaction-label-r1-seg-1');
    expect(seg).not.toHaveAttribute('role', 'link');
    expect(seg).not.toHaveAttribute('tabindex');
    expect(seg).toHaveTextContent('Councilor Maevis Drent');
  });

  it('links an entity named in the reaction INTENT too', () => {
    const onSelectAgent = vi.fn();
    render(
      <EncounterVeil
        {...defaultProps}
        model={reactionModel([
          {
            id: 'r1',
            label: 'Move on',
            intent: 'Councilor Maevis Drent remembers the favour.',
            intentSegments: {
              id: 'reaction-r1-intent',
              segments: [
                { text: 'Councilor Maevis Drent', entityId: 'agent-maevis', entityKind: 'agent' as const },
                { text: ' remembers the favour.' },
              ],
            },
          },
        ])}
        onSelectAgent={onSelectAgent}
      />,
    );
    fireEvent.click(screen.getByTestId('aftermath-reaction-intent-r1-seg-0'));
    expect(onSelectAgent).toHaveBeenCalledWith('agent-maevis');
  });

  it('FALLBACK: a reaction with no segments renders its plain label unchanged', () => {
    render(<EncounterVeil {...defaultProps} model={reactionModel(loneReaction)} />);
    expect(screen.getByTestId('aftermath-reaction-label-slice.bridge.walk_on'))
      .toHaveTextContent('Walk on');
    expect(screen.queryByTestId('aftermath-reaction-label-slice.bridge.walk_on-seg-0'))
      .not.toBeInTheDocument();
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
