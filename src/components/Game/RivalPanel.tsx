import React from 'react';
import type { RivalDefinition, RivalState } from '../../types/rival';
import { RivalIcon } from '../shared/RivalIcon';
import { Tooltip } from '../shared/Tooltip';
import { SectionHeading } from '../shared/SectionHeading';
import { ListRow } from '../shared/ListRow';
import { BEHAVIOR_COLORS, BEHAVIOR_COLOR_DEFAULT, BEHAVIOR_ICONS, getHostilityColor } from '../../data/uiColorPalette';

interface RivalPanelProps {
  definitions: RivalDefinition[];
  states: RivalState[];
}

export const RivalPanel = React.memo(function RivalPanel({ definitions, states }: RivalPanelProps) {
  if (definitions.length === 0) {
    return (
      <p
        className="italic text-center py-2 animate-breathe"
        style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}
      >
        No rival gods stir... yet.
      </p>
    );
  }

  const hostilityLabel = (h: number) =>
    h < 0.25 ? 'wary' : h < 0.5 ? 'hostile' : h < 0.75 ? 'aggressive' : 'wrathful';

  return (
    <div className="space-y-2">
      <div>
        <Tooltip id="ui.rival_panel">
          <SectionHeading as="h2" count={definitions.length}>Rival Gods</SectionHeading>
        </Tooltip>
      </div>
      <div role="list" aria-label="Rival gods">
        {definitions.map((def) => {
          const rivalState = states.find(s => s.rivalId === def.id);
          const hostility = rivalState?.hostilityToPlayer ?? 0;
          const icon = BEHAVIOR_ICONS[def.behavior] ?? '●';
          const color = BEHAVIOR_COLORS[def.behavior] ?? BEHAVIOR_COLOR_DEFAULT;

          // Collect primary and secondary spheres for RivalIcon
          const spheres = [];
          if (def.primarySphere) spheres.push(def.primarySphere);
          if (def.secondarySphere) spheres.push(def.secondarySphere);

          return (
            <div key={def.id} role="listitem" aria-label={`${def.name}, ${def.behavior}, ${hostilityLabel(hostility)}`}>
              <ListRow
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
                  <div
                    className="mt-1 h-1 rounded-full overflow-hidden"
                    style={{ backgroundColor: 'var(--bg-surface)' }}
                    role="meter"
                    aria-label={`Hostility: ${hostilityLabel(hostility)}`}
                    aria-valuenow={Math.round(hostility * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${hostility * 100}%`,
                        backgroundColor: getHostilityColor(hostility),
                      }}
                    />
                  </div>
                  {rivalState?.lastAction && (
                    <ListRow.Subtitle>Last: {rivalState.lastAction}</ListRow.Subtitle>
                  )}
                </div>
              </ListRow>
            </div>
          );
        })}
      </div>
    </div>
  );
});
