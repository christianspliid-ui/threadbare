// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { EncounterStage } from '../EncounterStage';
import type { EncounterStageModel } from '../types';

const speakMock = vi.fn<(_: string) => Promise<void>>(() => Promise.resolve());
const stopMock = vi.fn();

vi.mock('../../../../services/narration/useNarration', () => ({
  useNarration: () => ({
    enabled: true,
    status: 'ready' as const,
    backendType: 'server' as const,
    loadProgress: 1,
    error: null,
    isSpeaking: false,
    isLoading: false,
    isAvailable: false,
    init: vi.fn(),
    initWorker: vi.fn(),
    speak: speakMock,
    speakSections: vi.fn(),
    stop: stopMock,
    narrateChronicle: vi.fn(),
  }),
}));

const mockModel: EncounterStageModel = {
  header: {
    title: 'Gate Duty',
    subtitle: 'Sergeant Tal is threading the checkpoint under pressure.',
    locationLabel: 'South Quarantine Gate',
    urgencyLabel: 'Curfew pressure',
    threatLabel: 'easy',
    threadTier: 'strong',
    familyLabel: 'Clearance Gate',
  },
  illustration: {
    src: '/concept-art/encounters/gate-duty.jpg',
    alt: 'A torchlit checkpoint beneath a stone gate at dusk, with a captain stopping a cart while the waiting line watches.',
    caption: 'Some encounters arrive with a remembered image already clinging to them.',
  },
  scene: {
    situationProse: 'A fever cart waits outside the gate while the line starts to harden around it.',
    pressureProse: 'Captain Merrow is hesitating while the crowd begins to watch and judge.',
    noticeLines: [
      'The captain keeps returning to the seal instead of looking at the line.',
      'A porter nearby is already deciding how this story will be told after dusk.',
    ],
    stakesProse: 'If the cart passes badly, suspicion clings to the watch. If it stays here much longer, the district pays for the delay.',
    momentLine: 'If the cart waits, panic deepens.',
  },
  narrative: {
    paragraphs: [
      {
        id: 'scene',
        segments: [
          { text: 'At ', emphasis: 'default' },
          { text: 'South Quarantine Gate', referenceId: 'location', emphasis: 'accent' },
          { text: ', ', emphasis: 'default' },
          { text: 'Captain Merrow', referenceId: 'cast:npc.captain', emphasis: 'strong' },
          { text: ' is hesitating while ', emphasis: 'default' },
          { text: 'Courier Nessa', referenceId: 'cast:npc.courier', emphasis: 'strong' },
          { text: ' tries not to break in front of the line.', emphasis: 'default' },
        ],
      },
    ],
    references: [
      { id: 'location', label: 'South Quarantine Gate', detail: 'The gatehouse where the line is deciding what this scene means.', tone: 'accent' },
      { id: 'cast:npc.captain', label: 'Captain Merrow', detail: 'Controls whether the line hardens or breaks.', tone: 'accent' },
      { id: 'cast:npc.courier', label: 'Courier Nessa', detail: 'Carries the immediate risk through the gate.', tone: 'default' },
    ],
  },
  cast: [
    { id: 'npc.captain', name: 'Captain Merrow', role: 'authority', roleLabel: 'Authority at the gate', description: 'Controls whether the line hardens or breaks.', reused: true },
    { id: 'npc.courier', name: 'Courier Nessa', role: 'subject', roleLabel: 'Subject under scrutiny', description: 'Carries the immediate risk through the gate.' },
  ],
  factions: [
    { id: 'civic_guard', label: 'Civic Guard', pressure: 'Hold the line without losing legitimacy.' },
  ],
  shellState: {
    shellType: 'clearance_gate',
    state: 'flagged',
    stateLabel: 'Flagged',
    stateHint: 'Current pressure tags: #papers_flagged',
  },
  signals: [
    {
      id: 'forged_papers',
      label: 'Forged Papers',
      visibility: 'revealed',
      visibilityLabel: 'Named',
      observation: 'The seal and signatures are wrong; anyone close enough to see the papers knows they will not survive a second inspection.',
    },
    {
      id: 'hidden_cargo',
      label: 'Hidden Cargo',
      visibility: 'hidden',
      visibilityLabel: 'Unspoken',
      observation: 'The cart rides heavier than its manifest suggests, but the line has not yet understood why that matters.',
    },
  ],
  choices: [
    {
      id: 'choice-force',
      label: 'Force the captain',
      intent: 'Force a resolution through pressure before the crowd turns.',
      essenceCost: 0,
      affordable: true,
      targetLabel: 'Captain Merrow',
      likelyBurden: 'Public suspicion or overreach',
    },
    {
      id: 'choice-too-expensive',
      label: 'Burn too brightly',
      intent: 'Spend more essence than you hold and try to crush the whole scene into submission.',
      essenceCost: 5,
      affordable: false,
      costLabel: '5.00 essence',
      targetLabel: 'The whole gatehouse',
      likelyBurden: 'The touch would be obvious to everyone present.',
    },
  ],
  falloutPreview: [
    { kind: 'reputation', label: 'District trust or unease' },
    { kind: 'suspicion', label: 'Watch suspicion and checkpoint scrutiny' },
  ],
  history: [
    { stepId: 'step-1', stepLabel: 'Read the Queue', status: 'resolved', afterimage: 'The forged seal becomes obvious.' },
    { stepId: 'step-2', stepLabel: 'Seize the Courier', status: 'current' },
  ],
  resourceSummary: {
    quintessence: 0.34,
  },
};

