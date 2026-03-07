/**
 * Disposition System Integration Test — Phase A
 *
 * Tests the full flow of the disposition system:
 * 1. World seeding with cooperation strategy assignment
 * 2. Action selection pipeline with disposition modifier
 * 3. Interaction logging and reputation updates
 * 4. Reputation decay and strategy-specific behavior (grudger, tit-for-tat)
 */

import { describe, it, expect } from 'vitest';
import { seedWorld } from '../worldSeed';
import { runSelectionPipeline } from '../agentSelection';
import {
  evaluateStrategy,
  applyDispositionModifier,
  logInteraction,
  updateReputation,
  decayReputation,
  assignCooperationStrategy,
} from '../disposition';
import {
  DEFAULT_REPUTATION,
  REPUTATION_UPDATE_COOPERATE,
  REPUTATION_UPDATE_DEFECT,
  REPUTATION_DECAY_PER_TICK,
  INTERACTION_LOG_CAP,
  DILEMMA_STAKES_THRESHOLD,
} from '../../types/disposition';
import type { CosmologyProfile, HexTile } from '../../types/index';
import type { ActionCandidate, AxiologicalProfile } from '../../types/agent';

// ─── Seeded PRNG for tests ────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Test Helpers ──────────────────────────────────────────────────────

/** Create a minimal cosmology profile for seeding */
function minimalCosmology(): CosmologyProfile {
  return {
    entropy: 0.1,
    dominant: [],
    suppressed: [],
  };
}

/** Create minimal hex tiles for seeding */
function minimalTiles(): HexTile[] {
  return [
    {
      coord: { col: 0, row: 0 },
      terrain: 'grassland',
      elevation: 0.5,
      moisture: 0.5,
      temperature: 0.5,
      sphereInfluence: {},
    },
    {
      coord: { col: 1, row: 0 },
      terrain: 'forest',
      elevation: 0.5,
      moisture: 0.6,
      temperature: 0.5,
      sphereInfluence: {},
    },
  ];
}

/** Create action candidates with social orientation for testing */
function createActionCandidates(
  templateIds: string[],
  targetId: string,
  baseScore: number = 0.5
): ActionCandidate[] {
  const orientations: Record<string, 'cooperative' | 'defective' | 'neutral'> = {
    trade_goods: 'cooperative',
    trade_resource: 'cooperative',
    gift_give: 'cooperative',
    betray_ally: 'defective',
    betray_trust: 'defective',
    steal_resource: 'defective',
    travel_distant: 'neutral',
    travel_local: 'neutral',
  };

  return templateIds.map((id) => ({
    templateId: id,
    reach: 'gold',
    motivations: [] as any[],
    socialOrientation: orientations[id] ?? 'neutral',
    score: baseScore,
    targetId,
    probability: 0,
  }));
}

// ═════════════════════════════════════════════════════════════════════════
// INTEGRATION TESTS
// ═════════════════════════════════════════════════════════════════════════

