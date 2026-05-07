import React from 'react';
import type { EncounterAttentionPriority } from '../../../types/encounter-contract';

export interface CastTileData {
  id: string;
  name: string;
  sphereLabel: string;
  sceneDisposition: string;
  roleInScene?: string;
  relationshipToHer?: string | null;
  fallbackSentiment?: string | null;
  attentionPriority: EncounterAttentionPriority;
  portraitUrl?: string | null;
  tags?: readonly string[];
}

export interface CastTileProps {
  cast: CastTileData;
  onClick?: (cast: CastTileData) => void;
}

const RELATIONSHIP_FALLBACK_TEXT = 'a thread not yet named';

function resolveRelationshipLine(cast: CastTileData): string {
  const fromRelationshipNode = cast.relationshipToHer?.trim();
  if (fromRelationshipNode) return fromRelationshipNode;
  const fromEdgeSentiment = cast.fallbackSentiment?.trim();
  if (fromEdgeSentiment) return fromEdgeSentiment;
  return RELATIONSHIP_FALLBACK_TEXT;
}

function priorityOpacity(priority: EncounterAttentionPriority): number {
  if (priority === 'offstage') return 0.65;
  if (priority === 'background') return 0.85;
  return 1;
}

/**
 * CastTile — right-rail cast member tile for encounter C3.
 * Relationship text prefers the relationship-node resolver output and falls
 * back to relates_to edge sentiment when absent.
 */
export function CastTile({ cast, onClick }: CastTileProps) {
  const relationshipLine = resolveRelationshipLine(cast);
  const hasClickHandler = typeof onClick === 'function';

  return (
    <button
      type="button"
      data-testid={`encounter-cast-tile-${cast.id}`}
      onClick={() => onClick?.(cast)}
      disabled={!hasClickHandler}
      style={{
        width: '100%',
        display: 'flex',
        gap: 10,
        padding: '10px 8px',
        borderRadius: 10,
        border: '1px solid var(--border-subtle)',
        background: 'var(--bg-raised)',
        textAlign: 'left',
        cursor: hasClickHandler ? 'pointer' : 'default',
        opacity: priorityOpacity(cast.attentionPriority),
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 42,
          height: 42,
          borderRadius: 999,
          border: '1px solid var(--border-subtle)',
          background: cast.portraitUrl
            ? `url(${cast.portraitUrl}) center / cover no-repeat`
            : 'radial-gradient(circle at 35% 35%, var(--bg-hover), var(--bg-deep))',
          flexShrink: 0,
        }}
      />

      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 13,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {cast.name}
          </div>
          {cast.tags && cast.tags.length > 0 ? (
            <div
              style={{
                fontSize: 10,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                whiteSpace: 'nowrap',
              }}
            >
              {cast.tags[0]}
            </div>
          ) : null}
        </div>

        <div
          style={{
            marginTop: 2,
            fontSize: 10,
            color: 'var(--accent-gold-dim)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {cast.sphereLabel}
          {cast.roleInScene ? ` · ${cast.roleInScene}` : ''}
        </div>

        <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
          disposition: {cast.sceneDisposition}
        </div>
        <div
          data-testid={`encounter-cast-tile-relationship-${cast.id}`}
          style={{
            marginTop: 2,
            fontSize: 11,
            fontStyle: 'italic',
            color: 'var(--text-secondary)',
            lineHeight: 1.35,
          }}
        >
          to her: {relationshipLine}
        </div>
      </div>
    </button>
  );
}

