/**
 * The surface registry's contract (THR-1490).
 *
 * Two claims are worth a test, and neither is checkable by the type system:
 *
 * 1. **Every kind reaches a surface.** `Record<WorldRefKind, SurfaceRow>` gets totality
 *    for free, but not *reachability* — a row could name a card kind the detail-page
 *    registry has no schema for, and nothing would say so until a player clicked.
 * 2. **Every world-object kind is reachable from the game**, directly or through the kind
 *    whose card shows it. This is the pin the ticket asked for, and it is a graph walk:
 *    `via` chains must terminate at a `worldRef` and must not cycle.
 *
 * Each block below is falsifiable by editing one row of the registry, and the comments
 * say which edit — the point of a contract test is that someone can check it still bites.
 */

import { describe, it, expect } from 'vitest';
import {
  SURFACE_BY_CONTENT_KIND,
  SURFACE_BY_WORLD_REF,
  hasSheet,
  surfaceFor,
  type CardKind,
} from '../surface-registry';
import { CONTENT_OBJECT_KINDS } from '../content-objects';
import { CONTENT_OBJECT_KIND_IDS, isContentRef } from '../../types/contentRef';
import { WORLD_OBJECT_KINDS, type WorldObjectKind, type WorldObjectKindId } from '../world-objects';
import { DETAIL_PAGE_REGISTRY, KIND_LABELS } from '../detailPageTemplates';
import { WORLD_REF_KINDS } from '../../types/worldRef';
import { toNavigationTarget } from '../../types/worldRefAdapters';

/**
 * The only kinds allowed to be reachable by nothing.
 *
 * Deliberately an allowlist rather than a shape check: `noSurface` is free text, so a
 * predicate over "does it have a note" would let any future row buy its way out of the
 * pin with a sentence. A fourth member is a test edit someone has to argue for.
 *
 * - `sphere` / `reach` — axes, not objects. Both rows said so before this ticket existed.
 * - `cosmology_node` — never minted; a surface for it would be a promise with no mechanism.
 */
const NO_SURFACE_ALLOWLIST: readonly WorldObjectKindId[] = ['sphere', 'reach', 'cosmology_node'];

const byId = new Map<WorldObjectKindId, WorldObjectKind>(WORLD_OBJECT_KINDS.map(k => [k.id, k]));

describe('surface registry — totality', () => {
  it('has a row for every WorldRefKind', () => {
    for (const kind of WORLD_REF_KINDS) {
      expect(SURFACE_BY_WORLD_REF[kind], `no surface row for "${kind}"`).toBeDefined();
    }
    // The reverse: no row for a kind that left the vocabulary.
    expect(Object.keys(SURFACE_BY_WORLD_REF).sort()).toEqual([...WORLD_REF_KINDS].sort());
  });

  it('gives every kind a card — there is no such thing as a thing you cannot look at', () => {
    for (const kind of WORLD_REF_KINDS) {
      expect(surfaceFor(kind).card, `"${kind}" has no card`).toBeTruthy();
    }
  });

  it('names only card kinds the detail-page registry can actually render', () => {
    // Falsify: set any row's `card` to 'content' — slice 2's kind, with no schema yet.
    for (const kind of WORLD_REF_KINDS) {
      const card: CardKind = surfaceFor(kind).card;
      expect(DETAIL_PAGE_REGISTRY[card as keyof typeof DETAIL_PAGE_REGISTRY], `no page schema for card "${card}" (kind "${kind}")`).toBeDefined();
      expect(KIND_LABELS[card as keyof typeof KIND_LABELS], `no header label for card "${card}"`).toBeTruthy();
    }
  });

  it('quotes a ruling on every withheld sheet, and on no other row', () => {
    // Falsify: drop the `note` from the companion row, or add one to `agent`.
    for (const kind of WORLD_REF_KINDS) {
      const row = surfaceFor(kind);
      if (row.sheet === null) {
        expect(row.note, `"${kind}" withholds its sheet without saying why`).toBeTruthy();
      }
    }
    expect(SURFACE_BY_WORLD_REF.companion.sheet).toBeNull();
    expect(hasSheet('companion')).toBe(false);
    expect(hasSheet('agent')).toBe(true);
  });

  it('is consistent with toNavigationTarget: a row promising a sheet can name one', () => {
    // The registry's `sheet` and the adapter's arms are two statements of the same fact,
    // written in two files. This is the one place they are compared.
    // Falsify: give `companion` a `sheet: 'agent'` — the adapter still returns undefined.
    for (const kind of WORLD_REF_KINDS) {
      const row = surfaceFor(kind);
      if (row.sheet === null || row.sheet === 'codex') continue;
      // Two arms need more than a bare id and both would otherwise fail here for a
      // reason that is not the registry's: `hex` parses its id as `<col>,<row>`, and
      // `journey` needs a traveller the reference does not carry.
      const id = kind === 'hex' ? '4,7' : 'x';
      const target = toNavigationTarget({ kind, id }, { agentId: 'a' });
      expect(target, `"${kind}" claims sheet "${row.sheet}" but toNavigationTarget returns undefined`).toBeDefined();
      expect(target?.kind).toBe(row.sheet);
    }
  });
});

