import { describe, it, expect, beforeEach } from 'vitest';
import {
  createScryState,
  getCourtStructureDefinition,
  initializeCourt,
  generateTitleProposals,
  getEligiblePositions,
  assignAgentToPosition,
  demoteAgent,
  getReassignmentCost,
  type TitleGenerationParams,
} from '../scry';
import type { ScryState, Position, PositionRank } from '../../types/scry';
import type { RetinueAgent } from '../retinue';
import type { AxiologicalProfile } from '../../types/agent';

// ─── Mock Fixtures ─────────────────────────────────────────────────────────

function createMockAgent(overrides?: Partial<RetinueAgent>): RetinueAgent {
  return {
    id: 'agent_001',
    name: 'Aldric the Bold',
    tier: 2,
    tierName: 'Aligned',
    locationId: 'loc_fortress',
    locationName: 'The Fortress',
    profile: {
      virtues: ['courage', 'loyalty'],
      vices: ['pride', 'wrath'],
    } as AxiologicalProfile,
    domainCapabilities: {
      iron: 8,
      gold: 4,
      shadow: 2,
      veil: 1,
      heart: 3,
      eye: 5,
      stone: 6,
      star: 2,
      flesh: 7,
    },
    factionName: 'The Iron Guard',
    ...overrides,
  };
}

// ─── Task 3 Tests ──────────────────────────────────────────────────────────

describe('Task 3: State Creation & Court Initialization', () => {
  describe('createScryState', () => {
    it('returns an empty, uninitialized state', () => {
      const state = createScryState();

      expect(state.initialized).toBe(false);
      expect(state.positions).toHaveLength(0);
      expect(state.sacredSites).toHaveLength(0);
      expect(state.artifacts).toHaveLength(0);
      expect(state.titleHistory).toHaveLength(0);
      expect(state.totalReassignmentCount).toBe(0);
    });
  });

  describe('getCourtStructureDefinition', () => {
    it('returns High House definition', () => {
      const def = getCourtStructureDefinition('high_house');

      expect(def).toBeDefined();
      expect(def?.structureType).toBe('high_house');
      expect(def?.foundationAffinity).toBe('order');
      expect(def?.name).toContain('High House');
    });

    it('returns Circle definition', () => {
      const def = getCourtStructureDefinition('circle');

      expect(def).toBeDefined();
      expect(def?.structureType).toBe('circle');
      expect(def?.foundationAffinity).toBe('light');
    });

    it('returns Web definition', () => {
      const def = getCourtStructureDefinition('web');

      expect(def).toBeDefined();
      expect(def?.structureType).toBe('web');
      expect(def?.foundationAffinity).toBe('chaos');
    });

    it('returns Abyss definition', () => {
      const def = getCourtStructureDefinition('abyss');

      expect(def).toBeDefined();
      expect(def?.structureType).toBe('abyss');
      expect(def?.foundationAffinity).toBe('darkness');
    });

    it('returns null for invalid structure', () => {
      const def = getCourtStructureDefinition('invalid_structure' as any);

      expect(def).toBeNull();
    });
  });

  describe('initializeCourt', () => {
    let initialState: ScryState;

    beforeEach(() => {
      initialState = createScryState();
    });

    it('initializes with high_house structure', () => {
      const state = initializeCourt(initialState, 'high_house');

      expect(state.initialized).toBe(true);
      expect(state.courtStructureType).toBe('high_house');
      expect(state.positions).toHaveLength(10);
    });

    it('creates exactly 10 positions (1 apex + 3 inner + 6 outer)', () => {
      const state = initializeCourt(initialState, 'high_house');

      const apex = state.positions.filter((p) => p.rank === 'apex');
      const inner = state.positions.filter((p) => p.rank === 'inner');
      const outer = state.positions.filter((p) => p.rank === 'outer');

      expect(apex).toHaveLength(1);
      expect(inner).toHaveLength(3);
      expect(outer).toHaveLength(6);
    });

    it('assigns correct archetypes per structure and rank', () => {
      const state = initializeCourt(initialState, 'high_house');

      const apex = state.positions.find((p) => p.rank === 'apex');
      const inners = state.positions.filter((p) => p.rank === 'inner');

      expect(apex?.archetype).toBe('The Sovereign');
      expect(inners[0]?.archetype).toBe('The Shield');
      expect(inners[1]?.archetype).toBe('The Voice');
      expect(inners[2]?.archetype).toBe('The Eye');
    });

    it('initializes positions with no agents assigned', () => {
      const state = initializeCourt(initialState, 'high_house');

      for (const pos of state.positions) {
        expect(pos.assignedAgentId).toBeNull();
        expect(pos.activeTitle).toBeNull();
        expect(pos.locked).toBe(false);
      }
    });

    it('creates sacred site slots matching structure definition', () => {
      const state = initializeCourt(initialState, 'high_house');
      expect(state.sacredSites).toHaveLength(2);

      const state2 = initializeCourt(initialState, 'circle');
      expect(state2.sacredSites).toHaveLength(3);
    });

    it('creates artifact slots matching structure definition', () => {
      const state = initializeCourt(initialState, 'high_house');
      expect(state.artifacts).toHaveLength(3);

      const state2 = initializeCourt(initialState, 'web');
      expect(state2.artifacts).toHaveLength(4);
    });

    it('initializes all structures consistently', () => {
      const structures: Array<'high_house' | 'circle' | 'web' | 'abyss'> = [
        'high_house',
        'circle',
        'web',
        'abyss',
      ];

      for (const struct of structures) {
        const state = initializeCourt(initialState, struct);
        expect(state.positions).toHaveLength(10);
        expect(state.initialized).toBe(true);
        expect(state.courtStructureType).toBe(struct);
      }
    });
  });
});

