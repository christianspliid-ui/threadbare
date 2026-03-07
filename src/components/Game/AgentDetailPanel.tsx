import React from 'react';
import type { AgentDetail } from '../../engine/agentDetail';
import type { ReachDomain } from '../../types/traits';
import type { CooperationStrategy } from '../../types/disposition';

interface AgentDetailPanelProps {
  detail: AgentDetail;
  onBack: () => void;
  onViewPsyche: () => void;
  onIntervene: () => void;
  onLocationClick: (locationId: string) => void;
}

// Tier colors: 1=gray, 2=purple, 3=gold, 4=red
const TIER_COLORS: Record<number, string> = {
  1: '#6b7280', // gray
  2: '#a78bfa', // purple
  3: '#eab308', // gold
  4: '#ef4444', // red
};

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

// Strategy display names
const STRATEGY_DISPLAY: Record<CooperationStrategy, string> = {
  'tit-for-tat': 'Tit for Tat',
  'grudger': 'Grudger',
  'pavlov': 'Pavlov',
  'always-cooperate': 'Always Cooperate',
  'always-defect': 'Always Defect',
};

// Grid layout order: 3x3
const DOMAINS_GRID: ReachDomain[][] = [
  ['iron', 'gold', 'shadow'],
  ['veil', 'heart', 'eye'],
  ['stone', 'star', 'flesh'],
];

