// @vitest-environment jsdom
/**
 * THR-1048 — machine gates over the **rendered** legacy choice block.
 *
 * The ticket's first two Done-whens are "no `%` renders" and "no
 * `interventionType` value reaches the DOM verbatim", and both say *assert it,
 * do not inspect it*. A source-shape gate (the `encounterVeilLaws` pattern)
 * cannot discharge these: the enum arrives from an adapter, so the offending
 * literal never appears in `EncounterVeil.tsx` at all — the file says
 * `{choice.interventionType}` and reads clean. Only a render sees it.
 *
 * **Why the forbidden strings are literals here too.** Importing the stance
 * union, or reading the vocabulary table, would make the gate agree with
 * whatever the code decided — including a regression that starts printing keys
 * again. `'supportive'` is written out three times on purpose.
 *
 * **Anti-vacuity.** Every gate below first asserts the choice block actually
 * rendered. A veil that renders no choices trivially contains no `%` and no
 * enum, and a gate that passes on an empty surface is the failure mode these
 * were written to avoid: it would have gone green through the entire period
 * the violation shipped.
 *
 * This file is also THR-1048's browser-verify substitution — the run that
 * authored it was unattended and could not start a dev server (impediments
 * #546, #574), so these renders of the real component are the surface
 * evidence in place of a 1920×1080 capture.
 */

import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EncounterVeil } from '../EncounterVeil';
import type { EncounterStageChoiceModel, EncounterStageModel } from '../encounter-stage/types';
import { buildSimpleEncounterStageModel } from '../encounter-stage/adapters/buildSimpleEncounterStageModel';
import { WorldGraph } from '../../../engine/graph';
import type { UnifiedActionTemplate } from '../../../types/unifiedAction';
import type { EncounterNotification } from '../../../types/encounterVisibility';

vi.mock('../../../services/narration/useNarration', () => ({
  useNarration: () => ({
    enabled: false, status: 'idle' as const, backendType: null, loadProgress: 0,
    error: null, isSpeaking: false, isLoading: false, isAvailable: false,
    init: vi.fn(), initWorker: vi.fn(), speak: vi.fn(), speakSections: vi.fn(),
    stop: vi.fn(), narrateChronicle: vi.fn(),
  }),
}));

/** The three enum values Law 14 forbids on this surface. Literals, deliberately. */
const FORBIDDEN_KEYS = ['supportive', 'coercive', 'withdrawn'] as const;

/**
 * All three stances, each with the fields that used to print raw: a
 * `probabilityBoost` (the `+N% success` line, THR-1121) and an
 * `interventionType` (the stance tag, this ticket).
 */
const CHOICES: EncounterStageChoiceModel[] = [
  {
    id: 'choice-support',
    label: 'Show mercy',
    intent: 'Let the grain through. The settlements are hungry.',
    essenceCost: 2,
    affordable: true,
    interventionType: 'supportive',
    stanceLabel: 'lend strength',
    godVoice: 'The hungry do not eat paperwork.',
    probabilityBoost: 0.15,
  },
  {
    id: 'choice-coerce',
    label: 'Seize it',
    intent: 'Hold the shipment. The truth matters more.',
    essenceCost: 4,
    affordable: true,
    interventionType: 'coercive',
    stanceLabel: 'press them',
    probabilityBoost: 0.03,
  },
  {
    id: 'choice-withdraw',
    label: 'Step back',
    intent: 'Let Vasara decide alone.',
    essenceCost: 0,
    affordable: true,
    interventionType: 'withdrawn',
    stanceLabel: 'stand back',
    probabilityBoost: 0,
  },
];

const model: EncounterStageModel = {
  header: {
    title: 'Gate Duty',
    subtitle: 'A test of authority',
    locationLabel: 'South Gate',
    threatLabel: 'moderate',
    threadTier: 'strong',
  },
  scene: { situationProse: 'The torchlight gutters.', pressureProse: '', noticeLines: [] },
  narrative: {
    paragraphs: [{ id: 'p-0', segments: [{ text: 'The line does not move.', emphasis: 'default' }] }],
    references: [],
  },
  cast: [],
  factions: [],
  signals: [],
  choices: CHOICES,
  falloutPreview: [],
  history: [],
  resourceSummary: { quintessence: 12 },
};

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
  onAcknowledgeAftermath: vi.fn(),
  onAftermathReaction: vi.fn(),
};

/**
 * The rendered veil's text. `textContent` rather than a snapshot: the gate is
 * about which *characters* reach the player, and a snapshot would go green on
 * a re-introduced percentage as long as someone re-blessed it.
 */
function veilText(): string {
  return screen.getByRole('dialog').textContent ?? '';
}

