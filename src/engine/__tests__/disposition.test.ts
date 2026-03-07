import { describe, it, expect } from 'vitest';
import {
  evaluateStrategy,
  applyDispositionModifier,
  logInteraction,
  updateReputation,
  decayReputation,
  computeStakes,
  resolveDilemma,
  applyDilemmaEffects,
} from '../disposition';
import type { CooperationStrategy, InteractionRecord, DilemmaOutcome } from '../../types/disposition';
import {
  DISPOSITION_COOPERATE_BONUS,
  DISPOSITION_DEFECT_BONUS,
  REPUTATION_UPDATE_COOPERATE,
  REPUTATION_UPDATE_DEFECT,
  REPUTATION_DECAY_PER_TICK,
  INTERACTION_LOG_CAP,
  DILEMMA_STAKES_THRESHOLD,
  DEFAULT_REPUTATION,
  STAKES_DOMAIN_GOLD,
  STAKES_DOMAIN_IRON,
  STAKES_EXTREME_SENTIMENT,
  STAKES_FACTION_LEADER,
  STAKES_TERRITORY_CONTROL,
  DILEMMA_MUTUAL_TRUST_SENTIMENT,
  DILEMMA_MUTUAL_TRUST_STRENGTH,
  DILEMMA_BETRAYAL_SENTIMENT,
  DILEMMA_MUTUAL_DISTRUST_SENTIMENT,
} from '../../types/disposition';
import type { ActionCandidate } from '../../types/agent';

// ============ GROUP 1: evaluateStrategy Tests ============

