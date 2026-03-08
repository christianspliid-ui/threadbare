import { describe, it, expect } from 'vitest';
import {
  COOPERATION_STRATEGIES,
  DISPOSITION_COOPERATE_BONUS,
  DISPOSITION_DEFECT_BONUS,
  REPUTATION_DECAY_PER_TICK,
  INTERACTION_LOG_CAP,
  DILEMMA_STAKES_THRESHOLD,
  REPUTATION_UPDATE_COOPERATE,
  REPUTATION_UPDATE_DEFECT,
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
} from '../disposition';
import type {
  CooperationStrategy,
  SocialOrientation,
  InteractionRecord,
  DilemmaEvent,
} from '../disposition';

describe('disposition types and constants', () => {
  describe('cooperation strategies', () => {
    it('exports all 5 cooperation strategies', () => {
      expect(COOPERATION_STRATEGIES).toHaveLength(5);
      expect(COOPERATION_STRATEGIES).toEqual(
        expect.arrayContaining([
          'tit-for-tat',
          'grudger',
          'pavlov',
          'always-cooperate',
          'always-defect',
        ])
      );
    });

    it('strategy type is assignable to array members', () => {
      const strategy: CooperationStrategy = COOPERATION_STRATEGIES[0];
      expect(strategy).toBeDefined();
    });
  });

  describe('cooperation bonus constants', () => {
    it('DISPOSITION_COOPERATE_BONUS is positive', () => {
      expect(DISPOSITION_COOPERATE_BONUS).toBeGreaterThan(0);
      expect(DISPOSITION_COOPERATE_BONUS).toBe(0.3);
    });

    it('DISPOSITION_DEFECT_BONUS is positive (paradoxical bonus for defection)', () => {
      expect(DISPOSITION_DEFECT_BONUS).toBeGreaterThan(0);
      expect(DISPOSITION_DEFECT_BONUS).toBe(0.3);
    });
  });

  describe('reputation constants', () => {
    it('DEFAULT_REPUTATION is between 0 and 1', () => {
      expect(DEFAULT_REPUTATION).toBeGreaterThanOrEqual(0);
      expect(DEFAULT_REPUTATION).toBeLessThanOrEqual(1);
      expect(DEFAULT_REPUTATION).toBe(0.5);
    });

    it('REPUTATION_DECAY_PER_TICK is small positive value', () => {
      expect(REPUTATION_DECAY_PER_TICK).toBeGreaterThan(0);
      expect(REPUTATION_DECAY_PER_TICK).toBeLessThan(0.01);
      expect(REPUTATION_DECAY_PER_TICK).toBe(0.005);
    });

    it('REPUTATION_UPDATE_COOPERATE is positive', () => {
      expect(REPUTATION_UPDATE_COOPERATE).toBeGreaterThan(0);
      expect(REPUTATION_UPDATE_COOPERATE).toBe(0.05);
    });

    it('REPUTATION_UPDATE_DEFECT is negative', () => {
      expect(REPUTATION_UPDATE_DEFECT).toBeLessThan(0);
      expect(REPUTATION_UPDATE_DEFECT).toBe(-0.08);
    });
  });

  describe('interaction and stakes constants', () => {
    it('INTERACTION_LOG_CAP is reasonable', () => {
      expect(INTERACTION_LOG_CAP).toBeGreaterThan(0);
      expect(INTERACTION_LOG_CAP).toBe(10);
    });

    it('DILEMMA_STAKES_THRESHOLD is between 0 and 1', () => {
      expect(DILEMMA_STAKES_THRESHOLD).toBeGreaterThan(0);
      expect(DILEMMA_STAKES_THRESHOLD).toBeLessThan(1);
      expect(DILEMMA_STAKES_THRESHOLD).toBe(0.3);
    });
  });

  describe('stakes computation weights', () => {
    it('STAKES_DOMAIN_GOLD is positive', () => {
      expect(STAKES_DOMAIN_GOLD).toBeGreaterThan(0);
      expect(STAKES_DOMAIN_GOLD).toBe(0.3);
    });

    it('STAKES_DOMAIN_IRON is positive', () => {
      expect(STAKES_DOMAIN_IRON).toBeGreaterThan(0);
      expect(STAKES_DOMAIN_IRON).toBe(0.4);
    });

    it('STAKES_EXTREME_SENTIMENT is positive', () => {
      expect(STAKES_EXTREME_SENTIMENT).toBeGreaterThan(0);
      expect(STAKES_EXTREME_SENTIMENT).toBe(0.2);
    });

    it('STAKES_FACTION_LEADER is positive', () => {
      expect(STAKES_FACTION_LEADER).toBeGreaterThan(0);
      expect(STAKES_FACTION_LEADER).toBe(0.3);
    });

    it('STAKES_TERRITORY_CONTROL is positive', () => {
      expect(STAKES_TERRITORY_CONTROL).toBeGreaterThan(0);
      expect(STAKES_TERRITORY_CONTROL).toBe(0.3);
    });
  });

  describe('dilemma outcome effect constants', () => {
    it('DILEMMA_MUTUAL_TRUST_SENTIMENT is positive', () => {
      expect(DILEMMA_MUTUAL_TRUST_SENTIMENT).toBeGreaterThan(0);
      expect(DILEMMA_MUTUAL_TRUST_SENTIMENT).toBe(0.15);
    });

    it('DILEMMA_MUTUAL_TRUST_STRENGTH is positive', () => {
      expect(DILEMMA_MUTUAL_TRUST_STRENGTH).toBeGreaterThan(0);
      expect(DILEMMA_MUTUAL_TRUST_STRENGTH).toBe(0.1);
    });

    it('DILEMMA_BETRAYAL_SENTIMENT is negative', () => {
      expect(DILEMMA_BETRAYAL_SENTIMENT).toBeLessThan(0);
      expect(DILEMMA_BETRAYAL_SENTIMENT).toBe(-0.4);
    });

    it('DILEMMA_MUTUAL_DISTRUST_SENTIMENT is negative', () => {
      expect(DILEMMA_MUTUAL_DISTRUST_SENTIMENT).toBeLessThan(0);
      expect(DILEMMA_MUTUAL_DISTRUST_SENTIMENT).toBe(-0.1);
    });
  });

  describe('InteractionRecord type', () => {
    it('constructs a valid interaction record', () => {
      const record: InteractionRecord = {
        tick: 42,
        actorMove: 'cooperate',
        targetMove: 'defect',
        context: 'trade_negotiation',
        stakes: 'high',
      };
      expect(record.tick).toBe(42);
      expect(record.actorMove).toBe('cooperate');
      expect(record.targetMove).toBe('defect');
      expect(record.context).toBe('trade_negotiation');
      expect(record.stakes).toBe('high');
    });

    it('supports low stakes', () => {
      const record: InteractionRecord = {
        tick: 10,
        actorMove: 'defect',
        targetMove: 'cooperate',
        context: 'casual_meeting',
        stakes: 'low',
      };
      expect(record.stakes).toBe('low');
    });
  });

  describe('DilemmaEvent type', () => {
    it('constructs a valid mutual trust outcome', () => {
      const event: DilemmaEvent = {
        tick: 50,
        actorId: 'actor-1',
        targetId: 'actor-2',
        actorMove: 'cooperate',
        targetMove: 'cooperate',
        outcome: 'mutual_trust',
        stakes: 0.8,
        context: 'alliance_proposal',
      };
      expect(event.tick).toBe(50);
      expect(event.outcome).toBe('mutual_trust');
      expect(event.stakes).toBe(0.8);
    });

    it('constructs a valid betrayal outcome', () => {
      const event: DilemmaEvent = {
        tick: 75,
        actorId: 'actor-a',
        targetId: 'actor-b',
        actorMove: 'cooperate',
        targetMove: 'defect',
        outcome: 'betrayed',
        stakes: 0.7,
        context: 'territory_dispute',
      };
      expect(event.outcome).toBe('betrayed');
    });

    it('constructs a valid exploitation outcome', () => {
      const event: DilemmaEvent = {
        tick: 100,
        actorId: 'actor-x',
        targetId: 'actor-y',
        actorMove: 'defect',
        targetMove: 'cooperate',
        outcome: 'exploitation',
        stakes: 0.5,
        context: 'trade_deal',
      };
      expect(event.outcome).toBe('exploitation');
    });

    it('constructs a valid mutual distrust outcome', () => {
      const event: DilemmaEvent = {
        tick: 120,
        actorId: 'actor-p',
        targetId: 'actor-q',
        actorMove: 'defect',
        targetMove: 'defect',
        outcome: 'mutual_distrust',
        stakes: 0.4,
        context: 'hostile_negotiation',
      };
      expect(event.outcome).toBe('mutual_distrust');
    });
  });

  describe('SocialOrientation type', () => {
    it('accepts cooperative orientation', () => {
      const orientation: SocialOrientation = 'cooperative';
      expect(orientation).toBe('cooperative');
    });

    it('accepts defective orientation', () => {
      const orientation: SocialOrientation = 'defective';
      expect(orientation).toBe('defective');
    });

    it('accepts neutral orientation', () => {
      const orientation: SocialOrientation = 'neutral';
      expect(orientation).toBe('neutral');
    });
  });
});
