import React from 'react';
import { CastTile, type CastTileData } from './CastTile';
import type { EncounterAttentionPriority } from '../../../types/encounter-contract';

const ATTENTION_RANK: Record<EncounterAttentionPriority, number> = {
  primary: 0,
  background: 1,
  offstage: 2,
};

export interface CastRailProps {
  /**
   * Cast tiles to render. Order within an attention_priority bucket is
   * preserved; buckets render in priority order: primary → background →
   * offstage. This is a stable sort, so callers control intra-bucket
   * order (e.g. by salience to the current beat).
   */
  tiles: readonly CastTileData[];
  /**
   * Optional click handler — fired with the cast member's id. Per
   * THR-332's done-when, the consumer wires this to open the Actor
   * detail modal once Phase E1 lands. Until then this is intentionally
   * a no-op marker hook.
   *
   * TODO(THR-E1): wire to DetailModal Actor when Phase E1 lands.
   */
  onTileClick?: (actorId: string) => void;
  /** Header label, default "Cast In The Scene". */
  headerLabel?: string;
}

function sortByAttentionPriority(
  tiles: readonly CastTileData[],
): CastTileData[] {
  return tiles
    .map((tile, index) => ({ tile, index }))
    .sort((a, b) => {
      const rankDelta =
        ATTENTION_RANK[a.tile.attentionPriority] -
        ATTENTION_RANK[b.tile.attentionPriority];
      if (rankDelta !== 0) return rankDelta;
      return a.index - b.index;
    })
    .map((entry) => entry.tile);
}

/**
 * CastRail — top of the encounter right rail. Renders cast tiles
 * grouped by attention priority (primary above; background below;
 * offstage with a reduced-opacity badge handled by the tile).
 *
 * Design plan §4.6 (decision 2.5: cast scaling guidance) and §4.8
 * (off-stage cast representation).
 */
export const CastRail = React.memo(function CastRail({
  tiles,
  onTileClick,
  headerLabel = 'Cast In The Scene',
}: CastRailProps) {
  const ordered = React.useMemo(() => sortByAttentionPriority(tiles), [tiles]);
  const total = ordered.length;

  return (
    <section
      data-testid="encounter-cast-rail"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: 12,
        borderRadius: 12,
        border: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
      }}
    >
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 2,
        }}
      >
        <span
          style={{
            color: 'var(--text-tertiary)',
            fontSize: 'var(--text-xs)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
          }}
        >
          {headerLabel}
        </span>
        <span
          data-testid="encounter-cast-rail-count"
          style={{
            color: 'var(--text-muted)',
            fontSize: 'var(--text-xs)',
            letterSpacing: '0.08em',
          }}
        >
          {total === 0 ? 'no one' : `${total} of ${total}`}
        </span>
      </header>

      {total === 0 ? (
        <div
          data-testid="encounter-cast-rail-empty"
          style={{
            color: 'var(--text-muted)',
            fontSize: 'var(--text-xs)',
            fontStyle: 'italic',
            padding: '12px 4px',
          }}
        >
          she stands alone in this beat.
        </div>
      ) : (
        <div
          data-testid="encounter-cast-rail-list"
          style={{ display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          {ordered.map((tile) => (
            <CastTile key={tile.id} data={tile} onClick={onTileClick} />
          ))}
        </div>
      )}
    </section>
  );
});

CastRail.displayName = 'CastRail';
