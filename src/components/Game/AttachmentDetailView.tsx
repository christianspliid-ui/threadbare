import React from 'react';
import type { AttachmentTier, OnUseTrigger } from '../../types/attachments';
import { ATTACHMENT_TIER_COLORS, ATTACHMENT_TIER_NAMES } from '../../types/attachments';
import type { EntityHeader, EntitySection, TriggerEntry } from '../../types/entityDetail';
import { EntityCard } from '../shared/EntityCard';
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
  onUseTriggers?: OnUseTrigger[];
}

interface AttachmentDetailViewProps {
  attachment: AttachmentDetailData;
  onBack: () => void;
  onViewCodex?: () => void;
}

/** Format a trigger condition for display (critical_failure → Critical failure) */
function formatTriggerCondition(condition: string): string {
  return condition.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
}

/** Format trigger effect type into a human-readable summary */
function formatEffectSummary(trigger: OnUseTrigger): string {
  const parts: string[] = [];
  const eff = trigger.effect;
  const typeLabel = eff.type.replace(/_/g, ' ');
  parts.push(typeLabel);
  if (eff.ticksRemaining != null) {
    parts.push(`(${eff.ticksRemaining} ticks)`);
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

  const header: EntityHeader = {
    name: attachment.name,
    subtitle: `${tierName} \u00B7 ${attachment.subcategory.replace(/_/g, ' ')}`,
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

  // Flavor text
  if (attachment.flavorText) {
    sections.push({
      id: 'flavor',
      title: '',
      insightTier: 'stranger',
      proseVoice: 'oral',
      prose: attachment.flavorText,
    });
  }

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
  if (attachment.onUseTriggers && attachment.onUseTriggers.length > 0) {
    const triggerEntries: TriggerEntry[] = attachment.onUseTriggers.map(t => ({
      condition: formatTriggerCondition(t.triggerCondition),
      probability: t.probability,
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
      {/* Art slot: image or glyph fallback (rendered above EntityCard sections) */}
      {attachment.image ? (
        <div
          className="flex justify-center py-4"
          style={{ backgroundColor: 'var(--bg-deep)', borderBottom: '1px solid var(--border-subtle)' }}
        >
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
        </div>
      ) : (
        <div
          className="flex justify-center items-center py-4"
          style={{
            backgroundColor: 'var(--bg-deep)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <span style={{ fontSize: '3rem', color: `${tierColor}66`, lineHeight: 1 }}>
            {glyph}
          </span>
        </div>
      )}
      <EntityCard
        header={header}
        sections={sections}
        onBack={onBack}
        onViewCodex={onViewCodex ?? (() => {})}
      />
    </div>
  );
});
