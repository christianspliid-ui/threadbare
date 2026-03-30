import type { AgentInfoCardData } from '../../../engine/agentDetail';
import type { AgentKnowledge } from '../../../types/agentKnowledge';
import {
  POSSESSION_ACTIVITY_TICKS,
  POSSESSION_PROVISIONS_TICKS,
} from '../../../types/agentKnowledge';
import type { ReachDomain } from '../../../types/traits';
import { SectionHeading } from '../../shared/SectionHeading';
import { Tooltip } from '../../shared/Tooltip';
import { ProgressBar } from '../../shared/ProgressBar';
import { ATTACHMENT_TIER_COLORS, ATTACHMENT_TIER_NAMES } from '../../../types/attachments';
import type { AttachmentTier } from '../../../types/attachments';
import type { AttachmentFullEntry } from '../../../engine/agentAttachments';
import { getAttachmentGlyph } from '../attachmentGlyphs';
import { resolveAttachmentTooltip } from '../../../engine/attachmentTooltip';

// ─── Knowledge level helpers ──────────────────────────────────────

const KNOWLEDGE_RANK: Record<string, number> = {
  stranger: 0,
  recognised: 1,
  known: 2,
  intimate: 3,
  transparent: 4,
};

function hasKnowledge(level: string, minimum: string): boolean {
  return (KNOWLEDGE_RANK[level] ?? 0) >= (KNOWLEDGE_RANK[minimum] ?? 0);
}

// ─── Domain config ────────────────────────────────────────────────

const DOMAIN_NAMES: Record<ReachDomain, string> = {
  iron: 'Iron',
  gold: 'Gold',
  shadow: 'Shadow',
  veil: 'Veil',
  heart: 'Heart',
  eye: 'Eye',
  stone: 'Stone',
  star: 'Star',
};

const ALL_DOMAINS: ReachDomain[] = [
  'iron', 'gold', 'shadow',
  'veil', 'heart', 'eye',
  'stone', 'star',
];

// ─── Subcategory visibility ───────────────────────────────────────

/** Always-visible possession subcategories */
const ALWAYS_VISIBLE_SUBCATS = new Set(['arms', 'vestments', 'mounts_beasts']);

/** Hidden subcategories that require explicit revelation or KnowledgeLevel >= 'known' */
const HIDDEN_SUBCATS = new Set(['tomes_scrolls', 'relics_talismans']);

// ─── Component ───────────────────────────────────────────────────

interface ProwessTabProps {
  card: AgentInfoCardData;
  knowledge?: AgentKnowledge;
  onAttachmentClick?: (entry: AttachmentFullEntry) => void;
}

