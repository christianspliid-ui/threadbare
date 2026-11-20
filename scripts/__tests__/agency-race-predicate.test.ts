/**
 * THR-2253 — the race forecast predicate (plan THR-2246, ticket 3), pinned on hand-built arm
 * results: turns ≤ RACE_MAX_TURNS_PER_AGE on every seed and arm, and the state shown at Doom
 * DOOM_CLIMAX_START names the clock that ended the age on ≥ RACE_CLIMAX_MIN_SEEDS seeds per
 * played arm.
 */
import { describe, it, expect } from 'vitest';
import {
  raceForecastPredicate, raceForecastLine, raceEndingOf, isRaceTurn, ageEndedBy,
  RACE_CLIMAX_MIN_SEEDS, type AgencyArmResult,
} from '../agency-verdict';
import { RACE_MAX_TURNS_PER_AGE } from '../../src/data/race-content';

type Ended = 'mandate' | 'doom' | 'none';

function arm(name: AgencyArmResult['arm'], seed: number, turns: number, atClimax: string | null, ended: Ended, stopReason = 'ticks'): AgencyArmResult {
  return {
    seed, arm: name, ranTo: 900, stopReason, raceTurns: turns, raceAtClimax: atClimax,
    end: {
      tick: 900, phase: ended === 'none' ? 'playing' : 'ended', doomStage: 4,
      mandateProgress: ended === 'mandate' ? 1 : 0.5, mandateCompleted: ended === 'mandate',
      firstFate: 'living', apotheosis: false,
    },
  };
}

/** Three seeds; each played arm's climax reading names the ending unless told otherwise. */
function seeds(over: (seed: number, a: AgencyArmResult['arm']) => Partial<{ turns: number; atClimax: string | null; ended: Ended; stop: string }> = () => ({})) {
  return [42, 99, 7].map((seed) => ({
    seed,
    arms: Object.fromEntries((['none', 'greedy', 'full'] as const).map((a) => {
      const base = a === 'full' ? { turns: 1, atClimax: 'mandate_first', ended: 'mandate' as Ended } : { turns: 1, atClimax: 'doom_first', ended: 'doom' as Ended };
      const o = { ...base, stop: 'ticks', ...over(seed, a) };
      return [a, arm(a, seed, o.turns, o.atClimax, o.ended, o.stop)];
    })),
  }));
}

describe('THR-2253 — race helpers', () => {
  it('maps each shown state to the ending it names', () => {
    expect(raceEndingOf('mandate_first')).toBe('mandate');
    expect(raceEndingOf('doom_first')).toBe('doom');
    expect(raceEndingOf('stalled')).toBe('doom');
    expect(raceEndingOf('close')).toBe('close');
    expect(raceEndingOf('hidden')).toBe('none');
    expect(raceEndingOf(null)).toBe('none');
  });

  it('first sight, a data gap and doom_first ↔ stalled are not turns', () => {
    expect(isRaceTurn('hidden', 'doom_first')).toBe(false);
    expect(isRaceTurn('doom_first', 'hidden')).toBe(false);
    expect(isRaceTurn('doom_first', 'stalled')).toBe(false);
    expect(isRaceTurn('doom_first', 'mandate_first')).toBe(true);
    expect(isRaceTurn('close', 'doom_first')).toBe(true);
  });

  it('reads the clock that ended the age', () => {
    expect(ageEndedBy(arm('none', 1, 0, null, 'mandate'))).toBe('mandate');
    expect(ageEndedBy(arm('none', 1, 0, null, 'doom'))).toBe('doom');
    expect(ageEndedBy(arm('none', 1, 0, null, 'none'))).toBe('none');
  });
});

