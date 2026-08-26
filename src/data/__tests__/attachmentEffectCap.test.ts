/**
 * Attachment content guards, measured against the real catalogs (THR-1242).
 *
 * `MAX_EFFECTS_PER_ATTACHMENT` became *enforced* at the walker boundary in stage
 * 4. Enforcement without a content test is a silent truncation waiting to
 * happen: an author adds a ninth effect, the walker drops it, every gate stays
 * green, and the item quietly does less than its `mechanicalSummary` claims —
 * which is precisely the class of lie this whole program exists to remove.
 *
 * So the cap is pinned here against the shipped catalogs rather than a fixture.
 * A fixture would verify fiction (`reference_fixture_invents_both_sides`): the
 * claim is about what the catalogs contain, so the catalogs are the input.
 *
 * This test is also the record of *why* the constant is 8 rather than the 6 it
 * declared for two years — see the constant's own comment. If it ever needs
 * raising again, raise the constant deliberately and let this re-pin it; do not
 * delete an authored effect to fit.
 */

import { describe, it, expect } from 'vitest';

import { MAX_EFFECTS_PER_ATTACHMENT, ACTION_TRIGGER_MAX_PER_ATTACHMENT } from '../effect-constants';
import {
  REWARD_POSSESSIONS, REWARD_CONDITIONS, REWARD_BESTOWED_POWERS, TREASURE_MAPS,
} from '../reward-attachment-catalog';
import {
  ANOMALY_SIGNATURE_ARTIFACTS, ANOMALY_BESTOWED_POWERS, ANOMALY_CONDITIONS,
} from '../anomaly-reward-catalog';
import { STARTER_POSSESSIONS, STARTER_CONDITIONS } from '../starter-attachments';
import type { AttachmentEffect } from '../../types/effects';

interface CatalogEntry { id: string; properties?: Record<string, unknown> }

/** Every catalog entry that declares an `effects` list, with its id. */
function entriesWithEffects(catalog: readonly unknown[]): Array<{ id: string; effects: AttachmentEffect[] }> {
  const out: Array<{ id: string; effects: AttachmentEffect[] }> = [];
  for (const raw of catalog) {
    const entry = raw as CatalogEntry;
    const effects = entry?.properties?.effects;
    if (Array.isArray(effects)) out.push({ id: entry.id, effects: effects as AttachmentEffect[] });
  }
  return out;
}

const ALL = entriesWithEffects([
  ...REWARD_POSSESSIONS, ...REWARD_CONDITIONS, ...REWARD_BESTOWED_POWERS, ...TREASURE_MAPS,
  ...ANOMALY_SIGNATURE_ARTIFACTS, ...ANOMALY_BESTOWED_POWERS, ...ANOMALY_CONDITIONS,
  ...STARTER_POSSESSIONS, ...STARTER_CONDITIONS,
] as readonly unknown[]);

describe('shipped attachments fit inside the enforced content guards (THR-1242)', () => {
  it('the catalogs are actually loaded — the sweep is not vacuous', () => {
    // Without this, an import that silently resolved to an empty array would make
    // every assertion below pass by having nothing to check
    // (`reference_vacuous_probe_empty_population`).
    expect(ALL.length).toBeGreaterThan(100);
  });

  it('no attachment declares more than MAX_EFFECTS_PER_ATTACHMENT effects', () => {
    const over = ALL
      .filter(e => e.effects.length > MAX_EFFECTS_PER_ATTACHMENT)
      .map(e => `${e.id} (${e.effects.length})`);

    // Named rather than counted: a bare count tells the next author that
    // something is wrong, this tells them which item and by how much.
    expect(over).toEqual([]);
  });

  it('no attachment declares more than ACTION_TRIGGER_MAX_PER_ATTACHMENT action triggers', () => {
    const over = ALL
      .map(e => ({ id: e.id, n: e.effects.filter(x => x.type === 'action_trigger').length }))
      .filter(e => e.n > ACTION_TRIGGER_MAX_PER_ATTACHMENT)
      .map(e => `${e.id} (${e.n})`);

    expect(over).toEqual([]);
  });

  it('the cap is not so far above the content that it stops being a guard', () => {
    // The bound only means something while some item is near it. If the largest
    // shipped attachment is far below the cap, the cap has drifted into
    // decoration and the next raise should be argued, not assumed.
    const largest = Math.max(...ALL.map(e => e.effects.length));
    expect(largest).toBeGreaterThan(MAX_EFFECTS_PER_ATTACHMENT - 4);
    expect(largest).toBeLessThanOrEqual(MAX_EFFECTS_PER_ATTACHMENT);
  });
});
