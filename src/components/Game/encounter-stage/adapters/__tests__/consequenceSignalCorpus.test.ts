/**
 * THR-1205 — the corpus half of the one-signal-channel rule.
 *
 * The adapter test beside this one proves the *contradiction* is
 * unrepresentable: no combination of kind, polarity and direction can produce a
 * red chip under a green-meaning arrow. This one asks the second question, the
 * one an adapter rule cannot answer — **does the shipped content actually reach
 * the surface saying one thing?**
 *
 * It is a predicate, not a snapshot count (THR-688 rule A): it walks every
 * authored aftermath change reachable from the template registries and builds
 * the real chip from it, so a template added next month is covered the day it
 * lands rather than the day someone remembers to update a number here.
 *
 * The defect it exists for: `slice.kin.a_cooler_welcome` shipped
 * `polarity: 'mixed'` + `direction: 'gain'` and rendered red-with-an-up-arrow
 * in the director's review screenshot. Two of 513 authored changes carried that
 * shape; both were re-authored as gains, and the sweep is now automated so the
 * third one cannot arrive unseen.
 */

import { describe, expect, it } from 'vitest';
import { buildAftermathConsequences } from '../buildAftermathConsequences';
import type { EncounterAftermathChange } from '../../../../../types/unifiedAction';
import {
  UNIFIED_ACTION_TEMPLATES,
  LOCATION_BRANCHING_ENCOUNTER_TEMPLATES,
} from '../../../../../data/unified-action-templates';

/** Identity enrich + single-segment link — the same isolation the adapter tests use. */
const passthrough = {
  enrich: (text: string) => text,
  link: (id: string, text: string) => ({ id, segments: [{ text }] }),
};

/**
 * An authored change, found structurally rather than by walking a declared
 * path.
 *
 * Aftermath lives at several depths — a template's base `changes`, each
 * `byOutcome` band's `changes`, and nested variant blocks — and that shape has
 * moved more than once. Recognising a change by its own required fields means
 * this sweep cannot quietly stop finding them because a container was renamed,
 * which is the failure mode that makes a corpus guard vacuous.
 */
function isAftermathChange(value: unknown): value is EncounterAftermathChange {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.id === 'string'
    && typeof v.kind === 'string'
    && typeof v.detail === 'string'
    && typeof v.polarity === 'string';
}

function collectChanges(root: unknown, out: EncounterAftermathChange[] = [], seen = new Set<unknown>()): EncounterAftermathChange[] {
  if (typeof root !== 'object' || root === null) return out;
  if (seen.has(root)) return out;
  seen.add(root);
  if (Array.isArray(root)) {
    for (const entry of root) collectChanges(entry, out, seen);
    return out;
  }
  if (isAftermathChange(root)) out.push(root);
  for (const value of Object.values(root as Record<string, unknown>)) {
    collectChanges(value, out, seen);
  }
  return out;
}

const CHANGES = collectChanges([
  UNIFIED_ACTION_TEMPLATES,
  LOCATION_BRANCHING_ENCOUNTER_TEMPLATES,
]);

describe('authored consequence chips speak with one signal (THR-1205)', () => {
  it('finds authored aftermath changes to judge — the guard is not vacuous', () => {
    // Falsification first: a sweep over an empty population passes every
    // assertion below it and proves nothing at all.
    expect(CHANGES.length).toBeGreaterThan(100);
  });

  /**
   * Note what this does **not** assert, and why.
   *
   * The obvious corpus test — "no built chip has a loss tone beside a gain
   * arrow" — is **vacuous now that the adapter derives tone from direction**: it
   * is true of every possible input, so it would pass forever without ever
   * reading the content it claims to guard. A lever that cannot fail is worse
   * than no lever, because it reports coverage it does not have.
   *
   * What can still drift is the *authoring*. The adapter resolves a
   * polarity/direction disagreement silently in direction's favour, so an author
   * who writes `polarity: 'loss'` beside `direction: 'gain'` now gets a green
   * chip — coherent on screen, and the opposite of what they meant. That is a
   * real failure this predicate catches and the display-level one cannot.
   *
   * `mixed` is rejected outright whenever a direction is declared, because a
   * consequence that both costs and grants is **two chips** — the cost as its
   * own scar when a write backs it, or left in the band's prose when nothing
   * does (Law 56). One chip with a foot on each side is the shape that produced
   * the defect.
   */
  it('declares no polarity that disagrees with its own direction', () => {
    const offenders: string[] = [];
    for (const change of CHANGES) {
      const { polarity, direction } = change;
      if (!direction || direction === 'opens') continue;
      const disagrees =
        polarity === 'mixed'
        || (polarity === 'gain' && direction === 'loss')
        || (polarity === 'loss' && direction === 'gain');
      if (disagrees) {
        offenders.push(`${change.id} — polarity=${polarity} direction=${direction}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('renders every authored change as a chip whose colour matches its arrow', () => {
    // Not a substitute for the predicate above — this one walks the corpus
    // through the real adapter, so an authored shape that fails to produce a
    // chip at all (or produces one with no delta where a direction was declared)
    // shows up here rather than passing a source-level check.
    const withDirection = CHANGES.filter(c => c.direction === 'gain' || c.direction === 'loss');
    expect(withDirection.length).toBeGreaterThan(10);
    const offenders: string[] = [];
    for (const change of withDirection) {
      const [chip] = buildAftermathConsequences({ changes: [change], ...passthrough });
      if (!chip) { offenders.push(`${change.id} — produced no chip`); continue; }
      if (chip.delta?.direction !== change.direction) {
        offenders.push(`${change.id} — declared ${change.direction}, drew ${chip.delta?.direction ?? 'nothing'}`);
        continue;
      }
      const expected = change.direction === 'gain' ? 'gain' : 'loss';
      if (chip.tone !== expected && chip.tone !== 'seed') {
        offenders.push(`${change.id} — arrow=${change.direction} but tone=${chip.tone}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('keeps the Grateful Kin welcome a green rise on every band, scaled by how wide the door opened', () => {
    const bands = [
      { id: 'slice.kin.a_standing_welcome_well', count: 3 },
      { id: 'slice.kin.a_standing_welcome', count: 2 },
      { id: 'slice.kin.a_standing_welcome_dearly', count: 2 },
      { id: 'slice.kin.a_cooler_welcome', count: 1 },
    ];
    for (const band of bands) {
      const change = CHANGES.find(c => c.id === band.id);
      expect(change, `${band.id} must still be authored`).toBeDefined();
      const [chip] = buildAftermathConsequences({
        changes: [change!],
        enrich: (text) => text.replace('{target}', 'Sacred Grove'),
        link: passthrough.link,
      });
      expect(chip.tone, `${band.id} tone`).toBe('gain');
      expect(chip.delta?.direction, `${band.id} arrow`).toBe('gain');
      expect(chip.delta?.count, `${band.id} magnitude`).toBe(band.count);
      // The director's second ask: the chip states the place, not only the
      // mechanic, without anyone having to read the flavour sentence.
      expect(chip.nounLabel, `${band.id} noun`).toBe('A STANDING WELCOME AT SACRED GROVE');
    }
  });
});
