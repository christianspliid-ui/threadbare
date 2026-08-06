// @vitest-environment jsdom

/**
 * THR-994 — the fallback adapter's context strip, asserted where it actually
 * fails: on the rendered DOM.
 *
 * `buildSimpleEncounterStageModel` used to return a header carrying only
 * `title` / `locationLabel: ''` / `threatLabel` / `threadTier`. `ContextStrip`
 * gates every one of its elements on the fields that were missing, so the strip
 * rendered as a zero-height flex container with no children — no portrait, no
 * name, no reach chip, no location, no "Show on map". A shape assertion on the
 * adapter's return value would not have caught that the strip was invisible,
 * which is why these tests render the real veil and query the real strip.
 */

import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { buildSimpleEncounterStageModel } from '../buildSimpleEncounterStageModel';
import { EncounterVeil } from '../../../EncounterVeil';
import { WorldGraph } from '../../../../../engine/graph';
import type { UnifiedActionTemplate } from '../../../../../types/unifiedAction';
import type { EncounterNotification } from '../../../../../types/encounterVisibility';
import type { ActiveEncounterDisplay } from '../../../encounterNotificationRuntime';
import type { ThreadTier } from '../../types';

const AGENT_ID = 'agent-1';
const AGENT_NAME = 'Vasara the Unbowed';
const LOCATION_NAME = 'Ardenmor Keep';

function buildTemplate(overrides?: Partial<UnifiedActionTemplate>): UnifiedActionTemplate {
  return {
    id: 'test.encounter',
    name: 'Plague Outbreak',
    intrinsicTier: 'background',
    rarityTier: 2,
    reach: 'iron',
    crudType: 'read',
    scale: 'local',
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: [],
    locationSubtypes: [],
    narrativeTemplates: {
      initiation: 'A test encounter unfolds.',
      success: 'You succeeded.',
      failure: 'You failed.',
    },
    steps: [
      {
        reach: 'stone',
        difficulty: 0.5,
        duration: { min: 1, max: 1 },
        onSuccess: [],
        onFailure: [],
        failBehavior: 'continue_weakened',
      },
    ],
    ...overrides,
  } as UnifiedActionTemplate;
}

function buildNotification(overrides?: Partial<EncounterNotification>): EncounterNotification {
  return {
    id: 'notif-1',
    agentId: AGENT_ID,
    agentName: AGENT_NAME,
    courtPosition: 'the_first',
    encounterId: 'test.encounter',
    encounterName: 'Plague Outbreak',
    prose: 'A test encounter unfolds.',
    choices: [],
    hexCol: 7,
    hexRow: 11,
    createdTick: 10,
    autoResolveTick: null,
    viewed: false,
    resolved: false,
    ...overrides,
  } as EncounterNotification;
}

function buildEncounter(overrides?: Partial<ActiveEncounterDisplay>): ActiveEncounterDisplay {
  return {
    encounterId: 'test.encounter',
    actorId: AGENT_ID,
    currentStepIndex: 0,
    status: 'awaiting_choice',
    history: [],
    resolutionHistory: [],
    startedTick: 10,
    sourceSystem: 'legacy_encounter',
    ...overrides,
  } as ActiveEncounterDisplay;
}

/** An agent standing somewhere — the shape the live fallback path always has. */
function buildGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: AGENT_ID, type: 'actor', name: AGENT_NAME, properties: {} });
  graph.addNode({ id: 'loc-1', type: 'location', name: LOCATION_NAME, properties: {} });
  graph.addEdge({
    id: 'edge-located',
    type: 'located_at',
    source: AGENT_ID,
    target: 'loc-1',
    properties: {},
  });
  return graph;
}

function buildModel(overrides?: Partial<Parameters<typeof buildSimpleEncounterStageModel>[0]>) {
  return buildSimpleEncounterStageModel({
    notification: buildNotification(),
    encounter: buildEncounter(),
    template: buildTemplate(),
    agentName: AGENT_NAME,
    agentId: AGENT_ID,
    graph: buildGraph(),
    threadTier: 'strong' as ThreadTier,
    essence: 10,
    tick: 12,
    ...overrides,
  });
}

function renderVeil(model: ReturnType<typeof buildSimpleEncounterStageModel>) {
  return render(
    <EncounterVeil
      open
      model={model}
      threadTier="strong"
      essence={10}
      tick={12}
      autoResolveTick={null}
      onIntervene={vi.fn()}
      onBoost={vi.fn()}
      onPeek={vi.fn()}
      onDisregard={vi.fn()}
      onAcknowledgeAftermath={vi.fn()}
      onAftermathReaction={vi.fn()}
      onSelectAgent={vi.fn()}
      onShowOnMap={vi.fn()}
    />,
  );
}

