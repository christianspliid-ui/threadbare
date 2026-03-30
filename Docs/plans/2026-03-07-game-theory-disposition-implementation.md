# Game Theory Disposition System — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a cooperate/defect game theory system that gives agents distinct interaction strategies (Tit-for-Tat, Grudger, Pavlov, Always-Cooperate, Always-Defect), creating narrative tension through trust, betrayal, and reputation dynamics.

**Architecture:** Two-layer hybrid — a Disposition Layer modifies action selection scores based on interaction history and cooperation strategy (always-on, lightweight), while Dilemma Events fire for high-stakes interactions with explicit 2×2 cooperate/defect resolution and narrative beats. Both layers update relationship sentiment and a public reputation score.

**Tech Stack:** TypeScript, Vitest, existing WorldGraph + axiological motivation + action selection pipeline.

**Design doc:** `Docs/plans/2026-03-07-game-theory-disposition-design.md`

---

## Phase A: Disposition Layer

### Task 1: Types — CooperationStrategy, InteractionRecord, socialOrientation

**Files:**
- Create: `src/types/disposition.ts`
- Modify: `src/types/agent.ts` (add `socialOrientation` to ActionCandidate)

**Step 1: Write the failing test**

Create `src/types/__tests__/disposition.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import type {
  CooperationStrategy,
  InteractionRecord,
  DilemmaEvent,
  DilemmaOutcome,
  SocialOrientation,
} from '../disposition';
import {
  DISPOSITION_COOPERATE_BONUS,
  DISPOSITION_DEFECT_BONUS,
  REPUTATION_DECAY_PER_TICK,
  INTERACTION_LOG_CAP,
  DILEMMA_STAKES_THRESHOLD,
  REPUTATION_UPDATE_COOPERATE,
  REPUTATION_UPDATE_DEFECT,
  COOPERATION_STRATEGIES,
} from '../disposition';

describe('disposition types', () => {
  it('exports all 5 cooperation strategies', () => {
    expect(COOPERATION_STRATEGIES).toEqual([
      'tit-for-tat',
      'grudger',
      'pavlov',
      'always-cooperate',
      'always-defect',
    ]);
  });

  it('exports tunable constants with sane defaults', () => {
    expect(DISPOSITION_COOPERATE_BONUS).toBeGreaterThan(0);
    expect(DISPOSITION_DEFECT_BONUS).toBeGreaterThan(0);
    expect(REPUTATION_DECAY_PER_TICK).toBeGreaterThan(0);
    expect(REPUTATION_DECAY_PER_TICK).toBeLessThan(0.05);
    expect(INTERACTION_LOG_CAP).toBeGreaterThanOrEqual(5);
    expect(DILEMMA_STAKES_THRESHOLD).toBeGreaterThan(0);
    expect(DILEMMA_STAKES_THRESHOLD).toBeLessThan(1);
    expect(REPUTATION_UPDATE_COOPERATE).toBeGreaterThan(0);
    expect(REPUTATION_UPDATE_DEFECT).toBeLessThan(0);
  });

  it('InteractionRecord has required fields', () => {
    const record: InteractionRecord = {
      tick: 1,
      actorMove: 'cooperate',
      targetMove: 'defect',
      context: 'trade_goods',
      stakes: 'low',
    };
    expect(record.actorMove).toBe('cooperate');
    expect(record.targetMove).toBe('defect');
  });

  it('DilemmaEvent has required fields', () => {
    const event: DilemmaEvent = {
      tick: 5,
      actorId: 'agent-1',
      targetId: 'agent-2',
      actorMove: 'cooperate',
      targetMove: 'defect',
      outcome: 'betrayed',
      stakes: 0.8,
      context: 'territory_dispute',
    };
    expect(event.outcome).toBe('betrayed');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/types/__tests__/disposition.test.ts`
Expected: FAIL — module not found

**Step 3: Write the types**

Create `src/types/disposition.ts`:

