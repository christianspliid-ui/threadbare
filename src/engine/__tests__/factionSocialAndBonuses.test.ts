import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { getSharedFactionSocialTemplates } from '../socialEncounterGeneration';
import {
  getAgentFactionBonuses,
  getEncounterRewardMultiplier,
  getScoringBoost,
} from '../factionRankBonus';
import {
  FACTION_SOCIAL_TEMPLATES,
  FACTION_ENCOUNTER_META,
} from '../../data/faction-encounter-content';
import { ADVENTURING_GUILD_DEFINITION } from '../../data/faction-definitions';
import type { MemberOfEdgeProperties } from '../../types/disposition';

// ─── Helpers ───────────────────────────────────────────────────────────────

function makeGraph(): WorldGraph {
  return new WorldGraph();
}

function addAgent(graph: WorldGraph, id: string): void {
  graph.addNode({
    id,
    type: 'actor',
    name: `Agent ${id}`,
    properties: { actorType: 'individual' },
  });
}

function addFaction(graph: WorldGraph): string {
  const factionId = 'faction_ag_instance';
  graph.addNode({
    id: factionId,
    type: 'actor',
    name: 'The Adventurers Guild',
    properties: {
      actorType: 'faction',
      factionType: 'guild',
      factionDefId: 'adventuring_guild',
    },
  });
  return factionId;
}

function addMembership(
  graph: WorldGraph,
  agentId: string,
  factionId: string,
  reputation: number,
): void {
  const role = reputation >= 0.85 ? 'leader' : reputation >= 0.6 ? 'lieutenant' : reputation >= 0.3 ? 'sergeant' : 'journeyman';
  graph.addEdge({
    id: `${agentId}_member_of_${factionId}`,
    source: agentId,
    target: factionId,
    type: 'member_of',
    properties: {
      role,
      rank: 0,
      joinedTick: 1,
      reputation,
      factionDefId: 'adventuring_guild',
    } satisfies MemberOfEdgeProperties,
  });
}

// ─── Social Template Shape Tests ──────────────────────────────────────────

describe('Faction Social Templates (TB-062)', () => {
  it('has 6 faction social templates', () => {
    expect(FACTION_SOCIAL_TEMPLATES).toHaveLength(6);
  });

  it('all templates have meta entries', () => {
    for (const tmpl of FACTION_SOCIAL_TEMPLATES) {
      expect(FACTION_ENCOUNTER_META.has(tmpl.id)).toBe(true);
    }
  });

  it('all templates belong to adventuring_guild', () => {
    for (const tmpl of FACTION_SOCIAL_TEMPLATES) {
      const meta = FACTION_ENCOUNTER_META.get(tmpl.id);
      expect(meta?.factionDefId).toBe('adventuring_guild');
    }
  });

  it('all templates have 2 steps', () => {
    for (const tmpl of FACTION_SOCIAL_TEMPLATES) {
      expect(tmpl.steps.length).toBe(2);
    }
  });

  it('ADVENTURING_GUILD_DEFINITION.socialTemplateIds matches template IDs', () => {
    const defIds = new Set(ADVENTURING_GUILD_DEFINITION.socialTemplateIds);
    const templateIds = new Set(FACTION_SOCIAL_TEMPLATES.map(t => t.id));
    expect(defIds).toEqual(templateIds);
  });

  it('templates have expected IDs', () => {
    const ids = FACTION_SOCIAL_TEMPLATES.map(t => t.id);
    expect(ids).toContain('ag.social.sparring');
    expect(ids).toContain('ag.social.tavern_tales');
    expect(ids).toContain('ag.social.mentor');
    expect(ids).toContain('ag.social.bounty_plan');
    expect(ids).toContain('ag.social.share_maps');
    expect(ids).toContain('ag.social.rivalry');
  });
});

// ─── Shared Faction Social Template Generation ────────────────────────────

