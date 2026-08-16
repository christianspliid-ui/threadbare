import { describe, it, expect } from 'vitest';
import {
  composeRetconLine,
  resolveAgentPronouns,
  WHISPER_VIGNETTE_TEMPLATES,
  WHISPER_NUDGE_TEMPLATES,
  AMBITION_DREAM_IMAGERY,
  COMPULSION_VIGNETTE_TEMPLATES,
  type RetconInput,
} from '../premonition-content';

/**
 * THR-1137 — "they" in object position. `{pronoun}` resolves to the SUBJECT form,
 * so authoring an object slot with it shipped "an uncharted place calls to they"
 * and "a sliver of divine will might still reach they" to the live modal.
 * Object slots take `{object}`.
 */
const OBJECT_CASE_LEAK =
  /\b(to|of|for|at|with|from|before|toward|towards|upon|against|reached|reach|sway|guide|guides|held|hold|holds|glimpse|catch|let|leads) they\b/i;

/** A lowercase "they" opening a sentence — the slot wanted `{Pronoun}`. */
const SENTENCE_INITIAL_LEAK = /(^|[.!?] )they\b/;

function makeRng(seed = 42) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
}

const base: RetconInput = {
  encounterType: 'explore',
  reach: 'eye',
  threatRating: 'easy',
  hexDistance: 0,
  requiresPresence: true,
  locationName: 'The Weathered Span',
  agentName: 'Kael',
};

describe('composeRetconLine', () => {
  it('produces a non-empty string', () => {
    const line = composeRetconLine(makeRng(), base);
    expect(line.length).toBeGreaterThan(10);
    console.log('[explore/eye/easy/here]', line);
  });

  it('includes distance context for far encounters', () => {
    const line = composeRetconLine(makeRng(), { ...base, hexDistance: 8, locationName: 'Thornwall' });
    // Far encounters should mention the location
    expect(line).toContain('Thornwall');
    console.log('[explore/eye/easy/far]', line);
  });

  it('uses remote fragments when requiresPresence is false', () => {
    const line = composeRetconLine(makeRng(), { ...base, requiresPresence: false });
    // Remote encounters don't include location suffix (dist=0)
    expect(line.length).toBeGreaterThan(10);
    console.log('[explore/eye/easy/remote]', line);
  });

  it('varies by encounter type', () => {
    const rng = makeRng(99);
    const explore = composeRetconLine(rng, base);
    const duel = composeRetconLine(makeRng(99), { ...base, encounterType: 'duel', reach: 'iron', threatRating: 'hard' });
    expect(explore).not.toEqual(duel);
    console.log('[explore]', explore);
    console.log('[duel]', duel);
  });

  it('varies confidence by threat rating', () => {
    const easy = composeRetconLine(makeRng(1), { ...base, threatRating: 'easy' });
    const deadly = composeRetconLine(makeRng(1), { ...base, threatRating: 'deadly' });
    expect(easy).not.toEqual(deadly);
    console.log('[easy]', easy);
    console.log('[deadly]', deadly);
  });

  it('is deterministic with same seed', () => {
    const a = composeRetconLine(makeRng(77), base);
    const b = composeRetconLine(makeRng(77), base);
    expect(a).toEqual(b);
  });

  it('resolves pronouns to they/their', () => {
    const line = composeRetconLine(makeRng(), { ...base, encounterType: 'assist', agentName: 'Mira' });
    expect(line).not.toContain('{pronoun}');
    expect(line).not.toContain('{possessive}');
    console.log('[assist/pronoun-check]', line);
  });

  it('covers all encounter types without error', () => {
    const types = ['explore', 'acquire', 'create', 'hire', 'duel', 'steal', 'trade', 'assist', 'build', 'lead'] as const;
    for (const t of types) {
      const line = composeRetconLine(makeRng(), { ...base, encounterType: t });
      expect(line.length).toBeGreaterThan(10);
      console.log(`[${t}]`, line);
    }
  });

  // ── THR-1137 ────────────────────────────────────────────────────

  describe('pronoun case across every fragment combination', () => {
    const TYPES = ['explore', 'acquire', 'create', 'hire', 'duel', 'steal', 'trade', 'assist', 'build', 'lead'] as const;
    const THREATS = ['trivial', 'easy', 'moderate', 'hard', 'deadly'] as const;
    // One per distance band: remote (requiresPresence false), here, short, medium, far.
    const DISTANCES = [
      { hexDistance: 0, requiresPresence: false },
      { hexDistance: 0, requiresPresence: true },
      { hexDistance: 2, requiresPresence: true },
      { hexDistance: 5, requiresPresence: true },
      { hexDistance: 9, requiresPresence: true },
    ];

    /** Every line the composer can produce: 40 seeds per cell reaches all pool indices. */
    function* everyLine(): Generator<{ line: string; label: string }> {
      for (const encounterType of TYPES) {
        for (const threatRating of THREATS) {
          for (const dist of DISTANCES) {
            for (let seed = 1; seed <= 40; seed++) {
              const input: RetconInput = { ...base, encounterType, threatRating, ...dist };
              yield {
                line: composeRetconLine(makeRng(seed), input),
                label: `${encounterType}/${threatRating}/d${dist.hexDistance}${dist.requiresPresence ? '' : '/remote'}/s${seed}`,
              };
            }
          }
        }
      }
    }

    it('never leaves an unresolved placeholder', () => {
      const bad: string[] = [];
      for (const { line, label } of everyLine()) {
        if (line.includes('{') || line.includes('}')) bad.push(`${label}: ${line}`);
      }
      expect(bad).toEqual([]);
    });

    it('never puts the subject pronoun in an object slot', () => {
      const bad: string[] = [];
      for (const { line, label } of everyLine()) {
        if (OBJECT_CASE_LEAK.test(line)) bad.push(`${label}: ${line}`);
      }
      expect(bad).toEqual([]);
    });

    it('never opens a sentence with a lowercase pronoun', () => {
      const bad: string[] = [];
      for (const { line, label } of everyLine()) {
        if (SENTENCE_INITIAL_LEAK.test(line)) bad.push(`${label}: ${line}`);
      }
      expect(bad).toEqual([]);
    });

    it('names the agent at most once per line', () => {
      // Fragments are combinatorial: 'Word has reached {name} —' and 'an uncharted
      // place calls to {name}' are each correct alone and repeat the name together.
      const bad: string[] = [];
      for (const { line, label } of everyLine()) {
        const mentions = line.split('Kael').length - 1;
        if (mentions > 1) bad.push(`${label} (${mentions}×): ${line}`);
      }
      expect(bad).toEqual([]);
    });

    it('the medium-distance line reads as a clause, not a dangling "of"', () => {
      // 'Word has reached {pronoun} of' + a clause gave "Word has reached they of
      // they could make a difference" — the reported symptom.
      const lines = [];
      for (let seed = 1; seed <= 40; seed++) {
        lines.push(composeRetconLine(makeRng(seed), { ...base, encounterType: 'assist', hexDistance: 5 }));
      }
      const reached = lines.filter(l => l.includes('Word has reached'));
      expect(reached.length).toBeGreaterThan(0);
      for (const l of reached) expect(l).not.toMatch(/reached .* of they/);
      console.log('[medium/assist]', reached[0]);
    });
  });
});

