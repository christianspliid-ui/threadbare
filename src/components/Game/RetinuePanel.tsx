import React from 'react';
import type { RetinueAgent } from '../../engine/retinue';
import { Tooltip } from '../shared/Tooltip';
import { SectionHeading } from '../shared/SectionHeading';

interface RetinuePanelProps {
  agents: RetinueAgent[];
  selectedAgentId: string | null;
  onAgentSelect: (agentId: string) => void;
  onZoomToLocation?: (locationId: string) => void;
}

// Tier colors: 1=gray, 2=purple, 3=gold, 4=red
const TIER_COLORS: Record<number, string> = {
  1: '#6b7280', // gray
  2: '#a78bfa', // purple
  3: '#eab308', // gold
  4: '#ef4444', // red
};

export const RetinuePanel = React.memo(function RetinuePanel({ agents, selectedAgentId, onAgentSelect, onZoomToLocation }: RetinuePanelProps) {
  if (agents.length === 0) {
    return (
      <div
        className="italic text-center py-2 animate-breathe"
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-tertiary)',
        }}
      >
        The threads of fate lie still. No souls yet attend your court.
      </div>
    );
  }

  // IA-002: Group agents by tier to avoid repeating tier labels per entry
  const uniqueTiers = new Set(agents.map(a => a.tier));
  const showTierBadge = uniqueTiers.size > 1;

  return (
    <div className="space-y-2">
      <SectionHeading count={agents.length}>Retinue</SectionHeading>
      {/* IX-015: removed max-h — parent sidebar handles overflow scrolling */}
      <div className="space-y-1.5" role="list">
        {agents.map((agent) => {
          const tierColor = TIER_COLORS[agent.tier] || '#78716c';
          const isSelected = agent.id === selectedAgentId;

          return (
            <Tooltip key={agent.id} label={agent.name} desc={agent.tierName}>
              <div
                role="listitem"
                data-testid="retinue-entry"
                onClick={() => onAgentSelect(agent.id)}
                className={`
                  rounded px-2.5 py-1.5 border cursor-pointer
                  transition-colors active:opacity-90 duration-150
                  ${isSelected ? 'ring-2 ring-amber-400/60 border-amber-400/30' : ''}
                `}
                style={{
                  backgroundColor: 'var(--bg-raised)',
                  borderColor: isSelected ? undefined : 'var(--border-subtle)',
                  borderLeftColor: tierColor,
                  borderLeftWidth: '3px',
                  transition: 'background-color 150ms ease',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-raised)';
                }}
              >
                {/* Agent name and optional tier badge */}
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span
                    className="font-medium truncate flex-1"
                    style={{
                      fontSize: 'var(--text-sm)',
                      color: 'var(--text-primary)',
                      opacity: 0.9,
                    }}
                  >
                    {agent.name}
                  </span>
                  {showTierBadge && (
                    <span
                      className="font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                      style={{
                        fontSize: 'var(--text-xs)',
                        color: tierColor,
                        backgroundColor: tierColor + '20',
                      }}
                    >
                      {agent.tierName}
                    </span>
                  )}
                </div>

                {/* Location on second line */}
                <div className="flex items-center gap-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                  <span className="truncate">{agent.locationName}</span>
                  {onZoomToLocation && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onZoomToLocation(agent.locationId); }}
                      aria-label={`Zoom to ${agent.locationName}`}
                      className="flex-shrink-0 transition-opacity hover:opacity-70"
                      style={{ color: 'var(--accent-gold-dim)', fontSize: 'var(--text-xs)', lineHeight: 1 }}
                      title={`Zoom to ${agent.locationName}`}
                    >
                      &#x1F441;
                    </button>
                  )}
                </div>
              </div>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
});