describe('world-object reachability — every kind is reachable from the game', () => {
  /** Walk a kind's `via` chain to the `worldRef` it ends at, or explain why it does not. */
  function resolve(id: WorldObjectKindId): { ok: true; hops: number } | { ok: false; why: string } {
    const seen = new Set<WorldObjectKindId>();
    let cursor: WorldObjectKindId | undefined = id;
    let hops = 0;
    while (cursor) {
      if (seen.has(cursor)) return { ok: false, why: `via cycle at "${cursor}"` };
      seen.add(cursor);
      const row = byId.get(cursor);
      if (!row) return { ok: false, why: `via names "${cursor}", which is not a kind` };
      if (row.worldRef) return { ok: true, hops };
      if (row.contentKind) return { ok: true, hops };
      if (NO_SURFACE_ALLOWLIST.includes(row.id)) return { ok: true, hops };
      cursor = row.via;
      hops++;
    }
    return { ok: false, why: 'no worldRef, no via, no contentKind, not allowlisted' };
  }

  it('resolves every WORLD_OBJECT_KINDS row', () => {
    // Falsify: delete `via: 'mortal'` from the `standing` row.
    const unreachable = WORLD_OBJECT_KINDS
      .map(k => ({ id: k.id, r: resolve(k.id) }))
      .filter(({ r }) => !r.ok)
      .map(({ id, r }) => `${id}: ${(r as { why: string }).why}`);
    expect(unreachable, `unreachable kinds:\n${unreachable.join('\n')}`).toEqual([]);
  });

  it('holds the no-surface escape to exactly the three rows that argued for it', () => {
    // Falsify: add `noSurface` to a fourth row — the pin is the allowlist, not the field.
    const carrying = WORLD_OBJECT_KINDS.filter(k => k.noSurface).map(k => k.id).sort();
    expect(carrying).toEqual([...NO_SURFACE_ALLOWLIST].sort());
    for (const id of NO_SURFACE_ALLOWLIST) {
      const row = byId.get(id);
      expect(row?.worldRef, `"${id}" is allowlisted as unreachable but carries a worldRef`).toBeNull();
      expect(row?.noSurface, `"${id}" is allowlisted without stating why`).toBeTruthy();
    }
  });

  it('never puts `via` on a row that already routes', () => {
    // A `via` beside a `worldRef` is two answers to one question; the walk would take
    // the `worldRef` and the `via` would rot unread.
    for (const k of WORLD_OBJECT_KINDS) {
      if (k.worldRef) expect(k.via, `"${k.id}" routes directly and also carries via`).toBeUndefined();
    }
  });
});

