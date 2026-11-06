import React, { useState } from 'react';
import type { RivalBehavior, RivalDefinition, RivalState } from '../../types/rival';
import { RivalIcon } from '../shared/RivalIcon';
import { Tooltip } from '../shared/Tooltip';
import { SectionHeading } from '../shared/SectionHeading';
import { listHeadingIcon } from '../../data/view-content';
import { ListRow } from '../shared/ListRow';
import { BEHAVIOR_COLORS, BEHAVIOR_COLOR_DEFAULT, BEHAVIOR_ICONS, getHostilityColor, hostilityLabel } from '../../data/uiColorPalette';
import { EntityLink } from '../shared/EntityLink';
import { Icon } from '../shared/Icon';
import {
  rivalCauseSegments,
  rivalLastPressedSegments,
  rivalWords,
  type PlaceNameLookup,
  type RivalLineSegment,
} from '../../engine/views/rivalEntry';

/** The temper chip's word, sentence case (Law 14: no raw keys). */
const BEHAVIOR_DISPLAY: Record<RivalBehavior, string> = {
  aggressive: 'Aggressive',
  subtle: 'Subtle',
  territorial: 'Territorial',
  expansionist: 'Expansionist',
};

/**
 * THR-2185: the name is a plain disclosure, not a link. Rivals are run state with no
 * sheet to open, so the gold underline (the router's cross-link look) promised a page
 * that does not exist. It stays a button (Law 21) and opens the only surface a rival has.
 */
const RIVAL_NAME_STYLE = {
  background: 'none',
  border: 'none',
  padding: 0,
  margin: 0,
  cursor: 'pointer',
  color: 'var(--text-primary)',
  textDecoration: 'none',
  font: 'inherit',
} as const;

interface RivalPanelProps {
  definitions: RivalDefinition[];
  states: RivalState[];
  /** THR-2185: the current tick, for "yesterday" and for a cause gone quiet. */
  tick?: number;
  /** THR-2185: a place's name, undefined when it no longer resolves. */
  placeName?: PlaceNameLookup;
}

const NO_PLACE_NAME: PlaceNameLookup = () => undefined;

/** A line's runs: words as text, a place as a link through the one router (Laws 1, 21). */
function renderSegments(segments: readonly RivalLineSegment[]): React.ReactNode {
  return segments.map((s, i) => ('text' in s
    ? <React.Fragment key={i}>{s.text}</React.Fragment>
    : <EntityLink key={i} id={s.placeId} name={s.name} entityRef={{ kind: 'location', id: s.placeId }} />));
}

/** Sphere ids are lower-case in the data; the panel speaks them as names. */
function sphereWord(sphere: string): string {
  return sphere.charAt(0).toUpperCase() + sphere.slice(1);
}

export const RivalPanel = React.memo(function RivalPanel({ definitions, states, tick = 0, placeName = NO_PLACE_NAME }: RivalPanelProps) {
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
    <div className="space-y-2" data-testid="rival-panel">
      <div>
        <Tooltip id="ui.rival_panel">
          <SectionHeading as="h2" count={definitions.length} icon={listHeadingIcon('rivalGods')}>Rival gods</SectionHeading>
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
                  <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 'var(--text-xs)', color }}>
                    {BEHAVIOR_DISPLAY[def.behavior] ?? def.behavior}
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
                      {/* The Chronicle's disclosure chevron: right when shut, down when open (Laws 9–12). */}
                      <span
                        data-testid="rival-disclosure"
                        data-open={openRivalId === def.id ? 'true' : 'false'}
                        style={{ color: 'var(--text-tertiary)', marginRight: '0.3em', display: 'inline-flex', verticalAlign: 'middle' }}
                      >
                        <Icon name="disclosure" size="floor" decorative style={{ transform: openRivalId === def.id ? 'rotate(180deg)' : 'rotate(90deg)' }} />
                      </span>
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
                      <p data-testid="rival-cause">
                        Toward you:{' '}
                        <Tooltip id="ui.rival.temper">
                          <span>{hostilityLabel(hostility)}</span>
                        </Tooltip>
                        {renderSegments(rivalCauseSegments(rivalState, tick, placeName))}
                      </p>
                      {(() => {
                        const last = rivalLastPressedSegments(rivalState, tick, placeName);
                        return last ? <p data-testid="rival-last-pressed">{renderSegments(last)}</p> : null;
                      })()}
                      <p data-testid="rival-answer" style={{ color: 'var(--text-tertiary)' }}>
                        {rivalWords('ui.rival.answer')}
                      </p>
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
                                  style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 'var(--text-xs)', color: 'var(--color-warning, #d9a441)' }}
                                >
                                  Contested
                                </span>
                              )}
                              {done && (
                                <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 'var(--text-xs)', color }}>
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
