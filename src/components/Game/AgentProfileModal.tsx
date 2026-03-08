import { useEffect } from 'react';
import type { AgentInfoCardData, AgentFullProfileData } from '../../engine/agentDetail';
import type { ReachDomain } from '../../types/traits';

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
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
        style={{ pointerEvents: 'auto' }}
      />

      {/* Modal Content */}
      <div
        className="relative bg-stone-900 border border-amber-900/40 rounded-lg max-w-2xl w-full h-[90vh] flex flex-col shadow-2xl"
        style={{ pointerEvents: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header Zone */}
        <div className="border-b border-amber-900/30 p-6 pb-4">
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
                className="text-2xl font-bold text-amber-100 mb-1"
                style={{ fontFamily: 'Cinzel, serif' }}
              >
                {card.name}
              </h1>

              {/* Knowledge level badge */}
              <div className="inline-block px-2 py-0.5 bg-amber-900/40 rounded text-amber-300/70 text-xs mb-2">
                {card.knowledgeLevel}
              </div>

              {/* Metadata */}
              <div className="space-y-1">
                {card.locationName && (
                  <p className="text-amber-200/70 text-sm">{card.locationName}</p>
                )}
                {card.knowledgeLevel !== 'stranger' && card.archetypeLabel && (
                  <p className="text-amber-300/80 text-sm italic">{card.archetypeLabel}</p>
                )}
                {card.knowledgeLevel !== 'stranger' && (card.factionName || card.cultureName) && (
                  <p className="text-amber-200/60 text-xs">
                    {[card.factionName, card.cultureName].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Primary Sphere Indicator */}
          {card.primarySphere && (
            <div className="flex gap-2 items-center pt-2">
              <span className="text-amber-400/70 text-xs">Attuned to</span>
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: getSphereColor(card.primarySphere),
                }}
              />
              <span className="text-amber-200/60 text-xs capitalize">{card.primarySphere}</span>
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quotes Section (known+) */}
          {card.knowledgeLevel !== 'stranger' && card.knowledgeLevel !== 'recognised' && card.quotes && card.quotes.length > 0 && (
            <section>
              <h2
                className="text-amber-100 font-bold mb-3"
                style={{ fontFamily: 'Cinzel, serif' }}
              >
                Words
              </h2>
              <div className="space-y-3">
                {card.quotes.map((quote, idx) => (
                  <div
                    key={idx}
                    className="border-l-2 border-amber-400/40 pl-3 text-amber-200/70 italic text-sm"
                  >
                    {quote}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Values Section (recognised+) */}
          {card.knowledgeLevel !== 'stranger' && card.topValues && card.topValues.length > 0 && (
            <section>
              <h2
                className="text-amber-100 font-bold mb-3"
                style={{ fontFamily: 'Cinzel, serif' }}
              >
                Nature
              </h2>
              <div className="space-y-2">
                {card.topValues.map((val, idx) => (
                  <p key={idx} className="text-amber-200/70 text-sm">
                    {val.word}
                  </p>
                ))}
              </div>
            </section>
          )}

          {/* Prowess Section (recognised+) */}
          {card.knowledgeLevel !== 'stranger' && card.domains && card.domains.length > 0 && (
            <section>
              <h2
                className="text-amber-100 font-bold mb-3"
                style={{ fontFamily: 'Cinzel, serif' }}
              >
                Prowess
              </h2>
              <p className="text-amber-200/70 text-sm space-x-1">
                {card.domains.map((dom, idx) => (
                  <span key={idx}>
                    {idx > 0 && <span className="text-amber-400/50">·</span>}
                    <span className="ml-1">
                      {dom.word} in {DOMAIN_NAMES[dom.domain]}
                    </span>
                  </span>
                ))}
              </p>
            </section>
          )}

          {/* Bonds Section (known+) */}
          {card.knowledgeLevel !== 'stranger' && card.knowledgeLevel !== 'recognised' && card.topBonds && card.topBonds.length > 0 && (
            <section>
              <h2
                className="text-amber-100 font-bold mb-3"
                style={{ fontFamily: 'Cinzel, serif' }}
              >
                Bonds
              </h2>
              <div className="space-y-2">
                {card.topBonds.map((bond, idx) => (
                  <p key={idx} className="text-amber-200/70 text-sm">
                    <span className="text-amber-300/80">{bond.name}</span>
                    {' — '}
                    <span className="text-amber-200/60">
                      {bond.strengthWord} {bond.sentiment === 'positive' ? '(favored)' : '(opposed)'}
                    </span>
                  </p>
                ))}
              </div>
            </section>
          )}

          {/* Traits Section (intimate+) */}
          {(card.knowledgeLevel === 'intimate' || card.knowledgeLevel === 'transparent') && card.allTraits && card.allTraits.length > 0 && (
            <section>
              <h2
                className="text-amber-100 font-bold mb-3"
                style={{ fontFamily: 'Cinzel, serif' }}
              >
                Traits
              </h2>
              <div className="flex flex-wrap gap-2">
                {card.allTraits.map((trait, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-amber-900/30 border border-amber-700/40 rounded text-amber-200/80 text-xs"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Backstory Section (intimate+) */}
          {(card.knowledgeLevel === 'intimate' || card.knowledgeLevel === 'transparent') && card.backstoryParagraph1 && (
            <section>
              <h2
                className="text-amber-100 font-bold mb-3"
                style={{ fontFamily: 'Cinzel, serif' }}
              >
                Origin
              </h2>
              <p className="text-amber-200/70 text-sm leading-relaxed">{card.backstoryParagraph1}</p>
            </section>
          )}

          {/* Full Backstory (transparent only) */}
          {card.knowledgeLevel === 'transparent' && profile?.fullBackstory && (
            <section>
              <h2
                className="text-amber-100 font-bold mb-3"
                style={{ fontFamily: 'Cinzel, serif' }}
              >
                Full Account
              </h2>
              <div className="text-amber-200/70 text-sm space-y-3">
                {profile.fullBackstory.split('\n\n').map((para, idx) => (
                  <p key={idx} className="leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>
            </section>
          )}

          {/* Disposition Section (intimate+) */}
          {(card.knowledgeLevel === 'intimate' || card.knowledgeLevel === 'transparent') && card.cooperationStrategy && (
            <section>
              <h2
                className="text-amber-100 font-bold mb-3"
                style={{ fontFamily: 'Cinzel, serif' }}
              >
                Disposition
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-amber-200/60 text-sm">Strategy</span>
                  <span className="text-amber-300/80 text-sm">{formatStrategy(card.cooperationStrategy)}</span>
                </div>
                {card.reputationWord && (
                  <div className="flex justify-between">
                    <span className="text-amber-200/60 text-sm">Reputation</span>
                    <span className="text-amber-300/80 text-sm capitalize">{card.reputationWord}</span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* History Timeline (transparent only) */}
          {card.knowledgeLevel === 'transparent' && profile?.historyTimeline && profile.historyTimeline.length > 0 && (
            <section>
              <h2
                className="text-amber-100 font-bold mb-3"
                style={{ fontFamily: 'Cinzel, serif' }}
              >
                History
              </h2>
              <div className="space-y-2">
                {profile.historyTimeline.map((entry, idx) => (
                  <div key={idx} className="text-amber-200/70 text-xs">
                    <span className="text-amber-400/60">t{entry.tick}</span>
                    {' — '}
                    <span className="text-amber-200/60">{entry.event}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Disposition Record (transparent only) */}
          {card.knowledgeLevel === 'transparent' && profile?.dispositionRecord && profile.dispositionRecord.length > 0 && (
            <section>
              <h2
                className="text-amber-100 font-bold mb-3"
                style={{ fontFamily: 'Cinzel, serif' }}
              >
                Interaction Record
              </h2>
              <div className="space-y-2">
                {profile.dispositionRecord.map((record, idx) => (
                  <div key={idx} className="text-amber-200/70 text-xs p-2 bg-stone-800/40 rounded">
                    <div className="flex justify-between mb-1">
                      <span className="text-amber-400/60">t{record.tick}</span>
                      <span className="capitalize text-amber-300/70">{record.context}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-200/60">
                        {record.actorMove} → {record.targetMove}
                      </span>
                      <span className="text-amber-200/50 capitalize">{record.stakes}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Close Button */}
        <div className="border-t border-amber-900/30 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-amber-900/40 hover:bg-amber-900/60 text-amber-200 rounded text-sm transition-colors"
            aria-label={`Close profile for ${card.name}`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Get a color for a sphere name (for visual indicators)
 */
function getSphereColor(sphereName: string): string {
  const colors: Record<string, string> = {
    // Foundation spheres
    chaos: '#ef4444',
    order: '#3b82f6',
    light: '#fbbf24',
    darkness: '#1f2937',
    // Creation spheres
    force: '#dc2626',
    matter: '#78350f',
    energy: '#ea580c',
    life: '#22c55e',
    mind: '#6366f1',
    spirit: '#d946ef',
    time: '#f97316',
    entropy: '#64748b',
  };
  return colors[sphereName.toLowerCase()] ?? '#a78bfa';
}
