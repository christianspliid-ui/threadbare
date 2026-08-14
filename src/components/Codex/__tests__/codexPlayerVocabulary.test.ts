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
import {
  getAllCodexEntries,
  getCodexCategories,
  formatReachBonus,
  formatDomainContributions,
  durationLabel,
  type CodexEntry,
} from '../codexRegistry';

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

/**
 * THR-1113 — the agreement, resource and magnitude rows THR-1103 scoped out.
 *
 * Same invariant shape as the two blocks above, and the same reason for it: pinned across the built
 * catalog rather than at each call site, so a new mapper fails here instead of shipping an enum.
 *
 * Two departures from that shape, both forced by what the corpus actually contains:
 *
 * - **`Reach Bonus` is pinned by a direct call, not a sweep.** Measured 2026-08-14, `reachBonus` is
 *   absent from all 119 possessions, so the row never renders and a catalog sweep over it would
 *   pass while asserting nothing — coverage-shaped, evidence-free. The formatter is called directly
 *   instead, and the zero population is asserted explicitly so this note stops being true loudly
 *   rather than silently if someone authors one.
 * - **An empty-value sweep runs over every row in the catalog.** The ticket was filed about a
 *   numeral; the larger defect on the same row was that twelve of thirteen `Domain Effects` rows
 *   rendered as a label with nothing after it, because `{}` passed a truthiness guard.
 */

/** The closed set from `AgreementRewardTemplate.agreementType`. */
const AGREEMENT_TYPE_VALUES = ['bargain', 'debt', 'favour', 'oath', 'pact', 'treaty'] as const;

/** The closed set of agreement effect `type` values authored in the catalog. */
const AGREEMENT_EFFECT_VALUES = [
  'social_modifier', 'behavior_weight', 'action_gate', 'passive', 'axiological_drift',
] as const;

/** The closed set from `ResourceClass.category`. */
const RESOURCE_CATEGORY_VALUES = ['staple', 'strategic', 'luxury', 'arcane'] as const;

function entriesInCategory(category: string): CodexEntry[] {
  return getAllCodexEntries().filter(e => e.category === category);
}

function detailRows(entries: CodexEntry[], label: string): { id: string; value: string }[] {
  return entries.flatMap(e => e.details.filter(d => d.label === label).map(d => ({ id: e.id, value: d.value })));
}

describe('THR-1113 — agreements, resources and the sidebar resolve before render (Law 14)', () => {
  it('has populations to leak in each of the three families', () => {
    // Guard the guard. Every assertion below passes vacuously against an empty catalog.
    expect(entriesInCategory('agreements').length).toBeGreaterThan(5);
    expect(entriesInCategory('resources').length).toBeGreaterThan(15);
    expect(getCodexCategories().length).toBeGreaterThan(8);
  });

  it('renders no raw agreementType in an agreement subtitle or Type row', () => {
    // `debt · Mundane` — the raw key beside a resolved tier name, which is what made it read as a
    // deliberate lowercase style rather than as an unresolved field.
    const agreements = entriesInCategory('agreements');
    const surfaces = [
      ...agreements.map(e => ({ id: e.id, where: 'subtitle', value: e.subtitle })),
      ...detailRows(agreements, 'Type').map(r => ({ id: r.id, where: 'Type row', value: r.value })),
    ];
    expect(surfaces.length).toBeGreaterThan(10);

    const leaks = surfaces
      .filter(s => (AGREEMENT_TYPE_VALUES as readonly string[]).some(v => s.value.split(' · ')[0].trim() === v))
      .map(s => `${s.id}: ${s.where} = "${s.value}"`);
    expect(leaks).toEqual([]);
  });

  it('renders no internal effect-type enum in an agreement Effects row', () => {
    const rows = detailRows(entriesInCategory('agreements'), 'Effects');
    expect(rows.length, 'no Effects row in the catalog — the fixture is stale, not the fix').toBeGreaterThan(0);

    const leaks: string[] = [];
    for (const r of rows) {
      for (const part of r.value.split(',').map(s => s.trim())) {
        if ((AGREEMENT_EFFECT_VALUES as readonly string[]).includes(part)) {
          leaks.push(`${r.id}: Effects = "${r.value}" carries '${part}'`);
        }
      }
    }
    expect(leaks, 'Effect kinds resolve to verb phrases — the player can act on knowing an oath bars actions.')
      .toEqual([]);
  });

  it('renders no raw resource category in a subtitle, tag chip or Class row', () => {
    const resources = entriesInCategory('resources');
    const surfaces = [
      ...resources.map(e => ({ id: e.id, where: 'subtitle', value: e.subtitle.split(' · ')[0].trim() })),
      ...resources.flatMap(e => e.tags.map((t, i) => ({ id: e.id, where: `tag[${i}]`, value: t.trim() }))),
      ...detailRows(resources, 'Class').map(r => ({ id: r.id, where: 'Class row', value: r.value.trim() })),
    ];
    expect(surfaces.length).toBeGreaterThan(50);

    const leaks = surfaces
      .filter(s => (RESOURCE_CATEGORY_VALUES as readonly string[]).includes(s.value))
      .map(s => `${s.id}: ${s.where} = "${s.value}"`);
    expect(leaks, 'THR-1103 resolved primarySphere and left the category, so `arcane · Time` showed both spellings at once.')
      .toEqual([]);
  });

  it('labels every sidebar subcategory with something other than its own id', () => {
    // The old tail was `?? id`, so any id in neither vocabulary painted raw in the nav rail. Nine
    // did — including `intelligence`, `talisman` and `charm`, which the ticket did not name because
    // they are only visible in the *built* sidebar, not in the data.
    const raw: string[] = [];
    for (const cat of getCodexCategories()) {
      expect(cat.subcategories.length, `${cat.id} has no subcategories — sweep is vacuous`).toBeGreaterThan(0);
      for (const sub of cat.subcategories) {
        if (sub.label === sub.id) raw.push(`${cat.id}/${sub.id}: label = "${sub.label}"`);
      }
    }
    expect(raw, 'A nav label equal to its own id is the raw key with extra steps.').toEqual([]);
  });
});

