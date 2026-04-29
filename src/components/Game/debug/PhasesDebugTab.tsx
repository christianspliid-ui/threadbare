import React, { useMemo } from 'react';
import type { TraceEntry } from '../../../types/trace';
import { ENGINE_PHASES, PHASE_PLAN } from '../../../engine/phases';
import { PHASE_SLOTS, type EnginePhase, type PhaseSlot } from '../../../engine/phaseRegistry';
import { EMPTY_STATE_STYLE } from './debugPanelStyles';

/**
 * Per-phase last-tick profile derived from the trace buffer.
 * THR-238: registry phases emit `tick_phase_profile` with `phase: <id>` and
 * `durationMs` / `eventDelta`. We pick the most recent matching trace per id.
 */
interface PhaseProfile {
  durationMs?: number;
  eventDelta?: number;
  lastTick?: number;
  crashed: boolean;
  crashError?: string;
}

function deriveProfiles(traces: readonly TraceEntry[]): Map<string, PhaseProfile> {
  const out = new Map<string, PhaseProfile>();
  // Walk newest-first so the first occurrence per phase wins.
  for (let i = traces.length - 1; i >= 0; i--) {
    const t = traces[i];
    if (t.category === 'tick_phase_profile') {
      const tt = t as TraceEntry & { phase?: string; durationMs?: number; eventDelta?: number };
      const id = typeof tt.phase === 'string' ? tt.phase : null;
      if (!id) continue;
      const existing = out.get(id);
      if (!existing) {
        out.set(id, {
          durationMs: tt.durationMs,
          eventDelta: tt.eventDelta,
          lastTick: t.tick,
          crashed: false,
        });
      }
    } else if (t.category === 'tick_crash') {
      // Crash trace summary format: `Phase "<id>" threw during <slot>: <message>`
      const m = /^Phase "([^"]+)" threw during/.exec(t.summary);
      if (m) {
        const id = m[1];
        const existing = out.get(id);
        if (!existing || (t.tick >= (existing.lastTick ?? -1))) {
          out.set(id, {
            ...(existing ?? { crashed: false }),
            crashed: true,
            crashError: t.summary,
            lastTick: t.tick,
          });
        }
      }
    }
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
  gridTemplateColumns: '20px 1fr 80px 60px 60px',
  gap: '6px',
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

function PhaseRow({ phase, profile }: { phase: EnginePhase; profile?: PhaseProfile }) {
  const status = profile?.crashed ? '🔴' : profile?.eventDelta != null && profile.eventDelta > 0 ? '🟢' : profile ? '🟡' : '⚪';
  const statusTitle = profile?.crashed
    ? `crashed: ${profile.crashError ?? '(unknown error)'}`
    : profile?.eventDelta != null && profile.eventDelta > 0
      ? `last tick ${profile.lastTick}: ${profile.eventDelta} events in ${profile.durationMs?.toFixed(2) ?? '?'}ms`
      : profile
        ? `last tick ${profile.lastTick}: ran clean (no events emitted)`
        : 'never run yet';

  return (
    <div style={ROW}>
      <span title={statusTitle} style={{ textAlign: 'center' }}>{status}</span>
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
        {(phase.beforePhase?.length ?? 0) > 0 && (
          <span style={{ ...MUTED, marginLeft: '6px' }}>
            before: {phase.beforePhase!.map(id => <span key={id} style={CHIP}>{id}</span>)}
          </span>
        )}
      </span>
      <span style={MUTED}>{profile?.durationMs != null ? `${profile.durationMs.toFixed(2)}ms` : '—'}</span>
      <span style={MUTED}>{profile?.eventDelta != null ? `${profile.eventDelta} ev` : '—'}</span>
      <span style={MUTED}>{profile?.lastTick != null ? `t${profile.lastTick}` : '—'}</span>
    </div>
  );
}

export function PhasesDebugTab({ traces }: { traces: readonly TraceEntry[] }) {
  const profiles = useMemo(() => deriveProfiles(traces), [traces]);
  const totalRegistered = ENGINE_PHASES.length;

  if (totalRegistered === 0) {
    return (
      <div style={{ padding: '12px' }}>
        <div style={EMPTY_STATE_STYLE}>
          No phases registered yet — registry is the seam being wired in.
          Migrated phases will appear here from THR-238 Land 2 onward.
        </div>
        <div style={{ ...MUTED, marginTop: '12px', fontFamily: 'monospace' }}>
          Slot anchors active in <code>runTick</code>:
          <ul style={{ marginTop: '6px', paddingLeft: '20px' }}>
            {PHASE_SLOTS.map(slot => (
              <li key={slot} style={{ marginBottom: '2px' }}>
                <code>{slot}</code>
                <span style={MUTED}> — empty (0 phases)</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '8px 12px', fontFamily: 'monospace', overflowY: 'auto', height: '100%' }}>
      <div style={{ ...MUTED, marginBottom: '10px' }}>
        {totalRegistered} registered phase{totalRegistered === 1 ? '' : 's'} across {PHASE_PLAN.size} slot{PHASE_PLAN.size === 1 ? '' : 's'}.
        Add phases via <code>src/engine/phases/index.ts</code>.
      </div>
      {PHASE_SLOTS.map((slot: PhaseSlot) => {
        const phases = PHASE_PLAN.get(slot) ?? [];
        return (
          <div key={slot}>
            <div style={SLOT_HEADER}>{slot} <span style={MUTED}>({phases.length})</span></div>
            {phases.length === 0 ? (
              <div style={{ ...MUTED, padding: '4px 0' }}>(no phases registered in this slot)</div>
            ) : (
              <>
                <div style={ROW_HEADER}>
                  <span></span><span>id / dependencies</span><span>duration</span><span>events</span><span>last</span>
                </div>
                {phases.map(p => (
                  <PhaseRow key={p.id} phase={p} profile={profiles.get(p.id)} />
                ))}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