describe('evaluateStrategy', () => {
  describe('tit-for-tat', () => {
    it('cooperates on first move (empty history)', () => {
      const disposition = evaluateStrategy('tit-for-tat', []);
      expect(disposition).toBe(1);
    });

    it('mirrors last cooperative move', () => {
      const history: InteractionRecord[] = [
        {
          tick: 1,
          actorMove: 'cooperate',
          targetMove: 'cooperate',
          context: 'trade',
          stakes: 'low',
        },
      ];
      const disposition = evaluateStrategy('tit-for-tat', history);
      expect(disposition).toBe(1);
    });

    it('mirrors last defective move', () => {
      const history: InteractionRecord[] = [
        {
          tick: 1,
          actorMove: 'cooperate',
          targetMove: 'defect',
          context: 'trade',
          stakes: 'low',
        },
      ];
      const disposition = evaluateStrategy('tit-for-tat', history);
      expect(disposition).toBe(-1);
    });

    it('responds to most recent move in multi-turn history', () => {
      const history: InteractionRecord[] = [
        {
          tick: 1,
          actorMove: 'cooperate',
          targetMove: 'cooperate',
          context: 'trade',
          stakes: 'low',
        },
        {
          tick: 2,
          actorMove: 'cooperate',
          targetMove: 'defect',
          context: 'trade',
          stakes: 'low',
        },
      ];
      const disposition = evaluateStrategy('tit-for-tat', history);
      expect(disposition).toBe(-1);
    });
  });

  describe('grudger', () => {
    it('cooperates on first move (empty history)', () => {
      const disposition = evaluateStrategy('grudger', []);
      expect(disposition).toBe(1);
    });

    it('cooperates when all history is cooperative', () => {
      const history: InteractionRecord[] = [
        {
          tick: 1,
          actorMove: 'cooperate',
          targetMove: 'cooperate',
          context: 'trade',
          stakes: 'low',
        },
        {
          tick: 2,
          actorMove: 'cooperate',
          targetMove: 'cooperate',
          context: 'trade',
          stakes: 'low',
        },
      ];
      const disposition = evaluateStrategy('grudger', history);
      expect(disposition).toBe(1);
    });

    it('defects forever after single defection', () => {
      const history: InteractionRecord[] = [
        {
          tick: 1,
          actorMove: 'cooperate',
          targetMove: 'cooperate',
          context: 'trade',
          stakes: 'low',
        },
        {
          tick: 2,
          actorMove: 'cooperate',
          targetMove: 'defect',
          context: 'trade',
          stakes: 'low',
        },
        {
          tick: 3,
          actorMove: 'defect',
          targetMove: 'cooperate',
          context: 'trade',
          stakes: 'low',
        },
      ];
      const disposition = evaluateStrategy('grudger', history);
      expect(disposition).toBe(-1);
    });

    it('defects even after recent cooperation if any defection exists', () => {
      const history: InteractionRecord[] = [
        {
          tick: 1,
          actorMove: 'cooperate',
          targetMove: 'defect',
          context: 'trade',
          stakes: 'low',
        },
        {
          tick: 2,
          actorMove: 'defect',
          targetMove: 'cooperate',
          context: 'trade',
          stakes: 'low',
        },
        {
          tick: 3,
          actorMove: 'defect',
          targetMove: 'cooperate',
          context: 'trade',
          stakes: 'low',
        },
      ];
      const disposition = evaluateStrategy('grudger', history);
      expect(disposition).toBe(-1);
    });
  });

  describe('pavlov', () => {
    it('cooperates on first move (empty history)', () => {
      const disposition = evaluateStrategy('pavlov', []);
      expect(disposition).toBe(1);
    });

    it('repeats when both actor and target made the same move', () => {
      const history: InteractionRecord[] = [
        {
          tick: 1,
          actorMove: 'cooperate',
          targetMove: 'cooperate',
          context: 'trade',
          stakes: 'low',
        },
      ];
      const disposition = evaluateStrategy('pavlov', history);
      expect(disposition).toBe(1);
    });

    it('switches when actor and target made different moves', () => {
      const history: InteractionRecord[] = [
        {
          tick: 1,
          actorMove: 'cooperate',
          targetMove: 'defect',
          context: 'trade',
          stakes: 'low',
        },
      ];
      const disposition = evaluateStrategy('pavlov', history);
      expect(disposition).toBe(-1);
    });

    it('repeats mutual defection', () => {
      const history: InteractionRecord[] = [
        {
          tick: 1,
          actorMove: 'defect',
          targetMove: 'defect',
          context: 'trade',
          stakes: 'low',
        },
      ];
      const disposition = evaluateStrategy('pavlov', history);
      expect(disposition).toBe(-1);
    });

    it('switches on most recent move in multi-turn history', () => {
      const history: InteractionRecord[] = [
        {
          tick: 1,
          actorMove: 'cooperate',
          targetMove: 'cooperate',
          context: 'trade',
          stakes: 'low',
        },
        {
          tick: 2,
          actorMove: 'cooperate',
          targetMove: 'defect',
          context: 'trade',
          stakes: 'low',
        },
      ];
      const disposition = evaluateStrategy('pavlov', history);
      expect(disposition).toBe(-1);
    });
  });

  describe('always-cooperate', () => {
    it('cooperates on first move', () => {
      const disposition = evaluateStrategy('always-cooperate', []);
      expect(disposition).toBe(1);
    });

    it('always cooperates regardless of history', () => {
      const history: InteractionRecord[] = [
        {
          tick: 1,
          actorMove: 'cooperate',
          targetMove: 'defect',
          context: 'trade',
          stakes: 'low',
        },
        {
          tick: 2,
          actorMove: 'cooperate',
          targetMove: 'defect',
          context: 'trade',
          stakes: 'low',
        },
      ];
      const disposition = evaluateStrategy('always-cooperate', history);
      expect(disposition).toBe(1);
    });
  });

  describe('always-defect', () => {
    it('defects on first move', () => {
      const disposition = evaluateStrategy('always-defect', []);
      expect(disposition).toBe(-1);
    });

    it('always defects regardless of history', () => {
      const history: InteractionRecord[] = [
        {
          tick: 1,
          actorMove: 'defect',
          targetMove: 'cooperate',
          context: 'trade',
          stakes: 'low',
        },
        {
          tick: 2,
          actorMove: 'defect',
          targetMove: 'cooperate',
          context: 'trade',
          stakes: 'low',
        },
      ];
      const disposition = evaluateStrategy('always-defect', history);
      expect(disposition).toBe(-1);
    });
  });
});

