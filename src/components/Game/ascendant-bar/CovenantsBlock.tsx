/**
 * CovenantsBlock — the god's sustained controls (THR-613 §5.A).
 *
 * A covenant is something the god *holds* rather than *does*: a sustained control
 * that drains or feeds essence every tick until it lapses or is released. This block
 * lists each active covenant — what it is, where it is held, its upkeep, whether a
 * rival contests it — and gives the player a Release control that queues a voluntary
 * lapse (consumed by phaseControlEffects, THR-613 §3.4).
 *
 * Prose-first, no raw floats. The Release button is the only player-mutating control
 * in the ascendant bar; it enqueues via `onRelease` (GameView → pendingControlReleases).
 */
import {
  COVENANT_EMPTY_COPY,
  COVENANT_RELEASE_LABEL,
  COVENANT_RELEASE_TITLE,
  COVENANT_CONTESTED_COPY,
} from '../../../data/ascendant-bar-content';
import type { CovenantRowView } from './selectors';

interface CovenantsBlockProps {
  rows: CovenantRowView[];
  onRelease?: (effectId: string) => void;
}

export function CovenantsBlock({ rows, onRelease }: CovenantsBlockProps) {
  if (rows.length === 0) {
    return (
      <div
        style={{
          fontFamily: 'var(--font-body)',
          fontStyle: 'italic',
          fontSize: 12,
          color: 'var(--text-muted)',
        }}
      >
        {COVENANT_EMPTY_COPY}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      {rows.map((row) => (
        <div
          key={row.effectId}
          data-testid={`covenant-row-${row.effectId}`}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            paddingBottom: 6,
            borderBottom: '1px dotted var(--border-subtle)',
          }}
        >
          {/* Title + contested badge */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                color: 'var(--text-primary)',
                lineHeight: 1.35,
                flex: 1,
                minWidth: 0,
              }}
            >
              {row.title}
            </span>
            {row.contested && (
              <span
                data-testid={`covenant-contested-${row.effectId}`}
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 9,
                  fontWeight: 600,
                  color: 'var(--negative, #c04040)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  whiteSpace: 'nowrap',
                }}
              >
                {COVENANT_CONTESTED_COPY}
              </span>
            )}
          </div>

          {/* Target */}
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 10,
              fontWeight: 600,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.16em',
            }}
          >
            {row.target}
          </span>

          {/* Upkeep line + Release */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 11,
                fontStyle: 'italic',
                color: 'var(--text-secondary)',
                flex: 1,
                minWidth: 0,
                lineHeight: 1.3,
              }}
            >
              {row.upkeepLine}
            </span>
            <button
              type="button"
              data-testid={`covenant-release-${row.effectId}`}
              title={COVENANT_RELEASE_TITLE}
              onClick={() => onRelease?.(row.effectId)}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 10,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                background: 'transparent',
                border: '1px solid var(--border-medium)',
                borderRadius: 3,
                padding: '2px 8px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {COVENANT_RELEASE_LABEL}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
