import { useMemo, useState, type CSSProperties } from 'react';
import {
  reportUnreachableActions,
  type UnreachableActionReport,
} from '../../../engine/content-eval/unreachableActions';
import { EMPTY_STATE_STYLE } from './debugPanelStyles';

// ── Constants (NFP #1) ───────────────────────────────────────────────────────
const ORPHANED_TAB_ROW_LIMIT = 300;

// ── Styles ───────────────────────────────────────────────────────────────────
const PANEL_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  overflow: 'hidden',
  fontSize: 'var(--text-xs)',
};
const SUMMARY_STYLE: CSSProperties = {
  display: 'flex',
  gap: '12px',
  flexWrap: 'wrap',
  alignItems: 'center',
  padding: '8px 12px',
  borderBottom: '1px solid var(--border-subtle)',
};
const CONTROLS_STYLE: CSSProperties = {
  display: 'flex',
  gap: '8px',
  alignItems: 'center',
  padding: '6px 12px',
  borderBottom: '1px solid var(--border-subtle)',
};
const TEXT_INPUT_STYLE: CSSProperties = {
  flex: 1,
  minWidth: '90px',
  background: 'var(--bg-deep)',
  border: '1px solid var(--border-subtle)',
  color: 'var(--text-primary)',
  borderRadius: '4px',
  fontSize: 'var(--text-xs)',
  padding: '4px 6px',
};
const SCROLL_STYLE: CSSProperties = { flex: 1, overflowY: 'auto', overflowX: 'hidden' };
const ROW_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1.6fr 1fr 64px 64px',
  gap: '6px',
  alignItems: 'center',
  padding: '4px 12px',
  borderBottom: '1px solid var(--border-subtle)',
  fontSize: 'var(--text-xs)',
};

export function OrphanedCardsDebugTab() {
  const [idFilter, setIdFilter] = useState('');

  // Pure, deterministic, session-independent. Fail-soft: never throws into the panel —
  // the module coalesces missing fields and degrades a granted-set failure to a warning.
  const report = useMemo<UnreachableActionReport | { _error: string }>(() => {
    try {
      return reportUnreachableActions();
    } catch (err) {
      return { _error: err instanceof Error ? err.message : String(err) };
    }
  }, []);

  const visible = useMemo(() => {
    if ('_error' in report) return [];
    const needle = idFilter.trim().toLowerCase();
    if (!needle) return report.entries;
    return report.entries.filter(
      (e) => e.id.toLowerCase().includes(needle) || e.name.toLowerCase().includes(needle),
    );
  }, [report, idFilter]);

  if ('_error' in report) {
    return <div style={EMPTY_STATE_STYLE}>Orphaned-card report failed: {report._error}</div>;
  }

  const { summary } = report;
  const shown = visible.slice(0, ORPHANED_TAB_ROW_LIMIT);

  return (
    <div style={PANEL_STYLE} data-testid="orphaned-cards-view">
      {/* Summary band */}
      <div style={SUMMARY_STYLE}>
        <span style={{ color: summary.unreachable > 0 ? '#b85450' : '#6a9a6e', fontWeight: 600 }}>
          {summary.unreachable} unreachable
        </span>
        <span style={{ color: 'var(--text-muted)' }}>
          of <strong style={{ color: 'var(--text-primary)' }}>{summary.playerReachableTemplates}</strong> player-reachable
        </span>
        <span style={{ color: 'var(--text-muted)', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '12px' }}>
          granted <strong style={{ color: 'var(--text-secondary)' }}>{summary.granted}</strong>
        </span>
        <span style={{ color: 'var(--text-muted)' }}>
          signatures <strong style={{ color: 'var(--text-secondary)' }}>{summary.dynamicSignature}</strong>
        </span>
        <span style={{ color: 'var(--text-muted)' }}>
          starters <strong style={{ color: 'var(--text-secondary)' }}>{summary.starter}</strong>
        </span>
      </div>

      {report.warning && (
        <div style={{ padding: '6px 12px', color: '#d9a441', borderBottom: '1px solid var(--border-subtle)' }}>
          ⚠ {report.warning}
        </div>
      )}

      {/* Controls */}
      <div style={CONTROLS_STYLE}>
        <input
          value={idFilter}
          onChange={(e) => setIdFilter(e.target.value)}
          placeholder="filter id / name…"
          style={TEXT_INPUT_STYLE}
        />
      </div>

      {/* Table */}
      <div style={SCROLL_STYLE}>
        {summary.unreachable === 0 ? (
          <div style={EMPTY_STATE_STYLE}>
            No orphaned cards — every player-reachable template is granted by a beat or starter.
          </div>
        ) : (
          <>
            <div style={{ ...ROW_STYLE, color: 'var(--text-muted)', fontWeight: 600, position: 'sticky', top: 0, background: 'var(--bg-deep)' }}>
              <span>id</span>
              <span>name</span>
              <span style={{ textAlign: 'center' }}>reach</span>
              <span style={{ textAlign: 'center' }}>crud</span>
            </div>
            {shown.length === 0 ? (
              <div style={EMPTY_STATE_STYLE}>No entries match the filter.</div>
            ) : (
              shown.map((entry) => (
                <div key={entry.id} style={ROW_STYLE} data-testid="orphaned-cards-row">
                  <span style={{ color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.id}
                  </span>
                  <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.name}
                  </span>
                  <span style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{entry.reach}</span>
                  <span style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{entry.crudType}</span>
                </div>
              ))
            )}
            {visible.length > ORPHANED_TAB_ROW_LIMIT && (
              <div style={{ padding: '6px 12px', color: 'var(--text-muted)', textAlign: 'center' }}>
                showing {ORPHANED_TAB_ROW_LIMIT} of {visible.length} matching
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
