import React, { useEffect, useState } from 'react';
import type { WebGLDiagnosticsSnapshot, WebGLLogEntry } from '../../HexMapV2/diagnostics/WebGLDiagnostics';

interface WebGLDebugTabProps {
  getDiagnostics: () => WebGLDiagnosticsSnapshot | null;
}

const SECTION_STYLE: React.CSSProperties = {
  marginBottom: '12px',
  border: '1px solid var(--border-subtle)',
  borderRadius: '4px',
  background: 'var(--bg-raised)',
  overflow: 'hidden',
};

const SECTION_HEADER_STYLE: React.CSSProperties = {
  padding: '6px 10px',
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  color: 'var(--accent-gold)',
  borderBottom: '1px solid var(--border-subtle)',
  background: 'var(--bg-deep)',
};

const STAT_ROW_STYLE: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '3px 10px',
  fontSize: '12px',
  fontFamily: 'monospace',
  color: 'var(--text-primary)',
};

const STAT_LABEL_STYLE: React.CSSProperties = {
  color: 'var(--text-muted)',
};

const LOG_ENTRY_STYLE: React.CSSProperties = {
  padding: '3px 10px',
  fontSize: '11px',
  fontFamily: 'monospace',
  borderBottom: '1px solid var(--border-subtle)',
  lineHeight: 1.4,
};

const LOG_LEVEL_COLORS: Record<WebGLLogEntry['level'], string> = {
  info: 'var(--text-muted)',
  warn: '#d4a040',
  error: '#c44',
};

const EMPTY_STYLE: React.CSSProperties = {
  padding: '32px 16px',
  textAlign: 'center',
  color: 'var(--text-primary)',
  opacity: 0.4,
  fontSize: '13px',
};

/**
 * Debug panel tab showing WebGL renderer diagnostics:
 * - Live render stats (FPS, draw calls, triangles, memory)
 * - GPU context info (GPU name, caps, context loss status)
 * - Event log (context lost/restored, init errors)
 *
 * Polls diagnostics every 500ms to avoid per-frame React renders.
 */
export const WebGLDebugTab = React.memo(function WebGLDebugTab({ getDiagnostics }: WebGLDebugTabProps) {
  const [snapshot, setSnapshot] = useState<WebGLDiagnosticsSnapshot | null>(null);

  useEffect(() => {
    // Initial capture
    setSnapshot(getDiagnostics());

    const interval = setInterval(() => {
      setSnapshot(getDiagnostics());
    }, 500);

    return () => clearInterval(interval);
  }, [getDiagnostics]);

  if (!snapshot) {
    return <div style={EMPTY_STYLE}>Renderer not initialized.</div>;
  }

  const { stats, context, log, sceneObjects } = snapshot;

  return (
    <div>
      {/* Render Stats */}
      <div style={SECTION_STYLE}>
        <div style={SECTION_HEADER_STYLE}>Render Stats</div>
        <StatRow label="FPS" value={stats.fps} warn={stats.fps > 0 && stats.fps < 30} />
        <StatRow label="Frame time" value={`${stats.frameTimeMs} ms`} warn={stats.frameTimeMs > 33} />
        <StatRow label="Draw calls" value={stats.drawCalls} />
        <StatRow label="Triangles" value={stats.triangles.toLocaleString()} />
        <StatRow label="Lines" value={stats.lines.toLocaleString()} />
        <StatRow label="Points" value={stats.points.toLocaleString()} />
        <StatRow label="Scene objects" value={sceneObjects} />
      </div>

      {/* GPU Memory */}
      <div style={SECTION_STYLE}>
        <div style={SECTION_HEADER_STYLE}>GPU Memory</div>
        <StatRow label="Textures" value={stats.textures} />
        <StatRow label="Geometries" value={stats.geometries} />
        <StatRow label="Programs" value={stats.programs} />
      </div>

      {/* Context Info */}
      <div style={SECTION_STYLE}>
        <div style={SECTION_HEADER_STYLE}>GPU Context</div>
        <StatRow label="Renderer" value={truncate(context.renderer, 40)} />
        <StatRow label="Vendor" value={context.vendor} />
        <StatRow label="Max texture" value={`${context.maxTextureSize}px`} />
        <StatRow label="Max tex units" value={context.maxTextures} />
        <StatRow
          label="Context"
          value={context.contextLost ? 'LOST' : 'OK'}
          warn={context.contextLost}
        />
        {context.contextRestoreCount > 0 && (
          <StatRow label="Restores" value={context.contextRestoreCount} warn />
        )}
      </div>

      {/* Event Log */}
      <div style={SECTION_STYLE}>
        <div style={SECTION_HEADER_STYLE}>Event Log ({log.length})</div>
        {log.length === 0 ? (
          <div style={{ ...EMPTY_STYLE, padding: '12px' }}>No events.</div>
        ) : (
          // Show newest first, capped at 50 for rendering perf
          [...log].reverse().slice(0, 50).map((entry, i) => (
            <div
              key={i}
              style={{
                ...LOG_ENTRY_STYLE,
                color: LOG_LEVEL_COLORS[entry.level],
              }}
            >
              <span style={{ opacity: 0.5 }}>
                {new Date(entry.timestamp).toLocaleTimeString()}{' '}
              </span>
              <span style={{ fontWeight: entry.level === 'error' ? 600 : 400 }}>
                [{entry.source}] {entry.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function StatRow({ label, value, warn }: { label: string; value: string | number; warn?: boolean }) {
  return (
    <div style={STAT_ROW_STYLE}>
      <span style={STAT_LABEL_STYLE}>{label}</span>
      <span style={warn ? { color: '#c44', fontWeight: 600 } : undefined}>{value}</span>
    </div>
  );
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + '\u2026' : s;
}
