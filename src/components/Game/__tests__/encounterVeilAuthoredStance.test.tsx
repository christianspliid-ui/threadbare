// @vitest-environment jsdom
/**
 * THR-1411 — the attended veil renders the authored hand's stance.
 *
 * **This file is the ticket's browser-verify substitution.** The run that
 * authored it was unattended and `preview_start` is refused outright there
 * (impediments #546, #574), which also shuts the Playwright route since it
 * presumes a running server. Per `Docs/canon/verification-gates.md`
 * § Browser-verify, the sanctioned replacement is jsdom render assertions on
 * the real component — recorded in the commit as
 * `Browser-verify substitution: jsdom-render — unattended run, no startable dev server`.
 *
 * **Why it is not a second copy of `encounterVeilChoiceLaws.test.tsx`.** That
 * file hands `EncounterVeil` a fixture choice that already carries
 * `stanceLabel`, so it proves the surface renders a stance it was given. It
 * went green through the entire period the attended veil showed no stance at
 * all. This file starts one step earlier — the real shipped
 * `crafting.quest.flawed_steel` template, through the real
 * `buildUnifiedEncounterStageModel`, into the real veil — so the producer is
 * inside the system under test rather than standing in for it.
 */

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { EncounterVeil } from '../EncounterVeil';
import { buildUnifiedEncounterStageModel } from '../encounter-stage/adapters/buildUnifiedEncounterStageModel';
import { UNIFIED_ACTION_TEMPLATES } from '../../../data/unified-action-templates';
import { WorldGraph } from '../../../engine/graph';
import type { EncounterNotification } from '../../../types/encounterVisibility';
import type { UnifiedAction, UnifiedActionTemplate } from '../../../types/unifiedAction';

vi.mock('../../../services/narration/useNarration', () => ({
  useNarration: () => ({
    enabled: false, status: 'idle' as const, backendType: null, loadProgress: 0,
    error: null, isSpeaking: false, isLoading: false, isAvailable: false,
    init: vi.fn(), initWorker: vi.fn(), speak: vi.fn(), speakSections: vi.fn(),
    stop: vi.fn(), narrateChronicle: vi.fn(),
  }),
}));

const AGENT_ID = 'agent.maren_probe';
const AGENT_NAME = 'Kael Thornweaver';
const TARGET_ID = 'loc.ironhewn_forge';

const FLAWED_STEEL: UnifiedActionTemplate = (() => {
  const t = UNIFIED_ACTION_TEMPLATES.find((x) => x.id === 'crafting.quest.flawed_steel');
  if (!t) throw new Error('crafting.quest.flawed_steel is not in the shipped catalog');
  return t;
})();

function buildGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: AGENT_ID, type: 'actor', name: AGENT_NAME,
    properties: { actorType: 'individual' },
  });
  graph.addNode({ id: TARGET_ID, type: 'location', name: 'Ironhewn Forge', properties: {} });
  return graph;
}

function buildAction(stepIndex: number): UnifiedAction {
  return {
    actionId: `ua_veil_stance_${stepIndex}`,
    actorId: AGENT_ID,
    templateId: FLAWED_STEEL.id,
    targetId: TARGET_ID,
    scale: FLAWED_STEEL.scale,
    source: 'agent',
    startTick: 1,
    currentStep: stepIndex,
    stepProgress: 0,
    stepDuration: 2,
    resolved: false,
    stepOutcomes: [],
  };
}

/**
 * No choices on the notification — the generic fallback is the adapter's only
 * other stance producer, so emptying it means anything rendered below came from
 * the authored card.
 */
function buildChoicelessNotification(): EncounterNotification {
  return {
    id: 'notif_veil_stance',
    agentId: AGENT_ID,
    agentName: AGENT_NAME,
    courtPosition: 'the_first',
    encounterId: FLAWED_STEEL.id,
    encounterName: FLAWED_STEEL.name,
    prose: 'The forge is cold and the letter is still in her hand.',
    choices: [],
    createdTick: 1,
    autoResolveTick: null,
    viewed: false,
    resolved: false,
  };
}

function renderVeilAtStep(stepIndex: number) {
  const model = buildUnifiedEncounterStageModel({
    template: FLAWED_STEEL,
    activeAction: buildAction(stepIndex),
    notification: buildChoicelessNotification(),
    agentName: AGENT_NAME,
    threadTier: 'strong',
    graph: buildGraph(),
    essence: 12,
  });

  render(
    <EncounterVeil
      open
      model={model}
      threadTier="strong"
      essence={12}
      tick={10}
      autoResolveTick={null}
      onIntervene={vi.fn()}
      onBoost={vi.fn()}
      onPeek={vi.fn()}
      onDisregard={vi.fn()}
      onAcknowledgeAftermath={vi.fn()}
      onAftermathReaction={vi.fn()}
    />,
  );

  return model;
}

function veilText(): string {
  return screen.getByRole('dialog').textContent ?? '';
}

