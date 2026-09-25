/**
 * Every drawable template carries the template-level fields the draw reads (THR-1612).
 *
 * `filterByAwareness` — the first stage of the encounter funnel — skips any entry
 * with no `reachPrimary`, and both builders (`encounterCache.buildEntryUnified`,
 * `factionQuestGeneration`) copy that from `template.reach`. The cache builder
 * also spreads `template.motivations` and maps `template.crudType` to the
 * encounter type. A template that keeps its reach only on its steps is therefore
 * dropped before any mortal can draw it — all 15 Mercenary Company templates sat
 * that way, gated at awareness 100% on seeds 42 and 99, even for the Company's
 * own members standing on the same hex.
 *
 * Asserted against the authored catalog, never a fixture.
 */

import { describe, it, expect } from 'vitest';
import { UNIFIED_ACTION_TEMPLATES } from '../unified-action-templates';
import { ALL_MC_TEMPLATES } from '../mercenary-encounter-content';
import { REACH_DOMAINS } from '../../types/traits';

const CRUD_TYPES = ['create', 'read', 'update', 'delete'];

describe('template-level draw fields (THR-1612)', () => {
  // Presence only: a handful of templates still carry a legacy reach name
  // (`life`, `resolve`, `combat`) that passes awareness but is not one of the
  // Eight Reaches — a separate defect, deliberately not asserted here.
  it('every template in the catalog has a template-level reach', () => {
    const missing = UNIFIED_ACTION_TEMPLATES
      .filter(t => typeof t.reach !== 'string' || t.reach.length === 0)
      .map(t => t.id);
    expect(missing, missing.join(', ')).toEqual([]);
  });

  it('the Mercenary Company templates are in the catalog and carry every field the draw reads', () => {
    expect(ALL_MC_TEMPLATES).toHaveLength(15);
    const catalogIds = new Set(UNIFIED_ACTION_TEMPLATES.map(t => t.id));
    for (const t of ALL_MC_TEMPLATES) {
      expect(catalogIds.has(t.id), t.id).toBe(true);
      expect(t.reach, t.id).toBe('iron');
      expect(REACH_DOMAINS, t.id).toContain(t.reach);
      expect(CRUD_TYPES, t.id).toContain(t.crudType);
      expect(t.scale, t.id).toBe('local');
      expect(Array.isArray(t.motivations) && t.motivations.length > 0, t.id).toBe(true);
    }
  });
});
