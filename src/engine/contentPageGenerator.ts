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
 * **Three sections and a header, always in this order:**
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

import {
  CONTENT_FALLBACK_TEMPLATES,
  UNKNOWN_CONTENT_PROSE,
} from '../data/detail-page-fallback-templates';
import { SURFACE_BY_CONTENT_KIND } from '../data/surface-registry';
import { contentTagTooltipId, isContentTag } from '../data/content-tags';
import type { ChipDescriptor, DetailPage, Section } from '../types/detailPage';
import { DETAIL_FAILSOFT_STUB_SPHERE } from '../types/detailPage';
import type { ContentRef } from '../types/contentRef';
import { resolveContentEntry, type ContentEntryView } from './contentEntryResolver';

/**
 * Stable index into a fallback pool.
 *
 * A template's id is the only thing about it that never changes, so it is what the choice
 * hangs on. djb2 — short, well-spread over short ASCII strings, and the same one
 * `detailPageResolvers` uses for its own pools, so two fallbacks on one card do not
 * correlate by construction.
 */
function poolIndex(id: string, length: number): number {
  let hash = 5381;
  for (let i = 0; i < id.length; i += 1) hash = ((hash << 5) + hash + id.charCodeAt(i)) | 0;
  return Math.abs(hash) % Math.max(1, length);
}

function pick(pool: readonly string[], id: string): string {
  return pool[poolIndex(id, pool.length)];
}

function prose(typeId: string, label: string, gold: boolean, body: string, source: string): Section {
  return { kind: 'prose', typeId, label, gold, tier: 'routine', source, prose: body };
}

/**
 * A tag chip.
 *
 * The tooltip is attached only for a *seated* tag. An unseated spelling still renders —
 * a saved world or an un-migrated catalog may carry one, and dropping it would hide the
 * drift rather than show it — but it carries no tooltip, because `tooltipResolver` has
 * nothing to say about a word that is not in the vocabulary, and a hover that opens an
 * empty box is worse than no hover (Law 25).
 */
function tagChip(tag: string): ChipDescriptor {
  return {
    label: tag,
    ...(isContentTag(tag) ? { tooltipId: contentTagTooltipId(tag) } : {}),
  };
}

/** The page a reference to nothing gets. Says *never written*, never *gone*. */
export function unknownContentStub(ref: ContentRef, breadcrumbRoot: string[]): DetailPage {
  return {
    kind: 'content',
    nodeId: ref.id,
    trail: [...breadcrumbRoot, 'UNKNOWN'],
    kindLabel: 'CONTENT',
    displayName: ref.name ?? 'Unwritten',
    subtitle: 'no entry by that name',
    sphere: DETAIL_FAILSOFT_STUB_SPHERE,
    isShowcase: false,
    sections: [
      prose('unknown_stub', 'WHAT WE KNOW', false, UNKNOWN_CONTENT_PROSE, 'unknownContentStub'),
    ],
    hasFullSheet: false,
  };
}

export interface GenerateContentPageInput {
  readonly ref: ContentRef;
  /** Initial breadcrumb root, default `['THE LIBRARY']`. */
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
  const { ref, breadcrumbRoot = ['THE LIBRARY'], codexHasEntry = false } = input;

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
  const sections: Section[] = [];

  sections.push(
    prose(
      'what_it_is',
      'WHAT IT IS',
      true,
      entry.description || pick(CONTENT_FALLBACK_TEMPLATES.description_unwritten, ref.id),
      entry.description ? 'contentEntryResolver' : 'contentDescriptionFallback',
    ),
  );

  // Omitted rather than filled when absent: flavour is the one section a card can do
  // without, and a heading over a fallback apology is worse than no heading.
  if (entry.flavour) {
    sections.push(prose('its_voice', 'ITS VOICE', false, entry.flavour, 'contentEntryResolver'));
  }

  sections.push(
    entry.tags.length > 0
      ? {
          kind: 'chips',
          typeId: 'marks',
          label: 'MARKS',
          gold: false,
          tier: 'routine',
          source: 'contentEntryResolver',
          chips: entry.tags.map(tagChip),
        }
      : prose(
          'marks',
          'MARKS',
          false,
          pick(CONTENT_FALLBACK_TEMPLATES.tags_none, ref.id),
          'contentTagsFallback',
        ),
  );

  return {
    kind: 'content',
    nodeId: ref.id,
    trail: [...breadcrumbRoot, entry.name],
    kindLabel: entry.kindWord.toUpperCase(),
    displayName: entry.name,
    subtitle: entry.kindWord,
    // Content is not sphere-aligned as an object — a template *about* Stone is still a
    // template — so the header accent is the neutral one rather than a sphere guessed
    // from a tag. The tag chips say the sphere where the entry actually claims one.
    sphere: DETAIL_FAILSOFT_STUB_SPHERE,
    isShowcase: false,
    sections,
    hasFullSheet: row.sheet === 'codex' && codexHasEntry,
  };
}