const aftermathModel: EncounterStageModel = {
  ...mockModel,
  illustration: undefined,
  choices: [],
  aftermath: {
    title: 'What Changed',
    overview: 'Ashara did not leave the gate unchanged. These are the consequences still pressing on tomorrow.',
    actorMoments: [
      {
        id: 'ashara',
        actorName: 'Ashara',
        summaryLines: ['Ashara is now Tempered in Iron.'],
        marks: [
          {
            id: 'ill-luck',
            label: 'Ill Luck',
            tooltipLabel: '⊘ Ill Luck [Murmur]',
            tooltipDesc: 'Misfortune clings like smoke. Commerce and stealth suffer.',
            tone: 'warning',
          },
        ],
      },
    ],
    highlights: [
      {
        id: 'after-1',
        title: 'The night will keep travelling',
        detail: 'The witness leaves the gate carrying a sharper version of the night.',
        tone: 'info',
      },
    ],
    reactionPrompt: 'Choose what you keep hold of now that the checkpoint itself is over.',
    reactions: [
      {
        id: 'follow_witness_story',
        label: 'Follow the rumor while it is still warm',
        intent: 'Choose this if you want the next consequence to come through gossip, retelling, and the witness’s version of the night.',
      },
    ],
  },
};

describe('EncounterStage', () => {
  beforeEach(() => {
    speakMock.mockClear();
    stopMock.mockClear();
  });

  afterEach(() => {
    speakMock.mockClear();
    stopMock.mockClear();
  });

  it('renders the proving-encounter fiction, cast, and shell state', () => {
    render(
      <EncounterStage
        open={true}
        onDisregard={() => {}}
        onCommitChoice={() => {}}
        model={mockModel}
      />,
    );

    expect(screen.getByText('Gate Duty')).toBeInTheDocument();
    expect(screen.getAllByText(/South Quarantine Gate/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Captain Merrow').length).toBeGreaterThan(0);
    expect(screen.getByText('Scene')).toBeInTheDocument();
    expect(screen.getByText('Choose Your Approach')).toBeInTheDocument();
    expect(screen.getByText('Scene So Far')).toBeInTheDocument();
    expect(screen.getByText('Your Reserves')).toBeInTheDocument();
    expect(screen.getByAltText(/torchlit checkpoint/i)).toBeInTheDocument();
  });

  it('selects a choice first and only commits when Next is pressed', () => {
    const onCommitChoice = vi.fn();
    render(
      <EncounterStage
        open={true}
        onDisregard={() => {}}
        onCommitChoice={onCommitChoice}
        model={mockModel}
      />,
    );

    fireEvent.click(screen.getByText('Force the captain'));
    expect(onCommitChoice).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Next/ }));
    expect(onCommitChoice).toHaveBeenCalledWith('choice-force');
  });

  it('does not allow selecting a choice that the player cannot afford', () => {
    const onCommitChoice = vi.fn();
    render(
      <EncounterStage
        open={true}
        onDisregard={() => {}}
        onCommitChoice={onCommitChoice}
        model={mockModel}
      />,
    );

    fireEvent.click(screen.getByText('Burn too brightly'));
    fireEvent.click(screen.getByRole('button', { name: /Next/ }));

    expect(onCommitChoice).not.toHaveBeenCalled();
    expect(screen.getByText('You cannot afford this thread.')).toBeInTheDocument();
  });

  it('narrates a scene paragraph and a choice with Kokoro narration', async () => {
    render(
      <EncounterStage
        open={true}
        onDisregard={() => {}}
        onCommitChoice={() => {}}
        model={mockModel}
      />,
    );

    fireEvent.click(screen.getByLabelText('Play narration for scene paragraph 1'));
    await waitFor(() => {
      expect(speakMock).toHaveBeenCalledWith(
        'At South Quarantine Gate, Captain Merrow is hesitating while Courier Nessa tries not to break in front of the line.',
      );
    });

    fireEvent.click(screen.getByLabelText('Play narration for choice Force the captain'));
    await waitFor(() => {
      expect(speakMock).toHaveBeenLastCalledWith(
        'Force a resolution through pressure before the crowd turns.',
      );
    });
  });

  it('renders aftermath changes and lets the player react before returning to the world', () => {
    const onAftermathReaction = vi.fn();
    const onAcknowledgeAftermath = vi.fn();

    render(
      <EncounterStage
        open={true}
        onDisregard={() => {}}
        onCommitChoice={() => {}}
        onAftermathReaction={onAftermathReaction}
        onAcknowledgeAftermath={onAcknowledgeAftermath}
        model={aftermathModel}
      />,
    );

    expect(screen.getByText('What Changed')).toBeInTheDocument();
    expect(screen.getByText('Ashara')).toBeInTheDocument();
    expect(screen.getByText(/Tempered in Iron/)).toBeInTheDocument();
    expect(screen.getByText('Ill Luck')).toBeInTheDocument();
    expect(screen.getByText('Follow the rumor while it is still warm')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Follow the rumor while it is still warm'));
    expect(onAftermathReaction).toHaveBeenCalledWith('follow_witness_story');

    fireEvent.click(screen.getByRole('button', { name: 'Return to the world' }));
    expect(onAcknowledgeAftermath).toHaveBeenCalled();
  });
});
