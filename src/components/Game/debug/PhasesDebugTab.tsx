import React, { useMemo, useState } from 'react';
import type { TraceEntry, TickProfileTrace } from '../../../types/trace';
import { ENGINE_PHASES, PHASE_PLAN } from '../../../engine/phases';
import { PHASE_SLOTS, type EnginePhase, type PhaseSlot } from '../../../engine/phaseRegistry';
import {
  getTimingTraces,
  aggregatePhaseTimings,
  enableProfiling,
  disableProfiling,
  isProfilingEnabled,
  type PhaseTimingAggregate,
} from '../../../engine/traceBuffer';
import { EMPTY_STATE_STYLE } from './debugPanelStyles';

/**
 * PhasesDebugTab (THR-238 · extended THR-580).
 *
 * Reads the dedicated timing ring (`getTimingTraces()`) rather than the shared
 * trace buffer, and derives per-phase avg/max/p95 via `aggregatePhaseTimings()`.
 * Registered phases keep their slot grouping; inline phases (now timed) render in a
 * synthetic "inline (runTick)" section. A `tick_profile` header shows the last tick's
 * total/slowest/agent-count/rebuild flags. A toggle drives `enableProfiling()`.
 *
 * `traces` (the shared buffer) is still consumed for crash detection — `tick_crash`
 * lives there, not in the timing ring.
 */

/** DebugPanel/CLI highlight threshold for a slow phase (mirrors orchestrator SLOW_PHASE_WARN_MS). */
const SLOW_PHASE_WARN_MS = 8;

interface PhaseProfile {
  lastMs?: number;
  avgMs?: number;
  maxMs?: number;
  p95Ms?: number;
  samples?: number;
  eventDelta?: number;
  crashed: boolean;
  crashError?: string;
}

/** Build the crashed-phase set from the shared buffer (tick_crash lives there). */
function deriveCrashes(traces: readonly TraceEntry[]): Map<string, string> {
  const out = new Map<string, string>();
  for (const t of traces) {
    // `tick_crash` is emitted with a cast and isn't in the TraceEntry category union;
    // widen to string to read it (mirrors the runtime shape).
    if ((t.category as string) !== 'tick_crash') continue;
    const m = /^Phase "([^"]+)" threw during/.exec(t.summary);
    if (m) out.set(m[1], t.summary);
  }
  return out;
}

function buildProfiles(
  aggregates: PhaseTimingAggregate[],
  crashes: Map<string, string>,
): Map<string, PhaseProfile> {
  const out = new Map<string, PhaseProfile>();
  for (const a of aggregates) {
    out.set(a.phase, {
      lastMs: a.lastMs,
      avgMs: a.avgMs,
      maxMs: a.maxMs,
      p95Ms: a.p95Ms,
      samples: a.samples,
      eventDelta: a.lastEventDelta,
      crashed: crashes.has(a.phase),
      crashError: crashes.get(a.phase),
    });
  }
  // Phases that only crashed (no timing sample) still surface.
  for (const [phase, err] of crashes) {
    if (!out.has(phase)) out.set(phase, { crashed: true, crashError: err });
  }
  return out;
}

const SLOT_HEADER: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  fontWeight: 600,
  color: 'var(--accent-gold)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  margin: '12px 0 4px',
  borderBottom: '1px solid var(--border-subtle)',
  paddingBottom: '3px',
};

const ROW: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '18px 1fr 48px 48px 48px 48px 40px',
  gap: '5px',
  padding: '3px 0',
  fontSize: 'var(--text-xs)',
  alignItems: 'center',
};

const ROW_HEADER: React.CSSProperties = {
  ...ROW,
  color: 'var(--text-muted)',
  fontWeight: 500,
  borderBottom: '1px dotted var(--border-subtle)',
  paddingBottom: '3px',
};

const MUTED: React.CSSProperties = {
  color: 'var(--text-muted)',
  fontSize: 'var(--text-xs)',
};

const CHIP: React.CSSProperties = {
  background: 'rgba(160,149,107,0.08)',
  border: '1px solid rgba(160,149,107,0.2)',
  borderRadius: '3px',
  padding: '0 4px',
  fontSize: '10px',
  color: 'var(--text-secondary)',
  marginRight: '3px',
};

function ms(v?: number): string {
  return v != null ? `${v.toFixed(2)}` : '—';
}

