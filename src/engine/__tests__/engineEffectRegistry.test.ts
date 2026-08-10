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
import { TIER_ADVANCEMENT_TEMPLATE_IDS } from '../../data/attachment-tier-content';
import { effectSourceFor } from '../../data/actionEffectSource';

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
    // perceiveRelay, self-action post-processor.
    for (const id of [
      'hex.bless_land',
      'hex.survey',
      'divine.perceive.cast_attention',
      'divine.self.stillness',
    ]) {
      expect(ENGINE_EFFECT_TEMPLATE_IDS.has(id)).toBe(true);
    }
  });

  it('excludes the tier-advancement verbs — they are template-ops, not a bridge', () => {
    // THR-996: `artifact.enchant` sat here claiming an engine bridge that was never
    // written. Advancement now runs as a step GraphOp, so both verbs must classify
    // `template-ops`. Pinned so a future re-add cannot silently re-mis-badge them.
    for (const id of TIER_ADVANCEMENT_TEMPLATE_IDS) {
      expect(ENGINE_EFFECT_TEMPLATE_IDS.has(id)).toBe(false);

      const template = UNIFIED_ACTION_TEMPLATES.find((t) => t.id === id);
      expect(template, `${id} must exist as a template`).toBeDefined();
      expect(effectSourceFor(template!), `effect source for ${id}`).toBe('template-ops');
    }
  });
});
