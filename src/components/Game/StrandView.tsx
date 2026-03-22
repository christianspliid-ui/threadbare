import { useState, useMemo } from 'react';
import type {
  PresenceStrandData,
  DesiresStrandData,
  BondsStrandData,
  AmbitionsStrandData,
  BeliefsStrandData,
  FearsStrandData,
  ValueInsight,
} from '../../engine/strands';
import { STRAND_COLORS, SENTIMENT_POSITIVE, SENTIMENT_NEGATIVE, SENTIMENT_NEUTRAL } from '../../data/uiColorPalette';
import { Tooltip } from '../shared/Tooltip';

type StrandName = 'Presence' | 'Desires' | 'Bonds' | 'Ambitions' | 'Beliefs' | 'Fears';

interface StrandViewProps {
  agentName: string;
  strands: {
    presence: PresenceStrandData;
    desires: DesiresStrandData;
    bonds: BondsStrandData;
    ambitions: AmbitionsStrandData;
    beliefs: BeliefsStrandData;
    fears: FearsStrandData;
  };
  onClose: () => void;
}

const STRAND_DESCRIPTIONS: Record<StrandName, string> = {
  Presence: 'Where this agent is and what domains they command. Physical state and spatial awareness.',
  Desires: 'Core drives and motivations. What this agent wants most deeply.',
  Bonds: 'Faction allegiances and personal relationships. The social web surrounding this agent.',
  Ambitions: 'Long-term goals and aspirations. What this agent strives to achieve.',
  Beliefs: 'Deeply held convictions and worldview. The principles that guide this agent.',
  Fears: 'Shadows and anxieties. What this agent dreads or avoids.',
};

const STRAND_ICONS: Record<StrandName, string> = {
  Presence: '◉',  // Eye-like circle for observation
  Desires: '✦',   // Star for passion/drive
  Bonds: '⟡',    // Connected shape for relationships
  Ambitions: '⬆', // Upward for aspiration
  Beliefs: '◈',   // Diamond for conviction
  Fears: '◆',     // Solid shape for weight/darkness
};

interface InsightListProps {
  insights: ValueInsight[];
  color: string;
}

/**
 * Internal subcomponent to render a list of insights with intensity bars
 */
