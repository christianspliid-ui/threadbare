import { useState } from 'react';
import type { ChronicleEntry } from '../../types/narrative';
import { ChronicleEntryCard, type ChronicleVoiceMode } from './ChronicleEntryCard';

interface ChroniclePanelProps {
  entries: ChronicleEntry[];
}

const VOICE_LABELS: Record<ChronicleVoiceMode, string> = {
  interleaved: 'Both',
  poet: 'Poet',
  witness: 'Witness',
};

export function ChroniclePanel({ entries }: ChroniclePanelProps) {
  const [voiceMode, setVoiceMode] = useState<ChronicleVoiceMode>('interleaved');

  const visibleEntries = [...entries].reverse();

  return (
    <div
      style={{
        background: 'var(--bg-deep)',
        border: '1px solid var(--border-gold)',
        borderRadius: '8px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {/* Header + toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-xs)',
            color: 'var(--accent-gold)',
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
          }}
        >
          Chronicle
        </span>
        <div style={{ display: 'flex', gap: '4px' }}>
          {(['interleaved', 'poet', 'witness'] as ChronicleVoiceMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setVoiceMode(mode)}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-xs)',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid',
                cursor: 'pointer',
                background: voiceMode === mode ? 'var(--accent-gold)' : 'transparent',
                borderColor: voiceMode === mode ? 'var(--accent-gold)' : 'var(--border-subtle)',
                color: voiceMode === mode ? 'var(--bg-abyss)' : 'var(--text-muted)',
                transition: 'all 0.15s',
              }}
            >
              {VOICE_LABELS[mode]}
            </button>
          ))}
        </div>
      </div>

      {/* Entries */}
      <div
        style={{ overflowY: 'auto', maxHeight: '320px' }}
        aria-live="polite"
        aria-label="Game chronicle"
      >
        {visibleEntries.length === 0 ? (
          <p
            style={{
              fontFamily: 'var(--font-prose)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-tertiary)',
              fontStyle: 'italic',
            }}
          >
            The world awaits...
          </p>
        ) : (
          visibleEntries.map(entry => (
            <ChronicleEntryCard key={entry.id} entry={entry} voiceMode={voiceMode} />
          ))
        )}
      </div>
    </div>
  );
}
