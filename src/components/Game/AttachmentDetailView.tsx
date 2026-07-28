import React from 'react';
import type { AttachmentTier } from '../../types/attachments';
import { ATTACHMENT_TIER_COLORS, ATTACHMENT_TIER_NAMES } from '../../types/attachments';
import type { ActionTriggerEffect } from '../../types/effects';
import { ACTION_TRIGGER_DEFAULT_PROBABILITY } from '../../data/effect-constants';
import type { EntityHeader, EntitySection, TriggerEntry } from '../../types/entityDetail';
import { EntityCard } from '../shared/EntityCard';
import { Medallion } from '../shared/Medallion';
import { FlavorQuote } from '../shared/FlavorQuote';
import { pickFallbackFlavor } from '../../data/reveal-content';
import { getAttachmentGlyph } from './attachmentGlyphs';

export interface AttachmentDetailData {
  id: string;
  name: string;
  subcategory: string;
  tier: AttachmentTier;
  mechanicalSummary: string;
  flavorText?: string;
  tags: string[];
  lossCondition?: string;
  grantedBy?: string;
  agreementType?: string;
  source?: string;
  image?: string;
  ticksRemaining?: number | null;
  totalTicks?: number;
  /** On-use behavior read from `action_trigger` effects (THR-719, was `onUseTriggers`). */
  actionTriggers?: readonly ActionTriggerEffect[];
}

interface AttachmentDetailViewProps {
  attachment: AttachmentDetailData;
  onBack: () => void;
  onViewCodex?: () => void;
}

/** Player-facing names for the events a trigger fires on (THR-719). */
const TRIGGER_EVENT_LABELS: Record<string, string> = {
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
function formatTriggerEvent(event: string): string {
  return TRIGGER_EVENT_LABELS[event]
    ?? event.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
}

/** Format a trigger payload into a human-readable summary */
function formatEffectSummary(trigger: ActionTriggerEffect): string {
  const parts: string[] = [];
  const payload = trigger.payload;
  parts.push(payload.kind.replace(/_/g, ' '));
  if (payload.kind === 'condition_grant' && payload.durationTicks != null) {
    parts.push(`(${payload.durationTicks} ticks)`);
  }
  if (trigger.maxFires !== undefined) {
    parts.push(trigger.maxFires === 1 ? '(once)' : `(${trigger.maxFires}x)`);
  }
  return parts.join(' ');
}

export const AttachmentDetailView = React.memo(function AttachmentDetailView({
  attachment,
  onBack,
  onViewCodex,
}: AttachmentDetailViewProps) {
  const tierColor = ATTACHMENT_TIER_COLORS[attachment.tier];
  const tierName = ATTACHMENT_TIER_NAMES[attachment.tier];
  const glyph = getAttachmentGlyph(attachment.subcategory);

  const kindLine = `${tierName} \u00B7 ${attachment.subcategory.replace(/_/g, ' ')}`;

  // The tier/kind line moved into the ceremonial banner below (THR-799), so the
  // EntityCard header no longer repeats it as a subtitle \u2014 the name lives in the
  // header, the kind in the banner, each said once.
  const header: EntityHeader = {
    name: attachment.name,
    accentColor: tierColor,
  };

  const sections: EntitySection[] = [];

  // Art slot / glyph fallback
  if (attachment.image) {
    sections.push({
      id: 'art',
      title: '',
      insightTier: 'stranger',
      proseVoice: 'chronicle',
      prose: '',
      structuredData: undefined,
    });
  }

  // Flavor text is no longer an EntityCard section — THR-799 promotes it into the
  // ceremonial header's FlavorQuote well, above the mechanical effect line
  // (narrative before mechanics). Falls back to the generic per-kind line only
  // when the attachment carries no prose of its own.
  const flavorLine = attachment.flavorText || pickFallbackFlavor('attachment', attachment.id);

  // Effect (always)
  const effectProse = [
    attachment.mechanicalSummary,
    attachment.lossCondition ? `Loss: ${attachment.lossCondition}` : null,
    attachment.grantedBy ? `Granted by ${attachment.grantedBy}` : null,
    attachment.agreementType ? `Type: ${attachment.agreementType}` : null,
  ].filter(Boolean).join('\n');

  sections.push({
    id: 'effect',
    title: 'Effect',
    insightTier: 'stranger',
    proseVoice: 'chronicle',
    prose: effectProse,
  });

  // Duration (transient only)
  if (attachment.ticksRemaining != null && attachment.totalTicks) {
    sections.push({
      id: 'duration',
      title: 'Duration',
      insightTier: 'stranger',
      proseVoice: 'chronicle',
      prose: `${attachment.ticksRemaining} / ${attachment.totalTicks} ticks`,
    });
  }

  // Tags (always if present)
  if (attachment.tags.length > 0) {
    sections.push({
      id: 'tags',
      title: 'Tags',
      insightTier: 'stranger',
      proseVoice: 'chronicle',
      prose: '',
      structuredData: {
        type: 'keyword_cloud',
        keywords: attachment.tags,
        accent: tierColor,
      },
    });
  }

  // Triggers (conditional)
  if (attachment.actionTriggers && attachment.actionTriggers.length > 0) {
    const triggerEntries: TriggerEntry[] = attachment.actionTriggers.map(t => ({
      condition: formatTriggerEvent(t.on),
      probability: typeof t.probability === 'number' && Number.isFinite(t.probability)
        ? t.probability
        : ACTION_TRIGGER_DEFAULT_PROBABILITY,
      narrativeTemplate: t.narrativeTemplate || undefined,
      effectSummary: formatEffectSummary(t),
    }));

    sections.push({
      id: 'triggers',
      title: 'Triggers',
      insightTier: 'stranger',
      proseVoice: 'chronicle',
      prose: '',
      structuredData: {
        type: 'trigger',
        triggers: triggerEntries,
      },
    });
  }

  // Source (conditional)
  if (attachment.source) {
    sections.push({
      id: 'source',
      title: 'Source',
      insightTier: 'stranger',
      proseVoice: 'chronicle',
      prose: attachment.source,
    });
  }

  return (
    <div data-testid="attachment-detail-view">
      {/* Ceremonial header (THR-799): art or glyph medallion → name/tier banner →
          flavor well. Layout only — every value shown is one the view already read.
          When real art exists it keeps its full art slot rather than being clipped
          down to a 64px disc; the medallion is the glyph fallback's treatment. */}
      <div
        className="flex flex-col items-center gap-3 px-4 py-4"
        style={{ backgroundColor: 'var(--bg-deep)', borderBottom: '1px solid var(--border-subtle)' }}
      >
        {attachment.image ? (
          <img
            src={attachment.image}
            alt={attachment.name}
            loading="lazy"
            style={{
              maxWidth: '200px',
              maxHeight: '200px',
              objectFit: 'contain',
              borderRadius: '4px',
            }}
          />
        ) : (
          <Medallion size="md" accentColor={tierColor} title={`${tierName} ${attachment.subcategory.replace(/_/g, ' ')}`}>
            <span style={{ color: tierColor, lineHeight: 1 }}>{glyph}</span>
          </Medallion>
        )}

        <div
          className="inset-well w-full"
          style={{
            padding: 'var(--space-2) var(--space-4)',
            textAlign: 'center',
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-sm)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
          }}
        >
          {kindLine}
        </div>

        <FlavorQuote style={{ width: '100%' }}>{flavorLine}</FlavorQuote>
      </div>
      <EntityCard
        header={header}
        sections={sections}
        onBack={onBack}
        onViewCodex={onViewCodex ?? (() => {})}
      />
    </div>
  );
});
