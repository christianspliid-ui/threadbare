/**
 * THR-2168 — the vague Read the Threads line said "4 encounters, 0 succeeded"
 * while two of the four were still unfolding: the total counted every entry but
 * only settled ones could succeed. The total now equals the counts it names.
 */
import { describe, it, expect } from 'vitest';
import { vagueGroupSummary } from '../ReadTheThreadsPanel';

type E = Parameters<typeof vagueGroupSummary>[0][number];
const won: E = { success: true };
const lost: E = { success: false };
const unfolding: E = { success: false, unresolved: true };
const unseen: E = { success: false, ended: true };

/** Sum of every "<n> <word>" count after the colon. */
function namedSum(line: string): number {
  return [...line.split(':')[1].matchAll(/(\d+) /g)].reduce((s, m) => s + Number(m[1]), 0);
}

describe('THR-2168 — vagueGroupSummary', () => {
  it('names chapters still unfolding instead of counting them as lost', () => {
    const line = vagueGroupSummary([lost, lost, unfolding, unfolding]);
    expect(line).toBe('4 encounters: 2 failed, 2 still unfolding.');
    expect(line).not.toContain('0 succeeded');
  });

  it('names chapters that ended out of sight', () => {
    expect(vagueGroupSummary([won, unseen])).toBe('2 encounters: 1 succeeded, 1 ended out of sight.');
  });

  it('a single settled win reads in the singular', () => {
    expect(vagueGroupSummary([won])).toBe('1 encounter: 1 succeeded.');
  });

  it('the total always equals the sum of the counts it names', () => {
    const kinds = [won, lost, unfolding, unseen];
    // Every group of up to four entries over the four kinds.
    for (let n = 1; n <= 4; n++) {
      const walk = (prefix: E[]): void => {
        if (prefix.length === n) {
          const line = vagueGroupSummary(prefix);
          expect(Number(line.split(' ')[0])).toBe(n);
          expect(namedSum(line)).toBe(n);
          return;
        }
        for (const k of kinds) walk([...prefix, k]);
      };
      walk([]);
    }
  });
});