```typescript
// ── Cooperation Strategies ──────────────────────────────────────────
export type CooperationStrategy =
  | 'tit-for-tat'
  | 'grudger'
  | 'pavlov'
  | 'always-cooperate'
  | 'always-defect';

export const COOPERATION_STRATEGIES: CooperationStrategy[] = [
  'tit-for-tat',
  'grudger',
  'pavlov',
  'always-cooperate',
  'always-defect',
];

// ── Social Orientation (on action templates) ────────────────────────
export type SocialOrientation = 'cooperative' | 'defective' | 'neutral';

// ── Interaction History ─────────────────────────────────────────────
export interface InteractionRecord {
  tick: number;
  actorMove: 'cooperate' | 'defect';
  targetMove: 'cooperate' | 'defect';
  context: string;       // action template ID
  stakes: 'low' | 'high';
}

// ── Dilemma Events ──────────────────────────────────────────────────
export type DilemmaOutcome =
  | 'mutual_trust'
  | 'betrayed'
  | 'exploitation'
  | 'mutual_distrust';

export interface DilemmaEvent {
  tick: number;
  actorId: string;
  targetId: string;
  actorMove: 'cooperate' | 'defect';
  targetMove: 'cooperate' | 'defect';
  outcome: DilemmaOutcome;
  stakes: number;
  context: string;
}

// ── Tunable Constants ───────────────────────────────────────────────
export const DISPOSITION_COOPERATE_BONUS = 0.3;
export const DISPOSITION_DEFECT_BONUS = 0.3;
export const REPUTATION_DECAY_PER_TICK = 0.005;
export const INTERACTION_LOG_CAP = 10;
export const DILEMMA_STAKES_THRESHOLD = 0.6;
export const REPUTATION_UPDATE_COOPERATE = 0.05;
export const REPUTATION_UPDATE_DEFECT = -0.08;
export const DEFAULT_REPUTATION = 0.5;

// Stakes computation weights
export const STAKES_DOMAIN_GOLD = 0.3;
export const STAKES_DOMAIN_IRON = 0.4;
export const STAKES_EXTREME_SENTIMENT = 0.2;
export const STAKES_FACTION_LEADER = 0.3;
export const STAKES_TERRITORY_CONTROL = 0.3;

// Dilemma outcome effects
export const DILEMMA_MUTUAL_TRUST_SENTIMENT = 0.15;
export const DILEMMA_MUTUAL_TRUST_STRENGTH = 0.1;
export const DILEMMA_BETRAYAL_SENTIMENT = -0.4;
export const DILEMMA_MUTUAL_DISTRUST_SENTIMENT = -0.1;
```

Then add `socialOrientation` to `ActionCandidate` in `src/types/agent.ts`:

```typescript
// Add to ActionCandidate interface, after probability?: number
socialOrientation?: SocialOrientation;
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/types/__tests__/disposition.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/types/disposition.ts src/types/__tests__/disposition.test.ts src/types/agent.ts
git commit -m "feat(disposition): add cooperation strategy types, interaction record, dilemma event, tunable constants"
```

---

### Task 2: Content Data — Strategy Weights per Archetype

**Files:**
- Create: `src/data/game-theory-content.ts`
- Create: `src/data/__tests__/game-theory-content.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import {
  ARCHETYPE_STRATEGY_WEIGHTS,
  getStrategyWeights,
  SOCIAL_ORIENTATION_MAP,
} from '../game-theory-content';
import { NARRATIVE_ARCHETYPES } from '../archetype-content';
import { COOPERATION_STRATEGIES } from '../../types/disposition';

describe('game-theory-content', () => {
  describe('ARCHETYPE_STRATEGY_WEIGHTS', () => {
    it('has weights for every archetype', () => {
      for (const arch of NARRATIVE_ARCHETYPES) {
        expect(ARCHETYPE_STRATEGY_WEIGHTS[arch.id]).toBeDefined();
      }
    });

    it('weights sum to 1.0 for each archetype (±0.001)', () => {
      for (const [id, weights] of Object.entries(ARCHETYPE_STRATEGY_WEIGHTS)) {
        const sum = Object.values(weights).reduce((a, b) => a + b, 0);
        expect(sum).toBeCloseTo(1.0, 2);
      }
    });

    it('covers all 5 strategies per archetype', () => {
      for (const [id, weights] of Object.entries(ARCHETYPE_STRATEGY_WEIGHTS)) {
        for (const strat of COOPERATION_STRATEGIES) {
          expect(typeof weights[strat]).toBe('number');
          expect(weights[strat]).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  describe('getStrategyWeights', () => {
    it('returns weights for known archetype', () => {
      const weights = getStrategyWeights('tragic-hero');
      expect(weights).toBeDefined();
      expect(weights['tit-for-tat']).toBeGreaterThan(0);
    });

    it('returns uniform distribution for unknown archetype', () => {
      const weights = getStrategyWeights('nonexistent');
      expect(Object.values(weights).every(v => v === 0.2)).toBe(true);
    });
  });

  describe('SOCIAL_ORIENTATION_MAP', () => {
    it('maps action template IDs to social orientations', () => {
      // Should have entries for existing action templates
      expect(typeof SOCIAL_ORIENTATION_MAP).toBe('object');
      // All values must be valid orientations
      for (const orientation of Object.values(SOCIAL_ORIENTATION_MAP)) {
        expect(['cooperative', 'defective', 'neutral']).toContain(orientation);
      }
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/__tests__/game-theory-content.test.ts`
Expected: FAIL — module not found

