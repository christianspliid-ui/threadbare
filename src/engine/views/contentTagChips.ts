/**
 * Content-tag chips (moved to the engine by THR-1910 so the Inspector's artifact `tags` row
 * reads the same builder) — one vocabulary for every sheet that shows a thing's tags
 * (THR-1486 shape, shared since THR-1521).
 *
 * `AttachmentDetailView` painted tags as vocabulary-backed chips (axis glyph, hover
 * through the tag's tooltip) while `ArtifactSheet` printed the raw word in a span —
 * two readings of one authored list. Both now build their chips here, so a tag reads
 * the same whichever sheet a player reaches it on (Law 27: one rule, one place).
 */

import type { ChipDescriptor } from '../../types/detailPage';
import { contentTagTooltipId, getContentTag } from '../../data/content-tags';

// The tag-axis glyphs (◇ ○ ◈ ✦ ●) are gone (THR-1906, plan THR-1879 § 9): the chip's word
// is the axis, and its hover names it.

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
      dataKey: { attribute: 'content-tag', value: tag },
    };
  });
}
