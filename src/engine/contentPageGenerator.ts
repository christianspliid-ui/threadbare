/**
 * `generateContentPage` — the card for a piece of authored content (THR-1491).
 *
 * **The sibling of `detailPageGenerator.ts`, and deliberately not part of it.** That
 * generator begins by asking the graph for a node and gives up when there is none, which
 * is exactly right for a thing in the world and exactly wrong for a template: a template
 * is a catalog entry that may never have been granted to anyone. Threading a
 * "sometimes there is no node" branch through a graph generator would put a second
 * resolution model inside the first. So the *page shape* is shared — the same `DetailPage`
 * payload, the same `Section` union, the same `DetailModal` renders it — and only the
 * resolution differs. `GraphPageKind` is the type that holds the line.
 *
 * **Three sections and a header, always in this order** — since THR-1876 these are the
 * `content` rows of the one page-layout table (`DETAIL_PAGE_REGISTRY.content`, resolvers in
 * `contentPageResolvers.ts`), composed by the shared `composeSections`:
 *
 * 1. `what_it_is` — the description, or the fallback pool when the entry authored none.
 * 2. `its_voice` — the flavour, omitted entirely when there is none (Law 25 applied to
 *    prose: an empty section is a heading that promises something).
 * 3. `marks` — the effective tags as chips, each with its `tag.*` tooltip (THR-1486).
 *    Rendered even when empty, with the "wears no marks" line, because *that a template
 *    is unreachable by query* is information rather than absence.
 *
 * **Deterministic** (NFP #3): the fallback pool index is `hash(id) % pool.length`, so the
 * same template shows the same line on every open and in every session. No PRNG is drawn.
 *
 * Plan: `Docs/plans/2026-09-12-thr-1482-one-card-one-router.md`
 */

import { UNKNOWN_CONTENT_PROSE } from '../data/detail-page-fallback-templates';
import { SURFACE_BY_CONTENT_KIND } from '../data/surface-registry';
import type { DetailPage } from '../types/detailPage';
import { DETAIL_FAILSOFT_STUB_SPHERE } from '../types/detailPage';
import type { ContentRef } from '../types/contentRef';
import type { WorldGraph } from './graph';
import { resolveContentEntry, type ContentEntryView } from './contentEntryResolver';
import { composeSections } from './detailPageGenerator';
import { contentProse } from './contentPageResolvers';

/** The page a reference to nothing gets. Says *never written*, never *gone*. */
export function unknownContentStub(ref: ContentRef, breadcrumbRoot: string[]): DetailPage {
  return {
    kind: 'content',
    nodeId: ref.id,
    trail: [...breadcrumbRoot, 'Unknown'],
    kindLabel: 'Content',
    displayName: ref.name ?? 'Unwritten',
    subtitle: 'no entry by that name',
    sphere: DETAIL_FAILSOFT_STUB_SPHERE,
    isShowcase: false,
    sections: [
      contentProse('unknown_stub', 'What we know', false, UNKNOWN_CONTENT_PROSE, 'unknownContentStub'),
    ],
    hasFullSheet: false,
  };
}

export interface GenerateContentPageInput {
  readonly ref: ContentRef;
  /** Initial breadcrumb root, default `['The library']`. */
  readonly breadcrumbRoot?: string[];
  /**
   * Whether the codex actually holds this entry.
   *
   * The registry row says whether the *kind* reaches the codex; this says whether *this
   * id* does, and only the caller (which can reach the codex catalog) knows. Both must be
   * true for the footer CTA to render — four of the six covered kinds are covered only
   * partially, so the row alone would draw an "open in codex ↗" that opens nothing for 56
   * undertaking templates. Law 25: a control that does nothing does not render.
   */
  readonly codexHasEntry?: boolean;
}

/**
 * Build the card for one content reference.
 *
 * Never throws and never returns null: an id in no catalog gets {@link unknownContentStub},
 * which is a real page saying a real thing (NFP #4).
 */
export function generateContentPage(input: GenerateContentPageInput): DetailPage {
  const { ref, breadcrumbRoot = ['The library'], codexHasEntry = false } = input;

  let entry: ContentEntryView | null;
  try {
    entry = resolveContentEntry(ref);
  } catch {
    // A malformed catalog entry must never unmount the app. The stub says the same true
    // thing an absent entry does: this reference reaches nothing renderable.
    entry = null;
  }
  if (!entry) return unknownContentStub(ref, breadcrumbRoot);

  const row = SURFACE_BY_CONTENT_KIND[ref.kind];
  // The content card reads no graph: its rows resolve from `contentRef` alone.
  const sections = composeSections('content', {
    nodeId: ref.id,
    pageKind: 'content',
    graph: null as unknown as WorldGraph,
    seed: 0,
    tick: 0,
    contentRef: ref,
  });

  return {
    kind: 'content',
    nodeId: ref.id,
    trail: [...breadcrumbRoot, entry.name],
    kindLabel: entry.kindWord.charAt(0).toUpperCase() + entry.kindWord.slice(1),
    displayName: entry.name,
    subtitle: entry.kindWord,
    // Content is not sphere-aligned as an object — a template *about* Stone is still a
    // template — so the header accent is the neutral one rather than a sphere guessed
    // from a tag. The tag chips say the sphere where the entry actually claims one.
    sphere: DETAIL_FAILSOFT_STUB_SPHERE,
    isShowcase: false,
    sections,
    hasFullSheet: row.sheet === 'codex' && codexHasEntry,
    // THR-1851 — the CTA opens this entry in the codex through the router.
    ...(row.sheet === 'codex' && codexHasEntry ? { sheetRef: ref } : {}),
  };
}
