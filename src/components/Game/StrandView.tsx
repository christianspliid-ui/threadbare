import { useState } from 'react';
import type {
  PresenceStrandData,
  DesiresStrandData,
  BondsStrandData,
  AmbitionsStrandData,
  BeliefsStrandData,
  FearsStrandData,
  ValueInsight,
} from '../../engine/strands';

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

const STRAND_ICONS: Record<StrandName, string> = {
  Presence: '👁',
  Desires: '🔥',
  Bonds: '🔗',
  Ambitions: '⭐',
  Beliefs: '📜',
  Fears: '🌑',
};

const STRAND_COLORS: Record<StrandName, string> = {
  Presence: '#d4a574',
  Desires: '#e87534',
  Bonds: '#5c6bc0',
  Ambitions: '#eab308',
  Beliefs: '#7cb342',
  Fears: '#b71c1c',
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
      <div className="text-amber-200/40 text-sm italic">
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
              <span className="text-sm text-amber-100/80 flex-grow">
                {insight.label}
              </span>
            </div>
            <div className="text-xs text-amber-200/50 pl-0">
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

  // Render content based on active strand
  function renderContent() {
    switch (activeStrand) {
      case 'Presence': {
        const data = strands.presence;
        return (
          <div className="space-y-4">
            {data.locationName && (
              <div>
                <h4 className="text-xs font-bold text-amber-100/60 uppercase tracking-wider mb-2">
                  Location
                </h4>
                <p className="text-sm text-amber-100/90">{data.locationName}</p>
              </div>
            )}

            {data.topDomains.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-amber-100/60 uppercase tracking-wider mb-2">
                  Domain Mastery
                </h4>
                <div className="space-y-2">
                  {data.topDomains.map((domain) => (
                    <div key={domain.domain} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-amber-100/80">{domain.domain}</span>
                        <span className="text-xs text-amber-200/50">
                          {(domain.score * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 bg-stone-700/50 rounded-full overflow-hidden">
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
                <h4 className="text-xs font-bold text-amber-100/60 uppercase tracking-wider mb-2">
                  Companions Present
                </h4>
                <div className="space-y-1">
                  {data.companions.map((companion) => (
                    <div key={companion.id} className="text-sm text-amber-100/80">
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
            <h4 className="text-xs font-bold text-amber-100/60 uppercase tracking-wider mb-3">
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
                <h4 className="text-xs font-bold text-amber-100/60 uppercase tracking-wider mb-2">
                  Faction Allegiances
                </h4>
                <div className="space-y-1">
                  {data.factions.map((faction) => (
                    <div key={faction.id} className="text-sm">
                      <span className="text-amber-100/90">{faction.name}</span>
                      {faction.role && (
                        <span className="text-amber-200/40 text-xs ml-2">
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
                <h4 className="text-xs font-bold text-amber-100/60 uppercase tracking-wider mb-2">
                  Key Relationships
                </h4>
                <div className="space-y-2">
                  {data.relationships.map((rel) => {
                    const sentimentColor =
                      rel.sentiment > 0.3 ? '#10b981' : rel.sentiment < -0.3 ? '#dc2626' : '#a89968';

                    return (
                      <div key={rel.targetId} className="space-y-1">
                        <div className="flex justify-between items-start">
                          <span className="text-sm text-amber-100/90">{rel.targetName}</span>
                          <span
                            className="text-xs"
                            style={{ color: sentimentColor }}
                          >
                            {rel.basis}
                          </span>
                        </div>
                        <div className="h-1.5 bg-stone-700/50 rounded-full overflow-hidden">
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
                <h4 className="text-xs font-bold text-amber-100/60 uppercase tracking-wider mb-3">
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
            <h4 className="text-xs font-bold text-amber-100/60 uppercase tracking-wider mb-3">
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
            <h4 className="text-xs font-bold text-amber-100/60 uppercase tracking-wider mb-3">
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
            <h4 className="text-xs font-bold text-amber-100/60 uppercase tracking-wider mb-3">
              Shadows & Fears
            </h4>
            <InsightList insights={data.insights} color={activeColor} />
          </div>
        );
      }

      default:
        return null;
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center"
      onClick={onClose}
      data-testid="backdrop"
      style={{ pointerEvents: 'auto' }}
    >
      <div
        className="w-[70%] max-w-4xl h-[70%] bg-stone-900/95 rounded-lg border border-amber-900/40 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-amber-900/20 px-6 py-4 flex items-start justify-between flex-shrink-0">
          <div>
            <h2
              className="text-2xl font-bold text-amber-100 tracking-wide"
              style={{ fontFamily: 'Cinzel, serif' }}
            >
              {agentName}
            </h2>
            <p className="text-xs text-amber-200/50 italic mt-1">
              You peer into their soul and see...
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-xl text-amber-200/60 hover:text-amber-100 transition-colors"
            aria-label="✕"
          >
            ✕
          </button>
        </div>

        {/* Strand Tabs */}
        <div className="border-b border-amber-900/20 px-6 flex gap-0 flex-shrink-0">
          {strandNames.map((strandName) => {
            const isActive = activeStrand === strandName;
            const color = STRAND_COLORS[strandName];
            const icon = STRAND_ICONS[strandName];

            return (
              <button
                key={strandName}
                onClick={() => setActiveStrand(strandName)}
                className={`px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                  isActive
                    ? 'text-amber-100 border-b-2'
                    : 'text-amber-400/40 border-b-2 border-transparent'
                }`}
                style={{
                  borderBottomColor: isActive ? color : 'transparent',
                  color: isActive ? color : undefined,
                }}
              >
                <span className="mr-2">{icon}</span>
                {strandName}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 text-amber-100/90">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
