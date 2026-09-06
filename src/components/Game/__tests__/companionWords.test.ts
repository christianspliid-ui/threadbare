/**
 * The shared companion line (THR-1421).
 *
 * `AscendantSheet` and `AttachmentsTab` both render a companion's always-on
 * bonus through this one function, which is what makes their parity structural
 * rather than a copy that holds only while nobody edits it. These pin the
 * wording ladder and the two laws the function exists to satisfy — Law 13 (no
 * raw magnitude) and Law 14 (no raw internal key) — at the layer that owns
 * them, so a regression falsifies here rather than only through a rendered DOM.
 */

import { describe, it, expect } from 'vitest';
import { companionReachLine } from '../companionWords';

describe('companionReachLine', () => {
  it('names a single Reach by its display name, not its key (Law 14)', () => {
    expect(companionReachLine({ iron: 3 })).toBe('Steadies your Iron.');
  });

  it('joins two Reaches with "and"', () => {
    expect(companionReachLine({ stone: 2, eye: 1 })).toBe('Steadies your Stone and Eye.');
  });

  it('comma-separates three or more, keeping "and" before the last', () => {
    expect(companionReachLine({ veil: 3, eye: 2, heart: 1 }))
      .toBe('Steadies your Veil, Eye and Heart.');
  });

  it('orders Reaches by contribution, strongest first', () => {
    // The ordering is the only place the magnitude survives into the sentence,
    // and it survives as rank rather than as a number — which is the whole
    // trick this function turns.
    expect(companionReachLine({ eye: 1, veil: 3 })).toBe('Steadies your Veil and Eye.');
  });

  it('says so honestly when a companion carries no bonus', () => {
    expect(companionReachLine({})).toBe('No help in any Reach — just company.');
  });

  it('emits no numeral for any contribution it can be handed (Law 13)', () => {
    // Swept across the whole sanctioned range rather than one sample: template
    // contributions are `COMPANION_CONTRIBUTION_RANGE` 1..3, and a numeral
    // leaking for one magnitude but not another is exactly the shape a single
    // fixture would miss.
    for (const v of [1, 2, 3]) {
      for (const reach of ['iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star']) {
        expect(companionReachLine({ [reach]: v })).not.toMatch(/[+-]?\d/);
      }
    }
  });

  it('drops a malformed non-positive entry rather than rendering it', () => {
    // Not a policy on penalties — companions cannot carry one by construction.
    // A companion that ever *costs* a Reach needs its own wording, which Law 15
    // makes a ruling. This is the guard that keeps a malformed entry from
    // reaching the player as a bare key or a minus sign in the meantime.
    expect(companionReachLine({ iron: 3, gold: 0, shadow: -2 })).toBe('Steadies your Iron.');
  });
});
