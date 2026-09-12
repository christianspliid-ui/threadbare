/**
 * `CONTENT_RESOLVERS` — reading one authored entry out of the catalogs, as a card shows it
 * (THR-1491, slice 2 of THR-1482).
 *
 * **What this file does *not* do.** It does not know where the catalogs are, it does not
 * load them, it does not decide which entries belong to which kind, and it does not
 * compute tags. All four already exist in `src/data/contentCatalogs.ts` (THR-1485/1486):
 * `entriesOfKind` materialises a kind's entries and narrows them by the registry's id
 * prefixes — which is what lets `encounter_template` and `action_template` share one
 * array — and `effectiveTags` unions the authored tags with the ones projected from typed
 * fields. Rebuilding any of that here would have been a second catalog layer with its own
 * drift, and would have *lost* the projected tags, since a reach is a field and not a tag
 * until that function makes it one.
 *
 * **What is left, and why it needs twelve functions.** Only the prose fields. Measured
 * across the twelve catalogs there is no shared spelling for them: an item is a graph-node
 * literal whose text lives in `properties`, an undertaking carries `displayName` and
 * `activityProse`, an ambition `displayName` and `selectionProse`, a companion has no name
 * field at all (`profession` is the word for the role) and arrives with a `joinSentence`, a
 * nudge card has a `title`, an omen a `tagline`. `id` is the only field all twelve share,
 * and `contentCatalogs.ts` says so in as many words. So the shape-knowledge sits here, one
 * small adapter per kind, in a record that is **total by type** — a kind seated in the
 * registry without one is a compile error, the same guarantee the surface registry gives.
 *
 * **This is not the content query (THR-1487).** That slice builds the indexed, tag-aware
 * query that lets any content hand out any other content by rule. This is the far smaller
 * thing a *card* needs: given a kind and a literal id, what is it called and what does it
 * say about itself.
 *
 * Plan: `Docs/plans/2026-09-12-thr-1482-one-card-one-router.md`
 */

import { CONTENT_OBJECT_KINDS } from '../data/content-objects';
import {
  effectiveTags,
  entriesOfKind,
  type ContentCatalogEntry,
} from '../data/contentCatalogs';
import type { ContentObjectKindId, ContentRef } from '../types/contentRef';

// ─── The view a card renders ─────────────────────────────────────────────────

/**
 * One authored entry, flattened to what a card shows.
 *
 * Deliberately five fields and no more. A content card is a *reference* page — it answers
 * "what is this called, what kind of thing is it, what does it do, what is it like, what
 * marks does it wear" — and every further field is the sheet's job, which is what the
 * codex overlay is for. Widening this shape is how a second section model starts.
 */
export interface ContentEntryView {
  /** What the entry is called, in the game's words. */
  readonly name: string;
  /** The kind's game word — "Encounter", "Undertaking", "Legendary artifact". */
  readonly kindWord: string;
  /** What it does or is, plain-register. Empty when the entry authored none. */
  readonly description: string;
  /** Its voice — flavour prose, a tagline, the sentence it arrives with. Empty when none. */
  readonly flavour: string;
  /** `effectiveTags` — authored ∪ projected, exactly what a query would match. */
  readonly tags: readonly string[];
}

/** The prose three fields of one entry. The only per-kind knowledge this file holds. */
type ProseAdapter = (entry: ContentCatalogEntry) => {
  name?: unknown;
  description?: unknown;
  flavour?: unknown;
};

// ─── Field readers ───────────────────────────────────────────────────────────

/** The game word for a kind, from the registry — one source, never re-spelled here. */
const GAME_WORD: Readonly<Record<string, string>> = Object.fromEntries(
  CONTENT_OBJECT_KINDS.map((k) => [k.id, k.gameWord]),
);

/** An entry's top-level fields, as an untyped bag. Twelve shapes, one accessor. */
function bag(entry: ContentCatalogEntry): Record<string, unknown> {
  return entry as unknown as Record<string, unknown>;
}

/** A `GraphNode`-shaped entry's property bag, where four of the kinds keep their prose. */
function props(entry: ContentCatalogEntry): Record<string, unknown> {
  return (entry.properties ?? {}) as Record<string, unknown>;
}

/**
 * A string, a first line of a prose *pool*, or empty.
 *
 * Several catalogs hold arrays of interchangeable lines rather than one sentence; a card
 * shows the first, because a card is a reference page and not a performance of the scene.
 */
function line(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return '';
}

// ─── The per-kind prose adapters ─────────────────────────────────────────────

/**
 * The attachment-catalog shape: a graph-node literal whose prose lives in `properties`.
 *
 * Three kinds share it (items, conditions, powers), which is why it is one adapter rather
 * than three. `mechanicalSummary` backs up `description` rather than being a field of its
 * own: where an entry authored no description it is the only sentence that says what the
 * thing does, and a card with no answer to "what does this do" is the failure worth
 * avoiding.
 */
