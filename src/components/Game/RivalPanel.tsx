import React from 'react';
import type { RivalDefinition, RivalState } from '../../types/rival';
import { RivalIcon } from '../shared/RivalIcon';
import { Tooltip } from '../shared/Tooltip';
import { SectionHeading } from '../shared/SectionHeading';
import { ListRow } from '../shared/ListRow';

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
      <div className="italic text-center py-2" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
        No rival gods stir... yet.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div>
        <Tooltip id="ui.rival_panel">
          <SectionHeading as="h2" count={definitions.length}>Rival Gods</SectionHeading>
        </Tooltip>
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
          <ListRow
            key={def.id}
            accentColor={color}
            trailing={
              <span className="uppercase tracking-wider" style={{ fontSize: 'var(--text-xs)', color }}>
                {def.behavior}
              </span>
            }
          >
            <ListRow.Leading>
              {spheres.length > 0 ? (
                <RivalIcon spheres={spheres} size="1.2rem" title={`${def.name}'s sphere affinities`} />
              ) : (
                <span style={{ fontSize: 'var(--text-sm)', color }}>{icon}</span>
              )}
            </ListRow.Leading>
            <div style={{ minWidth: 0, flex: 1 }}>
              <ListRow.Title>{def.name}</ListRow.Title>
              <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)' }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${hostility * 100}%`,
                    backgroundColor: `rgb(${Math.round(hostility * 220)}, ${Math.round((1 - hostility) * 120)}, 50)`,
                  }}
                />
              </div>
              {rivalState?.lastAction && (
                <ListRow.Subtitle>Last: {rivalState.lastAction}</ListRow.Subtitle>
              )}
            </div>
          </ListRow>
        );
      })}
    </div>
  );
});
