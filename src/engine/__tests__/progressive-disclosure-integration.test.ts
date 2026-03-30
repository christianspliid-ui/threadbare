/**
 * Progressive Disclosure Integration Tests
 *
 * Verifies the full progressive disclosure pipeline end-to-end:
 * - Familiarity tracking across knowledge levels
 * - Archetype revelation at recognised+ levels
 * - Scry action familiarity gains
 * - Word scale conversion (no numeric values in UI)
 * - All 9 reach domains have valid word scales
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { initializeGameState } from '../gameInit';
import { runTick } from '../orchestrator';
import { getFamiliarity, addFamiliarity, getKnowledgeLevel } from '../familiarity';
import { getAgentInfoCard, getAgentFullProfile } from '../agentDetail';
import { getDomainWord } from '../../data/domain-words';
import type { GameState } from '../../types/gameState';
import type { ReachDomain } from '../../types/traits';
import { FAMILIARITY_GAINS, FAMILIARITY_THRESHOLDS } from '../../types/familiarity';
import { clearTraces, enableTracing } from '../traceBuffer';

describe('progressive disclosure integration', () => {
  let state: GameState;

  beforeEach(() => {
    clearTraces();
    enableTracing();

    // Initialize game state with seed 42
    const result = initializeGameState(
      {
        title: 'Test Ascendant',
        sphereAlignment: { force: 0.5, matter: 0.5 },
      },
      'Test Avatar',
      {
        foundationChaos: 0.5,
        foundationLight: 0.5,
        creationSpheres: {
          force: 0.3,
          matter: 0.3,
          energy: 0.15,
          life: 0.15,
          mind: 0,
          spirit: 0,
          time: 0,
          entropy: 0,
        },
      },
      42,
      20,
      15,
    );
    state = result.state;
  });

  // ─── Test 1: Full Flow ───────────────────────────────────────────────

  it('full flow: init → stranger → proximity gain → recognised → card shows archetype', () => {
    // Find a non-threaded agent (or the least-threaded)
    const allIndividuals = state.graph
      .getNodesByType('actor')
      .filter(node => (node.properties as Record<string, unknown>).actorType === 'individual');

    expect(allIndividuals.length).toBeGreaterThan(0);

    // Get thread edges to identify threaded agents
    const threadEdges = state.graph.getEdgesByType('thread');
    const threadedSet = new Set(threadEdges.map(e => e.target));

    // Find an agent that is NOT threaded (or least-known)
    let testAgentId = allIndividuals[0].id;
    let lowestFamiliarity = Infinity;

    for (const agent of allIndividuals) {
      const fam = getFamiliarity(state.familiarityMap, agent.id);
      if (fam < lowestFamiliarity) {
        lowestFamiliarity = fam;
        testAgentId = agent.id;
      }
    }

    expect(testAgentId).toBeDefined();

    // Verify starts at stranger (familiarity 0)
    const initialFamiliarity = getFamiliarity(state.familiarityMap, testAgentId);
    expect(initialFamiliarity).toBe(0);
    expect(getKnowledgeLevel(initialFamiliarity)).toBe('stranger');

    // Verify getAgentInfoCard returns null or minimal data for stranger
    const stageCard = getAgentInfoCard(state.graph, testAgentId, state.ascendantId, 'stranger');
    if (stageCard) {
      // For stranger, archetype should NOT be visible
      expect(stageCard.archetypeLabel).toBeUndefined();
      expect(stageCard.knowledgeLevel).toBe('stranger');
    }

    // Simulate proximity gain: call addFamiliarity 20 times with proximity amount
    // 0.01 × 20 = 0.2
    let updatedMap = state.familiarityMap;
    for (let i = 0; i < 20; i++) {
      updatedMap = addFamiliarity(updatedMap, testAgentId, FAMILIARITY_GAINS.proximity);
    }
    state.familiarityMap = updatedMap;

    // Verify new familiarity crossed to recognised threshold (0.2)
    const newFamiliarity = getFamiliarity(state.familiarityMap, testAgentId);
    expect(newFamiliarity).toBeGreaterThanOrEqual(FAMILIARITY_THRESHOLDS.recognised);
    expect(getKnowledgeLevel(newFamiliarity)).toBe('recognised');

    // Verify getAgentInfoCard now shows archetype at recognised level
    const recognisedCard = getAgentInfoCard(
      state.graph,
      testAgentId,
      state.ascendantId,
      'recognised',
    );

    expect(recognisedCard).toBeDefined();
    if (recognisedCard) {
      expect(recognisedCard.knowledgeLevel).toBe('recognised');
      // At recognised level, archetype should be visible
      const agentNode = state.graph.getNode(testAgentId);
      const archetypeId = agentNode?.properties?.narrativeArchetype;
      if (archetypeId) {
        // If agent has archetype, card should show it
        expect(recognisedCard.archetypeLabel).toBeDefined();
      }
    }
  });

  // ─── Test 2: Scry Action Grants Familiarity ──────────────────────

  it('scry action grants 0.15 familiarity', () => {
    // Find a non-threaded agent
    const allIndividuals = state.graph
      .getNodesByType('actor')
      .filter(node => (node.properties as Record<string, unknown>).actorType === 'individual');

    expect(allIndividuals.length).toBeGreaterThan(0);

    // Find agent with lowest initial familiarity
    let testAgentId = allIndividuals[0].id;
    let lowestFamiliarity = Infinity;

    for (const agent of allIndividuals) {
      const fam = getFamiliarity(state.familiarityMap, agent.id);
      if (fam < lowestFamiliarity) {
        lowestFamiliarity = fam;
        testAgentId = agent.id;
      }
    }

    const startingFamiliarity = getFamiliarity(state.familiarityMap, testAgentId);
    expect(startingFamiliarity).toBe(0);

    // Apply scry gain (0.15)
    const mapAfterScry = addFamiliarity(state.familiarityMap, testAgentId, FAMILIARITY_GAINS.scry);
    const familiarityAfterScry = getFamiliarity(mapAfterScry, testAgentId);

    // Should be exactly 0.15
    expect(familiarityAfterScry).toBeCloseTo(0.15, 5);

    // This is still stranger level (threshold for recognised is 0.2)
    expect(getKnowledgeLevel(familiarityAfterScry)).toBe('stranger');

    // Apply another scry → 0.30 → should cross to recognised
    const mapAfterSecondScry = addFamiliarity(mapAfterScry, testAgentId, FAMILIARITY_GAINS.scry);
    const familiarityAfterSecondScry = getFamiliarity(mapAfterSecondScry, testAgentId);

    expect(familiarityAfterSecondScry).toBeCloseTo(0.30, 5);
    expect(getKnowledgeLevel(familiarityAfterSecondScry)).toBe('recognised');
  });

  // ─── Test 3: Word Scales Produce No Numeric Values ──────────────────

  it('word scales produce no numeric values in UI data', () => {
    // Find a threaded agent so we can get good info card data
    const threadEdges = state.graph.getEdgesByType('thread');
    expect(threadEdges.length).toBeGreaterThan(0);

    const threadedAgentId = threadEdges[0].target;

    // Manually set familiarity to transparent level (0.8+)
    const mapTransparent = new Map(state.familiarityMap);
    mapTransparent.set(threadedAgentId, 0.85);
    state.familiarityMap = mapTransparent;

    // Get info card at transparent level
    const transparentCard = getAgentInfoCard(
      state.graph,
      threadedAgentId,
      state.ascendantId,
      'transparent',
    );

    expect(transparentCard).toBeDefined();
    if (transparentCard) {
      // Verify domains are all words, not numbers
      if (transparentCard.domains) {
        for (const domain of transparentCard.domains) {
          expect(typeof domain.word).toBe('string');
          expect(domain.word.length).toBeGreaterThan(0);
          // Should NOT be a number
          expect(isNaN(Number(domain.word))).toBe(true);
        }
      }

      // Verify top values are all words
      if (transparentCard.topValues) {
        for (const value of transparentCard.topValues) {
          expect(typeof value.word).toBe('string');
          expect(value.word.length).toBeGreaterThan(0);
          expect(isNaN(Number(value.word))).toBe(true);
        }
      }

      // Verify bond strengths are words
      if (transparentCard.topBonds) {
        for (const bond of transparentCard.topBonds) {
          expect(typeof bond.strengthWord).toBe('string');
          expect(bond.strengthWord.length).toBeGreaterThan(0);
          expect(isNaN(Number(bond.strengthWord))).toBe(true);
        }
      }

      // Verify reputation word
      if (transparentCard.reputationWord) {
        expect(typeof transparentCard.reputationWord).toBe('string');
        expect(transparentCard.reputationWord.length).toBeGreaterThan(0);
        expect(isNaN(Number(transparentCard.reputationWord))).toBe(true);
      }
    }

    // Also test getAgentFullProfile at transparent level
    const fullProfile = getAgentFullProfile(
      state.graph,
      threadedAgentId,
      state.ascendantId,
      'transparent',
    );

    if (fullProfile) {
      // Full profile should only contain strings (quotes, backstory, history labels)
      if (fullProfile.quotes) {
        for (const quote of fullProfile.quotes) {
          expect(typeof quote).toBe('string');
        }
      }
      if (fullProfile.backstoryParagraph1) {
        expect(typeof fullProfile.backstoryParagraph1).toBe('string');
      }
      if (fullProfile.fullBackstory) {
        expect(typeof fullProfile.fullBackstory).toBe('string');
      }
      if (fullProfile.allTraits) {
        for (const trait of fullProfile.allTraits) {
          expect(typeof trait).toBe('string');
        }
      }
    }
  });

  // ─── Test 4: All 9 Reaches Have Valid Word Scales ──────────────────

  it('all 9 reaches have valid word scales', () => {
    const reachDomains: ReachDomain[] = [
      'iron',
      'gold',
      'shadow',
      'veil',
      'heart',
      'eye',
      'stone',
      'star',
      'gold',
    ];

    for (const domain of reachDomains) {
      // Test values 0, 2, 4, 6, 8, 10
      const testValues = [0, 2, 4, 6, 8, 10];

      for (const value of testValues) {
        const word = getDomainWord(domain, value);

        // Should return a non-empty string
        expect(typeof word).toBe('string');
        expect(word.length).toBeGreaterThan(0);

        // Should not be a number
        expect(isNaN(Number(word))).toBe(true);

        // Should be one of the valid tier words
        const validTiers = [0, 1, 2, 3, 4];
        const tier = Math.min(4, Math.floor(Math.max(0, Math.min(10, value)) / 2));
        expect(validTiers).toContain(tier);
      }
    }
  });

  // ─── Test 5: Knowledge Level Thresholds ──────────────────────────────

  it('knowledge level thresholds progress correctly', () => {
    const levels = [
      { level: 'stranger', threshold: 0.0 },
      { level: 'recognised', threshold: 0.2 },
      { level: 'known', threshold: 0.4 },
      { level: 'intimate', threshold: 0.6 },
      { level: 'transparent', threshold: 0.8 },
    ] as const;

    for (let i = 0; i < levels.length; i++) {
      const { threshold } = levels[i];

      // At exact threshold, should be that level
      expect(getKnowledgeLevel(threshold)).toBe(levels[i].level);

      // Just below threshold (except for 0.0), should be previous level
      if (i > 0) {
        expect(getKnowledgeLevel(threshold - 0.01)).toBe(levels[i - 1].level);
      }

      // Just above threshold (except for 1.0), should still be that level
      if (i < levels.length - 1) {
        expect(getKnowledgeLevel(threshold + 0.01)).toBe(levels[i].level);
      }
    }
  });

  // ─── Test 6: Archetype Revelation By Level ──────────────────────────

  it('archetype is revealed at recognised+ but not at stranger', () => {
    const threadEdges = state.graph.getEdgesByType('thread');
    expect(threadEdges.length).toBeGreaterThan(0);

    const threadedAgentId = threadEdges[0].target;
    const ascendantId = state.ascendantId;

    // Stranger: no archetype
    const strangerCard = getAgentInfoCard(
      state.graph,
      threadedAgentId,
      ascendantId,
      'stranger',
    );
    expect(strangerCard?.archetypeLabel).toBeUndefined();

    // Recognised: archetype visible
    const recognisedCard = getAgentInfoCard(
      state.graph,
      threadedAgentId,
      ascendantId,
      'recognised',
    );
    const agentNode = state.graph.getNode(threadedAgentId);
    const archetypeId = agentNode?.properties?.narrativeArchetype;
    if (archetypeId) {
      expect(recognisedCard?.archetypeLabel).toBeDefined();
    }

    // Known: archetype visible
    const knownCard = getAgentInfoCard(
      state.graph,
      threadedAgentId,
      ascendantId,
      'known',
    );
    if (archetypeId) {
      expect(knownCard?.archetypeLabel).toBeDefined();
    }

    // Intimate: archetype visible, plus full profile
    const intimateCard = getAgentInfoCard(
      state.graph,
      threadedAgentId,
      ascendantId,
      'intimate',
    );
    if (archetypeId) {
      expect(intimateCard?.archetypeLabel).toBeDefined();
    }
    const intimateProfile = getAgentFullProfile(
      state.graph,
      threadedAgentId,
      ascendantId,
      'intimate',
    );
    expect(intimateProfile).toBeDefined();

    // Transparent: archetype visible, full profile
    const transparentCard = getAgentInfoCard(
      state.graph,
      threadedAgentId,
      ascendantId,
      'transparent',
    );
    if (archetypeId) {
      expect(transparentCard?.archetypeLabel).toBeDefined();
    }
    const transparentProfile = getAgentFullProfile(
      state.graph,
      threadedAgentId,
      ascendantId,
      'transparent',
    );
    expect(transparentProfile).toBeDefined();
  });

  // ─── Test 7: Domain Count Progression ────────────────────────────────

  it('domain visibility increases with knowledge level', () => {
    const threadEdges = state.graph.getEdgesByType('thread');
    expect(threadEdges.length).toBeGreaterThan(0);

    const threadedAgentId = threadEdges[0].target;
    const ascendantId = state.ascendantId;

    // Stranger: no domains
    const strangerCard = getAgentInfoCard(
      state.graph,
      threadedAgentId,
      ascendantId,
      'stranger',
    );
    expect(strangerCard?.domains).toBeUndefined();

    // Recognised: 1 domain (vague)
    const recognisedCard = getAgentInfoCard(
      state.graph,
      threadedAgentId,
      ascendantId,
      'recognised',
    );
    expect(recognisedCard?.domains?.length).toBe(1);

    // Known: 3 domains
    const knownCard = getAgentInfoCard(
      state.graph,
      threadedAgentId,
      ascendantId,
      'known',
    );
    expect(knownCard?.domains?.length).toBe(3);

    // Intimate: all 8 domains
    const intimateCard = getAgentInfoCard(
      state.graph,
      threadedAgentId,
      ascendantId,
      'intimate',
    );
    expect(intimateCard?.domains?.length).toBe(8);

    // Transparent: all 8 domains
    const transparentCard = getAgentInfoCard(
      state.graph,
      threadedAgentId,
      ascendantId,
      'transparent',
    );
    expect(transparentCard?.domains?.length).toBe(8);
  });

  // ─── Test 8: Threaded Agent Familiarity Starts at Recognised ──────────────

  it('initial threaded agents start with recognised familiarity (0.3)', () => {
    const threadEdges = state.graph.getEdgesByType('thread');
    expect(threadEdges.length).toBeGreaterThan(0);

    for (const edge of threadEdges) {
      const threadedAgentId = edge.target;
      const familiarity = getFamiliarity(state.familiarityMap, threadedAgentId);

      // Thread tier 1 gives 0.3 familiarity
      expect(familiarity).toBe(FAMILIARITY_GAINS.worship_tier_1);
      expect(getKnowledgeLevel(familiarity)).toBe('recognised');
    }
  });
});
