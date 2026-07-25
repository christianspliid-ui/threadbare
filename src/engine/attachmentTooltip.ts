/**
 * Attachment Tooltip Resolver
 *
 * Formats attachment data into tooltip content for the Tooltip component.
 * Used by AttachmentRow (sidebar) and prose vignettes (modal).
 */

import type { AttachmentTier } from '../types/attachments';
import { ATTACHMENT_TIER_NAMES } from '../types/attachments';
import type { ActionTriggerEffect, ActionTriggerEvent } from '../types/effects';
import { ACTION_TRIGGER_DEFAULT_PROBABILITY } from '../data/effect-constants';
import { getAttachmentGlyph } from '../components/Game/attachmentGlyphs';

export interface AttachmentTooltipData {
  name: string;
  subcategory: string;
  tier: AttachmentTier;
  mechanicalSummary: string;
  ticksRemaining?: number | null;
  totalTicks?: number;
  lossCondition?: string;
  /**
   * On-use behavior, read from the item's `action_trigger` effects (THR-719).
   * Was `onUseTriggers`, a field the engine never fired — the tooltip promised
   * behavior that did not exist. These entries are the ones that actually run.
   */
  actionTriggers?: readonly ActionTriggerEffect[];
}

/** Player-facing names for the events a trigger can fire on. */
const TRIGGER_EVENT_LABELS: Record<ActionTriggerEvent, string> = {
  encounter_critical_success: 'Critical success',
  encounter_success: 'Success',
  encounter_at_cost: 'Success at cost',
  encounter_failure: 'Failure',
  encounter_critical_failure: 'Critical failure',
  action_complete: 'Any use',
  movement_complete: 'Arrival',
  rest: 'Rest',
  spell_cast: 'Spell cast',
};

/** Format a trigger event for display (encounter_critical_failure → Critical failure) */
function formatTriggerEvent(event: ActionTriggerEvent): string {
  return TRIGGER_EVENT_LABELS[event]
    // Fail-soft for an event added to the union without a label here.
    ?? String(event).replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
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
  if (attachment.actionTriggers && attachment.actionTriggers.length > 0) {
    const probabilityOf = (t: ActionTriggerEffect): number =>
      typeof t.probability === 'number' && Number.isFinite(t.probability)
        ? t.probability
        : ACTION_TRIGGER_DEFAULT_PROBABILITY;
    const topTrigger = [...attachment.actionTriggers]
      .sort((a, b) => probabilityOf(b) - probabilityOf(a))[0];
    const pct = Math.round(probabilityOf(topTrigger) * 100);
    const condition = formatTriggerEvent(topTrigger.on);
    lines.push(`⚡ ${pct}% chance: ${condition}`);
  }

  return {
    label: `${label} [${tierName}]`,
    desc: lines.join('\n'),
  };
}
