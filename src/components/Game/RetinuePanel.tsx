import React from 'react';
import type { RetinueAgent } from '../../engine/retinue';

interface RetinuePanelProps {
  agents: RetinueAgent[];
  selectedAgentId: string | null;
  onAgentSelect: (agentId: string) => void;
}

// Tier colors: 1=gray, 2=purple, 3=gold, 4=red
const TIER_COLORS: Record<number, string> = {
  1: '#6b7280', // gray
  2: '#a78bfa', // purple
  3: '#eab308', // gold
  4: '#ef4444', // red
};

export const RetinuePanel = React.memo(function RetinuePanel({ agents, selectedAgentId, onAgentSelect }: RetinuePanelProps) {
  if (agents.length === 0) {
    return (
      <div className="text-amber-200/30 text-xs italic text-center py-2">
        No agents under your influence yet.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3
        className="text-xs font-bold text-amber-100/60 uppercase tracking-wider"
        style={{ fontFamily: 'Cinzel, serif' }}
      >
        Retinue ({agents.length})
      </h3>
      <div className="space-y-1.5 max-h-[calc(100vh-200px)] overflow-y-auto">
        {agents.map((agent) => {
          const tierColor = TIER_COLORS[agent.tier] || '#78716c';
          const isSelected = agent.id === selectedAgentId;

          return (
            <div
              key={agent.id}
              data-testid="retinue-entry"
              onClick={() => onAgentSelect(agent.id)}
              className={`
                bg-stone-700/50 rounded px-2.5 py-1.5 border border-stone-600/30 cursor-pointer
                transition-colors hover:bg-stone-600/50 active:bg-stone-600/70
                ${isSelected ? 'ring-2 ring-amber-400/60 border-amber-400/30' : ''}
              `}
            >
              {/* Agent name and tier */}
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="text-sm font-medium text-amber-100/90 truncate flex-1">
                  {agent.name}
                </span>
                <span
                  className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                  style={{
                    color: tierColor,
                    backgroundColor: tierColor + '20', // 20% opacity
                  }}
                >
                  {agent.tierName}
                </span>
              </div>

              {/* Location and faction on second line */}
              <div className="text-[11px] text-amber-200/60 space-y-0.5">
                <div className="flex items-center gap-1">
                  <span className="text-amber-200/40">Location:</span>
                  <span className="truncate">{agent.locationName}</span>
                </div>
                {agent.factionName && (
                  <div className="flex items-center gap-1">
                    <span className="text-amber-200/40">Faction:</span>
                    <span className="truncate">{agent.factionName}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