describe('premonition template pools (THR-1137)', () => {
  const POOLS: Array<[string, string[]]> = [
    ...Object.entries(WHISPER_VIGNETTE_TEMPLATES).map(([k, v]) => [`whisper.${k}`, v] as [string, string[]]),
    ...Object.entries(AMBITION_DREAM_IMAGERY).map(([k, v]) => [`imagery.${k}`, v] as [string, string[]]),
    ...Object.entries(COMPULSION_VIGNETTE_TEMPLATES).map(([k, v]) => [`compulsion.${k}`, v] as [string, string[]]),
    ...Object.entries(WHISPER_NUDGE_TEMPLATES).flatMap(([k, v]) => ([
      [`nudge.${k}.labels`, v.labels], [`nudge.${k}.flavors`, v.flavors],
    ] as Array<[string, string[]]>)),
  ];

  it('resolve with correct pronoun case', () => {
    const bad: string[] = [];
    for (const [poolName, templates] of POOLS) {
      templates.forEach((t, i) => {
        const resolved = resolveAgentPronouns(t, 'Kael');
        if (OBJECT_CASE_LEAK.test(resolved)) bad.push(`${poolName}[${i}] object case: ${resolved}`);
        if (SENTENCE_INITIAL_LEAK.test(resolved)) bad.push(`${poolName}[${i}] sentence-initial: ${resolved}`);
      });
    }
    expect(bad).toEqual([]);
  });

  it('leave no unresolved agent placeholder', () => {
    const bad: string[] = [];
    for (const [poolName, templates] of POOLS) {
      templates.forEach((t, i) => {
        // {reachName}/{sphereName} are resolved later by resolveNudgeProse.
        const resolved = resolveAgentPronouns(t, 'Kael')
          .replace(/\{reachName\}/g, 'Iron').replace(/\{sphereName\}/g, 'Force');
        if (resolved.includes('{')) bad.push(`${poolName}[${i}]: ${resolved}`);
      });
    }
    expect(bad).toEqual([]);
  });
});

describe('resolveAgentPronouns', () => {
  it('resolves subject and object case separately', () => {
    expect(resolveAgentPronouns('{pronoun} walk; it calls to {object}.', 'Kael'))
      .toBe('they walk; it calls to them.');
  });

  it('resolves the sentence-initial forms', () => {
    expect(resolveAgentPronouns('{Pronoun} stand. {Object} it found.', 'Kael'))
      .toBe('They stand. Them it found.');
  });

  it('resolves name and possessive', () => {
    expect(resolveAgentPronouns('{name} raised {possessive} hand.', 'Kael'))
      .toBe('Kael raised their hand.');
  });
});