**Step 3: Write the content data**

Create `src/data/game-theory-content.ts` with:
- `ARCHETYPE_STRATEGY_WEIGHTS`: Record mapping all 19 archetype IDs → `Record<CooperationStrategy, number>` probability distributions
- `getStrategyWeights(archetypeId)`: lookup with uniform fallback
- `SOCIAL_ORIENTATION_MAP`: Record mapping action template IDs to `SocialOrientation`

Key archetype → strategy mappings (design decisions):
- Tragic Hero: TFT 0.40, Grudger 0.30, Pavlov 0.20, AC 0.10, AD 0.00
- Trickster: TFT 0.20, Grudger 0.10, Pavlov 0.30, AC 0.05, AD 0.35
- Tyrant: TFT 0.10, Grudger 0.20, Pavlov 0.10, AC 0.00, AD 0.60
- Caregiver: TFT 0.15, Grudger 0.05, Pavlov 0.10, AC 0.65, AD 0.05
- Sage: TFT 0.50, Grudger 0.10, Pavlov 0.30, AC 0.10, AD 0.00
- (fill all 19 with narratively appropriate distributions)

Social orientation map: consult existing action templates in `src/data/` action definitions. Tag trade/alliance/heal/share as `cooperative`, betray/steal/attack/sabotage as `defective`, travel/meditate/build as `neutral`.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/data/__tests__/game-theory-content.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/data/game-theory-content.ts src/data/__tests__/game-theory-content.test.ts
git commit -m "feat(disposition): add archetype strategy weights and social orientation map"
```

---

### Task 3: Engine — evaluateStrategy (Game Theory Core)

**Files:**
- Create: `src/engine/disposition.ts`
- Create: `src/engine/__tests__/disposition.test.ts`

**Step 1: Write the failing tests**

```typescript
import { describe, it, expect } from 'vitest';
import { evaluateStrategy } from '../disposition';
import type { InteractionRecord } from '../../types/disposition';

const coop: InteractionRecord = {
  tick: 1, actorMove: 'cooperate', targetMove: 'cooperate', context: 'trade', stakes: 'low',
};
const defected: InteractionRecord = {
  tick: 2, actorMove: 'cooperate', targetMove: 'defect', context: 'trade', stakes: 'low',
};
const mutualDefect: InteractionRecord = {
  tick: 3, actorMove: 'defect', targetMove: 'defect', context: 'trade', stakes: 'low',
};

describe('evaluateStrategy', () => {
  describe('tit-for-tat', () => {
    it('cooperates on first interaction (empty history)', () => {
      expect(evaluateStrategy('tit-for-tat', [])).toBe(1);
    });
    it('cooperates after target cooperated', () => {
      expect(evaluateStrategy('tit-for-tat', [coop])).toBe(1);
    });
    it('defects after target defected', () => {
      expect(evaluateStrategy('tit-for-tat', [defected])).toBe(-1);
    });
  });

  describe('grudger', () => {
    it('cooperates on first interaction', () => {
      expect(evaluateStrategy('grudger', [])).toBe(1);
    });
    it('cooperates while target always cooperated', () => {
      expect(evaluateStrategy('grudger', [coop, coop])).toBe(1);
    });
    it('defects forever after any target defection', () => {
      expect(evaluateStrategy('grudger', [coop, defected, coop])).toBe(-1);
    });
  });

  describe('pavlov', () => {
    it('cooperates on first interaction', () => {
      expect(evaluateStrategy('pavlov', [])).toBe(1);
    });
    it('repeats after mutual cooperation (rewarded)', () => {
      expect(evaluateStrategy('pavlov', [coop])).toBe(1);
    });
    it('switches after being exploited (punished)', () => {
      expect(evaluateStrategy('pavlov', [defected])).toBe(-1);
    });
    it('switches after mutual defection (punished)', () => {
      expect(evaluateStrategy('pavlov', [mutualDefect])).toBe(-1);
    });
  });

  describe('always-cooperate', () => {
    it('always returns +1', () => {
      expect(evaluateStrategy('always-cooperate', [])).toBe(1);
      expect(evaluateStrategy('always-cooperate', [defected])).toBe(1);
    });
  });

  describe('always-defect', () => {
    it('always returns -1', () => {
      expect(evaluateStrategy('always-defect', [])).toBe(-1);
      expect(evaluateStrategy('always-defect', [coop])).toBe(-1);
    });
  });
});
```

**Step 2: Run to verify it fails**

Run: `npx vitest run src/engine/__tests__/disposition.test.ts`
Expected: FAIL

**Step 3: Implement evaluateStrategy**

In `src/engine/disposition.ts`:

```typescript
import type { CooperationStrategy, InteractionRecord } from '../types/disposition';

