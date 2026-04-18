import { describe, expect, it } from 'vitest';
import { CIVIC_GUARD_ENCOUNTER_TEMPLATES } from '../../../../data/civic-guard-encounter-content';
import type { ClearanceGateRuntimeState } from '../../../../types/contentShells';
import type { EncounterNotification } from '../../../../types/encounterVisibility';
import type { UnifiedAction } from '../../../../types/unifiedAction';
import type { ActiveEncounterDisplay } from '../../encounterNotificationRuntime';
import { buildGateDutyEncounterStageModel } from '../adapters/buildGateDutyEncounterStageModel';

function getGateDutyTemplate() {
  const template = CIVIC_GUARD_ENCOUNTER_TEMPLATES.find(t => t.id === 'cg.quest.gate_duty');
  if (!template) throw new Error('Gate Duty template missing');
  return template;
}

function paragraphText(model: ReturnType<typeof buildGateDutyEncounterStageModel>, index: number): string {
  return model.narrative.paragraphs[index]?.segments.map(segment => segment.text).join('') ?? '';
}

describe('buildGateDutyEncounterStageModel', () => {
  it('maps live cast, shell state, and signals into the stage model', () => {
    const template = getGateDutyTemplate();
    const encounter: ActiveEncounterDisplay = {
      encounterId: template.id,
      actorId: 'agent.guard',
      currentStepIndex: 1,
      history: [
        { encounterId: 'step-1', success: true, tick: 12 },
      ],
      choiceHistory: [
        {
          stepIndex: 0,
          stepId: template.steps[0]!.id,
          choiceId: 'choice-support',
          choiceText: 'Steady the courier',
          interventionType: 'supportive',
          essenceSpent: 0.05,
          tick: 11,
        },
      ],
      status: 'active',
      startedTick: 10,
      sourceSystem: 'unified_action',
      actionId: 'ua_gate_duty',
    };
    const notification: EncounterNotification = {
      id: 'notif-gate-duty',
      agentId: 'agent.guard',
      agentName: 'Sergeant Tal',
      courtPosition: 'the_first',
      encounterId: template.id,
      encounterName: template.name,
      prose: template.steps[1]?.narrative ?? '',
      choices: [
        {
          id: 'choice-support',
          text: 'Steady the courier',
          interventionType: 'supportive',
          probabilityBoost: 0.1,
          essenceCost: 0.05,
          godVoice: 'Hold the line without breaking it.',
        },
        {
          id: 'choice-force',
          text: 'Press the captain',
          interventionType: 'coercive',
          probabilityBoost: 0.15,
          essenceCost: 0,
          godVoice: 'Order is also a weapon.',
        },
      ],
      createdTick: 10,
      autoResolveTick: null,
      viewed: true,
      resolved: false,
    };
    const activeAction: UnifiedAction = {
      actionId: 'ua_gate_duty',
      actorId: 'agent.guard',
      templateId: template.id,
      targetId: 'loc.gatehouse',
      scale: 'personal',
      source: 'agent',
      startTick: 10,
      currentStep: 1,
      stepProgress: 0,
      stepDuration: 2,
      resolved: false,
      stepOutcomes: ['success'],
      supportBindings: [
        { key: 'gatehouse', nodeId: 'loc.gatehouse', kind: 'location', delivery: 'pre-seeded', persistence: 'must-persist', reused: true },
        { key: 'gate_captain', nodeId: 'npc.captain', kind: 'actor', delivery: 'pre-seeded', persistence: 'must-persist', reused: true },
        { key: 'gate_guard', nodeId: 'npc.guard', kind: 'actor', delivery: 'pre-seeded', persistence: 'must-persist', reused: true },
        { key: 'suspect_courier', nodeId: 'npc.courier', kind: 'actor', delivery: 'lazy-materialize-on-trigger', persistence: 'must-persist', reused: false },
        { key: 'checkpoint_witness', nodeId: 'npc.witness', kind: 'actor', delivery: 'lazy-materialize-on-trigger', persistence: 'must-persist', reused: false },
      ],
      clearanceGateIds: ['clearance_gate_cg.quest.gate_duty_town.checkpoint_checkpoint_clearance'],
    };
    const clearanceGateState: ClearanceGateRuntimeState = {
      runtimeId: 'clearance_gate_cg.quest.gate_duty_town.checkpoint_checkpoint_clearance',
      templateId: template.id,
      gateId: 'checkpoint_clearance',
      anchorLocationId: 'loc.town',
      subjectNodeId: 'npc.courier',
      authorityNodeId: 'npc.captain',
      witnessNodeIds: ['npc.witness'],
      locationNodeId: 'loc.gatehouse',
      persistence: 'must-persist',
      state: 'flagged',
      revealedSignalKeys: ['witness_pressure', 'forged_papers'],
      followOnTags: ['#papers_flagged'],
      attempts: 1,
      lastUpdatedTick: 14,
      history: [],
    };
    const graph = {
      getNode(nodeId: string) {
        const names: Record<string, { name: string }> = {
          'loc.gatehouse': { name: 'South Quarantine Gate' },
          'npc.captain': { name: 'Captain Merrow' },
          'npc.guard': { name: 'Watch Sergeant' },
          'npc.courier': { name: 'Courier Nessa' },
          'npc.witness': { name: 'Dock Porter' },
        };
        return names[nodeId] ?? null;
      },
    } as const;

    const model = buildGateDutyEncounterStageModel({
      template,
      encounter,
      notification,
      agentName: 'Sergeant Tal',
      threadTier: 'strong',
      graph: graph as never,
      activeAction,
      clearanceGateState,
      essence: 0.34,
    });

    expect(model.header.title).toBe('Gate Duty');
    expect(model.header.locationLabel).toBe('South Quarantine Gate');
    expect(model.header.threatLabel).toBe('Mundane');
    expect(model.illustration?.src).toBeUndefined();
    expect(model.shellState?.state).toBe('flagged');
    expect(model.narrative.paragraphs).toHaveLength(3);
    expect(paragraphText(model, 0)).toMatch(/already touched Courier Nessa once/i);
    expect(model.narrative.references.some(reference => reference.label === 'Captain Merrow')).toBe(true);
    expect(model.cast.map(entry => entry.name)).toEqual([
      'Captain Merrow',
      'Watch Sergeant',
      'Courier Nessa',
      'Dock Porter',
    ]);
    expect(model.scene.noticeLines[0]).toMatch(/too composed/i);
    expect(model.scene.stakesProse).toMatch(/eerie|humane/i);
    expect(model.signals).toEqual([
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
      {
        id: 'witness_pressure',
        label: 'Witness Pressure',
        visibility: 'revealed',
        visibilityLabel: 'Named',
        observation: 'The witness has become part of the event itself; whatever happens now will leave the gate on other people’s tongues.',
      },
    ]);
    expect(model.choices[0]?.essenceCost).toBe(0.05);
    expect(model.choices[0]?.affordable).toBe(true);
    expect(model.choices[0]?.costLabel).toBe('0.05 essence');
    expect(model.choices[0]?.label).toBe('Guide the seizure into discipline');
    expect(model.choices[0]?.targetLabel).toBe('Captain Merrow');
    expect(model.falloutPreview[0]?.label).toMatch(/borrowed calm/i);
    expect(model.history[0]?.status).toBe('resolved');
    expect(model.history[0]?.afterimage).toMatch(/steadied the courier/i);
    expect(model.history[1]?.status).toBe('current');
  });

  it('falls back to shell runtime actors when the live unified action is not present', () => {
    const template = getGateDutyTemplate();
    const encounter: ActiveEncounterDisplay = {
      encounterId: template.id,
      actorId: 'agent.guard',
      currentStepIndex: 0,
      history: [],
      status: 'active',
      startedTick: 10,
      sourceSystem: 'legacy_encounter',
    };
    const notification: EncounterNotification = {
      id: 'notif-gate-duty-fallback',
      agentId: 'agent.guard',
      agentName: 'Sergeant Tal',
      courtPosition: 'the_first',
      encounterId: template.id,
      encounterName: template.name,
      prose: template.steps[0]?.narrative ?? '',
      choices: [
        {
          id: 'choice-support',
          text: 'Steady the courier',
          interventionType: 'supportive',
          probabilityBoost: 0.1,
          essenceCost: 0.05,
          godVoice: 'Hold the line without breaking it.',
        },
      ],
      createdTick: 10,
      autoResolveTick: null,
      viewed: true,
      resolved: false,
    };
    const clearanceGateState: ClearanceGateRuntimeState = {
      runtimeId: 'clearance_gate_cg.quest.gate_duty_loc_town_checkpoint_clearance',
      templateId: template.id,
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
    const graph = {
      getNode(nodeId: string) {
        const names: Record<string, { name: string }> = {
          'loc.gatehouse': { name: 'South Quarantine Gate' },
          'npc.captain': { name: 'Captain Merrow' },
          'npc.courier': { name: 'Courier Nessa' },
          'npc.witness': { name: 'Dock Porter' },
        };
        return names[nodeId] ?? null;
      },
    } as const;

    const model = buildGateDutyEncounterStageModel({
      template,
      encounter,
      notification,
      agentName: 'Sergeant Tal',
      threadTier: 'strong',
      graph: graph as never,
      clearanceGateState,
      essence: 0.34,
    });

    expect(model.header.locationLabel).toBe('South Quarantine Gate');
    expect(model.illustration?.src).toBe('/concept-art/encounters/gate-duty.jpg');
    expect(model.cast.map(entry => entry.name)).toEqual([
      'Captain Merrow',
      'Courier Nessa',
      'Dock Porter',
    ]);
    expect(model.choices[0]?.targetLabel).toBe('Courier Nessa');
    expect(model.choices[0]?.label).toBe('Steady the courier');
    expect(model.scene.pressureProse).toMatch(/Captain Merrow/);
    expect(model.narrative.references.some(reference => reference.label === 'Dock Porter')).toBe(true);
  });

  it('branches the hold-the-line prose from both earlier choices', () => {
    const template = getGateDutyTemplate();
    const encounter: ActiveEncounterDisplay = {
      encounterId: template.id,
      actorId: 'agent.guard',
      currentStepIndex: 2,
      history: [
        { encounterId: 'step-1', success: true, tick: 12 },
        { encounterId: 'step-2', success: true, tick: 14 },
      ],
      choiceHistory: [
        {
          stepIndex: 0,
          stepId: template.steps[0]!.id,
          choiceId: 'choice-withdraw',
          choiceText: 'Keep your hand folded',
          interventionType: 'withdrawn',
          essenceSpent: 0,
          tick: 11,
        },
        {
          stepIndex: 1,
          stepId: template.steps[1]!.id,
          choiceId: 'choice-force',
          choiceText: 'Break the courier open before the crowd can invent worse',
          interventionType: 'coercive',
          essenceSpent: 0,
          tick: 13,
        },
      ],
      status: 'active',
      startedTick: 10,
      sourceSystem: 'unified_action',
    };
    const notification: EncounterNotification = {
      id: 'notif-gate-duty-hold-line',
      agentId: 'agent.guard',
      agentName: 'Sergeant Tal',
      courtPosition: 'the_first',
      encounterId: template.id,
      encounterName: template.name,
      prose: template.steps[2]?.narrative ?? '',
      choices: [
        {
          id: 'choice-cool',
          text: 'Cool the gate back into legitimacy',
          interventionType: 'supportive',
          probabilityBoost: 0.08,
          essenceCost: 0.05,
        },
        {
          id: 'choice-consecrate',
          text: 'Consecrate authority',
          interventionType: 'coercive',
          probabilityBoost: 0.12,
          essenceCost: 0.15,
        },
        {
          id: 'choice-leave',
          text: 'Leave the story to the living',
          interventionType: 'withdrawn',
          probabilityBoost: 0,
          essenceCost: 0,
        },
      ],
      createdTick: 15,
      autoResolveTick: null,
      viewed: true,
      resolved: false,
    };
    const clearanceGateState: ClearanceGateRuntimeState = {
      runtimeId: 'clearance_gate_cg.quest.gate_duty_loc_town_checkpoint_clearance',
      templateId: template.id,
      gateId: 'checkpoint_clearance',
      anchorLocationId: 'loc.town',
      subjectNodeId: 'npc.courier',
      authorityNodeId: 'npc.captain',
      witnessNodeIds: ['npc.witness'],
      locationNodeId: 'loc.gatehouse',
      persistence: 'must-persist',
      state: 'exposed',
      revealedSignalKeys: ['witness_pressure', 'forged_papers', 'hidden_cargo'],
      followOnTags: ['#papers_flagged'],
      attempts: 2,
      lastUpdatedTick: 15,
      history: [],
    };
    const graph = {
      getNode(nodeId: string) {
        const names: Record<string, { name: string }> = {
          'loc.gatehouse': { name: 'South Quarantine Gate' },
          'npc.captain': { name: 'Captain Merrow' },
          'npc.courier': { name: 'Courier Nessa' },
          'npc.witness': { name: 'Dock Porter' },
        };
        return names[nodeId] ?? null;
      },
    } as const;

    const model = buildGateDutyEncounterStageModel({
      template,
      encounter,
      notification,
      agentName: 'Sergeant Tal',
      threadTier: 'strong',
      graph: graph as never,
      clearanceGateState,
      essence: 0.34,
    });

    expect(paragraphText(model, 0)).toMatch(/withholding your hand/i);
    expect(paragraphText(model, 1)).toMatch(/broke Courier Nessa toward the edge of public collapse/i);
    expect(model.choices.map(choice => choice.label)).toEqual([
      'Cool the gate back into legitimacy',
      'Consecrate authority',
      'Leave the story to the living',
    ]);
    expect(model.history[0]?.afterimage).toMatch(/kept your hand folded/i);
    expect(model.history[1]?.afterimage).toMatch(/courier’s panic|courier's panic|pushed the courier/i);
  });

  it('passes through interventionType, godVoice, and probabilityBoost on choices', () => {
    const template = getGateDutyTemplate();
    const encounter: ActiveEncounterDisplay = {
      encounterId: template.id,
      actorId: 'agent.guard',
      currentStepIndex: 0,
      history: [],
      status: 'active',
      startedTick: 10,
      sourceSystem: 'legacy_encounter',
    };
    const notification: EncounterNotification = {
      id: 'notif-gate-duty-new-fields',
      agentId: 'agent.guard',
      agentName: 'Sergeant Tal',
      courtPosition: 'the_first',
      encounterId: template.id,
      encounterName: template.name,
      prose: template.steps[0]?.narrative ?? '',
      choices: [
        {
          id: 'choice-support',
          text: 'Steady the courier',
          interventionType: 'supportive',
          probabilityBoost: 0.12,
          essenceCost: 0.05,
          godVoice: 'Hold the line without breaking it.',
        },
      ],
      createdTick: 10,
      autoResolveTick: null,
      viewed: true,
      resolved: false,
    };
    const clearanceGateState: ClearanceGateRuntimeState = {
      runtimeId: 'clearance_gate_cg.quest.gate_duty_loc_town_checkpoint_clearance',
      templateId: template.id,
      gateId: 'checkpoint_clearance',
      anchorLocationId: 'loc.town',
      subjectNodeId: 'npc.courier',
      authorityNodeId: 'npc.captain',
      witnessNodeIds: ['npc.witness'],
      locationNodeId: 'loc.gatehouse',
      persistence: 'must-persist',
      state: 'pending',
      revealedSignalKeys: [],
      followOnTags: [],
      attempts: 0,
      lastUpdatedTick: 10,
      history: [],
    };
    const graph = {
      getNode(nodeId: string) {
        const names: Record<string, { name: string }> = {
          'loc.gatehouse': { name: 'South Quarantine Gate' },
          'npc.captain': { name: 'Captain Merrow' },
          'npc.courier': { name: 'Courier Nessa' },
          'npc.witness': { name: 'Dock Porter' },
        };
        return names[nodeId] ?? null;
      },
    } as const;

    const model = buildGateDutyEncounterStageModel({
      template,
      encounter,
      notification,
      agentName: 'Sergeant Tal',
      threadTier: 'strong',
      graph: graph as never,
      clearanceGateState,
      essence: 0.34,
    });

    expect(model.choices[0]?.interventionType).toBe('supportive');
    expect(model.choices[0]?.godVoice).toBe('Hold the line without breaking it.');
    expect(model.choices[0]?.probabilityBoost).toBe(0.12);
  });

  it('maps aftermath summary and reaction choices into the stage model', () => {
    const template = getGateDutyTemplate();
    const encounter: ActiveEncounterDisplay = {
      encounterId: template.id,
      actorId: 'agent.guard',
      currentStepIndex: 2,
      history: [
        { encounterId: 'step-1', success: true, tick: 12 },
        { encounterId: 'step-2', success: true, tick: 14 },
        { encounterId: 'step-3', success: true, tick: 16 },
      ],
      status: 'completed',
      startedTick: 10,
      sourceSystem: 'unified_action',
      actionId: 'ua_gate_duty',
      aftermathSummary: {
        encounterId: template.id,
        outcome: 'success',
        overview: 'Your nudge left a harsher memory of the checkpoint than the official report will ever admit.',
        changes: [
          {
            id: 'change-1',
            kind: 'future_hook',
            title: 'A follow-on thread was seeded',
            detail: 'The witness leaves the gate carrying the sharper story.',
            polarity: 'info',
          },
        ],
        reactionPrompt: 'Choose which consequence thread you keep alive now that the encounter itself is over.',
        reactions: [
          {
            id: 'follow_witness_story',
            label: "Follow the witness's telling",
            intent: 'Keep one finger on the story that will spread fastest through the district.',
            closeAfterSelection: true,
            effects: [],
          },
        ],
      },
    };
    const notification: EncounterNotification = {
      id: 'notif-gate-duty-aftermath',
      kind: 'aftermath',
      agentId: 'agent.guard',
      agentName: 'Sergeant Tal',
      courtPosition: 'the_first',
      encounterId: template.id,
      encounterName: template.name,
      prose: 'The scene is over. The consequences are now moving outward.',
      choices: [],
      createdTick: 17,
      autoResolveTick: null,
      viewed: false,
      resolved: false,
    };
    const clearanceGateState: ClearanceGateRuntimeState = {
      runtimeId: 'clearance_gate_cg.quest.gate_duty_loc_town_checkpoint_clearance',
      templateId: template.id,
      gateId: 'checkpoint_clearance',
      anchorLocationId: 'loc.town',
      subjectNodeId: 'npc.courier',
      authorityNodeId: 'npc.captain',
      witnessNodeIds: ['npc.witness'],
      locationNodeId: 'loc.gatehouse',
      persistence: 'must-persist',
      state: 'cleared',
      revealedSignalKeys: ['witness_pressure', 'forged_papers', 'hidden_cargo'],
      followOnTags: ['#watch_trusted'],
      attempts: 3,
      lastUpdatedTick: 17,
      history: [],
    };
    const graph = {
      getNode(nodeId: string) {
        const names: Record<string, { name: string }> = {
          'loc.gatehouse': { name: 'South Quarantine Gate' },
          'npc.captain': { name: 'Captain Merrow' },
          'npc.courier': { name: 'Courier Nessa' },
          'npc.witness': { name: 'Dock Porter' },
        };
        return names[nodeId] ?? null;
      },
    } as const;

    const model = buildGateDutyEncounterStageModel({
      template,
      encounter,
      notification,
      agentName: 'Sergeant Tal',
      threadTier: 'strong',
      graph: graph as never,
      clearanceGateState,
      essence: 0.34,
    });

    expect(model.header.urgencyLabel).toBe('Aftermath');
    expect(model.illustration).toBeUndefined();
    expect(model.choices).toEqual([]);
    expect(model.aftermath?.overview).toMatch(/district|unchanged|consequences/i);
    expect(model.aftermath?.highlights?.[0]?.title).toMatch(/night will keep travelling|follow-on thread/i);
    expect(model.aftermath?.reactions).toEqual([
      {
        id: 'follow_witness_story',
        label: 'Follow the rumor while it is still warm',
        intent: "Choose this if you want the next consequence to come through gossip, retelling, and Dock Porter's version of the night. You are following the story South Quarantine Gate will actually hear.",
        disabled: false,
      },
    ]);
  });
});
