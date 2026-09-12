// @vitest-environment jsdom
/**
 * THR-1459 — `Browser-verify substitution: jsdom-render — unattended run, no startable dev server`.
 *
 * This file *is* the browser-verify evidence for the UI pillar of THR-1459. The
 * scheduled lane cannot start a dev server (`preview_start` is refused outright
 * in unattended runs — impediments #546, #574), which also shuts the Playwright
 * route, since that route presumes a running server. `Docs/canon/verification-gates.md`
 * § Browser-verify names the substitution: jsdom render assertions on the real
 * component, covering every face the change produces plus absence where the
 * element should not render.
 *
 * So this renders the **real `EncounterVeil`** over a model built by the **real
 * `buildGateDutyEncounterStageModel`** from the **real authored content**, and
 * reads the two surfaces the THR-1133 screenshot caught:
 *
 * - the *What Changed* consequence box ("The night will keep travelling")
 * - the reaction card ("The cargo tells a story.")
 *
 * The adapter-level test in
 * `encounter-stage/__tests__/buildGateDutyEncounterStageModel.test.ts` pins the
 * model. This one pins what the player actually reads, which is the clause the
 * ticket's first Done-when is written in.
 */

import { describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { afterEach } from 'vitest';
import { EncounterVeil } from '../EncounterVeil';
import { WorldGraph } from '../../../engine/graph';
import { CIVIC_GUARD_ENCOUNTER_TEMPLATES } from '../../../data/civic-guard-encounter-content';
import { buildGateDutyEncounterStageModel } from '../encounter-stage/adapters/buildGateDutyEncounterStageModel';
import type { EncounterNotification } from '../../../types/encounterVisibility';
import type { UnifiedAction } from '../../../types/unifiedAction';
import type { ActiveEncounterDisplay } from '../encounterNotificationRuntime';

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

afterEach(cleanup);

const COURIER_NODE = 'npc.nessa';
const BOUND_COURIER_NAME = 'Nessa Vale';
/** The spec's authored `spawnName` — what an *unbound* key falls back to. */
const UNBOUND_COURIER_NAME = 'Harried Courier';

function gateDutyTemplate() {
  const template = CIVIC_GUARD_ENCOUNTER_TEMPLATES.find(t => t.id === 'cg.quest.gate_duty');
  if (!template) throw new Error('Gate Duty template missing');
  return template;
}

/**
 * The authored fallback variant, read off the shipped content rather than retyped.
 *
 * Copying the strings into the fixture would let the content drift away from the
 * test while both stayed green — the fixture would be inventing the input side
 * of its own assertion. Reading them keeps this honest: if an author rewrites
 * the hook without its cast token, the guard below says so.
 */
function authoredFallback() {
  const fallback = gateDutyTemplate().aftermathConfig?.fallback;
  if (!fallback) throw new Error('Gate Duty authors no fallback aftermath variant');
  const hook = fallback.changes?.find(c => c.id === 'gate_duty_courier_mystery');
  const reaction = fallback.reactions?.find(r => r.id === 'gate_duty_note_cargo');
  if (!hook || !reaction) throw new Error('Gate Duty fallback is missing the courier hook or cargo reaction');
  return { hook, reaction };
}

function renderGateDutyEnding(opts: { bindCourier: boolean }) {
  const template = gateDutyTemplate();
  const { hook, reaction } = authoredFallback();

  const graph = new WorldGraph();
  graph.addNode({
    id: 'agent.guard', name: 'Sergeant Tal', type: 'actor',
    properties: { actorType: 'individual', npcRole: 'guard' },
  });
  graph.addNode({
    id: COURIER_NODE, name: BOUND_COURIER_NAME, type: 'actor',
    properties: { actorType: 'individual', npcRole: 'courier' },
  });
  graph.addNode({
    id: 'loc.gatehouse', name: 'South Quarantine Gate', type: 'location', properties: {},
  });

  const encounter: ActiveEncounterDisplay = {
    encounterId: template.id,
    actorId: 'agent.guard',
    currentStepIndex: 2,
    history: [],
    status: 'completed',
    startedTick: 10,
    sourceSystem: 'unified_action',
    actionId: 'ua_gate_duty',
    aftermathSummary: {
      encounterId: template.id,
      outcome: 'success',
      overview: 'The gate is finished with its evening.',
      changes: [hook],
      reactions: [reaction],
    },
  };

  const notification: EncounterNotification = {
    id: 'notif-gate-duty-cast-render',
    kind: 'aftermath',
    agentId: 'agent.guard',
    agentName: 'Sergeant Tal',
    courtPosition: 'the_first',
    encounterId: template.id,
    encounterName: template.name,
    prose: 'The scene is over.',
    choices: [],
    createdTick: 17,
    autoResolveTick: null,
    viewed: false,
    resolved: false,
  };

  const activeAction = {
    actionId: 'ua_gate_duty',
    actorId: 'agent.guard',
    templateId: template.id,
    targetId: 'loc.gatehouse',
    scale: 'personal',
    source: 'agent',
    startTick: 10,
    currentStep: 2,
    stepProgress: 0,
    stepDuration: 2,
    resolved: true,
    outcome: 'success',
    stepOutcomes: ['success', 'success', 'success'],
    supportBindings: opts.bindCourier
      ? [{
          key: 'suspect_courier',
          nodeId: COURIER_NODE,
          kind: 'actor',
          delivery: 'lazy-materialize-on-trigger',
          persistence: 'must-persist',
          reused: true,
        }]
      : [],
  } as unknown as UnifiedAction;

  const model = buildGateDutyEncounterStageModel({
    template,
    encounter,
    notification,
    agentName: 'Sergeant Tal',
    threadTier: 'strong',
    graph,
    activeAction,
    essence: 0.34,
  });

  render(
    <EncounterVeil
      open
      model={model}
      threadTier="strong"
      essence={0.34}
      tick={17}
      autoResolveTick={null}
      onIntervene={vi.fn()}
      onBoost={vi.fn()}
      onPeek={vi.fn()}
      onDisregard={vi.fn()}
      onAcknowledgeAftermath={vi.fn()}
      onAftermathReaction={vi.fn()}
    />,
  );
  return { hook, reaction };
}

describe('THR-1459 — the rendered Gate Duty ending carries no cast token', () => {
  /**
   * Falsification arm, and the reason the fixture reads the content instead of
   * quoting it. Every assertion below is "no token on screen", which a corpus
   * that stopped using cast tokens would satisfy while proving nothing. Pin that
   * the authored input really is the shape the screenshot caught.
   */
  it('the authored source still carries the token these assertions are about', () => {
    const { hook, reaction } = authoredFallback();
    expect(hook.detail).toContain('{cast:suspect_courier}');
    expect(reaction.intent).toContain('{cast:suspect_courier}');
  });

  it('renders the bound courier name in both faces, and no raw token anywhere', () => {
    renderGateDutyEnding({ bindCourier: true });
    const text = document.body.textContent ?? '';

    // Face 1 — the *What Changed* consequence box.
    expect(text).toContain('The night will keep travelling');
    expect(text).toContain(`Someone sent ${BOUND_COURIER_NAME} and needs to know the result.`);

    // Face 2 — the reaction card.
    expect(text).toContain('The cargo tells a story.');
    expect(text).toContain(`What was hidden behind ${BOUND_COURIER_NAME}'s papers`);

    // Absence, across the whole composed screen rather than the two boxes alone.
    expect(text).not.toContain('{cast:');
    expect(text).not.toMatch(/\{[a-z_]+:[^}]*\}/);
  });

  /**
   * The other face the change produces. An unbound key is not an error state —
   * the cast contract resolves it to the spec's authored `spawnName` — so the
   * sentence must still read as a sentence, naming the placeholder rather than
   * leaking a token or leaving a hole where a name belongs.
   */
  it('renders the authored spec name when the courier is unbound', () => {
    renderGateDutyEnding({ bindCourier: false });
    const text = document.body.textContent ?? '';

    expect(text).toContain(`Someone sent ${UNBOUND_COURIER_NAME} and needs to know the result.`);
    expect(text).toContain(`What was hidden behind ${UNBOUND_COURIER_NAME}'s papers`);
    expect(text).not.toContain('{cast:');
    // A stripped token would leave "Someone sent  and needs" — a hole, not a name.
    expect(text).not.toMatch(/Someone sent\s+and needs/);
  });
});
