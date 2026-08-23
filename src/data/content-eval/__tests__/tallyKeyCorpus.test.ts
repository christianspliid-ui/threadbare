/**
 * Corpus-wide gate on `reputation_tally` keys — THR-1206.
 *
 * The rule this pins: an authored tally key that is not `<reach>.positive|negative`
 * is refused by the aftermath handler and the write is discarded, so the encounter
 * promises the player a consequence that never occurs. 171 of 518 authored writes
 * (33%) were doing exactly that when the gate went up.
 *
 * This test — not `check:encounter` — is what holds the line. `check:encounter --all`
 * sweeps `encounter.*` ids only: 15 of the 687 templates carrying an invalid key, and
 * 8 of the 78 distinct keys. Running the rule only there would inspect a tenth of the
 * class and report green over the rest.
 */

import { describe, expect, it } from 'vitest';
import { UNIFIED_ACTION_TEMPLATES } from '../../unified-action-templates';
import {
  TALLY_KEY_RATCHET,
  collectTallyKeys,
  invalidTallyKeyProblems,
  isValidTallyKey,
} from '../tallyKeys';

describe('reputation_tally keys, corpus-wide (THR-1206)', () => {
  it('no template authors an off-axis tally key outside the ratchet', () => {
    const problems = UNIFIED_ACTION_TEMPLATES
      .flatMap(t => invalidTallyKeyProblems(t, t.id));
    expect(problems, problems.join('\n')).toEqual([]);
  });

  it('the ratchet only shrinks — every entry is still authored somewhere', () => {
    // A stale entry is the ratchet's own failure mode: it reads as backlog while the
    // key is already gone, so the sweep looks unfinished and the next author is told
    // a leak exists that does not. Listed but absent is a failure, exactly as
    // `RETROFIT_PENDING` treats it.
    const authored = new Set(
      UNIFIED_ACTION_TEMPLATES.flatMap(t => collectTallyKeys(t)).map(e => e.key),
    );
    const stale = TALLY_KEY_RATCHET.filter(k => !authored.has(k));
    expect(stale, `ratchet entries no longer authored — delete them: ${stale.join(', ')}`)
      .toEqual([]);
  });

  it('the walk finds tallies in every authored shape, not only the ones it knows', () => {
    // Falsifies the gate rather than trusting it. `aftermathConfig.byOutcome[band]
    // .reactions[].effects[]` is the shape a path-list walk missed on the first
    // survey, returning `0 invalid` against a corpus holding 171 — so this asserts
    // the walk reaches it, and that the corpus is not silently empty.
    const all = UNIFIED_ACTION_TEMPLATES.flatMap(t => collectTallyKeys(t));
    expect(all.length).toBeGreaterThan(400);

    const nested = {
      aftermathConfig: {
        byOutcome: {
          success: { reactions: [{ effects: [{ kind: 'reputation_tally', key: 'iron.positive' }] }] },
        },
      },
    };
    expect(collectTallyKeys(nested)).toEqual([{ key: 'iron.positive' }]);
  });

  it('rejects a new off-axis key, and accepts every reach-polarity key', () => {
    // Both polarities of the gate. A rule that never rejects is not a rule.
    const bad = { reactions: [{ effects: [{ kind: 'reputation_tally', key: 'guild.newly_invented' }] }] };
    const problems = invalidTallyKeyProblems(bad, 'test.template');
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('guild.newly_invented');

    const good = { reactions: [{ effects: [{ kind: 'reputation_tally', key: 'shadow.negative' }] }] };
    expect(invalidTallyKeyProblems(good, 'test.template')).toEqual([]);

    // `flesh` is a retired encounter reach, not one of the eight — it must not pass
    // the validity check merely because it is shaped like a reach key.
    expect(isValidTallyKey('flesh.positive')).toBe(false);
    expect(isValidTallyKey('heart.positive')).toBe(true);
    expect(isValidTallyKey('hearth.positive')).toBe(false);
  });
});
