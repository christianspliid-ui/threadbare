/**
 * Tests for the Engine Effect Registry (THR-604).
 *
 * The registry aggregates the id lists that engine bridges implement outside a
 * template's own step ops / controlSpec. Two invariants keep it honest:
 *   1. Every id in the registry must correspond to a real, catalog-visible
 *      template — otherwise the catalog's effectSource derivation would key on a
 *      phantom id and a resolver rename would silently mis-badge an action.
 *   2. The registry must actually cover the ids it claims to (spot-check the
 *      five aggregated sources are represented).
 */
import { describe, it, expect } from 'vitest';
import { ENGINE_EFFECT_TEMPLATE_IDS } from '../engineEffectRegistry';
import { UNIFIED_ACTION_TEMPLATES } from '../../data/unified-action-templates';

describe('ENGINE_EFFECT_TEMPLATE_IDS', () => {
  const templateIds = new Set(UNIFIED_ACTION_TEMPLATES.map((t) => t.id));

  it('every registry id exists in UNIFIED_ACTION_TEMPLATES', () => {
    const orphans = [...ENGINE_EFFECT_TEMPLATE_IDS].filter((id) => !templateIds.has(id));
    expect(orphans).toEqual([]);
  });

  it('is non-empty', () => {
    expect(ENGINE_EFFECT_TEMPLATE_IDS.size).toBeGreaterThan(0);
  });

  it('covers each aggregated source (spot-check one id per module)', () => {
    // hexActionBridge (tile mutation), revelationResolver (observation),
    // perceiveRelay, self-action post-processor, enchant attachment tier.
    for (const id of [
      'hex.bless_land',
      'hex.survey',
      'divine.perceive.cast_attention',
      'divine.self.stillness',
      'artifact.enchant',
    ]) {
      expect(ENGINE_EFFECT_TEMPLATE_IDS.has(id)).toBe(true);
    }
  });
});