export function evaluateStrategy(
  strategy: CooperationStrategy,
  history: InteractionRecord[],
): number {
  if (history.length === 0) return initialMove(strategy);

  const last = history[history.length - 1];

  switch (strategy) {
    case 'tit-for-tat':
      return last.targetMove === 'cooperate' ? 1 : -1;
    case 'grudger':
      return history.some(h => h.targetMove === 'defect') ? -1 : 1;
    case 'pavlov':
      return last.actorMove === last.targetMove ? 1 : -1;
    case 'always-cooperate':
      return 1;
    case 'always-defect':
      return -1;
  }
}

function initialMove(strategy: CooperationStrategy): number {
  return strategy === 'always-defect' ? -1 : 1;
}
```

**Step 4: Run to verify it passes**

Run: `npx vitest run src/engine/__tests__/disposition.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/disposition.ts src/engine/__tests__/disposition.test.ts
git commit -m "feat(disposition): implement evaluateStrategy — 5 classic game theory strategies"
```

---

### Task 4: Engine — applyDispositionModifier (Pipeline Stage)

**Files:**
- Modify: `src/engine/disposition.ts` (add function)
- Modify: `src/engine/__tests__/disposition.test.ts` (add tests)

**Step 1: Write the failing tests**

Add to `disposition.test.ts`:

```typescript
import { evaluateStrategy, applyDispositionModifier } from '../disposition';
import type { ActionCandidate } from '../../types/agent';

describe('applyDispositionModifier', () => {
  const baseCandidates: ActionCandidate[] = [
    { templateId: 'trade', targetId: 'b', domain: 'gold', score: 0.5,
      motivations: ['greed_generosity'], socialOrientation: 'cooperative' },
    { templateId: 'steal', targetId: 'b', domain: 'shadow', score: 0.5,
      motivations: ['greed_generosity'], socialOrientation: 'defective' },
    { templateId: 'travel', targetId: '', domain: 'star', score: 0.5,
      motivations: ['courage_prudence'], socialOrientation: 'neutral' },
  ];

  it('returns candidates unchanged when no target agent', () => {
    const result = applyDispositionModifier(baseCandidates, 'tit-for-tat', [], 0.5);
    expect(result.map(c => c.score)).toEqual([0.5, 0.5, 0.5]);
  });

  it('boosts cooperative actions when disposition is positive', () => {
    const result = applyDispositionModifier(
      baseCandidates, 'always-cooperate', [], 0.7,  // good reputation
    );
    const coopScore = result.find(c => c.templateId === 'trade')!.score;
    expect(coopScore).toBeGreaterThan(0.5);
  });

  it('boosts defective actions when disposition is negative', () => {
    const result = applyDispositionModifier(
      baseCandidates, 'always-defect', [], 0.3,  // bad reputation
    );
    const defScore = result.find(c => c.templateId === 'steal')!.score;
    expect(defScore).toBeGreaterThan(0.5);
  });

  it('does not modify neutral actions', () => {
    const result = applyDispositionModifier(
      baseCandidates, 'always-defect', [], 0.1,
    );
    const neutralScore = result.find(c => c.templateId === 'travel')!.score;
    expect(neutralScore).toBe(0.5);
  });

  it('factors in target reputation', () => {
    // Same strategy, different target reputation
    const goodRep = applyDispositionModifier(baseCandidates, 'tit-for-tat', [], 0.9);
    const badRep = applyDispositionModifier(baseCandidates, 'tit-for-tat', [], 0.1);
    const coopGood = goodRep.find(c => c.templateId === 'trade')!.score;
    const coopBad = badRep.find(c => c.templateId === 'trade')!.score;
    expect(coopGood).toBeGreaterThan(coopBad);
  });
});
```

**Step 2: Run to verify it fails**

Run: `npx vitest run src/engine/__tests__/disposition.test.ts`
Expected: FAIL — applyDispositionModifier not found

**Step 3: Implement applyDispositionModifier**

Add to `src/engine/disposition.ts`:

```typescript
import type { ActionCandidate } from '../types/agent';
import {
  DISPOSITION_COOPERATE_BONUS,
  DISPOSITION_DEFECT_BONUS,
} from '../types/disposition';

