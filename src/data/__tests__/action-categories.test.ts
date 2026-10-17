/**
 * THR-1886 — one prefix → category table for player actions (UI Law 58).
 *
 * The designer action catalog and the in-game Codex both file actions through
 * `src/data/action-categories.ts`. These tests pin three things:
 *   1. every player-castable template has a category;
 *   2. an unknown prefix fails with a message that names the prefix and the file to edit;
 *   3. moving the three hand-kept lists into one table changed no action's category on either
 *      surface (the fixture is the pre-THR-1886 id → category map, captured before the move).
 */

import { describe, it, expect } from 'vitest';
import { UNIFIED_ACTION_TEMPLATES } from '../unified-action-templates';
import { isPlayerReachableTemplate } from '../../engine/content-eval/unreachableActions';
import { getAllCodexEntries, getCodexCategories } from '../../components/Codex/codexRegistry';
import { isIconName } from '../../components/shared/iconShape';
import { buildCatalogData } from '../../../scripts/generate-action-catalog';
import {
  ACTION_CATEGORIES,
  ACTION_CATEGORY_IDS,
  ACTION_CATEGORY_RULES,
  actionCategoryFor,
  catalogCategoryFor,
  uncategorisedActionMessages,
} from '../action-categories';
import snapshot from './fixtures/action-categories.snapshot.json';

describe('THR-1886 — every player-castable template has a category', () => {
  it('finds no uncategorised prefix in the live template set', () => {
    const castable = UNIFIED_ACTION_TEMPLATES.filter(isPlayerReachableTemplate);
    expect(castable.length).toBeGreaterThan(100);
    expect(uncategorisedActionMessages(castable)).toEqual([]);
  });

  it('names the prefix and the file to edit for an unknown prefix', () => {
    const fake = [{ id: 'zzzfake.smite' }, { id: 'zzzfake.mend' }, { id: 'divine.bless' }];
    const messages = uncategorisedActionMessages(fake);
    expect(messages).toHaveLength(1);
    expect(messages[0]).toContain('add `zzzfake.` to src/data/action-categories.ts');
    expect(messages[0]).toContain('zzzfake.smite, zzzfake.mend');
  });

  it('every rule names a declared category', () => {
    for (const rule of ACTION_CATEGORY_RULES) {
      expect(ACTION_CATEGORY_IDS).toContain(rule.category);
    }
  });
});

describe('THR-1886 — no action changed category when the lists became one table', () => {
  const pinned = snapshot as Record<string, { catalog: string | null; codex: string | null }>;

  it('the table reproduces the pinned id → category map for every template', () => {
    const live: Record<string, { catalog: string | null; codex: string | null }> = {};
    for (const t of UNIFIED_ACTION_TEMPLATES) {
      const codex = actionCategoryFor(t.id);
      const catalog = catalogCategoryFor(t.id);
      if (codex || catalog) live[t.id] = { catalog, codex };
    }
    expect(live).toEqual(pinned);
  });

  it('the action catalog and the Codex file every action as pinned', () => {
    const catalog = new Map(buildCatalogData().entries.map(e => [e.id, e.category]));
    const actionCategoryIds = new Set<string>(ACTION_CATEGORY_IDS);
    const codex = new Map(
      getAllCodexEntries().filter(e => actionCategoryIds.has(e.category)).map(e => [e.id, e.category]),
    );
    for (const [id, want] of Object.entries(pinned)) {
      expect(catalog.get(id) ?? null, `${id} catalog facet`).toBe(want.catalog);
      expect(codex.get(id) ?? null, `${id} Codex category`).toBe(want.codex);
    }
    expect(catalog.size).toBe(Object.values(pinned).filter(v => v.catalog).length);
    expect(codex.size).toBe(Object.values(pinned).filter(v => v.codex).length);
  });

  it('the Codex tabs read their action labels from the table', () => {
    const tabs = getCodexCategories();
    for (const id of ACTION_CATEGORY_IDS) {
      const tab = tabs.find(c => c.id === id);
      expect(tab, `Codex tab for ${id}`).toBeDefined();
      expect(tab!.label).toBe(ACTION_CATEGORIES[id].label);
      expect(isIconName(tab!.icon), `${id} → ${tab!.icon}`).toBe(true);
    }
  });
});
