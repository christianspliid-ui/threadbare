import React from 'react';
import type { EncounterAttentionPriority } from '../../../types/encounter-contract';
import { CastTile, type CastTileData } from './CastTile';

export interface CastRailProps {
  cast: readonly CastTileData[];
  onCastTileClick?: (cast: CastTileData) => void;
}

const GROUP_ORDER: readonly EncounterAttentionPriority[] = [
  'primary',
  'background',
  'offstage',
];

const GROUP_LABEL: Record<EncounterAttentionPriority, string> = {
  primary: 'Primary',
  background: 'Background',
  offstage: 'Offstage',
};

/**
 * CastRail — right-rail cast grouping surface.
 * Groups cast by attention priority, with offstage entries visibly reduced.
 */
export function CastRail({ cast, onCastTileClick }: CastRailProps) {
  const grouped = React.useMemo(() => {
    const seed: Record<EncounterAttentionPriority, CastTileData[]> = {
      primary: [],
      background: [],
      offstage: [],
    };
    for (const entry of cast) {
      seed[entry.attentionPriority].push(entry);
    }
    return seed;
  }, [cast]);

  return (
    <section
      data-testid="encounter-cast-rail"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: 12,
        height: '100%',
        overflowY: 'auto',
        background: 'var(--bg-surface)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 11,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--text-tertiary)',
          }}
        >
          Cast In The Scene
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{cast.length}</div>
      </div>

      {cast.length === 0 ? (
        <div
          style={{
            marginTop: 8,
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px dashed var(--border-subtle)',
            color: 'var(--text-muted)',
            fontSize: 12,
            fontStyle: 'italic',
          }}
        >
          no cast is foregrounded in this beat
        </div>
      ) : null}

      {GROUP_ORDER.map((priority) => {
        const entries = grouped[priority];
        if (entries.length === 0) return null;
        return (
          <div key={priority} data-testid={`encounter-cast-group-${priority}`}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'var(--text-muted)',
                }}
              >
                {GROUP_LABEL[priority]}
              </div>
              {priority === 'offstage' ? (
                <span
                  style={{
                    fontSize: 9,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 999,
                    padding: '1px 6px',
                  }}
                >
                  stakes
                </span>
              ) : null}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {entries.map((entry) => (
                <CastTile
                  key={entry.id}
                  cast={entry}
                  // TODO(THR-338): wire cast clicks to DetailModal Actor instance after Phase E lands.
                  onClick={onCastTileClick}
                />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}