describe('THR-1048 — the legacy choice block obeys Laws 13 and 14', () => {
  it('renders the choice block at all (anti-vacuity for every gate below)', () => {
    render(<EncounterVeil {...props} />);

    const stances = screen.getAllByTestId('choice-stance');
    expect(stances).toHaveLength(3);
    // The intents are the card faces; if these are absent the surface under
    // test is not on screen and the "no forbidden text" gates prove nothing.
    expect(screen.getByText(/Let the grain through/)).toBeInTheDocument();
    expect(screen.getByText(/Hold the shipment/)).toBeInTheDocument();
    expect(screen.getByText(/Let Vasara decide/)).toBeInTheDocument();
  });

  it('Law 13 — no percentage anywhere on the veil', () => {
    render(<EncounterVeil {...props} />);

    // Falsified against choices carrying live boosts (0.15 and 0.03): before
    // THR-1121 this surface printed "+15% success" and "+3% success" from
    // exactly these values.
    expect(veilText()).not.toContain('%');
  });

  it('Law 14 — no interventionType value reaches the DOM verbatim', () => {
    render(<EncounterVeil {...props} />);

    const text = veilText().toLowerCase();
    for (const key of FORBIDDEN_KEYS) {
      expect(text).not.toContain(key);
    }
  });

  it('Law 14 — the stance renders as words instead', () => {
    render(<EncounterVeil {...props} />);

    const stances = screen.getAllByTestId('choice-stance').map((el) => el.textContent);
    expect(stances).toEqual(['lend strength', 'press them', 'stand back']);
  });

  it('Law 31 — the stance colour is never the only channel', () => {
    render(<EncounterVeil {...props} />);

    // Each coloured stance span carries a word. A colour-only tag would read
    // as decoration to anyone who cannot separate the three hues.
    for (const el of screen.getAllByTestId('choice-stance')) {
      expect(el.textContent?.trim()).toBeTruthy();
    }
  });

  it('renders no stance tag for a choice the producer left untagged', () => {
    // Authored choice cards carry prose instead of a stance. The row must be
    // empty for them, not fall back to a word nobody authored.
    const untagged: EncounterStageModel = {
      ...model,
      choices: [{ id: 'authored', label: 'Speak plainly', intent: 'You tell them the truth.', essenceCost: 1, affordable: true }],
    };
    render(<EncounterVeil {...props} model={untagged} />);

    expect(screen.getByText(/You tell them the truth/)).toBeInTheDocument();
    expect(screen.queryByTestId('choice-stance')).not.toBeInTheDocument();
  });
});

describe('THR-1048 — the live producer bands the stance', () => {
  /**
   * `buildSimpleEncounterStageModel` is the adapter that actually reached the
   * player with a raw enum: `phaseEncounterVisibility` overwrites
   * `notification.choices` with the authored hand (each card keeping its
   * `interventionType`), and a `watched`-tier encounter routes here rather
   * than to the unified adapter. Driving the real adapter — not a hand-built
   * model — is what makes this a gate on the production path.
   */
  it('produces stanceLabel, and the veil renders it with no enum on screen', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'agent:vasara',
      type: 'agent',
      name: 'Vasara',
      properties: {},
    } as never);

    const template = {
      id: 'test.gate',
      name: 'Gate Duty',
      steps: [{ id: 'step-1', label: 'First Step', reach: 'iron', difficulty: 45 }],
    } as unknown as UnifiedActionTemplate;

    const notification = {
      id: 'notif-1',
      encounterId: 'test.gate',
      agentId: 'agent:vasara',
      agentName: 'Vasara',
      prose: 'The line does not move.',
      choices: [
        { id: 'c1', text: 'Show mercy', essenceCost: 2, probabilityBoost: 0.15, interventionType: 'supportive' as const },
        { id: 'c2', text: 'Seize it', essenceCost: 4, probabilityBoost: 0.03, interventionType: 'coercive' as const },
      ],
    } as unknown as EncounterNotification;

    const built = buildSimpleEncounterStageModel({
      notification,
      encounter: { resolutionSnapshots: [] } as never,
      template,
      agentName: 'Vasara',
      agentId: 'agent:vasara',
      graph,
      threadTier: 'watched',
      essence: 12,
      tick: 10,
      gameState: { tick: 10, graph } as never,
    } as never);

    expect(built.choices).toHaveLength(2);
    expect(built.choices.map((c) => c.stanceLabel)).toEqual(['lend strength', 'press them']);

    render(<EncounterVeil {...props} model={built} />);

    const text = (screen.getByRole('dialog').textContent ?? '').toLowerCase();
    expect(text).toContain('lend strength');
    for (const key of FORBIDDEN_KEYS) {
      expect(text).not.toContain(key);
    }
    expect(text).not.toContain('%');
  });
});