describe('getSharedFactionSocialTemplates', () => {
  let graph: WorldGraph;
  let factionId: string;

  beforeEach(() => {
    graph = makeGraph();
    factionId = addFaction(graph);
  });

  it('returns faction social templates when both agents share faction', () => {
    addAgent(graph, 'agent1');
    addAgent(graph, 'agent2');
    addMembership(graph, 'agent1', factionId, 0.2);
    addMembership(graph, 'agent2', factionId, 0.3);

    const templates = getSharedFactionSocialTemplates(graph, 'agent1', 'agent2', 'town');
    expect(templates.length).toBeGreaterThan(0);
    // All returned templates should be faction social templates
    for (const tmpl of templates) {
      expect(tmpl.id.startsWith('ag.social.')).toBe(true);
    }
  });

  it('returns empty when agents do not share faction', () => {
    addAgent(graph, 'agent1');
    addAgent(graph, 'agent2');
    addMembership(graph, 'agent1', factionId, 0.2);
    // agent2 is NOT a member

    const templates = getSharedFactionSocialTemplates(graph, 'agent1', 'agent2', 'town');
    expect(templates).toHaveLength(0);
  });

  it('returns empty for non-settlement location types', () => {
    addAgent(graph, 'agent1');
    addAgent(graph, 'agent2');
    addMembership(graph, 'agent1', factionId, 0.2);
    addMembership(graph, 'agent2', factionId, 0.3);

    // 'wilderness' is not in the template locationTypes
    const templates = getSharedFactionSocialTemplates(graph, 'agent1', 'agent2', 'wilderness');
    expect(templates).toHaveLength(0);
  });

  it('returns empty when neither agent has faction membership', () => {
    addAgent(graph, 'agent1');
    addAgent(graph, 'agent2');

    const templates = getSharedFactionSocialTemplates(graph, 'agent1', 'agent2', 'town');
    expect(templates).toHaveLength(0);
  });

  it('deduplicates templates across multiple shared factions', () => {
    // Both agents are members of the same faction — should not duplicate templates
    addAgent(graph, 'agent1');
    addAgent(graph, 'agent2');
    addMembership(graph, 'agent1', factionId, 0.2);
    addMembership(graph, 'agent2', factionId, 0.3);

    const templates = getSharedFactionSocialTemplates(graph, 'agent1', 'agent2', 'town');
    const ids = templates.map(t => t.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });
});

// ─── Rank Bonus Lookup ──────────────────────────────────────────────────

describe('getAgentFactionBonuses', () => {
  let graph: WorldGraph;
  let factionId: string;

  beforeEach(() => {
    graph = makeGraph();
    factionId = addFaction(graph);
  });

  it('returns empty for journeyman (no bonuses)', () => {
    addAgent(graph, 'agent1');
    addMembership(graph, 'agent1', factionId, 0.1); // journeyman

    const bonuses = getAgentFactionBonuses(graph, 'agent1', 'encounter_reward_multiplier');
    expect(bonuses).toHaveLength(0);
  });

  it('returns encounter_reward_multiplier for sergeant (1.15)', () => {
    addAgent(graph, 'agent1');
    addMembership(graph, 'agent1', factionId, 0.35); // sergeant

    const bonuses = getAgentFactionBonuses(graph, 'agent1', 'encounter_reward_multiplier');
    expect(bonuses).toHaveLength(1);
    expect(bonuses[0].bonus.value).toBe(1.15);
  });

  it('returns encounter_reward_multiplier for lieutenant (1.30)', () => {
    addAgent(graph, 'agent1');
    addMembership(graph, 'agent1', factionId, 0.65); // lieutenant

    const bonuses = getAgentFactionBonuses(graph, 'agent1', 'encounter_reward_multiplier');
    expect(bonuses).toHaveLength(1);
    expect(bonuses[0].bonus.value).toBe(1.30);
  });

  it('returns scoring_boost only for leader (0.2)', () => {
    addAgent(graph, 'agent1');
    addMembership(graph, 'agent1', factionId, 0.9); // leader

    const scoringBonuses = getAgentFactionBonuses(graph, 'agent1', 'scoring_boost');
    expect(scoringBonuses).toHaveLength(1);
    expect(scoringBonuses[0].bonus.value).toBe(0.2);

    // Leader also gets encounter_reward_multiplier
    const rewardBonuses = getAgentFactionBonuses(graph, 'agent1', 'encounter_reward_multiplier');
    expect(rewardBonuses).toHaveLength(1);
    expect(rewardBonuses[0].bonus.value).toBe(1.50);
  });

  it('returns reputation_walk_bonus for lieutenant (0.15)', () => {
    addAgent(graph, 'agent1');
    addMembership(graph, 'agent1', factionId, 0.65); // lieutenant

    const bonuses = getAgentFactionBonuses(graph, 'agent1', 'reputation_walk_bonus');
    expect(bonuses).toHaveLength(1);
    expect(bonuses[0].bonus.value).toBe(0.15);
  });

  it('returns empty for agents with no faction membership', () => {
    addAgent(graph, 'agent1');

    const bonuses = getAgentFactionBonuses(graph, 'agent1', 'encounter_reward_multiplier');
    expect(bonuses).toHaveLength(0);
  });
});

// ─── Encounter Reward Multiplier Application ────────────────────────────

describe('getEncounterRewardMultiplier', () => {
  let graph: WorldGraph;
  let factionId: string;

  beforeEach(() => {
    graph = makeGraph();
    factionId = addFaction(graph);
  });

  it('returns 1.0 for non-faction encounters', () => {
    addAgent(graph, 'agent1');
    addMembership(graph, 'agent1', factionId, 0.35); // sergeant

    const multiplier = getEncounterRewardMultiplier(graph, 'agent1', 'social.forge_alliance');
    expect(multiplier).toBe(1.0);
  });

  it('returns 1.15 for sergeant on faction quest', () => {
    addAgent(graph, 'agent1');
    addMembership(graph, 'agent1', factionId, 0.35); // sergeant

    const multiplier = getEncounterRewardMultiplier(graph, 'agent1', 'ag.quest.ruin_delve');
    expect(multiplier).toBe(1.15);
  });

  it('returns 1.0 for journeyman on faction quest (no bonus)', () => {
    addAgent(graph, 'agent1');
    addMembership(graph, 'agent1', factionId, 0.1); // journeyman

    const multiplier = getEncounterRewardMultiplier(graph, 'agent1', 'ag.quest.ruin_delve');
    expect(multiplier).toBe(1.0);
  });

  it('returns 1.50 for leader on faction social encounter', () => {
    addAgent(graph, 'agent1');
    addMembership(graph, 'agent1', factionId, 0.9); // leader

    const multiplier = getEncounterRewardMultiplier(graph, 'agent1', 'ag.social.sparring');
    expect(multiplier).toBe(1.50);
  });
});

// ─── Scoring Boost Application ──────────────────────────────────────────

describe('getScoringBoost', () => {
  let graph: WorldGraph;
  let factionId: string;

  beforeEach(() => {
    graph = makeGraph();
    factionId = addFaction(graph);
  });

  it('returns 0.0 for non-faction encounters', () => {
    addAgent(graph, 'agent1');
    addMembership(graph, 'agent1', factionId, 0.9);

    expect(getScoringBoost(graph, 'agent1', 'social.forge_alliance')).toBe(0.0);
  });

  it('returns 0.0 for non-leader ranks', () => {
    addAgent(graph, 'agent1');
    addMembership(graph, 'agent1', factionId, 0.65); // lieutenant

    expect(getScoringBoost(graph, 'agent1', 'ag.quest.ruin_delve')).toBe(0.0);
  });

  it('returns 0.2 for leader on faction quest', () => {
    addAgent(graph, 'agent1');
    addMembership(graph, 'agent1', factionId, 0.9); // leader

    expect(getScoringBoost(graph, 'agent1', 'ag.quest.ruin_delve')).toBe(0.2);
  });

  it('returns 0.2 for leader on faction social encounter', () => {
    addAgent(graph, 'agent1');
    addMembership(graph, 'agent1', factionId, 0.9); // leader

    expect(getScoringBoost(graph, 'agent1', 'ag.social.sparring')).toBe(0.2);
  });
});
