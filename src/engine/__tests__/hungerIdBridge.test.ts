/**
 * THR-891 — the bridge between the *stored* hunger id and the `HungerId` the
 * card library keys on.
 *
 * The remembrance catalog stores `hunger.witness`; every `HungerId` consumer
 * keys on `witness`. The encounter-stage adapter used to cross that gap with
 * `identity.hungerId as HungerId`, which type-checks and is false, so the
 * hunger-unique lookup missed for every god and no hunger unique was ever
 * dealt. These tests fail if that cast comes back.
 */
import { describe, it, expect } from 'vitest';
import { buildRepertoire } from '../nudgeCardRepertoire';
import { HUNGER_UNIQUE_CARDS } from '../../data/nudge-card-library';
import { HUNGER_CATALOG } from '../../data/hunger-catalog';
import { MEETING_BOND_TEST } from '../../data/meeting-bond-test';
import { toHungerId, toStoredHungerId } from '../../types/hunger';
import type { HungerId } from '../../types/hunger';

describe('toHungerId', () => {
  it('narrows the stored dotted id the remembrance flow actually writes', () => {
    expect(toHungerId('hunger.witness')).toBe('witness');
    expect(toHungerId('hunger.haunt')).toBe('haunt');
    expect(toHungerId('hunger.illuminate')).toBe('illuminate');
  });

  it('accepts an already-bare id unchanged', () => {
    expect(toHungerId('witness')).toBe('witness');
  });

  it('fail-softs to undefined rather than throwing (NFP #4)', () => {
    expect(toHungerId(undefined)).toBeUndefined();
    expect(toHungerId('')).toBeUndefined();
    expect(toHungerId('hunger.not_a_hunger')).toBeUndefined();
    // The pre-fix cast produced exactly this shape — a dotted string standing
    // where a bare id belongs. It must not narrow to itself.
    expect(toHungerId('hunger.hunger.witness')).toBeUndefined();
  });

  it('round-trips every id the one catalog can produce', () => {
    // THR-1213 merged the two catalogs, so the cross-catalog parity this test
    // used to assert at runtime is now a compile-time fact — there is one
    // catalog and one `HungerId` union, and a spelling neither knows will not
    // build. What survives is the round trip, which types cannot prove:
    // the stored spelling the flow writes must narrow back to the id it came
    // from, for every entry.
    for (const entry of HUNGER_CATALOG) {
      const stored = toStoredHungerId(entry.id);
      expect(toHungerId(stored), `stored id '${stored}' does not narrow back`).toBe(entry.id);
    }
  });

  it('derives exactly the twelve stored spellings the catalog used to author', () => {
    // THR-1213 moved the dotted form from *authored* to *derived*: the catalog
    // now stores `gather` and `RemembranceFlow` writes `toStoredHungerId(...)`
    // into `AscendantIdentity.hungerId`. This pins the persisted vocabulary to
    // the literal strings the pre-merge catalog wrote, so the merge cannot
    // quietly change what lands in a save file. Not derivable from the union —
    // a renamed member would still round-trip through the check above.
    expect(HUNGER_CATALOG.map((h) => toStoredHungerId(h.id)).slice().sort()).toEqual(
      [
        'hunger.bind',
        'hunger.consume',
        'hunger.gather',
        'hunger.haunt',
        'hunger.illuminate',
        'hunger.kindle',
        'hunger.preserve',
        'hunger.reclaim',
        'hunger.reshape',
        'hunger.sever',
        'hunger.wander',
        'hunger.witness',
      ],
    );
  });
});

describe('bond-test god voice reaches its authored line', () => {
  it('resolves an authored line for every hunger the remembrance flow can store', () => {
    // `BOND_PROSE` is keyed dotted and `godVoiceByHunger` bare, in the same
    // feature. `BondBeat` indexed the bare table with the dotted id, so every
    // god silently got `godVoiceFallback` and no authored voice ever shipped.
    for (const entry of HUNGER_CATALOG) {
      const key = toHungerId(entry.id);
      expect(key, `remembrance id '${entry.id}' does not narrow`).toBeDefined();
      expect(
        MEETING_BOND_TEST.godVoiceByHunger[key!],
        `no god-voice line for '${entry.id}'`,
      ).toBeTypeOf('string');
    }
  });

  it('would have fallen back for every god before the fix', () => {
    for (const entry of HUNGER_CATALOG) {
      // `godVoiceByHunger` is keyed bare; the *stored* spelling is what
      // BondBeat used to index it with, and it still resolves to nothing.
      expect(MEETING_BOND_TEST.godVoiceByHunger[toStoredHungerId(entry.id)]).toBeUndefined();
    }
  });
});

describe('hunger uniques are actually dealt', () => {
  it('deals each god exactly their own unique, for all twelve hungers', () => {
    for (const hunger of HUNGER_CATALOG) {
      const repertoire = buildRepertoire({
        hunger: hunger.id,
        unlockedActionIds: new Set(),
      });
      const dealt = repertoire.filter((e) => e.source === 'hunger').map((e) => e.member.id);
      expect(dealt, `hunger '${hunger.id}' was dealt the wrong uniques`).toEqual([
        HUNGER_UNIQUE_CARDS[hunger.id],
      ]);
    }
  });

  it('deals none when the stored id is passed through unconverted (the old bug)', () => {
    // Guard the guard: this is the pre-fix behaviour, kept as a live
    // demonstration that the conversion is load-bearing rather than cosmetic.
    const unconverted = 'hunger.witness' as unknown as HungerId;
    const repertoire = buildRepertoire({ hunger: unconverted, unlockedActionIds: new Set() });
    expect(repertoire.filter((e) => e.source === 'hunger')).toEqual([]);

    // ...and the converted form does deal one, on the same inputs.
    const converted = buildRepertoire({
      hunger: toHungerId('hunger.witness'),
      unlockedActionIds: new Set(),
    });
    expect(converted.filter((e) => e.source === 'hunger').map((e) => e.member.id)).toEqual([
      'card.whisper.hunger.witness',
    ]);
  });
});
