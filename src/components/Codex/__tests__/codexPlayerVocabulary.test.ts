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
import { SPHERE_NAMES } from '../../../types/index';
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

/**
 * THR-1103 — the axes THR-1076 left raw.
 *
 * Same invariant shape, same reason: pinned across the whole catalog rather than at the three
 * call sites, so a fourth mapper fails here instead of shipping the enum back onto the card face.
 * Three violations were measured on `hex.bless_land` after THR-1076 landed — `tags: ["star",
 * "regional"]` (the raw reach key beside the raw scale enum), a `Scale` row reading `regional`,
 * and an `Essence Cost` row reading `"3"`.
 */

/** The closed set from `ActionScale` (`src/types/unifiedAction.ts`). */
const SCALE_VALUES = ['cosmic', 'regional', 'local', 'personal'] as const;

/** The closed set of `visibility` values authored across the attachment catalogs. */
const VISIBILITY_VALUES = ['public', 'known', 'hidden', 'discoverable', 'divine_only'] as const;

/** The raw reach keys, as `REACH_GLYPHS` / `REACH_DISPLAY` key them. */
const REACH_KEYS = [
  'iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star', 'flesh', 'time', 'life',
] as const;

/** Every player-visible string an entry paints, paired with where it paints. */
function surfaceStrings(e: CodexEntry): { where: string; value: string }[] {
  return [
    { where: 'subtitle', value: e.subtitle },
    ...e.tags.map((t, i) => ({ where: `tag[${i}]`, value: t })),
    ...e.details.map(d => ({ where: `detail "${d.label}"`, value: d.value })),
  ];
}

describe('THR-1103 — the Codex resolves reach, scale and visibility before render (Law 14)', () => {
  it('has a population of action entries carrying a scale to leak', () => {
    // Guard the guard: every assertion below passes vacuously against an empty catalog, and
    // also against one where `scale` has quietly stopped being populated.
    const entries = actionEntries();
    expect(entries.length).toBeGreaterThan(150);

    const withScale = UNIFIED_ACTION_TEMPLATES.filter(
      t => (SCALE_VALUES as readonly string[]).includes(t.scale),
    );
    expect(withScale.length).toBeGreaterThan(150);
  });

  it('emits no raw reach or sphere key on any action surface', () => {
    // The measured defect: `tags: [reach]` passed the raw key while the `Reach` detail row two
    // lines below passed `REACH_DISPLAY[reach]`, so one panel showed `star` and `Star` at once.
    //
    // Sphere is swept in the same assertion rather than its own because the two key sets *overlap*
    // — `life`, `time` and `shadow` are both a reach and a sphere — so a sweep that excluded
    // spheres could not tell a leaked reach tag from a leaked sphere tag, and would have to
    // whitelist exactly the tokens most likely to leak.
    const RAW_KEYS = [...REACH_KEYS, ...SPHERE_NAMES];
    const leaks: string[] = [];
    for (const e of actionEntries()) {
      for (const { where, value } of surfaceStrings(e)) {
        if ((RAW_KEYS as readonly string[]).includes(value.trim())) {
          leaks.push(`${e.id}: ${where} = "${value}" (raw key)`);
        }
      }
    }
    expect(leaks, 'Reach and sphere resolve through their vocabularies on every surface, not just the detail row.')
      .toEqual([]);
  });

  it('emits no raw scale enum on any action surface', () => {
    const leaks: string[] = [];
    for (const e of actionEntries()) {
      for (const { where, value } of surfaceStrings(e)) {
        if ((SCALE_VALUES as readonly string[]).includes(value.trim())) {
          leaks.push(`${e.id}: ${where} = "${value}" (raw ActionScale)`);
        }
      }
    }
    expect(leaks, 'Scale is player-meaningful, so it resolves through SCALE_DISPLAY rather than being dropped.')
      .toEqual([]);
  });

  it('renders no attachment visibility raw — `divine_only` is the tell', () => {
    // Not an action entry, so this one sweeps the possession/condition mappers instead.
    const templateIds = new Set(UNIFIED_ACTION_TEMPLATES.map(t => t.id));
    const attachments = getAllCodexEntries().filter(e => !templateIds.has(e.id));
    expect(attachments.length).toBeGreaterThan(50);

    const rows = attachments.flatMap(e =>
      e.details.filter(d => d.label === 'Visibility').map(d => ({ id: e.id, value: d.value })),
    );
    // Anti-vacuity: a sweep over zero Visibility rows would pass while pinning nothing.
    expect(rows.length, 'no Visibility row in the catalog — the fixture is stale, not the fix').toBeGreaterThan(0);

    const leaks = rows
      .filter(r => (VISIBILITY_VALUES as readonly string[]).includes(r.value.trim()))
      .map(r => `${r.id}: Visibility = "${r.value}"`);
    expect(leaks).toEqual([]);
  });

  it('quotes a price with its unit, never a bare numeral (Law 13 + THR-1006)', () => {
    const rows = actionEntries().flatMap(e =>
      e.details.filter(d => d.label === 'Cost').map(d => ({ id: e.id, value: d.value })),
    );
    expect(rows.length).toBeGreaterThan(150);

    // `String(essenceCost)` produced `"3"` — and `"0.05000000000000001"` for an authored
    // fractional price. Both are the shape this rejects; `Free` and `3 essence` are the shapes
    // every other cost surface in the game uses.
    const bare = rows
      .filter(r => /^-?\d+(\.\d+)?$/.test(r.value.trim()))
      .map(r => `${r.id}: Cost = "${r.value}"`);
    expect(bare, 'A price quotes the pool it is paid from — see shared/formatEssence.ts.').toEqual([]);

    const malformed = rows
      .filter(r => r.value !== 'Free' && !/^\d+(\.\d+)? essence$/.test(r.value))
      .map(r => `${r.id}: Cost = "${r.value}"`);
    expect(malformed, 'Cost is `Free` or `<n> essence` — no third spelling.').toEqual([]);

    // Both branches must be exercised, or one of them is pinned by nothing.
    expect(rows.some(r => r.value === 'Free'), 'no free action in the catalog').toBe(true);
    expect(rows.some(r => r.value.endsWith(' essence')), 'no priced action in the catalog').toBe(true);
  });

  it('labels no row `Essence Cost` — the row carries its unit in the value now', () => {
    const stale = actionEntries()
      .flatMap(e => e.details.filter(d => d.label === 'Essence Cost').map(() => e.id));
    expect(stale, '`Essence Cost: 3 essence` says essence twice; the row is `Cost`.').toEqual([]);
  });
});
