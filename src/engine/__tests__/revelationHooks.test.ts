/**
 * Tests for AgentKnowledge types and revelation hook functions.
 *
 * Tests cover:
 * - createEmptyAgentKnowledge factory produces correct empty shape
 * - All reveal functions are idempotent
 * - getOrCreateKnowledge creates or returns existing
 * - addChronicleEvent caps at CHRONICLE_MAX_ENTRIES
 */

import { describe, it, expect } from 'vitest';
import {
  createEmptyAgentKnowledge,
  CHRONICLE_MAX_ENTRIES,
} from '../../types/agentKnowledge';
import {
  getOrCreateKnowledge,
  revealValue,
  revealDomain,
  revealBond,
  revealAmbition,
  revealPossession,
  revealPower,
  revealCondition,
  revealAgreement,
  revealThreat,
  revealDisposition,
  addChronicleEvent,
} from '../revelationHooks';
import type { AgentKnowledge } from '../../types/agentKnowledge';

// ─── createEmptyAgentKnowledge ────────────────────────────────────

describe('createEmptyAgentKnowledge', () => {
  it('returns AgentKnowledge with all sets empty', () => {
    const k = createEmptyAgentKnowledge();
    expect(k.revealedValues.size).toBe(0);
    expect(k.revealedDomains.size).toBe(0);
    expect(k.revealedBonds.size).toBe(0);
    expect(k.revealedAmbitions.size).toBe(0);
    expect(k.knownEvents.size).toBe(0);
    expect(k.revealedPossessions.size).toBe(0);
    expect(k.revealedPowers.size).toBe(0);
    expect(k.revealedConditions.size).toBe(0);
    expect(k.revealedAgreements.size).toBe(0);
  });

  it('returns AgentKnowledge with numeric fields at 0', () => {
    const k = createEmptyAgentKnowledge();
    expect(k.interactionDepth).toBe(0);
    expect(k.coLocationTicks).toBe(0);
  });

  it('returns AgentKnowledge with boolean fields false', () => {
    const k = createEmptyAgentKnowledge();
    expect(k.threatRevealed).toBe(false);
    expect(k.dispositionRevealed).toBe(false);
  });
});

// ─── getOrCreateKnowledge ─────────────────────────────────────────

describe('getOrCreateKnowledge', () => {
  it('creates new entry if missing', () => {
    const map = new Map<string, AgentKnowledge>();
    const k = getOrCreateKnowledge(map, 'agent-1');
    expect(k).toBeDefined();
    expect(k.interactionDepth).toBe(0);
    expect(map.has('agent-1')).toBe(true);
  });

  it('returns existing entry if present', () => {
    const map = new Map<string, AgentKnowledge>();
    const existing = createEmptyAgentKnowledge();
    existing.interactionDepth = 5;
    map.set('agent-1', existing);
    const k = getOrCreateKnowledge(map, 'agent-1');
    expect(k).toBe(existing);
    expect(k.interactionDepth).toBe(5);
  });
});

// ─── revealValue ─────────────────────────────────────────────────

describe('revealValue', () => {
  it('adds to revealedValues set', () => {
    const k = createEmptyAgentKnowledge();
    const result = revealValue(k, 'mercy_ruthlessness');
    expect(result).toBe(true);
    expect(k.revealedValues.has('mercy_ruthlessness')).toBe(true);
  });

  it('is idempotent — calling again with same args returns false', () => {
    const k = createEmptyAgentKnowledge();
    revealValue(k, 'mercy_ruthlessness');
    const result = revealValue(k, 'mercy_ruthlessness');
    expect(result).toBe(false);
    expect(k.revealedValues.size).toBe(1);
  });
});

// ─── revealDomain ─────────────────────────────────────────────────

describe('revealDomain', () => {
  it('adds to revealedDomains set', () => {
    const k = createEmptyAgentKnowledge();
    const result = revealDomain(k, 'iron');
    expect(result).toBe(true);
    expect(k.revealedDomains.has('iron')).toBe(true);
  });

  it('is idempotent', () => {
    const k = createEmptyAgentKnowledge();
    revealDomain(k, 'iron');
    const result = revealDomain(k, 'iron');
    expect(result).toBe(false);
    expect(k.revealedDomains.size).toBe(1);
  });
});

// ─── revealBond ───────────────────────────────────────────────────

describe('revealBond', () => {
  it('adds to revealedBonds map with correct source', () => {
    const k = createEmptyAgentKnowledge();
    const result = revealBond(k, 'agent-123', 'witnessed');
    expect(result).toBe(true);
    expect(k.revealedBonds.get('agent-123')).toBe('witnessed');
  });

  it('is idempotent', () => {
    const k = createEmptyAgentKnowledge();
    revealBond(k, 'agent-123', 'witnessed');
    const result = revealBond(k, 'agent-123', 'witnessed');
    expect(result).toBe(false);
    expect(k.revealedBonds.size).toBe(1);
  });
});

// ─── revealAmbition ───────────────────────────────────────────────

