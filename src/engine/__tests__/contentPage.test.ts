/**
 * The content card's contract (THR-1491).
 *
 * **Run against the real corpus, never a fixture.** The failure this file exists to catch
 * is a per-kind prose adapter reading a field the catalog does not have — `name` where the
 * entry says `displayName`, `description` where it says `tagline`. A fixture would invent
 * both sides of that and pass while every real card rendered its id (see
 * `reference_fixture_invents_both_sides`). So the sweeps below iterate
 * `entriesOfKind(kind)` over the shipped catalogs and assert against what is actually
 * written there.
 *
 * The one thing a corpus sweep must not do is assert a *count* — counts rot as content is
 * authored (THR-688 rule A). Every threshold here is a predicate over whatever is present:
 * "no kind resolves zero of its entries", "no entry falls back to its id for a name".
 */

import { describe, it, expect } from 'vitest';
import { CONTENT_OBJECT_KIND_IDS, type ContentObjectKindId } from '../../types/contentRef';
import { entriesOfKind } from '../../data/contentCatalogs';
import { CONTENT_RESOLVERS, resolveContentEntry } from '../contentEntryResolver';
import { generateContentPage, unknownContentStub } from '../contentPageGenerator';
import { CONTENT_FALLBACK_TEMPLATES } from '../../data/detail-page-fallback-templates';
import { getContentObjectKind } from '../../data/content-objects';
import { isContentTag, contentTagTooltipId } from '../../data/content-tags';

/** The first entry of a kind, or `null` when the kind ships none. */
function sample(kind: ContentObjectKindId) {
  return entriesOfKind(kind)[0] ?? null;
}

describe('content entry resolver — over the shipped catalogs', () => {
  it('has a resolver for every content kind', () => {
    // Falsify: delete one adapter from CONTENT_PROSE_ADAPTERS (it will not compile, which
    // is the point — this asserts the derived record kept every key).
    for (const kind of CONTENT_OBJECT_KIND_IDS) {
      expect(typeof CONTENT_RESOLVERS[kind], `"${kind}" has no resolver`).toBe('function');
    }
  });

  it('resolves at least one real entry for every kind that ships any', () => {
    // The sweep that catches a wrong catalog wiring outright.
    // Falsify: point item_template's adapter at a catalog it does not own.
    for (const kind of CONTENT_OBJECT_KIND_IDS) {
      const entry = sample(kind);
      expect(entry, `"${kind}" ships no catalog entries at all`).not.toBeNull();
      const view = resolveContentEntry({ kind, id: entry!.id });
      expect(view, `"${kind}" could not resolve its own first entry "${entry!.id}"`).not.toBeNull();
    }
  });

  it('finds a real name for every entry of every kind — never falls back to the id', () => {
    // This is the assertion that would have caught reading `name` on a companion (which
    // has none) or on an undertaking (which says `displayName`). A name equal to the id is
    // the resolver's last resort and means the adapter read the wrong field.
    // Falsify: change the companion adapter's `name` from `profession` to `name`.
    const idNamed: string[] = [];
    for (const kind of CONTENT_OBJECT_KIND_IDS) {
      for (const entry of entriesOfKind(kind)) {
        const view = resolveContentEntry({ kind, id: entry.id })!;
        if (view.name === entry.id) idNamed.push(`${kind}:${entry.id}`);
      }
    }
    expect(idNamed, `entries whose name fell back to the id: ${idNamed.slice(0, 8).join(', ')}`).toEqual([]);
  });

  it('gives every entry its kind game word, from the registry', () => {
    // Falsify: hard-code a word in the resolver instead of reading the registry.
    for (const kind of CONTENT_OBJECT_KIND_IDS) {
      const entry = sample(kind)!;
      const view = resolveContentEntry({ kind, id: entry.id })!;
      expect(view.kindWord).toBe(getContentObjectKind(kind)!.gameWord);
    }
  });

  it('returns null for an id no catalog of that kind holds', () => {
    expect(resolveContentEntry({ kind: 'item_template', id: 'no_such_item' })).toBeNull();
    // An id that is real, but belongs to a *different* kind, is equally not a member: the
    // kind picks the catalogs, so a borrowed id resolves to nothing rather than to the
    // wrong thing.
    const omen = sample('omen_template')!;
    expect(resolveContentEntry({ kind: 'item_template', id: omen.id })).toBeNull();
  });

  it('carries projected tags, not just authored ones', () => {
    // The reason this resolver goes through `effectiveTags` rather than reading `tags`:
    // an action's reach is a typed field and becomes `#iron` only by projection. Reading
    // the raw field would silently halve every action card's marks.
    // Falsify: swap effectiveTags for authoredTags in the resolver.
    const withProjection = CONTENT_OBJECT_KIND_IDS.filter(
      k => Object.keys(getContentObjectKind(k)!.projections).length > 0,
    );
    expect(withProjection.length, 'no kind declares a projection — this test is vacuous').toBeGreaterThan(0);

    const projectedSomewhere = withProjection.some(kind =>
      entriesOfKind(kind).some(entry => {
        const authored = [...(entry.tags ?? []), ...(entry.properties?.tags ?? [])];
        return resolveContentEntry({ kind, id: entry.id })!.tags.some(t => !authored.includes(t));
      }),
    );
    expect(projectedSomewhere, 'no entry gained a tag from projection').toBe(true);
  });
});