describe('THR-994 — the fallback veil renders a populated context strip', () => {
  it('renders the focal agent as a clickable character chip', () => {
    renderVeil(buildModel());
    // The chip's aria-label is `View <name>` only when `focalActorId` is set,
    // so this one query proves both the name and the id reached the header.
    expect(screen.getByLabelText(`View ${AGENT_NAME}`)).toBeTruthy();
  });

  it('renders the current step reach as a chip', () => {
    renderVeil(buildModel());
    // 'stone' is the step's reach, not the template's ('iron') — so this also
    // pins that the label is read from the step the player is actually facing.
    expect(screen.getByText('Stone')).toBeTruthy();
  });

  it('renders the location and its "Show on map" link', () => {
    renderVeil(buildModel());
    expect(screen.getByText(LOCATION_NAME)).toBeTruthy();
    expect(screen.getByText('Show on map')).toBeTruthy();
  });

  it('hides the location element rather than printing a placeholder when the agent is nowhere', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: AGENT_ID, type: 'actor', name: AGENT_NAME, properties: {} });
    renderVeil(buildModel({ graph }));

    // Still names the agent — the strip is populated, just not located.
    expect(screen.getByLabelText(`View ${AGENT_NAME}`)).toBeTruthy();
    expect(screen.queryByText('Unknown Location')).toBeNull();
    expect(screen.queryByText('Show on map')).toBeNull();
  });

  it('omits "Show on map" when the notification carries no hex', () => {
    const notification = buildNotification({ hexCol: undefined, hexRow: undefined });
    renderVeil(buildModel({ notification }));

    expect(screen.getByText(LOCATION_NAME)).toBeTruthy();
    expect(screen.queryByText('Show on map')).toBeNull();
  });
});

describe('THR-994 — resolved steps carry a replay record', () => {
  const resolvedTemplate = buildTemplate({
    steps: [
      {
        reach: 'stone',
        difficulty: 0.5,
        duration: { min: 1, max: 1 },
        onSuccess: [],
        onFailure: [],
        failBehavior: 'continue_weakened',
        narrativeTemplate: 'The ward holds against the fever.',
        successAfterimage: 'The ward held.',
      },
      {
        reach: 'iron',
        difficulty: 0.5,
        duration: { min: 1, max: 1 },
        onSuccess: [],
        onFailure: [],
        failBehavior: 'continue_weakened',
      },
    ],
  } as Partial<UnifiedActionTemplate>);

  const resolvedEncounter = buildEncounter({
    currentStepIndex: 1,
    resolutionHistory: [
      {
        stepIndex: 0,
        stepId: 'step-0',
        stepName: 'Ward the well',
        reach: 'stone',
        difficulty: 50,
        normalizedDifficulty: 0.5,
        capability: 0.6,
        modifierTotal: 0,
        probability: 0.6,
        threshold: 40,
        roll: 70,
        success: true,
        outcomeType: 'success',
        tick: 11,
      },
    ],
  } as Partial<ActiveEncounterDisplay>);

  it('gives the resolved step prose to replay, not an empty body', () => {
    const model = buildModel({ template: resolvedTemplate, encounter: resolvedEncounter });
    const resolved = model.history[0];

    expect(resolved.status).toBe('resolved');
    // The veil's replay body reads `replayNarrative || afterimage || ''` — a
    // resolved entry supplying neither is exactly the blank-replay defect.
    expect(resolved.replayNarrative || resolved.afterimage).toBeTruthy();
    expect(resolved.replayNarrative).toBe('The ward holds against the fever.');
    expect(resolved.afterimage).toBe('The ward held.');
  });

  it('labels the resolved step with its outcome and reach', () => {
    const model = buildModel({ template: resolvedTemplate, encounter: resolvedEncounter });
    const resolved = model.history[0];

    expect(resolved.outcome).toBe('success');
    expect(resolved.outcomeWord).toBeTruthy();
    expect(resolved.reachLabel).toBe('Stone');
    // The snapshot's authored name wins over the generic `Step 1`.
    expect(resolved.stepLabel).toBe('Ward the well');
  });

  it('leaves unresolved steps free of replay fields', () => {
    const model = buildModel({ template: resolvedTemplate, encounter: resolvedEncounter });
    const current = model.history[1];

    expect(current.status).toBe('current');
    expect(current.outcome).toBeUndefined();
    expect(current.replayNarrative).toBeUndefined();
  });
});
