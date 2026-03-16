/**
 * Attachment Tooltip Resolver
 *
 * Formats attachment data into tooltip content for the Tooltip component.
 * Used by AttachmentRow (sidebar) and prose vignettes (modal).
 */

import type { AttachmentTier, OnUseTrigger } from '../types/attachments';
import { ATTACHMENT_TIER_NAMES } from '../types/attachments';
import { getAttachmentGlyph } from '../components/Game/attachmentGlyphs';

export interface AttachmentTooltipData {
  name: string;
  subcategory: string;
  tier: AttachmentTier;
  mechanicalSummary: string;
  ticksRemaining?: number | null;
  totalTicks?: number;
  lossCondition?: string;
  onUseTriggers?: OnUseTrigger[];
}

/** Format a trigger condition for display (critical_failure → Critical failure) */
function formatTriggerCondition(condition: string): string {
  return condition.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
}

/**
 * Resolve attachment data into tooltip label + description.
 * Used by the Tooltip component's label/desc props.
 */
export function resolveAttachmentTooltip(
  attachment: AttachmentTooltipData,
): { label: string; desc: string } {
  const glyph = getAttachmentGlyph(attachment.subcategory);
  const tierName = ATTACHMENT_TIER_NAMES[attachment.tier];

  const label = `${glyph} ${attachment.name}`;

  const lines: string[] = [attachment.mechanicalSummary];

  if (attachment.lossCondition) {
    lines.push(`Loss: ${attachment.lossCondition}`);
  }

  if (attachment.ticksRemaining != null && attachment.totalTicks) {
    lines.push(`${attachment.ticksRemaining} / ${attachment.totalTicks} ticks remaining`);
  }

  // Show the most dramatic trigger (highest probability)
  if (attachment.onUseTriggers && attachment.onUseTriggers.length > 0) {
    const topTrigger = [...attachment.onUseTriggers]
      .sort((a, b) => b.probability - a.probability)[0];
    const pct = Math.round(topTrigger.probability * 100);
    const condition = formatTriggerCondition(topTrigger.triggerCondition);
    lines.push(`\u26A1 ${pct}% chance: ${condition}`);
  }

  return {
    label: `${label} [${tierName}]`,
    desc: lines.join('\n'),
  };
}
