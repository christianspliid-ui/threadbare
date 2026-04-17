import { describe, it, expect, vi } from 'vitest';
import { generateMarkRevealMessage } from '../hiddenMarkProse';
import {
  HIDDEN_MARK_ENCOUNTER_REVEAL_PROSE,
  HIDDEN_MARK_DECAY_PROSE,
} from '../../data/hidden-mark-prose';
import type { GameState } from '../../types/gameState';
import type { HiddenMark, HiddenMarkCategory } from '../../types/unifiedAction';

const ALL_CATEGORIES: readonly HiddenMarkCategory[] = [
  'betrayal',
  'debt',
  'secret_knowledge',
  'concealed_action',
  'forbidden_contact',
  'soul_diminishment',
  'mystical_contract',
];

function makeMark(category: HiddenMarkCategory, overrides: Partial<HiddenMark> = {}): HiddenMark {
  return {
    markId: `mark-${category}-1`,
    category,
    severity: 0.8,
    label: 'a specific buried thing',
    sourceEncounterId: 'test.source',
    placedTick: 5,
    targetAgentId: 'agent-1',
    revealFamilies: ['investigation'],
    ...overrides,
  };
}

function makeState(seed = 42, tick = 25): GameState {
  return {
    seed,
    tick,
    tickEvents: [],
    recentEvents: [],
    hiddenMarks: [],
    // graph intentionally omitted — forces the minimal-context fallback (rung 1)
  } as unknown as GameState;
}

// ─── Coverage: every (category × path) produces non-empty prose ────

describe('generateMarkRevealMessage — category coverage', () => {
  for (const category of ALL_CATEGORIES) {
    it(`encounter-reveal: ${category} produces a non-empty enriched message`, () => {
      const msg = generateMarkRevealMessage(makeState(), makeMark(category), 'investigation.audit', 25);
      expect(msg.length).toBeGreaterThan(0);
      // Label substitution ran
      expect(msg).toContain('a specific buried thing');
      // Enrichment fallback for {name} used the minimal-context name
      expect(msg).toContain('The marked one');
      // Author voice must not leak placeholder syntax to players
      expect(msg).not.toMatch(/\{mark_label\}/);
    });

    it(`decay: ${category} produces a non-empty enriched message`, () => {
      const msg = generateMarkRevealMessage(makeState(), makeMark(category), 'decay:severity_floor', 25);
      expect(msg.length).toBeGreaterThan(0);
      expect(msg).toContain('a specific buried thing');
      expect(msg).toContain('The marked one');
      expect(msg).not.toMatch(/\{mark_label\}/);
    });
  }
});

// ─── Path split: encounter vs decay ───────────────────────────────

describe('generateMarkRevealMessage — encounter and decay use separate tables', () => {
  it('produces different strings for encounter-reveal vs decay with the same mark', () => {
    // At (seed=42, tick=25, same markId) the template-seed is identical in both
    // calls. The only difference is which table is read — so a different output
    // proves the tables are disjoint at that seed.
    const mark = makeMark('betrayal');
    const encounter = generateMarkRevealMessage(makeState(42, 25), mark, 'investigation.audit', 25);
    const decay = generateMarkRevealMessage(makeState(42, 25), mark, 'decay:severity_floor', 25);
    expect(encounter).not.toBe(decay);
  });
});

// ─── Determinism ──────────────────────────────────────────────────

describe('generateMarkRevealMessage — determinism', () => {
  it('same (seed, tick, markId) → same output', () => {
    const mark = makeMark('secret_knowledge');
    const a = generateMarkRevealMessage(makeState(7, 30), mark, 'investigation.audit', 30);
    const b = generateMarkRevealMessage(makeState(7, 30), mark, 'investigation.audit', 30);
    expect(a).toBe(b);
  });

  it('different seed → often different output (at least one change over 20 seeds)', () => {
    const mark = makeMark('mystical_contract');
    const outputs = new Set<string>();
    for (let seed = 0; seed < 20; seed++) {
      outputs.add(generateMarkRevealMessage(makeState(seed, 30), mark, 'investigation.audit', 30));
    }
    // With 5 templates per category we should see at least 2 distinct strings across 20 seeds
    expect(outputs.size).toBeGreaterThan(1);
  });
});