const attachmentNode: ProseAdapter = (entry) => ({
  name: bag(entry).name,
  description: props(entry).description ?? props(entry).mechanicalSummary,
  flavour: props(entry).flavorText,
});

/**
 * One adapter per content kind. **Total by type.**
 *
 * The two kinds that share their catalogs are told apart by the *caller*, not here: the
 * ref carries the kind, the kind picks the adapter, and `entriesOfKind` has already
 * narrowed the pool by that kind's prefixes. Asking a template's id which of the two it is
 * would re-derive the prefix split the registry owns, and get it wrong for the three
 * prefixes that registry declares genuinely shared.
 */
export const CONTENT_PROSE_ADAPTERS: Readonly<Record<ContentObjectKindId, ProseAdapter>> = {
  encounter_template: (e) => ({
    name: bag(e).name,
    description: bag(e).description,
    // An encounter's voice is the first line of its own opening prose — the sentence a
    // mortal meets it with — rather than a separate flavour field it does not carry.
    flavour: (bag(e).narrativeTemplates as Record<string, unknown> | undefined)?.opening,
  }),

  action_template: (e) => ({
    name: bag(e).name,
    description: bag(e).description,
    flavour: bag(e).technicalEffect,
  }),

  undertaking_template: (e) => ({
    name: bag(e).displayName,
    // What the work *looks like* while it is happening is the closest thing an undertaking
    // has to an account of itself; it authors no description field.
    description: bag(e).activityProse,
    flavour: bag(e).completionProse,
  }),

  item_template: attachmentNode,
  condition_template: attachmentNode,

  power_template: (e) =>
    // Spells are the one power catalog that is flat rather than node-shaped.
    e.properties ? attachmentNode(e) : {
      name: bag(e).name,
      description: bag(e).mechanicalSummary,
      flavour: bag(e).flavorText,
    },

  legendary_template: (e) => ({
    name: bag(e).name,
    description: bag(e).mechanicalSummary,
    flavour: bag(e).flavorText,
  }),

  agreement_template: (e) => ({
    name: bag(e).name,
    // The terms *are* the agreement — there is nothing else it is.
    description: Array.isArray(bag(e).terms)
      ? (bag(e).terms as unknown[]).map(String).join(' · ')
      : bag(e).terms,
    flavour: bag(e).flavorText,
  }),

  companion_template: (e) => ({
    // A companion template has no `name`: the person is minted per world and the template
    // names the *role*. `profession` is the word the game uses for it.
    name: bag(e).profession,
    description: bag(e).goodFor,
    flavour: bag(e).joinSentence,
  }),

  ambition_template: (e) => ({
    name: bag(e).displayName,
    description: bag(e).selectionProse,
    flavour: bag(e).completionProse,
  }),

  omen_template: (e) => ({
    name: bag(e).name,
    description: bag(e).tagline,
    flavour: (bag(e).vocabulary as Record<string, unknown> | undefined)?.atmosphere,
  }),

  nudge_card: (e) => ({
    name: bag(e).title,
    description: bag(e).description,
    flavour: bag(e).flavorText,
  }),
};

// ─── The reader ──────────────────────────────────────────────────────────────

/** Looks one id up in a kind's catalogs. `null` means *not a member of this kind*. */
export type ContentEntryResolver = (id: string) => ContentEntryView | null;

function resolverFor(kind: ContentObjectKindId): ContentEntryResolver {
  return (id) => {
    const entry = entriesOfKind(kind).find((e) => e.id === id);
    if (!entry) return null;
    const prose = CONTENT_PROSE_ADAPTERS[kind](entry);
    return {
      name: line(prose.name) || id,
      kindWord: GAME_WORD[kind] ?? kind,
      description: line(prose.description),
      flavour: line(prose.flavour),
      tags: effectiveTags(kind, entry),
    };
  };
}

/**
 * One resolver per content kind. Total by type, derived from the adapters above so the two
 * records can never disagree about which kinds exist.
 */
export const CONTENT_RESOLVERS: Readonly<Record<ContentObjectKindId, ContentEntryResolver>> =
  Object.fromEntries(
    (Object.keys(CONTENT_PROSE_ADAPTERS) as ContentObjectKindId[]).map((k) => [k, resolverFor(k)]),
  ) as Readonly<Record<ContentObjectKindId, ContentEntryResolver>>;

/**
 * The entry a reference names, or `null` when no catalog of that kind holds the id.
 *
 * The one reader every content surface goes through. `null` is a real answer — the card
 * shows the unwritten stub, which says the reference was never right rather than saying
 * nothing (NFP #4).
 */
export function resolveContentEntry(ref: ContentRef): ContentEntryView | null {
  return CONTENT_RESOLVERS[ref.kind](ref.id);
}
