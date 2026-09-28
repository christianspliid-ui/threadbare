/**
 * ReachesBlock — the ascendant's two permanent domains and how deep they run.
 *
 * The always-visible anchor for player action progression (THR-613 §5.D): the god's
 * identity is its primary + secondary reach, fixed for the whole run, and its *depth*
 * in each is what makes new cards reachable. Without this readout the progression curve
 * is invisible — a Deepening beat fires and the player has no standing frame for what
 * changed.
 *
 * Prose-first, no numbers: the tier reads as a word ("Tempered"), never a tier index
 * or a capability float — consistent with the rest of the bar.
 *
 * THR-1607: round-1 testers read "Owing" and "Sealed" as states the god was in — a
 * debt, a lock — not rungs. The row now reads as one phrase, reach and word joined
 * ("Gold — Owing"), and both halves carry registry tooltips (Law 17): the reach its
 * `reach.*` entry, the word its rung and what the next one opens. The raw `title`
 * explanation that used to sit on the row is retired (Law 17 / 19).
 */
import { Tooltip } from '../../shared/Tooltip';
import { reachTierTooltipId } from '../../../data/ascendant-reach-register';
import {
  REACH_RANK_LABEL,
  REACH_DEEPENING_PENDING_COPY,
  REACH_EMPTY_COPY,
} from '../../../data/ascendant-bar-content';
import type { ReachRowView } from './selectors';

interface ReachesBlockProps {
  rows: ReachRowView[];
}

export function ReachesBlock({ rows }: ReachesBlockProps) {
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
        {REACH_EMPTY_COPY}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      {rows.map((row) => (
        <div
          key={row.reach}
          data-testid={`reach-row-${row.reach}`}
          style={{ display: 'flex', flexDirection: 'column', gap: 1 }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 9,
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.18em',
                minWidth: 62,
              }}
            >
              {REACH_RANK_LABEL[row.rank]}
            </span>
            <Tooltip id={`reach.${row.reach}`}>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '0.04em',
              }}
            >
              {row.label}
            </span>
            </Tooltip>
            <span style={{ color: 'var(--border-medium)' }} aria-hidden="true">—</span>
            <Tooltip id={reachTierTooltipId(row.reach, row.tierWord)}>
            <span
              data-testid={`reach-tier-${row.reach}`}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                color: 'var(--text-secondary)',
                fontStyle: 'italic',
              }}
            >
              {row.tierWord}
            </span>
            </Tooltip>
          </div>
          {row.pendingDeepening && (
            <div
              data-testid={`reach-deepening-${row.reach}`}
              style={{
                fontFamily: 'var(--font-body)',
                fontStyle: 'italic',
                fontSize: 11,
                color: 'var(--accent-gold)',
                paddingLeft: 68,
                lineHeight: 1.35,
              }}
            >
              {REACH_DEEPENING_PENDING_COPY}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
