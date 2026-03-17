import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { AgentInfoCardData, AgentFullProfileData } from '../../engine/agentDetail';
import type { ReachDomain } from '../../types/traits';
import { IntentSection } from './IntentSection';
import { getSphereColor } from '../../data/sphereIcons';
import { BACKSTORY_CONSTANTS } from '../../types/prose';
import { Tooltip } from '../shared/Tooltip';
import { ATTACHMENT_TIER_COLORS, ATTACHMENT_TIER_NAMES } from '../../types/attachments';
import type { AttachmentTier } from '../../types/attachments';
import { getAttachmentGlyph } from './attachmentGlyphs';
import { ProgressBar } from '../shared/ProgressBar';
import { AttachmentDetailView } from './AttachmentDetailView';
import type { AttachmentDetailData } from './AttachmentDetailView';
import type { AttachmentFullEntry } from '../../engine/agentAttachments';
import { resolveAttachmentTooltip } from '../../engine/attachmentTooltip';

export interface AgentProfileModalProps {
  card: AgentInfoCardData;
  profile?: AgentFullProfileData;
  onClose: () => void;
  /** When true, auto-scroll to the backstory section on open (e.g. from a revelation alert) */
  scrollToNewStrata?: boolean;
}

// Domain name mapping
const DOMAIN_NAMES: Record<ReachDomain, string> = {
  iron: 'Iron',
  gold: 'Gold',
  shadow: 'Shadow',
  veil: 'Veil',
  heart: 'Heart',
  eye: 'Eye',
  stone: 'Stone',
  star: 'Star',
  flesh: 'Flesh',
};

// RC-034: Knowledge level hierarchy — centralizes repeated conditional checks
const KNOWLEDGE_RANK: Record<string, number> = {
  stranger: 0,
  recognised: 1,
  known: 2,
  intimate: 3,
  transparent: 4,
};

/** Returns true if the agent's knowledge level is at least the given minimum */
function hasKnowledge(level: string, minimum: string): boolean {
  return (KNOWLEDGE_RANK[level] ?? 0) >= (KNOWLEDGE_RANK[minimum] ?? 0);
}

// Stratum locked-tier placeholder text
const LOCKED_TEXT: Record<2 | 3 | 4, string> = {
  2: 'There are stories {name} shares only with those who have proven their devotion.',
  3: 'The fears and contradictions within {name} are visible only to a true champion of the divine.',
  4: 'Only when {name} becomes an aspect of the divine can the full truth be read in their threads.',
};

