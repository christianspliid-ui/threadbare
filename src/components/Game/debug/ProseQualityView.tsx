import { useMemo, useState, useCallback, useRef, type CSSProperties } from 'react';
import { collectAuthoredProse } from '../../../engine/content-eval/collectAuthoredProse';
import {
  scoreProseBatch,
  type ProseBand,
  type ProseQualityResult,
} from '../../../engine/content-eval/proseQualityScore';
import type { RegisterBand } from '../../../engine/content-eval/registerCompliance';
import { EMPTY_STATE_STYLE, SELECT_STYLE } from './debugPanelStyles';

// ── Constants (NFP #1) ───────────────────────────────────────────────────────
// Row/sort/filter tunables live here; scoring thresholds stay owned by the
// rubric (src/data/content-eval/proseQualityRubric.ts) — single source of truth.
const PROSE_TAB_ROW_LIMIT = 200;
const PROSE_TAB_DEFAULT_SORT: SortMode = 'score-asc';
const PROSE_TAB_DEFAULT_BAND_FILTER: readonly ProseBand[] = ['warn', 'fail', 'error'];
const PROSE_TAB_REFRESH_DEBOUNCE_MS = 250;

type SortMode = 'score-asc' | 'score-desc';

const ALL_BANDS: readonly ProseBand[] = ['pass', 'warn', 'fail', 'error'];

const BAND_COLORS: Record<ProseBand, string> = {
  pass: '#6a9a6e',
  warn: '#d9a441',
  fail: '#b85450',
  error: '#8a8a8a',
};

// Register-compliance band colors (THR-609). `skipped` reads as neutral/muted.
const REGISTER_BAND_COLORS: Record<RegisterBand, string> = {
  pass: '#6a9a6e',
  warn: '#d9a441',
  fail: '#b85450',
  skipped: '#8a8a8a',
};

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
  gap: '10px',
  flexWrap: 'wrap',
  alignItems: 'center',
  padding: '8px 12px',
  borderBottom: '1px solid var(--border-subtle)',
};
const CONTROLS_STYLE: CSSProperties = {
  display: 'flex',
  gap: '6px',
  flexWrap: 'wrap',
  alignItems: 'center',
  padding: '8px 12px',
  borderBottom: '1px solid var(--border-subtle)',
};
const CHIP_BASE: CSSProperties = {
  padding: '2px 7px',
  borderRadius: '10px',
  border: '1px solid var(--border-subtle)',
  cursor: 'pointer',
  fontSize: 'var(--text-xs)',
  userSelect: 'none',
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
const BTN_STYLE: CSSProperties = {
  padding: '4px 8px',
  borderRadius: '4px',
  border: '1px solid var(--border-subtle)',
  background: 'var(--bg-raised)',
  color: 'var(--text-primary)',
  fontSize: 'var(--text-xs)',
  cursor: 'pointer',
};
const SCROLL_STYLE: CSSProperties = { flex: 1, overflowY: 'auto', overflowX: 'hidden' };
const ROW_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 46px 42px 58px',
  gap: '6px',
  alignItems: 'center',
  padding: '4px 12px',
  borderBottom: '1px solid var(--border-subtle)',
  cursor: 'pointer',
  fontSize: 'var(--text-xs)',
};

function bandBadge(band: ProseBand): CSSProperties {
  const color = BAND_COLORS[band];
  return {
    color,
    background: `color-mix(in srgb, ${color} 16%, transparent)`,
    borderRadius: '3px',
    padding: '0 5px',
    textAlign: 'center',
    fontWeight: 600,
  };
}

function registerBadge(band: RegisterBand): CSSProperties {
  const color = REGISTER_BAND_COLORS[band];
  return {
    color,
    background: `color-mix(in srgb, ${color} 14%, transparent)`,
    borderRadius: '3px',
    padding: '0 4px',
    textAlign: 'center',
    fontWeight: 600,
    fontSize: 'var(--text-2xs, 10px)',
  };
}

/** Short register glyph: register kind initial + band, e.g. "B·pass". */
function registerLabel(r: ProseQualityResult['registerCompliance']): string {
  const kind = r.register === 'baseline' ? 'B' : r.register === 'character' ? 'C' : 'P';
  return `${kind}·${r.band}`;
}