export const AgentDetailPanel = React.memo(function AgentDetailPanel({
  detail,
  onBack,
  onViewPsyche,
  onIntervene,
  onLocationClick,
}: AgentDetailPanelProps) {
  const tierColor = TIER_COLORS[detail.tier] || '#78716c';
  const archetypeReaches = detail.archetype?.reachAffinities || [];

  return (
    <div className="flex flex-col h-full bg-stone-900 overflow-y-auto">
      {/* Header Bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-stone-800/90 border-b border-amber-900/30 flex-shrink-0">
        <button
          onClick={onBack}
          aria-label="back"
          className="text-amber-400 hover:text-amber-200 transition-colors text-lg px-1"
        >
          ←
        </button>

        {/* Agent name and tier */}
        <div className="flex-1">
          <h2
            className="text-amber-100 text-sm font-semibold tracking-wide"
            style={{ fontFamily: 'Cinzel, serif' }}
          >
            {detail.name}
          </h2>
          <div className="flex items-center gap-2 mt-0.5">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: tierColor }}
            />
            <span className="text-xs text-amber-400/70">{detail.tierName}</span>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Archetype Banner */}
        {detail.archetype && (
          <div className="bg-stone-700/50 border border-amber-900/30 rounded px-3 py-2.5">
            <h3
              className="text-amber-100 text-sm font-semibold tracking-wide"
              style={{ fontFamily: 'Cinzel, serif' }}
            >
              {detail.archetype.name}
            </h3>
            <p className="text-amber-400/60 text-xs italic mt-1">
              {detail.archetype.storyShape}
            </p>

            {/* Reach affinity dots */}
            {detail.archetype.reachAffinities.length > 0 && (
              <div className="flex gap-1.5 mt-2">
                {detail.archetype.reachAffinities.map(reach => (
                  <div
                    key={reach}
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: '#b4a07f', // amber tone
                    }}
                    title={DOMAIN_NAMES[reach]}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Faction tag */}
        {detail.factionName && (
          <div className="inline-block">
            <span
              className="inline-block px-2.5 py-1 text-xs font-medium rounded"
              style={{
                color: '#b4a07f',
                backgroundColor: '#78716c40',
                border: '1px solid #78716c80',
              }}
            >
              {detail.factionName}
            </span>
          </div>
        )}

        {/* Domain Grid */}
        <div>
          <h3
            className="text-amber-200/80 text-xs font-semibold tracking-wider uppercase mb-2.5"
            style={{ fontFamily: 'Cinzel, serif' }}
          >
            Domains
          </h3>
          <div className="space-y-2">
            {DOMAINS_GRID.map((row, rowIdx) => (
              <div key={rowIdx} className="grid grid-cols-3 gap-2">
                {row.map(domain => {
                  const score = detail.domainCapabilities[domain] || 0;
                  const percentage = Math.min((score / 10) * 100, 100);
                  const isAffinity = archetypeReaches.includes(domain);

                  return (
                    <div key={domain} className="flex flex-col">
                      <span
                        className={`text-[11px] font-medium mb-1 ${
                          isAffinity ? 'text-amber-100' : 'text-amber-400/50'
                        }`}
                      >
                        {DOMAIN_NAMES[domain]}
                      </span>
                      <div className="bg-stone-700 rounded h-1.5 overflow-hidden">
                        <div
                          className="bg-amber-400 h-full transition-all duration-200"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-amber-400/40 mt-0.5">
                        {score}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Values Section */}
        <div>
          <h3
            className="text-amber-200/80 text-xs font-semibold tracking-wider uppercase mb-2.5"
            style={{ fontFamily: 'Cinzel, serif' }}
          >
            Character
          </h3>
          <div className="space-y-1.5">
            {detail.topValues.map(val => {
              const absValue = Math.abs(val.value);
              const percentage = absValue * 100;

              return (
                <div key={val.pair} className="flex items-center gap-2">
                  <span className="text-xs text-amber-400/70 flex-1 truncate">
                    {val.label}
                  </span>
                  <div className="w-16 bg-stone-700 rounded h-1 overflow-hidden flex-shrink-0">
                    <div
                      className="bg-amber-400 h-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bonds Section */}
        <div>
          <h3
            className="text-amber-200/80 text-xs font-semibold tracking-wider uppercase mb-2.5"
            style={{ fontFamily: 'Cinzel, serif' }}
          >
            Bonds
          </h3>

          {detail.topBonds.length === 0 ? (
            <p className="text-amber-400/30 text-xs italic">No known bonds</p>
          ) : (
            <div className="space-y-1.5">
              {detail.topBonds.map(bond => {
                const sentimentColor =
                  bond.sentiment >= 0
                    ? '#22c55e' // green
                    : '#ef4444'; // red
                const sentimentWidth = Math.abs(bond.sentiment) * 100;

                return (
                  <div key={bond.targetId} className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-amber-100 flex-1 truncate">
                        {bond.targetName}
                      </span>
                      <span className="text-[10px] text-amber-400/50">
                        {bond.basis}
                      </span>
                    </div>
                    <div className="w-full bg-stone-700 rounded h-1 overflow-hidden">
                      <div
                        className="h-full transition-all duration-200"
                        style={{
                          width: `${sentimentWidth}%`,
                          backgroundColor: sentimentColor,
                          opacity: 0.7,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Strategy Section */}
        <div>
          <h3
            className="text-amber-200/80 text-xs font-semibold tracking-wider uppercase mb-2.5"
            style={{ fontFamily: 'Cinzel, serif' }}
          >
            Disposition
          </h3>

          {detail.cooperationStrategy == null ? (
            <p className="text-amber-400/30 text-xs italic">No known strategy</p>
          ) : (
            <div className="space-y-2.5">
              {/* Strategy name */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-400/50">Strategy:</span>
                <span className="text-xs text-amber-100">
                  {STRATEGY_DISPLAY[detail.cooperationStrategy]}
                </span>
              </div>

              {/* Reputation bar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-amber-400/50">Reputation</span>
                  <span className="text-[10px] text-amber-400/40">
                    {detail.reputationScore.toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-stone-700 rounded h-1.5 overflow-hidden relative">
                  {/* Center marker at 0.5 */}
                  <div
                    className="absolute top-0 bottom-0 w-px bg-amber-400/30"
                    style={{ left: '50%' }}
                  />
                  <div
                    className="h-full transition-all duration-200 rounded"
                    style={{
                      width: `${detail.reputationScore * 100}%`,
                      backgroundColor: detail.reputationScore >= 0.5 ? '#22c55e' : '#ef4444',
                      opacity: 0.7,
                    }}
                  />
                </div>
              </div>

              {/* Recent interactions */}
              {detail.recentInteractions.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] text-amber-400/40 uppercase tracking-wider">
                    Recent
                  </span>
                  {detail.recentInteractions.map((ir, idx) => (
                    <div
                      key={`${ir.tick}-${idx}`}
                      className="flex items-center gap-2 text-[11px]"
                    >
                      <span className="text-amber-400/30 w-8 text-right flex-shrink-0">
                        t{ir.tick}
                      </span>
                      <span title={`Actor: ${ir.actorMove}`}>
                        {ir.actorMove === 'cooperate' ? '✓' : '✗'}
                      </span>
                      <span className="text-amber-400/20">vs</span>
                      <span title={`Target: ${ir.targetMove}`}>
                        {ir.targetMove === 'cooperate' ? '✓' : '✗'}
                      </span>
                      <span className="text-amber-400/30 flex-1 truncate">
                        {ir.stakes === 'high' ? '⚡' : ''} {ir.context}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Location Link */}
        <div className="text-xs">
          <span className="text-amber-400/50">Location: </span>
          <button
            onClick={() => onLocationClick(detail.locationId)}
            className="text-amber-100 hover:text-amber-200 underline transition-colors"
          >
            {detail.locationName}
          </button>
        </div>
      </div>

      {/* Action Row Footer */}
      <div className="flex gap-2 px-4 py-3 bg-stone-800/50 border-t border-amber-900/30 flex-shrink-0">
        <button
          onClick={onViewPsyche}
          className="flex-1 px-3 py-2 bg-stone-700/80 hover:bg-stone-600/80 text-amber-100 text-xs font-medium rounded transition-colors border border-amber-900/30"
        >
          View Psyche
        </button>
        <button
          onClick={onIntervene}
          className="flex-1 px-3 py-2 bg-amber-900/40 hover:bg-amber-800/50 text-amber-100 text-xs font-medium rounded transition-colors border border-amber-700/50"
        >
          Intervene
        </button>
      </div>
    </div>
  );
});
