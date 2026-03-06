import { describe, it, expect } from 'vitest';
import {
  createScryState,
  initializeCourt,
  generateTitleProposals,
  assignAgentToPosition,
  demoteAgent,
  getEligiblePositions,
  getReassignmentCost,
  getCourtStructureDefinition,
} from '../scry';
import type { RetinueAgent } from '../retinue';
import type { ReachDomain } from '../../types/traits';

describe('Scry integration — full court flow', () => {
  const agent: RetinueAgent = {
    id: 'agent.1',
    name: 'Quick Ben',
    tier: 3,
    tierName: 'Champion',
    locationId: 'loc.a',
    locationName: 'Deadhouse',
    profile: {} as any,
    domainCapabilities: {
      iron: 3, gold: 2, shadow: 6, veil: 9, heart: 4,
      eye: 7, stone: 1, star: 5, flesh: 2,
    } as Record<ReachDomain, number>,
    factionName: 'Bridgeburners',
  };

  it('initialize → assign → demote → reassign with escalating cost', () => {
    // 1. Initialize court
    let state = initializeCourt(createScryState(), 'web');
    expect(state.initialized).toBe(true);
    expect(state.positions).toHaveLength(10);

    // 2. Check eligible positions for tier 3 agent
    const eligible = getEligiblePositions(state, 3);
    expect(eligible.length).toBe(10); // all open

    // 3. Generate titles for apex position
    const apexPos = state.positions.find(p => p.rank === 'apex')!;
    const proposals = generateTitleProposals({
      agent,
      positionRank: 'apex',
      structureType: 'web',
      positionArchetype: apexPos.archetype,
      primarySphere: 'spirit',
      seed: 42,
    });
    expect(proposals.length).toBeGreaterThanOrEqual(3);

    // 4. Assign agent to apex
    const chosenTitle = proposals[0].title;
    state = assignAgentToPosition(state, apexPos.id, agent.id, chosenTitle, 0, 10);
    const filledPos = state.positions.find(p => p.id === apexPos.id)!;
    expect(filledPos.assignedAgentId).toBe(agent.id);
    expect(filledPos.activeTitle!.name).toBe(chosenTitle.name);
    expect(state.titleHistory).toHaveLength(1);

    // 5. Verify position no longer eligible
    const remainingEligible = getEligiblePositions(state, 3);
    expect(remainingEligible.length).toBe(9);

    // 6. Demote agent
    state = demoteAgent(state, apexPos.id, 20);
    const clearedPos = state.positions.find(p => p.id === apexPos.id)!;
    expect(clearedPos.assignedAgentId).toBeNull();
    expect(clearedPos.activeTitle).toBeNull();
    expect(state.titleHistory).toHaveLength(2);

    // 7. Verify reassignment cost escalation
    const baseCost = getReassignmentCost('apex', 0);
    expect(baseCost).toBe(30);
    // After 1 reassignment, cost goes up
    const escalatedCost = getReassignmentCost('apex', 1);
    expect(escalatedCost).toBeGreaterThan(baseCost);
  });

  it('all 4 court structures produce valid positions', () => {
    for (const type of ['high_house', 'circle', 'web', 'abyss'] as const) {
      const state = initializeCourt(createScryState(), type);
      const def = getCourtStructureDefinition(type);
      expect(state.positions).toHaveLength(
        def.positionCounts.apex + def.positionCounts.inner + def.positionCounts.outer
      );
      expect(state.sacredSites).toHaveLength(def.sacredSiteSlots);
      expect(state.artifacts).toHaveLength(def.artifactSlots);
    }
  });
});