function InsightList({ insights, color }: InsightListProps) {
  if (insights.length === 0) {
    return (
      <div className="italic" style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
        No strong tendencies observed.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {insights.map((insight, idx) => {
        const intensity = Math.abs(insight.value);
        const barWidth = Math.max(5, Math.min(100, intensity * 100));

        return (
          <div key={`${insight.valuePair}-${idx}`} className="space-y-1">
            <div className="flex items-center gap-2">
              <div
                className="h-2 rounded-full flex-shrink-0 transition-all"
                style={{
                  width: `${barWidth}%`,
                  backgroundColor: color,
                  opacity: 0.6 + intensity * 0.4,
                }}
              />
              <span className="flex-grow" style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>
                {insight.label}
              </span>
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}>
              {insight.description}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function StrandView({ agentName, strands, onClose }: StrandViewProps) {
  const [activeStrand, setActiveStrand] = useState<StrandName>('Presence');

  const strandNames: StrandName[] = ['Presence', 'Desires', 'Bonds', 'Ambitions', 'Beliefs', 'Fears'];
  const activeColor = STRAND_COLORS[activeStrand];

  // Memoize renderContent to avoid re-evaluating all 6 branches on every render
  const renderedContent = useMemo(() => {
    switch (activeStrand) {
      case 'Presence': {
        const data = strands.presence;
        return (
          <div className="space-y-4">
            {data.locationName && (
              <div>
                <h4 className="font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>
                  Location
                </h4>
                <p style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>{data.locationName}</p>
              </div>
            )}

            {data.topDomains.length > 0 && (
              <div>
                <h4 className="font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>
                  Domain Mastery
                </h4>
                <div className="space-y-2">
                  {data.topDomains.map((domain) => (
                    <div key={domain.domain} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <Tooltip id={`reach.${domain.domain}`}>
                          <span className="underline decoration-dotted cursor-help" style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>{domain.domain}</span>
                        </Tooltip>
                        <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}>
                          {(domain.score * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-deep)' }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${domain.score * 100}%`,
                            backgroundColor: STRAND_COLORS.Presence,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.companions.length > 0 && (
              <div>
                <h4 className="font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>
                  Companions Present
                </h4>
                <div className="space-y-1">
                  {data.companions.map((companion) => (
                    <div key={companion.id} style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>
                      {companion.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }

      case 'Desires': {
        const data = strands.desires;
        return (
          <div>
            <h4 className="font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>
              Core Desires
            </h4>
            <InsightList insights={data.insights} color={activeColor} />
          </div>
        );
      }

      case 'Bonds': {
        const data = strands.bonds;
        return (
          <div className="space-y-4">
            {data.factions.length > 0 && (
              <div>
                <h4 className="font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>
                  Faction Allegiances
                </h4>
                <div className="space-y-1">
                  {data.factions.map((faction) => (
                    <div key={faction.id}>
                      <span style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>{faction.name}</span>
                      {faction.role && (
                        <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }} className="ml-2">
                          • {faction.role}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.relationships.length > 0 && (
              <div>
                <h4 className="font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>
                  Key Relationships
                </h4>
                <div className="space-y-2">
                  {data.relationships.map((rel) => {
                    const sentimentColor =
                      rel.sentiment > 0.3 ? SENTIMENT_POSITIVE : rel.sentiment < -0.3 ? SENTIMENT_NEGATIVE : SENTIMENT_NEUTRAL;

                    return (
                      <div key={rel.targetId} className="space-y-1">
                        <div className="flex justify-between items-start">
                          <span style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>{rel.targetName}</span>
                          <span style={{ color: sentimentColor, fontSize: 'var(--text-xs)' }}>
                            {rel.basis}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-deep)' }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${rel.strength * 100}%`,
                              backgroundColor: sentimentColor,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {data.insights.length > 0 && (
              <div>
                <h4 className="font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>
                  Bond Insights
                </h4>
                <InsightList insights={data.insights} color={activeColor} />
              </div>
            )}
          </div>
        );
      }

      case 'Ambitions': {
        const data = strands.ambitions;
        return (
          <div>
            <h4 className="font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>
              Ambitions
            </h4>
            <InsightList insights={data.insights} color={activeColor} />
          </div>
        );
      }

      case 'Beliefs': {
        const data = strands.beliefs;
        return (
          <div>
            <h4 className="font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>
              Core Beliefs
            </h4>
            <InsightList insights={data.insights} color={activeColor} />
          </div>
        );
      }

      case 'Fears': {
        const data = strands.fears;
        return (
          <div>
            <h4 className="font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>
              Shadows & Fears
            </h4>
            <InsightList insights={data.insights} color={activeColor} />
          </div>
        );
      }

      default:
        return null;
    }
  }, [activeStrand, strands, activeColor]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
      data-testid="backdrop"
      style={{ pointerEvents: 'auto' }}
    >
      <div
        className="w-[70%] max-w-4xl h-[70%] rounded-lg border flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-gold)' }}
      >
        {/* Header */}
        <div
          className="border-b px-6 py-4 flex items-start justify-between flex-shrink-0"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div>
            <h2
              className="text-2xl font-bold tracking-wide"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
            >
              {agentName}
            </h2>
            <p className="italic mt-1" style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}>
              You peer into their soul and see...
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Psyche Strands"
            title="Close (Esc)"
            className="text-xl transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            ✕
          </button>
        </div>

        {/* Strand Tabs */}
        <div
          className="border-b px-6 flex gap-0 flex-shrink-0"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          {strandNames.map((strandName) => {
            const isActive = activeStrand === strandName;
            const color = STRAND_COLORS[strandName];
            const icon = STRAND_ICONS[strandName];

            return (
              <button
                key={strandName}
                onClick={() => setActiveStrand(strandName)}
                className="px-4 py-3 text-sm font-medium transition-all border-b-2"
                style={{
                  borderBottomColor: isActive ? color : 'transparent',
                  color: isActive ? color : 'var(--text-tertiary)',
                }}
              >
                <Tooltip label={strandName} desc={STRAND_DESCRIPTIONS[strandName]}>
                  <span className="cursor-help">
                    <span className="mr-2">{icon}</span>
                    {strandName}
                  </span>
                </Tooltip>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4" style={{ color: 'var(--text-primary)' }}>
          {renderedContent}
        </div>
      </div>
    </div>
  );
}
