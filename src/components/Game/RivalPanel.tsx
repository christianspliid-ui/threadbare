import React, { useState } from 'react';
import type { RivalDefinition, RivalState } from '../../types/rival';
import { RivalIcon } from '../shared/RivalIcon';
import { Tooltip } from '../shared/Tooltip';
import { SectionHeading } from '../shared/SectionHeading';
import { ListRow } from '../shared/ListRow';
import { BEHAVIOR_COLORS, BEHAVIOR_COLOR_DEFAULT, BEHAVIOR_ICONS, getHostilityColor, hostilityLabel } from '../../data/uiColorPalette';

/** The name reads as a link (the underline `EntityLink` draws) and toggles the rival's entry. */
const RIVAL_NAME_STYLE = {
  background: 'none',
  border: 'none',
  padding: 0,
  margin: 0,
  cursor: 'pointer',
  color: 'var(--accent-gold, #d4af37)',
  textDecoration: 'underline',
  textUnderlineOffset: '2px',
  font: 'inherit',
} as const;

interface RivalPanelProps {
  definitions: RivalDefinition[];
  states: RivalState[];
}

/** Sphere ids are lower-case in the data; the panel speaks them as names. */
function sphereWord(sphere: string): string {
  return sphere.charAt(0).toUpperCase() + sphere.slice(1);
}

export const RivalPanel = React.memo(function RivalPanel({ definitions, states }: RivalPanelProps) {
  // THR-1780: a rival god's name opens its entry in place. Rivals are run state, not graph
  // nodes, so there is no sheet for the ref router to open — the disclosure is the sheet.
  const [openRivalId, setOpenRivalId] = useState<string | null>(null);
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
                  <ListRow.Title>
                    <button
                      type="button"
                      data-testid="rival-name"
                      aria-expanded={openRivalId === def.id}
                      aria-controls={`rival-detail-${def.id}`}
                      onClick={() => setOpenRivalId((cur) => (cur === def.id ? null : def.id))}
                      style={RIVAL_NAME_STYLE}
                    >
                      {def.name}
                    </button>
                  </ListRow.Title>
                  {openRivalId === def.id && (
                    <div
                      id={`rival-detail-${def.id}`}
                      data-testid="rival-detail"
                      className="mt-1 space-y-0.5"
                      style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', whiteSpace: 'normal' }}
                    >
                      {spheres.length > 0 && (
                        <p>God of {spheres.map(sphereWord).join(' and ')}, {def.behavior} by temper.</p>
                      )}
                      <p>Toward you: {hostilityLabel(hostility)}.</p>
                    </div>
                  )}
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
                  {rivalState?.schemes && rivalState.schemes.length > 0 && (
                    <div className="mt-2 space-y-1" aria-label={`${def.name} active schemes`}>
                      {rivalState.schemes.map((scheme) => {
                        const failed = scheme.status === 'failed';
                        const done = scheme.status === 'completed';
                        return (
                          <div
                            key={scheme.compositionId}
                            className="rounded px-1.5 py-1"
                            role="group"
                            aria-label={`${scheme.label}, phase ${scheme.phaseIndex} of ${scheme.totalPhases}, ${scheme.status}`}
                            style={{
                              backgroundColor: 'var(--bg-surface)',
                              border: '1px solid var(--border-subtle)',
                              opacity: failed ? 0.55 : 1,
                            }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span
                                style={{
                                  fontSize: 'var(--text-xs)',
                                  color: 'var(--text-secondary)',
                                  textDecoration: failed ? 'line-through' : 'none',
                                }}
                              >
                                {scheme.label}
                              </span>
                              {scheme.contested && !failed && !done && (
                                <span
                                  className="uppercase tracking-wider"
                                  style={{ fontSize: '0.6rem', color: 'var(--color-warning, #d9a441)' }}
                                >
                                  Contested
                                </span>
                              )}
                              {done && (
                                <span className="uppercase tracking-wider" style={{ fontSize: '0.6rem', color }}>
                                  Done
                                </span>
                              )}
                            </div>
                            <div className="mt-1 flex gap-1">
                              {Array.from({ length: scheme.totalPhases }).map((_, idx) => (
                                <span
                                  key={idx}
                                  className="rounded-full transition-all duration-300"
                                  style={{
                                    width: '0.4rem',
                                    height: '0.4rem',
                                    backgroundColor:
                                      idx < scheme.phaseIndex ? color : 'var(--bg-raised, #2a2a2a)',
                                    border:
                                      idx === scheme.phaseIndex && !done && !failed
                                        ? `1px solid ${color}`
                                        : '1px solid transparent',
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
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