// ============ GROUP 2: applyDispositionModifier Tests ============

describe('applyDispositionModifier', () => {
  it('returns unchanged when no social candidates exist', () => {
    const candidates: ActionCandidate[] = [
      {
        templateId: 'trade-01',
        targetId: 'actor.2',
        domain: 'gold',
        score: 10,
        motivations: ['ambition_contentment'],
        socialOrientation: 'neutral',
      },
    ];
    const result = applyDispositionModifier(candidates, 'tit-for-tat', [], DEFAULT_REPUTATION);
    expect(result).toHaveLength(1);
    expect(result[0].score).toBe(10);
  });

  it('boosts cooperative candidates when disposition is positive', () => {
    const candidates: ActionCandidate[] = [
      {
        templateId: 'help-01',
        targetId: 'actor.2',
        domain: 'heart',
        score: 5,
        motivations: ['compassion'],
        socialOrientation: 'cooperative',
      },
    ];
    const history: InteractionRecord[] = [
      {
        tick: 1,
        actorMove: 'cooperate',
        targetMove: 'cooperate',
        context: 'gift',
        stakes: 'low',
      },
    ];
    const result = applyDispositionModifier(candidates, 'tit-for-tat', history, DEFAULT_REPUTATION);
    expect(result[0].score).toBeGreaterThan(5);
    expect(result[0].score).toBe(5 + DISPOSITION_COOPERATE_BONUS);
  });

  it('boosts defective candidates when disposition is negative', () => {
    const candidates: ActionCandidate[] = [
      {
        templateId: 'betray-01',
        targetId: 'actor.2',
        domain: 'shadow',
        score: 5,
        motivations: ['cunning'],
        socialOrientation: 'defective',
      },
    ];
    const history: InteractionRecord[] = [
      {
        tick: 1,
        actorMove: 'cooperate',
        targetMove: 'defect',
        context: 'trade',
        stakes: 'low',
      },
    ];
    const result = applyDispositionModifier(candidates, 'tit-for-tat', history, DEFAULT_REPUTATION);
    expect(result[0].score).toBeGreaterThan(5);
    expect(result[0].score).toBe(5 + DISPOSITION_DEFECT_BONUS);
  });

  it('leaves neutral candidates unchanged', () => {
    const candidates: ActionCandidate[] = [
      {
        templateId: 'observe-01',
        targetId: 'actor.2',
        domain: 'eye',
        score: 8,
        motivations: ['tradition_innovation'],
        socialOrientation: 'neutral',
      },
    ];
    const history: InteractionRecord[] = [
      {
        tick: 1,
        actorMove: 'cooperate',
        targetMove: 'cooperate',
        context: 'gift',
        stakes: 'low',
      },
    ];
    const result = applyDispositionModifier(candidates, 'tit-for-tat', history, DEFAULT_REPUTATION);
    expect(result[0].score).toBe(8);
  });

  it('factors in high target reputation', () => {
    const candidates: ActionCandidate[] = [
      {
        templateId: 'help-01',
        targetId: 'actor.2',
        domain: 'heart',
        score: 5,
        motivations: ['compassion'],
        socialOrientation: 'cooperative',
      },
    ];
    const highReputation = 0.9;
    const result = applyDispositionModifier(candidates, 'always-cooperate', [], highReputation);
    // reputation = 0.9 → reputationFactor = (0.9 - 0.5) * 0.4 = 0.16
    // finalDisposition = 1.0 + 0.16 = 1.0 (clamped)
    // score = 5 + 1.0 * DISPOSITION_COOPERATE_BONUS
    expect(result[0].score).toBeGreaterThan(5 + DISPOSITION_COOPERATE_BONUS - 0.1);
  });

  it('factors in low target reputation', () => {
    const candidates: ActionCandidate[] = [
      {
        templateId: 'help-01',
        targetId: 'actor.2',
        domain: 'heart',
        score: 5,
        motivations: ['compassion'],
        socialOrientation: 'cooperative',
      },
    ];
    const lowReputation = 0.1;
    const result = applyDispositionModifier(candidates, 'always-cooperate', [], lowReputation);
    // reputation = 0.1 → reputationFactor = (0.1 - 0.5) * 0.4 = -0.16
    // finalDisposition = 1.0 - 0.16 = 0.84
    // score = 5 + 0.84 * DISPOSITION_COOPERATE_BONUS
    expect(result[0].score).toBeLessThan(5 + DISPOSITION_COOPERATE_BONUS);
  });

  it('handles mixed candidates (social + neutral)', () => {
    const candidates: ActionCandidate[] = [
      {
        templateId: 'help-01',
        targetId: 'actor.2',
        domain: 'heart',
        score: 5,
        motivations: ['compassion'],
        socialOrientation: 'cooperative',
      },
      {
        templateId: 'observe-01',
        targetId: 'actor.2',
        domain: 'eye',
        score: 8,
        motivations: ['tradition_innovation'],
        socialOrientation: 'neutral',
      },
    ];
    const result = applyDispositionModifier(candidates, 'always-cooperate', [], DEFAULT_REPUTATION);
    expect(result[0].score).toBeGreaterThan(5);
    expect(result[1].score).toBe(8);
  });

  it('clamps disposition between -1 and 1', () => {
    // Very high reputation + positive disposition should clamp to 1.0
    const candidates: ActionCandidate[] = [
      {
        templateId: 'betray-01',
        targetId: 'actor.2',
        domain: 'shadow',
        score: 5,
        motivations: ['cunning'],
        socialOrientation: 'defective',
      },
    ];
    const veryHighReputation = 1.0;
    const result = applyDispositionModifier(candidates, 'always-cooperate', [], veryHighReputation);
    // finalDisposition = 1.0 + (1.0 - 0.5) * 0.4 = 1.2 → clamped to 1.0
    // score = 5 - 1.0 * DISPOSITION_DEFECT_BONUS (negative because disposition positive + defective)
    expect(result[0].score).toBeLessThan(5);
  });
});