export function ProseQualityView() {
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [bandFilter, setBandFilter] = useState<readonly ProseBand[]>(PROSE_TAB_DEFAULT_BAND_FILTER);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [idFilter, setIdFilter] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>(PROSE_TAB_DEFAULT_SORT);
  const [marqueeOnly, setMarqueeOnly] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pure collect + score. Re-runs only on Refresh (refreshNonce bump); filter
  // and sort changes reuse the memoized batch. Fail-soft: never throws into the
  // panel — collectAuthoredProse isolates each table, scoreProseBatch each entry.
  const batch = useMemo(() => {
    void refreshNonce;
    try {
      return scoreProseBatch(collectAuthoredProse());
    } catch (err) {
      return {
        entries: [] as ProseQualityResult[],
        summary: { total: 0, pass: 0, warn: 0, fail: 0, error: 0 },
        bottomTail: [] as ProseQualityResult[],
        marqueeEntries: [] as ProseQualityResult[],
        _error: err instanceof Error ? err.message : String(err),
      };
    }
  }, [refreshNonce]);

  const bottomTailIds = useMemo(
    () => new Set(batch.bottomTail.map((e) => e.entryId)),
    [batch],
  );

  const contentTypes = useMemo(() => {
    const set = new Set(batch.entries.map((e) => e.contentType));
    return ['all', ...Array.from(set).sort()];
  }, [batch]);

  const visible = useMemo(() => {
    const bandSet = new Set(bandFilter);
    const needle = idFilter.trim().toLowerCase();
    const filtered = batch.entries.filter((e) => {
      if (!bandSet.has(e.band)) return false;
      if (typeFilter !== 'all' && e.contentType !== typeFilter) return false;
      if (marqueeOnly && !e.marquee) return false;
      if (needle && !e.entryId.toLowerCase().includes(needle)) return false;
      return true;
    });
    filtered.sort((a, b) => (sortMode === 'score-asc' ? a.score - b.score : b.score - a.score));
    return filtered;
  }, [batch, bandFilter, typeFilter, idFilter, marqueeOnly, sortMode]);

  const shown = visible.slice(0, PROSE_TAB_ROW_LIMIT);

  const refresh = useCallback(() => {
    if (debounceRef.current) return; // debounce: swallow rapid re-clicks
    debounceRef.current = setTimeout(() => { debounceRef.current = null; }, PROSE_TAB_REFRESH_DEBOUNCE_MS);
    setRefreshNonce((n) => n + 1);
  }, []);

  const toggleBand = useCallback((band: ProseBand) => {
    setBandFilter((prev) => (prev.includes(band) ? prev.filter((b) => b !== band) : [...prev, band]));
  }, []);

  if ('_error' in batch) {
    return <div style={EMPTY_STATE_STYLE}>Prose scorer failed: {(batch as { _error: string })._error}</div>;
  }
  if (batch.summary.total === 0) {
    return <div style={EMPTY_STATE_STYLE}>No authored prose resolved — check collector wiring.</div>;
  }

  return (
    <div style={PANEL_STYLE} data-testid="prose-quality-view">
      {/* Summary band */}
      <div style={SUMMARY_STYLE}>
        <span style={{ color: 'var(--text-muted)' }}>Total <strong style={{ color: 'var(--text-primary)' }}>{batch.summary.total}</strong></span>
        {ALL_BANDS.map((band) => (
          <span key={band} style={{ color: BAND_COLORS[band] }}>
            {band} <strong>{batch.summary[band]}</strong>
          </span>
        ))}
        <span style={{ color: 'var(--text-muted)', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '10px' }}>
          register:
        </span>
        <span style={{ color: REGISTER_BAND_COLORS.pass }}>pass <strong>{batch.summary.register.pass}</strong></span>
        <span style={{ color: REGISTER_BAND_COLORS.warn }}>warn <strong>{batch.summary.register.warn}</strong></span>
        <span style={{ color: REGISTER_BAND_COLORS.fail }}>fail <strong>{batch.summary.register.fail}</strong></span>
        {batch.summary.register.skipped > 0 && (
          <span style={{ color: REGISTER_BAND_COLORS.skipped }}>skipped <strong>{batch.summary.register.skipped}</strong></span>
        )}
      </div>

      {/* Controls */}
      <div style={CONTROLS_STYLE}>
        {ALL_BANDS.map((band) => {
          const active = bandFilter.includes(band);
          return (
            <span
              key={band}
              onClick={() => toggleBand(band)}
              style={{
                ...CHIP_BASE,
                color: active ? BAND_COLORS[band] : 'var(--text-muted)',
                borderColor: active ? BAND_COLORS[band] : 'var(--border-subtle)',
                opacity: active ? 1 : 0.5,
              }}
            >
              {band}
            </span>
          );
        })}
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ ...SELECT_STYLE, width: 'auto', flex: 'none' }}>
          {contentTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <input
          value={idFilter}
          onChange={(e) => setIdFilter(e.target.value)}
          placeholder="filter id…"
          style={TEXT_INPUT_STYLE}
        />
        <button type="button" style={BTN_STYLE} onClick={() => setSortMode((m) => (m === 'score-asc' ? 'score-desc' : 'score-asc'))}>
          score {sortMode === 'score-asc' ? '↑' : '↓'}
        </button>
        <span
          onClick={() => setMarqueeOnly((v) => !v)}
          style={{ ...CHIP_BASE, color: marqueeOnly ? 'var(--accent-gold)' : 'var(--text-muted)', borderColor: marqueeOnly ? 'var(--accent-gold)' : 'var(--border-subtle)', opacity: marqueeOnly ? 1 : 0.6 }}
        >
          ★ marquee
        </span>
        <button type="button" style={BTN_STYLE} onClick={refresh}>Refresh</button>
      </div>

      {/* Table */}
      <div style={SCROLL_STYLE}>
        <div style={{ ...ROW_STYLE, cursor: 'default', color: 'var(--text-muted)', fontWeight: 600, position: 'sticky', top: 0, background: 'var(--bg-deep)' }}>
          <span>entry · type · voice</span>
          <span style={{ textAlign: 'center' }}>score</span>
          <span style={{ textAlign: 'center' }}>band</span>
          <span style={{ textAlign: 'center' }} title="register compliance (B/C/P · band)">reg.</span>
        </div>
        {shown.length === 0 ? (
          <div style={EMPTY_STATE_STYLE}>No entries match the current filters.</div>
        ) : (
          shown.map((entry) => {
            const isExpanded = expandedId === entry.entryId;
            const isTail = bottomTailIds.has(entry.entryId);
            return (
              <div key={entry.entryId}>
                <div
                  style={ROW_STYLE}
                  onClick={() => setExpandedId(isExpanded ? null : entry.entryId)}
                  data-testid="prose-quality-row"
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.marquee && <span style={{ color: 'var(--accent-gold)' }}>★ </span>}
                    {isTail && <span title="worst-tail" style={{ color: BAND_COLORS.fail }}>▾ </span>}
                    <span style={{ color: 'var(--text-primary)' }}>{entry.entryId}</span>
                    <span style={{ color: 'var(--text-muted)' }}> · {entry.contentType} · {entry.voiceMode}</span>
                  </span>
                  <span style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{entry.score}</span>
                  <span style={bandBadge(entry.band)}>{entry.band}</span>
                  <span
                    style={registerBadge(entry.registerCompliance.band)}
                    title={`register: ${entry.registerCompliance.register}${entry.registerCompliance.declared ? '' : ' (undeclared → default)'}`}
                  >
                    {registerLabel(entry.registerCompliance)}
                  </span>
                </div>
                {isExpanded && (
                  <div style={{ padding: '4px 12px 8px 20px', background: 'var(--bg-raised)', borderBottom: '1px solid var(--border-subtle)' }}>
                    {entry.flags.length === 0 ? (
                      <div style={{ color: 'var(--text-muted)' }}>No prose flags — clean.</div>
                    ) : (
                      entry.flags.map((flag, i) => (
                        <div key={i} style={{ marginBottom: '3px', lineHeight: 1.3 }}>
                          <span style={{ color: flag.severity === 'gate' ? BAND_COLORS.fail : flag.severity === 'loud' ? BAND_COLORS.warn : 'var(--text-muted)', fontWeight: 600 }}>
                            {flag.severity}
                          </span>
                          <span style={{ color: 'var(--text-secondary)' }}> · {flag.category} · </span>
                          <span style={{ color: 'var(--text-primary)' }}>{flag.field}</span>
                          <span style={{ color: 'var(--text-muted)' }}>: {flag.detail}</span>
                          {flag.evidence && (
                            <div style={{ color: 'var(--text-tertiary)', fontStyle: 'italic', paddingLeft: '8px' }}>“{flag.evidence}”</div>
                          )}
                        </div>
                      ))
                    )}
                    {/* Register-compliance breakdown (THR-609) */}
                    <div style={{ marginTop: '6px', paddingTop: '4px', borderTop: '1px dashed var(--border-subtle)' }}>
                      <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>
                        register <span style={{ color: REGISTER_BAND_COLORS[entry.registerCompliance.band], fontWeight: 600 }}>{entry.registerCompliance.register} · {entry.registerCompliance.band}</span>
                        {!entry.registerCompliance.declared && <span style={{ color: 'var(--text-tertiary)' }}> (undeclared → baseline default)</span>}
                      </div>
                      {entry.registerCompliance.metrics.length === 0 ? (
                        <div style={{ color: 'var(--text-tertiary)', paddingLeft: '8px' }}>no scoreable prose</div>
                      ) : (
                        entry.registerCompliance.metrics.map((m, i) => (
                          <div key={i} style={{ lineHeight: 1.3, paddingLeft: '8px' }}>
                            <span style={{ color: REGISTER_BAND_COLORS[m.band], fontWeight: 600 }}>{m.band}</span>
                            <span style={{ color: 'var(--text-secondary)' }}> · {m.name}</span>
                            <span style={{ color: 'var(--text-muted)' }}>: {m.detail}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
        {visible.length > PROSE_TAB_ROW_LIMIT && (
          <div style={{ padding: '6px 12px', color: 'var(--text-muted)', textAlign: 'center' }}>
            showing worst {PROSE_TAB_ROW_LIMIT} of {visible.length} matching
          </div>
        )}
      </div>
    </div>
  );
}