describe('THR-1411 — the authored hand reaches the attended veil with its stance', () => {
  it('renders the three authored cards at all (anti-vacuity for every gate below)', () => {
    const model = renderVeilAtStep(0);

    // The model is the authored hand, not an empty fallback.
    expect(model.choices).toHaveLength(3);
    // And the card faces are on screen — a veil with no choices would pass
    // every "contains the right words" gate below by containing nothing.
    expect(screen.getByText(/Steady the forge-master's resolve/)).toBeInTheDocument();
    expect(screen.getByText(/Whisper into the gaps/)).toBeInTheDocument();
    expect(screen.getByText(/Hold your essence/)).toBeInTheDocument();
  });

  it('shows a stance word on every card — the element the pixel sweep found 0 of', () => {
    renderVeilAtStep(0);

    // The exact query from the ticket's evidence:
    // `document.querySelectorAll('[data-testid=choice-stance]')` → was 0.
    const stances = screen.getAllByTestId('choice-stance');
    expect(stances).toHaveLength(3);
    expect(stances.map((el) => el.textContent)).toEqual([
      'lend strength',
      'press them',
      'stand back',
    ]);
  });

  it('reveals the stance on hover, and keeps it transparent at rest', () => {
    renderVeilAtStep(0);

    // The meta row is hover-revealed by design; the ticket's Done-when is
    // "hovering a card shows the stance word".
    const [firstStance] = screen.getAllByTestId('choice-stance');
    expect(firstStance).toHaveStyle({ opacity: '0' });

    const card = firstStance.closest('button');
    expect(card).not.toBeNull();
    fireEvent.mouseEnter(card!);

    expect(within(card!).getByTestId('choice-stance')).toHaveStyle({ opacity: '1' });
    expect(within(card!).getByTestId('choice-stance')).toHaveTextContent('lend strength');
  });

  it('restores the two sibling reads that died with the same dropped field', () => {
    renderVeilAtStep(0);

    // `interventionType` also drives the withdrawn card's `fate decides` label.
    // It was absent from the attended veil for the same reason the stance was.
    expect(veilText()).toContain('fate decides');

    // ...and the card's glow line, which renders only when `typeColor` resolves.
    const withdrawn = screen.getByText('stand back').closest('button');
    expect(withdrawn).not.toBeNull();
    expect(withdrawn!.querySelectorAll('div[style*="linear-gradient"]').length).toBeGreaterThan(0);
  });

  it('keeps the withdrawn card\'s three-item meta row on one line (Law 33, structural half)', () => {
    renderVeilAtStep(0);

    // `stand back · ◆ 0 essence · fate decides` is the longest meta row the
    // change can produce, and the ticket asks whether it wraps or pushes the
    // 540px card. The half that is answerable without a layout engine is the
    // decisive one: this row sets no `flexWrap`, so it is `nowrap` by CSS
    // default and *cannot* wrap whatever it holds.
    const withdrawn = screen.getByText('stand back').closest('button');
    expect(withdrawn).not.toBeNull();

    const metaRow = screen.getByText('stand back').parentElement;
    expect(metaRow).not.toBeNull();
    expect(metaRow!.style.display).toBe('flex');
    expect(metaRow!.style.flexWrap).toBe(''); // unset => `nowrap`

    // All three items are in that one row, so none of them is escaping into a
    // second line by being parented somewhere else.
    expect(metaRow!.textContent).toContain('stand back');
    expect(metaRow!.textContent).toContain('essence');
    expect(metaRow!.textContent).toContain('fate decides');

    // And the card keeps its width cap, so a long row overflows rather than
    // widening the column.
    expect(withdrawn!.style.maxWidth).toBe('540px');
  });

  it('Law 14 — no interventionType key reaches the DOM verbatim', () => {
    renderVeilAtStep(0);

    const text = veilText().toLowerCase();
    // Literals on purpose: importing the union would let the gate agree with a
    // regression that starts printing keys again.
    for (const key of ['supportive', 'coercive', 'withdrawn']) {
      expect(text).not.toContain(key);
    }
  });

  it('holds on the second authored step too, so this is not a step-0 special case', () => {
    const model = renderVeilAtStep(1);

    expect(model.choices).toHaveLength(2);
    expect(screen.getAllByTestId('choice-stance').map((el) => el.textContent)).toEqual([
      'lend strength',
      'press them',
    ]);
  });

  it('renders no stance element for a choice that carries no stance', () => {
    // The absence half of the contract: `stanceLabel` stays a designed empty,
    // so a producer that legitimately tags no stance renders nothing rather
    // than an empty coloured span.
    const model = buildUnifiedEncounterStageModel({
      template: FLAWED_STEEL,
      activeAction: buildAction(0),
      notification: buildChoicelessNotification(),
      agentName: AGENT_NAME,
      threadTier: 'strong',
      graph: buildGraph(),
      essence: 12,
    });

    const stripped = {
      ...model,
      choices: model.choices.map((c) => ({
        ...c,
        interventionType: undefined,
        stanceLabel: undefined,
      })),
    };

    render(
      <EncounterVeil
        open
        model={stripped}
        threadTier="strong"
        essence={12}
        tick={10}
        autoResolveTick={null}
        onIntervene={vi.fn()}
        onBoost={vi.fn()}
        onPeek={vi.fn()}
        onDisregard={vi.fn()}
        onAcknowledgeAftermath={vi.fn()}
        onAftermathReaction={vi.fn()}
      />,
    );

    expect(screen.queryAllByTestId('choice-stance')).toHaveLength(0);
    // Still a rendered surface — the absence is the stance, not the veil.
    expect(screen.getByText(/Steady the forge-master's resolve/)).toBeInTheDocument();
  });
});