// ============ GROUP 3: Interaction & Reputation Tests ============

describe('logInteraction', () => {
  it('appends new interaction to empty log', () => {
    const log: InteractionRecord[] = [];
    const result = logInteraction(log, 1, 'cooperate', 'cooperate', 'trade', 0.3);
    expect(result).toHaveLength(1);
    expect(result[0].tick).toBe(1);
    expect(result[0].actorMove).toBe('cooperate');
    expect(result[0].targetMove).toBe('cooperate');
    expect(result[0].context).toBe('trade');
    expect(result[0].stakes).toBe('low');
  });

  it('marks high stakes when stakes exceed threshold', () => {
    const log: InteractionRecord[] = [];
    const result = logInteraction(log, 1, 'cooperate', 'defect', 'territory', 0.75);
    expect(result[0].stakes).toBe('high');
  });

  it('marks low stakes when stakes are below threshold', () => {
    const log: InteractionRecord[] = [];
    const result = logInteraction(log, 1, 'defect', 'cooperate', 'trade', 0.4);
    expect(result[0].stakes).toBe('low');
  });

  it('caps log at INTERACTION_LOG_CAP', () => {
    let log: InteractionRecord[] = [];
    for (let i = 0; i < INTERACTION_LOG_CAP + 5; i++) {
      log = logInteraction(log, i, 'cooperate', 'cooperate', 'trade', 0.3);
    }
    expect(log).toHaveLength(INTERACTION_LOG_CAP);
    // Oldest entries should be removed
    expect(log[0].tick).toBe(5);
    expect(log[INTERACTION_LOG_CAP - 1].tick).toBe(INTERACTION_LOG_CAP + 4);
  });

  it('preserves order when appending', () => {
    let log: InteractionRecord[] = [];
    log = logInteraction(log, 1, 'cooperate', 'cooperate', 'trade', 0.3);
    log = logInteraction(log, 2, 'cooperate', 'defect', 'trade', 0.3);
    log = logInteraction(log, 3, 'defect', 'cooperate', 'trade', 0.3);
    expect(log).toHaveLength(3);
    expect(log[0].tick).toBe(1);
    expect(log[1].tick).toBe(2);
    expect(log[2].tick).toBe(3);
  });
});

