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
import { getAttachmentArtUrl } from '../../../data/artifact-category-art';
import { EntityVisual } from '../../shared/EntityVisual';
import { getUITooltip } from '../../../data/ui-content';
import { COMPANION_MAX } from '../../../data/companion-templates';
import type { CompanionEntry } from '../../../engine/companions';

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

/** Reach glyphs for a companion's always-on bonus — the same vocabulary the sheet uses elsewhere. */
function contributionLine(contributions: Record<string, number>): string {
  const parts = Object.entries(contributions)
    .filter(([, v]) => typeof v === 'number' && v !== 0)
    .sort(([, a], [, b]) => b - a)
    .map(([reach, v]) => `${v > 0 ? '+' : ''}${v} ${reach}`);
  return parts.length > 0 ? parts.join(' · ') : 'No bonus — just company.';
}

export function AttachmentsTab({ card, onAttachmentClick }: AttachmentsTabProps) {
  const companions = card.companions ?? [];
  const companionsTooltip = getUITooltip('ui.companions')
    ?? { label: 'Companions', desc: 'Those who travel with them.' };

  const renderCompanion = (companion: CompanionEntry) => (
    <div
      key={companion.id}
      className="flex gap-3 py-2 items-start"
      style={{ borderBottom: '1px solid var(--border-subtle)' }}
      data-testid={`companion-${companion.templateId}`}
    >
      <EntityVisual
        size="chip"
        entity={{ id: companion.id, kind: 'companion', name: companion.name }}
        aria-label={companion.name}
        title={companion.name}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {getAttachmentGlyph('companion')} {companion.name}
          </span>
          <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
            {companion.profession}
          </span>
        </div>
        <p className="text-sm italic mb-1" style={{ color: 'var(--text-secondary)' }}>
          {companion.goodFor}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {contributionLine(companion.domainContributions as Record<string, number>)}
        </p>
        {companion.ticksRemaining != null && companion.totalTicks != null && companion.totalTicks > 0 && (
          <div className="flex items-center gap-2 mt-1">
            <div style={{ width: '200px' }}>
              <ProgressBar
                progress={companion.ticksRemaining / companion.totalTicks}
                color="var(--text-secondary)"
                className="h-1.5"
                glow={false}
              />
            </div>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {'⏳'} {companion.ticksRemaining} ticks remaining
            </span>
          </div>
        )}
      </div>
    </div>
  );

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
      actionTriggers: entry.actionTriggers,
      ticksRemaining: entry.ticksRemaining,
      totalTicks: entry.totalTicks,
    });

    // Bespoke plate, else the plate for this item's category (THR-638).
    const artPath = getAttachmentArtUrl(entry.id, entry.subcategory);

    return (
      <div
        key={entry.id}
        className={`flex gap-3 ${onAttachmentClick ? 'cursor-pointer transition-opacity hover:opacity-80' : ''} py-2`}
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
        {artPath && (
          <div className="flex-shrink-0 overflow-hidden rounded" style={{ width: '50%' }}>
            <img
              src={artPath}
              alt=""
              aria-hidden="true"
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
              }}
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
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
      </div>
    );
  };

  if (!hasAny && companions.length === 0) {
    return (
      <p className="text-sm italic" style={{ color: 'var(--text-tertiary)' }}>
        {card.name} carries no known possessions, conditions, powers, or agreements,
        and travels alone.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Companions (THR-1096) — people, so they lead, and they are ungated. */}
      {companions.length > 0 && (
        <section data-testid="attachments-companions">
          <Tooltip label={companionsTooltip.label} desc={companionsTooltip.desc}>
            <SectionHeading as="h2">
              Companions ({companions.length}/{COMPANION_MAX})
            </SectionHeading>
          </Tooltip>
          {companions.map(renderCompanion)}
        </section>
      )}

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
