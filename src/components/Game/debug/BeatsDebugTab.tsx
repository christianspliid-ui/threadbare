import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';

type BeatCatalogueEntry = import('../../../debug-bridge.d').DebugBeatCatalogueEntry;
type BeatSchedule = import('../../../debug-bridge.d').DebugBeatScheduleResult;

const PANEL_STYLE: CSSProperties = {
  padding: '10px 12px',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};

const BLOCK_STYLE: CSSProperties = {
  border: '1px solid var(--border-subtle)',
  borderRadius: '6px',
  padding: '8px',
  background: 'var(--bg-surface)',
};

const TITLE_STYLE: CSSProperties = {
  fontSize: 'var(--text-xs)',
  fontWeight: 600,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: '6px',
};

const ROW_STYLE: CSSProperties = {
  display: 'flex',
  gap: '14px',
  flexWrap: 'wrap',
  fontSize: 'var(--text-xs)',
  color: 'var(--text-primary)',
};

const LIST_STYLE: CSSProperties = {
  margin: 0,
  paddingLeft: '16px',
  display: 'grid',
  gap: '2px',
  fontSize: 'var(--text-xs)',
  color: 'var(--text-primary)',
};

const INPUT_STYLE: CSSProperties = {
  flex: 1,
  background: 'var(--bg-deep)',
  border: '1px solid var(--border-subtle)',
  color: 'var(--text-primary)',
  borderRadius: '4px',
  fontSize: 'var(--text-xs)',
  padding: '6px 8px',
};

const BUTTON_STYLE: CSSProperties = {
  padding: '6px 10px',
  borderRadius: '4px',
  border: '1px solid var(--border-subtle)',
  background: 'var(--bg-raised)',
  color: 'var(--text-primary)',
  fontSize: 'var(--text-xs)',
  cursor: 'pointer',
};

interface BeatsDebugTabProps {
  currentTick: number;
}

/**
 * THR-507 — live inspector for the Ascendant Beat Director (THR-500). Reads the
 * catalogue + live schedule via the `window.__DEBUG` beat surface and exposes
 * fireBeat / grantUnlock controls. Self-contained (no prop plumbing) — mirrors
 * ActionUnlocksView. Re-reads when the tick advances.
 */
