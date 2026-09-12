/**
 * Content-object registry contract (THR-1485, slice 1 of THR-1481).
 *
 * The registry claims to cover the authored corpus. This test pins each claim against
 * the corpus itself — the real catalogs, never a fixture — so a catalog that grows an
 * id nobody claims, or a row that names an export that does not exist, fails by name.
 *
 *   A. **Totality** — every id in every declared catalog is claimed by at least one
 *      kind's prefixes. This is the guard that rots: a new `#` family, a renamed
 *      prefix, an id typo all land here.
 *   B. **Catalog unambiguity** — two kinds may read the same catalog, but never while
 *      sharing an id prefix. The catalog is the discriminator wherever the prefix
 *      cannot be (`anomaly_*` names an item, a power and a condition); the prefix is
 *      the discriminator wherever the catalog is pooled (the unified template array).
 *      One of the two must decide, and this guard is that claim.
 *   C. **Prefix disjointness** — two kinds share a prefix only when `SHARED_ID_PREFIXES`
 *      declares it with a reason. An accidental collision fails.
 *   D. **Catalogs resolve** — every ref's module file exists, exports the named symbol,
 *      and is wired into the loader; and every loader key is claimed by a row. Both
 *      directions, because a one-way check lets the loader grow orphans.
 *   E. **Joins hold** — `owningSystem` is a verbatim subsystem name, `instantiatesAs`
 *      is a registered world-object kind, and the two `content`-status world-object
 *      rows point back at a content kind.
 *
 * Each guard was falsified once during authoring (removed a row, broke a prefix,
 * repointed a catalog, misspelled a subsystem) — evidence in the THR-1485 closeout.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

import {
  CONTENT_OBJECT_KINDS,
  SHARED_ID_PREFIXES,
  getContentObjectKind,
  contentKindsForId,
  contentKindsForWorldObject,
  isSharedIdPrefix,
  type ContentObjectKind,
} from '../content-objects';
import { CONTENT_CATALOGS, catalogKey, entriesFor, entriesOfKind } from '../contentCatalogs';
import { WORLD_OBJECT_KINDS } from '../world-objects';
import { SUBSYSTEM_NAMES } from '../../../scripts/subsystems-registry';

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');

/** Every `{kind, ref}` pair in the registry, flattened once. */
const ALL_REFS: ReadonlyArray<{ kind: ContentObjectKind; key: string }> = CONTENT_OBJECT_KINDS.flatMap(k =>
  k.catalogs.map(ref => ({ kind: k, key: catalogKey(ref) })),
);

describe('content-object registry — corpus coverage', () => {
  // Guard A. The catalogs are real and non-trivial before anything is asserted about
  // them: a registry whose catalogs all resolved empty would pass every guard below
  // while claiming nothing (the vacuous-probe pattern).
  it('reads a non-trivial corpus from every declared catalog', () => {
    const empty = ALL_REFS.filter(({ key }) => (CONTENT_CATALOGS[key]?.length ?? 0) === 0)
      .map(({ kind, key }) => `${kind.id}: ${key}`);
    // FACTORY_STRATEGIC_TEMPLATES is legitimately empty — the factory compiles packages
    // on demand and ships none by default. Named, so a second empty catalog fails.
    expect(empty).toEqual(['undertaking_template: data/strategic-packs/factory/index#FACTORY_STRATEGIC_TEMPLATES']);
    const total = Object.values(CONTENT_CATALOGS).reduce((n, c) => n + c.length, 0);
    expect(total, 'total catalog entries').toBeGreaterThan(900);
  });

  it('claims every id in every declared catalog with at least one kind (guard A)', () => {
    const unclaimed: string[] = [];
    for (const { key } of ALL_REFS) {
      for (const entry of CONTENT_CATALOGS[key] ?? []) {
        if (contentKindsForId(entry.id).length === 0) unclaimed.push(`${key}: ${entry.id}`);
      }
    }
    expect(
      unclaimed,
      'catalog ids no content kind claims — add the prefix to the owning row in src/data/content-objects.ts',
    ).toEqual([]);
  });

  it('gives every kind entries of its own, and splits the shared unified array cleanly', () => {
    const starved = CONTENT_OBJECT_KINDS.filter(k => entriesOfKind(k.id).length === 0).map(k => k.id);
    expect(starved, 'kinds whose catalogs yield no entry under their own prefixes').toEqual([]);

    // The encounter and action kinds share `UNIFIED_ACTION_TEMPLATES`. Their halves must
    // partition it: every id in the array lands in exactly one of the two.
    const unified = CONTENT_CATALOGS['data/unified-action-templates#UNIFIED_ACTION_TEMPLATES'] ?? [];
    expect(unified.length).toBeGreaterThan(500);
    const enc = getContentObjectKind('encounter_template')!;
    const act = getContentObjectKind('action_template')!;
    const both: string[] = [];
    const neither: string[] = [];
    for (const e of unified) {
      const isEnc = enc.idPrefixes.some(p => e.id.startsWith(p));
      const isAct = act.idPrefixes.some(p => e.id.startsWith(p));
      if (isEnc && isAct) both.push(e.id);
      if (!isEnc && !isAct) neither.push(e.id);
    }
    expect(both, 'unified ids claimed by BOTH the encounter and action kinds').toEqual([]);
    expect(neither, 'unified ids claimed by NEITHER the encounter nor the action kind').toEqual([]);
  });
});