export function AgentProfileModal({ card, profile, onClose, scrollToNewStrata }: AgentProfileModalProps) {
  const [selectedAttachment, setSelectedAttachment] = useState<AttachmentDetailData | null>(null);
  const backstorySectionRef = useRef<HTMLDivElement>(null);
  // Track which strata badges have faded (badge fades after NEW_BADGE_FADE_MS)
  const [fadedStrata, setFadedStrata] = useState<Set<number>>(new Set());

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (selectedAttachment) {
        setSelectedAttachment(null);
      } else {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose, selectedAttachment]);

  // Auto-scroll to backstory section when opened from revelation alert
  useEffect(() => {
    if (scrollToNewStrata && backstorySectionRef.current) {
      backstorySectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [scrollToNewStrata]);

  // Fade New badges after NEW_BADGE_FADE_MS
  useEffect(() => {
    const newStrata = card.backstory?.strata.filter(s => s.isNew).map(s => s.tier) ?? [];
    if (newStrata.length === 0) return;
    const timer = setTimeout(() => {
      setFadedStrata(new Set(newStrata));
    }, BACKSTORY_CONSTANTS.NEW_BADGE_FADE_MS);
    return () => clearTimeout(timer);
  }, [card.backstory]);

  /** Convert an AttachmentFullEntry to AttachmentDetailData for the detail view */
  const toDetailData = (entry: AttachmentFullEntry): AttachmentDetailData => ({
    id: entry.id,
    name: entry.name,
    subcategory: entry.subcategory,
    tier: entry.tier as AttachmentTier,
    mechanicalSummary: entry.mechanicalSummary,
    flavorText: entry.flavorText,
    tags: entry.tags,
    lossCondition: entry.lossCondition,
    grantedBy: entry.grantedBy,
    agreementType: entry.agreementType,
    source: entry.source,
    image: entry.image,
    ticksRemaining: entry.ticksRemaining,
    totalTicks: entry.totalTicks,
    onUseTriggers: entry.onUseTriggers,
  });

  /** Render a prose vignette for an attachment in the modal */
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
        className="cursor-pointer transition-opacity hover:opacity-80 py-2"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
        onClick={() => setSelectedAttachment(toDetailData(entry))}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setSelectedAttachment(toDetailData(entry));
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
              <ProgressBar progress={entry.ticksRemaining / entry.totalTicks} color={tierColor} className="h-1.5" glow={false} />
            </div>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {entry.ticksRemaining} ticks remaining
            </span>
          </div>
        )}
      </div>
    );
  };

  // Format cooperation strategy (tit-for-tat → Tit-for-Tat)
  const formatStrategy = (strategy: string): string => {
    return strategy
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('-');
  };

  return createPortal(
    <div
      role="dialog"
      aria-label={`Profile: ${card.name}`}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ pointerEvents: 'auto' }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        style={{ pointerEvents: 'auto', backgroundColor: 'rgba(10, 10, 14, 0.9)' }}
      />

      {/* Modal Content */}
      <div
        className="relative border rounded-lg max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl mx-4"
        style={{ pointerEvents: 'auto', backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close × button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 transition-colors text-xl leading-none rounded-full"
          style={{ color: 'var(--text-tertiary)', width: '28px', height: '28px', textAlign: 'center' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-tertiary)')}
          aria-label={`Close profile for ${card.name}`}
        >
          ×
        </button>
        {/* Header Zone */}
        <div className="border-b p-6 pb-4" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex gap-4 mb-3">
            {/* Portrait Placeholder */}
            <div
              data-testid="portrait-silhouette"
              className="w-20 h-24 rounded overflow-hidden flex-shrink-0"
              style={{
                background:
                  card.knowledgeLevel === 'stranger'
                    ? 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(51,51,51,0.6) 100%)'
                    : 'linear-gradient(135deg, rgba(120,53,15,0.4) 0%, rgba(30,27,46,0.8) 100%)',
              }}
            />

            {/* Header Text */}
            <div className="flex-1">
              <h1
                className="text-2xl font-bold mb-1"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
              >
                {card.name}
              </h1>

              {/* Knowledge level badge */}
              <Tooltip label="Knowledge Level" desc="How well you know this agent. Grows through proximity, worship, scry, and narrative contact.">
                <div className="inline-block px-2 py-0.5 rounded text-xs mb-2 underline decoration-dotted cursor-help" style={{ backgroundColor: 'var(--border-subtle)', color: 'var(--accent-gold)' }}>
                  {card.knowledgeLevel}
                </div>
              </Tooltip>

              {/* Metadata */}
              <div className="space-y-1">
                {card.locationName && (
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{card.locationName}</p>
                )}
                {hasKnowledge(card.knowledgeLevel, 'recognised') && card.archetypeLabel && (
                  <p className="text-sm italic" style={{ color: 'var(--accent-gold)' }}>
                    {card.archetypeId ? (
                      <Tooltip id={`archetype.${card.archetypeId}`}><span className="underline decoration-dotted cursor-help">{card.archetypeLabel}</span></Tooltip>
                    ) : card.archetypeLabel}
                  </p>
                )}
                {hasKnowledge(card.knowledgeLevel, 'recognised') && (card.factionName || card.cultureName) && (
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {[card.factionName, card.cultureName].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Primary Sphere Indicator */}
          {card.primarySphere && (
            <div className="flex gap-2 items-center pt-2">
              <span className="text-xs" style={{ color: 'var(--accent-gold)' }}>Attuned to</span>
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: getSphereColor(card.primarySphere),
                }}
              />
              <Tooltip id={`sphere.${card.primarySphere}`}>
                <span className="text-xs capitalize underline decoration-dotted cursor-help" style={{ color: 'var(--text-secondary)' }}>{card.primarySphere}</span>
              </Tooltip>
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quotes Section (known+) */}
          {hasKnowledge(card.knowledgeLevel, 'known') && card.quotes && card.quotes.length > 0 && (
            <section>
              <h2
                className="font-bold mb-3"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
              >
                Words
              </h2>
              <div className="space-y-3">
                {card.quotes.map((quote, idx) => (
                  <div
                    key={idx}
                    className="border-l-2 pl-3 italic text-sm"
                    style={{ borderColor: 'var(--accent-gold)', color: 'var(--text-secondary)' }}
                  >
                    {quote}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Values Section (recognised+) */}
          {hasKnowledge(card.knowledgeLevel, 'recognised') && card.topValues && card.topValues.length > 0 && (
            <section>
              <h2
                className="font-bold mb-3"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
              >
                Nature
              </h2>
              <div className="space-y-2">
                {card.topValues.map((val, idx) => (
                  <p key={idx} className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {val.word}
                  </p>
                ))}
              </div>
            </section>
          )}

          {/* Intent Section — always visible in prototype */}
          <IntentSection intents={card.intents ?? []} variant="modal" />

          {/* Prowess Section (recognised+) */}
          {hasKnowledge(card.knowledgeLevel, 'recognised') && card.domains && card.domains.length > 0 && (
            <section>
              <h2
                className="font-bold mb-3"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
              >
                Prowess
              </h2>
              <p className="text-sm space-x-1" style={{ color: 'var(--text-secondary)' }}>
                {card.domains.map((dom, idx) => (
                  <span key={idx}>
                    {idx > 0 && <span style={{ color: 'var(--accent-gold)' }}>·</span>}
                    <span className="ml-1">
                      {dom.word} in <Tooltip id={`reach.${dom.domain}`}><span className="underline decoration-dotted cursor-help">{DOMAIN_NAMES[dom.domain]}</span></Tooltip>
                    </span>
                  </span>
                ))}
              </p>
            </section>
          )}

          {/* Bonds Section (known+) */}
          {hasKnowledge(card.knowledgeLevel, 'known') && card.topBonds && card.topBonds.length > 0 && (
            <section>
              <h2
                className="font-bold mb-3"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
              >
                Bonds
              </h2>
              <div className="space-y-2">
                {card.topBonds.map((bond, idx) => (
                  <p key={idx} className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--accent-gold)' }}>{bond.name}</span>
                    {' — '}
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {bond.strengthWord} {bond.sentiment === 'positive' ? '(favored)' : '(opposed)'}
                    </span>
                  </p>
                ))}
              </div>
            </section>
          )}

          {/* Traits Section (intimate+) */}
          {hasKnowledge(card.knowledgeLevel, 'intimate') && card.allTraits && card.allTraits.length > 0 && (
            <section>
              <h2
                className="font-bold mb-3"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
              >
                Traits
              </h2>
              <div className="flex flex-wrap gap-2">
                {card.allTraits.map((trait, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 border rounded text-xs"
                    style={{ backgroundColor: 'var(--border-subtle)', borderColor: 'var(--border-medium)', color: 'var(--text-secondary)' }}
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Possessions Section (intimate+) */}
          {hasKnowledge(card.knowledgeLevel, 'intimate') && card.possessions && card.possessions.length > 0 && (
            <section data-testid="modal-possessions">
              <h2
                className="font-bold mb-3"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
              >
                Possessions
              </h2>
              {card.possessions.map(renderVignette)}
            </section>
          )}

          {/* Afflictions Section (recognised+) */}
          {hasKnowledge(card.knowledgeLevel, 'recognised') && card.afflictions && card.afflictions.length > 0 && (
            <section data-testid="modal-afflictions">
              <h2
                className="font-bold mb-3"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
              >
                Afflictions
              </h2>
              {card.afflictions.map(renderVignette)}
            </section>
          )}

          {/* Gifts & Burdens Section (intimate+) */}
          {hasKnowledge(card.knowledgeLevel, 'intimate') && card.giftsAndBurdens && card.giftsAndBurdens.length > 0 && (
            <section data-testid="modal-gifts-burdens">
              <h2
                className="font-bold mb-3"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
              >
                Gifts & Burdens
              </h2>
              {card.giftsAndBurdens.map(renderVignette)}
            </section>
          )}

          {/* Backstory Section (intimate+) */}
          {hasKnowledge(card.knowledgeLevel, 'intimate') && card.backstoryParagraph1 && (
            <section>
              <h2
                className="font-bold mb-3"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
              >
                Origin
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{card.backstoryParagraph1}</p>
            </section>
          )}

          {/* Full Backstory (transparent only) — RC-022: defensive optional chaining */}
          {card.knowledgeLevel === 'transparent' && profile?.fullBackstory && (
            <section>
              <h2
                className="font-bold mb-3"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
              >
                Full Account
              </h2>
              <div className="text-sm space-y-3" style={{ color: 'var(--text-secondary)' }}>
                {profile?.fullBackstory?.split('\n\n').map((para, idx) => (
                  <p key={idx} className="leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>
            </section>
          )}

          {/* Their Story Section — gated on recognised+ knowledge */}
          {hasKnowledge(card.knowledgeLevel, 'recognised') && (card.backstory || (card.influenceTier !== undefined && card.influenceTier === 0)) && (
            <section ref={backstorySectionRef} data-testid="their-story-section">
              <h2
                className="font-bold mb-1"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
              >
                Their Story
                <span
                  className="ml-2 text-xs font-normal opacity-30"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  ✦ ─ ✦
                </span>
              </h2>

              {/* Tier 0 locked placeholder */}
              {(!card.backstory || card.backstory.strata.length === 0) && card.influenceTier === 0 && (
                <p className="text-sm italic leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                  You sense there is more to {card.name}&apos;s story, but the threads between you are too thin to read it.
                </p>
              )}

              {/* Unlocked strata */}
              {card.backstory && card.backstory.strata.length > 0 && (
                <div className="space-y-5 mt-3">
                  {card.backstory.strata.map((stratum) => {
                    const sphereColor = card.primarySphere ? getSphereColor(card.primarySphere) : 'var(--accent-gold)';
                    const isFaded = fadedStrata.has(stratum.tier);
                    return (
                      <div key={stratum.tier}>
                        {/* Stratum divider */}
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-px flex-1" style={{ backgroundColor: sphereColor, opacity: 0.25 }} />
                          <span
                            className="text-xs font-semibold uppercase tracking-widest"
                            style={{ color: sphereColor, opacity: 0.8 }}
                          >
                            {stratum.title}
                          </span>
                          {stratum.isNew && (
                            <span
                              className="text-xs px-1.5 py-0.5 rounded font-semibold transition-opacity duration-1000"
                              style={{
                                backgroundColor: sphereColor + '33',
                                color: sphereColor,
                                opacity: isFaded ? 0 : 1,
                              }}
                            >
                              ✦ New
                            </span>
                          )}
                          <div className="h-px flex-1" style={{ backgroundColor: sphereColor, opacity: 0.25 }} />
                        </div>
                        <p className="text-xs italic mb-1" style={{ color: sphereColor, opacity: 0.5 }}>
                          {stratum.subtitle}
                        </p>
                        <div className="text-sm leading-relaxed space-y-3" style={{ color: 'var(--text-secondary)' }}>
                          {stratum.text.split('\n\n').map((para, idx) => (
                            <p key={idx}>{para}</p>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {/* Locked future strata placeholders */}
                  {([2, 3, 4] as const).filter(tier => tier > card.backstory!.maxStratum).map(tier => (
                    <div key={`locked-${tier}`} className="opacity-40">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-px flex-1" style={{ backgroundColor: 'var(--border-subtle)' }} />
                        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
                          ◈ Locked
                        </span>
                        <div className="h-px flex-1" style={{ backgroundColor: 'var(--border-subtle)' }} />
                      </div>
                      <p className="text-sm italic leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                        {LOCKED_TEXT[tier].replace('{name}', card.name)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Disposition Section (intimate+) */}
          {hasKnowledge(card.knowledgeLevel, 'intimate') && card.cooperationStrategy && (
            <section>
              <h2
                className="font-bold mb-3"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
              >
                Disposition
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Strategy</span>
                  <Tooltip label="Cooperation Strategy" desc="How this agent behaves in prisoner's dilemma situations. Affects trust, betrayal, and reputation.">
                    <span className="text-sm underline decoration-dotted cursor-help" style={{ color: 'var(--accent-gold)' }}>{formatStrategy(card.cooperationStrategy)}</span>
                  </Tooltip>
                </div>
                {card.reputationWord && (
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Reputation</span>
                    <span className="text-sm capitalize" style={{ color: 'var(--accent-gold)' }}>{card.reputationWord}</span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* History Timeline (transparent only) — RC-022: defensive optional chaining */}
          {card.knowledgeLevel === 'transparent' && profile?.historyTimeline && profile?.historyTimeline.length > 0 && (
            <section>
              <h2
                className="font-bold mb-3"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
              >
                History
              </h2>
              <div className="space-y-2">
                {profile?.historyTimeline?.map((entry, idx) => (
                  <div key={idx} className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--accent-gold)' }}>t{entry.tick}</span>
                    {' — '}
                    <span style={{ color: 'var(--text-tertiary)' }}>{entry.event}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Disposition Record (transparent only) — RC-022: defensive optional chaining */}
          {card.knowledgeLevel === 'transparent' && profile?.dispositionRecord && profile?.dispositionRecord.length > 0 && (
            <section>
              <h2
                className="font-bold mb-3"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
              >
                Interaction Record
              </h2>
              <div className="space-y-2">
                {profile?.dispositionRecord?.map((record, idx) => (
                  <div key={idx} className="text-xs p-2 rounded" style={{ backgroundColor: 'var(--bg-raised)', color: 'var(--text-secondary)' }}>
                    <div className="flex justify-between mb-1">
                      <span style={{ color: 'var(--accent-gold)' }}>t{record.tick}</span>
                      <span className="capitalize" style={{ color: 'var(--accent-gold)' }}>{record.context}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {record.actorMove} → {record.targetMove}
                      </span>
                      <span style={{ color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>{record.stakes}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Attachment Detail Overlay (slide-in within modal) */}
        {selectedAttachment && (
          <div
            className="absolute inset-0 z-20 overflow-y-auto"
            style={{ backgroundColor: 'var(--bg-surface)' }}
            data-testid="attachment-detail-overlay"
          >
            <AttachmentDetailView
              attachment={selectedAttachment}
              onBack={() => setSelectedAttachment(null)}
            />
          </div>
        )}

        {/* Close Button */}
        <div className="border-t p-4 flex justify-end" style={{ borderColor: 'var(--border-subtle)' }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-sm transition-colors"
            style={{ backgroundColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--border-subtle)')}
            aria-label={`Close profile for ${card.name}`}
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

