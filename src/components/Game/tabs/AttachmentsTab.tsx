import type { AgentInfoCardData } from '../../../engine/agentDetail';
import type { AgentKnowledge } from '../../../types/agentKnowledge';
import { SectionHeading } from '../../shared/SectionHeading';
import { Tooltip } from '../../shared/Tooltip';
import { ProgressBar } from '../../shared/ProgressBar';
import { ATTACHMENT_TIER_COLORS, ATTACHMENT_TIER_NAMES } from '../../../types/attachments';
import type { AttachmentTier } from '../../../types/attachments';
import type { AttachmentFullEntry } from '../../../engine/agentAttachments';
import { getAttachmentGlyph } from '../attachmentGlyphs';
import { resolveAttachmentTooltip } from '../../../engine/attachmentTooltip';

interface AttachmentsTabProps {
  card: AgentInfoCardData;
  knowledge?: AgentKnowledge;
  onAttachmentClick?: (entry: AttachmentFullEntry) => void;
}

export function AttachmentsTab({ card, onAttachmentClick }: AttachmentsTabProps) {
  const possessions = card.possessions ?? [];
  const conditions = card.afflictions ?? [];
  const powers = (card.giftsAndBurdens ?? []).filter(g => g.subcategory === 'bestowed_power');
  const agreements = (card.giftsAndBurdens ?? []).filter(g => g.subcategory !== 'bestowed_power');

  const hasAny = possessions.length > 0 || conditions.length > 0 || powers.length > 0 || agreements.length > 0;

  const renderVignette = (entry: AttachmentFullEntry) => {
    const tierColor = ATTACHMENT_TIER_COLORS[entry.tier as AttachmentTier];
    const tierName = ATTACHMENT_TIER_NAMES[entry.tier as AttachmentTier];
    const glyph = getAttachmentGlyph(entry.subcategory);
    const tooltip = resolveAttachmentTooltip({
      name: entry.name,
      subcategory: entry.subcategory,
      tier: entry.tier as AttachmentTier,
      mechanicalSummary: entry.mechanicalSummary,
      lossCondition: entry.lossCondition,
      onUseTriggers: entry.onUseTriggers,
      ticksRemaining: entry.ticksRemaining,
      totalTicks: entry.totalTicks,
    });

    return (
      <div
        key={entry.id}
        className={onAttachmentClick ? 'cursor-pointer transition-opacity hover:opacity-80 py-2' : 'py-2'}
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
        onClick={() => onAttachmentClick?.(entry)}
        role={onAttachmentClick ? 'button' : undefined}
        tabIndex={onAttachmentClick ? 0 : undefined}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && onAttachmentClick) {
            e.preventDefault();
            onAttachmentClick(entry);
          }
        }}
      >
        <div className="flex items-center justify-between mb-1">
          <Tooltip label={tooltip.label} desc={tooltip.desc}>
            <span
              className="text-sm font-semibold underline decoration-transparent hover:decoration-current cursor-pointer"
              style={{ color: tierColor }}
            >
              {glyph} {entry.name}
            </span>
          </Tooltip>
          <span className="text-xs uppercase tracking-wider" style={{ color: `${tierColor}99` }}>
            {tierName}
          </span>
        </div>
        {entry.flavorText && (
          <p className="text-sm italic mb-1" style={{ color: 'var(--text-secondary)' }}>
            {entry.flavorText}
          </p>
        )}
        {entry.grantedBy && (
          <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>
            {entry.agreementType ? `Bound to ${entry.grantedBy}` : `Granted by ${entry.grantedBy}`}
          </p>
        )}
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {entry.mechanicalSummary}
          {entry.lossCondition ? ` \u00B7 ${entry.lossCondition}` : ''}
          {entry.tags.length > 0 ? ` \u00B7 ${entry.tags.join(', ')}` : ''}
        </p>
        {entry.ticksRemaining != null && entry.totalTicks != null && entry.totalTicks > 0 && (
          <div className="flex items-center gap-2 mt-1">
            <div style={{ width: '200px' }}>
              <ProgressBar
                progress={entry.ticksRemaining / entry.totalTicks}
                color={tierColor}
                className="h-1.5"
                glow={false}
              />
            </div>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {entry.ticksRemaining} ticks remaining
            </span>
          </div>
        )}
      </div>
    );
  };

  if (!hasAny) {
    return (
      <p className="text-sm italic" style={{ color: 'var(--text-tertiary)' }}>
        {card.name} carries no known possessions, conditions, powers, or agreements.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {possessions.length > 0 && (
        <section data-testid="attachments-tab-possessions">
          <SectionHeading as="h2">Possessions</SectionHeading>
          {possessions.map(renderVignette)}
        </section>
      )}

      {conditions.length > 0 && (
        <section data-testid="attachments-tab-conditions">
          <SectionHeading as="h2">Conditions</SectionHeading>
          {conditions.map(renderVignette)}
        </section>
      )}

      {powers.length > 0 && (
        <section data-testid="attachments-tab-powers">
          <SectionHeading as="h2">Bestowed Powers</SectionHeading>
          {powers.map(renderVignette)}
        </section>
      )}

      {agreements.length > 0 && (
        <section data-testid="attachments-tab-agreements">
          <SectionHeading as="h2">Agreements</SectionHeading>
          {agreements.map(renderVignette)}
        </section>
      )}
    </div>
  );
}