// ─── Task 4 Tests ──────────────────────────────────────────────────────────

describe('Task 4: Title Generation', () => {
  let agent: RetinueAgent;

  beforeEach(() => {
    agent = createMockAgent();
  });

  describe('generateTitleProposals', () => {
    it('generates 3-4 proposals (seeded rng)', () => {
      const params: TitleGenerationParams = {
        agent,
        positionRank: 'apex',
        structureType: 'high_house',
        positionArchetype: 'The Sovereign',
        primarySphere: 'force',
        seed: 12345,
      };

      const proposals = generateTitleProposals(params);

      expect(proposals.length).toBeGreaterThanOrEqual(3);
      expect(proposals.length).toBeLessThanOrEqual(4);
    });

    it('each proposal has a title with name, rank, sphere, domain, bonuses, weaknesses', () => {
      const params: TitleGenerationParams = {
        agent,
        positionRank: 'inner',
        structureType: 'circle',
        positionArchetype: 'The First Light',
        primarySphere: 'energy',
        seed: 99999,
      };

      const proposals = generateTitleProposals(params);

      for (const proposal of proposals) {
        const { title } = proposal;

        expect(title.id).toMatch(/^title\./);
        expect(title.name).toBeTruthy();
        expect(title.rank).toBe('inner');
        expect(title.sphereAffinity).toBeTruthy();
        expect(title.domainAffinity).toBeTruthy();
        expect(title.bonuses).toBeInstanceOf(Array);
        expect(title.weaknesses).toBeInstanceOf(Array);
        expect(title.flavorText).toBeTruthy();
      }
    });

    it('apex titles get 2 bonuses', () => {
      const params: TitleGenerationParams = {
        agent,
        positionRank: 'apex',
        structureType: 'high_house',
        positionArchetype: 'The Sovereign',
        primarySphere: 'force',
        seed: 42,
      };

      const proposals = generateTitleProposals(params);

      for (const proposal of proposals) {
        expect(proposal.title.bonuses.length).toBe(2);
      }
    });

    it('outer titles get 1-2 bonuses', () => {
      const params: TitleGenerationParams = {
        agent,
        positionRank: 'outer',
        structureType: 'web',
        positionArchetype: 'The Strand',
        primarySphere: 'entropy',
        seed: 777,
      };

      const proposals = generateTitleProposals(params);

      for (const proposal of proposals) {
        expect(proposal.title.bonuses.length).toBeGreaterThanOrEqual(1);
        expect(proposal.title.bonuses.length).toBeLessThanOrEqual(2);
      }
    });

    it('each title has exactly 1 weakness', () => {
      const params: TitleGenerationParams = {
        agent,
        positionRank: 'inner',
        structureType: 'abyss',
        positionArchetype: 'The Descent',
        primarySphere: 'spirit',
        seed: 5555,
      };

      const proposals = generateTitleProposals(params);

      for (const proposal of proposals) {
        expect(proposal.title.weaknesses.length).toBe(1);
      }
    });

    it('same seed produces same titles (deterministic)', () => {
      const params: TitleGenerationParams = {
        agent,
        positionRank: 'apex',
        structureType: 'high_house',
        positionArchetype: 'The Sovereign',
        primarySphere: 'matter',
        seed: 12345,
      };

      const proposals1 = generateTitleProposals(params);
      const proposals2 = generateTitleProposals(params);

      expect(proposals1).toHaveLength(proposals2.length);

      for (let i = 0; i < proposals1.length; i++) {
        expect(proposals1[i].title.name).toBe(proposals2[i].title.name);
        expect(proposals1[i].title.sphereAffinity).toBe(
          proposals2[i].title.sphereAffinity
        );
        expect(proposals1[i].title.bonuses).toEqual(
          proposals2[i].title.bonuses
        );
        expect(proposals1[i].title.weaknesses).toEqual(
          proposals2[i].title.weaknesses
        );
      }
    });

    it('different seeds produce different titles', () => {
      const baseParams: TitleGenerationParams = {
        agent,
        positionRank: 'apex',
        structureType: 'high_house',
        positionArchetype: 'The Sovereign',
        primarySphere: 'force',
      };

      const proposals1 = generateTitleProposals({ ...baseParams, seed: 111 });
      const proposals2 = generateTitleProposals({ ...baseParams, seed: 222 });

      // Titles should differ (with very high probability)
      const names1 = proposals1.map((p) => p.title.name);
      const names2 = proposals2.map((p) => p.title.name);

      const allSame = names1.every((n) => names2.includes(n));
      expect(allSame).toBe(false);
    });

    it('title names use agent domain names', () => {
      const params: TitleGenerationParams = {
        agent,
        positionRank: 'outer',
        structureType: 'circle',
        positionArchetype: 'The Spark',
        primarySphere: 'life',
        seed: 54321,
      };

      const proposals = generateTitleProposals(params);

      // Agent's top domain is 'iron' (capability 8)
      // Title names should reference domain display names
      for (const proposal of proposals) {
        // Domain affinity should be 'iron'
        expect(proposal.title.domainAffinity).toBe('iron');
      }
    });

    it('title ID encodes structure, rank, seed', () => {
      const params: TitleGenerationParams = {
        agent,
        positionRank: 'inner',
        structureType: 'web',
        positionArchetype: 'The Anchor',
        primarySphere: 'time',
        seed: 8888,
      };

      const proposals = generateTitleProposals(params);

      for (const proposal of proposals) {
        const id = proposal.title.id;
        expect(id).toContain('web');
        expect(id).toContain('inner');
        expect(id).toContain('8888');
      }
    });
  });
});