describe('THR-1113 — magnitudes band before render (Law 13)', () => {
  it('quotes no numeral in a Domain Effects or Reach Bonus row', () => {
    const entries = getAllCodexEntries();
    const rows = [
      ...detailRows(entries, 'Domain Effects'),
      ...detailRows(entries, 'Reach Bonus'),
    ];
    // Anti-vacuity: `Reach Bonus` genuinely has zero rows (see the block comment), so this asserts
    // only that `Domain Effects` still has one. If both ever go to zero the sweep is pinning air.
    expect(rows.length, 'no banded magnitude row in the catalog — the fixture is stale, not the fix')
      .toBeGreaterThan(0);

    const leaks = rows.filter(r => /\d/.test(r.value)).map(r => `${r.id}: "${r.value}"`);
    expect(leaks, 'A domain contribution is not a price; nothing exempts it from Law 13 the way essence is exempt.')
      .toEqual([]);
  });

  it('quotes an agreement Duration in days, never in ticks or numerals', () => {
    const rows = detailRows(entriesInCategory('agreements'), 'Duration');
    expect(rows.length).toBeGreaterThan(0);

    const leaks = rows
      .filter(r => /\d/.test(r.value) || /\btick/i.test(r.value))
      .map(r => `${r.id}: Duration = "${r.value}"`);
    expect(leaks, 'Ticks are an engine unit — the player has no tick readout anywhere else.').toEqual([]);

    // Both branches must be exercised or one of them is pinned by nothing: the corpus carries
    // 48/72/96-tick terms and four permanent ones.
    expect(rows.some(r => r.value === 'Permanent'), 'no permanent agreement in the catalog').toBe(true);
    expect(rows.some(r => r.value.endsWith(' days')), 'no timed agreement in the catalog').toBe(true);
  });

  it('never renders a detail row whose value is empty', () => {
    // The defect the ticket did not name: `{}` is truthy, so twelve of thirteen `Domain Effects`
    // rows shipped as a label with nothing after it. Swept catalog-wide rather than on that one row,
    // because the guard shape (`...(p.field ? [row] : [])`) is repeated across every mapper.
    const blank: string[] = [];
    for (const e of getAllCodexEntries()) {
      for (const d of e.details) {
        if (d.value.trim() === '') blank.push(`${e.id}: row "${d.label}" has no value`);
      }
    }
    expect(blank, 'A row with no value is a label pretending to be information.').toEqual([]);
  });
});

describe('THR-1113 — the magnitude ladders themselves', () => {
  it('bands a reach bonus without a numeral, and keeps the sign as a word', () => {
    // Pinned by direct call: `reachBonus` is authored on zero possessions, so a catalog sweep would
    // assert nothing. Both directions and both ends of the ladder are exercised.
    expect(formatReachBonus({ iron: 2 })).toBe('a slight edge in Iron');
    expect(formatReachBonus({ iron: 9 })).toBe('a commanding edge in Iron');
    expect(formatReachBonus({ heart: -4 })).toBe('a solid drag on Heart');
    expect(formatReachBonus({ iron: 1, gold: 6 })).toBe('a slight edge in Iron, a strong edge in Gold');
    expect(/\d/.test(formatReachBonus({ iron: 2, gold: -7 }))).toBe(false);
  });

  it('bands a domain contribution on the 0–1 weight scale', () => {
    // `capabilityGrowth.ts` builds a full-weight contribution as 1.0, which is what the ladder is
    // anchored on. The two authored corpus values land on adjacent rungs rather than collapsing
    // onto one — a ladder that cannot separate its own corpus is pinning nothing.
    expect(formatDomainContributions({ gold: 0.04 })).toBe('a slight edge in Gold');
    expect(formatDomainContributions({ heart: 0.02 })).toBe('a faint edge in Heart');
    expect(formatDomainContributions({ iron: 1.0 })).toBe('a commanding edge in Iron');
    expect(formatDomainContributions({ iron: -0.3 })).toBe('a strong drag on Iron');
  });

  it('converts ticks to spelled days, stepping up to weeks rather than growing a numeral', () => {
    expect(durationLabel(48)).toBe('four days');   // the live corpus
    expect(durationLabel(72)).toBe('six days');
    expect(durationLabel(96)).toBe('eight days');
    expect(durationLabel(12)).toBe('one day');     // singular, not `one days`
    expect(durationLabel(1)).toBe('one day');      // sub-day terms floor at a day, never `zero days`
    expect(durationLabel(108)).toBe('nine days');  // last rung before the ladder steps up
    expect(durationLabel(240)).toBe('three weeks');
    expect(/\d/.test(durationLabel(1000))).toBe(false);
  });
});
