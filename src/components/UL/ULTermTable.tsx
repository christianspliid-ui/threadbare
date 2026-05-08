import type { ULTerm, ULTermStatus } from './ulDashboardData';
import { getDriftSignals } from './ulDashboardData';
import { ULDriftBadge } from './ULDriftBadge';
import {
  EMPTY_TABLE_HINT,
  MAX_RESULTS_PER_SHARD,
} from '../../data/ul-dashboard-constants';

interface ULTermTableProps {
  terms: ULTerm[];
  selectedKey: string | null;
  onSelect: (term: ULTerm) => void;
  onClearFilters: () => void;
}

const STATUS_COLOR: Record<ULTermStatus, string> = {
  canonical: '#7aa2a8',
  proposed: '#d4a040',
  deprecated: '#a85a5a',
  unknown: '#888',
};

export function ULTermTable({
  terms,
  selectedKey,
  onSelect,
  onClearFilters,
}: ULTermTableProps) {
  const visibleTerms = terms.slice(0, MAX_RESULTS_PER_SHARD);
  const truncated = terms.length > visibleTerms.length;

  if (visibleTerms.length === 0) {
    return (
      <main
        className="flex-1 overflow-y-auto p-6"
        style={{ color: 'var(--text-muted)' }}
      >
        <p style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>
          {EMPTY_TABLE_HINT}
        </p>
        <button
          type="button"
          onClick={onClearFilters}
          style={{
            padding: '6px 12px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--accent-gold)',
            background: 'transparent',
            color: 'var(--accent-gold)',
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-xs)',
            cursor: 'pointer',
          }}
        >
          Clear filters
        </button>
      </main>
    );
  }

  return (
    <main
      className="flex-1 overflow-y-auto"
      style={{ padding: 'var(--space-3)' }}
      data-testid="ul-term-table"
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 'var(--text-sm)',
        }}
      >
        <thead>
          <tr
            style={{
              textAlign: 'left',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-xs)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            <th style={{ padding: '8px 12px', width: '20%' }}>Term</th>
            <th style={{ padding: '8px 12px' }}>One-liner</th>
            <th style={{ padding: '8px 12px', width: '90px' }}>Status</th>
            <th style={{ padding: '8px 12px', width: '120px' }}>Drift</th>
          </tr>
        </thead>
        <tbody>
          {visibleTerms.map((term) => {
            const key = `${term.shardId}#${term.slug}`;
            const isSelected = key === selectedKey;
            const drift = getDriftSignals(term);
            return (
              <tr
                key={key}
                onClick={() => onSelect(term)}
                data-testid={`ul-term-row-${key}`}
                style={{
                  cursor: 'pointer',
                  background: isSelected
                    ? 'rgba(212, 160, 64, 0.10)'
                    : 'transparent',
                  borderTop: '1px solid var(--border-subtle)',
                }}
              >
                <td
                  style={{
                    padding: '10px 12px',
                    color: isSelected
                      ? 'var(--accent-gold)'
                      : 'var(--text-primary)',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  {term.name}
                </td>
                <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                  {term.oneLiner}
                </td>
                <td
                  style={{
                    padding: '10px 12px',
                    color: STATUS_COLOR[term.status],
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--text-xs)',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}
                >
                  {term.status}
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <ULDriftBadge signals={drift} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {truncated && (
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: 'var(--text-xs)',
            padding: 'var(--space-3)',
          }}
        >
          Showing first {MAX_RESULTS_PER_SHARD} of {terms.length} matches.
          Refine search to narrow results.
        </p>
      )}
    </main>
  );
}
