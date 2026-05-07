import React from 'react';
import type {
  AscendantHandPartition,
  HandFilterDimmedEntry,
  HandFilterPlayableEntry,
} from '../../../engine/encounters/handFilter';
import type { ReachDomain } from '../../../types/traits';
import type { UnifiedActionTemplate } from '../../../types/unifiedAction';

const DEFAULT_VISIBLE_COUNT = 3;

const COST_LABELS: Record<number, string> = {
  0: 'free',
  1: 'small breath',
  2: 'fuller breath',
  3: 'fuller breath',
  4: 'deep draught',
};

function costLabel(template: UnifiedActionTemplate): string {
  if (template.essenceCost === undefined || template.essenceCost === 0) {
    return 'free';
  }
  return COST_LABELS[template.essenceCost] ?? 'deep draught';
}

function sphereReach(template: UnifiedActionTemplate): ReachDomain | undefined {
  return template.reach;
}

type DisplayState = 'playable' | 'dimmed';

interface DisplayEntry {
  readonly state: DisplayState;
  readonly template: UnifiedActionTemplate;
  readonly prereqMessage?: string;
  readonly isRare: boolean;
  readonly isNew: boolean;
}

function buildDisplayEntries(
  partition: AscendantHandPartition,
  newCardIds: ReadonlySet<string>,
): DisplayEntry[] {
  const rareSet = new Set(partition.rarePulses);
  const playable: DisplayEntry[] = partition.playable.map(
    (entry: HandFilterPlayableEntry) => ({
      state: 'playable',
      template: entry.template,
      isRare: rareSet.has(entry.template.id),
      isNew: newCardIds.has(entry.template.id),
    }),
  );
  const dimmed: DisplayEntry[] = partition.dimmed.map(
    (entry: HandFilterDimmedEntry) => ({
      state: 'dimmed',
      template: entry.template,
      prereqMessage: entry.prereq.message,
      isRare: rareSet.has(entry.template.id),
      isNew: newCardIds.has(entry.template.id),
    }),
  );
  // Playable above dimmed; hidden never renders.
  return [...playable, ...dimmed];
}

export interface AscendantHandProps {
  /**
   * Partitioned hand from `filterAscendantHand` (Phase B3). The
   * AscendantHand renders `playable` (bright) above `dimmed` (35%
   * opacity with prereq line); `hidden` is omitted entirely.
   */
  partition: AscendantHandPartition;
  /**
   * Click handler — fires the chosen template id. Per design plan
   * §10.3 the click commits direct, with no inner picker; the
   * consumer is responsible for the Moment-1 thread overlay and
   * resolution.
   */
  onPlay?: (templateId: string) => void;
  /** Number of cards visible before the "+ N more" disclosure. */
  defaultVisibleCount?: number;
  /**
   * Template ids that have just been added to the hand. When
   * non-empty, a "+ N NEW" badge floats on the header.
   */
  newCardIds?: ReadonlySet<string>;
  /** Header label, default "Your Hand". */
  headerLabel?: string;
}

interface HandCardProps {
  entry: DisplayEntry;
  onPlay?: (templateId: string) => void;
}