describe('updateReputation', () => {
  it('increases reputation on cooperate', () => {
    const current = 0.5;
    const result = updateReputation(current, 'cooperate');
    expect(result).toBe(0.5 + REPUTATION_UPDATE_COOPERATE);
    expect(result).toBeLessThan(1.0);
  });

  it('decreases reputation on defect (asymmetric penalty)', () => {
    const current = 0.5;
    const result = updateReputation(current, 'defect');
    expect(result).toBe(0.5 + REPUTATION_UPDATE_DEFECT);
    expect(Math.abs(REPUTATION_UPDATE_DEFECT)).toBeGreaterThan(Math.abs(REPUTATION_UPDATE_COOPERATE));
  });

  it('clamps reputation to [0, 1]', () => {
    const result1 = updateReputation(0.98, 'cooperate');
    expect(result1).toBeLessThanOrEqual(1.0);

    const result2 = updateReputation(0.02, 'defect');
    expect(result2).toBeGreaterThanOrEqual(0.0);
  });

  it('handles reputation at boundaries', () => {
    const result1 = updateReputation(1.0, 'defect');
    expect(result1).toBeLessThanOrEqual(1.0);

    const result2 = updateReputation(0.0, 'cooperate');
    expect(result2).toBeGreaterThanOrEqual(0.0);
  });
});

describe('decayReputation', () => {
  it('decays reputation above default toward default', () => {
    const current = 0.8;
    const result = decayReputation(current);
    expect(result).toBeLessThan(current);
    expect(result).toBeGreaterThanOrEqual(DEFAULT_REPUTATION);
  });

  it('decays reputation below default toward default', () => {
    const current = 0.2;
    const result = decayReputation(current);
    expect(result).toBeGreaterThan(current);
    expect(result).toBeLessThanOrEqual(DEFAULT_REPUTATION);
  });

  it('leaves reputation at default unchanged', () => {
    const result = decayReputation(DEFAULT_REPUTATION);
    expect(result).toBe(DEFAULT_REPUTATION);
  });

  it('decays by REPUTATION_DECAY_PER_TICK when above default', () => {
    const current = 0.7;
    const result = decayReputation(current);
    expect(result).toBe(current - REPUTATION_DECAY_PER_TICK);
  });

  it('decays by REPUTATION_DECAY_PER_TICK when below default', () => {
    const current = 0.3;
    const result = decayReputation(current);
    expect(result).toBe(current + REPUTATION_DECAY_PER_TICK);
  });

  it('clamps toward default, never overshoots', () => {
    const high = 0.51;
    const resultHigh = decayReputation(high);
    expect(resultHigh).toBeGreaterThanOrEqual(DEFAULT_REPUTATION);

    const low = 0.49;
    const resultLow = decayReputation(low);
    expect(resultLow).toBeLessThanOrEqual(DEFAULT_REPUTATION);
  });
});

// ============ GROUP 4: computeStakes Tests ============