export function ProwessTab({ card, knowledge, onAttachmentClick }: ProwessTabProps) {
  // ── Domain grid ──────────────────────────────────────────────────
  const domainMap = new Map(
    (card.domains ?? []).map(d => [d.domain, d.word])
  );

  const isDomainRevealed = (domain: ReachDomain): boolean => {
    if (knowledge != null) {
      return knowledge.revealedDomains.has(domain);
    }
    // KnowledgeLevel fallback: recognised+ shows all available domains
    return hasKnowledge(card.knowledgeLevel, 'recognised') && domainMap.has(domain);
  };

  // ── Possession visibility ─────────────────────────────────────────
  const isPossessionVisible = (entry: AttachmentFullEntry): boolean => {
    const sub = entry.subcategory;
    if (ALWAYS_VISIBLE_SUBCATS.has(sub)) return true;

    if (sub === 'tools_instruments') {
      return knowledge != null
        ? knowledge.coLocationTicks >= POSSESSION_ACTIVITY_TICKS
        : hasKnowledge(card.knowledgeLevel, 'intimate');
    }
    if (sub === 'provisions') {
      return knowledge != null
        ? knowledge.coLocationTicks >= POSSESSION_PROVISIONS_TICKS
        : hasKnowledge(card.knowledgeLevel, 'intimate');
    }
    if (HIDDEN_SUBCATS.has(sub)) {
      return knowledge != null
        ? hasKnowledge(card.knowledgeLevel, 'known') || knowledge.revealedPossessions.has(entry.id)
        : hasKnowledge(card.knowledgeLevel, 'intimate');
    }
    // Default: intimate+
    return hasKnowledge(card.knowledgeLevel, 'intimate');
  };

  const visiblePossessions = (card.possessions ?? []).filter(isPossessionVisible);

  // ── Conditions visibility ─────────────────────────────────────────
  const isConditionVisible = (entry: AttachmentFullEntry): boolean => {
    const sub = entry.subcategory;
    if (sub === 'wound' || sub === 'injury' || sub === 'disease' || sub === 'poison') return true;
    if (sub === 'blessing') {
      return hasKnowledge(card.knowledgeLevel, 'known');
    }
    if (sub === 'curse') {
      return knowledge != null
        ? knowledge.revealedConditions.has(entry.id)
        : hasKnowledge(card.knowledgeLevel, 'intimate');
    }
    return hasKnowledge(card.knowledgeLevel, 'recognised');
  };

  const allConditions = [
    ...(card.afflictions ?? []),
    ...((card.giftsAndBurdens ?? []).filter(g =>
      g.subcategory === 'wound' || g.subcategory === 'injury' ||
      g.subcategory === 'disease' || g.subcategory === 'poison' ||
      g.subcategory === 'blessing' || g.subcategory === 'curse'
    )),
  ];
  const visibleConditions = allConditions.filter(isConditionVisible);

  // ── Bestowed powers visibility ─────────────────────────────────────
  const bestowedPowers = (card.giftsAndBurdens ?? []).filter(g => g.subcategory === 'bestowed_power');
  const visiblePowers = bestowedPowers.filter(entry => {
    return knowledge != null
      ? knowledge.revealedPowers.has(entry.id)
      : hasKnowledge(card.knowledgeLevel, 'intimate');
  });

  // ── Vignette renderer ─────────────────────────────────────────────
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

  const hasDomainData = card.domains && card.domains.length > 0;

  return (
    <div className="space-y-4">
      {/* Domains — 2x4 grid (8 reaches, flesh removed in TB-075) */}
      <section>
        <SectionHeading as="h2">Domains</SectionHeading>
        {hasDomainData ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {ALL_DOMAINS.map((domain) => {
              const revealed = isDomainRevealed(domain);
              const descriptor = revealed ? domainMap.get(domain) : undefined;
              return (
                <div
                  key={domain}
                  className="p-2 rounded text-center"
                  style={{ backgroundColor: 'var(--bg-raised)' }}
                >
                  <Tooltip id={`reach.${domain}`}>
                    <p className="text-xs font-medium underline decoration-dotted cursor-help" style={{ color: 'var(--accent-gold)' }}>
                      {DOMAIN_NAMES[domain]}
                    </p>
                  </Tooltip>
                  <p className="text-xs mt-0.5" style={{ color: revealed ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}>
                    {descriptor ?? '???'}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-stone-400 italic text-sm">
            You haven&apos;t observed {card.name}&apos;s capabilities yet.
          </p>
        )}
      </section>

      {/* Possessions */}
      {visiblePossessions.length > 0 && (
        <section data-testid="modal-possessions">
          <SectionHeading as="h2">Possessions</SectionHeading>
          {visiblePossessions.map(renderVignette)}
        </section>
      )}

      {/* Conditions */}
      {visibleConditions.length > 0 && (
        <section data-testid="modal-afflictions">
          <SectionHeading as="h2">Conditions</SectionHeading>
          {visibleConditions.map(renderVignette)}
        </section>
      )}

      {/* Bestowed Powers */}
      {hasKnowledge(card.knowledgeLevel, 'recognised') && (
        <section data-testid="modal-gifts-burdens">
          <SectionHeading as="h2">Bestowed Powers</SectionHeading>
          {visiblePowers.length > 0 ? (
            visiblePowers.map(renderVignette)
          ) : (
            <p className="text-stone-400 italic text-sm">No divine gifts are known.</p>
          )}
        </section>
      )}
    </div>
  );
}
