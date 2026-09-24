/**
 * THR-1543 (FB7) — the `fightBlock` helper: expansion shape, defaults, the
 * terminal-rule throw, and the JSON package pre-expansion.
 */
import { describe, expect, it } from 'vitest';
import {
  FIGHT_DEFAULT_AFTERIMAGES,
  assertFightBlockTerminal,
  expandFightBlockSteps,
  fightBlock,
  fightResultIndex,
} from '../fightBlock';
import {
  FIGHT_DEFAULT_CLASH_REACH,
  FIGHT_DEFAULT_NERVE_REACH,
  FIGHT_EXCHANGE_CAP,
  FIGHT_STEP_DURATION,
  FIGHT_STEP_FAIL_BEHAVIOR,
  FIGHT_STEP_PLACEHOLDER_DIFFICULTY,
} from '../../fight-constants';
import { afterimageForOutcome } from '../../../types/unifiedAction';
import type { StepOutcome } from '../../../types/unifiedAction';

const BANDS: readonly StepOutcome[] = [
  'critical_success', 'success', 'near_miss', 'success_at_cost', 'failure', 'critical_failure',
];

describe('fightBlock — expansion shape', () => {
  it('is one nerve step then FIGHT_EXCHANGE_CAP clash steps by default', () => {
    const steps = fightBlock();
    expect(steps).toHaveLength(1 + FIGHT_EXCHANGE_CAP);
    expect(steps.map((s) => s.fightRole)).toEqual(['nerve', ...Array(FIGHT_EXCHANGE_CAP).fill('clash')]);
  });

  it('stamps the defaults every fight step carries', () => {
    for (const step of fightBlock({ exchanges: 2 })) {
      expect(step.difficulty).toBe(FIGHT_STEP_PLACEHOLDER_DIFFICULTY);
      expect(step.duration).toEqual(FIGHT_STEP_DURATION);
      expect(step.failBehavior).toBe(FIGHT_STEP_FAIL_BEHAVIOR);
      expect(step.onSuccess).toEqual([]);
      expect(step.onFailure).toEqual([]);
      expect(step.opponentRef).toBeUndefined();
    }
    const [nerve, clash] = fightBlock({ exchanges: 1 });
    expect(nerve.reach).toBe(FIGHT_DEFAULT_NERVE_REACH);
    expect(clash.reach).toBe(FIGHT_DEFAULT_CLASH_REACH);
  });

  it('honours the spec: exchanges, reaches, opponentRef, prose, nudges, deal, complications', () => {
    const complication = { id: 'complication.fight.test' } as never;
    const steps = fightBlock({
      exchanges: 2,
      nerveReach: 'veil',
      clashReach: 'eye',
      opponentRef: 'beast',
      nerve: { narrativeTemplate: 'Open.', purposeLine: 'Stand firm', afterimages: { success: 'Held.' } },
      clashes: [{ narrativeTemplate: 'First {exchange}.' }],
      deal: { count: 3 },
      complications: [complication],
    });
    expect(steps).toHaveLength(3);
    expect(steps[0].reach).toBe('veil');
    expect(steps[1].reach).toBe('eye');
    expect(steps.every((s) => s.opponentRef === 'beast')).toBe(true);
    expect(steps[0].narrativeTemplate).toBe('Open.');
    expect(steps[0].purposeLine).toBe('Stand firm');
    expect(steps[0].successAfterimage).toBe('Held.');
    // The last clash prose repeats; `{exchange}` reads as a word, never a numeral.
    expect(steps[1].narrativeTemplate).toBe('First first.');
    expect(steps[2].narrativeTemplate).toBe('First second.');
    expect(steps.every((s) => s.deal?.count === 3)).toBe(true);
    expect(steps.every((s) => s.fightComplications?.[0] === complication)).toBe(true);
  });

  it('authors a default afterimage for every band on both roles, naming the opponent', () => {
    const [nerve, clash] = fightBlock({ exchanges: 1 });
    for (const band of BANDS) {
      expect(afterimageForOutcome(nerve, band)).toBe(FIGHT_DEFAULT_AFTERIMAGES.nerve[band]);
      const line = afterimageForOutcome(clash, band);
      expect(line).toContain('{target}');
      expect(line).not.toContain('{opponent}');
    }
    // A cast-bound opponent is named through its cast key.
    const [, bound] = fightBlock({ exchanges: 1, opponentRef: 'rival' });
    expect(bound.successAfterimage).toContain('{cast:rival}');
    // The near-miss band has its own line ("trades blows"), not the success one.
    expect(clash.nearMissAfterimage).not.toBe(clash.successAfterimage);
  });

  it('throws on an exchange count outside [1, FIGHT_EXCHANGE_CAP]', () => {
    expect(() => fightBlock({ exchanges: 0 })).toThrow(/exchanges must be an integer/);
    expect(() => fightBlock({ exchanges: FIGHT_EXCHANGE_CAP + 1 })).toThrow(/exchanges must be an integer/);
    expect(() => fightBlock({ exchanges: 1.5 })).toThrow(/exchanges must be an integer/);
  });

  it('puts the result memory index past the terminal block', () => {
    const steps = fightBlock();
    expect(fightResultIndex(steps)).toBe(steps.length);
  });
});

describe('the terminal rule', () => {
  it('passes a block at the end of a step list', () => {
    const opening = { reach: 'eye', fightRole: undefined };
    expect(() => assertFightBlockTerminal([opening, ...fightBlock()], 't.ok')).not.toThrow();
  });

  it('throws when an ordinary step follows a fight block', () => {
    const after = { reach: 'eye' };
    expect(() => assertFightBlockTerminal([...fightBlock(), after], 't.bad')).toThrow(
      /t\.bad: step 4 follows a fight block/,
    );
  });
});

describe('the JSON package pre-expansion', () => {
  it('replaces a { fightBlock } step entry with the block, inline', () => {
    const opening = { reach: 'eye', difficulty: 0.3 };
    const expanded = expandFightBlockSteps([opening, { fightBlock: { exchanges: 2 } }]);
    expect(expanded).toHaveLength(1 + 1 + 2);
    expect(expanded[0]).toBe(opening);
    expect((expanded[1] as { fightRole?: string }).fightRole).toBe('nerve');
    expect(expanded.some((s) => typeof s === 'function')).toBe(false);
  });

  it('surfaces a malformed block as a throw the compiler reports', () => {
    expect(() => expandFightBlockSteps([{ fightBlock: { exchanges: 9 } }])).toThrow();
  });
});
