import { useMemo, type CSSProperties } from 'react';
import {
  reportSurfaceFragments,
  type SurfaceFragmentReport,
} from '../../../engine/content-eval/surfaceFragmentReport';
import type { TraceEntry } from '../../../types/trace';
import { EMPTY_STATE_STYLE } from './debugPanelStyles';

// ── Constants (NFP #1) ───────────────────────────────────────────────────────
/** How many recent live binding traces to show. */
const FRAGMENT_TRACE_LIMIT = 20;

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
const SCROLL_STYLE: CSSProperties = { flex: 1, overflowY: 'auto', overflowX: 'hidden' };
const SECTION_HEADING_STYLE: CSSProperties = {
  padding: '8px 12px 4px',
  color: 'var(--text-muted)',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};
const TEMPLATE_STYLE: CSSProperties = {
  padding: '6px 12px',
  borderBottom: '1px solid var(--border-subtle)',
};
const SLOT_ROW_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 56px',
  gap: '6px',
  alignItems: 'center',
  padding: '2px 0 2px 12px',
  color: 'var(--text-secondary)',
};
const BINDING_ROW_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1.4fr 1fr 1.2fr 64px',
  gap: '6px',
  alignItems: 'center',
  padding: '3px 12px',
  borderBottom: '1px solid var(--border-subtle)',
};

interface FragmentsDebugTabProps {
  traces: readonly TraceEntry[];
}

/**
 * Fragment inspection (THR-573).
 *
 * Top half: the *static* inventory — which templates multiply, on which axes, and how
 * many surfaces each one measures. Bottom half: the *live* bindings, read from
 * `surface_fragments_bound` traces, showing which variant actually bound this run and
 * whether it fell back to the `'*'` default. `usedDefault` is the signal worth watching:
 * a surface that always defaults is a template whose axis election missed.
 */
export function FragmentsDebugTab({ traces }: FragmentsDebugTabProps) {
  // Pure + deterministic over static registries. Fail-soft: a throw renders as a
  // message rather than taking the panel down.
  const report = useMemo<SurfaceFragmentReport | { _error: string }>(() => {
    try {
      return reportSurfaceFragments();
    } catch (err) {
      return { _error: err instanceof Error ? err.message : String(err) };
    }
  }, []);

  const bindingTraces = useMemo(
    () =>
      traces
        .filter((t) => t.category === 'surface_fragments_bound')
        .slice(-FRAGMENT_TRACE_LIMIT)
        .reverse() as Array<
        TraceEntry & {
          templateId: string;
          surfaceKey: string;
          bindings: ReadonlyArray<{ slot: string; axis: string; value: string; usedDefault: boolean }>;
        }
      >,
    [traces],
  );

  if ('_error' in report) {
    return <div style={EMPTY_STATE_STYLE}>Fragment report failed: {report._error}</div>;
  }

  const { summary, entries } = report;

  return (
    <div style={PANEL_STYLE} data-testid="fragments-view">
      <div style={SUMMARY_STYLE}>
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
          {summary.authoredSurfaces} surfaces
        </span>
        <span style={{ color: 'var(--text-muted)' }}>
          from <strong style={{ color: 'var(--text-secondary)' }}>{summary.authoredFragments}</strong> fragments
        </span>
        <span style={{ color: 'var(--text-muted)' }}>
          across <strong style={{ color: 'var(--text-secondary)' }}>{summary.multipliedTemplates}</strong> templates
        </span>
        {summary.templatesWithProblems > 0 && (
          <span style={{ color: '#b85450', fontWeight: 600 }}>
            {summary.templatesWithProblems} with problems
          </span>
        )}
      </div>

      <div style={SCROLL_STYLE}>
        <div style={SECTION_HEADING_STYLE}>Authored inventory</div>
        {entries.length === 0 ? (
          <div style={EMPTY_STATE_STYLE}>No template declares context fragments yet.</div>
        ) : (
          entries.map((entry) => (
            <div key={entry.templateId} style={TEMPLATE_STYLE} data-testid="fragments-template-row">
              <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{entry.templateName}</span>
                <span style={{ color: 'var(--text-muted)' }}>{entry.templateId}</span>
                <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)' }}>
                  {entry.enumeration.surfaceCount} surfaces
                </span>
              </div>
              {entry.slots.map((slot) => (
                <div key={slot.slot} style={SLOT_ROW_STYLE}>
                  <span>
                    {'{frag:'}{slot.slot}{'}'}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>{slot.axis}</span>
                  <span style={{ textAlign: 'right', color: slot.hasDefault ? 'var(--text-muted)' : '#b85450' }}>
                    {slot.values.length}{slot.hasDefault ? '' : ' no-default'}
                  </span>
                </div>
              ))}
              {entry.enumeration.problems.map((problem) => (
                <div key={problem} style={{ paddingLeft: '12px', color: '#b85450' }}>⚠ {problem}</div>
              ))}
            </div>
          ))
        )}

        <div style={SECTION_HEADING_STYLE}>Live bindings (surface_fragments_bound)</div>
        {bindingTraces.length === 0 ? (
          <div style={EMPTY_STATE_STYLE}>
            No fragment bindings traced yet — run ticks with tracing enabled.
          </div>
        ) : (
          <>
            <div style={{ ...BINDING_ROW_STYLE, color: 'var(--text-muted)', fontWeight: 600 }}>
              <span>template</span>
              <span>slot</span>
              <span>bound value</span>
              <span style={{ textAlign: 'center' }}>default?</span>
            </div>
            {bindingTraces.flatMap((trace, traceIndex) =>
              (trace.bindings ?? []).map((b) => (
                <div
                  key={`${traceIndex}-${trace.templateId}-${b.slot}`}
                  style={BINDING_ROW_STYLE}
                  data-testid="fragments-binding-row"
                >
                  <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {trace.templateId}
                  </span>
                  <span style={{ color: 'var(--text-primary)' }}>{b.slot}</span>
                  <span style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {b.value}
                  </span>
                  <span style={{ textAlign: 'center', color: b.usedDefault ? '#d9a441' : '#6a9a6e' }}>
                    {b.usedDefault ? 'yes' : 'no'}
                  </span>
                </div>
              )),
            )}
          </>
        )}
      </div>
    </div>
  );
}