export function applyDispositionModifier(
  candidates: ActionCandidate[],
  strategy: CooperationStrategy,
  history: InteractionRecord[],
  targetReputation: number,
): ActionCandidate[] {
  // Check if any candidates have social orientation
  const hasSocial = candidates.some(
    c => c.socialOrientation === 'cooperative' || c.socialOrientation === 'defective',
  );
  if (!hasSocial) return candidates;

  const disposition = evaluateStrategy(strategy, history);
  const reputationFactor = (targetReputation - 0.5) * 0.4; // [-0.2, +0.2]
  const finalDisposition = Math.max(-1, Math.min(1, disposition + reputationFactor));

  return candidates.map(c => {
    if (c.socialOrientation === 'cooperative') {
      return { ...c, score: c.score + finalDisposition * DISPOSITION_COOPERATE_BONUS };
    }
    if (c.socialOrientation === 'defective') {
      return { ...c, score: c.score - finalDisposition * DISPOSITION_DEFECT_BONUS };
    }
    return c; // neutral — unchanged
  });
}
```

**Step 4: Run to verify it passes**

Run: `npx vitest run src/engine/__tests__/disposition.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/disposition.ts src/engine/__tests__/disposition.test.ts
git commit -m "feat(disposition): implement applyDispositionModifier — pipeline stage for action score bias"
```

---

### Task 5: Engine — logInteraction and updateReputation

**Files:**
- Modify: `src/engine/disposition.ts`
- Modify: `src/engine/__tests__/disposition.test.ts`

**Step 1: Write the failing tests**

```typescript
describe('logInteraction', () => {
  it('appends to interaction log', () => {
    const log: InteractionRecord[] = [];
    const result = logInteraction(log, 1, 'cooperate', 'defect', 'trade', 0.3);
    expect(result).toHaveLength(1);
    expect(result[0].actorMove).toBe('cooperate');
    expect(result[0].stakes).toBe('low');
  });

  it('caps log at INTERACTION_LOG_CAP', () => {
    const log: InteractionRecord[] = Array.from({ length: 10 }, (_, i) => ({
      tick: i, actorMove: 'cooperate' as const, targetMove: 'cooperate' as const,
      context: 'trade', stakes: 'low' as const,
    }));
    const result = logInteraction(log, 11, 'defect', 'cooperate', 'steal', 0.3);
    expect(result).toHaveLength(10);
    expect(result[0].tick).toBe(1); // oldest removed
    expect(result[9].tick).toBe(11); // newest added
  });

  it('marks high stakes when above threshold', () => {
    const log: InteractionRecord[] = [];
    const result = logInteraction(log, 1, 'cooperate', 'defect', 'war', 0.8);
    expect(result[0].stakes).toBe('high');
  });
});

describe('updateReputation', () => {
  it('increases reputation for cooperation', () => {
    expect(updateReputation(0.5, 'cooperate')).toBeGreaterThan(0.5);
  });

  it('decreases reputation for defection', () => {
    expect(updateReputation(0.5, 'defect')).toBeLessThan(0.5);
  });

  it('clamps reputation to [0, 1]', () => {
    expect(updateReputation(0.01, 'defect')).toBeGreaterThanOrEqual(0);
    expect(updateReputation(0.99, 'cooperate')).toBeLessThanOrEqual(1);
  });

  it('defection penalty is larger than cooperation reward (asymmetric)', () => {
    const coopDelta = updateReputation(0.5, 'cooperate') - 0.5;
    const defectDelta = 0.5 - updateReputation(0.5, 'defect');
    expect(defectDelta).toBeGreaterThan(coopDelta);
  });
});

describe('decayReputation', () => {
  it('decays toward 0.5 from above', () => {
    expect(decayReputation(0.8)).toBeLessThan(0.8);
    expect(decayReputation(0.8)).toBeGreaterThan(0.5);
  });

  it('decays toward 0.5 from below', () => {
    expect(decayReputation(0.2)).toBeGreaterThan(0.2);
    expect(decayReputation(0.2)).toBeLessThan(0.5);
  });

  it('leaves 0.5 unchanged', () => {
    expect(decayReputation(0.5)).toBe(0.5);
  });
});
```

**Step 2: Run to verify it fails**

Run: `npx vitest run src/engine/__tests__/disposition.test.ts`
Expected: FAIL

**Step 3: Implement**

Add to `src/engine/disposition.ts`:

```typescript
import {
  INTERACTION_LOG_CAP,
  DILEMMA_STAKES_THRESHOLD,
  REPUTATION_UPDATE_COOPERATE,
  REPUTATION_UPDATE_DEFECT,
  REPUTATION_DECAY_PER_TICK,
  DEFAULT_REPUTATION,
} from '../types/disposition';

