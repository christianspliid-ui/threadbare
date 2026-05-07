import React from 'react';
import type { ReachDomain } from '../../../types/traits';
import type { EncounterAttentionPriority } from '../../../types/encounter-contract';

const PORTRAIT_SIZE_PX = 42;

const REACH_LABEL: Record<ReachDomain, string> = {
  iron: 'iron',
  gold: 'gold',
  shadow: 'shadow',
  veil: 'veil',
  heart: 'heart',
  eye: 'eye',
  stone: 'stone',
  star: 'star',
};

export interface CastTileData {
  /** Stable id used as the React key and as the click payload. */
  readonly id: string;
  /** Display name shown in the tile header. */
  readonly name: string;
  /**
   * Reach the cast member is sphere-tinted by — drives the data-reach
   * cascade (`--reach-sphere`, `--reach-sphere-bright`).
   */
  readonly sphere: ReachDomain;
  /**
   * Role line, e.g. "civic guard" or "spice merchant". The reach is
   * prepended automatically; do NOT include it here.
   */
  readonly roleInScene: string;
  /**
   * Beat-scoped disposition phrase, e.g. "suspicious", "about to bolt".
   * Rendered as a dotted-underline term so it reads as resolvable.
   */
  readonly disposition: string;
  /**
   * "to her" relationship phrase resolved upstream via
   * `resolveCastTileToHerLabel`. When null the line is suppressed —
   * a tile for an unfamiliar actor renders without it rather than
   * showing a placeholder.
   */
  readonly toHerLabel?: string | null;
  /** Soft tag in the corner, e.g. "honour-bound", "watching". */
  readonly tag?: string;
  /** Where in the scene the cast member sits (drives offstage badge). */
  readonly attentionPriority: EncounterAttentionPriority;
  /** Optional portrait. Falls back to an initial swatch when absent. */
  readonly portraitUrl?: string | null;
}

export interface CastTileProps {
  data: CastTileData;
  /**
   * When provided, the tile is keyboard- and click-activatable. Click
   * fires the actor id; the consumer is responsible for opening the
   * Actor detail modal once Phase E1 lands.
   */
  onClick?: (actorId: string) => void;
}

function PortraitSwatch({ name, sphere }: { name: string; sphere: ReachDomain }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <div
      data-testid="cast-tile-portrait-fallback"
      data-reach={sphere}
      aria-hidden="true"
      style={{
        width: PORTRAIT_SIZE_PX,
        height: PORTRAIT_SIZE_PX,
        flexShrink: 0,
        borderRadius: 6,
        background:
          'radial-gradient(120% 90% at 35% 30%, color-mix(in srgb, var(--reach-sphere-bright) 30%, transparent) 0%, var(--bg-deep) 70%)',
        border: '1px solid var(--border-subtle)',
        display: 'grid',
        placeItems: 'center',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-display)',
        fontSize: 16,
      }}
    >
      {initial}
    </div>
  );
}

/**
 * CastTile — single cast member tile (right rail).
 *
 * Pure presentation: portrait, name, sphere-tinted role line, scene
 * disposition (dotted-underlined as a resolvable term), and a "to her"
 * relationship line resolved upstream. Reads from the encounter
 * contract's `EncounterCastEntryContract` shape.
 *
 * Click is optional and, until Phase E1's DetailModal lands, is wired
 * up at the call site as a no-op or telemetry hook. The component
 * itself stays Phase-E1-agnostic.
 *
 * Design plan §5.4 (cast presentation), §4.6 (attention priority),
 * §4.8 (offstage representation).
 */
export const CastTile = React.memo(function CastTile({
  data,
  onClick,
}: CastTileProps) {
  const isOffstage = data.attentionPriority === 'offstage';
  const isInteractive = typeof onClick === 'function';

  const handleActivate = React.useCallback(() => {
    onClick?.(data.id);
  }, [onClick, data.id]);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!isInteractive) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleActivate();
      }
    },
    [isInteractive, handleActivate],
  );

  return (
    <div
      data-testid={`cast-tile-${data.id}`}
      data-attention-priority={data.attentionPriority}
      data-reach={data.sphere}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={isInteractive ? data.name : undefined}
      onClick={isInteractive ? handleActivate : undefined}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      style={{
        display: 'flex',
        gap: 8,
        padding: '6px 4px',
        borderRadius: 6,
        opacity: isOffstage ? 0.65 : 1,
        cursor: isInteractive ? 'pointer' : 'default',
        outline: 'none',
        position: 'relative',
      }}
    >
      {data.portraitUrl ? (
        <img
          src={data.portraitUrl}
          alt={`${data.name} portrait`}
          style={{
            width: PORTRAIT_SIZE_PX,
            height: PORTRAIT_SIZE_PX,
            flexShrink: 0,
            borderRadius: 6,
            objectFit: 'cover',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-raised)',
          }}
        />
      ) : (
        <PortraitSwatch name={data.name} sphere={data.sphere} />
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: 6,
          }}
        >
          <div
            data-testid="cast-tile-name"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 13,
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {data.name}
          </div>
          {data.tag && (
            <div
              data-testid="cast-tile-tag"
              style={{
                fontSize: 9,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                whiteSpace: 'nowrap',
              }}
            >
              {data.tag}
            </div>
          )}
        </div>

        <div
          data-testid="cast-tile-role"
          style={{
            fontSize: 9,
            color: 'var(--reach-sphere-bright)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginTop: 2,
          }}
        >
          {REACH_LABEL[data.sphere]} · {data.roleInScene}
        </div>

        <div
          style={{
            fontSize: 11,
            color: 'var(--text-tertiary)',
            lineHeight: 1.4,
            marginTop: 4,
          }}
        >
          <span data-testid="cast-tile-disposition-row">
            disposition:{' '}
            <span
              data-testid="cast-tile-disposition"
              style={{
                color: 'var(--text-secondary)',
                borderBottom: '1px dotted var(--border-subtle)',
              }}
            >
              {data.disposition}
            </span>
          </span>
          {data.toHerLabel && (
            <>
              <br />
              <em data-testid="cast-tile-to-her">to her: {data.toHerLabel}</em>
            </>
          )}
        </div>
      </div>

      {isOffstage && (
        <div
          data-testid="cast-tile-offstage-badge"
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            fontSize: 8,
            color: 'var(--text-muted)',
            background: 'var(--bg-deep)',
            border: '1px solid var(--border-subtle)',
            padding: '1px 5px',
            borderRadius: 3,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
          }}
        >
          offstage
        </div>
      )}
    </div>
  );
});

CastTile.displayName = 'CastTile';
