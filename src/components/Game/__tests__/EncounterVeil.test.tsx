// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
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
});
