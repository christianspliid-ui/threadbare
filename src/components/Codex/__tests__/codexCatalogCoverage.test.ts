/**
 * Codex catalog coverage (THR-999).
 *
 * `getAllCodexEntries()` assembles action entries by filtering `UNIFIED_ACTION_TEMPLATES`
 * on an explicit list of id prefixes. That list is hand-maintained, so a new prefix ships
 * castable-but-invisible: the template resolves, the drawer can hold it, the art renders on
 * the card — and the Codex, the player's browsable catalog of what a god can do, never
 * mentions it. `company.*` (4 verbs, THR-74 / THR-732) and `thread.*` (2 verbs) each did
 * exactly that, undetected until someone went looking for a surface to check card art on.
 *
 * These tests pin the *invariant* rather than those six ids: every player-castable template
 * must reach the catalog, so the next new prefix fails here instead of shipping invisible.
 *
 * The universe predicate is imported, never re-derived — `isPlayerReachableTemplate` is the
 * same one the THR-659 orphan inspector uses. A hand-copied second definition of
 * "player-castable" is the exact drift this test exists to catch.
 */

import { describe, it, expect } from 'vitest';
import { UNIFIED_ACTION_TEMPLATES } from '../../../data/unified-action-templates';
import { isPlayerReachableTemplate } from '../../../engine/content-eval/unreachableActions';
import { ACTION_ART } from '../../Game/actionArt';
import { getAllCodexEntries, getCodexCategories } from '../codexRegistry';

/** `company.bless` -> `company.`; a bare id like `observe_agent` -> `(bare)`. */
function prefixOf(id: string): string {
  const dot = id.indexOf('.');
  return dot === -1 ? '(bare)' : id.slice(0, dot + 1);
}

describe('THR-999 — every player-castable template reaches the Codex', () => {
  const castable = UNIFIED_ACTION_TEMPLATES.filter(isPlayerReachableTemplate);

  it('has a non-trivial castable universe and catalog to compare', () => {
    // Guard the guard: both assertions below are vacuously true against an empty
    // population, and an import that silently resolves to [] would pass them.
    expect(castable.length).toBeGreaterThan(100);
    expect(getAllCodexEntries().length).toBeGreaterThan(200);
  });

  it('catalogs every castable template, so a new prefix cannot ship invisible', () => {
    const catalogued = new Set(getAllCodexEntries().map(e => e.id));
    const missing = castable.filter(t => !catalogued.has(t.id));

    // Group the diagnostic by prefix: an uncatalogued prefix is one missing bucketing
    // arm in getAllCodexEntries(), and naming it beats listing its members one by one.
    const byPrefix = new Map<string, string[]>();
    for (const t of missing) {
      const p = prefixOf(t.id);
      byPrefix.set(p, [...(byPrefix.get(p) ?? []), t.id]);
    }
    const diagnostic = [...byPrefix.entries()]
      .map(([p, ids]) => `${p} (${ids.length}): ${ids.join(', ')}`)
      .join('\n');

    expect(
      missing.map(t => t.id),
      missing.length
        ? `Player-castable templates absent from the Codex. Add a bucketing arm in ` +
          `getAllCodexEntries() (and a CodexCategory if it needs a new home):\n${diagnostic}`
        : '',
    ).toEqual([]);
  });

  it('routes every catalogued action entry to a declared category', () => {
    // A bucketing arm that names a category with no catDefs row produces entries no tab
    // can ever show — invisible for a different reason, and just as silent.
    const declared = new Set(getCodexCategories().map(c => c.id));
    const catalogued = new Set(getAllCodexEntries().map(e => e.id));
    const orphanedCategories = getAllCodexEntries()
      .filter(e => catalogued.has(e.id) && !declared.has(e.category))
      .map(e => `${e.id} -> '${e.category}'`);

    expect(orphanedCategories).toEqual([]);
  });
});

describe('THR-999 — the two prefixes that were missing', () => {
  const COMPANY_IDS = ['company.bless', 'company.draw_together', 'company.reunite', 'company.sunder'];
  const THREAD_IDS = ['thread.dormant', 'thread.reactivate'];

  it('files the four company verbs under Company Actions, each with its art', () => {
    const entries = getAllCodexEntries();

    for (const id of COMPANY_IDS) {
      const entry = entries.find(e => e.id === id);
      expect(entry, `codex entry for ${id}`).toBeDefined();
      expect(entry!.category).toBe('company');
      // Done-when names the thumbnail explicitly; the art landed under THR-769.
      expect(entry!.imageAssetPath, `art for ${id}`).toBe(ACTION_ART[id]);
      expect(entry!.imageAssetPath).toMatch(/^\/assets\/actions\/.+\.jpg$/);
    }
  });

  it('files the two thread-management verbs under Thread & Insight', () => {
    const entries = getAllCodexEntries();

    for (const id of THREAD_IDS) {
      const entry = entries.find(e => e.id === id);
      expect(entry, `codex entry for ${id}`).toBeDefined();
      expect(entry!.category).toBe('threads');
    }
  });

  it('gives Company Actions a category tab carrying all four', () => {
    const company = getCodexCategories().find(c => c.id === 'company');
    expect(company, 'Company Actions category').toBeDefined();
    expect(company!.label).toBe('Company Actions');

    const total = company!.subcategories.reduce((sum, s) => sum + s.count, 0);
    expect(total).toBe(COMPANY_IDS.length);
  });
});