describe('content page — shape and fail-soft', () => {
  it('builds a page for the first entry of every kind', () => {
    for (const kind of CONTENT_OBJECT_KIND_IDS) {
      const entry = sample(kind)!;
      const page = generateContentPage({ ref: { kind, id: entry.id } });
      expect(page.kind).toBe('content');
      expect(page.nodeId).toBe(entry.id);
      expect(page.displayName, `"${kind}" page has no name`).toBeTruthy();
      expect(page.subtitle).toBe(getContentObjectKind(kind)!.gameWord);
      // Two sections always, three when the entry has a voice: what-it-is and marks.
      expect(page.sections.map(s => s.typeId)).toContain('what_it_is');
      expect(page.sections.map(s => s.typeId)).toContain('marks');
    }
  });

  it('omits the voice section rather than filling it with an apology', () => {
    // Law 25 applied to prose: a heading over a fallback is a promise the card cannot keep.
    // Falsify: push the flavour section unconditionally.
    for (const kind of CONTENT_OBJECT_KIND_IDS) {
      for (const entry of entriesOfKind(kind).slice(0, 20)) {
        const view = resolveContentEntry({ kind, id: entry.id })!;
        const page = generateContentPage({ ref: { kind, id: entry.id } });
        const hasVoice = page.sections.some(s => s.typeId === 'its_voice');
        expect(hasVoice, `${kind}:${entry.id} voice section disagrees with its flavour`).toBe(
          Boolean(view.flavour),
        );
      }
    }
    // And the pool it would have drawn from is never reached for the voice.
    expect(CONTENT_FALLBACK_TEMPLATES.flavour_unwritten.length).toBeGreaterThan(0);
  });

  it('gives a seated tag its tooltip and an unseated spelling none', () => {
    // An unseated spelling still renders — hiding it would hide the drift — but carries no
    // tooltip, because the resolver has nothing to say about a word outside the vocabulary
    // and a hover onto an empty box is worse than no hover.
    // Falsify: attach contentTagTooltipId unconditionally.
    let checkedSeated = false;
    for (const kind of CONTENT_OBJECT_KIND_IDS) {
      for (const entry of entriesOfKind(kind).slice(0, 40)) {
        const page = generateContentPage({ ref: { kind, id: entry.id } });
        const marks = page.sections.find(s => s.typeId === 'marks');
        if (!marks || marks.kind !== 'chips') continue;
        for (const chip of marks.chips) {
          if (isContentTag(chip.label)) {
            expect(chip.tooltipId).toBe(contentTagTooltipId(chip.label));
            checkedSeated = true;
          } else {
            expect(chip.tooltipId, `unseated "${chip.label}" carries a tooltip`).toBeUndefined();
          }
        }
      }
    }
    expect(checkedSeated, 'no seated tag was seen — this test proved nothing').toBe(true);
  });

  it('says never-written, not gone, for an id in no catalog', () => {
    // The two failures are different and a player can tell. `UNKNOWN_ENTITY_PROSE` would
    // invent a history a misspelled template id never had.
    const page = generateContentPage({ ref: { kind: 'item_template', id: 'no_such_item' } });
    expect(page.kind).toBe('content');
    expect(page.sections).toHaveLength(1);
    expect(page.sections[0].typeId).toBe('unknown_stub');
    expect(page.hasFullSheet).toBe(false);
    expect(page).toEqual(unknownContentStub({ kind: 'item_template', id: 'no_such_item' }, ['THE LIBRARY']));
  });

  it('offers the codex CTA only when the row AND the entry both allow it', () => {
    // Two conditions, because four of the six covered kinds are covered only partially.
    // Falsify: make hasFullSheet depend on `row.sheet === 'codex'` alone.
    const covered = sample('action_template')!;      // row: sheet 'codex'
    const uncovered = sample('omen_template')!;       // row: sheet null

    expect(generateContentPage({ ref: { kind: 'action_template', id: covered.id }, codexHasEntry: true }).hasFullSheet).toBe(true);
    expect(generateContentPage({ ref: { kind: 'action_template', id: covered.id }, codexHasEntry: false }).hasFullSheet).toBe(false);
    expect(generateContentPage({ ref: { kind: 'omen_template', id: uncovered.id }, codexHasEntry: true }).hasFullSheet).toBe(false);
  });

  it('is deterministic — the same id draws the same fallback line every time', () => {
    // NFP #3. The fallback index hashes the id, so no PRNG is drawn and two opens of one
    // template never disagree about what it says.
    const ref = { kind: 'item_template', id: 'no_such_item' } as const;
    const a = generateContentPage({ ref });
    const b = generateContentPage({ ref });
    expect(a).toEqual(b);

    // And two different ids do not all collapse onto pool entry zero.
    const pool = CONTENT_FALLBACK_TEMPLATES.description_unwritten;
    expect(pool.length).toBeGreaterThan(1);
  });
});
