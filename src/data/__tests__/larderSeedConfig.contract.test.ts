/**
 * THR-2040 — every larder seed row names exactly one live template, asks no hold, and
 * carries a positive weight (plan § Done when, second bullet).
 */
import { describe, it, expect } from 'vitest';
import { FAMINE_SEED_ROWS, PLENTY_SEED_ROWS } from '../larder-seed-config';
import {
  getUnifiedTemplateById,
  UNIFIED_ACTION_TEMPLATES,
  CACHE_REGISTERED_REGIONAL_TEMPLATES,
  LOCATION_BRANCHING_ENCOUNTER_TEMPLATES,
} from '../unified-action-templates';
import { GRANARY_RIOT_TEMPLATE_ID } from '../unrest-pressure-constants';

const ALL_IDS = [...UNIFIED_ACTION_TEMPLATES, ...CACHE_REGISTERED_REGIONAL_TEMPLATES, ...LOCATION_BRANCHING_ENCOUNTER_TEMPLATES].map(t => t.id);
const ROWS = [...FAMINE_SEED_ROWS, ...PLENTY_SEED_ROWS];

describe('larder seed rows', () => {
  it.each(ROWS.map(r => [r.templateId, r.weight] as const))('%s resolves to one live template with no hold', (id, weight) => {
    const t = getUnifiedTemplateById(id);
    expect(t, `${id} resolves to no template`).toBeDefined();
    expect(new Set(ALL_IDS.filter(x => x === id)).size).toBe(1);
    expect(t!.requiresHold).toBeUndefined();
    expect(weight).toBeGreaterThan(0);
  });

  it('no row is listed twice, and the granary riot keeps its own seed', () => {
    const ids = ROWS.map(r => r.templateId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).not.toContain(GRANARY_RIOT_TEMPLATE_ID);
  });
});