describe('computeStakes', () => {
  it('returns 0.3 for gold domain alone', () => {
    const stakes = computeStakes('gold', 0, false, false);
    expect(stakes).toBe(STAKES_DOMAIN_GOLD);
  });

  it('returns 0.4 for iron domain alone', () => {
    const stakes = computeStakes('iron', 0, false, false);
    expect(stakes).toBe(STAKES_DOMAIN_IRON);
  });

  it('returns 0 for non-special domain', () => {
    const stakes = computeStakes('shadow', 0, false, false);
    expect(stakes).toBe(0);
  });

  it('adds 0.2 for extreme positive sentiment', () => {
    const stakes = computeStakes('gold', 0.8, false, false);
    expect(stakes).toBe(STAKES_DOMAIN_GOLD + STAKES_EXTREME_SENTIMENT);
  });

  it('adds 0.2 for extreme negative sentiment', () => {
    const stakes = computeStakes('iron', -0.8, false, false);
    expect(stakes).toBe(STAKES_DOMAIN_IRON + STAKES_EXTREME_SENTIMENT);
  });

  it('does not add extreme sentiment bonus for sentiment near 0.7 boundary', () => {
    const stakes = computeStakes('gold', 0.7, false, false);
    expect(stakes).toBe(STAKES_DOMAIN_GOLD);
  });

  it('adds 0.3 for faction leader', () => {
    const stakes = computeStakes('gold', 0, true, false);
    expect(stakes).toBe(STAKES_DOMAIN_GOLD + STAKES_FACTION_LEADER);
  });

  it('adds 0.3 for territory control', () => {
    const stakes = computeStakes('iron', 0, false, true);
    expect(stakes).toBe(STAKES_DOMAIN_IRON + STAKES_TERRITORY_CONTROL);
  });

  it('stacks all bonuses and clamps at 1.0', () => {
    // gold (0.3) + extreme sentiment (0.2) + faction leader (0.3) + territory (0.3) = 1.2 → clamps to 1.0
    const stakes = computeStakes('gold', 0.75, true, true);
    expect(stakes).toBe(1.0);
  });

  it('clamps negative stakes to 0', () => {
    const stakes = computeStakes('shadow', 0, false, false);
    expect(stakes).toBeGreaterThanOrEqual(0);
  });
});

// ============ GROUP 5: resolveDilemma Tests ============

describe('resolveDilemma', () => {
  it('returns mutual_trust when both cooperate', () => {
    const emptyHistory: InteractionRecord[] = [];
    const event = resolveDilemma(
      'actor.1',
      'actor.2',
      'always-cooperate',
      'always-cooperate',
      emptyHistory,
      emptyHistory,
      10,
      'trade',
      0.5,
    );
    expect(event.outcome).toBe('mutual_trust');
    expect(event.actorMove).toBe('cooperate');
    expect(event.targetMove).toBe('cooperate');
    expect(event.tick).toBe(10);
    expect(event.stakes).toBe(0.5);
  });

  it('returns betrayed when actor cooperates and target defects', () => {
    const emptyHistory: InteractionRecord[] = [];
    const event = resolveDilemma(
      'actor.1',
      'actor.2',
      'always-cooperate',
      'always-defect',
      emptyHistory,
      emptyHistory,
      10,
      'trade',
      0.5,
    );
    expect(event.outcome).toBe('betrayed');
    expect(event.actorMove).toBe('cooperate');
    expect(event.targetMove).toBe('defect');
  });

  it('returns exploitation when actor defects and target cooperates', () => {
    const emptyHistory: InteractionRecord[] = [];
    const event = resolveDilemma(
      'actor.1',
      'actor.2',
      'always-defect',
      'always-cooperate',
      emptyHistory,
      emptyHistory,
      10,
      'trade',
      0.5,
    );
    expect(event.outcome).toBe('exploitation');
    expect(event.actorMove).toBe('defect');
    expect(event.targetMove).toBe('cooperate');
  });

  it('returns mutual_distrust when both defect', () => {
    const emptyHistory: InteractionRecord[] = [];
    const event = resolveDilemma(
      'actor.1',
      'actor.2',
      'always-defect',
      'always-defect',
      emptyHistory,
      emptyHistory,
      10,
      'trade',
      0.5,
    );
    expect(event.outcome).toBe('mutual_distrust');
    expect(event.actorMove).toBe('defect');
    expect(event.targetMove).toBe('defect');
  });

  it('evaluates strategies based on history', () => {
    const actorHistory: InteractionRecord[] = [
      {
        tick: 5,
        actorMove: 'cooperate',
        targetMove: 'cooperate',
        context: 'trade',
        stakes: 'low',
      },
    ];
    const targetHistory: InteractionRecord[] = [];
    // tit-for-tat with cooperative history should cooperate
    // always-cooperate should cooperate
    const event = resolveDilemma(
      'actor.1',
      'actor.2',
      'tit-for-tat',
      'always-cooperate',
      actorHistory,
      targetHistory,
      10,
      'trade',
      0.5,
    );
    expect(event.outcome).toBe('mutual_trust');
  });

  it('includes actorId and targetId in event', () => {
    const event = resolveDilemma(
      'actor.1',
      'actor.2',
      'always-cooperate',
      'always-cooperate',
      [],
      [],
      10,
      'trade',
      0.5,
    );
    expect(event.actorId).toBe('actor.1');
    expect(event.targetId).toBe('actor.2');
  });

  it('includes context in event', () => {
    const event = resolveDilemma(
      'actor.1',
      'actor.2',
      'always-cooperate',
      'always-cooperate',
      [],
      [],
      10,
      'raid',
      0.5,
    );
    expect(event.context).toBe('raid');
  });
});

