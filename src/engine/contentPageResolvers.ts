/**
 * The content card's rows (THR-1876 § D7.7) — `generateContentPage`'s three sections,
 * now rows of the one page-layout table (`DETAIL_PAGE_REGISTRY.content`).
 *
 * Output unchanged from THR-1491: the description or its fallback pool, the flavour when
 * there is one, and the marks (or the "wears no marks" line). Each resolver reads
 * `ctx.contentRef`; without one it returns null.
 */
import { CONTENT_FALLBACK_TEMPLATES } from '../data/detail-page-fallback-templates';
import { contentTagTooltipId, isContentTag } from '../data/content-tags';
import type { ChipDescriptor, Section } from '../types/detailPage';
import { resolveContentEntry, type ContentEntryView } from './contentEntryResolver';
import type { SectionResolver, SectionResolverContext } from './detailPageResolvers';
import { attachmentTemplateOf } from './views/subjects/itemRows';
import { pickFallbackFlavor } from '../data/reveal-content';
import { contentTagChips } from './views/contentTagChips';

/** Stable index into a fallback pool: `hash(id) % length` (no PRNG drawn). */
function poolIndex(id: string, length: number): number {
  let hash = 5381;
  for (let i = 0; i < id.length; i += 1) hash = ((hash << 5) + hash + id.charCodeAt(i)) | 0;
  return Math.abs(hash) % Math.max(1, length);
}

export function pickContentFallback(pool: readonly string[], id: string): string {
  return pool[poolIndex(id, pool.length)];
}

export function contentProse(typeId: string, label: string, gold: boolean, body: string, source: string): Section {
  return { kind: 'prose', typeId, label, gold, tier: 'routine', source, prose: body };
}

/** A tag chip: its word, and its `tag.*` tooltip when the tag is in the registry. */
export function contentTagChip(tag: string): ChipDescriptor {
  return {
    label: tag,
    ...(isContentTag(tag) ? { tooltipId: contentTagTooltipId(tag) } : {}),
  };
}

/**
 * THR-1910: an attachment ref names a template node, not a catalog entry — the card reads
 * what the template says of itself (description, flavour or the per-kind fallback the
 * attachment sheet drew, tags), so an attachment page composes through these rows too.
 */
function attachmentEntryOf(ctx: SectionResolverContext): ContentEntryView | null {
  const node = attachmentTemplateOf(ctx);
  if (!node) return null;
  const p = node.properties;
  return {
    name: node.name,
    kindWord: '',
    description: typeof p.description === 'string' ? p.description : '',
    flavour: (typeof p.flavorText === 'string' && p.flavorText) || pickFallbackFlavor('attachment', node.id) || '',
    tags: Array.isArray(p.tags) ? (p.tags as unknown[]).filter((t): t is string => typeof t === 'string') : [],
  };
}

/** The id a fallback pool is keyed on: the content ref, else the attachment template. */
function poolId(ctx: SectionResolverContext): string {
  return ctx.contentRef?.id ?? ctx.nodeId;
}

function entryOf(ctx: SectionResolverContext): ContentEntryView | null {
  if (!ctx.contentRef) return attachmentEntryOf(ctx);
  try {
    return resolveContentEntry(ctx.contentRef);
  } catch {
    return null;
  }
}

const whatItIsResolver: SectionResolver = (ctx) => {
  const entry = entryOf(ctx);
  if (!entry) return null;
  return contentProse(
    'what_it_is',
    'What it is',
    true,
    entry.description || pickContentFallback(CONTENT_FALLBACK_TEMPLATES.description_unwritten, poolId(ctx)),
    entry.description ? 'contentEntryResolver' : 'contentDescriptionFallback',
  );
};

// Omitted rather than filled when absent: flavour is the one section a card can do
// without, and a heading over a fallback apology is worse than no heading.
const itsVoiceResolver: SectionResolver = (ctx) => {
  const entry = entryOf(ctx);
  if (!entry?.flavour) return null;
  return contentProse('its_voice', 'Its voice', false, entry.flavour, 'contentEntryResolver');
};

const marksResolver: SectionResolver = (ctx) => {
  const entry = entryOf(ctx);
  if (!entry) return null;
  if (entry.tags.length > 0) {
    return {
      kind: 'chips',
      typeId: 'marks',
      label: 'Marks',
      gold: false,
      tier: 'routine',
      source: 'contentEntryResolver',
      // An attachment's tags read in the attachment sheet's chip words (THR-1486); a content
      // card keeps its own (THR-1491).
      chips: ctx.contentRef ? entry.tags.map(contentTagChip) : contentTagChips(entry.tags),
    };
  }
  return contentProse('marks', 'Marks', false, pickContentFallback(CONTENT_FALLBACK_TEMPLATES.tags_none, poolId(ctx)), 'contentTagsFallback');
};

export const CONTENT_RESOLVERS_BY_ROW = {
  what_it_is: whatItIsResolver,
  its_voice: itsVoiceResolver,
  marks: marksResolver,
} as const;