describe('content-object registry — internal consistency', () => {
  it('has unique kind ids, unique game words, and a note on every kind', () => {
    const ids = CONTENT_OBJECT_KINDS.map(k => k.id);
    expect(new Set(ids).size).toBe(ids.length);
    const words = CONTENT_OBJECT_KINDS.map(k => k.gameWord);
    expect(new Set(words).size).toBe(words.length);
    for (const k of CONTENT_OBJECT_KINDS) expect(k.note.length, `${k.id}.note`).toBeGreaterThan(40);
    expect(getContentObjectKind('item_template')?.gameWord).toBe('Item');
  });

  it('shares a catalog export only between kinds whose prefixes are disjoint (guard B)', () => {
    // The claim that has to hold: wherever two kinds read the same array, the id
    // prefixes must say unambiguously which entry is whose. Sharing per se is fine —
    // the encounter and action kinds split `UNIFIED_ACTION_TEMPLATES` cleanly, and
    // forbidding that made the action row under-count its own kind by 141 entries.
    // What is never fine is two kinds sharing a catalog *and* a prefix, because then
    // nothing decides: that is the `anomaly_*` case, where one prefix names an item,
    // a power and a condition and only the separate catalogs tell them apart.
    const owners = new Map<string, string[]>();
    for (const { kind, key } of ALL_REFS) (owners.get(key) ?? owners.set(key, []).get(key)!).push(kind.id);
    const ambiguous: string[] = [];
    for (const [key, kindIds] of owners) {
      if (kindIds.length < 2) continue;
      for (let i = 0; i < kindIds.length; i++) {
        for (let j = i + 1; j < kindIds.length; j++) {
          const a = getContentObjectKind(kindIds[i] as never)!;
          const b = getContentObjectKind(kindIds[j] as never)!;
          const overlap = a.idPrefixes.filter(p => b.idPrefixes.includes(p));
          if (overlap.length) ambiguous.push(`${key}: ${a.id} and ${b.id} share prefixes ${overlap.join(' ')}`);
        }
      }
    }
    expect(
      ambiguous,
      'catalogs shared between kinds that also share an id prefix — nothing decides which entry is whose',
    ).toEqual([]);
  });

  it('shares an id prefix between kinds only by declaration (guard C)', () => {
    const byPrefix = new Map<string, string[]>();
    for (const k of CONTENT_OBJECT_KINDS) {
      for (const p of k.idPrefixes) (byPrefix.get(p) ?? byPrefix.set(p, []).get(p)!).push(k.id);
    }
    const undeclared = [...byPrefix]
      .filter(([p, kinds]) => kinds.length > 1 && !isSharedIdPrefix(p))
      .map(([p, kinds]) => `${p} shared by ${kinds.join(', ')}`);
    expect(
      undeclared,
      'id prefixes shared between kinds with no SHARED_ID_PREFIXES entry — declare it with its reason, or narrow the prefix',
    ).toEqual([]);

    // And the reverse: a declared share that no longer happens is stale bookkeeping.
    const stale = Object.keys(SHARED_ID_PREFIXES).filter(p => (byPrefix.get(p)?.length ?? 0) < 2);
    expect(stale, 'SHARED_ID_PREFIXES entries no two kinds actually share').toEqual([]);
    for (const reason of Object.values(SHARED_ID_PREFIXES)) expect(reason.length).toBeGreaterThan(40);
  });

  it('names catalogs that exist, export what they claim, and are wired both ways (guard D)', () => {
    const broken: string[] = [];
    for (const kind of CONTENT_OBJECT_KINDS) {
      for (const ref of kind.catalogs) {
        const candidates = [`src/${ref.module}.ts`, `src/${ref.module}/index.ts`];
        const file = candidates.find(c => fs.existsSync(path.join(REPO_ROOT, c)));
        if (!file) { broken.push(`${kind.id}: no module for ${ref.module}`); continue; }
        const src = fs.readFileSync(path.join(REPO_ROOT, file), 'utf-8');
        if (!new RegExp(`export\\s+const\\s+${ref.export}\\b`).test(src)) {
          broken.push(`${kind.id}: ${file} does not export const ${ref.export}`);
        }
        if (entriesFor(ref) === undefined) broken.push(`${kind.id}: ${catalogKey(ref)} missing from CONTENT_CATALOGS`);
      }
    }
    expect(broken, 'registry catalogs that do not resolve').toEqual([]);

    const claimed = new Set(ALL_REFS.map(r => r.key));
    const orphans = Object.keys(CONTENT_CATALOGS).filter(k => !claimed.has(k));
    expect(orphans, 'CONTENT_CATALOGS keys no registry row claims — remove the import or add the row').toEqual([]);
  });

  it('names a ulTerm that resolves to a real heading in a real shard (guard E)', () => {
    // The plan's harness rule, as a guard: "the registry's `ulTerm` must resolve."
    // Without it a row can point at a term that was never written, or — the case this
    // caught on its first run — at one that was *retired*: `Encounters.md#encountertemplate`
    // resolves to a retirement notice telling the reader not to use the format.
    const anchorOf = (heading: string) =>
      heading.toLowerCase().replace(/[^a-z0-9 -]/g, '').trim().replace(/\s+/g, '-');
    const shards = new Map<string, Set<string>>();
    const broken: string[] = [];
    for (const k of CONTENT_OBJECT_KINDS) {
      const [shard, anchor] = k.ulTerm.split('#');
      if (!shard || !anchor) { broken.push(`${k.id}: malformed ulTerm '${k.ulTerm}'`); continue; }
      if (!shards.has(shard)) {
        const file = path.join(REPO_ROOT, 'Docs', 'ubiquitous-language', shard);
        if (!fs.existsSync(file)) { broken.push(`${k.id}: no shard ${shard}`); continue; }
        const headings = fs.readFileSync(file, 'utf-8').split('\n')
          .filter(l => l.startsWith('### ')).map(l => anchorOf(l.slice(4)));
        shards.set(shard, new Set(headings));
      }
      if (!shards.get(shard)?.has(anchor)) broken.push(`${k.id}: ${shard} has no heading anchored '${anchor}'`);
    }
    expect(broken, 'ulTerm values that do not resolve to a UL heading').toEqual([]);
    // The three terms this slice seated must be findable by the name the registry uses.
    const enc = shards.get('Encounters.md')!;
    for (const seated of ['content-object', 'content-tag', 'content-query']) {
      expect(enc.has(seated), `Encounters.md is missing the '${seated}' term`).toBe(true);
    }
  });

  it('names an owningSystem that is a registry subsystem (guard E)', () => {
    const unknown = CONTENT_OBJECT_KINDS
      .filter(k => !SUBSYSTEM_NAMES.has(k.owningSystem))
      .map(k => `${k.id}: ${k.owningSystem}`);
    expect(unknown, 'owningSystem values absent from SUBSYSTEM_NAMES').toEqual([]);
  });

  it('instantiates as a registered world-object kind, or deliberately as nothing (guard E)', () => {
    const worldIds = new Set(WORLD_OBJECT_KINDS.map(k => k.id));
    const unknown = CONTENT_OBJECT_KINDS
      .filter(k => k.instantiatesAs !== null && !worldIds.has(k.instantiatesAs))
      .map(k => `${k.id}: ${k.instantiatesAs}`);
    expect(unknown, 'instantiatesAs values no world-object kind claims').toEqual([]);
    // The two kinds that instantiate as nothing are a decision, not an omission, so
    // they are named here: an omen is pressure, a card is played and spent.
    const nulls = CONTENT_OBJECT_KINDS.filter(k => k.instantiatesAs === null).map(k => k.id).sort();
    expect(nulls).toEqual(['nudge_card', 'omen_template']);
    expect(contentKindsForWorldObject('item').map(k => k.id)).toEqual(['item_template']);
  });

  it('points every `content`-status world-object row back at a content kind (guard E)', () => {
    const contentKindIds = new Set(CONTENT_OBJECT_KINDS.map(k => k.id));
    const rows = WORLD_OBJECT_KINDS.filter(k => k.status === 'content');
    expect(rows.length, 'world-object rows with status `content`').toBeGreaterThan(0);
    const unpointed = rows
      .filter(k => !k.contentKind || !contentKindIds.has(k.contentKind))
      .map(k => `${k.id}: ${k.contentKind ?? '(none)'}`);
    expect(
      unpointed,
      'world-object `content` rows with no contentKind pointer — authored content must name the content kind that writes it',
    ).toEqual([]);
  });

  it('names a projection field that entries of the kind actually carry', () => {
    // A projection promises "never author this tag — it comes from the typed field".
    // A field no entry carries would make slice 2's projection silently empty, which
    // reads as "no tags authored" rather than "the field is wrong".
    const empty: string[] = [];
    for (const kind of CONTENT_OBJECT_KINDS) {
      for (const [axis, field] of Object.entries(kind.projections)) {
        // `ContentCatalogEntry` narrows to `{ id }` on purpose — the catalogs have no
        // other field in common — so reading a projection field means widening back to
        // the untyped bag the real entries are. Through `unknown`, because the two
        // shapes do not overlap structurally.
        const entries = entriesOfKind(kind.id) as unknown as ReadonlyArray<Record<string, unknown>>;
        const bearers = entries.filter(e => {
          const direct = e[field];
          const props = (e.properties ?? {}) as Record<string, unknown>;
          return direct !== undefined || props[field] !== undefined;
        }).length;
        if (bearers === 0) empty.push(`${kind.id}.${axis} → '${field}' (0 of ${entries.length} entries carry it)`);
      }
    }
    expect(empty, 'projection fields no entry of the kind carries').toEqual([]);
  });
});