describe('revealAmbition', () => {
  it('adds to revealedAmbitions set', () => {
    const k = createEmptyAgentKnowledge();
    const result = revealAmbition(k, 'ambition-456');
    expect(result).toBe(true);
    expect(k.revealedAmbitions.has('ambition-456')).toBe(true);
  });

  it('is idempotent', () => {
    const k = createEmptyAgentKnowledge();
    revealAmbition(k, 'ambition-456');
    const result = revealAmbition(k, 'ambition-456');
    expect(result).toBe(false);
    expect(k.revealedAmbitions.size).toBe(1);
  });
});

// ─── revealPossession ─────────────────────────────────────────────

describe('revealPossession', () => {
  it('adds to revealedPossessions set', () => {
    const k = createEmptyAgentKnowledge();
    const result = revealPossession(k, 'item-789');
    expect(result).toBe(true);
    expect(k.revealedPossessions.has('item-789')).toBe(true);
  });

  it('is idempotent', () => {
    const k = createEmptyAgentKnowledge();
    revealPossession(k, 'item-789');
    const result = revealPossession(k, 'item-789');
    expect(result).toBe(false);
    expect(k.revealedPossessions.size).toBe(1);
  });
});

// ─── revealPower ──────────────────────────────────────────────────

describe('revealPower', () => {
  it('adds to revealedPowers set', () => {
    const k = createEmptyAgentKnowledge();
    const result = revealPower(k, 'power-abc');
    expect(result).toBe(true);
    expect(k.revealedPowers.has('power-abc')).toBe(true);
  });

  it('is idempotent', () => {
    const k = createEmptyAgentKnowledge();
    revealPower(k, 'power-abc');
    const result = revealPower(k, 'power-abc');
    expect(result).toBe(false);
    expect(k.revealedPowers.size).toBe(1);
  });
});

// ─── revealCondition ──────────────────────────────────────────────

describe('revealCondition', () => {
  it('adds to revealedConditions set', () => {
    const k = createEmptyAgentKnowledge();
    const result = revealCondition(k, 'curse-def');
    expect(result).toBe(true);
    expect(k.revealedConditions.has('curse-def')).toBe(true);
  });

  it('is idempotent', () => {
    const k = createEmptyAgentKnowledge();
    revealCondition(k, 'curse-def');
    const result = revealCondition(k, 'curse-def');
    expect(result).toBe(false);
    expect(k.revealedConditions.size).toBe(1);
  });
});

// ─── revealAgreement ──────────────────────────────────────────────

describe('revealAgreement', () => {
  it('adds to revealedAgreements set', () => {
    const k = createEmptyAgentKnowledge();
    const result = revealAgreement(k, 'agreement-ghi');
    expect(result).toBe(true);
    expect(k.revealedAgreements.has('agreement-ghi')).toBe(true);
  });

  it('is idempotent', () => {
    const k = createEmptyAgentKnowledge();
    revealAgreement(k, 'agreement-ghi');
    const result = revealAgreement(k, 'agreement-ghi');
    expect(result).toBe(false);
    expect(k.revealedAgreements.size).toBe(1);
  });
});

// ─── revealThreat ─────────────────────────────────────────────────

describe('revealThreat', () => {
  it('sets threatRevealed to true', () => {
    const k = createEmptyAgentKnowledge();
    const result = revealThreat(k);
    expect(result).toBe(true);
    expect(k.threatRevealed).toBe(true);
  });

  it('returns false when already revealed', () => {
    const k = createEmptyAgentKnowledge();
    revealThreat(k);
    const result = revealThreat(k);
    expect(result).toBe(false);
  });
});

// ─── revealDisposition ────────────────────────────────────────────

describe('revealDisposition', () => {
  it('sets dispositionRevealed to true', () => {
    const k = createEmptyAgentKnowledge();
    const result = revealDisposition(k);
    expect(result).toBe(true);
    expect(k.dispositionRevealed).toBe(true);
  });

  it('returns false when already revealed', () => {
    const k = createEmptyAgentKnowledge();
    revealDisposition(k);
    const result = revealDisposition(k);
    expect(result).toBe(false);
  });
});

// ─── addChronicleEvent ────────────────────────────────────────────

describe('addChronicleEvent', () => {
  it('adds to knownEvents set', () => {
    const k = createEmptyAgentKnowledge();
    const result = addChronicleEvent(k, 'event-jkl');
    expect(result).toBe(true);
    expect(k.knownEvents.has('event-jkl')).toBe(true);
  });

  it('is idempotent for same event', () => {
    const k = createEmptyAgentKnowledge();
    addChronicleEvent(k, 'event-jkl');
    const result = addChronicleEvent(k, 'event-jkl');
    expect(result).toBe(false);
  });

  it(`caps at CHRONICLE_MAX_ENTRIES (${CHRONICLE_MAX_ENTRIES})`, () => {
    const k = createEmptyAgentKnowledge();
    // Fill to the cap
    for (let i = 0; i < CHRONICLE_MAX_ENTRIES; i++) {
      addChronicleEvent(k, `event-${i}`);
    }
    expect(k.knownEvents.size).toBe(CHRONICLE_MAX_ENTRIES);
    // Adding one more should evict the oldest
    addChronicleEvent(k, `event-overflow`);
    expect(k.knownEvents.size).toBe(CHRONICLE_MAX_ENTRIES);
    expect(k.knownEvents.has('event-overflow')).toBe(true);
  });
});
