import { describe, it, expect } from 'vitest';
import {
  SCALE_PRIORITY,
  type UnifiedActionTemplate,
  type UnifiedAction,
} from '../unifiedAction';

describe('UnifiedAction types', () => {
  it('SCALE_PRIORITY orders cosmic first', () => {
    expect(SCALE_PRIORITY.cosmic).toBeLessThan(SCALE_PRIORITY.regional);
    expect(SCALE_PRIORITY.regional).toBeLessThan(SCALE_PRIORITY.local);
    expect(SCALE_PRIORITY.local).toBeLessThan(SCALE_PRIORITY.personal);
  });

  it('can construct a minimal 1-step template', () => {
    const template: UnifiedActionTemplate = {
      id: 'action.iron.raise-force',
      name: 'Raise Force',
      reach: 'iron',
      crudType: 'create',
      scale: 'regional',
      steps: [{
        reach: 'iron',
        duration: { min: 3, max: 5 },
        difficulty: 0.4,
        onSuccess: [],
        onFailure: [],
        failBehavior: 'fail_action',
      }],
      apCost: 1,
      actorAffinities: ['faction'],
      motivations: ['courage_prudence'],
      narrativeTemplates: {
        initiation: 'raises a force',
        success: 'the force is raised',
        failure: 'recruitment fails',
      },
    };
    expect(template.steps).toHaveLength(1);
    expect(template.scale).toBe('regional');
  });

  it('can construct a multi-step template', () => {
    const template: UnifiedActionTemplate = {
      id: 'encounter.raid-caravan',
      name: 'Raid Caravan',
      reach: 'shadow',
      crudType: 'read',
      scale: 'local',
      steps: [
        { reach: 'shadow', duration: { min: 1, max: 1 }, difficulty: 0.35, onSuccess: [], onFailure: [], failBehavior: 'fail_action' },
        { reach: 'iron', duration: { min: 1, max: 2 }, difficulty: 0.45, onSuccess: [], onFailure: [], failBehavior: 'fail_action' },
        { reach: 'gold', duration: { min: 1, max: 1 }, difficulty: 0.3, onSuccess: [], onFailure: [], failBehavior: 'fail_action' },
      ],
      apCost: 1,
      actorAffinities: ['individual'],
      motivations: ['loyalty_ambition'],
      narrativeTemplates: {
        initiation: 'approaches the caravan',
        success: 'seizes the goods',
        failure: 'the raid is foiled',
      },
    };
    expect(template.steps).toHaveLength(3);
  });

  it('can construct a divine template with essenceCost', () => {
    const template: UnifiedActionTemplate = {
      id: 'divine.inspire',
      name: 'Inspire',
      reach: 'heart',
      crudType: 'update',
      scale: 'cosmic',
      steps: [{
        reach: 'heart',
        duration: { min: 1, max: 1 },
        difficulty: 0.0, // divine actions always succeed
        onSuccess: [], // will use apply_influence GraphOp
        onFailure: [],
        failBehavior: 'fail_action',
      }],
      apCost: 1,
      essenceCost: 15,
      actorAffinities: ['ascendant'],
      motivations: [],
      narrativeTemplates: {
        initiation: 'reaches into the mortal mind',
        success: 'divine inspiration takes hold',
        failure: 'the mortal resists',
      },
    };
    expect(template.essenceCost).toBe(15);
    expect(template.scale).toBe('cosmic');
  });

  it('can construct a runtime UnifiedAction', () => {
    const action: UnifiedAction = {
      actionId: 'action-001',
      actorId: 'actor-123',
      templateId: 'action.iron.raise-force',
      targetId: 'location-456',
      scale: 'regional',
      source: 'agent',
      startTick: 10,
      currentStep: 0,
      stepProgress: 2,
      stepDuration: 4,
      resolved: false,
      stepOutcomes: [],
    };
    expect(action.resolved).toBe(false);
    expect(action.stepProgress).toBe(2);
  });
});