// ============ GROUP 6: applyDilemmaEffects Tests ============

describe('applyDilemmaEffects', () => {
  it('mutual_trust: +0.15 sentiment, +0.1 strength, both rep +0.05', () => {
    const effects = applyDilemmaEffects('mutual_trust');
    expect(effects.sentimentDelta).toBe(DILEMMA_MUTUAL_TRUST_SENTIMENT);
    expect(effects.strengthDelta).toBe(DILEMMA_MUTUAL_TRUST_STRENGTH);
    expect(effects.actorRepDelta).toBe(REPUTATION_UPDATE_COOPERATE);
    expect(effects.targetRepDelta).toBe(REPUTATION_UPDATE_COOPERATE);
  });

  it('betrayed: -0.4 sentiment, actor rep +0.025, target rep -0.08', () => {
    const effects = applyDilemmaEffects('betrayed');
    expect(effects.sentimentDelta).toBe(DILEMMA_BETRAYAL_SENTIMENT);
    expect(effects.strengthDelta).toBe(0);
    expect(effects.actorRepDelta).toBe(REPUTATION_UPDATE_COOPERATE * 0.5);
    expect(effects.targetRepDelta).toBe(REPUTATION_UPDATE_DEFECT);
  });

  it('exploitation: -0.4 sentiment, actor rep -0.08, target rep +0.025', () => {
    const effects = applyDilemmaEffects('exploitation');
    expect(effects.sentimentDelta).toBe(DILEMMA_BETRAYAL_SENTIMENT);
    expect(effects.strengthDelta).toBe(0);
    expect(effects.actorRepDelta).toBe(REPUTATION_UPDATE_DEFECT);
    expect(effects.targetRepDelta).toBe(REPUTATION_UPDATE_COOPERATE * 0.5);
  });

  it('mutual_distrust: -0.1 sentiment, both rep -0.04', () => {
    const effects = applyDilemmaEffects('mutual_distrust');
    expect(effects.sentimentDelta).toBe(DILEMMA_MUTUAL_DISTRUST_SENTIMENT);
    expect(effects.strengthDelta).toBe(0);
    expect(effects.actorRepDelta).toBe(REPUTATION_UPDATE_DEFECT * 0.5);
    expect(effects.targetRepDelta).toBe(REPUTATION_UPDATE_DEFECT * 0.5);
  });
});
