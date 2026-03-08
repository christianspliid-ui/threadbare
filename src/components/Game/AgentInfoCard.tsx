import React from 'react';
import type { AgentInfoCardData } from '../../engine/agentDetail';
import type { ReachDomain } from '../../types/traits';

interface AgentInfoCardProps {
  card: AgentInfoCardData;
  onViewProfile: () => void;
  onBack: () => void;
}

// Domain display names
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

// Knowledge level display names
const KNOWLEDGE_LEVEL_DISPLAY: Record<string, string> = {
  stranger: 'Stranger',
  recognised: 'Recognised',
  known: 'Known',
  intimate: 'Intimate',
  transparent: 'Transparent',
};

export const AgentInfoCard = React.memo(function AgentInfoCard({
  card,
  onViewProfile,
  onBack,
}: AgentInfoCardProps) {
  const knowledgeLevelLabel = KNOWLEDGE_LEVEL_DISPLAY[card.knowledgeLevel] || card.knowledgeLevel;

  return (
    <div className="flex flex-col h-full bg-stone-900 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-stone-800/90 border-b border-amber-900/30 flex-shrink-0">
        <button
          onClick={onBack}
          aria-label="back"
          className="text-amber-400 hover:text-amber-200 transition-colors text-lg px-1"
        >
          ←
        </button>
        <div className="flex-1">
          <h2
            className="text-amber-100 text-sm font-semibold tracking-wide"
            style={{ fontFamily: 'Cinzel, serif' }}
          >
            {card.name}
          </h2>
          <div className="text-xs text-amber-400/70">{knowledgeLevelLabel}</div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Location */}
        <div>
          <span className="text-xs text-amber-400/70">In {card.locationName}</span>
        </div>

        {/* Stranger level: just name and location */}
        {card.knowledgeLevel === 'stranger' && (
          <div className="text-amber-400/50 text-xs italic">
            Identity obscured...
          </div>
        )}

        {/* Recognised+ level: archetype and faction */}
        {card.knowledgeLevel !== 'stranger' && (
          <>
            {card.archetypeLabel && (
              <div className="bg-stone-800/50 border border-amber-900/30 rounded px-2 py-1.5">
                <p className="text-amber-100 text-xs font-semibold">{card.archetypeLabel}</p>
              </div>
            )}

            {card.factionName && (
              <div className="inline-block">
                <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-stone-800/50 border border-amber-900/30 text-amber-400/80">
                  {card.factionName}
                </span>
              </div>
            )}

            {card.cultureName && (
              <div className="text-xs text-amber-400/60">
                Culture: <span className="text-amber-300">{card.cultureName}</span>
              </div>
            )}
          </>
        )}

        {/* Values */}
        {card.topValues && card.topValues.length > 0 && (
          <div>
            <h3
              className="text-amber-200/80 text-xs font-semibold tracking-wider uppercase mb-1.5"
              style={{ fontFamily: 'Cinzel, serif' }}
            >
              Character
            </h3>
            <div className="space-y-1">
              {card.topValues.map((val, idx) => (
                <div key={idx} className="text-xs text-amber-400/70">
                  {val.word}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Domains */}
        {card.domains && card.domains.length > 0 && (
          <div>
            <h3
              className="text-amber-200/80 text-xs font-semibold tracking-wider uppercase mb-1.5"
              style={{ fontFamily: 'Cinzel, serif' }}
            >
              Domains
            </h3>
            <div className="space-y-1">
              {card.domains.map((dom, idx) => (
                <div key={idx} className="text-xs text-amber-400/70">
                  {dom.word} in {DOMAIN_NAMES[dom.domain]}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bonds */}
        {card.topBonds && card.topBonds.length > 0 && (
          <div>
            <h3
              className="text-amber-200/80 text-xs font-semibold tracking-wider uppercase mb-1.5"
              style={{ fontFamily: 'Cinzel, serif' }}
            >
              Bonds
            </h3>
            <div className="space-y-1">
              {card.topBonds.map((bond, idx) => {
                const sentimentColor = bond.sentiment === 'positive' ? 'text-green-400/70' : 'text-red-400/70';
                return (
                  <div key={idx} className={`text-xs ${sentimentColor}`}>
                    {bond.name} — {bond.strengthWord}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quotes */}
        {card.quotes && card.quotes.length > 0 && (
          <div>
            <h3
              className="text-amber-200/80 text-xs font-semibold tracking-wider uppercase mb-1.5"
              style={{ fontFamily: 'Cinzel, serif' }}
            >
              Voice
            </h3>
            <div className="space-y-1">
              {card.quotes.map((quote, idx) => (
                <p key={idx} className="text-xs text-amber-400/60 italic">
                  "{quote}"
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Cooperation Strategy (Intimate+) */}
        {card.cooperationStrategy && (
          <div>
            <h3
              className="text-amber-200/80 text-xs font-semibold tracking-wider uppercase mb-1.5"
              style={{ fontFamily: 'Cinzel, serif' }}
            >
              Disposition
            </h3>
            <div className="text-xs text-amber-400/70">
              Strategy: <span className="text-amber-300">{card.cooperationStrategy}</span>
            </div>
            {card.reputationWord && (
              <div className="text-xs text-amber-400/70 mt-0.5">
                Reputation: <span className="text-amber-300">{card.reputationWord}</span>
              </div>
            )}
          </div>
        )}

        {/* Traits (Intimate+) */}
        {card.allTraits && card.allTraits.length > 0 && (
          <div>
            <h3
              className="text-amber-200/80 text-xs font-semibold tracking-wider uppercase mb-1.5"
              style={{ fontFamily: 'Cinzel, serif' }}
            >
              Traits
            </h3>
            <div className="space-y-1">
              {card.allTraits.map((trait, idx) => (
                <div key={idx} className="text-xs text-amber-400/70">
                  {trait}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Backstory (Intimate+) */}
        {card.backstoryParagraph1 && (
          <div>
            <h3
              className="text-amber-200/80 text-xs font-semibold tracking-wider uppercase mb-1.5"
              style={{ fontFamily: 'Cinzel, serif' }}
            >
              Backstory
            </h3>
            <p className="text-xs text-amber-400/70 leading-relaxed">
              {card.backstoryParagraph1}
            </p>
          </div>
        )}
      </div>

      {/* Footer buttons */}
      <div className="flex gap-2 px-4 py-3 bg-stone-800/90 border-t border-amber-900/30 flex-shrink-0">
        <button
          onClick={onViewProfile}
          className="flex-1 px-3 py-2 text-xs font-medium rounded bg-amber-900/40 border border-amber-900/60 text-amber-200 hover:bg-amber-900/60 transition-colors"
        >
          View Profile
        </button>
      </div>
    </div>
  );
});

AgentInfoCard.displayName = 'AgentInfoCard';
