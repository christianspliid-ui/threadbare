// @vitest-environment jsdom
/**
 * Gate Duty deals its own authored hand — THR-1123.
 *
 * ## What this pins
 *
 * `cg.quest.gate_duty` was the one encounter that *decorated* the engine's
 * generic supportive/coercive/withdrawn triple rather than authoring its own
 * moves: roughly eight tables in `buildGateDutyEncounterStageModel` and one in
 * `unifiedActionResolution` keyed on `EncounterChoiceMemory.interventionType`.
 * THR-1121 retired the generic producer and left the stances sourced locally by
 * `gateDutyStanceChoices` as a stopgap, so the encounter kept presenting generic
 * stance labels. This suite pins the conversion:
 *
 * 1. Each step deals **its own** three cards, by id.
 * 2. The card names and fiction reach the rendered surface.
 * 3. No generic stance label is rendered, even when a stale notification still
 *    carries one.
 *
 * ## Why jsdom rather than a browser capture
 *
 * The sanctioned browser-verify substitution for an unattended run
 * (`Browser-verify substitution: jsdom-render`). `preview_start` is refused in
 * scheduled sessions — *"Dev servers can't be started from unattended
 * sessions"* — which also shuts the Playwright route, since that presumes a
 * running server (impediments #546, #574, #580, #586, #593). Confirmed refused
 * again on this run.
 *
 * These assertions run against the real template, the real
 * `buildGateDutyEncounterStageModel` and the real `NudgePhaseShell`, so they are
 * evidence about the composed surface rather than about a mock of it. What they
 * cannot say is *where* anything lands: this diff replaces the stage's move row
 * wholesale, which is impediment #593's "element add/remove/reposition" pole, so
 * a 1920×1080 pixel pass is still owed and is filed as a Deferral rather than
 * left to evaporate (the THR-1109 precedent).
 */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ClearanceGateRuntimeState } from '../../../../types/contentShells';
import type { EncounterNotification } from '../../../../types/encounterVisibility';
import type { UnifiedAction } from '../../../../types/unifiedAction';
import type { GameState } from '../../../../types/gameState';
import type { ActiveEncounterDisplay } from '../../encounterNotificationRuntime';
import {
  CIVIC_GUARD_ENCOUNTER_TEMPLATES,
  GATE_DUTY_NUDGE_IDS,
} from '../../../../data/civic-guard-encounter-content';
import { buildGateDutyEncounterStageModel } from '../adapters/buildGateDutyEncounterStageModel';
import { NudgePhaseShell } from '../shells/NudgePhaseShell';

function getTemplate() {
  const template = CIVIC_GUARD_ENCOUNTER_TEMPLATES.find(t => t.id === 'cg.quest.gate_duty');
  if (!template) throw new Error('Gate Duty template missing');
  return template;
}

/**
 * A stale notification carrying the retired stance triple, deliberately.
 *
 * A save written before this change replays exactly this, so "no generic stance
 * label reaches the surface" is a claim about a notification that *has* one —
 * not about a world where such notifications cannot exist.
 */
const STALE_STANCE_NOTIFICATION: EncounterNotification = {
  id: 'notif-gate-duty-stale',
  agentId: 'agent.guard',
  agentName: 'Sergeant Tal',
  courtPosition: 'the_first',
  encounterId: 'cg.quest.gate_duty',
  encounterName: 'Gate Duty',
  prose: 'The gate is backed three carts deep.',
  choices: [
    {
      id: 'intervene_support',
      text: 'Tip the scales in their favor',
      interventionType: 'supportive',
      probabilityBoost: 0.12,
      essenceCost: 1,
      godVoice: 'The thread hums with divine purpose.',
    },
    {
      id: 'intervene_force',
      text: 'Pour divine power into the encounter',
      interventionType: 'coercive',
      probabilityBoost: 0.2,
      essenceCost: 5,
      godVoice: 'My will be done.',
    },
  ],
  createdTick: 10,
  autoResolveTick: null,
  viewed: true,
  resolved: false,
};

const CLEARANCE_GATE_STATE: ClearanceGateRuntimeState = {
  runtimeId: 'clearance_gate_cg.quest.gate_duty_town.checkpoint_checkpoint_clearance',
  templateId: 'cg.quest.gate_duty',
  gateId: 'checkpoint_clearance',
  anchorLocationId: 'loc.town',
  subjectNodeId: 'npc.courier',
  authorityNodeId: 'npc.captain',
  witnessNodeIds: ['npc.witness'],
  locationNodeId: 'loc.gatehouse',
  persistence: 'must-persist',
  state: 'pending',
  revealedSignalKeys: ['witness_pressure'],
  followOnTags: [],
  attempts: 0,
  lastUpdatedTick: 10,
  history: [],
};

const GRAPH = {
  getNode(nodeId: string) {
    const names: Record<string, { name: string }> = {
      'loc.gatehouse': { name: 'South Quarantine Gate' },
      'npc.captain': { name: 'Captain Merrow' },
      'npc.courier': { name: 'Courier Nessa' },
      'npc.witness': { name: 'Dock Porter' },
    };
    return names[nodeId] ?? null;
  },
  getOutgoingEdges: () => [],
} as const;