function HandCard({ entry, onPlay }: HandCardProps) {
  const { state, template, prereqMessage, isRare } = entry;
  const isPlayable = state === 'playable';
  const reach = sphereReach(template);
  const tooltipText = state === 'dimmed' ? prereqMessage : undefined;

  const handleActivate = React.useCallback(() => {
    if (!isPlayable) return;
    onPlay?.(template.id);
  }, [isPlayable, onPlay, template.id]);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!isPlayable) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleActivate();
      }
    },
    [isPlayable, handleActivate],
  );

  return (
    <div
      data-testid={`ascendant-hand-card-${template.id}`}
      data-state={state}
      data-rare={isRare ? 'true' : 'false'}
      data-reach={reach}
      role={isPlayable ? 'button' : undefined}
      tabIndex={isPlayable ? 0 : -1}
      aria-label={template.name}
      aria-disabled={!isPlayable}
      title={tooltipText}
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
      className={isRare ? 'pulse-rare' : undefined}
      style={{
        padding: '8px 10px',
        borderRadius: 8,
        border: `1px solid ${
          isRare ? 'var(--accent-gold)' : 'var(--border-subtle)'
        }`,
        background: 'var(--bg-raised)',
        opacity: isPlayable ? 1 : 0.35,
        cursor: isPlayable ? 'pointer' : 'help',
        outline: 'none',
        transition: 'opacity 200ms ease-out, border-color 200ms ease-out',
        position: 'relative',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <i
            aria-hidden="true"
            style={{
              width: 14,
              height: 14,
              flexShrink: 0,
              borderRadius: 99,
              border: `1.5px solid ${
                isRare ? 'var(--accent-gold)' : 'var(--text-muted)'
              }`,
            }}
          />
          <div style={{ minWidth: 0 }}>
            <div
              data-testid={`ascendant-hand-card-name-${template.id}`}
              style={{
                fontSize: 13,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {template.name}
            </div>
            {template.description && (
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-tertiary)',
                  marginTop: 2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {template.description}
              </div>
            )}
          </div>
        </div>
        <div
          data-testid={`ascendant-hand-card-cost-${template.id}`}
          style={{
            flexShrink: 0,
            fontSize: 9,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: isRare ? 'var(--accent-gold)' : 'var(--text-muted)',
          }}
        >
          {costLabel(template)}
          {isRare ? ' · rare' : ''}
        </div>
      </div>
      {state === 'dimmed' && prereqMessage && (
        <div
          data-testid={`ascendant-hand-card-prereq-${template.id}`}
          style={{
            marginTop: 6,
            fontSize: 10,
            color: 'var(--text-muted)',
            fontStyle: 'italic',
          }}
        >
          ✕ {prereqMessage}
        </div>
      )}
    </div>
  );
}

/**
 * AscendantHand — encounter-mode right-rail panel. Reads a partitioned
 * hand from `filterAscendantHand` (Phase B3) and renders the playable
 * cards bright + the dimmed cards at 35% opacity with prereq messages
 * inline. Hidden cards are not rendered.
 *
 * Click commits direct (no inner picker) per design plan §10.3
 * (AgendaPicker dissolution). The "+1 NEW" header badge fires when the
 * caller passes a non-empty `newCardIds` set.
 *
 * Conceptually extends `ActionDrawer` — both consume the same divine
 * action space — but the encounter view is a compact right-rail list,
 * not a Slay-the-Spire-style overlapping fan, so it ships as its own
 * component rather than a layout option on ActionDrawer.
 *
 * Design plan §3.4 (hand filter), §5.4 (Ascendant hand), §10.3
 * (AgendaPicker dissolution).
 */
export const AscendantHand = React.memo(function AscendantHand({
  partition,
  onPlay,
  defaultVisibleCount = DEFAULT_VISIBLE_COUNT,
  newCardIds,
  headerLabel = 'Your Hand',
}: AscendantHandProps) {
  const [expanded, setExpanded] = React.useState(false);
  const newSet = newCardIds ?? new Set<string>();

  const entries = React.useMemo(
    () => buildDisplayEntries(partition, newSet),
    [partition, newSet],
  );

  const visible = expanded ? entries : entries.slice(0, defaultVisibleCount);
  const hiddenCount = Math.max(0, entries.length - visible.length);
  const newBadgeCount = entries.filter((entry) => entry.isNew).length;

  return (
    <section
      data-testid="ascendant-hand"
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
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 8,
          marginBottom: 4,
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
        {newBadgeCount > 0 && (
          <span
            data-testid="ascendant-hand-new-badge"
            style={{
              color: 'var(--accent-gold)',
              fontSize: 'var(--text-xs)',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              fontWeight: 600,
            }}
          >
            +{newBadgeCount} new
          </span>
        )}
      </header>

      {entries.length === 0 ? (
        <div
          data-testid="ascendant-hand-empty"
          style={{
            color: 'var(--text-muted)',
            fontSize: 'var(--text-xs)',
            fontStyle: 'italic',
            padding: '12px 4px',
          }}
        >
          no moves are within reach.
        </div>
      ) : (
        <>
          <div
            data-testid="ascendant-hand-list"
            style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
          >
            {visible.map((entry) => (
              <HandCard key={entry.template.id} entry={entry} onPlay={onPlay} />
            ))}
          </div>

          {(hiddenCount > 0 || expanded) && entries.length > defaultVisibleCount && (
            <button
              data-testid="ascendant-hand-disclosure"
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              aria-expanded={expanded}
              style={{
                marginTop: 4,
                padding: '4px 8px',
                background: 'transparent',
                border: '1px dashed var(--border-subtle)',
                borderRadius: 6,
                color: 'var(--text-muted)',
                fontSize: 'var(--text-xs)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                cursor: 'pointer',
              }}
            >
              {expanded
                ? '▴ fewer'
                : `+ ${hiddenCount} more ▾`}
            </button>
          )}
        </>
      )}
    </section>
  );
});

AscendantHand.displayName = 'AscendantHand';
