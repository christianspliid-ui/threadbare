/**
 * Content-tag chips — one vocabulary for every sheet that shows a thing's tags
 * (THR-1486 shape, shared since THR-1521).
 *
 * `AttachmentDetailView` painted tags as vocabulary-backed chips (axis glyph, hover
 * through the tag's tooltip) while `ArtifactSheet` printed the raw word in a span —
 * two readings of one authored list. Both now build their chips here, so a tag reads
 * the same whichever sheet a player reaches it on (Law 27: one rule, one place).
 */

import type { ChipDescriptor } from '../../types/detailPage';
import { contentTagTooltipId, getContentTag, type ContentTagAxis } from '../../data/content-tags';

/**
 * One glyph per axis, so a chip's *kind* reads before its word does — the same
 * vocabulary the codex filter row paints (THR-1486).
 */
export const TAG_AXIS_GLYPH: Readonly<Record<ContentTagAxis, string>> = {
  form: '◇',     // ◇ — what the thing is
  family: '○',   // ○ — what class it belongs to
  reach: '◈',    // ◈ — the cosmology's doing axis
  sphere: '✦',   // ✦ — the cosmology's fuelling axis
  polarity: '●', // ● — good or ill to carry
};

/** Axis glyph for a tag the vocabulary no longer knows — a chip without one reads as broken. */
export const TAG_GLYPH_FALLBACK = '◈';

/**
 * Chips for an authored tag list. A spelling the vocabulary no longer knows still
 * renders, without a hover, because an entry whose only description is a retired word
 * should not become wordless (Law 14 / Law 17).
 */
export function contentTagChips(tags: readonly string[]): ChipDescriptor[] {
  return tags.map(tag => {
    const def = getContentTag(tag);
    const bare = (tag.startsWith('#') ? tag.slice(1) : tag).replace(/_/g, ' ');
    return {
      label: bare,
      tooltipId: def ? contentTagTooltipId(def.tag) : undefined,
      glyph: def ? TAG_AXIS_GLYPH[def.axis] : TAG_GLYPH_FALLBACK,
      dataKey: { attribute: 'content-tag', value: tag },
    };
  });
}
