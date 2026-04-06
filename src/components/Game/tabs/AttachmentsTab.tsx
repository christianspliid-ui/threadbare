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
import { SLOT_CAPS, CONDITION_CAPS, SLOT_TAG_DISPLAY_NAMES } from '../../../data/attachment-slot-constants';

interface AttachmentsTabProps {
  card: AgentInfoCardData;
  knowledge?: AgentKnowledge;
  onAttachmentClick?: (entry: AttachmentFullEntry) => void;
}

/** Ordered slot groups for display. Quest items first, then possessions, conditions, agreements. */
const SLOT_GROUP_ORDER = [
  'quest',
  'weapon', 'vestment', 'ring', 'necklace', 'tome', 'spell',
  'consumable', 'utility', 'mount', 'ally', 'companion', 'wealth', 'brand',
  'wound', 'disease', 'curse', 'blessing', 'bestowed',
  'agreement',
];

function getSlotCap(slotTag: string): number | undefined {
  return SLOT_CAPS[slotTag] ?? CONDITION_CAPS[slotTag];
}

export function AttachmentsTab({ card, onAttachmentClick }: AttachmentsTabProps) {
  const possessions = card.possessions ?? [];
  const conditions = card.afflictions ?? [];
  const powers = (card.giftsAndBurdens ?? []).filter(g => g.subcategory === 'bestowed_power');
  const agreements = (card.giftsAndBurdens ?? []).filter(g => g.subcategory !== 'bestowed_power');

  // Merge all attachments into a flat list
  const allItems: AttachmentFullEntry[] = [...possessions, ...conditions, ...powers, ...agreements];
  const hasAny = allItems.length > 0;

  // Separate active and inactive items
  const activeItems = allItems.filter(e => e.active !== false);
  const inactiveItems = allItems.filter(e => e.active === false);

  // Group active items by slot tag
  const slotGroups = new Map<string, AttachmentFullEntry[]>();
  for (const item of activeItems) {
    const tag = item.slotTag ?? item.subcategory ?? 'uncategorized';
    const group = slotGroups.get(tag) ?? [];
    group.push(item);
    slotGroups.set(tag, group);
  }

  const renderVignette = (entry: AttachmentFullEntry, isMuted = false) => {
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
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          opacity: isMuted ? 0.5 : 1,
        }}
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
              style={{ color: isMuted ? 'var(--text-tertiary)' : tierColor }}
            >
              {glyph} {entry.name}
            </span>
          </Tooltip>
          <span className="text-xs uppercase tracking-wider" style={{ color: `${tierColor}99` }}>
            {tierName}
            {entry.isPinned && ' (pinned)'}
          </span>
        </div>
        {entry.flavorText && (
          <p className="text-sm italic mb-1" style={{ color: 'var(--text-secondary)' }}>
            {entry.flavorText}
          </p>
        )}
        {entry.counterpartyName && (
          <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>
            {entry.agreementType ? `Bound to ${entry.counterpartyName}` : `With ${entry.counterpartyName}`}
          </p>
        )}
        {!entry.counterpartyName && entry.grantedBy && (
          <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>
            {entry.agreementType ? `Bound to ${entry.grantedBy}` : `Granted by ${entry.grantedBy}`}
          </p>
        )}
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {entry.mechanicalSummary}
          {entry.lossCondition ? ` \u00B7 ${entry.lossCondition}` : ''}
          {entry.tags.length > 0 ? ` \u00B7 ${entry.tags.join(', ')}` : ''}
        </p>
        {isMuted && entry.inactiveReason && (
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Inactive: {entry.inactiveReason}
          </p>
        )}
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
      {/* Grouped slot sections */}
      {SLOT_GROUP_ORDER.map(slotTag => {
        const items = slotGroups.get(slotTag);
        if (!items || items.length === 0) return null;

        const cap = getSlotCap(slotTag);
        const displayName = SLOT_TAG_DISPLAY_NAMES[slotTag] ?? slotTag;
        const countLabel = cap != null ? ` (${items.length}/${cap})` : '';

        return (
          <section key={slotTag} data-testid={`attachments-slot-${slotTag}`}>
            <SectionHeading as="h2">{displayName}{countLabel}</SectionHeading>
            {items.map(item => renderVignette(item))}
          </section>
        );
      })}

      {/* Uncategorized items (slotTag not in SLOT_GROUP_ORDER) */}
      {Array.from(slotGroups.entries())
        .filter(([tag]) => !SLOT_GROUP_ORDER.includes(tag))
        .map(([tag, items]) => (
          <section key={tag} data-testid={`attachments-slot-${tag}`}>
            <SectionHeading as="h2">{SLOT_TAG_DISPLAY_NAMES[tag] ?? tag}</SectionHeading>
            {items.map(item => renderVignette(item))}
          </section>
        ))}

      {/* Inactive section */}
      {inactiveItems.length > 0 && (
        <section data-testid="attachments-inactive">
          <SectionHeading as="h2">Inactive</SectionHeading>
          {inactiveItems.map(item => renderVignette(item, true))}
        </section>
      )}
    </div>
  );
}
