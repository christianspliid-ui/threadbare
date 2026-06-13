import type { ChronicleEntry } from '../../types/narrative';

export type ChronicleVoiceMode = 'interleaved' | 'poet' | 'witness';

interface ChronicleEntryCardProps {
  entry: ChronicleEntry;
  voiceMode: ChronicleVoiceMode;
}

export function ChronicleEntryCard({ entry, voiceMode }: ChronicleEntryCardProps) {
  const hasPoet = Boolean(entry.poetProse);
  const poetText = entry.poetProse ?? '';
  // Migration shim: legacy prose treated as witness voice when dual-voice fields absent
  const witnessBullets: string[] = entry.witnessFacts ?? (entry.prose ? [entry.prose] : []);

  const showPoet = (voiceMode === 'interleaved' || voiceMode === 'poet') && hasPoet;
  const showWitness = voiceMode === 'interleaved' || voiceMode === 'witness';

  if (!showPoet && !showWitness) return null;

  return (
    <div
      style={{
        borderLeft: '2px solid var(--border-gold)',
        paddingLeft: '12px',
        marginBottom: '16px',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-xs)',
          color: 'var(--accent-gold)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: '6px',
          opacity: 0.7,
        }}
      >
        t{entry.tick} · {entry.title}
        {entry.quintessenceDelta != null && (
          <span
            style={{
              marginLeft: '6px',
              color: entry.quintessenceDelta > 0
                ? 'var(--positive)'
                : entry.quintessenceDelta < 0
                  ? 'var(--negative)'
                  : 'var(--text-tertiary)',
            }}
          >
            {entry.quintessenceDelta > 0 ? '+' : ''}{entry.quintessenceDelta.toFixed(2)}Q
          </span>
        )}
      </div>

      {showPoet && poetText && (
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
            fontStyle: 'italic',
            lineHeight: 1.7,
            margin: '0 0 8px 0',
          }}
        >
          {poetText}
        </p>
      )}

      {showWitness && witnessBullets.length > 0 && (
        <ul
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-tertiary)',
            lineHeight: 1.6,
            margin: 0,
            padding: '0 0 0 14px',
          }}
        >
          {witnessBullets.map((fact, i) => (
            <li key={i}>{fact}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