// ─── The content half (THR-1491) ──────────────────────────────────────────────

describe('surface registry — content kinds', () => {
  it('has a row for every ContentObjectKindId, and the union matches the registry', () => {
    // The pin the import-free `contentRef.ts` needs: it re-declares `ContentObjectKindId`
    // as a literal union so the anchor generator can read it as text, and only a test can
    // hold that shadow against the registry it shadows.
    // Falsify: add a kind to CONTENT_OBJECT_KINDS without adding it to CONTENT_OBJECT_KIND_IDS.
    const registryIds = CONTENT_OBJECT_KINDS.map(k => k.id).sort();
    expect([...CONTENT_OBJECT_KIND_IDS].sort()).toEqual(registryIds);
    for (const id of CONTENT_OBJECT_KIND_IDS) {
      expect(SURFACE_BY_CONTENT_KIND[id], `"${id}" has no surface row`).toBeDefined();
    }
  });

  it('keeps the two kind vocabularies disjoint, so isContentRef is a decision not a guess', () => {
    // `isContentRef` discriminates on kind membership alone. A spelling in both unions
    // would make it answer by accident, and the wrong generator would build the page.
    // Falsify: add 'agent' to CONTENT_OBJECT_KIND_IDS.
    const overlap = (CONTENT_OBJECT_KIND_IDS as readonly string[])
      .filter(id => (WORLD_REF_KINDS as readonly string[]).includes(id));
    expect(overlap, `kinds spelled into both vocabularies: ${overlap.join(', ')}`).toEqual([]);
    expect(isContentRef({ kind: 'item_template', id: 'x' })).toBe(true);
    expect(isContentRef({ kind: 'artifact', id: 'x' })).toBe(false);
  });

  it('gives every content kind the content card, and nothing else', () => {
    // A content object has one shape of page. A row claiming `card: 'item'` would send a
    // template through the graph generator, which has no node to give it.
    // Falsify: set item_template's card to 'item'.
    for (const id of CONTENT_OBJECT_KIND_IDS) {
      expect(SURFACE_BY_CONTENT_KIND[id].card, `"${id}" does not use the content card`).toBe('content');
    }
  });

  it('quotes a measured reason on every content kind that reaches no codex category', () => {
    // Falsify: drop the note from the omen_template row.
    for (const id of CONTENT_OBJECT_KIND_IDS) {
      const row = SURFACE_BY_CONTENT_KIND[id];
      if (row.sheet === null) {
        expect(row.note, `"${id}" has no sheet and does not say why`).toBeTruthy();
      } else {
        expect(row.sheet, `"${id}" names a sheet that is not the codex`).toBe('codex');
      }
    }
  });

  it('fills the content-object registry surface column from this one source', () => {
    // Not "the two agree" — they are the same object, because `K()` stamps it. This
    // asserts the derivation is actually wired rather than re-spelled on the rows.
    // Falsify: change the row constructor to take a literal `surface` again.
    for (const kind of CONTENT_OBJECT_KINDS) {
      expect(kind.surface).toBe(SURFACE_BY_CONTENT_KIND[kind.id]);
    }
  });

  it('never routes a content kind to a world sheet, nor a world kind to the codex', () => {
    // THR-1315's ruling, as a test: a *world* reference must never reach a reference page,
    // and content must never reach a world object's sheet.
    // Falsify: give `artifact` a `sheet: 'codex'`.
    for (const kind of WORLD_REF_KINDS) {
      expect(SURFACE_BY_WORLD_REF[kind].sheet, `world kind "${kind}" routes to the codex`).not.toBe('codex');
    }
    for (const id of CONTENT_OBJECT_KIND_IDS) {
      const sheet = SURFACE_BY_CONTENT_KIND[id].sheet;
      expect(sheet === null || sheet === 'codex', `content kind "${id}" routes to a world sheet`).toBe(true);
    }
  });
});