// ─── Task 5 Tests ──────────────────────────────────────────────────────────

describe('Task 5: Assignment Operations', () => {
  let state: ScryState;
  let agent: RetinueAgent;

  beforeEach(() => {
    state = initializeCourt(createScryState(), 'high_house');
    agent = createMockAgent({ tier: 3 }); // Devoted+, can fill apex
  });

  describe('getEligiblePositions', () => {
    it('returns all unassigned positions for tier-eligible agents', () => {
      const eligible = getEligiblePositions(state, 3);

      expect(eligible).toHaveLength(10); // All positions unassigned
    });

    it('filters by minimum tier requirement', () => {
      // Tier 1 (Touched) can only fill outer positions
      const eligible1 = getEligiblePositions(state, 1);
      const outerOnly = eligible1.every((p) => p.rank === 'outer');
      expect(outerOnly).toBe(true);

      // Tier 2 (Aligned) can fill inner + outer
      const eligible2 = getEligiblePositions(state, 2);
      const notApex = eligible2.every((p) => p.rank !== 'apex');
      expect(notApex).toBe(true);

      // Tier 3 (Devoted) can fill all
      const eligible3 = getEligiblePositions(state, 3);
      expect(eligible3).toHaveLength(10);
    });

    it('excludes assigned positions', () => {
      // Assign an agent to apex
      const apexPos = state.positions.find((p) => p.rank === 'apex')!;
      const proposals = generateTitleProposals({
        agent,
        positionRank: 'apex',
        structureType: 'high_house',
        positionArchetype: apexPos.archetype,
        primarySphere: 'force',
        seed: 100,
      });

      const newState = assignAgentToPosition(
        state,
        apexPos.id,
        agent.id,
        proposals[0].title,
        30,
        0
      );

      const eligible = getEligiblePositions(newState, 3);
      expect(eligible).toHaveLength(9); // One fewer
      expect(eligible.every((p) => p.id !== apexPos.id)).toBe(true);
    });

    it('excludes locked positions', () => {
      // Manually lock a position
      const pos = state.positions[0];
      state.positions[0] = { ...pos, locked: true };

      const eligible = getEligiblePositions(state, 3);
      expect(eligible).toHaveLength(9);
      expect(eligible.every((p) => p.id !== pos.id)).toBe(true);
    });
  });

  describe('assignAgentToPosition', () => {
    it('assigns agent and title to position', () => {
      const pos = state.positions[0];
      const proposals = generateTitleProposals({
        agent,
        positionRank: pos.rank,
        structureType: 'high_house',
        positionArchetype: pos.archetype,
        primarySphere: 'force',
        seed: 200,
      });

      const newState = assignAgentToPosition(
        state,
        pos.id,
        agent.id,
        proposals[0].title,
        15,
        5
      );

      const updatedPos = newState.positions.find((p) => p.id === pos.id);
      expect(updatedPos?.assignedAgentId).toBe(agent.id);
      expect(updatedPos?.activeTitle?.name).toBe(proposals[0].title.name);
    });

    it('records assignment in titleHistory', () => {
      const pos = state.positions[0];
      const proposals = generateTitleProposals({
        agent,
        positionRank: pos.rank,
        structureType: 'high_house',
        positionArchetype: pos.archetype,
        primarySphere: 'force',
        seed: 300,
      });

      const newState = assignAgentToPosition(
        state,
        pos.id,
        agent.id,
        proposals[0].title,
        10,
        7
      );

      expect(newState.titleHistory).toHaveLength(1);
      const entry = newState.titleHistory[0];
      expect(entry.positionId).toBe(pos.id);
      expect(entry.agentId).toBe(agent.id);
      expect(entry.action).toBe('assign');
      expect(entry.essenceCost).toBe(10);
      expect(entry.tick).toBe(7);
    });

    it('does not mutate original state', () => {
      const pos = state.positions[0];
      const proposals = generateTitleProposals({
        agent,
        positionRank: pos.rank,
        structureType: 'high_house',
        positionArchetype: pos.archetype,
        primarySphere: 'force',
        seed: 400,
      });

      const origAgentId = state.positions[0].assignedAgentId;

      assignAgentToPosition(
        state,
        pos.id,
        agent.id,
        proposals[0].title,
        5,
        10
      );

      expect(state.positions[0].assignedAgentId).toBe(origAgentId);
    });
  });

  describe('demoteAgent', () => {
    it('clears agent and title from position', () => {
      const pos = state.positions[0];
      const proposals = generateTitleProposals({
        agent,
        positionRank: pos.rank,
        structureType: 'high_house',
        positionArchetype: pos.archetype,
        primarySphere: 'force',
        seed: 500,
      });

      let newState = assignAgentToPosition(
        state,
        pos.id,
        agent.id,
        proposals[0].title,
        15,
        1
      );

      newState = demoteAgent(newState, pos.id, 5);

      const updatedPos = newState.positions.find((p) => p.id === pos.id);
      expect(updatedPos?.assignedAgentId).toBeNull();
      expect(updatedPos?.activeTitle).toBeNull();
    });

    it('records demotion in titleHistory', () => {
      const pos = state.positions[0];
      const proposals = generateTitleProposals({
        agent,
        positionRank: pos.rank,
        structureType: 'high_house',
        positionArchetype: pos.archetype,
        primarySphere: 'force',
        seed: 600,
      });

      let newState = assignAgentToPosition(
        state,
        pos.id,
        agent.id,
        proposals[0].title,
        20,
        2
      );

      newState = demoteAgent(newState, pos.id, 8);

      expect(newState.titleHistory).toHaveLength(2);
      const demotionEntry = newState.titleHistory[1];
      expect(demotionEntry.action).toBe('demote');
      expect(demotionEntry.tick).toBe(8);
    });

    it('demotion cost depends on rank', () => {
      // Outer position
      let outer = state.positions.find((p) => p.rank === 'outer')!;
      const proposals1 = generateTitleProposals({
        agent,
        positionRank: 'outer',
        structureType: 'high_house',
        positionArchetype: outer.archetype,
        primarySphere: 'force',
        seed: 700,
      });

      let newState = assignAgentToPosition(
        state,
        outer.id,
        agent.id,
        proposals1[0].title,
        5,
        1
      );
      newState = demoteAgent(newState, outer.id, 2);

      // Outer demotion cost is 3 (half of 5 base cost for outer)
      expect(newState.titleHistory[1].essenceCost).toBe(3);

      // Apex position
      const apex = state.positions.find((p) => p.rank === 'apex')!;
      const proposals2 = generateTitleProposals({
        agent,
        positionRank: 'apex',
        structureType: 'high_house',
        positionArchetype: apex.archetype,
        primarySphere: 'force',
        seed: 800,
      });

      newState = assignAgentToPosition(
        state,
        apex.id,
        agent.id,
        proposals2[0].title,
        30,
        1
      );
      newState = demoteAgent(newState, apex.id, 2);

      // Apex demotion cost is 15 (half of 30 base cost for apex)
      expect(newState.titleHistory[1].essenceCost).toBe(15);
    });

    it('is safe to demote unassigned position', () => {
      const pos = state.positions[0];
      const newState = demoteAgent(state, pos.id, 5);

      // Should not error or change state
      expect(newState).toEqual(state);
    });
  });

  describe('getReassignmentCost', () => {
    it('returns base cost for 0 reassignments', () => {
      expect(getReassignmentCost('apex', 0)).toBe(30);
      expect(getReassignmentCost('inner', 0)).toBe(15);
      expect(getReassignmentCost('outer', 0)).toBe(5);
    });

    it('escalates cost with reassignment count', () => {
      // Outer: 5 × 1.25^1 = 6.25
      expect(getReassignmentCost('outer', 1)).toBe(5 * 1.25);

      // Outer: 5 × 1.25^2 = 7.8125
      expect(getReassignmentCost('outer', 2)).toBeCloseTo(5 * 1.25 * 1.25);

      // Outer: 5 × 1.25^3 ≈ 9.77
      expect(getReassignmentCost('outer', 3)).toBeCloseTo(5 * Math.pow(1.25, 3));
    });

    it('inner escalation example: 15 → 18.75 → 23.44', () => {
      const cost0 = getReassignmentCost('inner', 0);
      const cost1 = getReassignmentCost('inner', 1);
      const cost2 = getReassignmentCost('inner', 2);

      expect(cost0).toBe(15);
      expect(cost1).toBeCloseTo(15 * 1.25);
      expect(cost2).toBeCloseTo(15 * 1.25 * 1.25);
    });

    it('apex escalation is steeper due to high base', () => {
      const cost0 = getReassignmentCost('apex', 0);
      const cost3 = getReassignmentCost('apex', 3);

      expect(cost3).toBeCloseTo(30 * Math.pow(1.25, 3));
      expect(cost3).toBeGreaterThan(58); // Much higher than starting 30
    });
  });
});
