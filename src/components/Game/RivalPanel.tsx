import React from 'react';
import type { RivalDefinition, RivalState } from '../../types/rival';
import { RivalIcon } from '../shared/RivalIcon';

interface RivalPanelProps {
  definitions: RivalDefinition[];
  states: RivalState[];
}

const BEHAVIOR_ICONS: Record<string, string> = {
  aggressive: '⚔', // Crossed swords for combat/aggression
  subtle: '◇', // Diamond for stealth/subtlety
  territorial: '▪', // Square for land/domain control
  expansionist: '⬆', // Up arrow for growth/expansion
};

const BEHAVIOR_COLORS: Record<string, string> = {
  aggressive: '#dc2626',
  subtle: '#7c3aed',
  territorial: '#ea580c',
  expansionist: '#059669',
};

export const RivalPanel = React.memo(function RivalPanel({ definitions, states }: RivalPanelProps) {
  if (definitions.length === 0) {
    return (
      <div className="text-amber-200/30 text-xs italic text-center py-2">
        No rival gods stir... yet.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div>
        <h2
          className="text-xs font-bold text-amber-100/60 uppercase tracking-wider"
          style={{ fontFamily: 'Cinzel, serif' }}
        >
          Rival Gods
        </h2>
        <div className="mt-2 flex items-center gap-1.5">
          <span className="text-[10px] text-amber-200/40 uppercase tracking-wider font-semibold">Hostility</span>
        </div>
      </div>
      {definitions.map((def) => {
        const rivalState = states.find(s => s.rivalId === def.id);
        const hostility = rivalState?.hostilityToPlayer ?? 0;
        const icon = BEHAVIOR_ICONS[def.behavior] ?? '●';
        const color = BEHAVIOR_COLORS[def.behavior] ?? '#78716c';

        // Collect primary and secondary spheres for RivalIcon
        const spheres = [];
        if (def.primarySphere) spheres.push(def.primarySphere);
        if (def.secondarySphere) spheres.push(def.secondarySphere);

        return (
          <div key={def.id} className="bg-stone-700/50 rounded px-2 py-1.5 border border-stone-600/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {spheres.length > 0 ? (
                  <RivalIcon spheres={spheres} size="1.2rem" title={`${def.name}'s sphere affinities`} />
                ) : (
                  <span className="text-sm" style={{ color }}>{icon}</span>
                )}
                <span className="text-xs text-amber-100/80 font-medium truncate max-w-[140px]">
                  {def.name}
                </span>
              </div>
              <span className="text-[10px] uppercase tracking-wider" style={{ color }}>
                {def.behavior}
              </span>
            </div>
            <div className="mt-1 flex-1 h-1 bg-stone-600/50 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${hostility * 100}%`,
                  backgroundColor: `rgb(${Math.round(hostility * 220)}, ${Math.round((1 - hostility) * 120)}, 50)`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
});
