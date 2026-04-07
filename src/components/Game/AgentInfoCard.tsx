import React, { useMemo, useState, useEffect } from 'react';
import type { AgentInfoCardData } from '../../engine/agentDetail';
import type { WorldGraph } from '../../engine/graph';
import type { ReachDomain } from '../../types/traits';
import { ReachIcon } from '../icons';
import { Tooltip } from '../shared/Tooltip';
import { generateEntityProse } from '../../engine/proseGenerator';
import { CATEGORY_GLYPHS, CATEGORY_COLORS } from '../../data/ambition-categories';
import { getSphereColor } from '../../data/sphereIcons';
import { BACKSTORY_CONSTANTS } from '../../types/prose';

interface AgentInfoCardProps {
  card: AgentInfoCardData;
  onViewProfile: () => void;
  onBack: () => void;
  onZoomToLocation?: (locationId: string) => void;
  // Prose generation (optional)
  graph?: WorldGraph;
  seed?: number;
  /** Current game tick — enables tick-based prose cache (PERF-01) */
  tick?: number;
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
  tick,
}: AgentInfoCardProps) {
  const knowledgeLevelLabel = KNOWLEDGE_LEVEL_DISPLAY[card.knowledgeLevel] || card.knowledgeLevel;

  // Generate prose for agent (memoized — tick enables cross-instance prose cache PERF-01)
  // RC-004: Fixed card.agentId → card.id (agentId doesn't exist on AgentInfoCardData)
  const agentProse = useMemo(() => {
    if (!graph || seed === undefined || tick === undefined) return '';
    return generateEntityProse(card.id, graph, seed, 'summary', tick);
  }, [card.id, graph, seed, tick]);

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
          borderBottom: '1px solid var(--border-gold)',
        }}
      >
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
          <Tooltip id={`knowledge.${card.knowledgeLevel}`}>
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
        <button
          onClick={onBack}
          aria-label="close"
          className="transition-colors text-lg px-2 ml-2 flex-shrink-0"
          style={{ color: 'var(--accent-gold)' }}
        >
          ✕
        </button>
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

        {/* Active Effects (divine influences & court position) */}
        {card.activeEffects && card.activeEffects.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {card.activeEffects.map((effect, idx) => {
              const sphereColor = effect.sphere ? getSphereColor(effect.sphere) : 'var(--accent-gold)';
              const isCourtPosition = effect.type === 'scry_court';
              const strengthPct = effect.strength != null ? Math.round(effect.strength * 100) : null;

              return (
                <Tooltip
                  key={idx}
                  label={effect.label}
                  desc={
                    isCourtPosition
                      ? 'Court position in your divine Scry'
                      : `${strengthPct}% strength · ${effect.ticksRemaining} ticks remaining`
                  }
                >
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full cursor-help"
                    style={{
                      fontSize: 'var(--text-xs)',
                      backgroundColor: `color-mix(in srgb, ${sphereColor} 15%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${sphereColor} 40%, transparent)`,
                      color: sphereColor,
                    }}
                  >
                    {isCourtPosition ? '♛' : '◈'}
                    <span>{effect.label}</span>
                    {!isCourtPosition && strengthPct != null && (
                      <span
                        style={{
                          width: '1.5rem',
                          height: '3px',
                          borderRadius: '2px',
                          backgroundColor: `color-mix(in srgb, ${sphereColor} 25%, transparent)`,
                          display: 'inline-block',
                          position: 'relative',
                          verticalAlign: 'middle',
                        }}
                      >
                        <span
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            height: '100%',
                            width: `${strengthPct}%`,
                            borderRadius: '2px',
                            backgroundColor: sphereColor,
                          }}
                        />
                      </span>
                    )}
                  </span>
                </Tooltip>
              );
            })}
          </div>
        )}

        {/* Agent summary prose (Recognised+) */}
        {agentProse && card.knowledgeLevel !== 'stranger' && (
          <div
            className="rounded p-2.5"
            style={{
              backgroundColor: 'var(--bg-raised)',
              borderTop: '1px solid var(--border-gold)',
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
                  border: '1px solid var(--border-gold)',
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
                    backgroundColor: card.factionThemeColor
                      ? `${card.factionThemeColor}26`
                      : 'var(--bg-raised)',
                    border: `1px solid ${card.factionThemeColor
                      ? `${card.factionThemeColor}66`
                      : 'var(--border-gold)'}`,
                    color: card.factionThemeColor || 'var(--text-secondary)',
                  }}
                >
                  {card.factionIconGlyph ? `${card.factionIconGlyph} ` : ''}{card.factionName}
                </span>
              </div>
            )}

            {card.cultureName && (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                Culture: <span style={{ color: 'var(--text-primary)' }}>{card.cultureName}</span>
              </div>
            )}

            {/* Primary intent — single line: glyph + name */}
            {card.primaryIntentSummary && (
              <div
                style={{
                  fontSize: 'var(--text-xs)',
                  color: CATEGORY_COLORS[card.primaryIntentSummary.category],
                }}
              >
                {CATEGORY_GLYPHS[card.primaryIntentSummary.category]}{' '}
                {card.primaryIntentSummary.displayName}
              </div>
            )}
          </>
        )}

        {/* Values */}
        {card.topValues && card.topValues.length > 0 && (
          <div>
            <h3
              className="section-heading mb-1.5"
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
              className="section-heading mb-1.5"
            >
              Domains
            </h3>
            <div className="space-y-1">
              {card.domains.map((dom, idx) => (
                <div key={idx} className="flex items-center gap-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                  <ReachIcon reach={dom.domain} size={14} />
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
              className="section-heading mb-1.5"
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
              className="section-heading mb-1.5"
            >
              Voice
            </h3>
            <div className="space-y-2">
              {card.quotes.map((quote, idx) => (
                <div key={idx} className="quote-block" style={{ fontSize: 'var(--text-xs)', padding: '10px 16px' }}>
                  &ldquo;{quote}&rdquo;
                  <span className="quote-attr">~ {card.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cooperation Strategy (Intimate+) */}
        {card.cooperationStrategy && (
          <div>
            <h3
              className="section-heading mb-1.5"
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
              className="section-heading mb-1.5"
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
              className="section-heading mb-1.5"
            >
              Backstory
            </h3>
            <p className="leading-relaxed" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              {card.backstoryParagraph1}
            </p>
          </div>
        )}

        {/* Their Story teaser (Recognised+ knowledge, Tier 1+ influence) */}
        {card.backstory && card.backstory.strata.length > 0 && (
          <BackstoryTeaser card={card} onViewProfile={onViewProfile} />
        )}
      </div>

      {/* Footer: prominent View Profile button */}
      <div
        className="flex gap-2 px-4 py-4 flex-shrink-0"
        style={{
          backgroundColor: 'var(--bg-deep)',
          borderTop: '1px solid var(--border-gold)',
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

/** Compact backstory teaser for the sidebar — shows one sentence from stratum 1 */
function BackstoryTeaser({
  card,
  onViewProfile,
}: {
  card: import('../../engine/agentDetail').AgentInfoCardData;
  onViewProfile: () => void;
}) {
  const backstory = card.backstory!;
  const stratum1 = backstory.strata.find(s => s.tier === 1);
  const hasNew = backstory.strata.some(s => s.isNew);
  const [faded, setFaded] = useState(false);

  useEffect(() => {
    if (!hasNew) return;
    const timer = setTimeout(() => setFaded(true), BACKSTORY_CONSTANTS.NEW_BADGE_FADE_MS);
    return () => clearTimeout(timer);
  }, [hasNew]);

  const sphereColor = card.primarySphere ? getSphereColor(card.primarySphere) : 'var(--accent-gold)';
  // First sentence of stratum 1
  const teaser = stratum1
    ? (stratum1.text.split('.')[0] + '.').trim()
    : '';

  return (
    <div>
      <h3
        className="font-semibold tracking-wider uppercase mb-1.5 flex items-center gap-1.5"
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-display)',
        }}
      >
        Their Story
        {hasNew && (
          <span
            className="transition-opacity duration-1000"
            style={{ color: sphereColor, opacity: faded ? 0 : 1 }}
          >
            ✦
          </span>
        )}
      </h3>
      {teaser && (
        <p className="leading-relaxed mb-1.5" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
          {teaser}
        </p>
      )}
      <button
        onClick={onViewProfile}
        className="transition-colors"
        style={{ fontSize: 'var(--text-xs)', color: sphereColor, opacity: 0.8 }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.8'; }}
      >
        Read more →
      </button>
    </div>
  );
}