export function logInteraction(
  log: InteractionRecord[],
  tick: number,
  actorMove: 'cooperate' | 'defect',
  targetMove: 'cooperate' | 'defect',
  context: string,
  stakes: number,
): InteractionRecord[] {
  const newLog = [...log, {
    tick,
    actorMove,
    targetMove,
    context,
    stakes: stakes >= DILEMMA_STAKES_THRESHOLD ? 'high' as const : 'low' as const,
  }];
  // Cap at max length
  return newLog.length > INTERACTION_LOG_CAP
    ? newLog.slice(newLog.length - INTERACTION_LOG_CAP)
    : newLog;
}

export function updateReputation(
  current: number,
  move: 'cooperate' | 'defect',
): number {
  const delta = move === 'cooperate'
    ? REPUTATION_UPDATE_COOPERATE
    : REPUTATION_UPDATE_DEFECT;
  return Math.max(0, Math.min(1, current + delta));
}

export function decayReputation(current: number): number {
  if (current > DEFAULT_REPUTATION) {
    return Math.max(DEFAULT_REPUTATION, current - REPUTATION_DECAY_PER_TICK);
  }
  if (current < DEFAULT_REPUTATION) {
    return Math.min(DEFAULT_REPUTATION, current + REPUTATION_DECAY_PER_TICK);
  }
  return current;
}
```

**Step 4: Run to verify it passes**

Run: `npx vitest run src/engine/__tests__/disposition.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/disposition.ts src/engine/__tests__/disposition.test.ts
git commit -m "feat(disposition): add logInteraction, updateReputation, decayReputation"
```

---

### Task 6: World Seeding — Strategy Assignment

**Files:**
- Modify: `src/engine/worldSeed.ts` (add strategy assignment after archetype, ~line 240)
- Create: `src/engine/__tests__/disposition-seeding.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { assignCooperationStrategy } from '../disposition';
import { COOPERATION_STRATEGIES } from '../../types/disposition';
import type { AxiologicalProfile } from '../../types/agent';

describe('assignCooperationStrategy', () => {
  // Deterministic seeded RNG for testing
  const makeRng = (seed: number) => {
    let s = seed;
    return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  };

  it('returns a valid cooperation strategy', () => {
    const rng = makeRng(42);
    const profile = {} as AxiologicalProfile; // empty for default
    const strategy = assignCooperationStrategy('tragic-hero', profile, rng);
    expect(COOPERATION_STRATEGIES).toContain(strategy);
  });

  it('is deterministic with same seed', () => {
    const profile = {} as AxiologicalProfile;
    const s1 = assignCooperationStrategy('tragic-hero', profile, makeRng(42));
    const s2 = assignCooperationStrategy('tragic-hero', profile, makeRng(42));
    expect(s1).toBe(s2);
  });

  it('produces different strategies across seeds', () => {
    const profile = {} as AxiologicalProfile;
    const results = new Set<string>();
    for (let seed = 1; seed <= 100; seed++) {
      results.add(assignCooperationStrategy('tragic-hero', profile, makeRng(seed)));
    }
    expect(results.size).toBeGreaterThan(1);
  });

  it('respects archetype weights — tyrants skew toward always-defect', () => {
    const profile = {} as AxiologicalProfile;
    const counts: Record<string, number> = {};
    for (let seed = 1; seed <= 500; seed++) {
      const s = assignCooperationStrategy('tyrant', profile, makeRng(seed));
      counts[s] = (counts[s] || 0) + 1;
    }
    // Tyrant has 0.60 weight on always-defect, should dominate
    expect(counts['always-defect']).toBeGreaterThan(200);
  });
});
```

**Step 2: Run to verify it fails**

Run: `npx vitest run src/engine/__tests__/disposition-seeding.test.ts`
Expected: FAIL

**Step 3: Implement assignCooperationStrategy**

Add to `src/engine/disposition.ts`:

```typescript
import type { AxiologicalProfile } from '../types/agent';
import { getStrategyWeights } from '../data/game-theory-content';