// ─── Fail-soft ────────────────────────────────────────────────────

describe('generateMarkRevealMessage — fail-soft', () => {
  it('rung 1: graph missing → function does not throw and label is preserved', () => {
    const mark = makeMark('debt', { label: 'a debt to the guild' });
    expect(() => generateMarkRevealMessage(makeState(), mark, 'investigation.audit', 25)).not.toThrow();
    const msg = generateMarkRevealMessage(makeState(), mark, 'investigation.audit', 25);
    expect(msg).toContain('a debt to the guild');
  });

  it('rung 2: empty label is substituted with a generic phrase, never leaks the token', () => {
    const mark = makeMark('betrayal', { label: '' });
    const msg = generateMarkRevealMessage(makeState(), mark, 'investigation.audit', 25);
    expect(msg).not.toMatch(/\{mark_label\}/);
    expect(msg.length).toBeGreaterThan(0);
  });

  it('rung 3: if enrichment throws, falls back to v1 literal', async () => {
    const enrichModule = await import('../proseEnrichment');
    const originalEnrich = enrichModule.enrichProse;
    // Replace enrichProse with a throwing stub for this one test
    vi.spyOn(enrichModule, 'enrichProse').mockImplementation(() => {
      throw new Error('enrich boom');
    });
    try {
      const mark = makeMark('forbidden_contact', { label: 'the letter they burned' });
      const msg = generateMarkRevealMessage(makeState(), mark, 'investigation.audit', 25);
      expect(msg).toBe('A buried truth surfaces: the letter they burned');
    } finally {
      vi.spyOn(enrichModule, 'enrichProse').mockImplementation(originalEnrich);
      vi.restoreAllMocks();
    }
  });
});

// ─── Content authoring bar (T4) ───────────────────────────────────

describe('hidden-mark-prose content — authoring bar', () => {
  it('every category has at least 5 encounter-reveal templates', () => {
    for (const cat of ALL_CATEGORIES) {
      expect(HIDDEN_MARK_ENCOUNTER_REVEAL_PROSE[cat].length).toBeGreaterThanOrEqual(5);
    }
  });

  it('every category has at least 5 decay templates', () => {
    for (const cat of ALL_CATEGORIES) {
      expect(HIDDEN_MARK_DECAY_PROSE[cat].length).toBeGreaterThanOrEqual(5);
    }
  });

  it('every template contains {mark_label}', () => {
    const tables = [HIDDEN_MARK_ENCOUNTER_REVEAL_PROSE, HIDDEN_MARK_DECAY_PROSE];
    for (const table of tables) {
      for (const cat of ALL_CATEGORIES) {
        for (const tpl of table[cat]) {
          expect(tpl, `${cat}: "${tpl}"`).toContain('{mark_label}');
        }
      }
    }
  });

  it('every template contains {name}', () => {
    const tables = [HIDDEN_MARK_ENCOUNTER_REVEAL_PROSE, HIDDEN_MARK_DECAY_PROSE];
    for (const table of tables) {
      for (const cat of ALL_CATEGORIES) {
        for (const tpl of table[cat]) {
          expect(tpl, `${cat}: "${tpl}"`).toContain('{name}');
        }
      }
    }
  });

  it('every template is ≤250 chars (chronicle-event friendly length)', () => {
    const tables = [HIDDEN_MARK_ENCOUNTER_REVEAL_PROSE, HIDDEN_MARK_DECAY_PROSE];
    for (const table of tables) {
      for (const cat of ALL_CATEGORIES) {
        for (const tpl of table[cat]) {
          expect(tpl.length, `${cat}: "${tpl}"`).toBeLessThanOrEqual(250);
        }
      }
    }
  });
});