export function BeatsDebugTab({ currentTick }: BeatsDebugTabProps) {
  const [catalogue, setCatalogue] = useState<BeatCatalogueEntry[]>([]);
  const [schedule, setSchedule] = useState<BeatSchedule | null>(null);
  const [fireBeatId, setFireBeatId] = useState('');
  const [grantId, setGrantId] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!window.__DEBUG) return;
    setLoading(true);
    try {
      const [beats, sched] = await Promise.all([
        window.__DEBUG.listBeats(),
        window.__DEBUG.beatSchedule(),
      ]);
      setCatalogue(beats);
      setSchedule(sched);
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-read on mount and whenever the tick advances (the Director runs per-turn).
  useEffect(() => {
    void refresh();
  }, [refresh, currentTick]);

  const spineBeats = useMemo(() => catalogue.filter((b) => b.source === 'spine'), [catalogue]);
  const poolBeats = useMemo(() => catalogue.filter((b) => b.source === 'pool'), [catalogue]);

  const handleFire = useCallback(async () => {
    const id = fireBeatId.trim();
    if (!id || !window.__DEBUG) return;
    const result = window.__DEBUG.fireBeat(id);
    setStatusMessage(result.message);
    if (result.success) {
      setFireBeatId('');
      await refresh();
    }
  }, [fireBeatId, refresh]);

  const handleGrant = useCallback(async () => {
    const id = grantId.trim();
    if (!id || !window.__DEBUG) return;
    const result = window.__DEBUG.grantUnlock(id);
    setStatusMessage(result.message);
    if (result.success) {
      setGrantId('');
      await refresh();
    }
  }, [grantId, refresh]);

  if (!window.__DEBUG) {
    return <div style={PANEL_STYLE}>Debug bridge not available.</div>;
  }

  return (
    <div style={PANEL_STYLE} data-testid="beats-debug-tab">
      <div style={BLOCK_STYLE}>
        <div style={TITLE_STYLE}>Director State</div>
        {schedule?.available ? (
          <div style={ROW_STYLE}>
            <span>Turn: <strong>{schedule.turn}</strong></span>
            <span>Spine cursor: <strong>{schedule.spineCursor}</strong>/{schedule.spineLength}</span>
            <span>Next spine: <strong>{schedule.nextSpineBeatId ?? '— exhausted —'}</strong></span>
            <span>Last beat turn: <strong>{schedule.lastBeatTurn}</strong></span>
            <span>Pool size: <strong>{schedule.poolSize}</strong></span>
            {loading && <span style={{ color: 'var(--text-muted)' }}>Refreshing…</span>}
          </div>
        ) : (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            Beat state not loaded {loading ? '(refreshing…)' : ''}
          </div>
        )}
      </div>

      <div style={BLOCK_STYLE}>
        <div style={TITLE_STYLE}>Pending Beat</div>
        {schedule?.pending ? (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-gold)' }}>
            <strong>{schedule.pending.beatId}</strong> ({schedule.pending.kind}) — offered turn{' '}
            {schedule.pending.offeredTurn}, via {schedule.pending.triggerKind}
          </div>
        ) : (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>None pending.</div>
        )}
      </div>

      <div style={BLOCK_STYLE}>
        <div style={TITLE_STYLE}>Fire Beat</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            value={fireBeatId}
            onChange={(e) => setFireBeatId(e.target.value)}
            placeholder="beat id (e.g. beat.spine.opening)"
            style={INPUT_STYLE}
          />
          <button type="button" onClick={() => void handleFire()} style={BUTTON_STYLE}>Fire</button>
          <button type="button" onClick={() => void refresh()} style={BUTTON_STYLE}>Refresh</button>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <input
            value={grantId}
            onChange={(e) => setGrantId(e.target.value)}
            placeholder="action id to unlock (e.g. invest.thread_actor)"
            style={INPUT_STYLE}
          />
          <button type="button" onClick={() => void handleGrant()} style={BUTTON_STYLE}>Grant Unlock</button>
        </div>
        {statusMessage && (
          <div style={{ marginTop: '6px', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            {statusMessage}
          </div>
        )}
      </div>

      <div style={BLOCK_STYLE}>
        <div style={TITLE_STYLE}>Run-Unlocked Actions ({schedule?.runUnlockedActionIds.length ?? 0})</div>
        {schedule && schedule.runUnlockedActionIds.length > 0 ? (
          <ul style={LIST_STYLE}>
            {schedule.runUnlockedActionIds.map((id) => <li key={id}>{id}</li>)}
          </ul>
        ) : (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>None unlocked yet.</div>
        )}
      </div>

      <div style={BLOCK_STYLE}>
        <div style={TITLE_STYLE}>Spine Catalogue ({spineBeats.length})</div>
        <ul style={LIST_STYLE}>
          {spineBeats.map((b, i) => (
            <li key={b.beatId}>
              {i === schedule?.spineCursor ? '▶ ' : ''}{b.beatId} — {b.triggerKind}
              {b.minTurn !== null ? ` ≥t${b.minTurn}` : ''}
              {b.grantsActionIds.length > 0 ? ` → ${b.grantsActionIds.join(', ')}` : ''}
            </li>
          ))}
        </ul>
      </div>

      <div style={BLOCK_STYLE}>
        <div style={TITLE_STYLE}>Pool Catalogue ({poolBeats.length})</div>
        {poolBeats.length > 0 ? (
          <ul style={LIST_STYLE}>
            {poolBeats.map((b) => (
              <li key={b.beatId}>
                {b.beatId} — {b.kind}{b.weight !== null ? ` (w${b.weight})` : ''}
              </li>
            ))}
          </ul>
        ) : (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            Empty (starter library lands in follow-up content issues).
          </div>
        )}
      </div>

      <div style={BLOCK_STYLE}>
        <div style={TITLE_STYLE}>History ({schedule?.history.length ?? 0})</div>
        {schedule && schedule.history.length > 0 ? (
          <ul style={LIST_STYLE}>
            {schedule.history.map((h, i) => (
              <li key={`${h.beatId}-${i}`}>
                t{h.resolvedTurn}: {h.beatId} → {h.outcome}
                {h.grantedActionIds.length > 0 ? ` (+${h.grantedActionIds.join(', ')})` : ''}
              </li>
            ))}
          </ul>
        ) : (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>No beats resolved yet.</div>
        )}
      </div>
    </div>
  );
}
