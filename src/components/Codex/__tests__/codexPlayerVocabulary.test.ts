/**
 * Codex player vocabulary — no raw `crudType` on a player surface (THR-1076).
 *
 * `mapDivineAction` / `mapMortalAction` / `mapTargetAction` used to pipe `template.crudType`
 * — an internal taxonomy for how a template mutates the graph — into three player-visible
 * fields per entry: the card subtitle (`Heart · update`), a detail row labelled `CRUD`, and a
 * tag chip. Law 14 (`Docs/design-system/laws.md`) forbids raw internal keys on a player
 * surface; `CRUD` is worse than the enum, being a database term used as a player-facing label.
 *
 * These tests pin the *invariant* across the whole catalog rather than the three call sites, so
 * a fourth mapper — or a fifth field on an existing one — fails here instead of shipping the
 * enum back onto the card face. The ticket's Done-when names `subtitle` and `details[].label`;
 * `tags` is included because it renders as a visible chip in `CodexDetailPanel`, so it is the
 * same violation on the same composed surface.
 *
 * Scope note: `summary`, `flavorText` and `technicalEffect` are deliberately NOT swept. They are
 * authored prose, and `technicalEffect` is designer-facing text that legitimately says things
 * like "creates a bond edge" — a substring sweep there would fail on English, not on a leak.
 */

import { describe, it, expect } from 'vitest';
import { UNIFIED_ACTION_TEMPLATES } from '../../../data/unified-action-templates';
import { getAllCodexEntries, type CodexEntry } from '../codexRegistry';

/** The closed set from `UnifiedActionTemplate.crudType`. */
const CRUD_VALUES = ['create', 'read', 'update', 'delete'] as const;

/** Standalone-token match, so prose like "recreate" or "undeleted" is not a false positive. */
function containsCrudToken(text: string): string | null {
  for (const v of CRUD_VALUES) {
    if (new RegExp(`\\b${v}\\b`, 'i').test(text)) return v;
  }
  return null;
}

/** Codex entries built from an action template — the three mappers' output. */
function actionEntries(): CodexEntry[] {
  const templateIds = new Set(UNIFIED_ACTION_TEMPLATES.map(t => t.id));
  return getAllCodexEntries().filter(e => templateIds.has(e.id));
}

describe('THR-1076 — the Codex never renders a raw crudType', () => {
  it('has a non-empty population of action entries carrying a crudType to leak', () => {
    // Guard the guard (twice over). Every assertion below passes vacuously against an empty
    // catalog, and also against a corpus where `crudType` has quietly stopped existing — in
    // which case this suite would be pinning nothing while reading green.
    const entries = actionEntries();
    expect(entries.length).toBeGreaterThan(150);

    const withCrud = UNIFIED_ACTION_TEMPLATES.filter(t => CRUD_VALUES.includes(t.crudType));
    expect(withCrud.length).toBeGreaterThan(150);
  });

  it('renders no crudType value in any action entry subtitle', () => {
    const leaks = actionEntries()
      .map(e => ({ id: e.id, subtitle: e.subtitle, hit: containsCrudToken(e.subtitle) }))
      .filter(r => r.hit !== null);

    expect(
      leaks.map(r => `${r.id}: subtitle "${r.subtitle}" carries '${r.hit}'`),
      'A subtitle is the card face. Reach alone orients the player; the CRUD axis does not.',
    ).toEqual([]);
  });

  it('labels no detail row `CRUD`, and no detail label carries a crud enum', () => {
    const leaks: string[] = [];
    for (const e of actionEntries()) {
      for (const d of e.details) {
        if (d.label.trim().toUpperCase() === 'CRUD' || containsCrudToken(d.label)) {
          leaks.push(`${e.id}: detail row labelled "${d.label}"`);
        }
      }
    }

    expect(leaks, '`CRUD` is a database term, not a game concept.').toEqual([]);
  });

  it('emits no crud enum as a tag chip', () => {
    // Tags render as visible chips in CodexDetailPanel and feed the search box, so a raw
    // enum here is the same Law 14 violation as the subtitle — just in a smaller font.
    const leaks: string[] = [];
    for (const e of actionEntries()) {
      for (const tag of e.tags) {
        if ((CRUD_VALUES as readonly string[]).includes(tag.trim().toLowerCase())) {
          leaks.push(`${e.id}: tag "${tag}"`);
        }
      }
    }

    expect(leaks).toEqual([]);
  });

  it('still carries the orientation the subtitle is for', () => {
    // The fix is a deletion, so the risk it introduces is an *empty* card face rather than a
    // leaking one. Every action entry must still say something.
    const blank = actionEntries().filter(e => e.subtitle.trim() === '');
    expect(blank.map(e => e.id), 'subtitle went blank when crudType was removed').toEqual([]);
  });
});
