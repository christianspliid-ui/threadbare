import { describe, it, expect } from 'vitest';
import type {
  MandateType,
  MandateStage,
  MandateDefinition,
  MandateState,
  MandateCondition,
} from '../../types/mandate';

describe('Mandate type definitions', () => {
  it('MandateDefinition has correct shape', () => {
    const mandate: MandateDefinition = {
      id: 'mandate_1',
      type: 'graph_state',
      name: 'Conquer the North',
      description: 'Your devoted actors control 5+ regions',
      stages: [
        { stage: 'setup', description: 'Establish first foothold', conditions: [] },
        { stage: 'escalation', description: 'Rivals react to expansion', conditions: [] },
        { stage: 'culmination', description: 'Final push for dominance', conditions: [] },
      ],
    };
    expect(mandate.stages.length).toBe(3);
    expect(mandate.type).toBe('graph_state');
  });

  it('MandateState tracks progress correctly', () => {
    const state: MandateState = {
      mandateId: 'mandate_1',
      currentStage: 'setup',
      progress: 0.0,
      completed: false,
      failed: false,
    };
    expect(state.currentStage).toBe('setup');
    expect(state.completed).toBe(false);
  });
});
