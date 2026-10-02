/**
 * Tests for the action-catalog generator's technicalEffect / effectSource work (THR-604).
 */
import { describe, it, expect } from 'vitest';
import {
  buildCatalogData,
  effectSourceFor,
  SCHEMA_VERSION,
} from '../generate-action-catalog';
import { getUnifiedTemplateById } from '../../src/data/unified-action-templates';

describe('action-catalog generator — effect metadata (THR-604)', () => {
  const data = buildCatalogData();

  it('emits schema version 3', () => {
    expect(SCHEMA_VERSION).toBe(3);
    expect(data.schemaVersion).toBe(3);
  });

  it('reports how many aftermath reactions each card offers the Divine Receipt (THR-741)', () => {
    for (const e of data.entries) {
      const template = getUnifiedTemplateById(e.id)!;
      expect(e.aftermathReactionCount).toBe(template.aftermathConfig?.fallback?.reactions?.length ?? 0);
    }
    // The tranche authored in THR-741 is visible in the catalog payload.
    expect(data.entries.find(e => e.id === 'hex.scorch_earth')!.aftermathReactionCount).toBe(3);
    expect(data.entries.find(e => e.id === 'hex.rend_earth')!.aftermathReactionCount).toBe(2);
  });

  it('every catalog entry carries a derived effectSource', () => {
    const valid = new Set(['template-ops', 'control-spec', 'engine-bridge', 'aftermath-only', 'none']);
    for (const e of data.entries) {
      expect(valid.has(e.effectSource)).toBe(true);
    }
  });

  it('every catalog entry has an authored technicalEffect (full backfill)', () => {
    const unauthored = data.entries.filter((e) => e.technicalEffect == null).map((e) => e.id);
    expect(unauthored).toEqual([]);
    expect(data.totals.unauthoredEffects).toBe(0);
  });

  it('byEffectSource tally sums to the entry total', () => {
    const sum = Object.values(data.totals.byEffectSource).reduce((a, b) => a + b, 0);
    expect(sum).toBe(data.totals.total);
  });

  it('derives template-ops when a step carries GraphOps', () => {
    const t = getUnifiedTemplateById('action.iron.raise-force');
    expect(t).toBeDefined();
    expect(effectSourceFor(t!)).toBe('template-ops');
  });

  it('derives control-spec for a sustained hex claim', () => {
    const t = getUnifiedTemplateById('hex.claim_dominion');
    expect(t).toBeDefined();
    expect(effectSourceFor(t!)).toBe('control-spec');
  });

  it('derives engine-bridge for a hex-bridge one-shot with empty step ops', () => {
    const t = getUnifiedTemplateById('hex.bless_land');
    expect(t).toBeDefined();
    expect(effectSourceFor(t!)).toBe('engine-bridge');
  });

  it('derives aftermath-only for a revelationAction template', () => {
    const t = getUnifiedTemplateById('observe_agent');
    expect(t).toBeDefined();
    expect(effectSourceFor(t!)).toBe('aftermath-only');
  });

  it('has no genuine no-ops left — the last two sanctify verbs derive control-spec (THR-662)', () => {
    // sub.sanctify / sub.sanctify_tavern were the last two `none` entries (the
    // THR-605 plan missed them). THR-662 wired both as sustained control effects.
    for (const id of ['sub.sanctify', 'sub.sanctify_tavern']) {
      const t = getUnifiedTemplateById(id);
      expect(t).toBeDefined();
      expect(effectSourceFor(t!)).toBe('control-spec');
      const entry = data.entries.find((e) => e.id === id);
      expect(entry?.technicalEffect).not.toContain('NOT YET WIRED');
    }
    expect(data.entries.filter((e) => e.effectSource === 'none').map((e) => e.id)).toEqual([]);
  });
});
