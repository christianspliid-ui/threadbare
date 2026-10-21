/**
 * THR-1979 item 4 — an authored card that tells the god to stay their hand must not
 * carry the `supportive` stance, whose meta word is "lend strength". Cold playtest
 * round 4 read "Give them nothing" over "lend strength" as one fact told two ways.
 */
import { describe, expect, it } from 'vitest';
import { UNIFIED_ACTION_TEMPLATES } from '../unified-action-templates';

const RESTRAINT_OPENER = /^(stay your hand|give them nothing|do nothing)\b/i;

describe('authored restraint cards carry a restraint stance', () => {
  it('no card whose label or intent opens with a restraint phrase is supportive', () => {
    const offenders: string[] = [];
    let seen = 0;
    for (const t of UNIFIED_ACTION_TEMPLATES) {
      for (const cards of Object.values(t.authoredChoices ?? {})) {
        for (const c of cards) {
          if (!RESTRAINT_OPENER.test(c.label) && !RESTRAINT_OPENER.test(c.intent ?? '')) continue;
          seen++;
          if (c.interventionType === 'supportive') offenders.push(`${t.id} · ${c.id}`);
        }
      }
    }
    expect(seen).toBeGreaterThan(0);
    expect(offenders).toEqual([]);
  });
});