describe('THR-2253 — raceForecastPredicate', () => {
  it('holds when turns stay under the ceiling and every played arm names the ending', () => {
    const v = raceForecastPredicate(seeds());
    expect(v.turns.holds).toBe(true);
    expect(v.turns.measured).toBe(9);
    expect(v.climax.greedy.named).toBe(3);
    expect(v.climax.full.named).toBe(3);
    expect(v.climax.none).toBeUndefined(); // hands-off is a turn-count arm only
    expect(v.holds).toBe(true);
    expect(raceForecastLine(v)).toMatch(/→ HOLDS$/);
  });

  it('one seed-arm over the turn ceiling fails the turns clause, and the line names it', () => {
    const v = raceForecastPredicate(seeds((seed, a) => (seed === 99 && a === 'none' ? { turns: RACE_MAX_TURNS_PER_AGE + 1 } : {})));
    expect(v.turns.holds).toBe(false);
    expect(v.turns.over).toEqual([`99/none:${RACE_MAX_TURNS_PER_AGE + 1}`]);
    expect(v.holds).toBe(false);
    expect(raceForecastLine(v)).toMatch(/over 99\/none:4.*→ NOT MET$/);
  });

  it(`exactly ${RACE_MAX_TURNS_PER_AGE} turns still holds`, () => {
    expect(raceForecastPredicate(seeds(() => ({ turns: RACE_MAX_TURNS_PER_AGE }))).turns.holds).toBe(true);
  });

  it(`a played arm naming the ending on fewer than ${RACE_CLIMAX_MIN_SEEDS} seeds fails`, () => {
    const v = raceForecastPredicate(seeds((seed, a) => (a === 'greedy' && seed !== 42 ? { atClimax: 'mandate_first' } : {})));
    expect(v.climax.greedy.named).toBe(1);
    expect(v.climax.greedy.holds).toBe(false);
    expect(v.climax.full.holds).toBe(true);
    expect(v.holds).toBe(false);
  });

  it('close names neither clock, and an unreached climax with nothing shown at the end names nothing', () => {
    const v = raceForecastPredicate(seeds((seed, a) => (a === 'greedy' ? { atClimax: seed === 42 ? 'close' : seed === 99 ? null : 'doom_first' } : {})));
    expect(v.climax.greedy.named).toBe(1);
    expect(raceForecastLine(v)).toMatch(/42:close\/doom✗ 99:unreached@end\/doom✗ 7:doom_first\/doom✓/);
  });

  it('an age that ended before the climax is read on its last tick', () => {
    const s = seeds((_seed, a) => (a === 'full' ? { atClimax: null } : {}));
    for (const x of s) x.arms.full = { ...x.arms.full!, raceShownAtEnd: x.seed === 7 ? 'doom_first' : 'mandate_first' };
    const v = raceForecastPredicate(s);
    expect(v.climax.full.named).toBe(2);
    expect(v.climax.full.holds).toBe(true);
    expect(raceForecastLine(v)).toMatch(/42:mandate_first@end\/mandate✓.*7:doom_first@end\/mandate✗/);
  });

  it('stalled at the climax names Doom', () => {
    const v = raceForecastPredicate(seeds((_s, a) => (a === 'greedy' ? { atClimax: 'stalled' } : {})));
    expect(v.climax.greedy.named).toBe(3);
  });

  it('an age still playing is not measured for the climax clause; a budget stop or a pre-THR-2253 arm is left out', () => {
    const v = raceForecastPredicate(seeds((seed, a) => {
      if (a === 'greedy' && seed === 7) return { ended: 'none' };
      if (a === 'none' && seed === 7) return { stop: 'budget' };
      return {};
    }));
    expect(v.climax.greedy.measured).toBe(2);
    expect(v.climax.greedy.named).toBe(2);
    expect(v.turns.measured).toBe(8);
    const old = raceForecastPredicate([{ seed: 1, arms: { greedy: { ...arm('greedy', 1, 0, 'doom_first', 'doom'), raceTurns: undefined } } }]);
    expect(old.turns.measured).toBe(0);
    expect(old.holds).toBe(false);
  });

  it('no played arm measured does not hold', () => {
    const v = raceForecastPredicate([{ seed: 1, arms: { none: arm('none', 1, 0, null, 'doom') } }]);
    expect(v.turns.holds).toBe(true);
    expect(v.holds).toBe(false);
    expect(raceForecastLine(v)).toMatch(/no played arm measured ✗ → NOT MET$/);
  });
});