/** A slow phase (avg or max over the warn threshold) is tinted gold. */
function slowStyle(profile?: PhaseProfile): React.CSSProperties {
  const slow = (profile?.avgMs ?? 0) >= SLOW_PHASE_WARN_MS || (profile?.maxMs ?? 0) >= SLOW_PHASE_WARN_MS * 2;
  return slow ? { color: 'var(--accent-gold)' } : MUTED;
}

function timingCells(profile?: PhaseProfile) {
  const s = slowStyle(profile);
  return (
    <>
      <span style={s}>{ms(profile?.avgMs)}</span>
      <span style={s}>{ms(profile?.maxMs)}</span>
      <span style={s}>{ms(profile?.p95Ms)}</span>
      <span style={MUTED}>{ms(profile?.lastMs)}</span>
      <span style={MUTED}>{profile?.eventDelta != null ? `${profile.eventDelta}` : '—'}</span>
    </>
  );
}

function statusGlyph(profile?: PhaseProfile): { glyph: string; title: string } {
  if (profile?.crashed) return { glyph: '🔴', title: `crashed: ${profile.crashError ?? '(unknown error)'}` };
  if (profile?.samples && profile.samples > 0) {
    return {
      glyph: (profile.avgMs ?? 0) >= SLOW_PHASE_WARN_MS ? '🟠' : '🟢',
      title: `${profile.samples} samples · avg ${ms(profile.avgMs)}ms · max ${ms(profile.maxMs)}ms · p95 ${ms(profile.p95Ms)}ms`,
    };
  }
  return { glyph: '⚪', title: 'never run yet (enable profiling + advance ticks)' };
}

function PhaseRow({ phase, profile }: { phase: EnginePhase; profile?: PhaseProfile }) {
  const { glyph, title } = statusGlyph(profile);
  return (
    <div style={ROW}>
      <span title={title} style={{ textAlign: 'center' }}>{glyph}</span>
      <span>
        <strong style={{ color: 'var(--text-primary)' }}>{phase.label ?? phase.id}</strong>
        {phase.label && phase.label !== phase.id && (
          <span style={{ ...MUTED, marginLeft: '6px' }}>{phase.id}</span>
        )}
        {(phase.afterPhase?.length ?? 0) > 0 && (
          <span style={{ ...MUTED, marginLeft: '6px' }}>
            after: {phase.afterPhase!.map(id => <span key={id} style={CHIP}>{id}</span>)}
          </span>
        )}
      </span>
      {timingCells(profile)}
    </div>
  );
}

function InlineRow({ phase, profile }: { phase: string; profile?: PhaseProfile }) {
  const { glyph, title } = statusGlyph(profile);
  return (
    <div style={ROW}>
      <span title={title} style={{ textAlign: 'center' }}>{glyph}</span>
      <span><strong style={{ color: 'var(--text-primary)' }}>{phase}</strong></span>
      {timingCells(profile)}
    </div>
  );
}

