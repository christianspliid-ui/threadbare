import { describe, expect, it } from 'vitest';
import { buildSimpleEncounterStageModel } from '../buildSimpleEncounterStageModel';
import type { UnifiedActionTemplate } from '../../../../../types/unifiedAction';
import type { EncounterNotification } from '../../../../../types/encounterVisibility';
import type { ActiveEncounterDisplay } from '../../../encounterNotificationRuntime';
import type { ThreadTier } from '../../types';
import { WorldGraph } from '../../../../../engine/graph';

function buildTemplate(overrides?: Partial<UnifiedActionTemplate>): UnifiedActionTemplate {
  return {
    id: 'test.encounter',
    name: 'Test Encounter',
    intrinsicTier: 'background',
    rarityTier: 2,
    reach: 'iron',
    crudType: 'read',
    scale: 'local',
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: [],
    locationSubtypes: [],
    narrativeTemplates: { initiation: 'A test encounter unfolds.', success: 'You succeeded.', failure: 'You failed.' },
    steps: [
      {
        reach: 'iron',
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
    agentId: 'agent-1',
    agentName: 'Vasara',
    courtPosition: 'the_first',
    encounterId: 'test.encounter',
    encounterName: 'Test Encounter',
    prose: 'A test encounter unfolds.',
    choices: [
      {
        id: 'choice-1',
        text: 'Act boldly',
        essenceCost: 2,
        probabilityBoost: 0.2,
        interventionType: 'supportive',
        godVoice: 'Be brave.',
      },
    ],
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
    actorId: 'agent-1',
    currentStepIndex: 0,
    status: 'awaiting_choice',
    history: [],
    resolutionHistory: [],
    startedTick: 10,
    sourceSystem: 'legacy_encounter',
    ...overrides,
  } as ActiveEncounterDisplay;
}

function buildGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'agent-1', name: 'Vasara the Unbowed', category: 'actor', properties: {} });
  return graph;
}

describe('buildSimpleEncounterStageModel', () => {
  const baseArgs = {
    notification: buildNotification(),
    encounter: buildEncounter(),
    template: buildTemplate(),
    agentName: 'Vasara the Unbowed',
    agentId: 'agent-1',
    graph: buildGraph(),
    threadTier: 'strong' as ThreadTier,
    essence: 10,
    tick: 12,
  };

  it('produces a valid EncounterStageModel with header', () => {
    const model = buildSimpleEncounterStageModel(baseArgs);
    expect(model.header.title).toBe('Test Encounter');
    expect(model.header.threadTier).toBe('strong');
    expect(model.header.threatLabel).toBe('moderate');
  });

  it('builds narrative paragraphs from step narrative', () => {
    const model = buildSimpleEncounterStageModel(baseArgs);
    expect(model.narrative.paragraphs.length).toBeGreaterThan(0);
    const text = model.narrative.paragraphs[0].segments.map(s => s.text).join('');
    expect(text).toContain('test encounter');
  });

  it('maps notification choices with all fields', () => {
    const model = buildSimpleEncounterStageModel(baseArgs);
    expect(model.choices).toHaveLength(1);
    expect(model.choices[0].id).toBe('choice-1');
    expect(model.choices[0].label).toBe('Act boldly');
    expect(model.choices[0].interventionType).toBe('supportive');
    expect(model.choices[0].godVoice).toBe('Be brave.');
    expect(model.choices[0].probabilityBoost).toBe(0.2);
    expect(model.choices[0].essenceCost).toBe(2);
    expect(model.choices[0].affordable).toBe(true);
  });

  it('marks choices as unaffordable when essence is insufficient', () => {
    const model = buildSimpleEncounterStageModel({ ...baseArgs, essence: 0 });
    expect(model.choices[0].affordable).toBe(false);
  });

  it('builds step history from template steps', () => {
    const model = buildSimpleEncounterStageModel(baseArgs);
    expect(model.history).toHaveLength(1);
    expect(model.history[0].stepLabel).toBe('Step 1');
    expect(model.history[0].status).toBe('current');
  });

  it('populates illustration when template has illustrationUrl', () => {
    const model = buildSimpleEncounterStageModel({
      ...baseArgs,
      template: buildTemplate({
        illustrationUrl: '/concept-art/encounters/gate-duty.jpg',
        illustrationAlt: 'A gate at dusk',
      }),
    });
    expect(model.illustration).toBeDefined();
    expect(model.illustration!.src).toBe('/concept-art/encounters/gate-duty.jpg');
    expect(model.illustration!.alt).toBe('A gate at dusk');
  });

  it('omits illustration when template has no illustrationUrl', () => {
    const model = buildSimpleEncounterStageModel(baseArgs);
    expect(model.illustration).toBeUndefined();
  });

  it('sets prose depth based on thread tier', () => {
    const fullModel = buildSimpleEncounterStageModel({ ...baseArgs, threadTier: 'strong' });
    const peekModel = buildSimpleEncounterStageModel({ ...baseArgs, threadTier: 'watched' });
    const fullText = fullModel.narrative.paragraphs.map(p => p.segments.map(s => s.text).join('')).join('');
    const peekText = peekModel.narrative.paragraphs.map(p => p.segments.map(s => s.text).join('')).join('');
    expect(peekText.length).toBeLessThanOrEqual(fullText.length);
  });

  it('builds a current resolution readout for the active step', () => {
    const model = buildSimpleEncounterStageModel(baseArgs);
    expect(model.resolutionReadout).toBeDefined();
    expect(model.resolutionReadout!.current?.reach).toBe('iron');
    expect(model.resolutionReadout!.current?.difficultyLabel).toBe('50/100');
    expect(model.resolutionReadout!.current?.threshold).toBeGreaterThan(0);
  });

  it('maps stored legacy roll history into previous resolution checks', () => {
    const model = buildSimpleEncounterStageModel({
      ...baseArgs,
      encounter: buildEncounter({
        resolutionHistory: [
          {
            stepIndex: 0,
            stepId: 'step-1',
            stepName: 'First Step',
            reach: 'iron',
            difficulty: 50,
            normalizedDifficulty: 0.5,
            capability: 0.64,
            modifierTotal: 0.1,
            probability: 0.24,
            threshold: 24,
            roll: 19,
            success: true,
            outcomeType: 'success',
            rollBreakdown: {
              threshold: 24,
              roll: 19,
              isDoubles: false,
              margin: -5,
              critClassification: 'none',
              nearMiss: true,
            },
            tick: 12,
          },
        ],
      }),
    });

    expect(model.resolutionReadout?.previous).toHaveLength(1);
    expect(model.resolutionReadout?.previous[0].roll).toBe(19);
    expect(model.resolutionReadout?.previous[0].outcomeLabel).toBe('Success');
    expect(model.resolutionReadout?.previous[0].nearMiss).toBe(true);
  });
});
