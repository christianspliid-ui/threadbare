import React, { useState, useCallback } from 'react';
import type { GameplayKpiReport } from '../../../engine/kpi/gameplayKpi';
import { EMPTY_STATE_STYLE } from './debugPanelStyles';

const SECTION_STYLE: React.CSSProperties = {
  marginBottom: '12px',
};
const HEADER_STYLE: React.CSSProperties = {
  color: 'var(--accent-gold)',
  fontWeight: 600,
  fontSize: 'var(--text-xs)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '4px',
};
const ROW_STYLE: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  alignItems: 'center',
  padding: '1px 0',
  fontSize: 'var(--text-xs)',
};
const MUTED: React.CSSProperties = { color: 'var(--text-muted)' };

function statusColor(s: string): string {
  if (s === 'green') return '#6a9a6e';
  if (s === 'red') return '#b85450';
  return '#c4a84a';
}

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function fix2(n: number): string {
  return n.toFixed(2);
}

export function KpiDebugTab({ currentTick }: { currentTick: number }) {
  const [report, setReport] = useState<GameplayKpiReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastFetchTick, setLastFetchTick] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await window.__DEBUG?.getKpiReport?.();
      setReport(r ?? null);
      setLastFetchTick(currentTick);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [currentTick]);

  if (!report) {
    return (
      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          Click Refresh to compute the KPI report for the current game state.
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          style={{
            padding: '4px 10px', fontSize: 'var(--text-xs)',
            background: 'var(--surface-raised)', color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)', borderRadius: '3px', cursor: 'pointer',
            alignSelf: 'flex-start',
          }}
        >
          {loading ? 'Computing…' : 'Refresh'}
        </button>
        {error && <div style={{ color: '#b85450', fontSize: 'var(--text-xs)' }}>{error}</div>}
      </div>
    );
  }

  const o = report.outcomes;
  const tc = report.templateConcentration;
  const bf = report.branchingFire;
  const tb = report.threadedBeats;
  const ef = report.eligibilityFunnel;
  const rg = report.resolutionGap;

  return (
    <div style={{ padding: '10px 12px', overflowY: 'auto', height: '100%', fontFamily: 'monospace' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-gold)', fontWeight: 600 }}>
          KPI — Tick {report.tick}  Seed {report.seed}
        </span>
        <button
          onClick={refresh}
          disabled={loading}
          style={{
            padding: '2px 8px', fontSize: 'var(--text-xs)',
            background: 'var(--surface-raised)', color: 'var(--text-muted)',
            border: '1px solid var(--border-subtle)', borderRadius: '3px', cursor: 'pointer',
          }}
        >
          {loading ? '…' : `Refresh${lastFetchTick !== null ? ` (t${lastFetchTick})` : ''}`}
        </button>
      </div>

      {/* Thresholds — most important, put first */}
      <div style={SECTION_STYLE}>
        <div style={HEADER_STYLE}>Thresholds</div>
        {report.thresholds.map(t => {
          const col = statusColor(t.status);
          const mark = t.status === 'green' ? '✓' : t.status === 'red' ? '✗' : '~';
          const dir = t.direction === 'above_is_bad' ? '≤' : '≥';
          return (
            <div key={t.metric} style={ROW_STYLE}>
              <span style={{ color: col, width: '12px', flexShrink: 0 }}>{mark}</span>
              <span style={{ flex: 1, color: 'var(--text-secondary)' }}>{t.metric}</span>
              <span style={{ color: col }}>{fix2(t.value)}</span>
              <span style={MUTED}>{dir}{fix2(t.threshold)}</span>
            </div>
          );
        })}
      </div>

      {/* Outcome distribution */}
      <div style={SECTION_STYLE}>
        <div style={HEADER_STYLE}>Outcome Distribution {o.insufficientData ? <span style={{ color: '#c4a84a' }}>(low data n={o.total})</span> : `(n=${o.total})`}</div>
        {!o.insufficientData && (
          <>
            <div style={ROW_STYLE}><span style={MUTED}>Failure rate:</span><span>{pct(o.failureRate)}</span></div>
            <div style={ROW_STYLE}><span style={MUTED}>Crit-fail rate:</span><span>{pct(o.critFailRate)}</span></div>
            <div style={ROW_STYLE}><span style={MUTED}>Clean success:</span><span>{pct(o.cleanSuccessRate)}</span></div>
          </>
        )}
      </div>

      {/* Template concentration */}
      <div style={SECTION_STYLE}>
        <div style={HEADER_STYLE}>Template Concentration (n={tc.totalSelections})</div>
        <div style={ROW_STYLE}><span style={MUTED}>Top share:</span><span>{pct(tc.topShare)}</span><span style={MUTED}>  Entropy:</span><span>{fix2(tc.entropy)}</span></div>
        {tc.byTemplate.slice(0, 5).map(t => (
          <div key={t.templateId} style={{ ...ROW_STYLE, paddingLeft: '8px' }}>
            <span style={{ ...MUTED, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.templateId}</span>
            <span style={{ flexShrink: 0 }}>{pct(t.share)} ({t.count}x)</span>
          </div>
        ))}
      </div>

      {/* Branching / threaded */}
      <div style={SECTION_STYLE}>
        <div style={HEADER_STYLE}>Branching & Threaded Beats</div>
        <div style={ROW_STYLE}><span style={MUTED}>Branching fires:</span><span>{bf.totalFires}</span><span style={MUTED}> per30t:</span><span>{fix2(bf.firesPerChunk)}</span></div>
        <div style={ROW_STYLE}><span style={MUTED}>Threaded beats:</span><span>{tb.totalBeats}</span><span style={MUTED}> per10t:</span><span>{fix2(tb.beatsPerChunk)}</span></div>
      </div>

      {/* Eligibility funnel */}
      <div style={SECTION_STYLE}>
        <div style={HEADER_STYLE}>Eligibility Funnel</div>
        {ef.available ? (
          <>
            <div style={{ ...ROW_STYLE, ...MUTED }}>since tick {ef.sinceTick}{ef.truncated ? ' (truncated)' : ''}</div>
            {ef.topConsidered.slice(0, 5).map(t => (
              <div key={t.templateId} style={{ ...ROW_STYLE, paddingLeft: '8px' }}>
                <span style={{ ...MUTED, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.templateId}</span>
                <span style={{ flexShrink: 0 }}>seen:{t.considered} cvr:{pct(t.conversionRate)}{t.topGate ? ` [${t.topGate}]` : ''}</span>
              </div>
            ))}
          </>
        ) : (
          <div style={MUTED}>No funnel data available.</div>
        )}
      </div>

      {/* Resolution gap */}
      {!rg.insufficientData && (
        <div style={SECTION_STYLE}>
          <div style={HEADER_STYLE}>Resolution Gap</div>
          <div style={ROW_STYLE}>
            <span style={MUTED}>Steps:</span><span>{rg.stepCount}</span>
            <span style={MUTED}>Capability margin:</span>
            <span style={{ color: rg.meanCapabilityMargin >= 0 ? 'var(--text-primary)' : '#b85450' }}>
              {rg.meanCapabilityMargin >= 0 ? '+' : ''}{fix2(rg.meanCapabilityMargin)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