export function PhasesDebugTab({ traces, currentTick }: { traces: readonly TraceEntry[]; currentTick: number }) {
  // Local mirror of the module profiling flag so the toggle re-renders the tab.
  const [profilingOn, setProfilingOn] = useState<boolean>(isProfilingEnabled());

  // Re-read the timing ring each tick (and on toggle). The ring is a module singleton.
  const timing = useMemo(
    () => getTimingTraces().slice(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentTick, profilingOn],
  );
  const aggregates = useMemo(() => aggregatePhaseTimings(timing), [timing]);
  const crashes = useMemo(() => deriveCrashes(traces), [traces]);
  const profiles = useMemo(() => buildProfiles(aggregates, crashes), [aggregates, crashes]);

  const registeredIds = useMemo(() => new Set(ENGINE_PHASES.map(p => p.id)), []);
  const inlinePhases = useMemo(
    () => aggregates.filter(a => !registeredIds.has(a.phase)).map(a => a.phase),
    [aggregates, registeredIds],
  );

  const lastTickProfile = useMemo(() => {
    let latest: TickProfileTrace | undefined;
    for (const t of timing) {
      if (t.category === 'tick_profile') {
        const tt = t as TickProfileTrace;
        if (!latest || tt.tick >= latest.tick) latest = tt;
      }
    }
    return latest;
  }, [timing]);

  const toggleProfiling = () => {
    if (isProfilingEnabled()) {
      disableProfiling();
      setProfilingOn(false);
    } else {
      enableProfiling();
      setProfilingOn(true);
    }
  };

  const totalRegistered = ENGINE_PHASES.length;

  return (
    <div style={{ padding: '8px 12px', fontFamily: 'monospace', overflowY: 'auto', height: '100%' }}>
      {/* Profiling toggle + tick_profile header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <button
          onClick={toggleProfiling}
          style={{
            fontSize: 'var(--text-xs)',
            fontFamily: 'monospace',
            padding: '3px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
            border: `1px solid ${profilingOn ? 'var(--accent-gold)' : 'var(--border-subtle)'}`,
            background: profilingOn ? 'rgba(160,149,107,0.15)' : 'transparent',
            color: profilingOn ? 'var(--accent-gold)' : 'var(--text-muted)',
          }}
        >
          Profiling: {profilingOn ? 'ON' : 'off'}
        </button>
        {!profilingOn && (
          <span style={MUTED}>Enable, then advance ticks to collect per-phase timings.</span>
        )}
      </div>

      {lastTickProfile && (
        <div style={{ ...MUTED, marginBottom: '10px', lineHeight: 1.5 }}>
          <div>
            <strong style={{ color: 'var(--text-primary)' }}>tick {lastTickProfile.tick}</strong>
            {' — '}total <strong style={{ color: lastTickProfile.totalMs >= 50 ? 'var(--accent-gold)' : 'var(--text-secondary)' }}>{lastTickProfile.totalMs.toFixed(1)}ms</strong>
            {' · slowest '}<strong style={{ color: 'var(--text-secondary)' }}>{lastTickProfile.slowestPhase}</strong>
            {' '}{lastTickProfile.slowestPhaseMs.toFixed(1)}ms
            {' · '}{lastTickProfile.phaseCount} phases · {lastTickProfile.agentCount} agents
          </div>
          <div>
            cache rebuilds this tick:{' '}
            encounter <strong style={{ color: lastTickProfile.encounterCacheRebuilt ? 'var(--accent-gold)' : 'var(--text-secondary)' }}>{lastTickProfile.encounterCacheRebuilt ? 'YES' : 'no'}</strong>
            {' · '}distance-matrix <strong style={{ color: lastTickProfile.distanceMatrixRebuilt ? 'var(--accent-gold)' : 'var(--text-secondary)' }}>{lastTickProfile.distanceMatrixRebuilt ? 'YES' : 'no'}</strong>
          </div>
        </div>
      )}

      {totalRegistered === 0 ? (
        <div style={EMPTY_STATE_STYLE}>No phases registered yet.</div>
      ) : (
        <div style={{ ...MUTED, marginBottom: '4px' }}>
          {totalRegistered} registered phase{totalRegistered === 1 ? '' : 's'} across {PHASE_PLAN.size} slot{PHASE_PLAN.size === 1 ? '' : 's'}
          {inlinePhases.length > 0 ? ` · ${inlinePhases.length} inline phases timed` : ''}.
        </div>
      )}

      {PHASE_SLOTS.map((slot: PhaseSlot) => {
        const phases = PHASE_PLAN.get(slot) ?? [];
        if (phases.length === 0) return null;
        return (
          <div key={slot}>
            <div style={SLOT_HEADER}>{slot} <span style={MUTED}>({phases.length})</span></div>
            <div style={ROW_HEADER}>
              <span></span><span>id / dependencies</span><span>avg</span><span>max</span><span>p95</span><span>last</span><span>ev</span>
            </div>
            {phases.map(p => (
              <PhaseRow key={p.id} phase={p} profile={profiles.get(p.id)} />
            ))}
          </div>
        );
      })}

      {inlinePhases.length > 0 && (
        <div>
          <div style={SLOT_HEADER}>inline (runTick) <span style={MUTED}>({inlinePhases.length})</span></div>
          <div style={ROW_HEADER}>
            <span></span><span>id</span><span>avg</span><span>max</span><span>p95</span><span>last</span><span>ev</span>
          </div>
          {inlinePhases.map(id => (
            <InlineRow key={id} phase={id} profile={profiles.get(id)} />
          ))}
        </div>
      )}
    </div>
  );
}
