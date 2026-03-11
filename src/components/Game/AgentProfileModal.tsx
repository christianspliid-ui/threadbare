import { useEffect } from 'react';
import type { AgentInfoCardData, AgentFullProfileData } from '../../engine/agentDetail';
import type { ReachDomain } from '../../types/traits';
import { getSphereColor } from '../../data/sphereIcons';
import { Tooltip } from '../shared/Tooltip';

export interface AgentProfileModalProps {
  card: AgentInfoCardData;
  profile?: AgentFullProfileData;
  onClose: () => void;
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

export function AgentProfileModal({ card, profile, onClose }: AgentProfileModalProps) {
  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Format cooperation strategy (tit-for-tat → Tit-for-Tat)
  const formatStrategy = (strategy: string): string => {
    return strategy
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('-');
  };

  return (
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
        className="relative border rounded-lg max-w-2xl w-full h-[90vh] flex flex-col shadow-2xl"
        style={{ pointerEvents: 'auto', backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
        onClick={e => e.stopPropagation()}
      >
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
    </div>
  );
}