export function assignCooperationStrategy(
  archetypeId: string,
  profile: AxiologicalProfile,
  rng: () => number,
): CooperationStrategy {
  const weights = { ...getStrategyWeights(archetypeId) };

  // Axiological nudges
  if (profile.loyalty_treachery !== undefined && profile.loyalty_treachery < -0.3) {
    weights['always-defect'] *= 1.5;
    weights['always-cooperate'] *= 0.5;
  }
  if (profile.cruelty_compassion !== undefined && profile.cruelty_compassion < -0.3) {
    weights['grudger'] *= 1.3;
  }
  if (profile.cunning_honesty !== undefined && profile.cunning_honesty < -0.3) {
    weights['tit-for-tat'] *= 0.7;
    weights['always-defect'] *= 1.2;
  }

  // Normalize
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  for (const key of Object.keys(weights)) {
    weights[key as CooperationStrategy] /= total;
  }

  // Weighted random select
  const roll = rng();
  let cumulative = 0;
  for (const strategy of COOPERATION_STRATEGIES) {
    cumulative += weights[strategy];
    if (roll < cumulative) return strategy;
  }
  return COOPERATION_STRATEGIES[COOPERATION_STRATEGIES.length - 1]; // fallback
}
```

Then wire into `worldSeed.ts` — in the individual agent creation loop (~line 240), after `narrativeArchetype` assignment, add:

```typescript
cooperationStrategy: assignCooperationStrategy(
  narrativeArchetype, profile, rng
),
reputationScore: DEFAULT_REPUTATION,
```

**Step 4: Run to verify it passes**

Run: `npx vitest run src/engine/__tests__/disposition-seeding.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/disposition.ts src/engine/__tests__/disposition-seeding.test.ts src/engine/worldSeed.ts
git commit -m "feat(disposition): add strategy assignment to world seeding — archetype-weighted with axiological nudges"
```

---

### Task 7: Pipeline Integration — Wire Disposition into Action Selection

**Files:**
- Modify: `src/engine/agentSelection.ts` (~line 135, insert new stage)
- Modify existing agentSelection tests to verify no regression

**Step 1: Write the failing test**

Add to `src/engine/__tests__/agentSelection.test.ts` (or create a new `disposition-pipeline.test.ts`):

```typescript
describe('pipeline with disposition modifier', () => {
  it('cooperative actions score higher when disposition is positive', () => {
    // Set up a world graph with two agents, positive interaction history
    // Run pipeline with cooperative + defective candidates
    // Verify cooperative candidate score increased relative to defective
  });

  it('does not crash when agent has no cooperationStrategy', () => {
    // Backward compatibility: agents without strategy field skip disposition stage
  });

  it('does not modify scores when target has no relationship', () => {
    // First interaction: no history, reputation at default 0.5
    // Scores should be minimally affected (only by reputation factor)
  });
});
```

**Step 2: Run to verify it fails**

Run: `npx vitest run src/engine/__tests__/disposition-pipeline.test.ts`
Expected: FAIL

**Step 3: Wire into pipeline**

In `agentSelection.ts`, in `runSelectionPipeline`, after `scoreByGoalAlignment` and before `applyPersonalityWeights`:

```typescript
// Stage 2: Disposition modifier (game theory)
const agentNode = graph.getNode(actorId);
const cooperationStrategy = agentNode?.properties?.cooperationStrategy;
if (cooperationStrategy && candidates[0]?.targetId) {
  const targetId = candidates[0].targetId;
  const targetNode = graph.getNode(targetId);
  const relationship = graph.getEdge(actorId, targetId, 'relates_to');
  const history = relationship?.properties?.interactionLog ?? [];
  const targetReputation = targetNode?.properties?.reputationScore ?? DEFAULT_REPUTATION;
  scored = applyDispositionModifier(scored, cooperationStrategy, history, targetReputation);
}
```

Import `applyDispositionModifier` from `../engine/disposition` and `DEFAULT_REPUTATION` from `../types/disposition`.

**Step 4: Run full test suite**

Run: `npx vitest run`
Expected: All existing tests PASS + new tests PASS

**Step 5: Commit**

```bash
git add src/engine/agentSelection.ts src/engine/__tests__/disposition-pipeline.test.ts
git commit -m "feat(disposition): wire disposition modifier into action selection pipeline as stage 2"
```

---

### Task 8: Phase A Integration Test

**Files:**
- Create: `src/engine/__tests__/disposition-integration.test.ts`

**Step 1: Write the integration test**

Test the full Phase A flow: seed a world → verify agents have strategies and reputation → simulate action selection for two agents with interaction history → verify disposition modifies scores → log interaction → verify reputation update.

```typescript
describe('disposition integration — Phase A', () => {
  it('full flow: seed → select with disposition → log → reputation update', () => {
    // 1. Seed world, verify cooperationStrategy + reputationScore on agents
    // 2. Create action candidates with socialOrientation
    // 3. Run selection pipeline, verify disposition affected scores
    // 4. Log interaction, verify history cap
    // 5. Update reputation, verify asymmetric defection penalty
    // 6. Decay reputation, verify drift toward 0.5
  });

  it('grudger agent defects forever after single betrayal', () => {
    // Set up grudger agent, cooperate once, target defects once, cooperate again
    // Verify grudger disposition is -1 for all subsequent interactions
  });

  it('tit-for-tat agent mirrors last interaction', () => {
    // Alternate cooperate/defect, verify TFT mirrors each time
  });
});
```

**Step 2: Run to verify it fails** → **Step 3: Implement** → **Step 4: Verify** → **Step 5: Commit**

```bash
git commit -m "test(disposition): add Phase A integration test — full flow from seeding to reputation"
```

---

## Phase B: Dilemma Events

### Task 9: Engine — computeStakes

**Files:**
- Modify: `src/engine/disposition.ts`
- Modify: `src/engine/__tests__/disposition.test.ts`

Implement `computeStakes(domain, sentiment, isFactionLeader, isTerritory)` → number [0, 1].

Test cases: gold domain = 0.3, iron = 0.4, extreme sentiment adds 0.2, faction leader adds 0.3, territory adds 0.3, clamped at 1.0.

```bash
git commit -m "feat(disposition): add computeStakes function for dilemma threshold detection"
```

---

### Task 10: Engine — resolveDilemma

**Files:**
- Modify: `src/engine/disposition.ts`
- Modify: `src/engine/__tests__/disposition.test.ts`

Implement `resolveDilemma(actorStrategy, targetStrategy, actorHistory, targetHistory, tick, context, stakes)` → DilemmaEvent.

Test the 2×2 outcome matrix: mutual_trust, betrayed, exploitation, mutual_distrust. Verify correct outcome classification.

```bash
git commit -m "feat(disposition): add resolveDilemma — 2x2 cooperate/defect outcome resolution"
```

---

### Task 11: Engine — applyDilemmaEffects

**Files:**
- Modify: `src/engine/disposition.ts`
- Modify: `src/engine/__tests__/disposition.test.ts`

Implement `applyDilemmaEffects(outcome)` → `{ sentimentDelta, strengthDelta, actorRepDelta, targetRepDelta }`.

Test each outcome:
- mutual_trust: +0.15 sentiment, +0.1 strength, both rep +0.05
- betrayed: -0.4 sentiment, actor rep +0.025, target rep -0.08
- exploitation: mirror of betrayed
- mutual_distrust: -0.1 sentiment, both rep -0.04

```bash
git commit -m "feat(disposition): add applyDilemmaEffects — outcome-to-state-change mapping"
```

---

### Task 12: Orchestrator — Dilemma Detection + Reputation Decay Phases

**Files:**
- Modify: `src/engine/orchestrator.ts` (add two new phases to tick loop)
- Modify: `src/engine/__tests__/orchestrator.test.ts`

Add `phaseDilemmaDetection(state)` after `phaseAgentActions` — scans tick events for high-stakes agent-to-agent interactions, resolves them as dilemmas, applies effects to graph.

Add `phaseReputationDecay(state)` after `phaseEssence` — iterates all agents, calls `decayReputation`.

```bash
git commit -m "feat(disposition): wire dilemma detection and reputation decay into tick orchestrator"
```

---

### Task 13: Narrative — Dilemma Beat Templates

**Files:**
- Modify: `src/data/narrative-content.ts` (add beat templates for 4 dilemma outcomes)
- Modify: `src/types/narrative.ts` (add 'dilemma_mutual_trust' | 'dilemma_betrayed' | 'dilemma_exploitation' | 'dilemma_mutual_distrust' to NarrativeEventType)

Add 2-3 prose templates per outcome, archetype-aware.

```bash
git commit -m "feat(disposition): add dilemma narrative beat templates — 4 outcomes with archetype-flavored prose"
```

---

### Task 14: UI — Agent Detail Panel Strategy Section

**Files:**
- Modify: `src/engine/agentDetail.ts` (add strategy + reputation to aggregated data)
- Modify: `src/components/Game/AgentDetailPanel.tsx` (add Strategy section after Bonds)

Show: cooperation strategy name, reputation bar (0→1), last 3 interaction outcomes with icons.

```bash
git commit -m "feat(disposition): add strategy section to Agent Detail Panel — strategy name, reputation bar, interaction history"
```

---

### Task 15: Phase B Integration Test

**Files:**
- Create: `src/engine/__tests__/disposition-dilemma-integration.test.ts`

Full Phase B flow: two agents interact in Iron domain (high stakes) → dilemma detected → resolved with 2×2 matrix → effects applied to graph → narrative beat generated → reputation updated → visible in agent detail.

```bash
git commit -m "test(disposition): add Phase B integration test — dilemma detection through narrative beat generation"
```

---

### Task 16: Run Full Test Suite + Verify

Run `npm test` — all ~1,100+ tests should pass (original ~1,027 + new ~80-100 disposition tests).

Run `npm run build` — verify no type errors.

```bash
git commit -m "chore: verify full test suite passes with disposition system"
```
