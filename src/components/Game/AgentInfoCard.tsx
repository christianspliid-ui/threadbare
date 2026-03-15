import React, { useMemo } from 'react';
import type { AgentInfoCardData } from '../../engine/agentDetail';
import type { WorldGraph } from '../../engine/graph';
import type { ReachDomain } from '../../types/traits';
import { Tooltip } from '../shared/Tooltip';
import { generateEntityProse } from '../../engine/proseGenerator';

interface AgentInfoCardProps {
  card: AgentInfoCardData;
  onViewProfile: () => void;
  onBack: () => void;
  onZoomToLocation?: (locationId: string) => void;
  // Prose generation (optional)
  graph?: WorldGraph;
  seed?: number;
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
  onZoomToLocation,
  graph,
  seed,
}: AgentInfoCardProps) {
  const knowledgeLevelLabel = KNOWLEDGE_LEVEL_DISPLAY[card.knowledgeLevel] || card.knowledgeLevel;

  // Generate prose for agent (memoized)
  // RC-004: Fixed card.agentId → card.id (agentId doesn't exist on AgentInfoCardData)
  const agentProse = useMemo(() => {
    if (!graph || seed === undefined) return '';
    return generateEntityProse(card.id, graph, seed, 'summary');
  }, [card.id, graph, seed]);

  return (
    <div
      className="flex flex-col h-full overflow-y-auto"
      style={{ backgroundColor: 'var(--bg-surface)' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{
          backgroundColor: 'var(--bg-deep)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <button
          onClick={onBack}
          aria-label="back"
          className="transition-colors text-lg px-1"
          style={{ color: 'var(--accent-gold)', fontSize: '1.1875rem' }}
        >
          ←
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2
              className="font-semibold tracking-wide truncate"
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-display)',
              }}
            >
              {card.name}
            </h2>
            <button
              onClick={onViewProfile}
              className="flex-shrink-0 transition-opacity hover:opacity-70"
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--accent-gold)',
              }}
              aria-label={`Open full character sheet for ${card.name}`}
            >
              Sheet →
            </button>
          </div>
          <Tooltip label="Knowledge Level" desc="How well you know this agent. Grows through proximity, worship, scry, and narrative contact.">
            <div
              className="underline decoration-dotted cursor-help"
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--accent-gold-dim)',
              }}
            >
              {knowledgeLevelLabel}
            </div>
          </Tooltip>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Location */}
        <div className="flex items-center gap-1.5" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
          <span>In {card.locationName}</span>
          {onZoomToLocation && (
            <button
              onClick={(e) => { e.stopPropagation(); onZoomToLocation(card.locationId); }}
              aria-label={`Zoom to ${card.locationName}`}
              className="flex-shrink-0 transition-opacity hover:opacity-70"
              style={{ color: 'var(--accent-gold-dim)', fontSize: 'var(--text-xs)', lineHeight: 1 }}
              title={`Zoom to ${card.locationName}`}
            >
              &#x1F441;
            </button>
          )}
        </div>

        {/* Agent summary prose (Recognised+) */}
        {agentProse && card.knowledgeLevel !== 'stranger' && (
          <div
            className="rounded p-2.5"
            style={{
              backgroundColor: 'var(--bg-raised)',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <p
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-muted)',
                lineHeight: '1.5',
              }}
            >
              {agentProse.trim()}
            </p>
          </div>
        )}

        {/* Stranger level: just name and location */}
        {card.knowledgeLevel === 'stranger' && (
          <div
            className="italic"
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
            }}
          >
            Identity obscured...
          </div>
        )}

        {/* Recognised+ level: archetype and faction */}
        {card.knowledgeLevel !== 'stranger' && (
          <>
            {card.archetypeLabel && (
              <div
                className="rounded px-2 py-1.5"
                style={{
                  backgroundColor: 'var(--bg-raised)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <p
                  className="font-semibold"
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {card.archetypeId ? (
                    <Tooltip id={`archetype.${card.archetypeId}`}><span className="underline decoration-dotted cursor-help">{card.archetypeLabel}</span></Tooltip>
                  ) : card.archetypeLabel}
                </p>
              </div>
            )}

            {card.factionName && (
              <div className="inline-block">
                <span
                  className="inline-block px-2 py-1 font-medium rounded"
                  style={{
                    fontSize: 'var(--text-xs)',
                    backgroundColor: 'var(--bg-raised)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {card.factionName}
                </span>
              </div>
            )}

            {card.cultureName && (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                Culture: <span style={{ color: 'var(--text-primary)' }}>{card.cultureName}</span>
              </div>
            )}
          </>
        )}

        {/* Values */}
        {card.topValues && card.topValues.length > 0 && (
          <div>
            <h3
              className="font-semibold tracking-wider uppercase mb-1.5"
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-display)',
              }}
            >
              Character
            </h3>
            <div className="space-y-1">
              {card.topValues.map((val, idx) => (
                <div key={idx} style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
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
              className="font-semibold tracking-wider uppercase mb-1.5"
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-display)',
              }}
            >
              Domains
            </h3>
            <div className="space-y-1">
              {card.domains.map((dom, idx) => (
                <div key={idx} style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                  {dom.word} in <Tooltip id={`reach.${dom.domain}`}><span className="underline decoration-dotted cursor-help">{DOMAIN_NAMES[dom.domain]}</span></Tooltip>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bonds */}
        {card.topBonds && card.topBonds.length > 0 && (
          <div>
            <h3
              className="font-semibold tracking-wider uppercase mb-1.5"
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-display)',
              }}
            >
              Bonds
            </h3>
            <div className="space-y-1">
              {card.topBonds.map((bond, idx) => {
                const sentimentColor = bond.sentiment === 'positive' ? 'text-green-400/70' : 'text-red-400/70';
                return (
                  <div key={idx} className={`${sentimentColor}`} style={{ fontSize: 'var(--text-xs)' }}>
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
              className="font-semibold tracking-wider uppercase mb-1.5"
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-display)',
              }}
            >
              Voice
            </h3>
            <div className="space-y-1">
              {card.quotes.map((quote, idx) => (
                <p key={idx} className="italic" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
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
              className="font-semibold tracking-wider uppercase mb-1.5"
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-display)',
              }}
            >
              Disposition
            </h3>
            <Tooltip label="Cooperation Strategy" desc="How this agent behaves in prisoner's dilemma situations. Affects trust, betrayal, and reputation.">
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                Strategy: <span className="underline decoration-dotted cursor-help" style={{ color: 'var(--text-primary)' }}>{card.cooperationStrategy}</span>
              </div>
            </Tooltip>
            {card.reputationWord && (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
                Reputation: <span style={{ color: 'var(--text-primary)' }}>{card.reputationWord}</span>
              </div>
            )}
          </div>
        )}

        {/* Traits (Intimate+) */}
        {card.allTraits && card.allTraits.length > 0 && (
          <div>
            <h3
              className="font-semibold tracking-wider uppercase mb-1.5"
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-display)',
              }}
            >
              Traits
            </h3>
            <div className="space-y-1">
              {card.allTraits.map((trait, idx) => (
                <div key={idx} style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
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
              className="font-semibold tracking-wider uppercase mb-1.5"
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-display)',
              }}
            >
              Backstory
            </h3>
            <p className="leading-relaxed" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              {card.backstoryParagraph1}
            </p>
          </div>
        )}
      </div>

      {/* Footer: prominent View Profile button */}
      <div
        className="flex gap-2 px-4 py-4 flex-shrink-0"
        style={{
          backgroundColor: 'var(--bg-deep)',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <button
          onClick={onViewProfile}
          className="flex-1 px-4 py-3 font-semibold rounded-lg transition-all"
          style={{
            fontSize: 'var(--text-sm)',
            fontFamily: 'var(--font-display)',
            backgroundColor: 'var(--accent-gold)',
            color: 'var(--bg-abyss, #0a0a0e)',
            letterSpacing: '0.5px',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
        >
          View Full Character Sheet
        </button>
      </div>
    </div>
  );
});

AgentInfoCard.displayName = 'AgentInfoCard';