function buildStageModel(stepIndex: number) {
  const template = getTemplate();

  const encounter: ActiveEncounterDisplay = {
    encounterId: template.id,
    actorId: 'agent.guard',
    currentStepIndex: stepIndex,
    history: [],
    status: 'active',
    startedTick: 10,
    sourceSystem: 'unified_action',
    actionId: 'ua_gate_duty',
  };

  const activeAction: UnifiedAction = {
    actionId: 'ua_gate_duty',
    actorId: 'agent.guard',
    templateId: template.id,
    targetId: 'loc.gatehouse',
    scale: 'personal',
    source: 'agent',
    startTick: 10,
    currentStep: stepIndex,
    stepProgress: 0,
    stepDuration: 2,
    resolved: false,
    stepOutcomes: [],
    supportBindings: [
      { key: 'gate_captain', nodeId: 'npc.captain', kind: 'actor', delivery: 'pre-seeded', persistence: 'must-persist', reused: true },
      { key: 'suspect_courier', nodeId: 'npc.courier', kind: 'actor', delivery: 'lazy-materialize-on-trigger', persistence: 'must-persist', reused: false },
      { key: 'checkpoint_witness', nodeId: 'npc.witness', kind: 'actor', delivery: 'lazy-materialize-on-trigger', persistence: 'must-persist', reused: false },
    ],
  };

  return buildGateDutyEncounterStageModel({
    template,
    encounter,
    notification: STALE_STANCE_NOTIFICATION,
    agentName: 'Sergeant Tal',
    threadTier: 'strong',
    graph: GRAPH as never,
    activeAction,
    clearanceGateState: CLEARANCE_GATE_STATE,
    // Enough to leave every card playable, so the rendered hand is the authored
    // hand rather than whatever this god happens to afford. Both are needed and
    // they are not the same fact: the summed number feeds the stage's resource
    // line, while the per-sphere pool is what the nudge builder reads to decide
    // playable-vs-dimmed. Passing only the first is how every priced card
    // rendered dimmed before `gameState` was threaded through this adapter.
    essence: 40,
    gameState: {
      essencePool: { force: 20, matter: 20, energy: 20, life: 20, mind: 20, spirit: 20 },
      unlockedActionIds: [],
    } as unknown as GameState,
  });
}

describe('Gate Duty nudge stage (THR-1123)', () => {
  it.each([
    [0, ['Steady the courier', 'Force the captain', 'Keep your hand folded']],
    [1, ['Measure the seizure', 'Break the courier open', 'Give the witness the scene']],
    [2, ['Cool the gate', 'Consecrate authority', 'Leave it to the living']],
  ])('deals step %i its own three authored cards', (stepIndex, expectedNames) => {
    const model = buildStageModel(stepIndex as number);

    expect(model.nudgePhase?.cards.map(card => card.id)).toEqual([
      GATE_DUTY_NUDGE_IDS[stepIndex as 0 | 1 | 2].steady,
      GATE_DUTY_NUDGE_IDS[stepIndex as 0 | 1 | 2].force,
      GATE_DUTY_NUDGE_IDS[stepIndex as 0 | 1 | 2].withhold,
    ]);
    expect(model.nudgePhase?.cards.map(card => card.name)).toEqual(expectedNames);
  });

  it('renders the authored hand on the composed stage', () => {
    const model = buildStageModel(0);
    render(<NudgePhaseShell phase={model.nudgePhase!} onCommit={() => {}} />);

    expect(screen.getByText('Steady the courier')).toBeInTheDocument();
    expect(screen.getByText('Force the captain')).toBeInTheDocument();
    expect(screen.getByText('Keep your hand folded')).toBeInTheDocument();
  });

  it('resolves the cast placeholders in card fiction rather than printing the token', () => {
    const model = buildStageModel(0);
    render(<NudgePhaseShell phase={model.nudgePhase!} onCommit={() => {}} />);

    // The authored fiction reads `{cast:suspect_courier}` — systemic content, so
    // the name comes from the bound actor. Asserting the resolved name *and* the
    // absence of the raw token is what separates "enrichment ran" from "the
    // string happens to contain a name".
    //
    // The resolved-name half reads the phase **model**, not the screen, since
    // THR-1224: doctrine v2 retired the flavor quote and the card face no longer
    // draws `fiction`, so the rendered tree is no longer a place this string can
    // appear. The test's subject was always enrichment rather than the card's
    // layout, and the model is where enrichment lands.
    expect(
      model.nudgePhase!.cards.filter(card => /Courier Nessa/.test(card.fiction)).length,
    ).toBeGreaterThan(0);
    // The raw-token half stays on the screen, where it matters: an unresolved
    // `{cast:...}` reaching a player is the defect, and every surface the shell
    // still draws is in scope for it.
    expect(screen.queryAllByText(/\{cast:/)).toEqual([]);
    expect(document.body.textContent).not.toContain('{cast:');
  });

  it('renders no generic stance label, though the notification still carries one', () => {
    const model = buildStageModel(0);
    render(<NudgePhaseShell phase={model.nudgePhase!} onCommit={() => {}} />);

    // The legacy list is empty at the model level …
    expect(model.choices).toEqual([]);

    // … and the retired triple's own words are absent from the surface. These
    // are the exact strings `gateDutyStanceChoices` put on screen, which is why
    // they are asserted verbatim rather than by shape.
    expect(screen.queryByText('Tip the scales in their favor')).toBeNull();
    expect(screen.queryByText('Pour divine power into the encounter')).toBeNull();
    expect(screen.queryByText('Let it play out')).toBeNull();
  });
});