describe('disposition integration — Phase A', () => {
  it('full flow: seed → verify strategies → select with disposition → log → reputation update', () => {
    // 1. Seed world
    const { graph, individualIds } = seedWorld(
      minimalCosmology(),
      minimalTiles(),
      42
    );

    expect(individualIds.length).toBeGreaterThan(0);

    // Verify that agents have cooperation strategies and reputation scores
    for (const agentId of individualIds.slice(0, 3)) {
      const node = graph.getNode(agentId);
      expect(node).toBeDefined();
      expect(node?.properties.cooperationStrategy).toBeDefined();
      expect(node?.properties.reputationScore).toBe(DEFAULT_REPUTATION);
      expect(node?.properties.axiologicalProfile).toBeDefined();
    }

    // 2. Pick two agents
    const agentA = individualIds[0];
    const agentB = individualIds[1];

    const nodeA = graph.getNode(agentA)!;
    const nodeB = graph.getNode(agentB)!;

    // 3. Create action candidates with social orientation
    const candidates = createActionCandidates(
      ['trade_goods', 'betray_ally', 'travel_local'],
      agentB
    );

    // 4. Run selection pipeline — should apply disposition modifier
    const result = runSelectionPipeline(graph, agentA, candidates, {
      topN: 3,
    });

    expect(result.selected).toBeDefined();
    expect(result.candidates.length).toBeGreaterThan(0);

    // Verify that candidates were scored and have probabilities
    for (const cand of result.candidates) {
      expect(cand.probability).toBeGreaterThan(0);
    }

    // 5. Simulate interaction: agent A cooperates
    const cooperationStrategy = nodeA.properties
      .cooperationStrategy as string;
    const history: any[] = []; // Empty history
    const disposition = evaluateStrategy(
      cooperationStrategy as any,
      history
    );

    // Most strategies cooperate on first interaction
    expect([1, -1]).toContain(disposition);

    // 6. Log the interaction
    const stakes = 0.7; // High stakes
    let interactionLog = logInteraction(
      [],
      0, // tick
      'cooperate',
      'defect', // agent A cooperates, agent B defects
      'trade_goods',
      stakes
    );

    expect(interactionLog.length).toBe(1);
    expect(interactionLog[0].actorMove).toBe('cooperate');
    expect(interactionLog[0].targetMove).toBe('defect');
    expect(interactionLog[0].stakes).toBe('high'); // >= DILEMMA_STAKES_THRESHOLD

    // 7. Update reputation: agent B defected, so reputation penalty
    const initialReputation = DEFAULT_REPUTATION;
    const afterDefection = updateReputation(initialReputation, 'defect');

    expect(afterDefection).toBeLessThan(initialReputation);
    expect(afterDefection).toBe(initialReputation + REPUTATION_UPDATE_DEFECT);

    // 8. Decay reputation toward default
    const decayed = decayReputation(afterDefection);
    expect(decayed).toBeGreaterThan(afterDefection); // Decays toward 0.5
    expect(Math.abs(decayed - DEFAULT_REPUTATION)).toBeLessThan(
      Math.abs(afterDefection - DEFAULT_REPUTATION)
    );

    // 9. Verify asymmetry: defection penalty is larger than cooperation bonus
    const afterCooperation = updateReputation(DEFAULT_REPUTATION, 'cooperate');
    expect(Math.abs(REPUTATION_UPDATE_DEFECT)).toBeGreaterThan(
      REPUTATION_UPDATE_COOPERATE
    );
  });

  it('grudger agent defects forever after single betrayal', () => {
    // Set up a grudger agent
    const rng = mulberry32(99);
    const profile: AxiologicalProfile = {
      loyalty_treachery: 0.5, // Not nudged by low values
      cruelty_compassion: 0.5,
      cunning_honesty: 0.5,
      chaos_order: 0.0,
      light_darkness: 0.0,
    };

    // Assign strategy — expect some probability of grudger
    let grudgerCount = 0;
    for (let i = 0; i < 10; i++) {
      const strategy = assignCooperationStrategy(
        'fallen_noble', // High grudger weight (0.35)
        profile,
        () => rng()
      );
      if (strategy === 'grudger') {
        grudgerCount++;
      }
    }
    expect(grudgerCount).toBeGreaterThan(0); // At least some should be grudgers

    // Now test grudger behavior directly
    const history: any[] = [];

    // First interaction: both cooperate
    const move1 = evaluateStrategy('grudger', history);
    expect(move1).toBe(1); // Cooperate on first move

    const newHistory = logInteraction(
      history,
      0,
      'cooperate',
      'cooperate',
      'trade_goods',
      0.5
    );

    // Second interaction: agent B defects
    const move2 = evaluateStrategy('grudger', newHistory);
    expect(move2).toBe(1); // Still cooperate (no defection yet)

    const betrayedHistory = logInteraction(
      newHistory,
      1,
      'cooperate',
      'defect', // Agent B defects!
      'trade_goods',
      0.5
    );

    // Third+ interactions: grudger should defect forever
    const move3 = evaluateStrategy('grudger', betrayedHistory);
    expect(move3).toBe(-1); // Defect forever

    const move4 = evaluateStrategy('grudger', betrayedHistory); // Same history
    expect(move4).toBe(-1); // Still defect

    // Even if target cooperates again
    const targetRecooperates = logInteraction(
      betrayedHistory,
      2,
      'defect', // Grudger defects
      'cooperate', // Target cooperates back
      'trade_goods',
      0.5
    );

    const move5 = evaluateStrategy('grudger', targetRecooperates);
    expect(move5).toBe(-1); // Grudger never forgets
  });

  it('tit-for-tat agent mirrors last interaction', () => {
    const history: any[] = [];

    // First move: cooperate
    const move1 = evaluateStrategy('tit-for-tat', history);
    expect(move1).toBe(1);

    // History: actor cooperated, target cooperated
    const history1 = logInteraction(
      history,
      0,
      'cooperate',
      'cooperate',
      'trade_goods',
      0.5
    );

    // Second move: mirror target's cooperate
    const move2 = evaluateStrategy('tit-for-tat', history1);
    expect(move2).toBe(1); // Mirror cooperate

    // History: actor cooperated, target defected
    const history2 = logInteraction(
      history1,
      1,
      'cooperate',
      'defect', // Target defects
      'trade_goods',
      0.5
    );

    // Third move: mirror target's defect
    const move3 = evaluateStrategy('tit-for-tat', history2);
    expect(move3).toBe(-1); // Mirror defect

    // History: actor defected, target cooperated
    const history3 = logInteraction(
      history2,
      2,
      'defect', // Actor defects back
      'cooperate', // Target cooperates
      'trade_goods',
      0.5
    );

    // Fourth move: mirror target's cooperate
    const move4 = evaluateStrategy('tit-for-tat', history3);
    expect(move4).toBe(1); // Mirror cooperate again
  });

  it('interaction log caps at INTERACTION_LOG_CAP', () => {
    let log: any[] = [];

    // Add INTERACTION_LOG_CAP + 5 interactions
    for (let i = 0; i < INTERACTION_LOG_CAP + 5; i++) {
      log = logInteraction(
        log,
        i,
        i % 2 === 0 ? 'cooperate' : 'defect',
        i % 2 === 0 ? 'defect' : 'cooperate',
        'trade_goods',
        0.5
      );
    }

    // Verify log size is capped
    expect(log.length).toBe(INTERACTION_LOG_CAP);

    // Verify oldest entries were removed (log contains most recent entries)
    // The first entry should be from tick INTERACTION_LOG_CAP + 4 - INTERACTION_LOG_CAP = 4
    expect(log[0].tick).toBe(5);
    expect(log[log.length - 1].tick).toBe(INTERACTION_LOG_CAP + 4);
  });

  it('disposition modifier boosts cooperative candidates when disposition is positive', () => {
    const candidates = createActionCandidates(
      ['trade_goods', 'betray_ally', 'travel_local'],
      'agent_b'
    );

    const history: any[] = []; // Empty history
    const targetReputation = DEFAULT_REPUTATION;

    // Apply modifier with tit-for-tat (cooperates on first move)
    const modified = applyDispositionModifier(
      candidates,
      'tit-for-tat',
      history,
      targetReputation
    );

    // Find cooperative and defective candidates
    const tradeGoods = modified.find((c) => c.templateId === 'trade_goods')!;
    const betrayAlly = modified.find((c) => c.templateId === 'betray_ally')!;
    const travelLocal = modified.find((c) => c.templateId === 'travel_local')!;

    // Tit-for-tat on first move is +1 (cooperate)
    // Cooperative action should get a bonus
    expect(tradeGoods.score).toBeGreaterThan(0.5);

    // Defective action should get a penalty
    expect(betrayAlly.score).toBeLessThan(0.5);

    // Neutral action should remain unchanged
    expect(travelLocal.score).toBe(0.5);
  });

  it('reputation affects disposition through reputationFactor', () => {
    const candidates = createActionCandidates(['trade_goods'], 'agent_b');

    // High reputation: should boost cooperation
    const highRepModified = applyDispositionModifier(
      candidates,
      'always-cooperate',
      [],
      0.9 // High reputation
    );

    // Low reputation: should dampen cooperation
    const lowRepModified = applyDispositionModifier(
      candidates,
      'always-cooperate',
      [],
      0.1 // Low reputation
    );

    // With high reputation, cooperative action should score higher
    expect(highRepModified[0].score).toBeGreaterThan(lowRepModified[0].score);
  });
});
